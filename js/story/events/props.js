// Props for the town gatherings (js/story/extras-events.js): every small thing an event brings (a rattan ball, a
// mango basket, a crate stack and a kitten, kites, a TV on its trolley, a baby bundle, a bicycle, a snack cart, a
// paper lantern, a newspaper, a puppet booth and two puppets), all drawn by ONE instanced unit box with a toon
// material and an instanced outline: 2 draw calls for every prop of an event, however many parts move.
//
// Blocky, cel-shaded, Maya's palette; colour through blocks (each box its own slightly varied colour), never a
// texture. Every prop is a set of rigid PARTS (a mango, a kite, the kitten), each a short list of boxes in its own
// frame (origin on the ground under it, or at the grip for things held in the hands). The rig keeps one matrix per
// part; only parts that moved this frame rewrite their boxes' instance matrices (a few dozen at most).
//
//   const rig = createPropRig(scene, { low })        once (kept between events; nothing is made per event)
//   const part = rig.add(kind)                        a part of PARTS[kind]; null when the rig is full
//   part.place(x, y, z, ry) / part.rot(rx, ry, rz) / part.scale(s) / part.show(on)
//   part.carry(person, ox, oy, oz, ry)                follows a people.js person (in their frame) until place()
//   part.fly(x, y, z, dur, arc, spin)                 a hop / throw from where it is (parabola), then fixed there
//   part.grow(s, dur)                                 scale to s over dur (packing up, unfolding)
//   part.drive = (part, t) => {}                      the event's own animation (sets pos / rx / ry / rz / s)
//   rig.update(dt)                                    once a frame while an event runs
//   rig.clear()                                       every part away (the event is over)
//   rig.stats()                                       { parts, boxes }
// Extras (each one draw call, made once on first use, kept): rig.strings (LineSegments, 12 segments: kite and
// puppet strings), rig.screen (a 64 x 40 canvas TV picture), rig.glow (an additive ground glow), rig.chalk
// (two flat chalk lines, polygonOffset, never z-fighting the ground).
import * as THREE from '../../game/three.js';
import { toon, basic, outlineGeometry } from '../../game/toon.js';
import { instancedOutlineMaterial, trackOutlineResolution } from '../../game/fx.js';
import { jitter } from '../../game/voxel.js';
import { LAYER } from '../world/ground-layers.js';

const CAP = 200; // boxes (instances) at most at once
const C = {
  rattan: '#C99A55', rattanDark: '#9C6F33', basket: '#B88A4E', basketDark: '#8A6232', basketRim: '#D8B275',
  mango: '#F2B33D', mangoRed: '#E7843A', stem: '#5E8F4E', wood: '#B58A5A', woodDark: '#7A5434', woodLight: '#D2A874',
  ginger: '#E39A4B', gingerDark: '#B86E2C', white: '#FFFDF8', cream: '#EDE6D3', pink: '#E8A0A8', milk: '#F7F2E6',
  saucer: '#8FB6CF', ink: '#2A2118', grey: '#8E8A84', greyDark: '#4C4844', tvBody: '#5A3E2B', tvBezel: '#2E2A27',
  teal: '#2F7C7A', tealDark: '#225E5C', maroon: '#6E1F2A', gold: '#C9A24A', goldDeep: '#A47A2C', navy: '#2E3D63',
  coral: '#E0795A', skin: '#E8B48E', red: '#C8323C', green: '#5E9E4E', greenDark: '#3F7A3A', orange: '#E39A3B',
  paper: '#F1EAD8', line: '#9C958A', water: '#7FB0CF', black: '#2B2522', rubber: '#3A3634', chrome: '#C9C5BC',
  lantern: '#F7C66A', lanternDark: '#B5452F', steel: '#6E6A66', plum: '#6B3E64', leaf: '#6F9E5B', sky: '#7FB0CF',
};
const R45 = Math.PI / 4;
// box tuple: [x, y, z, w, h, d, colour, ry = 0, rx = 0, rz = 0]
const ring = (out, cx, cy, cz, r, n, w, d, col, axis = 'x') => { // a wheel: n boxes round a circle in the y-z plane (axis x)
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2, L = 2 * r * Math.tan(Math.PI / n) + 0.004;
    if (axis === 'x') out.push([cx, cy + Math.cos(a) * r, cz + Math.sin(a) * r, w, d, L, col, 0, -a, 0]);
    else out.push([cx + Math.sin(a) * r, cy + Math.cos(a) * r, cz, L, d, w, col, 0, 0, -a]);
  }
  return out;
};

/** PARTS[kind] = () => boxes (a part's boxes in its own frame). Built once per kind and cached. */
export const PARTS = {
  // ---- E1: a rattan chinlone ball (origin: its middle)
  ball: () => [
    [0, 0, 0, 0.13, 0.13, 0.13, C.rattan], [0, 0, 0, 0.145, 0.03, 0.145, C.rattanDark], [0, 0, 0, 0.03, 0.145, 0.145, C.rattanDark], [0, 0, 0, 0.145, 0.145, 0.03, C.rattanDark],
  ],
  // ---- E2: a mango basket (origin: its base) and the mangoes (origin: the middle of one)
  basket: () => {
    const b = [[0, 0.03, 0, 0.42, 0.06, 0.34, C.basketDark]];
    for (let i = 0; i < 4; i++) b.push([0, 0.07 + i * 0.05, 0.17, 0.46, 0.045, 0.03, i % 2 ? C.basket : C.basketDark], [0, 0.07 + i * 0.05, -0.17, 0.46, 0.045, 0.03, i % 2 ? C.basketDark : C.basket],
      [0.215, 0.07 + i * 0.05, 0, 0.03, 0.045, 0.34, i % 2 ? C.basket : C.basketDark], [-0.215, 0.07 + i * 0.05, 0, 0.03, 0.045, 0.34, i % 2 ? C.basketDark : C.basket]);
    b.push([0, 0.27, 0.18, 0.5, 0.035, 0.04, C.basketRim], [0, 0.27, -0.18, 0.5, 0.035, 0.04, C.basketRim], [0.235, 0.27, 0, 0.04, 0.035, 0.36, C.basketRim], [-0.235, 0.27, 0, 0.04, 0.035, 0.36, C.basketRim]);
    b.push([0, 0.22, 0, 0.36, 0.06, 0.28, C.mango], [0.08, 0.26, 0.05, 0.1, 0.06, 0.08, C.mangoRed], [-0.1, 0.26, -0.04, 0.1, 0.06, 0.08, C.mango]); // (the mangoes still in it)
    return b;
  },
  mango: () => [[0, 0, 0, 0.1, 0.085, 0.13, C.mango], [0.02, 0.02, 0.03, 0.06, 0.05, 0.06, C.mangoRed], [0, 0.05, -0.055, 0.02, 0.025, 0.02, C.stem]],
  // ---- E3: three crates stacked against a wall, a kitten, a saucer of milk
  crates: () => {
    const b = [];
    const crate = (x, y, z, ry, s) => {
      const w = 0.62 * s, h = 0.46 * s, d = 0.46 * s;
      b.push([x, y + h / 2, z, w, h, d, jitter(C.wood, 0.08, x * 7 + y), ry]);
      for (const k of [-1, 1]) b.push([x, y + h / 2, z + k * (d / 2 + 0.008), w + 0.02, 0.07, 0.02, C.woodDark, ry], [x + k * (w / 2 + 0.008), y + h / 2, z, 0.02, h, d * 0.7, C.woodDark, ry]);
      b.push([x, y + h - 0.02, z, w + 0.03, 0.04, d + 0.03, C.woodLight, ry]);
    };
    crate(0, 0, 0, 0.05, 1.05); crate(0.04, 0.48, 0.02, -0.08, 1); crate(-0.03, 0.94, -0.01, 0.12, 0.92);
    return b;
  },
  kitten: () => [
    [0, 0.07, 0, 0.09, 0.08, 0.17, C.ginger], [0, 0.055, 0.04, 0.07, 0.04, 0.06, C.white], [0, 0.135, 0.09, 0.095, 0.085, 0.085, C.ginger], [0, 0.11, 0.135, 0.045, 0.03, 0.02, C.white],
    [-0.03, 0.19, 0.09, 0.025, 0.035, 0.02, C.gingerDark], [0.03, 0.19, 0.09, 0.025, 0.035, 0.02, C.gingerDark], [0, 0.11, -0.12, 0.022, 0.022, 0.1, C.gingerDark, 0, -0.6, 0],
    [-0.03, 0.02, 0.06, 0.025, 0.04, 0.025, C.white], [0.03, 0.02, 0.06, 0.025, 0.04, 0.025, C.white], [-0.03, 0.02, -0.06, 0.025, 0.04, 0.025, C.ginger], [0.03, 0.02, -0.06, 0.025, 0.04, 0.025, C.ginger],
  ],
  saucer: () => [[0, 0.012, 0, 0.17, 0.024, 0.17, C.saucer], [0, 0.026, 0, 0.12, 0.008, 0.12, C.milk]],
  // ---- E4: a kite (origin: its middle, flat face toward local +z) with a ribbon tail
  kite: () => [
    [0, 0, 0, 0.42, 0.42, 0.015, C.maroon, 0, 0, R45], [0, 0.07, 0.004, 0.2, 0.2, 0.012, C.gold, 0, 0, R45], [0, 0, 0.012, 0.012, 0.6, 0.01, C.woodDark], [0, 0.05, 0.012, 0.44, 0.012, 0.01, C.woodDark],
    [0, -0.36, 0, 0.06, 0.04, 0.012, C.gold, 0, 0, 0.4], [0.02, -0.46, 0, 0.06, 0.04, 0.012, C.cream, 0, 0, -0.4], [0, -0.56, 0, 0.06, 0.04, 0.012, C.gold, 0, 0, 0.4],
  ],
  kite2: () => [
    [0, 0, 0, 0.4, 0.4, 0.015, C.teal, 0, 0, R45], [0, -0.08, 0.004, 0.18, 0.18, 0.012, C.cream, 0, 0, R45], [0, 0, 0.012, 0.012, 0.57, 0.01, C.woodDark], [0, 0.05, 0.012, 0.42, 0.012, 0.01, C.woodDark],
    [0, -0.35, 0, 0.06, 0.04, 0.012, C.cream, 0, 0, 0.4], [-0.02, -0.45, 0, 0.06, 0.04, 0.012, C.teal, 0, 0, -0.4], [0, -0.55, 0, 0.06, 0.04, 0.012, C.cream, 0, 0, 0.4],
  ],
  kite3: () => [
    [0, 0, 0, 0.38, 0.38, 0.015, C.coral, 0, 0, R45], [0.06, 0, 0.004, 0.1, 0.36, 0.012, C.navy, 0, 0, R45], [0, 0, 0.012, 0.012, 0.54, 0.01, C.woodDark], [0, 0.05, 0.012, 0.4, 0.012, 0.01, C.woodDark],
    [0, -0.33, 0, 0.06, 0.04, 0.012, C.navy, 0, 0, 0.4], [0.02, -0.43, 0, 0.06, 0.04, 0.012, C.coral, 0, 0, -0.4],
  ],
  // ---- E5: a small TV on a wooden trolley (origin: the ground; the screen looks toward local +z)
  tv: () => {
    const b = [
      [0, 0.3, 0, 0.62, 0.04, 0.42, C.woodLight], [0, 0.08, 0, 0.56, 0.03, 0.36, C.wood],
      [-0.28, 0.17, -0.18, 0.04, 0.3, 0.04, C.woodDark], [0.28, 0.17, -0.18, 0.04, 0.3, 0.04, C.woodDark], [-0.28, 0.17, 0.18, 0.04, 0.3, 0.04, C.woodDark], [0.28, 0.17, 0.18, 0.04, 0.3, 0.04, C.woodDark],
      [-0.28, 0.025, -0.18, 0.05, 0.05, 0.05, C.rubber], [0.28, 0.025, -0.18, 0.05, 0.05, 0.05, C.rubber], [-0.28, 0.025, 0.18, 0.05, 0.05, 0.05, C.rubber], [0.28, 0.025, 0.18, 0.05, 0.05, 0.05, C.rubber],
      [0, 0.55, -0.02, 0.56, 0.44, 0.34, C.tvBody], [0, 0.55, 0.15, 0.5, 0.38, 0.03, C.tvBezel], [0.2, 0.39, 0.16, 0.05, 0.03, 0.02, C.gold], [0.12, 0.39, 0.16, 0.03, 0.03, 0.02, C.red],
      [-0.08, 0.84, -0.04, 0.012, 0.26, 0.012, C.chrome, 0, 0, 0.45], [0.08, 0.84, -0.04, 0.012, 0.26, 0.012, C.chrome, 0, 0, -0.45], [0, 0.78, -0.04, 0.08, 0.03, 0.06, C.tvBezel],
      [0.22, 0.32, 0.12, 0.08, 0.02, 0.06, C.white], [0.22, 0.36, 0.12, 0.05, 0.06, 0.05, C.white], [0.22, 0.38, 0.12, 0.04, 0.01, 0.04, C.tvBody], // (a glass of tea on the trolley)
    ];
    return b;
  },
  // ---- E6: a swaddled baby (origin: the middle of the bundle, held across the chest)
  bundle: () => [
    [0, 0, 0, 0.3, 0.13, 0.15, C.cream], [0, 0.005, 0.0, 0.32, 0.03, 0.155, C.pink], [-0.1, 0.01, 0, 0.06, 0.135, 0.155, C.white],
    [0.12, 0.03, 0, 0.1, 0.1, 0.1, C.skin], [0.13, 0.085, 0, 0.11, 0.03, 0.11, C.pink], [0.17, 0.04, 0, 0.012, 0.02, 0.05, C.ink],
  ],
  // ---- E7: a bicycle (origin: the ground under the crank; it rides toward local +z) and the mender's kit
  bike: () => {
    const b = [];
    ring(b, 0, 0.3, 0.44, 0.29, 10, 0.035, 0.035, C.rubber); ring(b, 0, 0.3, -0.44, 0.29, 10, 0.035, 0.035, C.rubber);
    b.push([0, 0.3, 0.44, 0.03, 0.05, 0.05, C.chrome], [0, 0.3, -0.44, 0.03, 0.05, 0.05, C.chrome]);
    b.push([0, 0.62, 0, 0.035, 0.035, 0.66, C.red, 0, 0.12, 0], [0, 0.45, 0.2, 0.035, 0.035, 0.6, C.red, 0, 0.75, 0], [0, 0.45, -0.18, 0.035, 0.33, 0.035, C.red, 0, 0.35, 0],
      [0, 0.32, -0.24, 0.035, 0.035, 0.42, C.red], [0, 0.48, 0.4, 0.03, 0.4, 0.03, C.chrome, 0, -0.3, 0], [0, 0.71, 0.33, 0.44, 0.03, 0.03, C.chrome], [0.2, 0.71, 0.33, 0.06, 0.04, 0.04, C.black], [-0.2, 0.71, 0.33, 0.06, 0.04, 0.04, C.black],
      [0, 0.72, -0.22, 0.1, 0.04, 0.2, C.black], [0, 0.66, -0.22, 0.025, 0.1, 0.025, C.chrome], [0, 0.3, 0, 0.1, 0.1, 0.03, C.chrome], [0.08, 0.24, 0.05, 0.03, 0.03, 0.14, C.steel], [-0.08, 0.36, -0.05, 0.03, 0.03, 0.14, C.steel],
      [0, 0.66, -0.44, 0.14, 0.02, 0.24, C.black], [0.09, 0.73, 0.32, 0.03, 0.04, 0.03, C.gold]); // (rack, bell)
    return b;
  },
  kit: () => [
    [0, 0.04, 0, 0.3, 0.07, 0.24, C.saucer], [0, 0.077, 0, 0.26, 0.01, 0.2, C.water], [0.3, 0.2, 0, 0.05, 0.4, 0.05, C.steel], [0.3, 0.41, 0, 0.18, 0.03, 0.03, C.black], [0.3, 0.01, 0, 0.16, 0.02, 0.08, C.steel],
    [-0.28, 0.03, 0.05, 0.14, 0.05, 0.08, C.red], [-0.28, 0.06, 0.05, 0.1, 0.01, 0.06, C.gold],
  ],
  // ---- E8: a snack cart (origin: the ground under its middle; the handle at local -z, the cook behind it)
  cart: () => {
    const b = [
      [0, 0.52, 0, 1.0, 0.5, 0.56, C.teal], [0, 0.29, 0, 1.04, 0.04, 0.6, C.tealDark], [0, 0.78, 0, 1.06, 0.04, 0.62, C.woodLight],
      [-0.25, 0.52, 0.285, 0.36, 0.3, 0.02, C.cream], [0.25, 0.52, 0.285, 0.36, 0.3, 0.02, C.gold], [0, 0.52, 0.29, 0.02, 0.44, 0.02, C.tealDark],
      [0.2, 0.83, 0, 0.42, 0.05, 0.42, C.black], [0.2, 0.86, 0, 0.36, 0.01, 0.36, C.greyDark], [-0.28, 0.9, 0, 0.36, 0.2, 0.4, C.white], [-0.28, 1.01, 0, 0.38, 0.02, 0.42, C.woodLight],
      [-0.33, 0.85, 0.05, 0.08, 0.04, 0.08, C.orange], [-0.22, 0.85, -0.05, 0.08, 0.04, 0.08, C.orange], [-0.28, 0.85, 0.1, 0.08, 0.04, 0.08, C.mango],
      [-0.48, 0.66, -0.42, 0.04, 0.04, 0.32, C.woodDark], [0.48, 0.66, -0.42, 0.04, 0.04, 0.32, C.woodDark], [0, 0.66, -0.58, 1.0, 0.04, 0.04, C.woodDark],
    ];
    ring(b, 0.53, 0.2, 0, 0.18, 8, 0.05, 0.05, C.woodDark); ring(b, -0.53, 0.2, 0, 0.18, 8, 0.05, 0.05, C.woodDark);
    b.push([0, 0.2, 0, 1.12, 0.03, 0.03, C.steel, 0, 0, 0]);
    // (an umbrella pole and a little striped shade)
    b.push([0.45, 1.25, -0.2, 0.03, 0.9, 0.03, C.woodDark], [0.45, 1.68, -0.2, 0.8, 0.04, 0.8, C.maroon], [0.45, 1.7, -0.2, 0.5, 0.04, 0.5, C.cream]);
    return b;
  },
  // ---- E9: a paper lantern (origin: the ground under it)
  lantern: () => [
    [0, 0.17, 0, 0.22, 0.26, 0.22, C.lantern], [0, 0.17, 0, 0.235, 0.05, 0.235, C.lanternDark], [0, 0.03, 0, 0.16, 0.04, 0.16, C.woodDark], [0, 0.31, 0, 0.16, 0.04, 0.16, C.woodDark],
    [0, 0.42, 0, 0.02, 0.18, 0.02, C.woodDark], [0, 0.5, 0, 0.18, 0.02, 0.02, C.woodDark], [0, 0.17, 0.118, 0.06, 0.12, 0.01, '#FFE6A8'],
  ],
  // ---- E12: a newspaper held open (origin: between the hands)
  paper: () => {
    const b = [[0, 0, 0, 0.46, 0.32, 0.012, C.paper], [0, 0, 0.004, 0.012, 0.32, 0.012, C.line]];
    for (let i = 0; i < 5; i++) b.push([-0.12, 0.1 - i * 0.05, 0.007, 0.17, 0.012, 0.008, C.line], [0.12, 0.1 - i * 0.05, 0.007, 0.17, 0.012, 0.008, C.line]);
    b.push([-0.12, 0.125, 0.008, 0.17, 0.03, 0.008, C.ink], [0.12, -0.02, 0.008, 0.12, 0.08, 0.008, C.sky]);
    return b;
  },
  // ---- E13: a puppet booth (origin: the ground; the stage window looks toward local +z), a parrot and a frog
  booth: () => {
    const b = [
      [-0.68, 0.8, 0, 0.06, 1.6, 0.06, C.woodDark], [0.68, 0.8, 0, 0.06, 1.6, 0.06, C.woodDark], [-0.68, 0.8, -0.4, 0.06, 1.6, 0.06, C.woodDark], [0.68, 0.8, -0.4, 0.06, 1.6, 0.06, C.woodDark],
      [0, 0.45, 0.01, 1.3, 0.86, 0.03, C.maroon], [0, 0.88, 0.02, 1.34, 0.06, 0.04, C.gold], [0, 0.04, 0.02, 1.34, 0.06, 0.04, C.goldDeep],
      [-0.45, 0.45, 0.03, 0.05, 0.8, 0.01, '#5B1823'], [0, 0.45, 0.03, 0.05, 0.8, 0.01, '#5B1823'], [0.45, 0.45, 0.03, 0.05, 0.8, 0.01, '#5B1823'],
      [0, 1.62, 0.01, 1.44, 0.26, 0.05, C.teal], [0, 1.74, 0.03, 1.48, 0.04, 0.06, C.gold], [0, 1.5, 0.04, 1.44, 0.03, 0.04, C.gold],
      [-0.5, 1.62, 0.04, 0.08, 0.08, 0.01, C.cream], [0, 1.62, 0.04, 0.1, 0.1, 0.01, C.gold], [0.5, 1.62, 0.04, 0.08, 0.08, 0.01, C.cream],
      [-0.6, 1.2, 0.02, 0.12, 0.6, 0.03, C.plum], [0.6, 1.2, 0.02, 0.12, 0.6, 0.03, C.plum], [0, 0.9, -0.2, 1.3, 0.03, 0.4, C.wood],
      [0, 0.45, -0.4, 1.3, 0.86, 0.03, C.tealDark],
    ];
    return b;
  },
  parrot: () => [
    [0, 0, 0, 0.1, 0.13, 0.09, C.green], [0, 0.1, 0.01, 0.09, 0.08, 0.08, C.green], [0, 0.09, 0.07, 0.035, 0.04, 0.05, C.orange], [-0.035, 0.12, 0.045, 0.015, 0.02, 0.01, C.ink], [0.035, 0.12, 0.045, 0.015, 0.02, 0.01, C.ink],
    [-0.06, 0, 0, 0.03, 0.11, 0.07, C.red], [0.06, 0, 0, 0.03, 0.11, 0.07, C.red], [0, -0.11, -0.04, 0.05, 0.14, 0.02, C.gold, 0, -0.3, 0], [0, 0.15, 0, 0.05, 0.03, 0.05, C.red],
  ],
  frog: () => [
    [0, 0, 0, 0.13, 0.08, 0.11, C.greenDark], [0, 0.005, 0.03, 0.1, 0.05, 0.06, C.leaf], [-0.04, 0.055, 0.03, 0.035, 0.035, 0.035, C.white], [0.04, 0.055, 0.03, 0.035, 0.035, 0.035, C.white],
    [-0.04, 0.058, 0.05, 0.015, 0.02, 0.008, C.ink], [0.04, 0.058, 0.05, 0.015, 0.02, 0.008, C.ink], [0, 0.0, 0.057, 0.06, 0.01, 0.008, C.coral],
    [-0.07, -0.04, 0.02, 0.04, 0.02, 0.06, C.greenDark], [0.07, -0.04, 0.02, 0.04, 0.02, 0.06, C.greenDark],
  ],
  bar: () => [[0, 0, 0, 0.36, 0.025, 0.025, C.woodDark], [0, 0, 0, 0.025, 0.025, 0.22, C.woodDark]], // (the puppeteer's control bar)
};
const LOW_DROP = new Set(); // (kinds left out on the low tier: none yet; the catalog uses fewer mangoes there)

const cache = new Map(); // kind -> { mats: Matrix4[], cols: Color[] }
function kindData(kind) {
  let d = cache.get(kind);
  if (d) return d;
  const boxes = PARTS[kind]?.() || [];
  const e = new THREE.Euler(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  d = { mats: [], cols: [] };
  boxes.forEach((b, i) => {
    const [x, y, z, w, h, dd, col, ry = 0, rx = 0, rz = 0] = b;
    e.set(rx, ry, rz, 'YXZ'); q.setFromEuler(e);
    d.mats.push(new THREE.Matrix4().compose(p.set(x, y, z), q, s.set(w, h, dd)));
    d.cols.push(new THREE.Color(jitter(col, 0.05, i * 3.1 + kind.length)));
  });
  cache.set(kind, d);
  return d;
}

export function createPropRig(scene, { low = false } = {}) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.InstancedMesh(geo, toon('#ffffff'), CAP);
  mesh.count = 0; mesh.frustumCulled = false; mesh.name = 'event-props';
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.setColorAt(0, new THREE.Color('#ffffff')); // (makes instanceColor)
  const out = new THREE.InstancedMesh(outlineGeometry(geo), instancedOutlineMaterial(1.4), CAP);
  out.instanceMatrix = mesh.instanceMatrix; out.count = 0; out.frustumCulled = false; out.userData.isOutline = true; out.raycast = () => {};
  trackOutlineResolution(out);
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < CAP; i++) mesh.setMatrixAt(i, ZERO);
  let used = 0, inScene = false;
  const parts = [];
  const M = new THREE.Matrix4(), T = new THREE.Matrix4(), E = new THREE.Euler(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3();
  let clock = 0, colorDirty = false;

  function attach() { if (!inScene) { scene.add(mesh); scene.add(out); inScene = true; } }
  function write(pt) {
    const d = pt.data;
    if (!pt.vis || pt.s <= 1e-4) { for (let k = 0; k < d.mats.length; k++) mesh.setMatrixAt(pt.i0 + k, ZERO); return; }
    E.set(pt.rx, pt.ry, pt.rz, 'YXZ'); Q.setFromEuler(E);
    M.compose(pt.pos, Q, S.set(pt.s, pt.s, pt.s));
    for (let k = 0; k < d.mats.length; k++) mesh.setMatrixAt(pt.i0 + k, T.multiplyMatrices(M, d.mats[k]));
  }
  class Part {
    constructor(kind, data, i0) {
      this.kind = kind; this.data = data; this.i0 = i0; this.n = data.mats.length;
      this.pos = new THREE.Vector3(); this.rx = 0; this.ry = 0; this.rz = 0; this.s = 1; this.vis = true; this.dirty = true;
      this.held = null; this.hx = 0; this.hy = 0; this.hz = 0; this.hry = 0;
      this.fl = null; this.gr = null; this.drive = null;
      this.from = new THREE.Vector3(); this.to = new THREE.Vector3();
    }
    place(x, y, z, ry = this.ry) { this.held = null; this.fl = null; this.pos.set(x, y, z); this.ry = ry; this.dirty = true; return this; }
    rot(rx, ry, rz) { this.rx = rx; this.ry = ry; this.rz = rz; this.dirty = true; return this; }
    scale(s) { this.s = s; this.gr = null; this.dirty = true; return this; }
    show(on = true) { this.vis = !!on; this.dirty = true; return this; }
    /** held by a person (people.js): (ox, oy, oz) in their frame (+z ahead of them), ry on top of their heading */
    carry(p, ox = 0, oy = 0.45, oz = 0.25, ry = 0) { this.held = p; this.hx = ox; this.hy = oy; this.hz = oz; this.hry = ry; this.fl = null; this.dirty = true; return this; }
    /** a throw or a hop to (x, y, z) over dur s, arc m above the straight line; spin: turns about x on the way */
    fly(x, y, z, dur = 0.6, arc = 0.5, spin = 0) { if (this.held) this.syncHeld(); this.held = null; this.from.copy(this.pos); this.to.set(x, y, z); this.fl = { t: 0, dur: Math.max(0.05, dur), arc, spin, rx0: this.rx }; this.dirty = true; return this; }
    grow(s, dur = 0.4) { this.gr = { s0: this.s, s1: s, t: 0, dur: Math.max(0.05, dur) }; return this; }
    get flying() { return !!this.fl; }
    syncHeld() {
      const r = this.held.root;
      if (!r) return;
      const h = r.rotation.y, c = Math.cos(h), s = Math.sin(h);
      this.pos.set(r.position.x + this.hx * c + this.hz * s, r.position.y + this.hy, r.position.z - this.hx * s + this.hz * c);
      this.ry = h + this.hry;
    }
  }
  const rig = {
    mesh, outline: out,
    add(kind) {
      const data = kindData(kind);
      if (!data.mats.length || used + data.mats.length > CAP || (low && LOW_DROP.has(kind))) return null;
      attach();
      const pt = new Part(kind, data, used);
      for (let k = 0; k < data.mats.length; k++) mesh.setColorAt(used + k, data.cols[k]);
      used += data.mats.length;
      mesh.count = out.count = used;
      colorDirty = true;
      parts.push(pt);
      return pt;
    },
    update(dt) {
      clock += dt;
      let any = false;
      for (let i = 0; i < parts.length; i++) {
        const pt = parts[i];
        if (pt.held) { if (!pt.held.root?.parent) pt.held = null; else { pt.syncHeld(); pt.dirty = true; } }
        if (pt.fl) {
          const f = pt.fl;
          f.t += dt;
          const u = Math.min(1, f.t / f.dur);
          pt.pos.lerpVectors(pt.from, pt.to, u);
          pt.pos.y += f.arc * 4 * u * (1 - u);
          if (f.spin) pt.rx = f.rx0 + f.spin * u;
          if (u >= 1) pt.fl = null;
          pt.dirty = true;
        }
        if (pt.gr) {
          const g = pt.gr;
          g.t += dt;
          const u = Math.min(1, g.t / g.dur), e = u * u * (3 - 2 * u);
          pt.s = g.s0 + (g.s1 - g.s0) * e;
          if (u >= 1) pt.gr = null;
          pt.dirty = true;
        }
        if (pt.drive) { pt.drive(pt, clock); pt.dirty = true; }
        if (pt.dirty) { write(pt); pt.dirty = false; any = true; }
      }
      if (any) mesh.instanceMatrix.needsUpdate = true;
      if (colorDirty && mesh.instanceColor) { mesh.instanceColor.needsUpdate = true; colorDirty = false; }
      // the extras that follow parts
      if (rig.screenOn && rig.screenPart) placeScreen();
      if (rig.glowOn && rig.glowPart) { const gp = rig.glowPart, p = gp.pos; glow.position.set(p.x, LAYER.over + 0.002, p.z); glow.visible = gp.vis && gp.s > 0.3; }
    },
    clear() {
      for (const pt of parts) { pt.vis = false; write(pt); pt.held = null; pt.drive = null; }
      parts.length = 0; used = 0; mesh.count = out.count = 0;
      mesh.instanceMatrix.needsUpdate = true;
      if (inScene) { scene.remove(mesh); scene.remove(out); inScene = false; }
      rig.stringsOn(0); rig.screenShow(null); rig.glowShow(null); rig.chalkShow(false);
    },
    stats: () => ({ parts: parts.length, boxes: used, calls: (inScene ? 2 : 0) + (strings?.parent ? 1 : 0) + (screen?.parent ? 1 : 0) + (glow?.parent ? 1 : 0) + (chalk?.parent ? 1 : 0) }),
    get clock() { return clock; },
  };

  // ---- strings: one LineSegments, up to 12 segments, written in place
  let strings = null, strPos = null;
  rig.stringsOn = (n) => {
    if (!n) { if (strings?.parent) strings.removeFromParent(); return null; }
    if (!strings) {
      strPos = new Float32Array(12 * 6);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(strPos, 3).setUsage(THREE.DynamicDrawUsage));
      strings = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#4A3A2A', transparent: true, opacity: 0.75 }));
      strings.frustumCulled = false; strings.name = 'event-strings';
    }
    strings.geometry.setDrawRange(0, Math.min(12, n) * 2);
    if (!strings.parent) scene.add(strings);
    return strings;
  };
  /** string i from (ax, ay, az) to (bx, by, bz) */
  rig.string = (i, ax, ay, az, bx, by, bz) => {
    if (!strPos || i >= 12) return;
    const o = i * 6;
    strPos[o] = ax; strPos[o + 1] = ay; strPos[o + 2] = az; strPos[o + 3] = bx; strPos[o + 4] = by; strPos[o + 5] = bz;
    strings.geometry.attributes.position.needsUpdate = true;
  };

  // ---- the TV picture: a 64 x 40 canvas on a plane in front of the TV's bezel (4 redraws a second)
  let screen = null, scrCv = null, scrG = null, scrTex = null;
  rig.screenShow = (part) => {
    rig.screenPart = part; rig.screenOn = !!part;
    if (!part) { if (screen?.parent) screen.removeFromParent(); return null; }
    if (!screen) {
      scrCv = document.createElement('canvas'); scrCv.width = 64; scrCv.height = 40; scrG = scrCv.getContext('2d');
      scrTex = new THREE.CanvasTexture(scrCv); scrTex.colorSpace = THREE.SRGBColorSpace; scrTex.minFilter = THREE.LinearFilter; scrTex.generateMipmaps = false;
      screen = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.31), basic('#ffffff', { map: scrTex }));
      screen.name = 'event-tv';
    }
    if (!screen.parent) scene.add(screen);
    return scrG;
  };
  rig.screenDraw = (fn) => { if (!scrG) return; fn(scrG, scrCv.width, scrCv.height); scrTex.needsUpdate = true; };
  function placeScreen() {
    const p = rig.screenPart;
    const c = Math.cos(p.ry), s = Math.sin(p.ry);
    screen.visible = p.vis && p.s > 0.5;
    screen.position.set(p.pos.x + 0.17 * s * p.s, p.pos.y + 0.55 * p.s, p.pos.z + 0.17 * c * p.s);
    screen.rotation.set(0, p.ry, 0);
    screen.scale.setScalar(p.s);
  }

  // ---- the lantern's glow on the ground (night): an additive disc, no real light
  let glow = null;
  rig.glowShow = (part) => {
    rig.glowPart = part; rig.glowOn = !!part;
    if (!part) { if (glow?.parent) glow.removeFromParent(); return null; }
    if (!glow) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
      gr.addColorStop(0, 'rgba(255,214,140,0.85)'); gr.addColorStop(0.45, 'rgba(255,190,110,0.35)'); gr.addColorStop(1, 'rgba(255,170,90,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const m = basic('#ffffff', { map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
      glow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), m);
      glow.rotation.x = -Math.PI / 2; glow.renderOrder = 2; glow.name = 'event-glow';
    }
    if (!glow.parent) scene.add(glow);
    return glow;
  };

  // ---- chalk lines for the race: two flat strips (one instanced quad), at y LAYER.over (over the stacked ground
  // paint, ground-layers.js) with polygonOffset
  let chalk = null;
  rig.chalkShow = (on, a = null, b = null, h = 0, w = 2.6) => {
    if (!on) { if (chalk?.parent) chalk.removeFromParent(); return null; }
    if (!chalk) {
      const g = new THREE.PlaneGeometry(1, 0.09); g.rotateX(-Math.PI / 2);
      const m = basic('#FFFDF8', { transparent: true, opacity: 0.85, depthWrite: false });
      m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
      chalk = new THREE.InstancedMesh(g, m, 2); chalk.frustumCulled = false; chalk.renderOrder = 1; chalk.name = 'event-chalk';
    }
    if (a && b) {
      for (const [i, p] of [[0, a], [1, b]]) { E.set(0, h, 0); Q.setFromEuler(E); M.compose(V.set(p.x, LAYER.over, p.z), Q, S.set(w, 1, 1)); chalk.setMatrixAt(i, M); }
      chalk.instanceMatrix.needsUpdate = true;
    }
    if (!chalk.parent) scene.add(chalk);
    return chalk;
  };
  /** draw-in: 0..1 of each line's length shown */
  rig.chalkGrow = (u, a, b, h, w = 2.6) => {
    if (!chalk) return;
    for (const [i, p] of [[0, a], [1, b]]) { E.set(0, h, 0); Q.setFromEuler(E); M.compose(V.set(p.x, LAYER.over, p.z), Q, S.set(Math.max(0.001, w * u), 1, 1)); chalk.setMatrixAt(i, M); }
    chalk.instanceMatrix.needsUpdate = true;
  };

  rig.dispose = () => { rig.clear(); geo.dispose(); out.geometry.dispose?.(); strings?.geometry.dispose(); screen?.geometry.dispose(); scrTex?.dispose(); glow?.geometry.dispose(); chalk?.geometry.dispose(); };
  return rig;
}
