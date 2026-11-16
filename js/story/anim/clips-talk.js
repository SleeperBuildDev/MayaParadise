// Talk gestures (js/story/anim): what a person does with their arms, body and head while a line types.
//
// clip = { layer, dur, walkable, face, side, fn(P, c) } — static tables, nothing is made when one plays.
//   layer  'upper' (arms / torso / head) | 'head' (head only, stacks on an upper clip) | 'base'
//   side   'one': a one-arm move; the scheduler picks the arm (camera side, the elder's free hand, a target's side)
//   c      the slot playing it: u 0..1 phase (t / dur, loops wrap), w weight 0..1 (fades), t seconds, a amplitude,
//          s side (+1 left arm, -1 right arm), k a seed 0..1 per person, n a count (count clip), yaw / pitch toward a
//          target (radians, person space) when one was given
// No palms together, no kneeling, no deep bows (owner: no religion); no raised fists in a crowd (no politics).
import { arm, armAdd, arms, win, pulse, TAU } from './pose.js';

const sin = Math.sin, cos = Math.cos, abs = Math.abs;

export const TALK = {
  // ---- explaining (the defaults that fill most lines)
  explain: {
    layer: 'upper', dur: 2.2, walkable: false, face: 'talk', side: 'one',
    fn(P, c) {
      const { w, t, a, s } = c, b = sin(t * 4.2 + c.k * 5);
      arm(P, s, -0.75 - 0.18 * a * b, 0.12 + 0.12 * a * sin(t * 2.1), w);
      armAdd(P, -s, -0.12, 0.02, w);
      P.headZ += 0.05 * a * sin(t * 2.6) * w;
      P.headX += 0.03 * b * w;
    },
  },
  explainBoth: {
    layer: 'upper', dur: 2.4, walkable: false, face: 'talk',
    fn(P, c) {
      const { w, t, a } = c, b = sin(t * 3.6 + c.k * 4);
      arm(P, 1, -0.85 - 0.12 * a * b, 0.06 + 0.24 * a * (0.5 + 0.5 * sin(t * 3.6)), w);
      arm(P, -1, -0.85 + 0.12 * a * b, 0.06 + 0.24 * a * (0.5 + 0.5 * sin(t * 3.6 + Math.PI)), w);
      P.torsoX += 0.05 * a * w;
      P.headZ += 0.04 * sin(t * 2.2) * w;
    },
  },
  beat: { // the filler while a long line types: small chops in time with the letters
    layer: 'upper', dur: 2, walkable: true, face: false, side: 'one',
    fn(P, c) {
      const { w, t, a, s } = c, b = sin(t * 5.2 + c.k * 3);
      arm(P, s, -0.5 - 0.22 * a * b, 0.1, w * (1 - 0.5 * P.walk));
      P.headZ += 0.04 * sin(t * 3.1) * w;
      P.headX += 0.025 * b * w;
    },
  },
  point: { // at a GIVEN thing (yaw/pitch); without one, a short point ahead at what they are talking about
    layer: 'upper', dur: 1.6, walkable: true, face: 'smile', side: 'one',
    fn(P, c) {
      const { w, u } = c, k = w * (u < 0.15 ? 1 : 1 - 0.08 * sin(u * 18) * (1 - u));
      // direction in torso space: forward rotated by yaw, raised by pitch
      const cy = cos(c.yaw), sy = sin(c.yaw), cp = cos(c.pitch), sp = sin(c.pitch);
      const dx = sy * cp, dy = sp, dz = cy * cp;
      const x = Math.atan2(-dz, -dy), out = c.s * Math.asin(Math.max(-1, Math.min(1, dx)));
      arm(P, c.s, x, out, k);
      P.headY += c.yaw * 0.6 * w;
      P.headX -= c.pitch * 0.5 * w;
      P.torsoY += c.yaw * 0.15 * w;
    },
  },
  pointSelf: { // "me": hand to the chest, a small lean back
    layer: 'upper', dur: 1.3, walkable: true, face: 'smile', side: 'one',
    fn(P, c) {
      const k = c.w;
      arm(P, c.s, -1.05, -0.55, k);
      P.torsoX -= 0.05 * k;
      P.headX -= 0.04 * k;
    },
  },
  shrug: {
    layer: 'upper', dur: 1.2, walkable: true, face: 'think',
    fn(P, c) {
      const k = c.w * c.a;
      arm(P, 1, -0.6, 0.5, c.w); arm(P, -1, -0.6, 0.5, c.w);
      P.headZ += 0.12 * k;
      P.hipsY += 0.015 * k;
    },
  },
  nod: { layer: 'head', dur: 0.9, walkable: true, face: 'smile', fn(P, c) { P.headX += sin(c.u * TAU * 1.5) ** 2 * 0.2 * c.w * c.a; } },
  shake: { layer: 'head', dur: 1.1, walkable: true, face: 'worried', fn(P, c) { P.headY += sin(c.u * TAU * 2) * 0.3 * win(c.u, 0, 1, 0.2) * c.w * c.a; } },
  laugh: {
    layer: 'upper', dur: 1.6, walkable: true, face: 'happy', side: 'one',
    fn(P, c) {
      const { w, t, a, s } = c, b = abs(sin(t * 12)) * a;
      arm(P, s, -0.75, -0.45, w); // hand to the belly
      armAdd(P, -s, -0.1, 0.12, w);
      P.torsoX += (-0.1 + 0.03 * b) * w;
      P.headX += (-0.12 + 0.04 * b) * w;
      P.hipsY += 0.012 * b * w;
    },
  },
  giggle: {
    layer: 'upper', dur: 1.3, walkable: true, face: 'shy', side: 'one',
    fn(P, c) {
      const { w, t, a, s } = c, b = sin(t * 16) * a;
      arm(P, s, -2.0, -0.5, w); // hand to the mouth
      P.headX += 0.1 * w;
      P.torsoZ += 0.015 * b * w;
      P.headZ += 0.03 * b * w;
    },
  },
  thinkChin: {
    layer: 'upper', dur: 2.0, walkable: true, face: 'think', side: 'one',
    fn(P, c) {
      const { w, t, s } = c;
      arm(P, s, -2.15 - 0.05 * sin(t * 5) * (sin(t * 1.3) > 0.4 ? 1 : 0), -0.55, w);
      armAdd(P, -s, -0.55, -0.2, w); // the other arm across, under the elbow
      P.headX -= 0.07 * w;
      P.headZ += 0.1 * s * w;
    },
  },
  surprised: {
    layer: 'upper', dur: 1.3, walkable: true, face: 'surprised',
    fn(P, c) {
      const { u, a } = c, k = c.w * (u < 0.1 ? u / 0.1 : 1) * a;
      arms(P, -0.6, 0.9 * a, c.w * (u < 0.1 ? u / 0.1 : 1));
      P.torsoX -= 0.12 * k;
      P.headX -= 0.08 * k;
    },
  },
  sad: {
    layer: 'upper', dur: 2.0, walkable: true, face: 'sad',
    fn(P, c) {
      const { w } = c;
      arms(P, -0.12, -0.06, w);
      P.headX += 0.33 * w;
      P.torsoX += 0.14 * w;
      P.headZ += 0.05 * sin(c.t * 0.8) * w;
    },
  },
  sorry: {
    layer: 'upper', dur: 1.8, walkable: true, face: 'worried', side: 'one',
    fn(P, c) {
      const { w, u } = c, dip = win(u, 0.15, 0.75, 0.2);
      arm(P, c.s, -1.05, -0.55, w); // hand on the chest
      P.torsoX += 0.15 * dip * w;
      P.headX += (0.18 + 0.12 * dip) * w;
    },
  },
  angry: { // arms crossed (different heights so the boxes never sit in one plane), a hard little tilt
    layer: 'upper', dur: 1.8, walkable: false, face: 'hot',
    fn(P, c) {
      const { w, t } = c;
      arm(P, 1, -1.22, -0.6, w); arm(P, -1, -1.34, -0.6, w);
      P.headZ += 0.08 * w;
      P.headX -= 0.04 * w;
      P.torsoX -= 0.04 * w;
      P.headY += 0.04 * sin(t * 7) * w * (sin(t * 1.7) > 0.6 ? 1 : 0);
    },
  },
  handsHips: {
    layer: 'upper', dur: 1.8, walkable: false, face: 'smile',
    fn(P, c) {
      const { w } = c;
      arms(P, 0.12, 0.38, w); // (no elbows: the arms out a little and back reads as hands at the hips)
      P.torsoX -= 0.05 * w;
      P.headX -= 0.04 * w;
    },
  },
  waveHi: {
    layer: 'upper', dur: 1.6, walkable: true, face: 'happy', side: 'one',
    fn(P, c) {
      const { w, t } = c;
      arm(P, c.s, -0.2, 2.45 + 0.25 * sin(t * 14), w);
      P.headZ += 0.08 * c.s * w;
    },
  },
  waveBye: {
    layer: 'upper', dur: 1.4, walkable: true, face: 'smile', side: 'one',
    fn(P, c) {
      const { w, u } = c, k = w * win(u, 0, 1, 0.25);
      arm(P, c.s, -1.0, 1.0 + 0.3 * sin(u * TAU * 2), k);
    },
  },
  beckon: {
    layer: 'upper', dur: 1.4, walkable: true, face: 'smile', side: 'one',
    fn(P, c) {
      const { w, t } = c;
      arm(P, c.s, -1.2 + 0.25 * sin(t * 9), 0.1, w);
      P.headX -= 0.04 * w;
    },
  },
  greet: { // a small, everyday nod of the head and shoulders (never palms together)
    layer: 'upper', dur: 1.2, walkable: true, face: 'smile',
    fn(P, c) {
      const dip = win(c.u, 0.12, 0.8, 0.22) * c.w;
      arms(P, 0.04, 0.03, c.w * 0.5);
      P.torsoX += 0.2 * dip;
      P.headX += 0.15 * dip;
    },
  },
  thanks: {
    layer: 'upper', dur: 1.5, walkable: true, face: 'happy', side: 'one',
    fn(P, c) {
      const dip = win(c.u, 0.2, 0.85, 0.22) * c.w;
      arm(P, c.s, -1.05, -0.55, c.w);
      P.torsoX += 0.16 * dip;
      P.headX += 0.14 * dip;
    },
  },
  clap: {
    layer: 'upper', dur: 1.4, walkable: false, face: 'happy',
    fn(P, c) {
      const { w, t, a } = c, open = 0.5 + 0.5 * sin(t * 30);
      arm(P, 1, -1.1, -0.35 + 0.35 * open * a, w);
      arm(P, -1, -1.12, -0.35 + 0.35 * open * a, w);
    },
  },
  cheer: { // open arms up (never fists in a crowd)
    layer: 'upper', dur: 1.4, walkable: true, face: 'happy',
    fn(P, c) {
      const { w, u, a } = c;
      arm(P, 1, -0.3, 2.5 + 0.12 * sin(u * 20), w); arm(P, -1, -0.3, 2.5 + 0.12 * sin(u * 20 + 1), w);
      P.hipsY += abs(sin(u * Math.PI * 3)) * 0.05 * w * a;
      P.headX -= 0.12 * w;
    },
  },
  count: { // one hand palm up, the other taps it n times
    layer: 'upper', dur: 1.8, walkable: false, face: 'think', side: 'one',
    fn(P, c) {
      const { w, u } = c, n = c.n || 3, tap = u < 0.15 || u > 0.9 ? 0 : pulse(u - 0.15, 0.75 / n);
      arm(P, -c.s, -1.05, -0.32, w);
      arm(P, c.s, -1.3 + 0.18 * tap, -0.38, w);
      P.headX += 0.18 * w;
    },
  },
  showItem: { // "look at this": both hands forward together, eyes on it
    layer: 'upper', dur: 1.8, walkable: true, face: 'smile',
    fn(P, c) {
      const { w, t } = c;
      arm(P, 1, -1.05, -0.28, w); arm(P, -1, -1.05, -0.28, w);
      P.headX += 0.2 * w;
      P.torsoX += 0.03 * sin(t * 2) * w;
    },
  },
  insist: {
    layer: 'upper', dur: 1.6, walkable: false, face: 'hot', side: 'one',
    fn(P, c) {
      const { w, t } = c, b = abs(sin(t * 6));
      arm(P, c.s, -0.95 - 0.2 * b, 0.05, w);
      P.torsoX += 0.05 * b * w;
    },
  },
  calmDown: {
    layer: 'upper', dur: 1.8, walkable: false, face: 'worried',
    fn(P, c) {
      const { w, t } = c, p = 0.12 * sin(t * 6);
      arm(P, 1, -0.9 + p, 0.15, w); arm(P, -1, -0.9 + p, 0.15, w);
    },
  },
  worry: {
    layer: 'upper', dur: 1.8, walkable: true, face: 'worried',
    fn(P, c) {
      const { w, t } = c, b = 0.2 * sin(t * 5);
      arm(P, 1, -0.8, -0.3 + b, w); arm(P, -1, -0.85, -0.3 - b, w);
      P.headX += 0.12 * w;
    },
  },
  facepalm: {
    layer: 'upper', dur: 1.6, walkable: true, face: 'worried', side: 'one',
    fn(P, c) {
      arm(P, c.s, -2.35, -0.45, c.w);
      P.headX += 0.2 * c.w;
    },
  },
  proud: {
    layer: 'upper', dur: 1.8, walkable: false, face: 'happy',
    fn(P, c) {
      const { w, t } = c;
      arms(P, 0.15, 0.55, w);
      P.torsoX -= 0.06 * w;
      P.headX -= 0.1 * w;
      P.hipsY += abs(sin(t * 4)) * 0.008 * w;
    },
  },
  listen: { // head only: a tilt toward the speaker and a soft nod now and then
    layer: 'head', dur: 3, walkable: true, face: false,
    fn(P, c) {
      const { w, t, k } = c, per = 1.6 + k * 1.2, u = (t % per) / per;
      P.headZ += (0.08 * (k > 0.5 ? 1 : -1)) * w;
      P.headY += c.yaw * 0.6 * w; // (toward the speaker)
      P.headX += (u < 0.3 ? sin((u / 0.3) * Math.PI) * 0.12 : 0) * w;
    },
  },
  phone: {
    layer: 'upper', dur: 2.5, walkable: true, face: 'talk', side: 'one', prop: 'phone',
    fn(P, c) { arm(P, c.s, -2.1, -0.7, c.w); P.headZ += 0.1 * c.s * c.w; },
  },
  write: {
    layer: 'upper', dur: 2.5, walkable: false, face: 'think', prop: 'notebook',
    fn(P, c) {
      const { w, t } = c;
      arm(P, 1, -1.15, -0.3, w);
      arm(P, -1, -1.0 + 0.06 * sin(t * 9), -0.42 + 0.08 * sin(t * 4.5), w);
      P.headX += 0.3 * w;
    },
  },
  read: {
    layer: 'upper', dur: 3, walkable: false, face: 'think', prop: 'letter',
    fn(P, c) {
      const { w, t } = c;
      arm(P, 1, -1.25, -0.32, w); arm(P, -1, -1.25, -0.32, w);
      P.headX += (0.3 + 0.04 * sin(t * 0.7)) * w;
    },
  },
};
