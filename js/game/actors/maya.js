// Blocky cartoon Maya (မာရာ) — the game's main character.
//
// One skinned, vertex-coloured box mesh (built with VoxelBuilder, one bone per box) plus its
// skinned outline hull, a canvas expression atlas on the cube head's front face, and a fully
// procedural animation system:
//   base pose  : idle (breathing, weight shift, glances) / walk cycle synced to speed / seated drive
//   emotes     : eased key-pose sequences with anticipation, follow-through, squash and stretch,
//                arm IK for hand-to-face poses, props that pop in and out (book, phone, pad, pen)
//   secondary  : spring hair (inertia from real head motion + wind while driving + gravity),
//                look-at, talk gestures, blinking, talking mouth, glasses glint.
// Draw calls: body + body outline + face + glasses + glasses outline + blob shadow = 6
// (~2.9k triangles). No per-frame allocation in update().
//
// API (contract in ARCHITECTURE.md, plus a few extras):
//   const maya = createMaya({ outfit: 'writer'|'author', face: 'smile', shadow: true, outlinePx: 2,
//                             glassesOutlinePx: 1.25, seed: 7, blink: true, fidget: true,
//                             onEvent(type, data) {} });   // 'step' ('L'|'R') and 'cue' ({ emote, cue })
//   maya.root                      Group, feet at y = 0, faces +Z
//   maya.setMode(mode, instant?)   'stand' | 'walk' | 'drive' (root parented to car.seat = top of the cushion)
//   maya.setOutfit(name)           'writer' | 'author'
//   maya.update(dt, { speed, turn, accel, t })   turn: + = toward +X (heading increasing); in the car pass steer
//   maya.setFace(name, holdSeconds?) / maya.talk(seconds) / maya.emote(name) -> Promise
//   maya.lookAt(vec3 | null)       copies the point; call again to track a moving target
//   maya.getHeadTop(target) / maya.faceCanvas(name) / maya.dispose()
//   extras: maya.wheel (Vector3, seat space), maya.wheelRadius, maya.wheelTilt  <- copy from car.wheelGrip
//           maya.hopTiming { takeoff, land, duration }: move the root seat <-> car.exitPoint between
//           takeoff and land while emote('hopOut'|'hopIn') plays; the hop switches the mode on landing.
//           maya.emoteDuration(name), maya.stopEmote(), maya.isEmoting, maya.face, maya.mode,
//           maya.outfit, maya.joints (bones by name).
import * as THREE from '../three.js';
import { mergeGeometries, mergeVertices } from '../three.js';
import { PALETTE, toon, blobShadow, roundRect } from '../toon.js';
import { VoxelBuilder } from '../voxel.js';
import { artTexture, artMaterial, ART_SIZE } from '../art.js';

export const FACES = ['smile', 'happy', 'laugh', 'star', 'heart', 'wink', 'kiss', 'surprised', 'think', 'focus', 'shy', 'dizzy', 'sleepy', 'talk'];
export const EMOTES = ['wave', 'cheer', 'jump', 'point', 'think', 'kiss', 'hugBook', 'phone', 'laugh', 'write', 'nod', 'thumbsUp', 'bow', 'dance', 'hopOut', 'hopIn', 'lookAround'];

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth01 = (s) => {
  s = s < 0 ? 0 : s > 1 ? 1 : s;
  return s * s * (3 - 2 * s);
};
/** Smooth window: 0 before a, rises over f seconds, 1 until b - f, back to 0 at b. */
const win = (u, a, b, f) => smooth01((u - a) / f) * smooth01((b - u) / f);
const damp = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
const mixv = (a, b, w) => a + (b - a) * w;
const bump6 = (d) => {
  const c = Math.cos(d);
  return c > 0 ? c * c * c * c * c * c : 0;
};

// ---------------------------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------------------------
const C = {
  skin: PALETTE.skin,
  hair: PALETTE.hair,
  shine: PALETTE.hairShine,
  glasses: PALETTE.glasses,
  gold: PALETTE.gold,
  glint: '#FFFFFF',
  bookCover: '#E9A13B',
  bookBand: '#C9592C',
  bookSpine: PALETTE.maroon,
  pages: PALETTE.paper,
  phone: PALETTE.gold,
  padPaper: PALETTE.paper,
  padCover: PALETTE.maroon,
  pen: PALETTE.gold,
  ink: PALETTE.ink,
  sole: '#7A5434',
  belt: PALETTE.bronze,
  pearl: '#FFFDF8',
};

const OUTFITS = {
  // Default look: black blouse, beige blazer, cream wide trousers, tan shoes.
  writer: {
    top: PALETTE.blouse, jacket: PALETTE.blazer, lapel: '#C7AA7E', sleeve: PALETTE.blazer,
    cuff: PALETTE.blouse, trousers: PALETTE.trousers, shoes: PALETTE.shoes,
  },
  // Book-launch look: white blouse, orange floral silk scarf, cream wide trousers, gold watch.
  author: {
    top: '#FBF7EE', jacket: null, sleeve: '#FBF7EE', cuff: '#EDE3D0', trousers: PALETTE.trousers,
    shoes: PALETTE.shoes, scarf: '#E67A2E', scarfShade: '#C85A23', watch: true,
  },
};

// ---------------------------------------------------------------------------------------------
// Skeleton (bind pose: feet at y = 0, facing +Z; L = her left = +X)
// ---------------------------------------------------------------------------------------------
const ARM = 'XZY'; // twist, raise sideways, swing forward
const BONE_DEFS = [
  // name, parent, offset from parent (m), rotation order
  ['hips', null, 0, 0.42, 0, 'YXZ'],
  ['chest', 'hips', 0, 0.02, 0, 'YXZ'],
  ['neck', 'chest', 0, 0.28, 0, 'YXZ'],
  ['head', 'neck', 0, 0.025, 0, 'YXZ'],
  ['glasses', 'head', 0, 0.195, 0.2, 'XYZ'],
  ['glint', 'glasses', -0.105, 0.026, 0, 'XYZ'],
  ['bangs', 'head', 0, 0.4, 0.2, 'XYZ'],
  ['hairBack1', 'head', 0, 0.3, -0.2, 'XYZ'],
  ['hairBack2', 'hairBack1', 0, -0.29, -0.005, 'XYZ'],
  ['hairSideL1', 'head', 0.205, 0.26, 0.17, 'XYZ'],
  ['hairSideL2', 'hairSideL1', 0.005, -0.15, -0.01, 'XYZ'],
  ['hairSideR1', 'head', -0.205, 0.26, 0.17, 'XYZ'],
  ['hairSideR2', 'hairSideR1', -0.005, -0.15, -0.01, 'XYZ'],
  ['shoulderL', 'chest', 0.195, 0.245, 0, 'XYZ'],
  ['upperArmL', 'shoulderL', 0, 0, 0, ARM],
  ['elbowL', 'upperArmL', 0, -0.15, 0, ARM],
  ['forearmL', 'elbowL', 0, 0, 0, ARM],
  ['handL', 'forearmL', 0, -0.14, 0, 'XYZ'],
  ['shoulderR', 'chest', -0.195, 0.245, 0, 'XYZ'],
  ['upperArmR', 'shoulderR', 0, 0, 0, ARM],
  ['elbowR', 'upperArmR', 0, -0.15, 0, ARM],
  ['forearmR', 'elbowR', 0, 0, 0, ARM],
  ['handR', 'forearmR', 0, -0.14, 0, 'XYZ'],
  ['hipL', 'hips', 0.075, -0.02, 0, 'XYZ'],
  ['thighL', 'hipL', 0, 0, 0, ARM],
  ['kneeL', 'thighL', 0, -0.18, 0, 'XYZ'],
  ['shinL', 'kneeL', 0, 0, 0, 'XYZ'],
  ['footL', 'shinL', 0, -0.16, 0, 'XYZ'],
  ['hipR', 'hips', -0.075, -0.02, 0, 'XYZ'],
  ['thighR', 'hipR', 0, 0, 0, ARM],
  ['kneeR', 'thighR', 0, -0.18, 0, 'XYZ'],
  ['shinR', 'kneeR', 0, 0, 0, 'XYZ'],
  ['footR', 'shinR', 0, -0.16, 0, 'XYZ'],
  // props and extra digits (scaled to ~0 when hidden; pivots sit inside the body so they vanish)
  ['propBook', 'chest', 0, 0.14, 0.02, 'XYZ'],
  ['propPad', 'chest', 0, 0.07, 0.02, 'XYZ'],
  ['propPhone', 'handR', 0, -0.045, 0, 'XYZ'],
  ['propPen', 'handR', 0, -0.045, 0, 'XYZ'],
  ['fingerR', 'handR', 0, -0.06, 0, 'XYZ'],
  ['thumbR', 'handR', 0, -0.04, 0.02, 'XYZ'],
];

const BIND = {};
for (const [name, parent, x, y, z] of BONE_DEFS) {
  const p = parent ? BIND[parent] : [0, 0, 0];
  BIND[name] = [p[0] + x, p[1] + y, p[2] + z];
}
const BONE_INDEX = {};
BONE_DEFS.forEach((d, i) => (BONE_INDEX[d[0]] = i));
const HEAD0 = BIND.head; // head pivot (base of the cube head)

const ARM_L1 = 0.15; // shoulder -> elbow
const ARM_L2 = 0.185; // elbow -> palm centre
const LEG_A = 0.18; // hip -> knee
const LEG_B = 0.16; // knee -> ankle
const STRIDE = 0.55; // metres per step (half a walk cycle)
const SEAT_DROP = -0.36; // hips offset when seated (hips 6 cm above the seat point)

// ---------------------------------------------------------------------------------------------
// Pose channels (one flat Float32Array per pose; no allocation while animating)
// ---------------------------------------------------------------------------------------------
const JOINTS = ['hips', 'chest', 'neck', 'head', 'shoulderL', 'upperArmL', 'elbowL', 'forearmL', 'handL', 'shoulderR', 'upperArmR', 'elbowR', 'forearmR', 'handR', 'hipL', 'thighL', 'kneeL', 'shinL', 'footL', 'hipR', 'thighR', 'kneeR', 'shinR', 'footR'];
const EXTRA = ['hips.px', 'hips.py', 'hips.pz', 'shoulderL.py', 'shoulderR.py', 'body.y', 'body.sy', 'body.ry', 'body.rz', 'legs.crouch', 'glasses.py', 'prop.book', 'prop.phone', 'prop.pad', 'prop.pen', 'prop.finger', 'prop.thumb', 'ikL.x', 'ikL.y', 'ikL.z', 'ikL.w', 'ikR.x', 'ikR.y', 'ikR.z', 'ikR.w'];
const CH = {};
let NCH = 0;
for (const j of JOINTS) for (const a of ['x', 'y', 'z']) CH[`${j}.${a}`] = NCH++;
for (const e of EXTRA) CH[e] = NCH++;
const X = {}, Y = {}, Z = {};
for (const j of JOINTS) {
  X[j] = CH[`${j}.x`];
  Y[j] = CH[`${j}.y`];
  Z[j] = CH[`${j}.z`];
}
const DEFAULTS = new Float32Array(NCH);
DEFAULTS[CH['body.sy']] = 1;
const LEG_SET = new Set();
for (const j of ['hips', 'hipL', 'thighL', 'kneeL', 'shinL', 'footL', 'hipR', 'thighR', 'kneeR', 'shinR', 'footR']) {
  LEG_SET.add(X[j]).add(Y[j]).add(Z[j]);
}
for (const e of ['legs.crouch', 'hips.px', 'hips.py', 'hips.pz', 'body.ry']) LEG_SET.add(CH[e]);
const STICKY = new Set(['ikL.x', 'ikL.y', 'ikL.z', 'ikR.x', 'ikR.y', 'ikR.z'].map((k) => CH[k]));
const PROPS = [
  ['propBook', CH['prop.book']], ['propPhone', CH['prop.phone']], ['propPad', CH['prop.pad']],
  ['propPen', CH['prop.pen']], ['fingerR', CH['prop.finger']], ['thumbR', CH['prop.thumb']],
];

// ---------------------------------------------------------------------------------------------
// Model: boxes bound to bones
// ---------------------------------------------------------------------------------------------
// Hair in head-local metres (relative to the head pivot): [bone, x0, y0, z0, x1, y1, z1, colour]
const HAIR = [
  ['head', -0.232, 0.375, -0.225, 0.232, 0.438, 0.245, 'hair'], // crown, overhanging the fringe
  ['head', -0.196, 0.43, -0.19, 0.196, 0.455, 0.2, 'hair'], // stepped dome so the top reads round
  ['head', -0.235, 0.12, -0.235, 0.235, 0.4, -0.13, 'hair'], // back of the head
  ['head', 0.205, 0.13, -0.21, 0.242, 0.26, 0.11, 'hair'], // side, over the ear (L)
  ['head', -0.242, 0.13, -0.21, -0.205, 0.26, 0.11, 'hair'],
  ['head', 0.205, 0.25, -0.21, 0.242, 0.4, 0.215, 'hair'], // side, over the temple (L)
  ['head', -0.242, 0.25, -0.21, -0.205, 0.4, 0.215, 'hair'],
  // soft curtain bangs: vertical strands parted at the centre, longer and swept out toward the temples
  ['bangs', -0.036, 0.33, 0.214, -0.006, 0.4, 0.249, 'hair', -0.06],
  ['bangs', -0.076, 0.3, 0.214, -0.034, 0.4, 0.254, 'hair', -0.1],
  ['bangs', -0.119, 0.281, 0.214, -0.073, 0.4, 0.25, 'hair', -0.12],
  ['bangs', -0.166, 0.25, 0.214, -0.116, 0.4, 0.255, 'hair', -0.14],
  ['bangs', -0.224, 0.2, 0.214, -0.163, 0.4, 0.25, 'hair', -0.1],
  ['bangs', 0.012, 0.335, 0.214, 0.04, 0.4, 0.249, 'hair', 0.06],
  ['bangs', 0.038, 0.304, 0.214, 0.081, 0.4, 0.254, 'hair', 0.1],
  ['bangs', 0.079, 0.284, 0.214, 0.123, 0.4, 0.25, 'hair', 0.12],
  ['bangs', 0.121, 0.254, 0.214, 0.169, 0.4, 0.255, 'hair', 0.14],
  ['bangs', 0.166, 0.2, 0.214, 0.224, 0.4, 0.25, 'hair', 0.1],
  // face-framing wavy locks falling in front of the shoulders
  ['hairSideL1', 0.168, 0.12, 0.1, 0.242, 0.25, 0.248, 'hair'],
  ['hairSideL2', 0.178, 0.02, 0.085, 0.256, 0.125, 0.236, 'hair'],
  ['hairSideL2', 0.17, -0.075, 0.07, 0.248, 0.025, 0.215, 'hair'],
  ['hairSideL2', 0.186, -0.135, 0.06, 0.262, -0.07, 0.19, 'hair'],
  ['hairSideR1', -0.242, 0.12, 0.1, -0.168, 0.25, 0.248, 'hair'],
  ['hairSideR2', -0.254, 0.025, 0.085, -0.174, 0.125, 0.236, 'hair'],
  ['hairSideR2', -0.247, -0.07, 0.07, -0.168, 0.03, 0.215, 'hair'],
  ['hairSideR2', -0.264, -0.125, 0.06, -0.188, -0.065, 0.19, 'hair'],
  // long wavy hair down the back: A-line volume, layered strands with curled tips
  ['hairBack1', -0.245, 0.0, -0.255, 0.245, 0.3, -0.15, 'hair'],
  ['hairBack1', 0.226, -0.03, -0.24, 0.27, 0.24, -0.02, 'hair'],
  ['hairBack1', -0.27, -0.03, -0.24, -0.226, 0.24, -0.02, 'hair'],
  ['hairBack2', -0.258, -0.3, -0.24, -0.15, 0.01, -0.145, 'hair'],
  ['hairBack2', -0.155, -0.34, -0.235, -0.05, 0.01, -0.135, 'hair'],
  ['hairBack2', -0.055, -0.31, -0.24, 0.055, 0.01, -0.14, 'hair'],
  ['hairBack2', 0.05, -0.35, -0.235, 0.155, 0.01, -0.135, 'hair'],
  ['hairBack2', 0.15, -0.29, -0.24, 0.258, 0.01, -0.145, 'hair'],
  ['hairBack2', 0.238, -0.16, -0.235, 0.29, 0.0, -0.03, 'hair'], // shoulder-level waves (L)
  ['hairBack2', -0.29, -0.15, -0.235, -0.238, 0.0, -0.03, 'hair'],
  ['hairBack2', 0.226, -0.27, -0.24, 0.282, -0.15, -0.06, 'hair'],
  ['hairBack2', -0.282, -0.265, -0.24, -0.226, -0.14, -0.06, 'hair'],
  ['hairBack2', -0.296, -0.33, -0.235, -0.215, -0.26, -0.1, 'hair'],
  ['hairBack2', 0.215, -0.335, -0.235, 0.296, -0.262, -0.1, 'hair'],
  ['hairBack2', -0.12, -0.375, -0.235, -0.06, -0.33, -0.135, 'hair'],
  ['hairBack2', 0.07, -0.385, -0.235, 0.135, -0.34, -0.135, 'hair'],
];
// Warm dark-brown highlight blocks, slightly proud of the hair surface (no outline).
const HAIR_SHINE = [
  // strand highlights combed back over the crown
  ['head', -0.13, 0.455, -0.06, -0.1, 0.459, 0.16, 'shine'],
  ['head', -0.035, 0.455, -0.1, -0.008, 0.459, 0.17, 'shine'],
  ['head', 0.07, 0.455, -0.05, 0.098, 0.459, 0.15, 'shine'],
  ['head', 0.15, 0.455, 0.0, 0.172, 0.459, 0.13, 'shine'],
  ['head', -0.226, 0.438, 0.02, -0.2, 0.442, 0.2, 'shine'],
  ['head', 0.2, 0.438, -0.04, 0.226, 0.442, 0.14, 'shine'],
  ['head', -0.17, 0.405, 0.245, -0.07, 0.417, 0.249, 'shine'],
  ['head', 0.06, 0.398, 0.245, 0.16, 0.41, 0.249, 'shine'],
  // a soft "halo" band across the curtain strands
  ['bangs', -0.158, 0.352, 0.254, -0.124, 0.364, 0.258, 'shine', -0.14],
  ['bangs', -0.112, 0.36, 0.25, -0.08, 0.372, 0.254, 'shine', -0.12],
  ['bangs', -0.068, 0.366, 0.254, -0.04, 0.378, 0.258, 'shine', -0.1],
  ['bangs', 0.046, 0.366, 0.254, 0.074, 0.378, 0.258, 'shine', 0.1],
  ['bangs', 0.086, 0.36, 0.25, 0.117, 0.372, 0.254, 'shine', 0.12],
  ['bangs', 0.128, 0.352, 0.255, 0.162, 0.364, 0.259, 'shine', 0.14],
  ['hairBack2', -0.13, -0.22, -0.239, -0.095, -0.04, -0.234, 'shine'],
  ['hairBack2', 0.085, -0.26, -0.239, 0.12, -0.08, -0.234, 'shine'],
  ['hairBack1', -0.06, 0.06, -0.259, 0.0, 0.24, -0.254, 'shine'],
  ['hairSideL2', 0.256, 0.04, 0.15, 0.26, 0.11, 0.17, 'shine'],
  ['hairSideR2', -0.258, 0.04, 0.15, -0.254, 0.11, 0.17, 'shine'],
];
// Glasses: thin octagonal gold-brown frames (rounded corners suggested by chamfer bars).
const GL = { z: 0.243, t: 0.009, dep: 0.01, a: 0.054, b: 0.045, c: 0.015, cy: 0.195, cx: 0.085 };

// ----- detail pass (owner request "more detailed graphics"): extra tones for small parts
const T = {
  hair: PALETTE.hair, hairMid: '#2B221C', shine: PALETTE.hairShine, shineHi: '#71503A',
  blazerDark: '#C1A47A', blazerLight: '#EADBC0', stitch: '#A98B60', horn: '#5E4123', hornHi: '#B48C55',
  blouseFold: '#3B3431', crease: '#F6EFE2', creaseShade: '#CDBC9E', seam: '#C8B795',
  toe: '#A6774F', strap: '#7E5636', heel: '#5A3B22', welt: '#D8AD80',
  skinShade: '#E3B190', skinLine: '#D3987A', pearl: '#FFFDF8', gold: PALETTE.gold, goldDeep: PALETTE.goldDeep,
  maroon: PALETTE.maroon, silkFold: '#E9E0CF', cream: '#FFF1D6', belt: '#6A4A2E', hole: '#3A2616',
};
// Hair strands and highlights in the HAIR layout: [bone, x0, y0, z0, x1, y1, z1, tone, rz, outline].
// Only the 3D model uses these (the dialogue portrait keeps its simpler silhouette).
const HAIR_DETAIL = [
  // crown: raised strands combed back from the centre parting, two bright spots on the shine
  ['head', -0.188, 0.452, -0.17, -0.15, 0.461, 0.185, 'hairMid'],
  ['head', -0.088, 0.452, -0.175, -0.045, 0.462, 0.19, 'hairMid'],
  ['head', 0.008, 0.452, -0.17, 0.05, 0.462, 0.19, 'hairMid'],
  ['head', 0.104, 0.452, -0.165, 0.142, 0.461, 0.185, 'hairMid'],
  ['head', -0.126, 0.458, 0.03, -0.104, 0.4615, 0.11, 'shineHi'],
  ['head', 0.074, 0.458, 0.02, 0.094, 0.4615, 0.1, 'shineHi'],
  ['head', -0.226, 0.44, -0.12, -0.204, 0.4435, -0.02, 'shine'],
  ['head', 0.204, 0.44, -0.15, 0.226, 0.4435, -0.06, 'shine'],
  // back of the head: a soft highlight band where the crown curves away
  ['head', -0.2, 0.328, -0.239, -0.15, 0.338, -0.233, 'shine'],
  ['head', -0.125, 0.336, -0.239, -0.06, 0.346, -0.233, 'shine'],
  ['head', -0.035, 0.34, -0.239, 0.035, 0.35, -0.233, 'shine'],
  ['head', 0.06, 0.336, -0.239, 0.125, 0.346, -0.233, 'shine'],
  ['head', 0.15, 0.328, -0.239, 0.2, 0.338, -0.233, 'shine'],
  // long back hair: layered locks (outlined so each one reads) with highlights
  ['hairBack1', -0.24, 0.0, -0.263, -0.18, 0.29, -0.25, 'hairMid', 0, true],
  ['hairBack1', -0.16, -0.018, -0.263, -0.092, 0.285, -0.25, 'hair', 0, true],
  ['hairBack1', 0.01, -0.012, -0.263, 0.07, 0.29, -0.25, 'hairMid', 0, true],
  ['hairBack1', 0.09, -0.022, -0.263, 0.16, 0.285, -0.25, 'hair', 0, true],
  ['hairBack1', 0.18, 0.004, -0.263, 0.24, 0.29, -0.25, 'hairMid', 0, true],
  ['hairBack1', -0.137, 0.07, -0.266, -0.115, 0.23, -0.262, 'shine'],
  ['hairBack1', 0.114, 0.05, -0.266, 0.136, 0.21, -0.262, 'shine'],
  ['hairBack1', -0.222, 0.12, -0.266, -0.204, 0.25, -0.262, 'shine'],
  ['hairBack1', 0.2, 0.1, -0.266, 0.218, 0.24, -0.262, 'shine'],
  ['hairBack1', 0.269, 0.04, -0.17, 0.274, 0.2, -0.145, 'shine'],
  ['hairBack1', -0.274, 0.04, -0.17, -0.269, 0.2, -0.145, 'shine'],
  // lower locks: lighter centre strands and tapered tips
  ['hairBack2', -0.216, -0.27, -0.244, -0.194, -0.03, -0.238, 'hairMid'],
  ['hairBack2', -0.012, -0.28, -0.244, 0.012, -0.03, -0.238, 'hairMid'],
  ['hairBack2', 0.192, -0.26, -0.244, 0.214, -0.03, -0.238, 'hairMid'],
  ['hairBack2', -0.232, -0.33, -0.232, -0.19, -0.295, -0.152, 'hair', 0, true],
  ['hairBack2', -0.022, -0.345, -0.232, 0.022, -0.305, -0.148, 'hair', 0, true],
  ['hairBack2', 0.19, -0.322, -0.232, 0.232, -0.285, -0.152, 'hair', 0, true],
  ['hairBack2', 0.25, -0.12, -0.24, 0.295, -0.112, -0.04, 'shine'],
  ['hairBack2', -0.295, -0.115, -0.24, -0.25, -0.107, -0.04, 'shine'],
  // temples: a strand line and a highlight on each side
  ['head', 0.241, 0.27, 0.06, 0.246, 0.39, 0.085, 'hairMid'],
  ['head', -0.246, 0.27, 0.06, -0.241, 0.39, 0.085, 'hairMid'],
  ['head', 0.241, 0.3, -0.07, 0.246, 0.37, -0.045, 'shine'],
  ['head', -0.246, 0.3, -0.07, -0.241, 0.37, -0.045, 'shine'],
  // face-framing locks: split into strands, tips curling outward
  ['hairSideL1', 0.198, 0.13, 0.247, 0.212, 0.24, 0.252, 'hairMid'],
  ['hairSideR1', -0.212, 0.13, 0.247, -0.198, 0.24, 0.252, 'hairMid'],
  ['hairSideL2', 0.21, 0.03, 0.235, 0.224, 0.118, 0.24, 'hairMid'],
  ['hairSideR2', -0.22, 0.035, 0.235, -0.206, 0.118, 0.24, 'hairMid'],
  ['hairSideL2', 0.2, -0.065, 0.214, 0.214, 0.02, 0.219, 'hairMid'],
  ['hairSideR2', -0.214, -0.06, 0.214, -0.2, 0.025, 0.219, 'hairMid'],
  ['hairSideL2', 0.214, -0.162, 0.08, 0.262, -0.128, 0.17, 'hair', 0.3, true],
  ['hairSideR2', -0.262, -0.158, 0.08, -0.214, -0.124, 0.17, 'hair', -0.3, true],
  ['hairSideL1', 0.181, 0.178, 0.2475, 0.188, 0.236, 0.2515, 'shine'],
  ['hairSideR1', -0.188, 0.178, 0.2475, -0.181, 0.236, 0.2515, 'shine'],
  ['hairSideL2', 0.235, 0.05, 0.2355, 0.242, 0.106, 0.2395, 'shine'],
  ['hairSideR2', -0.24, 0.054, 0.2355, -0.233, 0.11, 0.2395, 'shine'],
];
const NO_OUTLINE = { outline: false };
/** Box tilted about Z with its parent part: (lx, ly) is an offset in the parent's own tilted frame. */
function tilted(P, bone, cx, cy, rz, lx, ly, z, w, h, d, color, outline = false) {
  const c = Math.cos(rz);
  const s = Math.sin(rz);
  P.c(bone, cx + lx * c - ly * s, cy + lx * s + ly * c, z, w, h, d, color, { rz, outline });
}
/** Small four-petal flower (cream petals round a gold centre) on a tilted scarf part. */
function flower(P, cx, cy, rz, lx, ly, z) {
  tilted(P, 'chest', cx, cy, rz, lx, ly, z + 0.0012, 0.0085, 0.0085, 0.0035, T.gold);
  for (const [px, py] of [[0.009, 0], [-0.009, 0], [0, 0.009], [0, -0.009]]) tilted(P, 'chest', cx, cy, rz, lx + px, ly + py, z, 0.009, 0.009, 0.003, T.cream);
}

class Parts {
  constructor() {
    this.list = [];
  }
  /** Mesh-space min/max box bound to a bone. */
  abs(bone, x0, y0, z0, x1, y1, z1, color, o = {}) {
    this.list.push({
      bone, x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2,
      w: Math.abs(x1 - x0), h: Math.abs(y1 - y0), d: Math.abs(z1 - z0),
      color, rx: o.rx || 0, ry: o.ry || 0, rz: o.rz || 0, outline: o.outline !== false,
    });
    return this;
  }
  /** Mirrored helper: s = +1 (her left, +X) or -1 (her right). */
  absS(s, bone, x0, y0, z0, x1, y1, z1, color, o) {
    return s > 0 ? this.abs(bone, x0, y0, z0, x1, y1, z1, color, o) : this.abs(bone, -x1, y0, z0, -x0, y1, z1, color, o);
  }
  /** Centre/size box in head-local metres. */
  headC(bone, x, y, z, w, h, d, color, o = {}) {
    this.list.push({
      bone, x: HEAD0[0] + x, y: HEAD0[1] + y, z: HEAD0[2] + z, w, h, d,
      color, rx: o.rx || 0, ry: o.ry || 0, rz: o.rz || 0, outline: o.outline !== false,
    });
    return this;
  }
  /** Centre/size box in mesh space. */
  c(bone, x, y, z, w, h, d, color, o = {}) {
    this.list.push({ bone, x, y, z, w, h, d, color, rx: o.rx || 0, ry: o.ry || 0, rz: o.rz || 0, outline: o.outline !== false });
    return this;
  }
}

function buildParts(outfitName) {
  const o = OUTFITS[outfitName] || OUTFITS.writer;
  const P = new Parts();
  const H = HEAD0;
  // ----- head and neck
  P.abs('head', -0.21, H[1], -0.2, 0.21, H[1] + 0.42, 0.22, C.skin);
  P.abs('neck', -0.045, 0.7, -0.04, 0.045, 0.765, 0.045, C.skin);
  // ----- hair (strands may lean: 9th entry = rotation about Z)
  for (const h of HAIR) P.abs(h[0], h[1], H[1] + h[2], h[3], h[4], H[1] + h[5], h[6], C[h[7]], { rz: h[8] || 0 });
  for (const h of HAIR_SHINE) P.abs(h[0], h[1], H[1] + h[2], h[3], h[4], H[1] + h[5], h[6], C[h[7]], { rz: h[8] || 0, outline: false });
  // glint (lens sparkle), hidden until the glint bone scales up
  P.headC('glint', -0.105, 0.221, 0.25, 0.03, 0.0075, 0.003, C.glint, { rz: Math.PI / 4, outline: false });
  P.headC('glint', -0.084, 0.205, 0.25, 0.009, 0.009, 0.003, C.glint, { rz: Math.PI / 4, outline: false });

  // ----- torso
  if (o.jacket) {
    const J = o.jacket;
    P.abs('chest', -0.138, 0.44, -0.078, 0.138, 0.716, 0.078, o.top); // black blouse
    P.abs('chest', -0.156, 0.4, -0.094, 0.156, 0.725, -0.02, J); // blazer back
    for (const s of [1, -1]) {
      P.absS(s, 'chest', 0.128, 0.4, -0.094, 0.156, 0.725, 0.094, J); // side
      // open front as vertical panels whose inner edge steps out toward the collar (a blocky V)
      P.absS(s, 'chest', 0.104, 0.4, 0.066, 0.156, 0.725, 0.094, J);
      P.absS(s, 'chest', 0.064, 0.4, 0.066, 0.106, 0.64, 0.094, J);
      P.absS(s, 'chest', 0.036, 0.4, 0.066, 0.066, 0.56, 0.094, J);
      // lapels folded back along the V
      P.absS(s, 'chest', 0.062, 0.555, 0.086, 0.086, 0.645, 0.1, o.lapel);
      P.absS(s, 'chest', 0.102, 0.635, 0.086, 0.13, 0.728, 0.1, o.lapel);
      P.absS(s, 'chest', 0.072, 0.462, 0.093, 0.14, 0.473, 0.098, o.lapel, { outline: false }); // pocket flap
    }
    P.abs('chest', -0.095, 0.705, -0.094, 0.095, 0.758, -0.035, J); // collar behind the neck
    // (sparkle pendant on a gold chain: see buildDetail)
  } else {
    P.abs('chest', -0.148, 0.43, -0.086, 0.148, 0.722, 0.086, o.top); // white blouse
    P.abs('chest', -0.009, 0.45, 0.086, 0.009, 0.69, 0.089, o.cuff, { outline: false }); // placket
    for (const y of [0.5, 0.56, 0.62]) P.abs('chest', -0.006, y, 0.088, 0.006, y + 0.012, 0.092, C.pearl, { outline: false });
    P.abs('hips', -0.151, 0.443, -0.088, 0.151, 0.468, 0.088, C.belt); // belt
    P.abs('hips', -0.02, 0.44, 0.087, 0.02, 0.471, 0.094, C.gold, { outline: false }); // buckle
  }
  if (o.scarf) {
    const S = o.scarf, D = o.scarfShade;
    P.abs('chest', -0.096, 0.678, -0.075, 0.096, 0.735, 0.092, S); // soft band around the collar
    P.abs('chest', -0.016, 0.632, 0.078, 0.05, 0.694, 0.118, S); // knot
    P.c('chest', -0.05, 0.676, 0.104, 0.07, 0.042, 0.03, S, { rz: 0.45 }); // bow loops
    P.c('chest', 0.084, 0.672, 0.1, 0.066, 0.04, 0.03, D, { rz: -0.5 });
    P.c('chest', -0.005, 0.57, 0.108, 0.05, 0.13, 0.02, S, { rz: 0.14 }); // tails
    P.c('chest', 0.046, 0.585, 0.104, 0.046, 0.11, 0.02, D, { rz: -0.22 });
    // floral dots (cream, maroon, gold)
    const dots = [[0.015, 0.67, 0.119, '#FFF1D6'], [0.035, 0.648, 0.119, PALETTE.maroon], [-0.06, 0.708, 0.093, '#FFF1D6'], [0.062, 0.712, 0.093, PALETTE.gold], [-0.008, 0.6, 0.119, '#FFF1D6'], [0.004, 0.545, 0.119, PALETTE.maroon], [0.05, 0.6, 0.115, '#FFF1D6'], [0.044, 0.56, 0.115, PALETTE.gold], [-0.085, 0.69, 0.093, PALETTE.maroon], [-0.055, 0.68, 0.12, PALETTE.gold], [0.09, 0.676, 0.116, '#FFF1D6']];
    for (const [x, y, zz, col] of dots) P.c('chest', x, y, zz, 0.014, 0.014, 0.004, col, { outline: false });
  }
  // ----- hips (trousers)
  P.abs('hips', -0.145, 0.36, -0.083, 0.145, 0.47, 0.083, o.trousers);
  // ----- arms
  for (const s of [1, -1]) {
    const S = s > 0 ? 'L' : 'R';
    const x = 0.195 * s;
    P.c('upperArm' + S, x, 0.6265, 0, 0.088, 0.183, 0.092, o.sleeve);
    P.c('forearm' + S, x, 0.4745, 0, 0.086, 0.123, 0.09, o.sleeve);
    P.c('forearm' + S, x, 0.404, 0, 0.082, 0.022, 0.086, o.cuff);
    P.c('hand' + S, x, 0.355, 0.004, 0.076, 0.082, 0.084, C.skin);
    P.c('hand' + S, x - s * 0.024, 0.366, 0.046, 0.03, 0.036, 0.024, C.skin); // thumb nub
  }
  if (o.watch) {
    P.c('forearmL', 0.195, 0.419, 0, 0.093, 0.019, 0.097, C.gold);
    // (dial, bezel and bracelet rows: see buildDetail)
  }
  // ----- legs (wide-leg trousers, tan shoes)
  for (const s of [1, -1]) {
    const S = s > 0 ? 'L' : 'R';
    const x = 0.075 * s;
    P.c('thigh' + S, x, 0.322, 0, 0.128, 0.215, 0.135, o.trousers);
    P.c('shin' + S, x, 0.18, 0, 0.128, 0.09, 0.135, o.trousers);
    P.c('shin' + S, x, 0.1, 0.002, 0.14, 0.084, 0.148, o.trousers);
    P.c('foot' + S, x, 0.031, 0.032, 0.098, 0.062, 0.165, o.shoes);
    P.c('foot' + S, x, 0.007, 0.033, 0.102, 0.014, 0.169, C.sole, { outline: false });
  }
  // ----- small detail parts (seams, buttons, creases, strands, highlights)
  buildDetail(P, o);
  // ----- props (hidden by default)
  P.abs('propBook', -0.075, 0.48, 0.13, 0.075, 0.68, 0.165, C.bookCover);
  P.abs('propBook', -0.079, 0.479, 0.127, -0.066, 0.681, 0.168, C.bookSpine);
  P.abs('propBook', -0.066, 0.484, 0.122, 0.07, 0.676, 0.13, C.pages, { outline: false });
  P.abs('propBook', -0.066, 0.53, 0.165, 0.075, 0.548, 0.168, C.bookBand, { outline: false });
  P.c('propBook', 0.01, 0.618, 0.167, 0.03, 0.03, 0.004, PALETTE.paper, { rz: Math.PI / 4, outline: false });
  // phone held against the palm (+X for the right hand), sticking out past the mitten tip
  P.abs('propPhone', -0.165, 0.24, -0.03, -0.148, 0.345, 0.03, C.phone);
  P.abs('propPhone', -0.149, 0.25, -0.025, -0.145, 0.335, 0.025, PALETTE.telegram, { outline: false }); // screen
  P.abs('propPhone', -0.168, 0.325, 0.01, -0.164, 0.337, 0.022, PALETTE.ink, { outline: false }); // camera
  // notepad held in front of the tummy (chest prop), tilted up toward her eyes and the camera
  P.c('propPad', 0.01, 0.52, 0.2, 0.17, 0.016, 0.125, C.padCover, { rx: -0.95 });
  P.c('propPad', 0.01, 0.527, 0.204, 0.156, 0.006, 0.112, C.padPaper, { rx: -0.95, outline: false });
  P.c('propPad', 0.01, 0.567, 0.168, 0.14, 0.014, 0.014, C.gold, { rx: -0.95, outline: false });
  for (const y of [0.507, 0.522, 0.537]) P.c('propPad', 0.025, y, 0.214 + (y - 0.522) * 0.75, 0.09, 0.004, 0.006, PALETTE.parchment, { rx: -0.95, outline: false });
  P.c('propPen', -0.195, 0.33, 0.065, 0.016, 0.016, 0.125, C.pen);
  P.c('propPen', -0.195, 0.33, 0.132, 0.01, 0.01, 0.014, C.ink, { outline: false });
  P.c('fingerR', -0.193, 0.297, 0.02, 0.027, 0.05, 0.027, C.skin);
  P.c('thumbR', -0.18, 0.37, 0.07, 0.028, 0.03, 0.05, C.skin);
  return P.list;
}

/**
 * Detail pass: small parts a few mm proud of the surface they decorate, on the same bone, so
 * shapes, bones and proportions stay exactly as before and every pose and emote still fits.
 */
function buildDetail(P, o) {
  const H = HEAD0;
  const NO = NO_OUTLINE;
  // ----- hair: layered strands, strand lines and highlights
  for (const h of HAIR_DETAIL) P.abs(h[0], h[1], H[1] + h[2], h[3], h[4], H[1] + h[5], h[6], T[h[7]], { rz: h[8] || 0, outline: !!h[9] });
  // a darker centre line down each of the four outer curtain-bang strands
  for (const h of HAIR) {
    if (h[0] !== 'bangs') continue;
    const cx = (h[1] + h[4]) / 2;
    if (Math.abs(cx) < 0.1) continue;
    tilted(P, 'bangs', cx, H[1] + (h[2] + h[5]) / 2, h[8] || 0, Math.sign(cx) * 0.004, -0.014, h[6] + 0.0015, 0.007, (h[5] - h[2]) * 0.66, 0.004, T.hairMid);
  }
  // ----- neck shade under the chin, small gold earrings with a pearl drop
  P.abs('neck', -0.046, 0.724, 0.04, 0.046, 0.75, 0.047, T.skinShade, NO);
  for (const s of [1, -1]) {
    P.absS(s, 'head', 0.208, H[1] + 0.1, 0.016, 0.219, H[1] + 0.12, 0.032, T.gold, NO);
    P.absS(s, 'head', 0.209, H[1] + 0.074, 0.018, 0.218, H[1] + 0.1, 0.03, T.pearl, NO);
  }
  // ----- torso
  if (o.jacket) {
    for (const s of [1, -1]) {
      // topstitching down the opening edge of each front panel
      P.absS(s, 'chest', 0.04, 0.41, 0.093, 0.0435, 0.553, 0.0962, T.stitch, NO);
      P.absS(s, 'chest', 0.068, 0.564, 0.093, 0.0715, 0.633, 0.0962, T.stitch, NO);
      P.absS(s, 'chest', 0.108, 0.648, 0.093, 0.1115, 0.72, 0.0962, T.stitch, NO);
      // lapels: lighter rolled edge, soft shadow below each fold
      P.absS(s, 'chest', 0.0615, 0.558, 0.099, 0.0665, 0.645, 0.1015, T.blazerLight, NO);
      P.absS(s, 'chest', 0.1015, 0.638, 0.099, 0.1065, 0.727, 0.1015, T.blazerLight, NO);
      P.absS(s, 'chest', 0.062, 0.549, 0.093, 0.086, 0.555, 0.0965, T.blazerDark, NO);
      P.absS(s, 'chest', 0.102, 0.629, 0.093, 0.13, 0.635, 0.0965, T.blazerDark, NO);
      // hem band (darker base), side seam, shadow under each pocket flap
      P.absS(s, 'chest', 0.036, 0.4, 0.093, 0.157, 0.409, 0.0965, T.blazerDark, NO);
      P.absS(s, 'chest', 0.155, 0.4, -0.0955, 0.1575, 0.409, 0.0955, T.blazerDark, NO);
      P.absS(s, 'chest', 0.1555, 0.409, -0.003, 0.1585, 0.722, 0.003, T.stitch, NO);
      P.absS(s, 'chest', 0.074, 0.456, 0.093, 0.138, 0.462, 0.0962, T.blazerDark, NO);
      P.absS(s, 'chest', 0.072, 0.4725, 0.0975, 0.14, 0.4755, 0.0988, T.blazerLight, NO); // lit flap top
    }
    // two horn buttons on her left panel, buttonholes opposite
    for (const y of [0.47, 0.515]) {
      P.abs('chest', 0.043, y - 0.008, 0.093, 0.059, y + 0.008, 0.0995, T.horn, NO);
      P.abs('chest', 0.046, y + 0.001, 0.0995, 0.051, y + 0.006, 0.1005, T.hornHi, NO);
      P.abs('chest', -0.058, y - 0.002, 0.093, -0.044, y + 0.002, 0.0965, T.horn, NO);
    }
    // breast pocket welt with her pen clipped in it (she is a writer)
    P.abs('chest', 0.112, 0.594, 0.093, 0.152, 0.602, 0.0975, o.lapel, NO);
    P.abs('chest', 0.124, 0.598, 0.089, 0.133, 0.625, 0.0968, T.maroon, NO);
    P.abs('chest', 0.124, 0.625, 0.089, 0.133, 0.632, 0.0968, T.gold, NO);
    P.abs('chest', 0.127, 0.597, 0.0968, 0.13, 0.623, 0.0992, T.gold, NO);
    // black blouse: soft folds in the V, a fine gold chain and a sparkle pendant
    for (const s of [1, -1]) {
      P.absS(s, 'chest', 0.013, 0.47, 0.0775, 0.018, 0.6, 0.0805, T.blouseFold, NO);
      P.c('chest', s * 0.023, 0.68, 0.0795, 0.0035, 0.076, 0.003, T.gold, { rz: -s * 0.4636, outline: false });
    }
    P.c('chest', 0, 0.632, 0.0805, 0.013, 0.013, 0.004, T.gold, { rz: Math.PI / 4, outline: false });
    P.c('chest', 0, 0.632, 0.0812, 0.004, 0.03, 0.0035, T.gold, NO);
    P.c('chest', 0, 0.632, 0.0812, 0.026, 0.004, 0.0035, T.gold, NO);
    P.c('chest', 0, 0.632, 0.0832, 0.005, 0.005, 0.002, T.cream, NO);
    // slim leather belt in the V, gold buckle and two belt loops
    P.abs('hips', -0.146, 0.445, -0.085, 0.146, 0.47, 0.0855, T.belt, NO);
    P.abs('hips', -0.011, 0.443, 0.0855, 0.011, 0.472, 0.089, T.gold, NO);
    P.abs('hips', -0.005, 0.451, 0.089, 0.005, 0.464, 0.0905, T.hole, NO);
    for (const s of [1, -1]) P.absS(s, 'hips', 0.026, 0.442, 0.0855, 0.033, 0.473, 0.0885, o.trousers, NO);
  } else {
    // white blouse: soft folds, fabric gathered above the belt, a fold shade on the scarf band
    for (const s of [1, -1]) {
      P.absS(s, 'chest', 0.064, 0.47, 0.0855, 0.069, 0.6, 0.0885, T.silkFold, NO);
      P.absS(s, 'chest', 0.114, 0.49, 0.0855, 0.119, 0.64, 0.0885, T.silkFold, NO);
      for (const gx of [0.03, 0.058, 0.09, 0.122]) P.absS(s, 'chest', gx, 0.468, 0.0855, gx + 0.004, 0.49, 0.0885, T.silkFold, NO);
      P.absS(s, 'chest', 0.1475, 0.47, -0.003, 0.1505, 0.715, 0.003, T.silkFold, NO); // side seam
    }
    // belt: framed buckle, holes and loops
    P.abs('hips', -0.012, 0.448, 0.094, 0.012, 0.463, 0.0955, T.horn, NO);
    for (const hx of [0.032, 0.045]) P.abs('hips', hx - 0.002, 0.4535, 0.0878, hx + 0.002, 0.4575, 0.0895, T.hole, NO);
    for (const lx of [0.06, 0.125]) for (const s of [1, -1]) P.absS(s, 'hips', lx - 0.004, 0.4395, 0.0878, lx + 0.004, 0.4725, 0.091, o.trousers, NO);
  }
  if (o.scarf) {
    const S = o.scarf;
    const Dk = o.scarfShade;
    P.abs('chest', -0.0965, 0.678, 0.0905, 0.0965, 0.6845, 0.0935, Dk, NO); // fold shade along the band
    // flowers on the knot, a bow loop and both tails; maroon hem stripe and fringe on each tail
    flower(P, 0.017, 0.662, 0, 0, 0, 0.1195);
    flower(P, -0.05, 0.676, 0.45, -0.012, 0.002, 0.1205);
    flower(P, -0.005, 0.57, 0.14, 0.004, -0.028, 0.1195);
    flower(P, 0.046, 0.585, -0.22, -0.003, -0.012, 0.1155);
    for (const [cx, cy, rz, hh, col, z] of [[-0.005, 0.57, 0.14, 0.13, S, 0.108], [0.046, 0.585, -0.22, 0.11, Dk, 0.104]]) {
      tilted(P, 'chest', cx, cy, rz, 0, -hh / 2 + 0.012, z + 0.0105, 0.05, 0.006, 0.002, T.maroon);
      for (const fx of [-0.016, 0, 0.016]) tilted(P, 'chest', cx, cy, rz, fx, -hh / 2 - 0.006, z, 0.008, 0.013, 0.012, col);
    }
  }
  // ----- arms: sleeve seams, cuff buttons, finger lines
  for (const s of [1, -1]) {
    const S = s > 0 ? 'L' : 'R';
    const x = 0.195 * s;
    if (o.jacket) {
      P.c('upperArm' + S, x, 0.69, 0, 0.0895, 0.004, 0.0935, T.stitch, NO); // shoulder seam
      P.c('forearm' + S, x, 0.4185, 0, 0.088, 0.009, 0.092, T.blazerDark, NO); // sleeve hem
      for (const y of [0.432, 0.446]) P.c('forearm' + S, s * 0.2385, y, -0.018, 0.004, 0.009, 0.009, T.horn, NO);
      P.c('forearm' + S, s * 0.2375, 0.403, 0.012, 0.004, 0.01, 0.01, T.gold, NO); // cufflink on the black cuff
    } else {
      P.c('upperArm' + S, x, 0.69, 0, 0.0895, 0.003, 0.0935, T.silkFold, NO);
      P.c('forearm' + S, x, 0.505, 0, 0.0875, 0.003, 0.0915, T.silkFold, NO);
      if (!(o.watch && s > 0)) P.c('forearm' + S, s * 0.2375, 0.404, 0.016, 0.004, 0.009, 0.009, T.pearl, NO);
    }
    for (const fz of [-0.018, 0.004, 0.026]) P.c('hand' + S, s * 0.2335, 0.33, fz, 0.003, 0.03, 0.003, T.skinLine, NO);
  }
  if (o.watch) {
    // gold link bracelet rows, framed cream dial with two hands, crown
    for (const y of [0.4145, 0.4235]) P.c('forearmL', 0.195, y, 0, 0.0936, 0.002, 0.0976, T.goldDeep, NO);
    P.c('forearmL', 0.2435, 0.419, 0, 0.005, 0.03, 0.036, T.gold, NO);
    P.c('forearmL', 0.2465, 0.419, 0, 0.002, 0.022, 0.028, '#FFF6E3', NO);
    P.c('forearmL', 0.248, 0.4225, 0, 0.0015, 0.008, 0.0025, T.hole, NO);
    P.c('forearmL', 0.248, 0.419, 0.003, 0.0015, 0.0025, 0.007, T.hole, NO);
    P.c('forearmL', 0.2435, 0.419, 0.0195, 0.004, 0.006, 0.004, T.gold, NO);
  }
  // ----- trousers: pressed crease, side seams, slant pockets, fly; shoes: cap, strap, heel, welt
  for (const s of [-1, 1]) P.c('hips', s * 0.109, 0.4, 0.085, 0.0035, 0.071, 0.003, T.creaseShade, { rz: s * 0.565, outline: false });
  P.abs('hips', 0.005, 0.37, 0.083, 0.0085, 0.444, 0.0848, T.seam, NO);
  for (const s of [1, -1]) {
    const S = s > 0 ? 'L' : 'R';
    const x = 0.075 * s;
    for (const [bone, y0, y1, z] of [['thigh' + S, 0.222, 0.422, 0.0675], ['shin' + S, 0.14, 0.222, 0.0675], ['shin' + S, 0.066, 0.14, 0.076]]) {
      P.abs(bone, x - 0.0025, y0, z - 0.001, x + 0.0025, y1, z + 0.003, T.crease, NO);
      P.abs(bone, x + s * 0.0025, y0, z - 0.001, x + s * 0.0055, y1, z + 0.002, T.creaseShade, NO);
    }
    P.absS(s, 'thigh' + S, 0.1385, 0.222, -0.0015, 0.1415, 0.422, 0.0015, T.seam, NO);
    P.absS(s, 'shin' + S, 0.1385, 0.14, -0.0015, 0.1415, 0.222, 0.0015, T.seam, NO);
    P.absS(s, 'shin' + S, 0.1445, 0.066, -0.0015, 0.1475, 0.14, 0.0015, T.seam, NO);
    P.c('shin' + S, x, 0.062, 0.002, 0.142, 0.008, 0.15, T.creaseShade, NO); // hem fold
    P.c('foot' + S, x, 0.0155, 0.033, 0.1035, 0.003, 0.1705, T.welt, NO);
    P.c('foot' + S, x, 0.0388, 0.0995, 0.101, 0.0495, 0.0355, T.toe, NO);
    P.c('foot' + S, x, 0.045, 0.045, 0.101, 0.0375, 0.016, T.strap, NO);
    P.c('foot' + S, x + s * 0.0512, 0.045, 0.045, 0.004, 0.014, 0.012, T.gold, NO);
    P.c('foot' + S, x, 0.02, -0.035, 0.1, 0.012, 0.0325, T.heel, NO);
  }
}

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const _bm = new THREE.Matrix4();
const _bq = new THREE.Quaternion();
const _be = new THREE.Euler();
const _bv = new THREE.Vector3();
const _bs = new THREE.Vector3();

/** Merge parts into one skinned geometry (rigid: each box 100% on its bone). */
function buildGeometry(parts, outlineOnly) {
  const byBone = new Map();
  for (const p of parts) {
    if (outlineOnly && !p.outline) continue;
    let vb = byBone.get(p.bone);
    if (!vb) byBone.set(p.bone, (vb = new VoxelBuilder()));
    if (!p.rx && !p.rz) vb.box(p.x, p.y, p.z, p.w, p.h, p.d, p.color, p.ry);
    else {
      _be.set(p.rx, p.ry, p.rz);
      _bm.compose(_bv.set(p.x, p.y, p.z), _bq.setFromEuler(_be), _bs.set(p.w, p.h, p.d));
      vb.add(UNIT_BOX, p.color, _bm);
    }
  }
  const geos = [];
  for (const [bone, vb] of byBone) {
    const g = vb.geometry();
    const n = g.attributes.position.count;
    const bi = BONE_INDEX[bone];
    const si = new Uint16Array(n * 4);
    const sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      si[i * 4] = bi;
      sw[i * 4] = 1;
    }
    if (outlineOnly) {
      g.deleteAttribute('color');
      g.deleteAttribute('normal');
    }
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    geos.push(g);
  }
  let merged = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  if (outlineOnly) {
    const m = mergeVertices(merged, 1e-4);
    merged.dispose();
    merged = m;
    merged.computeVertexNormals();
  }
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}

/** Rigid glasses (own mesh on the glasses bone, so the frame gets a finer outline than the body). */
function buildGlasses(px) {
  const v = new VoxelBuilder();
  const { t, dep, a, b, c } = GL;
  const oz = GL.z - BIND.glasses[2]; // relative to the glasses bone pivot
  const add = (x, y, w, h, d, rz = 0, zz = oz) => {
    if (!rz) v.box(x, y, zz, w, h, d, C.glasses);
    else {
      _be.set(0, 0, rz);
      _bm.compose(_bv.set(x, y, zz), _bq.setFromEuler(_be), _bs.set(w, h, d));
      v.add(UNIT_BOX, C.glasses, _bm);
    }
  };
  for (const cx of [-GL.cx, GL.cx]) {
    const hw = 2 * (a - c) + 0.002;
    const hh = 2 * (b - c) + 0.002;
    add(cx, b + t / 2, hw, t, dep);
    add(cx, -b - t / 2, hw, t, dep);
    add(cx - a - t / 2, 0, t, hh, dep);
    add(cx + a + t / 2, 0, t, hh, dep);
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const mx = cx + sx * (a - c / 2) + sx * Math.SQRT1_2 * t * 0.5;
        const my = sy * (b - c / 2) + sy * Math.SQRT1_2 * t * 0.5;
        add(mx, my, c * Math.SQRT2 + t * 0.9, t, dep, -sx * sy * Math.PI / 4);
      }
    }
  }
  add(0, 0.012, 2 * (GL.cx - a - t) + 0.006, 0.008, dep); // bridge
  for (const sx of [-1, 1]) add(sx * 0.181, 0.03, 0.062, 0.008, 0.008, 0, oz - 0.004); // temples
  const mesh = v.mesh({ outline: true, px });
  mesh.name = 'MayaGlasses';
  return mesh;
}

// Shared per outfit (ref-counted): { body, outline, refs }
const GEO_CACHE = new Map();
function acquireGeometry(outfit) {
  let e = GEO_CACHE.get(outfit);
  if (!e) {
    const parts = buildParts(outfit);
    e = { body: buildGeometry(parts, false), outline: buildGeometry(parts, true), refs: 0 };
    GEO_CACHE.set(outfit, e);
  }
  e.refs++;
  return e;
}
function releaseGeometry(outfit) {
  const e = GEO_CACHE.get(outfit);
  if (!e) return;
  if (--e.refs <= 0) {
    e.body.dispose();
    e.outline.dispose();
    GEO_CACHE.delete(outfit);
  }
}

/** Outline hull for skinned meshes: like toon.js outlines, but pushes along the SKINNED normal. */
const OUTLINE_MATS = new Map();
function skinnedOutlineMaterial(px) {
  let e = OUTLINE_MATS.get(px);
  if (e) {
    e.refs++;
    return e.mat;
  }
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.outline), side: THREE.BackSide, toneMapped: false });
  const uniforms = { uOutlinePx: { value: px }, uResolution: { value: new THREE.Vector2(1024, 1024) } };
  mat.userData.outlineUniforms = uniforms;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uOutlinePx = uniforms.uOutlinePx;
    shader.uniforms.uResolution = uniforms.uResolution;
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'uniform float uOutlinePx;\nuniform vec2 uResolution;\nvoid main() {')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        {
          #ifdef USE_SKINNING
            vec3 oN = objectNormal;
          #else
            vec3 oN = normal;
          #endif
          vec3 vN = normalize( normalMatrix * oN );
          vec2 dir = ( projectionMatrix * vec4( vN, 0.0 ) ).xy;
          float len = length( dir );
          if ( len > 1e-5 ) gl_Position.xy += ( dir / len ) * uOutlinePx * gl_Position.w * 2.0 / uResolution;
        }`,
      );
  };
  mat.customProgramCacheKey = () => 'maya-skinned-outline';
  OUTLINE_MATS.set(px, { mat, refs: 1 });
  return mat;
}
function releaseOutlineMaterial(px) {
  const e = OUTLINE_MATS.get(px);
  if (!e) return;
  if (--e.refs <= 0) {
    e.mat.dispose();
    OUTLINE_MATS.delete(px);
  }
}

// ---------------------------------------------------------------------------------------------
// Face: canvas expression atlas (eyes band + mouth band), drawn in code
// ---------------------------------------------------------------------------------------------
const ATLAS_W = 1024;
const ATLAS_H = 1136;
const EYE_W = 256;
const EYE_H = 144;
const MOUTH_H = 64;
const MOUTH_Y0 = 6 * EYE_H + 8; // eye cells: 4 x 6, then an 8 px gutter, then mouth cells: 4 x 4
// Face plane on the head front (head-local metres): eyes band and mouth band share one texel density.
const FACE_X = 0.17;
const FACE_Z = 0.2215;
const PXM = EYE_W / (2 * FACE_X); // 752.9 px per metre
const EYE_TOP = 0.305;
const EYE_BAND = [EYE_TOP - EYE_H / PXM, EYE_TOP];
const MOUTH_BAND = [EYE_BAND[0] - MOUTH_H / PXM, EYE_BAND[0]];

const EYE_CELLS = ['open', 'happy', 'laugh', 'star', 'heart', 'wink', 'kiss', 'surprised', 'think', 'focus', 'shy', 'dizzy', 'sleepy', 'lookL', 'lookR', 'blinkOpen', 'blinkSurprised', 'blinkThink', 'blinkFocus', 'blinkShy', 'blinkSleepy', 'blinkHappy'];
const MOUTH_CELLS = ['smile', 'openSmile', 'laugh', 'grinTongue', 'pucker', 'o', 'hmm', 'focus', 'wavy', 'wavyBig', 'yawn', 'talkA', 'talkB', 'talkO', 'talkE', 'grin'];

const FACE_DEFS = {
  smile: { eyes: 'open', mouth: 'smile', blink: 'blinkOpen' },
  happy: { eyes: 'happy', mouth: 'openSmile' },
  laugh: { eyes: 'laugh', mouth: 'laugh' },
  star: { eyes: 'star', mouth: 'openSmile' },
  heart: { eyes: 'heart', mouth: 'grin' },
  wink: { eyes: 'wink', mouth: 'grinTongue' },
  kiss: { eyes: 'kiss', mouth: 'pucker' },
  surprised: { eyes: 'surprised', mouth: 'o', blink: 'blinkSurprised' },
  think: { eyes: 'think', mouth: 'hmm', blink: 'blinkThink' },
  focus: { eyes: 'focus', mouth: 'focus', blink: 'blinkFocus' },
  shy: { eyes: 'shy', mouth: 'wavy', blink: 'blinkShy' },
  dizzy: { eyes: 'dizzy', mouth: 'wavyBig' },
  sleepy: { eyes: 'sleepy', mouth: 'yawn', blink: 'blinkSleepy' },
  talk: { eyes: 'open', mouth: 'talkB', blink: 'blinkOpen', talking: true },
};

const INK = '#2B1B12';
const BROW_C = '#3A2418';
const SCLERA = '#FFFDF8';
const IRIS = '#4E2D1C';
const IRIS_L = '#A06A3C';
const PUPIL = '#1B0F09';
const MOUTH_FILL = '#7C2530';
const MOUTH_LINE = '#4E1A20';
const TONGUE = '#EE8C88';
const LINE_MOUTH = '#5A2229';

function cellXY(kind, name) {
  if (kind === 'eye') {
    const i = EYE_CELLS.indexOf(name);
    return [(i % 4) * EYE_W, Math.floor(i / 4) * EYE_H];
  }
  const i = MOUTH_CELLS.indexOf(name);
  return [(i % 4) * EYE_W, MOUTH_Y0 + Math.floor(i / 4) * MOUTH_H];
}

function brow(g, cx, cy, ang, arch, len = 40, thick = 8) {
  g.save();
  g.translate(cx, cy);
  g.rotate(ang);
  g.beginPath();
  g.moveTo(-len / 2, arch * 0.4);
  g.quadraticCurveTo(0, -arch * 1.6, len / 2, arch * 0.4);
  g.lineWidth = thick;
  g.lineCap = 'round';
  g.strokeStyle = BROW_C;
  g.stroke();
  g.restore();
}
// Brow sets: per side [y, tilt (outer end down), arch]; viewer-left first. Brows sit above the frames.
const BROWS = {
  neutral: [[28, 0.07, 4], [28, 0.07, 4]],
  raised: [[21, 0.06, 6], [21, 0.06, 6]],
  high: [[13, 0.02, 8], [13, 0.02, 8]],
  think: [[31, -0.1, 2], [18, 0.12, 8]],
  focus: [[29, -0.3, 1], [29, -0.3, 1]],
  worried: [[24, 0.3, 2], [24, 0.3, 2]],
  low: [[33, 0.16, 3], [33, 0.16, 3]],
  laugh: [[19, 0.24, 4], [19, 0.24, 4]],
  wink: [[21, 0.04, 7], [31, -0.06, 3]],
  dizzy: [[25, 0.32, 3], [28, -0.2, 3]],
};
const EX = [64, 192];
const EY = 83;
function brows(g, set) {
  const b = BROWS[set];
  brow(g, EX[0] + 2, b[0][0], -b[0][1], b[0][2]);
  brow(g, EX[1] - 2, b[1][0], b[1][1], b[1][2]);
}
function blush(g, alpha, hatch) {
  if (alpha <= 0) return;
  g.fillStyle = `rgba(240,128,118,${alpha})`;
  for (const x of [38, 218]) {
    g.beginPath();
    g.ellipse(x, 133, 18, 8, 0, 0, TAU);
    g.fill();
  }
  if (hatch) {
    g.strokeStyle = '#D9605A';
    g.lineWidth = 2.5;
    g.lineCap = 'round';
    for (const x of [38, 218]) {
      for (let i = -1; i <= 1; i++) {
        g.beginPath();
        g.moveTo(x + i * 8 - 3, 138);
        g.lineTo(x + i * 8 + 3, 128);
        g.stroke();
      }
    }
  }
}
function eyeOpen(g, cx, cy, side, o = {}) {
  const w = o.w ?? 48;
  const h = o.h ?? 58;
  const r = Math.min(19, w / 2, h / 2);
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  const iw = o.iw ?? 36;
  const ih = o.ih ?? 44;
  const ix = cx + (o.dx ?? 0);
  const iy = cy + (o.dy ?? 5);
  const lid = o.lid ?? 0;
  const tilt = o.lidTilt ?? 0;
  const ly = y0 + h * lid;
  const yl = side < 0 ? ly - tilt : ly + tilt; // left end of the lid line
  const yr = side < 0 ? ly + tilt : ly - tilt;
  g.save();
  roundRect(g, x0, y0, w, h, r);
  g.fillStyle = SCLERA;
  g.fill();
  roundRect(g, x0, y0, w, h, r);
  g.clip();
  const ir = Math.min(iw * 0.45, ih / 2);
  roundRect(g, ix - iw / 2, iy - ih / 2, iw, ih, ir);
  g.fillStyle = IRIS;
  g.fill();
  g.save();
  roundRect(g, ix - iw / 2, iy - ih / 2, iw, ih, ir);
  g.clip();
  g.beginPath();
  g.ellipse(ix, iy + ih * 0.48, iw * 0.56, ih * 0.36, 0, 0, TAU);
  g.fillStyle = IRIS_L;
  g.fill();
  g.restore();
  const pw = iw * 0.46;
  const ph = ih * 0.5;
  roundRect(g, ix - pw / 2, iy - ph / 2 - 1, pw, ph, pw * 0.45);
  g.fillStyle = PUPIL;
  g.fill();
  g.fillStyle = '#FFFFFF';
  const hs = iw * 0.36;
  roundRect(g, ix - iw * 0.38, iy - ih * 0.38, hs, hs, hs * 0.35);
  g.fill();
  g.beginPath();
  g.arc(ix + iw * 0.22, iy + ih * 0.22, iw * 0.09, 0, TAU);
  g.fill();
  if (lid > 0) {
    g.fillStyle = PALETTE.skin;
    g.beginPath();
    g.moveTo(x0 - 6, y0 - 6);
    g.lineTo(x0 + w + 6, y0 - 6);
    g.lineTo(x0 + w + 6, yr);
    g.lineTo(x0 - 6, yl);
    g.closePath();
    g.fill();
  }
  g.restore();
  // thin outline around the eye (only below the lid)
  g.save();
  if (lid > 0) {
    g.beginPath();
    g.moveTo(x0 - 8, yl);
    g.lineTo(x0 + w + 8, yr);
    g.lineTo(x0 + w + 8, y0 + h + 8);
    g.lineTo(x0 - 8, y0 + h + 8);
    g.closePath();
    g.clip();
  }
  roundRect(g, x0, y0, w, h, r);
  g.lineWidth = 2.5;
  g.strokeStyle = INK;
  g.stroke();
  g.restore();
  // upper lash line
  g.strokeStyle = INK;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  if (lid > 0) {
    g.moveTo(x0 - 1, yl);
    g.lineTo(x0 + w + 1, yr);
  } else {
    g.moveTo(x0 + 1, y0 + r * 0.95);
    g.quadraticCurveTo(x0 + 1, y0 + 1, x0 + r, y0 + 1);
    g.lineTo(x0 + w - r, y0 + 1);
    g.quadraticCurveTo(x0 + w - 1, y0 + 1, x0 + w - 1, y0 + r * 0.95);
  }
  g.lineWidth = 6;
  g.stroke();
  const ox = side < 0 ? x0 : x0 + w;
  const oy = side < 0 ? yl : yr;
  g.beginPath();
  g.moveTo(ox - side * 3, oy + (lid > 0 ? 3 : 8));
  g.lineTo(ox + side * 7, oy - 3);
  g.lineWidth = 5;
  g.stroke();
}
function eyeArcUp(g, cx, cy, side) {
  g.strokeStyle = INK;
  g.lineCap = 'round';
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(cx - 20, cy + 9);
  g.quadraticCurveTo(cx, cy - 22, cx + 20, cy + 9);
  g.stroke();
  g.lineWidth = 4.5;
  g.beginPath();
  const ox = cx + side * 19;
  g.moveTo(ox, cy + 6);
  g.lineTo(ox + side * 7, cy + 1);
  g.stroke();
}
function eyeClosed(g, cx, cy, side) {
  g.strokeStyle = INK;
  g.lineCap = 'round';
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(cx - 21, cy + 2);
  g.quadraticCurveTo(cx, cy + 16, cx + 21, cy + 2);
  g.stroke();
  g.lineWidth = 4.5;
  const ox = cx + side * 21;
  g.beginPath();
  g.moveTo(ox, cy + 2);
  g.lineTo(ox + side * 7, cy - 4);
  g.stroke();
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cx + side * 12, cy + 9);
  g.lineTo(cx + side * 15, cy + 15);
  g.moveTo(cx + side * 3, cy + 11);
  g.lineTo(cx + side * 4, cy + 17);
  g.stroke();
}
function eyeSqueeze(g, cx, cy, side) {
  const d = -side; // viewer-left eye draws '>' (points to the nose), viewer-right '<'
  g.strokeStyle = INK;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(cx - d * 15, cy - 15);
  g.lineTo(cx + d * 13, cy);
  g.lineTo(cx - d * 15, cy + 15);
  g.stroke();
}
function star4(g, cx, cy, rx, ry, k = 0.2) {
  const ix = rx * k;
  const iy = ry * k;
  g.beginPath();
  g.moveTo(cx, cy - ry);
  g.quadraticCurveTo(cx + ix, cy - iy, cx + rx, cy);
  g.quadraticCurveTo(cx + ix, cy + iy, cx, cy + ry);
  g.quadraticCurveTo(cx - ix, cy + iy, cx - rx, cy);
  g.quadraticCurveTo(cx - ix, cy - iy, cx, cy - ry);
  g.closePath();
}
function eyeStar(g, cx, cy) {
  star4(g, cx, cy + 2, 27, 33, 0.18);
  g.fillStyle = '#F6C445';
  g.fill();
  g.lineWidth = 3.5;
  g.lineJoin = 'round';
  g.strokeStyle = '#9C6A1C';
  g.stroke();
  star4(g, cx - 6, cy - 6, 7, 9, 0.2);
  g.fillStyle = '#FFFFFF';
  g.fill();
  star4(g, cx + 22, cy - 24, 5, 6, 0.2);
  g.fillStyle = '#E8B23A';
  g.fill();
}
function heartPath(g, cx, cy, s) {
  g.beginPath();
  g.moveTo(cx, cy + s * 0.95);
  g.bezierCurveTo(cx - s * 1.35, cy + s * 0.05, cx - s * 0.95, cy - s * 1.1, cx, cy - s * 0.42);
  g.bezierCurveTo(cx + s * 0.95, cy - s * 1.1, cx + s * 1.35, cy + s * 0.05, cx, cy + s * 0.95);
  g.closePath();
}
function eyeHeart(g, cx, cy) {
  heartPath(g, cx, cy + 4, 25);
  g.fillStyle = '#E8436A';
  g.fill();
  g.lineWidth = 3.5;
  g.lineJoin = 'round';
  g.strokeStyle = '#7A1A2C';
  g.stroke();
  g.fillStyle = '#FFFFFF';
  g.beginPath();
  g.ellipse(cx - 11, cy - 6, 6, 4.5, -0.6, 0, TAU);
  g.fill();
}
function eyeSpiral(g, cx, cy, side) {
  g.strokeStyle = INK;
  g.lineWidth = 4.5;
  g.lineCap = 'round';
  g.beginPath();
  for (let a = 0; a <= 5.6 * Math.PI; a += 0.15) {
    const rr = 2 + a * 1.05;
    const x = cx + Math.cos(a * side) * rr;
    const y = cy + 3 + Math.sin(a * side) * rr;
    if (a === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
}
function bothEyes(g, fn, o) {
  fn(g, EX[0], EY, -1, o);
  fn(g, EX[1], EY, 1, o);
}

const EYE_PAINTERS = {
  open: (g) => { brows(g, 'neutral'); bothEyes(g, eyeOpen); blush(g, 0.32); },
  happy: (g) => { brows(g, 'raised'); bothEyes(g, eyeArcUp); blush(g, 0.6); },
  laugh: (g) => {
    brows(g, 'laugh');
    bothEyes(g, eyeSqueeze);
    blush(g, 0.7);
    g.fillStyle = '#BFE3F5';
    for (const [x, s] of [[EX[0] - 26, -1], [EX[1] + 26, 1]]) {
      g.beginPath();
      g.moveTo(x, EY - 2);
      g.quadraticCurveTo(x + s * 7, EY + 10, x, EY + 13);
      g.quadraticCurveTo(x - s * 7, EY + 10, x, EY - 2);
      g.fill();
    }
  },
  star: (g) => { brows(g, 'raised'); eyeStar(g, EX[0], EY); eyeStar(g, EX[1], EY); blush(g, 0.5); },
  heart: (g) => { brows(g, 'raised'); eyeHeart(g, EX[0], EY); eyeHeart(g, EX[1], EY); blush(g, 0.65); },
  wink: (g) => { brows(g, 'wink'); eyeOpen(g, EX[0], EY, -1); eyeArcUp(g, EX[1], EY, 1); blush(g, 0.5); },
  kiss: (g) => { brows(g, 'raised'); bothEyes(g, eyeClosed); blush(g, 0.7); },
  surprised: (g) => { brows(g, 'high'); bothEyes(g, eyeOpen, { w: 54, h: 64, iw: 24, ih: 30, dy: 1 }); },
  think: (g) => { brows(g, 'think'); bothEyes(g, eyeOpen, { dx: 7, dy: -9 }); blush(g, 0.22); },
  focus: (g) => { brows(g, 'focus'); bothEyes(g, eyeOpen, { lid: 0.34, lidTilt: 4, dy: 7 }); blush(g, 0.2); },
  shy: (g) => { brows(g, 'worried'); bothEyes(g, eyeOpen, { dx: -6, dy: 10, lid: 0.12 }); blush(g, 0.85, true); },
  dizzy: (g) => { brows(g, 'dizzy'); bothEyes(g, eyeSpiral); blush(g, 0.35); },
  sleepy: (g) => { brows(g, 'low'); bothEyes(g, eyeOpen, { lid: 0.56, dy: 10 }); blush(g, 0.3); },
  lookL: (g) => { brows(g, 'neutral'); bothEyes(g, eyeOpen, { dx: -9, dy: 4 }); blush(g, 0.32); },
  lookR: (g) => { brows(g, 'neutral'); bothEyes(g, eyeOpen, { dx: 9, dy: 4 }); blush(g, 0.32); },
  blinkOpen: (g) => { brows(g, 'neutral'); bothEyes(g, eyeClosed); blush(g, 0.32); },
  blinkSurprised: (g) => { brows(g, 'high'); bothEyes(g, eyeClosed); },
  blinkThink: (g) => { brows(g, 'think'); bothEyes(g, eyeClosed); blush(g, 0.22); },
  blinkFocus: (g) => { brows(g, 'focus'); bothEyes(g, eyeClosed); blush(g, 0.2); },
  blinkShy: (g) => { brows(g, 'worried'); bothEyes(g, eyeClosed); blush(g, 0.85, true); },
  blinkSleepy: (g) => { brows(g, 'low'); bothEyes(g, eyeClosed); blush(g, 0.3); },
  blinkHappy: (g) => { brows(g, 'raised'); bothEyes(g, eyeClosed); blush(g, 0.6); },
};

function mouthD(g, x0, x1, y0, y1, tongue = true) {
  const cx = (x0 + x1) / 2;
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y0);
  g.bezierCurveTo(x1, y0 + (y1 - y0) * 0.75, cx + (x1 - cx) * 0.55, y1, cx, y1);
  g.bezierCurveTo(cx - (cx - x0) * 0.55, y1, x0, y0 + (y1 - y0) * 0.75, x0, y0);
  g.closePath();
  g.fillStyle = MOUTH_FILL;
  g.fill();
  if (tongue) {
    g.save();
    g.clip();
    g.beginPath();
    g.ellipse(cx, y1 - 1, (x1 - x0) * 0.33, (y1 - y0) * 0.38, 0, 0, TAU);
    g.fillStyle = TONGUE;
    g.fill();
    g.restore();
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y0);
    g.bezierCurveTo(x1, y0 + (y1 - y0) * 0.75, cx + (x1 - cx) * 0.55, y1, cx, y1);
    g.bezierCurveTo(cx - (cx - x0) * 0.55, y1, x0, y0 + (y1 - y0) * 0.75, x0, y0);
    g.closePath();
  }
  g.lineWidth = 3;
  g.lineJoin = 'round';
  g.strokeStyle = MOUTH_LINE;
  g.stroke();
}
function mouthO(g, cx, cy, rx, ry) {
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  g.fillStyle = MOUTH_FILL;
  g.fill();
  g.save();
  g.clip();
  g.beginPath();
  g.ellipse(cx, cy + ry * 0.75, rx * 0.75, ry * 0.45, 0, 0, TAU);
  g.fillStyle = TONGUE;
  g.fill();
  g.restore();
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  g.lineWidth = 3;
  g.strokeStyle = MOUTH_LINE;
  g.stroke();
}
function mouthLine(g, pts, width = 5) {
  g.strokeStyle = LINE_MOUTH;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  if (pts.length === 6) g.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
  else g.lineTo(pts[2], pts[3]);
  g.stroke();
}
function mouthWave(g, x0, x1, cy, amp, periods, width) {
  g.strokeStyle = LINE_MOUTH;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  for (let x = x0; x <= x1; x += 1) {
    const y = cy + amp * Math.sin(((x - x0) / (x1 - x0)) * periods * TAU);
    if (x === x0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
}
function tongueBlob(g, cx, cy, rx, ry) {
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  g.fillStyle = TONGUE;
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = MOUTH_LINE;
  g.stroke();
  g.beginPath();
  g.moveTo(cx, cy - ry * 0.2);
  g.lineTo(cx, cy + ry * 0.6);
  g.stroke();
}
// Mouth painters draw around (128, 24); the atlas scales them 1.22x into their 64 px cell (centre y = 14).
const MOUTH_PAINTERS = {
  smile: (g) => mouthLine(g, [109, 18, 128, 36, 147, 18], 5.5),
  openSmile: (g) => mouthD(g, 109, 147, 15, 41),
  laugh: (g) => mouthD(g, 103, 153, 13, 48),
  grinTongue: (g) => { tongueBlob(g, 137, 30, 7, 7); mouthLine(g, [107, 18, 128, 34, 149, 18]); },
  pucker: (g) => {
    g.strokeStyle = '#8A2A3A';
    g.lineWidth = 5;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(123, 12);
    g.quadraticCurveTo(141, 14, 129, 23);
    g.quadraticCurveTo(141, 32, 123, 35);
    g.stroke();
  },
  o: (g) => mouthO(g, 128, 25, 9, 12),
  hmm: (g) => mouthLine(g, [119, 26, 131, 21, 143, 24]),
  focus: (g) => { tongueBlob(g, 142, 28, 6, 5); mouthLine(g, [115, 24, 140, 23]); },
  wavy: (g) => mouthWave(g, 113, 143, 24, 3, 2, 4.5),
  wavyBig: (g) => mouthWave(g, 106, 150, 25, 5, 2.5, 5),
  yawn: (g) => mouthO(g, 128, 26, 7, 10),
  talkA: (g) => mouthD(g, 116, 140, 18, 31, false),
  talkB: (g) => mouthD(g, 112, 144, 16, 38),
  talkO: (g) => mouthO(g, 128, 25, 9, 10),
  talkE: (g) => {
    roundRect(g, 110, 19, 36, 10, 5);
    g.fillStyle = MOUTH_FILL;
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = MOUTH_LINE;
    g.stroke();
  },
  grin: (g) => mouthD(g, 108, 148, 16, 34),
};

let SHARED = null; // { canvas, texture, material, refs }
function acquireAtlas() {
  if (SHARED) {
    SHARED.refs++;
    return SHARED;
  }
  const cv = document.createElement('canvas');
  cv.width = ATLAS_W;
  cv.height = ATLAS_H;
  const g = cv.getContext('2d');
  g.fillStyle = PALETTE.skin;
  g.fillRect(0, 0, ATLAS_W, ATLAS_H);
  for (const name of EYE_CELLS) {
    const [x, y] = cellXY('eye', name);
    g.save();
    g.beginPath();
    g.rect(x, y, EYE_W, EYE_H);
    g.clip();
    g.translate(x, y);
    EYE_PAINTERS[name](g);
    g.restore();
  }
  for (const name of MOUTH_CELLS) {
    const [x, y] = cellXY('mouth', name);
    g.save();
    g.beginPath();
    g.rect(x, y, EYE_W, MOUTH_H);
    g.clip();
    // painters draw around (128, 24); scale up a little so mouths read at phone sizes
    g.translate(x + 128, y + 14);
    g.scale(1.22, 1.22);
    g.translate(-128, -24);
    MOUTH_PAINTERS[name](g);
    g.restore();
  }
  const texture = new THREE.CanvasTexture(cv);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = toon('#ffffff', { map: texture });
  SHARED = { canvas: cv, texture, material, refs: 1, portraits: new Map() };
  return SHARED;
}
function releaseAtlas() {
  if (!SHARED) return;
  if (--SHARED.refs <= 0) {
    SHARED.texture.dispose();
    SHARED.material.dispose();
    SHARED = null;
  }
}

function setQuadUV(uv, offset, x, y, w, h) {
  const e = 0.5; // half-texel inset
  const u0 = (x + e) / ATLAS_W;
  const u1 = (x + w - e) / ATLAS_W;
  const v0 = 1 - (y + h - e) / ATLAS_H;
  const v1 = 1 - (y + e) / ATLAS_H;
  const a = uv.array;
  const i = offset * 2;
  a[i] = u0; a[i + 1] = v0; // bottom-left
  a[i + 2] = u1; a[i + 3] = v0; // bottom-right
  a[i + 4] = u1; a[i + 5] = v1; // top-right
  a[i + 6] = u0; a[i + 7] = v1; // top-left
}

function buildFaceGeometry() {
  const g = new THREE.BufferGeometry(); // head-bone local: y = 0 is the chin, +Z the face
  const pos = new Float32Array([
    -FACE_X, EYE_BAND[0], FACE_Z, FACE_X, EYE_BAND[0], FACE_Z, FACE_X, EYE_BAND[1], FACE_Z, -FACE_X, EYE_BAND[1], FACE_Z,
    -FACE_X, MOUTH_BAND[0], FACE_Z, FACE_X, MOUTH_BAND[0], FACE_Z, FACE_X, MOUTH_BAND[1], FACE_Z, -FACE_X, MOUTH_BAND[1], FACE_Z,
  ]);
  const nrm = new Float32Array(24);
  for (let i = 0; i < 8; i++) nrm[i * 3 + 2] = 1;
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(16), 2));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  g.computeBoundingSphere();
  return g;
}

// ----- 2D portrait for the UI dialogue box (front orthographic projection of the head) -----
function drawPortrait(atlasCanvas, faceName, outfitName) {
  const def = FACE_DEFS[faceName] || FACE_DEFS.smile;
  const eyeKey = def.eyes;
  const mouthKey = def.talking ? 'talkB' : def.mouth;
  const o = OUTFITS[outfitName] || OUTFITS.writer;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const S = 128 / 0.64;
  const PX = (x) => 64 + x * S;
  const PY = (y) => (0.462 - y) * S;
  const OUT = PALETTE.outline;
  const layer = (rects) => {
    g.lineJoin = 'round';
    g.lineWidth = 3.4;
    g.strokeStyle = OUT;
    for (const r of rects) g.strokeRect(PX(r[0]), PY(r[3]), (r[2] - r[0]) * S, (r[3] - r[1]) * S);
    for (const r of rects) {
      g.fillStyle = r[4];
      g.fillRect(PX(r[0]), PY(r[3]), (r[2] - r[0]) * S, (r[3] - r[1]) * S);
    }
  };
  const hairRect = (h, col) => [h[1], h[2], h[4], h[5], col];
  // back hair
  layer(HAIR.filter((h) => h[0].startsWith('hairBack') || (h[0] === 'head' && h[6] < 0)).map((h) => hairRect(h, C.hair)));
  // shoulders and outfit (head-local: shoulder top at -0.03)
  const top = -0.02;
  const torso = [];
  const sl = o.sleeve;
  torso.push([0.152, -0.3, 0.24, top - 0.008, sl], [-0.24, -0.3, -0.152, top - 0.008, sl]);
  torso.push([-0.157, -0.3, 0.157, top, o.jacket || o.top]);
  layer(torso);
  if (o.jacket) {
    layer([
      [-0.034, -0.3, 0.034, -0.15, o.top], [-0.054, -0.16, 0.054, -0.075, o.top], [-0.074, -0.085, 0.074, top, o.top],
    ]);
    g.fillStyle = o.lapel;
    for (const s of [1, -1]) {
      const r1 = s > 0 ? [0.052, -0.16, 0.086, -0.09] : [-0.086, -0.16, -0.052, -0.09];
      const r2 = s > 0 ? [0.072, -0.09, 0.118, top] : [-0.118, -0.09, -0.072, top];
      for (const r of [r1, r2]) g.fillRect(PX(r[0]), PY(r[3]), (r[2] - r[0]) * S, (r[3] - r[1]) * S);
    }
  }
  layer([[-0.045, -0.05, 0.045, 0.02, C.skin]]);
  if (o.scarf) {
    layer([[-0.096, -0.067, 0.096, -0.01, o.scarf]]);
    layer([[-0.03, -0.24, 0.02, -0.11, o.scarf], [0.023, -0.215, 0.069, -0.105, o.scarfShade], [-0.088, -0.092, -0.016, -0.05, o.scarf], [0.05, -0.095, 0.118, -0.052, o.scarfShade], [-0.016, -0.113, 0.05, -0.051, o.scarf]]);
    g.fillStyle = '#FFF1D6';
    for (const [x, y] of [[0.015, -0.075], [-0.06, -0.037], [-0.008, -0.145], [0.05, -0.145]]) g.fillRect(PX(x) - 1.5, PY(y) - 1.5, 3, 3);
    g.fillStyle = PALETTE.maroon;
    for (const [x, y] of [[0.035, -0.097], [-0.085, -0.055], [0.004, -0.2]]) g.fillRect(PX(x) - 1.5, PY(y) - 1.5, 3, 3);
  }
  // head
  layer([[-0.21, 0, 0.21, 0.42, C.skin]]);
  // face from the atlas
  const [ex, ey] = cellXY('eye', eyeKey);
  const [mx, my] = cellXY('mouth', mouthKey);
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(atlasCanvas, ex, ey, EYE_W, EYE_H, PX(-FACE_X), PY(EYE_BAND[1]), FACE_X * 2 * S, (EYE_BAND[1] - EYE_BAND[0]) * S);
  g.drawImage(atlasCanvas, mx, my, EYE_W, MOUTH_H, PX(-FACE_X), PY(MOUTH_BAND[1]), FACE_X * 2 * S, (MOUTH_BAND[1] - MOUTH_BAND[0]) * S);
  // front hair
  layer(HAIR.filter((h) => !(h[0].startsWith('hairBack') || (h[0] === 'head' && h[6] < 0))).map((h) => hairRect(h, C.hair)));
  g.fillStyle = C.shine;
  for (const h of HAIR_SHINE) {
    if (h[6] < 0.2) continue;
    g.fillRect(PX(h[1]), PY(h[5]), (h[4] - h[1]) * S, Math.max(1.2, (h[5] - h[2]) * S));
  }
  // glasses
  const { a, b, c, t, cy } = GL;
  for (const cx of [-GL.cx, GL.cx]) {
    const A = a + t / 2;
    const B = b + t / 2;
    const Cc = c + t * 0.2;
    const pts = [[cx - A + Cc, cy + B], [cx + A - Cc, cy + B], [cx + A, cy + B - Cc], [cx + A, cy - B + Cc], [cx + A - Cc, cy - B], [cx - A + Cc, cy - B], [cx - A, cy - B + Cc], [cx - A, cy + B - Cc]];
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(PX(p[0]), PY(p[1])) : g.moveTo(PX(p[0]), PY(p[1]))));
    g.closePath();
    g.lineJoin = 'round';
    g.lineWidth = 4.2;
    g.strokeStyle = OUT;
    g.stroke();
    g.lineWidth = 2.2;
    g.strokeStyle = C.glasses;
    g.stroke();
  }
  g.beginPath();
  g.moveTo(PX(-GL.cx + a + t), PY(cy + 0.012));
  g.lineTo(PX(GL.cx - a - t), PY(cy + 0.012));
  g.lineWidth = 2;
  g.strokeStyle = C.glasses;
  g.stroke();
  return cv;
}

// ---------------------------------------------------------------------------------------------
// Emotes: key poses per channel (NaN = the live base pose), eases, faces and cues
// ---------------------------------------------------------------------------------------------
const EASE = {
  l: (s) => s,
  io: (s) => (s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2),
  i: (s) => s * s * s,
  o: (s) => 1 - Math.pow(1 - s, 3),
  s: (s) => 0.5 - 0.5 * Math.cos(Math.PI * s),
  b: (s) => {
    const c1 = 2.0;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(s - 1, 3) + c1 * Math.pow(s - 1, 2);
  },
  q: (s) => s * s, // gravity fall
  qo: (s) => 1 - (1 - s) * (1 - s), // rise
};

// Reusable sub-poses
const HIP_HAND_L = { 'upperArmL.y': -1.25, 'upperArmL.z': 0.6, 'upperArmL.x': 0.12, 'elbowL.x': -1.75, 'handL.x': 0.15 };
const HIP_HAND_R = { 'upperArmR.y': 1.25, 'upperArmR.z': -0.6, 'upperArmR.x': 0.12, 'elbowR.x': -1.75, 'handR.x': 0.15 };
// Seated: thighs forward, shins angled to the pedals so the soles rest ~0.16 m below the seat top.
const SEAT_KNEE = 0.95;
const SEAT_FOOT = 0.57;
const SEATED = {
  'hips.py': SEAT_DROP, 'hips.x': -0.06, 'thighL.x': -1.52, 'thighR.x': -1.52, 'thighL.z': 0.07, 'thighR.z': -0.07,
  'kneeL.x': SEAT_KNEE, 'kneeR.x': SEAT_KNEE, 'footL.x': SEAT_FOOT, 'footR.x': SEAT_FOOT,
};
const STANDING_LEGS = {
  'hips.py': 0, 'hips.x': 0, 'thighL.x': 0, 'thighR.x': 0, 'thighL.z': 0.015, 'thighR.z': -0.015,
  'kneeL.x': 0.05, 'kneeR.x': 0.05, 'footL.x': 0, 'footR.x': 0,
};
const ARMS_UP = { 'upperArmL.z': 2.6, 'upperArmR.z': -2.6, 'upperArmL.x': 0.15, 'upperArmR.x': 0.15, 'elbowL.z': 0.3, 'elbowR.z': -0.3, 'elbowL.x': -0.1, 'elbowR.x': -0.1 };

const EMOTE_DEFS = {
  wave: {
    dur: 1.5, face: [[0, 'happy'], [1.28, 'smile']], cues: [[0.4, 'wave']],
    keys: [
      [0.16, 'io', { 'upperArmR.z': 0.12, 'elbowR.x': -0.35, 'chest.z': 0.03, '+head.x': 0.06, 'hips.py': -0.012 }],
      [0.42, 'b', { 'upperArmR.z': -2.5, 'upperArmR.x': 0.2, 'elbowR.z': -0.55, 'elbowR.x': -0.12, 'handR.x': 0.1, 'chest.z': -0.07, 'head.z': 0.15, '+head.x': -0.04, 'hips.py': 0, 'upperArmL.z': 0.18, 'hips.px': 0.012 }],
      [1.14, 'l', { 'upperArmR.z': -2.5, 'upperArmR.x': 0.2, 'elbowR.z': -0.55, 'elbowR.x': -0.12, 'handR.x': 0.1, 'chest.z': -0.07, 'head.z': 0.15, '+head.x': -0.04, 'upperArmL.z': 0.18, 'hips.px': 0.012 }],
    ],
    extra(u, P) {
      const e = win(u, 0.36, 1.2, 0.1);
      const w = Math.sin((u - 0.36) * TAU * 3.2);
      P[Z.elbowR] += 0.42 * w * e;
      P[Z.handR] += 0.32 * Math.sin((u - 0.36) * TAU * 3.2 - 0.9) * e;
      P[Z.chest] += 0.02 * w * e;
      P[CH['hips.py']] += 0.008 * Math.abs(w) * e;
    },
  },
  cheer: {
    dur: 1.6, face: [[0, 'happy'], [0.3, 'star'], [1.4, 'happy']], cues: [[0.3, 'jump'], [0.52, 'sparkle'], [0.8, 'land']],
    keys: [
      [0.22, 'io', { 'legs.crouch': 0.075, 'body.sy': 0.87, 'chest.x': 0.24, 'head.x': 0.1, 'upperArmL.x': 0.6, 'upperArmR.x': 0.6, 'upperArmL.z': 0.25, 'upperArmR.z': -0.25, 'elbowL.x': -0.25, 'elbowR.x': -0.25 }],
      [0.34, 'qo', { 'legs.crouch': 0, 'body.sy': 1.12, 'body.y': 0.2, 'chest.x': -0.1, 'head.x': -0.16, ...ARMS_UP, 'thighL.x': -0.15, 'kneeL.x': 0.35, 'thighR.x': -0.1, 'kneeR.x': 0.3 }],
      [0.52, 'qo', { 'body.sy': 1.0, 'body.y': 0.36, 'chest.x': -0.14, 'head.x': -0.2, ...ARMS_UP, 'upperArmL.z': 2.75, 'upperArmR.z': -2.75, 'thighL.x': -0.55, 'kneeL.x': 1.25, 'footL.x': 0.35, 'thighR.x': -0.2, 'kneeR.x': 0.85, 'footR.x': 0.3 }],
      [0.8, 'q', { 'body.y': 0, 'body.sy': 1.04, 'chest.x': -0.05, 'head.x': -0.1, ...ARMS_UP, 'upperArmL.z': 2.5, 'upperArmR.z': -2.5, 'thighL.x': 0, 'kneeL.x': 0.08, 'footL.x': 0, 'thighR.x': 0, 'kneeR.x': 0.08, 'footR.x': 0 }],
      [0.9, 'o', { 'body.sy': 0.87, 'legs.crouch': 0.065, 'chest.x': 0.12, 'head.x': 0.06, ...ARMS_UP, 'upperArmL.z': 2.3, 'upperArmR.z': -2.3 }],
      [1.08, 'b', { 'body.sy': 1.03, 'legs.crouch': 0, 'chest.x': -0.04, 'head.x': -0.08, ...ARMS_UP, 'upperArmL.z': 2.55, 'upperArmR.z': -2.55 }],
      [1.3, 'io', { 'body.sy': 1.0, 'upperArmL.z': 2.4, 'upperArmR.z': -2.4, 'elbowL.z': 0.4, 'elbowR.z': -0.4 }],
    ],
    extra(u, P) {
      const e = win(u, 1.0, 1.42, 0.08);
      P[Z.elbowL] += 0.3 * Math.sin(u * TAU * 4.2) * e;
      P[Z.elbowR] -= 0.3 * Math.sin(u * TAU * 4.2) * e;
    },
  },
  jump: {
    dur: 1.15, face: [[0, 'happy'], [0.32, 'laugh'], [0.86, 'happy']], cues: [[0.28, 'jump'], [0.7, 'land']],
    keys: [
      [0.18, 'io', { 'legs.crouch': 0.065, 'body.sy': 0.88, 'chest.x': 0.2, 'head.x': 0.08, 'upperArmL.x': 0.65, 'upperArmR.x': 0.65, 'elbowL.x': -0.3, 'elbowR.x': -0.3 }],
      [0.3, 'qo', { 'legs.crouch': 0, 'body.sy': 1.13, 'body.y': 0.16, 'chest.x': -0.06, 'head.x': -0.08, 'upperArmL.x': -1.7, 'upperArmR.x': -1.7, 'upperArmL.z': 0.35, 'upperArmR.z': -0.35, 'elbowL.x': -0.2, 'elbowR.x': -0.2 }],
      [0.46, 'qo', { 'body.sy': 1.0, 'body.y': 0.32, 'chest.x': -0.12, 'head.x': -0.16, 'upperArmL.x': -2.6, 'upperArmR.x': -2.6, 'upperArmL.z': 0.45, 'upperArmR.z': -0.45, 'thighL.x': 0.12, 'kneeL.x': 1.5, 'footL.x': 0.45, 'thighR.x': 0.18, 'kneeR.x': 1.45, 'footR.x': 0.45 }],
      [0.7, 'q', { 'body.y': 0, 'body.sy': 1.04, 'chest.x': 0, 'head.x': -0.06, 'upperArmL.x': -1.1, 'upperArmR.x': -1.1, 'upperArmL.z': 0.5, 'upperArmR.z': -0.5, 'thighL.x': 0, 'kneeL.x': 0.06, 'footL.x': 0, 'thighR.x': 0, 'kneeR.x': 0.06, 'footR.x': 0 }],
      [0.8, 'o', { 'body.sy': 0.88, 'legs.crouch': 0.055, 'chest.x': 0.12, 'upperArmL.x': -0.4, 'upperArmR.x': -0.4, 'upperArmL.z': 0.35, 'upperArmR.z': -0.35 }],
      [0.96, 'b', { 'body.sy': 1.02, 'legs.crouch': 0, 'chest.x': -0.02 }],
    ],
  },
  point: {
    dur: 1.3, face: [[0, 'focus'], [0.3, 'wink'], [1.08, 'smile']], cues: [[0.32, 'point']],
    keys: [
      [0.14, 'io', { 'upperArmR.x': 0.32, 'upperArmR.z': -0.12, 'elbowR.x': -0.55, 'chest.y': 0.1, 'head.x': 0.05, 'hips.py': -0.01 }],
      [0.32, 'b', { 'upperArmR.x': -1.55, 'upperArmR.z': -0.5, 'elbowR.x': -0.06, 'handR.x': -0.12, 'prop.finger': 1, 'chest.y': -0.16, 'chest.x': 0.06, 'head.y': -0.18, 'head.x': -0.07, 'hips.py': 0, 'hips.px': -0.012, ...HIP_HAND_L }],
      [1.0, 'l', { 'upperArmR.x': -1.5, 'upperArmR.z': -0.5, 'elbowR.x': -0.1, 'handR.x': -0.12, 'prop.finger': 1, 'chest.y': -0.14, 'chest.x': 0.05, 'head.y': -0.15, 'head.x': -0.05, 'hips.px': -0.012, ...HIP_HAND_L }],
      [1.14, 'i', { 'prop.finger': 0 }],
    ],
    extra(u, P) {
      const e = win(u, 0.4, 1.0, 0.1);
      P[X.upperArmR] += 0.05 * Math.sin((u - 0.4) * TAU * 2.4) * e;
    },
  },
  think: {
    dur: 1.7, face: [[0, 'think'], [1.16, 'happy']], cues: [[1.14, 'idea']],
    poleR: [-0.4, -1, 0.3],
    keys: [
      [0.3, 'b', { 'ikR.x': -0.065, 'ikR.y': 0.315, 'ikR.z': 0.2, 'ikR.w': 1, 'handR.x': 0.35, 'head.x': -0.12, 'head.z': -0.12, 'head.y': 0.12, 'neck.x': -0.04, 'chest.z': -0.04, 'upperArmL.x': -0.42, 'upperArmL.z': -0.12, 'upperArmL.y': -0.75, 'elbowL.x': -1.5, 'hips.px': 0.012, 'hips.z': 0.03 }],
      [1.0, 'l', { 'ikR.x': -0.065, 'ikR.y': 0.315, 'ikR.z': 0.2, 'ikR.w': 1, 'handR.x': 0.35, 'head.x': -0.14, 'head.z': -0.16, 'head.y': 0.16, 'neck.x': -0.04, 'chest.z': -0.05, 'upperArmL.x': -0.42, 'upperArmL.z': -0.12, 'upperArmL.y': -0.75, 'elbowL.x': -1.5, 'hips.px': 0.012, 'hips.z': 0.03 }],
      [1.16, 'b', { 'ikR.x': -0.22, 'ikR.y': 0.57, 'ikR.z': 0.1, 'ikR.w': 1, 'handR.x': 0, 'prop.finger': 1, 'head.x': -0.2, 'head.z': 0.06, 'head.y': 0, 'neck.x': -0.04, 'chest.z': 0.03, 'chest.x': -0.05, 'upperArmL.x': 0.1, 'upperArmL.z': 0.3, 'upperArmL.y': 0, 'elbowL.x': -0.4, 'hips.px': 0, 'hips.z': 0, 'hips.py': 0.012, 'footL.x': 0.2, 'footR.x': 0.2 }],
      [1.45, 'l', { 'ikR.w': 1, 'prop.finger': 1, 'head.x': -0.16, 'head.z': 0.05, 'chest.x': -0.04, 'upperArmL.z': 0.25, 'hips.py': 0.006 }],
      [1.58, 'i', { 'prop.finger': 0 }],
    ],
    extra(u, P) {
      const e = win(u, 0.4, 0.98, 0.1);
      P[CH['ikR.y']] += 0.01 * Math.sin((u - 0.4) * TAU * 3) * e;
      P[X.head] += 0.015 * Math.sin((u - 0.4) * TAU * 3 + 0.8) * e;
    },
  },
  kiss: {
    dur: 1.4, face: [[0, 'kiss'], [0.78, 'heart']], cues: [[0.64, 'kiss']],
    poleR: [-0.5, -1, -0.2],
    keys: [
      [0.26, 'io', { 'ikR.x': -0.07, 'ikR.y': 0.35, 'ikR.z': 0.24, 'ikR.w': 1, 'handR.x': 0.3, 'head.x': 0.14, 'head.z': 0.1, 'chest.x': 0.04, 'thighL.x': 0.22, 'kneeL.x': 1.05, 'footL.x': 0.4, 'hips.px': -0.012 }],
      [0.48, 'l', { 'ikR.x': -0.07, 'ikR.y': 0.35, 'ikR.z': 0.25, 'ikR.w': 1, 'handR.x': 0.3, 'head.x': 0.16, 'head.z': 0.12, 'chest.x': -0.04, 'thighL.x': 0.25, 'kneeL.x': 1.15, 'footL.x': 0.45, 'hips.px': -0.012 }],
      [0.66, 'o', { 'ikR.x': -0.34, 'ikR.y': 0.48, 'ikR.z': 0.5, 'ikR.w': 1, 'handR.x': -0.4, 'head.x': -0.05, 'head.z': 0.04, 'chest.x': 0.12, 'thighL.x': 0.2, 'kneeL.x': 0.9, 'footL.x': 0.35, 'hips.px': -0.012 }],
      [0.98, 'l', { 'ikR.x': -0.34, 'ikR.y': 0.48, 'ikR.z': 0.5, 'ikR.w': 1, 'handR.x': -0.4, 'head.x': -0.04, 'head.z': 0.06, 'chest.x': 0.1, 'thighL.x': 0.2, 'kneeL.x': 0.9, 'footL.x': 0.35, 'hips.px': -0.012 }],
    ],
  },
  hugBook: {
    // she holds her book to her chest by its sides, cover out (like her launch-day photos), and
    // rocks happily: her hands never cross the cover, so the real artwork stays in view
    dur: 2.3, face: [[0, 'smile'], [0.4, 'heart'], [2.0, 'happy']], cues: [[0.2, 'book'], [0.5, 'hug']],
    poleL: [1, -0.6, -0.4], poleR: [-1, -0.6, -0.4],
    keys: [
      [0.2, 'b', { 'prop.book': 1.2, 'ikL.x': 0.1, 'ikL.y': 0.14, 'ikL.z': 0.15, 'ikR.x': -0.1, 'ikR.y': 0.14, 'ikR.z': 0.15, 'ikL.w': 0.6, 'ikR.w': 0.6, 'head.x': 0.1 }],
      [0.32, 'io', { 'prop.book': 1.12, 'ikL.w': 1, 'ikR.w': 1, 'handL.z': -0.3, 'handR.z': 0.3 }],
      [0.55, 'b', { 'prop.book': 1.12, 'ikL.x': 0.09, 'ikL.y': 0.13, 'ikL.z': 0.19, 'ikR.x': -0.09, 'ikR.y': 0.11, 'ikR.z': 0.19, 'ikL.w': 1, 'ikR.w': 1, 'body.sy': 0.96, 'shoulderL.py': 0.012, 'shoulderR.py': 0.012, 'head.x': 0.05, 'chest.x': 0.03 }],
      [0.7, 'io', { 'body.sy': 1.0 }],
      [1.85, 'l', { 'prop.book': 1.12, 'ikL.x': 0.09, 'ikL.y': 0.13, 'ikL.z': 0.19, 'ikR.x': -0.09, 'ikR.y': 0.11, 'ikR.z': 0.19, 'ikL.w': 1, 'ikR.w': 1, 'shoulderL.py': 0.012, 'shoulderR.py': 0.012, 'head.x': 0.04, 'chest.x': 0.02 }],
      [2.05, 'io', { 'prop.book': 1.1, 'ikL.x': 0.1, 'ikL.y': 0.14, 'ikL.z': 0.16, 'ikR.x': -0.1, 'ikR.y': 0.14, 'ikR.z': 0.16, 'ikL.w': 0.8, 'ikR.w': 0.8 }],
      [2.18, 'i', { 'prop.book': 0, 'ikL.w': 0.3, 'ikR.w': 0.3 }],
    ],
    extra(u, P) {
      const e = win(u, 0.5, 1.95, 0.15);
      const s = Math.sin((u - 0.5) * TAU * 1.3);
      P[Z.chest] += 0.08 * s * e;
      P[Z.head] += 0.12 * Math.sin((u - 0.5) * TAU * 1.3 - 0.6) * e;
      P[CH['hips.px']] -= 0.012 * s * e;
    },
  },
  phone: {
    // beat 1: a message arrives, she looks and taps; beat 2: "call me" with the phone at her ear
    dur: 1.8, face: [[0, 'surprised'], [0.34, 'smile'], [0.84, 'talk'], [1.56, 'wink']], cues: [[0.16, 'phone'], [0.84, 'call']],
    eyes: [[0.2, 'lookL'], [0.8, null]],
    poleR: [-0.45, -1, 0],
    keys: [
      [0.16, 'b', { 'prop.phone': 1.15, 'ikR.x': -0.17, 'ikR.y': 0.2, 'ikR.z': 0.2, 'ikR.w': 0.85, 'handR.x': -0.1, 'head.x': 0.04, 'head.y': -0.1 }],
      [0.3, 'io', { 'prop.phone': 1, 'ikR.x': -0.15, 'ikR.y': 0.25, 'ikR.z': 0.22, 'ikR.w': 1, 'handR.x': -0.15, 'head.x': 0.12, 'head.y': -0.22, 'head.z': 0.06, 'chest.z': 0.03, 'upperArmL.z': 0.35, 'elbowL.x': -0.9, 'elbowL.z': 0.3 }],
      [0.66, 'l', { 'prop.phone': 1, 'ikR.x': -0.15, 'ikR.y': 0.25, 'ikR.z': 0.22, 'ikR.w': 1, 'handR.x': -0.15, 'head.x': 0.12, 'head.y': -0.22, 'head.z': 0.06, 'chest.z': 0.03, 'upperArmL.z': 0.35, 'elbowL.x': -0.9, 'elbowL.z': 0.3 }],
      [0.84, 'b', { 'ikR.x': -0.29, 'ikR.y': 0.43, 'ikR.z': 0.07, 'ikR.w': 1, 'handR.x': 0, 'handR.z': 0.15, 'head.x': 0.02, 'head.y': 0, 'head.z': 0.17, 'chest.z': 0.03, 'upperArmL.x': -0.35, 'elbowL.x': -1.0, 'upperArmL.z': 0.12, 'elbowL.z': 0, 'hips.px': 0.01 }],
      [1.44, 'l', { 'prop.phone': 1, 'ikR.x': -0.29, 'ikR.y': 0.43, 'ikR.z': 0.07, 'ikR.w': 1, 'handR.z': 0.15, 'head.z': 0.17, 'head.x': 0.02, 'chest.z': 0.03, 'upperArmL.x': -0.35, 'elbowL.x': -1.0, 'upperArmL.z': 0.12, 'hips.px': 0.01 }],
      [1.6, 'io', { 'prop.phone': 0.9, 'ikR.x': -0.27, 'ikR.y': 0.18, 'ikR.z': 0.14, 'ikR.w': 0.6, 'head.z': 0.04 }],
      [1.7, 'i', { 'prop.phone': 0 }],
    ],
    extra(u, P) {
      const yay = win(u, 0.32, 0.7, 0.06);
      P[Z.elbowL] += 0.25 * Math.sin((u - 0.32) * TAU * 4) * yay;
      const e = win(u, 0.88, 1.46, 0.1);
      P[X.head] += 0.05 * Math.sin((u - 0.88) * TAU * 2.3) * e;
      P[X.elbowL] -= 0.45 * (0.5 + 0.5 * Math.sin((u - 0.88) * TAU * 1.6)) * e;
      P[Z.handL] += 0.25 * Math.sin((u - 0.88) * TAU * 3.2) * e;
      P[CH['hips.px']] += 0.008 * Math.sin((u - 0.88) * TAU * 0.9) * e;
    },
  },
  laugh: {
    dur: 1.5, face: [[0, 'laugh']], cues: [[0.2, 'laugh']],
    poleL: [1, -0.8, -0.2], poleR: [-1, -0.8, -0.2],
    keys: [
      [0.18, 'o', { 'chest.x': -0.15, 'head.x': -0.22, 'neck.x': -0.05, 'ikL.x': 0.075, 'ikL.y': 0.03, 'ikL.z': 0.13, 'ikR.x': -0.075, 'ikR.y': 0.03, 'ikR.z': 0.13, 'ikL.w': 1, 'ikR.w': 1, 'body.sy': 1.03 }],
      [0.46, 'io', { 'chest.x': 0.3, 'head.x': 0.12, 'neck.x': 0.04, 'ikL.w': 1, 'ikR.w': 1, 'legs.crouch': 0.025, 'body.sy': 0.97 }],
      [1.12, 'l', { 'chest.x': 0.22, 'head.x': 0.06, 'neck.x': 0.02, 'ikL.w': 1, 'ikR.w': 1, 'legs.crouch': 0.02, 'body.sy': 1.0 }],
    ],
    extra(u, P) {
      const e = win(u, 0.2, 1.3, 0.12);
      const s = Math.sin(u * TAU * 7.5);
      P[X.chest] += 0.04 * s * e;
      P[CH['shoulderL.py']] += 0.008 * Math.abs(s) * e;
      P[CH['shoulderR.py']] += 0.008 * Math.abs(s) * e;
      P[Z.head] += 0.06 * Math.sin(u * TAU * 3.7) * e;
    },
  },
  write: {
    dur: 1.8, face: [[0, 'focus'], [1.36, 'happy']], cues: [[0.2, 'write'], [1.34, 'done']],
    poleL: [1, -0.7, -0.3], poleR: [-1, -0.7, -0.3],
    keys: [
      [0.22, 'b', { 'prop.pad': 1.15, 'prop.pen': 1.15, 'ikL.x': 0.1, 'ikL.y': 0.05, 'ikL.z': 0.19, 'ikR.x': -0.07, 'ikR.y': 0.12, 'ikR.z': 0.19, 'ikL.w': 0.8, 'ikR.w': 0.8 }],
      [0.34, 'io', { 'prop.pad': 1, 'prop.pen': 1, 'ikL.w': 1, 'ikR.w': 1, 'handL.z': 0.3, 'handR.x': -0.5, 'head.x': 0.34, 'neck.x': 0.08, 'chest.x': 0.08 }],
      [1.26, 'l', { 'prop.pad': 1, 'prop.pen': 1, 'ikL.w': 1, 'ikR.w': 1, 'handL.z': 0.3, 'handR.x': -0.5, 'head.x': 0.34, 'neck.x': 0.08, 'chest.x': 0.08 }],
      [1.4, 'b', { 'ikR.x': -0.07, 'ikR.y': 0.2, 'ikR.z': 0.24, 'ikL.w': 1, 'ikR.w': 1, 'handR.x': -0.9, 'head.x': 0.04, 'neck.x': 0, 'chest.x': -0.02 }],
      [1.56, 'io', { 'prop.pad': 1.1, 'prop.pen': 1.1, 'ikL.w': 0.8, 'ikR.w': 0.8 }],
      [1.68, 'i', { 'prop.pad': 0, 'prop.pen': 0 }],
    ],
    extra(u, P) {
      const e = win(u, 0.36, 1.26, 0.08);
      const k = (u - 0.36) / 0.9;
      P[CH['ikR.x']] += (0.026 * Math.sin((u - 0.36) * TAU * 5.5) + 0.02 * Math.sin(k * TAU * 2.0)) * e;
      P[CH['ikR.y']] += (0.008 * Math.sin((u - 0.36) * TAU * 11) - 0.03 * k) * e;
      P[Y.head] += 0.04 * Math.sin((u - 0.36) * TAU * 1.1) * e;
    },
  },
  nod: {
    dur: 0.9, face: [[0, 'smile'], [0.18, 'happy'], [0.74, 'smile']],
    keys: [
      [0.1, 'o', { '+head.x': -0.08, '+neck.x': -0.02 }],
      [0.26, 'io', { '+head.x': 0.26, '+neck.x': 0.06, '+chest.x': 0.04 }],
      [0.42, 'io', { '+head.x': 0.02, '+neck.x': 0.0, '+chest.x': 0.01 }],
      [0.58, 'io', { '+head.x': 0.2, '+neck.x': 0.05, '+chest.x': 0.03 }],
    ],
  },
  thumbsUp: {
    dur: 1.3, face: [[0, 'smile'], [0.24, 'wink'], [1.12, 'smile']], cues: [[0.32, 'sparkle']],
    keys: [
      [0.12, 'io', { 'upperArmR.x': 0.28, 'elbowR.x': -0.65, 'chest.z': 0.03, 'hips.py': -0.01 }],
      [0.32, 'b', { 'upperArmR.x': -0.95, 'upperArmR.z': -0.22, 'elbowR.x': -0.72, 'handR.x': 0, 'prop.thumb': 1, 'chest.x': 0.06, 'chest.y': -0.12, 'head.z': 0.12, 'head.x': -0.03, 'hips.py': 0, 'hips.px': 0.012, ...HIP_HAND_L }],
      [0.98, 'l', { 'upperArmR.x': -0.95, 'upperArmR.z': -0.22, 'elbowR.x': -0.72, 'handR.x': 0, 'prop.thumb': 1, 'chest.x': 0.05, 'chest.y': -0.1, 'head.z': 0.12, 'head.x': -0.03, 'hips.px': 0.012, ...HIP_HAND_L }],
      [1.12, 'i', { 'prop.thumb': 0 }],
    ],
    extra(u, P) {
      const e = win(u, 0.42, 0.98, 0.08);
      P[X.upperArmR] += 0.1 * Math.sin((u - 0.42) * TAU * 3.3) * e;
      P[CH['hips.py']] += 0.006 * Math.abs(Math.sin((u - 0.42) * TAU * 3.3)) * e;
    },
  },
  bow: {
    dur: 1.5, face: [[0, 'smile'], [0.3, 'happy'], [1.22, 'smile']], cues: [[0.55, 'bow']],
    poleL: [1, -0.5, -0.6], poleR: [-1, -0.5, -0.6],
    keys: [
      [0.16, 'io', { 'chest.x': -0.05, 'head.x': -0.04, 'ikL.x': 0.035, 'ikL.y': -0.04, 'ikL.z': 0.15, 'ikR.x': -0.035, 'ikR.y': -0.04, 'ikR.z': 0.15, 'ikL.w': 1, 'ikR.w': 1 }],
      [0.56, 'io', { 'chest.x': 0.44, 'head.x': 0.16, 'neck.x': 0.05, 'ikL.w': 1, 'ikR.w': 1, 'legs.crouch': 0.012 }],
      [0.95, 'l', { 'chest.x': 0.42, 'head.x': 0.16, 'neck.x': 0.05, 'ikL.w': 1, 'ikR.w': 1, 'legs.crouch': 0.012 }],
      [1.24, 'b', { 'chest.x': -0.04, 'head.x': -0.06, 'neck.x': 0, 'ikL.w': 1, 'ikR.w': 1, 'legs.crouch': 0 }],
    ],
  },
  dance: {
    dur: 1.8, face: [[0, 'happy'], [0.9, 'star'], [1.62, 'happy']], cues: [[0.92, 'spin'], [1.5, 'sparkle']],
    keys: [
      [0.12, 'o', { 'upperArmL.z': 2.4, 'upperArmR.z': -0.55, 'elbowL.z': 0.5, 'elbowR.x': -0.6, 'hips.px': 0.03, 'hips.z': 0.08, 'chest.z': -0.1, 'head.z': -0.14 }],
      [0.37, 'io', { 'upperArmL.z': 0.55, 'upperArmR.z': -2.4, 'elbowR.z': -0.5, 'elbowL.x': -0.6, 'elbowL.z': 0, 'elbowR.x': 0, 'hips.px': -0.03, 'hips.z': -0.08, 'chest.z': 0.1, 'head.z': 0.14 }],
      [0.62, 'io', { 'upperArmL.z': 2.4, 'upperArmR.z': -0.55, 'elbowL.z': 0.5, 'elbowR.z': 0, 'elbowR.x': -0.6, 'elbowL.x': 0, 'hips.px': 0.03, 'hips.z': 0.08, 'chest.z': -0.1, 'head.z': -0.14 }],
      [0.86, 'io', { 'upperArmL.z': 1.3, 'upperArmR.z': -1.3, 'elbowL.z': 0.1, 'elbowR.z': -0.1, 'elbowL.x': 0, 'elbowR.x': 0, 'hips.px': 0, 'hips.z': 0, 'chest.z': 0, 'head.z': 0, 'legs.crouch': 0.05 }],
      [1.12, 'qo', { 'body.y': 0.1, 'legs.crouch': 0, 'upperArmL.z': 1.35, 'upperArmR.z': -1.35, 'thighL.x': -0.2, 'kneeL.x': 0.5 }],
      [1.36, 'q', { 'body.y': 0, 'legs.crouch': 0.04, 'upperArmL.z': 1.2, 'upperArmR.z': -1.2, 'thighL.x': 0, 'kneeL.x': 0.05 }],
      [1.5, 'b', { 'legs.crouch': 0, 'upperArmL.z': 0.9, 'upperArmL.x': -0.3, 'upperArmR.z': -2.55, 'elbowR.z': -0.3, 'head.z': -0.15, 'hips.px': 0.015, 'footL.x': 0.35, 'thighL.x': 0, 'kneeL.x': 0.1 }],
      [1.62, 'l', { 'upperArmL.z': 0.9, 'upperArmL.x': -0.3, 'upperArmR.z': -2.55, 'elbowR.z': -0.3, 'head.z': -0.15, 'hips.px': 0.015, 'footL.x': 0.35 }],
    ],
    extra(u, P) {
      const b = win(u, 0.0, 0.86, 0.06);
      P[CH['legs.crouch']] += 0.035 * Math.pow(Math.max(0, Math.cos(u * TAU * 4)), 2) * b;
      P[X.head] += 0.05 * Math.cos(u * TAU * 4) * b;
      if (u > 0.86 && u < 1.38) P[CH['body.ry']] += TAU * EASE.io((u - 0.86) / 0.52);
    },
  },
  hopOut: {
    dur: 1.0, fullBody: true, face: [[0, 'happy']], cues: [[0.2, 'jump'], [0.7, 'land']], mode: [[0.7, 'stand']],
    keys: [
      [0.18, 'io', { ...SEATED, 'chest.x': 0.32, 'head.x': 0.1, 'upperArmL.x': 0.35, 'upperArmR.x': 0.35, 'upperArmL.z': 0.3, 'upperArmR.z': -0.3, 'elbowL.x': -0.1, 'elbowR.x': -0.1, 'body.sy': 0.92, 'body.y': 0 }],
      [0.42, 'qo', { 'hips.py': -0.12, 'hips.x': 0, 'thighL.x': -0.6, 'thighR.x': -0.5, 'thighL.z': 0.05, 'thighR.z': -0.05, 'kneeL.x': 0.95, 'kneeR.x': 0.8, 'footL.x': 0.3, 'footR.x': 0.25, 'chest.x': -0.06, 'head.x': -0.1, 'upperArmL.x': 0, 'upperArmR.x': 0, 'upperArmL.z': 1.9, 'upperArmR.z': -1.9, 'elbowL.z': 0.4, 'elbowR.z': -0.4, 'elbowL.x': -0.1, 'elbowR.x': -0.1, 'body.sy': 1.08, 'body.y': 0.42 }],
      [0.7, 'q', { ...STANDING_LEGS, 'chest.x': 0.02, 'head.x': 0, 'upperArmL.z': 1.1, 'upperArmR.z': -1.1, 'elbowL.z': 0.2, 'elbowR.z': -0.2, 'body.sy': 1.02, 'body.y': 0 }],
      [0.8, 'o', { 'legs.crouch': 0.065, 'body.sy': 0.88, 'chest.x': 0.15, 'head.x': 0.06, 'upperArmL.z': 0.6, 'upperArmR.z': -0.6 }],
      [0.92, 'b', { 'legs.crouch': 0, 'body.sy': 1.02 }],
    ],
  },
  hopIn: {
    dur: 1.0, fullBody: true, face: [[0, 'happy']], cues: [[0.2, 'jump'], [0.72, 'land']], mode: [[0.7, 'drive']],
    keys: [
      [0.18, 'io', { 'legs.crouch': 0.07, 'body.sy': 0.88, 'chest.x': 0.2, 'head.x': 0.08, 'upperArmL.x': 0.5, 'upperArmR.x': 0.5, 'elbowL.x': -0.2, 'elbowR.x': -0.2, 'body.y': 0 }],
      [0.42, 'qo', { 'legs.crouch': 0, 'body.sy': 1.08, 'body.y': 0.45, 'hips.py': -0.16, 'thighL.x': -1.1, 'thighR.x': -1.15, 'kneeL.x': 1.55, 'kneeR.x': 1.5, 'footL.x': 0.3, 'footR.x': 0.3, 'chest.x': -0.08, 'head.x': -0.12, 'upperArmL.x': 0, 'upperArmR.x': 0, 'upperArmL.z': 2.2, 'upperArmR.z': -2.2, 'elbowL.z': 0.3, 'elbowR.z': -0.3, 'elbowL.x': -0.1, 'elbowR.x': -0.1 }],
      [0.7, 'q', { ...SEATED, 'body.sy': 1.0, 'body.y': 0, 'chest.x': 0.1, 'head.x': -0.02, 'upperArmL.x': -0.9, 'upperArmR.x': -0.9, 'upperArmL.z': 0.3, 'upperArmR.z': -0.3, 'elbowL.z': 0, 'elbowR.z': 0, 'elbowL.x': -0.6, 'elbowR.x': -0.6 }],
      [0.78, 'o', { 'body.sy': 0.9 }],
      [0.9, 'b', { 'body.sy': 1.02 }],
    ],
  },
  lookAround: {
    dur: 1.8, face: [[0, 'focus'], [1.46, 'smile']], eyes: [[0.08, 'lookR'], [0.62, null], [0.78, 'lookL'], [1.14, null]],
    poleL: [0.6, -0.4, -1], poleR: [-0.6, -0.4, -1],
    keys: [
      [0.16, 'io', { 'chest.x': 0.1, 'footL.x': 0.3, 'footR.x': 0.3, 'hips.py': 0.022, 'ikL.x': 0.06, 'ikL.y': -0.04, 'ikL.z': -0.13, 'ikR.x': -0.06, 'ikR.y': -0.04, 'ikR.z': -0.13, 'ikL.w': 1, 'ikR.w': 1, 'head.y': 0.05 }],
      [0.45, 'io', { 'head.y': 0.62, 'neck.y': 0.14, 'chest.y': 0.12, 'head.x': -0.06, 'head.z': -0.05 }],
      [0.74, 'l', { 'head.y': 0.62, 'neck.y': 0.14, 'chest.y': 0.12, 'head.x': -0.06, 'head.z': -0.05 }],
      [1.04, 'io', { 'head.y': -0.62, 'neck.y': -0.14, 'chest.y': -0.12, 'head.x': -0.06, 'head.z': 0.05 }],
      [1.3, 'l', { 'head.y': -0.62, 'neck.y': -0.14, 'chest.y': -0.12, 'head.x': -0.06, 'head.z': 0.05, 'chest.x': 0.1, 'footL.x': 0.3, 'footR.x': 0.3, 'hips.py': 0.022, 'ikL.w': 1, 'ikR.w': 1 }],
      [1.56, 'io', { 'head.y': 0, 'neck.y': 0, 'chest.y': 0, 'head.x': 0, 'head.z': 0, 'chest.x': 0.02, 'footL.x': 0, 'footR.x': 0, 'hips.py': 0 }],
    ],
  },
  // internal idle fidget: push the glasses back up the nose
  adjustGlasses: {
    dur: 1.1, internal: true, face: [[0, 'smile'], [0.42, 'blinkPush'], [0.62, 'smile']], cues: [[0.5, 'glasses']],
    poleR: [-0.3, -1, 0.1],
    keys: [
      [0.36, 'io', { 'ikR.x': -0.13, 'ikR.y': 0.36, 'ikR.z': 0.27, 'ikR.w': 1, 'handR.x': 0.5, 'head.x': 0.36, 'neck.x': 0.06 }],
      [0.5, 'o', { 'ikR.x': -0.13, 'ikR.y': 0.385, 'ikR.z': 0.27, 'ikR.w': 1, 'head.x': 0.3, 'glasses.py': 0 }],
      [0.66, 'l', { 'ikR.x': -0.13, 'ikR.y': 0.38, 'ikR.z': 0.26, 'ikR.w': 1, 'head.x': 0.28, 'neck.x': 0.05 }],
    ],
  },
};

for (const name in EMOTE_DEFS) compileEmote(EMOTE_DEFS[name], name);
function compileEmote(def, name) {
  def.name = name;
  const tracks = new Map();
  for (const [t, ease, vals] of def.keys) {
    for (const key in vals) {
      const add = key[0] === '+';
      const ch = CH[add ? key.slice(1) : key];
      if (ch === undefined) throw new Error(`maya: unknown channel "${key}" in emote ${name}`);
      let tr = tracks.get(key);
      if (!tr) {
        tr = { ch, add, sticky: STICKY.has(ch), leg: LEG_SET.has(ch), times: [0], vals: [NaN], eases: ['l'] };
        tracks.set(key, tr);
      }
      tr.times.push(t);
      tr.vals.push(vals[key]);
      tr.eases.push(ease);
    }
  }
  def.tracks = [];
  for (const tr of tracks.values()) {
    tr.times.push(def.dur);
    tr.vals.push(NaN);
    tr.eases.push('io');
    if (tr.sticky) {
      tr.vals[0] = tr.vals[1];
      tr.vals[tr.vals.length - 1] = tr.vals[tr.vals.length - 2];
    }
    tr.fns = tr.eases.map((e) => EASE[e] || EASE.io);
    def.tracks.push(tr);
  }
  def.face = def.face || [];
  def.cues = def.cues || [];
  def.eyes = def.eyes || [];
  def.mode = def.mode || [];
}

// ---------------------------------------------------------------------------------------------
// Two-bone arm IK (shoulder space). Writes upper-arm Euler (XZY) + elbow bend into `out`.
// ---------------------------------------------------------------------------------------------
const _ikD = new THREE.Vector3();
const _ikN = new THREE.Vector3();
const _ikU = new THREE.Vector3();
const _ikW = new THREE.Vector3();
const _ikX = new THREE.Vector3();
const _ikY = new THREE.Vector3();
const _ikM = new THREE.Matrix4();
const _ikQ = new THREE.Quaternion();
const _ikE = new THREE.Euler(0, 0, 0, ARM);
function solveArm(tx, ty, tz, pole, out) {
  let d = Math.sqrt(tx * tx + ty * ty + tz * tz);
  if (d < 1e-4) {
    ty = -1e-3;
    d = 1e-3;
  }
  _ikD.set(tx / d, ty / d, tz / d);
  d = clamp(d, Math.abs(ARM_L1 - ARM_L2) + 1e-3, (ARM_L1 + ARM_L2) * 0.999);
  const cosA = clamp((ARM_L1 * ARM_L1 + d * d - ARM_L2 * ARM_L2) / (2 * ARM_L1 * d), -1, 1);
  const A = Math.acos(cosA);
  const cosK = clamp((ARM_L1 * ARM_L1 + ARM_L2 * ARM_L2 - d * d) / (2 * ARM_L1 * ARM_L2), -1, 1);
  out.bend = Math.PI - Math.acos(cosK);
  _ikN.set(pole[0], pole[1], pole[2]);
  _ikN.addScaledVector(_ikD, -_ikN.dot(_ikD));
  if (_ikN.lengthSq() < 1e-8) _ikN.set(0, -_ikD.z, _ikD.y);
  _ikN.normalize();
  _ikU.copy(_ikD).multiplyScalar(cosA).addScaledVector(_ikN, Math.sin(A));
  _ikW.copy(_ikD).addScaledVector(_ikU, -_ikD.dot(_ikU));
  if (_ikW.lengthSq() < 1e-8) _ikW.copy(_ikN).negate();
  _ikW.normalize();
  _ikY.copy(_ikU).negate();
  _ikX.crossVectors(_ikY, _ikW);
  _ikM.makeBasis(_ikX, _ikY, _ikW);
  _ikQ.setFromRotationMatrix(_ikM);
  _ikE.setFromQuaternion(_ikQ, ARM);
  out.x = _ikE.x;
  out.y = _ikE.y;
  out.z = _ikE.z;
}

// Hair spring chains: bone, parent chain index (or -1), stiffness (Hz), damping ratio,
// side (+1 L / -1 R / 0 back), limits [xmin, xmax, zmin, zmax].
const HAIR_SPRINGS = [
  { bone: 'hairBack1', parent: -1, hz: 1.5, zeta: 0.3, side: 0, gain: 1, lim: [-0.12, 0.95, -0.45, 0.45] },
  { bone: 'hairBack2', parent: 0, hz: 2.1, zeta: 0.28, side: 0, gain: 0.55, follow: 0.45, lim: [-0.25, 0.7, -0.4, 0.4] },
  { bone: 'hairSideL1', parent: -1, hz: 2.0, zeta: 0.36, side: 1, gain: 0.7, lim: [-0.5, 0.3, -0.06, 0.5] },
  { bone: 'hairSideL2', parent: 2, hz: 2.7, zeta: 0.34, side: 1, gain: 0.45, follow: 0.4, lim: [-0.45, 0.35, -0.15, 0.45] },
  { bone: 'hairSideR1', parent: -1, hz: 2.0, zeta: 0.36, side: -1, gain: 0.7, lim: [-0.5, 0.3, -0.5, 0.06] },
  { bone: 'hairSideR2', parent: 4, hz: 2.7, zeta: 0.34, side: -1, gain: 0.45, follow: 0.4, lim: [-0.45, 0.35, -0.45, 0.15] },
  { bone: 'bangs', parent: -1, hz: 3.2, zeta: 0.35, side: 0, gain: 0.25, bangs: true, lim: [-0.22, 0.04, -0.06, 0.06] },
];

// Seeded PRNG so dev captures are deterministic.
function mulberry32(a) {
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TALK_FRAMES = ['talkA', 'talkB', 'talkO', 'talkE', 'talkA', 'smile'];
const ONE = new THREE.Vector3(1, 1, 1);
const _m1 = new THREE.Matrix4();
const _m2 = new THREE.Matrix4();
const _q1 = new THREE.Quaternion();
const _e1 = new THREE.Euler(0, 0, 0, 'YXZ');
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _ik = { x: 0, y: 0, z: 0, bend: 0 };
const POLE_L = [0.6, -0.55, -0.55];
const POLE_R = [-0.6, -0.55, -0.55];
const POLE_WHEEL_L = [0.9, -0.6, -0.2];
const POLE_WHEEL_R = [-0.9, -0.6, -0.2];
// Per-arm channel indices (precomputed so update() never builds strings).
const SIDES = [1, -1].map((s) => {
  const S = s > 0 ? 'L' : 'R';
  return {
    s, S, pole: s > 0 ? POLE_L : POLE_R, wheelPole: s > 0 ? POLE_WHEEL_L : POLE_WHEEL_R,
    sh: CH[`shoulder${S}.py`], ikx: CH[`ik${S}.x`], iky: CH[`ik${S}.y`], ikz: CH[`ik${S}.z`], ikw: CH[`ik${S}.w`],
    uaX: X[`upperArm${S}`], uaY: Y[`upperArm${S}`], uaZ: Z[`upperArm${S}`],
    elX: X[`elbow${S}`], elY: Y[`elbow${S}`], elZ: Z[`elbow${S}`],
    handX: X[`hand${S}`], handZ: Z[`hand${S}`],
  };
});
const I_HPX = CH['hips.px'];
const I_HPY = CH['hips.py'];
const I_HPZ = CH['hips.pz'];
const I_BY = CH['body.y'];
const I_BSY = CH['body.sy'];
const I_BRY = CH['body.ry'];
const I_BRZ = CH['body.rz'];
const I_CROUCH = CH['legs.crouch'];
const I_SHL = CH['shoulderL.py'];
const I_SHR = CH['shoulderR.py'];
const I_GLS = CH['glasses.py'];
const EYE_XY = {};
for (const n of EYE_CELLS) EYE_XY[n] = cellXY('eye', n);
const MOUTH_XY = {};
for (const n of MOUTH_CELLS) MOUTH_XY[n] = cellXY('mouth', n);

// ---------------------------------------------------------------------------------------------
// Maya
// ---------------------------------------------------------------------------------------------
class Maya {
  constructor(opts = {}) {
    this.opts = opts;
    this.onEvent = typeof opts.onEvent === 'function' ? opts.onEvent : null;
    this.rand = mulberry32(opts.seed ?? 7);
    this.outlinePx = opts.outlinePx ?? 2.0;
    this.autoBlink = opts.blink !== false;

    // ----- scene graph: root (game moves it) > body (jump/squash/spin) > skinned mesh + outline
    this.root = new THREE.Group();
    this.root.name = 'Maya';
    this.body = new THREE.Group();
    this.root.add(this.body);

    this.bones = {};
    this.boneList = [];
    for (const [name, parent, x, y, z, order] of BONE_DEFS) {
      const b = new THREE.Bone();
      b.name = name;
      b.position.set(x, y, z);
      b.rotation.order = order || 'XYZ';
      this.bones[name] = b;
      this.boneList.push(b);
      if (parent) this.bones[parent].add(b);
    }
    this.joint = JOINTS.map((j) => this.bones[j]);
    this.joints = this.bones;
    this.restPos = {};
    for (const [name, , x, y, z] of BONE_DEFS) this.restPos[name] = [x, y, z];

    this.outfit = OUTFITS[opts.outfit] ? opts.outfit : 'writer';
    const geo = acquireGeometry(this.outfit);
    this.material = toon('#ffffff', { vertexColors: true, skinned: true });
    this.mesh = new THREE.SkinnedMesh(geo.body, this.material);
    this.mesh.name = 'MayaBody';
    this.body.add(this.mesh);
    this.mesh.add(this.bones.hips);
    this.mesh.updateMatrixWorld(true);
    this.skeleton = new THREE.Skeleton(this.boneList);
    this.mesh.bind(this.skeleton);
    this.outlineMat = skinnedOutlineMaterial(this.outlinePx);
    this.outline = new THREE.SkinnedMesh(geo.outline, this.outlineMat);
    this.outline.name = 'MayaOutline';
    this.outline.userData.isOutline = true;
    this.outline.raycast = () => {};
    this.body.add(this.outline);
    this.outline.bind(this.skeleton, this.mesh.bindMatrix);
    this.addBookCover();
    const resolution = this.outlineMat.userData.outlineUniforms.uResolution.value;
    this.outline.onBeforeRender = (renderer) => renderer.getDrawingBufferSize(resolution);
    // generous fixed bounds (any pose, jumps included) so culling never pops her out
    const bounds = new THREE.Sphere(new THREE.Vector3(0, 0.62, 0), 1.45);
    this.mesh.boundingSphere = bounds;
    this.outline.boundingSphere = bounds.clone();

    // ----- face (expression atlas on the cube's front face)
    this.atlas = acquireAtlas();
    this.faceGeo = buildFaceGeometry();
    this.faceMesh = new THREE.Mesh(this.faceGeo, this.atlas.material);
    this.faceMesh.name = 'MayaFace';
    this.bones.head.add(this.faceMesh);
    // ----- glasses (rigid, on their own bone so they can glint and be pushed up the nose)
    this.glassesMesh = buildGlasses(opts.glassesOutlinePx ?? 1.25);
    this.bones.glasses.add(this.glassesMesh);

    // ----- blob shadow
    this.shadowEnabled = opts.shadow !== false;
    this.shadow = blobShadow(0.3, 0.26, 0.5);
    this.shadow.visible = this.shadowEnabled;
    this.root.add(this.shadow);

    // ----- animation state
    this.B = new Float32Array(NCH); // base pose
    this.S = new Float32Array(NCH); // stand/walk scratch
    this.D = new Float32Array(NCH); // drive scratch
    this.F = new Float32Array(NCH); // final pose
    this.cap = new Float32Array(NCH); // captured pose (for interrupting an emote)
    this.F.set(DEFAULTS);
    this.blendT = 0;
    this.blendDur = 0;
    this.time = 0;
    this.mode = 'stand';
    this.driveW = 0;
    this.driveTarget = 0;
    this.phase = 0;
    this.phaseU = 0;
    this.walkW = 0;
    this.walkAmp = 0;
    this.speed = 0;
    this.turn = 0;
    this.accel = 0;
    this.leanF = 0;
    this.leanT = 0;
    this.steer = 0;
    this.idleTime = 0;
    this.nextFidget = 9 + this.rand() * 6;
    this.cur = null; // running emote { def, u, resolve, fi, ci, ei, mi, blendIn }
    this.lookTarget = new THREE.Vector3();
    this.hasLook = false;
    this.lookYaw = 0;
    this.lookPitch = 0;
    this.lookW = 0;
    this.lookEye = null; // eyes lead big head turns
    this._cue = { emote: '', cue: '' }; // reused event payload
    // wheel (drive mode), in root space with the root at the seat point
    // wheel hub relative to the seat point (matches car.wheelGrip; tilt < 0 = rim top leans to the dash)
    this.wheel = new THREE.Vector3(0, 0.22, 0.35);
    this.wheelRadius = 0.1;
    this.wheelTilt = -0.5;
    this._wheelKey = new Float32Array([NaN, NaN, NaN, NaN, NaN]);
    this._reach = { lean: 0.2, slide: 0 };
    // hair springs
    this.hair = HAIR_SPRINGS.map((h) => ({ ...h, b: this.bones[h.bone], ax: 0, az: 0, vx: 0, vz: 0 }));
    this.headPrev = new THREE.Vector3();
    this.headVel = new THREE.Vector3();
    this.headAcc = new THREE.Vector3();
    this.yawPrev = 0;
    this.yawRate = 0;
    this.motionInit = false;
    // face state
    this.baseFace = FACE_DEFS[opts.face] ? opts.face : 'smile';
    this.tempFace = null;
    this.tempT = 0;
    this.emoteFace = null;
    this.eyeOverride = null;
    this.blinkT = 1.2 + this.rand() * 2.5;
    this.blinkLeft = 0;
    this.blinkDouble = false;
    this.talkT = 0;
    this.mouthFrame = 'smile';
    this.mouthT = 0;
    this.glintT = 3 + this.rand() * 3;
    this.glintU = -1;
    this._eyeCell = '';
    this._mouthCell = '';
    this.hopTiming = { takeoff: 0.2, land: 0.7, duration: 1.0 };

    this._applyFaceCells(true);
    this.update(0, null);
  }

  get face() {
    return this.emoteFace && FACE_DEFS[this.emoteFace] ? this.emoteFace : this.tempFace || this.baseFace;
  }
  get isEmoting() {
    return !!this.cur;
  }

  // ------------------------------------------------------------------ public API
  setMode(mode, instant = false) {
    if (mode !== 'stand' && mode !== 'walk' && mode !== 'drive') return;
    this.mode = mode;
    this.driveTarget = mode === 'drive' ? 1 : 0;
    if (instant) this.driveW = this.driveTarget;
  }

  /**
   * Her real "အမှန်မြင်ခြင်း / Reality Check" cover on the front of the book she hugs (unlit, so it
   * shows the artwork's true colours; kept to the cover's own proportions, never stretched).
   * It rides on the propBook bone, so it pops in and out with the book.
   */
  addBookCover() {
    const bone = this.bones.propBook;
    const rest = new THREE.Vector3();
    for (let b = bone; b && b.isBone; b = b.parent) rest.add(b.position); // bone's rest position (model space)
    const [aw, ah] = ART_SIZE.book;
    const h = 0.19, w = (h * aw) / ah; // the book's front face is 0.15 x 0.2 m
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = artMaterial(null);
    const cover = new THREE.Mesh(geo, mat);
    cover.name = 'bookCoverArt';
    cover.position.set(0.004 - rest.x, 0.58 - rest.y, 0.1705 - rest.z); // just in front of the front cover
    cover.visible = false;
    cover.castShadow = cover.receiveShadow = false;
    cover.raycast = () => {};
    cover.userData.shadow = 'none';
    bone.add(cover);
    this.bookCoverArt = cover;
    artTexture('book').then((tex) => {
      if (!tex || this.disposed) return;
      mat.map = tex;
      mat.needsUpdate = true;
      cover.visible = true;
    });
  }

  setOutfit(name) {
    if (!OUTFITS[name] || name === this.outfit) return;
    const e = acquireGeometry(name);
    releaseGeometry(this.outfit);
    this.outfit = name;
    this.mesh.geometry = e.body;
    this.outline.geometry = e.outline;
  }

  setFace(name, holdSeconds) {
    if (!FACE_DEFS[name]) return;
    this.emoteFace = null;
    if (holdSeconds > 0) {
      this.tempFace = name;
      this.tempT = holdSeconds;
    } else {
      this.baseFace = name;
      this.tempFace = null;
    }
    this._applyFaceCells();
  }

  talk(seconds) {
    this.talkT = Math.max(this.talkT, seconds || 0);
    if (seconds <= 0) this.talkT = 0;
  }

  emote(name) {
    const def = EMOTE_DEFS[name];
    if (!def) return Promise.resolve(false);
    if (this.cur) {
      // interrupting: cross-fade from the current pose so nothing pops
      this.cap.set(this.F);
      this._finishEmote();
      this.blendT = 0;
      this.blendDur = 0.16;
    }
    let resolve;
    const p = new Promise((r) => (resolve = r));
    this.cur = { def, u: 0, resolve, fi: 0, ci: 0, ei: 0, mi: 0 };
    this.idleTime = 0;
    return p;
  }

  stopEmote() {
    if (!this.cur) return;
    this.cap.set(this.F);
    this.blendT = 0;
    this.blendDur = 0.22;
    this._finishEmote();
  }

  /** Emote length in seconds (0 if unknown). */
  emoteDuration(name) {
    return EMOTE_DEFS[name]?.dur ?? 0;
  }

  lookAt(v) {
    if (v && v.isVector3) {
      this.lookTarget.copy(v);
      this.hasLook = true;
    } else this.hasLook = false;
  }

  getHeadTop(target = new THREE.Vector3()) {
    const h = this.bones.head;
    h.updateWorldMatrix(true, false);
    return target.set(0, 0.5, 0.01).applyMatrix4(h.matrixWorld);
  }

  faceCanvas(name) {
    const key = `${name}|${this.outfit}`;
    let src = this.atlas.portraits.get(key);
    if (!src) {
      src = drawPortrait(this.atlas.canvas, name, this.outfit);
      this.atlas.portraits.set(key, src);
    }
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    cv.getContext('2d').drawImage(src, 0, 0);
    return cv;
  }

  dispose() {
    if (this.cur) this._finishEmote();
    this.root.removeFromParent();
    this.skeleton.dispose();
    releaseGeometry(this.outfit);
    releaseOutlineMaterial(this.outlinePx);
    this.faceGeo.dispose();
    this.glassesMesh.traverse((m) => m.geometry?.dispose());
    this.shadow.geometry.dispose();
    if (this.bookCoverArt) { this.bookCoverArt.geometry.dispose(); this.bookCoverArt.material.dispose(); } // the artwork texture is shared
    releaseAtlas();
    this.disposed = true;
  }

  // ------------------------------------------------------------------ frame update
  update(dt, o) {
    if (this.disposed) return;
    dt = dt > 0 ? Math.min(dt, 0.1) : 0;
    this.time += dt;
    const speed = o?.speed ?? 0;
    const turn = o?.turn ?? 0;
    const accel = o?.accel ?? 0;
    this.speed = speed;
    this.turn = turn;
    this.accel = accel;

    // smoothed drivers
    this.driveW = damp(this.driveW, this.driveTarget, 9, dt);
    const onFoot = 1 - this.driveW;
    const sp = Math.abs(speed) * onFoot;
    this.walkW = damp(this.walkW, clamp(sp / 0.7, 0, 1), 8, dt);
    this.walkAmp = damp(this.walkAmp, clamp(sp / 2.2, 0.3, 1.3), 6, dt);
    // walk phase: one step per STRIDE metres; footfalls at phase pi/2 (left) and 3pi/2 (right)
    const dph = (dt * sp * Math.PI) / STRIDE;
    const stepBefore = Math.floor((this.phaseU - Math.PI / 2) / Math.PI);
    this.phaseU += dph;
    if (this.phaseU > 1e6) this.phaseU -= TAU * 1e5;
    this.phase = this.phaseU % TAU;
    const stepAfter = Math.floor((this.phaseU - Math.PI / 2) / Math.PI);
    if (this.onEvent && stepAfter > stepBefore && this.walkW > 0.4) this.onEvent('step', stepAfter % 2 === 0 ? 'L' : 'R');
    if (this.mode === 'drive') {
      this.leanF = damp(this.leanF, clamp(-accel * 0.025, -0.14, 0.14), 6, dt);
      this.leanT = damp(this.leanT, clamp(turn * Math.abs(speed) * 0.012, -0.16, 0.16), 5, dt);
    } else {
      this.leanF = damp(this.leanF, clamp(accel * 0.035, -0.12, 0.18), 6, dt);
      this.leanT = damp(this.leanT, clamp(-turn * sp * 0.06, -0.22, 0.22), 5, dt);
    }
    this.steer = damp(this.steer, clamp(turn, -1, 1) * 0.85, 7, dt);

    // ----- base pose
    const B = this.B;
    if (this.driveW < 0.999) this._standPose(this.S);
    if (this.driveW > 0.001) this._drivePose(this.D);
    if (this.driveW <= 0.001) B.set(this.S);
    else if (this.driveW >= 0.999) B.set(this.D);
    else {
      const w = this.driveW;
      for (let i = 0; i < NCH; i++) B[i] = this.S[i] + (this.D[i] - this.S[i]) * w;
    }

    // ----- emote layer
    const F = this.F;
    F.set(B);
    if (this.cur) this._evalEmote(dt);
    else this._idleFidget(dt);
    if (this.blendDur > 0) {
      this.blendT += dt;
      const k = smooth01(this.blendT / this.blendDur);
      if (k < 1) for (let i = 0; i < NCH; i++) F[i] = this.cap[i] + (F[i] - this.cap[i]) * k;
      else this.blendDur = 0;
    }

    // ----- secondary layers
    this._lookLayer(F, dt);
    this._talkLayer(F);

    // ----- solve and apply
    this._solveIKChannels(F);
    this._applyPose(F);
    this._updateHair(dt);
    this._updateFace(dt);
    this._updateGlint(dt);

    // shadow follows the ground under her; fades in the car
    if (this.shadowEnabled) {
      const air = F[CH['body.y']];
      const s = 1 / (1 + Math.max(0, air) * 2.2);
      this.shadow.scale.set(0.6 * s, 0.52 * s, 1);
      this.shadow.visible = this.driveW < 0.5;
    }
  }

  // ------------------------------------------------------------------ base poses
  _standPose(S) {
    S.set(DEFAULTS);
    const t = this.time;
    const w = this.walkW;
    const idle = 1 - w;
    const An = this.walkAmp;
    const A = 0.55 * An;
    const ph = this.phase;
    const s1 = Math.sin(ph);
    const c1 = Math.cos(ph);
    const c2 = Math.cos(2 * ph);
    const br = Math.sin(t * 1.85);
    const ws = Math.sin(t * 1.08);
    const ws2 = Math.sin(t * 1.08 - 0.7);
    const gl = Math.sin(t * 0.31) * Math.sin(t * 0.17 + 1.3);
    const swingL = c1 > 0 ? c1 : 0;
    const swingR = c1 < 0 ? -c1 : 0;
    // (each line: idle value, walk value, walk weight)
    // hips: weight shift when idle; bob, sway and twist when walking
    S[I_HPX] = mixv(0.012 * ws, -0.014 * An * c1, w);
    S[I_HPY] = mixv(0, An * (0.022 * c2 - 0.01), w);
    S[Y.hips] = mixv(0, -0.12 * An * s1, w);
    S[Z.hips] = mixv(0.03 * ws, -0.045 * An * c1, w);
    // spine and head (breathing, counter-rotation, head stays level)
    S[X.chest] = mixv(0.02 + 0.012 * br, 0.07 * An, w) + this.leanF;
    S[Y.chest] = mixv(0.03 * gl, 0.16 * An * s1, w);
    S[Z.chest] = mixv(-0.025 * ws2, 0.035 * An * c1, w);
    S[I_SHL] = mixv(0.004 * (br * 0.5 + 0.5), 0.004 * An * s1, w);
    S[I_SHR] = mixv(0.004 * (br * 0.5 + 0.5), -0.004 * An * s1, w);
    S[Y.neck] = mixv(0.06 * gl, 0, w);
    S[X.head] = mixv(-0.02 - 0.012 * br, -0.05 * An + 0.025 * An * Math.cos(2 * ph - 0.8), w) - this.leanF * 0.5;
    S[Y.head] = mixv(0.16 * gl, -0.04 * An * s1, w);
    S[Z.head] = mixv(0.03 * ws2, -0.02 * An * c1, w);
    // arms swing opposite the legs, elbows bend more on the forward swing
    S[X.upperArmL] = mixv(0.03 * Math.sin(t * 0.7), 0.8 * A * s1, w);
    S[X.upperArmR] = mixv(0.03 * Math.sin(t * 0.7 + 1.7), -0.8 * A * s1, w);
    S[Z.upperArmL] = mixv(0.1 + 0.012 * br, 0.13, w);
    S[Z.upperArmR] = mixv(-0.1 - 0.012 * br, -0.13, w);
    S[X.elbowL] = mixv(-0.16, -0.3 - 0.45 * An * (s1 < 0 ? -s1 : 0), w);
    S[X.elbowR] = mixv(-0.16, -0.3 - 0.45 * An * (s1 > 0 ? s1 : 0), w);
    S[X.handL] = -0.12;
    S[X.handR] = -0.12;
    S[Z.handL] = 0.08;
    S[Z.handR] = -0.08;
    // legs: stride swing, knee lift in the swing phase, heel strike and toe-off
    const relaxL = 0.03 + 0.1 * (ws < 0 ? -ws : 0);
    const relaxR = 0.03 + 0.1 * (ws > 0 ? ws : 0);
    const kL = mixv(relaxL, 0.05 + 1.0 * An * Math.pow(swingL, 1.6), w);
    const kR = mixv(relaxR, 0.05 + 1.0 * An * Math.pow(swingR, 1.6), w);
    const tL = mixv(-0.5 * relaxL, -A * s1, w);
    const tR = mixv(-0.5 * relaxR, A * s1, w);
    S[X.thighL] = tL;
    S[X.thighR] = tR;
    S[Z.thighL] = mixv(0.015 - 0.03 * ws, 0.02, w);
    S[Z.thighR] = mixv(-0.015 - 0.03 * ws, -0.02, w);
    S[X.kneeL] = kL;
    S[X.kneeR] = kR;
    const toeL = 0.38 * An * bump6(ph - (1.5 * Math.PI - 0.35)) - 0.22 * An * bump6(ph - Math.PI / 2);
    const toeR = 0.38 * An * bump6(ph - (0.5 * Math.PI - 0.35)) - 0.22 * An * bump6(ph - 1.5 * Math.PI);
    const level = mixv(1, 0.8, w);
    S[X.footL] = -(tL + kL) * level + w * toeL;
    S[X.footR] = -(tR + kR) * level + w * toeR;
    // lean into turns like a little runner
    S[I_BRZ] = this.leanT;
  }

  _drivePose(D) {
    this._updateReach();
    D.set(DEFAULTS);
    const t = this.time;
    const spN = clamp(Math.abs(this.speed) / 8, 0, 1);
    const vib = 0.004 * Math.sin(t * 23) * spN + 0.003 * Math.sin(t * 7.3) * spN;
    D[I_HPY] = SEAT_DROP + vib;
    D[I_HPZ] = this._reach.slide;
    D[X.hips] = -0.06;
    D[X.thighL] = -1.52;
    D[X.thighR] = -1.52;
    D[Z.thighL] = 0.07;
    D[Z.thighR] = -0.07;
    D[X.kneeL] = SEAT_KNEE;
    D[X.kneeR] = SEAT_KNEE;
    D[X.footL] = SEAT_FOOT;
    D[X.footR] = SEAT_FOOT;
    const br = Math.sin(t * 1.85);
    D[X.chest] = this._reach.lean + 0.01 * br + this.leanF;
    D[Z.chest] = this.leanT;
    D[X.neck] = -0.25 * this._reach.lean;
    D[X.head] = -0.35 * this._reach.lean - 0.03 - 0.012 * br + vib * 4;
    D[Y.head] = 0.22 * this.steer + 0.08 * Math.sin(t * 0.29) * Math.sin(t * 0.13 + 2);
    D[Z.head] = -0.5 * this.leanT;
    D[I_SHL] = 0.003 * (br * 0.5 + 0.5);
    D[I_SHR] = 0.003 * (br * 0.5 + 0.5);
    // hands on the wheel (10 and 2), turning with the steering
    this._wheelIK(D, SIDES[0]);
    this._wheelIK(D, SIDES[1]);
    D[X.handL] = 0.25;
    D[X.handR] = 0.25;
    D[Z.handL] = 0.35;
    D[Z.handR] = -0.35;
  }

  /** Lean / slide needed so the hands reach the wheel (recomputed only when the wheel moves). */
  _updateReach() {
    const w = this.wheel;
    const k = this._wheelKey;
    if (k[0] === w.x && k[1] === w.y && k[2] === w.z && k[3] === this.wheelRadius && k[4] === this.wheelTilt) return;
    k[0] = w.x;
    k[1] = w.y;
    k[2] = w.z;
    k[3] = this.wheelRadius;
    k[4] = this.wheelTilt;
    const D = this.D;
    let lean = 0.12;
    let slide = 0;
    for (let i = 0; i < 24; i++) {
      D.set(DEFAULTS);
      D[I_HPY] = SEAT_DROP;
      D[I_HPZ] = slide;
      D[X.hips] = -0.06;
      D[X.chest] = lean;
      this._gripPoint(1, 0, _v2);
      const d = this._shoulderDistance(D, 1, _v2);
      if (d <= (ARM_L1 + ARM_L2) * 0.93) break;
      if (lean < 0.48) lean += 0.04;
      else if (slide < 0.14) slide += 0.02;
      else break;
    }
    this._reach.lean = lean;
    this._reach.slide = slide;
  }

  _gripPoint(side, steer, out) {
    const ang = (side > 0 ? 0.52 : Math.PI - 0.52) - steer;
    const r = this.wheelRadius;
    const ux = Math.cos(ang) * r;
    const uy = Math.sin(ang) * r;
    return out.set(this.wheel.x + ux, this.wheel.y + uy * Math.cos(this.wheelTilt), this.wheel.z - uy * Math.sin(this.wheelTilt));
  }

  /** Root-space point -> chest space, using the pose's hips/chest values. */
  _toChest(P, point, out) {
    _e1.set(P[X.hips], P[Y.hips], P[Z.hips], 'YXZ');
    _q1.setFromEuler(_e1);
    _m1.compose(_v1.set(P[I_HPX], 0.42 + P[I_HPY], P[I_HPZ]), _q1, ONE);
    _e1.set(P[X.chest], P[Y.chest], P[Z.chest], 'YXZ');
    _q1.setFromEuler(_e1);
    _m2.compose(_v1.set(0, 0.02, 0), _q1, ONE);
    _m1.multiply(_m2).invert();
    return out.copy(point).applyMatrix4(_m1);
  }

  _shoulderDistance(P, side, rootPoint) {
    this._toChest(P, rootPoint, _v3);
    const sx = 0.195 * side;
    return Math.hypot(_v3.x - sx, _v3.y - 0.245, _v3.z);
  }

  _wheelIK(D, sd) {
    this._gripPoint(sd.s, this.steer, _v2);
    this._toChest(D, _v2, _v3);
    solveArm(_v3.x - 0.195 * sd.s, _v3.y - 0.245 - D[sd.sh], _v3.z, sd.wheelPole, _ik);
    D[sd.uaX] = _ik.x;
    D[sd.uaY] = _ik.y;
    D[sd.uaZ] = _ik.z;
    D[sd.elX] = -_ik.bend;
  }

  // ------------------------------------------------------------------ emotes
  _evalEmote(dt) {
    const cur = this.cur;
    const def = cur.def;
    cur.u += dt;
    const u = Math.min(cur.u, def.dur);
    // timed events
    while (cur.fi < def.face.length && def.face[cur.fi][0] <= u) {
      const f = def.face[cur.fi++][1];
      if (f === 'blinkPush') this.blinkLeft = 0.14;
      else this.emoteFace = f;
      this._applyFaceCells();
    }
    while (cur.ei < def.eyes.length && def.eyes[cur.ei][0] <= u) {
      this.eyeOverride = def.eyes[cur.ei++][1];
      this._applyFaceCells();
    }
    while (cur.mi < def.mode.length && def.mode[cur.mi][0] <= u) this.setMode(def.mode[cur.mi++][1], true);
    while (cur.ci < def.cues.length && def.cues[cur.ci][0] <= u) {
      const cue = def.cues[cur.ci++][1];
      if (this.onEvent) {
        this._cue.emote = def.name;
        this._cue.cue = cue;
        this.onEvent('cue', this._cue);
      }
    }
    // tracks
    const F = this.F;
    const B = this.B;
    const seated = this.driveW > 0.5 && !def.fullBody;
    for (let k = 0; k < def.tracks.length; k++) {
      const tr = def.tracks[k];
      if (seated && tr.leg) continue;
      const T = tr.times;
      let i = 1;
      while (i < T.length - 1 && u > T[i]) i++;
      const t0 = T[i - 1];
      const t1 = T[i];
      const s = t1 > t0 ? clamp((u - t0) / (t1 - t0), 0, 1) : 1;
      const e = tr.fns[i](s);
      const base = tr.add ? 0 : B[tr.ch];
      let v0 = tr.vals[i - 1];
      let v1 = tr.vals[i];
      if (v0 !== v0) v0 = base;
      if (v1 !== v1) v1 = base;
      const v = v0 + (v1 - v0) * e;
      F[tr.ch] = tr.add ? B[tr.ch] + v : v;
    }
    if (def.extra) def.extra(u, F, B, this);
    if (seated) {
      const by = CH['body.y'];
      const sy = CH['body.sy'];
      F[by] = B[by] + (F[by] - B[by]) * 0.3;
      F[sy] = B[sy] + (F[sy] - B[sy]) * 0.5;
    }
    if (cur.u >= def.dur) this._finishEmote(true);
  }

  _finishEmote() {
    const cur = this.cur;
    if (!cur) return;
    this.cur = null;
    this.emoteFace = null;
    this.eyeOverride = null;
    this._applyFaceCells();
    cur.resolve(true);
  }

  _idleFidget(dt) {
    // Standing still for a while: push the glasses up the nose (a little Maya habit).
    if (this.mode === 'drive' || this.walkW > 0.05 || this.talkT > 0 || this.opts.fidget === false) {
      this.idleTime = 0;
      return;
    }
    this.idleTime += dt;
    if (this.idleTime > this.nextFidget) {
      this.idleTime = 0;
      this.nextFidget = 11 + this.rand() * 9;
      this.emote('adjustGlasses');
    }
  }

  // ------------------------------------------------------------------ secondary layers
  _lookLayer(F, dt) {
    let yaw = 0;
    let pitch = 0;
    let want = 0;
    if (this.hasLook) {
      this.root.updateWorldMatrix(true, false);
      _v1.copy(this.lookTarget);
      this.root.worldToLocal(_v1);
      const hy = this.driveW > 0.5 ? 0.62 : 0.96;
      const dx = _v1.x;
      const dz = _v1.z;
      const dy = _v1.y - hy;
      yaw = Math.atan2(dx, dz);
      if (yaw > 2.2) yaw = 2.2 - (yaw - 2.2);
      else if (yaw < -2.2) yaw = -2.2 - (yaw + 2.2);
      yaw = clamp(yaw, -1.15, 1.15);
      pitch = clamp(-Math.atan2(dy, Math.hypot(dx, dz)), -0.45, 0.4);
      want = 1;
    }
    const emoting = this.cur && !this.cur.def.internal;
    this.lookW = damp(this.lookW, want * (emoting ? 0.3 : 1), 6, dt);
    // the eyes lead: while the head is still catching up with a big turn, glance first
    const lag = (yaw - this.lookYaw) * want;
    const eye = !emoting && lag > 0.22 ? 'lookR' : !emoting && lag < -0.22 ? 'lookL' : null;
    if (eye !== this.lookEye) {
      this.lookEye = eye;
      this._applyFaceCells();
    }
    this.lookYaw = damp(this.lookYaw, yaw, 7, dt);
    this.lookPitch = damp(this.lookPitch, pitch, 7, dt);
    const w = this.lookW;
    if (w < 0.001) return;
    F[Y.head] += this.lookYaw * 0.6 * w;
    F[Y.neck] += this.lookYaw * 0.25 * w;
    F[Y.chest] += this.lookYaw * 0.15 * w;
    F[X.head] += this.lookPitch * 0.7 * w;
    F[X.neck] += this.lookPitch * 0.3 * w;
  }

  _talkLayer(F) {
    if (this.talkT <= 0 && !(FACE_DEFS[this.face]?.talking)) return;
    if (this.cur && !this.cur.def.internal) return;
    const t = this.time;
    const k = Math.min(1, this.talkT > 0 ? this.talkT / 0.3 : 1);
    F[X.head] += (0.035 * Math.sin(t * 7.3) * Math.sin(t * 1.7) + 0.02 * Math.sin(t * 3.1)) * k;
    F[Z.head] += 0.045 * Math.sin(t * 1.15) * k;
    F[Y.head] += 0.04 * Math.sin(t * 0.83 + 1) * k;
    if (this.driveW > 0.5) return;
    // explaining hands: soft alternating lifts
    const gL = Math.pow(Math.max(0, Math.sin(t * 1.9)), 3) * k;
    const gR = Math.pow(Math.max(0, Math.sin(t * 1.9 + 2.4)), 3) * k;
    F[X.upperArmL] -= 0.35 * gL;
    F[X.elbowL] -= 0.9 * gL;
    F[Z.handL] -= 0.3 * gL;
    F[X.upperArmR] -= 0.3 * gR;
    F[X.elbowR] -= 0.85 * gR;
    F[Z.handR] += 0.3 * gR;
    F[Z.chest] += 0.02 * (gL - gR);
  }

  _solveIKChannels(F) {
    for (let i = 0; i < 2; i++) {
      const sd = SIDES[i];
      const w = clamp(F[sd.ikw], 0, 1);
      if (w <= 0.001) continue;
      const def = this.cur?.def;
      const pole = (sd.s > 0 ? def?.poleL : def?.poleR) || sd.pole;
      solveArm(F[sd.ikx] - 0.195 * sd.s, F[sd.iky] - 0.245 - F[sd.sh], F[sd.ikz], pole, _ik);
      F[sd.uaX] += (_ik.x - F[sd.uaX]) * w;
      F[sd.uaY] += (_ik.y - F[sd.uaY]) * w;
      F[sd.uaZ] += (_ik.z - F[sd.uaZ]) * w;
      F[sd.elX] += (-_ik.bend - F[sd.elX]) * w;
      F[sd.elY] *= 1 - w;
      F[sd.elZ] *= 1 - w;
    }
  }

  _applyPose(F) {
    // crouch: drop the hips and fold the legs so the feet stay planted
    const cr = F[I_CROUCH];
    if (cr > 0.0005) {
      const Dd = LEG_A + LEG_B - Math.min(cr, 0.2);
      const al = Math.acos(clamp((LEG_A * LEG_A + Dd * Dd - LEG_B * LEG_B) / (2 * LEG_A * Dd), -1, 1));
      const be = Math.acos(clamp((LEG_B * LEG_B + Dd * Dd - LEG_A * LEG_A) / (2 * LEG_B * Dd), -1, 1));
      F[X.thighL] -= al;
      F[X.thighR] -= al;
      F[X.kneeL] += al + be;
      F[X.kneeR] += al + be;
      F[X.footL] -= be;
      F[X.footR] -= be;
      F[I_HPY] -= cr;
    }
    const J = this.joint;
    for (let j = 0; j < J.length; j++) J[j].rotation.set(F[j * 3], F[j * 3 + 1], F[j * 3 + 2]);
    const rp = this.restPos;
    this.bones.hips.position.set(rp.hips[0] + F[I_HPX], rp.hips[1] + F[I_HPY], rp.hips[2] + F[I_HPZ]);
    this.bones.shoulderL.position.y = rp.shoulderL[1] + F[I_SHL];
    this.bones.shoulderR.position.y = rp.shoulderR[1] + F[I_SHR];
    this.bones.glasses.position.y = rp.glasses[1] + F[I_GLS];
    const sy = clamp(F[I_BSY], 0.5, 1.6);
    const sxz = 1 / Math.sqrt(sy);
    this.body.position.y = F[I_BY];
    this.body.rotation.set(0, F[I_BRY], F[I_BRZ]);
    this.body.scale.set(sxz, sy, sxz);
    for (let i = 0; i < PROPS.length; i++) {
      const v = F[PROPS[i][1]];
      this.bones[PROPS[i][0]].scale.setScalar(v > 0.001 ? v : 0.001);
    }
  }

  _updateHair(dt) {
    const head = this.bones.head;
    head.updateWorldMatrix(true, false);
    const e = head.matrixWorld.elements;
    _v1.set(e[12], e[13], e[14]);
    if (!this.motionInit || _v1.distanceToSquared(this.headPrev) > 1.0) {
      this.headPrev.copy(_v1);
      this.headVel.set(0, 0, 0);
      this.headAcc.set(0, 0, 0);
      this.yawPrev = Math.atan2(e[8], e[10]);
      this.motionInit = true;
    }
    if (dt <= 0) return;
    // world velocity and acceleration of the head (smoothed finite differences)
    _v2.copy(_v1).sub(this.headPrev).divideScalar(dt);
    this.headPrev.copy(_v1);
    _v3.copy(_v2).sub(this.headVel).divideScalar(dt);
    const kv = 1 - Math.exp(-dt * 30);
    this.headVel.lerp(_v2, kv);
    this.headAcc.lerp(_v3, 1 - Math.exp(-dt * 20));
    if (this.headAcc.lengthSq() > 900) this.headAcc.setLength(30);
    const yaw = Math.atan2(e[8], e[10]);
    let dy = yaw - this.yawPrev;
    if (dy > Math.PI) dy -= TAU;
    if (dy < -Math.PI) dy += TAU;
    this.yawPrev = yaw;
    this.yawRate = damp(this.yawRate, dy / dt, 15, dt);
    // head axes (normalised) to express motion in the head's frame
    const lx = Math.hypot(e[0], e[1], e[2]) || 1;
    const ly = Math.hypot(e[4], e[5], e[6]) || 1;
    const lz = Math.hypot(e[8], e[9], e[10]) || 1;
    const a = this.headAcc;
    const v = this.headVel;
    const aX = (a.x * e[0] + a.y * e[1] + a.z * e[2]) / lx;
    const aY = (a.x * e[4] + a.y * e[5] + a.z * e[6]) / ly;
    const aZ = (a.x * e[8] + a.y * e[9] + a.z * e[10]) / lz;
    const vZ = (v.x * e[8] + v.y * e[9] + v.z * e[10]) / lz;
    const vX = (v.x * e[0] + v.y * e[1] + v.z * e[2]) / lx;
    // gravity direction in head space -> angles that keep hair hanging down
    const gx = -e[1] / lx;
    const gy = -e[5] / ly;
    const gz = -e[9] / lz;
    const gPitch = Math.atan2(-gz, -gy);
    const gRoll = Math.atan2(gx, -gy);
    const wind = clamp(Math.max(0, vZ) * 0.045, 0, 0.5);
    const flutter = wind * 0.25 * Math.sin(this.time * 17) * Math.sin(this.time * 5.3);
    const spin = clamp(this.yawRate * this.yawRate * 0.012, 0, 0.9);
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    const H = this.hair;
    for (let i = 0; i < H.length; i++) {
      const s = H[i];
      const om = TAU * s.hz;
      const k = om * om;
      const c = 2 * s.zeta * om;
      let tx;
      let tz;
      let fx;
      let fz;
      if (s.bangs) {
        tx = 0;
        tz = 0;
        fx = (2.5 * aY - 1.5 * aZ) * s.gain;
        fz = 0;
      } else {
        tx = gPitch * 0.8 + wind + flutter + spin * 0.6;
        tz = gRoll * 0.8 + s.side * spin * 0.5 + s.side * wind * 0.3;
        fx = (8 * aZ - 3.5 * aY) * s.gain;
        fz = (-4.5 * aX - s.side * 2.5 * aY - 0.02 * vX) * s.gain;
        if (s.parent >= 0) {
          const p = H[s.parent];
          tx = p.ax * s.follow + (tx - p.ax) * 0.35;
          tz = p.az * s.follow + (tz - p.az) * 0.35;
        }
      }
      for (let n = 0; n < steps; n++) {
        const accX = k * (tx - s.ax) - c * s.vx + fx;
        const accZ = k * (tz - s.az) - c * s.vz + fz;
        s.vx += accX * h;
        s.vz += accZ * h;
        s.ax += s.vx * h;
        s.az += s.vz * h;
        if (s.ax < s.lim[0]) { s.ax = s.lim[0]; if (s.vx < 0) s.vx = 0; }
        if (s.ax > s.lim[1]) { s.ax = s.lim[1]; if (s.vx > 0) s.vx = 0; }
        if (s.az < s.lim[2]) { s.az = s.lim[2]; if (s.vz < 0) s.vz = 0; }
        if (s.az > s.lim[3]) { s.az = s.lim[3]; if (s.vz > 0) s.vz = 0; }
      }
      s.b.rotation.set(s.ax, 0, s.az);
    }
  }

  // ------------------------------------------------------------------ face
  _updateFace(dt) {
    if (this.tempFace) {
      this.tempT -= dt;
      if (this.tempT <= 0) this.tempFace = null;
    }
    // blinking
    if (this.blinkLeft > 0) {
      this.blinkLeft -= dt;
      if (this.blinkLeft <= 0 && this.blinkDouble) {
        this.blinkDouble = false;
        this.blinkT = 0.12;
      }
    } else if (this.autoBlink && dt > 0) {
      this.blinkT -= dt;
      if (this.blinkT <= 0) {
        this.blinkLeft = 0.12;
        this.blinkDouble = this.rand() < 0.18;
        this.blinkT = 2.5 + this.rand() * 2.5;
      }
    }
    // talking mouth
    if (this.talkT > 0) this.talkT = Math.max(0, this.talkT - dt);
    const talking = this.talkT > 0 || FACE_DEFS[this.face]?.talking;
    if (talking && dt > 0) {
      this.mouthT -= dt;
      if (this.mouthT <= 0) {
        let next = this.mouthFrame;
        while (next === this.mouthFrame) next = TALK_FRAMES[Math.floor(this.rand() * TALK_FRAMES.length)];
        this.mouthFrame = next;
        this.mouthT = 0.065 + this.rand() * 0.07;
      }
    }
    this._applyFaceCells();
  }

  _applyFaceCells(force = false) {
    const def = FACE_DEFS[this.face] || FACE_DEFS.smile;
    let eye = this.eyeOverride || (def.eyes === 'open' && this.lookEye) || def.eyes;
    if (this.blinkLeft > 0) {
      if (this.eyeOverride) eye = 'blinkOpen';
      else if (def.blink) eye = def.blink;
      else if (def.eyes === 'happy') eye = 'blinkHappy';
    }
    const talking = this.talkT > 0 || def.talking;
    const mouth = talking ? this.mouthFrame : def.mouth;
    const uv = this.faceGeo?.attributes.uv;
    if (!uv) return;
    let dirty = false;
    if (force || eye !== this._eyeCell) {
      const xy = EYE_XY[eye] || EYE_XY.open;
      setQuadUV(uv, 0, xy[0], xy[1], EYE_W, EYE_H);
      this._eyeCell = eye;
      dirty = true;
    }
    if (force || mouth !== this._mouthCell) {
      const xy = MOUTH_XY[mouth] || MOUTH_XY.smile;
      setQuadUV(uv, 4, xy[0], xy[1], EYE_W, MOUTH_H);
      this._mouthCell = mouth;
      dirty = true;
    }
    if (dirty) uv.needsUpdate = true;
  }

  _updateGlint(dt) {
    const g = this.bones.glint;
    if (this.glintU < 0) {
      this.glintT -= dt;
      if (this.glintT <= 0 && this.autoBlink) {
        this.glintU = 0;
        this.glintT = 5 + this.rand() * 4;
      }
      g.scale.setScalar(0.001);
      return;
    }
    this.glintU += dt;
    const u = this.glintU / 0.42;
    if (u >= 1) {
      this.glintU = -1;
      g.scale.setScalar(0.001);
      return;
    }
    const s = Math.sin(u * Math.PI);
    g.scale.setScalar(Math.max(0.001, s * 1.1));
    g.position.x = this.restPos.glint[0] + (u - 0.5) * 0.03;
    g.position.y = this.restPos.glint[1] + (u - 0.5) * 0.03;
  }
}

/** Create blocky cartoon Maya. opts: { outfit, face, shadow = true, outlinePx = 2, seed, blink = true, fidget = true, onEvent(type, data) } */
export function createMaya(opts = {}) {
  return new Maya(opts);
}
