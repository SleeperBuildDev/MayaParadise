// Day 11's outdoor set: Hearth Row as INDEX 13.4 settles it, built by the day itself because the district
// file (world/regions/hearth.js) does not stand any buildings yet (SHARED NEED: move this into the region's
// ITEMS / DOORS so Days 9, 11 and 13 share one street). Also the two home dressings Day 11 needs (the bean
// bed in flower by the Writing Room, the "ask Maya" board by the Post Office).
//
//   const row = buildRow(story)    props + real doors (doors.js DOORS) + keep-out shapes, lazily on first call
//   row.P                          the places (world metres), see PL below
//   row.wall                       props5 noteWall handle; row.wallSlot(i) -> world {x, y, z} of note i (0..6)
//   row.sapling / row.kite / row.lamps / row.sign / row.boxes
//   row.windowAt                   world points inside the lamp shop's lit front window (5.4b is seen there)
//   row.update(dt, t)              kite, cut-away (a building between the camera and Maya is hidden whole)
//   row.dispose()
//   const home = buildHome(story)  { bed, board, bedAt, boardAt, setBoard(count, slip), update, dispose }
//
// Layout (x east, z south; the Row's road runs along z 200, x 126..258; north kerb ~197.6, south ~202.4):
//   north side (fronts face +Z): bakery x 191.5..200.5 · oven-lane gap · Note Wall x 204.4..211.7 · desk
//     hearthClass (214, 194.4, the region's) · ... · tea shop x 243.4..248.6 · kite bench + sunny patch (NE end)
//   south side (fronts face -Z, toward the road): noodle house x 191.5..198.5 (across from the bakery) · the
//     workshop lane's mouth x 199.7..204.4 · evening class x 204.5..211.5 (across from the Note Wall)
//   workshop lane, running south from the Row: lamp shop on its west side (door faces east, first door) ·
//     box shop on its east side three doors down (door faces west)
import * as THREE from '../game/three.js';
import { VoxelBuilder } from '../game/voxel.js';
import { bakeryFront, noteWall, noodleShopFront, eveningClass, kiteBench, tinSapling, shopSign, tinLampRow, paperBoxTower, paperBox, noticeBoard } from './props5.js';
import { teaShop } from './props3.js';
import { beanPlanter } from './props2.js';
import { DOORS, registerDoors } from './doors.js';

const HP = Math.PI / 2;

/** Places on the Row (world metres). `door` = the threshold doors.js triggers on; `front` = where people stand outside it. */
export const PL = {
  bakery: { x: 196, z: 192.0, ry: 0, door: { x: 196, z: 195.15, facing: 0 } },
  wall: { x: 208, z: 194.3, ry: 0 }, // notes face +Z; stool at its west end, bare earth at its east end
  tea: { x: 246, z: 193.1, ry: 0 },
  kite: { x: 252.6, z: 194.0 },
  patch: { x: 254.6, z: 195.7 }, // the bare patch beside the kite bench, in full sun (piece 3's planting)
  noodle: { x: 195, z: 207.6, ry: Math.PI, door: { x: 195, z: 204.95, facing: Math.PI } },
  klass: { x: 208, z: 207.6, ry: Math.PI, door: { x: 208, z: 204.75, facing: Math.PI } },
  steps: { x: 208, z: 203.6 }, // the class's front steps (teens eat here; piece 5's fold)
  laneMouth: { x: 202.0, z: 203.4 }, // where the workshop lane leaves the Row (Maya watches 5.4b from here)
  lamp: { x: 197.4, z: 216.0, ry: HP, w: 6, d: 4.6, door: { x: 199.75, z: 216.9, facing: HP } },
  box: { x: 206.6, z: 229.0, ry: -HP, w: 5, d: 4.4, door: { x: 204.35, z: 228.2, facing: -HP } },
  ww: null, // home (filled by buildHome)
};
// the region's desks (regions/hearth.js DESKS): kept clear
export const DESK_CLASS = { x: 214, z: 194.4 };

const disposeTree = (root) => root?.traverse?.((o) => {
  if (o.geometry && !o.userData.sharedGeo) o.geometry.dispose();
  const m = o.material;
  if (Array.isArray(m)) m.forEach((x) => x.dispose?.()); else m?.dispose?.();
});

/** Local (x, z) in a group turned ry about Y at (cx, cz) -> world. */
function toWorld(cx, cz, ry, x, z) {
  const c = Math.cos(ry), s = Math.sin(ry);
  return { x: cx + x * c + z * s, z: cz - x * s + z * c };
}
/** Axis-aligned world box for a W (along local x) by D (along local z) footprint turned ry. */
function footprint(cx, cz, ry, W, D, pad = 0) {
  const q = Math.abs(Math.round(ry / HP)) % 2 === 1;
  const hw = (q ? D : W) / 2 - pad, hd = (q ? W : D) / 2 - pad;
  return { type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd };
}

// ---------------------------------------------------------------------------------------------
// two small workshop shells (no prop in props5 yet): a plank shophouse with a door, a lit front window
// cut deep enough that people can stand in it, a tin roof; front faces +Z in the local frame
// ---------------------------------------------------------------------------------------------
function workshop({ w = 6, d = 4.6, h = 3.1, wall = '#D9C7A4', wallD = '#B9A27C', trim = '#5E3F27', roof = '#8C5A3C', door = -0.9, win = 1.3, winW = 1.7 } = {}) {
  const root = new THREE.Group();
  const v = new VoxelBuilder();
  const Z = d / 2, y0 = 0.2;
  const DW = 1.0, DH = 2.05, WY0 = 0.95, WY1 = 2.05;
  const wx0 = win - winW / 2, wx1 = win + winW / 2;
  v.boxMin(-w / 2 - 0.1, 0, -Z - 0.1, w / 2 + 0.1, y0, Z + 0.1, '#A39484'); // plinth
  // back and sides
  v.boxMin(-w / 2, y0, -Z, w / 2, h, -Z + 0.2, wallD);
  v.boxMin(-w / 2, y0, -Z, -w / 2 + 0.2, h, Z, wall);
  v.boxMin(w / 2 - 0.2, y0, -Z, w / 2, h, Z, wall);
  // the front skin with a door hole and a window hole
  const fz0 = Z - 0.2, fz1 = Z;
  const segs = [[-w / 2, door - DW / 2], [door + DW / 2, wx0], [wx1, w / 2]];
  for (const [a, b] of segs) if (b > a) v.boxMin(a, y0, fz0, b, h, fz1, wall);
  v.boxMin(door - DW / 2, y0 + DH, fz0, door + DW / 2, h, fz1, wall); // over the door
  v.boxMin(wx0, y0, fz0, wx1, WY0, fz1, wall); // under the window
  v.boxMin(wx0, WY1, fz0, wx1, h, fz1, wall); // over the window
  // the inside behind the holes: a dim room behind the door, a lit nook behind the window
  v.boxMin(door - DW / 2, y0, fz0 - 1.0, door + DW / 2, y0 + DH, fz0 - 0.95, '#3B2A20');
  v.boxMin(wx0 - 0.05, y0, Z - 1.6, wx1 + 0.05, h - 0.2, Z - 1.55, '#F2D6A2'); // nook back wall (warm)
  v.boxMin(wx0 - 0.1, y0, Z - 1.6, wx0 - 0.05, h - 0.2, fz0, '#EBCB94');
  v.boxMin(wx1 + 0.05, y0, Z - 1.6, wx1 + 0.1, h - 0.2, fz0, '#EBCB94');
  v.boxMin(wx0 - 0.1, h - 0.25, Z - 1.6, wx1 + 0.1, h - 0.2, fz0, '#E1BE86');
  v.boxMin(wx0, y0, Z - 1.6, wx1, y0 + 0.02, fz0, '#8C6A48'); // nook floor
  v.boxMin(wx0 + 0.1, y0, Z - 0.75, wx1 - 0.1, y0 + 0.9, Z - 0.5, '#7A5434'); // the counter in the window
  v.boxMin(wx0 + 0.05, y0 + 0.9, Z - 0.8, wx1 - 0.05, y0 + 0.95, Z - 0.45, '#9C7350');
  // trims: door frame, door leaf standing open inward, window frame, sill
  v.boxMin(door - DW / 2 - 0.08, y0, fz1, door - DW / 2, y0 + DH + 0.08, fz1 + 0.05, trim);
  v.boxMin(door + DW / 2, y0, fz1, door + DW / 2 + 0.08, y0 + DH + 0.08, fz1 + 0.05, trim);
  v.boxMin(door - DW / 2 - 0.08, y0 + DH, fz1, door + DW / 2 + 0.08, y0 + DH + 0.1, fz1 + 0.05, trim);
  v.box(door - DW / 2 + 0.06, y0 + DH / 2, fz0 - 0.45, 0.06, DH - 0.05, 0.9, '#7A4A2E');
  v.boxMin(wx0 - 0.08, WY0 - 0.06, fz1, wx1 + 0.08, WY0, fz1 + 0.16, trim);
  v.boxMin(wx0 - 0.08, WY1, fz1, wx1 + 0.08, WY1 + 0.08, fz1 + 0.05, trim);
  for (const x of [wx0 - 0.04, wx1 + 0.04]) v.box(x, (WY0 + WY1) / 2, fz1 + 0.025, 0.08, WY1 - WY0, 0.05, trim);
  // a step and a tin roof sloping to the front
  v.boxMin(door - 0.6, 0, Z, door + 0.6, 0.12, Z + 0.4, '#B4A592');
  const rl = Math.hypot(d + 0.6, 0.7), ra = Math.atan2(0.7, d + 0.6);
  const rg = new THREE.BoxGeometry(w + 0.5, 0.08, rl);
  const rm = new THREE.Matrix4().makeRotationX(ra).setPosition(0, h + 0.35, 0.1);
  v.add(rg, roof, rm);
  rg.dispose();
  for (let k = 0; k < 9; k++) v.box(-w / 2 + 0.2 + k * (w / 8.2), h + 0.08, Z + 0.32, 0.03, 0.03, 0.06, '#6E4630');
  root.add(v.mesh({ px: 1.4 }));
  root.userData.nook = { x: win, z: Z - 1.0 }; // where people stand to be seen through the window (local)
  root.userData.doorLocal = { x: door, z: Z };
  return root;
}

// ---------------------------------------------------------------------------------------------
// the Row
// ---------------------------------------------------------------------------------------------
export function buildRow(story) {
  const { game } = story;
  const scene = game.world.scene;
  const own = []; // { root, dispose }
  const obs = []; // keep-out shapes added to the open world's space (neutralised on dispose)
  const blockers = []; // { root, box: Box3 }
  const doorIds = [];

  const put = (h, x, z, ry = 0) => { const root = h.root || h; root.position.set(x, 0, z); root.rotation.y = ry; scene.add(root); own.push(h); return h; };
  const block = (root, b, height) => { blockers.push({ root, box: new THREE.Box3(new THREE.Vector3(b.minX, 0, b.minZ), new THREE.Vector3(b.maxX, height, b.maxZ)) }); };
  const keepOut = (list) => { obs.push(...list); story.openWorld?.space?.add(list); };

  // north side
  const bakery = put(bakeryFront({ open: 0.45 }), PL.bakery.x, PL.bakery.z);
  const bB = footprint(PL.bakery.x, PL.bakery.z, 0, 9.0, 6.0, 0.05); bB.maxZ = PL.bakery.z + 2.95;
  keepOut([bB]); block(bakery.root, bB, 6);
  const wall = put(noteWall({ notes: 7, curl: 0.75 }), PL.wall.x, PL.wall.z);
  keepOut([{ type: 'box', minX: PL.wall.x - 3.55, maxX: PL.wall.x + 3.55, minZ: PL.wall.z - 0.2, maxZ: PL.wall.z + 0.3 }]);
  const tea = put(teaShop({}), PL.tea.x, PL.tea.z);
  const tB = footprint(PL.tea.x, PL.tea.z, 0, 5.2, 3.8, 0.05);
  keepOut([tB]); block(tea.root, tB, 4.2);
  const kite = put(kiteBench(), PL.kite.x, PL.kite.z);
  keepOut([{ type: 'circle', x: PL.kite.x, z: PL.kite.z, r: 0.75 }]);
  const sapling = put(tinSapling({ planted: true }), PL.patch.x, PL.patch.z);
  sapling.root.visible = false; // until Maung Pan plants it today

  // south side (fronts face the road, -Z)
  const noodle = put(noodleShopFront({ open: 0.9, lit: 1 }), PL.noodle.x, PL.noodle.z, PL.noodle.ry);
  const nB = footprint(PL.noodle.x, PL.noodle.z, 0, 7, 5, 0.05);
  keepOut([nB]); block(noodle.root, nB, 4.6);
  const klass = put(eveningClass({ open: 1, lit: 0.6 }), PL.klass.x, PL.klass.z, PL.klass.ry);
  const kB = footprint(PL.klass.x, PL.klass.z, 0, 7, 5, 0.05);
  keepOut([kB]); block(klass.root, kB, 4.6);
  // the lunch boxes left on the class steps, west of the door
  const boxes = put(paperBoxTower(6, { seed: 11 }), PL.steps.x - 1.7, PL.steps.z + 0.3, 0.3);

  // the workshop lane: lamp shop (west side, door east) and box shop (east side, door west)
  const lampG = workshop({ w: PL.lamp.w, d: PL.lamp.d, wall: '#C9B79A', wallD: '#A8957A', roof: '#6E6A62', door: -0.9, win: 1.3 });
  put(lampG, PL.lamp.x, PL.lamp.z, PL.lamp.ry);
  const lB = footprint(PL.lamp.x, PL.lamp.z, PL.lamp.ry, PL.lamp.w, PL.lamp.d, 0.05);
  keepOut([lB]); block(lampG, lB, 4.2);
  const sign = shopSign({ text: { my: 'သံပြား မီးအိန်', en: 'Tin lamps' }, w: 1.6, h: 0.45, colors: { bg: '#2F5E63', fg: '#F6F0E2', sub: '#E9D9B8' } });
  sign.root.position.set(-0.9, 2.62, PL.lamp.d / 2 + 0.02);
  lampG.add(sign.root);
  own.push({ dispose: () => sign.dispose() });
  const boxG = workshop({ w: PL.box.w, d: PL.box.d, wall: '#D8C29A', wallD: '#B89E78', roof: '#8C5A3C', door: -0.8, win: 1.1, winW: 1.4 });
  put(boxG, PL.box.x, PL.box.z, PL.box.ry);
  const xB = footprint(PL.box.x, PL.box.z, PL.box.ry, PL.box.w, PL.box.d, 0.05);
  keepOut([xB]); block(boxG, xB, 4.2);
  const boxSign = paperBox({ folded: 1 }); // a folded lunch box hung over the door as its sign
  boxSign.root.scale.setScalar(2.2);
  boxSign.root.position.set(-0.8, 2.55, PL.box.d / 2 + 0.12);
  boxG.add(boxSign.root);
  own.push({ dispose: () => boxSign.dispose?.() });
  for (let k = 0; k < 3; k++) { const t = paperBoxTower(4 + k, { seed: 20 + k }); t.root.position.set(0.6 + k * 0.3, 1.0, PL.box.d / 2 - 0.9); t.root.scale.setScalar(0.7); boxG.add(t.root); own.push({ dispose: () => t.dispose() }); }

  // the lane's tin lamps: under both eaves (they come on at lamp-lighting)
  const lampPts = [];
  for (let k = 0; k < 5; k++) lampPts.push([PL.lamp.x + PL.lamp.d / 2 + 0.28, 2.5, PL.lamp.z - 2.4 + k * 1.2, HP]);
  for (let k = 0; k < 4; k++) lampPts.push([PL.box.x - PL.box.d / 2 - 0.28, 2.5, PL.box.z - 1.9 + k * 1.25, -HP]);
  lampPts.push([PL.laneMouth.x - 2.1, 2.6, 204.6, 0], [PL.laneMouth.x + 2.3, 2.6, 204.6, 0]);
  const lamps = tinLampRow(lampPts, { lit: 0 });
  scene.add(lamps.root);
  own.push(lamps);

  // real doors (doors.js): the threshold on each building's face
  const reg = [
    { room: 'bakery', ...PL.bakery.door, r: 0.85 },
    { room: 'noodlehouse', ...PL.noodle.door, r: 0.95 },
    { room: 'eveningclass', ...PL.klass.door, r: 0.85 },
    { room: 'lampshop', ...PL.lamp.door, r: 0.75 },
    { room: 'boxshop', ...PL.box.door, r: 0.75 },
    { room: 'hearthtea', x: PL.tea.x + (tea.door?.x ?? -0.9), z: PL.tea.z + (tea.door?.z ?? 2.4) - 0.45, facing: 0, r: 0.85 },
  ];
  for (const d of reg) if (!DOORS[d.room]) { doorIds.push(d.room); registerDoors([{ ...d, region: 'hearth' }]); }

  // the lamp shop's lit window: where the 5.4b scene is seen (world points, inside the nook)
  const nook = lampG.userData.nook;
  const windowAt = [toWorld(PL.lamp.x, PL.lamp.z, PL.lamp.ry, nook.x - 0.35, nook.z), toWorld(PL.lamp.x, PL.lamp.z, PL.lamp.ry, nook.x + 0.4, nook.z + 0.15)];

  // the cut-away: a building standing between the camera and Maya is hidden whole (never a torn hole)
  const ray = new THREE.Ray(), head = new THREE.Vector3(), hit = new THREE.Vector3();
  function cutaway() {
    const cam = game.camera.position;
    const m = game.maya.root;
    if (!m.parent || m.parent !== scene) { for (const b of blockers) b.root.visible = true; return; }
    head.set(m.position.x, 1.1, m.position.z);
    const far = cam.distanceTo(head);
    ray.origin.copy(cam);
    ray.direction.copy(head).sub(cam).normalize();
    for (const b of blockers) {
      const inside = b.box.containsPoint(cam);
      const p = !inside && ray.intersectBox(b.box, hit);
      b.root.visible = !(inside || (p && cam.distanceTo(hit) < far - 0.4));
    }
  }

  return {
    P: PL, wall, sapling, kite, lamps, sign, boxes, bakery, noodle, klass, tea, windowAt,
    lampShop: lampG, boxShop: boxG,
    /** World point of wall note i (0..6), at note height. */
    wallSlot(i) { const s = wall.slot ? wall.slot(i) : new THREE.Vector3(-2.76 + i * 0.92, 1.2, 0.07); return { x: PL.wall.x + s.x, y: s.y, z: PL.wall.z + s.z }; },
    signAt: toWorld(PL.lamp.x, PL.lamp.z, PL.lamp.ry, -0.9, PL.lamp.d / 2 + 0.1),
    update(dt, t) {
      kite.update?.(dt, t);
      noodle.update?.(dt, t);
      tea.update?.(dt, t);
      bakery.update?.(dt, t);
      cutaway();
    },
    dispose() {
      for (const h of own) { const r = h.root || (h.isObject3D ? h : null); if (r) { r.parent?.remove(r); if (!h.dispose) disposeTree(r); } h.dispose?.(); }
      story.openWorld?.space?.remove?.(obs); // (then emptied too: a harmless fallback)
      for (const o of obs) { if (o.type === 'circle') o.r = -1; else { o.minX = o.minZ = 1e9; o.maxX = o.maxZ = -1e9; } }
      for (const id of doorIds) delete DOORS[id];
    },
  };
}

// ---------------------------------------------------------------------------------------------
// home: the bean bed in flower by the Writing Room, U Hpo Htaw's bulb tips, the "ask Maya" board
// ---------------------------------------------------------------------------------------------
function beanFlowers() {
  // three sticks with green vines and small white-and-violet flowers (the class bean box sits below)
  const v = new VoxelBuilder();
  for (const x of [-0.3, 0, 0.3]) {
    v.box(x, 0.62, 0, 0.025, 1.0, 0.025, '#8C6A44');
    for (let k = 0; k < 9; k++) {
      const y = 0.22 + k * 0.095, a = k * 1.7 + x * 9;
      v.box(x + Math.cos(a) * 0.05, y, Math.sin(a) * 0.05, 0.05, 0.05, 0.05, k % 2 ? '#5E8F4E' : '#7FA864');
      if (k % 2 === 1) v.box(x + Math.cos(a) * 0.09, y + 0.02, Math.sin(a) * 0.09, 0.09, 0.03, 0.06, '#8DB46A');
      if (k > 2 && k % 2 === 0) v.box(x + Math.cos(a + 1) * 0.08, y + 0.03, Math.sin(a + 1) * 0.08 + 0.02, 0.045, 0.045, 0.045, k % 4 ? '#FFFDF8' : '#B79AD8');
    }
  }
  // the bulbs' green tips in a strip beside the beans
  for (let k = 0; k < 5; k++) v.box(0.62 + (k % 2) * 0.1, 0.13, -0.12 + k * 0.06, 0.03, 0.06, 0.03, '#8DB46A');
  v.boxMin(0.5, 0, -0.2, 0.86, 0.1, 0.2, '#8A6648');
  return v.mesh({ px: 1.2 });
}

export function buildHome(story, { boardCount = 30, ncNote = true } = {}) {
  const { game } = story;
  const scene = game.world.scene;
  const place = (id) => game.world.places.find((p) => p.id === id);
  const ab = place('about')?.door || { x: 0, z: 7 };
  const po = place('contact')?.door || { x: 16.3, z: 3.0 };
  const bedAt = { x: ab.x - 2.3, z: ab.z + 0.25 };
  const bed = new THREE.Group();
  const planter = beanPlanter('growing');
  bed.add(planter.root || planter);
  const fl = beanFlowers();
  bed.add(fl);
  bed.position.set(bedAt.x, 0, bedAt.z);
  scene.add(bed);
  // the "ask Maya" board is the shared one (api.js story.board, home.js ASK_BOARD): Nay Chi's note on it
  // ("what do I do next?"), or, once she took it down herself, her slip in its place
  void po;
  const boardAt = { x: story.board.x, z: story.board.z };
  const card = (slip) => [slip ? { my: '«ကျွန်မစာ', en: '"I took my note' } : { my: '«နောက်', en: '"What do I' }, slip ? { my: 'ကျွန်မ ဖြုတ်', en: 'down myself."' } : { my: 'ဘာလုပ်ရမလဲ»', en: 'do next?"' }, slip ? { my: 'သွားတယ်»', en: '' } : { my: '', en: '' }, { my: '— န', en: '— N' }];
  const setBoard = (n, slip) => story.board.set({ notes: n, gap: true, replies: 4, notice: card(slip) });
  setBoard(boardCount, !ncNote);
  const board = story.board;
  const obs = [{ type: 'box', minX: bedAt.x - 0.55, maxX: bedAt.x + 0.95, minZ: bedAt.z - 0.25, maxZ: bedAt.z + 0.25 }];
  story.openWorld?.space?.add(obs);
  return {
    bed, board, bedAt, boardAt,
    setBoard,
    update() {},
    dispose() {
      bed.parent?.remove(bed); disposeTree(bed); planter.dispose?.();
      story.openWorld?.space?.remove?.(obs);
      for (const o of obs) { if (o.type === 'circle') o.r = -1; else { o.minX = o.minZ = 1e9; o.maxX = o.maxZ = -1e9; } }
    },
  };
}
