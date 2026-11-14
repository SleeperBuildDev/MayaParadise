// The reply page, in the player's hands (Day 15, 8.9): render it to a PNG they can keep. Nothing is uploaded.
//
//   const r = await keepsake({ title?, hint?, page: { title, lines: [{ my, en, struck? }], last: line | string | null,
//                              stamps: [1..23, 'reply'], credits: [{ line, who }], signed? }, filename? })
//   r = { saved: boolean, shared: boolean }        (cancel / Close: { saved: false })
//
// Look: the page as a picture on the card (Maya's paper, her ink lines, a struck line crossed out in
// pencil, the player's last line in their own pencil or the ruled line left empty, the margin of stamps
// with the final wax seal, a small ✱ and the speaker's name beside each borrowed line); two buttons:
// keep this page (navigator.share with the file where the phone offers it, else a download
// `reality-check-reply.png`) and close. The picture is 1080 × 1350 (a phone-friendly portrait).
//   credits: [{ line: index into lines (or 'last'), who: { my, en } | string }]
//
// Also exported: renderKeepsake(page) -> Promise<canvas>, keepsakeBlob(page) -> Promise<Blob>
// Test hook: window.__act.autoKeepsake({ save = false } = {})
import { openAct, bi, wait, buzz, myNum } from './kit.js';
import { tr, lang } from '../../game/ui.js';

const T = {
  title: { my: 'ပြန်စာ — ကိုယ့်လက်ထဲမှာ', en: 'The reply, in your hands' },
  hint: { my: 'ဒီစာမျက်နှာကို သိမ်းထားလို့ ရပါတယ်', en: 'You can keep this page' },
  keep: { my: 'ဒီစာမျက်နှာ သိမ်းမယ်', en: 'Keep this page' },
  close: { my: 'ပိတ်မယ်', en: 'Close' },
  kept: { my: 'သိမ်းပြီးပါပြီ', en: 'Kept' },
  foot: 'Reality Check',
};
const W = 1080, H = 1350;
const MY = '"Noto Sans Myanmar", "Myanmar Text", system-ui, sans-serif';

export async function renderKeepsake(page = {}) {
  try { await document.fonts?.ready; await document.fonts?.load?.(`700 40px ${MY}`, 'မာရာ'); } catch { /* fonts as they are */ }
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const en = lang() === 'en';
  const main = (o) => (o == null ? '' : typeof o === 'string' ? o : (en ? o.en : o.my) || o.my || o.en || '');
  const other = (o) => (o == null || typeof o === 'string' ? '' : (en ? o.my : o.en) || '');
  let seed = 23;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // ---- paper: cream, fibres, a soft warm edge
  g.fillStyle = '#FBF4E3'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(150,120,80,.05)' : 'rgba(255,255,255,.35)'; g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1); }
  g.strokeStyle = 'rgba(150,120,80,.06)'; g.lineWidth = 1;
  for (let i = 0; i < 70; i++) { const x = rnd() * W, y = rnd() * H; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y + rnd() * 8, x + 20 + rnd() * 20, y + rnd() * 6); g.stroke(); }
  const edge = g.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.78);
  edge.addColorStop(0, 'rgba(214,180,120,0)'); edge.addColorStop(1, 'rgba(190,150,90,.28)');
  g.fillStyle = edge; g.fillRect(0, 0, W, H);

  // ---- the margin of stamps (two columns) and the margin line
  const mX = 196;
  g.strokeStyle = 'rgba(214,120,110,.75)'; g.lineWidth = 3; g.beginPath(); g.moveTo(mX, 0); g.lineTo(mX, H); g.stroke();
  const stamps = (page.stamps || []).filter((s) => s !== 'reply');
  const inks = ['#7A2430', '#A47A2C', '#3F6E78', '#6E4A7A'];
  stamps.forEach((s, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const cx = 56 + col * 84 + (row % 2 ? 6 : -4), cy = 120 + row * 94;
    if (cy > H - 210) return;
    stamp(g, cx, cy, 34, inks[i % inks.length], typeof s === 'number' ? myNumLang(s, en) : String(s), (rnd() - 0.5) * 0.5, rnd);
  });

  // ---- heading: title, a gold four-point sparkle, a ruled band
  const x0 = mX + 46, x1 = W - 70;
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  g.fillStyle = '#6E1F2A'; g.font = `700 56px ${MY}`;
  g.fillText(main(page.title) || main({ my: 'ပြန်စာ', en: 'The reply' }), x0, 140);
  const sub = other(page.title);
  if (sub) { g.fillStyle = '#A4806A'; g.font = '600 26px Georgia, serif'; g.fillText(sub, x0, 182); }
  sparkle(g, x1 - 26, 112, 26, '#C9A24A');
  sparkle(g, x1 - 70, 150, 12, '#C9A24A');
  g.strokeStyle = '#C9A24A'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, 214); g.lineTo(x1, 214); g.stroke();
  g.lineWidth = 1; g.beginPath(); g.moveTo(x0, 222); g.lineTo(x1, 222); g.stroke();

  // ---- ruled lines and Maya's ink
  const lines = page.lines || [];
  const credits = page.credits || [];
  const creditFor = (k) => credits.find((c) => c.line === k);
  const lineH = 104;
  let y = 300;
  g.strokeStyle = 'rgba(160,140,110,.35)'; g.lineWidth = 2;
  for (let yy = y + 18; yy < H - 120; yy += lineH) { g.beginPath(); g.moveTo(mX + 12, yy); g.lineTo(W - 50, yy); g.stroke(); }
  const maxW = x1 - x0 - 40;
  lines.forEach((l, k) => {
    if (y > H - 300) return;
    const text = main(l);
    g.font = `500 38px ${MY}`;
    const rows = wrap(g, text, maxW);
    rows.forEach((r, j) => { g.fillStyle = l.struck ? '#8A7A6A' : '#3B2A1E'; g.fillText(r, x0, y + j * 52); });
    const lastW = g.measureText(rows[rows.length - 1] || '').width;
    if (l.struck) { // crossed out in pencil
      g.strokeStyle = 'rgba(68,66,76,.85)'; g.lineWidth = 3.4; g.lineCap = 'round';
      rows.forEach((r, j) => { const w = g.measureText(r).width; g.beginPath(); g.moveTo(x0 - 6, y + j * 52 - 12); g.quadraticCurveTo(x0 + w / 2, y + j * 52 - 18, x0 + w + 8, y + j * 52 - 10); g.stroke(); });
    }
    const cr = creditFor(k);
    if (cr) {
      g.fillStyle = '#A47A2C'; g.font = `700 30px ${MY}`;
      g.fillText('✱', x0 + Math.min(lastW, maxW) + 10, y + (rows.length - 1) * 52 - 14);
    }
    const o = other(l);
    let yo = y + (rows.length - 1) * 52 + 34;
    let nameW = 0;
    if (cr) { // the margin name: big enough to read in the saved 1080 px picture
      g.font = `700 30px ${MY}`; nameW = g.measureText(`✱ ${main(cr.who)}`).width;
      g.fillStyle = '#A47A2C'; g.textAlign = 'right'; g.fillText(`✱ ${main(cr.who)}`, x1, yo + 2); g.textAlign = 'left';
    }
    if (o) {
      g.font = `${l.struck ? '' : 'italic '}26px Georgia, serif`;
      const ow = Math.min(g.measureText(o).width, maxW - nameW - 24);
      g.fillStyle = l.struck ? '#8A7A6A' : '#7A6450'; g.fillText(o, x0 + 2, yo, maxW - nameW - 24);
      if (l.struck) { // the English is struck too, so the saved picture says plainly the whole line was crossed out
        g.strokeStyle = 'rgba(68,66,76,.8)'; g.lineWidth = 2.6; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x0 - 4, yo - 8); g.quadraticCurveTo(x0 + ow / 2, yo - 12, x0 + ow + 8, yo - 7); g.stroke();
      }
    }
    y += Math.max(lineH, rows.length * 52 + 52);
  });

  // ---- the player's own last line, in pencil (or the ruled line left empty)
  y = Math.max(y, 300);
  const last = page.last;
  const lastText = last == null ? '' : typeof last === 'string' ? last : main(last);
  g.save();
  if (lastText) {
    g.translate(x0, y);
    g.transform(1, 0, -0.12, 1, 0, 0);
    g.fillStyle = '#4A4850'; g.font = `400 40px ${MY}`;
    const rows = wrap(g, lastText, maxW);
    rows.forEach((r, j) => { g.globalAlpha = 0.92; g.fillText(r, 0, j * 54); g.globalAlpha = 0.25; g.fillText(r, 1.2, j * 54 + 0.8); });
    g.globalAlpha = 1;
    const o = typeof last === 'object' ? other(last) : '';
    if (o && o !== lastText) { g.fillStyle = '#7C7A86'; g.font = 'italic 24px Georgia, serif'; g.fillText(o, 2, (rows.length - 1) * 54 + 36); }
    // a soft pencil flourish under it
    g.strokeStyle = 'rgba(74,72,80,.7)'; g.lineWidth = 2.6; g.lineCap = 'round';
    const fy = (rows.length - 1) * 54 + 60;
    g.beginPath(); g.moveTo(0, fy); g.bezierCurveTo(120, fy + 14, 240, fy + 8, 320, fy - 4); g.bezierCurveTo(380, fy - 12, 360, fy + 10, 420, fy + 4); g.stroke();
  } else {
    g.strokeStyle = 'rgba(110,31,42,.35)'; g.lineWidth = 2.4; g.setLineDash([2, 10]); g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y + 18); g.lineTo(x1, y + 18); g.stroke(); g.setLineDash([]);
  }
  g.restore();

  // ---- the final seal: maroon wax with a gold sparkle
  if ((page.stamps || []).includes('reply') || page.sealed) waxSeal(g, W - 170, H - 190, 74, rnd);
  // ---- signature and footer
  if (page.signed !== false) { g.fillStyle = '#6E1F2A'; g.font = `700 34px ${MY}`; g.textAlign = 'right'; g.fillText(en ? '— Maya' : '— မာရာ', W - 280, H - 168); g.textAlign = 'left'; }
  g.fillStyle = 'rgba(122,100,80,.7)'; g.font = '600 20px Georgia, serif'; g.textAlign = 'center';
  g.fillText(T.foot, W / 2 + mX / 2, H - 46);
  g.textAlign = 'left';
  return cv;
}

export async function keepsakeBlob(page) {
  const cv = await renderKeepsake(page);
  return new Promise((r) => cv.toBlob((b) => r(b), 'image/png'));
}

export function keepsake({ title = T.title, hint = T.hint, page = {}, filename = 'reality-check-reply.png' } = {}) {
  return new Promise((resolve) => {
    let saved = false, shared = false;
    const A = openAct({ title, hint, kind: 'keep', resolve, onCancel: () => ({ saved, shared }) });
    injectKeepStyle();
    A.body.innerHTML = `<div class="ks-frame"><div class="ks-spin"></div><img class="ks-img" alt="" hidden></div>
      <div class="ks-actions"><button type="button" class="ak-btn ks-keep ak-bi" disabled></button><button type="button" class="ks-close ak-bi"></button></div>`;
    const img = A.body.querySelector('.ks-img');
    const keepBtn = A.body.querySelector('.ks-keep');
    const closeBtn = A.body.querySelector('.ks-close');
    bi(keepBtn, T.keep); bi(closeBtn, T.close);
    let blob = null, url = null;
    const ready = renderKeepsake(page).then((cv) => new Promise((r) => cv.toBlob((b) => r(b), 'image/png'))).then((b) => {
      blob = b;
      url = URL.createObjectURL(b);
      img.src = url;
      img.hidden = false;
      A.body.querySelector('.ks-spin').remove();
      keepBtn.disabled = false;
    });
    async function keep() {
      if (!blob) return;
      try {
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: tr(page.title) || 'Reality Check' });
          shared = true; saved = true;
        } else {
          const a = document.createElement('a');
          a.href = url; a.download = filename;
          document.body.appendChild(a); a.click(); a.remove();
          saved = true;
        }
      } catch { /* the share sheet was closed: not kept */ }
      if (saved) { bi(keepBtn, T.kept); keepBtn.classList.add('kept'); buzz(16); }
    }
    keepBtn.addEventListener('click', keep);
    closeBtn.addEventListener('click', () => { const r = { saved, shared }; setTimeout(() => url && URL.revokeObjectURL(url), 2000); A.done(r); });

    A.wrap.autoKeepsake = async ({ save = false } = {}) => {
      await ready;
      await wait(900);
      if (save) await keep();
      closeBtn.click();
    };
    A.wrap.ready = ready;
    window.__act = A.wrap;
  });
}

// ---- drawing helpers
function myNumLang(n, en) { return en ? String(n) : myNum(n).replace(/\d/g, (d) => '၀၁၂၃၄၅၆၇၈၉'[d]); }
function wrap(g, text, maxW) {
  if (!text) return [''];
  const words = text.split(/(\s+)/);
  const rows = [];
  let cur = '';
  for (const w of words) {
    const t = cur + w;
    if (g.measureText(t).width <= maxW || !cur.trim()) { cur = t; continue; }
    rows.push(cur.trim()); cur = w.trimStart();
  }
  if (cur.trim()) rows.push(cur.trim());
  // a single run too long for the line (no spaces): break by graphemes
  const out = [];
  for (const r of rows) {
    if (g.measureText(r).width <= maxW) { out.push(r); continue; }
    let seg; try { seg = Array.from(new Intl.Segmenter('my', { granularity: 'grapheme' }).segment(r), (x) => x.segment); } catch { seg = Array.from(r); }
    let c = '';
    for (const ch of seg) { if (g.measureText(c + ch).width > maxW && c) { out.push(c); c = ch; } else c += ch; }
    if (c) out.push(c);
  }
  return out;
}
function stamp(g, x, y, r, ink, label, rot, rnd) {
  g.save();
  g.translate(x, y); g.rotate(rot);
  g.globalAlpha = 0.86;
  g.strokeStyle = ink; g.fillStyle = ink;
  g.lineWidth = 4; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke();
  g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0, r - 7, 0, 7); g.stroke();
  // little ticks round the ring, like a postmark
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.beginPath(); g.moveTo(Math.cos(a) * (r - 7), Math.sin(a) * (r - 7)); g.lineTo(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3)); g.stroke(); }
  g.font = `800 ${label.length > 1 ? 26 : 30}px ${MY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(label, 0, 2);
  // ink gaps: the stamp was pressed by hand
  g.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 9; k++) { g.beginPath(); g.arc((rnd() - 0.5) * r * 2, (rnd() - 0.5) * r * 2, 1 + rnd() * 2.6, 0, 7); g.fill(); }
  g.restore();
}
function sparkle(g, x, y, r, c) {
  g.save(); g.translate(x, y); g.fillStyle = c;
  g.beginPath();
  g.moveTo(0, -r); g.quadraticCurveTo(r * 0.12, -r * 0.12, r, 0); g.quadraticCurveTo(r * 0.12, r * 0.12, 0, r);
  g.quadraticCurveTo(-r * 0.12, r * 0.12, -r, 0); g.quadraticCurveTo(-r * 0.12, -r * 0.12, 0, -r);
  g.fill(); g.restore();
}
function waxSeal(g, x, y, r, rnd) {
  g.save(); g.translate(x, y); g.rotate(-0.12);
  g.fillStyle = 'rgba(60,20,20,.25)'; g.beginPath(); g.arc(5, 8, r + 6, 0, 7); g.fill();
  g.fillStyle = '#7A1F2A';
  g.beginPath();
  for (let k = 0; k <= 28; k++) { const a = k / 28 * Math.PI * 2; const rr = r + 6 + Math.sin(k * 2.3) * 3 + rnd() * 4; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  g.closePath(); g.fill();
  const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, 4, 0, 0, r);
  gr.addColorStop(0, '#A8323E'); gr.addColorStop(1, '#6A1A24');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r - 6, 0, 7); g.fill();
  g.strokeStyle = 'rgba(40,10,14,.5)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, r - 16, 0, 7); g.stroke();
  sparkle(g, 0, 0, r * 0.46, '#E3C26E');
  sparkle(g, r * 0.36, -r * 0.34, r * 0.13, '#E3C26E');
  g.restore();
}

function injectKeepStyle() {
  if (document.getElementById('act-keep-style')) return;
  const s = document.createElement('style');
  s.id = 'act-keep-style';
  s.textContent = `
  .ak-keep .ak-sub { letter-spacing: 0 !important; word-spacing: 0; font-kerning: normal; text-rendering: geometricPrecision; }
  .ak-keep .act-card { width: min(100%, 440px); }
  .ks-frame { position: relative; display: grid; place-items: center; min-height: 240px; margin: 0 auto 12px; width: min(100%, 330px); aspect-ratio: 4 / 5; border-radius: 6px;
    background: #EDE3CC; box-shadow: 0 10px 24px rgba(59,42,26,.25), 0 0 0 1px #E2D5B8; overflow: hidden; transform: rotate(-1deg); }
  .ks-img { width: 100%; height: 100%; object-fit: contain; display: block; animation: ksin .6s cubic-bezier(.2,1.2,.4,1) both; }
  .ks-spin { width: 34px; height: 34px; border-radius: 50%; border: 4px solid #E2D5B8; border-top-color: #C9A24A; animation: ksspin 1s linear infinite; }
  .ks-actions { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ks-keep:disabled { opacity: .5; }
  .ks-keep.kept { background: #F1F6EA; border-color: #4F7F43; color: #4F7F43; box-shadow: 0 3px 0 #A9C49A; }
  .ks-close { font: 600 13px/1.5 "Noto Sans Myanmar", system-ui; color: #8C7A66; background: none; border: 0; cursor: pointer; padding: 4px 10px; }
  .ks-close .ak-sub { font-size: 10px; }
  @keyframes ksin { from { opacity: 0; transform: scale(.96); } }
  @keyframes ksspin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(s);
}
