// Day 15 (Home Book) — the finale: launch evening. No chapter of its own; the book's frame.
//
// Lesson (preface p11; ch 1 p18-19; ch 4 p36-37; ch 12 p67-68; ch 23 p110): a map only shows the road, each
// walks it and checks it with their own eyes; whoever keeps at what they love shines with a light of their
// own; nobody is the main character; say whose words you carry.
//
// The day (any order between the morning and the dusk; INDEX 13 rooms, doors.js):
//   morning post INSIDE the Writing Room (`about`): Ma Wint War knocks; the page back, Toe Toe's letter,
//     his question, the Footnote-Star lifts off; she says the evening's "when" and "where" (rumour ticket)
//   the "ask Maya" board on the Post Office's outside wall: one note, "what light will YOU bring?"
//   flowers (outdoors, the window bed): U Hpo Htaw; five stems to the five vases; the bud left; the tag
//   booklets, slate, lantern paper INSIDE the Template Shop (`templates`): Ko Wunna, U Kyaw Nyunt
//   tea INSIDE the Café (`content`): Maya's pot on the guests' table, for whoever comes
//   her own light INSIDE the Writing Room: fold (trace 'fold') + «စာ» (trace 'word') -> lantern
//   Nay Chi's talk INSIDE the Library (`library`): she writes her own welcome
//   (optional) the sorting room (`sortingroom`): Ma Wint War, Ko Lwin, Khwar Nyo, the bell rope
//   dusk at the fountain (d15.light && d15.ncTalk, Maya steps onto the forecourt): guests with their own
//     lights, Nay Chi's welcome, Toe Toe's names, Maya reads the names (the star hops), her light set
//     down in the gap (pickSpot), the reply's last line (lastline), the plane, the kept page (keepsake)
//   (optional) cups in the Café; the night page at the Writing Room desk; credits; the town stays open.
// No markers anywhere: every "where" is said by a person or can be seen.
// Burmese lines are drafts for Maya to proofread (day15-lines.js).
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { VoxelBuilder } from '../game/voxel.js';
import { trace } from './acts/trace2.js';
import { lastline } from './acts/lastline.js';
import { keepsake } from './acts/keepsake.js';
import { morningPost, nightPage, showLetter, showSlip } from './post.js';
import { castById } from './cast.js';
import { registerDoors, DOORS } from './doors.js';
import { loadDay } from './days.js';
import { launchTable, vase, bookletBox, paperLantern, guestLight, createGlowPool, banner, teaTable, paperPlane } from './props6.js';
import { flowerBed } from './props2.js';
import { mergeStatic } from './merge-static.js';
import { smallTeapot } from './props3.js';
import { windmill } from './props.js';
import { L, AMB, PAGES, pageLine, pageNotYet, SLEPT14_FALLBACK, REPLY_FALLBACK } from './day15-lines.js';
import { TALK_D15_NAYCHI } from './talks/day15.js';
import { F as FOUNT, MARKS, FRONT, BACK, LOW_DROP, MIDDLE, CROWD, READ, WALKERS, RIBBON_IN, CAFE_AFTER, LIGHTS, starSprite, marginStrip, paperWhite, credits as showCredits, crowdBatch } from './day15-launch.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const race = (p, ms) => Promise.race([p, wait(ms)]);
const REFS_OK = false; // decision 9: the book's real references only with Maya's yes (default false)
const ROOM_CAM = { tilt: 30, width: 4.6, widthLandscape: 9.5, minHeight: 0, height: 0.9, stiffness: 5, bounds: null }; // close and low indoors, never the whole-room view
/** A lantern standing on its own (no stick): paperLantern({ stick: false }) cannot build yet (props6 needs a fix),
 *  so the stick version is used with its stick hidden; place(x, y, z) puts the lantern's hook there. */
function looseLantern(o) {
  const l = paperLantern({ ...o, stick: true });
  if (l.root.children[0]) l.root.children[0].visible = false;
  l.place = (x, y, z) => l.root.position.set(x - 0.17, y - 0.46, z - 0.06);
  return l;
}

// places on the Home Book (metres; +Z = south, toward the camera; every building faces +Z)
const BED = { x: 2.2, z: 7.55 };                  // the window bed, east of the Writing Room door
const TABLE_A = { x: -3.75, z: 14.2 };            // welcome table (booklets), west side of the forecourt
const TABLE_B = { x: -3.75, z: 15.95 };           // the vases
const TEA_T = { x: 3.4, z: 15.4 };                // Ko Phyo's tea table, east side by the ribbon road's mouth
const BANNER = { x: 0, z: 10.55 };                // north side of the forecourt, facing south
const WINDY = { x: 22.6, z: 8.2 };                // Pho Thar's windmills
const PRE = {                                     // before dusk, outdoors (the rest are inside their rooms)
  hpohtaw: { x: BED.x + 1.35, z: BED.z + 0.55, h: -Math.PI / 2 - 0.3 },
  phothar: { x: WINDY.x - 0.4, z: WINDY.z + 0.5, h: -0.4 },
  toetoe: { x: 2.05, z: 16.75, h: 0.2 },
  hninwai: { x: 2.85, z: 16.35, h: -0.3 },
  dawohn: { x: TABLE_A.x - 0.95, z: TABLE_A.z - 0.6, h: Math.PI / 2 },
  micho: { x: TABLE_A.x - 0.95, z: TABLE_A.z + 0.5, h: Math.PI / 2 },
  thiri: { x: -2.4, z: 17.4, h: 0.3 },
  eimon: { x: 3.6, z: 14.1, h: -Math.PI / 2 },
};
// inside the rooms (spots from the rooms' story layers; INDEX 13.2 wins)
const ROOM_PEOPLE = {
  // Ko Wunna by the slate (his own spot at the counter stands right in front of U Kyaw Nyunt's stool, between
  // the camera and every talk with him)
  templates: () => [{ id: 'kowunna', spot: { x: 1.45, z: 1.2, h: -0.55 } }, { id: 'ukyaw', spot: 'ukyaw' }],
  content: (after) => (after
    ? [{ id: 'kophyo', spot: 'kophyoCounter' }, { id: 'maungnge', spot: 'maungnge' }, { id: 'eimon', spot: 'eimon' }, { id: 'sunwe', spot: 'sunwe' }, { id: 'khinmay', spot: 'khinmayMid' }, { id: 'maungarkar', spot: { x: 0.95, z: 0.15, h: Math.PI } }]
    : [{ id: 'kophyo', spot: 'kophyo' }, { id: 'sunwe', spot: 'sunwe' }, { id: 'khinmay', spot: 'khinmay' }, { id: 'maungarkar', spot: 'maungarkar' }]),
  // standing by the reading chair, not sunk in it (seated, the ottoman and the book stack stand between the
  // camera and her face in the talk)
  library: () => [{ id: 'naychi', spot: { x: -1.6, z: 1.5, h: 0.9 } }],
  sortingroom: () => [{ id: 'wintwar', spot: 'wintwarRack' }, { id: 'kolwin', spot: 'kolwin' }, { id: 'khwarnyo', spot: 'khwarnyo' }],
};

let ACTIVE = null; // the live page (the room overlay registered with doors.js delegates to it)

export async function create(story) {
  const { game, dialog: D, save } = story;
  const F = (k, v) => story.flag(`d15.${k}`, v);
  const place = (id) => game.world.places.find((p) => p.id === id);
  const doorOf = (id) => place(id)?.door || { x: 0, z: 0 };
  const scene = game.world.scene;
  const v3 = new THREE.Vector3();
  const lowTier = game.tier === 'low';
  let disposed = false;
  let ended = !!save.ended || !!F('done');

  // ---------------------------------------------------------------------------------------------
  // small helpers
  // ---------------------------------------------------------------------------------------------
  const objs = [];            // outdoor objects this page added (removed in dispose)
  const props = [];           // props with update()/dispose()
  const pendingObs = [];      // keep-out boxes, added to the outdoor list while Maya is outdoors
  const myObs = [];
  const addOb = (o) => pendingObs.push(o);
  function flushObs() {
    if (story.inRoom || !pendingObs.length) return;
    // (the open world's walker collides through a spatial hash: shapes go in with space.add, not a bare push)
    const sp = story.openWorld?.space;
    for (const o of pendingObs.splice(0)) { if (sp) sp.add([o]); else story.foot.obstacles.push(o); myObs.push(o); }
  }
  const addProp = (p, x, y, z, ry = 0) => { p.root.position.set(x, y, z); p.root.rotation.y = ry; scene.add(p.root); props.push(p); return p; };
  const addObj = (o) => { scene.add(o); objs.push(o); return o; };
  function setHour(h) { call(game.day, 'set', h); call(game, 'applyDayLook'); }
  const lang = () => (document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'my');
  function heard(id) { if (!story.flag(`rumour.${id}`)) story.flag(`rumour.${id}`, 'heard'); }
  function checkRumour(id) {
    if (F(`rumour.${id}`)) return false;
    save.proofs = save.proofs || {};
    save.proofs[id] = L.proofs[id];
    story.flag(`rumour.${id}`, 'checked');
    F(`rumour.${id}`, true);
    story.give(`proof:${id}`);
    return true;
  }
  const spoke = (id) => { const s = F('spoke') || []; if (!s.includes(id)) { s.push(id); F('spoke', s); } };
  const mayaPos = () => (story.inRoom ? null : story.foot.active ? { x: story.foot.pos.x, z: story.foot.pos.y } : { x: game.car.root.position.x, z: game.car.root.position.z });
  const near = (p, x, z, r) => p && Math.hypot(p.x - x, p.z - z) < r;
  const say = (who, lines, o = {}) => D.say(who, Array.isArray(lines) ? lines : [lines], o);
  async function scripted(fn) { // a short scripted moment: talking + letterbox, always released
    if (story.talking) return;
    story.talking = true;
    game.ui.cinema(true);
    try { await fn(); } finally { story.talking = false; game.ui.cinema(false); }
  }

  // ---------------------------------------------------------------------------------------------
  // outdoor props (the forecourt is dressed for the launch all day; the bed; the board)
  // ---------------------------------------------------------------------------------------------
  // the window bed: five bulb flowers open, one bud closed, Toe Toe's bean row behind
  const bulbs = !!(story.flag('home.bed.bulbs') || save.home?.bed?.bulbs || save.home?.bulbs || story.flag('d10.planted'));
  const bed = flowerBed({ w: 1.7, d: 0.8, seed: 15 });
  bed.root.position.set(BED.x, 0, BED.z);
  addObj(bed.root); props.push(bed);
  addOb({ type: 'box', minX: BED.x - 0.9, maxX: BED.x + 0.9, minZ: BED.z - 0.45, maxZ: BED.z + 0.45 });
  // the bean row, the six flowers and the pencil stick are ONE mesh (2 draw calls, not 16), rebuilt when a
  // stem is picked; blooms[i] keeps each flower's place and whether it still stands
  const blooms = [];
  for (let i = 0; i < 6; i++) blooms.push({ position: new THREE.Vector3(BED.x - 0.62 + i * 0.25, 0.1, BED.z + 0.12 + (i % 2) * 0.12), visible: i === 5 || bulbs });
  const picked = new Set(F('picked') || []);
  for (const i of picked) if (blooms[i]) blooms[i].visible = false;
  let bedMesh = null;
  let dressMerge = null; // (mergeDressing, below)
  function buildBed() {
    if (dressMerge) mergeDressing(false); // (rebuilt: back to separate meshes)
    const bv = new VoxelBuilder();
    for (let i = 0; i < 6; i++) { // the bean row (behind, flowering)
      const x = BED.x - 0.7 + i * 0.28;
      bv.box(x, 0.32, BED.z - 0.25, 0.03, 0.5, 0.03, '#5E8F4E');
      bv.box(x + 0.05, 0.42, BED.z - 0.25, 0.1, 0.06, 0.08, '#6FA05A');
      bv.box(x - 0.04, 0.56, BED.z - 0.24, 0.05, 0.04, 0.04, '#F2F0E6');
    }
    const cols = ['#E2B33C', '#E9862E', '#D97C8A', '#E2B33C', '#E9862E'];
    blooms.forEach((b, i) => {
      if (!b.visible) return;
      const { x: X, y: Y, z: Z } = b.position;
      bv.box(X, Y + 0.16, Z, 0.025, 0.3, 0.025, '#5E8F4E');
      bv.box(X + 0.04, Y + 0.12, Z, 0.07, 0.03, 0.04, '#6FA05A');
      if (i === 5) { bv.box(X, Y + 0.34, Z, 0.05, 0.08, 0.05, '#7FA05A'); bv.box(X, Y + 0.39, Z, 0.03, 0.03, 0.03, '#D97C8A'); }
      else {
        for (const [dx, dz] of [[0.045, 0], [-0.045, 0], [0, 0.045], [0, -0.045]]) bv.box(X + dx, Y + 0.33, Z + dz, 0.06, 0.03, 0.06, cols[i]);
        bv.box(X, Y + 0.345, Z, 0.04, 0.03, 0.04, '#F7E3A0');
      }
    });
    // the pencil stick «ဦးဖိုးထော်»
    bv.box(BED.x + 0.78, 0.25, BED.z + 0.3, 0.03, 0.5, 0.03, '#E2B33C');
    bv.box(BED.x + 0.78, 0.47, BED.z + 0.315, 0.12, 0.07, 0.01, '#FBF7EC');
    const m = bv.mesh({ outline: true, px: 1.2 });
    if (bedMesh) { bedMesh.removeFromParent(); bedMesh.traverse((c) => { if (c.geometry) c.geometry.dispose?.(); }); const k = objs.indexOf(bedMesh); if (k >= 0) objs.splice(k, 1); }
    bedMesh = addObj(m);
  }
  buildBed();

  // the launch tables (west), the vases, the tea table (east), the banner (north)
  const tA = addProp(launchTable('#6E1F2A'), TABLE_A.x, 0, TABLE_A.z, Math.PI / 2);
  const tB = addProp(launchTable('#2F7C7A'), TABLE_B.x, 0, TABLE_B.z, Math.PI / 2);
  for (const t of [TABLE_A, TABLE_B]) addOb({ type: 'box', minX: t.x - 0.36, maxX: t.x + 0.36, minZ: t.z - 0.85, maxZ: t.z + 0.85 });
  const slotW = (t, i) => { t.root.updateMatrixWorld(true); return t.root.localToWorld(t.slots[i].clone()); };
  const vases = [];
  const filled = new Set(F('vases') || []);
  for (let i = 0; i < 5; i++) {
    const p = slotW(tB, i);
    const vz = addProp(vase(filled.has(i) ? 1 : 0, { tagged: i === 2 && !!F('tagged') }), p.x, p.y, p.z, Math.PI / 2);
    vases.push(vz);
  }
  const teaT = addProp(teaTable(), TEA_T.x, 0, TEA_T.z, -Math.PI / 2);
  addOb({ type: 'box', minX: TEA_T.x - 0.32, maxX: TEA_T.x + 0.32, minZ: TEA_T.z - 0.5, maxZ: TEA_T.z + 0.5 });
  const ban = addProp(banner({ posts: true }), BANNER.x, 0, BANNER.z, 0);
  // the booklet box: on the welcome table once carried there (else it waits in the Template Shop)
  let boxProp = null;
  if (F('booklets')) { const p = slotW(tA, 2); boxProp = addProp(bookletBox(12), p.x, p.y, p.z, Math.PI / 2); }
  // phone budget: from dusk on the tables, vases, tea table, booklet box and window bed stand still, so their
  // meshes draw as one per material (about 25 draw calls fewer under the crowd); undone before any of them changes
  function mergeDressing(on) {
    if (!on || disposed) { dressMerge?.undo(); dressMerge = null; return; }
    if (dressMerge) return;
    // (the banner's posts too: its cloth sways and its bunting has its own material, so only the posts mesh)
    dressMerge = mergeStatic([tA.root, tB.root, ...vases.map((v) => v.root), teaT.root, boxProp?.root, bed.root, bedMesh, ban.root.children[0]], scene, { name: 'd15-dressing' });
  }
  if (F('dusk')) mergeDressing(true); // (a reload after the plane: the crowd stays round the fountain)

  // the "ask Maya" board (the shared one: api.js story.board, home.js ASK_BOARD) by the sorting room's side
  // door (home.js SORT_DOOR, the Post Office's west wall): today ONE note, the town's question to Maya; she takes
  // it down herself once she has her own light
  const PO_WALL = 15.2;
  const noteLines = () => String(L.boardNote.my).split(String.fromCharCode(10)).map((my, k) => ({ my, en: k === 0 ? String(L.boardNote.en).split(String.fromCharCode(10))[0] : '' }));
  const BOARD = story.board;
  const boardNote = { set visible(on) { story.board.set({ notes: 0, replies: 0, gap: false, notice: null, one: on ? noteLines() : null }); } };
  boardNote.visible = !F('boardDown');

  // the Template Shop's window card «စာအုပ်ငယ်များ ဒီမှာ»
  const TPL = doorOf('templates');
  const CARD = { x: TPL.x - 1.25, z: TPL.z - 0.02 };
  {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
    const g = cv.getContext('2d');
    g.fillStyle = '#FBF7EC'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#6E1F2A'; g.lineWidth = 6; g.strokeRect(6, 6, 244, 116);
    g.fillStyle = '#6E1F2A'; g.font = '700 34px "Noto Sans Myanmar", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('စာအုပ်ငယ်များ', 128, 50); g.font = '700 30px "Noto Sans Myanmar", sans-serif'; g.fillText('ဒီမှာ', 128, 92);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    m.position.set(CARD.x, 1.25, CARD.z + 0.06);
    m.userData.tex = tex;
    addObj(m);
  }
  // Pho Thar's windmills at the windy edge (his light is a windmill)
  const mills = [];
  for (let i = 0; i < 4; i++) {
    const w = windmill(['#6E1F2A', '#2F7C7A', '#D9A93B', '#7FB0CF'][i], 0.55 + (i % 2) * 0.1);
    w.root.position.set(WINDY.x - 1.0 + i * 0.6, 0, WINDY.z - 0.8 + Math.sin(i * 2.1) * 0.3);
    addObj(w.root);
    mills.push(w);
  }

  // the night lights: one instanced halo pool for every light (no real lights)
  const pool = createGlowPool({ max: 40 });
  addObj(pool.mesh);
  const star = starSprite();
  addObj(star.sprite);
  // the dusk crowd and its lights drawn as three meshes instead of ~95 (day15-launch.js crowdBatch); every person
  // and light still moves, talks and glows on its own
  const crowd = crowdBatch(scene);
  let crowdOn = true; // (test hook __day15.crowd(false): the people and lights drawn one by one again, to compare)
  function crowdSync() {
    if (!crowdOn || !F('dusk') || ended || disposed) { if (crowd.calls) crowd.clear(); return; }
    const ppl = [], roots = [];
    let key = '';
    for (const id of mine) { const e = story.people.get(id); if (e) { ppl.push({ p: e.p }); key += id + ','; } }
    for (const [id, l] of lights) { roots.push(l.root); key += 'L' + id; }
    if (placedLantern) { roots.push(placedLantern.root); key += 'P'; }
    if (handLantern) { roots.push(handLantern.root); key += 'H'; }
    crowd.update(ppl, roots, key);
  }

  // Maya's own lantern (carried from the fold until it is set down in the gap)
  let handLantern = null, placedLantern = null;
  function carryLantern(on) {
    if (on && !handLantern) {
      handLantern = paperLantern({ color: '#F1D9AA', word: 'စာ', pool: null, size: 0.85 });
      const top = game.maya.getHeadTop(new THREE.Vector3());
      const hy = Math.max(0.35, (top.y - game.maya.root.position.y) * 0.42);
      handLantern.root.position.set(0.24, hy, 0.12);
      handLantern.root.scale.setScalar(1 / Math.max(0.01, game.maya.root.scale.x || 1));
      game.maya.root.add(handLantern.root);
      handLantern.setGlow(F('dusk') ? 0.9 : 0.4);
    } else if (!on && handLantern) {
      handLantern.root.removeFromParent();
      handLantern.dispose();
      handLantern = null;
    }
  }
  function placeLantern() {
    if (placedLantern) return;
    placedLantern = paperLantern({ color: '#F1D9AA', word: 'စာ', pool, size: 0.85 });
    placedLantern.root.position.set(MARKS.gap.x, 0, MARKS.gap.z);
    placedLantern.root.rotation.y = -0.5;
    scene.add(placedLantern.root);
    placedLantern.setGlow(1);
    if (F('dusk')) inkOff(placedLantern);
  }
  // (as nightTrim does for the guests' lights: at dusk a glowing lantern needs no ink outline)
  function inkOff(l) { l?.root.traverse((o) => { if (o.userData.isOutline) o.visible = false; }); }

  // ---------------------------------------------------------------------------------------------
  // people outdoors: who stands where by how far the day has gone; lights in hand from dusk
  // ---------------------------------------------------------------------------------------------
  const lights = new Map(); // id -> light
  const mine = new Set();
  let sceneOn = false;
  const arcIds = () => [...FRONT.filter(Boolean), ...BACK].filter((id) => !(lowTier && LOW_DROP.includes(id)));
  function desiredOutdoor() {
    const out = {};
    if (!F('dusk') || ended) {
      const set = ended ? { ...PRE } : PRE;
      for (const [id, at] of Object.entries(set)) out[id] = at;
      if (F('ncTalk') && !ended) out.naychi = MARKS.naychi;
      if (ended) { out.wintwar = { x: PO_WALL - 1.2, z: 2.8, h: -1.2 }; out.naychi = { x: -1.4, z: 17.3, h: 0 }; }
      return out;
    }
    for (const id of arcIds()) if (MARKS[id]) out[id] = MARKS[id];
    if (F('flown')) for (const id of CAFE_AFTER) delete out[id];
    return out;
  }
  function attachLight(id) {
    if (lights.has(id) || !F('dusk')) return;
    const e = story.people.get(id);
    const spec = LIGHTS[id];
    if (!e || !spec) return;
    const l = guestLight(spec.kind, { color: spec.color, pool, word: spec.word || '', count: spec.count || 2, size: 1.15 });
    const hy = Math.max(0.4, (e.p.height || 1.4) * 0.5);
    l.root.position.set(0.24, hy, 0.16);
    e.p.root.add(l.root);
    l.setGlow(F('placed') || ended ? 0.9 : 0);
    lights.set(id, l);
    nightTrim(e, id, l);
  }
  // the launch crowd is 25 people with 25 lights (phone budget): at dusk a glowing light needs no ink outline,
  // a person standing in lamplight no blob shadow, and the back row (half hidden by the front) no outline
  function nightTrim(e, id, l) {
    l?.root.traverse((o) => { if (o.userData.isOutline) o.visible = false; });
    for (const c of e.p.root.children) if (c.isMesh && c.renderOrder === -1 && c.material?.depthWrite === false) c.visible = false;
    if (BACK.includes(id)) e.p.root.traverse((o) => { if (o.userData.isOutline && o.isSkinnedMesh) o.visible = false; });
  }
  function dropLight(id) {
    const l = lights.get(id);
    if (!l) return;
    l.root.removeFromParent();
    try { l.dispose(); } catch { /* freed */ }
    lights.delete(id);
  }
  function syncOutdoor() {
    if (story.inRoom || sceneOn || disposed) return;
    const want = desiredOutdoor();
    for (const id of [...mine]) {
      if (want[id]) continue;
      dropLight(id);
      story.remove(id);
      mine.delete(id);
    }
    for (const [id, at] of Object.entries(want)) {
      if (!story.people.has(id)) { const e = story.spawn(id, { x: at.x, z: at.z, heading: at.h ?? 0 }); if (!e) continue; mine.add(id); }
      else mine.add(id);
      if (F('dusk') && !ended) attachLight(id);
    }
    // after the plane the lights stay on their marks: two rows of people round the fountain's north half. They go
    // into the walk grid as keep-outs, so a tap beyond them walks round the arc instead of jamming in it
    if (F('flown') && !ended && !arcKept) {
      arcKept = true;
      for (const [id, at] of Object.entries(want)) if (MARKS[id] === at) addOb({ type: 'circle', x: at.x, z: at.z, r: 0.32 });
      flushObs();
    }
  }
  let arcKept = false;

  // ---------------------------------------------------------------------------------------------
  // the rooms: who is inside, the day's dressing (a layer on top of the rooms' own story layers)
  // ---------------------------------------------------------------------------------------------
  const ray = new THREE.Raycaster();
  const down = new THREE.Vector3(0, -1, 0);
  function topAt(room, x, z, fallback) {
    ray.set(new THREE.Vector3(x, 2.2, z), down);
    ray.far = 2.7;
    room.group?.updateMatrixWorld(true);
    for (const h of ray.intersectObject(room.group || room.scene, true)) {
      const o = h.object;
      if (!o.isMesh || o.userData.isOutline || o.material?.side === THREE.BackSide || !o.visible || o.isInstancedMesh || o.material?.transparent) continue;
      if (o.name === 'd15layer' || o.parent?.name === 'd15layer') continue;
      return h.point.y;
    }
    return fallback;
  }
  const tapStation = (id, x, z, lx, lz, label, r = 0.6) => ({ id, x, z, r, look: { x: lx, z: lz }, label, marker: { userData: { update() {} } } });
  function overlay(room, id) {
    if (disposed || save.day < 15 || !['about', 'templates', 'content', 'library'].includes(id)) return null;
    const group = new THREE.Group();
    group.name = 'd15layer';
    const stations = [];
    const ups = [];
    const own = [];
    if (id === 'about') {
      const top = topAt(room, -2.2, -3.55, 0.78);
      const pv = new VoxelBuilder();
      pv.boxMin(-1.95, top, -3.75, -1.6, top + 0.006, -3.4, '#6E1F2A'); pv.boxMin(-1.93, top + 0.006, -3.73, -1.62, top + 0.009, -3.42, '#C9A24A');
      const paper = pv.mesh({ outline: true, px: 1.1 }); group.add(paper);
      const lv = new VoxelBuilder(); // Toe Toe's letter and the Footnote-Star on the notebook's foot (morning)
      lv.boxMin(-1.55, top, -3.62, -1.25, top + 0.005, -3.38, '#EAF0D8'); lv.box(-1.4, top + 0.007, -3.5, 0.18, 0.003, 0.012, '#5E8F4E');
      lv.box(-2.3, top + 0.03, -3.42, 0.07, 0.02, 0.02, '#E2C477'); lv.box(-2.3, top + 0.03, -3.42, 0.02, 0.02, 0.07, '#E2C477'); lv.box(-2.3, top + 0.045, -3.42, 0.03, 0.02, 0.03, '#C9A24A');
      const letter = lv.mesh({ outline: true, px: 1.1 }); group.add(letter);
      const sv = new VoxelBuilder(); // three folded scraps in the wastebasket after a retried fold
      const bt = topAt(room, -1.05, -3.62, 0.3);
      for (let i = 0; i < 3; i++) sv.box(-1.05 + (i - 1) * 0.06, bt + 0.03, -3.62 + (i % 2) * 0.05, 0.07, 0.06, 0.07, i % 2 ? '#6E1F2A' : '#E8D9B0');
      const scraps = sv.mesh({ outline: true, px: 1.1 }); group.add(scraps);
      const lan = looseLantern({ color: '#F1D9AA', word: 'စာ', size: 0.8 });
      lan.place(-1.62, top + 0.31, -3.55);
      group.add(lan.root); own.push(lan);
      ups.push(() => {
        paper.visible = !!F('paper') && !F('folded');
        letter.visible = !F('morning');
        scraps.visible = !!F('retried');
        const show = (!!F('light') && !handLantern && !F('dusk')) || (!!F('flown')) || ended;
        lan.root.visible = show;
        if (show) lan.setGlow(1);
      });
      stations.push(tapStation('d15desk', -1.35, -2.4, -2.2, -3.55, { my: 'စာရေးစားပွဲ', en: 'the writing desk' }, 0.6));
    } else if (id === 'templates') {
      stations.push(tapStation('d15paper', -2.55, -0.55, -3.27, -0.55, { my: 'ဘယ်ဘက်စင်', en: 'the left shelf' }, 0.6));
      let box = null;
      ups.push(() => {
        if (!box) room.scene.traverse((o) => { if (!box && o.name === 'bookletBox' && !group.getObjectById(o.id)) box = o; });
        if (box) box.visible = !F('boxTaken');
      });
    } else if (id === 'content') {
      const lTop = topAt(room, 2.52, 2.92, 0.38);
      const pot = smallTeapot({});
      pot.root.position.set(2.62, lTop, 2.74); pot.root.rotation.y = 0.6;
      group.add(pot.root); own.push(pot);
      // after the launch: the quiet cups, drunk and set down round the guests' pot
      const cv2 = new VoxelBuilder();
      for (const [cx, cz, k] of [[2.36, 2.98, 0], [2.86, 2.96, 1], [2.42, 2.58, 2]]) {
        cv2.box(cx, lTop + 0.03, cz, 0.06, 0.06, 0.06, k === 1 ? '#E8D9B0' : '#FFFDF8');
        cv2.box(cx, lTop + 0.058, cz, 0.05, 0.004, 0.05, '#8A5A2B'); // the last of the tea
        cv2.box(cx + 0.04, lTop + 0.035, cz, 0.015, 0.035, 0.015, '#FFFDF8');
      }
      const cups = cv2.mesh({ outline: true, px: 1.1 }); group.add(cups);
      ups.push(() => { pot.root.visible = !!F('tea'); cups.visible = !!F('flown') || ended; });
    } else if (id === 'library') {
      const tTop = topAt(room, -3.0, 2.85, 0.6);
      const mv = new VoxelBuilder(); // the Writer mug, set down for the talk
      mv.box(-2.86, tTop + 0.05, 2.62, 0.08, 0.1, 0.08, '#FFFDF8'); mv.box(-2.86, tTop + 0.07, 2.62, 0.082, 0.02, 0.082, '#C9A24A'); mv.box(-2.81, tTop + 0.06, 2.62, 0.02, 0.05, 0.03, '#FFFDF8');
      const mug = mv.mesh({ outline: true, px: 1.1 }); group.add(mug);
      ups.push(() => { mug.visible = !!F('ncMet'); });
    }
    for (const u of ups) u();
    return {
      group, stations, spots: {}, hideSite: true,
      update(dt, t) { if (disposed) return; for (const u of ups) u(); for (const p of own) p.update?.(dt, t); },
      dispose() { for (const p of own) { try { p.dispose?.(); } catch { /* freed */ } } group.traverse((o) => { if (o.geometry) o.geometry.dispose?.(); }); },
    };
  }
  if (story.doors && !story.doors.__d15) { story.doors.__d15 = true; story.doors.addOverlay((room, id, o) => ACTIVE?.overlay(room, id, o) || null); }

  // ---------------------------------------------------------------------------------------------
  // what people say (by tap); one line per tap, rotating
  // ---------------------------------------------------------------------------------------------
  const turn = {};
  function amb(id) {
    const a = AMB[id];
    const list = (F('flown') || ended ? a?.after : a?.pre) || [];
    const use = list.length ? list : L.generic;
    const k = turn[id] = ((turn[id] ?? -1) + 1) % use.length;
    if (id === 'ukyaw' && use[k] === L.ukyawBloom[0]) heard('bloom');
    return [use[k]];
  }
  const ambTalk = (id, face = 'smile') => async () => { spoke(id); await say(id, amb(id), { face }); };
  const talk = {
    wintwar: async () => {
      spoke('wintwar');
      if (!F('morning')) return morning();
      return say('wintwar', amb('wintwar'), { face: 'smile' });
    },
    hpohtaw: async () => {
      spoke('hpohtaw');
      if (F('dusk') || ended) return say('hpohtaw', amb('hpohtaw'), { face: 'smile' });
      if (!F('hpMet')) {
        F('hpMet', true);
        if (!bulbs) { await say('hpohtaw', L.noBulbs, { face: 'smile' }); F('stems', 5); F('picked', [0, 1, 2, 3, 4]); return; }
        await say('hpohtaw', L.hp1, { face: 'smile' });
        return;
      }
      if (F('bud') && !F('hpBudSaid')) { F('hpBudSaid', true); return say('hpohtaw', L.hpBud, { face: 'think' }); }
      if (F('flowers')) return say('hpohtaw', L.hpDone, { face: 'happy' });
      return say('hpohtaw', [L.hp1[1]], { face: 'smile' });
    },
    kowunna: async () => {
      spoke('kowunna');
      if (!F('wnMet')) { F('wnMet', true); return say('kowunna', L.wn1, { face: 'happy' }); }
      if (F('board') && !F('paper') && story.inRoom === 'templates') { // asked, he says where (the shelf); she takes a sheet
        await say('kowunna', L.wnPaper, { face: 'smile' });
        F('paper', true);
        call(game.audio, 'play', 'page');
        return say('maya', L.paperTaken, { face: 'think' });
      }
      if (!F('slate')) return say('kowunna', L.wnSlate, { face: 'smile' });
      return say('kowunna', amb('kowunna'), { face: 'smile' });
    },
    ukyaw: async () => {
      spoke('ukyaw');
      if (!F('kyMet') && !F('dusk')) { F('kyMet', true); return say('ukyaw', L.kyStitch, { face: 'smile' }); }
      await say('ukyaw', amb('ukyaw'), { face: 'smile' });
      if (F('bloomSeen') && story.flag('rumour.bloom') && !F('rumour.bloom')) checkRumour('bloom'); // she has seen the bed already
    },
    kophyo: async () => {
      spoke('kophyo');
      if (story.inRoom === 'content' && !F('dusk')) {
        if (story.has('teapot') && !F('tea')) { F('pyAsked', true); return say('kophyo', L.py1, { face: 'smile' }); }
        if (!F('tea') && !F('py0')) { F('py0', true); return say('kophyo', L.py0, { face: 'smile' }); }
      }
      return say('kophyo', amb('kophyo'), { face: 'smile' });
    },
    sunwe: async () => {
      spoke('sunwe');
      if (F('flown') || ended) return say('sunwe', amb('sunwe'), { face: 'happy' });
      if (F('slate')) return say('sunwe', L.sunweSlate, { face: 'think' });
      heard('speech');
      return say('sunwe', L.sunwePre, { face: 'smile' });
    },
    naychi: async () => {
      spoke('naychi');
      if (F('flown') || ended) return say('naychi', amb('naychi'), { face: 'happy' });
      if (F('ncTalk')) return say('naychi', L.ncPractice, { face: 'think' });
      return ncTalk();
    },
    ubolay: async (e) => { spoke('ubolay'); call(e?.p, 'emote', 'nod'); await wait(1300); }, // ch 8: only nods, nothing owed for a greeting
  };
  for (const id of Object.keys(AMB)) if (!talk[id]) talk[id] = ambTalk(id);
  for (const id of ['yeyint', 'pyaesone']) if (!talk[id]) talk[id] = ambTalk(id);

  // ---------------------------------------------------------------------------------------------
  // 4 · the morning, inside the Writing Room
  // ---------------------------------------------------------------------------------------------
  let morningBusy = false;
  async function morning() {
    if (morningBusy || F('morning')) return;
    morningBusy = true;
    try {
      setHour(8.5);
      let slept14 = SLEPT14_FALLBACK;
      try { const m14 = await loadDay(14); slept14 = m14?.SLEPT || m14?.SLEPT14 || slept14; } catch { /* Day 14 not loaded: its lines are here */ }
      await morningPost(story, {
        day: 15, hour: 8.5, walkUp: false,
        ww: L.ww1,
        slept: { ...slept14, ...L.slept14extra },
        after: L.ww2,
        letters: [{ from: 'toetoe', text: L.ttNote }],
        question: L.ttQ,
        companions: ['star'],
        liftCaption: { star: L.star[0] },
        lift: { star: L.starMaya },
        where: [...L.ww3, ...L.wwHpo, ...L.wwCafe, ...L.wwLeave],
      });
      heard('ticket');
      F('morning', true);
      // she leaves for the Post Office (her place for the day: said, not marked)
      if (story.people.get('wintwar') && story.inRoom === 'about') {
        const R = story.room;
        const dz = R?.door?.z ?? 3.4;
        race(story.walkPerson('wintwar', 0, dz - 0.2, 1.4), 7000).then(() => { if (story.inRoom === 'about') story.remove('wintwar'); });
      }
    } finally {
      morningBusy = false;
    }
  }
  /** Inside the Writing Room: the knock from the doormat, she comes in to the pouf, then the post as a talk (two-shot). */
  let knockBusy = false;
  async function knock() {
    if (knockBusy || F('morning')) return;
    knockBusy = true;
    try {
      let ww = story.people.get('wintwar');
      if (!ww && story.inRoom === 'about') ww = story.spawn('wintwar', 'wintwarMat');
      if (!ww) return;
      await scripted(async () => {
        // the knock: Maya turns from the desk to the door, and the camera looks over her shoulder at Ma Wint War
        // in the doorway (both in frame, not Maya alone with a voice off screen)
        {
          const mp = game.maya.root.position, wp = ww.p.root.position;
          const h = Math.atan2(wp.x - mp.x, wp.z - mp.z);
          if (story.foot.walker) story.foot.walker.heading = h;
          game.maya.root.rotation.set(0, h, 0);
          shot(mp.x - Math.sin(h) * 0.95 - Math.cos(h) * 0.35, 1.7, mp.z - Math.cos(h) * 0.95 + Math.sin(h) * 0.35, wp.x, 0.95, wp.z, 0.6);
        }
        await say('wintwar', L.ww0, { face: 'smile' });
        game.rig.release();
        ww.paused = true;
        await race(story.walkPerson('wintwar', 0.9, -0.6, 1.4), 6000);
        ww.p.root.rotation.y = Math.atan2(-1.35 - 0.9, -2.4 + 0.6);
      });
      if (!F('morning')) await story.talkTo(ww); // talk.wintwar -> morning()
    } finally { knockBusy = false; }
  }

  // ---------------------------------------------------------------------------------------------
  // 4.1 · the board; 5.1 · flowers; 5.2 · booklets; the banner (outdoor taps: tapHooks, no markers)
  // ---------------------------------------------------------------------------------------------
  const targets = [];
  const target = (id, pos, fn, when = () => true, stand = null) => targets.push({ id, pos, fn, when, stand });
  target('board', () => BOARD.target, () => scripted(async () => {
    if (F('boardDown')) return say('maya', L.boardEmpty, { face: 'smile' });
    if (F('board')) return say('maya', L.boardAgain, { face: 'think' });
    await showLetter(game, { my: L.boardNote.my, en: L.boardNote.en }, { sign: L.boardNote.from });
    await say('maya', L.boardMaya, { face: 'think' });
    F('board', true);
  }), () => true, () => BOARD.stand);
  for (let i = 0; i < 5; i++) {
    target(`flower${i}`, () => ({ x: blooms[i].position.x, y: 0.4, z: blooms[i].position.z }), () => scripted(async () => {
      if (!F('hpMet')) return say('maya', [{ my: '(ဦးဖိုးထော့် ပန်းဥတွေ။ သူ့ကို အရင် မေးကြည့်မယ်။)', en: "(U Hpo Htaw's bulbs. I'll ask him first.)" }], { face: 'think' }); // new
      if (!F('bloomSeen')) { F('bloomSeen', true); await say('maya', L.bloomSeen, { face: 'happy' }); if (story.flag('rumour.bloom')) checkRumour('bloom'); }
      blooms[i].visible = false;
      buildBed();
      picked.add(i); F('picked', [...picked]);
      F('stems', (F('stems') || 0) + 1);
      call(game.audio, 'play', 'pop');
      if (picked.size >= 5) await say('maya', L.stemsFull, { face: 'smile' });
    }), () => bulbs && !picked.has(i) && !F('dusk'), () => ({ x: BED.x - 0.62 + i * 0.25, z: BED.z + 0.85 }));
  }
  target('bud', () => ({ x: blooms[5].position.x, y: 0.4, z: blooms[5].position.z }), () => scripted(async () => {
    await say('maya', L.bud, { face: 'smile' });
    F('bud', true);
  }), () => true, () => ({ x: BED.x + 0.6, z: BED.z + 0.85 }));
  target('beans', () => ({ x: BED.x, y: 0.5, z: BED.z - 0.25 }), () => scripted(() => say('maya', L.beans, { face: 'smile' })), () => true, () => ({ x: BED.x - 0.3, z: BED.z + 0.85 }));
  for (let i = 0; i < 5; i++) {
    target(`vase${i}`, () => { const p = vases[i].root.position; return { x: p.x, y: p.y + 0.1, z: p.z }; }, () => scripted(async () => {
      const stems = F('stems') || 0;
      if (filled.has(i) || stems <= 0) return say('maya', L.vaseEmpty, { face: 'smile' });
      F('stems', stems - 1);
      filled.add(i); F('vases', [...filled]);
      mergeDressing(false);
      vases[i].setStems(1);
      call(game.audio, 'play', 'pop');
      if (filled.size >= 5) {
        // the fifth stem in: the Footnote-Star hops onto the table and a folded card stands up (ch 23 shown, not said)
        const p = vases[2].root.position;
        star.hop(new THREE.Vector3(p.x, p.y + 0.35, p.z));
        call(game.audio, 'play', 'sparkle');
        vases[2].setTag?.(true);
        await showSlip(game, L.vaseTag, { title: { my: 'ပန်းအိုးဘေးက ကတ်လေး', en: 'A card among the vases' } });
        await say('maya', L.vaseMaya, { face: 'smile' });
        star.hide();
        F('flowers', true); F('tagged', true);
      }
    }), () => !filled.has(i) && (F('stems') || 0) > 0, () => ({ x: TABLE_B.x + 0.85, z: TABLE_B.z - 0.6 + i * 0.3 }));
  }
  target('tableA', () => ({ x: TABLE_A.x, y: 0.8, z: TABLE_A.z }), () => scripted(async () => {
    if (F('carrying') && !F('booklets')) {
      const p = slotW(tA, 2);
      story.carry(null, { at: { x: p.x, y: p.y, z: p.z, h: Math.PI / 2 } });
      F('carrying', false); F('booklets', true);
      return say('maya', L.boxDown, { face: 'happy' });
    }
    if (F('booklets')) return say('maya', L.booklet, { face: 'smile' });
  }), () => F('carrying') || F('booklets'), () => ({ x: TABLE_A.x + 0.9, z: TABLE_A.z }));
  target('banner', () => ({ x: BANNER.x, y: 2.2, z: BANNER.z }), () => scripted(async () => {
    await say('maya', L.bannerRead, { face: 'smile' });
    if (story.flag('rumour.ticket')) checkRumour('ticket');
  }), () => true, () => ({ x: BANNER.x, z: BANNER.z + 1.6 }));
  target('card', () => ({ x: CARD.x, y: 1.25, z: CARD.z }), () => scripted(() => say('maya', L.card, { face: 'smile' })), () => !F('booklets'), () => ({ x: CARD.x, z: CARD.z + 1.0 }));

  const proj = (x, y, z) => game.rig.project(v3.set(x, y, z), game.viewW, game.viewH);
  function tapHook(x, y) {
    if (disposed || story.inRoom || sceneOn || story.talking || game.busy || !story.foot.active) return false;
    let best = null, bd = 42;
    for (const t of targets) {
      if (!t.when()) continue;
      const p = t.pos();
      const q = proj(p.x, p.y, p.z);
      if (!q) continue;
      const d = Math.hypot(q.x - x, q.y - y);
      if (d < bd) { bd = d; best = t; }
    }
    if (!best) return false;
    // a person standing right there wins the tap
    for (const e of story.people.values()) {
      const q = proj(e.p.root.position.x, (e.p.height || 1.4) * 0.6, e.p.root.position.z);
      if (q && Math.hypot(q.x - x, q.y - y) < bd) return false;
    }
    const s = best.stand ? best.stand() : best.pos();
    const go = () => best.fn();
    if (Math.hypot(story.foot.pos.x - s.x, story.foot.pos.y - s.z) < 0.6) go();
    else story.foot.walkTo(s.x, s.z, (ok) => { if (ok !== false) go(); });
    return true;
  }
  story.tapHooks = story.tapHooks || [];
  story.tapHooks.push(tapHook);

  // ---------------------------------------------------------------------------------------------
  // the room stations (Template Shop, Café, Library, Writing Room, sorting room)
  // ---------------------------------------------------------------------------------------------
  let carryBox = null;
  function station(id, ctx) {
    const room = ctx?.room || story.inRoom;
    const run = (fn) => { scripted(fn); return true; };
    if (room === 'about' && id === 'd15desk') return run(desk);
    if (room === 'templates') {
      if (id === 'booklets') return run(async () => {
        if (F('booklets') || F('carrying')) return say('maya', L.booklet, { face: 'smile' });
        if (!F('wnMet')) { F('wnMet', true); await say('kowunna', L.wn1, { face: 'happy' }); }
        carryBox = bookletBox(12);
        carryBox.root.name = 'd15carryBox';
        story.carry(carryBox.root, { speed: 0.75, lift: 0.62 });
        props.push(carryBox);
        F('boxTaken', true); F('carrying', true);
        await say('maya', L.boxUp, { face: 'smile' });
      });
      if (id === 'slate') return run(async () => {
        await showSlip(game, L.slate, { title: L.slateTitle });
        F('slate', true);
        checkRumour('speech');
      });
      if (id === 'd15paper') return run(async () => {
        if (!F('board')) return say('maya', L.shelfPlain, { face: 'smile' });
        if (F('paper')) return say('maya', L.paperHave, { face: 'smile' });
        await say('kowunna', L.wnPaper, { face: 'smile' });
        F('paper', true);
        call(game.audio, 'play', 'page');
        await say('maya', L.paperTaken, { face: 'think' });
      });
      if (id === 'invites') return run(() => say('maya', L.booklet, { face: 'smile' }));
    }
    if (room === 'content') {
      if (id === 'guests') return run(async () => {
        if (story.has('teapot') && !F('tea') && !F('dusk')) {
          story.take('teapot', 1, { quiet: true });
          F('tea', true);
          call(game.audio, 'play', 'thud');
          await say('maya', L.teaSet, { face: 'smile' });
          return;
        }
        return say('maya', L.guestsTable, { face: 'smile' });
      });
      if (id === 'brazier') return run(async () => { const e = story.people.get('kophyo'); if (e) { story.talking = false; game.ui.cinema(false); await story.talkTo(e); } });
    }
    if (room === 'library') {
      if (id === 'sheets') return run(() => say('maya', L.sheets, { face: 'think' }));
      if (id === 'books') return run(() => say('maya', L.books, { face: 'think' }));
    }
    if (room === 'sortingroom') {
      if (id === 'rope') return run(() => say('maya', [{ my: '(ခေါင်းလောင်းကြိုး။ မှောင်ရီပျိုးရင် မဝင့်ဝါ ဆွဲမယ်။)', en: '(The bell rope. Ma Wint War will pull it at dusk.)' }], { face: 'smile' })); // new
      if (id === 'wintwar') { const e = story.people.get('wintwar'); if (e) { story.talkTo(e); return true; } }
      if (id === 'table') return run(() => say('maya', [{ my: '(ပွဲနေ့ တံဆိပ်ရိုက်ထားတဲ့ စာအုပ်ငယ်တွေ။)', en: '(Booklets stamped with the launch-day postmark.)' }], { face: 'smile' })); // new
      if (id === 'rack' || id === 'scale') return run(() => say('maya', [{ my: '(ဖိတ်စာ ကျန်တာလေးတွေ ခွဲထားတယ်။)', en: '(The leftover invitations, sorted.)' }], { face: 'smile' })); // new
    }
    return false;
  }

  // ---------------------------------------------------------------------------------------------
  // 5.4 · Maya's own light, at the Writing Room desk; 9 · the night page there
  // ---------------------------------------------------------------------------------------------
  async function desk() {
    if (ended) {
      await say('maya', L.endedDesk, { face: 'smile' });
      await keepPage(false);
      return;
    }
    if (F('flown')) { story.talking = false; game.ui.cinema(false); return night(); }
    if (F('light')) return say('maya', L.deskDone, { face: 'smile' });
    if (!F('board')) return say('maya', L.deskIdle, { face: 'smile' });
    if (!F('paper')) return say('maya', L.noPaper, { face: 'think' });
    await say('maya', L.lt1, { face: 'think' });
    if (!story.has('lantern')) { // always: Day 3 gives no lantern (continuity pass)
      for (let r = 0; ; r++) {
        const res = await trace({ title: L.foldTitle, hint: L.foldHint, path: 'fold', wobble: 8, tolerance: 22, round: 1, rounds: 1 });
        if (res.ok) break;
        if (res.cancelled) return;
        F('retried', true);
      }
      story.give('lantern');
      F('folded', true);
    }
    let wobble = 10;
    for (;;) { // a retry is never scored down: the wobble shrinks, as practice does (ch 1, p16)
      const res = await trace({ title: L.wordTitle, hint: L.wordHint, path: 'word', glyph: 'စာ', wobble, tolerance: 18, round: 1, rounds: 1, colors: { ink: '#C9A24A' } });
      if (res.ok) break;
      if (res.cancelled) return;
      wobble = Math.max(3, wobble * 0.72);
      await say('maya', L.ltAgain, { auto: true, face: 'think' });
    }
    F('light', true);
    call(game.audio, 'play', 'chime');
    await wait(900); // it glows on the desk a moment
    await say('maya', L.ltDone, { face: 'happy' });
    carryLantern(true);
  }

  let nightBusy = false;
  async function night() {
    if (nightBusy || ended) return;
    nightBusy = true;
    try {
      const said = (F('spoke') || []).filter((id) => castById(id));
      const who = [...new Set([...said.slice(-5), 'naychi', 'toetoe'])].slice(-5);
      await nightPage(story, {
        day: 15,
        truth: { q: L.nightQ, choices: L.nightChoices, right: 1, wrong: L.nightWrong },
        before: F('bud') ? () => say('maya', [L.budLine], { face: 'smile' }) : null,
        sleep: { q: L.sleepQ, who },
        stamps: ['reply'],
        stampText: L.stampText,
        tomorrow: L.tomorrow,
        turn: false,
      });
      // open-town mode (10): the town stays open; save.day 16 loads this page again in its "after" state
      save.ended = true;
      save.day = 16;
      ended = true;
      F('done', true);
      story.persist();
      await showCredits(L.credits, L.creditsClose);
      setHour(null);
    } finally { nightBusy = false; }
  }

  // ---------------------------------------------------------------------------------------------
  // 6 · Nay Chi's talk, in the Library's reading nook
  // ---------------------------------------------------------------------------------------------
  function ncHand() {
    const brought = (save.companionsOn?.length ? save.companionsOn : save.companions) || [];
    let n = 0;
    return TALK_D15_NAYCHI.hand.filter((c) => {
      if (c.companion) { if (!brought.includes(c.companion) || n >= 8) return false; n++; return true; }
      if (c.rumour && (F(`rumour.${c.rumour}`) || story.flag(`rumour.${c.rumour}`) === 'checked')) return false;
      return true;
    });
  }
  async function ncTalk() {
    if (story.talk.waiting(TALK_D15_NAYCHI.id)) return say('naychi', L.ncLater, { face: 'think' });
    if (!F('ncMet')) { F('ncMet', true); await say('naychi', L.nc1, { face: 'worried' }); await say('maya', L.mugDown, { face: 'smile' }); }
    const r = await story.talk.run({ ...TALK_D15_NAYCHI, hand: ncHand() });
    if (r.reason === 'lean') await say('maya', L.ncLeanMaya, { face: 'think' });
    if (!r.won) { await say('naychi', L.ncLater, { face: 'think' }); return; }
    F('ncTalk', true);
    // she gathers the fresh sheet and goes out to the forecourt to practise at her mark
    if (story.inRoom === 'library') {
      const dz = story.room?.door?.z ?? 3.4;
      race(story.walkPerson('naychi', 0, dz - 0.2, 1.3), 7000).then(() => { if (story.inRoom === 'library') story.remove('naychi'); });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 8 · the launch evening (a scene: people on marks, the cut-scene camera, tap advances, Skip skips)
  // ---------------------------------------------------------------------------------------------
  const shot = (px, py, pz, lx, ly, lz, dur = 1.2) => game.rig.shot(new THREE.Vector3(px, py, pz), new THREE.Vector3(lx, ly, lz), dur);
  // A launch shot that fits the points it must show: from the look point, the camera goes out along
  // (azimuth az from the south, elevation el) until every point sits inside the frame, above the dialog box
  // and below the letterbox. A narrow phone screen gets a farther (and so higher) camera than a wide one, and
  // from up here the fountain's inkwell no longer stands in front of the arc.
  const fitCam = new THREE.PerspectiveCamera();
  const fq = new THREE.Vector3();
  function fitShot(look, az, el, pts, { dur = 1.2, pad = 0, yLo = -0.42, yHi = 0.74, xLim = 0.84 } = {}) {
    const c = fitCam;
    c.fov = game.camera.fov; c.aspect = game.camera.aspect || game.viewW / game.viewH; c.near = 0.1; c.far = 500; c.updateProjectionMatrix();
    const L = new THREE.Vector3(look.x, look.y, look.z);
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    let d = 3;
    for (; d < 48; d += 0.3) {
      c.position.copy(L).addScaledVector(dir, d); c.lookAt(L); c.updateMatrixWorld();
      let ok = true;
      for (const p of pts) { fq.set(p.x, p.y, p.z).project(c); if (fq.z > 1 || Math.abs(fq.x) > xLim || fq.y < yLo || fq.y > yHi) { ok = false; break; } }
      if (ok) break;
    }
    return game.rig.shot(L.clone().addScaledVector(dir, d + pad), L, dur);
  }
  const at = (m, y = 1.0) => ({ x: m.x, y, z: m.z });
  const arcPts = () => { const out = []; for (const id of arcIds()) if (MARKS[id]) out.push(at(MARKS[id], 0.1), at(MARKS[id], 1.5)); out.push(at(MARKS.gap, 0.1)); return out; };
  function placeMaya(m) {
    if (story.foot.active) { story.foot.walker.teleport(m.x, m.z, m.h ?? 0); }
    game.maya.root.position.set(m.x, 0, m.z);
    game.maya.root.rotation.set(0, m.h ?? 0, 0);
  }
  function walkMaya(x, z, ms = 9000) { return race(new Promise((r) => story.foot.walkTo(x, z, () => r())), ms); }
  let skip = false, skipBtn = null;
  function skipButton(on) {
    if (on && !skipBtn) {
      skipBtn = document.createElement('button');
      skipBtn.type = 'button'; skipBtn.className = 'rc-skip';
      skipBtn.textContent = tr({ my: 'ကျော်မယ် ▸▸', en: 'Skip ▸▸' });
      skipBtn.addEventListener('click', (ev) => { ev.stopPropagation(); skip = true; game.ui.hideDialog?.(); });
      document.getElementById('game').appendChild(skipBtn);
    } else if (!on && skipBtn) { skipBtn.remove(); skipBtn = null; }
  }
  async function sayEach(who, lines, o = {}) { for (const l of lines) { if (skip) return; await D.say(who, [l], o); } }
  const lightAt = (id) => { const l = lights.get(id); if (!l) return null; const p = new THREE.Vector3(); l.root.getWorldPosition(p); p.y += 0.45; return p; };
  const cloudRing = () => scene.getObjectByName('cloudsFar');
  // (the open world's LOD sets the ring's visible flag again every frame (world/index.js), so from dusk the ring is
  // also taken off the camera's layer: out of the frame and out of the shadow pass, ~14k triangles)
  let ringMask = null;
  function ringOff(off) {
    const r = cloudRing();
    if (!r) return;
    if (off) { if (ringMask === null) { ringMask = r.layers.mask; r.layers.set(30); } r.visible = false; }
    else { if (ringMask !== null) { r.layers.mask = ringMask; ringMask = null; } r.visible = true; }
  }

  async function launch() {
    if (sceneOn || F('flown')) return;
    sceneOn = true;
    story.talking = true;
    game.ui.cinema(true);
    story.foot.walker?.stop?.();
    if (!story.foot.active) await story.foot.toFoot().catch(() => {});
    let white = null, margin = null;
    const carShown = game.car.root.visible;
    game.car.root.visible = false; // (out of every launch frame; parked on the ring road anyway)
    try {
      story.sound?.cue('finale'); // the launch evening's song (extras-sound.js)
      F('dusk', true);
      setHour(18.4);
      mergeDressing(true);
      ringOff(true);
      call(game.audio, 'play', 'bell'); // Ma Wint War pulls the bell rope inside the sorting room's door
      // ---- 8.1 dusk and arrivals: everyone at their marks, the district people up the ribbon road
      for (const id of [...mine]) { dropLight(id); story.remove(id); mine.delete(id); }
      const ids = arcIds();
      const walkers = WALKERS.filter((id) => ids.includes(id));
      ids.forEach((id) => {
        const m = MARKS[id];
        const wi = walkers.indexOf(id);
        const at = wi >= 0 ? RIBBON_IN(wi) : m;
        const e = story.spawn(id, { x: at.x, z: at.z, heading: at.h ?? 0 });
        if (e) { mine.add(id); attachLight(id); }
      });
      placeMaya(CROWD);
      carryLantern(true);
      if (handLantern) { handLantern.setGlow(0.9); inkOff(handLantern); }
      fitShot({ x: FOUNT.x - 0.6, y: 0.7, z: FOUNT.z - 0.6 }, -0.3, 0.86, [...arcPts(), at(CROWD, 0.1), at(CROWD, 1.5)], { dur: 1.6 });
      const walks = walkers.map((id) => race(story.walkPerson(id, MARKS[id].x, MARKS[id].z, 1.5), 11000).then(() => {
        const e = story.people.get(id); if (e) { e.p.root.rotation.y = MARKS[id].h; e.home.h = MARKS[id].h; }
      }));
      // the lights come up one after another
      const order = ids.slice().sort(() => Math.random() - 0.5);
      order.forEach((id, i) => setTimeout(() => lights.get(id)?.setGlow(0.85), 300 + i * 160));
      await D.say('maya', L.dusk, { face: 'happy', auto: true });
      await race(Promise.all(walks), 9000);
      for (const id of walkers) { const e = story.people.get(id); const m = MARKS[id]; if (e && Math.hypot(e.p.root.position.x - m.x, e.p.root.position.z - m.z) > 0.3) { e.walking = null; e.p.root.position.set(m.x, 0, m.z); e.p.root.rotation.y = m.h; e.ob.x = m.x; e.ob.z = m.z; e.home = { x: m.x, z: m.z, h: m.h }; } }
      setHour(18.7);
      // ---- 8.2 Nay Chi's welcome, in her own words (Maya in the crowd, beside Pho Thar)
      skip = false; skipButton(true);
      const nc = MARKS.naychi;
      // Toe Toe, the empty gap and Nay Chi in one frame, from due south over the west half of the basin: the inkwell
      // stands east of that line and the quill leans east, and Maya's spot (south-west) stays out of the way
      const gapTrio = [MARKS.toetoe, MARKS.gap, nc].flatMap((m) => [at(m, 0.1), at(m, 1.45), { x: m.x - 0.35, y: 1, z: m.z }, { x: m.x + 0.35, y: 1, z: m.z }]);
      fitShot({ x: nc.x, y: 0.9, z: nc.z }, 0.15, 0.5, gapTrio, { dur: 1.0, pad: 0.3 });
      await sayEach('naychi', L.ncWelcome.slice(0, 2), { face: 'worried' });
      await sayEach('naychi', [L.ncStumble], { face: 'worried' });
      await sayEach('naychi', L.ncWelcome.slice(2), { face: 'happy' });
      // ---- 8.3 Toe Toe's names
      skip = false;
      const tt = MARKS.toetoe;
      fitShot({ x: (tt.x + MARKS.gap.x) / 2, y: 0.9, z: (tt.z + MARKS.gap.z) / 2 }, -0.08, 0.5, gapTrio, { dur: 1.0, pad: 0.3 }); // (a little west: the inkwell stays out of the frame's edge)
      await sayEach('toetoe', L.ttRead, { face: 'happy' });
      // ---- 8.4 Maya reads the names, page by page; the Footnote-Star hops from light to light
      skip = false;
      fitShot({ x: FOUNT.x - 0.2, y: 0.7, z: FOUNT.z - 0.4 }, -0.18, 0.8, [...arcPts(), at(READ, 0.1), at(READ, 1.5)], { dur: 1.2 });
      await walkMaya(READ.x, READ.z, 8000);
      placeMaya(READ);
      await sayEach('maya', L.readOpen, { face: 'smile' });
      margin = marginStrip(save);
      for (const p of PAGES) {
        if (skip) break;
        const ok = (save.stamps || []).includes(p.n);
        margin.fill(p.n, ok);
        if (ok) {
          const at = p.who.map(lightAt).find(Boolean);
          if (at) { star.hop(at); call(game.audio, 'play', 'chime'); for (const id of p.who) lights.get(id)?.setGlow(1); }
          await D.say('maya', [pageLine(p)], { face: 'smile', auto: true });
          for (const id of p.who) lights.get(id)?.setGlow(0.85);
        } else {
          await D.say('maya', [pageNotYet(p)], { face: 'think', auto: true });
        }
      }
      margin.all();
      star.hide();
      skip = false;
      await sayEach('maya', L.readClose, { face: 'happy' });
      F('read', true);
      margin.remove(); margin = null;
      // ---- 8.5 the book's own references: only with Maya's yes (REFS_OK, default false); skipped silently
      if (REFS_OK) { await sayEach('maya', L.refsMaya, { face: 'smile' }); F('refs', true); }
      skipButton(false);
      setHour(19.0);
      // ---- 8.6 her light, set down: the player taps where (no outline, no glow added)
      // high enough to see both the lit middle step and the gap (the player taps one)
      const wherePts = [...arcPts(), at(MIDDLE, 0.1), { x: MIDDLE.x, y: 0.1, z: MIDDLE.z + 0.9 }, at({ x: CROWD.x + 0.4, z: CROWD.z + 0.9 }, 0.1), at({ x: CROWD.x + 0.4, z: CROWD.z + 0.9 }, 1.5)];
      fitShot({ x: FOUNT.x - 0.6, y: 0.5, z: FOUNT.z }, -0.36, 0.95, wherePts, { dur: 1.4 });
      await walkMaya(CROWD.x + 0.4, CROWD.z + 0.9, 8000);
      await D.say('maya', L.where, { face: 'think' });
      game.ui.cinema(false);
      story.talking = false;
      for (;;) {
        const pick = await story.pickSpot({ spots: [{ id: 'middle', x: MIDDLE.x, z: MIDDLE.z, r: 0.95 }, { id: 'gap', x: MARKS.gap.x, z: MARKS.gap.z, r: 0.75 }], walk: true });
        story.talking = true;
        if (pick === 'gap') break;
        if (!F('middle')) F('middle', true);
        await D.say('maya', L.middle, { face: 'think' });
        await walkMaya(CROWD.x + 0.4, CROWD.z + 0.9, 8000);
        story.talking = false;
      }
      story.talking = true;
      game.ui.cinema(true);
      await walkMaya(MARKS.gap.x + 0.25, MARKS.gap.z + 0.75, 4000); // up to the gap, to set it down
      carryLantern(false);
      placeLantern();
      call(game.audio, 'play', 'chime');
      for (const l of lights.values()) l.setGlow(0.9);
      await wait(500);
      await walkMaya(CROWD.x + 0.4, CROWD.z + 0.9, 5000); // and back to her place in the crowd (out of the frame's middle)
      // close: her light in the gap between Toe Toe's and Nay Chi's, one among theirs (the same frame as the welcome)
      fitShot({ x: MARKS.gap.x, y: 0.8, z: MARKS.gap.z }, 0.1, 0.5, gapTrio, { dur: 1.2, pad: 0.3 });
      await D.say('maya', L.placed, { face: 'happy' });
      await D.say('toetoe', L.ttPlaced, { face: 'think' });
      // the camera pulls back until her lantern is the same size as every other light
      await fitShot({ x: FOUNT.x - 0.4, y: 0.6, z: FOUNT.z - 0.5 }, -0.26, 0.9, arcPts(), { dur: 2.2, pad: 4 });
      F('placed', true);
      // ---- 8.7 the reply: the last line is the player's
      story.sound?.cue('d15letter'); // the last letter's song, through the plane and the kept page
      await showLetter(game, L.letter, { sign: '?' });
      await D.say('maya', L.replyMaya, { face: 'smile' });
      const above = Array.isArray(save.reply?.lines) && save.reply.lines.length ? save.reply.lines : REPLY_FALLBACK;
      const r = await lastline({ title: L.lastTitle, prompt: L.lastPrompt, above, starts: L.lastStarts, ends: L.lastEnds, allowType: true, maxLen: 80, allowBlank: true });
      save.reply = { ...(save.reply || {}), lastLine: { picks: r.picks || null, line: r.line || null, typed: r.typed || null, blank: !!r.blank || (!r.line && !r.typed) } };
      story.persist();
      F('lastLine', true);
      // ---- 8.8 the plane: it folds itself in her hands, circles the arc once, then flies at the camera
      const plane = paperPlane({ lines: true });
      const mp = game.maya.root.position, mh = game.maya.root.rotation.y;
      plane.root.position.set(mp.x + Math.sin(mh) * 0.3, 0.9, mp.z + Math.cos(mh) * 0.3);
      scene.add(plane.root);
      // close on her hands, from the south-west and above (from the south-east the inkwell stands in between)
      fitShot({ x: mp.x, y: 0.95, z: mp.z }, -0.38, 0.6, [at(mp, 0.1), at(mp, 1.5), { x: mp.x - 0.45, y: 1, z: mp.z }, { x: mp.x + 0.45, y: 1, z: mp.z }], { dur: 1.0, pad: 0.5 });
      for (let k = 0; k <= 20; k++) { plane.setFold(k / 20); await wait(55); }
      call(game.audio, 'play', 'whoosh');
      fitShot({ x: FOUNT.x - 0.4, y: 0.8, z: FOUNT.z - 0.4 }, -0.26, 0.78, arcPts(), { dur: 1.2, pad: 1.5 });
      const t0 = performance.now(), loop = 3600;
      const a0 = Math.atan2(plane.root.position.z - FOUNT.z, plane.root.position.x - FOUNT.x);
      await new Promise((res) => {
        const step = () => {
          const u = Math.min(1, (performance.now() - t0) / loop);
          const a = a0 - u * Math.PI * 2;
          const rr = 3.9;
          const px = FOUNT.x + Math.cos(a) * rr, pz = FOUNT.z + Math.sin(a) * rr, py = 1.6 + Math.sin(u * Math.PI) * 1.2;
          const nx = FOUNT.x + Math.cos(a - 0.05) * rr, nz = FOUNT.z + Math.sin(a - 0.05) * rr;
          plane.root.position.set(px, py, pz);
          plane.root.rotation.set(0, Math.atan2(nx - px, nz - pz), 0.35);
          plane.update?.(0.016, performance.now() / 1000);
          // every light leans a little in its wake
          for (const [id, l] of lights) { const e = story.people.get(id); if (!e) continue; const d = Math.hypot(e.p.root.position.x - px, e.p.root.position.z - pz); l.root.rotation.z = d < 1.4 ? (1.4 - d) * 0.25 : l.root.rotation.z * 0.9; }
          if (u < 1 && !disposed) requestAnimationFrame(step); else res();
        };
        requestAnimationFrame(step);
      });
      for (const l of lights.values()) l.root.rotation.z = 0;
      D.say('maya', L.plane, { face: 'smile', auto: true });
      // at the camera; the screen goes paper-white
      const cam = game.camera.position.clone();
      const from = plane.root.position.clone();
      white = paperWhite();
      const whiteP = white.on();
      await new Promise((res) => {
        const t1 = performance.now();
        const step = () => {
          const u = Math.min(1, (performance.now() - t1) / 1100);
          plane.root.position.lerpVectors(from, cam, u * 0.92);
          plane.root.lookAt(cam);
          if (u < 1 && !disposed) requestAnimationFrame(step); else res();
        };
        requestAnimationFrame(step);
      });
      await whiteP;
      plane.root.removeFromParent(); plane.dispose?.();
      game.ui.hideDialog?.();
      F('flown', true);
      // ---- 8.9 the page, in the player's hands (keep it, optional)
      await keepPage(true);
      setHour(19.2);
      await white.off(); white = null;
    } catch (err) {
      console.error('day15 launch', err);
    } finally {
      story.sound?.cue(null); // the forecourt's own quiet music again
      skipButton(false);
      margin?.remove();
      white?.remove();
      star.hide();
      game.rig.release();
      game.ui.cinema(false);
      story.talking = false;
      sceneOn = false;
      game.car.root.visible = carShown;
      parkCar();
    }
    if (F('flown')) {
      // the forecourt again: the lights stay; a third of the guests drift into the Café
      for (const id of CAFE_AFTER) { if (mine.has(id)) { dropLight(id); story.remove(id); mine.delete(id); } }
      story.bark('kophyo', L.pyInvite, 4200);
      await wait(1800);
      await scripted(() => say('maya', L.writeDown, { face: 'smile' }));
    }
  }

  async function keepPage(first) {
    const lines = Array.isArray(save.reply?.lines) && save.reply.lines.length ? save.reply.lines : REPLY_FALLBACK;
    const ll = save.reply?.lastLine || {};
    const last = ll.blank ? null : ll.typed || ll.line || null;
    const stamps = [...(save.stamps || []).filter((n) => typeof n === 'number'), 'reply'];
    const res = await keepsake({ page: { title: L.replyTitle, lines, last, stamps, credits: last ? [{ line: 'last', who: { my: 'ဖတ်သူ', en: 'the reader' } }] : [] } });
    if (res?.saved) F('kept', true);
    if (first) game.ui.hideDialog?.();
  }

  // ---------------------------------------------------------------------------------------------
  // the page's own frame: start, rooms, every frame
  // ---------------------------------------------------------------------------------------------
  // Day 15 is a day on foot: a reload (or a page that opened in the car) puts her back on her feet where she
  // was, and the car waits on the ring road east of the Writing Room, off the forecourt (it was parked under
  // the banner, in every launch shot)
  const PARK = { x: 5.5, z: 4.5, h: 0 };
  function parkCar() {
    const cp = game.car.root.position;
    if (Math.hypot(cp.x - FOUNT.x, cp.z - FOUNT.z) > 7.5 && !(Math.abs(cp.x) < 3.5 && cp.z > 7.5 && cp.z < 20)) return;
    try { game.world.drive.placeAt(PARK.x, PARK.z, PARK.h); game.syncCar?.(0); } catch (err) { console.error('day15 car', err); }
  }
  let settling = false;
  async function settleOnFoot() {
    settling = true;
    try { await settleNow(); } finally { settling = false; }
  }
  async function settleNow() {
    for (let i = 0; i < 60 && (game.busy || game.mode !== 'world') && !story.inRoom; i++) await wait(250);
    if (disposed || story.inRoom || sceneOn || game.busy || game.mode !== 'world') return;
    if (!story.foot.active) {
      const sp = save.place;
      await story.foot.toFoot().catch(() => {});
      if (story.foot.active && sp?.mode === 'foot' && Number.isFinite(sp.x) && Math.abs(sp.x) < 30 && sp.z > -20 && sp.z < 19.5) {
        story.foot.walker.teleport(sp.x, sp.z, sp.heading || 0);
        game.maya.root.position.set(sp.x, 0, sp.z);
      }
      story.refreshHud?.();
    }
    if (story.foot.active) parkCar();
  }

  const cool = {};
  const once =(k, s) => { const now = performance.now(); if (cool[k] && now - cool[k] < s * 1000) return false; cool[k] = now; return true; };
  let syncT = 0;

  const day = {
    talk,
    overlay,
    station,
    /** extras-chatter.js asks: no ambient townsfolk on the forecourt today (it is full of the launch's own guests)
     *  and none at all from dusk to the plane (25 people already stand in the frame) */
    owns(id) {
      if (id !== 'ambientFolk' || ended) return false;
      if (sceneOn || (F('dusk') && !F('flown'))) return true;
      const p = mayaPos();
      return !!p && near(p, FOUNT.x, FOUNT.z, 14);
    },
    roomCast(id) {
      if (ended) {
        if (id === 'content') return ROOM_PEOPLE.content(true);
        if (id === 'templates') return [{ id: 'kowunna', spot: 'kowunna' }];
        return [];
      }
      if (id === 'about') return F('morning') ? [] : [{ id: 'wintwar', spot: 'wintwarMat' }];
      if (F('dusk') && !F('flown')) return [];
      if (id === 'templates') return F('dusk') ? [] : ROOM_PEOPLE.templates();
      if (id === 'content') return ROOM_PEOPLE.content(!!F('flown'));
      if (id === 'library') return F('ncTalk') ? [] : ROOM_PEOPLE.library();
      if (id === 'sortingroom') return F('dusk') ? [] : ROOM_PEOPLE.sortingroom();
      return [];
    },
    async enterRoom(id) {
      if (disposed) return;
      if (story.doors?.roomCam) story.doors.roomCam(); else game.rig.setFollow(ROOM_CAM); // doors.js's shared close, low room camera
      if (id === 'about' && !F('morning') && !ended) { await wait(300); return knock(); }
      if (id === 'content' && F('flown') && !F('cafeAfter') && !ended) {
        await wait(500);
        await scripted(async () => { if (F('tea')) await say('maya', L.teaSeen, { face: 'happy' }); });
        F('cafeAfter', true);
      }
    },
    leaveRoom() {},
    /** The page turns in place: this page's props, keep-out boxes, people and hooks go away. */
    dispose() {
      disposed = true;
      if (ACTIVE === day) ACTIVE = null;
      const k = story.tapHooks?.indexOf(tapHook); if (k >= 0) story.tapHooks.splice(k, 1);
      for (const id of [...mine]) { dropLight(id); story.remove(id); }
      mine.clear();
      carryLantern(false);
      if (story.carrying) story.carry(null, { remove: true });
      placedLantern?.root.removeFromParent(); placedLantern?.dispose();
      mergeDressing(false);
      for (const p of props) { p.root?.removeFromParent(); try { p.dispose?.(); } catch { /* freed */ } }
      for (const o of objs) { o.removeFromParent(); o.traverse?.((c) => { if (c.geometry) c.geometry.dispose?.(); }); o.userData?.tex?.dispose?.(); }
      for (const m of mills) m.root.removeFromParent();
      star.dispose(); pool.dispose(); crowd.dispose();
      if (story.openWorld?.space) story.openWorld.space.remove(myObs);
      else for (const o of myObs) { const i = story.foot.obstacles.indexOf(o); if (i >= 0) story.foot.obstacles.splice(i, 1); }
      skipButton(false);
      ringOff(false);
      if (window.__day15 === hooks) delete window.__day15;
    },
    async start() {
      flushObs();
      if (ended) { syncOutdoor(); settleOnFoot(); return; }
      if (F('dusk') && !F('flown')) { F('dusk', false); } // a launch cut short by a reload starts again at the forecourt
      if (F('flown')) { setHour(19.2); ringOff(true); }
      else setHour(8.6);
      if (F('light') && !F('placed')) carryLantern(true);
      if (F('placed')) placeLantern();
      if (F('carrying') && !F('booklets')) { carryBox = bookletBox(12); carryBox.root.name = 'd15carryBox'; props.push(carryBox); story.carry(carryBox.root, { speed: 0.75, lift: 0.62 }); }
      if (F('morning')) { syncOutdoor(); settleOnFoot(); return; }
      // the morning: Maya wakes INSIDE the Writing Room (spawn at the desk), Ma Wint War knocks
      for (let i = 0; i < 60 && (game.busy || game.mode !== 'world') && !story.inRoom; i++) await wait(500);
      if (disposed) return;
      if (story.inRoom === 'about') {
        try { await game.getRoom('about'); } catch { /* dressed as it is */ }
        if (story.doors?.roomCam) story.doors.roomCam(); else game.rig.setFollow(ROOM_CAM);
        return knock();
      }
      if (story.inRoom) await story.exit({ instant: true });
      if (!story.foot.active) await story.foot.toFoot().catch(() => {});
      for (let i = 0; i < 20; i++) {
        if (await story.enter('about', { at: 'mayaDesk' })) return; // enterRoom runs the morning
        await wait(500);
        if (disposed || story.inRoom) return;
      }
      syncOutdoor(); // could not get in: the morning waits for Ma Wint War outdoors
      if (!story.people.get('wintwar')) { const d = doorOf('about'); story.spawn('wintwar', { x: d.x + 1.2, z: d.z + 1.0, heading: 0 }); mine.add('wintwar'); }
    },
    update(dt, t) {
      if (disposed) return;
      flushObs();
      for (const p of props) p.update?.(dt, t);
      for (const m of mills) m.spin(dt, 3);
      if (handLantern) handLantern.update(dt, t);
      if (placedLantern) placedLantern.update(dt, t);
      for (const l of lights.values()) { l.update(dt, t); l.spin?.(dt); }
      crowdSync();
      star.update(dt, t);
      if (lights.size || placedLantern) pool.update(game.camera);
      // the carried box rides with her (in a room or out)
      if (carryBox && story.carrying === carryBox.root) { const sc = game.maya.root.parent; if (sc && carryBox.root.parent !== sc) sc.add(carryBox.root); }
      if ((syncT -= dt) <= 0) { syncT = 0.8; syncOutdoor(); if (story.foot.active && !story.inRoom && !sceneOn && !game.busy) parkCar(); }
      if (story.inRoom || sceneOn || story.talking || game.busy || game.ui.dialogOpen) return;
      const p = mayaPos();
      if (!p || ended) return;
      // voices through open doors (heard, not marked)
      const tpl = doorOf('templates'), lib = doorOf('library');
      if (F('morning') && !F('booklets') && !F('carrying') && near(p, tpl.x, tpl.z, 8) && once('wn', 45)) story.bark('kowunna', L.wnCall, 3200);
      if (F('morning') && !F('ncTalk') && near(p, lib.x, lib.z, 8) && once('nc', 45)) story.bark('naychi', L.ncVoice, 3600);
      // the answered note comes off the board, by her own hand
      if (F('light') && !F('boardDown') && near(p, BOARD.stand.x, BOARD.stand.z, 2.6)) {
        F('boardDown', true);
        boardNote.visible = false;
        scripted(() => say('maya', L.boardDown, { face: 'happy' }));
        return;
      }
      // dusk opens at the fountain forecourt (on foot or by car)
      if (!F('flown') && !settling && near(p, FOUNT.x, FOUNT.z, story.foot.active ? 4.3 : 5.5)) {
        if (F('light') && F('ncTalk') && !F('carrying') && !(F('stems') > 0)) { launch(); return; }
        if (once('fore', 30)) {
          const line = !F('light') && !F('ncTalk') ? L.wwLater[0] : !F('ncTalk') ? L.waitNc : !F('light') ? L.waitLight : L.wwReady[0];
          story.bark(story.people.has('toetoe') ? 'toetoe' : 'maya', line, 3800);
        }
      }
    },
  };

  // ---------------------------------------------------------------------------------------------
  // test hooks: window.__day15
  // ---------------------------------------------------------------------------------------------
  const BEATS = {
    morning: [],
    board: ['morning'],
    ready: ['morning', 'board', 'paper', 'folded', 'light', 'ncMet', 'ncTalk'],
    dusk: ['morning', 'board', 'paper', 'folded', 'light', 'ncMet', 'ncTalk'],
    night: ['morning', 'board', 'paper', 'folded', 'light', 'ncMet', 'ncTalk', 'dusk', 'read', 'placed', 'lastLine', 'flown'],
  };
  const hooks = {
    flags: () => Object.fromEntries(Object.entries(save.flags).filter(([k]) => k.startsWith('d15.'))),
    state: () => ({ inRoom: story.inRoom, sceneOn, ended, people: [...story.people.keys()], lights: lights.size, carrying: !!story.carrying }),
    /** skipTo('morning'|'board'|'ready'|'dusk'|'night'): sets the flags before that beat, then runs it. */
    async skipTo(beat) {
      for (const f of BEATS[beat] || []) F(f, true);
      if (BEATS[beat]?.includes('light')) { story.has('lantern') || story.give('lantern', 1, { quiet: true }); carryLantern(true); boardNote.visible = !F('boardDown'); }
      if (beat === 'dusk') { if (story.inRoom) await story.exit({ instant: true }); syncOutdoor(); return launch(); }
      if (beat === 'night') { F('dusk', true); syncOutdoor(); placeLantern(); if (!story.inRoom) await story.enter('about', { at: 'mayaDesk' }); return night(); }
      if (beat === 'morning') { F('morning', false); if (story.inRoom === 'about') return knock(); if (story.inRoom) await story.exit({ instant: true }); return story.enter('about', { at: 'mayaDesk' }); }
      syncOutdoor();
      return true;
    },
    launch, night, morning, knock, desk, ncTalk,
    crowd: (on) => { crowdOn = on !== false; crowdSync(); return crowd.calls; },
    enter: (id) => story.enter(id),
    tap: (id) => { const t = targets.find((x) => x.id === id); return t ? t.fn() : null; },
    station: (id) => station(id, { room: story.inRoom }),
    MARKS, targets: () => targets.filter((x) => x.when()).map((x) => x.id),
  };
  window.__day15 = hooks;
  ACTIVE = day;
  return day;
}
