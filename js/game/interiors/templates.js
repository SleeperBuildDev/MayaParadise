// Template Shop, "Template ဆိုင်" (place id `templates`): a small boutique.
//
//   back wall:  three gold arch niches, each with a spotlight and a pedestal carrying a giant product
//               box in her box colours: blue = Short Videos, red = Creators, black = Business Use.
//               Each box front IS her real cover (img/tpl-*.webp via art.js, exactly 4:5, unlit), a
//               price tag on the pedestal, a lid that peeks open every few seconds and flips wide open
//               (pages flutter out) when Maya is there.
//   front-left: shop counter with the "3+ years of experience" sign (tpl-intro), bell, flowers.
//   elsewhere:  product shelves on the side walls, a display table, plants, a welcome mat.
//
// Every template box in the room (the three big ones, the framed posters, the minis on the counter,
// the display table and the shelves, the box turning on the turntable) shows the REAL cover on the
// faces that can be seen: all quads of one cover are ONE unlit mesh using the shared art.js texture
// (3 covers = 3 draw calls, full 540 x 675 resolution, never disposed here). The gems of the three
// product stations float just above their box (behind the cover's plane) so they never hide a cover.
//
// Detail pass: gold/maroon inlays where the floor tiles meet, soft floor shading (fake AO), gift
// stacks and framed cover posters between the niches, gold corner guards on the boxes, fluted
// pedestals, gold ribbons + bows riding on the lids, a cash register, shopping bags, a turntable
// with a turning mini box on the display table, dust motes drifting down the spotlight beams.
//
// Budget: 2 baked + 12 marker + 2 sign atlases + 2 lids (instanced + outline) + 2 FX + 1 glow
// + 1 shade + 2 lit pool + 3 covers = 28 draw calls, about 24k triangles; 2 canvas textures
// (+ the 3 shared cover textures owned by art.js).
// Helpers (atlas, FX/lit pools, glow/shade...) come from about.js.
import * as kit from './kit.js';
import { THREE, PALETTE, VoxelBuilder, jitter, toon, addOutline } from './kit.js';
import { mergeGeometries } from '../three.js';
import { fontsReady, FONT_MY, FONT_SERIF, roundRect } from '../toon.js';
import { artTexture, artMaterial, TEMPLATE_ART } from '../art.js';
import {
  mat4, boxR, addSparkle, createFX, createGlow, createAtlas, atlasText, atlasTextLeft, atlasMesh,
  textWidth, drawSparkle2D, damp, smoothstep, frac, hash, attentionTarget, cylinder,
  createLitPool, shadeStrip, shadeDisc,
} from './about.js';

const TAU = Math.PI * 2;
const BACK = -4;
const NICHE_X = [-2.25, 0, 2.25];
const PED = { z: -3.05, w: 1.25, d: 0.95, h: 0.78 };
const BOX = { w: 1.04, h: 1.3, d: 0.5, z: -3.12 };
// The real cover on each big box front: exactly 4:5 like the 540 x 675 artwork, from just above the
// dark foot band (y = PED.h + COVER.y) up to the gold rim; inside the gold corner guards.
const COVER = { w: 0.96, h: 1.2, y: 0.07 };
const LID = { w: 1.08, h: 0.12, d: 0.54 };
const ART_OFF = 0.004; // cover planes sit this far out from their face (plus polygonOffset): no z-fighting
const ART_KEYS = ['tplShort', 'tplCreator', 'tplBusiness'];
/** Mini box colour -> its cover (blue = Short Videos, red = Creators, black = Business Use). */
const MINI = [[PALETTE.boxBlue, 'tplShort'], [PALETTE.boxRed, 'tplCreator'], [PALETTE.boxBlack, 'tplBusiness']];
// Product-station gems hover just above their box, wholly behind the cover's plane (gem radius 0.13),
// so they never cover the artwork from the room camera; they stay under the station label and clear
// of the lid's little peek.
const GEM = { y: 2.56, z: -3.0, bob: 0.05 };
const COVER_Z = BOX.z + BOX.d / 2 + ART_OFF; // world z of the big covers' plane
const PRODUCTS = [
  {
    id: 'tpl-short', color: PALETTE.boxBlue, niche: '#D9E3F3', name: 'For Short Videos', price: '50,000 Ks', my: 'Hook (၁၀) မျိုး',
    emote: 'cheer', face: 'star',
    line: { my: 'TikTok နဲ့ Reels အတွက် Hook (၁၀) မျိုးပါနော်', en: '10 hooks for TikTok and Reels!' },
  },
  {
    id: 'tpl-creator', color: PALETTE.boxRed, niche: '#F4DCD8', name: 'For Creators', price: '50,000 Ks', my: 'Script ပုံစံ (၁၀) မျိုး',
    emote: 'jump', face: 'star',
    line: { my: 'ကိုယ်ပိုင် Channel အတွက် Script ပုံစံ (၁၀) မျိုးပါ', en: '10 script formats for your own channel!' },
  },
  {
    id: 'tpl-business', color: PALETTE.boxBlack, niche: '#E6DFD4', name: 'For Business Use', price: '80,000 Ks', my: 'Script ပုံစံ (၁၁) မျိုး',
    emote: 'thumbsUp', face: 'wink',
    line: { my: 'လုပ်ငန်းရှင်တွေအတွက် Script ပုံစံ (၁၁) မျိုးပါရှင့်', en: '11 script formats for business owners!' },
  },
];

const _m = new THREE.Matrix4();
const _m2 = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1); // never changed (unit scale)
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _c = new THREE.Color();
const PLATE_A = new THREE.Color('#FFE7AA');
const PLATE_B = new THREE.Color('#FFF9E6');

export async function buildInterior(ctx = {}) {
  // the real covers (shared art.js textures; null if an image cannot load: that face then shows the box colour)
  const [, ...coverTex] = await Promise.all([fontsReady(), ...ART_KEYS.map((k) => artTexture(k))]);
  const covers = Object.fromEntries(ART_KEYS.map((k) => [k, []])); // key -> [{ w, h, matrix }] quads in room space
  const addCover = (key, w, h, matrix) => covers[key].push({ w, h, matrix });
  const room = kit.createRoom({
    width: 7,
    depth: 8,
    wall: '#F7EFE1',
    wainscot: '#E5D2AE',
    trim: PALETTE.goldDeep,
    floor: 'tiles',
    floorColor: '#EBDDC2',
    floorColor2: '#DCC6A0',
  });
  room.id = 'templates';
  room.name = { my: 'Template ဆိုင်', en: 'Template Shop' };
  const G = room.group;
  const S = new VoxelBuilder();
  const fx = createFX({ cubes: 44, sparkles: 18 });
  const glow = createGlow();
  const atlasA = createAtlas(1024, 512); // the three price tags (the covers are the real artwork, not drawn)
  const atlasB = createAtlas();
  const signsA = [];
  const signsB = [];
  const tick = [];
  const att = { intro: 0, boxes: [0, 0, 0] };
  const lit = createLitPool(24, { name: 'shopLife' }); // lid ribbons + bows, the turning display box
  const shade = createGlow(); // soft floor shading (fake ambient occlusion)

  // ---------------- floor inlays, soft shading at the walls, box posters, gift stacks ----------------
  tileInlays(S);
  shadeStrip(shade, -3.5, -3.94, 3.5, -3.35, 'n', 0.26);
  shadeStrip(shade, -3.44, -3.94, -3.0, 4.0, 'w', 0.22);
  shadeStrip(shade, 3.0, -3.94, 3.44, 4.0, 'e', 0.22);
  boxPoster(S, -1.125, 1.5, BACK, 'tplShort', addCover);
  boxPoster(S, 1.125, 1.5, BACK, 'tplBusiness', addCover);
  for (const sx of [-1, 1]) {
    room.place(giftStack(sx > 0 ? 1 : 2), sx * 1.125, -3.52, 0);
    shadeDisc(shade, sx * 1.125, -3.5, 0.38, 0.34, 0.32);
  }

  // ---------------- back wall: gold arch niches, spotlights, pedestals, product boxes ----------------
  for (let i = -1; i <= 1; i += 2) addSparkle(S, i * 1.125, 2.15, BACK + 0.02, 0.26, PALETTE.gold, { depth: 0.04 });
  const lidGeo = lidGeometry();
  const lids = new THREE.InstancedMesh(lidGeo, toon('#ffffff', { vertexColors: true }), 3);
  lids.name = 'boxLids';
  lids.frustumCulled = false;
  lids.userData.dynamic = true;
  lids.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  PRODUCTS.forEach((p, i) => lids.setColorAt(i, _c.set(p.color)));
  G.add(lids);
  addOutline(lids, { px: 1.5 });
  const lidState = PRODUCTS.map(() => ({ a: 0, v: 0 }));
  const hingeZ = BOX.z - BOX.d / 2 - 0.02;
  const boxTop = PED.h + BOX.h;

  PRODUCTS.forEach((p, i) => {
    const x = NICHE_X[i];
    archNiche(S, x, p.niche);
    spotCan(S, x, 2.62, BACK);
    glow.disc(mat4(x, 1.62, BACK + 0.03), 0.74, 0.98, '#FFF6DC', 0.75);
    // light beam from the spotlight down onto the box top (its foot stays behind the cover's plane)
    const top = [[-0.07, -0.05], [0.07, -0.05], [0.07, 0.05], [-0.07, 0.05]].map(([dx, dz]) => new THREE.Vector3(x + dx, 2.5, BACK + 0.28 + dz));
    const bot = [[-0.62, -0.32], [0.62, -0.32], [0.62, 0.24], [-0.62, 0.24]].map(([dx, dz]) => new THREE.Vector3(x + dx, boxTop + 0.02, BOX.z + dz));
    glow.beam(top, bot, '#FFF1C8', 0.34, 0.02);
    room.place(pedestal(p.color), x, PED.z);
    shadeDisc(shade, x, PED.z, 0.8, 0.62, 0.32);
    productBox(S, x, p.color);
    // the box front is her real cover (4:5, unlit), nothing in front of it
    addCover(TEMPLATE_ART[p.id], COVER.w, COVER.h, mat4(x, PED.h + COVER.y + COVER.h / 2, COVER_Z));
    signsA.push({ rect: TAG_RECTS[i], w: 0.98, h: 0.28, matrix: mat4(x, 0.42, PED.z + 0.41 + 0.012) });
  });

  // FX for the boxes: glowing pedestal plates, spotlight lenses, pages, sparkles
  const plate0 = fx.cube.alloc(3, '#FFF0C8');
  const lens0 = fx.cube.alloc(3, '#FFF6D8');
  const page0 = fx.cube.alloc(12, '#FFFFFF');
  const spark0 = fx.spark.alloc(9, '#F2C75C');
  NICHE_X.forEach((x, i) => {
    fx.cube.set(plate0 + i, x, PED.h + 0.006, BOX.z + 0.02, BOX.w + 0.12, 0.012, BOX.d + 0.12);
    fx.cube.set(lens0 + i, x, 2.495, BACK + 0.255, 0.1, 0.012, 0.08, 0.5, 0, 0);
  });
  // gold ribbon + bow riding on each lid (lit pool boxes that follow the lid hinge)
  const LIDDECO = [
    [mat4(0, LID.h + 0.007, LID.d / 2, 0, 0, 0, 0.1, 0.014, LID.d + 0.008), PALETTE.gold],
    [mat4(0, 0.035, LID.d + 0.004, 0, 0, 0, LID.w + 0.004, 0.022, 0.01), PALETTE.gold],
    [mat4(-0.075, LID.h + 0.05, LID.d * 0.6, 0, 0, 0.55, 0.13, 0.075, 0.05), PALETTE.gold],
    [mat4(0.075, LID.h + 0.05, LID.d * 0.6, 0, 0, -0.55, 0.13, 0.075, 0.05), PALETTE.gold],
    [mat4(0, LID.h + 0.035, LID.d * 0.6, 0, 0, 0, 0.05, 0.05, 0.06), PALETTE.goldDeep],
  ];
  const deco0 = lit.alloc(3 * LIDDECO.length);
  for (let i = 0; i < 3; i++) LIDDECO.forEach(([, c], j) => lit.tint(deco0 + i * LIDDECO.length + j, _c.set(c)));
  // dust motes drifting down the three spotlight beams
  const mote0 = fx.cube.alloc(15, '#FFF6DA');
  const motes = [];
  for (let k = 0; k < 15; k++) motes.push({ i: k % 3, u: hash(k * 3.3), ox: hash(k * 5.1) - 0.5, oz: hash(k * 7.9) - 0.5, sp: 0.05 + hash(k * 9.7) * 0.05 });
  tick.push((dt, t) => {
    const step = Math.min(dt, 1 / 20);
    for (let i = 0; i < 3; i++) {
      const a = att.boxes[i];
      const L = lidState[i];
      // idle: a little peek every 5 s (staggered); near/active: flip wide open
      const cyc = frac(t / 5 + i * 0.31);
      const peek = cyc < 0.05 ? 0.28 : 0; // small: the lid clears the station gem hovering above
      const target = a > 0.3 ? 1.78 : peek;
      L.v += (90 * (target - L.a) - 11 * L.v) * step;
      L.a += L.v * step;
      if (L.a < 0) {
        L.a = 0;
        L.v = -L.v * 0.35; // bounce on the rim
      }
      _e.set(-L.a, 0, 0);
      _q.setFromEuler(_e);
      _m.compose(_p.set(NICHE_X[i], boxTop, hingeZ), _q, _s);
      lids.setMatrixAt(i, _m);
      for (let j = 0; j < LIDDECO.length; j++) lit.setM(deco0 + i * LIDDECO.length + j, _m2.multiplyMatrices(_m, LIDDECO[j][0]));
      // pages flutter up out of the open box
      const open = smoothstep(0.9, 1.7, L.a);
      for (let j = 0; j < 4; j++) {
        const k = page0 + i * 4 + j;
        if (open < 0.02) {
          fx.cube.hide(k);
          continue;
        }
        const f = frac(t * 0.5 + j / 4 + i * 0.13);
        const sc = open * smoothstep(0, 0.12, f) * (1 - smoothstep(0.72, 1, f));
        const x = NICHE_X[i] + Math.sin(f * 5 + j * 1.7) * 0.26;
        const y = boxTop + 0.05 + f * 1.05;
        const z = BOX.z + 0.05 + Math.cos(f * 4 + j) * 0.12;
        fx.cube.set(k, x, y, z, 0.2 * sc, 0.26 * sc, 0.01, -0.5 + Math.sin(t * 4 + j) * 0.45, f * 3 + j, Math.sin(t * 5 + j * 2) * 0.5);
      }
      // sparkles: twinkle around the box, burst up while open
      for (let j = 0; j < 3; j++) {
        const k = spark0 + i * 3 + j;
        const side = j === 0 ? -1 : j === 1 ? 1 : 0.2;
        const tw = Math.pow(Math.max(0, Math.sin(t * (1.5 + a * 2.5) + j * 2.1 + i)), 2);
        const s = (0.05 + 0.12 * tw) * (1 + a * 0.9);
        const rise = a * frac(t * 0.6 + j * 0.33) * 0.5;
        fx.spark.set(k, NICHE_X[i] + side * 0.66, (j === 2 ? 2.35 : 1.75 + j * 0.25) + rise, BOX.z + 0.45, s, s, s, -0.6, 0, t * (0.8 + a) + j);
      }
      // the pedestal plate glows brighter when Maya is near
      _c.lerpColors(PLATE_A, PLATE_B, 0.35 + 0.35 * Math.sin(t * 2 + i * 2) + a * 0.3);
      fx.cube.tint(plate0 + i, _c);
    }
    lids.instanceMatrix.needsUpdate = true;
    for (let k = 0; k < motes.length; k++) {
      const m = motes[k];
      const u = frac(m.u + t * m.sp);
      const x = NICHE_X[m.i] + m.ox * (0.12 + 1.0 * u) + Math.sin(t * 0.8 + k) * 0.03;
      const y = 2.45 - u * (2.45 - boxTop - 0.08);
      const z = BACK + 0.3 + (BOX.z - BACK - 0.3) * u + m.oz * 0.5 * u;
      const s = 0.024 * Math.sin(Math.PI * u) * (0.65 + 0.35 * Math.sin(t * 3 + k * 1.3));
      if (s < 0.003) fx.cube.hide(mote0 + k);
      else fx.cube.set(mote0 + k, x, y, z, s, s, s, t + k, t * 0.6, 0);
    }
  });

  // ---------------- shop counter (tpl-intro, front-left) ----------------
  const CX = -2.4;
  const CZ = 1.75;
  const counter = shopCounter();
  room.place(counter, CX, CZ);
  counter.updateMatrixWorld(true);
  placeCovers(counter, addCover);
  cashRegister(S, mat4(CX - 0.1, 1.0, CZ + 0.12, 0, 0.12, 0));
  shadeDisc(shade, CX, CZ, 1.05, 0.55, 0.3);
  room.place(shoppingBags(), -3.0, 0.8, 0);
  shadeDisc(shade, -3.0, 0.82, 0.4, 0.32, 0.3);
  signsB.push({ rect: [0, 0, 1024, 320], w: 1.42, h: 0.444, matrix: mat4(CX, 0.5, CZ + 0.35 + 0.018) });
  signsB.push({ rect: [0, 328, 1024, 480], w: 1.3, h: 0.61, matrix: counter.matrixWorld.clone().multiply(counter.userData.signLocal) });
  const bell0 = fx.spark.alloc(3, '#FFF1B8');
  const bellPos = new THREE.Vector3(CX - 0.62, 1.17, CZ + 0.2);
  tick.push((dt, t) => {
    const a = att.intro;
    for (let j = 0; j < 3; j++) {
      const f = frac(t / 2.2 + j * 0.12);
      const s = (0.04 + a * 0.12) * smoothstep(0, 0.05, f) * (1 - smoothstep(0.05, 0.4, f));
      if (s < 0.004) {
        fx.spark.hide(bell0 + j);
        continue;
      }
      const ang = j * 2.1 + 0.5;
      fx.spark.set(bell0 + j, bellPos.x + Math.cos(ang) * 0.14 * (1 + f), bellPos.y + 0.06 + f * 0.3, bellPos.z + 0.05, s, s, s, -0.6, 0, f * 4);
    }
  });
  const signSpark0 = fx.spark.alloc(2, '#F2C75C');
  tick.push((dt, t) => {
    const a = att.intro;
    for (let j = 0; j < 2; j++) {
      const tw = Math.pow(Math.max(0, Math.sin(t * (1.4 + a * 2) + j * 2.6)), 2);
      const s = (0.05 + 0.1 * tw) * (1 + a * 0.6);
      fx.spark.set(signSpark0 + j, CX + (j ? 0.76 : -0.78), j ? 1.76 : 2.0, CZ - 0.05, s, s, s, -0.6, 0, t + j);
    }
  });

  // ---------------- shelves, display table, plants, welcome mat ----------------
  const shelfL = room.place(productShelf(7), -3.27, -0.55, Math.PI / 2);
  const shelfR = room.place(productShelf(3), 3.27, -0.55, -Math.PI / 2);
  const table = room.place(displayTable(), 2.4, 1.75);
  for (const o of [shelfL, shelfR, table]) {
    o.updateMatrixWorld(true);
    placeCovers(o, addCover);
  }
  shadeDisc(shade, 2.4, 1.75, 0.95, 0.45, 0.3);
  for (const sx of [-1, 1]) shadeDisc(shade, sx * 3.2, -0.55, 0.3, 0.95, 0.28);
  // a turntable on the display table showing off a red mini box (lit pool, turns slowly) with her
  // real "For Creators" cover on both big faces: those two quads are rewritten every frame
  const TT = { x: 2.4, y: 0.7 + 0.18 + 0.03, z: 1.7 };
  const SPIN = { w: 0.2, h: 0.25, d: 0.08, cw: 0.192, ch: 0.24 }; // cover 4:5, 4-5 mm inside the face
  const spin0 = lit.alloc(2);
  lit.tint(spin0, _c.set(PALETTE.boxRed));
  lit.tint(spin0 + 1, _c.set(PALETTE.gold));
  const spinFirst = covers.tplCreator.length; // index of the first of its two quads in the cover mesh
  const spinLocal = new Float32Array(24); // the 8 quad corners in box space
  [mat4(0, 0, SPIN.d / 2 + ART_OFF), mat4(0, 0, -SPIN.d / 2 - ART_OFF, 0, Math.PI, 0)].forEach((m, q) => {
    const g = new THREE.PlaneGeometry(SPIN.cw, SPIN.ch).applyMatrix4(m);
    spinLocal.set(g.attributes.position.array, q * 12);
    g.dispose();
    addCover('tplCreator', SPIN.cw, SPIN.ch, mat4(TT.x, TT.y + SPIN.h / 2, TT.z).multiply(m));
  });
  let spinCover = null; // { pos, start } once the cover mesh exists
  tick.push((dt, t) => {
    const ry = t * 0.8;
    const y = TT.y + SPIN.h / 2 + Math.sin(t * 2) * 0.008;
    lit.set(spin0, TT.x, y, TT.z, SPIN.w, SPIN.h, SPIN.d, 0, ry, 0);
    lit.set(spin0 + 1, TT.x, y + SPIN.h / 2 + 0.01, TT.z, SPIN.w + 0.004, 0.02, SPIN.d + 0.004, 0, ry, 0); // gold lid band, above the cover
    if (!spinCover) return;
    _e.set(0, ry, 0);
    _q.setFromEuler(_e);
    _m.compose(_p.set(TT.x, y, TT.z), _q, _s);
    for (let k = 0; k < 8; k++) {
      _v.fromArray(spinLocal, k * 3).applyMatrix4(_m);
      spinCover.pos.setXYZ(spinCover.start + k, _v.x, _v.y, _v.z);
    }
    spinCover.pos.needsUpdate = true;
  });
  room.place(kit.plant({ size: 1.05, pot: PALETTE.maroon }), -3.12, 3.35);
  room.place(kit.plant({ size: 1.2, pot: PALETTE.goldDeep }), 3.08, 3.2);
  room.place(kit.plant({ size: 0.85, pot: PALETTE.cream }), -3.17, -3.66);
  room.place(kit.plant({ size: 0.85, pot: PALETTE.cream }), 3.17, -3.66);
  for (const [px, pz, r] of [[-3.12, 3.35, 0.32], [3.08, 3.2, 0.36], [-3.17, -3.66, 0.28], [3.17, -3.66, 0.28]]) shadeDisc(shade, px, pz, r, r, 0.28);
  S.boxMin(-0.76, 0, 3.18, 0.76, 0.04, 3.97, PALETTE.maroonDeep);
  signsB.push({ rect: [0, 816, 460, 206], w: 1.44, h: 0.645, matrix: mat4(0, 0.043, 3.575, -Math.PI / 2) });
  roundRug(S, 0, 0.35, 1.45);

  // ---------------- stations ----------------
  room.addStation({
    id: 'tpl-intro', x: -0.95, z: 2.45, look: { x: -2.4, z: 1.75 }, emote: 'point', face: 'smile', labelY: 2.3,
    line: { my: '၃ နှစ်ကျော် အတွေ့အကြုံတွေကို စုစည်းထားတာပါရှင့်', en: "I've packed 3+ years of experience into these." },
  });
  const gems = []; // the product stations' marker gems, re-placed above their box every frame
  PRODUCTS.forEach((p, i) => {
    const st = room.addStation({ id: p.id, x: NICHE_X[i], z: -1.75, look: { x: NICHE_X[i], z: PED.z }, emote: p.emote, face: p.face, labelY: 2.75, line: p.line });
    const gem = st.marker?.children.find((o) => o.isMesh && o.geometry?.type === 'OctahedronGeometry');
    if (gem) gems.push({ gem, dz: GEM.z - st.z });
  });

  // ---------------- signs ----------------
  PRODUCTS.forEach((p, i) => drawPriceTag(atlasA, TAG_RECTS[i], p));
  drawShopName(atlasB, 0, 0, 1024, 320);
  drawExperience(atlasB, 0, 328, 1024, 480);
  drawWelcomeMat(atlasB, 0, 816, 460, 206);
  const signMeshes = [atlasMesh(atlasA, signsA, 'signsProducts'), atlasMesh(atlasB, signsB, 'signsCounter')];
  for (const m of signMeshes) G.add(m);
  room.textures.push(atlasA.texture, atlasB.texture);

  // ---------------- finish ----------------
  const decor = S.mesh({ outline: true, px: 1.4 });
  decor.name = 'templatesDecor';
  G.add(decor);
  fx.seal();
  G.add(fx.group);
  const glowMesh = glow.mesh('templatesGlow');
  G.add(glowMesh);
  const shadeMesh = shade.mesh('templatesShade');
  shadeMesh.renderOrder = 1;
  G.add(shadeMesh);
  lit.seal();
  G.add(lit.group);
  // her real covers: one unlit mesh per cover texture (every quad that shows that cover)
  const coverMeshes = [];
  ART_KEYS.forEach((key, i) => {
    if (!coverTex[i] || !covers[key].length) return; // image missing: the faces keep their box colour
    const mesh = coverMesh(coverTex[i], covers[key], `cover_${key}`);
    G.add(mesh);
    coverMeshes.push(mesh);
    if (key === 'tplCreator') {
      const pos = mesh.geometry.attributes.position;
      pos.setUsage(THREE.DynamicDrawUsage); // the turning box's two quads move every frame
      spinCover = { pos, start: spinFirst * 4 };
    }
  });
  room.bake();

  room.animators.push((dt, t, state) => {
    att.intro = damp(att.intro, attentionTarget(state, 'tpl-intro'), 5, dt);
    for (let i = 0; i < 3; i++) att.boxes[i] = damp(att.boxes[i], attentionTarget(state, PRODUCTS[i].id), 5, dt);
    for (let i = 0; i < tick.length; i++) tick[i](dt, t);
    // the kit has just bobbed the station gems at their usual height; lift the product ones above their box
    for (let i = 0; i < gems.length; i++) gems[i].gem.position.set(0, GEM.y + Math.sin(t * 2.2) * GEM.bob, gems[i].dz);
    glowMesh.material.opacity = 0.88 + 0.12 * Math.sin(t * 1.6);
    fx.commit();
    lit.commit();
  });

  room.update(0, 0, {}); // place the lids, FX, the turning cover and the gems before the first frame

  // (the cover textures are shared and owned by art.js: only their materials are disposed here)
  const ownMaterials = [glowMesh.material, shadeMesh.material, ...signMeshes.map((m) => m.material), ...coverMeshes.map((m) => m.material)];
  const baseDispose = room.dispose;
  room.dispose = () => {
    room.scene.traverse((o) => {
      if (o.isInstancedMesh) o.dispose(); // frees instanceMatrix / instanceColor buffers
    });
    baseDispose();
    for (const m of ownMaterials) m.dispose();
  };
  return room;
}

// ---------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------
/** Left half of a stepped (blocky) arch outline, bottom to top. */
function archPoints(R, spring, y0, steps) {
  const left = [[-R, y0], [-R, spring]];
  for (let k = 0; k < steps; k++) {
    const ym = ((k + 0.5) * R) / steps;
    const hw = Math.sqrt(Math.max(0, R * R - ym * ym));
    left.push([-hw, spring + (k * R) / steps], [-hw, spring + ((k + 1) * R) / steps]);
  }
  return left;
}
/** Closed stepped-arch shape, grown outward by `pad` (for the gold border). */
function archShape(left, pad) {
  const pts = left.map(([px, py], i) => [px - pad, i === 0 ? py : py + pad]);
  const all = pts.concat(pts.slice().reverse().map(([px, py]) => [-px, py]));
  const s = new THREE.Shape();
  s.moveTo(all[0][0], all[0][1]);
  for (let i = 1; i < all.length; i++) s.lineTo(all[i][0], all[i][1]);
  s.closePath();
  return s;
}
/** Arch niche on the back wall: one-piece stepped gold border + tinted panel (no seams between steps). */
function archNiche(v, x, tint) {
  const R = 0.81;
  const spring = 1.72;
  const left = archPoints(R, spring, 0.15, 6);
  const border = new THREE.ExtrudeGeometry(archShape(left, 0.075), { depth: 0.012, bevelEnabled: false });
  const panel = new THREE.ExtrudeGeometry(archShape(left, 0), { depth: 0.008, bevelEnabled: false });
  v.add(border, PALETTE.gold, mat4(x, 0, BACK));
  v.add(panel, tint, mat4(x, 0, BACK + 0.012));
  border.dispose();
  panel.dispose();
  addSparkle(v, x, spring + R + 0.22, BACK + 0.03, 0.2, PALETTE.gold, { depth: 0.04 });
}

/** Small wall spotlight above a niche, aimed down at the box. */
function spotCan(v, x, y, back) {
  v.boxMin(x - 0.07, y - 0.05, back, x + 0.07, y + 0.1, back + 0.03, PALETTE.gold);
  v.boxMin(x - 0.02, y - 0.01, back + 0.03, x + 0.02, y + 0.03, back + 0.2, PALETTE.goldDeep);
  const c = new VoxelBuilder();
  c.box(0, 0, 0, 0.15, 0.2, 0.15, PALETTE.ink);
  c.box(0, -0.105, 0, 0.17, 0.025, 0.17, PALETTE.gold);
  v.merge(c, mat4(x, y - 0.03, back + 0.25, 0.5, 0, 0));
}

function pedestal(color) {
  const v = new VoxelBuilder();
  const { w, d, h } = PED;
  v.boxMin(-w / 2, 0, -d / 2, w / 2, 0.1, d / 2, PALETTE.gold);
  v.boxMin(-w / 2 + 0.08, 0.1, -d / 2 + 0.07, w / 2 - 0.08, h - 0.1, d / 2 - 0.07, PALETTE.maroon);
  v.boxMin(-w / 2 + 0.06, h - 0.18, -d / 2 + 0.05, w / 2 - 0.06, h - 0.1, d / 2 - 0.05, color); // colour band
  v.boxMin(-w / 2, h - 0.1, -d / 2, w / 2, h, d / 2, PALETTE.gold);
  v.boxMin(-w / 2 - 0.02, h - 0.03, -d / 2 - 0.02, w / 2 + 0.02, h, d / 2 + 0.02, PALETTE.goldDeep);
  // fluted gold pilasters at the corners, a sunk side panel and a darker plinth line
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      v.box(sx * (w / 2 - 0.1), (h - 0.08) / 2 + 0.05, sz * (d / 2 - 0.085), 0.06, h - 0.3, 0.06, PALETTE.gold);
      v.box(sx * (w / 2 - 0.1), 0.15, sz * (d / 2 - 0.085), 0.08, 0.05, 0.08, PALETTE.goldDeep);
    }
    v.boxMin(sx * (w / 2 - 0.08) - 0.006, 0.2, -d / 2 + 0.17, sx * (w / 2 - 0.08) + 0.006, h - 0.25, d / 2 - 0.17, PALETTE.maroonDeep);
  }
  v.boxMin(-w / 2 - 0.005, 0.0, -d / 2 - 0.005, w / 2 + 0.005, 0.03, d / 2 + 0.005, PALETTE.goldDeep);
  const grp = new THREE.Group();
  grp.name = 'pedestal';
  grp.add(v.mesh({ outline: true, px: 1.5 }));
  grp.userData.footprint = { w, d };
  return grp;
}

/**
 * Giant product box (static part): body, page stack inside, gold band round the sides and back; the
 * lid is instanced. The front stays clear for the real cover (COVER, added by the room): nothing is
 * built in front of it, the corner guards sit just outside its edges.
 */
function productBox(v, x, color) {
  const { w, h, d, z } = BOX;
  const y0 = PED.h;
  v.boxMin(x - w / 2, y0, z - d / 2, x + w / 2, y0 + h - 0.03, z + d / 2, color);
  const t = 0.035;
  v.boxMin(x - w / 2, y0 + h - 0.03, z - d / 2, x - w / 2 + t, y0 + h, z + d / 2, color); // rim walls
  v.boxMin(x + w / 2 - t, y0 + h - 0.03, z - d / 2, x + w / 2, y0 + h, z + d / 2, color);
  v.boxMin(x - w / 2 + t, y0 + h - 0.03, z - d / 2, x + w / 2 - t, y0 + h, z - d / 2 + t, color);
  v.boxMin(x - w / 2 + t, y0 + h - 0.03, z + d / 2 - t, x + w / 2 - t, y0 + h, z + d / 2, color);
  v.boxMin(x - w / 2 + t, y0 + h - 0.03, z - d / 2 + t, x + w / 2 - t, y0 + h - 0.008, z + d / 2 - t, PALETTE.paper); // pages
  // gold band round the two sides and the back only (it ends under the front corner guards)
  const by0 = y0 + h - 0.13;
  const by1 = y0 + h - 0.1;
  for (const sx of [-1, 1]) v.boxMin(x + sx * (w / 2 + 0.005), by0, z - d / 2 - 0.005, x + sx * (w / 2 - 0.001), by1, z + d / 2 - 0.03, PALETTE.gold);
  v.boxMin(x - w / 2 - 0.005, by0, z - d / 2 - 0.005, x + w / 2 + 0.005, by1, z - d / 2 + 0.001, PALETTE.gold);
  v.boxMin(x + w / 2, y0 + 0.08, z - d / 2 + 0.06, x + w / 2 + 0.004, y0 + h - 0.2, z - d / 2 + 0.1, PALETTE.gold); // spine stripe
  // gold corner guards on the four upright edges (outside the cover), a darker foot band and little feet
  const gy0 = y0 + COVER.y;
  const gy1 = y0 + h - 0.005;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      v.box(x + sx * (w / 2 - 0.012), (gy0 + gy1) / 2, z + sz * (d / 2 - 0.012), 0.036, gy1 - gy0, 0.036, PALETTE.gold);
      v.box(x + sx * (w / 2 - 0.03), y0 + 0.015, z + sz * (d / 2 - 0.03), 0.07, 0.03, 0.07, PALETTE.goldDeep);
    }
  }
  v.boxMin(x - w / 2 - 0.003, y0 + 0.025, z - d / 2 - 0.003, x + w / 2 + 0.003, y0 + COVER.y - 0.005, z + d / 2 + 0.003, darker(color, 0.7));
}

/** Lid slab, hinge at the local origin (back edge), extending toward +Z. White: tinted per instance. */
function lidGeometry() {
  const v = new VoxelBuilder();
  const { w, h, d } = LID;
  v.boxMin(-w / 2, 0, 0, w / 2, h, d, '#FFFFFF');
  v.boxMin(-0.12, 0.02, d, 0.12, 0.08, d + 0.03, '#FFFFFF'); // front tab
  return v.geometry();
}

function shopCounter() {
  const v = new VoxelBuilder();
  const w = 1.6;
  const d = 0.7;
  const h = 1.0;
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h - 0.08, d / 2, PALETTE.maroon);
  v.boxMin(-w / 2 - 0.05, h - 0.08, -d / 2 - 0.05, w / 2 + 0.05, h, d / 2 + 0.05, PALETTE.gold);
  v.boxMin(-w / 2 + 0.06, 0.24, d / 2, w / 2 - 0.06, 0.76, d / 2 + 0.014, PALETTE.goldDeep); // sign backing
  v.boxMin(-w / 2 - 0.02, 0, -d / 2 - 0.02, w / 2 + 0.02, 0.08, d / 2 + 0.02, PALETTE.maroonDeep); // kick
  // service bell (front-left corner of the counter top)
  const bx = -0.62;
  const bz = 0.2;
  v.boxMin(bx - 0.1, h, bz - 0.1, bx + 0.1, h + 0.025, bz + 0.1, PALETTE.woodDark);
  v.box(bx, h + 0.06, bz, 0.15, 0.07, 0.15, PALETTE.gold);
  v.box(bx, h + 0.11, bz, 0.09, 0.04, 0.09, PALETTE.gold);
  v.box(bx, h + 0.145, bz, 0.03, 0.03, 0.03, PALETTE.goldDeep);
  // mini template boxes stacked flat at the front-right corner, her real cover on each top
  const covers = [];
  MINI.forEach((mini, k) => miniBox(v, covers, mini, mat4(0.55 + k * 0.02, h + 0.035 + k * 0.07, 0.17, 0, 0.25 - k * 0.3, 0), 0.192, 0.07, 'top'));
  // standing "3+ years" sign: gold frame on a small stand, tilted back toward the camera
  const sw = 1.3;
  const sh = 0.61;
  const tilt = -0.32;
  const sy = h + 0.44;
  const sz = -0.18;
  const f = new VoxelBuilder();
  f.boxMin(-sw / 2 - 0.06, -sh / 2 - 0.06, -0.03, sw / 2 + 0.06, sh / 2 + 0.06, 0.025, PALETTE.gold);
  addSparkle(f, 0, sh / 2 + 0.13, 0, 0.18, PALETTE.gold, { depth: 0.04 });
  v.merge(f, mat4(0, sy, sz, tilt));
  for (const sx of [-1, 1]) boxR(v, sx * 0.45, h + 0.1, sz + 0.07, 0.05, 0.26, 0.05, PALETTE.goldDeep, tilt, 0, 0);
  const grp = new THREE.Group();
  grp.name = 'shopCounter';
  grp.add(v.mesh({ outline: true, px: 1.5 }));
  grp.userData.footprint = { w: w + 0.1, d: d + 0.1 };
  grp.userData.signLocal = mat4(0, sy, sz, tilt).multiply(mat4(0, 0, 0.03));
  grp.userData.covers = covers;
  return grp;
}

/** Shelf of mini template boxes and books (faces +Z; place rotated against a side wall). */
function productShelf(seed) {
  const v = new VoxelBuilder();
  const w = 1.6;
  const h = 1.95;
  const d = 0.4;
  const wood = PALETTE.woodDark;
  v.boxMin(-w / 2, 0, -d / 2, -w / 2 + 0.06, h, d / 2, wood);
  v.boxMin(w / 2 - 0.06, 0, -d / 2, w / 2, h, d / 2, wood);
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.04, PALETTE.cream);
  const rows = 4;
  const gap = h / rows;
  for (let r = 0; r <= rows; r++) v.boxMin(-w / 2, r * gap - (r === rows ? 0.06 : 0), -d / 2, w / 2, r * gap + (r === rows ? 0 : 0.05), d / 2, wood);
  const covers = [];
  const xEnd = w / 2 - 0.07; // inside the side panel
  for (let r = 0; r < rows; r++) {
    let x = -w / 2 + 0.12;
    let k = seed * 5 + r * 3;
    while (x < w / 2 - 0.2) {
      const kind = Math.floor(hash(k) * 4);
      if (kind < 3) {
        // a mini product box standing face-out, her real cover on the front (0.198 x 0.2455 face)
        const bw = 0.198;
        if (x + bw > xEnd) break;
        miniBox(v, covers, MINI[kind], mat4(x + bw / 2, r * gap + 0.05 + 0.2455 / 2, -0.01), 0.19, 0.14);
        x += bw + 0.035;
      } else {
        // a few books
        if (x + 0.22 > xEnd) break;
        for (let b = 0; b < 3; b++) {
          const bw = 0.05 + hash(k + b) * 0.02;
          v.boxMin(x, r * gap + 0.05, -0.12, x + bw, r * gap + 0.05 + 0.24 + hash(k * 3 + b) * 0.08, 0.12, jitter([PALETTE.maroon, PALETTE.cream, PALETTE.goldDeep][b], 0.06, k + b));
          x += bw + 0.01;
        }
        x += 0.04;
      }
      k++;
    }
  }
  addSparkle(v, 0, h + 0.14, 0, 0.2, PALETTE.gold, { depth: 0.04 });
  const grp = new THREE.Group();
  grp.name = 'productShelf';
  grp.add(v.mesh({ outline: true, px: 1.4 }));
  grp.userData.footprint = { w, d };
  grp.userData.covers = covers;
  return grp;
}

/** Stepped (blocky) circle outline as one Shape: no seams between the steps. */
function steppedCircle(r, rows) {
  const right = [];
  for (let k = 0; k < rows; k++) {
    const z0 = -r + (k * 2 * r) / rows;
    const z1 = z0 + (2 * r) / rows;
    const zm = (z0 + z1) / 2;
    const hw = Math.sqrt(Math.max(0, r * r - zm * zm));
    right.push([hw, z0], [hw, z1]);
  }
  const pts = right.concat(right.slice().reverse().map(([x, z]) => [-x, z]));
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}

/** Blocky round rug (stepped circles) with a gold sparkle in the middle. Flat, not solid. */
function roundRug(v, cx, cz, R) {
  const layers = [
    [R, 0.018, PALETTE.gold],
    [R - 0.1, 0.022, PALETTE.maroon],
    [R * 0.66, 0.025, PALETTE.cream],
    [R * 0.66 - 0.06, 0.028, PALETTE.maroon],
  ];
  for (const [r, top, col] of layers) {
    const g = new THREE.ExtrudeGeometry(steppedCircle(r, 12), { depth: top, bevelEnabled: false });
    v.add(g, col, mat4(cx, 0, cz, -Math.PI / 2, 0, 0)); // shape XY -> floor XZ, extrusion -> up
    g.dispose();
  }
  addSparkle(v, cx, 0.03, cz, 1.0, PALETTE.gold, { depth: 0.012, rx: -Math.PI / 2 });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + Math.PI / 8;
    addSparkle(v, cx + Math.cos(a) * R * 0.83, 0.025, cz + Math.sin(a) * R * 0.83, 0.16, PALETTE.gold, { depth: 0.01, rx: -Math.PI / 2 });
  }
}

/**
 * Display table with a cream riser: two boxes standing on the riser (blue left, black right, turned a
 * little toward the turntable between them) and four little boxes leaning on the riser's front, every
 * one showing her real cover (userData.covers, table space).
 */
function displayTable() {
  const v = new VoxelBuilder();
  const w = 1.5;
  const d = 0.62;
  const h = 0.7;
  v.boxMin(-w / 2, h - 0.07, -d / 2, w / 2, h, d / 2, PALETTE.wood);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (w / 2 - 0.08), (h - 0.07) / 2, sz * (d / 2 - 0.08), 0.08, h - 0.07, 0.08, PALETTE.woodDark);
  v.boxMin(-w / 2 + 0.06, 0.12, -d / 2 + 0.06, w / 2 - 0.06, 0.16, d / 2 - 0.06, PALETTE.woodDark); // low shelf
  v.boxMin(-0.5, h, -0.22, 0.5, h + 0.16, 0.12, PALETTE.cream); // riser
  v.boxMin(-0.52, h + 0.16, -0.24, 0.52, h + 0.18, 0.14, PALETTE.gold);
  const covers = [];
  for (const [k, sx] of [[0, -1], [2, 1]]) miniBox(v, covers, MINI[k], mat4(sx * 0.33, h + 0.18 + 0.154, -0.05, 0, -sx * 0.25, 0), 0.24, 0.09);
  // leaning on the riser's gold lip, tilted back 25 degrees: the covers look up at the camera
  for (let k = 0; k < 4; k++) miniBox(v, covers, MINI[k % 3], mat4(-0.375 + k * 0.25, h + 0.095, 0.197, -0.44, (k - 1.5) * 0.05, 0), 0.15, 0.03);
  // turntable in the middle (the mini box on it is animated in the room)
  cylinder(v, 0, h + 0.19, -0.05, 0.15, 0.02, PALETTE.maroon, { segs: 12 });
  cylinder(v, 0, h + 0.205, -0.05, 0.135, 0.015, PALETTE.gold, { segs: 12 });
  // price cards and a ribbon spool on the table top
  boxR(v, -0.62, h + 0.05, 0.02, 0.12, 0.09, 0.012, PALETTE.paper, -0.35, 0.2, 0);
  boxR(v, -0.62, h + 0.05, 0.027, 0.08, 0.02, 0.004, PALETTE.maroon, -0.35, 0.2, 0);
  cylinder(v, 0.64, h + 0.04, -0.15, 0.06, 0.08, PALETTE.boxRed, { segs: 8 });
  cylinder(v, 0.64, h + 0.04, -0.15, 0.025, 0.085, PALETTE.cream, { segs: 6 });
  boxR(v, 0.58, h + 0.005, -0.05, 0.03, 0.006, 0.2, PALETTE.boxRed, 0, 0.5, 0); // loose ribbon end
  for (let k = 0; k < 3; k++) boxR(v, -0.45 + k * 0.45, 0.2, 0.02, 0.26, 0.08, 0.2, [PALETTE.cream, PALETTE.maroon, PALETTE.cream][k], 0, k * 0.3, 0);
  const grp = new THREE.Group();
  grp.name = 'displayTable';
  grp.add(v.mesh({ outline: true, px: 1.4 }));
  grp.userData.footprint = { w, d };
  grp.userData.covers = covers;
  return grp;
}

// ---------------------------------------------------------------------------------------------
// Detail props (owner request: richer rooms)
// ---------------------------------------------------------------------------------------------
const darker = (hex, f = 0.72) => '#' + new THREE.Color(hex).multiplyScalar(f).getHexString(THREE.SRGBColorSpace);

/** Small gold diamonds where the floor tiles meet, plus a few tone-shifted tiles. */
function tileInlays(v) {
  for (let i = 1; i < 10; i++) {
    for (let j = 1; j < 12; j++) {
      const x = -3.5 + i * 0.7;
      const z = -4 + j * 0.7;
      boxR(v, x, 0.002, z, 0.11, 0.006, 0.11, (i + j) % 2 ? PALETTE.gold : '#B9893F', 0, Math.PI / 4, 0);
      boxR(v, x, 0.004, z, 0.045, 0.006, 0.045, PALETTE.maroon, 0, Math.PI / 4, 0);
    }
  }
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 11; j++) {
      const h = hash(i * 13.1 + j * 7.7);
      if (h > 0.3) continue;
      const odd = (i + j) % 2;
      const x0 = -3.5 + i * 0.7;
      const z0 = -4 + j * 0.7;
      v.boxMin(x0 + 0.02, -0.003, z0 + 0.02, x0 + 0.68, 0.003, z0 + 0.68, jitter(odd ? '#DCC6A0' : '#EBDDC2', 0.05, i * 31 + j));
    }
  }
}

/** Stack of wrapped gift boxes with ribbons and bows (free-standing, faces +Z). */
function giftStack(seed) {
  const v = new VoxelBuilder();
  const odd = seed % 2 === 1;
  const sets = [
    [0.5, 0.34, odd ? PALETTE.boxBlue : PALETTE.cream, odd ? PALETTE.gold : PALETTE.maroon],
    [0.38, 0.28, odd ? PALETTE.cream : PALETTE.maroon, odd ? PALETTE.boxRed : PALETTE.gold],
    [0.26, 0.22, odd ? PALETTE.boxRed : PALETTE.gold, odd ? PALETTE.gold : PALETTE.cream],
  ];
  let y = 0;
  sets.forEach(([s, h, c, rib], k) => {
    const ry = (k - 1) * 0.22 * (seed % 2 ? -1 : 1);
    const g = new VoxelBuilder();
    g.box(0, h / 2, 0, s, h, s, c);
    g.box(0, 0.015, 0, s + 0.006, 0.03, s + 0.006, darker(c, 0.82)); // darker foot
    g.box(0, h / 2, 0, s + 0.008, h + 0.004, 0.06, rib);
    g.box(0, h / 2, 0, 0.06, h + 0.004, s + 0.008, rib);
    if (k === 2) {
      boxR(g, -0.06, h + 0.04, 0, 0.11, 0.07, 0.04, rib, 0, 0, 0.55);
      boxR(g, 0.06, h + 0.04, 0, 0.11, 0.07, 0.04, rib, 0, 0, -0.55);
      g.box(0, h + 0.025, 0, 0.05, 0.045, 0.05, darker(rib, 0.85));
      boxR(g, -0.04, h - 0.03, s / 2 + 0.01, 0.03, 0.1, 0.012, rib, 0, 0, 0.3); // ribbon tails
      boxR(g, 0.04, h - 0.03, s / 2 + 0.01, 0.03, 0.1, 0.012, rib, 0, 0, -0.3);
    }
    v.merge(g, mat4(0, y, 0, 0, ry, 0));
    y += h;
  });
  const grp = new THREE.Group();
  grp.name = 'giftStack';
  grp.add(v.mesh({ outline: true, px: 1.4 }));
  grp.userData.footprint = { w: 0.56, d: 0.56 };
  return grp;
}

/** Framed mini poster painted in blocks: a product box with a quill on a tinted card. */
function boxPoster(v, x, y, z, key, addCover) {
  const cw = 0.32; // her real cover, 4:5, in a gold frame
  const ch = 0.4;
  const b = 0.03;
  const w = cw + 2 * b;
  const h = ch + 2 * b;
  v.boxMin(x - w / 2, y - h / 2, z, x + w / 2, y + h / 2, z + 0.03, PALETTE.gold);
  v.boxMin(x - w / 2 + 0.012, y - h / 2 + 0.012, z + 0.03, x + w / 2 - 0.012, y + h / 2 - 0.012, z + 0.034, PALETTE.goldDeep); // inner lip
  addCover(key, cw, ch, mat4(x, y, z + 0.034 + ART_OFF));
  for (const sx of [-1, 1]) addSparkle(v, x + sx * (w / 2 + 0.035), y + h / 2 + 0.02, z + 0.02, 0.06, PALETTE.gold, { depth: 0.006 });
  v.box(x, y + h / 2 + 0.05, z + 0.01, 0.012, 0.1, 0.012, PALETTE.goldDeep);
  v.box(x, y + h / 2 + 0.1, z + 0.02, 0.035, 0.035, 0.035, PALETTE.gold);
}

/** Pushes a prop's cover quads (userData.covers, prop space) to the room's cover lists in room space. */
function placeCovers(obj, addCover) {
  for (const c of obj.userData.covers || []) addCover(c.key, c.w, c.h, obj.matrixWorld.clone().multiply(c.matrix));
}

const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _scale = new THREE.Matrix4();
/**
 * Mini template box (into VoxelBuilder v) wearing her real cover: a cw x 1.25cw (4:5) cover fills the
 * front (+Z) face, or the top (+Y, the cover's top edge away from the camera), with a 4 mm margin;
 * `thick` is the box's third size. m: box centre and turn. Pushes { key, w, h, matrix } to covers.
 */
function miniBox(v, covers, [color, key], m, cw, thick, face = 'front') {
  const ch = cw * 1.25;
  const fw = cw + 0.008;
  const fh = ch + 0.008;
  v.add(UNIT, color, m.clone().multiply(face === 'top' ? _scale.makeScale(fw, thick, fh) : _scale.makeScale(fw, fh, thick)));
  const local = face === 'top' ? mat4(0, thick / 2 + ART_OFF, 0, -Math.PI / 2, 0, 0) : mat4(0, 0, thick / 2 + ART_OFF);
  covers.push({ key, w: cw, h: ch, matrix: m.clone().multiply(local) });
}

/** One unlit mesh showing a shared cover texture on many quads (each quad shows the whole cover). */
function coverMesh(tex, items, name) {
  const geos = items.map(({ w, h, matrix }) => {
    const g = new THREE.PlaneGeometry(w, h);
    g.deleteAttribute('normal');
    return g.applyMatrix4(matrix);
  });
  const geo = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  geo.computeBoundingSphere();
  geo.boundingSphere.radius += 0.3; // room for the turning box's quads
  const mesh = new THREE.Mesh(geo, artMaterial(tex, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  mesh.name = name;
  mesh.userData.dynamic = true; // not merged by room.bake()
  mesh.raycast = () => {};
  return mesh;
}

/** Paper shopping bags with rope handles (free-standing). */
function shoppingBags() {
  const v = new VoxelBuilder();
  const bags = [[-0.12, 0.02, 0.3, 0.38, 0.14, PALETTE.maroon, 0.15], [0.16, 0.06, 0.26, 0.32, 0.12, PALETTE.cream, -0.25], [0.02, 0.2, 0.22, 0.28, 0.1, PALETTE.gold, 0.4]];
  for (const [bx, bz, w, h, d, c, ry] of bags) {
    const g = new VoxelBuilder();
    g.box(0, h / 2, 0, w, h, d, c);
    g.box(0, h - 0.02, 0, w + 0.004, 0.04, d + 0.004, darker(c, 0.85)); // folded top
    for (const sx of [-1, 1]) g.box(sx * w * 0.22, h + 0.05, 0, 0.018, 0.1, 0.018, c === PALETTE.gold ? PALETTE.maroon : PALETTE.gold);
    g.box(0, h + 0.1, 0, w * 0.44 + 0.018, 0.018, 0.018, c === PALETTE.gold ? PALETTE.maroon : PALETTE.gold);
    addSparkle(g, 0, h * 0.5, d / 2 + 0.004, 0.1, c === PALETTE.gold ? PALETTE.maroon : PALETTE.gold, { depth: 0.008 });
    g.boxMin(-w * 0.3, h * 0.82, -d / 2 + 0.01, w * 0.3, h + 0.06, d / 2 - 0.01, '#FBF6EA'); // tissue paper
    v.merge(g, mat4(bx, 0, bz, 0, ry, 0));
  }
  const grp = new THREE.Group();
  grp.name = 'shoppingBags';
  grp.add(v.mesh({ outline: true, px: 1.4 }));
  grp.userData.footprint = { w: 0.6, d: 0.5 };
  return grp;
}

/** Blocky cash register (local frame on the counter top, faces +Z). */
function cashRegister(v, m) {
  const r = new VoxelBuilder();
  r.boxMin(-0.19, 0, -0.14, 0.19, 0.08, 0.15, PALETTE.maroonDeep); // drawer base
  r.boxMin(-0.185, 0.025, 0.15, 0.185, 0.06, 0.156, PALETTE.gold); // drawer line
  r.box(0, 0.042, 0.158, 0.06, 0.016, 0.008, PALETTE.gold); // handle
  boxR(r, 0, 0.12, 0.04, 0.34, 0.09, 0.2, PALETTE.maroon, -0.35, 0, 0); // sloped key deck
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) boxR(r, -0.1 + j * 0.065, 0.17 - i * 0.022, 0.0 + i * 0.05, 0.045, 0.02, 0.036, i === 0 && j === 3 ? PALETTE.gold : PALETTE.cream, -0.35, 0, 0);
  r.boxMin(-0.16, 0.12, -0.14, 0.16, 0.3, -0.06, PALETTE.maroon); // display tower
  r.boxMin(-0.13, 0.2, -0.061, 0.13, 0.27, -0.055, '#2E3B35'); // display
  r.boxMin(-0.1, 0.225, -0.056, 0.06, 0.245, -0.052, '#9FE0B0'); // digits glow
  r.boxMin(-0.17, 0.3, -0.15, 0.17, 0.32, -0.05, PALETTE.gold);
  boxR(r, 0.12, 0.36, -0.1, 0.07, 0.11, 0.004, PALETTE.white, -0.2, 0, 0.1); // receipt curling out
  v.merge(r, m);
}
// price tags in atlasA (1024 x 512); the box covers are her real artwork (art.js), not drawn here
const TAG_RECTS = [[0, 0, 576, 164], [0, 172, 576, 164], [0, 344, 576, 164]];

function drawPriceTag(atlas, rect, p) {
  const [x0, y0, W, H] = rect;
  const g = atlas.ctx;
  const notch = 46;
  g.save();
  // tag silhouette: clipped left end with a punched hole
  g.beginPath();
  g.moveTo(x0 + notch, y0 + 6);
  g.lineTo(x0 + W - 22, y0 + 6);
  g.arcTo(x0 + W - 6, y0 + 6, x0 + W - 6, y0 + 22, 16);
  g.lineTo(x0 + W - 6, y0 + H - 22);
  g.arcTo(x0 + W - 6, y0 + H - 6, x0 + W - 22, y0 + H - 6, 16);
  g.lineTo(x0 + notch, y0 + H - 6);
  g.lineTo(x0 + 6, y0 + H / 2);
  g.closePath();
  g.fillStyle = '#FBF5E8';
  g.fill();
  g.lineWidth = 7;
  g.strokeStyle = '#C9A24A';
  g.stroke();
  g.fillStyle = p.color;
  g.fillRect(x0 + notch + 26, y0 + 22, 12, H - 44);
  g.globalCompositeOperation = 'destination-out';
  g.beginPath();
  g.arc(x0 + 40, y0 + H / 2, 11, 0, TAU);
  g.fill();
  g.globalCompositeOperation = 'source-over';
  g.lineWidth = 4;
  g.strokeStyle = '#C9A24A';
  g.beginPath();
  g.arc(x0 + 40, y0 + H / 2, 13, 0, TAU);
  g.stroke();
  g.restore();
  // one line: small Burmese "price" label, then the price, big
  const lw = atlasTextLeft(atlas, x0 + 104, y0 + H / 2 + 2, 'ဈေးနှုန်း', { size: 30, weight: 700, font: FONT_MY, color: PALETTE.goldDeep });
  const px0 = x0 + 104 + lw + 10;
  atlasText(atlas, px0, y0 + 8, x0 + W - 12 - px0, H - 16, [{ text: p.price, size: 70, weight: 600, font: FONT_SERIF, color: PALETTE.maroon }]);
}

function drawShopName(atlas, x0, y0, W, H) {
  const g = atlas.ctx;
  g.save();
  g.fillStyle = '#FBF5E8';
  roundRect(g, x0 + 6, y0 + 6, W - 12, H - 12, 26);
  g.fill();
  g.lineWidth = 10;
  g.strokeStyle = '#C9A24A';
  roundRect(g, x0 + 6, y0 + 6, W - 12, H - 12, 26);
  g.stroke();
  g.lineWidth = 3;
  g.strokeStyle = 'rgba(201,162,74,0.7)';
  roundRect(g, x0 + 26, y0 + 26, W - 52, H - 52, 16);
  g.stroke();
  drawSparkle2D(g, x0 + 80, y0 + H / 2, 26, '#C9A24A');
  drawSparkle2D(g, x0 + W - 80, y0 + H / 2, 26, '#C9A24A');
  g.restore();
  // "Template" in her serif + "ဆိုင်" in the Myanmar face, centred together
  const a = { text: 'Template', size: 112, weight: 600, font: FONT_SERIF, color: PALETTE.maroon };
  const b = { text: 'ဆိုင်', size: 92, weight: 700, font: FONT_MY, color: PALETTE.maroon };
  const wa = Math.ceil(textWidth(a.text, a.size, a.weight, a.font));
  const wb = Math.ceil(textWidth(b.text, b.size, b.weight, b.font));
  const gapPx = 30;
  const left = x0 + (W - (wa + gapPx + wb)) / 2;
  atlasText(atlas, Math.round(left - 24), y0 + 40, wa + 48, H - 80, [a]);
  atlasText(atlas, Math.round(left + wa + gapPx - 24), y0 + 40, wb + 48, H - 80, [b]);
}

function drawExperience(atlas, x0, y0, W, H) {
  atlasText(atlas, x0, y0, W, H, [
    { text: '၃ နှစ်ကျော် အတွေ့အကြုံနဲ့', size: 62, color: PALETTE.maroon },
    { text: 'စုစည်းထားတဲ့', size: 62, color: PALETTE.maroon },
    { text: 'Script Writing Templates', size: 68, weight: 600, font: FONT_SERIF, color: PALETTE.bronze },
  ], { bg: '#FBF5E8', border: '#C9A24A', borderWidth: 12, radius: 26 });
  drawSparkle2D(atlas.ctx, x0 + 56, y0 + 56, 20, '#C9A24A');
  drawSparkle2D(atlas.ctx, x0 + W - 56, y0 + H - 56, 20, '#C9A24A');
}

function drawWelcomeMat(atlas, x0, y0, W, H) {
  atlasText(atlas, x0, y0, W, H, [{ text: 'ကြိုဆိုပါတယ်ရှင့်', size: 48, color: '#F6E3AE' }], { bg: PALETTE.maroon, border: PALETTE.gold, borderWidth: 12, radius: 26 });
  drawSparkle2D(atlas.ctx, x0 + 38, y0 + H / 2, 13, '#E2B85A');
  drawSparkle2D(atlas.ctx, x0 + W - 38, y0 + H / 2, 13, '#E2B85A');
}
