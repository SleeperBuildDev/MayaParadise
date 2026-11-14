// The notebook map: a parchment spread (portrait: the notebook turned so its spine runs across) that
// shows ONLY what Maya has seen, in gold ink, and the Bookmark Desks she has unlocked. No objective
// markers. Unseen land stays blank paper. Tap an unlocked desk to travel there (page-turn).
//
//   const seen = createSeen(save, persist)    seen.mark(x, z) every few frames; seen.has(x, z)
//   openMap(ctx)                              ctx: { game, seen, desks, net, onTravel(desk) }
import { tr } from '../../game/ui.js';
import { EXTENT, REGIONS, HOME, ITEMS, BRIDGE, ART as REG_ART } from './region.js';

const CELL = 4; // metres per seen cell
const COLS = Math.ceil((EXTENT.x1 - EXTENT.x0) / CELL), ROWS = Math.ceil((EXTENT.z1 - EXTENT.z0) / CELL);
const SEE_R = 18; // metres around Maya that count as seen

// ---------------------------------------------------------------------------------
// The seen mask (bits, saved as base64 in save.flags['map:seen']; save.flags['map:seenExt'] names the extent
// it was cut for: a mask saved for an older, smaller land is carried over cell by cell)
// ---------------------------------------------------------------------------------
const EXT_KEY = `${EXTENT.x0},${EXTENT.z0},${EXTENT.x1},${EXTENT.z1}`;
const LEGACY_EXT = '-80,-22,80,280'; // (the land before the district files: the Quarter and the envelope road)
export function createSeen(save, persist) {
  const bits = new Uint8Array(Math.ceil((COLS * ROWS) / 8));
  try {
    const s = save.flags['map:seen'];
    const ext = save.flags['map:seenExt'] || LEGACY_EXT;
    if (s && ext === EXT_KEY) { const bin = atob(s); for (let i = 0; i < Math.min(bin.length, bits.length); i++) bits[i] = bin.charCodeAt(i); }
    else if (s) {
      const [ox0, oz0, ox1, oz1] = ext.split(',').map(Number);
      const oc = Math.ceil((ox1 - ox0) / CELL), or = Math.ceil((oz1 - oz0) / CELL), bin = atob(s);
      for (let j = 0; j < or; j++) for (let i = 0; i < oc; i++) {
        const k = j * oc + i;
        if (!((bin.charCodeAt(k >> 3) >> (k & 7)) & 1)) continue;
        const ni = Math.floor((ox0 + (i + 0.5) * CELL - EXTENT.x0) / CELL), nj = Math.floor((oz0 + (j + 0.5) * CELL - EXTENT.z0) / CELL);
        if (ni < 0 || nj < 0 || ni >= COLS || nj >= ROWS) continue;
        const q = nj * COLS + ni;
        bits[q >> 3] |= 1 << (q & 7);
      }
      save.flags['map:seenExt'] = EXT_KEY;
      let out = '';
      for (let i = 0; i < bits.length; i++) out += String.fromCharCode(bits[i]);
      save.flags['map:seen'] = btoa(out);
    }
    if (!s) save.flags['map:seenExt'] = EXT_KEY;
  } catch { /* a bad string: start blank */ }
  let dirty = false, saveT = 0;
  const idx = (i, j) => j * COLS + i;
  const seen = {
    cols: COLS, rows: ROWS, cell: CELL,
    get(i, j) { const k = idx(i, j); return (bits[k >> 3] >> (k & 7)) & 1; },
    has(x, z) {
      const i = Math.floor((x - EXTENT.x0) / CELL), j = Math.floor((z - EXTENT.z0) / CELL);
      return i >= 0 && j >= 0 && i < COLS && j < ROWS && seen.get(i, j) === 1;
    },
    /** Marks the cells round (x, z); the camera looks north, so the circle leans north. */
    mark(x, z) {
      const cz = z - 8;
      const i0 = Math.max(0, Math.floor((x - SEE_R - EXTENT.x0) / CELL)), i1 = Math.min(COLS - 1, Math.floor((x + SEE_R - EXTENT.x0) / CELL));
      const j0 = Math.max(0, Math.floor((cz - SEE_R - EXTENT.z0) / CELL)), j1 = Math.min(ROWS - 1, Math.floor((cz + SEE_R - EXTENT.z0) / CELL));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const px = EXTENT.x0 + (i + 0.5) * CELL, pz = EXTENT.z0 + (j + 0.5) * CELL;
        if ((px - x) * (px - x) + (pz - cz) * (pz - cz) > SEE_R * SEE_R) continue;
        const k = idx(i, j);
        if (!((bits[k >> 3] >> (k & 7)) & 1)) { bits[k >> 3] |= 1 << (k & 7); dirty = true; }
      }
    },
    update(dt) {
      saveT -= dt;
      if (dirty && saveT <= 0) {
        saveT = 3;
        dirty = false;
        let bin = '';
        for (let i = 0; i < bits.length; i++) bin += String.fromCharCode(bits[i]);
        save.flags['map:seen'] = btoa(bin);
        save.flags['map:seenExt'] = EXT_KEY;
        persist();
      }
    },
    count() { let n = 0; for (let k = 0; k < COLS * ROWS; k++) n += (bits[k >> 3] >> (k & 7)) & 1; return n; },
  };
  return seen;
}

// ---------------------------------------------------------------------------------
// The map screen
// ---------------------------------------------------------------------------------
const INK = '#B8862E', INK_D = '#8C6A28', MAROON = '#6E1F2A', PAGE = '#F7F1E1', RULE = 'rgba(120,150,180,0.18)';

function injectStyle() {
  if (document.getElementById('story-map-style')) return;
  const s = document.createElement('style');
  s.id = 'story-map-style';
  s.textContent = `
  #story-map { position: absolute; inset: 0; z-index: 52; background: rgba(42,33,24,.45); display: flex; align-items: center; justify-content: center;
    padding: calc(10px + env(safe-area-inset-top)) 8px calc(10px + env(safe-area-inset-bottom)); animation: rcmapin .28s ease; }
  @keyframes rcmapin { from { opacity: 0; transform: scale(.96); } }
  #story-map .nb { position: relative; background: #6E1F2A; border-radius: 14px; padding: 8px; box-shadow: 0 14px 40px rgba(42,33,24,.45); max-height: 100%; display: flex; flex-direction: column; }
  #story-map .nb-head { display: flex; align-items: center; justify-content: space-between; color: #F6F0E2; font: 700 16px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; padding: 0 6px 6px; }
  #story-map .nb-head small { font-weight: 400; opacity: .85; font-size: 12px; margin-left: 8px; }
  #story-map .x { border: 0; background: none; color: #F6F0E2; font-size: 22px; width: 40px; height: 40px; cursor: pointer; }
  #story-map canvas { display: block; border-radius: 6px; touch-action: none; }
  #story-map .nb-foot { color: #F2DFAE; font: 12px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; padding: 6px 6px 0; text-align: center; }
  #story-map .ask { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(84%, 320px); background: #FFFDF8; border: 3px solid #C9A24A; border-radius: 18px;
    padding: 14px 16px; text-align: center; font: 15px/1.7 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; box-shadow: 0 10px 30px rgba(42,33,24,.35); }
  #story-map .ask b { display: block; color: #6E1F2A; font-size: 16px; }
  #story-map .ask .row { display: flex; gap: 10px; justify-content: center; margin-top: 10px; }
  #story-map .ask button { font: 700 14px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; padding: 8px 16px; border-radius: 999px; border: 2px solid #A47A2C; background: #F6F0E2; color: #6E1F2A; cursor: pointer; }
  #story-map .ask button.go { background: #6E1F2A; color: #FFFDF8; border-color: #6E1F2A; }
  #story-pageturn { position: absolute; inset: 0; z-index: 60; pointer-events: none; perspective: 1400px; overflow: hidden; }
  #story-pageturn .leaf { position: absolute; inset: 0; background: linear-gradient(90deg, #EFE6D0 0%, #F7F1E1 12%, #FBF7EC 70%, #EDE3CB 100%); transform-origin: 0 50%;
    box-shadow: -18px 0 40px rgba(59,42,26,.25); background-image: repeating-linear-gradient(transparent 0 33px, rgba(120,150,180,.22) 33px 34px); }
  #story-pageturn .leaf::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,0,0,.08), transparent 18%); }
  `;
  document.head.appendChild(s);
}

/** Opens the map; resolves when it closes. */
export function openMap({ game, seen, desks, net, places = [], onTravel }) {
  if (document.getElementById('story-map')) return;
  injectStyle();
  call(game.audio, 'play', 'page');
  const wrap = document.createElement('div');
  wrap.id = 'story-map';
  wrap.innerHTML = `<div class="nb"><div class="nb-head"><span>${tr({ my: 'မာရာ့ မှတ်စုစာအုပ် မြေပုံ', en: "Maya's notebook map" })}</span><button type="button" class="x" aria-label="close">✕</button></div><canvas></canvas><div class="nb-foot"></div></div>`;
  wrap.querySelector('.nb-foot').textContent = tr({ my: 'ရွှေမင်နဲ့ ရေးထားတာ ကိုယ်တိုင် မြင်ဖူးတဲ့ နေရာတွေပဲ။ ဖဲကြိုးလေးကို နှိပ်ရင် အဲဒီစာမျက်နှာကို လှန်လို့ရတယ်။', en: 'Only places she has seen are inked in gold. Tap a ribbon to turn to that page.' });
  document.getElementById('game').appendChild(wrap);
  const canvas = wrap.querySelector('canvas');

  // the page shows what she knows: the box round every seen cell (and her, and the desks), with a margin,
  // so early on the map is a close, readable page that widens as she travels
  const me0 = game.story?.foot?.active ? game.maya.root.position : game.car.root.position;
  let bx0 = me0.x, bz0 = me0.z, bx1 = me0.x, bz1 = me0.z;
  for (let j = 0; j < seen.rows; j++) for (let i = 0; i < seen.cols; i++) {
    if (!seen.get(i, j)) continue;
    const x = EXTENT.x0 + i * CELL, z = EXTENT.z0 + j * CELL;
    bx0 = Math.min(bx0, x); bz0 = Math.min(bz0, z); bx1 = Math.max(bx1, x + CELL); bz1 = Math.max(bz1, z + CELL);
  }
  for (const d of desks.list) if (d.unlocked) { bx0 = Math.min(bx0, d.x); bz0 = Math.min(bz0, d.z); bx1 = Math.max(bx1, d.x); bz1 = Math.max(bz1, d.z); }
  const availW = Math.min(window.innerWidth - 32, 520), availH = window.innerHeight - 150;
  const aspect = availW / availH;
  let vw = Math.max(bx1 - bx0 + 24, 90), vh = Math.max(bz1 - bz0 + 24, 110);
  // a tall narrow trail widens a little toward the screen's shape (never more than 40 %), so the page is
  // not a sliver; a wide area just makes a shorter page (no blank paper added below)
  if (vw / vh < aspect) vw = Math.min(vh * aspect, vw * 1.4);
  vw = Math.min(vw, EXTENT.x1 - EXTENT.x0); vh = Math.min(vh, EXTENT.z1 - EXTENT.z0);
  const cx0 = (bx0 + bx1) / 2, cz0 = (bz0 + bz1) / 2;
  const V = {
    x0: Math.min(Math.max(cx0 - vw / 2, EXTENT.x0), EXTENT.x1 - vw),
    z0: Math.min(Math.max(cz0 - vh / 2, EXTENT.z0), EXTENT.z1 - vh),
  };
  const W = vw, H = vh;
  const k = Math.min(availW / W, availH / H);
  const cw = Math.round(W * k), ch = Math.round(H * k);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = cw * dpr; canvas.height = ch * dpr;
  canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
  const X = (x) => (x - V.x0) * k, Y = (z) => (z - V.z0) * k;
  const g = canvas.getContext('2d');
  g.scale(dpr, dpr);

  // ---- the page itself: paper, faint rules, the spine across the middle
  g.fillStyle = PAGE; g.fillRect(0, 0, cw, ch);
  g.strokeStyle = RULE; g.lineWidth = 1;
  for (let y = 14; y < ch; y += 14) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(cw, y + 0.5); g.stroke(); }
  g.strokeStyle = 'rgba(214,120,110,.35)'; g.beginPath(); g.moveTo(22.5, 0); g.lineTo(22.5, ch); g.stroke();

  // ---- the gold ink (drawn on its own layer, then kept only where Maya has been)
  const ink = document.createElement('canvas'); ink.width = canvas.width; ink.height = canvas.height;
  const q = ink.getContext('2d'); q.scale(dpr, dpr);
  q.lineCap = 'round'; q.lineJoin = 'round';
  // land outlines and a light wash
  for (const r of [HOME, ...REGIONS]) {
    const [x0, z0, x1, z1] = r.rect;
    q.fillStyle = r === HOME ? 'rgba(201,162,74,.20)' : 'rgba(201,162,74,.10)';
    q.fillRect(X(x0), Y(z0), (x1 - x0) * k, (z1 - z0) * k);
    q.strokeStyle = INK_D; q.lineWidth = 1.4; q.strokeRect(X(x0), Y(z0), (x1 - x0) * k, (z1 - z0) * k);
  }
  // holes in the paper (the Fold's cloud-stream): no wash, a wavy line of cloud down the middle
  for (const r of REGIONS) for (const [x0, z0, x1, z1] of r.holes || []) {
    q.clearRect(X(x0), Y(z0), (x1 - x0) * k, (z1 - z0) * k);
    q.strokeStyle = INK_D; q.lineWidth = 1.4;
    q.beginPath(); q.moveTo(X(x0), Y(z0)); q.lineTo(X(x0), Y(z1)); q.moveTo(X(x1), Y(z0)); q.lineTo(X(x1), Y(z1)); q.stroke();
    q.strokeStyle = 'rgba(140,106,40,.45)'; q.lineWidth = 1;
    for (let z = z0 + 6; z < z1 - 3; z += 12) { q.beginPath(); q.arc(X((x0 + x1) / 2 - 3), Y(z), 2.2 * k, Math.PI, 0); q.arc(X((x0 + x1) / 2 + 1.5), Y(z), 1.6 * k, Math.PI, 0); q.stroke(); }
  }
  // the bridge, as a ribbon
  q.strokeStyle = MAROON; q.lineWidth = Math.max(3, BRIDGE.deck * k);
  q.beginPath(); BRIDGE.pts.forEach(([x, z], i) => (i ? q.lineTo(X(x), Y(z)) : q.moveTo(X(x), Y(z)))); q.stroke();
  // roads
  q.strokeStyle = INK; q.lineWidth = Math.max(1.6, 2.4 * k);
  for (const e of net.edges) {
    const closed = e.gate && net.isOpen && !net.isOpen(e);
    if (closed && e.look === 'hidden') continue; // (a road that is not there yet)
    q.setLineDash(closed || e.style === 'pencil' ? [3, 4] : []);
    q.beginPath();
    for (let i = 0; i < e.n; i += 4) (i ? q.lineTo(X(e.xs[i]), Y(e.zs[i])) : q.moveTo(X(e.xs[i]), Y(e.zs[i])));
    q.lineTo(X(e.xs[e.n - 1]), Y(e.zs[e.n - 1]));
    q.stroke();
  }
  q.setLineDash([]);
  // the book's own buildings
  q.fillStyle = 'rgba(184,134,46,.45)'; q.strokeStyle = INK_D; q.lineWidth = 1;
  for (const p of places) { const c = p.center; q.fillRect(X(c.x) - 3.5 * k, Y(c.z) - 2.5 * k, 7 * k, 5 * k); q.strokeRect(X(c.x) - 3.5 * k, Y(c.z) - 2.5 * k, 7 * k, 5 * k); }
  // buildings and trees of the open world
  for (const it of ITEMS) {
    if (it.w && it.d && (['house', 'school', 'snack', 'potter', 'stage'].includes(it.k) || REG_ART[it.k]?.map)) {
      q.fillStyle = it.k === 'house' ? 'rgba(184,134,46,.35)' : 'rgba(110,31,42,.30)';
      q.fillRect(X(it.x - it.w / 2), Y(it.z - it.d / 2), it.w * k, it.d * k);
      q.strokeRect(X(it.x - it.w / 2), Y(it.z - it.d / 2), it.w * k, it.d * k);
    } else if (it.k === 'padauk' || it.k === 'rain') {
      q.fillStyle = it.k === 'padauk' ? 'rgba(226,170,60,.75)' : 'rgba(111,158,91,.6)';
      q.beginPath(); q.arc(X(it.x), Y(it.z), Math.max(1.4, 1.1 * k), 0, Math.PI * 2); q.fill();
    }
  }
  // keep only what has been seen (soft edges)
  const mask = document.createElement('canvas'); mask.width = canvas.width; mask.height = canvas.height;
  const m = mask.getContext('2d'); m.scale(dpr, dpr);
  const rad = CELL * k * 1.1;
  for (let j = 0; j < seen.rows; j++) for (let i = 0; i < seen.cols; i++) {
    if (!seen.get(i, j)) continue;
    const cx = X(EXTENT.x0 + (i + 0.5) * CELL), cy = Y(EXTENT.z0 + (j + 0.5) * CELL);
    const grd = m.createRadialGradient(cx, cy, 0, cx, cy, rad);
    grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(0.6, 'rgba(0,0,0,.9)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = grd; m.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }
  q.setTransform(1, 0, 0, 1, 0, 0);
  q.globalCompositeOperation = 'destination-in';
  q.drawImage(mask, 0, 0);
  g.drawImage(ink, 0, 0, cw, ch);

  // names in maroon ink, for every land she has set foot in (written at its label spot, not masked)
  g.fillStyle = MAROON; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '700 13px "Noto Sans Myanmar", sans-serif';
  for (const r of [HOME, ...REGIONS]) {
    const [x0, z0, x1, z1] = r.rect;
    let any = false;
    for (let z = z0; z < z1 && !any; z += CELL) for (let x = x0; x < x1 && !any; x += CELL) any = seen.has(x + CELL / 2, z + CELL / 2);
    if (!any) continue;
    const [lx, lz] = r.label || [(x0 + x1) / 2, z0 + 6];
    const text = tr(r.name), tw = g.measureText(text).width;
    const tx = Math.min(Math.max(X(lx), tw / 2 + 28), cw - tw / 2 - 6), ty = Math.min(Math.max(Y(lz), 14), ch - 14);
    g.fillStyle = 'rgba(247,241,225,.8)'; g.fillRect(tx - tw / 2 - 3, ty - 10, tw + 6, 20);
    g.fillStyle = MAROON; g.fillText(text, tx, ty);
  }

  // the spine: a soft shadow across the middle of the spread
  const sy = ch / 2;
  const sg = g.createLinearGradient(0, sy - 12, 0, sy + 12);
  sg.addColorStop(0, 'rgba(90,67,32,0)'); sg.addColorStop(0.5, 'rgba(90,67,32,.22)'); sg.addColorStop(1, 'rgba(90,67,32,0)');
  g.fillStyle = sg; g.fillRect(0, sy - 12, cw, 24);

  // ---- unlocked desks (ribbons), and where Maya is now
  const hits = [];
  g.textAlign = 'left'; g.textBaseline = 'middle';
  for (const d of desks.list) {
    if (!d.unlocked) continue;
    const x = X(d.foot.x), y = Y(d.foot.z);
    g.fillStyle = MAROON;
    g.fillRect(x - 4, y - 16, 8, 16);
    g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x, y - 4); g.lineTo(x + 4, y); g.lineTo(x + 4, y + 6); g.lineTo(x, y + 2); g.lineTo(x - 4, y + 6); g.closePath(); g.fill();
    g.fillStyle = '#C9A24A'; g.fillRect(x - 1, y - 14, 2, 12);
    g.font = '700 11px "Noto Sans Myanmar", sans-serif';
    g.fillStyle = MAROON;
    const label = tr(d.name);
    const lw = g.measureText(label).width;
    const lx = x + 8 + lw > cw - 4 ? x - 8 - lw : x + 8;
    g.fillStyle = 'rgba(247,241,225,.85)'; g.fillRect(lx - 2, y - 17, lw + 4, 16);
    g.fillStyle = MAROON; g.fillText(label, lx, y - 9);
    hits.push({ d, x, y: y - 6, r: 22 });
  }
  const me = game.story?.foot?.active ? game.maya.root.position : game.car.root.position;
  g.fillStyle = '#FFFDF8'; g.strokeStyle = MAROON; g.lineWidth = 2;
  g.beginPath(); g.arc(X(me.x), Y(me.z), 5, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = MAROON; g.beginPath(); g.arc(X(me.x), Y(me.z), 2, 0, Math.PI * 2); g.fill();

  // ---- interaction
  const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') { e.stopPropagation(); close(); } };
  document.addEventListener('keydown', onKey);
  wrap.querySelector('.x').addEventListener('click', (e) => { e.stopPropagation(); close(); });
  wrap.addEventListener('click', (e) => { e.stopPropagation(); if (e.target === wrap) close(); });
  wrap.addEventListener('pointerdown', (e) => e.stopPropagation());
  canvas.addEventListener('click', (e) => {
    e.stopPropagation();
    if (wrap.querySelector('.ask')) return;
    const b = canvas.getBoundingClientRect();
    const px = e.clientX - b.left, py = e.clientY - b.top;
    const hit = hits.find((h) => Math.hypot(h.x - px, h.y - py) < h.r);
    if (!hit) return;
    call(game.audio, 'play', 'click');
    const ask = document.createElement('div');
    ask.className = 'ask';
    ask.innerHTML = '<b></b><span></span><div class="row"><button type="button" class="go"></button><button type="button" class="no"></button></div>';
    ask.querySelector('b').textContent = tr(hit.d.name);
    ask.querySelector('span').textContent = tr({ my: 'ဒီစာမျက်နှာကို လှန်မလား', en: 'Turn to this page?' });
    ask.querySelector('.go').textContent = tr({ my: 'လှန်မယ်', en: 'Turn' });
    ask.querySelector('.no').textContent = tr({ my: 'မလှန်တော့ဘူး', en: 'Not now' });
    ask.querySelector('.no').addEventListener('click', (ev) => { ev.stopPropagation(); ask.remove(); });
    ask.querySelector('.go').addEventListener('click', (ev) => { ev.stopPropagation(); close(); onTravel?.(hit.d); });
    wrap.querySelector('.nb').appendChild(ask);
  });
  // story layers drawn over the page (api.js: the Painted Map's strokes and the quill rub-out)
  try { game.story?.mapOverlay?.({ wrap, canvas, X, Y, k, cw, ch, close }); } catch (e) { console.error('map overlay', e); }
  return { close };
}

/** A page turns over the screen; `during` runs while the page covers everything. */
export async function pageTurn(game, during) {
  injectStyle();
  const el = document.createElement('div');
  el.id = 'story-pageturn';
  el.innerHTML = '<div class="leaf"></div>';
  document.getElementById('game').appendChild(el);
  const leaf = el.firstChild;
  call(game.audio, 'play', 'page');
  const a1 = leaf.animate([{ transform: 'translateX(100%) rotateY(-70deg)', opacity: 0.6 }, { transform: 'translateX(0) rotateY(0deg)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.4,.1,.3,1)', fill: 'forwards' });
  await a1.finished.catch(() => {});
  try { await during(); } catch (e) { console.error('page turn', e); }
  await new Promise((r) => setTimeout(r, 120));
  leaf.style.transformOrigin = '0 50%';
  const a2 = leaf.animate([{ transform: 'rotateY(0deg)', opacity: 1 }, { transform: 'rotateY(-95deg)', opacity: 0.2 }], { duration: 520, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' });
  await a2.finished.catch(() => {});
  el.remove();
}

function call(o, fn, ...a) { return o && typeof o[fn] === 'function' ? o[fn](...a) : undefined; }
