// Post Office (စာတိုက်): every way to reach Maya. A counter with the Telegram desk (her
// primary channel, paper-plane sign), a notice board for her Telegram channel, a Messenger /
// Facebook post box, a Viber phone booth with her number and a TikTok poster; mail slots,
// parcels, a stamp press, a bench, plants and paper planes hanging from the ceiling.
//
// Same draw-call plan as the library (helpers from library.js `roomTools`): one baked static
// mesh (+ outline), two canvas atlases as unlit meshes, one instanced mesh for everything that moves.
import * as kit from './kit.js';
import { fontsReady, FONT_SANS } from '../toon.js';
import { roomTools } from './library.js';
import { artImage } from '../art.js';
import { stat } from '../pages.js';

const { THREE, PALETTE: P, VoxelBuilder } = kit;
const { mat, mul, rbox, sparkleBoxes, prop, makeAtlas, words, sparkle, disc, rrect, avatar, makeDyn, frac, clamp01, easeOutBack, popLife, twinkle, rnd, tone, wallStripes, pottedPlant } = roomTools;

const TG = P.telegram;
const VB = P.viber;
const MS = P.messenger;
const KRAFT = '#C9A06A';
const KRAFT_D = '#A97F4B';
const WOOD = P.wood;
const WOOD_D = P.woodDark;

// ---------------------------------------------------------------------------------
// Canvas art (text through signTexture() via words(), after fontsReady())
// ---------------------------------------------------------------------------------
/** Stylised paper plane (two flat triangles), nose to the upper right. */
function planeIcon(g, x, y, s, fill, fold) {
  g.beginPath();
  g.moveTo(x - s, y + s * 0.05);
  g.lineTo(x + s, y - s * 0.6);
  g.lineTo(x - s * 0.15, y + s * 0.55);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  g.beginPath();
  g.moveTo(x - s * 0.15, y + s * 0.55);
  g.lineTo(x + s, y - s * 0.6);
  g.lineTo(x - s * 0.05, y + s * 0.22);
  g.closePath();
  g.fillStyle = fold;
  g.fill();
}
function dashTrail(g, pts, color, w = 5) {
  g.save();
  g.setLineDash([12, 12]);
  g.strokeStyle = color;
  g.lineWidth = w;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  g.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]);
  g.stroke();
  g.restore();
}
function note(g, x, y, s, color) {
  disc(g, x, y, s * 0.32, color);
  g.fillStyle = color;
  g.fillRect(x + s * 0.2, y - s * 1.1, s * 0.13, s * 1.1);
  g.fillRect(x + s * 0.2, y - s * 1.1, s * 0.5, s * 0.16);
}

function drawTitle(g, w, h) {
  g.fillStyle = '#F8F0DD';
  g.fillRect(0, 0, w, h);
  g.drawImage(words([{ text: 'စာတိုက်', size: 96, color: P.maroon }, { text: 'ဆက်သွယ်ရန်', size: 46, color: P.goldDeep }], w, h), 0, 0);
  planeIcon(g, 150, 118, 58, TG, '#1C86C0');
  dashTrail(g, [40, 190, 60, 160, 70, 150, 92, 140], '#9CC3DE', 5);
  planeIcon(g, w - 150, 118, 58, TG, '#1C86C0');
  sparkle(g, w - 240, 70, 18, P.gold);
  sparkle(g, 240, 172, 14, P.gold);
}

function drawTelegram(g, w, h) {
  g.fillStyle = '#FBF6EA';
  g.fillRect(0, 0, w, h);
  g.fillStyle = TG;
  g.fillRect(0, 0, w, 116);
  planeIcon(g, 72, 60, 40, '#FFFFFF', '#CDEBFA');
  g.drawImage(words([{ text: 'Telegram', size: 60, font: FONT_SANS, weight: 800, color: '#FFFFFF' }], w - 120, 116), 100, 0);
  g.drawImage(
    words([{ text: '@Ms_MayaOfficial', size: 40, font: FONT_SANS, weight: 700, color: P.ink }, { text: 'အမြန်ဆုံး ဆက်သွယ်ရန်', size: 36, color: P.maroon }], w, h - 116),
    0, 116,
  );
}

function drawChannel(g, w, h) {
  g.fillStyle = '#FFFDF6';
  g.fillRect(0, 0, w, h);
  g.fillStyle = TG;
  g.fillRect(0, 0, w, 96);
  g.drawImage(words([{ text: 'Telegram ချန်နယ်', size: 42, color: '#FFFFFF' }], w, 96), 0, 0);
  // the channel's real name ("Writer Maya - မာရာ" is her Facebook page, not this channel)
  g.drawImage(
    words([{ text: 'Maya - မာယာ', size: 46, color: P.ink }, { text: 'Join ပေးပါဦးရှင့်', size: 40, color: P.maroon }], w, 210),
    0, 100,
  );
  dashTrail(g, [60, h - 40, 140, h - 90, 230, h - 30, 300, h - 70], '#9CC3DE', 5);
  planeIcon(g, 350, h - 84, 44, TG, '#1C86C0');
  sparkle(g, w - 60, h - 60, 22, P.gold);
  sparkle(g, w - 100, h - 100, 10, P.gold);
}

function phoneIcon(g, x, y, s, color) {
  g.save();
  g.translate(x, y);
  g.rotate(-0.6);
  rrect(g, -s * 0.18, -s, s * 0.36, s * 2, s * 0.18, color);
  rrect(g, -s * 0.42, -s, s * 0.6, s * 0.42, s * 0.16, color);
  rrect(g, -s * 0.42, s * 0.58, s * 0.6, s * 0.42, s * 0.16, color);
  g.restore();
}

function drawViber(g, w, h) {
  g.fillStyle = VB;
  g.fillRect(0, 0, w, h);
  phoneIcon(g, 56, h / 2, 40, '#FFFFFF');
  g.drawImage(
    words([{ text: 'Viber · ဖုန်းဆက်ရန်', size: 30, color: '#EDE9FF' }, { text: '+95 9 762 137 278', size: 50, font: FONT_SANS, weight: 800, color: '#FFFFFF' }], w - 100, h),
    96, 0,
  );
}

function drawMessenger(g, w, h) {
  g.fillStyle = MS;
  g.fillRect(0, 0, w, h);
  // speech bubble with three dots
  g.beginPath();
  g.ellipse(w / 2, 62, 64, 46, 0, 0, Math.PI * 2);
  g.moveTo(w / 2 - 40, 90);
  g.lineTo(w / 2 - 56, 124);
  g.lineTo(w / 2 - 12, 104);
  g.closePath();
  g.fillStyle = '#FFFFFF';
  g.fill();
  for (const dx of [-26, 0, 26]) disc(g, w / 2 + dx, 62, 9, MS);
  g.drawImage(
    words([{ text: 'Messenger · Facebook', size: 34, font: FONT_SANS, weight: 800, color: '#FFFFFF' }, { text: 'စာလေး ပို့ထားခဲ့နော်', size: 32, color: '#FFFFFF' }], w, h - 120),
    0, 124,
  );
}

/** TikTok poster: her real logo as the profile picture, numbers from index.html (stat()). */
function drawTikTok(g, w, h, logo, stats) {
  g.fillStyle = '#141418';
  g.fillRect(0, 0, w, h);
  rrect(g, 10, 10, w - 20, h - 20, 18, null, P.gold, 4);
  avatar(g, logo, w / 2, 76, 48, P.gold, 5);
  note(g, w / 2 + 80, 96, 34, '#EBC76B');
  sparkle(g, w / 2 - 96, 54, 12, '#F7DE8E');
  g.drawImage(
    words([{ text: 'TikTok', size: 56, font: FONT_SANS, weight: 800, color: '#FFFFFF' }, { text: '@maya_ink_insights', size: 26, font: FONT_SANS, weight: 700, color: '#D9D0C2' }], w, 150),
    0, 128,
  );
  g.drawImage(
    words([{ text: `${stats.followers} ဖော်လိုဝါ`, size: 34, color: '#FFFFFF' }, { text: `${stats.likes} လိုက်ခ်`, size: 34, color: '#FFFFFF' }], w, 120),
    0, 274,
  );
  rrect(g, 34, h - 102, w - 68, 62, 31, '#E0485E');
  g.drawImage(words([{ text: 'Follow လုပ်ထားနော်', size: 28, color: '#FFFFFF' }], w - 68, 62), 34, h - 102);
}

function drawNote(g, w, h, bg) {
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(42, 33, 24, 0.45)';
  for (let i = 0; i < 4; i++) g.fillRect(14, 22 + i * 18, w - 28 - (i % 2) * 22, 5);
}

function drawStamps(g, w, h) {
  g.fillStyle = '#F4EBD6';
  g.fillRect(0, 0, w, h);
  const cols = [P.maroon, TG, P.goldDeep, '#3E6B4F', '#C27A5B', VB];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const x = 8 + c * 37;
      const y = 8 + r * 37;
      rrect(g, x, y, 32, 32, 3, '#FFFFFF');
      g.fillStyle = cols[(r * 4 + c) % cols.length];
      g.fillRect(x + 5, y + 5, 22, 22);
      sparkle(g, x + 16, y + 16, 7, '#FFF4CF');
    }
  }
}

/** Round wall-clock face with Burmese numerals (transparent outside the rim). */
function drawClock(g, w, h) {
  const c = w / 2;
  disc(g, c, c, c - 2, P.goldDeep);
  disc(g, c, c, c - 12, '#FFF8EA');
  g.strokeStyle = P.gold;
  g.lineWidth = 4;
  g.beginPath();
  g.arc(c, c, c - 24, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const big = i % 5 === 0;
    const r0 = c - (big ? 44 : 34);
    const r1 = c - 28;
    g.strokeStyle = big ? P.ink : '#8C7A60';
    g.lineWidth = big ? 6 : 2;
    g.beginPath();
    g.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0);
    g.lineTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1);
    g.stroke();
  }
  const nums = [['၁၂', 0], ['၃', 0.25], ['၆', 0.5], ['၉', 0.75]];
  for (const [t, f] of nums) {
    const a = f * Math.PI * 2;
    const x = c + Math.sin(a) * (c - 70);
    const y = c - Math.cos(a) * (c - 70);
    g.drawImage(words([{ text: t, size: 34, color: P.maroon }], 90, 70), x - 45, y - 37);
  }
  sparkle(g, c, c + 46, 14, P.gold);
}

/** Postal-scale dial (needle is animated in 3D). */
function drawDial(g, w, h) {
  const c = w / 2;
  disc(g, c, c, c - 2, P.ink);
  disc(g, c, c, c - 10, '#FFFDF4');
  g.strokeStyle = '#E0485E';
  g.lineWidth = 10;
  g.beginPath();
  g.arc(c, c, c - 22, -0.35, 0.6);
  g.stroke();
  for (let i = 0; i <= 10; i++) {
    const a = -2.2 + (i / 10) * 4.4;
    g.strokeStyle = P.ink;
    g.lineWidth = i % 5 ? 3 : 6;
    g.beginPath();
    g.moveTo(c + Math.sin(a) * (c - 16), c - Math.cos(a) * (c - 16));
    g.lineTo(c + Math.sin(a) * (c - (i % 5 ? 30 : 38)), c - Math.cos(a) * (c - (i % 5 ? 30 : 38)));
    g.stroke();
  }
  disc(g, c, c, 9, P.gold);
}

/** Round postmark with wavy cancel lines (ink only: transparent elsewhere). */
function drawPostmark(g, w, h, ink = '#2C3E66') {
  g.strokeStyle = ink;
  g.lineWidth = 5;
  g.beginPath();
  g.arc(w * 0.32, h / 2, h * 0.36, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 3;
  g.beginPath();
  g.arc(w * 0.32, h / 2, h * 0.24, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = ink;
  g.fillRect(w * 0.32 - h * 0.16, h / 2 - 3, h * 0.32, 6);
  g.lineWidth = 5;
  for (let k = 0; k < 3; k++) {
    g.beginPath();
    const y = h * 0.3 + k * h * 0.2;
    g.moveTo(w * 0.58, y);
    for (let x = w * 0.58; x <= w - 4; x += 4) g.lineTo(x, y + Math.sin((x - w * 0.58) / 9) * 5);
    g.stroke();
  }
}

/** Parcel address label: stamp, postmark, handwriting lines. */
function drawLabel(g, w, h) {
  g.fillStyle = '#FFFDF6';
  g.fillRect(0, 0, w, h);
  g.fillStyle = P.maroon;
  g.fillRect(0, 0, w, 10);
  g.fillStyle = 'rgba(42, 33, 24, 0.55)';
  for (let i = 0; i < 4; i++) g.fillRect(12, 22 + i * 15, w * (0.42 - (i % 2) * 0.1), 5);
  rrect(g, w - 44, 18, 34, 40, 3, TG);
  sparkle(g, w - 27, 38, 10, '#FFFFFF');
  g.save();
  g.translate(44, 32);
  drawPostmark(g, 66, 44);
  g.restore();
}

/** Wall calendar page: red header, day grid, one day circled. */
function drawCalendar(g, w, h) {
  g.fillStyle = '#FFFDF6';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#E0485E';
  g.fillRect(0, 0, w, 44);
  disc(g, w * 0.3, 10, 7, P.ink);
  disc(g, w * 0.7, 10, 7, P.ink);
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.fillRect(w * 0.25, 22, w * 0.5, 8);
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      g.fillStyle = (r * 7 + c) % 7 === 6 ? '#F2C2C8' : '#E8DFC9';
      g.fillRect(10 + c * ((w - 20) / 7) + 2, 56 + r * ((h - 66) / 5) + 2, (w - 20) / 7 - 4, (h - 66) / 5 - 4);
    }
  }
  g.strokeStyle = TG;
  g.lineWidth = 5;
  g.beginPath();
  g.arc(10 + 3.5 * ((w - 20) / 7), 56 + 2.5 * ((h - 66) / 5), 20, 0, Math.PI * 2);
  g.stroke();
}

/** Postcard: golden-hour hills and a cloud, a stamp, handwriting lines. */
function drawPostcard(g, w, h) {
  g.fillStyle = '#FBF2DF';
  g.fillRect(0, 0, w, h);
  const bands = ['#F6CF9F', '#F9DCB0', '#FBE6C2'];
  bands.forEach((c, i) => {
    g.fillStyle = c;
    g.fillRect(8, 8 + i * 28, w * 0.55, 29);
  });
  disc(g, w * 0.4, 70, 18, '#FFE29A');
  g.fillStyle = P.leaf;
  g.beginPath();
  g.moveTo(8, h - 8);
  g.quadraticCurveTo(w * 0.2, 60, w * 0.35, 100);
  g.quadraticCurveTo(w * 0.48, 80, w * 0.55 + 8, 96);
  g.lineTo(w * 0.55 + 8, h - 8);
  g.closePath();
  g.fill();
  rrect(g, 30, 30, 60, 20, 10, '#FFF8EE');
  g.fillStyle = 'rgba(42, 33, 24, 0.5)';
  for (let i = 0; i < 4; i++) g.fillRect(w * 0.62, 70 + i * 18, w * 0.32, 4);
  rrect(g, w - 52, 10, 40, 46, 3, P.maroon);
  sparkle(g, w - 32, 33, 11, '#F3D27A');
}

/**
 * A = signs (title, Telegram desk, Viber band, Messenger plate, notes, stamps, clock, dial, labels);
 * B = posters (the TikTok one shows her real logo and the index.html numbers).
 */
function contactAtlases(logo, stats) {
  const A = makeAtlas(1024);
  const B = makeAtlas(1024);
  const r = {
    title: A.draw(A.region(0, 0, 1024, 240), drawTitle),
    telegram: A.draw(A.region(0, 248, 512, 300), drawTelegram),
    viber: A.draw(A.region(520, 248, 504, 180), drawViber),
    messenger: A.draw(A.region(520, 436, 400, 280), drawMessenger),
    notes: ['#FFF1A8', '#F8C8CF', '#CFE8D5'].map((c, i) => A.draw(A.region(i * 104, 556, 96, 96), (g, w, h) => drawNote(g, w, h, c))),
    stamps: A.draw(A.region(312, 556, 160, 120), drawStamps),
    clock: A.draw(A.region(0, 684, 256, 256), drawClock),
    dial: A.draw(A.region(264, 684, 128, 128), drawDial),
    postmark: A.draw(A.region(400, 684, 112, 64), (g, w, h) => drawPostmark(g, w, h)),
    label: A.draw(A.region(400, 756, 112, 80), drawLabel),
    glow: A.draw(A.region(928, 436, 88, 88), (g, w, h) => {
      g.fillStyle = '#FFE9B0';
      g.fillRect(0, 0, w, h);
    }),
    channel: B.draw(B.region(0, 0, 512, 410), drawChannel),
    tiktok: B.draw(B.region(520, 0, 360, 500), (g, w, h) => drawTikTok(g, w, h, logo, stats)),
    calendar: B.draw(B.region(0, 418, 200, 220), drawCalendar),
    postcard: B.draw(B.region(208, 418, 256, 160), drawPostcard),
  };
  return { A, B, r };
}

// ---------------------------------------------------------------------------------
// Props (room space; fronts face +Z)
// ---------------------------------------------------------------------------------
const CZ = -2.6; // counter depth (Telegram desk)
const NX = -2.55; // notice board (on the back wall)
const VX = 2.55; // Viber booth
const VZ = -3.75;
const MX = 2.8; // Messenger post box
const MZ = -0.2;
const TX = -2.75; // TikTok poster
const TZ = -0.15;
const SCALE = { x: 0.25, y: 1.115, z: 0.2 }; // postal scale dial centre (counter space)
const CLOCK = { x: 1.55, y: 2.5 }; // wall clock on the back wall

/** Flat diamond lying in the XZ plane (paper-plane wings). */
function diamondXZ(x, y, z, len, wid, thick) {
  const m = new THREE.Matrix4().makeRotationY(Math.PI / 4);
  m.premultiply(new THREE.Matrix4().makeScale(len / Math.SQRT2, thick, wid / Math.SQRT2));
  m.setPosition(x, y, z);
  return m;
}
/** Paper plane boxes (nose along +X): two wing diamonds and a keel. Calls add(matrix, color). */
function planeBoxes(add, M, color, fold) {
  add(mul(M, diamondXZ(0, 0, -0.062, 0.46, 0.13, 0.016)), color);
  add(mul(M, diamondXZ(0, 0, 0.062, 0.46, 0.13, 0.016)), color);
  const k = new THREE.Matrix4().makeRotationZ(Math.PI / 4);
  k.premultiply(new THREE.Matrix4().makeScale(0.4 / Math.SQRT2, 0.08 / Math.SQRT2, 0.014));
  k.setPosition(-0.01, -0.03, 0);
  add(mul(M, k), fold);
}

/**
 * Post-office tiles laid over the kit checker: a grout sheet, tiles in jittered tones (darker
 * toward the back wall) and small maroon / blue inserts with gold centres at the tile corners.
 */
function tileFloor(room) {
  const v = new VoxelBuilder();
  const hw = room.width / 2;
  const hd = room.depth / 2;
  const T = 0.7;
  v.boxMin(-hw, 0, -hd, hw, 0.002, hd, '#B6A27C');
  let i = 0;
  for (let x = -hw; x < hw - 1e-6; x += T) {
    for (let z = -hd; z < hd - 1e-6; z += T, i++) {
      const odd = (Math.round((x + hw) / T) + Math.round((z + hd) / T)) % 2;
      const ao = 0.86 + 0.14 * clamp01((z + hd) / 1.4);
      const c = tone(odd ? '#D6C39C' : '#EADFC6', (0.96 + rnd(i * 3.3) * 0.08) * ao);
      v.boxMin(x + 0.012, 0, z + 0.012, Math.min(hw, x + T) - 0.012, 0.005, Math.min(hd, z + T) - 0.012, c);
    }
  }
  for (let x = -hw + T; x < hw - 1e-6; x += T) {
    for (let z = -hd + T; z < hd - 1e-6; z += T) {
      const k = Math.round((x + hw) / T) + Math.round((z + hd) / T);
      rbox(v, x, 0.0035, z, 0.15, 0.007, 0.15, k % 2 ? '#7A2632' : '#4F7FA6', 0, Math.PI / 4, 0);
      v.box(x, 0.0045, z, 0.045, 0.009, 0.045, P.gold);
    }
  }
  return v;
}

function counterDesk(room, A, r) {
  const v = new VoxelBuilder();
  const W = 3.0;
  const D = 0.7;
  const H = 1.0;
  v.boxMin(-W / 2, 0, -D / 2, W / 2, H - 0.08, D / 2, P.maroon);
  v.boxMin(-W / 2 - 0.05, H - 0.08, -D / 2 - 0.05, W / 2 + 0.05, H, D / 2 + 0.06, P.gold);
  v.boxMin(-W / 2 - 0.05, H - 0.012, D / 2 + 0.05, W / 2 + 0.05, H + 0.002, D / 2 + 0.066, tone(P.gold, 1.2));
  v.boxMin(-W / 2 - 0.02, 0, D / 2 - 0.02, W / 2 + 0.02, 0.1, D / 2 + 0.03, P.maroonDeep);
  v.boxMin(-W / 2 - 0.02, 0.1, D / 2 + 0.005, W / 2 + 0.02, 0.125, D / 2 + 0.035, P.gold);
  v.boxMin(-W / 2 - 0.02, 0, D / 2 + 0.03, W / 2 + 0.02, 0.02, D / 2 + 0.04, tone(P.maroonDeep, 0.7));
  const pw = (W - 0.24) / 4;
  for (let i = 0; i < 4; i++) {
    const x0 = -W / 2 + 0.12 + i * pw;
    v.boxMin(x0 + 0.04, 0.18, D / 2, x0 + pw - 0.04, H - 0.2, D / 2 + 0.02, P.cream);
    // raised moulding round each panel, a lit top edge and a shadowed bottom edge
    v.boxMin(x0 + 0.04, H - 0.23, D / 2 + 0.02, x0 + pw - 0.04, H - 0.2, D / 2 + 0.034, P.goldDeep);
    v.boxMin(x0 + 0.04, 0.18, D / 2 + 0.02, x0 + pw - 0.04, 0.21, D / 2 + 0.034, P.goldDeep);
    v.boxMin(x0 + 0.04, 0.21, D / 2 + 0.02, x0 + 0.07, H - 0.23, D / 2 + 0.034, P.goldDeep);
    v.boxMin(x0 + pw - 0.07, 0.21, D / 2 + 0.02, x0 + pw - 0.04, H - 0.23, D / 2 + 0.034, P.goldDeep);
    v.boxMin(x0 + 0.07, 0.21, D / 2 + 0.02, x0 + pw - 0.07, 0.235, D / 2 + 0.026, tone(P.cream, 0.82));
    sparkleBoxes(v, x0 + pw / 2, 0.5, D / 2 + 0.03, 0.16, P.gold, 0.02);
    for (const [dx, dy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) v.box(x0 + pw / 2 + dx * 0.19, 0.5 + dy * 0.22, D / 2 + 0.028, 0.03, 0.03, 0.012, P.gold);
  }
  for (let i = 0; i <= 4; i++) {
    const x = -W / 2 + 0.12 + i * pw;
    v.box(x, H - 0.16, D / 2 + 0.015, 0.07, 0.07, 0.03, P.gold);
    v.box(x, 0.16, D / 2 + 0.015, 0.07, 0.05, 0.03, P.goldDeep);
  }
  // Telegram desk sign on two posts, a blue paper plane taking off from its corner
  for (const x of [-0.42, 0.42]) v.box(x, H + 0.18, -0.06, 0.05, 0.36, 0.05, P.goldDeep);
  v.box(0, H + 0.66, -0.07, 1.1, 0.68, 0.05, P.gold);
  A.quad(r.telegram, 1.02, 0.598, mat(0, H + 0.66, CZ - 0.04));
  planeBoxes((m, c) => v.add(roomTools.UNIT, c, m), mat(0.66, H + 1.07, -0.02, 0, -0.5, 0.42, 1.5, 1.5, 1.5), TG, '#1C86C0');
  // desk bell, letters, inkwell and quill
  v.box(-0.72, H + 0.015, 0.14, 0.16, 0.03, 0.16, P.goldDeep);
  v.box(-0.72, H + 0.06, 0.14, 0.11, 0.06, 0.11, P.gold);
  v.box(-0.72, H + 0.105, 0.14, 0.03, 0.03, 0.03, P.gold);
  rbox(v, -0.28, H + 0.01, 0.12, 0.3, 0.012, 0.2, P.white, 0, 0.12, 0);
  rbox(v, -0.26, H + 0.024, 0.1, 0.3, 0.012, 0.2, P.paper, 0, -0.1, 0);
  rbox(v, -0.27, H + 0.038, 0.12, 0.28, 0.012, 0.18, P.maroon, 0, 0.05, 0);
  v.box(-0.27, H + 0.048, 0.12, 0.05, 0.01, 0.05, P.gold);
  v.box(0.62, H + 0.05, 0.16, 0.1, 0.1, 0.1, P.ink);
  v.box(0.62, H + 0.105, 0.16, 0.06, 0.02, 0.06, P.gold);
  rbox(v, 0.68, H + 0.24, 0.16, 0.035, 0.34, 0.012, P.white, 0, 0, -0.35);
  rbox(v, 0.71, H + 0.3, 0.16, 0.07, 0.2, 0.01, P.paper, 0, 0, -0.35);
  // parcels on the left end
  v.box(-1.18, H + 0.14, -0.02, 0.38, 0.28, 0.34, KRAFT);
  v.box(-1.18, H + 0.285, -0.02, 0.385, 0.012, 0.05, KRAFT_D);
  v.box(-1.18, H + 0.14, 0.152, 0.05, 0.28, 0.012, KRAFT_D);
  rbox(v, -1.16, H + 0.4, -0.03, 0.28, 0.22, 0.26, '#E6CFA0', 0, 0.35, 0);
  rbox(v, -1.16, H + 0.4, -0.03, 0.29, 0.04, 0.27, P.maroon, 0, 0.35, 0);
  v.box(-1.16, H + 0.52, -0.03, 0.08, 0.04, 0.08, P.maroon);
  // stamp press on the right end: plate, envelope, dispenser with a window of stamps
  v.box(1.12, H + 0.015, 0.12, 0.34, 0.03, 0.26, P.goldDeep);
  v.box(1.12, H + 0.035, 0.12, 0.22, 0.01, 0.15, P.white);
  v.box(1.22, H + 0.19, -0.16, 0.36, 0.38, 0.24, P.maroon);
  v.box(1.22, H + 0.39, -0.16, 0.4, 0.04, 0.28, P.gold);
  v.box(1.22, H + 0.08, -0.03, 0.2, 0.03, 0.03, P.ink);
  A.quad(r.stamps, 0.26, 0.195, mat(1.22, H + 0.235, CZ - 0.035));
  // parcel twine and address label with stamp and postmark
  v.box(-1.18, H + 0.287, -0.02, 0.012, 0.012, 0.345, P.cream);
  v.box(-1.18, H + 0.14, 0.153, 0.012, 0.28, 0.012, P.cream);
  v.box(-1.18, H + 0.14, 0.153, 0.385, 0.012, 0.012, P.cream);
  A.quad(r.label, 0.13, 0.093, mat(-1.07, H + 0.17, CZ + 0.161));
  // postal scale: brass base and column, a letter on the pan, dial (needle is animated)
  v.box(SCALE.x, H + 0.02, SCALE.z - 0.04, 0.26, 0.04, 0.2, P.goldDeep);
  v.box(SCALE.x, H + 0.042, SCALE.z - 0.04, 0.22, 0.006, 0.16, P.gold);
  v.box(SCALE.x, H + 0.13, SCALE.z - 0.07, 0.07, 0.18, 0.06, P.gold);
  v.box(SCALE.x, SCALE.y, SCALE.z - 0.035, 0.17, 0.17, 0.03, P.ink);
  A.quad(r.dial, 0.15, 0.15, mat(SCALE.x, SCALE.y, CZ + SCALE.z - 0.018));
  v.box(SCALE.x, H + 0.23, SCALE.z - 0.07, 0.24, 0.02, 0.18, P.gold);
  v.box(SCALE.x, H + 0.243, SCALE.z - 0.07, 0.2, 0.008, 0.14, tone(P.gold, 1.2));
  rbox(v, SCALE.x + 0.01, H + 0.252, SCALE.z - 0.07, 0.2, 0.01, 0.13, '#DCEBF6', 0, 0.2, 0);
  rbox(v, SCALE.x + 0.04, H + 0.258, SCALE.z - 0.05, 0.04, 0.004, 0.05, '#E0485E', 0, 0.2, 0);
  // pen on a little chain, an in/out letter tray
  v.box(0.95, H + 0.015, 0.22, 0.07, 0.03, 0.07, P.goldDeep);
  rbox(v, 0.88, H + 0.012, 0.25, 0.16, 0.022, 0.022, P.ink, 0, 0.5, 0);
  for (let i = 0; i < 3; i++) v.box(0.935 - i * 0.03, H + 0.008, 0.245 + i * 0.012, 0.018, 0.012, 0.018, P.gold);
  for (const [y, c] of [[0.02, P.maroon], [0.12, P.maroon]]) {
    v.box(-0.52, H + y, -0.21, 0.32, 0.02, 0.22, c);
    v.box(-0.52, H + y + 0.025, -0.105, 0.32, 0.05, 0.012, P.gold);
    rbox(v, -0.52, H + y + 0.022, -0.21, 0.26, 0.02, 0.18, P.white, 0, y > 0.1 ? 0.1 : -0.08, 0);
  }
  for (const sx of [-1, 1]) v.box(-0.52 + sx * 0.15, H + 0.07, -0.21, 0.02, 0.12, 0.02, P.goldDeep);
  room.place(prop(v, { w: W + 0.1, d: D + 0.1 }, 'counter'), 0, CZ);
}

function backWall(room, A, B, r) {
  const v = new VoxelBuilder();
  const zb = -room.depth / 2;
  // mail slots behind the counter
  const x0 = -1.45;
  const x1 = 1.45;
  const y0 = 1.06;
  const y1 = 1.98;
  const zf = zb + 0.3;
  v.boxMin(x0, y0, zb, x1, y1, zb + 0.04, '#3B2A1A');
  for (let i = 0; i <= 6; i++) {
    const x = x0 + (i * (x1 - x0)) / 6;
    v.boxMin(x - 0.028, y0, zb, x + 0.028, y1, zf, '#8A5E3B');
  }
  for (let j = 0; j <= 3; j++) {
    const y = y0 + (j * (y1 - y0)) / 3;
    v.boxMin(x0, y - 0.028, zb, x1, y + 0.028, zf, '#8A5E3B');
  }
  v.boxMin(x0 - 0.08, y1 + 0.02, zb, x1 + 0.08, y1 + 0.08, zf + 0.04, P.goldDeep);
  v.boxMin(x0 - 0.08, y0 - 0.1, zb, x1 + 0.08, y0 - 0.02, zf + 0.04, P.goldDeep);
  const cw = (x1 - x0) / 6;
  const ch = (y1 - y0) / 3;
  const ENV = [P.white, '#F3E3C3', '#DCEBF6', '#F8D9DE', '#E9F2DC'];
  for (let k = 0; k < 18; k++) {
    const cx = x0 + cw * ((k % 6) + 0.5);
    const cy = y0 + ch * (Math.floor(k / 6) + 0.5);
    // gold name plate on the divider under every pigeonhole, a darker back corner (fake AO)
    v.box(cx, cy - ch / 2, zf + 0.005, 0.12, 0.032, 0.01, P.gold);
    if ((k * 7) % 5 === 0) {
      // a bundle of letters lying flat, tied with a maroon band
      for (let i = 0; i < 3; i++) rbox(v, cx + (i - 1) * 0.01, cy - ch / 2 + 0.04 + i * 0.022, zf - 0.13, 0.3, 0.02, 0.2, ENV[(k + i) % ENV.length], 0, (i - 1) * 0.08, 0);
      v.box(cx, cy - ch / 2 + 0.062, zf - 0.13, 0.04, 0.072, 0.21, P.maroon);
      continue;
    }
    const kind = (k * 5) % 4;
    // a second letter standing behind the first, so every slot looks full
    rbox(v, cx - 0.05, cy - 0.01, zf - 0.15, 0.27, 0.21, 0.02, ENV[(k * 3 + 1) % ENV.length], -0.12, 0, -0.07);
    if (kind === 3) {
      v.box(cx, cy - 0.04, zf - 0.12, 0.26, 0.15, 0.2, KRAFT);
      v.box(cx, cy - 0.04, zf - 0.019, 0.012, 0.15, 0.012, P.cream);
      v.box(cx, cy + 0.036, zf - 0.12, 0.012, 0.012, 0.2, P.cream);
      v.box(cx + 0.07, cy - 0.05, zf - 0.018, 0.08, 0.06, 0.01, P.white);
    } else {
      const M = mat(cx + (kind - 1) * 0.03, cy - 0.03, zf - 0.06, -0.3, 0, (kind - 1) * 0.08);
      v.add(roomTools.UNIT, ENV[kind % ENV.length], mul(M, mat(0, 0, 0, 0, 0, 0, 0.3, 0.17, 0.02)));
      v.add(roomTools.UNIT, k % 3 ? '#C8323C' : TG, mul(M, mat(0.09, 0.04, 0.012, 0, 0, 0, 0.05, 0.06, 0.006)));
      if (k % 2) v.add(roomTools.UNIT, P.maroon, mul(M, mat(-0.06, -0.03, 0.012, 0, 0, Math.PI / 4, 0.04, 0.04, 0.008)));
    }
  }
  // dentil crown on the pigeonholes
  for (let x = x0 - 0.04; x <= x1 + 0.05; x += 0.1) v.box(x, y1 + 0.1, zf + 0.03, 0.05, 0.04, 0.03, P.gold);
  // wall clock (face on atlas A, hands animated): rounded brass rim from three boxes
  const czc = zb + 0.05;
  v.box(CLOCK.x, CLOCK.y, czc - 0.02, 0.5, 0.36, 0.06, P.goldDeep);
  v.box(CLOCK.x, CLOCK.y, czc - 0.02, 0.36, 0.5, 0.06, P.goldDeep);
  v.box(CLOCK.x, CLOCK.y + 0.27, czc - 0.02, 0.08, 0.05, 0.05, P.gold);
  v.box(CLOCK.x, CLOCK.y - 0.27, czc - 0.02, 0.05, 0.04, 0.05, P.gold);
  A.quad(r.clock, 0.46, 0.46, mat(CLOCK.x, CLOCK.y, czc + 0.012));
  // wallpaper stripes above, panelled wainscot below the chair rail
  wallStripes(v, room, '#F1E6CC');
  for (let x = -3.15; x <= 3.16; x += 0.7) v.boxMin(x - 0.03, 0.14, zb, x + 0.03, 0.98, zb + 0.02, '#D9E8F3');
  v.boxMin(-room.width / 2, 0.86, zb, room.width / 2, 0.9, zb + 0.02, '#D9E8F3');
  v.boxMin(-room.width / 2, 0.14, zb, room.width / 2, 0.2, zb + 0.015, '#9FBFD8');
  // title plaque
  v.boxMin(-1.12, 2.06, zb, 1.12, 2.5, zb + 0.05, P.gold);
  v.boxMin(-1.16, 2.04, zb, 1.16, 2.08, zb + 0.07, P.goldDeep);
  v.boxMin(-1.16, 2.48, zb, 1.16, 2.52, zb + 0.07, P.goldDeep);
  A.quad(r.title, 1.76, 0.413, mat(0, 2.28, zb + 0.053));
  // notice board with the Telegram channel poster and pinned notes
  const nw = 1.3;
  v.boxMin(NX - nw / 2 - 0.07, 0.93, zb, NX + nw / 2 + 0.07, 2.12, zb + 0.08, WOOD_D);
  v.boxMin(NX - nw / 2, 1.0, zb, NX + nw / 2, 2.05, zb + 0.09, '#C8A070');
  B.quad(r.channel, 0.66, 0.528, mat(NX - 0.2, 1.6, zb + 0.095, 0, 0, 0.03));
  v.box(NX - 0.2, 1.86, zb + 0.11, 0.04, 0.04, 0.04, '#E0485E');
  const notes = [[NX + 0.4, 1.8, 0.12], [NX + 0.38, 1.36, -0.14], [NX - 0.42, 1.15, -0.08]];
  notes.forEach(([x, y, rz], i) => {
    A.quad(r.notes[i], 0.21, 0.21, mat(x, y, zb + 0.096, 0, 0, rz));
    v.box(x, y + 0.08, zb + 0.11, 0.035, 0.035, 0.035, i === 1 ? P.gold : TG);
  });
  // more on the board: cork flecks, a calendar, a postcard, coloured pins, a gold corner trim
  for (let i = 0; i < 14; i++) v.box(NX - 0.6 + rnd(i * 2.1) * 1.2, 1.05 + rnd(i * 3.7 + 1) * 0.95, zb + 0.091, 0.03, 0.03, 0.004, i % 2 ? '#B08A5C' : '#D8B585');
  B.quad(r.calendar, 0.15, 0.165, mat(NX - 0.42, 1.955, zb + 0.097, 0, 0, -0.05));
  v.box(NX - 0.42, 2.03, zb + 0.11, 0.03, 0.03, 0.03, P.maroon);
  B.quad(r.postcard, 0.3, 0.1875, mat(NX + 0.03, 1.13, zb + 0.098, 0, 0, 0.07));
  v.box(NX - 0.08, 1.2, zb + 0.112, 0.035, 0.035, 0.035, '#3E6B4F');
  for (const sx of [-1, 1]) for (const y of [0.93, 2.12]) v.box(NX + sx * (nw / 2 + 0.035), y, zb + 0.085, 0.1, 0.1, 0.03, P.gold);
  v.boxMin(NX - nw / 2 - 0.07, 2.12, zb, NX + nw / 2 + 0.07, 2.16, zb + 0.1, P.goldDeep);
  room.group.add(prop(v, null, 'backWall'));
  room.place(prop(pottedPlant(1.1, 2), { w: 0.45 * 1.1, d: 0.45 * 1.1 }, 'plant'), -1.8, zb + 0.4);
  room.place(prop(pottedPlant(1.0, 5, '#2F5DB3'), { w: 0.45, d: 0.45 }, 'plant'), 1.7, zb + 0.38);
}

/** Viber phone booth: shallow and open at the front so the phone shows under the number sign. */
function viberBooth(room, A, r) {
  const v = new VoxelBuilder();
  const W = 1.2;
  const D = 0.45;
  const H = 2.45;
  const VIOLET_D = '#4E3FB0';
  v.boxMin(-W / 2 - 0.04, 0, -D / 2 - 0.02, W / 2 + 0.04, 0.08, D / 2 + 0.04, VIOLET_D);
  v.boxMin(-W / 2, 0.08, -D / 2, W / 2, H - 0.25, -D / 2 + 0.06, '#E6E0FC');
  for (const sx of [-1, 1]) {
    v.boxMin(sx > 0 ? W / 2 - 0.08 : -W / 2, 0, -D / 2, sx > 0 ? W / 2 : -W / 2 + 0.08, H - 0.25, D / 2, VB);
    v.boxMin(sx > 0 ? W / 2 - 0.1 : -W / 2 - 0.02, 0, D / 2 - 0.08, sx > 0 ? W / 2 + 0.02 : -W / 2 + 0.1, H - 0.25, D / 2 + 0.02, VIOLET_D);
    v.boxMin(sx > 0 ? W / 2 + 0.002 : -W / 2 - 0.004, 0.7, -D / 2 + 0.06, sx > 0 ? W / 2 + 0.004 : -W / 2 - 0.002, 1.8, D / 2 - 0.1, '#D7CFFA');
  }
  v.boxMin(-W / 2 - 0.06, H - 0.25, -D / 2 - 0.04, W / 2 + 0.06, H - 0.05, D / 2 + 0.06, VB);
  v.boxMin(-W / 2 - 0.08, H - 0.05, -D / 2 - 0.06, W / 2 + 0.08, H, D / 2 + 0.08, P.gold);
  v.box(0, H + 0.07, 0, 0.5, 0.14, 0.3, VB);
  v.box(0, H + 0.18, 0, 0.12, 0.08, 0.12, P.gold);
  // number sign hanging under the roof front
  v.boxMin(-0.64, H - 0.47, D / 2 + 0.02, 0.64, H - 0.02, D / 2 + 0.08, VIOLET_D);
  A.quad(r.viber, 1.2, 0.429, mat(VX, H - 0.245, VZ + D / 2 + 0.085));
  // wall phone (the handset is animated), little shelf with a notepad
  const pz = -D / 2 + 0.06;
  v.box(0.06, 1.12, pz + 0.05, 0.26, 0.38, 0.1, '#2E2466');
  v.box(0.06, 1.12, pz + 0.105, 0.15, 0.17, 0.012, P.cream);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) v.box(0.01 + i * 0.05, 1.07 + j * 0.05, pz + 0.113, 0.028, 0.028, 0.006, '#4E3FB0');
  v.box(-0.14, 1.24, pz + 0.07, 0.05, 0.06, 0.08, P.gold);
  v.box(0.06, 0.86, pz + 0.12, 0.5, 0.04, 0.22, WOOD);
  rbox(v, 0.0, 0.89, pz + 0.13, 0.16, 0.02, 0.12, P.paper, 0, 0.2, 0);
  rbox(v, 0.17, 0.895, pz + 0.13, 0.12, 0.015, 0.015, P.maroon, 0, -0.4, 0);
  // booth details: window muntins on both sides, rivets on the front pillars, a roof lamp that
  // glows, a coiled cord, a directory book and a pencil cup on the shelf, a kick plate
  for (const sx of [-1, 1]) {
    const xo = sx * (W / 2 + 0.006);
    for (const y of [1.06, 1.43]) v.box(xo, y, -0.01, 0.012, 0.035, D - 0.16, VIOLET_D);
    v.box(xo, 1.25, -0.01, 0.012, 1.1, 0.035, VIOLET_D);
    for (let y = 0.3; y < H - 0.3; y += 0.3) v.box(sx * (W / 2 - 0.04), y, D / 2 + 0.024, 0.03, 0.03, 0.01, P.gold);
  }
  v.boxMin(-W / 2 + 0.08, 0.08, -D / 2 + 0.06, W / 2 - 0.08, 0.3, -D / 2 + 0.075, '#CFC6F5');
  v.boxMin(-W / 2 + 0.08, 0.3, -D / 2 + 0.06, W / 2 - 0.08, 0.32, -D / 2 + 0.08, P.gold);
  for (let i = 0; i < 4; i++) v.box(-0.14 + (i % 2) * 0.03, 1.0 - i * 0.035, pz + 0.07, 0.03, 0.02, 0.03, '#2E2466');
  v.box(0.24, 0.92, pz + 0.12, 0.12, 0.08, 0.17, P.maroon);
  v.box(0.24, 0.962, pz + 0.12, 0.124, 0.006, 0.16, P.gold);
  v.box(-0.12, 0.92, pz + 0.17, 0.05, 0.08, 0.05, P.cream);
  for (const dx of [-0.01, 0.012]) v.box(-0.12 + dx, 0.99, pz + 0.17, 0.008, 0.08, 0.008, dx > 0 ? P.maroon : TG);
  v.box(0, H + 0.3, 0, 0.14, 0.04, 0.14, P.gold);
  A.block(r.glow, mat(VX, H + 0.25, VZ, 0, 0, 0, 0.1, 0.07, 0.1));
  v.box(0, H + 0.14, 0.152, 0.3, 0.06, 0.006, P.gold);
  room.place(prop(v, { w: W + 0.12, d: D + 0.12 }, 'viberBooth'), VX, VZ);
  return { handset: new THREE.Vector3(VX - 0.14, 1.12, VZ + pz + 0.13) };
}

/** Messenger / Facebook post box with a little flag that pops up. */
function postBox(room, A, r) {
  const v = new VoxelBuilder();
  const BLUE_D = '#0759B8';
  v.box(0, 0.06, 0, 0.72, 0.12, 0.6, BLUE_D);
  v.box(0, 0.64, 0, 0.62, 1.04, 0.5, MS);
  v.box(0, 1.2, 0, 0.68, 0.1, 0.56, BLUE_D);
  v.box(0, 1.29, 0, 0.52, 0.1, 0.42, MS);
  v.box(0, 1.37, 0, 0.3, 0.07, 0.22, P.gold);
  v.box(0, 1.06, 0.252, 0.36, 0.06, 0.02, '#062A55');
  v.box(0, 1.06, 0.248, 0.42, 0.11, 0.012, P.gold);
  v.box(0, 0.25, 0.252, 0.5, 0.05, 0.012, P.gold);
  v.box(0.325, 0.86, 0.14, 0.05, 0.08, 0.08, P.ink);
  // rivets, a lit top rim, collection plate, base bolts and a hooded slot
  for (const sx of [-1, 1]) for (let y = 0.2; y < 1.1; y += 0.22) v.box(sx * 0.27, y, 0.252, 0.025, 0.025, 0.01, BLUE_D);
  v.box(0, 1.252, 0, 0.69, 0.006, 0.57, tone(MS, 1.25));
  v.box(0, 1.1, 0.268, 0.4, 0.025, 0.03, '#062A55');
  v.box(0, 0.36, 0.254, 0.24, 0.12, 0.012, P.cream);
  for (let i = 0; i < 3; i++) v.box(0, 0.39 - i * 0.03, 0.261, 0.17 - (i % 2) * 0.05, 0.012, 0.004, P.ink);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 0.3, 0.125, sz * 0.24, 0.05, 0.02, 0.05, P.gold);
  v.box(0, 1.405, 0, 0.18, 0.03, 0.12, tone(P.gold, 1.15));
  A.quad(r.messenger, 0.52, 0.364, mat(MX, 0.64, MZ + 0.258));
  room.place(prop(v, { w: 0.72, d: 0.6 }, 'postBox'), MX, MZ);
}

/** A-frame poster for TikTok (tilted back so the camera reads it). */
function tiktokPoster(room, B, r) {
  const v = new VoxelBuilder();
  const DARK = '#2A2118';
  const Fm = mat(0, 0, 0.13, -0.2);
  const f = new VoxelBuilder();
  for (const x of [-0.42, 0.42]) f.box(x, 0.64, 0, 0.06, 1.28, 0.05, DARK);
  f.box(0, 1.26, 0, 0.9, 0.07, 0.06, P.gold);
  f.box(0, 0.12, 0, 0.9, 0.05, 0.05, DARK);
  f.box(0, 0.7, -0.02, 0.8, 1.1, 0.02, '#141418');
  v.merge(f, Fm);
  B.quad(r.tiktok, 0.74, 1.028, mul(mat(TX, 0, TZ), mul(Fm, mat(0, 0.7, -0.008))));
  const Bm = mat(0, 0, -0.13, 0.2);
  const b = new VoxelBuilder();
  for (const x of [-0.42, 0.42]) b.box(x, 0.62, 0, 0.06, 1.24, 0.05, DARK);
  b.box(0, 0.5, 0, 0.84, 0.05, 0.04, DARK);
  v.merge(b, Bm);
  room.place(prop(v, { w: 0.95, d: 0.6 }, 'tiktokPoster'), TX, TZ);
}

/** Bench with plants, parcels and a mail sack, a sky-blue rug with a paper-plane emblem. */
function frontProps(room) {
  const b = new VoxelBuilder();
  b.box(0, 0.42, 0, 1.5, 0.07, 0.46, WOOD);
  b.box(0, 0.48, 0.02, 1.38, 0.06, 0.4, P.maroon);
  for (const y of [0.68, 0.86]) b.box(0, y, -0.21, 1.5, 0.09, 0.05, WOOD);
  for (const sx of [-1, 1]) {
    b.box(sx * 0.66, 0.21, 0.17, 0.06, 0.42, 0.06, P.ink);
    b.box(sx * 0.66, 0.46, -0.2, 0.06, 0.92, 0.06, P.ink);
    b.box(sx * 0.73, 0.62, 0.0, 0.07, 0.06, 0.46, P.goldDeep);
    b.box(sx * 0.73, 0.54, 0.18, 0.05, 0.12, 0.05, P.ink);
  }
  rbox(b, 0.3, 0.52, 0.05, 0.34, 0.02, 0.24, P.paper, 0, 0.3, 0);
  // a canvas mail sack on the bench, tied at the neck, letters peeking out, a gold post horn
  const SK = '#D8C7A0';
  b.box(-0.38, 0.66, 0.04, 0.4, 0.3, 0.32, SK);
  b.box(-0.38, 0.86, 0.04, 0.32, 0.12, 0.26, tone(SK, 1.06));
  b.box(-0.38, 0.95, 0.04, 0.16, 0.06, 0.14, tone(SK, 0.9));
  b.box(-0.38, 0.95, 0.04, 0.18, 0.025, 0.16, P.maroon);
  rbox(b, -0.42, 1.03, 0.04, 0.16, 0.12, 0.012, P.white, 0, 0.2, 0.2);
  rbox(b, -0.34, 1.02, 0.06, 0.14, 0.1, 0.012, '#DCEBF6', 0, -0.3, -0.25);
  b.box(-0.38, 0.68, 0.205, 0.14, 0.1, 0.012, P.gold);
  b.box(-0.38, 0.68, 0.21, 0.06, 0.04, 0.008, P.goldDeep);
  b.box(-0.38, 0.535, 0.04, 0.42, 0.04, 0.34, tone(SK, 0.75));
  room.place(prop(b, { w: 1.56, d: 0.5 }, 'bench'), -3.02, 2.05, Math.PI / 2);
  room.place(prop(pottedPlant(1.0, 3), { w: 0.45, d: 0.45 }, 'plant'), -3.05, 3.3);

  const p = new VoxelBuilder();
  p.box(0, 0.23, 0, 0.6, 0.46, 0.5, KRAFT);
  p.box(0, 0.46, 0, 0.61, 0.012, 0.06, KRAFT_D);
  p.box(0, 0.23, 0.252, 0.06, 0.46, 0.012, KRAFT_D);
  p.box(0.16, 0.3, 0.252, 0.16, 0.1, 0.012, P.white);
  rbox(p, 0.02, 0.62, 0.0, 0.42, 0.32, 0.38, '#DDBB86', 0, 0.35, 0);
  rbox(p, 0.02, 0.62, 0.0, 0.43, 0.32, 0.06, P.maroon, 0, 0.35, 0);
  rbox(p, 0.02, 0.79, 0.0, 0.1, 0.05, 0.1, P.gold, 0, 0.35, 0);
  p.box(0.5, 0.11, 0.08, 0.3, 0.22, 0.3, KRAFT);
  p.box(0.5, 0.11, 0.232, 0.04, 0.22, 0.01, KRAFT_D);
  p.box(-0.52, 0.27, 0.06, 0.4, 0.54, 0.36, '#EFE3C8');
  p.box(-0.52, 0.5, 0.06, 0.42, 0.06, 0.38, P.maroon);
  p.box(-0.52, 0.58, 0.06, 0.12, 0.08, 0.12, P.gold);
  rbox(p, -0.48, 0.6, 0.08, 0.22, 0.14, 0.015, P.white, -0.3, 0.2, 0.15);
  // twine crosses and stamped labels on the boxes
  p.box(0, 0.463, 0, 0.012, 0.012, 0.51, P.cream);
  p.box(0, 0.23, 0.253, 0.61, 0.012, 0.012, P.cream);
  p.box(-0.16, 0.33, 0.253, 0.14, 0.1, 0.006, P.white);
  p.box(-0.12, 0.35, 0.257, 0.04, 0.05, 0.004, '#C8323C');
  p.box(0.5, 0.223, 0.08, 0.012, 0.012, 0.31, P.cream);
  p.box(0.5, 0.11, 0.236, 0.31, 0.012, 0.012, P.cream);
  p.box(0.45, 0.15, 0.236, 0.08, 0.06, 0.006, TG);
  room.place(prop(p, { w: 1.5, d: 0.6 }, 'parcels'), 2.6, 2.75);
  room.place(prop(pottedPlant(1.05, 1), { w: 0.45 * 1.05, d: 0.45 * 1.05 }, 'plant'), 3.05, 1.55);

  const rug = new VoxelBuilder();
  rug.boxMin(-1.25, 0, -0.75, 1.25, 0.012, 0.75, P.gold);
  rug.boxMin(-1.05, 0, -0.95, 1.05, 0.012, 0.95, P.gold);
  rug.boxMin(-1.17, 0, -0.67, 1.17, 0.018, 0.67, '#A9CCE4');
  rug.boxMin(-0.97, 0, -0.87, 0.97, 0.018, 0.87, '#A9CCE4');
  planeBoxes((m, c) => rug.add(roomTools.UNIT, c, m), mat(0.25, 0.024, -0.15, 0, 0.5, 0, 2.4, 0.4, 2.4), P.white, '#DCEBF6');
  for (let i = 0; i < 4; i++) rug.box(-0.35 - i * 0.2, 0.022, 0.2 + i * 0.12 - i * i * 0.02, 0.1, 0.006, 0.05, P.white);
  // inner border of little blue diamonds, cream fringe on the front and back edges
  for (let x = -0.85; x <= 0.86; x += 0.17) for (const z of [-0.78, 0.78]) rbox(rug, x, 0.021, z, 0.05, 0.006, 0.05, TG, 0, Math.PI / 4, 0);
  for (let z = -0.55; z <= 0.56; z += 0.157) for (const x of [-1.08, 1.08]) rbox(rug, x, 0.021, z, 0.05, 0.006, 0.05, TG, 0, Math.PI / 4, 0);
  for (let x = -1.0; x <= 1.01; x += 0.0667) for (const z of [-1.0, 1.0]) rug.box(x, 0.006, z, 0.024, 0.012, 0.1, P.cream);
  room.place(prop(rug, null, 'rug'), 0, 0.45, 0, { solid: false });
}

// ---------------------------------------------------------------------------------
// Room
// ---------------------------------------------------------------------------------
export async function buildInterior(ctx = {}) {
  const [, logo] = await Promise.all([fontsReady(), artImage('logo')]); // her real logo (art.js)
  const room = kit.createRoom({ width: 7, depth: 8, wall: '#F7EFDD', wainscot: '#BCD6EA', trim: P.goldDeep, floor: 'tiles', floorColor: '#EADFC6', floorColor2: '#D6C39C', background: P.cream });
  room.id = 'contact';
  const { A, B, r } = contactAtlases(logo, { followers: stat('tiktokFollowers', '26.7K'), likes: stat('tiktokLikes', '289.4K') });

  room.place(prop(tileFloor(room), null, 'tiles'), 0, 0, 0, { solid: false });
  backWall(room, A, B, r);
  counterDesk(room, A, r);
  const booth = viberBooth(room, A, r);
  postBox(room, A, r);
  tiktokPoster(room, B, r);
  frontProps(room);

  room.addStation({
    id: 'ct-telegram', x: 0, z: -1.3, look: { x: 0, z: CZ }, emote: 'kiss', face: 'kiss', labelY: 2.35,
    line: { my: 'Telegram ကနေဆို အမြန်ဆုံး ပြန်ဖြေပေးမယ်နော်', en: "Message me on Telegram, I'll reply fastest!" },
  });
  room.addStation({
    id: 'ct-channel', x: NX, z: -2.55, look: { x: NX, z: -3.9 }, emote: 'cheer', face: 'star', labelY: 2.4,
    line: { my: 'Telegram ချန်နယ်လေး Join ပေးပါဦးရှင့်', en: 'Please join my Telegram channel!' },
  });
  room.addStation({
    id: 'ct-viber', x: VX, z: -2.0, look: { x: VX, z: VZ }, emote: 'phone', face: 'talk', labelY: 2.8,
    line: { my: 'Viber နဲ့ ဖုန်းဆက်လို့ရပါတယ်ရှင့်', en: 'You can call me on Viber!' },
  });
  room.addStation({
    id: 'ct-messenger', x: 1.75, z: 0.9, look: { x: MX, z: MZ }, emote: 'kiss', face: 'wink', labelY: 1.8,
    line: { my: 'Messenger ကနေလည်း စာပို့လို့ရတယ်နော်', en: 'You can message me on Messenger too!' },
  });
  room.addStation({
    id: 'ct-tiktok', x: -1.75, z: 0.9, look: { x: TX, z: TZ }, emote: 'dance', face: 'happy', labelY: 1.75,
    line: { my: 'TikTok မှာ Follow လုပ်ထားနော်', en: 'Follow me on TikTok!' },
  });

  room.bake();
  const signsA = A.mesh('signsA');
  const signsB = B.mesh('signsB');
  room.group.add(signsA, signsB);
  room.textures.push(signsA.userData.texture, signsB.userData.texture);

  // ---- moving bits: one instanced mesh ----
  const dyn = makeDyn();
  const addTo = (part) => (m, c) => dyn.boxM(part, m, c);
  // planes hang just under the (cut-away) ceiling line at the wall tops, on short threads with hooks
  const HANG = [
    [-1.45, 2.72, 0.2, 0.4, TG, '#1C86C0'],
    [0.35, 2.78, 1.3, -0.5, P.white, '#BFD9EC'],
    [1.5, 2.7, -0.1, 2.6, P.white, '#BFD9EC'],
    [-0.4, 2.8, 0.6, -2.2, '#F3D27A', P.goldDeep],
    [1.2, 2.74, 2.1, 1.2, TG, '#1C86C0'],
  ];
  const TOP = 3.0;
  const hang = HANG.map(([, y, , heading, c, f]) => {
    const p = dyn.part();
    const L = TOP - y;
    dyn.box(p, 0, -L / 2, 0, 0.01, L, 0.01, '#8C7A60');
    dyn.box(p, 0, 0, 0, 0.05, 0.03, 0.05, P.gold);
    planeBoxes(addTo(p), mat(0, -L - 0.02, 0, 0, heading, 0), c, f);
    return p;
  });
  const flyer = dyn.part();
  planeBoxes(addTo(flyer), new THREE.Matrix4(), P.white, TG);
  const flag = dyn.part();
  dyn.box(flag, 0, 0.2, 0, 0.04, 0.4, 0.04, P.ink);
  dyn.box(flag, 0.012, 0.33, 0.11, 0.03, 0.15, 0.2, P.maroon);
  const stamp = dyn.part();
  dyn.box(stamp, 0, 0.12, 0, 0.07, 0.07, 0.07, P.maroon);
  dyn.box(stamp, 0, 0.05, 0, 0.03, 0.1, 0.03, P.gold);
  dyn.box(stamp, 0, -0.02, 0, 0.13, 0.05, 0.1, P.maroonDeep);
  const handset = dyn.part();
  dyn.box(handset, 0, 0, 0, 0.06, 0.24, 0.06, '#2E2466');
  dyn.box(handset, 0, 0.12, 0.025, 0.09, 0.06, 0.08, '#2E2466');
  dyn.box(handset, 0, -0.12, 0.025, 0.09, 0.06, 0.08, '#2E2466');
  const notes = [0, 1].map((i) => {
    const p = dyn.part();
    const c = i ? '#E0485E' : P.gold;
    dyn.box(p, 0, 0, 0, 0.09, 0.075, 0.035, c);
    dyn.box(p, 0.035, 0.09, 0, 0.022, 0.17, 0.022, c);
    dyn.box(p, 0.07, 0.165, 0, 0.07, 0.03, 0.022, c);
    return p;
  });
  const flutter = dyn.part();
  dyn.box(flutter, 0, -0.1, 0.004, 0.2, 0.2, 0.008, '#FFF1A8');
  dyn.box(flutter, 0, 0, 0.012, 0.035, 0.035, 0.035, '#E0485E');
  const heart = dyn.part();
  dyn.heart(heart);
  const spk = [0, 1].map(() => {
    const p = dyn.part();
    dyn.sparkle(p, 1);
    return p;
  });
  // wall clock hands (pivot at the clock centre, pointing up = 12) and the scale needle
  const hourH = dyn.part();
  dyn.box(hourH, 0, 0.055, 0, 0.026, 0.11, 0.012, P.ink);
  const minH = dyn.part();
  dyn.box(minH, 0, 0.08, 0, 0.018, 0.16, 0.012, P.ink);
  const secH = dyn.part();
  dyn.box(secH, 0, 0.07, 0, 0.008, 0.18, 0.008, '#E0485E');
  dyn.box(secH, 0, 0, 0, 0.03, 0.03, 0.014, P.gold);
  const needle = dyn.part();
  dyn.box(needle, 0, 0.032, 0, 0.01, 0.064, 0.008, '#C8323C');
  // a second paper plane in flight trailing a dashed line of little white puffs
  const flyer2 = dyn.part();
  planeBoxes(addTo(flyer2), new THREE.Matrix4(), TG, '#1C86C0');
  const trail = Array.from({ length: 6 }, () => {
    const p = dyn.part();
    dyn.box(p, 0, 0, 0, 0.07, 0.025, 0.025, P.white);
    return p;
  });
  dyn.build(room.group);

  const H = 1.0;
  // each station's props get livelier while Maya stands there (boosts only grow while active,
  // so frozen dev frames stay deterministic)
  const boost = { tg: 0, ch: 0, vb: 0, ms: 0, tt: 0 };
  room.animators.push((dt, t, state) => {
    const act = state ? state.active : null;
    if (act === 'ct-telegram') boost.tg += dt * 1.4;
    else if (act === 'ct-channel') boost.ch += dt * 1.5;
    else if (act === 'ct-viber') boost.vb += dt * 1.2;
    else if (act === 'ct-messenger') boost.ms += dt * 1.0;
    else if (act === 'ct-tiktok') boost.tt += dt * 1.5;
    // hanging planes sway like pendulums and slowly twist on their strings
    for (let i = 0; i < hang.length; i++) {
      const h = HANG[i];
      dyn.set(hang[i], h[0], TOP, h[2], Math.sin(t * 1.3 + i * 1.7) * 0.09, Math.sin(t * 0.45 + i) * 0.35, Math.cos(t * 1.1 + i * 2.1) * 0.11, 1);
    }
    // a paper plane glides a big loop round the room, banking into its turns (faster while
    // Maya is at the Telegram desk)
    const a = (t + boost.tg) * 0.55;
    const dx = -Math.sin(a) * 2.0;
    const dz = Math.cos(a) * 0.95;
    dyn.set(flyer, Math.cos(a) * 2.0, 2.55 + Math.sin(a * 2) * 0.12, 0.45 + Math.sin(a) * 0.95, -0.4, Math.atan2(-dz, dx), Math.cos(a * 2) * 0.15, 1.3, 1.3, 1.3, 'YZX');
    // Messenger flag: pops up with overshoot, wobbles, settles, drops again
    const uf = frac((t + boost.ms) / 3.6);
    let ang = Math.PI / 2;
    if (uf < 0.14) ang = (Math.PI / 2) * (1 - easeOutBack(uf / 0.14));
    else if (uf < 0.7) ang = Math.sin((uf - 0.14) * 42) * 0.18 * Math.exp(-(uf - 0.14) * 9);
    else if (uf < 0.82) ang = (Math.PI / 2) * (0.5 - 0.5 * Math.cos(((uf - 0.7) / 0.12) * Math.PI));
    dyn.set(flag, MX + 0.345, 0.86, MZ + 0.14, ang, 0, 0, 1);
    // stamp: anticipation lift, slam with squash, recover
    const us = frac(t / 2.4);
    let sy = 0;
    let sq = 1;
    if (us < 0.28) sy = Math.sin((us / 0.28) * Math.PI * 0.5) * 0.05;
    else if (us < 0.36) sy = 0.05 - ((us - 0.28) / 0.08) * 0.19;
    else if (us < 0.6) {
      sy = -0.14;
      sq = 1 - 0.28 * Math.exp(-(us - 0.36) * 30);
    } else sy = -0.14 + 0.14 * (0.5 - 0.5 * Math.cos(((us - 0.6) / 0.4) * Math.PI));
    dyn.set(stamp, 1.12, H + 0.215 + sy, CZ + 0.12, 0, 0, 0, 1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    // Viber handset rings in bursts
    const ur = frac((t + boost.vb) / 2.6);
    const ring = ur < 0.4 ? Math.sin(ur * 90) * (ur < 0.2 ? 1 : 0.6) : 0;
    dyn.set(handset, booth.handset.x, booth.handset.y + Math.abs(ring) * 0.02, booth.handset.z, 0, 0, ring * 0.14, 1);
    // music notes bob up from the TikTok poster
    for (let i = 0; i < 2; i++) {
      const u = frac((t + boost.tt) / 2.8 + i * 0.5);
      const s = popLife(u, 0.15, 0.75);
      dyn.set(notes[i], TX + (i ? 0.3 : -0.25) + Math.sin(u * 7 + i) * 0.08, 1.45 + u * 0.75, TZ + 0.05, 0, Math.sin(u * 4) * 0.4, Math.sin(u * 9 + i) * 0.25, s * 1.3);
    }
    // a note on the notice board lifts in the draught
    const tc = t + boost.ch;
    dyn.set(flutter, NX + 0.02, 1.33, -room.depth / 2 + 0.1, Math.max(0, Math.sin(tc * 2.3)) * 0.35, 0, Math.sin(tc * 1.7) * 0.12, 1);
    // a heart pops out of the post box slot
    const uh = frac((t + boost.ms) / 3.0 + 0.3);
    const ph = popLife(uh, 0.18, 0.7) * 0.8;
    dyn.set(heart, MX + Math.sin(uh * 6) * 0.06, 1.15 + uh * 0.6, MZ + 0.3, 0, Math.sin(uh * 5) * 0.4, 0, ph);
    // sparkles beside the Telegram sign and the channel poster
    dyn.set(spk[0], -0.66, 2.08 + Math.sin(t * 1.5) * 0.04, CZ, 0, Math.sin(t) * 0.3, 0, 0.28 * twinkle(t * 0.7));
    dyn.set(spk[1], NX + 0.2, 1.95, -room.depth / 2 + 0.16, 0, 0, 0, 0.22 * twinkle(tc * 0.6 + 0.4));
    // the clock: second hand ticks with a little overshoot, minute and hour hands creep
    const sec = Math.floor(t);
    const tick = sec + easeOutBack(clamp01((t - sec) * 6));
    const cz = -room.depth / 2 + 0.07;
    dyn.set(secH, CLOCK.x, CLOCK.y, cz + 0.012, 0, 0, -(tick / 60) * Math.PI * 2, 1);
    dyn.set(minH, CLOCK.x, CLOCK.y, cz + 0.006, 0, 0, -((t / 60 + 10) / 60) * Math.PI * 2, 1);
    dyn.set(hourH, CLOCK.x, CLOCK.y, cz, 0, 0, -((t / 3600 + 2.2) / 12) * Math.PI * 2, 1);
    // the scale needle settles with a wobble each time a letter "lands"
    const un = frac(t / 4.2);
    dyn.set(needle, SCALE.x, SCALE.y, CZ + SCALE.z - 0.008, 0, 0, -0.55 - 0.9 * (1 - Math.exp(-un * 7) * Math.cos(un * 26)), 1);
    // second plane: a figure-eight high over the rug; the trail samples its own past path
    for (let k = 0; k <= trail.length; k++) {
      const b = (t + boost.ch * 0.5) * 0.42 - k * 0.075;
      const px = Math.sin(b) * 1.6;
      const pz = 0.6 + Math.sin(b * 2) * 0.55;
      const py = 2.25 + Math.sin(b * 3) * 0.08;
      if (k === 0) {
        const vx = Math.cos(b) * 1.6;
        const vz = Math.cos(b * 2) * 1.1;
        dyn.set(flyer2, px, py, pz, -Math.cos(b) * 0.35, Math.atan2(-vz, vx), 0.1, 1.05, 1.05, 1.05, 'YZX');
      } else {
        const sk = (k % 2 ? 0.9 : 0.6) * (1 - k / (trail.length + 1.5));
        dyn.set(trail[k - 1], px, py - 0.02, pz, 0, Math.atan2(-Math.cos(b * 2) * 1.1, Math.cos(b) * 1.6), 0, sk);
      }
    }
    dyn.commit();
  });
  return room;
}
