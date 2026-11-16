// Event reactions (js/story/anim): what a crowd does when something happens (anim.react()).
// They only pose: a caller that wants people to move (run for shelter, gather round) moves them with roam / nav
// as today. Heads turn to the event through people.js lookAt (react() sets it) plus c.yaw / c.pitch here.
import { arm, arms, win, TAU } from './pose.js';

const sin = Math.sin, abs = Math.abs;

export const REACT = {
  gatherLook: { // lean in, hands behind the back, a little tiptoe
    layer: 'upper', dur: 4, walkable: false, face: 'surprised',
    fn(P, c) {
      const { w, t } = c;
      arms(P, 0.35, -0.05, w);
      P.torsoX += 0.1 * w; P.hipsY += 0.01 * w;
      P.headY += c.yaw * 0.5 * w; P.headX += (0.05 - c.pitch * 0.4) * w;
      P.headZ += 0.05 * sin(t * 0.9) * w;
    },
  },
  pointAt: { // the point clip with its target required (react() always gives one)
    layer: 'upper', dur: 1.8, walkable: true, face: 'surprised', side: 'one',
    fn(P, c) {
      const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
      const x = Math.atan2(-cy * cp, -sp), out = c.s * Math.asin(Math.max(-1, Math.min(1, sy * cp)));
      arm(P, c.s, x, out, c.w);
      P.headY += c.yaw * 0.6 * c.w; P.headX -= c.pitch * 0.5 * c.w;
    },
  },
  cheerReact: {
    layer: 'upper', dur: 1.8, walkable: true, face: 'happy',
    fn(P, c) {
      const { w, u, a } = c;
      arm(P, 1, -0.3, 2.45 + 0.12 * sin(u * 22), w); arm(P, -1, -0.3, 2.45 + 0.12 * sin(u * 22 + 1.3), w);
      P.hipsY += abs(sin(u * Math.PI * 4)) * 0.045 * w * a;
      P.headX -= 0.14 * w;
    },
  },
  applaud: {
    layer: 'upper', dur: 3, walkable: false, face: 'happy',
    fn(P, c) {
      const { w, t, k, a } = c, open = 0.5 + 0.5 * sin(t * (26 + k * 8));
      arm(P, 1, -1.15, -0.35 + 0.33 * open * a, w); arm(P, -1, -1.17, -0.35 + 0.33 * open * a, w);
      P.headX -= 0.05 * w;
    },
  },
  shelter: { // both arms over the head (rain): walkable, the caller runs them to cover
    layer: 'upper', dur: 3, walkable: true, face: 'worried',
    fn(P, c) { arm(P, 1, -2.55, 0.3, c.w); arm(P, -1, -2.6, 0.3, c.w); P.torsoX += 0.1 * c.w; P.headX += 0.1 * c.w; },
  },
  lookUp: { // head up, a hand shading the eyes (kites, rain, birds)
    layer: 'upper', dur: 2.5, walkable: true, face: 'surprised', side: 'one',
    fn(P, c) { arm(P, c.s, -2.4, -0.6, c.w); P.headX -= 0.5 * c.w; P.torsoX -= 0.06 * c.w; },
  },
  startle: {
    layer: 'upper', dur: 1.2, walkable: true, face: 'surprised',
    fn(P, c) {
      const { u, w } = c, jump = u < 0.15 ? sin((u / 0.15) * Math.PI) : 0;
      arms(P, -0.5, 0.75, w * (u < 0.08 ? u / 0.08 : 1));
      P.torsoX -= (0.15 * jump + 0.06) * w; P.hipsY += 0.03 * jump * w;
    },
  },
  pickUp: { // bend at the waist (no knees on the rig), reach, rise: hips never go low
    layer: 'upper', dur: 1.8, walkable: false, face: false, side: 'one',
    fn(P, c) {
      const { u, w } = c, k = win(u, 0.05, 0.85, 0.3);
      P.torsoX += 0.62 * k * w; P.headX += 0.12 * k * w;
      arm(P, c.s, -0.45 - 0.25 * k, 0.05, w);
    },
  },
  handOver: { // the arm out toward a person (c.yaw), held, back
    layer: 'upper', dur: 1.8, walkable: false, face: 'smile', side: 'one',
    fn(P, c) {
      const k = win(c.u, 0.05, 0.9, 0.25) * c.w;
      arm(P, c.s, -1.3, c.s * Math.max(-0.5, Math.min(0.5, c.yaw)) * 0.8, k);
      P.torsoX += 0.06 * k; P.headY += c.yaw * 0.5 * c.w;
    },
  },
  shiver: { // rain: arms hugged low, a small quick shake
    layer: 'upper', dur: 2.5, walkable: true, face: 'worried',
    fn(P, c) {
      const { w, t } = c;
      arm(P, 1, -0.75, -0.55, w); arm(P, -1, -0.85, -0.55, w);
      P.torsoZ += 0.02 * sin(t * 40) * w; P.headX += 0.1 * w;
    },
  },
};
void TAU;
