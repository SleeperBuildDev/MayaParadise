// Wall art for the generic rooms, painted on the room's atlas: calendars, a clock face, framed pictures (drawn,
// never photos), shop signs, menu boards, a Burmese alphabet chart, a timetable, a hand-drawn town map,
// an embroidered saying, a certificate. Every Burmese string is a DRAFT for Maya to proofread (DRAFT(my)).
// Nothing religious: no holy images, no shrine things, no pagodas on the calendars.
import { txt, rr, paperBg, scribble, rand, mm, hatch, pencilLine, FONT_SERIF } from './generic-stage.js';

const INK = '#2A2118', MAROON = '#6E1F2A', GOLD = '#C9A24A';
// DRAFT(my): month names (the everyday calendar ones)
export const MONTHS = ['တန်ခူး', 'ကဆုန်', 'နယုန်', 'တော်သလင်း', 'သီတင်းကျွတ်', 'တန်ဆောင်မုန်း', 'နတ်တော်', 'ပြာသို', 'တပို့တွဲ', 'တပေါင်း'];

/** A wall calendar: a picture on top (hills, flowers, a boat, a tree, a kite), the month, a grid of days. */
export function calendar(g, w, h, { month = 'တော်သလင်း', pic = 'hills', mark = 12, seed = 4 } = {}) {
  paperBg(g, w, h, '#FBF6EA', seed);
  const ph = h * 0.46;
  const sky = g.createLinearGradient(0, 0, 0, ph);
  sky.addColorStop(0, '#9CC3DE'); sky.addColorStop(1, '#F3E3C2');
  g.fillStyle = sky; g.fillRect(6, 6, w - 12, ph);
  const r = rand(seed);
  if (pic === 'hills') {
    g.fillStyle = '#7FA383'; g.beginPath(); g.moveTo(6, ph + 6); g.quadraticCurveTo(w * 0.3, ph * 0.3, w * 0.6, ph * 0.8); g.quadraticCurveTo(w * 0.8, ph * 0.5, w - 6, ph * 0.7); g.lineTo(w - 6, ph + 6); g.fill();
    g.fillStyle = '#4F6F55'; g.beginPath(); g.moveTo(6, ph + 6); g.quadraticCurveTo(w * 0.5, ph * 0.6, w - 6, ph + 6); g.fill();
  } else if (pic === 'flowers') {
    g.fillStyle = '#8DBA6E'; g.fillRect(6, ph * 0.7, w - 12, ph * 0.3 + 6);
    for (let i = 0; i < 9; i++) { g.fillStyle = ['#E8A0A8', '#E2B33C', '#C8323C', '#FBF7EE'][i % 4]; g.beginPath(); g.arc(14 + r() * (w - 28), ph * (0.45 + r() * 0.45), 5 + r() * 4, 0, 7); g.fill(); }
  } else if (pic === 'boat') {
    g.fillStyle = '#6FA3B8'; g.fillRect(6, ph * 0.62, w - 12, ph * 0.38 + 6);
    g.fillStyle = '#6B4A30'; g.beginPath(); g.moveTo(w * 0.25, ph * 0.66); g.lineTo(w * 0.75, ph * 0.66); g.lineTo(w * 0.65, ph * 0.8); g.lineTo(w * 0.35, ph * 0.8); g.fill();
    g.fillStyle = '#F6F0E2'; g.beginPath(); g.moveTo(w * 0.5, ph * 0.2); g.lineTo(w * 0.5, ph * 0.62); g.lineTo(w * 0.72, ph * 0.62); g.fill();
  } else if (pic === 'tree') {
    g.fillStyle = '#C9B48E'; g.fillRect(6, ph * 0.78, w - 12, ph * 0.22 + 6);
    g.fillStyle = '#6B4A30'; g.fillRect(w * 0.48, ph * 0.45, w * 0.06, ph * 0.35);
    g.fillStyle = '#E2B33C'; g.beginPath(); g.arc(w * 0.51, ph * 0.38, ph * 0.26, 0, 7); g.fill();
  } else {
    g.fillStyle = '#C8323C'; g.save(); g.translate(w * 0.55, ph * 0.4); g.rotate(0.6); g.fillRect(-12, -12, 24, 24); g.restore();
    g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.moveTo(w * 0.55, ph * 0.5); g.quadraticCurveTo(w * 0.4, ph * 0.8, w * 0.2, ph); g.stroke();
  }
  txt(g, month, w / 2, ph + h * 0.09, Math.round(h * 0.075), MAROON, { maxW: w - 16 });
  const cols = 7, rows = 5, gx = 10, gy = ph + h * 0.16, cw = (w - 20) / cols, ch = (h - gy - 8) / rows;
  for (let i = 0; i < 31; i++) {
    const cx = gx + (i % cols) * cw + cw / 2, cy = gy + Math.floor(i / cols) * ch + ch / 2;
    if (i + 1 === mark) { g.strokeStyle = '#C8323C'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, Math.min(cw, ch) * 0.45, 0, 7); g.stroke(); }
    txt(g, mm(i + 1), cx, cy, Math.round(ch * 0.55), i % 7 === 6 ? '#C8323C' : INK, { weight: 600 });
  }
}
/** A clock face. */
export function clockFace(g, w, h, hour = 10) {
  g.fillStyle = '#FBF6EA'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, 7); g.fill();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillStyle = INK; g.fillRect(w / 2 + Math.sin(a) * (w * 0.37) - 2, h / 2 - Math.cos(a) * (w * 0.37) - 2, 4, 4); }
  const ha = ((hour % 12) / 12) * Math.PI * 2, ma = ((hour % 1) * 60 / 60) * Math.PI * 2 + 0.9;
  g.strokeStyle = INK; g.lineCap = 'round';
  g.lineWidth = 5; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.sin(ha) * w * 0.2, h / 2 - Math.cos(ha) * w * 0.2); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.sin(ma) * w * 0.32, h / 2 - Math.cos(ma) * w * 0.32); g.stroke();
  g.fillStyle = '#C8323C'; g.beginPath(); g.arc(w / 2, h / 2, 4, 0, 7); g.fill();
}
/** A framed picture, drawn: 'portrait' (two simple figures, sepia: no real photos), 'one' (one figure),
 *  'landscape', 'flowers', 'boat', 'kids' (a child's crayon drawing), 'diploma'. */
export function framedPic(g, w, h, kind = 'portrait', seed = 1, frame = '#8E5A3C') {
  g.fillStyle = frame; g.fillRect(0, 0, w, h);
  g.fillStyle = '#E9D8B4'; g.fillRect(6, 6, w - 12, h - 12);
  const ix = 10, iy = 10, iw = w - 20, ih = h - 20;
  const r = rand(seed);
  if (kind === 'portrait' || kind === 'one') {
    const bg = g.createLinearGradient(0, iy, 0, iy + ih); bg.addColorStop(0, '#CDB48C'); bg.addColorStop(1, '#A88B62');
    g.fillStyle = bg; g.fillRect(ix, iy, iw, ih);
    const n = kind === 'one' ? 1 : 2;
    for (let i = 0; i < n; i++) {
      const cx = ix + iw * (n === 1 ? 0.5 : 0.32 + i * 0.36), hr = iw * (n === 1 ? 0.16 : 0.12);
      g.fillStyle = '#6E5638'; g.beginPath(); g.ellipse(cx, iy + ih + hr * 0.2, hr * 1.9, hr * 2.2, 0, Math.PI, 0); g.fill(); // shoulders
      g.fillStyle = '#E2C9A0'; g.beginPath(); g.arc(cx, iy + ih * 0.5 + (i ? 4 : 0), hr, 0, 7); g.fill();
      g.fillStyle = '#4A3826'; g.beginPath(); g.arc(cx, iy + ih * 0.5 - hr * 0.35 + (i ? 4 : 0), hr * 1.02, Math.PI, 0); g.fill(); // hair
      if (i === 1 || n === 1 && seed % 2) { g.fillStyle = '#F0E6D0'; g.beginPath(); g.arc(cx + hr * 0.9, iy + ih * 0.5 - hr * 0.8, hr * 0.28, 0, 7); g.fill(); } // a flower in the hair
    }
    g.fillStyle = 'rgba(255,240,210,0.18)'; g.fillRect(ix, iy, iw, ih * 0.3);
  } else if (kind === 'landscape') {
    const sky = g.createLinearGradient(0, iy, 0, iy + ih); sky.addColorStop(0, '#9CC3DE'); sky.addColorStop(1, '#F6E6CA');
    g.fillStyle = sky; g.fillRect(ix, iy, iw, ih);
    g.fillStyle = '#7FA383'; g.beginPath(); g.moveTo(ix, iy + ih * 0.75); g.quadraticCurveTo(ix + iw * 0.4, iy + ih * 0.3, ix + iw, iy + ih * 0.65); g.lineTo(ix + iw, iy + ih); g.lineTo(ix, iy + ih); g.fill();
    g.fillStyle = '#6FA3B8'; g.fillRect(ix, iy + ih * 0.85, iw, ih * 0.15);
  } else if (kind === 'flowers') {
    g.fillStyle = '#F3E9D6'; g.fillRect(ix, iy, iw, ih);
    g.fillStyle = '#B5643C'; g.fillRect(ix + iw * 0.4, iy + ih * 0.6, iw * 0.2, ih * 0.35);
    for (let i = 0; i < 7; i++) { g.fillStyle = ['#C8323C', '#E2B33C', '#E8A0A8'][i % 3]; g.beginPath(); g.arc(ix + iw * (0.3 + r() * 0.4), iy + ih * (0.2 + r() * 0.35), iw * 0.07, 0, 7); g.fill(); }
    g.strokeStyle = '#4F7F43'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(ix + iw / 2, iy + ih * 0.62); g.lineTo(ix + iw * (0.3 + i * 0.1), iy + ih * 0.35); g.stroke(); }
  } else if (kind === 'boat') {
    g.fillStyle = '#F2D9A6'; g.fillRect(ix, iy, iw, ih);
    g.fillStyle = '#6FA3B8'; g.fillRect(ix, iy + ih * 0.6, iw, ih * 0.4);
    g.fillStyle = '#6B4A30'; g.beginPath(); g.moveTo(ix + iw * 0.2, iy + ih * 0.62); g.lineTo(ix + iw * 0.8, iy + ih * 0.62); g.lineTo(ix + iw * 0.68, iy + ih * 0.76); g.lineTo(ix + iw * 0.32, iy + ih * 0.76); g.fill();
    g.fillStyle = '#C8323C'; g.beginPath(); g.moveTo(ix + iw * 0.5, iy + ih * 0.15); g.lineTo(ix + iw * 0.5, iy + ih * 0.6); g.lineTo(ix + iw * 0.75, iy + ih * 0.6); g.fill();
  } else if (kind === 'kids') {
    g.fillStyle = '#FFFDF8'; g.fillRect(ix, iy, iw, ih);
    g.strokeStyle = '#2F5DB3'; g.lineWidth = 3; g.strokeRect(ix + iw * 0.2, iy + ih * 0.45, iw * 0.4, ih * 0.4);
    g.strokeStyle = '#C8323C'; g.beginPath(); g.moveTo(ix + iw * 0.15, iy + ih * 0.47); g.lineTo(ix + iw * 0.4, iy + ih * 0.2); g.lineTo(ix + iw * 0.65, iy + ih * 0.47); g.stroke();
    g.fillStyle = '#E2B33C'; g.beginPath(); g.arc(ix + iw * 0.8, iy + ih * 0.2, iw * 0.1, 0, 7); g.fill();
    g.strokeStyle = '#4F7F43'; g.beginPath(); g.moveTo(ix, iy + ih * 0.88); g.lineTo(ix + iw, iy + ih * 0.88); g.stroke();
  } else {
    g.fillStyle = '#FBF6EA'; g.fillRect(ix, iy, iw, ih);
    g.strokeStyle = GOLD; g.lineWidth = 3; g.strokeRect(ix + 5, iy + 5, iw - 10, ih - 10);
    txt(g, 'ဂုဏ်ပြုလွှာ', w / 2, iy + ih * 0.25, Math.round(ih * 0.14), MAROON, { maxW: iw - 20 }); // DRAFT(my): certificate
    scribble(g, ix + 16, iy + ih * 0.48, iw - 32, 3, ih * 0.12, '#5A4A3A', seed, 1.5);
    g.fillStyle = '#C8323C'; g.beginPath(); g.arc(ix + iw * 0.78, iy + ih * 0.8, ih * 0.08, 0, 7); g.fill();
  }
}
/** A painted shop / trade sign (maroon board, gold text). */
export function boardSign(g, w, h, my, { bg = MAROON, fg = '#F7E7A6', edge = GOLD, sub = null } = {}) {
  rr(g, 3, 3, w - 6, h - 6, 12, bg, edge, 5);
  txt(g, my, w / 2, sub ? h * 0.42 : h / 2 + 2, Math.round(h * (sub ? 0.36 : 0.44)), fg, { maxW: w - 24 });
  if (sub) txt(g, sub, w / 2, h * 0.78, Math.round(h * 0.2), fg, { weight: 600, font: FONT_SERIF, maxW: w - 24 });
}
/** A chalk menu / price board: rows [[my, price]] (price in Burmese digits). */
export function chalkBoard(g, w, h, title, rows, seed = 9) {
  const r = rand(seed);
  g.fillStyle = '#3E4A40'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.04})`; g.fillRect(r() * w, r() * h, 6 + r() * 20, 2 + r() * 3); }
  g.strokeStyle = '#8C6A3C'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
  txt(g, title, w / 2, h * 0.15, Math.round(h * 0.11), '#F7E7A6', { maxW: w - 30 });
  const step = (h * 0.78) / Math.max(rows.length, 1);
  rows.forEach(([a, b], i) => {
    const y = h * 0.3 + i * step;
    txt(g, a, w * 0.08, y, Math.round(Math.min(step * 0.55, h * 0.09)), '#F4F1E8', { align: 'left', maxW: w * 0.6 });
    if (b) txt(g, mm(b), w * 0.92, y, Math.round(Math.min(step * 0.55, h * 0.09)), '#F7E7A6', { align: 'right' });
  });
}
/** The Burmese alphabet chart (a child's wall chart). */
export function alphabetChart(g, w, h, seed = 3) {
  paperBg(g, w, h, '#FFFBF0', seed);
  g.fillStyle = '#2F6B4F'; g.fillRect(0, 0, w, h * 0.14);
  txt(g, 'ကကြီး ခခွေး', w / 2, h * 0.07, Math.round(h * 0.08), '#F7E7A6', { maxW: w - 20 }); // DRAFT(my)
  const L = ['က', 'ခ', 'ဂ', 'ဃ', 'င', 'စ', 'ဆ', 'ဇ', 'ဈ', 'ည', 'ဋ', 'ဌ', 'ဍ', 'ဎ', 'ဏ', 'တ', 'ထ', 'ဒ', 'ဓ', 'န', 'ပ', 'ဖ', 'ဗ', 'ဘ', 'မ'];
  const cols = 5, rows = 5, cw = (w - 16) / cols, ch = (h * 0.84 - 10) / rows;
  const tint = ['#C8323C', '#2F5DB3', '#2F6B4F', '#A47A2C', '#6E1F2A'];
  L.forEach((c, i) => {
    const x = 8 + (i % cols) * cw, y = h * 0.15 + Math.floor(i / cols) * ch;
    rr(g, x + 3, y + 3, cw - 6, ch - 6, 6, '#FFFFFF', '#E0D6C2', 1.5);
    txt(g, c, x + cw / 2, y + ch / 2 + 2, Math.round(ch * 0.55), tint[i % 5]);
  });
}
/** A school timetable (DRAFT(my) day names). */
export function timetable(g, w, h, seed = 5) {
  paperBg(g, w, h, '#FFFDF6', seed);
  txt(g, 'အချိန်ဇယား', w / 2, h * 0.1, Math.round(h * 0.09), MAROON, { maxW: w - 20 }); // DRAFT(my)
  const days = ['တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ']; // DRAFT(my)
  const cols = ['#F2C65A', '#8DBA6E', '#7FB0CF', '#E8A0A8', '#C9A26A'];
  const rh = (h * 0.8) / 5;
  days.forEach((d, i) => {
    const y = h * 0.18 + i * rh;
    txt(g, d, 8, y + rh / 2, Math.round(rh * 0.32), INK, { align: 'left', maxW: w * 0.32 });
    for (let k = 0; k < 4; k++) { g.fillStyle = cols[(i + k) % 5]; g.fillRect(w * 0.36 + k * (w * 0.155), y + 4, w * 0.145, rh - 8); }
  });
}
/** A hand-drawn map of Paper Town (a student's): roads, blocks, a stream, a star for home. */
export function townMap(g, w, h, seed = 6) {
  paperBg(g, w, h, '#F8F1DE', seed);
  const r = rand(seed);
  g.strokeStyle = '#C9A24A'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(w * 0.1, h * 0.2); g.lineTo(w * 0.5, h * 0.5); g.lineTo(w * 0.85, h * 0.4); g.stroke();
  g.beginPath(); g.moveTo(w * 0.5, h * 0.5); g.lineTo(w * 0.45, h * 0.9); g.stroke();
  g.strokeStyle = '#7FB0CF'; g.lineWidth = 7; g.beginPath(); g.moveTo(w * 0.7, 0); g.quadraticCurveTo(w * 0.62, h * 0.5, w * 0.75, h); g.stroke();
  for (let i = 0; i < 9; i++) { g.fillStyle = ['#E8A0A8', '#8DBA6E', '#F2C65A', '#C9B48E'][i % 4]; g.fillRect(r() * w * 0.85, r() * h * 0.85, 14 + r() * 14, 10 + r() * 10); }
  g.fillStyle = '#C8323C'; g.font = `700 ${Math.round(h * 0.14)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('★', w * 0.3, h * 0.66);
  txt(g, 'စာရွက်မြို့', w * 0.28, h * 0.1, Math.round(h * 0.09), MAROON); // DRAFT(my): Paper Town
}
/** An embroidered saying in a hoop-like frame (homes). */
export function embroidery(g, w, h, line, seed = 2) {
  g.fillStyle = '#8E5A3C'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#FBF4E4'; g.fillRect(8, 8, w - 16, h - 16);
  g.strokeStyle = '#C8323C'; g.setLineDash([4, 4]); g.lineWidth = 2; g.strokeRect(14, 14, w - 28, h - 28); g.setLineDash([]);
  txt(g, line, w / 2, h / 2, Math.round(h * 0.24), '#2F6B4F', { maxW: w - 40 });
  for (const s of [-1, 1]) { g.fillStyle = '#E8A0A8'; g.beginPath(); g.arc(w / 2 + s * (w * 0.38), h / 2, 6, 0, 7); g.fill(); }
}
/** A newspaper page pinned up (Junction): headline bar and columns. */
export function newsPage(g, w, h, seed = 7) {
  paperBg(g, w, h, '#ECE8DE', seed);
  g.fillStyle = INK; g.fillRect(8, 8, w - 16, h * 0.08);
  txt(g, 'သတင်း', w / 2, 8 + h * 0.04, Math.round(h * 0.06), '#ECE8DE'); // DRAFT(my)
  const cols = 3;
  for (let c = 0; c < cols; c++) for (let l = 0; l < 14; l++) { g.fillStyle = l % 5 === 0 ? '#6A6358' : '#A8A196'; g.fillRect(10 + c * ((w - 20) / cols), h * 0.2 + l * (h * 0.055), (w - 20) / cols - 10 - (l % 4) * 4, 3); }
}
/** Printed sheets for a printer's drying line. */
export function printedSheet(g, w, h, seed = 1) {
  paperBg(g, w, h, '#FBF8F0', seed);
  const r = rand(seed);
  g.fillStyle = ['#C8323C', '#2F5DB3', '#2F6B4F', INK][seed % 4]; g.fillRect(6, 6, w - 12, h * 0.18);
  for (let l = 0; l < 6; l++) { g.fillStyle = '#6A6358'; g.fillRect(8, h * 0.3 + l * h * 0.1, (w - 16) * (0.6 + r() * 0.4), 2); }
}
/** The Blank Page's half-drawn wall: pencil outlines of a window, a shelf, a picture, hatching, an eraser's smudge. */
export function sketchWall(g, w, h, seed = 3) {
  g.fillStyle = '#FBFAF6'; g.fillRect(0, 0, w, h);
  const r = rand(seed);
  // faint construction lines
  for (let i = 0; i < 4; i++) pencilLine(g, 0, h * (0.2 + i * 0.22), w, h * (0.21 + i * 0.22) + (r() - 0.5) * 6, seed + i, 'rgba(70,64,56,0.18)', 1.2);
  // a window drawn in pencil, half hatched
  const wx = w * 0.12, wy = h * 0.18, ww = w * 0.28, wh = h * 0.42;
  for (const [a, b, c, d] of [[wx, wy, wx + ww, wy], [wx + ww, wy, wx + ww, wy + wh], [wx + ww, wy + wh, wx, wy + wh], [wx, wy + wh, wx, wy], [wx + ww / 2, wy, wx + ww / 2, wy + wh], [wx, wy + wh / 2, wx + ww, wy + wh / 2]]) pencilLine(g, a, b, c, d, seed + a, 'rgba(58,52,46,0.85)', 2.4);
  hatch(g, wx + ww / 2, wy, ww / 2, wh / 2, 8, 'rgba(70,64,56,0.3)', seed);
  // a picture frame waiting for its picture, with a note
  const fx = w * 0.6, fy = h * 0.2, fw = w * 0.22, fh = h * 0.3;
  for (const [a, b, c, d] of [[fx, fy, fx + fw, fy], [fx + fw, fy, fx + fw, fy + fh], [fx + fw, fy + fh, fx, fy + fh], [fx, fy + fh, fx, fy]]) pencilLine(g, a, b, c, d, seed + b, 'rgba(58,52,46,0.85)', 2.4);
  txt(g, '?', fx + fw / 2, fy + fh / 2, Math.round(fh * 0.4), 'rgba(58,52,46,0.5)', { weight: 400, font: FONT_SERIF });
  // a shelf line and a smudge
  pencilLine(g, w * 0.5, h * 0.72, w * 0.95, h * 0.72, seed + 9, 'rgba(58,52,46,0.85)', 2.6);
  g.fillStyle = 'rgba(200,190,180,0.25)'; g.beginPath(); g.ellipse(w * 0.3, h * 0.82, w * 0.08, h * 0.05, 0.3, 0, 7); g.fill();
  txt(g, 'ဒီနေရာ ဘာထားမလဲ', w * 0.72, h * 0.86, Math.round(h * 0.06), 'rgba(58,52,46,0.7)', { weight: 500 }); // DRAFT(my): what goes here?
}
/** A board of stamp proofs (a stamp carver's samples): red and blue seal impressions on paper, pinned. */
export function stampProofs(g, w, h, seed = 4) {
  const r = rand(seed);
  g.fillStyle = '#8E5A3C'; g.fillRect(0, 0, w, h);
  paperBg(g, w, h, '#F7F0DF', seed); g.strokeStyle = '#8E5A3C'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  const n = 3, cell = (w - 30) / n;
  for (let i = 0; i < n * n; i++) {
    const cx = 15 + (i % n) * cell + cell / 2, cy = 15 + Math.floor(i / n) * cell + cell / 2;
    const col = r() < 0.7 ? 'rgba(178,36,48,0.85)' : 'rgba(46,61,99,0.85)';
    const s = cell * (0.5 + r() * 0.18);
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 3;
    if (r() < 0.5) { g.strokeRect(cx - s / 2, cy - s / 2, s, s); g.strokeRect(cx - s / 2 + 5, cy - s / 2 + 5, s - 10, s - 10); }
    else { g.beginPath(); g.arc(cx, cy, s / 2, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, s / 2 - 5, 0, 7); g.stroke(); }
    for (let k = 0; k < 4; k++) g.fillRect(cx - s * 0.3 + r() * s * 0.4, cy - s * 0.25 + k * s * 0.13, s * 0.2 + r() * s * 0.2, 3); // the carved marks
  }
  g.fillStyle = '#C8323C'; for (const [x, y] of [[10, 10], [w - 14, 10]]) { g.beginPath(); g.arc(x + 2, y + 2, 4, 0, 7); g.fill(); }
}
