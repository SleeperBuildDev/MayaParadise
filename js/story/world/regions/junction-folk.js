// Newsprint Junction: the still townsfolk at their work and the chalk boards on the footpaths. Drawn into the
// open world's merged chunk meshes (g = outlined solids, f = flat decals and tiny bits), so a whole street of
// them costs no draw call of its own. Item-local: origin = the item's (x, z), front = +Z, feet at y = 0.
// Registered through regions/junction.js (PROP; format at the top of regions/index.js).
// Original blocky art in the Junction's newsprint greys and ink; nothing here marks where to go.
// Every Burmese string is a draft for Maya.
//
// PROP:
//   jFolk { pose, seed, woman?, top?, bottom?, load?, stool? }   a townsperson at work, still. pose:
//     'stand' | 'readStand' (a paper held open) | 'sell' (a paper held up to the street) | 'sweep' |
//     'carry' (a tied bundle of papers on the shoulder) | 'head' (a flat basket on the head) | 'paste'
//     (one arm up with the paste brush) | 'hang' (both arms up, pegging washing) | 'squat' | 'sit' | 'read'
//     (sitting with a paper) | 'drink' (sitting with a tea glass) | 'kid' | 'chalk' (a child squatting, chalk
//     in hand) | 'write' (sitting at a lap board, pen in hand). stool: false = it sits on something drawn already.
//   jChalkArt { seed }   children's chalk drawings on the paving (ground only)
//   jPetals { n, r, seed }   fallen padauk blossom (ground only)
//   jABoard { lines: [{ my }], ry }   a propped chalk board on the footpath: prices, today's paper, a saying; never a way.
import { rng, shade } from '../kit.js';
import { J, face } from '../art/junction.js';

const SKIN = ['#F3CBAA', '#E8B48E', '#D9A077', '#C68A63', '#B47A55'];
const HAIR = ['#1F1B1B', '#1F1B1B', '#2B211C', '#3E2A20', '#B9B3A8'];
// newsprint town: whites, greys and inks, with the Junction's red, blue, teal and mustard
const TOPS = ['#F4EFE4', '#E6E1D5', '#DCE4E6', J.blueL, J.red, J.teal, J.mustard, '#8F897C', '#E9DFC9', J.greenL, '#D97C8A'];
const BOTS = ['#2E3D63', '#3A3634', J.blueD, J.tealD, J.maroon, '#6B3E64', '#7A5434', J.greenD, '#5D6670'];
const STOOLS = [J.red, J.blue, J.teal, J.mustard];

function jFolk(g, f, it) {
  const r = rng(it.seed || 11), pose = it.pose || 'stand';
  const kid = pose === 'kid' || pose === 'chalk' || it.kid, s = kid ? 0.72 : 1;
  const skin = SKIN[Math.floor(r() * SKIN.length)], hair = HAIR[Math.floor(r() * (kid ? 3 : HAIR.length))];
  const top = it.top || TOPS[Math.floor(r() * TOPS.length)], bot = it.bottom || BOTS[Math.floor(r() * BOTS.length)];
  const woman = it.woman ?? r() < 0.5;
  const sit = ['sit', 'read', 'drink', 'write'].includes(pose), squat = pose === 'squat' || pose === 'chalk';
  f.flatR(0, 0.02, 0.6 * s, 0.5 * s, 0.006, J.shadow, 0);
  const hipY = sit ? 0.42 : squat ? 0.3 * s + 0.02 : 0.78 * s;
  if (sit) {
    if (it.stool !== false) {
      const sc = it.stool || STOOLS[Math.floor(r() * STOOLS.length)];
      g.box(0, 0.25, -0.02, 0.32, 0.05, 0.32, sc);
      f.box(0, 0.11, -0.02, 0.24, 0.22, 0.24, shade(sc, 0.8));
    }
    g.box(0, hipY, 0.08, 0.38, 0.16, 0.44, bot); // the lap, longyi folded over the knees
    g.box(0, 0.2, 0.27, 0.36, 0.36, 0.12, bot);
    f.box(0, 0.03, 0.33, 0.34, 0.06, 0.16, J.ink); // sandals
  } else if (squat) {
    g.box(0, 0.2 * s, 0.05, 0.42 * s, 0.34 * s, 0.38 * s, bot);
    f.box(0, 0.03, 0.15, 0.34 * s, 0.06, 0.2 * s, J.ink);
  } else {
    g.box(0, hipY / 2 + 0.03, 0, 0.34 * s, hipY - 0.03, 0.24 * s, bot);
    if (!woman && !kid) face(f, 0, hipY - 0.06, 0.135, 0.1, 0.1, shade(bot, 0.72)); // the longyi knot (a flat quad: 2 triangles)
    for (const sx of [-0.08, 0.08]) f.box(sx * s, 0.03, 0.03, 0.12 * s, 0.06, 0.24 * s, J.ink);
  }
  // the body (leaning into the work)
  const tw = 0.4 * s, th = kid ? 0.42 : 0.5, ty = hipY + th / 2;
  const lean = pose === 'sweep' ? 0.28 : pose === 'read' || pose === 'write' ? 0.16 : squat ? 0.32 : 0;
  g.boxR(0, ty, lean * 0.3, tw, th, 0.26 * s, top, lean, 0, 0);
  if (woman && !kid && !sit && !squat) f.box(0, hipY + 0.02, 0, tw + 0.02, 0.06, 0.28, shade(top, 0.85)); // a blouse hem
  const ay = ty + th / 2 - 0.05, ax = tw / 2 + 0.06;
  const arm = (sx, rx, rz = 0) => g.boxR(sx * ax, ay - 0.2 * s, 0.04 + Math.sin(-rx) * 0.2 * s, 0.11 * s, 0.42 * s, 0.11 * s, top, rx, 0, rz);
  const hand = (x, y, z) => f.box(x, y, z, 0.1 * s, 0.1 * s, 0.1 * s, skin);
  const paper = (x, y, z, w, h, rx = -0.6, c = J.newsL) => { g.boxR(x, y, z, w, h, 0.02, c, rx, 0, 0); f.box(x, y + h * 0.3, z + 0.02, w * 0.7, 0.03, 0.01, J.red); };
  switch (pose) {
    case 'sweep':
      arm(-1, -0.9); arm(1, -0.7);
      g.boxR(0.06, 0.62, 0.44, 0.04, 1.2, 0.04, J.woodL, 0.55, 0, 0.1);
      g.boxR(0.0, 0.08, 0.8, 0.38, 0.16, 0.08, J.rope, 0.4, 0, 0); // a coconut-rib broom head
      break;
    case 'carry':
      arm(-1, 0); arm(1, -2.6);
      g.box(0.2, ty + th / 2 + 0.14, -0.02, 0.52, 0.28, 0.38, it.load || J.newsL); // a tied bundle of papers
      g.box(0.2, ty + th / 2 + 0.29, -0.02, 0.54, 0.02, 0.06, J.rope);
      g.box(0.2, ty + th / 2 + 0.14, 0.175, 0.06, 0.3, 0.02, J.rope);
      break;
    case 'head': {
      arm(-1, -2.9); arm(1, 0);
      const c = it.load || J.mustard;
      g.box(0, ty + th / 2 + 0.36, 0, 0.64, 0.12, 0.64, J.ropeD);
      for (let k = 0; k < 4; k++) f.box(-0.14 + (k % 2) * 0.28, ty + th / 2 + 0.47, -0.14 + (k >> 1) * 0.28, 0.2, 0.12, 0.2, k % 2 ? c : shade(c, 0.85));
      break;
    }
    case 'paste':
      arm(-1, 0); arm(1, -2.8, 0.15);
      g.boxR(ax + 0.02, ay + 0.42, 0.12, 0.05, 0.4, 0.05, J.woodL, -0.3, 0, 0); // the brush
      g.box(ax + 0.02, ay + 0.64, 0.2, 0.2, 0.08, 0.1, J.newsD);
      g.box(-0.34, 0.18, 0.18, 0.26, 0.32, 0.26, J.tin); // the paste bucket at the feet
      break;
    case 'hang':
      arm(-1, -2.9, -0.15); arm(1, -2.9, 0.15);
      hand(-ax, ay + 0.46, 0.1); hand(ax, ay + 0.46, 0.1);
      break;
    case 'readStand':
      arm(-1, -1.1); arm(1, -1.1);
      paper(0, ty + 0.12, 0.34, 0.56, 0.38, -0.25);
      break;
    case 'sell':
      arm(-1, -0.5); arm(1, -2.7);
      paper(ax + 0.02, ay + 0.55, 0.12, 0.36, 0.44, 0.1, J.white);
      g.box(-0.3, ty - 0.1, 0.2, 0.18, 0.34, 0.3, J.newsL); // the stack under the other arm
      break;
    case 'read':
    case 'write':
      arm(-1, -1.0); arm(1, -1.0);
      if (pose === 'read') paper(0, ty + 0.02, 0.38, 0.5, 0.34, -0.7);
      else { g.boxR(0, hipY + 0.16, 0.26, 0.5, 0.03, 0.36, J.woodL, 0.1, 0, 0); f.box(0.05, hipY + 0.19, 0.26, 0.32, 0.01, 0.24, J.white); g.box(0.18, hipY + 0.24, 0.3, 0.02, 0.02, 0.18, J.blueD); }
      break;
    case 'drink':
      arm(-1, -0.5); arm(1, -1.6);
      f.box(ax, ay + 0.06, 0.32, 0.08, 0.11, 0.08, '#E9C79A'); // a glass of tea, milky
      break;
    case 'chalk':
      arm(-1, -0.4); arm(1, -1.2);
      f.box(ax, 0.08, 0.36, 0.05, 0.05, 0.05, J.white);
      break;
    default:
      arm(-1, sit ? -0.6 : 0); arm(1, sit ? -0.6 : 0);
  }
  // the head: skin block, hair (a bun on some women), thanaka on some cheeks; a sun hat on some squatters
  const hy = ty + th / 2 + 0.17 * s, hs = 0.34 * s, hz = lean * 0.18;
  f.box(0, hy - 0.06, hz, 0.12, 0.08, 0.12, skin);
  g.box(0, hy + 0.08, hz, hs, hs, hs, skin);
  g.box(0, hy + 0.08 + hs / 2 - 0.04, hz - 0.03, hs + 0.04, 0.12, hs - 0.02, hair);
  g.box(0, hy + 0.08, hz - hs / 2 + 0.03, hs + 0.04, hs - 0.02, 0.08, hair);
  if (woman && !kid && r() < 0.6) g.box(0, hy + 0.2, hz - hs / 2 - 0.04, 0.16, 0.16, 0.14, hair);
  // (thanaka and eyes: flat quads on the face, 2 triangles each)
  if ((woman || kid) && r() < 0.55) for (const sx of [-1, 1]) face(f, sx * 0.1 * s, hy + 0.05, hz + hs / 2 + 0.01, 0.08, 0.07, '#F1DDA8');
  for (const sx of [-1, 1]) face(f, sx * 0.065 * s, hy + 0.1, hz + hs / 2 + 0.011, 0.035, 0.05, J.ink);
  if (it.hat || (squat && !kid && r() < 0.5)) { g.box(0, hy + 0.3, hz, 0.62, 0.05, 0.62, '#E8D2A0'); f.box(0, hy + 0.36, hz, 0.24, 0.1, 0.24, '#E8D2A0'); }
}

/** A chalk A-frame on the footpath (it.lines: [{ my }], two or three short lines). 0.7 x 0.5, 1.0 m tall. */
function jABoard(g, f, it, ctx) {
  f.flat(-0.42, -0.36, 0.42, 0.4, 0.006, J.shadow);
  // the front board stands upright on two legs; a back leg props it
  for (const sx of [-0.3, 0.3]) g.box(sx, 0.5, 0.1, 0.05, 1.0, 0.05, J.woodD);
  g.box(0, 0.58, 0.1, 0.62, 0.7, 0.04, J.woodD);
  g.boxR(0, 0.45, -0.12, 0.5, 0.9, 0.04, J.woodD, -0.45, 0, 0);
  g.box(0, 0.58, 0.125, 0.54, 0.62, 0.01, J.chalk);
  const lines = (it.lines || []).map((l, i) => ({ text: l.my, size: i ? 40 : 46, color: i ? '#F4EFE4' : '#F2CE63' }));
  if (lines.length) ctx.signs.push({ x: 0, y: 0.58, z: 0.135, w: 0.52, h: 0.58, lines, bg: '#3E4A3F', border: null, width: 192, height: 216 });
}

/** Children's chalk on the paving (ground only, no keep-out): a sun, a little house, a flower, a cat and a row of
 * sums, white and coloured chalk. it.seed picks which; w x d about 2.4 x 1.6. */
function jChalkArt(g, f, it) {
  const r = rng(it.seed || 5), y = 0.0085, L = 0.035;
  const cols = ['#F7F5EF', '#F7F5EF', '#F2CE63', '#E8A0A8', '#9CC3DE', '#A9D39A'];
  const c = () => cols[Math.floor(r() * cols.length)];
  const line = (x0, z0, x1, z1, col) => { const dx = x1 - x0, dz = z1 - z0; f.flatR((x0 + x1) / 2, (z0 + z1) / 2, L, Math.hypot(dx, dz), y, col, Math.atan2(dx, dz)); };
  const ring = (cx, cz, rad, col, n = 10) => { for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, b = ((k + 1) / n) * Math.PI * 2; line(cx + Math.sin(a) * rad, cz + Math.cos(a) * rad, cx + Math.sin(b) * rad, cz + Math.cos(b) * rad, col); } };
  const pick = [0, 1, 2, 3].sort(() => r() - 0.5).slice(0, 2 + Math.floor(r() * 2));
  pick.forEach((kind, i) => {
    const cx = -0.8 + i * 0.85, cz = (r() - 0.5) * 0.5, col = c();
    if (kind === 0) { ring(cx, cz, 0.22, '#F2CE63'); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; line(cx + Math.sin(a) * 0.3, cz + Math.cos(a) * 0.3, cx + Math.sin(a) * 0.45, cz + Math.cos(a) * 0.45, '#F2CE63'); } }
    else if (kind === 1) { line(cx - 0.3, cz + 0.3, cx + 0.3, cz + 0.3, col); line(cx - 0.3, cz - 0.15, cx + 0.3, cz - 0.15, col); line(cx - 0.3, cz - 0.15, cx - 0.3, cz + 0.3, col); line(cx + 0.3, cz - 0.15, cx + 0.3, cz + 0.3, col); line(cx - 0.36, cz - 0.15, cx, cz - 0.45, col); line(cx + 0.36, cz - 0.15, cx, cz - 0.45, col); }
    else if (kind === 2) { ring(cx, cz - 0.15, 0.08, '#F2CE63', 6); for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; ring(cx + Math.sin(a) * 0.17, cz - 0.15 + Math.cos(a) * 0.17, 0.08, '#E8A0A8', 6); } line(cx, cz - 0.05, cx, cz + 0.45, '#A9D39A'); }
    else { ring(cx, cz, 0.2, col, 9); line(cx - 0.15, cz - 0.15, cx - 0.1, cz - 0.32, col); line(cx + 0.15, cz - 0.15, cx + 0.1, cz - 0.32, col); f.flatR(cx - 0.07, cz - 0.03, 0.05, 0.05, y, col, 0); f.flatR(cx + 0.07, cz - 0.03, 0.05, 0.05, y, col, 0); }
  });
  g.box(0.95, 0.025, 0.55, 0.06, 0.05, 0.06, '#F7F5EF'); // the stub of chalk, left behind
}

/** Fallen padauk blossom on the paper (ground only): a drift of small yellow flecks. it.n flecks (default 18). */
function jPetals(g, f, it) {
  const r = rng(it.seed || 9), n = it.n || 18, R = it.r || 1.2;
  for (let k = 0; k < n; k++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R;
    f.flatR(Math.sin(a) * d, Math.cos(a) * d, 0.09, 0.07, 0.008, r() < 0.7 ? '#F2C33A' : '#E8A630', r() * 3);
  }
}

export const PROP = {
  jChalkArt: { draw: jChalkArt, obstacles: () => [] },
  jPetals: { draw: jPetals, obstacles: () => [] },
  jFolk: { draw: jFolk, r: 0.3 },
  jABoard: { draw: jABoard, r: 0.35 },
};
