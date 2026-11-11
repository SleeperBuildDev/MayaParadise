// Content & Copywriting (Content နှင့် Copywriting): a warm café-office.
//   - three café tables, each with a laptop and a "Writer" mug that grows with the package:
//     small mug = Trial (cc-trial), medium = Essentials (cc-essentials), large = Master (cc-master);
//   - a big chalk compare board on the back wall with 3D bars for 3 / 14 / 30 deliveries (cc-compare);
//   - props: coffee counter with pendant lamps, plants, a content calendar, social-media icon blocks.
// Shared building blocks (canvas atlas, skinned "rig" for moving props, springs) live in scripts.js.
import { THREE, PALETTE, VoxelBuilder, jitter, createRoom, plant, counter } from './kit.js';
import { fontsReady, FONT_SERIF } from '../toon.js';
import {
  createAtlas, createRig, drawSparkle, drawGlow, drawShadow, fillRound, strokeRound, floorShadow,
  UNIT_BOX, boxMatrix, segmentMatrix, createSpring, stepSpring, stationTarget, frac, clamp01, easeOut,
  blockBox, blockCircle, chainDispose,
} from './scripts.js';

const WOOD_TOP = '#BE8F5E';
const MUG = PALETTE.white;
const BOARD = '#2F2A25';

// Asymmetric on purpose: keeps a straight 1 m lane from the door to the compare-board spot.
const TABLES = [
  {
    key: 'trial', id: 'cc-trial', name: 'Trial', count: '၃', x: -2.4, z: -0.45, mugW: 0.15, mugH: 0.17, cards: 3, steam: 1,
    cardColors: [PALETTE.rose, PALETTE.paper, PALETTE.gold], rug: '#E7B3AC', rugEdge: PALETTE.gold, bar: '#E7A7A0',
  },
  {
    key: 'essentials', id: 'cc-essentials', name: 'Essentials', count: '၁၄', x: 0.3, z: -0.45, mugW: 0.21, mugH: 0.27, cards: 14, steam: 2,
    cardColors: [PALETTE.paper, PALETTE.gold, PALETTE.rose, '#BFD9EC'], rug: '#C5DCEC', rugEdge: PALETTE.gold, bar: '#BFD9EC',
  },
  {
    key: 'master', id: 'cc-master', name: 'Master', count: '၃၀', x: 2.62, z: -0.45, mugW: 0.3, mugH: 0.4, cards: 30, steam: 3,
    cardColors: [PALETTE.maroon, PALETTE.paper, PALETTE.gold, PALETTE.rose, '#BFD9EC'], rug: PALETTE.maroon, rugEdge: PALETTE.gold, bar: '#C04A5A',
  },
];

const BOARD_Y = 1.57;
const BOARD_W = 3.04;
const BOARD_H = 1.52;
const BOARD_Z = -3.93;

const RUG_FRONT = 1.86;

const STATIONS = [
  {
    id: 'cc-trial', x: -2.4, z: 1.06, look: { x: -2.4, z: -0.45 }, emote: 'nod', face: 'wink', labelY: 1.85,
    line: { my: 'စမ်းကြည့်ချင်ရင် Trial လေးနဲ့ စလို့ရပါတယ်ရှင့်', en: 'Want to try first? Start with the Trial!' },
  },
  {
    id: 'cc-essentials', x: 0.3, z: 1.06, look: { x: 0.3, z: -0.45 }, emote: 'thumbsUp', face: 'happy', labelY: 1.85,
    line: { my: 'Brand လေး ပုံမှန် တောက်ပနေအောင် Essentials နော်', en: 'Essentials keeps your brand shining, week after week.' },
  },
  {
    id: 'cc-master', x: 2.62, z: 1.06, look: { x: 2.62, z: -0.45 }, emote: 'phone', face: 'star', labelY: 1.85,
    line: { my: 'Master နဲ့ဆို ဈေးကွက်မှာ ထင်ရှားလာမှာပါရှင့်', en: 'With Master, your brand stands out in the market!' },
  },
  {
    id: 'cc-compare', x: -1.55, z: -2.3, look: { x: 0, z: BOARD_Z }, emote: 'point', face: 'smile', labelY: 2.6,
    line: { my: 'သုံးမျိုးလုံး ယှဉ်ကြည့်ပြီး ရွေးလို့ရပါတယ်နော်', en: 'Compare all three, then pick the one for you.' },
  },
];

// ---------- atlas ----------
/** Faint chalk doodles around the compare board: smudges, a heart, a cup, an arrow, stars. */
function drawChalkDoodles(g, r) {
  const { x, y, w, h } = r;
  g.save();
  g.fillStyle = 'rgba(246,238,220,0.06)';
  for (const [sx, sy, sw, sh] of [[0.08, 0.3, 0.14, 0.12], [0.62, 0.62, 0.18, 0.1], [0.4, 0.2, 0.2, 0.08]]) g.fillRect(x + w * sx, y + h * sy, w * sw, h * sh);
  g.strokeStyle = 'rgba(246,238,220,0.55)';
  g.lineWidth = 2.5;
  g.lineCap = 'round';
  // a little coffee cup with steam, in the empty margin left of the Trial bar
  const cx = x + 32;
  const cy = y + 206;
  g.strokeRect(cx - 12, cy - 10, 22, 18);
  g.beginPath();
  g.arc(cx + 14, cy - 1, 6, -Math.PI / 2, Math.PI / 2);
  g.moveTo(cx - 6, cy - 16);
  g.quadraticCurveTo(cx - 10, cy - 22, cx - 5, cy - 28);
  g.moveTo(cx + 3, cy - 16);
  g.quadraticCurveTo(cx - 1, cy - 22, cx + 4, cy - 28);
  g.stroke();
  // an arrow curling up toward the Master column
  g.beginPath();
  g.moveTo(x + w * 0.56, y + 236);
  g.quadraticCurveTo(x + w * 0.62, y + 200, x + w * 0.69, y + 206);
  g.moveTo(x + w * 0.69, y + 206);
  g.lineTo(x + w * 0.675, y + 196);
  g.moveTo(x + w * 0.69, y + 206);
  g.lineTo(x + w * 0.675, y + 214);
  g.stroke();
  g.restore();
  drawHeart(g, x + w - 44, y + h - 30, 22, 'rgba(232,160,168,0.8)');
  for (const [px, py, s] of [[0.2, 0.36, 6], [0.47, 0.33, 5], [0.8, 0.3, 6], [0.9, 0.58, 4], [0.12, 0.62, 4]]) drawSparkle(g, x + w * px, y + h * py, s, 'rgba(240,213,142,0.85)');
}

/** Chalk café menu (Burmese first): coffee, tea, cake, each with a tiny drawing. */
function drawMenu(A, r) {
  const g = A.g;
  const { x, y, w, h } = r;
  g.fillStyle = '#2B2622';
  g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(246,238,220,0.35)';
  g.lineWidth = 2;
  g.strokeRect(x + 8, y + 8, w - 16, h - 16);
  A.text(x + 20, y + 6, w - 40, 50, [{ text: 'မီနူး', size: 30, color: '#E8C878' }]);
  g.fillStyle = 'rgba(246,238,220,0.5)';
  g.fillRect(x + w * 0.32, y + 52, w * 0.36, 2);
  const items = ['ကော်ဖီ', 'လက်ဖက်ရည်', 'ကိတ်မုန့်'];
  items.forEach((text, i) => {
    const ly = y + 60 + i * 40;
    A.text(x + 58, ly, w - 120, 42, [{ text, size: 21, color: '#F6EEDC' }]);
    g.fillStyle = 'rgba(246,238,220,0.35)';
    for (let k = 0; k < 6; k++) g.fillRect(x + w - 70 + k * 9, ly + 22, 4, 2);
    // tiny chalk icon on the left
    g.strokeStyle = i === 2 ? PALETTE.rose : '#F6EEDC';
    g.lineWidth = 2;
    const ix = x + 36;
    const iy = ly + 21;
    if (i === 0) {
      g.strokeRect(ix - 8, iy - 6, 14, 12);
      g.beginPath();
      g.arc(ix + 8, iy, 4, -Math.PI / 2, Math.PI / 2);
      g.stroke();
    } else if (i === 1) {
      g.beginPath();
      g.arc(ix, iy + 2, 8, Math.PI, 0);
      g.lineTo(ix + 8, iy + 6);
      g.lineTo(ix - 8, iy + 6);
      g.closePath();
      g.moveTo(ix + 8, iy);
      g.lineTo(ix + 14, iy - 5);
      g.stroke();
    } else {
      g.beginPath();
      g.moveTo(ix - 10, iy + 7);
      g.lineTo(ix + 10, iy + 7);
      g.lineTo(ix + 10, iy - 2);
      g.lineTo(ix - 10, iy + 2);
      g.closePath();
      g.stroke();
    }
  });
  drawSparkle(g, x + 26, y + 28, 8, PALETTE.gold);
  drawSparkle(g, x + w - 26, y + 28, 8, PALETTE.gold);
}

/** A cream clock face with gold ring and maroon hour marks (hands are 3D). */
function drawClock(A, r) {
  const g = A.g;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  g.fillStyle = PALETTE.gold;
  g.beginPath();
  g.arc(cx, cy, r.w / 2 - 1, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#FFF8EA';
  g.beginPath();
  g.arc(cx, cy, r.w / 2 - 8, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = PALETTE.maroon;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const big = i % 3 === 0;
    g.save();
    g.translate(cx + Math.sin(a) * (r.w / 2 - 16), cy - Math.cos(a) * (r.w / 2 - 16));
    g.rotate(a);
    g.fillRect(-(big ? 2.5 : 1.5), -(big ? 6 : 4), big ? 5 : 3, big ? 12 : 8);
    g.restore();
  }
  drawSparkle(g, cx, cy + 18, 6, PALETTE.gold);
}

function drawHeart(g, cx, cy, s, fill) {
  g.beginPath();
  g.moveTo(cx, cy + s * 0.42);
  g.bezierCurveTo(cx - s * 0.62, cy, cx - s * 0.48, cy - s * 0.52, cx, cy - s * 0.2);
  g.bezierCurveTo(cx + s * 0.48, cy - s * 0.52, cx + s * 0.62, cy, cx, cy + s * 0.42);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
}

function drawIcon(A, r, kind) {
  const g = A.g;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const s = r.w;
  const bg = { heart: PALETTE.rose, play: PALETTE.maroon, chat: PALETTE.gold, plane: PALETTE.skyTop, hash: PALETTE.ink, star: PALETTE.paper }[kind];
  g.fillStyle = bg;
  g.fillRect(r.x, r.y, r.w, r.h);
  strokeRound(g, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 14, 'rgba(255,255,255,0.55)', 3);
  if (kind === 'heart') drawHeart(g, cx, cy + 2, s * 0.62, PALETTE.white);
  else if (kind === 'play') {
    g.beginPath();
    g.moveTo(cx - s * 0.14, cy - s * 0.2);
    g.lineTo(cx + s * 0.22, cy);
    g.lineTo(cx - s * 0.14, cy + s * 0.2);
    g.closePath();
    g.fillStyle = PALETTE.white;
    g.fill();
  } else if (kind === 'chat') {
    fillRound(g, cx - s * 0.28, cy - s * 0.2, s * 0.56, s * 0.36, s * 0.1, PALETTE.white);
    g.beginPath();
    g.moveTo(cx - s * 0.14, cy + s * 0.15);
    g.lineTo(cx - s * 0.2, cy + s * 0.3);
    g.lineTo(cx + s * 0.0, cy + s * 0.15);
    g.closePath();
    g.fill();
    g.fillStyle = PALETTE.goldDeep;
    for (const dx of [-0.13, 0, 0.13]) {
      g.beginPath();
      g.arc(cx + dx * s, cy - s * 0.02, s * 0.04, 0, Math.PI * 2);
      g.fill();
    }
  } else if (kind === 'plane') {
    g.beginPath();
    g.moveTo(cx - s * 0.3, cy - s * 0.02);
    g.lineTo(cx + s * 0.3, cy - s * 0.24);
    g.lineTo(cx + s * 0.1, cy + s * 0.28);
    g.lineTo(cx - s * 0.02, cy + s * 0.06);
    g.closePath();
    g.fillStyle = PALETTE.white;
    g.fill();
    g.beginPath();
    g.moveTo(cx - s * 0.02, cy + s * 0.06);
    g.lineTo(cx + s * 0.3, cy - s * 0.24);
    g.strokeStyle = PALETTE.maroon;
    g.lineWidth = 3;
    g.stroke();
  } else if (kind === 'hash') {
    g.fillStyle = PALETTE.gold;
    for (const k of [-1, 1]) {
      g.fillRect(cx + k * s * 0.1 - s * 0.035, cy - s * 0.27, s * 0.07, s * 0.54);
      g.fillRect(cx - s * 0.27, cy + k * s * 0.1 - s * 0.035, s * 0.54, s * 0.07);
    }
  } else {
    drawSparkle(g, cx, cy, s * 0.34, PALETTE.gold, PALETTE.white);
  }
}

function drawScreen(A, r, kind) {
  const g = A.g;
  const { x, y, w, h } = r;
  g.fillStyle = '#FBF6EC';
  g.fillRect(x, y, w, h);
  g.fillStyle = PALETTE.maroon;
  g.fillRect(x, y, w, 12);
  g.fillStyle = PALETTE.gold;
  for (let i = 0; i < 3; i++) g.fillRect(x + 6 + i * 7, y + 4, 4, 4);
  const post = (px, py, pw, ph, sky = PALETTE.skyTop) => {
    g.fillStyle = sky;
    g.fillRect(px, py, pw, ph * 0.66);
    fillRound(g, px + pw * 0.14, py + ph * 0.3, pw * 0.42, ph * 0.18, ph * 0.08, PALETTE.white);
    g.fillStyle = PALETTE.gold;
    g.beginPath();
    g.arc(px + pw * 0.76, py + ph * 0.2, ph * 0.1, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#B8A88E';
    g.fillRect(px, py + ph * 0.74, pw * 0.86, Math.max(2, ph * 0.07));
    g.fillRect(px, py + ph * 0.88, pw * 0.6, Math.max(2, ph * 0.07));
  };
  if (kind === 'trial') {
    post(x + 14, y + 20, 74, 72);
    g.fillStyle = '#B8A88E';
    for (let i = 0; i < 4; i++) g.fillRect(x + 98, y + 26 + i * 12, 48 - (i % 2) * 14, 4);
    drawHeart(g, x + 116, y + 84, 22, PALETTE.rose);
  } else if (kind === 'essentials') {
    for (let i = 0; i < 4; i++) post(x + 10 + (i % 2) * 52, y + 18 + Math.floor(i / 2) * 42, 46, 38, i % 3 ? PALETTE.skyTop : '#F2C6A0');
    g.fillStyle = PALETTE.parchment;
    g.fillRect(x + 114, y + 18, 38, 74);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i % 2 ? PALETTE.gold : PALETTE.rose;
      g.fillRect(x + 120, y + 24 + i * 17, 26, 10);
    }
  } else {
    const cols = [PALETTE.rose, PALETTE.skyTop, PALETTE.gold, '#F2C6A0', PALETTE.maroon, PALETTE.parchment];
    for (let i = 0; i < 9; i++) {
      g.fillStyle = cols[i % cols.length];
      g.fillRect(x + 10 + (i % 3) * 30, y + 18 + Math.floor(i / 3) * 26, 26, 22);
    }
    g.strokeStyle = PALETTE.goldDeep;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(x + 108, y + 88);
    g.lineTo(x + 122, y + 72);
    g.lineTo(x + 134, y + 78);
    g.lineTo(x + 150, y + 30);
    g.stroke();
    drawSparkle(g, x + 150, y + 26, 9, PALETTE.gold);
  }
}

function drawContentAtlas(A) {
  const g = A.g;
  const R = A.pack({
    board: [704, 352],
    aframe: [240, 300],
    calendar: [200, 236],
    banner_trial: [240, 120],
    banner_essentials: [240, 120],
    banner_master: [240, 120],
    pool: [112, 112],
    screen_trial: [160, 100],
    screen_essentials: [160, 100],
    screen_master: [160, 100],
    icon_heart: [88, 88],
    icon_play: [88, 88],
    icon_chat: [88, 88],
    icon_plane: [88, 88],
    icon_hash: [88, 88],
    icon_star: [88, 88],
    sparkle: [88, 88],
    shadow: [88, 88],
    coffee: [220, 80],
    bulb: [64, 64],
    writer: [120, 56],
    menu: [300, 190],
    clock: [96, 96],
  });
  drawMenu(A, R.menu);
  drawClock(A, R.clock);

  // Compare board (chalk on a dark board); the bars are 3D boxes in front of it.
  {
    const r = R.board;
    const { x, y, w, h } = r;
    g.fillStyle = BOARD;
    g.fillRect(x, y, w, h);
    A.text(x + 20, y + 6, w - 40, 70, [{ text: 'ဘယ် Package လေး ရွေးမလဲ?', size: 38, color: '#F6EEDC' }]);
    g.fillStyle = 'rgba(246,238,220,0.75)';
    g.fillRect(x + w * 0.3, y + 74, w * 0.4, 3);
    g.fillRect(x + w * 0.05, y + 262, w * 0.9, 3);
    g.fillStyle = 'rgba(246,238,220,0.28)';
    for (const k of [1, 2]) for (let yy = y + 92; yy < y + h - 12; yy += 16) g.fillRect(x + (w * k) / 3 - 1, yy, 2, 9);
    TABLES.forEach((tb, i) => {
      const cx = x + (w * i) / 3;
      A.text(cx + 8, y + 80, w / 3 - 16, 60, [{ text: tb.name, size: 38, font: FONT_SERIF, weight: 600, color: '#E8C878' }]);
      A.text(cx + 8, y + 264, w / 3 - 16, 44, [{ text: `Content ${tb.count} ခု`, size: 24, color: '#F6EEDC' }]);
      A.text(cx + 8, y + 300, w / 3 - 16, 48, [{ text: ['200,000 MMK', '1,000,000 MMK', '1,600,000 MMK'][i], size: 26, font: FONT_SERIF, weight: 600, color: '#E8C878' }]);
    });
    drawSparkle(g, x + 26, y + 40, 11, PALETTE.gold);
    drawSparkle(g, x + w - 26, y + 40, 11, PALETTE.gold);
    drawChalkDoodles(g, r);
  }
  // Welcome A-frame.
  {
    const r = R.aframe;
    fillRound(g, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 22, '#FBF5E8');
    strokeRound(g, r.x + 6, r.y + 6, r.w - 12, r.h - 12, 18, PALETTE.goldDeep, 6);
    A.text(r.x + 12, r.y + 18, r.w - 24, 150, [
      { text: 'Content နှင့်', size: 38, color: PALETTE.maroon },
      { text: 'Copywriting', size: 40, font: FONT_SERIF, weight: 600, color: PALETTE.maroon },
    ]);
    // a little steaming Writer mug
    const mx = r.x + r.w / 2;
    const my = r.y + 222;
    fillRound(g, mx - 34, my - 26, 68, 58, 10, PALETTE.white);
    strokeRound(g, mx - 34, my - 26, 68, 58, 10, PALETTE.ink, 3);
    g.beginPath();
    g.arc(mx + 38, my + 2, 13, -Math.PI / 2, Math.PI / 2);
    g.strokeStyle = PALETTE.ink;
    g.lineWidth = 4;
    g.stroke();
    A.text(mx - 34, my - 14, 68, 34, [{ text: 'Writer', size: 17, font: FONT_SERIF, weight: 600, color: PALETTE.ink }]);
    g.strokeStyle = PALETTE.goldDeep;
    g.lineWidth = 3;
    for (const dx of [-12, 8]) {
      g.beginPath();
      g.moveTo(mx + dx, my - 32);
      g.bezierCurveTo(mx + dx - 8, my - 42, mx + dx + 8, my - 50, mx + dx, my - 60);
      g.stroke();
    }
    drawSparkle(g, r.x + 40, r.y + 250, 12, PALETTE.gold);
    drawSparkle(g, r.x + r.w - 40, r.y + 196, 10, PALETTE.gold);
  }
  // Content calendar.
  {
    const r = R.calendar;
    g.fillStyle = '#FCF7EA';
    g.fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle = PALETTE.maroon;
    g.fillRect(r.x, r.y, r.w, 58);
    A.text(r.x + 6, r.y + 6, r.w - 12, 50, [{ text: 'Content ပြက္ခဒိန်', size: 21, color: '#F6EEDC' }]);
    const marks = { 1: 'gold', 4: 'rose', 8: 'heart', 10: 'gold', 13: 'gold', 15: 'rose', 19: 'gold', 22: 'heart', 24: 'gold', 27: 'rose', 29: 'gold', 33: 'heart' };
    for (let i = 0; i < 35; i++) {
      const cx = r.x + 12 + (i % 7) * 26.5;
      const cy = r.y + 68 + Math.floor(i / 7) * 33;
      g.fillStyle = '#EFE5CF';
      g.fillRect(cx, cy, 22, 27);
      const m = marks[i];
      if (m === 'gold') {
        g.fillStyle = PALETTE.gold;
        g.beginPath();
        g.arc(cx + 11, cy + 13.5, 8, 0, Math.PI * 2);
        g.fill();
      } else if (m === 'rose') {
        g.fillStyle = PALETTE.rose;
        g.fillRect(cx + 3, cy + 5, 16, 17);
      } else if (m === 'heart') drawHeart(g, cx + 11, cy + 14, 20, PALETTE.maroon);
    }
  }
  // Package banners over the tables.
  for (const tb of TABLES) {
    const r = R[`banner_${tb.key}`];
    fillRound(g, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 16, '#FBF5E8');
    strokeRound(g, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 13, PALETTE.gold, 5);
    for (const dx of [-1, 0, 1]) A.text(r.x + 8 + dx, r.y + 4, r.w - 16, 68, [{ text: tb.name, size: 44, font: FONT_SERIF, weight: 600, color: PALETTE.maroon }]);
    A.text(r.x + 8, r.y + 64, r.w - 16, 50, [{ text: `Content ${tb.count} ခု`, size: 24, color: PALETTE.goldDeep }]);
  }
  for (const tb of TABLES) drawScreen(A, R[`screen_${tb.key}`], tb.key);
  for (const k of ['heart', 'play', 'chat', 'plane', 'hash', 'star']) drawIcon(A, R[`icon_${k}`], k);
  // Coffee counter sign.
  {
    const r = R.coffee;
    fillRound(g, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 18, PALETTE.maroon);
    strokeRound(g, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 15, PALETTE.gold, 4);
    A.text(r.x + 30, r.y + 2, r.w - 60, r.h - 4, [{ text: 'ကော်ဖီ', size: 34, color: '#F6EEDC' }]);
    drawSparkle(g, r.x + 26, r.y + r.h / 2, 9, PALETTE.gold);
    drawSparkle(g, r.x + r.w - 26, r.y + r.h / 2, 9, PALETTE.gold);
  }
  // "Writer" mug label.
  {
    const r = R.writer;
    g.fillStyle = MUG;
    g.fillRect(r.x, r.y, r.w, r.h);
    for (const dx of [-0.8, 0, 0.8]) A.text(r.x + dx, r.y, r.w, r.h, [{ text: 'Writer', size: 30, font: FONT_SERIF, weight: 600, color: PALETTE.ink }]);
  }
  drawSparkle(g, R.sparkle.x + 44, R.sparkle.y + 44, 40, PALETTE.gold, '#FFF6D8');
  drawGlow(g, R.bulb, 'rgba(255,255,250,1)', 'rgba(255,224,140,0.9)', 0.35);
  {
    const r = R.pool;
    const grd = g.createRadialGradient(r.x + 56, r.y + 56, 0, r.x + 56, r.y + 56, 56);
    grd.addColorStop(0, 'rgba(255,240,200,0.6)');
    grd.addColorStop(0.6, 'rgba(255,232,180,0.25)');
    grd.addColorStop(1, 'rgba(255,232,180,0)');
    g.fillStyle = grd;
    g.fillRect(r.x, r.y, r.w, r.h);
  }
  drawShadow(g, R.shadow);
  return R;
}

// ---------- props ----------
function buildMug(S, rig, R, x, y, z, w, h) {
  const t = 0.018;
  S.boxMin(x - w / 2, y, z - w / 2, x + w / 2, y + 0.02, z + w / 2, MUG);
  S.boxMin(x - w / 2, y, z + w / 2 - t, x + w / 2, y + h, z + w / 2, MUG);
  S.boxMin(x - w / 2, y, z - w / 2, x + w / 2, y + h, z - w / 2 + t, MUG);
  S.boxMin(x - w / 2, y, z - w / 2, x - w / 2 + t, y + h, z + w / 2, MUG);
  S.boxMin(x + w / 2 - t, y, z - w / 2, x + w / 2, y + h, z + w / 2, MUG);
  S.boxMin(x - w / 2 + t, y, z - w / 2 + t, x + w / 2 - t, y + h - 0.025, z + w / 2 - t, '#6B4428');
  S.boxMin(x - w / 2 - 0.004, y + h - 0.016, z - w / 2 - 0.004, x + w / 2 + 0.004, y + h, z + w / 2 + 0.004, PALETTE.gold);
  // handle
  const hx = x + w / 2;
  S.boxMin(hx, y + h * 0.66, z - 0.016, hx + w * 0.3, y + h * 0.66 + 0.03, z + 0.016, MUG);
  S.boxMin(hx, y + h * 0.18, z - 0.016, hx + w * 0.3, y + h * 0.18 + 0.03, z + 0.016, MUG);
  S.boxMin(hx + w * 0.3 - 0.03, y + h * 0.18, z - 0.016, hx + w * 0.3, y + h * 0.66 + 0.03, z + 0.016, MUG);
  rig.root.quad(R.writer, x, y + h * 0.48, z + w / 2 + 0.002, w * 0.86, w * 0.86 * (56 / 120), { lit: true });
}

function buildTable(S, rig, R, tb) {
  const { x, z } = tb;
  const top = 0.68;
  // a colour-coded rug under the table and Maya's spot (kept below the station ring at y = 0.03)
  const rx0 = Math.max(-3.42, x - 0.98);
  const rx1 = Math.min(3.42, x + 0.98);
  S.boxMin(rx0, 0, z - 0.62, rx1, 0.008, RUG_FRONT, tb.rugEdge);
  S.boxMin(rx0 + 0.09, 0, z - 0.53, rx1 - 0.09, 0.013, RUG_FRONT - 0.09, tb.rug);
  for (const [cxr, czr] of [[rx0 + 0.2, z - 0.42], [rx1 - 0.2, z - 0.42], [rx0 + 0.2, RUG_FRONT - 0.2], [rx1 - 0.2, RUG_FRONT - 0.2]]) S.box(cxr, 0.0135, czr, 0.1, 0.002, 0.1, tb.rugEdge, Math.PI / 4);
  // pedestal café table with a chamfered wooden top
  S.box(x, 0.03, z, 0.7, 0.06, 0.14, PALETTE.woodDark);
  S.box(x, 0.03, z, 0.14, 0.06, 0.6, PALETTE.woodDark);
  S.box(x, 0.34, z, 0.12, 0.58, 0.12, PALETTE.woodDark);
  S.box(x, top - 0.065, z, 1.02, 0.03, 0.7, PALETTE.woodDark);
  S.box(x, top - 0.025, z, 1.1, 0.05, 0.66, WOOD_TOP);
  S.box(x, top - 0.025, z, 0.98, 0.05, 0.78, WOOD_TOP);
  // laptop (the lid is a rig part so it can "wake up")
  const lx = x - 0.17;
  const lz = z + 0.04;
  S.box(lx, top + 0.014, lz, 0.5, 0.028, 0.33, '#D8C7A6');
  S.box(lx, top + 0.03, lz - 0.025, 0.43, 0.004, 0.16, '#5E4C3A');
  S.box(lx, top + 0.03, lz + 0.115, 0.12, 0.004, 0.06, '#C7B48F');
  const lid = rig.part({ name: `lid_${tb.key}`, position: [lx, top + 0.028, lz - 0.165], rotation: [-0.26, 0, 0] });
  lid.boxMin(-0.25, 0, -0.02, 0.25, 0.32, 0, '#D8C7A6');
  lid.quad(R[`screen_${tb.key}`], 0, 0.163, 0.0015, 0.44, 0.275);
  const pops = [];
  ['icon_heart', 'icon_chat'].forEach((reg, i) => {
    const p = rig.part({ name: `pop_${tb.key}${i}`, parent: lid, position: [i ? 0.16 : -0.16, 0.32, 0.06] });
    p.quad(R[reg], 0, 0, 0, 0.17, 0.17);
    pops.push(p);
  });
  // the Writer mug (size = package) and its steam
  const mx = x + 0.3;
  const mz = z + 0.15;
  buildMug(S, rig, R, mx, top, mz, tb.mugW, tb.mugH);
  const steam = [];
  for (let i = 0; i < tb.steam; i++) {
    const p = rig.part({ name: `steam_${tb.key}${i}`, position: [mx + (i - (tb.steam - 1) / 2) * 0.06, top + tb.mugH, mz] });
    const k = 0.8 + tb.mugW * 1.6;
    p.box(0, 0.02 * k, 0, 0.06 * k, 0.05 * k, 0.06 * k, PALETTE.white, { outline: false });
    p.box(0.028 * k, 0.05 * k, 0, 0.045 * k, 0.04 * k, 0.045 * k, PALETTE.white, { outline: false });
    steam.push(p);
  }
  // a stack of content cards, one per delivery: 3 / 14 / 30. Only the core carries an outline,
  // so thin cards don't turn into a dark stripe (that is why the stack lives in the rig).
  const cx = x + 0.34;
  const cz = z - 0.2;
  const ch = 0.0115;
  rig.root.box(cx, top + (tb.cards * ch) / 2, cz, 0.17, tb.cards * ch, 0.13, PALETTE.paper);
  for (let i = 0; i < tb.cards; i++) {
    const j = Math.sin(i * 12.9898) * 0.012;
    rig.root.box(cx + j, top + ch * (i + 0.5), cz - j * 0.6, 0.172, ch - 0.0025, 0.132, tb.cardColors[i % tb.cardColors.length], { ry: j * 6, outline: false });
  }
  // package banner on a gold pole
  const px = x - 0.5;
  const pz = z - 0.33;
  const bw = 0.9;
  S.box(px, top + 0.56, pz, 0.035, 1.12, 0.035, PALETTE.gold);
  S.box(px, top + 1.14, pz, 0.07, 0.07, 0.07, PALETTE.goldDeep);
  S.box(px + bw / 2 + 0.03, top + 1.09, pz, bw + 0.06, 0.028, 0.028, PALETTE.gold);
  const banner = rig.part({ name: `banner_${tb.key}`, position: [px + bw / 2 + 0.03, top + 1.08, pz] });
  for (const sx of [-bw * 0.36, bw * 0.36]) banner.box(sx, -0.035, 0, 0.014, 0.07, 0.014, PALETTE.goldDeep, { outline: false });
  banner.box(0, -0.3, -0.004, bw, bw / 2, 0.022, '#FBF5E8');
  banner.quad(R[`banner_${tb.key}`], 0, -0.3, 0.0075, bw - 0.02, (bw - 0.02) / 2);
  return { tb, lid, pops, steam, banner, spring: createSpring(110, 9) };
}

function buildBoard(S, rig, R) {
  const y0 = BOARD_Y - BOARD_H / 2;
  const y1 = BOARD_Y + BOARD_H / 2;
  S.boxMin(-BOARD_W / 2 - 0.1, y0 - 0.1, -3.99, BOARD_W / 2 + 0.1, y1 + 0.1, -3.95, PALETTE.woodDark);
  S.boxMin(-BOARD_W / 2 - 0.03, y0 - 0.03, -3.99, BOARD_W / 2 + 0.03, y1 + 0.03, -3.94, PALETTE.gold);
  S.boxMin(-BOARD_W / 2, y0, -3.99, BOARD_W / 2, y1, -3.935, BOARD);
  S.boxMin(-BOARD_W / 2 - 0.12, y0 - 0.16, -3.99, BOARD_W / 2 + 0.12, y0 - 0.1, -3.84, PALETTE.woodDark); // chalk ledge
  S.box(-0.9, y0 - 0.085, -3.9, 0.16, 0.03, 0.03, PALETTE.white);
  S.box(-0.62, y0 - 0.085, -3.9, 0.12, 0.03, 0.03, PALETTE.rose);
  rig.root.quad(R.board, 0, BOARD_Y, BOARD_Z + 0.001, BOARD_W, BOARD_H);
  // 3D bars rising from the chalk baseline
  const base = y1 - (262 / 352) * BOARD_H;
  const maxH = 0.52;
  return TABLES.map((tb, i) => {
    const bx = ((i - 1) * BOARD_W) / 3;
    const hgt = Math.max(0.05, (maxH * tb.cards) / 30);
    const bar = rig.part({ name: `bar_${tb.key}`, position: [bx, base, BOARD_Z] });
    bar.boxMin(-0.17, 0, 0, 0.17, hgt, 0.07, tb.bar);
    bar.boxMin(-0.17, hgt - 0.012, 0.0, 0.17, hgt, 0.072, PALETTE.white, { outline: false });
    const cap = rig.part({ name: `cap_${tb.key}`, parent: bar, position: [0, hgt + 0.09, 0.08] });
    cap.quad(R.sparkle, 0, 0, 0, 0.15, 0.15);
    const spring = createSpring(130, 10);
    spring.x = 1; // full height from the start; they regrow when Maya steps up
    return { bar, cap, spring, delay: 0 };
  });
}

function buildCounter(S, rig, R, room) {
  const cx = 2.55;
  const cz = -3.6;
  room.place(counter({ w: 1.6, d: 0.62, h: 0.98, top: PALETTE.gold, body: PALETTE.maroon, panel: PALETTE.cream }), cx, cz);
  const top = 0.98;
  rig.root.quad(R.coffee, cx, 0.57, cz + 0.31 + 0.025, 0.66, 0.24);
  // espresso machine
  const ex = 2.08;
  S.box(ex, top + 0.2, cz - 0.05, 0.4, 0.4, 0.32, PALETTE.bronze);
  S.box(ex, top + 0.41, cz - 0.05, 0.42, 0.03, 0.34, PALETTE.goldDeep);
  S.box(ex, top + 0.27, cz + 0.13, 0.3, 0.08, 0.06, PALETTE.ink);
  S.box(ex, top + 0.22, cz + 0.16, 0.06, 0.05, 0.06, PALETTE.ink);
  S.box(ex, top + 0.02, cz + 0.12, 0.34, 0.04, 0.12, PALETTE.ink);
  S.box(ex + 0.1, top + 0.08, cz + 0.13, 0.07, 0.07, 0.07, MUG);
  S.box(ex - 0.1, top + 0.08, cz + 0.13, 0.07, 0.07, 0.07, MUG);
  for (let i = 0; i < 3; i++) S.box(ex - 0.12 + i * 0.12, top + 0.44, cz - 0.1, 0.07, 0.04, 0.07, MUG);
  // cake stand
  const kx = 3.0;
  S.box(kx, top + 0.06, cz, 0.06, 0.12, 0.06, PALETTE.gold);
  S.box(kx, top + 0.125, cz, 0.36, 0.015, 0.36, PALETTE.white);
  S.box(kx, top + 0.18, cz, 0.24, 0.1, 0.24, PALETTE.cream);
  S.box(kx, top + 0.19, cz, 0.245, 0.025, 0.245, PALETTE.rose);
  S.box(kx, top + 0.245, cz, 0.04, 0.04, 0.04, PALETTE.maroon);
  // cup tower
  for (let i = 0; i < 4; i++) S.box(2.55, top + 0.04 + i * 0.07, cz + 0.02, 0.09 - i * 0.005, 0.06, 0.09 - i * 0.005, i % 2 ? PALETTE.cream : MUG);
  // wall rail and two pendant lamps that sway
  S.boxMin(1.85, 2.88, -3.99, 3.3, 2.94, -3.88, PALETTE.gold);
  const lamps = [];
  for (const lx of [1.98, 3.14]) {
    S.box(lx, 2.91, -3.75, 0.05, 0.05, 0.3, PALETTE.goldDeep);
    const lamp = rig.part({ name: 'pendant', position: [lx, 2.9, -3.6] });
    lamp.box(0, -0.31, 0, 0.022, 0.62, 0.022, PALETTE.goldDeep, { outline: false });
    lamp.box(0, -0.66, 0, 0.12, 0.08, 0.12, PALETTE.maroon);
    lamp.box(0, -0.74, 0, 0.24, 0.09, 0.24, PALETTE.maroon);
    lamp.box(0, -0.82, 0, 0.32, 0.07, 0.32, PALETTE.maroon);
    lamp.box(0, -0.86, 0, 0.33, 0.02, 0.33, PALETTE.gold);
    lamp.quad(R.bulb, 0, -0.9, 0.12, 0.2, 0.2, { color: '#FFE7A8' });
    lamps.push(lamp);
    rig.root.quad(R.pool, lx, top + 0.004, cz, 0.6, 0.45, { rx: -Math.PI / 2, color: '#FFE9B8' });
  }
  const steam = [];
  for (let i = 0; i < 3; i++) {
    const p = rig.part({ name: `esteam${i}`, position: [ex + 0.16, top + 0.45, cz - 0.05] });
    p.box(0, 0, 0, 0.06, 0.05, 0.06, PALETTE.white, { outline: false });
    p.box(-0.02, 0.03, 0, 0.045, 0.04, 0.045, PALETTE.white, { outline: false });
    steam.push(p);
  }
  // two bar stools
  for (const sx of [2.15, 2.95]) {
    S.box(sx, 0.02, -2.78, 0.3, 0.04, 0.3, PALETTE.goldDeep);
    S.box(sx, 0.3, -2.78, 0.06, 0.56, 0.06, PALETTE.goldDeep);
    S.box(sx, 0.28, -2.78, 0.24, 0.025, 0.24, PALETTE.gold);
    S.box(sx, 0.6, -2.78, 0.34, 0.05, 0.34, PALETTE.woodDark);
    S.box(sx, 0.64, -2.78, 0.3, 0.04, 0.3, PALETTE.maroon);
  }
  return { lamps, steam };
}

function buildIconShelf(S, rig, R) {
  const cx = -2.62;
  const cz = -3.62;
  const w = 1.36;
  const d = 0.48;
  const h = 0.56;
  S.boxMin(cx - w / 2, 0, cz - d / 2, cx + w / 2, h, cz + d / 2, PALETTE.wood);
  S.boxMin(cx - w / 2 - 0.02, h - 0.04, cz - d / 2 - 0.02, cx + w / 2 + 0.02, h, cz + d / 2 + 0.02, PALETTE.woodDark);
  for (const k of [-1, 1]) {
    S.boxMin(cx + k * 0.33 - 0.29, 0.07, cz + d / 2, cx + k * 0.33 + 0.29, h - 0.1, cz + d / 2 + 0.012, PALETTE.cream);
    S.box(cx + k * 0.07, 0.3, cz + d / 2 + 0.02, 0.03, 0.08, 0.02, PALETTE.gold);
  }
  const cube = (p, x, y, z, s, kind, ry = 0) => {
    const bg = { heart: PALETTE.rose, play: PALETTE.maroon, chat: PALETTE.gold, plane: PALETTE.skyTop, hash: PALETTE.ink, star: PALETTE.paper }[kind];
    p.box(x, y, z, s, s, s, bg, { ry });
    const off = s / 2 + 0.003;
    p.quad(R[`icon_${kind}`], x + Math.sin(ry) * off, y, z + Math.cos(ry) * off, s * 0.98, s * 0.98, { ry, lit: true });
  };
  // resting blocks on the shelf
  cube(rig.root, cx - 0.44, h + 0.16, cz + 0.02, 0.32, 'heart', 0.12);
  cube(rig.root, cx - 0.08, h + 0.15, cz + 0.06, 0.3, 'play', -0.1);
  cube(rig.root, cx - 0.27, h + 0.45, cz + 0.02, 0.27, 'star', 0.22);
  // floating blocks (bob and turn)
  const floaters = [
    ['chat', cx + 0.34, h + 0.5, cz + 0.1, 0.3],
    ['plane', cx + 0.62, h + 0.86, cz + 0.06, 0.27],
    ['hash', cx + 0.12, h + 0.98, cz - 0.02, 0.25],
  ].map(([kind, x, y, z, s], i) => {
    const p = rig.part({ name: `float_${kind}`, position: [x, y, z] });
    cube(p, 0, 0, 0, s, kind);
    return { p, phase: i * 2.1 };
  });
  // the calendar on the wall above (its top sheet lifts in a breeze)
  const kx = cx;
  const ky = 1.78;
  S.boxMin(kx - 0.42, ky - 0.5, -3.99, kx + 0.42, ky + 0.5, -3.965, PALETTE.woodDark);
  rig.root.quad(R.calendar, kx, ky - 0.03, -3.962, 0.76, 0.76 * (236 / 200));
  for (const rx of [-0.24, 0, 0.24]) {
    S.box(kx + rx, ky + 0.43, -3.95, 0.05, 0.08, 0.03, PALETTE.gold);
  }
  const sheet = rig.part({ name: 'calSheet', position: [kx, ky + 0.42, -3.955] });
  sheet.quad(R.calendar, 0, -0.45, 0.0005, 0.76, 0.76 * (236 / 200));
  return { floaters, sheet };
}

function buildStringLights(S, rig, R) {
  const bulbs = [];
  const hooks = [-3.3, -1.65, 0, 1.65, 3.3];
  for (let k = 0; k < hooks.length - 1; k++) {
    const a = hooks[k];
    const b = hooks[k + 1];
    const n = 5;
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const x = a + (b - a) * u;
      const y = 2.5 - Math.sin(u * Math.PI) * 0.1;
      const pt = [x, y, -3.86];
      if (prev) S.add(UNIT_BOX, PALETTE.ink, segmentMatrix(prev, pt, 0.012));
      prev = pt;
      if (i > 0 && i < n) {
        const p = rig.part({ name: 'fairy', position: [x, y - 0.045, -3.85] });
        p.quad(R.bulb, 0, 0, 0, 0.12, 0.12, { color: i % 2 ? '#FFE3A0' : '#FFD2C0' });
        bulbs.push(p);
      }
    }
    S.box(a, 2.5, -3.9, 0.05, 0.05, 0.08, PALETTE.gold);
  }
  S.box(3.3, 2.5, -3.9, 0.05, 0.05, 0.08, PALETTE.gold);
  return bulbs;
}

const AFRAME = { x: -1.78, z: 3.12 };

function buildAFrame(S, rig, R) {
  const { x, z } = AFRAME;
  const lean = 0.17;
  const hgt = 1.0;
  const legY = hgt / 2;
  for (const sx of [-0.33, 0.33]) {
    S.add(UNIT_BOX, PALETTE.woodDark, boxMatrix(x + sx, legY, z + 0.085, 0.05, hgt * 1.02, 0.04, -lean));
    S.add(UNIT_BOX, PALETTE.woodDark, boxMatrix(x + sx, legY, z - 0.085, 0.05, hgt * 1.02, 0.04, lean));
  }
  S.add(UNIT_BOX, PALETTE.wood, boxMatrix(x, legY + 0.04, z + 0.07, 0.62, 0.78, 0.025, -lean));
  S.add(UNIT_BOX, PALETTE.wood, boxMatrix(x, legY + 0.04, z - 0.07, 0.62, 0.78, 0.025, lean));
  S.box(x, hgt - 0.01, z, 0.7, 0.04, 0.06, PALETTE.gold);
  const face = rig.part({ name: 'aframeFace', position: [x, legY + 0.04, z + 0.07], rotation: [-lean, 0, 0] });
  face.quad(R.aframe, 0, 0, 0.0135, 0.58, 0.58 * (300 / 240));
}

const LOUNGE = { x: 2.52, z: 2.92 };

/** A small lounge corner by the door: low round table, two poufs, a latte and a notebook. */
function buildLounge(S, rig, R) {
  const { x, z } = LOUNGE;
  S.box(x, 0.02, z, 0.36, 0.04, 0.36, PALETTE.woodDark);
  S.box(x, 0.18, z, 0.08, 0.3, 0.08, PALETTE.woodDark);
  S.box(x, 0.355, z, 0.62, 0.05, 0.5, WOOD_TOP);
  S.box(x, 0.355, z, 0.5, 0.05, 0.62, WOOD_TOP);
  S.box(x, 0.33, z, 0.58, 0.02, 0.58, PALETTE.gold);
  // latte in a small Writer mug, a notebook with a pen
  S.box(x + 0.12, 0.43, z + 0.08, 0.1, 0.1, 0.1, MUG);
  S.box(x + 0.12, 0.475, z + 0.08, 0.075, 0.012, 0.075, '#C9A27A');
  S.box(x - 0.12, 0.392, z - 0.04, 0.26, 0.024, 0.2, PALETTE.maroon, 0.2);
  S.box(x - 0.12, 0.406, z - 0.04, 0.22, 0.006, 0.17, PALETTE.paper, 0.2);
  S.box(x - 0.1, 0.415, z - 0.02, 0.02, 0.012, 0.2, PALETTE.gold, -0.6);
  // poufs
  for (const [ox, oz, c] of [[-0.6, 0.12, PALETTE.maroon], [0.58, -0.1, PALETTE.gold]]) {
    S.add(new THREE.CylinderGeometry(0.22, 0.24, 0.34, 12), c, boxMatrix(x + ox, 0.17, z + oz, 1, 1, 1));
    S.add(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 12), PALETTE.cream, boxMatrix(x + ox, 0.355, z + oz, 1, 1, 1));
  }
  const steam = rig.part({ name: 'latteSteam', position: [x + 0.12, 0.48, z + 0.08] });
  steam.box(0, 0.03, 0, 0.05, 0.04, 0.05, PALETTE.white, { outline: false });
  return { steam };
}

/* ---------- detail pass: wallpaper, tiles, rug patterns, shelves, menu, cart, small life ---------- */
const NO_LINE = { outline: false };

/** Wallpaper stripes (back + side walls) and raised panels on the back wainscot. Flat, no outlines. */
function addCafeWalls(p) {
  const z = -4.0;
  let i = 0;
  for (let x = -3.46; x < 3.46; x += 0.36, i++) {
    p.boxMin(x, 1.065, z, x + 0.16, 2.88, z + 0.004, '#F1E2C6', NO_LINE);
    p.boxMin(x + 0.255, 1.065, z, x + 0.267, 2.88, z + 0.005, i % 2 ? '#E3C990' : '#EBB9B3', NO_LINE);
  }
  for (const sx of [-1, 1]) {
    for (let zz = -3.9; zz < -0.55; zz += 0.36) p.boxMin(sx * 3.496, 1.065, zz, sx * 3.5, 2.88, zz + 0.16, '#F1E2C6', NO_LINE);
  }
  for (let x = -3.4; x < 3.3; x += 0.7) {
    const x1 = x + 0.58;
    const c = '#B3845A';
    p.boxMin(x, 0.8, z, x1, 0.835, z + 0.012, c, NO_LINE);
    p.boxMin(x, 0.22, z, x1, 0.255, z + 0.012, c, NO_LINE);
    p.boxMin(x, 0.22, z, x + 0.035, 0.835, z + 0.012, c, NO_LINE);
    p.boxMin(x1 - 0.035, 0.22, z, x1, 0.835, z + 0.012, c, NO_LINE);
    p.boxMin(x + 0.035, 0.255, z, x1 - 0.035, 0.8, z + 0.006, '#D6AA79', NO_LINE);
  }
}

/** Grout lines between the floor tiles and small gold-and-maroon diamonds at their corners. */
function addTileDetail(p) {
  for (let k = 1; k < 10; k++) {
    const x = -3.5 + k * 0.7;
    p.boxMin(x - 0.008, 0, -4, x + 0.008, 0.0014, 4, '#CDB892', NO_LINE);
  }
  for (let k = 1; k < 12; k++) {
    const z = -4 + k * 0.7;
    p.boxMin(-3.5, 0, z - 0.008, 3.5, 0.0014, z + 0.008, '#CDB892', NO_LINE);
  }
  for (let i = 1; i < 10; i++) {
    for (let k = 1; k < 12; k++) {
      const x = -3.5 + i * 0.7;
      const z = -4 + k * 0.7;
      p.box(x, 0.0014, z, 0.12, 0.0028, 0.12, PALETTE.gold, { ry: Math.PI / 4, outline: false });
      p.box(x, 0.0018, z, 0.045, 0.0036, 0.045, PALETTE.maroon, { ry: Math.PI / 4, outline: false });
    }
  }
}

/** Rug patterns: an inner border with dots, a medallion in front of the table, front fringe. */
function addRugDetail(p, tb) {
  const { x, z } = tb;
  const ox0 = Math.max(-3.42, x - 0.98);
  const ox1 = Math.min(3.42, x + 0.98);
  const x0 = ox0 + 0.25;
  const x1 = ox1 - 0.25;
  const z0 = z - 0.37;
  const z1 = RUG_FRONT - 0.17;
  const line = tb.key === 'master' ? PALETTE.gold : PALETTE.white;
  const y0 = 0.013;
  const y1 = 0.0146;
  const t = 0.028;
  p.boxMin(x0, y0, z0, x1, y1, z0 + t, line, NO_LINE);
  p.boxMin(x0, y0, z1 - t, x1, y1, z1, line, NO_LINE);
  p.boxMin(x0, y0, z0, x0 + t, y1, z1, line, NO_LINE);
  p.boxMin(x1 - t, y0, z0, x1, y1, z1, line, NO_LINE);
  for (let zz = z0 + 0.22; zz < z1 - 0.1; zz += 0.24) {
    for (const xx of [x0 - 0.08, x1 + 0.08]) p.box(xx, 0.0142, zz, 0.045, 0.0024, 0.045, PALETTE.gold, { ry: Math.PI / 4, outline: false });
  }
  const mz = 0.22;
  [[0.36, line], [0.26, tb.key === 'master' ? '#8E2B38' : tb.rugEdge], [0.15, line], [0.065, PALETTE.maroon]].forEach(([s, c], i) => {
    p.box(x, 0.013 + (i + 1) * 0.0008, mz, s, 0.0016, s, c, { ry: Math.PI / 4, outline: false });
  });
  for (let fx = ox0 + 0.05; fx < ox1 - 0.03; fx += 0.085) p.box(fx, 0.003, RUG_FRONT + 0.035, 0.032, 0.006, 0.07, PALETTE.cream, NO_LINE);
}

/** Little things on each café table: bud vase with a flower, sticky notes, a pen. */
function addTableClutter(S, tb, i) {
  const { x, z } = tb;
  const top = 0.68;
  const vx = x + 0.14;
  const vz = z - 0.27;
  S.box(vx, top + 0.06, vz, 0.06, 0.12, 0.06, PALETTE.cream);
  S.box(vx, top + 0.125, vz, 0.07, 0.012, 0.07, PALETTE.gold);
  S.box(vx, top + 0.17, vz, 0.012, 0.09, 0.012, PALETTE.leafDark);
  S.box(vx + 0.03, top + 0.16, vz, 0.04, 0.02, 0.025, PALETTE.leaf);
  S.box(vx, top + 0.23, vz, 0.065, 0.05, 0.065, [PALETTE.rose, PALETTE.lily, PALETTE.gold][i]);
  S.box(vx, top + 0.255, vz, 0.03, 0.02, 0.03, i === 1 ? PALETTE.gold : PALETTE.white);
  S.box(x - 0.43, top + 0.003, z + 0.29, 0.08, 0.006, 0.08, [PALETTE.rose, '#BFD9EC', PALETTE.gold][i], 0.2);
  S.box(x - 0.36, top + 0.005, z + 0.31, 0.07, 0.006, 0.07, PALETTE.paper, -0.15);
  S.box(x - 0.24, top + 0.008, z + 0.3, 0.014, 0.014, 0.15, PALETTE.maroon, 1.25);
  S.box(x - 0.24 + 0.065, top + 0.008, z + 0.3 + 0.022, 0.016, 0.016, 0.02, PALETTE.gold, 1.25);
}

/** A narrow wall shelf of mugs and jars between the calendar and the board; a trailing plant on top. */
function addMugShelf(S, rig) {
  const x0 = -2.16;
  const x1 = -1.68;
  const zb = -3.99;
  const zf = -3.79;
  for (const sx of [x0, x1 - 0.03]) S.boxMin(sx, 1.1, zb, sx + 0.03, 2.25, zf + 0.01, PALETTE.woodDark);
  for (const y of [1.15, 1.5, 1.85, 2.2]) S.boxMin(x0 - 0.02, y - 0.03, zb, x1 + 0.02, y, zf, PALETTE.wood);
  const mug = (mx, y, c) => {
    S.box(mx, y + 0.045, -3.88, 0.075, 0.09, 0.075, c);
    S.box(mx, y + 0.087, -3.88, 0.08, 0.01, 0.08, PALETTE.gold);
    S.box(mx + 0.05, y + 0.045, -3.88, 0.025, 0.05, 0.015, c);
  };
  mug(-2.07, 1.15, PALETTE.white);
  mug(-1.93, 1.15, PALETTE.rose);
  mug(-1.79, 1.15, PALETTE.maroon);
  const jar = (jx, y, fill, hgt) => {
    S.box(jx, y + hgt / 2, -3.88, 0.1, hgt, 0.1, fill);
    S.box(jx, y + hgt * 0.45, -3.828, 0.08, 0.04, 0.004, PALETTE.paper);
    S.box(jx, y + hgt + 0.015, -3.88, 0.11, 0.03, 0.11, PALETTE.gold);
  };
  jar(-2.06, 1.5, '#5C3A22', 0.17);
  jar(-1.9, 1.5, '#8A8F4E', 0.13);
  jar(-1.78, 1.5, PALETTE.white, 0.1);
  // saucers and a little teapot
  for (let k = 0; k < 4; k++) S.box(-2.06, 1.855 + k * 0.014, -3.88, 0.11, 0.01, 0.11, k % 2 ? PALETTE.cream : PALETTE.white);
  S.box(-1.84, 1.92, -3.88, 0.13, 0.12, 0.11, PALETTE.white);
  S.box(-1.84, 1.99, -3.88, 0.06, 0.03, 0.06, PALETTE.gold);
  S.add(UNIT_BOX, PALETTE.white, segmentMatrix([-1.77, 1.9, -3.88], [-1.72, 1.97, -3.88], 0.025));
  // trailing plant on top: a pot, a leafy crown, and three vines that sway
  S.boxMin(-2.02, 2.2, -3.95, -1.86, 2.32, -3.81, PALETTE.maroon);
  S.boxMin(-2.035, 2.3, -3.965, -1.845, 2.33, -3.795, PALETTE.gold);
  S.box(-1.94, 2.38, -3.88, 0.2, 0.1, 0.16, PALETTE.leaf);
  S.box(-1.98, 2.44, -3.87, 0.11, 0.08, 0.1, PALETTE.leafDark);
  return [[-2.04, 0], [-1.84, 1], [-1.655, 2]].map(([vx, i]) => {
    const v = rig.part({ name: `vine${i}`, position: [vx, 2.34, -3.8] });
    const n = 4 + i;
    for (let k = 0; k < n; k++) {
      v.box((k % 2 ? 0.012 : -0.012), -0.05 - k * 0.075, 0, 0.008, 0.08, 0.008, PALETTE.leafDark, NO_LINE);
      v.box((k % 2 ? 0.03 : -0.03), -0.06 - k * 0.075, 0.01, 0.05, 0.035, 0.035, k % 3 ? PALETTE.leaf : PALETTE.leafDark);
    }
    return v;
  });
}

/** Chalk menu above the counter (between the pendant lamps). */
function addMenuBoard(S, p, R) {
  const mx = 2.56;
  const my = 1.8;
  const mw = 0.86;
  const mh = mw * (190 / 300);
  S.boxMin(mx - mw / 2 - 0.05, my - mh / 2 - 0.05, -4.0, mx + mw / 2 + 0.05, my + mh / 2 + 0.05, -3.966, PALETTE.woodDark);
  S.boxMin(mx - mw / 2 - 0.02, my - mh / 2 - 0.02, -4.0, mx + mw / 2 + 0.02, my + mh / 2 + 0.02, -3.962, PALETTE.gold);
  p.quad(R.menu, mx, my, -3.958, mw, mh);
  S.box(mx - 0.36, my + mh / 2 + 0.06, -3.97, 0.04, 0.04, 0.04, PALETTE.goldDeep);
  S.box(mx + 0.36, my + mh / 2 + 0.06, -3.97, 0.04, 0.04, 0.04, PALETTE.goldDeep);
}

/** Wall clock above the calendar; its hands turn with t. */
function addClock(S, rig, R) {
  const x = -2.62;
  const y = 2.68;
  for (const rz of [0, Math.PI / 4]) S.add(UNIT_BOX, PALETTE.goldDeep, boxMatrix(x, y, -3.985, 0.34, 0.34, 0.03, 0, 0, rz));
  rig.root.quad(R.clock, x, y, -3.966, 0.3, 0.3);
  const hour = rig.part({ name: 'clockHour', position: [x, y, -3.96] });
  hour.box(0, 0.035, 0, 0.018, 0.08, 0.006, PALETTE.ink, NO_LINE);
  const minute = rig.part({ name: 'clockMin', position: [x, y, -3.957] });
  minute.box(0, 0.05, 0, 0.012, 0.11, 0.006, PALETTE.maroon, NO_LINE);
  rig.root.box(x, y, -3.954, 0.022, 0.022, 0.006, PALETTE.gold, NO_LINE);
  return { hour, minute };
}

/** The espresso corner gets gauges, group heads, a grinder, syrup bottles, macarons, a tip jar. */
function addCounterDetail(S, p) {
  const cz = -3.6;
  const top = 0.98;
  const ex = 2.08;
  const front = cz + 0.11;
  for (const sx of [-1, 1]) {
    S.box(ex + sx * 0.1, top + 0.33, front + 0.008, 0.075, 0.075, 0.016, PALETTE.gold);
    S.box(ex + sx * 0.1, top + 0.33, front + 0.018, 0.052, 0.052, 0.004, PALETTE.cream);
    S.box(ex + sx * 0.09, top + 0.2, front + 0.03, 0.07, 0.04, 0.06, PALETTE.goldDeep);
    S.box(ex + sx * 0.09, top + 0.185, front + 0.115, 0.03, 0.03, 0.13, PALETTE.ink);
  }
  S.add(UNIT_BOX, PALETTE.goldDeep, segmentMatrix([ex + 0.22, top + 0.32, cz + 0.02], [ex + 0.27, top + 0.1, cz + 0.12], 0.018));
  for (let i = 0; i < 5; i++) p.box(ex - 0.12 + i * 0.06, top + 0.0415, cz + 0.12, 0.022, 0.003, 0.1, '#6B5A48', NO_LINE);
  const gx = 2.39;
  const gz = -3.74;
  S.box(gx, top + 0.1, gz, 0.12, 0.2, 0.14, PALETTE.maroonDeep);
  S.box(gx, top + 0.24, gz, 0.1, 0.08, 0.1, '#5C3A22');
  S.box(gx, top + 0.29, gz, 0.12, 0.025, 0.12, PALETTE.gold);
  S.box(gx, top + 0.07, gz + 0.09, 0.05, 0.04, 0.05, PALETTE.ink);
  [[2.66, PALETTE.maroon], [2.73, PALETTE.gold], [2.8, '#7A4A2B']].forEach(([bx, c]) => {
    S.box(bx, top + 0.12, -3.84, 0.06, 0.24, 0.06, c);
    S.box(bx, top + 0.27, -3.84, 0.025, 0.06, 0.025, c);
    S.box(bx, top + 0.31, -3.84, 0.035, 0.025, 0.035, PALETTE.ink);
    S.box(bx, top + 0.12, -3.808, 0.045, 0.06, 0.004, PALETTE.cream);
  });
  S.box(2.62, top + 0.008, -3.38, 0.24, 0.016, 0.15, PALETTE.white);
  [PALETTE.rose, '#BFD9EC', PALETTE.gold, '#CFE3B8', PALETTE.rose].forEach((c, i) => {
    S.box(2.53 + i * 0.045, top + 0.031, -3.38 + ((i % 2) - 0.5) * 0.04, 0.038, 0.028, 0.038, c);
  });
  S.box(3.24, top + 0.06, -3.38, 0.08, 0.12, 0.08, '#F3EBDD');
  S.box(3.24, top + 0.125, -3.38, 0.085, 0.012, 0.085, PALETTE.gold);
  S.boxMin(1.75, 0, -3.29, 3.35, 0.07, -3.268, PALETTE.goldDeep);
}

const CART = { x: -2.55, z: 2.33 };

/** A little coffee cart with a striped awning, an urn (it steams), cups and a cookie jar. */
function addCoffeeCart(S, rig, room) {
  const { x, z } = CART;
  const w = 0.62;
  const d = 0.4;
  const h = 0.74;
  S.boxMin(x - w / 2, 0.12, z - d / 2, x + w / 2, h, z + d / 2, PALETTE.maroon);
  S.boxMin(x - w / 2 + 0.05, 0.2, z + d / 2, x + w / 2 - 0.05, h - 0.08, z + d / 2 + 0.012, PALETTE.cream);
  S.boxMin(x - w / 2 + 0.09, 0.24, z + d / 2 + 0.012, x + w / 2 - 0.09, h - 0.12, z + d / 2 + 0.018, '#F6EBD6');
  S.boxMin(x - w / 2 - 0.03, h, z - d / 2 - 0.03, x + w / 2 + 0.03, h + 0.04, z + d / 2 + 0.03, WOOD_TOP);
  S.boxMin(x - w / 2 - 0.01, 0.1, z - d / 2 - 0.01, x + w / 2 + 0.01, 0.14, z + d / 2 + 0.01, PALETTE.gold);
  for (const sx of [-1, 1]) {
    S.add(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 14), PALETTE.ink, boxMatrix(x + sx * (w / 2 + 0.025), 0.1, z, 1, 1, 1, 0, 0, Math.PI / 2));
    S.add(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 8), PALETTE.gold, boxMatrix(x + sx * (w / 2 + 0.03), 0.1, z, 1, 1, 1, 0, 0, Math.PI / 2));
    S.box(x + sx * (w / 2 - 0.03), h + 0.37, z - d / 2 + 0.03, 0.03, 0.72, 0.03, PALETTE.gold);
  }
  S.box(x - w / 2 - 0.08, h - 0.05, z, 0.03, 0.03, d * 0.8, PALETTE.gold);
  for (const sz of [-1, 1]) S.box(x - w / 2 - 0.045, h - 0.05, z + sz * d * 0.38, 0.07, 0.025, 0.025, PALETTE.gold);
  // striped awning sloping toward the front, with a scalloped edge
  const stripes = 6;
  const aw = w + 0.14;
  for (let i = 0; i < stripes; i++) {
    const sx = x - aw / 2 + (aw * (i + 0.5)) / stripes;
    S.add(UNIT_BOX, i % 2 ? PALETTE.cream : PALETTE.maroon, boxMatrix(sx, h + 0.66, z + 0.05, aw / stripes, 0.03, d + 0.2, 0.3, 0, 0));
    S.box(sx, h + 0.53, z + d / 2 + 0.16, aw / stripes - 0.01, 0.06, 0.03, i % 2 ? PALETTE.maroon : PALETTE.cream);
  }
  // urn, cups, cookie jar, a flower
  const ty = h + 0.04;
  S.add(new THREE.CylinderGeometry(0.075, 0.085, 0.26, 12), PALETTE.bronze, boxMatrix(x - 0.15, ty + 0.13, z - 0.04, 1, 1, 1));
  S.add(new THREE.CylinderGeometry(0.065, 0.075, 0.035, 12), PALETTE.gold, boxMatrix(x - 0.15, ty + 0.275, z - 0.04, 1, 1, 1));
  S.box(x - 0.15, ty + 0.31, z - 0.04, 0.03, 0.03, 0.03, PALETTE.goldDeep);
  S.box(x - 0.15, ty + 0.06, z + 0.06, 0.03, 0.03, 0.05, PALETTE.ink);
  for (let k = 0; k < 4; k++) S.box(x + 0.04, ty + 0.03 + k * 0.045, z + 0.06, 0.07 - k * 0.004, 0.04, 0.07 - k * 0.004, k % 2 ? PALETTE.cream : PALETTE.white);
  S.box(x + 0.19, ty + 0.07, z - 0.02, 0.11, 0.14, 0.11, '#F3EBDD');
  S.box(x + 0.19, ty + 0.1, z - 0.02, 0.09, 0.05, 0.09, '#C08A55');
  S.box(x + 0.19, ty + 0.15, z - 0.02, 0.12, 0.025, 0.12, PALETTE.gold);
  S.box(x + 0.21, ty + 0.03, z + 0.13, 0.05, 0.06, 0.05, PALETTE.cream);
  S.box(x + 0.21, ty + 0.1, z + 0.13, 0.01, 0.08, 0.01, PALETTE.leafDark);
  S.box(x + 0.21, ty + 0.15, z + 0.13, 0.05, 0.045, 0.05, PALETTE.rose);
  blockBox(room, x - w / 2 - 0.1, z - d / 2 - 0.04, x + w / 2 + 0.05, z + d / 2 + 0.17);
  const steam = rig.part({ name: 'urnSteam', position: [x - 0.15, ty + 0.34, z - 0.04] });
  steam.box(0, 0.02, 0, 0.05, 0.04, 0.05, PALETTE.white, NO_LINE);
  steam.box(0.02, 0.045, 0, 0.035, 0.03, 0.035, PALETTE.white, NO_LINE);
  return { steam };
}

/** A soft round rug and a stack of magazines in the lounge corner. */
function addLoungeDetail(S, p) {
  const { x, z } = LOUNGE;
  [[1.42, PALETTE.gold], [1.32, '#E7CDB0'], [0.9, PALETTE.rose], [0.8, '#E7CDB0'], [0.36, PALETTE.gold]].forEach(([s, c], i) => {
    const hgt = 0.004 + i * 0.0014; // stepped corners read as a soft, blocky oval
    p.box(x - 0.02, hgt / 2, z - 0.02, s * 0.92, hgt, s * 0.5, c, NO_LINE);
    p.box(x - 0.02, hgt / 2, z - 0.02, s * 0.72, hgt, s * 0.68, c, NO_LINE);
  });
  for (let k = 0; k < 4; k++) S.box(x + 0.62, 0.012 + k * 0.022, z + 0.42, 0.24 - (k % 2) * 0.02, 0.02, 0.18, [PALETTE.maroon, PALETTE.paper, '#BFD9EC', PALETTE.gold][k], (k - 1.5) * 0.12);
}

/** Two paper planes (her Telegram motif) gliding slow loops above the tables. */
function addPaperPlanes(rig) {
  return [0, 1].map((i) => {
    const p = rig.part({ name: `plane${i}`, position: [0, 2.12 - i * 0.22, -1.5 - i * 0.2], scale: 1.5 });
    for (const s of [-1, 1]) {
      p.box(s * 0.022, 0, 0.0, 0.04, 0.008, 0.24, s < 0 ? PALETTE.white : PALETTE.paper, { rz: s * 0.18 });
      p.box(s * 0.062, 0.006, -0.06, 0.05, 0.008, 0.12, s < 0 ? PALETTE.white : PALETTE.paper, { rz: s * 0.18 });
    }
    p.box(0, -0.022, 0.01, 0.008, 0.04, 0.2, PALETTE.cream);
    return { p, phase: i * 2.6, rx: 2.4 - i * 0.55, rz: 1.0 - i * 0.25, speed: 0.34 + i * 0.06 };
  });
}

/** Content & Copywriting interior. ctx is accepted for future options (unused). */
export async function buildInterior(ctx = {}) {
  await fontsReady();
  const room = createRoom({
    width: 7,
    depth: 8,
    wall: '#F7EEDD',
    wainscot: '#C99B6B',
    trim: PALETTE.goldDeep,
    floor: 'tiles',
    floorColor: '#E3D2B2',
    floorColor2: '#F3EAD7',
    background: PALETTE.cream,
  });
  room.id = 'content';

  const atlas = createAtlas();
  const R = drawContentAtlas(atlas);
  const texture = atlas.texture();
  room.textures.push(texture);

  const S = new VoxelBuilder();
  const rig = createRig();

  const tables = TABLES.map((tb) => buildTable(S, rig, R, tb));
  const bars = buildBoard(S, rig, R);
  const cafe = buildCounter(S, rig, R, room);
  const shelf = buildIconShelf(S, rig, R);
  const fairy = buildStringLights(S, rig, R);
  buildAFrame(S, rig, R);
  const lounge = buildLounge(S, rig, R);
  room.place(plant({ size: 1.35 }), -3.05, -1.75);
  room.place(plant({ size: 1.35 }), 3.05, -1.75);
  room.place(plant({ size: 1.0 }), -3.06, 3.36);
  // detail pass (flat overlays live in the rig without outlines; solid props bake with S)
  addCafeWalls(rig.root);
  addTileDetail(rig.root);
  for (const tb of TABLES) addRugDetail(rig.root, tb);
  TABLES.forEach((tb, i) => addTableClutter(S, tb, i));
  const vines = addMugShelf(S, rig);
  addMenuBoard(S, rig.root, R);
  const clock = addClock(S, rig, R);
  addCounterDetail(S, rig.root);
  const cart = addCoffeeCart(S, rig, room);
  addLoungeDetail(S, rig.root);
  const planes = addPaperPlanes(rig);

  // soft contact shadows (unlit layer, no extra draw calls)
  for (const tb of TABLES) floorShadow(rig, R.shadow, tb.x, tb.z, 1.45, 1.1, 0.016);
  floorShadow(rig, R.shadow, LOUNGE.x, LOUNGE.z, 1.5, 1.0, 0.012);
  floorShadow(rig, R.shadow, CART.x, CART.z + 0.05, 1.0, 0.75);
  floorShadow(rig, R.shadow, -2.62, -3.5, 1.7, 0.8);
  floorShadow(rig, R.shadow, 2.55, -3.45, 2.0, 0.85);
  for (const sx of [2.15, 2.95]) floorShadow(rig, R.shadow, sx, -2.78, 0.55, 0.55);
  for (const [px, pz, s] of [[-3.05, -1.75, 0.8], [3.05, -1.75, 0.8], [-3.06, 3.36, 0.62]]) floorShadow(rig, R.shadow, px, pz, s, s);
  floorShadow(rig, R.shadow, AFRAME.x, AFRAME.z, 0.95, 0.6);

  const staticMesh = S.mesh({ outline: true, px: 1.5 });
  staticMesh.name = 'cafeStatic';
  room.group.add(staticMesh);
  const built = rig.build({ atlas, texture });
  room.group.add(built.mesh);

  for (const tb of TABLES) blockBox(room, tb.x - 0.55, tb.z - 0.39, tb.x + 0.55, tb.z + 0.39);
  blockBox(room, LOUNGE.x - 0.84, LOUNGE.z - 0.34, LOUNGE.x + 0.82, LOUNGE.z + 0.36);
  for (const sx of [2.15, 2.95]) blockCircle(room, sx, -2.78, 0.2);
  blockBox(room, -3.3, -3.86, -1.94, -3.38);
  blockBox(room, AFRAME.x - 0.36, AFRAME.z - 0.15, AFRAME.x + 0.36, AFRAME.z + 0.15);

  for (const s of STATIONS) room.addStation({ ...s, look: { ...s.look }, line: { ...s.line } });
  const reactions = STATIONS.map((s) => ({ id: s.id, spring: createSpring(150, 13) }));
  const springOf = (id) => reactions.find((r) => r.id === id).spring;
  const tableSprings = tables.map((tbl) => springOf(tbl.tb.id));
  const compareSpring = springOf('cc-compare');
  let compareWas = 0;

  room.bake();

  const animate = (dt, t, state) => {
    for (let i = 0; i < reactions.length; i++) stepSpring(reactions[i].spring, stationTarget(state, reactions[i].id), dt, 0.18);

    // Tables: the banner swings, the mug steams (more steam for bigger packages), and when
    // Maya comes close the laptop wakes up and likes pop out of the screen.
    for (let i = 0; i < tables.length; i++) {
      const tbl = tables[i];
      const k = Math.max(0, tableSprings[i].x);
      const wake = stepSpring(tbl.spring, k, dt);
      tbl.banner.rot(Math.sin(t * 1.3 + i) * 0.03, 0, Math.sin(t * 1.1 + i * 1.7) * 0.05 + (wake - k) * 0.4);
      tbl.lid.rot(-0.12 * wake, 0, 0);
      for (let j = 0; j < tbl.pops.length; j++) {
        const p = frac(t * 0.7 + j * 0.5);
        tbl.pops[j].move(0, p * 0.4, 0).size(clamp01(wake * 1.8) * Math.sin(p * Math.PI)).rot(0, 0, Math.sin(t * 3 + j) * 0.2);
      }
      for (let j = 0; j < tbl.steam.length; j++) {
        const p = frac(t * 0.5 + j / tbl.steam.length + i * 0.13);
        tbl.steam[j].move(Math.sin(p * 7 + j) * 0.025, p * 0.36, 0).size((0.45 + p) * Math.sin(p * Math.PI) * (1 + k * 0.6));
      }
    }

    // Compare board: when Maya steps up, the bars regrow one after another with a bounce.
    const kc = compareSpring.last;
    if (kc > 0 && compareWas === 0) for (let i = 0; i < bars.length; i++) {
      bars[i].spring.x = 0.06;
      bars[i].spring.v = 0;
      bars[i].delay = 0.12 + i * 0.16;
    }
    compareWas = kc;
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      if (b.delay > 0) b.delay -= dt;
      const v = stepSpring(b.spring, b.delay > 0 ? 0.06 : 1, dt);
      b.bar.size(1, Math.max(0.04, v), 1);
      b.cap.size(clamp01(v) * (0.75 + 0.25 * Math.sin(t * 3 + i))).rot(0, 0, t * 0.8 + i);
    }

    // Café life: pendant lamps sway, the espresso machine steams, fairy lights twinkle.
    for (let i = 0; i < cafe.lamps.length; i++) cafe.lamps[i].rot(Math.sin(t * 0.9 + i * 2) * 0.03, 0, Math.sin(t * 0.7 + i * 1.3) * 0.05);
    for (let i = 0; i < cafe.steam.length; i++) {
      const p = frac(t * 0.45 + i / cafe.steam.length);
      cafe.steam[i].move(Math.sin(p * 6 + i) * 0.03, p * 0.45, 0).size((0.5 + p) * Math.sin(p * Math.PI));
    }
    {
      const p = frac(t * 0.5);
      lounge.steam.move(Math.sin(p * 6) * 0.02, p * 0.3, 0).size((0.5 + p) * Math.sin(p * Math.PI));
    }
    for (let i = 0; i < fairy.length; i++) {
      const c = 0.5 + 0.5 * Math.sin(t * 2.3 + i * 1.7);
      fairy[i].size(0.7 + 0.4 * c * c);
    }

    // Social blocks bob and turn; the calendar's top page lifts in a little breeze.
    for (let i = 0; i < shelf.floaters.length; i++) {
      const f = shelf.floaters[i];
      f.p.move(0, Math.sin(t * 1.4 + f.phase) * 0.05, 0).rot(Math.sin(t * 0.9 + f.phase) * 0.08, Math.sin(t * 0.6 + f.phase) * 0.45, 0);
    }
    {
      const p = frac(t / 6.5);
      const lift = p < 0.25 ? Math.sin((p / 0.25) * Math.PI) : 0;
      shelf.sheet.rot(-0.55 * lift * easeOut(Math.min(1, p * 8)), 0, 0);
    }

    // Detail life: vines sway, the clock ticks, the urn steams, two paper planes glide loops.
    for (let i = 0; i < vines.length; i++) vines[i].rot(Math.sin(t * 0.9 + i * 1.7) * 0.05, 0, Math.sin(t * 1.1 + i * 2.3) * 0.09);
    clock.minute.rot(0, 0, -Math.floor(t) * ((Math.PI * 2) / 60) - 0.6);
    clock.hour.rot(0, 0, -t * ((Math.PI * 2) / 720) - 2.1);
    {
      const p = frac(t * 0.45);
      cart.steam.move(Math.sin(p * 6) * 0.025, p * 0.32, 0).size((0.5 + p) * Math.sin(p * Math.PI));
    }
    for (let i = 0; i < planes.length; i++) {
      const f = planes[i];
      const a = t * f.speed + f.phase;
      const s = Math.sin(a);
      const c = Math.cos(a);
      // nose follows the climb, wings bank into the turn
      f.p.move(c * f.rx, Math.sin(a * 2) * 0.1, s * f.rz).rot(-Math.cos(a * 2) * 0.12, Math.atan2(-s * f.rx, c * f.rz), 0.32);
    }
  };
  room.animators.push(animate);

  chainDispose(room, () => built.dispose());
  return room;
}
