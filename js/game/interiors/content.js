// E-Book Boutique (E-Book စာအုပ်ဆိုင်): Maya's warm, cozy showcase for "အမှန်မြင်ခြင်း / Reality Check" E-Book.
//   - West (`eb-preview`): illuminated wooden reading lectern with an open glowing Chapter 1 digital book;
//   - Center (`eb-buy`): grand tiered maroon-velvet & gold showcase pedestal with Maya's real Reality Check
//     cover inside a glowing e-reader frame, KPay instant-unlock badge, and orbiting golden sparkles;
//   - East (`eb-read`): cozy returning-reader nook with walnut sync desk, plush maroon armchair, brass floor lamp;
//   - Back (`eb-chapters`): ornate antique-gold framed 23-chapter gallery board (Part 1 Ch. 1-11 & Part 2 Ch. 12-23)
//     with animated golden chapter-progress bars, flanked by carved bookshelves & warm pendant lamps;
//   - Story Mode Day 15 compatible: clear reception/tea counter (x: 2.06..3.38, top y = 0.98) beside Ko Phyo's
//     brazier space (x = 1.7, z = -3.4), cozy low lounge table (x = 2.58, z = 2.86, top y = 0.38) with two 0.30 m
//     floor poufs, and two 0.45 m reading armchairs for seated guests.
// Shared building blocks (canvas atlas, skinned "rig" for moving props, springs) live in scripts.js.
import { THREE, PALETTE, VoxelBuilder, createRoom, plant, counter } from './kit.js';
import { fontsReady, FONT_SERIF } from '../toon.js';
import { artTexture, artMaterial, ART_SIZE } from '../art.js';
import { mergeGeometries } from '../three.js';
import {
  createAtlas, createRig, drawSparkle, drawGlow, drawShadow, fillRound, strokeRound, floorShadow,
  UNIT_BOX, boxMatrix, segmentMatrix, createSpring, stepSpring, stationTarget, frac, clamp01,
  blockBox, chainDispose,
} from './scripts.js';

const WOOD_WARM = '#8A5A2B';
const WOOD_TOP = '#BE8F5E';
const EINK = '#FFF4D2';
const BOARD = '#2B1B1E';
const NO_LINE = { outline: false };

const COVER_ASPECT = ART_SIZE.book[0] / ART_SIZE.book[1];

const BOARD_X = -1.1;
const BOARD_Y = 1.64;
const BOARD_W = 2.94;
const BOARD_H = 1.47;
const BOARD_Z = -3.93;

const LECTERN = { x: -2.4, z: -0.78 };
const SHOWCASE = { x: 0, z: -0.68 };
const NOOK_DESK = { x: 2.02, z: -0.82 };
const NOOK_CHAIR = { x: 2.76, z: -0.82, ry: -0.4 };
const WEST_CHAIR = { x: -2.86, z: 2.1, ry: 0.55 };
const AFRAME = { x: -1.68, z: 3.16 };
const LOUNGE = { x: 2.58, z: 2.86 };
const COUNTER = { x: 2.72, z: -3.62, w: 1.32, d: 0.62, h: 0.98 };

const STATIONS = [
  {
    id: 'eb-preview', x: -2.4, z: 0.7, look: { x: -2.4, z: -0.78 }, emote: 'nod', face: 'smile', labelY: 1.95,
    line: { my: 'အခန်း (၁) ကို အခမဲ့ မြည်းစမ်းဖတ်ကြည့်လို့ ရပါတယ်ရှင့်', en: 'Try reading Chapter 1 for free right here!' },
  },
  {
    id: 'eb-buy', x: 0, z: 0.85, look: { x: 0, z: -0.68 }, emote: 'cheer', face: 'star', labelY: 2.15,
    line: { my: 'အမှန်မြင်ခြင်း E-Book လေးကို ဒီမှာ ဝယ်ယူပြီး ချက်ချင်း ဖတ်လို့ရပါတယ်ရှင့်', en: 'Buy the Reality Check E-Book here and start reading right away!' },
  },
  {
    id: 'eb-read', x: 2.35, z: 0.7, look: { x: 2.45, z: -0.75 }, emote: 'phone', face: 'happy', labelY: 1.95,
    line: { my: 'ဝယ်ပြီးသားဆိုရင် ဖုန်းဘယ်လုံးကနေမဆို ဝင်ပြီး ဆက်ဖတ်လို့ ရပါတယ်နော်', en: 'Already bought it? Sign in from any phone to continue reading!' },
  },
  {
    id: 'eb-chapters', x: -1.1, z: -2.1, look: { x: -1.1, z: BOARD_Z }, emote: 'point', face: 'smile', labelY: 1.48,
    line: { my: 'အပိုင်း ၂ ပိုင်း၊ အခန်း ၂၃ ခန်းလုံး ဒီမှာ စုံစုံလင်လင် ရှိပါတယ်ရှင့်', en: 'All 23 chapters across Part 1 and Part 2 are right here!' },
  },
];

// ---------- canvas atlas (single 1024x1024 sheet for every sign, screen & glow) ----------
function drawChaptersBoard(A, r) {
  const g = A.g;
  const { x, y, w, h } = r;
  g.fillStyle = BOARD;
  g.fillRect(x, y, w, h);
  strokeRound(g, x + 8, y + 8, w - 16, h - 16, 12, PALETTE.gold, 3);
  strokeRound(g, x + 15, y + 15, w - 30, h - 30, 8, 'rgba(201,162,74,0.35)', 1.5);

  A.text(x + 36, y + 14, w - 72, 54, [{ text: 'အမှန်မြင်ခြင်း · အခန်း (၂၃) ခန်း', size: 32, color: EINK }]);
  A.text(x + 36, y + 60, w - 72, 34, [{ text: 'Reality Check  —  Part 1 & Part 2  ·  112 Pages', size: 22, font: FONT_SERIF, weight: 600, color: '#E8C878' }]);
  g.fillStyle = 'rgba(201,162,74,0.6)';
  g.fillRect(x + 42, y + 96, w - 84, 2);
  g.fillRect(x + w / 2 - 1, y + 108, 2, h - 142);

  // Left column: Part 1 (Ch. 1 - 11)
  const colW = w / 2 - 42;
  A.text(x + 26, y + 102, colW, 42, [{ text: 'အပိုင်း (၁) · အခန်း ၁–၁၁', size: 22, color: '#F2D58A' }]);
  for (let i = 0; i < 6; i++) {
    const ry = y + 148 + i * 24;
    const isFree = i === 0;
    fillRound(g, x + 36, ry, colW - 22, 16, 5, isFree ? 'rgba(201,162,74,0.32)' : 'rgba(246,240,226,0.12)');
    g.fillStyle = isFree ? PALETTE.gold : '#C7A97C';
    g.fillRect(x + 42, ry + 5, (colW - 60) * (isFree ? 0.88 : 0.52 + ((i * 37) % 35) / 100), 6);
  }
  fillRound(g, x + 36, y + 296, 134, 24, 12, PALETTE.gold);
  A.text(x + 36, y + 294, 134, 28, [{ text: 'အခန်း (၁) အခမဲ့', size: 15, color: PALETTE.ink }]);

  // Right column: Part 2 (Ch. 12 - 23)
  const rx = x + w / 2 + 16;
  A.text(rx, y + 102, colW, 42, [{ text: 'အပိုင်း (၂) · အခန်း ၁၂–၂၃', size: 22, color: '#F2D58A' }]);
  for (let i = 0; i < 6; i++) {
    const ry = y + 148 + i * 24;
    fillRound(g, rx + 10, ry, colW - 22, 16, 5, 'rgba(246,240,226,0.12)');
    g.fillStyle = i === 5 ? '#E8A0A8' : '#D9B66B';
    g.fillRect(rx + 16, ry + 5, (colW - 60) * (0.56 + ((i * 29 + 11) % 34) / 100), 6);
  }
  A.text(rx + 6, y + 292, colW - 12, 32, [{ text: 'စာမျက်နှာ ၁၁၂ · KPay ချက်ချင်းဖတ်', size: 16, color: '#EADCC2' }]);

  drawSparkle(g, x + 32, y + 40, 12, PALETTE.gold, '#FFF8DF');
  drawSparkle(g, x + w - 32, y + 40, 12, PALETTE.gold, '#FFF8DF');
}

function drawAFrame(A, r) {
  const g = A.g;
  fillRound(g, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 22, '#FBF5E8');
  strokeRound(g, r.x + 7, r.y + 7, r.w - 14, r.h - 14, 18, PALETTE.goldDeep, 5);
  strokeRound(g, r.x + 15, r.y + 15, r.w - 30, r.h - 30, 12, 'rgba(201,162,74,0.45)', 2);
  A.text(r.x + 14, r.y + 22, r.w - 28, 56, [{ text: 'E-Book ဆိုင်', size: 34, color: PALETTE.maroon }]);
  A.text(r.x + 14, r.y + 74, r.w - 28, 48, [{ text: 'အမှန်မြင်ခြင်း', size: 28, color: PALETTE.ink }]);
  A.text(r.x + 14, r.y + 116, r.w - 28, 42, [{ text: 'Reality Check', size: 30, font: FONT_SERIF, weight: 600, color: PALETTE.goldDeep }]);
  // Illustrated open glowing e-book emblem
  const cx = r.x + r.w / 2;
  const cy = r.y + 212;
  fillRound(g, cx - 64, cy - 34, 128, 72, 10, PALETTE.maroon);
  strokeRound(g, cx - 64, cy - 34, 128, 72, 10, PALETTE.gold, 4);
  fillRound(g, cx - 54, cy - 26, 51, 56, 4, EINK);
  fillRound(g, cx + 3, cy - 26, 51, 56, 4, EINK);
  g.fillStyle = PALETTE.gold;
  g.fillRect(cx - 2, cy - 28, 4, 60);
  g.fillStyle = '#9C7B56';
  for (let i = 0; i < 4; i++) {
    g.fillRect(cx - 46, cy - 16 + i * 11, 35 - (i % 2) * 8, 4);
    g.fillRect(cx + 11, cy - 16 + i * 11, 35 - ((i + 1) % 2) * 8, 4);
  }
  drawSparkle(g, cx, cy - 48, 13, PALETTE.gold, '#FFF8DF');
  drawSparkle(g, r.x + 36, r.y + 266, 9, PALETTE.gold);
  drawSparkle(g, r.x + r.w - 36, r.y + 266, 9, PALETTE.gold);
}

function drawPreviewScreen(A, r) {
  const g = A.g;
  const { x, y, w, h } = r;
  g.fillStyle = EINK;
  g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(138,90,43,0.16)';
  g.fillRect(x + w / 2 - 4, y, 8, h);
  g.fillStyle = PALETTE.gold;
  g.fillRect(x + w / 2 - 1, y, 2, h);
  strokeRound(g, x + 6, y + 6, w / 2 - 12, h - 12, 6, 'rgba(201,162,74,0.55)', 2);
  strokeRound(g, x + w / 2 + 6, y + 6, w / 2 - 12, h - 12, 6, 'rgba(201,162,74,0.55)', 2);
  // Left e-ink page: Chapter 1 title
  A.text(x + 10, y + 18, w / 2 - 20, 38, [{ text: 'အခန်း (၁)', size: 22, color: PALETTE.maroon }]);
  A.text(x + 10, y + 54, w / 2 - 20, 40, [{ text: 'ကျွန်မသည် သိုးမည်း', size: 16, color: PALETTE.ink }]);
  fillRound(g, x + 22, y + 104, w / 2 - 44, 24, 12, PALETTE.maroon);
  A.text(x + 22, y + 102, w / 2 - 44, 28, [{ text: 'အခမဲ့ မြည်းစမ်း', size: 13, color: EINK }]);
  drawSparkle(g, x + w / 4, y + 150, 10, PALETTE.gold);
  // Right e-ink page: crisp simulated reading lines
  const rx = x + w / 2 + 16;
  const rw = w / 2 - 32;
  g.fillStyle = PALETTE.maroon;
  g.fillRect(rx, y + 20, rw * 0.55, 6);
  g.fillStyle = '#7E654B';
  const lens = [0.95, 0.88, 0.92, 0.72, 0.96, 0.84, 0.9, 0.62];
  lens.forEach((f, i) => g.fillRect(rx, y + 36 + i * 14, rw * f, 5));
  g.fillStyle = PALETTE.gold;
  g.fillRect(rx, y + h - 22, rw * 0.4, 4);
}

function drawReadScreen(A, r) {
  const g = A.g;
  const { x, y, w, h } = r;
  g.fillStyle = '#FBF4E4';
  g.fillRect(x, y, w, h);
  g.fillStyle = PALETTE.maroon;
  g.fillRect(x, y, w, 54);
  A.text(x + 8, y + 4, w - 16, 46, [{ text: 'အမှန်မြင်ခြင်း', size: 20, color: EINK }]);
  A.text(x + 8, y + 60, w - 16, 36, [{ text: 'ဝယ်ပြီးသား ဝင်ဖတ်', size: 16, color: PALETTE.maroon }]);
  // Simulated phone + PIN input cards
  fillRound(g, x + 16, y + 100, w - 32, 26, 8, PALETTE.white);
  strokeRound(g, x + 16, y + 100, w - 32, 26, 8, PALETTE.gold, 2);
  g.fillStyle = '#B8A080';
  g.fillRect(x + 26, y + 111, w - 76, 5);
  fillRound(g, x + 16, y + 134, w - 32, 26, 8, PALETTE.white);
  strokeRound(g, x + 16, y + 134, w - 32, 26, 8, PALETTE.gold, 2);
  for (let i = 0; i < 4; i++) {
    g.fillStyle = PALETTE.maroon;
    g.beginPath();
    g.arc(x + 36 + i * 22, y + 147, 4, 0, Math.PI * 2);
    g.fill();
  }
  fillRound(g, x + 22, y + 172, w - 44, 32, 16, PALETTE.gold);
  A.text(x + 22, y + 171, w - 44, 34, [{ text: 'ဆက်ဖတ်မယ်', size: 15, color: PALETTE.ink }]);
  drawSparkle(g, x + w - 18, y + 18, 7, PALETTE.gold);
}

function drawWallPlaque(A, r) {
  const g = A.g;
  const { x, y, w, h } = r;
  fillRound(g, x + 2, y + 2, w - 4, h - 4, 16, PALETTE.maroon);
  strokeRound(g, x + 6, y + 6, w - 12, h - 12, 12, PALETTE.gold, 4);
  A.text(x + 16, y + 12, w - 32, 54, [{ text: 'E-Book စာအုပ်ဆိုင်', size: 28, color: EINK }]);
  g.fillStyle = 'rgba(201,162,74,0.65)';
  g.fillRect(x + 42, y + 68, w - 84, 2);
  A.text(x + 12, y + 74, w - 24, 44, [{ text: 'KPay ဖြင့် ချက်ချင်းဝယ်ယူ', size: 19, color: '#F2D58A' }]);
  A.text(x + 12, y + 118, w - 24, 42, [{ text: 'ဖုန်းဘယ်လုံးမဆို ဖတ်နိုင်', size: 18, color: '#F6EEDC' }]);
  drawSparkle(g, x + 24, y + 32, 8, PALETTE.gold);
  drawSparkle(g, x + w - 24, y + 32, 8, PALETTE.gold);
}

function drawStationBanner(A, r, titleMy, subEn) {
  const g = A.g;
  fillRound(g, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 14, '#FBF5E8');
  strokeRound(g, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 11, PALETTE.gold, 4);
  A.text(r.x + 8, r.y + 6, r.w - 16, 56, [{ text: titleMy, size: 25, color: PALETTE.maroon }]);
  A.text(r.x + 8, r.y + 58, r.w - 16, 44, [{ text: subEn, size: 22, font: FONT_SERIF, weight: 600, color: PALETTE.goldDeep }]);
}

function drawKpayBadge(A, r) {
  const g = A.g;
  const { x, y, w, h } = r;
  fillRound(g, x + 2, y + 2, w - 4, h - 4, 14, '#184A8C');
  strokeRound(g, x + 5, y + 5, w - 10, h - 10, 11, PALETTE.gold, 4);
  A.text(x + 8, y + 6, w - 16, 54, [{ text: 'KPay', size: 34, font: FONT_SERIF, weight: 700, color: '#FFFFFF' }]);
  fillRound(g, x + 16, y + 64, w - 32, 32, 10, PALETTE.gold);
  A.text(x + 16, y + 62, w - 32, 36, [{ text: 'ချက်ချင်းဖတ်', size: 17, color: PALETTE.ink }]);
  drawSparkle(g, x + w - 22, y + 24, 8, '#FFE59A');
}

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

function drawBoutiqueAtlas(A) {
  const g = A.g;
  const R = A.pack({
    chapters: [680, 340],
    aframe: [240, 300],
    screen_read: [160, 220],
    screen_preview: [260, 180],
    wall_plaque: [280, 176],
    sign_preview: [230, 110],
    sign_buy: [230, 110],
    sign_read: [230, 110],
    kpay_badge: [160, 110],
    pool: [112, 112],
    clock: [96, 96],
    eink_glow: [96, 96],
    sparkle: [88, 88],
    shadow: [88, 88],
    counter_sign: [240, 84],
    bulb: [64, 64],
  });

  drawChaptersBoard(A, R.chapters);
  drawAFrame(A, R.aframe);
  drawPreviewScreen(A, R.screen_preview);
  drawReadScreen(A, R.screen_read);
  drawWallPlaque(A, R.wall_plaque);
  drawStationBanner(A, R.sign_preview, 'အခမဲ့ မြည်းစမ်း', 'Free Chapter 1');
  drawStationBanner(A, R.sign_buy, 'အမှန်မြင်ခြင်း E-Book', 'Buy & Read Now');
  drawStationBanner(A, R.sign_read, 'ဝယ်ပြီးသား ဝင်ဖတ်', 'Any Phone · Sign In');
  drawKpayBadge(A, R.kpay_badge);
  drawClock(A, R.clock);

  {
    const r = R.counter_sign;
    fillRound(g, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 16, PALETTE.maroon);
    strokeRound(g, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 13, PALETTE.gold, 4);
    A.text(r.x + 26, r.y + 2, r.w - 52, r.h - 4, [{ text: 'E-Book ကောင်တာ', size: 24, color: EINK }]);
    drawSparkle(g, r.x + 20, r.y + r.h / 2, 8, PALETTE.gold);
    drawSparkle(g, r.x + r.w - 20, r.y + r.h / 2, 8, PALETTE.gold);
  }

  drawSparkle(g, R.sparkle.x + 44, R.sparkle.y + 44, 40, PALETTE.gold, '#FFF8DF');
  drawGlow(g, R.bulb, 'rgba(255,255,250,1)', 'rgba(255,224,140,0.9)', 0.36);
  drawGlow(g, R.eink_glow, 'rgba(255,244,210,0.75)', 'rgba(255,214,120,0.32)', 0.45);
  {
    const r = R.pool;
    const grd = g.createRadialGradient(r.x + 56, r.y + 56, 0, r.x + 56, r.y + 56, 56);
    grd.addColorStop(0, 'rgba(255,240,200,0.62)');
    grd.addColorStop(0.6, 'rgba(255,232,180,0.24)');
    grd.addColorStop(1, 'rgba(255,232,180,0)');
    g.fillStyle = grd;
    g.fillRect(r.x, r.y, r.w, r.h);
  }
  drawShadow(g, R.shadow);
  return R;
}

// ---------- reusable boutique furniture helpers ----------
function buildRug(p, x0, x1, z0, z1, base, edge, accent) {
  p.boxMin(x0, 0, z0, x1, 0.008, z1, edge, NO_LINE);
  p.boxMin(x0 + 0.08, 0, z0 + 0.08, x1 - 0.08, 0.013, z1 - 0.08, base, NO_LINE);
  const ix0 = x0 + 0.2, ix1 = x1 - 0.2, iz0 = z0 + 0.2, iz1 = z1 - 0.2;
  const t = 0.024;
  p.boxMin(ix0, 0.013, iz0, ix1, 0.0145, iz0 + t, accent, NO_LINE);
  p.boxMin(ix0, 0.013, iz1 - t, ix1, 0.0145, iz1, accent, NO_LINE);
  p.boxMin(ix0, 0.013, iz0, ix0 + t, 0.0145, iz1, accent, NO_LINE);
  p.boxMin(ix1 - t, 0.013, iz0, ix1, 0.0145, iz1, accent, NO_LINE);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2 + 0.16;
  p.box(cx, 0.014, cz, 0.34, 0.002, 0.34, accent, { ry: Math.PI / 4, outline: false });
  p.box(cx, 0.0146, cz, 0.18, 0.002, 0.18, edge, { ry: Math.PI / 4, outline: false });
  for (let fx = x0 + 0.06; fx < x1 - 0.04; fx += 0.09) {
    p.box(fx, 0.003, z1 + 0.032, 0.03, 0.005, 0.065, PALETTE.cream, NO_LINE);
  }
}

/** Plush velvet reading armchair with seat cushion top at EXACTLY y = 0.45 m (matches Day 15 seated NPCs!). */
function buildArmchair(S, x, z, ry, body = PALETTE.maroon, cushion = '#8E2936') {
  const v = new VoxelBuilder();
  // Turned walnut legs
  for (const sx of [-0.28, 0.28]) {
    for (const sz of [-0.26, 0.26]) v.box(sx, 0.1, sz, 0.07, 0.2, 0.07, PALETTE.woodDark);
  }
  // Base apron + seat deck + plush seat cushion ending cleanly at y = 0.45
  v.boxMin(-0.36, 0.18, -0.34, 0.36, 0.35, 0.32, body);
  v.boxMin(-0.27, 0.35, -0.25, 0.27, 0.45, 0.33, cushion);
  v.boxMin(-0.26, 0.438, 0.31, 0.26, 0.452, 0.335, PALETTE.gold);
  // Rolled armrests + gold front trim studs
  for (const sx of [-1, 1]) {
    const ax0 = sx < 0 ? -0.38 : 0.26;
    const ax1 = sx < 0 ? -0.26 : 0.38;
    v.boxMin(ax0, 0.35, -0.34, ax1, 0.62, 0.32, body);
    v.boxMin(ax0 - 0.015, 0.6, -0.35, ax1 + 0.015, 0.66, 0.34, PALETTE.maroonDeep);
    v.box(sx * 0.32, 0.48, 0.33, 0.045, 0.045, 0.018, PALETTE.gold);
  }
  // Stepped tufted backrest (on -Z in local frame, so facing forward keeps camera sightline open)
  v.boxMin(-0.36, 0.35, -0.36, 0.36, 0.96, -0.22, body);
  v.boxMin(-0.32, 0.96, -0.34, 0.32, 1.04, -0.23, PALETTE.maroonDeep);
  v.boxMin(-0.34, 0.94, -0.23, 0.34, 0.98, -0.205, PALETTE.gold);
  // Cozy cream lumbar accent pillow tucked against backrest
  v.box(0.1, 0.56, -0.17, 0.24, 0.2, 0.08, PALETTE.cream, -0.15);
  const m = new THREE.Matrix4().makeRotationY(ry).setPosition(x, 0, z);
  S.merge(v, m);
}

// ---------- Station 1: West Illuminated Free-Preview Lectern (eb-preview) ----------
function buildPreviewLectern(S, rig, R) {
  const { x, z } = LECTERN;
  buildRug(rig.root, -3.26, -1.56, -1.42, 1.32, '#E7C0B8', PALETTE.gold, PALETTE.white);

  // Carved wooden lectern base & pedestal
  S.box(x, 0.04, z, 0.72, 0.08, 0.56, PALETTE.woodDark);
  S.box(x, 0.1, z, 0.62, 0.05, 0.46, PALETTE.goldDeep);
  S.box(x, 0.48, z - 0.02, 0.26, 0.72, 0.24, WOOD_WARM);
  S.box(x, 0.48, z + 0.105, 0.14, 0.52, 0.02, PALETTE.maroon);
  S.box(x, 0.48, z + 0.118, 0.06, 0.06, 0.015, PALETTE.gold);
  S.box(x, 0.86, z, 0.46, 0.08, 0.36, PALETTE.gold);

  // Tilted reading desk + lip + open glowing digital tablet-book
  const tilt = 0.32;
  S.add(UNIT_BOX, WOOD_WARM, boxMatrix(x, 0.96, z, 0.82, 0.06, 0.56, tilt));
  S.add(UNIT_BOX, PALETTE.gold, boxMatrix(x, 0.89, z + 0.25, 0.84, 0.04, 0.05, tilt));
  // Open e-reader tablet casing resting flush on the slanted lectern
  const tablet = rig.part({ name: 'previewTablet', position: [x, 0.99, z + 0.01], rotation: [tilt, 0, 0] });
  tablet.box(0, 0.02, 0, 0.7, 0.04, 0.46, PALETTE.maroon);
  tablet.box(0, 0.042, 0, 0.66, 0.016, 0.42, PALETTE.ink);
  tablet.quad(R.screen_preview, 0, 0.053, 0, 0.61, 0.39, { rx: -Math.PI / 2 });
  tablet.quad(R.eink_glow, 0, 0.058, 0, 0.88, 0.64, { rx: -Math.PI / 2 });

  // Clip-on curved brass gooseneck reading lamp above lectern
  S.box(x - 0.28, 1.18, z - 0.24, 0.03, 0.32, 0.03, PALETTE.goldDeep);
  S.box(x - 0.16, 1.34, z - 0.16, 0.28, 0.03, 0.03, PALETTE.gold);
  S.box(x, 1.34, z - 0.08, 0.26, 0.07, 0.12, PALETTE.maroon);
  S.box(x, 1.31, z - 0.08, 0.28, 0.02, 0.14, PALETTE.gold);
  rig.root.quad(R.bulb, x, 1.27, z - 0.04, 0.18, 0.18, { color: '#FFE7A8' });

  // Hanging gold "Free Ch. 1" banner on a slim brass pole beside lectern
  const px = x - 0.44, pz = z - 0.26;
  S.box(px, 0.9, pz, 0.032, 1.8, 0.032, PALETTE.gold);
  S.box(px, 1.82, pz, 0.065, 0.065, 0.065, PALETTE.goldDeep);
  S.box(px + 0.44, 1.76, pz, 0.88, 0.026, 0.026, PALETTE.gold);
  const banner = rig.part({ name: 'previewBanner', position: [px + 0.44, 1.75, pz] });
  banner.box(0, -0.24, -0.004, 0.8, 0.38, 0.022, '#FBF5E8');
  banner.quad(R.sign_preview, 0, -0.24, 0.008, 0.78, 0.37);

  // Floating glowing golden page & 2 sparkles rising softly above the open tablet
  const page = rig.part({ name: 'previewPage', position: [x, 1.2, z] });
  page.box(0, 0, 0, 0.18, 0.012, 0.24, EINK, { outline: false });
  page.box(0, 0.008, -0.04, 0.12, 0.004, 0.02, PALETTE.gold, { outline: false });
  const spks = [0, 1].map((i) => {
    const p = rig.part({ name: `previewSpk${i}`, position: [x + (i ? 0.28 : -0.26), 1.32 + i * 0.12, z + 0.06] });
    p.quad(R.sparkle, 0, 0, 0, 0.16, 0.16);
    return p;
  });

  return { tablet, banner, page, spks, spring: createSpring(120, 10) };
}

// ---------- Station 2: Center Grand Reality Check E-Book Showcase (eb-buy) ----------
function buildShowcasePedestal(S, rig, R, coverQuads) {
  const { x, z } = SHOWCASE;
  buildRug(rig.root, -0.94, 0.94, -1.32, 1.44, PALETTE.maroon, PALETTE.gold, '#F6E8C4');

  // Stepped velvet-and-gold dais (y = 0..0.14)
  S.boxMin(x - 0.56, 0, z - 0.44, x + 0.56, 0.07, z + 0.44, PALETTE.woodDark);
  S.boxMin(x - 0.52, 0.07, z - 0.4, x + 0.52, 0.11, z + 0.4, PALETTE.gold);
  S.boxMin(x - 0.48, 0.11, z - 0.36, x + 0.48, 0.14, z + 0.36, PALETTE.maroon);

  // Sculpted cream, maroon-velvet & gold display plinth (y = 0.14..0.84)
  S.box(x, 0.19, z - 0.02, 0.78, 0.1, 0.62, PALETTE.gold);
  S.box(x, 0.49, z - 0.02, 0.66, 0.52, 0.52, PALETTE.paper);
  S.box(x, 0.49, z + 0.245, 0.54, 0.36, 0.018, PALETTE.maroon);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) S.box(x + sx * 0.33, 0.49, z - 0.02 + sz * 0.26, 0.06, 0.52, 0.06, PALETTE.gold);
  }
  S.box(x, 0.79, z - 0.02, 0.82, 0.09, 0.66, PALETTE.gold);
  S.box(x, 0.85, z - 0.02, 0.72, 0.04, 0.56, PALETTE.maroon);
  // Front showcase sign plaque
  rig.root.quad(R.sign_buy, x, 0.49, z + 0.258, 0.5, 0.24);

  // Hero Reality Check E-Book Tablet Edition resting on an illuminated golden cradle
  const tilt = -0.14;
  const CW = 0.54;
  const CH = CW / COVER_ASPECT; // 0.8289 m
  const cy = 1.32;
  const cz = z - 0.06;
  const cradleM = new THREE.Matrix4().compose(
    new THREE.Vector3(x, cy, cz),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, 0, 0)),
    new THREE.Vector3(1, 1, 1),
  );
  const tab = new VoxelBuilder();
  tab.box(0, 0, -0.028, CW + 0.08, CH + 0.08, 0.056, PALETTE.ink);
  const b = 0.042;
  tab.box(0, CH / 2 + b / 2, 0.005, CW + b * 2 + 0.02, b, 0.068, PALETTE.gold);
  tab.box(0, -CH / 2 - b / 2, 0.005, CW + b * 2 + 0.02, b, 0.068, PALETTE.gold);
  tab.box(-CW / 2 - b / 2, 0, 0.005, b, CH + 0.02, 0.068, PALETTE.gold);
  tab.box(CW / 2 + b / 2, 0, 0.005, b, CH + 0.02, 0.068, PALETTE.gold);
  // Soft warm e-ink halo border on the bezel edge & gold home-dot
  tab.box(0, -CH / 2 - b * 0.5, 0.04, 0.09, 0.018, 0.008, EINK);
  S.merge(tab, cradleM);
  // Real Reality Check cover quad (merged into ONE artQuads mesh!)
  coverQuads.push({
    w: CW,
    h: CH,
    m: new THREE.Matrix4().multiplyMatrices(cradleM, new THREE.Matrix4().makeTranslation(0, 0, 0.006)),
  });
  // Support cradle ledge & rear gold easel strut
  S.box(x, 0.885, z + 0.03, CW + 0.14, 0.05, 0.14, PALETTE.goldDeep);
  S.add(UNIT_BOX, PALETTE.goldDeep, boxMatrix(x, 1.12, z - 0.24, 0.1, 0.52, 0.04, 0.28));

  // KPay Instant-Unlock Badge on miniature easel beside the hero tablet
  const kx = x + 0.32, kz = z + 0.2;
  S.add(UNIT_BOX, PALETTE.goldDeep, boxMatrix(kx, 0.96, kz, 0.26, 0.19, 0.024, -0.22, -0.25, 0));
  const kpayM = rig.part({ name: 'kpayBadge', position: [kx, 0.96, kz], rotation: [-0.22, -0.25, 0] });
  kpayM.quad(R.kpay_badge, 0, 0, 0.014, 0.24, 0.165);

  // Warm ambient glow halo behind the showcase tablet & overhead golden sparkles
  const aura = rig.part({ name: 'buyAura', position: [x, cy + 0.04, cz - 0.08] });
  aura.quad(R.eink_glow, 0, 0, 0, 1.25, 1.45);
  rig.root.quad(R.pool, x, 0.875, z + 0.04, 0.9, 0.65, { rx: -Math.PI / 2, color: '#FFE9B8' });

  const spks = [0, 1, 2].map((i) => {
    const p = rig.part({ name: `buySpk${i}`, position: [x, cy + 0.18, cz] });
    p.quad(R.sparkle, 0, 0, 0, 0.19, 0.19);
    return p;
  });
  return { aura, spks, kpayM, spring: createSpring(120, 10) };
}

// ---------- Station 3: East Returning-Reader Nook (eb-read) ----------
function buildReadingNook(S, rig, R) {
  buildRug(rig.root, 1.54, 3.36, -1.56, 1.32, '#C8DCEA', PALETTE.gold, PALETTE.white);

  // Walnut reading desk (x: 2.02, z: -0.82, top y = 0.68)
  const { x: dx, z: dz } = NOOK_DESK;
  const top = 0.68;
  S.box(dx, 0.03, dz, 0.44, 0.06, 0.44, PALETTE.woodDark);
  S.box(dx, 0.34, dz, 0.11, 0.58, 0.11, PALETTE.woodDark);
  S.box(dx, top - 0.025, dz, 0.56, 0.05, 0.54, WOOD_TOP);
  S.box(dx, top - 0.055, dz, 0.52, 0.024, 0.5, PALETTE.gold);

  // Tilted smartphone / reader sync dock on the desk (wakes up on approach!)
  S.box(dx - 0.04, top + 0.015, dz - 0.02, 0.24, 0.03, 0.18, PALETTE.goldDeep);
  const phone = rig.part({ name: 'readPhone', position: [dx - 0.04, top + 0.03, dz - 0.04], rotation: [-0.24, 0.18, 0] });
  phone.box(0, 0.16, -0.012, 0.22, 0.32, 0.024, PALETTE.ink);
  phone.box(0, 0.16, -0.015, 0.24, 0.34, 0.014, PALETTE.gold);
  phone.quad(R.screen_read, 0, 0.16, 0.002, 0.195, 0.27);

  // Sync sparkle icons popping gently over the reader phone
  const syncSpks = [0, 1].map((i) => {
    const p = rig.part({ name: `syncSpk${i}`, parent: phone, position: [i ? 0.12 : -0.12, 0.34, 0.04] });
    p.quad(R.sparkle, 0, 0, 0, 0.14, 0.14);
    return p;
  });

  // Mini book stack + brass candle dish on the desk beside the phone
  S.box(dx + 0.16, top + 0.02, dz + 0.12, 0.18, 0.04, 0.14, PALETTE.maroon, 0.16);
  S.box(dx + 0.15, top + 0.055, dz + 0.12, 0.16, 0.03, 0.12, PALETTE.cream, -0.1);
  S.box(dx - 0.16, top + 0.025, dz + 0.16, 0.08, 0.05, 0.08, PALETTE.gold);
  S.box(dx - 0.16, top + 0.058, dz + 0.16, 0.05, 0.02, 0.05, EINK);

  // Plush maroon velvet reading armchair (seat top = 0.45 m — Day 15 khinmayMid sits right here!)
  buildArmchair(S, NOOK_CHAIR.x, NOOK_CHAIR.z, NOOK_CHAIR.ry);

  // Tall warm brass floor lamp behind the armchair (x = 3.16, z = -1.36)
  const lx = 3.16, lz = -1.36;
  S.box(lx, 0.03, lz, 0.32, 0.06, 0.32, PALETTE.bronze);
  S.box(lx, 0.075, lz, 0.22, 0.03, 0.22, PALETTE.gold);
  S.box(lx, 0.92, lz, 0.048, 1.66, 0.048, PALETTE.goldDeep);
  S.box(lx, 1.76, lz, 0.1, 0.06, 0.1, PALETTE.gold);
  S.box(lx, 1.9, lz, 0.38, 0.28, 0.38, '#FBF3E0');
  S.box(lx, 2.04, lz, 0.32, 0.04, 0.32, PALETTE.maroon);
  S.box(lx, 1.76, lz, 0.4, 0.025, 0.4, PALETTE.gold);
  rig.root.quad(R.bulb, lx, 1.72, lz + 0.14, 0.26, 0.26, { color: '#FFE7A8' });
  rig.root.quad(R.pool, lx - 0.3, 0.018, lz + 0.42, 1.25, 1.15, { rx: -Math.PI / 2, color: '#FFE9B8' });

  // Hanging gold "Continue Reading" sign banner on slim stand behind desk
  const bx = 1.84, bz = -1.24;
  S.box(bx, 0.88, bz, 0.032, 1.76, 0.032, PALETTE.gold);
  S.box(bx, 1.78, bz, 0.065, 0.065, 0.065, PALETTE.goldDeep);
  S.box(bx + 0.42, 1.72, bz, 0.84, 0.026, 0.026, PALETTE.gold);
  const banner = rig.part({ name: 'readBanner', position: [bx + 0.42, 1.71, bz] });
  banner.box(0, -0.22, -0.004, 0.78, 0.37, 0.022, '#FBF5E8');
  banner.quad(R.sign_read, 0, -0.22, 0.008, 0.76, 0.36);

  return { phone, syncSpks, banner, spring: createSpring(120, 10) };
}

// ---------- Station 4: Back-Wall 23-Chapter Gallery Board & Credenza (eb-chapters) ----------
function buildChaptersGallery(S, rig, R, coverQuads) {
  const x0 = BOARD_X - BOARD_W / 2;
  const x1 = BOARD_X + BOARD_W / 2;
  const y0 = BOARD_Y - BOARD_H / 2;
  const y1 = BOARD_Y + BOARD_H / 2;

  // Ornate dark-wood & gold gallery frame + corner rosettes
  S.boxMin(x0 - 0.1, y0 - 0.1, -3.99, x1 + 0.1, y1 + 0.1, -3.945, PALETTE.woodDark);
  S.boxMin(x0 - 0.035, y0 - 0.035, -3.99, x1 + 0.035, y1 + 0.035, -3.938, PALETTE.gold);
  S.boxMin(x0, y0, -3.99, x1, y1, -3.934, BOARD);
  for (const sx of [x0 - 0.06, x1 + 0.06]) {
    for (const sy of [y0 - 0.06, y1 + 0.06]) S.box(sx, sy, -3.93, 0.12, 0.12, 0.05, PALETTE.goldDeep);
  }
  // Brass gallery picture-light bar across top of the board
  S.box(BOARD_X, y1 + 0.15, -3.86, 1.4, 0.04, 0.08, PALETTE.gold);
  for (const gx of [-0.46, 0.46]) S.box(BOARD_X + gx, y1 + 0.15, -3.92, 0.04, 0.04, 0.14, PALETTE.goldDeep);
  rig.root.quad(R.bulb, BOARD_X - 0.36, y1 + 0.12, -3.82, 0.22, 0.16, { color: '#FFE7A8' });
  rig.root.quad(R.bulb, BOARD_X + 0.36, y1 + 0.12, -3.82, 0.22, 0.16, { color: '#FFE7A8' });
  rig.root.quad(R.chapters, BOARD_X, BOARD_Y, BOARD_Z + 0.002, BOARD_W, BOARD_H);

  // Two 3D animated golden chapter-ribbon bars (Part 1 & Part 2) + spinning stars
  const partBars = [
    { key: 'p1', bx: BOARD_X - 0.72, color: PALETTE.gold },
    { key: 'p2', bx: BOARD_X + 0.72, color: '#E8A0A8' },
  ].map((pb) => {
    const bar = rig.part({ name: `chapBar_${pb.key}`, position: [pb.bx, y0 + 0.18, BOARD_Z + 0.01] });
    bar.box(0, 0, 0.015, 0.96, 0.032, 0.025, pb.color);
    const star = rig.part({ name: `chapStar_${pb.key}`, parent: bar, position: [0.52, 0.01, 0.03] });
    star.quad(R.sparkle, 0, 0, 0, 0.14, 0.14);
    const spring = createSpring(130, 10);
    spring.x = 1;
    return { bar, star, spring, delay: 0 };
  });

  // Low walnut display credenza under the board (stops at x = +0.34 so Ko Phyo's brazier at x = 1.7 is wide open!)
  const cx0 = -2.56, cx1 = 0.34, ch = 0.56;
  S.boxMin(cx0, 0, -3.98, cx1, ch, -3.56, WOOD_WARM);
  S.boxMin(cx0 - 0.02, ch - 0.04, -3.98, cx1 + 0.02, ch, -3.54, PALETTE.woodDark);
  S.boxMin(cx0, 0, -3.56, cx1, 0.06, -3.545, PALETTE.goldDeep);
  for (let i = 0; i < 3; i++) {
    const px = cx0 + 0.48 + i * 0.96;
    S.box(px, ch * 0.5, -3.555, 0.82, 0.36, 0.014, PALETTE.cream);
    S.box(px, ch * 0.52, -3.542, 0.08, 0.025, 0.018, PALETTE.gold);
  }
  // Keepsake book stack + mini easel with real cover on credenza top
  const bookCols = [PALETTE.maroon, PALETTE.gold, '#2F5A4C', PALETTE.cream];
  for (let i = 0; i < 4; i++) {
    S.box(-2.12 + (i % 2) * 0.02, ch + 0.022 + i * 0.044, -3.76, 0.28, 0.04, 0.2, bookCols[i], (i - 1.5) * 0.08);
  }
  // Mini framed Reality Check display copy on credenza right
  const mw = 0.22, mh = mw / COVER_ASPECT;
  const miniM = new THREE.Matrix4().compose(
    new THREE.Vector3(-0.08, ch + mh / 2 + 0.03, -3.74),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.18, -0.22, 0)),
    new THREE.Vector3(1, 1, 1),
  );
  const mb = new VoxelBuilder();
  mb.box(0, 0, -0.014, mw + 0.03, mh + 0.03, 0.028, PALETTE.gold);
  S.merge(mb, miniM);
  coverQuads.push({ w: mw, h: mh, m: new THREE.Matrix4().multiplyMatrices(miniM, new THREE.Matrix4().makeTranslation(0, 0, 0.005)) });
  // Small decorative open golden bookends in the middle of the credenza
  for (let k = 0; k < 5; k++) {
    S.box(-1.38 + k * 0.09, ch + 0.12, -3.76, 0.075, 0.24 - (k % 2) * 0.03, 0.18, bookCols[(k + 1) % 4]);
  }
  S.box(-1.46, ch + 0.08, -3.76, 0.04, 0.16, 0.16, PALETTE.gold);
  S.box(-0.92, ch + 0.08, -3.76, 0.04, 0.16, 0.16, PALETTE.gold);

  return partBars;
}

// ---------- Back-Left Carved Bookcase, Ivy Vine, Wall Clock & High Shelf ----------
function buildBackLeftShelf(S, rig, R) {
  const x0 = -3.44, x1 = -2.66, zb = -3.99, zf = -3.56;
  const h = 2.02;
  S.boxMin(x0, 0, zb, x1, h, zb + 0.04, PALETTE.woodDark);
  for (const sx of [x0, x1 - 0.05]) S.boxMin(sx, 0, zb, sx + 0.05, h, zf, WOOD_WARM);
  S.boxMin(x0 - 0.02, h, zb, x1 + 0.02, h + 0.06, zf + 0.03, PALETTE.gold);
  const spines = [PALETTE.maroon, PALETTE.goldDeep, '#2F5DB3', '#3E6B4F', PALETTE.cream, '#8E5A3C', PALETTE.ink];
  const shelfYs = [0.14, 0.52, 0.9, 1.28, 1.66];
  shelfYs.forEach((sy, rIdx) => {
    S.boxMin(x0, sy - 0.03, zb, x1, sy, zf, WOOD_WARM);
    S.boxMin(x0, sy - 0.015, zf - 0.006, x1, sy, zf + 0.008, PALETTE.gold);
    let bx = x0 + 0.08;
    for (let k = 0; k < 8 && bx < x1 - 0.12; k++) {
      const bw = 0.055 + ((rIdx * 3 + k) % 3) * 0.014;
      const bh = 0.21 + ((rIdx * 5 + k * 7) % 4) * 0.028;
      S.boxMin(bx, sy, zb + 0.06, bx + bw, sy + bh, zf - 0.04, spines[(rIdx * 4 + k) % spines.length]);
      if ((k + rIdx) % 2 === 0) S.boxMin(bx + 0.006, sy + bh * 0.72, zf - 0.04, bx + bw - 0.006, sy + bh * 0.78, zf - 0.034, PALETTE.gold);
      bx += bw + 0.012;
    }
  });
  // Potted trailing ivy vine on top of the bookcase
  const px = (x0 + x1) / 2;
  S.box(px, h + 0.12, -3.76, 0.18, 0.14, 0.18, PALETTE.maroon);
  S.box(px, h + 0.2, -3.76, 0.21, 0.03, 0.21, PALETTE.gold);
  S.box(px, h + 0.26, -3.76, 0.24, 0.12, 0.2, PALETTE.leaf);
  const vines = [px - 0.12, px + 0.12].map((vx, i) => {
    const v = rig.part({ name: `vine${i}`, position: [vx, h + 0.2, -3.65] });
    for (let k = 0; k < 4 + i; k++) {
      v.box(k % 2 ? 0.012 : -0.012, -0.05 - k * 0.075, 0, 0.008, 0.08, 0.008, PALETTE.leafDark, NO_LINE);
      v.box(k % 2 ? 0.03 : -0.03, -0.06 - k * 0.075, 0.01, 0.05, 0.035, 0.035, k % 2 ? PALETTE.leaf : PALETTE.leafDark);
    }
    return v;
  });

  // Boutique wall clock cleanly above bookcase
  const cx = -3.05, cy = 2.66;
  for (const rz of [0, Math.PI / 4]) S.add(UNIT_BOX, PALETTE.goldDeep, boxMatrix(cx, cy, -3.985, 0.34, 0.34, 0.03, 0, 0, rz));
  rig.root.quad(R.clock, cx, cy, -3.966, 0.3, 0.3);
  const hour = rig.part({ name: 'clockHour', position: [cx, cy, -3.96] });
  hour.box(0, 0.035, 0, 0.018, 0.08, 0.006, PALETTE.ink, NO_LINE);
  const minute = rig.part({ name: 'clockMin', position: [cx, cy, -3.957] });
  minute.box(0, 0.05, 0, 0.012, 0.11, 0.006, PALETTE.maroon, NO_LINE);
  rig.root.box(cx, cy, -3.954, 0.022, 0.022, 0.006, PALETTE.gold, NO_LINE);

  // High floating display wall shelves above the brazier bay (x: 0.72..1.72, y: 1.66 & 2.08 — completely above floor!)
  for (const sy of [1.66, 2.08]) {
    S.boxMin(0.72, sy - 0.03, -3.99, 1.68, sy, -3.76, WOOD_WARM);
    S.boxMin(0.72, sy - 0.015, -3.77, 1.68, sy, -3.752, PALETTE.gold);
  }
  for (let i = 0; i < 6; i++) S.box(0.84 + i * 0.09, 1.79, -3.86, 0.07, 0.24 - (i % 2) * 0.03, 0.16, spines[i % spines.length]);
  S.box(1.5, 1.74, -3.86, 0.12, 0.14, 0.12, PALETTE.cream);
  S.box(1.5, 1.82, -3.86, 0.13, 0.025, 0.13, PALETTE.gold);
  S.box(0.96, 2.18, -3.86, 0.24, 0.18, 0.04, PALETTE.maroon);
  S.box(0.96, 2.18, -3.835, 0.18, 0.12, 0.01, EINK);
  for (let i = 0; i < 4; i++) S.box(1.26 + i * 0.085, 2.2, -3.86, 0.068, 0.22 - (i % 2) * 0.04, 0.16, spines[(i + 2) % spines.length]);

  return { vines, clock: { hour, minute } };
}

// ---------- Back-Right Boutique Reception & Tea Counter (Day 15 breadTray compatible!) ----------
function buildReceptionCounter(S, rig, R, room) {
  const { x: cx, z: cz, w, d, h: top } = COUNTER;
  room.place(counter({ w, d, h: top, top: PALETTE.gold, body: PALETTE.maroon, panel: PALETTE.cream }), cx, cz);
  S.boxMin(cx - w / 2, 0, cz + d / 2, cx + w / 2, 0.07, cz + d / 2 + 0.02, PALETTE.goldDeep);
  rig.root.quad(R.counter_sign, cx, 0.56, cz + d / 2 + 0.025, 0.72, 0.25);

  // Left half of counter top (x: 2.12..2.56): sleek boutique register tablet, service bell & bud vase.
  // Right half (x: 2.66..3.34) stays completely flat & open at y = 0.98 for Day 15's bread tray at (3.0, 0.98, -3.55)!
  const tx = 2.26;
  S.box(tx, top + 0.02, cz - 0.02, 0.28, 0.04, 0.2, PALETTE.woodDark);
  S.add(UNIT_BOX, PALETTE.ink, boxMatrix(tx, top + 0.15, cz - 0.05, 0.28, 0.2, 0.024, -0.32));
  S.add(UNIT_BOX, EINK, boxMatrix(tx, top + 0.15, cz - 0.036, 0.23, 0.15, 0.008, -0.32));
  // Tiny brass boutique bell
  S.box(2.5, top + 0.015, cz + 0.14, 0.09, 0.03, 0.09, PALETTE.goldDeep);
  S.box(2.5, top + 0.045, cz + 0.14, 0.07, 0.04, 0.07, PALETTE.gold);
  S.box(2.5, top + 0.07, cz + 0.14, 0.024, 0.02, 0.024, PALETTE.goldDeep);
  // Small bud vase with a rose on back-left corner
  S.box(2.14, top + 0.06, cz - 0.22, 0.07, 0.12, 0.07, PALETTE.cream);
  S.box(2.14, top + 0.16, cz - 0.22, 0.015, 0.08, 0.015, PALETTE.leafDark);
  S.box(2.14, top + 0.22, cz - 0.22, 0.07, 0.055, 0.07, PALETTE.rose);

  // Wall plaque above the counter (sits cleanly below the high pendant lamps so all text reads clearly)
  const my = 1.56, mw = 0.88, mh = mw * (176 / 280);
  S.boxMin(cx - mw / 2 - 0.05, my - mh / 2 - 0.05, -4.0, cx + mw / 2 + 0.05, my + mh / 2 + 0.05, -3.965, PALETTE.woodDark);
  S.boxMin(cx - mw / 2 - 0.02, my - mh / 2 - 0.02, -4.0, cx + mw / 2 + 0.02, my + mh / 2 + 0.02, -3.96, PALETTE.gold);
  rig.root.quad(R.wall_plaque, cx, my, -3.956, mw, mh);

  S.boxMin(2.02, 2.88, -3.99, 3.4, 2.94, -3.88, PALETTE.gold);
  const lamps = [];
  for (const lx of [2.12, 3.3]) {
    S.box(lx, 2.91, -3.79, 0.05, 0.05, 0.22, PALETTE.goldDeep);
    const lamp = rig.part({ name: 'pendant', position: [lx, 2.9, -3.68] });
    lamp.box(0, -0.14, 0, 0.022, 0.28, 0.022, PALETTE.goldDeep, NO_LINE);
    lamp.box(0, -0.32, 0, 0.12, 0.07, 0.12, PALETTE.maroon);
    lamp.box(0, -0.39, 0, 0.22, 0.08, 0.22, PALETTE.maroon);
    lamp.box(0, -0.46, 0, 0.29, 0.06, 0.29, PALETTE.maroon);
    lamp.box(0, -0.5, 0, 0.3, 0.02, 0.3, PALETTE.gold);
    lamp.quad(R.bulb, 0, -0.54, 0.1, 0.19, 0.19, { color: '#FFE7A8' });
    lamps.push(lamp);
    rig.root.quad(R.pool, lx, top + 0.004, cz, 0.56, 0.42, { rx: -Math.PI / 2, color: '#FFE9B8' });
  }
  return { lamps };
}

// ---------- Front-Right Cozy Reading Lounge (Day 15 guests' table & poufs compatible!) ----------
function buildLounge(S, p) {
  const { x, z } = LOUNGE;
  // Soft layered oval rug
  [[1.52, PALETTE.gold], [1.4, '#E8D2B5'], [0.96, PALETTE.maroon], [0.84, '#E8D2B5'], [0.38, PALETTE.gold]].forEach(([s, c], i) => {
    const hgt = 0.004 + i * 0.0014;
    p.box(x, hgt / 2, z, s * 0.94, hgt, s * 0.56, c, NO_LINE);
    p.box(x, hgt / 2, z, s * 0.76, hgt, s * 0.72, c, NO_LINE);
  });

  // Warm-wood & gold-trimmed low reading-lounge table: tabletop spans x: 2.16..3.00, z: 2.48..3.24,
  // top surface EXACTLY y = 0.38 m, kept flat and unobstructed for Day 15 teapot, cups & weave lamp!
  S.box(x, 0.02, z, 0.44, 0.04, 0.4, PALETTE.woodDark);
  S.box(x, 0.175, z, 0.1, 0.29, 0.1, PALETTE.woodDark);
  S.box(x, 0.325, z, 0.76, 0.024, 0.68, PALETTE.gold);
  S.boxMin(x - 0.42, 0.335, z - 0.38, x + 0.42, 0.38, z + 0.38, WOOD_TOP);
  // Subtle recessed gold border strip flush on tabletop edge (leaves center clear for Day 15 props)
  p.boxMin(x - 0.38, 0.379, z - 0.34, x + 0.38, 0.381, z - 0.325, PALETTE.gold, NO_LINE);
  p.boxMin(x - 0.38, 0.379, z + 0.325, x + 0.38, 0.381, z + 0.34, PALETTE.gold, NO_LINE);

  // Two plush round velvet floor poufs (seat top EXACTLY y = 0.30 m for Day 15 maungnge & eimon!)
  const poufBody = new THREE.CylinderGeometry(0.22, 0.24, 0.26, 12);
  const poufTop = new THREE.CylinderGeometry(0.205, 0.215, 0.04, 12);
  const poufCord = new THREE.CylinderGeometry(0.226, 0.226, 0.016, 12);
  for (const [px, pz, c] of [[1.96, 2.98, PALETTE.maroon], [3.12, 2.66, PALETTE.gold]]) {
    S.add(poufBody, c, boxMatrix(px, 0.13, pz, 1, 1, 1));
    S.add(poufTop, PALETTE.cream, boxMatrix(px, 0.28, pz, 1, 1, 1));
    S.add(poufCord, PALETTE.goldDeep, boxMatrix(px, 0.258, pz, 1, 1, 1));
  }
  poufBody.dispose();
  poufTop.dispose();
  poufCord.dispose();
  // Decorative book stack tucked neatly beside the east corner
  for (let k = 0; k < 4; k++) {
    S.box(3.22, 0.012 + k * 0.024, 3.24, 0.24 - (k % 2) * 0.02, 0.022, 0.18, [PALETTE.maroon, PALETTE.paper, '#2F5A4C', PALETTE.gold][k], (k - 1.5) * 0.14);
  }
}

// ---------- Front-Left Welcome E-Book Stand & String Lights & Gliding Motes ----------
function buildAFrame(S, rig, R) {
  const { x, z } = AFRAME;
  const lean = 0.17;
  const hgt = 1.0;
  const legY = hgt / 2;
  for (const sx of [-0.33, 0.33]) {
    S.add(UNIT_BOX, PALETTE.woodDark, boxMatrix(x + sx, legY, z + 0.085, 0.05, hgt * 1.02, 0.04, -lean));
    S.add(UNIT_BOX, PALETTE.woodDark, boxMatrix(x + sx, legY, z - 0.085, 0.05, hgt * 1.02, 0.04, lean));
  }
  S.add(UNIT_BOX, WOOD_WARM, boxMatrix(x, legY + 0.04, z + 0.07, 0.62, 0.78, 0.025, -lean));
  S.add(UNIT_BOX, WOOD_WARM, boxMatrix(x, legY + 0.04, z - 0.07, 0.62, 0.78, 0.025, lean));
  S.box(x, hgt - 0.01, z, 0.7, 0.04, 0.06, PALETTE.gold);
  const face = rig.part({ name: 'aframeFace', position: [x, legY + 0.04, z + 0.07], rotation: [-lean, 0, 0] });
  face.quad(R.aframe, 0, 0, 0.014, 0.58, 0.58 * (300 / 240));
}

function buildStringLights(S, rig, R) {
  const bulbs = [];
  const hooks = [-2.56, -1.1, 0.38, 1.86, 3.32];
  for (let k = 0; k < hooks.length - 1; k++) {
    const a = hooks[k], b = hooks[k + 1], n = 5;
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const x = a + (b - a) * u;
      const y = 2.64 - Math.sin(u * Math.PI) * 0.1;
      const pt = [x, y, -3.86];
      if (prev) S.add(UNIT_BOX, PALETTE.ink, segmentMatrix(prev, pt, 0.012));
      prev = pt;
      if (i > 0 && i < n) {
        const p = rig.part({ name: 'fairy', position: [x, y - 0.045, -3.85] });
        p.quad(R.bulb, 0, 0, 0, 0.12, 0.12, { color: i % 2 ? '#FFE3A0' : '#FFD4C0' });
        bulbs.push(p);
      }
    }
    S.box(a, 2.64, -3.9, 0.05, 0.05, 0.08, PALETTE.gold);
  }
  S.box(3.32, 2.64, -3.9, 0.05, 0.05, 0.08, PALETTE.gold);
  return bulbs;
}

/** Two miniature open golden glowing pages gliding slowly overhead (boutique motif). */
function buildFloatingPages(rig, R) {
  return [0, 1].map((i) => {
    const p = rig.part({ name: `floatPage${i}`, position: [0, 2.24 - i * 0.18, -1.2 - i * 0.3], scale: 1.15 });
    p.box(-0.075, 0, 0, 0.14, 0.008, 0.19, EINK, { rz: 0.24 });
    p.box(0.075, 0, 0, 0.14, 0.008, 0.19, PALETTE.paper, { rz: -0.24 });
    p.box(0, -0.012, 0, 0.018, 0.016, 0.2, PALETTE.gold);
    p.quad(R.sparkle, 0, 0.08, 0, 0.12, 0.12);
    return { p, phase: i * 3.1, rx: 2.25 - i * 0.5, rz: 0.9 - i * 0.2, speed: 0.28 + i * 0.05 };
  });
}

// ---------- Wall & floor detail overlays (flat in rig.root, no outlines) ----------
function addBoutiqueWalls(p) {
  const z = -4.0;
  let i = 0;
  for (let x = -3.46; x < 3.46; x += 0.36, i++) {
    p.boxMin(x, 1.065, z, x + 0.16, 2.88, z + 0.004, '#EFE2C8', NO_LINE);
    p.boxMin(x + 0.255, 1.065, z, x + 0.267, 2.88, z + 0.005, i % 2 ? '#DFC286' : '#E7B7B0', NO_LINE);
  }
  for (const sx of [-1, 1]) {
    for (let zz = -3.9; zz < -0.55; zz += 0.36) {
      p.boxMin(sx * 3.496, 1.065, zz, sx * 3.5, 2.88, zz + 0.16, '#EFE2C8', NO_LINE);
    }
  }
  for (let x = -3.4; x < 3.3; x += 0.7) {
    const x1 = x + 0.58;
    const c = '#7B4E2D';
    p.boxMin(x, 0.8, z, x1, 0.835, z + 0.012, c, NO_LINE);
    p.boxMin(x, 0.22, z, x1, 0.255, z + 0.012, c, NO_LINE);
    p.boxMin(x, 0.22, z, x + 0.035, 0.835, z + 0.012, c, NO_LINE);
    p.boxMin(x1 - 0.035, 0.22, z, x1, 0.835, z + 0.012, c, NO_LINE);
    p.boxMin(x + 0.035, 0.255, z, x1 - 0.035, 0.8, z + 0.006, '#A37043', NO_LINE);
  }
}

function addTileDetail(p) {
  for (let k = 1; k < 10; k++) {
    const x = -3.5 + k * 0.7;
    p.boxMin(x - 0.008, 0, -4, x + 0.008, 0.0014, 4, '#CBB58D', NO_LINE);
  }
  for (let k = 1; k < 12; k++) {
    const z = -4 + k * 0.7;
    p.boxMin(-3.5, 0, z - 0.008, 3.5, 0.0014, z + 0.008, '#CBB58D', NO_LINE);
  }
  for (let i = 1; i < 10; i++) {
    for (let k = 1; k < 12; k++) {
      const x = -3.5 + i * 0.7;
      const z = -4 + k * 0.7;
      p.box(x, 0.0014, z, 0.11, 0.0028, 0.11, PALETTE.gold, { ry: Math.PI / 4, outline: false });
      p.box(x, 0.0018, z, 0.042, 0.0036, 0.042, PALETTE.maroon, { ry: Math.PI / 4, outline: false });
    }
  }
}

/** E-Book Boutique interior (`content`). */
export async function buildInterior(ctx = {}) {
  const [, bookTex] = await Promise.all([fontsReady(), artTexture('book')]);
  const room = createRoom({
    width: 7,
    depth: 8,
    wall: '#F6EFE0',
    wainscot: '#926038',
    trim: PALETTE.goldDeep,
    floor: 'tiles',
    floorColor: '#E1CFAF',
    floorColor2: '#F3EAD8',
    background: PALETTE.cream,
  });
  room.id = 'content';

  const atlas = createAtlas(1024, 6);
  const R = drawBoutiqueAtlas(atlas);
  const texture = atlas.texture();
  room.textures.push(texture);

  const S = new VoxelBuilder();
  const rig = createRig();
  const coverQuads = [];

  const preview = buildPreviewLectern(S, rig, R);
  const showcase = buildShowcasePedestal(S, rig, R, coverQuads);
  const nook = buildReadingNook(S, rig, R);
  const partBars = buildChaptersGallery(S, rig, R, coverQuads);
  const backLeft = buildBackLeftShelf(S, rig, R);
  const counterRig = buildReceptionCounter(S, rig, R, room);
  const fairy = buildStringLights(S, rig, R);
  buildAFrame(S, rig, R);
  buildArmchair(S, WEST_CHAIR.x, WEST_CHAIR.z, WEST_CHAIR.ry);
  buildLounge(S, rig.root);
  const pages = buildFloatingPages(rig, R);

  room.place(plant({ size: 1.2 }), -3.08, -2.05);
  room.place(plant({ size: 1.2 }), 3.12, -2.25);
  room.place(plant({ size: 0.95 }), -3.08, 3.4);

  addBoutiqueWalls(rig.root);
  addTileDetail(rig.root);

  // Soft floor contact shadows (unlit rig layer = 0 extra draw calls)
  floorShadow(rig, R.shadow, LECTERN.x, LECTERN.z, 1.15, 0.95, 0.016);
  floorShadow(rig, R.shadow, SHOWCASE.x, SHOWCASE.z, 1.4, 1.1, 0.016);
  floorShadow(rig, R.shadow, NOOK_DESK.x, NOOK_DESK.z, 0.85, 0.8, 0.016);
  floorShadow(rig, R.shadow, NOOK_CHAIR.x, NOOK_CHAIR.z, 1.1, 1.0, 0.016);
  floorShadow(rig, R.shadow, WEST_CHAIR.x, WEST_CHAIR.z, 1.1, 1.0, 0.006);
  floorShadow(rig, R.shadow, LOUNGE.x, LOUNGE.z, 1.6, 1.05, 0.012);
  floorShadow(rig, R.shadow, COUNTER.x, COUNTER.z + 0.14, 1.65, 0.82);
  floorShadow(rig, R.shadow, -1.1, -3.66, 3.1, 0.65);
  floorShadow(rig, R.shadow, -3.04, -3.68, 1.0, 0.68);
  floorShadow(rig, R.shadow, AFRAME.x, AFRAME.z, 0.9, 0.56);
  for (const [px, pz, s] of [[-3.08, -2.05, 0.72], [3.12, -2.25, 0.72], [-3.08, 3.4, 0.58]]) floorShadow(rig, R.shadow, px, pz, s, s);

  const staticMesh = S.mesh({ outline: true, px: 1.5 });
  staticMesh.name = 'ebookStatic';
  room.group.add(staticMesh);

  const built = rig.build({ atlas, texture });
  room.group.add(built.mesh);

  // One merged unlit mesh for Maya's real Reality Check book cover (shared art.js texture)
  let coverMat = null;
  if (coverQuads.length) {
    const geos = coverQuads.map(({ w, h, m }) => new THREE.PlaneGeometry(w, h).applyMatrix4(m));
    coverMat = bookTex
      ? artMaterial(bookTex, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
      : new THREE.MeshBasicMaterial({ color: '#83602C', toneMapped: false });
    const coverMesh = new THREE.Mesh(mergeGeometries(geos, false), coverMat);
    for (const g of geos) g.dispose();
    coverMesh.name = 'ebookCovers';
    coverMesh.userData.dynamic = true;
    room.group.add(coverMesh);
  }

  // Collision obstacles (generous >= 1.05 m corridors on BOTH sides of center showcase!)
  blockBox(room, LECTERN.x - 0.44, LECTERN.z - 0.38, LECTERN.x + 0.44, LECTERN.z + 0.38);
  blockBox(room, SHOWCASE.x - 0.54, SHOWCASE.z - 0.42, SHOWCASE.x + 0.54, SHOWCASE.z + 0.42);
  blockBox(room, 1.76, -1.52, 3.28, -0.44); // East reading nook (desk + armchair + lamp)
  blockBox(room, -3.44, -3.98, 0.34, -3.54); // Back-left bookcase + credenza (keeps x=1.7 brazier open)
  blockBox(room, WEST_CHAIR.x - 0.4, WEST_CHAIR.z - 0.38, WEST_CHAIR.x + 0.4, WEST_CHAIR.z + 0.38);
  blockBox(room, AFRAME.x - 0.34, AFRAME.z - 0.15, AFRAME.x + 0.34, AFRAME.z + 0.15);
  blockBox(room, 1.72, 2.46, 3.36, 3.28, 0.06); // Front-right reading lounge (keeps Day 15 guests tap clear)

  for (const s of STATIONS) room.addStation({ ...s, look: { ...s.look }, line: { ...s.line } });
  const reactions = STATIONS.map((s) => ({ id: s.id, spring: createSpring(150, 13) }));
  const springOf = (id) => reactions.find((r) => r.id === id).spring;
  const previewSpring = springOf('eb-preview');
  const buySpring = springOf('eb-buy');
  const readSpring = springOf('eb-read');
  const chapSpring = springOf('eb-chapters');
  let chapWas = 0;

  room.bake();

  const animate = (dt, t, state) => {
    for (let i = 0; i < reactions.length; i++) stepSpring(reactions[i].spring, stationTarget(state, reactions[i].id), dt, 0.18);

    // 1) Preview lectern: banner sways, glowing sample page gently floats & sparkles wake on approach
    {
      const k = Math.max(0, previewSpring.x);
      const wake = stepSpring(preview.spring, k, dt);
      preview.banner.rot(Math.sin(t * 1.2) * 0.03, 0, Math.sin(t * 1.05) * 0.045 + (wake - k) * 0.35);
      preview.tablet.move(0, wake * 0.025, 0);
      const lift = Math.sin(t * 1.8) * 0.04 + wake * 0.12;
      preview.page.move(Math.sin(t * 1.1) * 0.03, lift, 0).rot(0.18 + Math.sin(t * 1.5) * 0.12, Math.sin(t * 0.8) * 0.22, Math.cos(t * 1.2) * 0.08);
      for (let i = 0; i < preview.spks.length; i++) {
        const s = (0.7 + 0.35 * Math.sin(t * 2.8 + i * 2.1)) * (1 + wake * 0.55);
        preview.spks[i].move(0, Math.sin(t * 1.6 + i * 1.9) * 0.06 + wake * 0.08, 0).size(s).rot(0, 0, t * 0.7 + i);
      }
    }

    // 2) Center showcase pedestal: golden sparkles orbit the Reality Check E-Book & glow breathes
    {
      const k = Math.max(0, buySpring.x);
      const wake = stepSpring(showcase.spring, k, dt);
      const pulse = 0.92 + 0.12 * Math.sin(t * 2.1) + wake * 0.25;
      showcase.aura.size(pulse, pulse, 1);
      showcase.kpayM.move(0, wake * 0.03, 0);
      for (let i = 0; i < showcase.spks.length; i++) {
        const a = t * (0.75 + wake * 0.55) + i * ((Math.PI * 2) / 3);
        const rx = 0.52 + wake * 0.08;
        const ry = 0.22 + Math.sin(t * 1.7 + i * 2) * 0.18;
        const rz = -0.06 - Math.abs(Math.sin(a)) * 0.16; // stay behind/beside cover plane so artwork stays unobstructed
        const sc = (0.72 + 0.38 * Math.sin(t * 3.1 + i * 1.7)) * (1 + wake * 0.4);
        showcase.spks[i].move(Math.cos(a) * rx, ry, rz).size(sc).rot(0, 0, t * 1.2 + i);
      }
    }

    // 3) East reading nook: phone tilts forward & sync sparkles pop on approach
    {
      const k = Math.max(0, readSpring.x);
      const wake = stepSpring(nook.spring, k, dt);
      nook.banner.rot(Math.sin(t * 1.15 + 1.2) * 0.03, 0, Math.sin(t * 1.0 + 0.9) * 0.045 + (wake - k) * 0.35);
      nook.phone.rot(0.1 * wake, 0, 0).move(0, wake * 0.02, 0);
      for (let i = 0; i < nook.syncSpks.length; i++) {
        const p = frac(t * 0.65 + i * 0.5);
        const sc = (0.35 + clamp01(wake * 1.5)) * Math.sin(p * Math.PI);
        nook.syncSpks[i].move(0, p * 0.28, 0).size(sc).rot(0, 0, Math.sin(t * 2.5 + i) * 0.3);
      }
    }

    // 4) Back 23-chapter gallery board: Part 1 & Part 2 bars spring-grow when visited
    const kc = chapSpring.last;
    if (kc > 0 && chapWas === 0) {
      for (let i = 0; i < partBars.length; i++) {
        partBars[i].spring.x = 0.08;
        partBars[i].spring.v = 0;
        partBars[i].delay = 0.1 + i * 0.18;
      }
    }
    chapWas = kc;
    for (let i = 0; i < partBars.length; i++) {
      const pb = partBars[i];
      if (pb.delay > 0) pb.delay -= dt;
      const v = stepSpring(pb.spring, pb.delay > 0 ? 0.08 : 1, dt);
      pb.bar.size(Math.max(0.06, v), 1, 1);
      pb.star.size(clamp01(v) * (0.78 + 0.26 * Math.sin(t * 3 + i))).rot(0, 0, t * 0.9 + i);
    }

    // 5) Ambient boutique life: pendant lamps, fairy string lights, ivy vines, wall clock, gliding pages
    for (let i = 0; i < counterRig.lamps.length; i++) {
      counterRig.lamps[i].rot(Math.sin(t * 0.9 + i * 2) * 0.025, 0, Math.sin(t * 0.72 + i * 1.3) * 0.045);
    }
    for (let i = 0; i < fairy.length; i++) {
      const c = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7);
      fairy[i].size(0.7 + 0.42 * c * c);
    }
    for (let i = 0; i < backLeft.vines.length; i++) {
      backLeft.vines[i].rot(Math.sin(t * 0.9 + i * 1.8) * 0.045, 0, Math.sin(t * 1.1 + i * 2.2) * 0.08);
    }
    backLeft.clock.minute.rot(0, 0, -Math.floor(t) * ((Math.PI * 2) / 60) - 0.6);
    backLeft.clock.hour.rot(0, 0, -t * ((Math.PI * 2) / 720) - 2.1);
    for (let i = 0; i < pages.length; i++) {
      const f = pages[i];
      const a = t * f.speed + f.phase;
      const s = Math.sin(a), c = Math.cos(a);
      f.p.move(c * f.rx, Math.sin(a * 2) * 0.09, s * f.rz).rot(-Math.cos(a * 2) * 0.1, Math.atan2(-s * f.rx, c * f.rz), 0.16);
    }
  };
  room.animators.push(animate);

  chainDispose(room, () => {
    built.dispose();
    coverMat?.dispose();
  });
  return room;
}
