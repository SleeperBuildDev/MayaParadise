// Ko Hein Htet ကိုဟိန်းထက် - the townsman who is always running late. His look and every animation.
//
// He is a people.js person (same art: boxes, cel shading, skinned outline, face atlas, blob shadow:
// still 4 draw calls) dressed after createPerson: his arms and legs are rebuilt with elbows and
// knees (so he can really run), and his suit, black shirt, white sneakers, gold wristwatch, folder of
// papers under the right arm, cowlick and props (flying sheets, three juggling things, a paper fan, a
// sweat drop) are all merged into his one skinned mesh on bones of their own. Hidden props are bones
// scaled to nothing inside the body, so they never cost a draw call.
//
//   import { createHeinHtet, HH_LOOK, HH_ANIMS } from './heinhtet/look.js';
//   const hh = createHeinHtet();            // or createHeinHtet(createPerson) with people.js's own
//   hh.root / hh.update(dt, { speed? }) / hh.setFace / hh.setMood / hh.talk / hh.lookAt / hh.headTop / hh.portrait / hh.dispose
//   hh.run(speed)                        0 = idle in a hurry (bouncing on his toes, glancing at the watch), 2-6 = jog / run / sprint
//   hh.play(name, { loop }) -> Promise   one of HH_ANIMS; resolves when a one-shot ends (or when stopped / replaced)
//   hh.stopAnim()
//   hh.emote(name) -> Promise            people.js names still work (wave, nod, bow, cheer, shrug, think, slump, fists, point)
//   hh.animDur(name), hh.anim (current name or null), hh.offset (body offset an anim is using, root space)
//
// update(dt, { speed }): speed in m/s; when left out, the speed given to run() is used.
import * as THREE from '../../game/three.js';
import { mergeGeometries, mergeVertices } from '../../game/three.js';
import { VoxelBuilder } from '../../game/voxel.js';
import { createPerson as peopleCreatePerson } from '../people.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (s) => { s = clamp(s, 0, 1); return s * s * (3 - 2 * s); };
const ramp = (u, a, b) => smooth((u - a) / (b - a));
const win = (u, a, b, f) => smooth((u - a) / f) * smooth((b - u) / f);
const lerp = (a, b, k) => a + (b - a) * k;
const TAU = Math.PI * 2;

// --------------------------------------------------------------------------------------------
// Colours
// --------------------------------------------------------------------------------------------
export const HH_COLORS = {
  suit: '#C8302E', suitDark: '#9A2226', suitLight: '#DA4A40',
  shirt: '#1E1A1A', skin: '#D9A077', hair: '#1F1B1B',
  sneaker: '#F4EFE4', sole: '#3A3634', stripe: '#C8302E',
  watch: '#D9A93B', watchFace: '#FBF6E8',
  folder: '#E2C27A', folderEdge: '#B8934A', paper: '#FBF8F0', ink: '#7C8FA8',
  pocketSquare: '#EDB82E', sweat: '#A8DCF5',
  mango: '#F2B33D', lime: '#86C24F',
};

/** The people.js createPerson spec he starts from (arms, legs and suit details are added after). */
export const HH_LOOK = {
  name: 'heinhtet',
  age: 'adult', build: 'slim', height: 1.06,
  skin: HH_COLORS.skin, hair: 'side', hairColor: 'black',
  top: 'shirt', topColor: HH_COLORS.suit, sleeves: 'long',
  bottom: 'trousers', bottomColor: HH_COLORS.suit, shoe: HH_COLORS.sole,
  face: 'oval', eyes: 'round', eyeSet: 'mid', mouth: 'wide', nose: 'small', ears: 'big',
  extras: [],
  // seed 26: no moustache, no mole or freckles, black (not dark-brown) hair, and the shirt's breast pocket
  seed: 26,
};

// --------------------------------------------------------------------------------------------
// Bones he adds to the person's nine (hips torso head armL armR legL legR hat ball)
// --------------------------------------------------------------------------------------------
const BASE_BONES = ['hips', 'torso', 'head', 'armL', 'armR', 'legL', 'legR', 'hat', 'ball'];
const EXTRA = ['foreL', 'foreR', 'shinL', 'shinR', 'papers', 'flap', 'fan', 'tuft', 'sweat', 'sheet0', 'sheet1', 'sheet2', 'sheet3', 'jug0', 'jug1', 'jug2'];
const PARENT = { foreL: 'armL', foreR: 'armR', shinL: 'legL', shinR: 'legR', papers: 'armR', flap: 'papers', fan: 'foreL', tuft: 'head', sweat: 'head', sheet0: 'hips', sheet1: 'hips', sheet2: 'hips', sheet3: 'hips', jug0: 'hips', jug1: 'hips', jug2: 'hips' };
const ALL = [...BASE_BONES, ...EXTRA];
const IDX = Object.fromEntries(ALL.map((b, i) => [b, i]));
const DROP = new Set([IDX.armL, IDX.armR, IDX.legL, IDX.legR]); // rebuilt with elbows and knees

// --------------------------------------------------------------------------------------------
// Pose channels (radians / metres). Every pose is a plain object with all of them.
// --------------------------------------------------------------------------------------------
const K = ['hx', 'hy', 'hz', 'hrx', 'hry', 'hrz', 'tx', 'ty', 'tz', 'nx', 'ny', 'nz', 'sh',
  'alx', 'aly', 'alz', 'flx', 'flz', 'arx', 'ary', 'arz', 'frx', 'frz',
  'llx', 'llz', 'slx', 'lrx', 'lrz', 'srx', 'tuft', 'tuftz', 'flap'];
// standing: folder clamped under the right arm (forearm across the belly), left arm loose
const NEUTRAL = {
  hx: 0, hy: 0, hz: 0, hrx: 0, hry: 0, hrz: 0, tx: 0.04, ty: 0, tz: 0, nx: 0, ny: 0, nz: 0, sh: 0,
  alx: 0, aly: 0, alz: 0.08, flx: -0.15, flz: 0, arx: -0.06, ary: 0.5, arz: -0.04, frx: -1.2, frz: 0,
  llx: 0, llz: 0.02, slx: 0.04, lrx: 0, lrz: -0.02, srx: 0.04, tuft: 0, tuftz: 0, flap: 0.25,
};
const newPose = () => ({ ...NEUTRAL });
const copyPose = (dst, src) => { for (const k of K) dst[k] = src[k]; return dst; };

/** Keyframes: keys = [[u, { channel: value }], ...] sorted by u; channels missing from a key hold NEUTRAL. */
function keys(P, u, list) {
  let i = 0;
  while (i < list.length - 1 && u >= list[i + 1][0]) i++;
  const [u0, a] = list[i];
  const [u1, b] = list[Math.min(i + 1, list.length - 1)];
  const s = u1 > u0 ? smooth((u - u0) / (u1 - u0)) : 1;
  for (const k in a) P[k] = lerp(a[k], b[k] ?? NEUTRAL[k], s);
  for (const k in b) if (!(k in a)) P[k] = lerp(NEUTRAL[k], b[k], s);
}
const mix = (P, k, v, w) => { P[k] = lerp(P[k], v, w); };

// left wrist up in front of the chest, watch face toward his eyes
function watchArm(P, k) {
  mix(P, 'alx', -0.95, k); mix(P, 'aly', -1.35, k); mix(P, 'alz', 0.1, k); mix(P, 'flx', -1.6, k); mix(P, 'flz', 0, k);
}

// --------------------------------------------------------------------------------------------
// The animations. pose(P, u, t, X): P starts NEUTRAL; u = 0..1 through the anim, t = seconds,
// X = props this frame (sheets, juggling things, fan, sweat, papers stack, body yaw target).
// face: a name or (u, t) => name.
// --------------------------------------------------------------------------------------------
const SHEET_FROM = [-0.2, 0.62, 0.05];
const SHEET_LAND = [[0.34, 0.012, 0.36], [-0.48, 0.016, 0.22], [0.2, 0.02, -0.3], [-0.16, 0.024, 0.58]];
const SHEET_PICK = [0.47, 0.6, 0.72, 0.84];

const ANIMS = {
  // skids to a stop: leans back, front foot braced, arms windmilling
  skid: {
    dur: 1.0,
    face: (u) => (u < 0.72 ? 'surprised' : 'smile'),
    pose(P, u, t, X) {
      const k = ramp(u, 0, 0.1) * (1 - ramp(u, 0.68, 1));
      P.hz = 0.2 * (1 - (1 - ramp(u, 0, 0.55)) ** 2) * (1 - ramp(u, 0.8, 1));
      P.hrx = -0.24 * k; P.tx = 0.04 - 0.3 * k; P.nx = 0.12 * k;
      P.llx = -0.55 * k; P.slx = 0.05; P.llz = 0.04;
      P.lrx = 0.3 * k; P.srx = 0.04 + 1.05 * k;
      P.hy = -0.07 * k + 0.01 * Math.sin(t * 70) * k * (1 - ramp(u, 0.35, 0.6));
      const a = TAU * 3 * ramp(u, 0.04, 0.72), b = TAU * 3 * ramp(u, 0.1, 0.78);
      const wm = win(u, 0.02, 0.8, 0.08);
      P.alx = -(a % TAU); P.alz = 0.08 + 0.45 * wm; P.flx = lerp(-0.15, -0.3, wm);
      P.arx = -0.06 * (1 - wm) - (b % TAU); P.arz = -0.04 - 0.45 * wm; P.ary = 0.5 * (1 - wm); P.frx = lerp(-1.2, -0.3, wm);
      P.tuft = 0.7 * k; P.flap = 1;
      void X;
    },
  },
  // hands on knees, panting, a drop of sweat
  catchBreath: {
    dur: 2.4,
    face: (u, t) => (Math.sin(t * 11) > 0 ? 'talk' : 'worried'),
    pose(P, u, t, X) {
      const pant = Math.sin(t * 9);
      P.tx = 0.72 + 0.05 * pant; P.hy = -0.05 + 0.008 * pant; P.nx = -0.55 + 0.04 * pant; P.sh = 0.012 * pant;
      P.llx = -0.6; P.slx = 1.05; P.lrx = -0.55; P.srx = 1.0; P.llz = 0.1; P.lrz = -0.1;
      P.alx = -0.4; P.alz = 0.12; P.flx = -0.1; P.arx = -0.4; P.ary = 0; P.arz = -0.12; P.frx = -0.12;
      P.tuft = 0.55 + 0.1 * pant; P.flap = 0.2;
      X.sweat = 1; X.sweatY = (t * 0.7) % 1;
    },
  },
  // a glance at the gold watch, then a double take
  checkWatch: {
    dur: 1.8,
    face: (u) => (u < 0.52 ? 'think' : u < 0.9 ? 'surprised' : 'worried'),
    pose(P, u) {
      const up = win(u, 0.04, 0.9, 0.14);
      watchArm(P, up);
      const take = win(u, 0.5, 0.86, 0.06);
      P.nx = 0.38 * up - 0.5 * take; P.ny = 0.22 * up * (1 - take);
      P.hy = 0.035 * take; P.tx = 0.08 * up - 0.12 * take; P.tuft = -0.5 * take; P.sh = 0.03 * take;
    },
  },
  // the folder bursts, sheets fly, he scrambles after every one
  dropPapers: {
    dur: 3.0,
    face: (u) => (u < 0.3 ? 'surprised' : u < 0.9 ? 'worried' : 'shy'),
    pose(P, u, t, X) {
      // jolt: the clamping arm flies open
      const jolt = win(u, 0.0, 0.2, 0.05);
      P.arz = lerp(P.arz, -1.4, jolt); P.arx = lerp(P.arx, -0.5, jolt); P.ary = lerp(P.ary, 0, jolt); P.frx = lerp(P.frx, -0.2, jolt);
      P.alz = lerp(P.alz, 1.2, jolt); P.hy = 0.04 * jolt; P.tuft = -0.6 * jolt; P.nx = -0.3 * jolt;
      // scramble: crouched, turning to each sheet, grabbing with alternate hands
      const cr = win(u, 0.26, 0.93, 0.07);
      let target = 0;
      for (let i = 0; i < 4; i++) if (u > SHEET_PICK[i] - 0.1) target = i;
      const L = SHEET_LAND[target];
      const yaw = Math.atan2(L[0], L[2]);
      X.yaw = yaw; X.yawK = cr;
      P.hx = lerp(0, L[0] * 0.45, cr); P.hz = lerp(0, L[2] * 0.45, cr);
      P.hy = lerp(P.hy, -0.13, cr); P.tx = lerp(P.tx, 0.55, cr); P.nx = lerp(P.nx, 0.25 + 0.1 * Math.sin(t * 13), cr);
      P.llx = lerp(P.llx, -0.95, cr); P.slx = lerp(P.slx, 1.55, cr); P.lrx = lerp(P.lrx, -0.55, cr); P.srx = lerp(P.srx, 1.35, cr);
      const grab = Math.sin(t * 13);
      P.alx = lerp(P.alx, -0.9 + 0.5 * grab, cr); P.alz = lerp(P.alz, 0.25, cr); P.flx = lerp(P.flx, -0.3, cr);
      P.arx = lerp(P.arx, -0.9 - 0.5 * grab, cr); P.arz = lerp(P.arz, -0.25, cr); P.frx = lerp(P.frx, -0.3, cr); P.ary = lerp(P.ary, 0, cr);
      P.ny = 0.3 * Math.sin(t * 7) * cr;
      // up again, hugging the stack
      const hug = ramp(u, 0.9, 1);
      P.frx = lerp(P.frx, -1.35, hug); P.ary = lerp(P.ary, 0.6, hug);
      P.flap = 1;
      // the sheets
      let picked = 0;
      for (let i = 0; i < 4; i++) {
        const s = ramp(u, 0.05, 0.3 + i * 0.05);
        const S = X.sheets[i];
        if (u >= SHEET_PICK[i]) { picked++; S.on = 0; continue; }
        if (u < 0.05) { S.on = 0; continue; }
        const A = SHEET_FROM, B = SHEET_LAND[i];
        const lin = Math.min(1, (u - 0.05) / (0.25 + i * 0.05));
        S.on = 1;
        S.x = lerp(A[0], B[0], lin) + Math.sin(lin * 9 + i) * 0.06 * (1 - lin);
        S.z = lerp(A[2], B[2], lin);
        S.y = lerp(A[1], B[1], lin) + 4 * (0.45 + i * 0.08) * lin * (1 - lin);
        S.rx = Math.sin(lin * Math.PI) * (1.6 + i * 0.3) * (i & 1 ? -1 : 1);
        S.rz = Math.sin(lin * Math.PI * 2) * 0.8;
        S.ry = i * 1.3 + lin * 2.5;
        void s;
      }
      X.papers = u < 0.05 ? 1 : 0.15 + 0.85 * (picked / 4);
    },
  },
  // flustered tug of the lapels, chin up, a shy look away
  straightenJacket: {
    dur: 1.6,
    face: (u) => (u < 0.7 ? 'shy' : 'smile'),
    pose(P, u, t) {
      const g = win(u, 0.04, 0.82, 0.12);
      const tug = Math.max(win(u, 0.22, 0.36, 0.05), win(u, 0.44, 0.58, 0.05));
      mix(P, 'alx', -0.55, g); mix(P, 'aly', -0.55, g); mix(P, 'alz', -0.02, g); mix(P, 'flx', -1.65 + 0.55 * tug, g);
      mix(P, 'arx', -0.55, g); mix(P, 'ary', 0.55, g); mix(P, 'arz', 0.02, g); mix(P, 'frx', -1.65 + 0.55 * tug, g);
      P.tx = 0.04 - 0.1 * tug * g; P.hy = 0.02 * tug; P.nx = -0.16 * g; P.sh = 0.02 * tug;
      const roll = win(u, 0.6, 0.9, 0.06);
      P.tz = 0.08 * Math.sin(t * 16) * roll;
      P.ny = 0.4 * ramp(u, 0.72, 0.85) * (1 - ramp(u, 0.95, 1)); P.nx += 0.12 * ramp(u, 0.72, 0.85);
    },
  },
  // a quick polite nod-bow, hands at his sides
  bow: {
    dur: 1.0,
    face: 'smile',
    pose(P, u) {
      const k = win(u, 0.08, 0.72, 0.16);
      P.tx = 0.04 + 0.36 * k; P.nx = 0.15 * k; P.hy = -0.01 * k; P.alx = 0.08 * k; P.alz = 0.04; P.flx = -0.05;
    },
  },
  // a big wave with the free (left) arm, bouncing on his toes
  wave: {
    dur: 1.5,
    face: 'happy',
    pose(P, u, t) {
      const k = win(u, 0.02, 0.9, 0.14);
      P.alz = lerp(P.alz, 2.15 + 0.15 * Math.sin(t * 15), k); P.alx = -0.25 * k;
      P.flz = (0.5 + 0.55 * Math.sin(t * 15 + 0.8)) * k; P.flx = -0.2 * k;
      P.hy = 0.02 * Math.abs(Math.sin(t * 9)) * k; P.nz = -0.1 * k; P.tz = 0.06 * k;
      P.tuft = 0.2 * Math.sin(t * 15) * k;
    },
  },
  // wind-up, slap, it stings, shakes it off
  highFive: {
    dur: 1.5,
    face: (u) => (u < 0.5 ? 'happy' : u < 0.82 ? 'surprised' : 'happy'),
    pose(P, u, t) {
      keys(P, u, [
        [0, {}],
        [0.26, { alz: 1.5, alx: 0.6, flx: -0.8, ty: 0.32, hy: -0.04, tx: -0.02, nx: -0.1 }],
        [0.38, { alz: 0.35, alx: -2.6, flx: -0.05, ty: -0.18, hy: 0.07, tx: 0.14, nx: -0.25, tuft: -0.5 }],
        [0.52, { alz: 0.35, alx: -2.5, flx: -0.05, ty: -0.15, hy: 0.02, tx: 0.1, nx: -0.2 }],
        [0.62, { alz: 0.4, alx: -0.7, flx: -0.9, hy: 0, tx: 0.08, nx: 0.25, ny: 0.3 }],
        [0.84, { alz: 0.4, alx: -0.7, flx: -0.9, nx: 0.25, ny: 0.3 }],
        [1, {}],
      ]);
      const sting = win(u, 0.58, 0.86, 0.04);
      P.alz += 0.35 * Math.sin(t * 34) * sting; P.flz = 0.45 * Math.sin(t * 34 + 1) * sting;
      P.hy += 0.012 * Math.abs(Math.sin(t * 17)) * sting;
    },
  },
  // over-eager handshake: pumps and pumps, other hand clasped over
  handshake: {
    dur: 1.9,
    face: 'happy',
    pose(P, u, t) {
      const k = win(u, 0.02, 0.92, 0.14);
      const pump = win(u, 0.18, 0.88, 0.06) * Math.sin(t * 21);
      mix(P, 'arx', -1.0 + 0.32 * pump, k); mix(P, 'ary', 0.05, k); mix(P, 'arz', 0.05, k); mix(P, 'frx', -0.35, k);
      const cup = win(u, 0.28, 0.86, 0.08);
      mix(P, 'alx', -0.95 + 0.32 * pump, cup); mix(P, 'aly', -1.0, cup); mix(P, 'flx', -0.7, cup);
      P.tx = 0.04 + 0.18 * k + 0.05 * pump; P.hy = 0.015 * pump; P.nx = 0.12 * pump; P.tuft = 0.3 * pump;
    },
  },
  // side-steps a near collision, belly in, hands up
  dodge: {
    dur: 0.85,
    face: (u) => (u < 0.75 ? 'surprised' : 'smile'),
    pose(P, u) {
      keys(P, u, [
        [0, {}],
        [0.18, { hx: 0.3, hy: 0.05, hrz: -0.22, tx: -0.28, alz: 1.25, alx: -0.3, flx: -0.9, arx: -0.6, ary: 0, arz: -0.5, frx: -0.9, ny: -0.5, llz: 0.3, lrz: 0.1, slx: 0.5, tuft: 0.5 }],
        [0.32, { hx: 0.34, hy: 0, hrz: -0.18, tx: -0.24, alz: 1.2, alx: -0.3, flx: -0.9, arx: -0.6, ary: 0, arz: -0.5, frx: -0.9, ny: -0.55, llz: 0.25 }],
        [0.62, { hx: 0.3, hrz: -0.1, tx: -0.1, alz: 0.6, flx: -0.5, ny: -0.3 }],
        [1, {}],
      ]);
    },
  },
  // spins on the spot looking for something, hand shading his eyes
  spin: {
    dur: 1.7,
    face: 'think',
    pose(P, u, t, X) {
      const k = win(u, 0.02, 0.92, 0.12);
      X.spin = (TAU * ramp(u, 0.06, 0.9)) % TAU;
      mix(P, 'alx', -2.0, k); mix(P, 'aly', -0.45, k); mix(P, 'flx', -1.3, k); mix(P, 'alz', 0.2, k);
      P.ny = 0.45 * Math.sin(t * 6) * k; P.nx = -0.12 * k;
      P.llx = -0.35 * Math.max(0, Math.sin(t * 14)) * k; P.lrx = -0.35 * Math.max(0, -Math.sin(t * 14)) * k;
      P.slx = 0.04 + 0.6 * Math.max(0, Math.sin(t * 14)) * k; P.srx = 0.04 + 0.6 * Math.max(0, -Math.sin(t * 14)) * k;
      P.hy = 0.02 * Math.abs(Math.sin(t * 14)) * k;
    },
  },
  // stumbles, flails, hops, and lands it with a "ta-da"
  trip: {
    dur: 1.8,
    face: (u) => (u < 0.62 ? 'surprised' : 'happy'),
    pose(P, u, t) {
      keys(P, u, [
        [0, {}],
        [0.1, { hrx: 0.35, tx: 0.25, lrx: 0.7, srx: 0.7, llx: -0.3, alx: -1.3, alz: 0.6, arx: -1.0, ary: 0, arz: -0.5, frx: -0.3, nx: -0.35, hz: 0.04, tuft: 0.6 }],
        [0.26, { hrx: 0.55, hz: 0.12, hy: -0.05, alx: -2.6, alz: 1.0, arx: -2.1, ary: 0, arz: -1.0, frx: -0.2, llx: -0.85, slx: 0.8, lrx: 0.5, srx: 1.2, nx: -0.5, tuft: 0.8 }],
        [0.42, { hrx: 0.25, hz: 0.18, hy: 0.05, alx: 0.5, alz: 1.2, arx: 0.4, ary: 0, arz: -1.2, frx: -0.2, llx: -0.3, slx: 0.4, lrx: -0.6, srx: 1.4, nx: -0.2 }],
        [0.56, { hrx: 0, hz: 0.18, lrx: -1.1, srx: 1.7, alz: 1.5, arz: -1.5, ary: 0, frx: -0.1, flx: -0.1, nx: 0 }],
        [0.72, { hz: 0.16, alz: 2.3, alx: -0.4, flx: -0.1, arz: -1.1, arx: 0.1, ary: 0, frx: -0.15, llz: 0.25, lrx: 0.35, srx: 0.35, lrz: -0.05, tx: -0.12, nx: -0.12, nz: 0.12 }],
        [0.9, { hz: 0.12, alz: 2.3, alx: -0.4, flx: -0.1, arz: -1.1, arx: 0.1, ary: 0, frx: -0.15, llz: 0.25, lrx: 0.35, srx: 0.35, tx: -0.12, nx: -0.12, nz: 0.12 }],
        [1, {}],
      ]);
      const wob = win(u, 0.5, 0.66, 0.04);
      P.tz += 0.18 * Math.sin(t * 14) * wob; P.hrz = 0.1 * Math.sin(t * 14 + 1) * wob;
    },
  },
  // kneels, ties the lace at blurring speed, pops up
  tieShoe: {
    dur: 2.4,
    face: (u) => (u < 0.8 ? 'think' : 'happy'),
    pose(P, u, t, X, M) {
      const kneel = { hy: -M.L * 0.5, tx: 0.3, nx: 0.18, llx: -1.45, slx: 1.45, lrx: 0.12, srx: 1.5, alx: -0.55, aly: -0.25, flx: -0.6, arx: -0.55, ary: 0.35, frx: -0.5, llz: 0.05, lrz: -0.05 };
      keys(P, u, [[0, {}], [0.14, kneel], [0.78, kneel], [0.9, { hy: 0.06, alz: 0.4, tuft: -0.4 }], [1, {}]]);
      const blur = win(u, 0.16, 0.76, 0.03);
      P.flx += 0.38 * Math.sin(t * 30) * blur; P.frx += 0.38 * Math.sin(t * 30 + Math.PI) * blur;
      P.alz += 0.1 * Math.sin(t * 15) * blur; P.nx += 0.04 * Math.sin(t * 15) * blur;
    },
  },
  // three small things in a shower: a mango, a lime, a ball of paper
  juggle: {
    dur: 2.4,
    face: 'happy',
    pose(P, u, t, X, M) {
      const k = 1;
      const bob = Math.sin(t * TAU / 0.45);
      mix(P, 'alx', -0.45 + 0.18 * bob, k); mix(P, 'aly', -0.25, k); mix(P, 'flx', -1.1, k); mix(P, 'alz', 0.12, k);
      mix(P, 'arx', -0.45 - 0.18 * bob, k); mix(P, 'ary', 0.25, k); mix(P, 'frx', -1.1, k); mix(P, 'arz', -0.12, k);
      P.nx = -0.28; P.hy = 0.01 * Math.abs(bob); P.tx = 0;
      const hy = M.hipY + M.T * 0.3, Tc = 1.35;
      for (let i = 0; i < 3; i++) {
        const p = ((t / Tc) + i / 3) % 1;
        const J = X.jugs[i];
        J.on = 1;
        if (p < 0.62) { const s = p / 0.62; J.x = lerp(-0.13, 0.13, s); J.y = hy + 4 * 0.6 * s * (1 - s); }
        else { const s = (p - 0.62) / 0.38; J.x = lerp(0.13, -0.13, s); J.y = hy + 4 * 0.05 * s * (1 - s); }
        J.z = 0.3; J.rx = t * 7 + i; J.rz = t * 5;
      }
      P.ny = 0.12 * Math.sin(t * TAU / Tc);
    },
  },
  // a snappy, silly little salute with a heel click
  salute: {
    dur: 1.1,
    face: 'happy',
    pose(P, u, t) {
      keys(P, u, [
        [0, {}],
        [0.14, { alz: 1.6, aly: -0.85, flz: 2.05, flx: 0, hy: 0.05, tx: -0.08, nx: -0.12, nz: -0.14, llz: -0.02, lrz: 0.02, tuft: -0.4 }],
        [0.2, { alz: 1.5, aly: -0.8, flz: 1.95, flx: 0, hy: 0.0, tx: -0.08, nx: -0.12, nz: -0.14, llz: -0.02, lrz: 0.02 }],
        [0.75, { alz: 1.5, aly: -0.8, flz: 1.95, flx: 0, tx: -0.08, nx: -0.1, nz: -0.14, llz: -0.02, lrz: 0.02 }],
        [1, {}],
      ]);
      P.alz += 0.06 * Math.sin(t * 40) * win(u, 0.18, 0.4, 0.04); // the snap quivers
    },
  },
  // a small jump, fist in the air, knees tucked
  jumpCheer: {
    dur: 1.25,
    face: 'happy',
    pose(P, u) {
      keys(P, u, [
        [0, {}],
        [0.2, { hy: -0.07, tx: 0.24, llx: -0.55, slx: 1.0, lrx: -0.55, srx: 1.0, alx: 0.5, arx: 0.15, nx: 0.1 }],
        [0.42, { hy: 0.24, tx: -0.08, llx: -0.75, slx: 1.5, lrx: 0.35, srx: 1.3, alz: 2.1, flz: 0.7, alx: -0.25, flx: -0.2, arz: -0.4, nx: -0.28, tuft: -0.6 }],
        [0.56, { hy: 0.2, tx: -0.06, llx: -0.6, slx: 1.3, lrx: 0.3, srx: 1.2, alz: 2.1, flz: 0.7, alx: -0.25, flx: -0.2, arz: -0.4, nx: -0.25, tuft: -0.4 }],
        [0.72, { hy: -0.05, tx: 0.16, llx: -0.45, slx: 0.85, lrx: -0.45, srx: 0.85, alz: 1.6, flx: -0.6, nx: 0.05, tuft: 0.5 }],
        [1, {}],
      ]);
    },
  },
  shrug: {
    dur: 1.2,
    face: 'think',
    pose(P, u) {
      const k = win(u, 0.06, 0.82, 0.16);
      mix(P, 'alz', 0.55, k); mix(P, 'alx', -0.45, k); mix(P, 'aly', 0.35, k); mix(P, 'flx', -1.05, k);
      mix(P, 'arz', -0.45, k); mix(P, 'arx', -0.4, k); mix(P, 'ary', -0.2, k); mix(P, 'frx', -1.05, k);
      P.sh = 0.04 * k; P.nz = 0.2 * k; P.nx = -0.05 * k; P.hy = 0.012 * k;
    },
  },
  facepalm: {
    dur: 1.8,
    face: 'sad',
    pose(P, u, t) {
      const k = win(u, 0.06, 0.88, 0.18);
      mix(P, 'alx', -1.95, k); mix(P, 'aly', -0.55, k); mix(P, 'alz', -0.05, k); mix(P, 'flx', -0.65, k);
      P.nx = 0.2 * k; P.tx = 0.04 + 0.12 * k; P.ny = 0.16 * Math.sin(t * 6.5) * win(u, 0.3, 0.84, 0.08);
      P.sh = 0.02 * k; P.tuft = 0.35 * k;
    },
  },
  // taps the watch at someone: we are LATE
  pointAtWatch: {
    dur: 1.8,
    face: (u, t) => (Math.sin(t * 13) > 0 ? 'talk' : 'surprised'),
    pose(P, u, t) {
      const k = win(u, 0.04, 0.9, 0.14);
      watchArm(P, k);
      mix(P, 'aly', -1.0, k); mix(P, 'alx', -1.15, k);
      const tap = Math.max(0, Math.sin(t * 17)) * win(u, 0.2, 0.86, 0.05);
      mix(P, 'arx', -0.95, k); mix(P, 'ary', 0.95, k); mix(P, 'arz', 0.05, k); mix(P, 'frx', -1.0 - 0.3 * tap, k);
      P.nx = (0.1 + 0.12 * Math.sin(t * 8.5)) * k; P.tx = 0.04 + 0.1 * k; P.tz = 0.05 * k; P.tuft = 0.25 * tap;
    },
  },
  // a runner's warm-up: lunge pulses, then arms overhead and side bends
  stretch: {
    dur: 2.6,
    face: (u) => (u < 0.5 ? 'think' : 'happy'),
    pose(P, u, t) {
      const lunge = { hy: -0.08, llx: -1.0, slx: 1.05, lrx: 0.6, srx: 0.08, tx: 0.12, alx: -0.65, flx: -0.25, arx: -0.6, ary: 0, frx: -0.3, nx: -0.15 };
      const up = { hy: 0.025, alz: 2.3, arz: -2.3, flz: 0.65, frz: -0.65, flx: 0, frx: 0, ary: 0, nx: -0.2, sh: 0.03 };
      keys(P, u, [[0, {}], [0.12, lunge], [0.44, lunge], [0.56, up], [0.92, up], [1, {}]]);
      P.hy += -0.025 * Math.max(0, Math.sin(t * 8)) * win(u, 0.13, 0.43, 0.03);
      P.tz = 0.3 * Math.sin((u - 0.56) / 0.36 * TAU) * win(u, 0.56, 0.92, 0.04);
    },
  },
  // fans himself with a sheet of paper
  fanSelf: {
    dur: 2.0,
    face: 'shy',
    pose(P, u, t, X) {
      const f = Math.sin(t * 17);
      P.alx = -1.15 + 0.08 * f; P.aly = -0.5; P.alz = -0.05; P.flx = -1.35; P.flz = 0.1 * f;
      P.nx = -0.24; P.nz = 0.12; P.tx = -0.04; P.hy = 0.004 * f;
      X.fan = 1; X.fanR = 0.65 * f;
      X.sweat = 1; X.sweatY = (t * 0.5) % 1;
    },
  },
  // peeks round something, shy, twice
  peek: {
    dur: 2.2,
    face: 'shy',
    pose(P, u, t) {
      const k = win(u, 0.03, 0.95, 0.1);
      const out = Math.max(win(u, 0.1, 0.42, 0.08), win(u, 0.56, 0.9, 0.08));
      mix(P, 'alx', -1.0, k); mix(P, 'aly', -0.35, k); mix(P, 'flx', -1.2, k);
      mix(P, 'arx', -1.0, k); mix(P, 'ary', 0.35, k); mix(P, 'frx', -1.2, k);
      P.hy = -0.045 * k; P.slx = 0.04 + 0.4 * k; P.srx = 0.04 + 0.4 * k; P.llx = -0.2 * k; P.lrx = -0.2 * k;
      P.tz = -0.42 * out; P.nz = -0.2 * out; P.hx = 0.05 * out; P.tx = 0.04 + 0.1 * k;
      P.nx = 0.06 * Math.sin(t * 5) * out; // bobs while he looks
    },
  },
  thumbsUp: {
    dur: 1.2,
    face: 'happy',
    pose(P, u) {
      keys(P, u, [
        [0, {}],
        [0.2, { alx: -0.3, alz: 0.2, flx: -1.55, tx: -0.1, nz: 0.16, ny: 0.12, hy: 0.02 }],
        [0.32, { alx: -0.55, alz: 0.2, flx: -1.45, tx: -0.12, nz: 0.18, ny: 0.12, hy: 0.035 }],
        [0.8, { alx: -0.45, alz: 0.2, flx: -1.5, tx: -0.1, nz: 0.16, ny: 0.12, hy: 0.01 }],
        [1, {}],
      ]);
    },
  },
  // pats every pocket: chest, hips, back, chest... nothing. Empty-handed shrug
  pocketSearch: {
    dur: 2.6,
    face: (u) => (u < 0.86 ? 'worried' : 'surprised'),
    pose(P, u, t) {
      const chest = { alx: -0.7, aly: -1.05, flx: -1.6, nx: 0.35 };
      keys(P, u, [
        [0, {}],
        [0.1, chest],
        [0.24, { alx: 0.12, alz: 0.4, flx: -0.6, nx: 0.3, ny: 0.3 }],
        [0.38, { arx: 0.12, arz: -0.4, ary: 0, frx: -0.6, nx: 0.3, ny: -0.3 }],
        [0.52, { alx: 0.65, alz: 0.22, flx: -0.4, arx: 0.65, arz: -0.22, ary: 0, frx: -0.4, ny: 0.75, nx: 0.1, ty: 0.25 }],
        [0.68, { ...chest, arx: -0.7, ary: 1.05, frx: -1.6 }],
        [0.84, { alz: 0.6, alx: -0.5, aly: 0.35, flx: -1.1, arz: -0.5, arx: -0.45, ary: -0.2, frx: -1.0, sh: 0.04, nz: 0.2, nx: -0.05 }],
        [0.94, { alz: 0.6, alx: -0.5, aly: 0.35, flx: -1.1, arz: -0.5, arx: -0.45, ary: -0.2, frx: -1.0, sh: 0.04, nz: 0.2, nx: -0.05 }],
        [1, {}],
      ]);
      const pat = Math.abs(Math.sin(t * 22)) * win(u, 0.06, 0.92, 0.04);
      P.flx += 0.22 * pat; P.frx += 0.18 * pat; P.hy += 0.006 * pat;
    },
  },
  // ---- people.js emote names (so story code that calls emote() on him still works)
  nod: { dur: 0.9, face: 'smile', pose(P, u) { P.nx = Math.sin(u * TAU * 2) * 0.24 * win(u, 0, 1, 0.15); } },
  think: {
    dur: 2.0, face: 'think',
    pose(P, u) { const k = win(u, 0, 1, 0.18); mix(P, 'alx', -1.15, k); mix(P, 'aly', -0.75, k); mix(P, 'flx', -1.9, k); P.nz = 0.12 * k; P.nx = -0.06 * k; },
  },
  point: { dur: 1.4, face: 'talk', pose(P, u) { const k = win(u, 0, 1, 0.18); mix(P, 'alx', -1.5, k); mix(P, 'flx', -0.05, k); P.ty = 0.15 * k; } },
  slump: { dur: 1.6, face: 'sad', pose(P, u) { const k = win(u, 0, 1, 0.2); P.tx = 0.04 + 0.3 * k; P.nx = 0.35 * k; P.hy = -0.02 * k; P.alz = 0.02; P.tuft = 0.6 * k; } },
  fists: {
    dur: 1.0, face: 'hot',
    pose(P, u) { const k = win(u, 0, 1, 0.15); mix(P, 'alx', -0.9, k); mix(P, 'flx', -1.2, k); mix(P, 'alz', 0.3, k); P.hy = Math.abs(Math.sin(u * Math.PI * 4)) * 0.025 * k; },
  },
};
const ALIAS = { cheer: 'jumpCheer' };
const LOOP_OK = new Set(['catchBreath', 'juggle', 'fanSelf', 'tieShoe', 'peek', 'handshake', 'spin', 'stretch', 'pocketSearch']);

/** The animation names the contract fixes (people.js emote names also play). */
export const HH_ANIMS = ['skid', 'catchBreath', 'checkWatch', 'dropPapers', 'straightenJacket', 'bow', 'wave', 'highFive', 'handshake',
  'dodge', 'spin', 'trip', 'tieShoe', 'juggle', 'salute', 'jumpCheer', 'shrug', 'facepalm', 'pointAtWatch', 'stretch', 'fanSelf',
  'peek', 'thumbsUp', 'pocketSearch'];
export const HH_ANIM_DUR = Object.fromEntries(Object.entries(ANIMS).map(([k, v]) => [k, v.dur]));

// --------------------------------------------------------------------------------------------
// Geometry: his own parts, skinned to one bone each (same recipe as people.js)
// --------------------------------------------------------------------------------------------
function skinnedGeometry(parts, outlineOnly) {
  const byBone = new Map();
  for (const p of parts) {
    if (outlineOnly && !p.outline) continue;
    let vb = byBone.get(p.bone);
    if (!vb) byBone.set(p.bone, (vb = new VoxelBuilder()));
    vb.box(p.x, p.y, p.z, p.w, p.h, p.d, p.color, p.rotY || 0);
  }
  const geos = [];
  for (const [bone, vb] of byBone) {
    const g = vb.geometry();
    const n = g.attributes.position.count;
    const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { si[i * 4] = IDX[bone]; sw[i * 4] = 1; }
    if (outlineOnly) { g.deleteAttribute('color'); g.deleteAttribute('normal'); }
    g.deleteAttribute('uv');
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    geos.push(g);
  }
  if (!geos.length) return null;
  const merged = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  return merged;
}

/** A copy of geo (made non-indexed) without the triangles skinned to the dropped bones. */
function withoutBones(geo, keepAttrs) {
  const src = geo.index ? geo.toNonIndexed() : geo;
  const si = src.attributes.skinIndex;
  const n = src.attributes.position.count;
  const keep = [];
  for (let tri = 0; tri < n; tri += 3) if (!DROP.has(si.getX(tri))) keep.push(tri);
  const out = new THREE.BufferGeometry();
  for (const name of keepAttrs) {
    const a = src.attributes[name];
    if (!a) continue;
    const Arr = a.array.constructor, isz = a.itemSize;
    const arr = new Arr(keep.length * 3 * isz);
    let o = 0;
    for (const tri of keep) for (let v = 0; v < 3; v++) for (let c = 0; c < isz; c++) arr[o++] = a.array[(tri + v) * isz + c];
    out.setAttribute(name, new THREE.BufferAttribute(arr, isz, a.normalized));
  }
  if (src !== geo) src.dispose();
  return out;
}

function buildParts(M) {
  const C = HH_COLORS;
  const parts = [];
  const add = (bone, x, y, z, w, h, d, color, outline = true, rotY = 0) => parts.push({ bone, x, y, z, w, h, d, color, outline, rotY });
  const { L, SW, D, armW, A, hipY, shoulderY, legW, legX } = M;
  const fz = D / 2;

  // ---- jacket front: black shirt V, lapels, closure, pocket square, hem and pocket flaps (torso bone)
  // (a wide, deep V, so the black shirt still reads at the game's small size)
  add('torso', 0, shoulderY - 0.035, fz + 0.004, 0.13, 0.07, 0.006, C.shirt, false);
  add('torso', 0, shoulderY - 0.095, fz + 0.004, 0.092, 0.06, 0.006, C.shirt, false);
  add('torso', 0, shoulderY - 0.145, fz + 0.004, 0.052, 0.05, 0.006, C.shirt, false);
  for (const sx of [1, -1]) {
    add('torso', sx * 0.08, shoulderY - 0.06, fz + 0.006, 0.03, 0.11, 0.006, C.suitDark, false); // lapel
    add('torso', sx * 0.042, shoulderY - 0.155, fz + 0.006, 0.022, 0.05, 0.006, C.suitDark, false);
    add('torso', sx * 0.045, shoulderY + 0.004, fz - 0.012, 0.055, 0.04, 0.035, C.shirt); // black shirt collar points
  }
  add('torso', 0.004, (hipY - 0.04 + shoulderY - 0.15) / 2, fz + 0.005, 0.008, shoulderY - 0.15 - (hipY - 0.04), 0.006, C.suitDark, false); // closure
  add('torso', 0.018, hipY + M.T * 0.36, fz + 0.008, 0.022, 0.022, 0.006, C.shirt, false); // buttons
  add('torso', 0.018, hipY + M.T * 0.18, fz + 0.008, 0.022, 0.022, 0.006, C.shirt, false);
  add('torso', SW * 0.52, shoulderY - 0.075, fz + 0.007, 0.05, 0.03, 0.008, C.pocketSquare, false); // pocket square
  add('torso', SW * 0.52, shoulderY - 0.092, fz + 0.007, 0.065, 0.01, 0.008, C.suitDark, false);
  add('torso', 0, hipY - 0.012, 0, SW * 2 + 0.018, 0.075, D + 0.018, C.suit); // jacket skirt over the trouser top
  for (const sx of [1, -1]) add('torso', sx * SW * 0.55, hipY + 0.012, (D + 0.018) / 2 + 0.003, 0.075, 0.014, 0.006, C.suitDark, false);
  add('torso', 0, hipY - 0.045, 0, SW * 2 + 0.022, 0.012, D + 0.022, C.suitDark, false); // hem line

  // ---- arms: upper sleeve (shoulder pad) / forearm sleeve, black cuff, hand, thumb
  const elbowY = shoulderY - 0.01 - A * 0.48, wristY = shoulderY - A + 0.005, handY = shoulderY - A - 0.03;
  for (const [up, fore, sx] of [['armL', 'foreL', 1], ['armR', 'foreR', -1]]) {
    const x = sx * (SW + armW / 2 + 0.004);
    const top = shoulderY - 0.004, low = elbowY - 0.025;
    add(up, x, (top + low) / 2, 0, armW + 0.014, top - low, armW + 0.018, C.suit);
    add(up, x + sx * 0.004, shoulderY - 0.022, 0, armW + 0.026, 0.05, armW + 0.03, C.suit); // shoulder pad
    const ftop = elbowY + 0.02;
    add(fore, x, (ftop + wristY) / 2, 0, armW + 0.008, ftop - wristY, armW + 0.012, C.suit);
    add(fore, x, wristY - 0.008, 0, armW + 0.0, 0.022, armW + 0.004, C.shirt);
    add(fore, x, handY, 0, armW * 0.9, 0.066, armW * 0.95, C.skin);
    add(fore, x - sx * armW * 0.2, handY + 0.004, armW * 0.95 / 2 + 0.012, 0.03, 0.05, 0.026, C.skin); // thumb
  }
  // gold watch on the left wrist (a band all round, a cream face on the back of the wrist)
  {
    const x = SW + armW / 2 + 0.004;
    add('foreL', x, wristY - 0.004, 0, armW + 0.02, 0.026, armW + 0.022, C.watch);
    add('foreL', x + armW / 2 + 0.011, wristY - 0.004, 0, 0.012, 0.04, 0.046, C.watchFace, true);
  }
  // ---- legs: thigh / shin with knee, white sneakers with a dark sole and a red stripe
  const kneeY = L * 0.5;
  for (const [leg, shin, sx] of [['legL', 'shinL', 1], ['legR', 'shinR', -1]]) {
    const x = sx * legX;
    add(leg, x, (hipY + kneeY - 0.02) / 2, 0, legW, hipY - kneeY + 0.02, D * 0.66, C.suit);
    add(shin, x, (kneeY + 0.022 + 0.06) / 2, 0, legW - 0.004, kneeY + 0.022 - 0.06, D * 0.62, C.suit);
    add(shin, x, 0.04, 0.024, legW + 0.016, 0.062, D * 0.86, C.sneaker);
    add(shin, x, 0.009, 0.026, legW + 0.02, 0.018, D * 0.9, C.sole);
    add(shin, x + sx * ((legW + 0.016) / 2 + 0.003), 0.042, 0.024, 0.006, 0.018, D * 0.5, C.stripe, false);
    add(shin, x, 0.072, -0.005, legW + 0.004, 0.016, D * 0.6, C.shirt, false); // black sock
  }
  // ---- cowlick on the crown (bounces when he runs)
  const top_ = M.top;
  add('tuft', 0, top_ + 0.07, -0.05, 0.05, 0.09, 0.05, C.hair);
  add('tuft', 0, top_ + 0.12, -0.02, 0.04, 0.04, 0.07, C.hair);
  // ---- sweat drop (hidden unless puffing)
  add('sweat', M.HW / 2 + 0.018, M.hc + 0.1, 0.12, 0.034, 0.05, 0.03, C.sweat);
  // ---- folder under the right arm: manila folder, papers poking out, one loose sheet that flaps
  const ax = -(SW + armW / 2 + 0.004), fy = shoulderY - 0.115;
  // (big and bright enough to read as "papers" from the street: white sheets well proud of the folder)
  add('papers', ax, fy, 0.0, 0.056, 0.19, 0.31, C.folder);
  add('papers', ax, fy + 0.03, 0.006, 0.048, 0.19, 0.33, C.paper);
  add('papers', ax, fy - 0.096, 0.0, 0.062, 0.014, 0.312, C.folderEdge, false);
  add('flap', ax, shoulderY - 0.005, 0.07, 0.012, 0.075, 0.1, C.paper);
  add('flap', ax - 0.007, shoulderY - 0.005, 0.07, 0.002, 0.012, 0.07, C.ink, false);
  // ---- props (hidden at rest inside the body)
  for (let i = 0; i < 4; i++) {
    const c = M.sheetRest;
    add(`sheet${i}`, c[0], c[1], c[2], 0.13, 0.006, 0.17, C.paper);
    add(`sheet${i}`, c[0] + 0.02, c[1] + 0.004, c[2], 0.07, 0.002, 0.012, C.ink, false);
    add(`sheet${i}`, c[0] + 0.01, c[1] + 0.004, c[2] - 0.03, 0.08, 0.002, 0.012, C.ink, false);
  }
  const jc = [C.mango, C.lime, C.paper];
  for (let i = 0; i < 3; i++) add(`jug${i}`, M.sheetRest[0], M.sheetRest[1], M.sheetRest[2], i === 1 ? 0.06 : 0.07, i === 1 ? 0.06 : 0.07, i === 0 ? 0.085 : 0.065, jc[i]);
  {
    // the paper fan in the left hand
    const x = SW + armW / 2 + 0.004;
    add('fan', x, handY - 0.1, 0.035, 0.15, 0.17, 0.012, C.paper);
    add('fan', x - 0.02, handY - 0.08, 0.043, 0.08, 0.012, 0.004, C.ink, false);
    add('fan', x - 0.01, handY - 0.12, 0.043, 0.09, 0.012, 0.004, C.ink, false);
  }
  return parts;
}

// --------------------------------------------------------------------------------------------
// The person
// --------------------------------------------------------------------------------------------
const _q = new THREE.Quaternion();
const _qi = new THREE.Quaternion();
const _e = new THREE.Euler();

export function createHeinHtet(createPerson = peopleCreatePerson, specOverrides = {}) {
  const spec = { ...HH_LOOK, ...specOverrides };
  const p = createPerson(spec);
  const { root, bones } = p;
  root.name = 'heinhtet';
  root.updateMatrixWorld(true);

  // measurements from the person's own rest bones
  const hipY = bones.hips.position.y;
  const T = bones.head.position.y - 0.03;
  const SW = bones.legL.position.x / 0.48;
  const armW = Math.max(0.07, SW * 0.5);
  const h = spec.height ?? 1;
  const A = 0.3 * (1 + (h - 1) * 0.8);
  const D = 0.19 * (spec.build === 'slim' ? 0.92 : spec.build === 'wide' ? 1.18 : 1);
  const shoulderY = hipY + T;
  const H = 0.42, HW = H, HH = H; // oval head
  const hc = shoulderY + 0.03 + HH / 2;
  const M = {
    L: hipY, T, SW, D, armW, A, hipY, shoulderY, legW: SW * 0.62, legX: SW * 0.48, HW, HH, hc, top: hc + HH / 2,
    sheetRest: [0, hipY + T * 0.5, 0],
  };

  // ---- find the person's skinned mesh and outline
  let mesh = null, outline = null;
  root.traverse((o) => { if (o.isSkinnedMesh) { if (o.userData.isOutline) outline = o; else mesh = o; } });

  // ---- extra bones at their rest places
  const restWorld = {};
  const worldOf = (name) => {
    if (restWorld[name]) return restWorld[name];
    const b = bones[name];
    const parentName = BASE_BONES.includes(name) ? (b.parent?.isBone ? b.parent.name : null) : PARENT[name];
    const pw = parentName ? worldOf(parentName) : new THREE.Vector3();
    restWorld[name] = pw.clone().add(b.position);
    return restWorld[name];
  };
  const W = {
    foreL: [SW + armW / 2, shoulderY - 0.01 - A * 0.48, 0], foreR: [-(SW + armW / 2), shoulderY - 0.01 - A * 0.48, 0],
    shinL: [M.legX, M.L * 0.5, 0], shinR: [-M.legX, M.L * 0.5, 0],
    papers: [-(SW + armW / 2), shoulderY - 0.1, 0], flap: [-(SW + armW / 2), shoulderY - 0.045, 0.07],
    fan: [SW + armW / 2, shoulderY - A - 0.03, 0],
    tuft: [0, M.top + 0.03, -0.05], sweat: [0, hc, 0],
  };
  for (let i = 0; i < 4; i++) W[`sheet${i}`] = M.sheetRest;
  for (let i = 0; i < 3; i++) W[`jug${i}`] = M.sheetRest;
  for (const name of BASE_BONES) worldOf(name);
  for (const name of EXTRA) {
    const b = new THREE.Bone();
    b.name = name;
    bones[name] = b;
    const pw = restWorld[PARENT[name]];
    restWorld[name] = new THREE.Vector3(...W[name]);
    b.position.copy(restWorld[name]).sub(pw);
    bones[PARENT[name]].add(b);
  }
  const rest = Object.fromEntries(ALL.map((n) => [n, bones[n].position.clone()]));
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(ALL.map((n) => bones[n]));

  // ---- geometry: the person minus arms and legs, plus his parts
  const parts = buildParts(M);
  const oldBody = mesh.geometry, oldOut = outline.geometry;
  const bodyKeep = withoutBones(oldBody, ['position', 'normal', 'color', 'skinIndex', 'skinWeight']);
  const bodyMine = skinnedGeometry(parts, false);
  const bodyGeo = mergeGeometries([bodyKeep, bodyMine], false);
  bodyKeep.dispose(); bodyMine.dispose();
  const outKeep = withoutBones(oldOut, ['position', 'skinIndex', 'skinWeight']);
  const outMine = skinnedGeometry(parts, true);
  const outRaw = mergeGeometries([outKeep, outMine], false);
  outKeep.dispose(); outMine.dispose();
  const outGeo = mergeVertices(outRaw, 1e-4);
  outRaw.dispose();
  outGeo.computeVertexNormals();
  bodyGeo.computeBoundingSphere(); outGeo.computeBoundingSphere();
  mesh.geometry = bodyGeo; outline.geometry = outGeo;
  oldBody.dispose(); oldOut.dispose();
  mesh.bind(skeleton, mesh.bindMatrix);
  outline.bind(skeleton, mesh.bindMatrix);
  const sphere = new THREE.Sphere(new THREE.Vector3(0, 0.6, 0), 1.6); // room for flying sheets and jumps
  mesh.boundingSphere = sphere;
  outline.boundingSphere = sphere.clone();

  // ---------------- animation state
  const st = {
    runSpeed: 0, speed: 0, phase: 0, t: 0,
    anim: null, animT: 0, animLoop: false, animDone: null, animW: 0, fadeOut: false,
    savedFace: 'smile', shownFace: 'smile', mood: null,
    flapT: 0,
  };
  const loco = newPose(), animP = newPose(), out = newPose(), tmp = newPose();
  const X = {
    sheets: [0, 1, 2, 3].map(() => ({ on: 0, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 })),
    jugs: [0, 1, 2].map(() => ({ on: 0, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 })),
    fan: 0, fanR: 0, sweat: 0, sweatY: 0, papers: 1, yaw: 0, yawK: 0, spin: 0,
  };
  const offset = new THREE.Vector3();

  function resetProps() {
    for (const s of X.sheets) s.on = 0;
    for (const j of X.jugs) j.on = 0;
    X.fan = 0; X.fanR = 0; X.sweat = 0; X.papers = 1; X.yawK = 0; X.spin = 0;
  }

  // ---- locomotion: idle in a hurry (0) .. jog (2) .. run (4) .. sprint (6)
  function idlePose(P, t) {
    copyPose(P, NEUTRAL);
    const b = Math.sin(t * 7.5);
    P.hy = 0.012 * Math.abs(b);
    P.slx = 0.06 + 0.3 * Math.max(0, b); P.srx = 0.06 + 0.3 * Math.max(0, -b);
    P.llx = -0.14 * Math.max(0, b); P.lrx = -0.14 * Math.max(0, -b);
    P.tx = 0.07; P.alz = 0.12; P.flx = -0.25 + 0.08 * b;
    P.ny = 0.42 * Math.sin(t * 1.15) + 0.1 * Math.sin(t * 3.7);
    // a glance at the watch every few seconds
    const c = t % 3.8;
    const w = win(c, 2.2, 3.2, 0.2);
    watchArm(P, w);
    P.nx = lerp(P.nx, 0.36, w); P.ny = lerp(P.ny, 0.2, w);
    P.tuft = 0.15 * b; P.flap = 0.3;
  }
  function runPose(P, phase, v) {
    copyPose(P, NEUTRAL);
    const amp = clamp((v - 1) / 4, 0.25, 1);
    const s = Math.sin(phase), c = Math.cos(phase);
    const legA = 0.55 + 0.45 * amp;
    P.llx = -legA * s; P.lrx = legA * s;
    P.slx = 0.2 + (0.8 + 0.9 * amp) * Math.max(0, c);
    P.srx = 0.2 + (0.8 + 0.9 * amp) * Math.max(0, -c);
    P.hy = 0.008 + 0.04 * amp * Math.abs(s);
    P.tx = 0.2 + 0.24 * amp + 0.04 * Math.abs(s);
    P.ty = 0.18 * amp * s; P.hry = -0.1 * amp * s;
    P.nx = -P.tx * 0.75 + 0.05 * Math.abs(c); P.ny = -0.6 * P.ty; P.nz = 0.05 * s;
    // free left arm pumps wildly, elbow out
    P.alx = (0.55 + 0.65 * amp) * s; P.alz = 0.18 + 0.1 * Math.abs(s); P.aly = 0;
    P.flx = -1.25 - 0.4 * Math.max(0, -s);
    // right arm clamps the folder
    P.arx = -0.1 - 0.22 * s; P.ary = 0.55; P.arz = -0.06; P.frx = -1.4 + 0.12 * s;
    P.tuft = -0.35 - 0.35 * amp - 0.18 * Math.sin(phase * 2);
    P.tuftz = 0.1 * c;
    P.flap = 0.6 + 0.6 * amp;
  }
  function locomotion(P, dt) {
    const v = st.speed;
    st.phase += dt * TAU * (1.6 + Math.max(0, v) * 0.55);
    const r = smooth(v / 1.6);
    idlePose(P, st.t);
    if (r > 0.001) { runPose(tmp, st.phase, Math.max(v, 1.6)); for (const k of K) P[k] = lerp(P[k], tmp[k], r); }
    // held moods
    if (st.mood === 'shy') { P.nx += 0.12; P.ny *= 0.3; mix(P, 'alx', -0.4, 1 - r); mix(P, 'aly', -0.5, 1 - r); mix(P, 'flx', -1.2, 1 - r); }
    if (st.mood === 'down') { P.tx += 0.16; P.nx += 0.26; P.tuft += 0.4; }
    if (st.mood === 'hot') { P.alz += 0.15; P.flx -= 0.6; P.nx += 0.08; }
  }

  const baseUpdate = p.update;
  const baseSetFace = p.setFace;
  function showFace(name) { if (name !== st.shownFace) { st.shownFace = name; baseSetFace(name); } }

  function endAnim(resolve = true) {
    const done = st.animDone;
    st.anim = null; st.animDone = null; st.fadeOut = false; st.animW = 0;
    resetProps();
    showFace(st.savedFace);
    if (resolve) done?.();
  }

  function update(dt, opts = {}) {
    st.t += dt;
    const want = Number.isFinite(opts.speed) ? opts.speed : st.runSpeed;
    st.speed += (want - st.speed) * (1 - Math.exp(-8 * dt));
    // the person's own update: face atlas, blinks, mouth flaps, head look-at
    baseUpdate(dt, { speed: 0 });
    const headBase = _e.copy(bones.head.rotation);
    const bx = headBase.x, by = headBase.y, bz = headBase.z;

    locomotion(loco, dt);
    copyPose(out, loco);
    resetProps();
    if (st.anim) {
      const A = ANIMS[st.anim];
      st.animT += dt;
      let u = st.animT / A.dur;
      if (st.animLoop && !st.fadeOut) u %= 1;
      u = clamp(u, 0, 1);
      copyPose(animP, NEUTRAL);
      A.pose(animP, u, st.animT, X, M);
      const fadeIn = smooth(st.animT / 0.12);
      if (st.fadeOut) st.animW = Math.max(0, st.animW - dt / 0.16);
      else st.animW = st.animLoop ? fadeIn : fadeIn * smooth((A.dur - st.animT) / 0.15); // one-shots hand back to the run/idle smoothly
      const w = st.animW;
      for (const k of K) out[k] = lerp(loco[k], animP[k], w);
      const f = typeof A.face === 'function' ? A.face(u, st.animT) : A.face;
      if (f && w > 0.3) showFace(f); else showFace(st.savedFace);
      if (st.fadeOut ? st.animW <= 0 : (!st.animLoop && st.animT >= A.dur)) endAnim();
    } else showFace(st.savedFace);

    // ---- apply to bones
    const P = out;
    bones.hips.position.set(rest.hips.x + P.hx, rest.hips.y + P.hy, rest.hips.z + P.hz);
    const yaw = P.hry + (X.yawK ? X.yaw * X.yawK : 0) + X.spin;
    bones.hips.rotation.set(P.hrx, yaw, P.hrz);
    bones.torso.rotation.set(P.tx, P.ty, P.tz);
    bones.head.rotation.set(P.nx + bx, P.ny + by, P.nz + bz);
    bones.armL.position.set(rest.armL.x, rest.armL.y + P.sh, rest.armL.z);
    bones.armR.position.set(rest.armR.x, rest.armR.y + P.sh, rest.armR.z);
    bones.armL.rotation.set(P.alx, P.aly, P.alz);
    bones.armR.rotation.set(P.arx, P.ary, P.arz);
    bones.foreL.rotation.set(P.flx, 0, P.flz);
    bones.foreR.rotation.set(P.frx, 0, P.frz);
    bones.legL.rotation.set(P.llx, 0, P.llz);
    bones.legR.rotation.set(P.lrx, 0, P.lrz);
    bones.shinL.rotation.set(P.slx, 0, 0);
    bones.shinR.rotation.set(P.srx, 0, 0);
    bones.tuft.rotation.set(P.tuft + 0.06 * Math.sin(st.t * 5), 0, P.tuftz);
    st.flapT += dt * (8 + st.speed * 5);
    bones.flap.rotation.set(0, 0, -P.flap * (0.25 + 0.25 * Math.sin(st.flapT)));
    // props
    const ps = Math.max(0.0001, X.papers);
    bones.papers.scale.setScalar(ps);
    bones.fan.scale.setScalar(X.fan ? 1 : 0.0001);
    bones.fan.rotation.set(0, 0, X.fanR);
    bones.sweat.scale.setScalar(X.sweat ? 1 : 0.0001);
    bones.sweat.position.set(rest.sweat.x, rest.sweat.y - X.sweatY * 0.12, rest.sweat.z);
    // flying things are placed in body space: undo the hips' own move and turn
    _qi.copy(bones.hips.quaternion).invert();
    const place = (bone, o, restPos) => {
      if (!o.on) { bone.scale.setScalar(0.0001); bone.position.copy(restPos); bone.quaternion.identity(); return; }
      // the geometry sits round the bone's rest point, so the bone's place is the target point in hips space
      bone.scale.setScalar(1);
      bone.position.set(o.x, o.y, o.z).sub(bones.hips.position).applyQuaternion(_qi);
      bone.quaternion.copy(_qi).multiply(_q.setFromEuler(_e.set(o.rx, o.ry, o.rz)));
    };
    for (let i = 0; i < 4; i++) place(bones[`sheet${i}`], X.sheets[i], rest[`sheet${i}`]);
    for (let i = 0; i < 3; i++) place(bones[`jug${i}`], X.jugs[i], rest[`jug${i}`]);
    // body offset the anim is using (root space), for story code that wants to bake it in
    offset.set(P.hx, 0, P.hz);
  }

  const baseDispose = p.dispose;
  const api = Object.assign(p, {
    root,
    bones,
    measures: M,
    update,
    run(speed = 0) { st.runSpeed = Math.max(0, speed); return api; },
    offset, // body offset (root space) the current anim is using
    animDur(name) { return ANIMS[ALIAS[name] || name]?.dur ?? 0; },
    anims: HH_ANIMS,
    play(name, opts = {}) {
      const n = ALIAS[name] || name;
      if (!ANIMS[n]) { console.warn('heinhtet: no anim', name); return Promise.resolve(); }
      if (st.anim) endAnim();
      st.anim = n; st.animT = 0; st.animLoop = !!opts.loop; st.fadeOut = false; st.animW = 0;
      return new Promise((r) => { st.animDone = r; });
    },
    stopAnim() { if (st.anim) st.fadeOut = true; },
    emote(name) { return api.play(name); },
    setFace(name, hold = 0) { st.savedFace = name || 'smile'; if (!st.anim) { st.shownFace = st.savedFace; baseSetFace(st.savedFace, hold); } },
    setMood(m) { st.mood = m || null; },
    dispose() {
      // the person's dispose frees its own (already swapped) geometry; free ours and the new skeleton
      bodyGeo.dispose(); outGeo.dispose(); skeleton.dispose();
      baseDispose();
    },
  });
  // live getters (Object.assign would copy their values once)
  Object.defineProperty(api, 'anim', { get: () => st.anim, configurable: true });
  Object.defineProperty(api, 'speed', { get: () => st.speed, configurable: true });
  void LOOP_OK;
  return api;
}
