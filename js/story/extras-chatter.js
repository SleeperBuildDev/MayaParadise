// Story-mode town chatter, wired in: the speech bubbles of chatter/index.js (town, area and room lines, overheard
// pairs, Maya's arrival thought), the random small talk of chatter/smalltalk.js between two townspeople near her,
// the residents of the everyday houses (rooms/generic.js) talking, and a few light ambient townsfolk standing
// where the area lines are (so those lines have somebody to say them). story.js calls
// installChatter(game, story, openWorld) once, after the town intros are installed.
//
//   story.chatter            the chatter (chatter/index.js); story.chatterExtras: { folk, small, debug }
//   story.events             a tiny emitter (on / off / emit): 'town:arrive' { id, first } plays Maya's arrival
//                            thought (extras-ui.js calls story.chatter.onArrive itself; either works)
//
// Pure ambience. Never a pointer, a marker or a direction: the folk stand off the roads, away from every door and
// day spot, and say only everyday things. Nothing talks during a talk, an act, a scene, a town intro, the map or a
// page turn (chatter/index.js's gates; small talk goes through the same one-exchange slot, so two things never
// talk at once). Language follows the EN / MY toggle (tr at show time, and on 'mw:lang').
//
// Ambient folk (phone budget, measured: each person is 4 draw calls, ~1.2k triangles):
//   at most MAX_FOLK alive at once (2 on the low tier), at most 2 per area; spawned only for areas with lines
//   ambient folk can say (no job, or a kind of person), when the area does not already have 2 townsfolk; they
//   appear off screen as she nears the area and go once she is well away (or when the frame's draw calls run
//   over CALL_CAP). They stand (no walk grid, no path finding: no CPU beyond a person's pose); a pair stands
//   facing each other. Tap one for a hello. A day may keep them away: day.owns('ambientFolk') (none at all),
//   day.owns('folk:<district>:<area>') (one area), or day.owns(<folk id>).
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { createChatter } from './chatter/index.js';
import { SMALLTALK } from './chatter/smalltalk.js';
import { createPerson } from './people.js';
import { castById } from './cast.js';
import { PEOPLE as REGION_PEOPLE, REGION_FILES, regionAt, bookDist } from './world/region.js';
import { DOORS } from './doors.js';
import { folkName, folkSlot, releaseFolkSlot, hashName } from './folknames.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const seeded = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---- tuning (metres, seconds)
const SMALL = { first: [8, 16], gap: [18, 40], retry: 3, apart: 6, near: 31 }; // outdoor small talk (overheard: a bubble reads the same far off; reaches the town pair spawned TOWN_FAR up the street)
const ROOMT = { first: [4, 7], gap: [16, 30] }; // an everyday house's residents
const MAX_FOLK = 4, MAX_FOLK_LOW = 2, PER_AREA = 2;
const SPAWN_NEAR = 16; // she is within area.r + this: its folk appear
const DROP_FAR = 42, DROP_ALWAYS = 70; // gone once she is this far (off screen) / this far (anyway)
const CALL_CAP = 72, CALL_DROP = 84; // no new folk while the frame draws more than CALL_CAP calls; over CALL_DROP for a while, one goes
// (the towns alone draw ~55-80 calls on foot: the folk may add at most a person or two on top, never a crowd)
const KEEP = { road: 2.4, door: 3.6, spot: 2.6, person: 2.8, maya: 4 };
const TOWN_FAR = [23, 29], TOWN_R = 22, TOWN_MIN = 11; // no area near: a pair of the town's own folk, first up the street
// in front of the camera (TOWN_FAR m: far enough to come into view without popping up), else out of view round her
// In view first (owner: standing still in a town, its folk and their small talk are seen and heard within ~20-40 s).
// A portrait phone sees a narrow, tall slice: a spot just past its sides is never seen while she stands, so the folk
// stand in its up / down space (up the street ahead of her, or between her and the controls), clear of the HUD, and
// walk in from the nearer side edge (a few steps): nobody pops up in front of her. Screen fractions of the view.
const VIEW = { top: 0.17, bot: 0.8, side: 44, near: 4.1, far: 22, tries: 48, walk: [1.05, 1.3], walkMax: 9, offFor: 4 };

// DRAFT(my): everyday things an everyday house's residents say (to the air, or to a visitor). Never a task or a
// way to go; no lesson needed (it is just home life).
const HOUSE_LINES = {
  any: [
    { my: 'ဧည့်သည် ရောက်လာတော့ ဝမ်းသာတယ်။', en: 'Nice to have a visitor.' },
    { my: 'ထမင်းစားပြီးပြီလား။', en: 'Have you eaten yet?' },
    { my: 'မိုးရွာနေတယ်။ ခဏ နားသွားပါဦး။', en: "It's raining. Stay a while.", weather: 'rain' },
    { my: 'မှောင်ပြီနော်။ လမ်းမှာ သတိထား။', en: "It's dark now. Mind the road.", time: 'night' },
  ],
  home: [
    { my: 'ထိုင်ပါ၊ ထိုင်ပါ။ ရေနွေးကြမ်း သောက်ဦး။', en: 'Sit, sit. Have some plain tea.' },
    { my: 'အိမ်က ကျဉ်းပေမဲ့ နွေးတယ်။', en: 'The house is small, but it is warm.' },
    { my: 'ဟင်းအိုး ဆူတော့မယ်။ နံ့ရလား။', en: 'The curry is nearly done. Smell that?' },
  ],
  shop: [
    { my: 'ဘာယူမလဲ သမီး။', en: 'What can I get you, dear?' },
    { my: 'ဒီနေ့ ဈေးမတက်သေးဘူး။ မနက်ဖြန်တော့ မသိဘူး။', en: "Prices held today. Tomorrow, who knows." },
    { my: 'အကြွေ ရှိလား။ ငါ့မှာ ကုန်နေပြီ။', en: "Got any small change? I'm out." },
  ],
  workshop: [
    { my: 'ဖုန်နည်းနည်း ထနေတယ်နော်။', en: 'Bit dusty in here, sorry.' },
    { my: 'လက်က အလိုလို သိနေပြီ။ နှစ်တွေ ကြာပြီလေ။', en: 'My hands know the way by now. It has been years.' },
    { my: 'ပထမဆုံး လုပ်တာက မလှဘူး။ လုပ်ရင်းနဲ့ ရလာတာ။', en: 'My first one was ugly. It came with doing.' },
  ],
  tea: [
    { my: 'ပေါ့ဆိမ့်လား၊ ချိုဆိမ့်လား။', en: 'Light and creamy, or sweet and creamy?' },
    { my: 'ရေနွေးကြမ်းက အလကားပါ။', en: 'The plain tea is free.' },
    { my: 'ဒီခုံက အကောင်းဆုံး။ လေလည်တယ်။', en: 'Best stool in the place. Catches the breeze.' },
  ],
  baker: [
    { my: 'မုန့်ညက်က အချိန်ပေးရတယ်။ စောင့်ရတယ်။', en: 'Dough takes time. You wait for it.' },
    { my: 'မီးဖိုနားမှာ နွေးတယ်နော်။', en: "Warm by the oven, isn't it?" },
    { my: 'မနက် လေးနာရီကတည်းက ထနေတာ။', en: "I've been up since four." },
  ],
  fisher: [
    { my: 'ပိုက်က အပေါက်တွေ ပြန်ဖာနေတာ။', en: 'Mending the holes in the net.' },
    { my: 'ဒီနေ့ ရေက တိတ်တယ်။', en: 'The water is quiet today.' },
    { my: 'ငါးခြောက်နံ့ နည်းနည်း ရမယ်နော်။', en: "You'll smell a bit of dried fish." },
  ],
  gardener: [
    { my: 'မျိုးစေ့တွေက ကိုယ့်အချိန်နဲ့ကိုယ် ပေါက်တာ။', en: 'Seeds come up in their own time.' },
    { my: 'ရေလောင်းဖို့ မမေ့နဲ့လို့ ကိုယ့်ကိုယ်ကိုယ် ပြောနေရတယ်။', en: 'I keep reminding myself to water them.' },
    { my: 'အိုးလေးတွေကို ခြေထောက်နဲ့ မတိုက်မိစေနဲ့နော်။', en: 'Mind the little pots by your feet.' },
  ],
  student: [
    { my: 'စာမေးပွဲ နီးလာပြီ။', en: 'Exams are coming.' },
    { my: 'ဒီပုစ္ဆာ သုံးခါ တွက်ပြီးပြီ။ လေးခါမြောက် ရမှာပါ။', en: 'Third try at this sum. The fourth will do it.' },
    { my: 'တိုးတိုးလေးနော်။ စာကျက်နေတယ်။', en: "Quietly, please. I'm studying." },
  ],
  elder: [
    { my: 'ငါ ငယ်ငယ်တုန်းက ဒီလမ်းမှာ ကားမရှိဘူး။', en: 'When I was young there were no cars on this road.' },
    { my: 'ရေဒီယိုက သီချင်းဟောင်းလေးတွေ ဖွင့်တယ်။', en: 'The radio plays the old songs.' },
    { my: 'ထိုင်ပါဦး ကလေးရယ်။ ခြေထောက် မညောင်းဘူးလား။', en: "Sit a while, child. Aren't your feet tired?" },
  ],
  blank: [
    { my: 'ဒီအခန်းကို ရေးလို့ မပြီးသေးဘူး။', en: "This room isn't finished being written." },
    { my: 'ပရိဘောဂက တစ်ဝက်ပဲ ဆွဲရသေးတယ်။', en: 'The furniture is only half drawn.' },
    { my: 'ခဲတံနံ့ ရတယ်နော်။', en: "Smells of pencil, doesn't it?" },
  ],
};
// DRAFT(my): an ambient townsperson's hello when Maya taps them
const HELLOS = [
  { my: 'မင်္ဂလာပါ။ နေကောင်းလား။', en: 'Hello. Keeping well?' },
  { my: 'ထမင်းစားပြီးပြီလား။', en: 'Eaten yet?' },
  { my: 'အေးအေးဆေးဆေး လျှောက်နော်။', en: 'Take it easy out there.' },
  { my: 'ဒီနေ့ နေသာတယ်နော်။', en: 'Nice and bright today.', dry: true },
  { my: 'ထီး ပါလား။ ရွှဲကုန်မယ်။', en: "Got an umbrella? You'll get soaked.", weather: 'rain' },
];
// DRAFT(my): what the folk are called in the dialogue box (by age and clothes)
const NAMES = {
  aunty: { my: 'အန်တီ', en: 'Aunty' }, uncle: { my: 'ဦးလေး', en: 'Uncle' },
  grandma: { my: 'အဘွား', en: 'Grandma' }, grandpa: { my: 'အဘိုး', en: 'Grandpa' },
  girl: { my: 'ညီမလေး', en: 'A girl' }, boy: { my: 'မောင်လေး', en: 'A boy' }, kid: { my: 'ကလေး', en: 'A kid' },
};
// what the folk of each district do (chatter/index.js reads a person's kind from the role: vendor, fisher, ...)
const ROLES = {
  home: [['neighbour', 'အိမ်နီးချင်း'], ['visitor', 'ဧည့်သည်']],
  exercise: [['neighbour', 'အိမ်နီးချင်း'], ['teacher', 'ဆရာ'], ['tea shop regular', 'လက်ဖက်ရည်ဆိုင် ဖောက်သည်']],
  envelope: [['traveller', 'ခရီးသွား'], ['cart porter', 'လှည်းထမ်း'], ['neighbour', 'အိမ်နီးချင်း']],
  market: [['stall seller', 'ဈေးသည်'], ['customer', 'ဈေးဝယ်'], ['porter', 'အထမ်းသမား']],
  wharf: [['fisher', 'တံငါ'], ['porter', 'အထမ်းသမား'], ['net mender', 'ပိုက်ဖာသူ']],
  junction: [['news seller', 'သတင်းစာရောင်းသူ'], ['traveller', 'ခရီးသွား'], ['neighbour', 'အိမ်နီးချင်း']],
  hearth: [['baker', 'မုန့်ဖုတ်သူ'], ['weaver', 'ယက်ကန်းသမား'], ['neighbour', 'အိမ်နီးချင်း']],
  garden: [['gardener', 'ဥယျာဉ်မှူး'], ['potter', 'အိုးထိန်း'], ['neighbour', 'အိမ်နီးချင်း']],
  blank: [['traveller', 'ခရီးသွား'], ['lodge keeper', 'တည်းခိုခန်းစောင့်']],
};
// a line's `job` the folk can fit (anything else is a named person's line: someone else says it)
const FOLK_JOBS = new Set(['*', 'kid', 'child', 'teen', 'adult', 'elder', 'aunty', 'uncle', 'worker', 'visitor', 'vendor', 'customer', 'buyer',
  'traveller', 'guest', 'porter', 'carter', 'fisher', 'gardener', 'potter', 'baker', 'weaver', 'teacher', 'keeper']);
const CLOTHS = ['white', 'cream', 'maroon', 'rose', 'mustard', 'sky', 'navy', 'teal', 'olive', 'tan', 'plum', 'coral', 'leaf'];

export function installChatter(game, story, ow) {
  if (story.chatter) return story.chatter;
  const chatter = createChatter(game, story);
  story.chatter = chatter;
  const save = story.save;
  const v = new THREE.Vector3(), w = new THREE.Vector3();
  const W = () => game.viewW || window.innerWidth, H = () => game.viewH || window.innerHeight;
  const mayaXZ = () => game.maya.root.getWorldPosition(v);
  const low = game.tier === 'low';
  const AMBIENT_IDS = new Set(REGION_PEOPLE.map((p) => p.id));

  // ---- story.events: the town intro's arrival (extras-ui.js also calls chatter.onArrive directly)
  if (!story.events) {
    const hs = new Map();
    story.events = {
      on(n, f) { (hs.get(n) || hs.set(n, []).get(n)).push(f); },
      off(n, f) { const l = hs.get(n); if (l) l.splice(l.indexOf(f) >>> 0, 1); },
      emit(n, d) { for (const f of (hs.get(n) || []).slice()) { try { f(d); } catch (e) { console.error('story event', n, e); } } },
    };
  }
  let lastArrive = { id: null, at: 0 };
  const arrive0 = chatter.onArrive;
  chatter.onArrive = (id, first) => { // (once per arrival, whoever calls it)
    const t = performance.now();
    if (lastArrive.id === id && t - lastArrive.at < 4000) return false;
    lastArrive = { id, at: t };
    return arrive0(id, first);
  };
  story.events.on('town:arrive', (d) => d && chatter.onArrive(d.id, d.first));
  // no town intro installed (extras-ui.js missing or failed): the chatter's own district detector says the thought
  setTimeout(() => { if (!story.ui?.intro) chatter.autoArrive = true; }, 9000);

  // ---- helpers
  const blockedNow = () => !!chatter.blocked() || (game.mode !== 'world' && !story.inRoom); // (inside, game.mode is 'room')
  const onScreen = (p, pad = 10) => {
    p.root.getWorldPosition(w); w.y += (p.height || 1.3) + 0.3;
    const q = game.rig?.project ? game.rig.project(w, W(), H()) : null;
    return !!q && q.x > pad && q.x < W() - pad && q.y > 40 && q.y < H() - 60;
  };
  const ptOnScreen = (x, z) => {
    const q = game.rig?.project ? game.rig.project(w.set(x, 1.0, z), W(), H()) : null;
    return !!q && q.x > -40 && q.x < W() + 40 && q.y > -40 && q.y < H() + 40;
  };
  const inView = (x, z) => { const q = game.rig?.project ? game.rig.project(w.set(x, 1.6, z), W(), H()) : null; return !!q && q.x > 30 && q.x < W() - 30 && q.y > 70 && q.y < H() - 120; };
  const districtAt = (x, z) => (bookDist(x, z) <= 0 ? 'home' : regionAt(x, z)?.id || null);
  const period = () => game.day?.period || 'noon';
  const raining = () => save.weather === 'rain' || save.weather === 'drizzle';
  const fitsNow = (l) => (!l.time || l.time === period()) && (!l.rain || raining()) && (!l.weather || raining()) && !(l.dry && raining());
  const dayOwns = (id) => { try { return typeof story.day?.owns === 'function' && !!story.day.owns(id); } catch { return false; } };

  /** the kinds of person someone is, for small talk's `jobs` (a Set) */
  function tagsOf(e) {
    const t = new Set();
    const look = e.look || e.cast?.look || {};
    const role = String(e.cast?.role?.en || e.role || '').toLowerCase();
    const age = look.age || 'adult';
    t.add(age);
    if (age === 'child') t.add('kid');
    for (const j of e.talk?.jobs || []) t.add(j);
    const words = [['vendor', /stall|shop|sell|vendor|keeper|cook|trader/], ['fisher', /fish|net|raft|boat/], ['baker', /bak/], ['weaver', /weav|loom/],
      ['potter', /pot|kiln|clay/], ['teacher', /teacher|master/], ['gardener', /garden/]];
    for (const [k, re] of words) if (re.test(role)) t.add(k);
    if (age !== 'child' && !/pupil|student/.test(role)) t.add('worker');
    if (age === 'elder') t.add('elder');
    return t;
  }
  /** someone who may make small talk: the district's own folk, never a day's story cast */
  function chatty(e) {
    if (!e?.p?.root || e === story.talkWith || e.ctl || e.walking || e.hidden || e.indoor) return false;
    if (e.p.root.visible === false || !e.p.root.parent) return false;
    return !!e.folk || AMBIENT_IDS.has(e.id) || !!e.cast?.ambient || !castById(e.id);
  }

  // ---- small talk: what was said (least recently used first; per viewer, a convenience only)
  const STORE = 'rc-smalltalk-v1';
  let used = {};
  try { used = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch { used = {}; }
  let useSeq = Object.values(used).reduce((a, b) => Math.max(a, b), 0);
  const markUsed = (k) => { used[k] = ++useSeq; try { localStorage.setItem(STORE, JSON.stringify(used)); } catch { /* private mode */ } };
  function pickLRU(items) {
    if (!items.length) return null;
    const fresh = items.filter((it) => !used[it.key]);
    if (fresh.length) return pick(fresh);
    const s = items.slice().sort((a, b) => used[a.key] - used[b.key]);
    return pick(s.slice(0, Math.max(1, Math.ceil(s.length / 4))));
  }
  /** a small-talk exchange that suits these two, here and now: { key, ex } or null */
  function chooseExchange(group, a, b) {
    const ta = tagsOf(a), tb = tagsOf(b);
    const kids = ta.has('kid') || tb.has('kid');
    const fits = (ex) => {
      if (!fitsNow(ex)) return false;
      if (Array.isArray(ex.jobs) && ex.jobs.length && !ex.jobs.some((j) => ta.has(j) || tb.has(j))) return false;
      // children talk about children's things (an exchange tagged kid), grown-ups about the rest
      if (kids && !(ex.jobs || []).includes('kid') && Math.random() < 0.7) return false;
      return true;
    };
    const items = (g) => (SMALLTALK[g] || []).map((ex, i) => ({ key: g + ':' + i, ex })).filter((it) => fits(it.ex));
    const local = group ? items(group) : [];
    const gen = items('general');
    const pool = local.length && (Math.random() < 0.6 || !gen.length) ? local : gen.length ? gen : local;
    return pickLRU(pool);
  }
  /** play one exchange between a and b (people-map entries or room residents); they stop and face each other */
  function playExchange(a, b, it, kind) {
    const both = [a, b];
    const restore = both.map((e) => ({ e, paused: e.paused, h: e.home?.h }));
    const ok = chatter.play(both.map((e) => ({ id: e.id, p: e.p })), it.ex.lines, () => {
      for (const r of restore) { r.e.paused = r.paused; if (r.e.home && r.h != null) r.e.home.h = r.h; }
      if (kind === 'small') nextSmall = chatter.now + rand(SMALL.gap[0], SMALL.gap[1]);
    }, kind);
    if (!ok) return false;
    markUsed(it.key);
    if (a.home && b.home) { // (outdoors: story.update turns them to home.h while Maya is not right beside them)
      const pa = a.p.root.position, pb = b.p.root.position;
      a.paused = b.paused = true;
      a.home.h = Math.atan2(pb.x - pa.x, pb.z - pa.z);
      b.home.h = Math.atan2(pa.x - pb.x, pa.z - pb.z);
    }
    return true;
  }

  // ---- outdoor small talk: two townsfolk within SMALL.apart of each other and SMALL.near of Maya
  let nextSmall = rand(SMALL.first[0], SMALL.first[1]);
  function smallPairs() {
    const mp = mayaXZ();
    const near = [];
    for (const e of story.people.values()) {
      if (!chatty(e)) continue;
      const p = e.p.root.position;
      const d = Math.hypot(p.x - mp.x, p.z - mp.z);
      // (one of the two may stand just past the screen's edge: its bubble is held at the edge, 30 px either way)
      if (d <= SMALL.near && onScreen(e.p, -30)) near.push({ e, d, on: onScreen(e.p) });
    }
    const out = [];
    for (let i = 0; i < near.length; i++) for (let j = i + 1; j < near.length; j++) {
      if (!near[i].on && !near[j].on) continue;
      const a = near[i].e.p.root.position, b = near[j].e.p.root.position;
      if (Math.hypot(a.x - b.x, a.z - b.z) <= SMALL.apart) out.push({ a: near[i].e, b: near[j].e, score: near[i].d + near[j].d });
    }
    return out.sort((x, y) => x.score - y.score);
  }
  function trySmall() {
    const pairs = smallPairs();
    if (!pairs.length) return false;
    const { a, b } = pairs[0];
    const mp = mayaXZ();
    const it = chooseExchange(districtAt(mp.x, mp.z), a, b);
    const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a]; // (either may start)
    return !!it && playExchange(x, y, it, 'small');
  }

  // ---- an everyday house: its residents (rooms/generic.js r.residents) talk now and then
  let roomId = null, nextRoom = 0;
  function residentsAwake() {
    const R = story.room;
    return (R?.residents || []).filter((r) => r?.p?.root && r.lie == null && r.job !== 'nap' && r.p.root.visible !== false);
  }
  function tryRoom() {
    const R = story.room;
    const res = residentsAwake();
    if (!res.length) return false;
    const group = R.district || R.talk?.group || null;
    if (res.length >= 2 && Math.random() < 0.55) {
      const [a, b] = res.slice().sort(() => Math.random() - 0.5);
      const it = chooseExchange(group, a, b);
      if (it && playExchange(a, b, it, 'house')) return true;
    }
    // one resident says one thing (the one nearest Maya, now and then the other)
    const mp = mayaXZ();
    const byD = res.map((r) => ({ r, d: r.p.root.getWorldPosition(w).distanceTo(mp) })).sort((x, y) => x.d - y.d);
    const sp = (byD.length > 1 && Math.random() < 0.3 ? byD[1] : byD[0]).r;
    const kind = R.kind || 'home';
    const lines = [...(HOUSE_LINES[kind] || HOUSE_LINES.home), ...HOUSE_LINES.any].filter(fitsNow)
      .map((l) => ({ key: 'house:' + (l.en || l.my), l }));
    const it = pickLRU(lines);
    if (!it) return false;
    if (!chatter.play([{ id: 'res:' + sp.id, p: sp.p }], [{ who: 0, my: it.l.my, en: it.l.en }], null, 'house')) return false;
    markUsed(it.key);
    return true;
  }

  // ---- ambient folk
  const folk = new Map(); // id -> entry (also in story.people)
  const townN = new Map(); // district -> town lines its folk could say (townLines)
  let areas = []; // [{ key, d, id, x, z, r, n }] areas whose lines ambient folk can say
  chatter.ready.then((lines) => {
    townN.clear(); // (counted again now every line file is in)
    for (const [d, t] of Object.entries(lines)) for (const [id, a] of Object.entries(t.areas || {})) {
      const n = (a.lines || []).filter((l) => l.job == null || [].concat(l.job).some((j) => FOLK_JOBS.has(String(j).toLowerCase()))).length;
      if (n >= 2 && a.at) areas.push({ key: d + ':' + id, d, id, x: a.at.x, z: a.at.z, r: a.at.r || 6, n });
    }
  });
  /** how many of a district's own town lines its ambient folk could say (cached per district) */
  function townLines(d) {
    if (!d) return 0;
    if (!townN.has(d)) {
      const t = chatter.lines?.[d];
      if (!t) return 0;
      townN.set(d, (t.town || []).filter((l) => l.job == null || [].concat(l.job).some((j) => FOLK_JOBS.has(String(j).toLowerCase()))).length
        + (t.pairs || []).filter((p) => (p.who || []).every((w) => w == null || w === '*' || FOLK_JOBS.has(String(w).toLowerCase()))).length);
    }
    return townN.get(d);
  }
  // where nobody may stand: every door, every region spot and desk (days use them), the region folk's own places
  const keepSpots = [];
  for (const m of REGION_FILES) {
    const add = (o) => { if (o && Number.isFinite(o.x) && Number.isFinite(o.z)) keepSpots.push(o); };
    for (const s of Object.values(m.SPOTS || {})) (Array.isArray(s) ? s : [s]).forEach(add);
    for (const d of [].concat(m.DESKS || [])) add(d);
  }
  for (const p of REGION_PEOPLE) { keepSpots.push(p); if (p.job?.spot) keepSpots.push(p.job.spot); }
  function freeAt(x, z, why = null) {
    const no = (k) => { if (why) why[k] = (why[k] || 0) + 1; return false; };
    const mp = mayaXZ();
    if (Math.hypot(x - mp.x, z - mp.z) < KEEP.maya) return no('maya');
    if (ow?.space && ow.space.collides(x, z, 0.5)) return no('solid');
    const rd = ow?.net?.nearest?.(x, z);
    if (rd && rd.dist < KEEP.road) return no('road');
    for (const d of Object.values(DOORS)) if (d && Math.hypot(x - d.x, z - d.z) < KEEP.door) return no('door');
    for (const s of keepSpots) if (Math.hypot(x - s.x, z - s.z) < KEEP.spot) return no('spot');
    for (const e of story.people.values()) {
      const p = e.p?.root?.position;
      if (p && Math.hypot(x - p.x, z - p.z) < (e.folk ? 1.2 : KEEP.person)) return no('person');
    }
    return true;
  }

  // ---- in view: a screen point to the ground, a person's whole height inside the frame, a free walk in from the side
  const ndc = new THREE.Vector3(), camPos = new THREE.Vector3(), camRight = new THREE.Vector3();
  function groundAt(sx, sy) {
    const cam = game.camera;
    if (!cam) return null;
    cam.getWorldPosition(camPos);
    ndc.set((sx / W()) * 2 - 1, 1 - (sy / H()) * 2, 0.5).unproject(cam);
    const dy = ndc.y - camPos.y;
    if (dy > -1e-3) return null; // (the horizon or above)
    const k = -camPos.y / dy;
    return { x: camPos.x + (ndc.x - camPos.x) * k, z: camPos.z + (ndc.z - camPos.z) * k };
  }
  const proj = (x, y, z) => { const q = game.rig?.project ? game.rig.project(w.set(x, y, z), W(), H()) : null; return q ? { x: q.x, y: q.y } : null; };
  // the HUD pieces inside the frame (the corner map, the round buttons): nobody stands behind them (read once per look)
  let hud = [];
  function readHud() {
    hud = [];
    const g = (document.getElementById('game') || document.body).getBoundingClientRect();
    for (const el of document.querySelectorAll('#story-minimap, button')) {
      if (el.hidden || el.offsetParent === null) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 4 && r.height > 4 && r.width < 280 && r.height < 280) hud.push({ x0: r.left - g.left - 10, y0: r.top - g.top - 10, x1: r.right - g.left + 10, y1: r.bottom - g.top + 10 });
    }
  }
  /** feet to bubble inside the frame: clear of the sides, the top HUD (the bubble sits above the head), the corner
   * map and the controls */
  function wholeInView(x, z) {
    const f = proj(x, 0.05, z), hd = proj(x, 2.0, z);
    if (!f || !hd) return false;
    const s = VIEW.side;
    if (!(f.x > s && f.x < W() - s && hd.x > s && hd.x < W() - s && hd.y > H() * VIEW.top - 12 && f.y < H() * (VIEW.bot + 0.04))) return false;
    const x0 = Math.min(f.x, hd.x) - 16, x1 = Math.max(f.x, hd.x) + 16, y0 = hd.y - 46, y1 = f.y; // (with the bubble's room)
    return !hud.some((r) => x0 < r.x1 && x1 > r.x0 && y0 < r.y1 && y1 > r.y0);
  }
  /** nothing of a person standing here is in the frame */
  function offFrame(x, z) {
    const f = proj(x, 0.05, z), hd = proj(x, 2.0, z);
    const out = (q) => !q || q.x < -28 || q.x > W() + 28 || q.y < -28 || q.y > H() + 28;
    return out(f) && out(hd);
  }
  /** a free straight walk to (x, z) from just past the nearer side edge of the frame (else the other): the start, or null */
  function walkInFrom(x, z) {
    const cam = game.camera;
    if (!cam || !ow?.space) return null;
    camRight.setFromMatrixColumn(cam.matrixWorld, 0); camRight.y = 0;
    if (camRight.lengthSq() < 1e-6) return null;
    camRight.normalize();
    const q = proj(x, 1, z);
    if (!q) return null;
    const first = q.x < W() / 2 ? -1 : 1;
    for (const s of [first, -first]) {
      const dx = camRight.x * s, dz = camRight.z * s;
      for (let L = 1; L <= VIEW.walkMax; L += 0.5) {
        const sx = x + dx * L, sz = z + dz * L;
        if (!offFrame(sx, sz)) continue;
        let ok = !ow.space.collides(sx, sz, 0.3);
        for (let t = 0.4; t < L && ok; t += 0.4) if (ow.space.collides(x + dx * t, z + dz * t, 0.3)) ok = false;
        if (ok) return { x: sx, z: sz };
        break; // (a wall that way: the other side)
      }
    }
    return null;
  }
  /** walk a just-made person from `from` to their home spot (a few steps), then stand there facing home.h */
  function walkIn(e, from) {
    const to = { x: e.home.x, z: e.home.z }, r = e.p.root;
    const speed = rand(VIEW.walk[0], VIEW.walk[1]);
    r.position.set(from.x, 0, from.z);
    r.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
    e.ob.x = from.x; e.ob.z = from.z;
    e.walkIn = to;
    e.ctl = (dt) => { // (story.update runs a person's ctl instead of its idle; the chatter leaves anyone with one alone)
      const dx = to.x - r.position.x, dz = to.z - r.position.z, d = Math.hypot(dx, dz);
      const sp = d < 0.6 ? Math.max(0.35, speed * d / 0.6) : speed; // (slows into the stop)
      if (d <= sp * dt + 0.01) {
        r.position.set(to.x, 0, to.z); e.ob.x = to.x; e.ob.z = to.z;
        e.ctl = null; e.walkIn = null;
        e.p.update(dt, { speed: 0 });
        return;
      }
      r.position.x += (dx / d) * sp * dt; r.position.z += (dz / d) * sp * dt;
      e.ob.x = r.position.x; e.ob.z = r.position.z;
      e.p.update(dt, { speed: sp });
    };
  }
  const isAmbient = (e) => !!(e?.p?.root && (e.folk || AMBIENT_IDS.has(e.id) || e.cast?.ambient));
  /** the townsfolk Maya can see now within small talk's reach (one walking in counts: it is coming) */
  function seenFolk(mp) {
    const out = [];
    for (const e of story.people.values()) {
      if (!isAmbient(e) || e.hidden || e.p.root.visible === false || !e.p.root.parent) continue;
      if (e.walkIn) { out.push(e); continue; }
      const p = e.p.root.position;
      if (Math.hypot(p.x - mp.x, p.z - mp.z) <= SMALL.near && onScreen(e.p, 0)) out.push(e);
    }
    return out;
  }
  /** a stand spot inside the frame for the folk of area `a` (near `by` when given): { x, z, from } or null.
   * from = where they walk in from (null: they are simply there, a jump just moved her or it is far up the street) */
  function viewSpot(a, mp, by = null, why = null) {
    const no = why ? (k) => { why[k] = (why[k] || 0) + 1; } : () => {};
    const cands = [];
    // (mostly up the street ahead of her, between the HUD and her head; now and then between her and the controls)
    const mq = proj(mp.x, 0, mp.z), my = mq ? Math.min(Math.max(mq.y, H() * 0.35), H() * 0.7) : H() * 0.55;
    const y0 = H() * (VIEW.top + 0.05), y1 = my - H() * 0.12, y2 = my + H() * 0.04, y3 = H() * VIEW.bot;
    for (let i = 0; i < VIEW.tries; i++) {
      let g;
      if (by) { const ang = Math.random() * Math.PI * 2, rr = rand(by.r0 || 1.4, by.r1 || 2); g = { x: by.x + Math.cos(ang) * rr, z: by.z + Math.sin(ang) * rr }; }
      else g = groundAt(rand(VIEW.side + 14, W() - VIEW.side - 14), i % 4 === 3 && y3 > y2 ? rand(y2, y3) : rand(y0, Math.max(y0 + 10, y1)));
      if (!g) { no('sky'); continue; }
      const d = Math.hypot(g.x - mp.x, g.z - mp.z);
      if (d < VIEW.near || d > VIEW.far) { no('dist'); continue; }
      if (districtAt(g.x, g.z) !== a.d && !(a.d === 'home' && bookDist(g.x, g.z) <= 0)) { no('district'); continue; }
      if (!wholeInView(g.x, g.z)) { no('frame'); continue; }
      // near enough to be heard (a line is said within ~7.5 m), in the area its lines belong to, else anywhere seen
      const inArea = a.town || Math.hypot(g.x - a.x, g.z - a.z) <= a.r + 4;
      cands.push({ x: g.x, z: g.z, d, s: Math.abs(d - 8) + (inArea ? 0 : 6) + Math.random() * 4 });
    }
    cands.sort((p, q) => p.s - q.s);
    for (const c of cands) {
      if (!freeAt(c.x, c.z, why)) continue;
      if (grace > 0) return { x: c.x, z: c.z, from: null };
      const from = walkInFrom(c.x, c.z);
      if (from) return { x: c.x, z: c.z, from };
      if (c.d > 20) return { x: c.x, z: c.z, from: null }; // (tiny, far up the street: no walk needed)
      no('walk');
    }
    return null;
  }
  function lookFor(R, district, slot) {
    const pick = (a) => a[Math.floor(R() * a.length)]; // (seeded: the same slot is the same person)
    const r = R();
    const age = r < 0.14 ? 'child' : r < 0.24 ? 'teen' : r < 0.44 ? 'elder' : 'adult';
    const woman = R() < 0.5;
    const look = { age, build: pick(['slim', 'mid', 'mid', 'wide']), skin: Math.floor(R() * 9), seed: Math.floor(R() * 1e5), extras: [] };
    if (woman) {
      look.hair = age === 'elder' ? 'bun' : pick(['bun', 'long', 'braid', 'bob', 'pony']);
      look.hairColor = age === 'elder' ? pick(['grey', 'white', 'salt']) : pick(['black', 'black', 'dark', 'brown']);
      look.top = age === 'child' ? pick(['tee', 'blouse']) : pick(['blouse', 'blouse', 'eingyi', 'tee']);
      look.bottom = age === 'child' && R() < 0.4 ? 'shorts' : 'htamein';
      if (age !== 'child' && R() < 0.45) look.extras.push('thanaka');
    } else {
      look.hair = age === 'elder' ? pick(['receding', 'short', 'bald']) : pick(['short', 'side', 'crew', 'parted', 'spiky']);
      look.hairColor = age === 'elder' ? pick(['grey', 'white', 'salt']) : pick(['black', 'dark', 'black']);
      look.top = age === 'child' ? 'tee' : pick(['shirt', 'tee', 'eingyi', 'vest', 'shirt']);
      look.bottom = age === 'child' ? pick(['shorts', 'longyi']) : 'longyi';
      if (look.bottom === 'longyi') look.check = R() < 0.45;
    }
    if (age === 'teen' && R() < 0.4) { look.top = 'school'; look.bottom = woman ? 'schoolSkirt' : 'schoolLongyi'; }
    if (age === 'elder' && R() < 0.5) look.extras.push('glasses');
    if (district === 'blank') { look.topColor = 'white'; look.bottomColor = pick(['grey', 'charcoal', 'cream']); }
    else { look.topColor = pick(CLOTHS); look.bottomColor = pick(['maroon', 'navy', 'teal', 'brown', 'plum', 'olive', 'charcoal', 'rose', 'mustard']); }
    const name = folkName({ district, age, woman, slot }); // (owner: a name of their own, never "Aunty"; one town only)
    return { look, name };
  }
  let folkSeq = 0;
  function spawnFolk(area, x, z, h) {
    const id = `folk:${area.key}:${folkSeq++}`;
    if (dayOwns(id)) return null;
    const slot = folkSlot(area.d); // one of the town's own walk-around people (same slot: same name, same look)
    const R = seeded(hashName(`${area.d}#${slot}`));
    const { look, name } = lookFor(R, area.d, slot);
    const roles = ROLES[area.d] || ROLES.home;
    const [ren, rmy] = look.age === 'child' ? ['kid', 'ကလေး'] : look.top === 'school' ? ['pupil', 'ကျောင်းသား'] : roles[Math.floor(R() * roles.length)];
    const p = createPerson(look);
    p.root.position.set(x, 0, z);
    p.root.rotation.y = h;
    p.root.userData.isPerson = true;
    game.world.scene.add(p.root);
    const cast = { id, name, role: { en: ren, my: rmy }, look, ambient: true, hello: pick(HELLOS.filter(fitsNow)) };
    const e = { id, cast, name, p, home: { x, z, h }, ob: { type: 'circle', x, z, r: p.radius || 0.3, person: id }, onTalk: null, walking: null, folk: area.key, town: area.d, slot };
    e.onTalk = async () => {
      const hello = pick(HELLOS.filter(fitsNow));
      await story.dialog.say(id, hello, { face: 'smile' });
    };
    story.people.set(id, e);
    folk.set(id, e);
    return e;
  }
  function dropFolk(id) {
    const e = folk.get(id);
    if (!e || story.talkWith === e) return; // (never mid-talk: it goes on a later pass)
    folk.delete(id);
    releaseFolkSlot(e.town, e.slot);
    if (story.people.get(id) === e) story.people.delete(id);
    e.p.root.removeFromParent();
    e.p.dispose?.();
  }
  const cap = () => (low ? MAX_FOLK_LOW : MAX_FOLK);
  const callsNow = () => game.renderer?.info?.render?.calls || 0;
  let spawnT = 1.5, overT = 0, grace = 5, lastMp = null, stillT = 0, lastMp0 = null, lastD = null;
  const camDir = new THREE.Vector3();
  const stats = { spawned: {}, dropped: 0, peak: 0, callsAtSpawn: [] };
  function tickFolk(dt) {
    spawnT -= dt;
    if (spawnT > 0) return;
    spawnT = 0.5;
    // inside a room, or a day that wants the streets to itself: nobody
    if (story.inRoom || game.mode !== 'world' || dayOwns('ambientFolk')) { for (const id of [...folk.keys()]) dropFolk(id); return; }
    const mp = mayaXZ();
    // (just loaded, or a jump / a page turn moved her: the street is new to her eyes, so folk may appear in view)
    if (lastMp && Math.hypot(mp.x - lastMp.x, mp.z - lastMp.z) > 12) grace = 3;
    lastMp = { x: mp.x, z: mp.z };
    grace -= 0.5;
    // go: far away, or the frame is over its budget (the farthest one out of sight first)
    const calls = callsNow();
    overT = calls > CALL_DROP ? overT + 0.5 : 0;
    for (const [id, e] of folk) {
      const p = e.p.root.position;
      const d = Math.hypot(p.x - mp.x, p.z - mp.z);
      if (d > DROP_ALWAYS || (d > DROP_FAR && !onScreen(e.p, -60)) || dayOwns(id) || dayOwns('folk:' + e.folk)) { dropFolk(id); stats.dropped++; }
    }
    if (overT > 2 && folk.size) {
      const far = [...folk.values()].filter((e) => !onScreen(e.p, -60)).sort((a, b) => b.p.root.position.distanceTo(mp) - a.p.root.position.distanceTo(mp))[0];
      if (far) { dropFolk(far.id); stats.dropped++; overT = 0; }
    }
    stillT = lastMp0 && Math.hypot(mp.x - lastMp0.x, mp.z - lastMp0.z) < 0.3 ? stillT + 0.5 : 0;
    lastMp0 = { x: mp.x, z: mp.z };
    // a new town: its first small talk comes as soon as on a fresh load (not the last town's long quiet gap)
    const dNow = districtAt(mp.x, mp.z);
    if (dNow !== lastD) { lastD = dNow; if (dNow && Number.isFinite(nextSmall)) nextSmall = Math.min(nextSmall, chatter.now + rand(SMALL.first[0], SMALL.first[1])); }
    for (const e of folk.values()) e.offT = e.walkIn || onScreen(e.p, -60) ? 0 : (e.offT || 0) + 0.5; // (how long out of sight)
    if (calls > CALL_CAP || blockedNow() || story.talking) return;
    // ---- in view first: fewer than two townsfolk in sight (within small talk's reach)? two more walk into the frame
    const seen = seenFolk(mp);
    if (seen.length >= PER_AREA || tryInView(mp, seen)) return; // (two in sight: nobody more, here or round the corner)
    if (folk.size >= cap()) return;
    // come: the nearest area with lines and nobody to say them
    let best = null, bd = Infinity;
    for (const a of areas) {
      const d = Math.hypot(a.x - mp.x, a.z - mp.z) - a.r;
      if (d > SPAWN_NEAR || d >= bd || dayOwns('folk:' + a.key)) continue;
      let have = 0;
      for (const e of story.people.values()) {
        if (!e?.p?.root || !(e.folk || AMBIENT_IDS.has(e.id) || e.cast?.ambient)) continue;
        const p = e.p.root.position;
        if (Math.hypot(p.x - a.x, p.z - a.z) <= a.r + 3) have++;
      }
      if (have >= PER_AREA) continue;
      best = { a, need: PER_AREA - have }; bd = d;
    }
    // no area near with nobody in it: the town itself (its own lines need someone to say them too; the market
    // square and the wharf are mostly street, not areas). A pair a street's width or two off, never on top of her.
    if (!best) {
      const d = districtAt(mp.x, mp.z);
      const n = townLines(d) + (SMALLTALK[d]?.length || 0) + (SMALLTALK.general?.length || 0); // (a pair of them makes small talk too)
      if (!d || n < 3 || dayOwns('folk:' + d + ':town')) return;
      let have = 0;
      for (const e of story.people.values()) {
        const p = e?.p?.root?.position;
        if (p && (e.folk || AMBIENT_IDS.has(e.id) || e.cast?.ambient) && Math.hypot(p.x - mp.x, p.z - mp.z) <= TOWN_FAR[1] + 4) have++;
      }
      if (have >= PER_AREA) return;
      best = { a: { key: d + ':town', d, id: 'town', x: mp.x, z: mp.z, r: TOWN_R, n, town: true }, need: PER_AREA - have };
    }
    const { a, need } = best;
    // a spot in the area (a big one: the part nearest her), off screen if there is one
    const R = a.town ? TOWN_R : Math.min(a.r, 12);
    let cx = a.x, cz = a.z;
    if (a.r > 12) { const k = Math.min(1, (Math.hypot(mp.x - a.x, mp.z - a.z)) / a.r); cx = a.x + (mp.x - a.x) * k * 0.7; cz = a.z + (mp.z - a.z) * k * 0.7; }
    let spot = null, spotOn = null, camAng = null;
    if (a.town && game.camera) { game.camera.getWorldDirection(camDir); if (Math.hypot(camDir.x, camDir.z) > 0.2) camAng = Math.atan2(camDir.z, camDir.x); }
    for (let i = 0; i < 28 && !spot; i++) {
      const far = a.town && i < 18 && camAng != null; // (up the street in view: far enough not to pop up)
      const ang = far ? camAng + rand(-0.3, 0.3) : Math.random() * Math.PI * 2; // (a portrait phone sees only ~±0.2 rad that far up)
      const rr = far ? rand(TOWN_FAR[0], TOWN_FAR[1]) : a.town ? rand(TOWN_MIN, R) : R * Math.sqrt(rand(0.06, 0.9));
      const x = cx + Math.cos(ang) * rr, z = cz + Math.sin(ang) * rr;
      if (districtAt(x, z) !== a.d && !(a.d === 'home' && bookDist(x, z) <= 0)) continue;
      if (!freeAt(x, z)) continue;
      if (far) { if (!inView(x, z)) continue; spot = { x, z }; break; } // (really in the frame: small talk reaches a pair it can see)
      if (ptOnScreen(x, z)) { spotOn ||= { x, z }; continue; }
      spot = { x, z };
    }
    // (on screen only while she is not looking at it yet: a person never pops up in front of her)
    if (!spot && spotOn && (grace > 0 || Math.hypot(spotOn.x - mp.x, spotOn.z - mp.z) > 22)) spot = spotOn;
    if (!spot) { stats.miss = (stats.miss || 0) + 1; return; }
    const h0 = Math.atan2(mp.x - spot.x, mp.z - spot.z) + rand(-1.2, 1.2);
    const e1 = spawnFolk(a, spot.x, spot.z, h0);
    if (!e1) return;
    stats.spawned[a.d] = (stats.spawned[a.d] || 0) + 1;
    stats.callsAtSpawn.push(calls);
    if (stats.callsAtSpawn.length > 20) stats.callsAtSpawn.shift();
    // a second one, chatting with the first
    if (need >= 2 && folk.size < cap()) {
      for (let i = 0; i < 10; i++) {
        const ang = Math.random() * Math.PI * 2, rr = rand(1.3, 1.9);
        const x = spot.x + Math.cos(ang) * rr, z = spot.z + Math.sin(ang) * rr;
        if (districtAt(x, z) !== a.d && !(a.d === 'home' && bookDist(x, z) <= 0)) continue;
        if (!freeAt(x, z)) continue;
        const e2 = spawnFolk(a, x, z, Math.atan2(spot.x - x, spot.z - z));
        if (e2) {
          e1.home.h = Math.atan2(x - spot.x, z - spot.z);
          e1.p.root.rotation.y = e1.home.h;
          stats.spawned[a.d]++;
        }
        break;
      }
    }
    stats.peak = Math.max(stats.peak, folk.size);
  }
  /** the area (or the town) Maya stands by, for in-view folk: { key, d, id, x, z, r, town? } or null */
  function hereArea(mp) {
    let best = null, bd = Infinity;
    for (const a of areas) {
      const d = Math.hypot(a.x - mp.x, a.z - mp.z) - a.r;
      if (d > SPAWN_NEAR * 0.5 || d >= bd || dayOwns('folk:' + a.key)) continue;
      let mine = 0;
      for (const e of folk.values()) if (e.folk === a.key) mine++;
      if (mine >= PER_AREA) continue; // (at most two per area)
      best = a; bd = d;
    }
    if (best) return best;
    const d = districtAt(mp.x, mp.z);
    const n = townLines(d) + (SMALLTALK[d]?.length || 0) + (SMALLTALK.general?.length || 0);
    if (!d || n < 3 || dayOwns('folk:' + d + ':town')) return null;
    return { key: d + ':town', d, id: 'town', x: mp.x, z: mp.z, r: TOWN_R, n, town: true };
  }
  /** fewer than two townsfolk in sight: one or two walk into the frame (a pair with the one already there, else a
   * pair of their own). Makes room by letting go of a folk out of sight for a while. true = someone came. */
  function tryInView(mp, seen) {
    const a = hereArea(mp);
    if (!a) return false;
    readHud();
    let need = PER_AREA - seen.length;
    // room: the cap stays; one out of sight for VIEW.offFor s goes (farthest first) so one in sight can come
    while (folk.size + need > cap() && stillT >= 2) { // (only while she stands: no coming and going as she walks)
      const out = [...folk.values()].filter((e) => !seen.includes(e) && (e.offT || 0) >= VIEW.offFor && story.talkWith !== e)
        .sort((p, q) => q.p.root.position.distanceTo(mp) - p.p.root.position.distanceTo(mp))[0];
      if (!out) break;
      dropFolk(out.id); stats.dropped++; stats.recycled = (stats.recycled || 0) + 1;
    }
    need = Math.min(need, cap() - folk.size, Math.floor((CALL_DROP - callsNow()) / 4)); // (never over the frame's budget: ~4 calls a person)
    if (need <= 0) return false;
    // one already in sight and standing: the new one comes to stand with them (a pair makes small talk)
    // (beside one of the folk: a step or two; beside a townsperson of the district: past the 2.8 m they keep clear)
    const l0 = seen.length === 1 && !seen[0].walkIn && !seen[0].walking && !seen[0].ctl ? seen[0] : null;
    const lone = l0 ? { x: l0.p.root.position.x, z: l0.p.root.position.z, r0: l0.folk ? 1.4 : 3, r1: l0.folk ? 2 : 3.8 } : null;
    const s1 = (lone && viewSpot(a, mp, lone)) || viewSpot(a, mp);
    if (!s1) { stats.viewMiss = (stats.viewMiss || 0) + 1; spawnT = 1.5; return false; }
    const h1 = Math.atan2(mp.x - s1.x, mp.z - s1.z) + rand(-1.2, 1.2);
    const e1 = spawnFolk(a, s1.x, s1.z, h1);
    if (!e1) return false;
    if (s1.from) walkIn(e1, s1.from);
    stats.spawned[a.d] = (stats.spawned[a.d] || 0) + 1;
    stats.inView = (stats.inView || 0) + 1;
    stats.callsAtSpawn.push(callsNow());
    if (stats.callsAtSpawn.length > 20) stats.callsAtSpawn.shift();
    const face = (e, at) => { e.home.h = Math.atan2(at.x - e.home.x, at.z - e.home.z); if (!e.walkIn) e.p.root.rotation.y = e.home.h; };
    if (lone) face(e1, lone);
    else if (need >= 2 && folk.size < cap()) {
      const s2 = viewSpot(a, mp, s1);
      const e2 = s2 && spawnFolk(a, s2.x, s2.z, 0);
      if (e2) {
        if (s2.from) walkIn(e2, s2.from);
        face(e2, s1); face(e1, s2);
        stats.spawned[a.d]++; stats.inView++;
      }
    }
    stats.peak = Math.max(stats.peak, folk.size);
    spawnT = 2; // (let them walk in before looking again)
    return true;
  }

  // ---- every frame (story.ticks: story.update runs them after the day's own update)
  let nowT = 0;
  story.ticks = story.ticks || [];
  story.ticks.push((dt) => {
    if (!dt || !game.maya?.root) return;
    nowT += dt;
    try { tickFolk(dt); } catch (e) { console.error('chatter folk', e); }
    chatter.update(dt);
    if (blockedNow() || chatter.busy) return;
    const t = chatter.now;
    if (story.inRoom) {
      if (roomId !== story.inRoom) { roomId = story.inRoom; nextRoom = t + rand(ROOMT.first[0], ROOMT.first[1]); }
      if (story.room?.residents?.length && t >= nextRoom) {
        nextRoom = t + (tryRoom() ? rand(ROOMT.gap[0], ROOMT.gap[1]) : 3);
      }
      return;
    }
    roomId = null;
    if (t >= nextSmall) { if (!trySmall()) nextSmall = t + SMALL.retry; else nextSmall = Infinity; } // (set again when it ends)
  });

  story.chatterExtras = {
    folk,
    get areas() { return areas; },
    stats,
    debug: {
      /** small talk now (outdoors: the nearest pair; in a house: its residents) */
      small() { return story.inRoom ? tryRoom() : trySmall(); },
      pairs: () => smallPairs().map((p) => p.a.id + '+' + p.b.id),
      next: () => ({ small: +(nextSmall - chatter.now).toFixed(1), room: +(nextRoom - chatter.now).toFixed(1) }),
      spawnNow() { spawnT = 0; tickFolk(0.01); return folk.size; },
      /** every ambient folk gone (testing a fresh arrival) */
      clear() { for (const id of [...folk.keys()]) dropFolk(id); return folk.size; },
      /** why no spot in view would do right now: { reason: count } (and the spot, if one would) */
      viewWhy() { const mp = mayaXZ(), a = hereArea(mp); if (!a) return { area: null }; readHud(); const why = {}; const s = viewSpot(a, mp, null, why); return { area: a.key, spot: s && { x: +s.x.toFixed(1), z: +s.z.toFixed(1), walk: !!s.from }, why, seen: seenFolk(mp).map((e) => e.id) }; },
    },
  };
  return chatter;
}
