// Diary Garden: the story buildings fitted to the one street plan (regions/garden.js), plus a few street things the
// district art (../art/garden.js) has no kind for. The art file's kiln shed, drying hall and garden house are drawn
// for wider plots than the kiln square and U Hpo Htaw's plot give them (their windows and side stacks are written
// for w 15 / 15 / 4.6); these are the same buildings laid out by their own width, door where the plan wants it.
// Same kit and look as the art file: boxes into the chunk's merged Geo, toon + outline, fronts +Z, feet at y = 0.
// Original art. Only kit.js and voxel.js are imported (a region file must never import build.js or region.js).
//
//   GARDEN_FIT_ART   gdKilnYard (kiln shed + packing room), gdHall (drying hall), gdHpHouse (U Hpo Htaw's garden
//                    house), gdGateArch (the creeper arch over the clasp road)
//   GARDEN_FIT_PROP  gdPotRack, gdHandcart, gdBaskets, gdClayHeap, gdSeedStand, gdTubs, gdSignPost, gdStool
import { shade, rng } from '../kit.js';
import { K, SH, obBox, obCircle } from '../art/garden.js';

// ---------------------------------------------------------------------------------
// helpers (the art file's, kept private there)
// ---------------------------------------------------------------------------------
function wp(g, lx, lz) { return [g.tx + lx * g.tc + lz * g.ts, g.tz - lx * g.ts + lz * g.tc]; }
function glow(g, ctx, lx, y, lz) { const [x, z] = wp(g, lx, lz); ctx.glows.push(x, y, z); }
function tinGable(g, W, D, y0, rise, col, { over = 0.4, rust = 0, seed = 1, gable = null } = {}) {
  const half = D / 2 + over, ang = Math.atan2(rise, D / 2), slope = half / Math.cos(ang);
  const cy = y0 + rise / 2 + 0.05, WW = W + over * 2, dark = shade(col, 0.84);
  for (const sz of [-1, 1]) g.boxR(0, cy, (sz * half) / 2, WW, 0.1, slope, col, sz * ang, 0, 0);
  const n = Math.max(4, Math.round(WW / 0.5)), ny = Math.cos(ang) * 0.065, nz = Math.sin(ang) * 0.065;
  for (let i = 0; i <= n; i++) g.boxR(-WW / 2 + 0.08 + (i * (WW - 0.16)) / n, cy + ny, half / 2 + nz, 0.05, 0.035, slope - 0.04, dark, ang, 0, 0);
  const r = rng(seed);
  for (let k = 0; k < rust; k++) {
    const t = 0.25 + r() * 0.6, x = (r() - 0.5) * (WW - 1.2);
    g.boxR(x, y0 + rise * (1 - t) + 0.12 + ny, half * t + nz * 0.5, 0.5 + r() * 0.6, 0.02, 0.35 + r() * 0.3, K.rust, ang, 0, 0);
  }
  g.box(0, y0 + rise + 0.1, 0, WW + 0.04, 0.12, 0.24, shade(col, 0.68));
  if (gable) for (let i = 0; i < 4; i++) g.box(0, y0 + (rise * (i + 0.5)) / 4, 0, W - 0.04, rise / 4, D * (1 - (i + 0.5) / 4), gable);
}
function win(g, x, y, z, w, h, shut, { shutters = true, lit = false, curtain = null, box = null } = {}) {
  g.box(x, y, z, w + 0.14, h + 0.14, 0.08, K.white);
  g.box(x, y, z + 0.02, w, h, 0.06, lit ? '#F6D58E' : K.glass);
  if (curtain) g.box(x - w * 0.22, y + 0.02, z + 0.055, w * 0.42, h * 0.92, 0.02, curtain);
  g.box(x, y, z + 0.06, 0.04, h, 0.03, K.white);
  g.box(x, y + 0.03, z + 0.06, w, 0.04, 0.03, K.white);
  g.box(x, y - h / 2 - 0.08, z + 0.08, w + 0.26, 0.06, 0.18, K.woodD);
  if (shutters) for (const sx of [-1, 1]) {
    g.box(x + sx * (w / 2 + 0.2), y, z + 0.04, 0.3, h + 0.04, 0.05, shut);
    for (let k = -1; k <= 1; k++) g.box(x + sx * (w / 2 + 0.2), y + k * (h / 3.2), z + 0.075, 0.24, 0.03, 0.02, shade(shut, 0.8));
  }
  if (box) {
    g.box(x, y - h / 2 - 0.22, z + 0.2, w + 0.2, 0.18, 0.26, K.woodL);
    for (let i = 0; i < 4; i++) g.box(x - w / 2 + 0.08 + i * ((w - 0.16) / 3), y - h / 2 - 0.06, z + 0.2, 0.18, 0.14, 0.16, i % 2 ? box : K.leafL);
  }
}
function door(g, x, z, w, h, col, { open = 0, frame = K.woodD, knob = K.gold, planks = true, y0 = 0 } = {}) {
  g.box(x, y0 + h / 2 + 0.04, z, w + 0.18, h + 0.1, 0.1, frame);
  if (open > 0) {
    g.box(x, y0 + h / 2, z + 0.02, w, h, 0.08, '#3B2C22');
    g.box(x, y0 + 0.02, z + 0.02, w, 0.04, 0.12, '#5A4636');
    const a = open * 1.35, hx = x - w / 2, hz = z - 0.02;
    g.box(hx + (w / 2) * Math.cos(a) * 0.96, y0 + h / 2, hz - (w / 2) * Math.sin(a) * 0.96, w * 0.96, h - 0.04, 0.05, col, a);
  } else {
    g.box(x, y0 + h / 2, z + 0.03, w, h, 0.06, col);
    if (planks) for (let k = 1; k < 4; k++) g.box(x - w / 2 + (k * w) / 4, y0 + h / 2, z + 0.065, 0.02, h - 0.06, 0.012, shade(col, 0.8));
    g.box(x, y0 + h * 0.3, z + 0.07, w - 0.06, 0.06, 0.02, shade(col, 0.85));
    g.box(x, y0 + h * 0.75, z + 0.07, w - 0.06, 0.06, 0.02, shade(col, 0.85));
    g.box(x + w / 2 - 0.12, y0 + h * 0.5, z + 0.085, 0.06, 0.06, 0.04, knob);
  }
}
function pole(g, x0, y0, z0, x1, y1, z1, t = 0.06, col = K.bamboo) {
  const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, L = Math.hypot(dx, dy, dz);
  g.boxR((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, L, t, t, col, 0, Math.atan2(-dz, dx), Math.atan2(dy, Math.hypot(dx, dz)));
}
function crate(g, x, y, z, w = 0.6, h = 0.42, d = 0.45, col = K.woodL) {
  g.box(x, y + h / 2, z, w, h, d, col);
  g.box(x, y + h * 0.5, z + d / 2 + 0.005, w - 0.06, 0.06, 0.01, shade(col, 0.82));
}
function pot(g, x, y, z, s, col) {
  g.box(x, y + 0.17 * s, z, 0.34 * s, 0.34 * s, 0.34 * s, col);
  g.box(x, y + 0.36 * s, z, 0.22 * s, 0.05 * s, 0.22 * s, shade(col, 0.8));
}
function waterJar(g, x, z, s = 1, col = '#7A4A2E') {
  g.box(x, 0.3 * s, z, 0.52 * s, 0.5 * s, 0.52 * s, col);
  g.box(x, 0.3 * s, z, 0.6 * s, 0.26 * s, 0.6 * s, shade(col, 1.08));
  g.box(x, 0.6 * s, z, 0.34 * s, 0.1 * s, 0.34 * s, shade(col, 0.85));
  g.box(x, 0.66 * s, z, 0.44 * s, 0.03, 0.44 * s, K.woodL);
}
function creeper(g, x, z, h, r, flower = null) {
  for (let y = 0.3, k = 0; y < h; y += 0.42, k++) {
    const dx = Math.sin(k * 1.7 + x) * 0.32;
    g.box(x + dx, y, z + 0.06, 0.34 + r() * 0.14, 0.28, 0.08, k % 2 ? K.leafD : K.leaf);
    if (flower && k % 3 === 1) g.box(x + dx + 0.12, y + 0.08, z + 0.11, 0.08, 0.08, 0.04, flower);
  }
}

// ---------------------------------------------------------------------------------
// BUILDINGS
// ---------------------------------------------------------------------------------

/** The big kiln's shed fitted to the square: open-fronted tin shed round the brick bottle kiln (mouth to the square,
 * chimney through the roof), the packing room (`packroom`) closed in at the east end with its low plank door.
 * it: { w: 10, d: 7, kx: -1.2 (kiln centre), bay: 3.6 (packing-room width), packDoor: (local x) } */
function kilnYard(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 3.3, FZ = D / 2;
  const KX = it.kx ?? -1.2, KZ = -0.7, BX0 = W / 2 - (it.bay ?? 3.6), PDX = it.packDoor ?? BX0 + 1.6;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.4, D / 2 + 0.7, 0.004, SH);
  f.flat(-W / 2 + 0.2, -D / 2 + 0.2, BX0, D / 2 - 0.1, 0.007, '#D8C4A2');
  for (let k = 0; k < 7; k++) f.flatR(KX + Math.cos(k * 2.3) * 2.0, FZ + 0.6 + Math.sin(k * 1.7) * 0.5, 0.5, 0.3, 0.009, '#9C8670', k);
  // back and west walls: brick to 1.4, planks above
  g.box(0, 0.7, -D / 2 + 0.15, W, 1.4, 0.3, K.brick);
  g.box(0, 2.35, -D / 2 + 0.12, W, 1.9, 0.18, K.woodG);
  g.box(-W / 2 + 0.15, 0.7, 0, 0.3, 1.4, D - 0.2, K.brick);
  g.box(-W / 2 + 0.12, 2.35, 0, 0.18, 1.9, D - 0.2, K.woodG);
  for (let x = -W / 2 + 1; x < W / 2; x += 1.1) g.box(x, 1.41, -D / 2 + 0.31, 0.5, 0.04, 0.03, K.brickD);
  for (const x of [-W / 2 + 0.2, KX + 2.5, BX0]) { g.box(x, H / 2, FZ - 0.2, 0.26, H, 0.26, K.woodD); g.box(x, 0.12, FZ - 0.2, 0.4, 0.24, 0.4, K.stone); }
  g.box(0, H - 0.1, FZ - 0.2, W, 0.24, 0.3, K.woodD);
  tinGable(g, W, D, H, 1.3, K.tin, { over: 0.5, rust: 4, seed: 31, gable: K.woodG });
  // the bottle kiln
  const rings = [[0.0, 0.5, 3.4], [0.5, 0.6, 3.7], [1.1, 0.6, 3.8], [1.7, 0.6, 3.6], [2.3, 0.5, 3.1], [2.8, 0.45, 2.5], [3.25, 0.45, 1.9], [3.7, 0.5, 1.5]];
  rings.forEach(([y, h, s], i) => {
    g.box(KX, y + h / 2, KZ, s, h, s * 0.94, i % 2 ? K.brickD : K.brick);
    g.box(KX, y + h / 2, KZ, s * 0.72, h, s * 1.0, i % 2 ? K.brickD : K.brick);
  });
  for (const y of [0.98, 2.2]) g.box(KX, y, KZ, 3.9 - (y > 2 ? 0.8 : 0), 0.08, 3.6 - (y > 2 ? 0.8 : 0), K.iron);
  g.box(KX, 5.5, KZ, 1.1, 3.8, 1.1, K.brick);
  for (let y = 4.2; y < 7.3; y += 0.6) g.box(KX, y, KZ, 1.14, 0.06, 1.14, K.brickD);
  g.box(KX, 7.45, KZ, 1.34, 0.18, 1.34, K.brickD);
  g.box(KX, 7.6, KZ, 0.84, 0.14, 0.84, K.soot);
  { const [sx, sz] = wp(g, KX, KZ); ctx.smoke.push(sx, 7.7, sz); }
  const MZ = KZ + 1.85;
  g.box(KX, 0.6, MZ, 1.1, 1.2, 0.14, K.soot);
  g.box(KX, 1.28, MZ + 0.02, 0.85, 0.2, 0.12, K.soot);
  g.box(KX, 1.42, MZ + 0.04, 1.4, 0.16, 0.16, K.brickL);
  for (const sx of [-1, 1]) g.box(KX + sx * 0.65, 0.7, MZ + 0.04, 0.2, 1.4, 0.16, K.brickL);
  g.box(KX, 0.14, MZ + 0.06, 0.74, 0.12, 0.08, K.coal);
  g.box(KX - 0.2, 0.22, MZ + 0.07, 0.3, 0.08, 0.06, K.mustard);
  glow(g, ctx, KX, 0.4, MZ + 0.3);
  g.boxR(KX + 1.15, 0.55, MZ + 0.2, 0.85, 1.1, 0.06, K.iron, -0.15, 0.3, 0);
  // fired pots on planks along the west wall, a ladder against the kiln, saggar stacks in the front-west corner
  for (let k = 0; k < 2; k++) {
    g.box(-W / 2 + 0.7, 0.55 + k * 0.7, -0.3, 0.55, 0.06, D - 2.2, K.woodL);
    for (let z = -D / 2 + 1.4; z < D / 2 - 1.2; z += 0.55) {
      const c = (Math.round(z * 3) + k) % 3 ? K.terra : K.clay;
      g.box(-W / 2 + 0.7, 0.76 + k * 0.7, z, 0.34, 0.36, 0.34, c);
      g.box(-W / 2 + 0.7, 0.97 + k * 0.7, z, 0.2, 0.06, 0.2, shade(c, 0.8));
    }
  }
  pole(g, KX + 1.5, 0.05, KZ + 0.9, KX + 1.05, 2.8, KZ + 0.3, 0.07, K.woodL);
  pole(g, KX + 1.9, 0.05, KZ + 0.9, KX + 1.45, 2.8, KZ + 0.3, 0.07, K.woodL);
  for (let k = 1; k < 6; k++) pole(g, KX + 1.5 - k * 0.08, k * 0.46, KZ + 0.9 - k * 0.11, KX + 1.9 - k * 0.08, k * 0.46, KZ + 0.9 - k * 0.11, 0.05, K.woodL);
  for (const [x, z, n] of [[-W / 2 + 1.0, FZ - 1.0, 4], [-W / 2 + 1.6, FZ - 0.5, 3], [-W / 2 + 0.95, FZ - 0.35, 2]]) for (let i = 0; i < n; i++) g.box(x, 0.17 + i * 0.32, z, 0.46, 0.3, 0.46, i % 2 ? K.clay : '#C9A27C');
  // the packing room: the east bay closed in with planks, a low plank door, straw underneath, a little window
  const bw = W / 2 - BX0;
  g.box(BX0 + bw / 2, H / 2, FZ - 0.1, bw, H, 0.16, K.woodL);
  for (let x = BX0 + 0.3; x < W / 2 - 0.1; x += 0.36) g.box(x, H / 2, FZ - 0.01, 0.025, H - 0.1, 0.02, shade(K.woodL, 0.82));
  g.box(W / 2 - 0.08, H / 2, 0, 0.16, H, D - 0.1, K.woodL);
  door(g, PDX, FZ, 0.95, 1.62, K.woodD, { frame: K.woodG });
  for (let k = 0; k < 9; k++) g.boxR(PDX - 0.42 + k * 0.1, 0.03, FZ + 0.12 + (k % 3) * 0.05, 0.035, 0.03, 0.26, k % 2 ? K.straw : K.strawD, 0, (k - 4) * 0.18, 0);
  const wx = PDX + (PDX - BX0 > 1.3 ? -0.95 : 1.0);
  win(g, wx, 2.15, FZ, 0.55, 0.45, K.woodD, { shutters: false });
  crate(g, PDX + 0.95, 0, FZ + 0.4, 0.55, 0.4, 0.45);
  g.box(PDX + 0.95, 0.5, FZ + 0.4, 0.42, 0.14, 0.32, K.straw);
  ctx.signs.push({ x: -W / 2 + 2.0, y: H - 0.1, z: FZ + 0.0, w: 2.2, h: 0.55, lines: [{ text: 'မီးဖိုကြီး', size: 50 }, { text: 'The Big Kiln', size: 22, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#F3E9D6' });
}

/** The kiln's drying hall fitted to the square: long, low, tiled; wide double doors at it.doorX propped open on racks of
 * green pots; slatted windows wherever the wall has room; the chalk slate on the doorpost. it: { w, d, doorX } */
function hall(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 2.7, FZ = D / 2, DW = 2.4, DX = it.doorX ?? 0;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.5, D / 2 + 0.8, 0.004, SH);
  f.flat(DX - DW / 2 - 0.4, FZ, DX + DW / 2 + 0.4, FZ + 1.5, 0.007, '#E6D6BE');
  g.box(0, 0.3, 0, W + 0.1, 0.6, D + 0.1, K.brick);
  for (let x = -W / 2 + 0.6; x < W / 2; x += 1.2) g.box(x, 0.3, FZ + 0.06, 0.04, 0.5, 0.02, K.brickD);
  g.box(0, H / 2 + 0.3, 0, W, H - 0.6, D, K.wall);
  for (const x of [-W / 2, W / 2]) g.box(x, H / 2, FZ + 0.02, 0.2, H, 0.18, K.woodD);
  // the doorway: dim inside, three tiers of green pots, two leaves propped wide open by stones
  g.box(DX, 1.15, FZ + 0.01, DW, 2.2, 0.06, '#4E3E32');
  for (let k = 0; k < 3; k++) {
    g.box(DX, 0.4 + k * 0.6, FZ - 0.5, DW - 0.3, 0.05, 0.4, K.woodL);
    for (let x = -DW / 2 + 0.35; x < DW / 2 - 0.2; x += 0.42) g.box(DX + x, 0.58 + k * 0.6, FZ - 0.5, 0.28, 0.3, 0.28, k % 2 ? K.potG : K.potGD);
  }
  for (const sx of [-1, 1]) {
    g.box(DX + sx * (DW / 2 + 0.5), 1.1, FZ + 0.58, 0.08, 2.2, 1.1, K.teal, sx * 0.08);
    g.box(DX + sx * (DW / 2 + 0.55), 1.1, FZ + 0.58, 0.04, 1.6, 0.8, shade(K.teal, 0.85), sx * 0.08);
    g.box(DX + sx * (DW / 2 + 0.5), 0.1, FZ + 1.15, 0.24, 0.2, 0.24, K.stone);
  }
  g.box(DX, 2.3, FZ + 0.06, DW + 0.3, 0.16, 0.12, K.woodD);
  // slatted windows where the wall has room (never over the door or its leaves)
  for (let x = -W / 2 + 1.0; x <= W / 2 - 0.9; x += 1.7) {
    if (Math.abs(x - DX) < DW / 2 + 1.35) continue;
    g.box(x, 1.65, FZ + 0.01, 1.0, 0.85, 0.06, '#5B4636');
    for (let k = 0; k < 5; k++) g.boxR(x, 1.32 + k * 0.17, FZ + 0.06, 0.92, 0.03, 0.12, K.teal, -0.5, 0, 0);
    g.box(x, 1.17, FZ + 0.1, 1.14, 0.06, 0.18, K.woodD);
  }
  for (let x = -W / 2 + 0.5; x < W / 2 - 0.3; x += 0.6) g.box(x, H - 0.18, FZ + 0.02, 0.3, 0.12, 0.04, '#6E5A48');
  // the long tiled roof (stepped hip, terracotta)
  const w0 = W + 0.7, d0 = D + 0.8;
  g.box(0, H + 0.06, 0, w0 + 0.1, 0.12, d0 + 0.1, K.woodD);
  for (let i = 0; i < 5; i++) {
    const k = i / 5, w = w0 - k * 3.0, d = d0 * (1 - k * 0.9), y = H + 0.12 + 0.24 * (i + 0.5);
    g.box(0, y, 0, w, 0.24, d, i % 2 ? K.terra : shade(K.terra, 0.9));
    g.box(0, y + 0.1, d / 2 - 0.06, w + 0.02, 0.07, 0.14, shade(K.terra, 1.16));
  }
  g.box(0, H + 0.12 + 0.24 * 5 + 0.06, 0, w0 - 2.8, 0.14, 0.26, K.goldD);
  // lamps by the door, the doorpost slate, pots drying outside on a plank (east of the door, if there is room)
  for (const sx of [-1, 1]) { g.box(DX + sx * (DW / 2 + 0.22), 2.1, FZ + 0.18, 0.18, 0.24, 0.16, K.goldD); glow(g, ctx, DX + sx * (DW / 2 + 0.22), 2.1, FZ + 0.3); }
  g.box(DX + DW / 2 + 0.25, 1.35, FZ + 0.1, 0.6, 0.46, 0.05, K.woodD);
  ctx.signs.push({ x: DX + DW / 2 + 0.25, y: 1.35, z: FZ + 0.14, w: 0.54, h: 0.4, lines: [{ text: 'အိုး', size: 64, color: '#F3EEE2' }, { text: 'လှမ်းဆောင်', size: 46, color: '#F3EEE2' }], bg: '#3E4A3F', border: null, width: 256, height: 192 });
  const px0 = DX + DW / 2 + 1.2, px1 = W / 2 - 0.4;
  if (px1 - px0 > 1.2) {
    g.box((px0 + px1) / 2, 0.18, FZ + 0.6, px1 - px0, 0.06, 0.55, K.woodL);
    for (const x of [px0 + 0.2, px1 - 0.2]) g.box(x, 0.08, FZ + 0.6, 0.26, 0.16, 0.45, K.brick);
    for (let x = px0 + 0.25; x < px1 - 0.1; x += 0.46) { g.box(x, 0.38, FZ + 0.6, 0.32, 0.34, 0.32, K.potG); g.box(x, 0.57, FZ + 0.6, 0.2, 0.05, 0.2, K.potGD); }
  }
  pole(g, -W / 2 + 0.3, 0, FZ + 0.25, -W / 2 + 0.55, 1.5, FZ + 0.15, 0.05, K.woodL);
  g.box(-W / 2 + 0.28, 0.14, FZ + 0.27, 0.32, 0.26, 0.1, K.strawD);
}

/** U Hpo Htaw's garden house (`hpohtawshed`) fitted to his plot: small, whitewashed, tin-roofed; the plank door in the
 * middle of the south wall (seen straight through his gate), a lamp window west of it, the empty hook east of it,
 * a trowel on a nail, a rain barrel round the west side. it: { w: 3.0, d: 2.4 } */
function hpHouse(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 2.25, FZ = D / 2, r = rng(17);
  f.flat(-W / 2 - 0.3, -D / 2 - 0.2, W / 2 + 0.3, D / 2 + 0.6, 0.004, SH);
  g.box(0, 0.1, 0, W + 0.2, 0.2, D + 0.2, K.stone);
  g.box(0, H / 2 + 0.2, 0, W, H, D, K.wash);
  for (let x = -W / 2 + 0.3; x < W / 2; x += 0.42) g.box(x, H / 2 + 0.2, FZ + 0.005, 0.02, H - 0.1, 0.01, '#DDD0B8');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * W / 2, H / 2 + 0.2, sz * D / 2, 0.14, H, 0.14, K.woodD);
  g.box(0, 0.42, FZ + 0.006, W, 0.42, 0.012, '#B9A07A'); // mud wainscot
  tinGable(g, W, D, H + 0.2, 0.9, K.tin, { over: 0.4, rust: 4, seed: 23, gable: K.wash });
  door(g, 0, FZ, 0.85, 1.85, K.woodG, { y0: 0.2, frame: '#7E9A5A' });
  win(g, -W / 2 + 0.55, 1.45, FZ, 0.46, 0.5, K.green, { shutters: false });
  glow(g, ctx, -W / 2 + 0.55, 1.45, FZ + 0.2);
  // the empty hook (where something used to hang) and the pale patch round it; the trowel on its nail
  g.box(0.75, 1.55, FZ + 0.06, 0.05, 0.05, 0.1, K.iron);
  g.box(0.75, 1.5, FZ + 0.1, 0.04, 0.1, 0.04, K.iron);
  g.box(0.75, 1.25, FZ + 0.012, 0.16, 0.5, 0.008, '#EFE6D6');
  g.box(1.15, 1.2, FZ + 0.05, 0.05, 0.22, 0.03, K.woodD); g.box(1.15, 1.02, FZ + 0.06, 0.11, 0.16, 0.02, K.tinD);
  g.box(0, 0.1, FZ + 0.3, 0.95, 0.2, 0.4, K.stoneD);
  // round the west side: the rain barrel, a creeper up the corner, his hoe leaning (his own, not lent)
  waterJar(g, -W / 2 - 0.42, -D / 2 + 0.6, 1.0, '#5E6E66');
  creeper(g, -W / 2 + 0.2, FZ, 2.1, r, null);
  pole(g, W / 2 + 0.12, 0.02, -D / 2 + 0.5, W / 2 + 0.05, 1.45, -D / 2 + 0.3, 0.05, K.woodL);
  g.box(W / 2 + 0.13, 0.06, -D / 2 + 0.58, 0.05, 0.1, 0.24, K.iron);
}

/** The creeper arch over the clasp road (walk under it): two bamboo posts each side, the arch, leaves and flowers.
 * Tall, so it is ART (the cutaway fades it when it stands between the camera and Maya). it: { span: 5.2 } */
function gateArch(g, f, it) {
  const S = it.span || 5.2, H = 3.5, r = rng(it.seed || 5);
  for (const sx of [-1, 1]) for (const sz of [-0.22, 0.22]) { g.box((sx * S) / 2, H / 2, sz, 0.1, H, 0.1, K.bambooD); g.box((sx * S) / 2, 0.06, sz, 0.22, 0.12, 0.22, K.stone); }
  for (const sx of [-1, 1]) for (let y = 0.6; y < H; y += 0.7) g.box((sx * S) / 2, y, 0, 0.06, 0.06, 0.5, K.bamboo);
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a0 = (Math.PI * i) / n, a1 = (Math.PI * (i + 1)) / n;
    const xa = (-Math.cos(a0) * S) / 2, xb = (-Math.cos(a1) * S) / 2, ya = H + Math.sin(a0) * 0.9, yb = H + Math.sin(a1) * 0.9;
    g.boxR((xa + xb) / 2, (ya + yb) / 2, 0, Math.hypot(xb - xa, yb - ya) + 0.04, 0.08, 0.56, K.bamboo, 0, 0, Math.atan2(yb - ya, xb - xa));
    g.box((xa + xb) / 2, (ya + yb) / 2 + 0.12, (r() - 0.5) * 0.2, 0.46, 0.24, 0.62, i % 2 ? K.leaf : K.leafD);
    if (i % 2) g.box((xa + xb) / 2, (ya + yb) / 2 - 0.08, 0.3, 0.12, 0.12, 0.06, [K.rose, K.white, K.violet, K.mustard][i % 4]);
  }
  for (const sx of [-1, 1]) for (let y = 0.35; y < H; y += 0.46) {
    g.box((sx * S) / 2 + (r() - 0.5) * 0.1, y, 0.12 + (r() - 0.5) * 0.1, 0.26, 0.28, 0.56, r() < 0.5 ? K.leaf : K.leafD);
    if (r() < 0.3) g.box((sx * S) / 2, y + 0.1, 0.34, 0.1, 0.1, 0.05, K.rose);
  }
  f.flat(-S / 2 - 0.4, -0.5, S / 2 + 0.4, 0.6, 0.004, SH);
}

// ---------------------------------------------------------------------------------
// STREET THINGS
// ---------------------------------------------------------------------------------

/** A low drying rack of green pots: two planks on bricks, pots in rows (the kiln square). it: { len } */
function potRack(g, f, it) {
  const L = it.len || 2.6, r = rng(it.seed || 3);
  for (const [y, z] of [[0.22, -0.18], [0.62, 0.12]]) {
    g.box(0, y, z, L, 0.06, 0.42, K.woodL);
    for (const x of [-L / 2 + 0.2, L / 2 - 0.2]) g.box(x, y / 2, z, 0.26, y, 0.36, K.brick);
    for (let x = -L / 2 + 0.25; x < L / 2 - 0.1; x += 0.42) if (r() > 0.12) pot(g, x, y + 0.03, z, 0.85 + r() * 0.2, r() < 0.7 ? K.potG : K.clay);
  }
  f.flat(-L / 2 - 0.2, -0.5, L / 2 + 0.2, 0.5, 0.005, SH);
}
/** A two-wheeled hand cart, shafts down, loaded (pots in straw, or greens). it: { load: 'pots' | 'greens' | 'bales' } */
function handcart(g, f, it) {
  const r = rng(it.seed || 9);
  g.box(0, 0.62, 0, 1.6, 0.08, 0.9, K.woodL);
  for (const sz of [-1, 1]) g.box(0, 0.8, sz * 0.45, 1.6, 0.3, 0.05, K.wood);
  g.box(-0.8, 0.8, 0, 0.05, 0.3, 0.9, K.wood);
  for (const sz of [-1, 1]) {
    g.box(0.15, 0.42, sz * 0.52, 0.84, 0.84, 0.06, K.woodD);
    g.box(0.15, 0.42, sz * 0.56, 0.6, 0.6, 0.02, '#8E8173');
    pole(g, 0.8, 0.66, sz * 0.36, 1.85, 0.08, sz * 0.36, 0.07, K.woodD);
  }
  const load = it.load || 'pots';
  if (load === 'pots') {
    g.box(0, 0.72, 0, 1.4, 0.06, 0.8, K.straw);
    for (let i = 0; i < 6; i++) pot(g, -0.5 + (i % 3) * 0.45, 0.74, (i < 3 ? -0.18 : 0.18), 1.0, r() < 0.5 ? K.terra : K.potG);
  } else if (load === 'greens') {
    for (let i = 0; i < 8; i++) g.box(-0.55 + (i % 4) * 0.36, 0.78 + Math.floor(i / 4) * 0.12, (i % 2 ? 0.15 : -0.15), 0.32, 0.2, 0.3, r() < 0.5 ? K.leafL : K.leaf);
  } else {
    for (let i = 0; i < 3; i++) g.box(-0.45 + i * 0.45, 0.92, 0, 0.42, 0.5, 0.7, K.paper);
  }
  f.flat(-0.95, -0.6, 2.0, 0.6, 0.005, SH);
}
/** Baskets of the day's picking set out on the ground: chillies, gourds, greens, aubergines. it: { n } */
function baskets(g, f, it) {
  const n = it.n || 3, r = rng(it.seed || 5), fill = [K.red, K.gourd, K.leafL, '#6A3E7A', K.orange, K.mustard];
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.62, z = (r() - 0.5) * 0.15, c = fill[Math.floor(r() * fill.length)];
    g.box(x, 0.13, z, 0.5, 0.26, 0.5, K.bamboo);
    g.box(x, 0.27, z, 0.54, 0.04, 0.54, K.bambooD);
    for (let k = 0; k < 4; k++) g.box(x + ((k % 2) - 0.5) * 0.18, 0.31 + (k > 1 ? 0.05 : 0), z + (k > 1 ? 0.1 : -0.1), 0.16, 0.1, 0.14, c);
  }
  f.flat(-(n * 0.31) - 0.2, -0.4, n * 0.31 + 0.2, 0.42, 0.005, SH);
}
/** The kiln's clay heap under a weighted tarp, a spade in it, a trough of slip. */
function clayHeap(g, f) {
  g.box(0, 0.25, 0, 1.6, 0.5, 1.1, '#B98A64');
  g.box(0.05, 0.6, 0.05, 1.1, 0.3, 0.8, '#C49A72');
  g.boxR(-0.2, 0.62, -0.1, 1.5, 0.05, 1.0, '#5E7E7A', 0.15, 0, 0.08);
  for (const [x, z] of [[-0.75, -0.45], [0.7, 0.45]]) g.box(x, 0.12, z, 0.28, 0.24, 0.24, K.stoneD);
  pole(g, 0.45, 0.6, 0.15, 0.6, 1.6, 0.25, 0.05, K.woodL);
  g.box(0.42, 0.55, 0.13, 0.22, 0.3, 0.04, K.iron);
  g.box(1.25, 0.16, 0.0, 0.5, 0.32, 0.9, K.woodD); g.box(1.25, 0.31, 0, 0.42, 0.03, 0.8, '#D8B68C');
  f.flat(-1.0, -0.75, 1.65, 0.8, 0.005, SH);
}
/** A roadside seed stand: packets on a little stepped shelf, a tin for the money, a hand scale on a hook, a painted
 * board (canvas): "weigh it yourself". (Chapter 17: an honest weight needs no one watching.) */
function seedStand(g, f, it, ctx) {
  for (const sx of [-1, 1]) g.box(sx * 0.55, 0.55, 0, 0.07, 1.1, 0.07, K.woodD);
  for (let k = 0; k < 3; k++) {
    g.box(0, 0.42 + k * 0.24, -0.1 + k * 0.1 - 0.1, 1.1, 0.04, 0.26, K.woodL);
    for (let i = 0; i < 5; i++) g.box(-0.44 + i * 0.22, 0.52 + k * 0.24, -0.1 + k * 0.1 - 0.12, 0.14, 0.16, 0.02, [K.white, K.cream, '#FCE6C4', K.white][(i + k) % 4]);
  }
  g.box(0.32, 0.95, 0.14, 0.14, 0.14, 0.14, K.tinG);
  g.box(-0.62, 1.05, 0.1, 0.03, 0.3, 0.03, K.iron); g.box(-0.62, 0.86, 0.1, 0.22, 0.03, 0.22, K.brass);
  g.box(0, 1.25, 0.0, 1.2, 0.36, 0.05, K.woodD);
  ctx.signs.push({ x: 0, y: 1.25, z: 0.03, w: 1.14, h: 0.32, lines: it.lines || [{ text: 'ကိုယ့်ဘာသာ ချိန်ပါ', size: 54 }, { text: 'weigh it yourself', size: 28, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#FBF6EA', border: null, width: 512, height: 144 });
  f.flat(-0.7, -0.35, 0.7, 0.45, 0.005, SH);
}
/** Tubs of water plants and a lotus jar by a wall (low). */
function tubs(g, f, it) {
  const r = rng(it.seed || 2);
  for (const [x, s] of [[-0.5, 1], [0.15, 0.8], [0.7, 0.9]]) {
    g.box(x, 0.2 * s, 0, 0.5 * s, 0.4 * s, 0.5 * s, r() < 0.5 ? K.terraD : '#5E6E66');
    g.box(x, 0.41 * s, 0, 0.42 * s, 0.02, 0.42 * s, K.water);
    g.box(x + 0.06, 0.45 * s, 0.04, 0.2, 0.03, 0.2, K.leafL);
    if (r() < 0.6) g.box(x - 0.05, 0.6 * s, -0.04, 0.1, 0.14, 0.1, K.rose);
  }
  f.flat(-0.9, -0.4, 1.05, 0.4, 0.005, SH);
}
/** A small painted board on one post (canvas): plot names, little notices. it: { lines, w } */
function signPost(g, f, it, ctx) {
  const W = it.w || 0.9, H = it.h || 0.42, Y = it.y || 0.95;
  g.box(0, (Y + H / 2) / 2, -0.04, 0.08, Y + H / 2, 0.08, K.woodD);
  g.box(0, Y, -0.02, W + 0.06, H + 0.06, 0.04, K.woodD);
  ctx.signs.push({ x: 0, y: Y, z: 0.005, w: W, h: H, lines: it.lines, bg: it.bg || '#FBF6EA', border: null, width: it.pw || 384, height: it.ph || Math.round(384 * (H / W)) });
  f.flat(-0.3, -0.25, 0.3, 0.3, 0.005, SH);
}
/** A low stool and a tin cup (somebody's resting place by a door or a bed). */
function stool(g, f, it) {
  const c = it.col || K.teal;
  g.box(0, 0.22, 0, 0.32, 0.05, 0.32, c);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.12, 0.1, sz * 0.12, 0.04, 0.2, 0.04, shade(c, 0.75));
  g.box(0.32, 0.06, 0.05, 0.1, 0.12, 0.1, K.tinD);
  f.flat(-0.3, -0.3, 0.45, 0.3, 0.005, SH);
}

export const GARDEN_FIT_ART = {
  gdKilnYard: { draw: kilnYard, h: 7.8, map: true, obstacles: (it) => {
    const W = it.w, D = it.d, KX = it.kx ?? -1.2, BX0 = W / 2 - (it.bay ?? 3.6);
    return [obBox(it, -W / 2, -D / 2, W / 2, -D / 2 + 0.35), obBox(it, -W / 2, -D / 2, -W / 2 + 0.35, D / 2 - 0.1), obBox(it, BX0, -D / 2, W / 2, D / 2),
      obCircle(it, KX, -0.7, 2.05), obBox(it, -W / 2 + 0.35, -D / 2 + 1.1, -W / 2 + 1.0, D / 2 - 1.1), obBox(it, -W / 2 + 0.35, D / 2 - 1.3, -W / 2 + 1.9, D / 2 - 0.1)];
  } },
  gdHall: { draw: hall, h: 4.1, map: true, obstacles: (it) => {
    const W = it.w, D = it.d, DX = it.doorX ?? 0, out = [obBox(it, -W / 2, -D / 2, W / 2, D / 2)];
    const px0 = DX + 1.2 + 1.2, px1 = W / 2 - 0.4;
    if (px1 - px0 > 1.2) out.push(obBox(it, px0, D / 2 + 0.3, px1, D / 2 + 0.9));
    return out;
  } },
  gdHpHouse: { draw: hpHouse, h: 3.4, map: true, obstacles: (it) => [obBox(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2), obCircle(it, -it.w / 2 - 0.42, -it.d / 2 + 0.6, 0.34)] },
  gdGateArch: { draw: gateArch, h: 4.4, obstacles: (it) => [-1, 1].map((s) => obCircle(it, (s * (it.span || 5.2)) / 2, 0, 0.2)) },
};
export const GARDEN_FIT_PROP = {
  gdPotRack: { draw: potRack, obstacles: (it) => [obBox(it, -(it.len || 2.6) / 2, -0.42, (it.len || 2.6) / 2, 0.36)] },
  gdHandcart: { draw: handcart, obstacles: (it) => [obBox(it, -0.85, -0.6, 1.0, 0.6)] },
  gdBaskets: { draw: baskets, obstacles: (it) => [obBox(it, -(it.n || 3) * 0.31, -0.28, (it.n || 3) * 0.31, 0.28)] },
  gdClayHeap: { draw: clayHeap, obstacles: (it) => [obBox(it, -0.85, -0.6, 1.5, 0.6)] },
  gdSeedStand: { draw: seedStand, obstacles: (it) => [obBox(it, -0.62, -0.3, 0.62, 0.2)] },
  gdTubs: { draw: tubs, obstacles: (it) => [obBox(it, -0.8, -0.28, 0.95, 0.28)] },
  gdSignPost: { draw: signPost, obstacles: (it) => [obCircle(it, 0, -0.04, 0.1)] },
  gdStool: { draw: stool, obstacles: () => [] },
};
