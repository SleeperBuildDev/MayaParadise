// Day 8's local outdoor shells: the Junction has no building fronts for Ma Thida's letter room or Ko Min's
// corner house yet (regions/junction.js is empty), so the day draws two small ones itself until the district
// builder adds them (SHARED NEEDS in the day's report). Same kit as props2.js: vertex-coloured boxes merged with
// VoxelBuilder (one toon draw call + one outline), feet at y = 0, front +Z. Original art, no text on them.
//
//   houseFront({ w, d, h, wall, wallD, trim, roof, roofD, door: { x, w, h, color }, sign: 'envelope' | 'shop' | null, win })
//     -> { root, door: { x, z } (local threshold on the front face), dispose }
//   WALKON_LOOKS   looks for the unnamed people at the well queue (no lines; people.js specs)
import * as THREE from '../game/three.js';
import { VoxelBuilder, jitter } from '../game/voxel.js';

export function houseFront({
  w = 4.4, d = 3.6, h = 3.0, wall = '#F1ECE1', wallD = '#D9D2C2', trim = '#3F6684', roof = '#8E4A2C', roofD = '#6E3A22',
  door = {}, sign = null, win = 1.2,
} = {}) {
  const root = new THREE.Group();
  root.name = 'd8House';
  const v = new VoxelBuilder();
  const Z = d / 2, y0 = 0.16;
  const dx = door.x ?? 0, dw = door.w ?? 0.9, dh = door.h ?? 2.0, dc = door.color ?? trim;
  // plinth and walls
  v.boxMin(-w / 2 - 0.08, 0, -Z - 0.08, w / 2 + 0.08, y0, Z + 0.1, '#B9B2A2');
  v.boxMin(-w / 2, y0, -Z, dx - dw / 2, h, Z, wall);
  v.boxMin(dx + dw / 2, y0, -Z, w / 2, h, Z, wall);
  v.boxMin(dx - dw / 2, y0 + dh, -Z, dx + dw / 2, h, Z, wall);
  v.boxMin(dx - dw / 2, y0, -Z, dx + dw / 2, y0 + dh, Z - 0.6, wall); // the back of the doorway: a short dark hall
  v.boxMin(dx - dw / 2 + 0.02, y0, Z - 0.6, dx + dw / 2 - 0.02, y0 + 0.01, Z, '#C9A24A'); // lamplight on the hall floor
  v.boxMin(dx - dw / 2 + 0.02, y0 + 0.01, Z - 0.62, dx + dw / 2 - 0.02, y0 + dh - 0.02, Z - 0.58, '#3A2A20');
  // newsprint columns faintly on the side walls (the Junction's paper)
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) v.box(s * (w / 2 + 0.004), y0 + 0.6 + i * 0.5, -Z + 0.6 + (i % 2) * 0.4, 0.008, 0.06, d * 0.5, jitter('#C9C2B2', 0.04, i));
  // skirting, cornice, quoins
  v.boxMin(-w / 2 - 0.01, y0, Z - 0.01, dx - dw / 2 - 0.1, y0 + 0.28, Z + 0.03, wallD);
  v.boxMin(dx + dw / 2 + 0.1, y0, Z - 0.01, w / 2 + 0.01, y0 + 0.28, Z + 0.03, wallD);
  v.boxMin(-w / 2 - 0.05, h - 0.16, -Z - 0.05, w / 2 + 0.05, h, Z + 0.08, trim);
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) v.box(s * (w / 2 - 0.08), y0 + 0.25 + k * 0.52, Z + 0.02, 0.18, 0.22, 0.05, wallD);
  // door frame and the leaf, swung open against the wall
  v.boxMin(dx - dw / 2 - 0.09, y0, Z, dx - dw / 2, y0 + dh + 0.09, Z + 0.07, dc);
  v.boxMin(dx + dw / 2, y0, Z, dx + dw / 2 + 0.09, y0 + dh + 0.09, Z + 0.07, dc);
  v.boxMin(dx - dw / 2 - 0.09, y0 + dh, Z, dx + dw / 2 + 0.09, y0 + dh + 0.12, Z + 0.08, dc);
  v.boxMin(dx - dw / 2 - 0.12, y0 + dh * 0.5 - dh / 2, Z + 0.07, dx - dw / 2 - 0.06, y0 + dh, Z + 0.07 + dw * 0.92, jitter(dc, 0.05, 3));
  v.box(dx - dw / 2 - 0.13, y0 + dh * 0.5, Z + 0.07 + dw * 0.8, 0.02, 0.05, 0.05, '#C9A24A'); // its knob
  // a doormat and a step
  v.boxMin(dx - dw / 2, 0, Z + 0.1, dx + dw / 2, 0.06, Z + 0.45, '#B79A6A');
  // the window (the side away from the door)
  if (win) {
    const wx = dx > 0 ? -w / 2 + 0.45 + win / 2 : w / 2 - 0.45 - win / 2;
    v.boxMin(wx - win / 2, 1.1, Z - 0.01, wx + win / 2, 1.95, Z + 0.03, '#CFE0E6');
    v.boxMin(wx - win / 2 - 0.07, 1.03, Z, wx + win / 2 + 0.07, 1.1, Z + 0.1, trim); // sill
    v.boxMin(wx - 0.02, 1.1, Z + 0.02, wx + 0.02, 1.95, Z + 0.05, trim);
    v.boxMin(wx - win / 2, 1.5, Z + 0.02, wx + win / 2, 1.54, Z + 0.05, trim);
    v.boxMin(wx - win / 2 - 0.07, 1.95, Z, wx + win / 2 + 0.07, 2.02, Z + 0.06, trim);
  }
  // a stepped blocky roof, front to back
  for (let k = 0; k < 4; k++) {
    const inset = k * 0.42;
    v.boxMin(-w / 2 - 0.22 + k * 0.05, h + k * 0.17, -Z - 0.22 + inset, w / 2 + 0.22 - k * 0.05, h + k * 0.17 + 0.17, Z + 0.3 - inset, k % 2 ? roofD : roof);
  }
  // the sign
  const sy = y0 + dh + 0.22;
  if (sign === 'envelope') {
    // a painted envelope over the door: paper, a V of the flap, a red seal
    v.boxMin(dx - 0.42, sy, Z + 0.03, dx + 0.42, sy + 0.5, Z + 0.06, '#FFFDF8');
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      v.box(dx - 0.38 + t * 0.38, sy + 0.46 - t * 0.24, Z + 0.065, 0.12, 0.035, 0.01, '#9AB4C8');
      v.box(dx + 0.38 - t * 0.38, sy + 0.46 - t * 0.24, Z + 0.065, 0.12, 0.035, 0.01, '#9AB4C8');
    }
    v.box(dx, sy + 0.22, Z + 0.07, 0.11, 0.11, 0.02, '#B8423C');
  } else if (sign === 'shop') {
    // a shop sign half repainted (Ko Min is at it): one half bright, one half faded
    const x0 = -w / 2 + 0.3, x1 = w / 2 - 0.3, ys = h - 0.78;
    v.boxMin(x0, ys, Z + 0.03, x1, ys + 0.5, Z + 0.08, '#E9DCC0');
    const mid = (x0 + x1) / 2;
    for (let k = 0; k < 5; k++) {
      v.box(x0 + 0.25 + k * ((mid - x0 - 0.3) / 4), ys + 0.25, Z + 0.085, 0.16, 0.22, 0.01, ['#6E1F2A', '#C9A24A', '#2F7C7A', '#6E1F2A', '#C9A24A'][k]);
      v.box(mid + 0.25 + k * ((x1 - mid - 0.3) / 4), ys + 0.25, Z + 0.085, 0.16, 0.22, 0.01, ['#C4B8B4', '#D8CDB0', '#B8C8C6', '#C4B8B4', '#D8CDB0'][k]);
    }
  }
  const mesh = v.mesh({ px: 1.4 });
  root.add(mesh);
  return {
    root,
    door: { x: dx, z: Z },
    dispose() { root.traverse((o) => o.geometry?.dispose?.()); },
  };
}

/** Unnamed people at the well queue (looks only; no lines). people.js SPEC. */
export const WALKON_LOOKS = [
  { age: 'adult', build: 'mid', skin: 2, hair: 'short', top: 'shirt', topColor: 'white', bottom: 'longyi', bottomColor: 'navy' },
  { age: 'adult', build: 'slim', skin: 1, hair: 'bun', top: 'blouse', topColor: 'rose', bottom: 'htamein', bottomColor: 'brown', extras: ['thanaka'] },
  { age: 'elder', build: 'mid', skin: 3, hair: 'short', hairColor: 'grey', top: 'eingyi', topColor: 'cream', bottom: 'longyi', bottomColor: 'olive' },
];
