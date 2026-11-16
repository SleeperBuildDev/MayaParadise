// Job loops and base poses (js/story/anim): what townsfolk do with their hands all day.
//
// Base-layer clips loop until stopped. walkable: false ones fade out while the person walks and back in when
// they stand (the scheduler does it). The legs and hips are only touched by sit / pedal (a caller-confirmed
// seat: anim.play(who, 'sit', { seat: 0.45 })) and by hops of a few centimetres: feet.js takes anyone whose
// hips sit more than 0.08 m low for seated, so nothing else ever lowers them past 0.06 m (pose.js safe()).
// prop: the thing in their hand (props.js); the hand that holds it is c.s (one-arm loops) or the right hand.
import { arm, armAdd, arms, pulse, TAU } from './pose.js';

const sin = Math.sin, cos = Math.cos, abs = Math.abs;

// the busy-hands-in-front base most crafts share (net knots, sorting, kneading...)
function hands(P, w, t, rate, dip, lean) {
  const b = sin(t * rate);
  arm(P, 1, -1.0 + b * 0.16, -0.18, w);
  arm(P, -1, -1.0 - b * 0.16, -0.18, w);
  P.torsoX += lean * w;
  P.headX += (0.24 + dip * abs(b)) * w;
}

export const WORK = {
  sweep: {
    layer: 'base', dur: 3, loop: true, walkable: false, prop: 'broom', face: false,
    fn(P, c) {
      const { w, t } = c, b = sin(t * 3.2);
      arm(P, 1, -0.75, -0.3 + b * 0.3, w);
      arm(P, -1, -0.95, -0.1 - b * 0.3, w);
      P.torsoX += 0.16 * w; P.torsoY += b * 0.12 * w; P.headX += 0.16 * w;
    },
  },
  stirPot: {
    layer: 'base', dur: 3, loop: true, walkable: false, prop: 'ladle', face: false, side: 'one',
    fn(P, c) {
      const { w, t, s } = c, a = t * 3.4;
      arm(P, s, -1.0 + sin(a) * 0.14, 0.02 + cos(a) * 0.14, w);
      arm(P, -s, -0.55, -0.05, w);
      P.torsoX += 0.13 * w; P.headX += 0.26 * w;
    },
  },
  fanGrill: {
    layer: 'base', dur: 3, loop: true, walkable: false, prop: 'fan', face: false, side: 'one',
    fn(P, c) {
      const { w, t, s } = c, turn = pulse(t, 2.6);
      arm(P, s, -0.95, 0.15 + 0.22 * sin(t * 16), w); // the hand fan flicks
      arm(P, -s, -1.05 + 0.25 * turn, -0.15, w); // turning the skewers now and then
      P.torsoX += 0.12 * w; P.headX += 0.28 * w;
    },
  },
  sellHand: { // reach to the stall, hold it out to a buyer, back
    layer: 'base', dur: 5, loop: true, walkable: false, prop: 'parcel', face: false, side: 'one',
    fn(P, c) {
      const { w, u, s } = c;
      const reach = u < 0.3 ? 0 : u < 0.45 ? (u - 0.3) / 0.15 : u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2;
      const k = reach * reach * (3 - 2 * reach);
      arm(P, s, -0.85 - 0.6 * k, 0.05 - 0.1 * k, w);
      armAdd(P, -s, -0.3, 0, w);
      P.torsoX += (0.15 - 0.1 * k) * w; P.headX += (0.25 - 0.3 * k) * w;
    },
  },
  callOut: { // a vendor's call: hand at the mouth, chest out, every few seconds
    layer: 'base', dur: 6, loop: true, walkable: false, face: false, side: 'one',
    fn(P, c) {
      const { w, u, s } = c, k = u > 0.55 && u < 0.85 ? sin(((u - 0.55) / 0.3) * Math.PI) : 0;
      arm(P, s, -0.3 - 1.75 * k, 0.06 - 0.46 * k, w);
      P.torsoX -= 0.08 * k * w; P.headX -= 0.12 * k * w;
    },
  },
  pourTea: {
    layer: 'base', dur: 5, loop: true, walkable: false, prop: 'teapot', face: false,
    fn(P, c) {
      const { w, u } = c, k = u > 0.3 && u < 0.75 ? sin(((u - 0.3) / 0.45) * Math.PI) : 0;
      arm(P, 1, -1.0 - 0.55 * k, -0.12, w); // the pot comes up high (the long pull)
      arm(P, -1, -1.0, -0.2, w); // the cup low
      P.headX += 0.22 * w;
    },
  },
  sipTea: {
    layer: 'base', dur: 6.5, loop: true, walkable: false, prop: 'cup', face: false, side: 'one',
    fn(P, c) {
      const { w, u, s } = c, k = u > 0.55 && u < 0.85 ? sin(((u - 0.55) / 0.3) * Math.PI) : 0;
      arm(P, s, -1.0 - 1.05 * k, -0.25 - 0.25 * k, w);
      armAdd(P, -s, -0.15, 0, w);
      P.headX += (0.05 - 0.12 * k) * w;
    },
  },
  readPaper: {
    layer: 'base', dur: 6, loop: true, walkable: false, prop: 'paper', face: false,
    fn(P, c) {
      const { w, u, t } = c, turn = u > 0.85 ? sin(((u - 0.85) / 0.15) * Math.PI) : 0;
      arm(P, 1, -1.2 - 0.15 * turn, -0.18 + 0.2 * turn, w);
      arm(P, -1, -1.2, -0.18, w);
      P.headX += (0.26 + 0.03 * sin(t * 0.7)) * w; P.headY += 0.12 * sin(t * 0.5) * w;
    },
  },
  hammer: {
    layer: 'base', dur: 2, loop: true, walkable: false, prop: 'hammer', face: false, side: 'one',
    fn(P, c) {
      const { w, t, s } = c, u = (t * 1.6) % 1, k = u < 0.6 ? u / 0.6 : 1 - (u - 0.6) / 0.4;
      arm(P, s, -0.9 - 0.95 * k * k, 0.12, w);
      arm(P, -s, -0.9, -0.2, w);
      P.torsoX += 0.2 * w; P.headX += 0.25 * w;
    },
  },
  carryShoulder: {
    layer: 'base', dur: 4, loop: true, walkable: true, prop: 'sack', face: false, side: 'one',
    fn(P, c) {
      arm(P, c.s, -1.9, 0.55, c.w); // (hand at the shoulder's side; the sack lies back over the shoulder, clear of the head)
      P.torsoZ += 0.04 * c.s * c.w; P.headZ -= 0.05 * c.s * c.w;
    },
  },
  carryHead: { // the basket balanced on the head, hands free: on these bodies the head stands 0.46-0.54 m above the
    // shoulder and a raised arm reaches 0.26-0.37 m, so hands "on the basket" stopped 0.15-0.22 m short of it.
    // Standing, the near hand rests on the hip; walking, the arms swing with the walk. A child (kid) carries it in
    // front in both hands instead (index.js start()).
    layer: 'base', dur: 4, loop: true, walkable: true, prop: 'basket', face: false, kid: 'carryFront', kidProp: 'basketFront',
    fn(P, c) {
      const { w, t, s } = c, still = w * (1 - P.walk);
      arm(P, s, 0.12, 0.4, still); // (no elbows: the arm out a little and back reads as a hand on the hip)
      armAdd(P, -s, 0, 0.03, still);
      P.torsoX -= 0.03 * w; P.headX -= 0.03 * w; // upright under the load
      P.headZ += 0.02 * sin(t * 1.6) * w; // a slow balancing sway
    },
  },
  carryFront: {
    layer: 'base', dur: 4, loop: true, walkable: true, prop: 'box', face: false,
    fn(P, c) { arm(P, 1, -1.15, -0.22, c.w); arm(P, -1, -1.15, -0.22, c.w); P.torsoX -= 0.04 * c.w; },
  },
  pushCart: {
    layer: 'base', dur: 4, loop: true, walkable: true, face: false,
    fn(P, c) { arm(P, 1, -1.2, 0.05, c.w); arm(P, -1, -1.2, 0.05, c.w); P.torsoX += 0.22 * c.w; },
  },
  fishRod: {
    layer: 'base', dur: 7, loop: true, walkable: false, prop: 'rod', face: false,
    fn(P, c) {
      const { w, u, t } = c, pull = u > 0.8 ? sin(((u - 0.8) / 0.2) * Math.PI) : 0, jig = 0.04 * sin(t * 5);
      arm(P, 1, -1.05 - 0.35 * pull + jig, -0.22, w);
      arm(P, -1, -1.0 - 0.35 * pull + jig, -0.22, w);
      P.torsoX -= 0.05 * pull * w; P.headX += (0.1 - 0.15 * pull) * w;
    },
  },
  mendNet: { layer: 'base', dur: 3, loop: true, walkable: false, face: false, fn(P, c) { hands(P, c.w, c.t, 3.2, 0.06, 0.16); } },
  knead: {
    layer: 'base', dur: 3, loop: true, walkable: false, face: false,
    fn(P, c) {
      const { w, t } = c, b = abs(sin(t * 3));
      arms(P, -0.95 + 0.25 * b, -0.15, w);
      P.torsoX += (0.22 + 0.06 * b) * w; P.headX += 0.25 * w;
    },
  },
  weave: { layer: 'base', dur: 3, loop: true, walkable: false, face: false, fn(P, c) { hands(P, c.w, c.t, 12.5, 0.02, 0.1); } },
  washScrub: {
    layer: 'base', dur: 3, loop: true, walkable: false, face: false,
    fn(P, c) {
      const { w, t } = c, b = sin(t * 9);
      arm(P, 1, -1.0 + 0.2 * b, -0.15, w); arm(P, -1, -1.0 - 0.2 * b, -0.15, w);
      P.torsoX += 0.5 * w; P.headX += 0.12 * w;
    },
  },
  hangLaundry: {
    layer: 'base', dur: 5, loop: true, walkable: false, prop: 'cloth', face: false,
    fn(P, c) {
      const { w, u } = c, down = u < 0.25 ? sin((u / 0.25) * Math.PI) : 0, up = u > 0.3 && u < 0.9 ? sin(((u - 0.3) / 0.6) * Math.PI) : 0;
      arm(P, 1, -0.3 - 2.1 * up - 0.4 * down, 0.15, w); arm(P, -1, -0.3 - 2.0 * up - 0.4 * down, 0.15, w);
      P.torsoX += (0.55 * down - 0.06 * up) * w; P.headX += (0.2 * down - 0.3 * up) * w;
    },
  },
  waterPlants: {
    layer: 'base', dur: 5, loop: true, walkable: false, prop: 'can', face: false, side: 'one',
    fn(P, c) {
      const { w, t, s } = c;
      arm(P, s, -0.9, 0.05, w);
      P.torsoY += 0.2 * sin(t * 0.9) * w; P.torsoX += 0.12 * w; P.headX += 0.3 * w;
    },
  },
  scatterFeed: {
    layer: 'base', dur: 2.2, loop: true, walkable: false, prop: 'bowl', face: false,
    fn(P, c) {
      const { w, u } = c, k = u < 0.35 ? sin((u / 0.35) * Math.PI) : 0;
      arm(P, 1, -0.95, -0.25, w); // the bowl
      arm(P, -1, -0.6 - 0.5 * k, -0.25 + 1.0 * k, w); // the throw
      P.headX += 0.25 * w;
    },
  },
  flyKite: {
    layer: 'base', dur: 3, loop: true, walkable: true, prop: 'reel', face: false,
    fn(P, c) {
      const { w, t } = c, tug = abs(sin(t * 2.4)) * 0.15;
      arm(P, 1, -1.9 + tug, -0.15, w); arm(P, -1, -1.75, -0.2, w);
      P.headX -= 0.35 * w; P.torsoX -= 0.05 * w;
    },
  },
  holdUmbrella: {
    layer: 'base', dur: 4, loop: true, walkable: true, prop: 'umbrella', face: false, side: 'one',
    fn(P, c) { arm(P, c.s, -1.3, 0.75, c.w); }, // (the hand out at the side so the pole stands beside the face, not across it)
  },
  playKids: { // a clapping game with a hop
    layer: 'base', dur: 2, loop: true, walkable: false, face: false,
    fn(P, c) {
      const { w, t, k } = c, u = (t * 1.2 + k) % 1, clapIn = u < 0.5 ? 1 : 0, b = sin(u * TAU * 2);
      arm(P, 1, -1.2 - 0.3 * clapIn, -0.3 + 0.5 * (b * 0.5 + 0.5), w);
      arm(P, -1, -1.2 - 0.3 * (1 - clapIn), -0.3 + 0.5 * (b * 0.5 + 0.5), w);
      P.hipsY += abs(sin(t * 5)) * 0.025 * w;
    },
  },
  skipRope: {
    layer: 'base', dur: 1, loop: true, walkable: false, face: false,
    fn(P, c) {
      const { w, t } = c, a = t * 7;
      arms(P, -0.5 + 0.25 * sin(a), 0.5 + 0.15 * cos(a), w);
      P.hipsY += abs(sin(a)) * 0.04 * w;
    },
  },
  idleShift: { // a rest pose: hands clasped behind the back
    layer: 'base', dur: 4, loop: true, walkable: false, face: false,
    fn(P, c) { arms(P, 0.35, -0.05, c.w); P.torsoX -= 0.03 * c.w; P.headZ += 0.04 * sin(c.t * 0.6) * c.w; },
  },
  sit: { // needs a seat height from the caller: anim.play(p, 'sit', { seat: 0.42 })
    layer: 'base', dur: 4, loop: true, walkable: false, seat: true, face: false,
    fn(P, c) {
      const { w } = c;
      P.hipsY += (c.seat - P.hipsY) * w;
      P.lLx += (-1.45 - P.lLx) * w; P.lRx += (-1.45 - P.lRx) * w;
      arms(P, -0.55, -0.12, w); // hands on the knees
    },
  },
  pedal: {
    layer: 'base', dur: 1.2, loop: true, walkable: true, seat: true, face: false,
    fn(P, c) {
      const { w, t } = c, a = t * 6;
      P.hipsY += (c.seat - P.hipsY) * w;
      P.lLx += (-1.1 + 0.5 * sin(a) - P.lLx) * w; P.lRx += (-1.1 - 0.5 * sin(a) - P.lRx) * w;
      arms(P, -1.3, 0.12, w); P.torsoX += 0.15 * w;
    },
  },
  chinlone: { // people.js's own kick mood keeps the ball (its bone); this only steadies the arms
    layer: 'base', dur: 4, loop: true, walkable: false, face: false, keepMood: true,
    fn(P, c) { arms(P, -0.2, 0.55, c.w * 0.5); },
  },
};

// held moods people.js sets (setMood) that anim plays as fading loops instead, so a mood never snaps in
export const MOOD_CLIPS = {
  hot: {
    layer: 'base', dur: 3, loop: true, walkable: true, face: false,
    fn(P, c) { arms(P, -0.15, 0.22, c.w); P.torsoX += 0.05 * c.w; P.headX += (0.08 + sin(c.t * 24) * 0.012) * c.w; },
  },
  down: {
    layer: 'base', dur: 3, loop: true, walkable: true, face: false,
    fn(P, c) { const w = c.w; P.torsoX += 0.16 * w; P.headX += 0.28 * w; P.aLz += (0.02 - P.aLz) * w; P.aRz += (-0.02 - P.aRz) * w; P.hipsY -= 0.01 * w; },
  },
  shy: {
    layer: 'base', dur: 3, loop: true, walkable: true, face: false,
    fn(P, c) { arms(P, -0.35, -0.08, c.w); P.headX += 0.12 * c.w; P.headZ += 0.05 * c.w; },
  },
  play: { // a windmill / toy held up
    layer: 'base', dur: 3, loop: true, walkable: true, face: false,
    fn(P, c) {
      const { w, t } = c;
      arm(P, -1, -2.4 + sin(t * 2) * 0.15, 0.1, w);
      P.headX -= 0.12 * w; P.headZ += sin(t * 1.3) * 0.08 * w; P.hipsY += abs(sin(t * 3)) * 0.012 * w;
    },
  },
  work: { layer: 'base', dur: 3, loop: true, walkable: false, face: false, fn(P, c) { hands(P, c.w, c.t, 6.5, 0, 0.12); } },
};
