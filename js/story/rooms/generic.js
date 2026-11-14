// Generic rooms: the inside of any filler house in the world (the homes, shops and workshops the district files
// draw by the hundred), built from a seed so the same house always has the same room. PREVIEW (2026-11-14):
// nothing in the game registers these doors yet; dev/generic-rooms.html shows them.
//
//   import { buildGenericRoom, pickKind, doorsForItems, genericRoomSpec, KIND_NAMES } from './rooms/generic.js';
//   const r = buildGenericRoom({ seed, district, kind, trade?, w, d, doorSide?, hour?, evening?, rain?, quality? });
//       -> the story-room contract (rooms/quarter.js): { scene, group, stations, obstacles, door, spawn, spots,
//          bounds, width, depth, height, update(dt, t), setEvening(0..1), setRain(0..1), dispose(), ... }
//          plus { id, kind, trade, district, seed, name: { my, en }, residents, cast: [], talk }
//   doorsForItems(items, { regionAt, skipDoors }) -> [{ room: 'g:<district>:<itemIndex>', x, z, facing, region, r, kind, trade?, seed, art, w, d }]
//   pickKind(artKind, district, seedOrItem) -> { kind, trade? }
//   genericRoomSpec(door) -> { name, build(opts) }   a ROOMS-style spec for story.doors.registerRooms({ [door.room]: spec })
//
// Kinds: home (living mat + sleeping corner + cooking corner), shop (counter, stock shelves, sacks), workshop (by
// district: potter / carver / netmender / printer / weaver / carpenter), tea (tea stall room), baker (oven back
// room), fisher (wharf hut), gardener (seed trays, pots), student (desk, books, wall charts), elder (easy chair,
// radio, drawn frames), blank (the Blank Page's unfinished room: pencil walls, half-drawn furniture).
// Variety from the seed: one of several layouts per kind (home 3, shop / tea / student / elder 2 each), the
// layout mirrored left/right, wall / wainscot / floor / curtain palettes per district, furniture choices, wall
// art, how many people are home and what they are doing, and dress() (generic-dress.js): 3-4 pieces of
// lived-in clutter from the kind's pool (water jars, baskets, rolled mats, a sewing table, stacked stools,
// crates, net floats, planks...) set on free floor beside the walkway, where the close camera looks.
//
// Residents (rooms' own people, not story cast): 1-3 townspeople from people.js doing an idle job (cooking,
// kneading, reading, sweeping, mending, weaving, napping, playing...). r.residents = [{ id, p, job, role, look,
// spot, talk: { group, jobs } }] (talk: the smalltalk.js group and job tags that suit them, for chatter later);
// their spots are r.spots.r0, r1...; each is a soft obstacle. Free spots for a visitor: r.spots.maya / door / the
// kind's own ('sit', 'customer', 'table', ...).
// Light: the hour paints the windows (day, dusk, night; rain), lamps glow and pool at dusk, sun patches by day.
// Camera: none of its own (the game's close low room camera, story.doors.roomCam, frames it like every room).
// No markers, no guidance, nothing religious. Budget (measured, dev page): 7-10 draw calls and ~6-15k
// triangles for the room (shops up to ~30k), plus ~4 calls and ~1.2k triangles a person; built on enter,
// dispose() on exit.
import * as THREE from '../../game/three.js';
import { PALETTE } from '../../game/toon.js';
import { createPerson } from '../people.js';
import { folkName } from '../folknames.js';
import { makeStage, chooser, rand } from './generic-stage.js';
import { KINDS } from './generic-kinds.js';
import { dress, boundsOf } from './generic-dress.js';
import * as A from './generic-props.js';
import { doorsForItems, pickKind, KIND_NAMES, TRADES, hashStr } from './generic-doors.js';

export { doorsForItems, pickKind, KIND_NAMES, TRADES };
const PI = Math.PI, HP = PI / 2;

// ---------------------------------------------------------------------------------------------
// palettes per district: walls, wainscots, trims, floors ([type, colour, colour2]), curtains, mats, sign boards
// ---------------------------------------------------------------------------------------------
const MARKET = {
  walls: ['#F1E2A8', '#EBD9C0', '#E9D3CF', '#D7E3E4', '#F2E6CF'], wains: ['#C98E5A', '#9C5A3C', '#7FA3A0', '#B9875A'], trims: ['#8C6A3C', '#6E1F2A', '#A47A2C'],
  floors: [['tiles', '#C8754F', '#F1E6CC'], ['planks', '#B58A5A'], ['tiles', '#A9553B', '#E9DFC9'], ['planks', '#C9A06A']],
  curtains: ['#C8323C', '#E2B33C', '#2F7C7A', '#D97C8A'], mat: '#D9C08A', sign: '#6E1F2A',
};
const PAL = {
  market: MARKET, envelope: MARKET, home: MARKET,
  exercise: {
    walls: ['#EFE6CF', '#E3EBDD', '#F3E7C4', '#E9E2D4'], wains: ['#A8C49C', '#C98E5A', '#8FB0A0', '#B9875A'], trims: ['#6E5434', '#4F6F55', '#8C6A3C'],
    floors: [['planks', '#B58A5A'], ['tiles', '#C8754F', '#F1E6CC'], ['planks', '#C9A06A']], curtains: ['#9DBFB0', '#E8C4C0', '#E2B33C'], mat: '#D9C08A', sign: '#2F6B4F',
  },
  wharf: {
    walls: ['#D9C8A8', '#C9B48E', '#BFD2D0', '#D8D0BE'], wains: ['#8C7E6A', '#6F8A88', '#7E5A38'], trims: ['#5A4632', '#4E8C86'],
    floors: [['planks', '#A89A86'], ['planks', '#B98A5A'], ['planks', '#9C8B6E']], curtains: ['#4E8C86', '#E2B33C', '#C8323C'], mat: '#C8B36E', sign: '#2F5C5A',
  },
  junction: {
    walls: ['#ECE8DE', '#E5E1D6', '#E8E4D8', '#DDE3E2'], wains: ['#8FA3A8', '#3D8A84', '#B9A88A'], trims: ['#3A3634', '#2A2118', '#6E1F2A'],
    floors: [['tiles', '#9F9683', '#E8E2D2'], ['planks', '#A98A6A'], ['tiles', '#5E6B70', '#E8E2D2']], curtains: ['#3D8A84', '#C8323C', '#E2B33C'], mat: '#D2BF92', sign: '#2A2118',
  },
  hearth: {
    walls: ['#F0DFC0', '#EBD2B0', '#F2E2C8', '#E8D6BC'], wains: ['#B9573E', '#A9553B', '#8E4A2C'], trims: ['#6E3A24', '#8C6A3C'],
    floors: [['tiles', '#B9573E', '#D9A07A'], ['planks', '#B58A5A'], ['tiles', '#C98A6A', '#EAD9BC']], curtains: ['#C8323C', '#E2B33C', '#6B3E64'], mat: '#D9C08A', sign: '#8E4A2C',
  },
  garden: {
    walls: ['#EEF2E2', '#F4E8EC', '#E9EFD9', '#F6EEDB'], wains: ['#7FA383', '#B98A5A', '#A8C49C'], trims: ['#4F6F55', '#8C6A3C'],
    floors: [['planks', '#C9A06A'], ['tiles', '#B5643C', '#EAD9BC'], ['planks', '#B58A5A']], curtains: ['#E8A0A8', '#9DBFB0', '#E2B33C'], mat: '#D9C08A', sign: '#3E6B4F',
  },
  blank: {
    walls: ['#FBFAF6'], wains: ['#F3F1EB'], trims: ['#3A342E'], floors: [['tiles', '#FBFAF6', '#EFEDE6']], curtains: ['#FFFFFF'], mat: '#F1EFE9', sign: '#3A342E',
  },
};

// DRAFT(my): room names (the title the game shows inside)
export const KIND_TITLES = {
  home: { my: 'အိမ်', en: 'A home' }, shop: { my: 'ဆိုင်ခန်း', en: 'A small shop' }, tea: { my: 'လက်ဖက်ရည်ဆိုင်', en: 'A tea stall' },
  baker: { my: 'မုန့်ဖို နောက်ခန်း', en: "A baker's back room" }, fisher: { my: 'တံငါအိမ်', en: "A fisher's hut" },
  gardener: { my: 'ဥယျာဉ်မှူး အိမ်', en: "A gardener's house" }, student: { my: 'ကျောင်းသား အခန်း', en: "A student's room" },
  elder: { my: 'အဘွား အဘိုး အိမ်', en: "An elder's home" }, blank: { my: 'မပြီးသေးတဲ့ အခန်း', en: 'An unfinished room' },
  workshop: { my: 'အလုပ်ရုံ', en: 'A workshop' },
};
export const TRADE_TITLES = {
  carver: { my: 'တံဆိပ်တုံး ထွင်းရုံ', en: "A stamp carver's" }, potter: { my: 'မြေအိုး ဖိုရုံ', en: "A potter's" }, printer: { my: 'ပုံနှိပ်တိုက်', en: "A printer's" },
  weaver: { my: 'ယက်ကန်းရုံ', en: "A weaver's" }, netmender: { my: 'ပိုက်ကွန် ပြင်ရုံ', en: "A net-mender's" }, carpenter: { my: 'လက်သမားရုံ', en: "A carpenter's" },
};

/** The hour (0..24) -> the evening amount the stage and doors.js use (0 day .. 1 night). */
export function eveningFromHour(h) {
  if (!Number.isFinite(h)) return 0;
  h = ((h % 24) + 24) % 24;
  if (h < 5) return 1;
  if (h < 6.5) return 1 - (h - 5) / 1.5;
  if (h < 16.5) return 0;
  if (h < 19) return (h - 16.5) / 2.5;
  return 1;
}

// ---------------------------------------------------------------------------------------------
// residents' looks
// ---------------------------------------------------------------------------------------------
const CLOTHS = ['white', 'cream', 'maroon', 'rose', 'mustard', 'padauk', 'sky', 'navy', 'teal', 'olive', 'brown', 'tan', 'plum', 'coral', 'grey', 'charcoal', 'leaf'];
function makeLook(R, role, job) {
  const woman = role === 'woman' || (role !== 'man' && R.chance(0.5));
  const age = role === 'child' ? 'child' : role === 'teen' ? 'teen' : role === 'elder' ? 'elder' : 'adult';
  const look = { age, build: R.pick(['slim', 'mid', 'mid', 'wide']), skin: R.i(9), seed: R.i(100000) };
  const extras = [];
  if (woman) {
    look.hair = age === 'elder' ? 'bun' : R.pick(['bun', 'long', 'braid', 'bob', 'pony']);
    look.hairColor = age === 'elder' ? R.pick(['grey', 'white', 'salt']) : R.pick(['black', 'black', 'dark', 'brown']);
    look.top = age === 'child' ? R.pick(['tee', 'blouse']) : R.pick(['blouse', 'blouse', 'eingyi', 'tee']);
    look.bottom = age === 'child' && R.chance(0.4) ? 'shorts' : 'htamein';
    if (age !== 'child' && R.chance(0.45)) extras.push('thanaka');
    if (age === 'adult' && R.chance(0.2)) extras.push('flower');
  } else {
    look.hair = age === 'elder' ? R.pick(['receding', 'short', 'bald']) : R.pick(['short', 'side', 'crew', 'parted', 'spiky']);
    look.hairColor = age === 'elder' ? R.pick(['grey', 'white', 'salt']) : R.pick(['black', 'dark', 'black']);
    look.top = age === 'child' ? 'tee' : R.pick(['shirt', 'tee', 'eingyi', 'vest', 'shirt']);
    look.bottom = age === 'child' ? R.pick(['shorts', 'longyi']) : R.chance(0.1) ? 'trousers' : 'longyi';
    if (look.bottom === 'longyi') look.check = R.chance(0.45);
    if (age !== 'child' && R.chance(0.15)) extras.push('moustache');
  }
  if (role === 'teen' && R.chance(0.45)) { look.top = 'school'; look.bottom = woman ? 'schoolSkirt' : 'schoolLongyi'; }
  if (age === 'elder' && R.chance(0.55)) extras.push('glasses');
  if (['cook', 'knead', 'pour'].includes(job)) extras.push('apron');
  if (['plane', 'carve', 'mend', 'throw', 'press'].includes(job) && R.chance(0.5)) extras.push('towel');
  look.topColor = R.pick(CLOTHS);
  look.bottomColor = R.pick(['maroon', 'navy', 'teal', 'brown', 'plum', 'olive', 'charcoal', 'rose', 'mustard']);
  look.extras = extras;
  return look;
}
const JOB_MOOD = { cook: 'work', knead: 'work', pour: 'work', keep: null, pot: 'work', press: 'work', plane: 'work', carve: 'work', mend: 'work', throw: 'work', weave: 'work', draw: 'work', read: 'read', study: 'read', sweep: 'sweep', play: 'play', nap: null, idle: null };
const JOB_TAGS = { pour: ['vendor'], keep: ['vendor'], knead: ['baker'], throw: ['potter'], weave: ['weaver'], mend: ['fisher', 'worker'], carve: ['worker'], press: ['worker'], plane: ['worker'], pot: ['worker'], draw: ['worker'], study: ['kid'] };
// DRAFT(my): what a resident is doing, for a name card or a tap later
const JOB_NAMES = {
  cook: { my: 'ထမင်းချက်နေတယ်', en: 'cooking' }, knead: { my: 'မုန့်နယ်နေတယ်', en: 'kneading dough' }, pour: { my: 'လက်ဖက်ရည် ဖျော်နေတယ်', en: 'making tea' },
  keep: { my: 'ဆိုင်ထိုင်နေတယ်', en: 'minding the shop' }, pot: { my: 'ပျိုးပင် စိုက်နေတယ်', en: 'potting seedlings' }, press: { my: 'စာရွက် ရိုက်နေတယ်', en: 'printing' },
  plane: { my: 'ပျဉ်ချပ် ရွေနေတယ်', en: 'planing a board' }, carve: { my: 'တံဆိပ်တုံး ထွင်းနေတယ်', en: 'carving a stamp' }, mend: { my: 'ပိုက်ကွန် ဖာနေတယ်', en: 'mending a net' },
  throw: { my: 'အိုးလုပ်နေတယ်', en: 'throwing a pot' }, weave: { my: 'ယက်ကန်း ခတ်နေတယ်', en: 'weaving' }, draw: { my: 'အခန်းကို ဆွဲနေတယ်', en: 'drawing the room in' },
  read: { my: 'စာဖတ်နေတယ်', en: 'reading' }, study: { my: 'စာကျက်နေတယ်', en: 'studying' }, sweep: { my: 'တံမြက်လှည်းနေတယ်', en: 'sweeping' },
  play: { my: 'ကစားနေတယ်', en: 'playing' }, nap: { my: 'မှေးနေတယ်', en: 'napping' }, idle: { my: 'နားနေတယ်', en: 'resting' },
};

/** Seated pose (after person.update): hips down on the seat, thighs forward. */
function seatPose(p, seatY) {
  const b = p.bones;
  if (!b) return;
  b.hips.position.y = seatY + 0.03;
  b.legL.rotation.x = -1.3;
  b.legR.rotation.x = -1.3;
}

// ---------------------------------------------------------------------------------------------
// the builder
// ---------------------------------------------------------------------------------------------
/** Mirror a builder's parts left/right in place (x -> -x, winding and normals fixed): the seed's flipped layouts
 *  mirror their furniture too, so what stands at a piece's left end (a glass case, a scale) stays where people expect. */
function mirrorBuilder(v) {
  v.parts = v.parts.map((g0) => {
    const g = g0.index ? g0.toNonIndexed() : g0;
    const P = g.attributes.position, N = g.attributes.normal, Cc = g.attributes.color;
    for (let i = 0; i < P.count; i++) { P.setX(i, -P.getX(i)); if (N) N.setX(i, -N.getX(i)); }
    for (let t = 0; t + 2 < P.count; t += 3) for (const A of [P, N, Cc]) {
      if (!A) continue;
      for (let k = 0; k < A.itemSize; k++) { const a = A.array[(t + 1) * A.itemSize + k]; A.array[(t + 1) * A.itemSize + k] = A.array[(t + 2) * A.itemSize + k]; A.array[(t + 2) * A.itemSize + k] = a; }
    }
    P.needsUpdate = true;
    return g;
  });
  return v;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const snap = (v, s = 0.2) => Math.round(v / s) * s;

/**
 * buildGenericRoom({ seed, district, kind, trade, w, d, doorSide, hour, evening, rain, quality, people })
 *   seed       any integer (doorsForItems gives one per house)    district  'market' | 'wharf' | ... | 'blank'
 *   kind       KIND_NAMES (default: picked from the seed)         trade     workshops: carver | potter | printer |
 *                                                                           weaver | netmender | carpenter
 *   w, d       the house's outside size (metres): the room is sized from it (5.6-7.2 wide, 4.8-6.0 deep)
 *   doorSide   (accepted; the entrance is always the open front's middle, the dollhouse rule)
 *   hour / evening  the light (hour 0..24, or evening 0..1);   rain  bool / 0..1
 *   quality    'low' keeps at most two residents and no dust motes;   people: false builds no residents
 */
export function buildGenericRoom(opts = {}) {
  const seed = (Number.isFinite(opts.seed) ? opts.seed : hashStr(String(opts.seed ?? 'g'))) >>> 0;
  const district = PAL[opts.district] ? opts.district : 'market';
  const picked = opts.kind ? { kind: opts.kind } : pickKind('house', district, seed);
  let kind = KINDS[picked.kind] ? picked.kind : 'home';
  if (district === 'blank') kind = 'blank';
  const trade = kind === 'workshop' ? opts.trade || picked.trade || TRADES[district] || 'carver' : null;
  const R = chooser(seed ^ 0x5bd1e995);
  const pal = PAL[district];
  const W = kind === 'blank' ? 6.2 : clamp(snap((opts.w || 5) * 1.2), 5.6, 7.2);
  const D = kind === 'blank' ? 5.2 : clamp(snap((opts.d || 4.6) + 0.6), 4.8, 6.0);
  const [ftype, fcol, fcol2] = R.pick(pal.floors);
  const evening = Number.isFinite(opts.evening) ? opts.evening : eveningFromHour(opts.hour ?? 10);
  const rainK = opts.rain === true ? 1 : Math.max(0, Math.min(1, +opts.rain || 0));
  const st = makeStage({
    width: W, depth: D, height: 3,
    wall: R.pick(pal.walls), wainscot: R.pick(pal.wains), trim: R.pick(pal.trims),
    floor: ftype, floorColor: fcol, floorColor2: fcol2 || PALETTE.cream,
    background: district === 'blank' ? '#F4F2EC' : PALETTE.cream,
    district, seed, evening, rain: rainK,
  });
  const flip = R.chance(0.5);
  const X = (x) => (flip ? -x : x);
  const side = (s) => (flip ? (s === 'left' ? 'right' : 'left') : s);
  const residents = [];
  const resSpecs = [];
  const taken = []; // room-space bounds of everything put (dress() keeps its clutter off them)
  const maxRes = opts.people === false ? 0 : opts.quality === 'low' ? 2 : 3;
  const c = {
    st, R, flip, X, side, W, D, H: st.H, hw: st.hw, hd: st.hd, S: st.S, district, kind, trade, seed, pal,
    hour: Number.isFinite(opts.hour) ? opts.hour : evening > 0.7 ? 20 : evening > 0.2 ? 18 : 10,
    rain: rainK > 0.5,
    ry: (a) => (flip ? -a : a),
    put(v, x, z, ry = 0, fp = null, name = 'prop', solid = true) {
      const vv = flip ? mirrorBuilder(v) : v, rr = flip ? -ry : ry;
      const b = boundsOf(vv, X(x), z, rr);
      if (b) taken.push(b);
      return st.put(vv, X(x), z, rr, fp, name, solid);
    },
    back(v, x, fp, name = 'prop') { return c.put(v, x, -st.hd + fp.d / 2 + 0.03, 0, fp, name); },
    onWall(v, s, z, fp, name = 'prop', depth = null, solid = true) {
      const w = side(s), dd = depth ?? fp?.d ?? 0.1;
      const x = w === 'left' ? -st.hw + dd / 2 + 0.03 : st.hw - dd / 2 - 0.03;
      const vv = flip ? mirrorBuilder(v) : v, rr = w === 'left' ? HP : -HP;
      if (fp || solid) { const b = boundsOf(vv, x, z, rr); if (b && b.h > 0 && (fp || b.h < 1.2)) taken.push(b); }
      return st.put(vv, x, z, rr, fp, name, solid && !!fp);
    },
    sign(wall, along, y, w, h, draw, px = 200) { return wall === 'back' ? st.wallSign('back', X(along), y, w, h, draw, px) : st.wallSign(side(wall), along, y, w, h, draw, px); },
    win(o) { return o.wall && o.wall !== 'back' ? st.window({ ...o, wall: side(o.wall), seed }) : st.window({ ...o, wall: 'back', x: X(o.x || 0), seed }); },
    /** A wall lamp: wall 'back' (along = x) or 'left' / 'right' (along = z); a warm pool on the floor before it at dusk. */
    lamp(wall, along, k = 'oil', y = 2.1) {
      const w = wall === 'back' ? 'back' : side(wall);
      const x = w === 'back' ? X(along) : w === 'left' ? -st.hw : st.hw, z = w === 'back' ? -st.hd : along;
      const dx = w === 'left' ? 1 : w === 'right' ? -1 : 0, dz = w === 'back' ? 1 : 0;
      const [fx, fy, fz] = A.wallLamp(st.S, x, y, z, dx, dz, k);
      if (k === 'bulb') st.flame(fx, fy, fz, 0.09, 0.07); else st.flame(fx, fy, fz, 0.05, 0.09);
      st.pool(x + dx * 1.0, z + dz * 1.0, 1.7);
    },
    spot(name, x, z, h = 0) { return st.spot(name, X(x), z, flip ? -h : h); },
    /** A resident: job (JOB_MOOD), at (x, z) facing h; opts { role, seat (seat height), lie (bed top), raw (already in room space) }. */
    res(job, x, z, h = 0, o = {}) {
      if (resSpecs.length >= maxRes) return;
      const raw = !!o.raw;
      let wx = raw ? x : X(x), wh = raw ? h : flip ? -h : h;
      if (o.lie) { wx = X(x) + (flip ? -0.72 : 0.72); wh = 0; } // lying with the head on the bed's pillow end
      resSpecs.push({ job, x: wx, z, h: wh, role: o.role || 'woman', seat: o.seat ?? null, lie: o.lie ?? null });
    },
  };
  (KINDS[kind] || KINDS.home)(c);
  // lived-in clutter on the free floor the close camera sees (seeded; never on the walkway, furniture or people)
  const dressed = kind !== 'blank' ? dress(c, { taken, people: resSpecs }) : 0;
  // the doorway and Maya's first step in
  st.spot('door', 0, st.hd - 0.35, PI);
  st.spot('maya', 0, st.hd - 1.1, PI);
  st.finish();

  // residents (after the bake: people are never merged)
  resSpecs.forEach((s, i) => {
    const look = makeLook(chooser(seed + 101 * (i + 1)), s.role, s.job);
    const p = createPerson(look);
    p.root.userData.isPerson = true;
    p.root.position.set(s.x, 0, s.z);
    p.root.rotation.y = s.h;
    if (s.lie != null) { p.root.rotation.set(0, 0, flip ? -HP : HP); p.root.position.y = s.lie + 0.14; }
    const mood = JOB_MOOD[s.job] ?? null;
    if (mood) p.setMood(mood);
    if (s.job === 'nap') p.setFace('blink', 1e9);
    else if (s.job === 'play') p.setFace('happy');
    st.room.scene.add(p.root);
    const id = `r${i}`;
    const spot = st.spot(id, s.x, s.z, s.h);
    if (s.lie == null) st.room.obstacles.push({ type: 'circle', x: s.x, z: s.z, r: s.seat != null && s.seat < 0.1 ? 0.42 : 0.3 });
    const tags = [...(JOB_TAGS[s.job] || [])];
    if (s.role === 'elder') tags.push('elder');
    if (s.role === 'child') tags.push('kid');
    const name = folkName({ district, house: opts.id ?? `g:${district}:${seed % 100000}`, slot: i, age: look.age, woman: ['bun', 'long', 'braid', 'bob', 'pony'].includes(look.hair) }); // own name, one town only, the same each visit
    residents.push({ id, name, p, job: s.job, doing: JOB_NAMES[s.job] || JOB_NAMES.idle, role: s.role, look, spot, seat: s.seat, lie: s.lie, talk: { group: district, jobs: tags } });
  });

  const base = st.result({});
  const title = kind === 'workshop' ? TRADE_TITLES[trade] || KIND_TITLES.workshop : KIND_TITLES[kind];
  return {
    ...base,
    id: opts.id || `g:${district}:${seed}`,
    kind, trade, district, seed, flip, dressed,
    name: title,
    residents,
    cast: [], // (doors.js: no story cast here; the residents are the room's own)
    talk: { group: district },
    update(dt, t) {
      base.update(dt, t);
      for (const r of residents) {
        r.p.update(dt, { speed: 0 });
        if (r.seat != null) seatPose(r.p, r.seat);
      }
    },
    dispose() {
      for (const r of residents) { r.p.root.removeFromParent(); r.p.dispose?.(); }
      base.dispose();
    },
  };
}

/** A ROOMS-style spec for one door from doorsForItems (story.doors.registerRooms({ [door.room]: spec })). */
export function genericRoomSpec(door) {
  const kind = door.kind || 'home';
  return {
    name: kind === 'workshop' ? TRADE_TITLES[door.trade] || KIND_TITLES.workshop : KIND_TITLES[kind] || KIND_TITLES.home,
    district: door.region,
    generic: true,
    build: (o = {}) => buildGenericRoom({ seed: door.seed, district: door.region, kind, trade: door.trade, w: door.w, d: door.d, id: door.room, evening: o.evening, rain: o.rain, quality: o.quality }),
  };
}

export { rand };
