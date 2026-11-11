// Maya's car: a cute blocky retro convertible (about 2.2 x 1.3 m) built from boxes and cel shaded.
// Maroon tub, cream fenders and running boards, gold trim and bumpers, chunky lamps, her real logo
// (img/logo.webp, via art.js) as round gold-rimmed medallions on the grille, both doors and the
// back of the travel case, sparkle hubcaps, a paper-plane hood ornament, cream seats with maroon
// piping and a number plate reading "မာရာ ✦".
//
// Motion is spring driven so it reads like a cinematic cartoon: wheels turn by distance, the body
// leans out of bends, stretches when pulling away and dips when braking (with overshoot and
// follow-through), bobs at idle, and honk() does an anticipation squash, a hop and a happy wiggle.
//
//   const car = createCar();
//   scene.add(car.root);
//   car.update(dt, { speed, steer, accel });   // every frame
//   car.seat.add(maya.root);                   // 'drive' mode
//
// Detail pass: fender beading, hood louvres, door shut lines, side and rear-view mirrors, a wiper,
// rubber running-board strips and mudflaps, dial faces and a glovebox, stitched seats, a luggage
// rack with her travel case, tread lugs and rim rings on the wheels, and tail lamps that glow
// brighter while braking.
//
// Logo medallions: the logo is copied 1:1 (320 px) into the number-plate canvas, which is now a
// small atlas (plate artwork on top, the round medallion below), so plates and medallions share
// one unlit, untinted mesh and draw call: the logo shows in its true colours, never mirrored.
//
// Draw calls: body + body outline + wheels (instanced) + lamp lenses + tail lamps + plates/medallions + blob shadow = 7.
import * as THREE from '../three.js';
import { mergeGeometries } from '../three.js';
import { PALETTE, toon, basic, outlineGeometry, outlineMaterial, blobShadow, signTexture, fontsReady, roundRect } from '../toon.js';
import { VoxelBuilder } from '../voxel.js';
import { artImage, drawArt } from '../art.js';

// ---------------------------------------------------------------------------------
// Dimensions (metres, car space: ground at y = 0, front toward +Z, driver on the car's
// left = +X, which is screen right when the car faces the camera).
// ---------------------------------------------------------------------------------
const WHEEL_R = 0.25;
const WHEEL_W = 0.2;
const WHEEL_X = 0.5;
const AXLE_Z = 0.66;
const PIVOT_Y = 0.18; // body roll / squash pivot (bottom of the chassis)
const SEAT = { x: 0.18, y: 0.46, z: -0.32 }; // top of the driver's cushion, centred
const WHEEL_SPOT = { x: 0.18, y: 0.68, z: 0.03 }; // steering wheel hub (for Maya's hands)
const WHEEL_TILT = 0.5; // rim plane rotated about X so its top leans toward the dash
const EXHAUST = { x: -0.32, y: 0.1, z: -1.19 };
const EXIT = { x: 1.0, z: SEAT.z }; // ground point beside the driver's door

const GLASS = '#D8EAF0';
const TYRE = PALETTE.ink;
const TREAD = '#463A31';
const LENS = '#FFF3CF';
const TAIL = PALETTE.boxRed;
// Brake-lamp glow: dim at rest, bright while slowing down (colours shared, never allocated per frame).
const TAIL_DIM = new THREE.Color('#B8323C');
const TAIL_ON = new THREE.Color('#FF6650');
const PLATE_TEXT = 'မာရာ'; // + a drawn four-point sparkle, so the plate reads "မာရာ ✦"

// Plate + medallion atlas (canvas pixels, y down). The plate artwork keeps its original 512 x 192;
// the medallion is the logo at its native 320 px (radius r) inside a gold ring (out to radius R),
// on a dark square so mipmaps never bleed transparency into the rim.
const ATLAS_W = 512;
const ATLAS_H = 560;
const PLATE_H = 192;
const MED = { x: 0, y: 200, size: 360, R: 176, r: 160 };
// Plates used to be tinted by their material colour; the tint is now baked into the plate pixels,
// so the shared material stays white and the logo keeps its exact colours.
const PLATE_TINT = '#F4EEE0';
// Medallions in car space: grille badge (faces +Z), both doors (face ±X), travel case back (faces −Z).
const BADGE = { y: 0.44, z: 1.011, r: 0.09 };
const DOOR_BADGE = { x: 0.4645, y: 0.386, z: -0.03, r: 0.075 };
const CASE_BADGE = { y: 0.765, z: -0.8875, r: 0.04 };

const SIDES = [1, -1];
const VC = () => toon('#ffffff', { vertexColors: true });
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

/** Rotated box (centre, size, colour, Euler XYZ) into a VoxelBuilder. Build time only. */
function rbox(v, x, y, z, w, h, d, color, rx = 0, ry = 0, rz = 0) {
  _e.set(rx, ry, rz);
  _q.setFromEuler(_e);
  _p.set(x, y, z);
  _s.set(w, h, d);
  _m.compose(_p, _q, _s);
  v.add(UNIT, color, _m);
}

/** Placement matrix for merging a sub-assembly. Build time only. */
function placed(x, y, z, rx = 0, ry = 0, rz = 0) {
  _e.set(rx, ry, rz);
  _q.setFromEuler(_e);
  _p.set(x, y, z);
  _s.set(1, 1, 1);
  return new THREE.Matrix4().compose(_p, _q, _s);
}

// ---------------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------------
/** Returns { main, detail }: main parts get the outline, small surface details do not. */
function buildBody() {
  const P = PALETTE;
  const main = new VoxelBuilder();
  const detail = new VoxelBuilder();

  // Tub: dark floor pan, domed hood, cut-down doors and a rounded rear deck round an open cockpit.
  main.boxMin(-0.44, 0.16, -0.97, 0.44, 0.28, 0.97, P.maroonDeep);
  main.boxMin(-0.45, 0.28, 0.26, 0.45, 0.6, 0.96, P.maroon); // hood block
  main.boxMin(-0.38, 0.6, 0.27, 0.38, 0.66, 0.88, P.maroon); // hood dome, step 1
  main.boxMin(-0.27, 0.66, 0.28, 0.27, 0.7, 0.76, P.maroon); // hood dome, step 2
  for (const s of SIDES) main.boxMin(s * 0.36, 0.28, -0.58, s * 0.46, 0.55, 0.26, P.maroon); // doors
  main.boxMin(-0.45, 0.28, -0.98, 0.45, 0.6, -0.58, P.maroon); // rear deck
  main.boxMin(-0.38, 0.6, -0.9, 0.38, 0.66, -0.59, P.maroon); // rear hump, step 1
  main.boxMin(-0.26, 0.66, -0.8, 0.26, 0.7, -0.6, P.maroon); // rear hump, step 2
  main.boxMin(-0.4, 0.3, -1.03, 0.4, 0.56, -0.98, P.maroon); // rounded tail
  // Wood dashboard with two little gold gauges facing the driver.
  main.boxMin(-0.36, 0.42, 0.18, 0.36, 0.6, 0.26, P.wood);
  detail.boxMin(0.09, 0.49, 0.168, 0.15, 0.55, 0.18, P.gold);
  detail.boxMin(0.21, 0.49, 0.168, 0.27, 0.55, 0.18, P.gold);
  // Padded rim round the cockpit opening.
  for (const s of SIDES) detail.boxMin(s * 0.35, 0.55, -0.59, s * 0.47, 0.575, 0.27, P.maroonDeep);
  detail.boxMin(-0.45, 0.6, -0.6, 0.45, 0.622, -0.565, P.maroonDeep);

  // Cream fenders: stepped round arches over each wheel (outer radius ~0.38 m round the axle,
  // every step clears the spinning tyre), plus running boards.
  const arch = [
    // x0, x1, y0, y1, dz0, dz1 (dz from the axle, + toward the car's end)
    [0.43, 0.61, 0.55, 0.63, -0.14, 0.14], // crown
    [0.42, 0.62, 0.5, 0.6, 0.14, 0.24],
    [0.42, 0.62, 0.5, 0.6, -0.24, -0.14],
    [0.41, 0.63, 0.4, 0.54, 0.24, 0.31],
    [0.41, 0.63, 0.4, 0.54, -0.31, -0.24],
    [0.4, 0.64, 0.29, 0.46, 0.31, 0.37], // nose / tail foot
    [0.4, 0.64, 0.28, 0.46, -0.37, -0.31], // foot onto the running board
  ];
  for (const s of SIDES) {
    for (const f of [1, -1]) {
      for (const [x0, x1, y0, y1, d0, d1] of arch) main.boxMin(s * x0, y0, f * (AXLE_Z + d0), s * x1, y1, f * (AXLE_Z + d1), P.cream);
    }
    main.boxMin(s * 0.4, 0.22, -0.3, s * 0.62, 0.28, 0.3, P.cream); // running board
  }

  // Frog-eye lamps: stepped round gold housings standing on the front fenders (lenses glow separately).
  for (const s of SIDES) {
    main.box(s * 0.48, 0.73, 0.74, 0.2, 0.13, 0.14, P.gold);
    main.box(s * 0.48, 0.73, 0.74, 0.13, 0.2, 0.14, P.gold);
    detail.box(s * 0.48 - 0.03, 0.758, 0.833, 0.03, 0.03, 0.008, P.white); // glint, upper left
  }

  // Tall radiator grille: gold frame with a rounded top, dark inset, full-height slats and, mounted
  // over them, a stepped-round gold boss that carries her logo medallion (the unlit disc itself is
  // part of the plate mesh, 4 mm in front of the boss).
  main.boxMin(-0.22, 0.56, 0.95, 0.22, 0.6, 1.01, P.gold);
  main.boxMin(-0.15, 0.6, 0.95, 0.15, 0.63, 1.0, P.gold);
  main.boxMin(-0.22, 0.27, 0.95, 0.22, 0.31, 1.01, P.gold);
  for (const s of SIDES) main.boxMin(s * 0.18, 0.31, 0.95, s * 0.22, 0.56, 1.01, P.gold);
  main.boxMin(-0.18, 0.31, 0.95, 0.18, 0.56, 0.985, P.maroonDeep);
  for (let i = -2; i <= 2; i++) detail.boxMin(i * 0.06 - 0.008, 0.325, 0.98, i * 0.06 + 0.008, 0.545, 0.996, P.goldDeep);
  // Boss: three crossed blocks from the inset to 4 mm behind the disc, every corner inside the
  // disc's rim, so only its sides show (a gold mount when seen from above or the side).
  const bossK = BADGE.r / 0.09;
  const bossZ0 = 0.985;
  const bossZ1 = BADGE.z - 0.004;
  for (const [w, h] of [[0.156, 0.072], [0.072, 0.156], [0.12, 0.12]]) {
    detail.box(0, BADGE.y, (bossZ0 + bossZ1) / 2, w * bossK, h * bossK, bossZ1 - bossZ0, P.gold);
  }

  // Gold "smile" bumpers (centre forward, wings back) with overriders, front and rear.
  for (const f of [1, -1]) {
    main.boxMin(-0.3, 0.13, f * 1.05, 0.3, 0.24, f * 1.13, P.gold);
    for (const s of SIDES) {
      main.boxMin(s * 0.3, 0.14, f * 1.03, s * 0.52, 0.23, f * 1.1, P.gold);
      detail.boxMin(s * 0.2, 0.11, f * 1.08, s * 0.25, 0.28, f * 1.155, P.goldDeep);
    }
  }
  // Chunky gold tail-lamp bezels (the red lenses are their own glowing mesh: brake lights) and a
  // little bronze exhaust with a dark mouth.
  for (const s of SIDES) {
    main.box(s * 0.295, 0.44, -1.045, 0.11, 0.07, 0.04, P.gold);
    main.box(s * 0.295, 0.44, -1.045, 0.07, 0.11, 0.04, P.gold);
  }
  detail.boxMin(-0.36, 0.075, -1.17, -0.28, 0.13, -0.95, P.bronze);
  detail.boxMin(-0.346, 0.088, -1.173, -0.294, 0.117, -1.169, P.ink);

  // Low gold-framed windscreen, leaning back, with two glints on the glass.
  const ws = new VoxelBuilder();
  const wsd = new VoxelBuilder();
  for (const s of SIDES) ws.boxMin(s * 0.38, 0, -0.025, s * 0.42, 0.29, 0.025, P.gold);
  ws.boxMin(-0.38, 0.25, -0.025, 0.38, 0.29, 0.025, P.gold);
  ws.boxMin(-0.38, 0, -0.012, 0.38, 0.25, 0.012, GLASS);
  rbox(wsd, -0.18, 0.13, 0.016, 0.034, 0.19, 0.006, P.white, 0, 0, -0.65);
  rbox(wsd, -0.1, 0.11, 0.016, 0.016, 0.14, 0.006, P.white, 0, 0, -0.65);
  const wsM = placed(0, 0.6, 0.27, -0.22, 0, 0);
  main.merge(ws, wsM);
  detail.merge(wsd, wsM);

  // Steering wheel (square blocky rim, gold spoke and hub) on a column into the dash.
  const sw = new VoxelBuilder();
  const rr = 0.1;
  const t = 0.03;
  sw.box(0, rr, 0, 2 * rr + t, t, t, P.woodDark);
  sw.box(0, -rr, 0, 2 * rr + t, t, t, P.woodDark);
  for (const s of SIDES) sw.box(s * rr, 0, 0, t, 2 * rr - t, t, P.woodDark);
  sw.box(0, 0, 0, 2 * rr, 0.02, 0.02, P.gold);
  sw.box(0, 0, -0.008, 0.06, 0.06, 0.03, P.gold);
  detail.merge(sw, placed(WHEEL_SPOT.x, WHEEL_SPOT.y, WHEEL_SPOT.z, WHEEL_TILT, 0, 0));
  rbox(detail, WHEEL_SPOT.x, WHEEL_SPOT.y - 0.041, WHEEL_SPOT.z + 0.075, 0.03, 0.03, 0.17, P.ink, WHEEL_TILT, 0, 0);

  // Two cream bucket seats with maroon piping and tuck lines; reclined backs.
  for (const s of SIDES) {
    const xc = s * SEAT.x;
    main.boxMin(xc - 0.15, 0.28, -0.52, xc + 0.15, SEAT.y, -0.14, P.cream);
    detail.boxMin(xc - 0.153, 0.44, -0.156, xc + 0.153, 0.472, -0.127, P.maroon);
    const back = new VoxelBuilder();
    const backD = new VoxelBuilder();
    back.boxMin(-0.15, 0, -0.06, 0.15, 0.36, 0.06, P.cream);
    backD.boxMin(-0.155, 0.335, -0.068, 0.155, 0.37, 0.068, P.maroon);
    for (const lx of [-0.075, 0.075]) backD.boxMin(lx - 0.01, 0.06, 0.06, lx + 0.01, 0.31, 0.069, P.maroon);
    const m = placed(xc, 0.44, -0.5, -0.2, 0, 0);
    main.merge(back, m);
    detail.merge(backD, m);
  }
  // Her books on the passenger seat, with a gold ribbon.
  detail.boxMin(-0.3, SEAT.y, -0.42, -0.08, 0.515, -0.22, P.maroon);
  detail.boxMin(-0.28, 0.515, -0.4, -0.11, 0.56, -0.25, P.parchment);
  detail.boxMin(-0.215, 0.47, -0.227, -0.195, 0.565, -0.212, P.gold);

  // Gold side spears, door handles and a hood strip.
  for (const s of SIDES) {
    detail.boxMin(s * 0.455, 0.5, -0.97, s * 0.468, 0.52, 0.95, P.gold);
    detail.boxMin(s * 0.46, 0.44, -0.42, s * 0.478, 0.46, -0.32, P.gold);
  }
  detail.boxMin(-0.02, 0.7, 0.3, 0.02, 0.712, 0.76, P.gold);

  // Paper-plane hood ornament (two swept wings and a keel) on a little gold post.
  const pl = new VoxelBuilder();
  rbox(pl, 0.042, 0, -0.085, 0.06, 0.012, 0.19, P.white, 0, -0.32, 0);
  rbox(pl, -0.042, 0, -0.085, 0.06, 0.012, 0.19, P.white, 0, 0.32, 0);
  pl.box(0, -0.022, -0.075, 0.014, 0.04, 0.15, P.parchment);
  main.merge(pl, placed(0, 0.725, 0.97, -0.12, 0, 0));
  main.boxMin(-0.016, 0.66, 0.84, 0.016, 0.7, 0.88, P.gold);

  addDetail(main, detail, arch, wsM);
  return { main, detail };
}

// Extra tones for the detail pass.
const RUBBER = '#3A2C22';
const DIAL = '#FFF6E3';
const WOOD_HI = '#CB9C68';
const CASE = '#EFE3C8';
const CASE_SHADE = '#D9C9A6';
const STITCH = '#D8CBB0';

/** Four-point sparkle (her ✦: two squashed diamonds) facing ±X (axis 'x') or ±Z (axis 'z'). Build time only. */
function sparkle(v, axis, x, y, z, a, thick, color) {
  for (const [tall, wide] of [[1.75, 0.42], [0.42, 1.75]]) {
    const m = new THREE.Matrix4();
    if (axis === 'x') {
      m.makeScale(thick, a, a).premultiply(new THREE.Matrix4().makeRotationX(Math.PI / 4)).premultiply(new THREE.Matrix4().makeScale(1, tall, wide));
    } else {
      m.makeScale(a, a, thick).premultiply(new THREE.Matrix4().makeRotationZ(Math.PI / 4)).premultiply(new THREE.Matrix4().makeScale(wide, tall, 1));
    }
    m.premultiply(new THREE.Matrix4().makeTranslation(x, y, z));
    v.add(UNIT, color, m);
  }
}

/**
 * Detail pass (owner request "more detailed graphics"): trims, seams, mirrors, louvres, dials,
 * rubber strips, a luggage rack with her travel case. Nothing here moves a gameplay point
 * (seat, steering wheel, exit point, exhaust, plates stay exactly where they were).
 */
function addDetail(main, detail, arch, wsM) {
  const P = PALETTE;
  // Hood: raised louvre slits on both shoulders of the dome, a pair of gold horn trumpets beside
  // the grille (she loves to honk), a cream coachline under each gold side spear.
  for (const s of SIDES) {
    for (let i = 0; i < 5; i++) {
      const z = 0.4 + i * 0.075;
      detail.boxMin(s * 0.288, 0.66, z - 0.011, s * 0.362, 0.672, z + 0.011, P.ink);
      detail.boxMin(s * 0.288, 0.672, z + 0.005, s * 0.362, 0.676, z + 0.013, P.gold);
    }
    main.box(s * 0.31, 0.49, 0.985, 0.045, 0.045, 0.07, P.gold);
    main.box(s * 0.31, 0.49, 1.03, 0.08, 0.08, 0.026, P.gold);
    detail.box(s * 0.31, 0.49, 1.0435, 0.05, 0.05, 0.004, P.ink);
    detail.boxMin(s * 0.459, 0.474, -0.97, s * 0.464, 0.481, 0.27, P.cream);
  }
  // Fenders: a gold bead stepping over every arch; running boards with rubber strips and a gold edge.
  for (const s of SIDES) {
    for (const f of [1, -1]) {
      for (const [, , , y1, d0, d1] of arch) detail.boxMin(s * 0.511, y1, f * (AXLE_Z + d0), s * 0.539, y1 + 0.007, f * (AXLE_Z + d1), P.gold);
    }
    for (const rx of [0.445, 0.5, 0.555]) detail.boxMin(s * (rx - 0.013), 0.28, -0.285, s * (rx + 0.013), 0.286, 0.285, RUBBER);
    detail.boxMin(s * 0.618, 0.214, -0.305, s * 0.629, 0.286, 0.305, P.gold);
  }
  // Doors: shut lines (her logo medallion sits on each door panel, see DOOR_BADGE); rubber mudflaps
  // behind the rear wheels.
  for (const s of SIDES) {
    detail.boxMin(s * 0.458, 0.29, 0.244, s * 0.465, 0.549, 0.252, P.maroonDeep);
    detail.boxMin(s * 0.458, 0.29, -0.574, s * 0.465, 0.549, -0.566, P.maroonDeep);
    detail.boxMin(s * 0.458, 0.29, -0.574, s * 0.465, 0.298, 0.252, P.maroonDeep);
    main.boxMin(s * 0.44, 0.07, -1.0, s * 0.6, 0.28, -0.985, RUBBER);
    detail.boxMin(s * 0.44, 0.255, -1.004, s * 0.6, 0.27, -0.999, P.gold);
  }
  // Side mirrors on the windscreen posts (glass facing the driver).
  for (const s of SIDES) {
    rbox(main, s * 0.452, 0.66, 0.258, 0.016, 0.09, 0.016, P.gold, 0, 0, -s * 0.75);
    main.box(s * 0.505, 0.71, 0.25, 0.07, 0.048, 0.03, P.gold);
    detail.box(s * 0.505, 0.71, 0.2335, 0.056, 0.034, 0.003, GLASS);
  }
  // Windscreen: rear-view mirror under the top bar, a wiper resting on the glass.
  const wsMain = new VoxelBuilder();
  const wsDet = new VoxelBuilder();
  wsMain.box(0, 0.235, -0.03, 0.014, 0.04, 0.014, P.gold);
  wsMain.box(0, 0.205, -0.045, 0.11, 0.036, 0.022, P.gold);
  wsDet.box(0, 0.205, -0.0575, 0.094, 0.026, 0.003, GLASS);
  rbox(wsDet, 0.13, 0.042, 0.016, 0.21, 0.009, 0.006, P.ink, 0, 0, 0.16);
  wsDet.box(0.03, 0.026, 0.017, 0.018, 0.018, 0.008, P.gold);
  main.merge(wsMain, wsM);
  detail.merge(wsDet, wsM);
  // Bumpers: a deeper gold groove and rubber tips on the wing ends; frog-eye lamps get gold lids.
  for (const f of [1, -1]) {
    for (const s of SIDES) {
      detail.boxMin(s * (f > 0 ? 0.14 : 0.0), 0.182, f * 1.128, s * 0.3, 0.19, f * 1.134, P.goldDeep);
      detail.boxMin(s * 0.518, 0.146, f * 1.032, s * 0.536, 0.224, f * 1.098, RUBBER);
    }
  }
  for (const s of SIDES) main.box(s * 0.48, 0.836, 0.79, 0.13, 0.016, 0.1, P.gold);
  // Dashboard: cream dial faces with maroon needles, a glovebox with a gold knob, a lit top edge.
  for (const gx of [0.12, 0.24]) {
    detail.boxMin(gx - 0.022, 0.498, 0.164, gx + 0.022, 0.542, 0.168, DIAL);
    rbox(detail, gx + 0.004, 0.524, 0.1625, 0.004, 0.022, 0.002, P.maroon, 0, 0, -0.6);
  }
  detail.boxMin(-0.3, 0.46, 0.174, -0.1, 0.55, 0.18, P.woodDark);
  detail.box(-0.2, 0.505, 0.171, 0.03, 0.012, 0.008, P.gold);
  detail.boxMin(-0.362, 0.597, 0.178, 0.362, 0.605, 0.262, WOOD_HI);
  // Seat cushions: stitched channels.
  for (const s of SIDES) {
    for (const z of [-0.25, -0.33, -0.41]) detail.boxMin(s * SEAT.x - 0.14, SEAT.y, z - 0.003, s * SEAT.x + 0.14, SEAT.y + 0.004, z + 0.003, STITCH);
  }
  // Luggage rack on the rear deck: gold rails and a cream travel case with maroon straps, gold
  // corners, a handle, her logo medallion facing whoever drives behind (CASE_BADGE) and a ✦ on the
  // side facing the seats.
  for (const s of SIDES) {
    main.boxMin(s * 0.16, 0.7, -0.9, s * 0.18, 0.714, -0.64, P.gold);
    main.boxMin(s * 0.16, 0.66, -0.9, s * 0.18, 0.7, -0.88, P.gold);
  }
  for (const z of [-0.89, -0.65]) main.boxMin(-0.2, 0.7, z - 0.01, 0.2, 0.714, z + 0.01, P.gold);
  main.boxMin(-0.15, 0.714, -0.88, 0.15, 0.81, -0.68, CASE);
  detail.boxMin(-0.152, 0.714, -0.882, 0.152, 0.724, -0.678, CASE_SHADE);
  for (const x of [-0.08, 0.08]) detail.boxMin(x - 0.014, 0.712, -0.884, x + 0.014, 0.814, -0.676, P.maroon);
  for (const x of [-0.143, 0.143]) for (const z of [-0.873, -0.687]) detail.box(x, 0.804, z, 0.018, 0.016, 0.018, P.gold);
  main.boxMin(-0.045, 0.81, -0.79, 0.045, 0.826, -0.77, P.goldDeep);
  sparkle(detail, 'z', 0, 0.762, -0.676, 0.026, 0.008, P.gold);
}

/** Rhombus (squashed diamond) plate in the wheel's YZ plane, for the four-point sparkle hubcap. */
function rhombus(v, x, thick, a, sy, sz, color) {
  const m = new THREE.Matrix4().makeScale(thick, a, a);
  m.premultiply(new THREE.Matrix4().makeRotationX(Math.PI / 4));
  m.premultiply(new THREE.Matrix4().makeScale(1, sy, sz));
  m.premultiply(new THREE.Matrix4().makeTranslation(x, 0, 0));
  v.add(UNIT, color, m);
}

/** One wheel, axle along X, whitewall rim and sparkle hubcap on the +X face (stepped "round" tyre). */
function buildWheel() {
  const P = PALETTE;
  const v = new VoxelBuilder();
  const R = WHEEL_R;
  const W = WHEEL_W;
  v.box(0, 0, 0, W, 2 * R, 0.24, TYRE);
  v.box(0, 0, 0, W, 0.24, 2 * R, TYRE);
  v.box(0, 0, 0, W, 0.38, 0.38, TYRE);
  const rx = W / 2 + 0.008;
  v.box(rx, 0, 0, 0.016, 0.32, 0.2, P.cream);
  v.box(rx, 0, 0, 0.016, 0.2, 0.32, P.cream);
  v.box(rx, 0, 0, 0.016, 0.27, 0.27, P.cream);
  const hx = W / 2 + 0.022;
  rhombus(v, hx, 0.014, 0.1, 1.75, 0.42, P.gold); // tall point pair
  rhombus(v, hx, 0.014, 0.1, 0.42, 1.75, P.gold); // wide point pair
  rhombus(v, hx + 0.004, 0.014, 0.045, 1, 1, P.goldDeep); // centre jewel
  // Detail: tread lugs round the stepped tyre (they turn with the wheel, so motion reads at a
  // glance; the diagonal ones also round off the corners), a gold rim ring and four lug nuts.
  const spoke = (angle, x, r, w, h, d, color) => {
    const m = new THREE.Matrix4().makeRotationX(angle);
    m.multiply(new THREE.Matrix4().compose(new THREE.Vector3(x, r, 0), new THREE.Quaternion(), new THREE.Vector3(w, h, d)));
    v.add(UNIT, color, m);
  };
  const tread = (angle, r, off, len) => {
    const m = new THREE.Matrix4().makeRotationX(angle);
    m.multiply(new THREE.Matrix4().compose(new THREE.Vector3(0, r, off), new THREE.Quaternion(), new THREE.Vector3(W - 0.03, 0.016, len)));
    v.add(UNIT, TREAD, m);
  };
  for (let k = 0; k < 4; k++) {
    for (const off of [-0.06, 0.06]) tread(k * Math.PI / 2, R + 0.002, off, 0.034);
    tread(Math.PI / 4 + k * Math.PI / 2, 0.262, 0, 0.07);
  }
  for (let k = 0; k < 8; k++) spoke(k * Math.PI / 4, W / 2 + 0.014, 0.088, 0.008, 0.012, 0.074, P.goldDeep);
  for (let k = 0; k < 4; k++) spoke(Math.PI / 4 + k * Math.PI / 2, W / 2 + 0.016, 0.054, 0.01, 0.016, 0.016, P.goldDeep);
  return v.geometry();
}

/** Tail-lamp lenses (cross shapes like the headlamps), unlit so they can glow as brake lights. */
function tailLensGeometry() {
  const v = new VoxelBuilder();
  for (const s of SIDES) {
    v.box(s * 0.295, 0.44, -1.067, 0.085, 0.05, 0.006, TAIL);
    v.box(s * 0.295, 0.44, -1.067, 0.05, 0.085, 0.006, TAIL);
    v.box(s * 0.295 - 0.02, 0.458, -1.0705, 0.018, 0.018, 0.002, TAIL);
  }
  const g = v.geometry();
  g.deleteAttribute('color');
  return g;
}

function lensGeometry() {
  const v = new VoxelBuilder();
  for (const s of SIDES) {
    v.box(s * 0.48, 0.73, 0.82, 0.15, 0.085, 0.02, LENS);
    v.box(s * 0.48, 0.73, 0.82, 0.085, 0.15, 0.02, LENS);
  }
  const g = v.geometry();
  g.deleteAttribute('color');
  return g;
}

/** Points a geometry's 0..1 UVs at an atlas rectangle (canvas pixels, y down; the texture flips Y). */
function mapUV(geo, x, y, w, h) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (x + uv.getX(i) * w) / ATLAS_W, 1 - (y + (1 - uv.getY(i)) * h) / ATLAS_H);
  }
  return geo;
}

/** A round medallion disc (faces +Z, u to the right) showing the atlas medallion: logo + gold ring. */
function medallionGeometry(radius) {
  const g = new THREE.CircleGeometry(radius, 48);
  const cx = MED.x + MED.size / 2;
  const cy = MED.y + MED.size / 2;
  return mapUV(g, cx - MED.R, cy - MED.R, 2 * MED.R, 2 * MED.R);
}

/**
 * Front plate on the bumper, rear plate on the tail and the logo medallions (grille, both doors,
 * back of the travel case): one mesh, one texture. Every disc is turned so its u axis runs to the
 * viewer's right, so the logo is never mirrored on any side.
 */
function plateGeometry() {
  const parts = [];
  const front = mapUV(new THREE.PlaneGeometry(0.27, 0.1), 0, 0, ATLAS_W, PLATE_H);
  front.translate(0, 0.185, 1.134);
  const rear = mapUV(new THREE.PlaneGeometry(0.29, 0.108), 0, 0, ATLAS_W, PLATE_H);
  rear.rotateY(Math.PI);
  rear.translate(0, 0.43, -1.034);
  parts.push(front, rear);
  const grille = medallionGeometry(BADGE.r);
  grille.translate(0, BADGE.y, BADGE.z);
  parts.push(grille);
  for (const s of SIDES) {
    // +X door: rotateY(+90°) sends u to −Z, the right of a viewer standing at +X; −X door: u to +Z.
    const door = medallionGeometry(DOOR_BADGE.r);
    door.rotateY(s * Math.PI / 2);
    door.translate(s * DOOR_BADGE.x, DOOR_BADGE.y, DOOR_BADGE.z);
    parts.push(door);
  }
  const back = medallionGeometry(CASE_BADGE.r);
  back.rotateY(Math.PI); // seen from behind: u runs to −X, the viewer's right
  back.translate(0, CASE_BADGE.y, CASE_BADGE.z);
  parts.push(back);
  const g = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  return g;
}

/** Four-point sparkle (the ✦ of the plate), drawn as a path so it never depends on a font. */
function sparkle2D(g, cx, cy, R, r) {
  g.beginPath();
  g.moveTo(cx, cy - R);
  g.quadraticCurveTo(cx + r, cy - r, cx + R, cy);
  g.quadraticCurveTo(cx + r, cy + r, cx, cy + R);
  g.quadraticCurveTo(cx - r, cy + r, cx - R, cy);
  g.quadraticCurveTo(cx - r, cy - r, cx, cy - R);
  g.closePath();
}

/** Plate artwork in the top ATLAS_W x PLATE_H of the atlas (the medallion below is left alone). */
function paintPlate(cv, withText) {
  const g = cv.getContext('2d');
  const W = ATLAS_W;
  const H = PLATE_H;
  g.clearRect(0, 0, W, H);
  g.fillStyle = PALETTE.paper;
  roundRect(g, 7, 7, W - 14, H - 14, 38);
  g.fill();
  g.lineWidth = 14;
  g.strokeStyle = PALETTE.goldDeep;
  roundRect(g, 7, 7, W - 14, H - 14, 38);
  g.stroke();
  g.lineWidth = 4;
  g.strokeStyle = PALETTE.gold;
  roundRect(g, 25, 25, W - 50, H - 50, 24);
  g.stroke();
  if (withText) {
    // Burmese name drawn by the shared sign helper (transparent), placed left of centre.
    const t = signTexture([{ text: PLATE_TEXT, size: 98, weight: 700, color: PALETTE.maroon }], { width: 330, height: H, bg: null, border: null });
    g.drawImage(t.image, 44, 2);
    t.dispose();
  }
  g.lineJoin = 'round';
  sparkle2D(g, 412, H / 2, 52, 10);
  g.lineWidth = 9;
  g.strokeStyle = PALETTE.outline;
  g.stroke();
  g.fillStyle = PALETTE.gold;
  g.fill();
  g.fillStyle = PALETTE.white;
  g.beginPath();
  g.arc(404, H / 2 - 8, 5, 0, Math.PI * 2);
  g.fill();
  tintPixels(g, 0, 0, W, H, PLATE_TINT);
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toSRGB = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

/**
 * Multiplies a canvas rect by a colour in linear light, exactly what a material colour did to the
 * texture on the GPU (alpha untouched), so baking the old plate tint keeps the plate's look.
 */
function tintPixels(g, x, y, w, h, hex) {
  const n = parseInt(hex.slice(1), 16);
  const luts = [16, 8, 0].map((shift) => {
    const k = toLinear(((n >> shift) & 255) / 255);
    const lut = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) lut[i] = Math.round(toSRGB(toLinear(i / 255) * k) * 255);
    return lut;
  });
  const img = g.getImageData(x, y, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = luts[0][d[i]];
    d[i + 1] = luts[1][d[i + 1]];
    d[i + 2] = luts[2][d[i + 2]];
  }
  g.putImageData(img, x, y);
}

/**
 * The round logo medallion in its atlas square: a dark rim, a gold ring and, inside it, Maya's logo
 * copied pixel for pixel (native 320 px, clipped to its inscribed circle; the whole M lies inside).
 * Without the image (still loading or missing) the centre is a plain maroon enamel.
 */
function paintMedallion(cv, img) {
  const g = cv.getContext('2d');
  const cx = MED.x + MED.size / 2;
  const cy = MED.y + MED.size / 2;
  const disc = (r, color) => {
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fillStyle = color;
    g.fill();
  };
  g.save();
  // Dark background out to the atlas edges: the bleed guard, so even small mipmaps of the disc's
  // rim stay opaque (the gutter above it stays clear for the plate's own alpha edge).
  g.fillStyle = PALETTE.outline;
  g.fillRect(MED.x, MED.y, ATLAS_W - MED.x, ATLAS_H - MED.y);
  disc(MED.R - 3, PALETTE.goldDeep);
  disc(MED.R - 6, PALETTE.gold);
  disc(MED.r + 5, PALETTE.goldDeep);
  disc(MED.r + 2, PALETTE.outline);
  if (img) {
    g.beginPath();
    g.arc(cx, cy, MED.r, 0, Math.PI * 2);
    g.clip();
    drawArt(g, img, cx - MED.r, cy - MED.r, 2 * MED.r, 2 * MED.r, 'cover');
  } else {
    disc(MED.r, PALETTE.maroon);
  }
  g.restore();
}

// ---------------------------------------------------------------------------------
// Motion helpers (no allocation)
// ---------------------------------------------------------------------------------
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const smooth01 = (x) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
const wrapAngle = (a) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};
/** Damped spring step (semi-implicit Euler). s = { x, v }. */
function spring(s, target, k, c, h) {
  s.v += (k * (target - s.x) - c * s.v) * h;
  s.x += s.v * h;
}

const EMPTY = Object.freeze({});
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const ONE = new THREE.Vector3(1, 1, 1);
const TAU = Math.PI * 2;
const _fwd = new THREE.Vector3();

/**
 * Creates Maya's car.
 * opts: { outlinePx = 1.6, plate = true (number plates and logo medallions; false skips the canvas) }
 * Returns { root, seat, exitPoint, steeringWheel, exhaust, update(dt, input), honk(), bump(k), dispose() }.
 */
export function createCar(opts = {}) {
  const outlinePx = opts.outlinePx ?? 1.6;

  // ----- geometry -----
  const { main, detail } = buildBody();
  const mainGeo = main.geometry();
  const all = new VoxelBuilder().merge(main).merge(detail);
  const bodyGeo = all.geometry();
  const bodyOutlineGeo = outlineGeometry(mainGeo);
  mainGeo.dispose();
  const wheelGeo = buildWheel();
  const lensGeo = lensGeometry();

  // ----- scene graph -----
  //   root (game moves/rotates it)
  //   ├─ shadow (stays on the ground)
  //   └─ hop (honk hop)
  //      ├─ wheels (instanced, spin + steer)
  //      └─ bodyRig (pitch, roll, bob; pivot at the chassis bottom)
  //         ├─ bodyShape (squash & stretch scale): body + outline, lenses, plates, markers
  //         └─ seat (follows the squash without being scaled, so Maya is never distorted)
  const root = new THREE.Group();
  root.name = 'car';
  const shadow = blobShadow(0.9, 1.32, 0.55);
  shadow.name = 'carShadow';
  root.add(shadow);
  const shadowBase = { x: shadow.scale.x, y: shadow.scale.y };

  const hop = new THREE.Group();
  hop.name = 'carHop';
  root.add(hop);

  const wheels = new THREE.InstancedMesh(wheelGeo, VC(), 4);
  wheels.name = 'carWheels';
  wheels.userData.dynamic = true;
  hop.add(wheels);

  const bodyRig = new THREE.Group();
  bodyRig.name = 'carBodyRig';
  bodyRig.position.y = PIVOT_Y;
  hop.add(bodyRig);
  const bodyShape = new THREE.Group();
  bodyShape.name = 'carBodyShape';
  bodyRig.add(bodyShape);

  const body = new THREE.Mesh(bodyGeo, VC());
  body.name = 'carBody';
  body.position.y = -PIVOT_Y;
  body.userData.dynamic = true;
  const bodyOutline = new THREE.Mesh(bodyOutlineGeo, outlineMaterial(outlinePx));
  bodyOutline.userData.isOutline = true;
  bodyOutline.raycast = () => {};
  body.add(bodyOutline);
  bodyShape.add(body);

  const lens = new THREE.Mesh(lensGeo, basic(LENS));
  lens.name = 'carLamps';
  lens.position.y = -PIVOT_Y;
  lens.userData.dynamic = true;
  lens.raycast = () => {};
  bodyShape.add(lens);

  // Tail lamps: own unlit material (not the shared cache) because its colour animates (brake lights).
  const tailGeo = tailLensGeometry();
  const tailMat = new THREE.MeshBasicMaterial({ color: TAIL_DIM.clone(), toneMapped: false });
  const tailLamps = new THREE.Mesh(tailGeo, tailMat);
  tailLamps.name = 'carTailLamps';
  tailLamps.position.y = -PIVOT_Y;
  tailLamps.userData.dynamic = true;
  tailLamps.raycast = () => {};
  bodyShape.add(tailLamps);
  let brakeK = 0;

  // Number plates and logo medallions (one atlas, one unlit mesh): blank plate and plain medallions
  // at once, the Burmese text as soon as the fonts are ready, the logo as soon as its image is.
  let plate = null;
  let plateTex = null;
  let plateMat = null;
  let disposed = false;
  if (opts.plate !== false && typeof document !== 'undefined') {
    const cv = document.createElement('canvas');
    cv.width = ATLAS_W;
    cv.height = ATLAS_H;
    cv.getContext('2d', { willReadFrequently: true }); // the plate tint is baked with getImageData
    paintPlate(cv, false);
    paintMedallion(cv, null);
    plateTex = new THREE.CanvasTexture(cv);
    plateTex.colorSpace = THREE.SRGBColorSpace;
    plateTex.anisotropy = 4;
    // White (untinted) and unlit, not tone mapped: the logo shows exactly; polygon offset keeps
    // the plates and discs (3–4 mm proud of their surfaces) free of z-fighting far away.
    plateMat = basic('#FFFFFF', { map: plateTex, alphaTest: 0.5 });
    plateMat.polygonOffset = true;
    plateMat.polygonOffsetFactor = -1;
    plateMat.polygonOffsetUnits = -2;
    plate = new THREE.Mesh(plateGeometry(), plateMat);
    plate.name = 'carPlates';
    plate.position.y = -PIVOT_Y;
    plate.userData.dynamic = true;
    plate.raycast = () => {};
    bodyShape.add(plate);
    fontsReady().then(() => {
      if (disposed) return;
      paintPlate(cv, true);
      plateTex.needsUpdate = true;
    });
    artImage('logo').then((img) => {
      if (disposed || !img) return;
      paintMedallion(cv, img);
      plateTex.needsUpdate = true;
    });
  }

  const seat = new THREE.Object3D();
  seat.name = 'carSeat';
  seat.userData.footY = 0.3 - SEAT.y; // cockpit floor relative to the seat
  bodyRig.add(seat);
  const steeringWheel = new THREE.Object3D();
  steeringWheel.name = 'carSteeringWheel';
  steeringWheel.position.set(WHEEL_SPOT.x, WHEEL_SPOT.y - PIVOT_Y, WHEEL_SPOT.z);
  bodyShape.add(steeringWheel);
  const exhaust = new THREE.Object3D();
  exhaust.name = 'carExhaust';
  exhaust.position.set(EXHAUST.x, EXHAUST.y - PIVOT_Y, EXHAUST.z);
  bodyShape.add(exhaust);
  const exitPoint = new THREE.Vector3(EXIT.x, 0, EXIT.z);
  // Steering wheel relative to the seat point, in maya.js's convention (its _gripPoint puts the rim
  // top at z − r·sin(tilt); this rim's top leans forward, so tilt is negative):
  //   maya.wheel.copy(car.wheelGrip.position); maya.wheelRadius = car.wheelGrip.radius; maya.wheelTilt = car.wheelGrip.tilt;
  const wheelGrip = {
    position: new THREE.Vector3(WHEEL_SPOT.x - SEAT.x, WHEEL_SPOT.y - SEAT.y, WHEEL_SPOT.z - SEAT.z),
    radius: 0.1,
    tilt: -WHEEL_TILT,
  };

  // ----- wheel instances -----
  const wheelPos = [
    new THREE.Vector3(WHEEL_X, WHEEL_R, AXLE_Z), // front left (driver side)
    new THREE.Vector3(-WHEEL_X, WHEEL_R, AXLE_Z), // front right
    new THREE.Vector3(WHEEL_X, WHEEL_R, -AXLE_Z), // rear left
    new THREE.Vector3(-WHEEL_X, WHEEL_R, -AXLE_Z), // rear right
  ];
  const wheelMtx = new THREE.Matrix4();
  const qa = new THREE.Quaternion();
  const qb = new THREE.Quaternion();
  const qw = new THREE.Quaternion();
  function writeWheels(spin, steerAngle) {
    for (let i = 0; i < 4; i++) {
      const front = i < 2;
      const right = i % 2 === 1; // right wheels are turned round so their hubcap faces out
      qa.setFromAxisAngle(AXIS_Y, (front ? steerAngle : 0) + (right ? Math.PI : 0));
      qb.setFromAxisAngle(AXIS_X, right ? -spin : spin);
      qw.multiplyQuaternions(qa, qb);
      wheelMtx.compose(wheelPos[i], qw, ONE);
      wheels.setMatrixAt(i, wheelMtx);
    }
    wheels.instanceMatrix.needsUpdate = true;
  }
  writeWheels(0, 0);

  // ----- motion state -----
  const S = {
    pitch: { x: 0, v: 0 },
    stretch: { x: 0, v: 0 },
    roll: { x: 0, v: 0 },
    heave: { x: 0, v: 0 },
    squash: { x: 0, v: 0 },
    steer: { x: 0, v: 0 },
  };
  let clock = 0;
  let wheelAngle = 0;
  let lastYaw = null;
  let lastSpeed = null;
  let yawRate = 0;
  let accelF = 0;
  let hopY = 0;
  let hopV = 0;
  let airborne = false;
  let honkT = -1;
  let launched = false;
  let wiggleDir = 1;
  let squashTarget = 0;

  const state = { speed: 0, yawRate: 0, roll: 0, pitch: 0, stretch: 0, squash: 0, hop: 0, steer: 0, honking: false };

  const car = {
    root,
    seat,
    exitPoint,
    steeringWheel,
    wheelGrip,
    exhaust,
    state,
    dims: { length: 2.2, width: 1.3, wheelRadius: WHEEL_R, seat: { ...SEAT }, wheelSpot: { ...WHEEL_SPOT } },

    /**
     * Per frame. input: { speed (m/s, signed), steer (−1..1, + = left/heading increasing; optional),
     * accel (m/s², optional, derived from speed when omitted), yawRate (rad/s, optional) }.
     * The turn rate is measured from the root's world heading when the game turns the root.
     */
    update(dt, input = EMPTY) {
      if (!(dt > 0)) return;
      dt = Math.min(dt, 0.1);
      clock += dt;
      const speed = Number.isFinite(input.speed) ? input.speed : 0;
      const aspd = Math.abs(speed);

      // Acceleration: given, or derived from the speed change (teleport-safe clamp).
      if (lastSpeed === null) lastSpeed = speed;
      const rawAccel = clamp((speed - lastSpeed) / dt, -14, 14);
      lastSpeed = speed;
      accelF += (rawAccel - accelF) * Math.min(1, dt * 10);
      const accel = Number.isFinite(input.accel) ? input.accel : accelF;

      // Brake lamps glow while slowing down, then ease back to a soft red.
      const braking = aspd > 0.3 && accel * (speed < 0 ? -1 : 1) < -1.2 ? 1 : 0;
      brakeK += (braking - brakeK) * Math.min(1, dt * (braking ? 14 : 4));
      tailMat.color.copy(TAIL_DIM).lerp(TAIL_ON, brakeK);

      // Turn rate: explicit, measured from the root's world heading (works with rotation.y,
      // lookAt or a rotating parent), or from steer when the root is not turning.
      root.getWorldDirection(_fwd);
      const yaw = Math.atan2(_fwd.x, _fwd.z);
      let measured = 0;
      if (lastYaw !== null) {
        const d = wrapAngle(yaw - lastYaw);
        if (Math.abs(d) < 1.0) measured = d / dt; // larger jumps are teleports
      }
      lastYaw = yaw;
      let yawTarget;
      if (Number.isFinite(input.yawRate)) yawTarget = input.yawRate;
      else if (Math.abs(measured) > 1e-3) yawTarget = measured;
      else yawTarget = (Number.isFinite(input.steer) ? clamp(input.steer, -1, 1) : 0) * Math.max(aspd, 1.5) / 3;
      yawRate += (clamp(yawTarget, -4, 4) - yawRate) * Math.min(1, dt * 12);

      // Targets.
      const lateral = speed * yawRate; // m/s², + = turning left
      const rollT = clamp(lateral * 0.011, -0.095, 0.095); // lean out of the bend (about 5°)
      const pitchT = clamp(-accel * 0.011, -0.075, 0.08); // squat when pulling away, dive when braking
      const stretchT = clamp(accel * 0.014, -0.09, 0.09); // stretch away, squash on the brakes
      const steerT = aspd < 0.4 && Math.abs(yawRate) > 0.2
        ? Math.sign(yawRate) * 0.5
        : clamp(Math.atan2(2 * AXLE_Z * yawRate, Math.max(aspd, 1.2)), -0.55, 0.55) * (speed < -0.1 ? -1 : 1);

      // Honk: anticipation squash -> hop with a stretch -> landing squash and a happy wiggle.
      let rollExtra = 0;
      if (honkT >= 0) {
        honkT += dt;
        if (!launched) {
          squashTarget = -0.15;
          if (honkT >= 0.085) {
            launched = true;
            airborne = true;
            hopV = 1.85;
            squashTarget = 0;
            S.squash.v += 3.4;
            S.pitch.v -= 0.9;
          }
        }
        if (honkT < 0.75) rollExtra = 0.045 * Math.sin(honkT * TAU * 4.5) * (1 - honkT / 0.75);
        if (honkT > 1.0 && !airborne) {
          honkT = -1;
          launched = false;
        }
      }
      if (airborne) {
        hopV -= 17 * dt;
        hopY += hopV * dt;
        if (hopY <= 0 && hopV < 0) {
          hopY = 0;
          airborne = false;
          S.squash.v -= 3.8;
          S.heave.v -= 0.5;
          S.roll.v += 1.1 * wiggleDir;
          wiggleDir = -wiggleDir;
          S.pitch.v += 0.7;
        }
      }

      // Springs (sub-stepped for stability at low frame rates).
      const n = Math.ceil(dt / (1 / 120));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        spring(S.pitch, pitchT, 160, 9.5, h);
        spring(S.stretch, stretchT, 210, 10, h);
        spring(S.roll, rollT + rollExtra, 120, 8.5, h);
        spring(S.heave, 0, 260, 9, h);
        spring(S.squash, squashTarget, 300, 11, h);
        spring(S.steer, steerT, 220, 28, h);
      }

      // Idle putt-putt bob (1.5 cm) fading into a light road buzz when driving.
      const idleW = 1 - smooth01((aspd - 0.05) / 1.2);
      const bob = idleW * 0.0075 * (1 - Math.cos(clock * TAU * 2.2)) + (1 - idleW) * 0.0035 * Math.sin(clock * TAU * 7.3) * Math.min(1, aspd / 4);
      const idlePitch = idleW * 0.006 * Math.sin(clock * TAU * 2.2 + 0.8);

      // Apply.
      hop.position.y = hopY;
      bodyRig.position.y = PIVOT_Y + bob + S.heave.x;
      bodyRig.rotation.x = S.pitch.x + idlePitch;
      bodyRig.rotation.z = S.roll.x;
      const st = S.stretch.x;
      const sq = clamp(S.squash.x, -0.3, 0.3);
      const sx = (1 - 0.25 * st) * (1 - 0.45 * sq);
      const sy = (1 - 0.55 * st) * (1 + sq);
      const sz = (1 + st) * (1 - 0.45 * sq);
      bodyShape.scale.set(sx, sy, sz);
      seat.position.set(SEAT.x * sx, (SEAT.y - PIVOT_Y) * sy, SEAT.z * sz);

      wheelAngle = (wheelAngle + (speed * dt) / WHEEL_R) % TAU;
      writeWheels(wheelAngle, S.steer.x);

      const k = clamp(1 - hopY * 2.2, 0.6, 1);
      shadow.scale.set(shadowBase.x * k, shadowBase.y * k, 1);

      state.speed = speed;
      state.yawRate = yawRate;
      state.roll = S.roll.x;
      state.pitch = S.pitch.x;
      state.stretch = st;
      state.squash = sq;
      state.hop = hopY;
      state.steer = S.steer.x;
      state.honking = honkT >= 0;
    },

    /** Happy bounce: squash, hop, wiggle. (The game plays the horn sound.) */
    honk() {
      if (honkT >= 0 && honkT < 0.5) return; // already mid-honk
      honkT = 0;
      launched = false;
      squashTarget = -0.15;
    },

    /** A road bump / landing jolt; strength ~1 for a small thud. */
    bump(strength = 1) {
      S.heave.v -= 0.6 * strength;
      S.squash.v -= 2.2 * strength;
      S.pitch.v += 0.3 * strength * (Math.random() - 0.5);
    },

    dispose() {
      disposed = true;
      root.removeFromParent();
      bodyGeo.dispose();
      bodyOutlineGeo.dispose();
      wheelGeo.dispose();
      lensGeo.dispose();
      tailGeo.dispose();
      tailMat.dispose();
      wheels.dispose();
      shadow.geometry.dispose();
      if (plate) {
        plate.geometry.dispose();
        plateMat.dispose();
        plateTex.dispose();
      }
    },
  };
  return car;
}
