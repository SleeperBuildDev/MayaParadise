// Town chatter: the townsfolk talk among themselves and to the air as Maya passes. Small speech bubbles
// above the speaker only (never a pointer at a door), overheard two-person exchanges, lines tied to an
// area or a room, and Maya's own thought when she arrives in a district. Pure ambience: it never gives
// directions, never blocks a tap, and keeps quiet whenever anything else is happening.
//
//   const chatter = createChatter(game, story)
//   chatter.update(dt)                 every frame (story.update calls it; see WIRING below)
//   chatter.pause(on)                  hold everything (a scene that is not covered by the checks below)
//   chatter.onArrive(districtId, first)   Maya's arrival thought (the town-intro module calls this)
//   chatter.lines                      the merged line tables (read-only use)
//   chatter.ready                      Promise: the line files are loaded
//   chatter.addLines(table)            merge more lines in (the dev page's samples)
//   chatter.districtAt(x, z)           'home' | 'exercise' | 'envelope' | 'market' | ... | null
//   chatter.district                   the district Maya is in now (a room counts as its district)
//   chatter.autoArrive = true          let the built-in district detector call onArrive itself (default:
//                                      on only with ?chatter=1; the town intro owns arrivals in the game)
//   chatter.log                        what was said this visit [{ t, kind, who, my, en }]
//   chatter.debug                      { state(), say(opts), pair(opts), fast(on), force(opts) }  (dev/chatter.html)
//
// LINE FILES: js/story/chatter/lines-A.js, lines-B.js, lines-C.js (any may be missing). Each exports
// `default` (or `LINES` / `CHATTER`), or one export per district named by its id. The shape:
//   { [districtId]: {
//       town:  [line, ...],                         anyone of the district's townsfolk, outdoors
//       areas: { [areaId]: { at: { x, z, r }, lines: [line, ...] } },   while Maya is inside the circle
//       rooms: { [roomId]: [line, ...] },           while story.inRoom === roomId (room cast and walk-ons)
//       pairs: [{ who: [jobA, jobB], lines: [line, ...], when?: tags, id? }],   overheard exchanges
//       arrive: { first: line, again?: [line, ...] },   Maya's thought on arriving
//   } }
//   line = { my, en, job?, by?, from?, to?, days?, flag?, notFlag?, weather?, id? }
//     from / to      first / last day (save.day, inclusive)       days   [12] only on these days
//     flag           'creaseMended' | '!bridgeOpen' | ['a', '!b']  (all must hold; '!' = must be off)
//     notFlag/unless a flag (or list) that must be off             weather  'rain' (save.weather)
//     area           only while Maya stands in that area (an `areas` id of any district; arrive.again too)
//     job            who may say it (an array = any of them): a person id ('kozaw'); a room walk-on key ('diner',
//                    'customer'); a kind of person, worked out from cast.js (role, age, clothes): kid, child,
//                    teen, adult, elder, aunty, uncle, worker, vendor, baker, weaver, gardener, carter, porter,
//                    potter, teacher, pupil, keeper, traveller, customer, diner, buyer, guest, visitor, fisher;
//                    any other word is looked for in their cast role ('tea', 'sweeps'); 'maya' = her own thought;
//                    '*' = the same as no job (outdoors: the district's ambient folk only).
//                    Nobody says a line that names them (their own name in the line).
//                    A line WITHOUT job is said by the district's ambient folk (region PEOPLE, cast `ambient`)
//                    or, indoors, by anyone in the room. Story cast (cast.js people that are neither `ambient`
//                    nor district townsfolk) only say lines whose `job` lists their own id.
//     age            'child' | 'teen' | 'adult' | 'elder' (or an array): only people of that age say it (cast look.age)
//     by             in a pair: 0 / 1 (or 'a' / 'b'), which of the two says it (default: they alternate);
//                    'maya' anywhere: Maya thinks it herself (her own bubble)
//   Pairs' `when` takes the same tags plus room: 'bakery' (only inside it) or at: { x, z, r }; a pair's
//   `age: [ageA, ageB]` (each a string or a list) narrows who the two speakers can be.
//
// WIRING (story.js, later): after `story.talk = createTalk(...)`:
//   import('./chatter/index.js').then(({ createChatter }) => { story.chatter = createChatter(game, story); });
// and in story.update, after `story.day?.update?.(dt, t)`:  story.chatter?.update(dt);
// The town-intro module calls story.chatter?.onArrive(districtId, first) when its intro ends, and may set
// story.townIntro = true while it runs (or call chatter.pause(true/false)).
import * as THREE from '../../game/three.js';
import { tr } from '../../game/ui.js';
import { castById, CAST } from '../cast.js';
import { regionAt, bookDist, PEOPLE as REGION_PEOPLE } from '../world/region.js';

const FILES = ['./lines-A.js', './lines-B.js', './lines-C.js'];
// District townsfolk in cast.js's own shape ({ id, name, role, look }), kept beside the region files until cast.js
// lists them. Read here only for their age, clothes and role (a line's `job` kind), and to tell them from story cast.
const FOLK_FILES = ['hearth-folk.js', 'garden-folk.js', 'garden-town-folk.js', 'market-townfolk.js', 'wharf-folk.js', 'junction-people.js', 'blank-folk.js'];
const FOLK = new Map();
const folkReady = Promise.all(FOLK_FILES.map((f) => import(`../world/regions/${f}`).then((m) => {
  for (const v of Object.values(m)) if (Array.isArray(v)) for (const c of v) if (c && c.id && c.look && c.role) FOLK.set(c.id, c);
}).catch(() => null)));
const STORE = 'rc-chatter-v1';
const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('my', { granularity: 'grapheme' }) : null;
const glen = (s) => (segmenter ? Array.from(segmenter.segment(s)).length : Array.from(s).length);
const rand = (a, b) => a + Math.random() * (b - a);
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];

// tuning (metres, seconds)
const T = {
  gap: [6, 10], // quiet time after a bubble (or a whole exchange) before the next one
  near: 7.5, carNear: 9, // how close a speaker must be to Maya (5 m was too close: whole squares stayed silent)
  chance: 0.4, // per scan, once the gap has passed: "occasionally", not the moment she walks up
  scan: 0.4,
  pairApart: 4.5, // the two of an exchange stand this close together
  pairHold: 2, // Maya stays near them this long before they start
  pairStill: 0.7, // ...moving slower than this (m/s)
  fastCar: 3.5, // driving faster than this: nothing new starts
  slowCarLen: 26, // driving slowly past: only lines up to this many letters (graphemes)
  pairStep: 0.3, // pause between two bubbles of an exchange
};

export function createChatter(game, story) {
  injectStyle();
  const gameEl = document.getElementById('game') || document.body;
  const params = new URLSearchParams(location.search);
  const save = story.save || { day: 1, flags: {} };
  const AMBIENT_IDS = new Set(REGION_PEOPLE.map((p) => p.id));

  // ---- the lines
  const lines = {};
  const ready = Promise.all([folkReady, ...FILES.map((f) => import(f).then((m) => addModule(m)).catch(() => null))]).then(() => lines);

  function addModule(m) {
    const t = m.default || m.LINES || m.CHATTER;
    if (t && typeof t === 'object') return addLines(t);
    const isDistrict = (v) => v && typeof v === 'object' && !Array.isArray(v) && (v.town || v.areas || v.rooms || v.pairs || v.arrive);
    const per = {};
    for (const [k, v] of Object.entries(m)) {
      if (isDistrict(v)) per[k] = v;
      else if (v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).some(isDistrict)) addLines(v); // export const LINES_C = { hearth, ... }
    }
    addLines(per);
  }
  function addLines(table) {
    for (const [d, src] of Object.entries(table || {})) {
      if (!src || typeof src !== 'object') continue;
      const dst = (lines[d] ||= { town: [], areas: {}, rooms: {}, pairs: [], arrive: null });
      if (Array.isArray(src.town)) dst.town.push(...src.town.filter(valid));
      for (const [id, a] of Object.entries(src.areas || {})) {
        if (!a || !a.at) continue;
        const da = (dst.areas[id] ||= { at: a.at, lines: [] });
        da.lines.push(...(a.lines || []).filter(valid));
      }
      for (const [id, l] of Object.entries(src.rooms || {})) (dst.rooms[id] ||= []).push(...(l || []).filter(valid));
      if (Array.isArray(src.pairs)) dst.pairs.push(...src.pairs.filter((p) => p && Array.isArray(p.who) && Array.isArray(p.lines) && p.lines.some(valid)));
      if (src.arrive) {
        const a = (dst.arrive ||= { first: null, again: [] });
        if (src.arrive.first && !a.first) a.first = src.arrive.first;
        if (Array.isArray(src.arrive.again)) a.again.push(...src.arrive.again.filter(valid));
      }
    }
    return lines;
  }
  function valid(l) { return l && typeof l === 'object' && (typeof l.my === 'string' || typeof l.en === 'string'); }

  // ---- day / flag filters (save.day, save.flags)
  function flagOn(f) {
    const neg = f[0] === '!';
    const v = !!save.flags?.[neg ? f.slice(1) : f];
    return neg ? !v : v;
  }
  function ok(l) {
    if (!l) return false;
    const day = save.day || 1;
    if (l.from != null && day < l.from) return false;
    if (l.to != null && day > l.to) return false;
    if (Array.isArray(l.days) && !l.days.includes(day)) return false;
    if (l.flag) for (const f of [].concat(l.flag)) if (!flagOn(f)) return false;
    for (const k of ['notFlag', 'unless']) if (l[k]) for (const f of [].concat(l[k])) if (save.flags?.[f]) return false;
    if (l.area && !hereAreas.has(l.area)) return false;
    // Day 12 turns 'rain' into 'drizzle' once chapter 20 is done: a rain line still fits the drizzle
    if (l.weather && !((save.weather || null) === l.weather || (l.weather === 'rain' && save.weather === 'drizzle'))) return false;
    return true;
  }

  let hereAreas = new Set(); // area ids Maya stands in (a line's `area` tag)

  // ---- what was said (per save: the save's `created` stamp)
  let mem = { created: save.created, seq: 0, used: {}, seen: {} };
  try {
    const m = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (m && m.created === save.created) mem = { ...mem, ...m };
  } catch { /* private mode: in memory only */ }
  const remember = () => { try { localStorage.setItem(STORE, JSON.stringify(mem)); } catch { /* ignore */ } };
  const keyOf = (scope, l) => scope + ':' + (l.id || l.my || l.en);
  function markUsed(key) { mem.used[key] = ++mem.seq; remember(); }
  /** Least-recently-used pick: every unused one first; once all are used, one of the oldest quarter. */
  /** (in the game) not a line or exchange said in the last RECENT picks: with few speakers around, the same one
   * would otherwise come back every quiet gap (Maya's one area thought, every ten seconds) */
  const RECENT = 12;
  const notRecent = (items) => items.filter((it) => !(mem.used[it.key] && mem.seq - mem.used[it.key] < RECENT));
  function pickLRU(items) {
    if (!items.length) return null;
    const unused = items.filter((it) => !mem.used[it.key]);
    if (unused.length) return pickOne(unused);
    const sorted = items.slice().sort((a, b) => mem.used[a.key] - mem.used[b.key]);
    return pickOne(sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.25))));
  }

  // ---- where she is
  const v = new THREE.Vector3(), mv = new THREE.Vector3();
  function roomDistrict(roomId) {
    if (!roomId) return null;
    for (const [d, t] of Object.entries(lines)) if (t.rooms[roomId]) return d;
    if (lines[roomId]) return roomId; // a district keyed by the room (the back cover)
    return null;
  }
  function districtAt(x, z) {
    if (bookDist(x, z) <= 0) return 'home';
    return regionAt(x, z)?.id || null;
  }
  function mayaPos() { return game.maya.root.getWorldPosition(mv); }
  function currentDistrict() {
    if (story.inRoom) return roomDistrict(story.inRoom);
    const p = mayaPos();
    return districtAt(p.x, p.z);
  }

  // ---- who could speak
  const WORDS = [
    ['vendor', /stall|shop|sells|seller|vendor|keeper|counter|cook|grinds|trader|cart aunty|colourer/],
    ['baker', /bak/], ['weaver', /weav|loom/], ['gardener', /garden/], ['carter', /cart|porter|parcel/], ['porter', /porter/],
    ['potter', /\bpot|kiln|clay/], ['teacher', /teacher|master/], ['pupil', /pupil|class|school|student/], ['keeper', /keeper|owner/],
    ['traveller', /travell/], ['guest', /travell|guest/], ['customer', /customer|regular/], ['diner', /customer|regular|diner/],
    ['buyer', /customer|buyer/], ['fisher', /fish|raft|reed|boat|net\b/],
  ];
  const tagCache = new Map();
  /** The kinds of person someone is (cast role, age, clothes; a walk-on's key): a Set of words. */
  function tagsOf(sp) {
    const look0 = sp.walkon ? roomLooks.get(story.inRoom)?.[sp.who] : null;
    const ck = sp.id + '|' + (sp.who || '') + (sp.walkon ? '|' + story.inRoom + (look0 ? '+' : '') : '');
    if (tagCache.has(ck)) return tagCache.get(ck);
    const t = new Set();
    if (sp.walkon) {
      const w = String(sp.who || '').toLowerCase();
      t.add(w); t.add(w.replace(/\d+$/, '')); t.add('visitor');
      for (const [word] of WORDS) if (w.includes(word)) t.add(word);
      for (const word of ['aunty', 'uncle', 'kid', 'child', 'teen', 'elder']) if (w.includes(word)) t.add(word);
      if (t.has('customer')) t.add('buyer');
      if (t.has('kid') || t.has('child')) { t.add('kid'); t.add('child'); }
    }
    if (!sp.walkon || look0) {
      const c = sp.cast || {}, look = look0 || c.look || {}, role = (c.role?.en || '').toLowerCase();
      const age = look.age || 'adult';
      t.add(age);
      if (age === 'child') { t.add('kid'); t.add('child'); }
      const female = /htamein|skirt/i.test(look.bottom || '') || /aunty|grandmother|girl|woman|mother/.test(role);
      const male = !female && (/longyi|trousers|shorts/i.test(look.bottom || '') || /\bboy|uncle|\bman\b/.test(role));
      if (age === 'adult' || age === 'elder') { if (female) t.add('aunty'); if (male) t.add('uncle'); }
      if (look.top === 'school') t.add('pupil');
      for (const [word, re] of WORDS) if (re.test(role)) t.add(word);
      if (age !== 'child' && !t.has('pupil') && !sp.walkon) t.add('worker');
    }
    tagCache.set(ck, t);
    return t;
  }
  // A room's walk-on looks (age, clothes) live in its rooms/*.js file (LOOKS / WALKONS): read once per room. The file
  // doors.js built the room from is already loaded, so this costs nothing but a lookup.
  const ROOM_FILES = ['hearth', 'garden', 'junction', 'market', 'quarter', 'wharf'];
  const roomLooks = new Map();
  async function loadRoomLooks(roomId) {
    if (roomLooks.has(roomId)) return;
    roomLooks.set(roomId, null);
    const d = roomDistrict(roomId);
    const order = [...new Set([d === 'exercise' ? 'quarter' : d, ...ROOM_FILES])].filter((f) => ROOM_FILES.includes(f));
    for (const f of order) {
      const m = await import(`../rooms/${f}.js`).catch(() => null);
      if (m?.ROOMS?.[roomId]) { roomLooks.set(roomId, { ...(m.LOOKS || {}), ...(m.WALKON_LOOKS || {}), ...(m.WALKONS || {}) }); return; }
    }
  }
  // Outdoors a `job` can only be a cast id or a kind of person (walk-on keys live in rooms). A townsperson id that
  // cast.js does not list yet (so nobody of that id can be standing there) falls back to the district's ambient
  // folk, so the line is not lost; once cast.js lists them, only they say it.
  const KINDS = new Set(['kid', 'child', 'teen', 'adult', 'elder', 'aunty', 'uncle', 'worker', 'visitor', ...WORDS.map((w) => w[0])]);
  const knownJob = new Map();
  folkReady.then(() => { knownJob.clear(); tagCache.clear(); }); // anything worked out before the folk files came in
  function outdoorJob(job) {
    if (job == null || job === '*') return job;
    const list = [].concat(job);
    const kept = list.filter((j) => {
      if (!knownJob.has(j)) knownJob.set(j, KINDS.has(String(j).toLowerCase()) || !!castById(j) || FOLK.has(j) || [...FOLK.values()].some((c) => (c.role?.en || '').toLowerCase().includes(String(j).toLowerCase())) || CAST.some((c) => (c.role?.en || '').toLowerCase().includes(String(j).toLowerCase())) || !/^[a-z0-9]+$/i.test(String(j)) || /\s/.test(String(j)));
      return knownJob.get(j);
    });
    return kept.length ? kept : null;
  }
  function namesSelf(sp, l) {
    const n = sp.cast?.name;
    if (!n) return false;
    return !!((n.en && l.en && l.en.includes(n.en)) || (n.my && l.my && l.my.includes(n.my)));
  }
  // Story cast (cast.js people who are neither `ambient` nor district townsfolk) keep to their scripts: they only say
  // a line whose `job` names their own id, never a kind-of-person line or a jobless one (the baker would otherwise
  // gossip about her own shouting, Ei Mon about her own covered cloth).
  const isStory = (sp) => !sp.walkon && !!castById(sp.id) && !castById(sp.id).ambient && !FOLK.has(sp.id);
  const castOf = (id) => castById(id) || FOLK.get(id) || null;
  function jobMatch(sp, job) {
    if (job == null || job === '*') return !isStory(sp);
    if (isStory(sp)) return [].concat(job).includes(sp.id);
    const tags = tagsOf(sp);
    for (const j of [].concat(job)) {
      const k = String(j).toLowerCase();
      if (sp.id === j || sp.who === j || tags.has(k)) return true;
      const role = sp.cast?.role;
      if (role && ((role.en && role.en.toLowerCase().includes(k)) || (role.my && role.my.includes(j)))) return true;
      const nm = sp.cast?.name || sp.name;
      if (nm && typeof nm === 'object' && nm.en && nm.en.toLowerCase() === k) return true;
    }
    return false;
  }
  function canSayJobless(sp) {
    if (isStory(sp)) return false;
    if (sp.indoor || sp.walkon) return true;
    return AMBIENT_IDS.has(sp.id) || !!sp.cast?.ambient || !castById(sp.id);
  }
  function ageOK(sp, age) {
    if (!age) return true;
    if (sp.walkon) { const t = tagsOf(sp); return [].concat(age).some((a) => t.has(a) || (a === 'adult' && !t.has('kid') && !t.has('teen') && !t.has('elder'))); }
    const a = sp.cast?.look?.age || 'adult';
    return [].concat(age).includes(a);
  }
  function headOf(p, out) {
    p.root.getWorldPosition(out);
    out.y += (p.height || 1.3) + 0.32;
    return out;
  }
  const W = () => game.viewW || window.innerWidth, H = () => game.viewH || window.innerHeight;
  function onScreen(p) {
    const q = game.rig?.project ? game.rig.project(headOf(p, v), W(), H()) : null;
    return !!q && q.x > 10 && q.x < W() - 10 && q.y > 40 && q.y < H() - 60;
  }
  /** Everyone near Maya who could say something: [{ id, who, cast, p, d, indoor, walkon }] by distance. */
  function speakersNear(range) {
    const mp = mayaPos(), mx = mp.x, mz = mp.z;
    const out = [];
    for (const e of story.people.values()) {
      if (!e?.p?.root || e === story.talkWith || e.ctl || e.walking || e.paused || e.hidden) continue;
      if (e.p.root.visible === false) continue;
      const pp = e.p.root.getWorldPosition(v);
      const d = Math.hypot(pp.x - mx, pp.z - mz);
      if (d > range) continue;
      out.push({ id: e.id, who: null, cast: e.cast || castOf(e.id), name: e.name, p: e.p, d, indoor: !!e.indoor, walkon: false });
    }
    if (story.inRoom) {
      let ws = [];
      try { ws = story.doors?.walkOns || []; } catch { /* doors not ready */ }
      for (const x of ws) {
        if (!x?.p?.root) continue;
        const pp = x.p.root.getWorldPosition(v);
        const d = Math.hypot(pp.x - mx, pp.z - mz);
        if (d <= range) out.push({ id: 'walkon:' + x.who, who: x.who, cast: null, name: x.name, p: x.p, d, indoor: true, walkon: true });
      }
    }
    return out.filter((s) => onScreen(s.p)).sort((a, b) => a.d - b.d);
  }

  // ---- the bubbles (a pool of three, positioned from 3D only while showing)
  const pool = [];
  for (let i = 0; i < 3; i++) {
    const el = document.createElement('div');
    el.className = 'rc-chat';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<p></p>';
    gameEl.appendChild(el);
    pool.push({ el, text: el.firstChild, on: false, line: null, p: null, until: 0, w: 0, h: 0, x: -1, y: -1, tx: -1, fade: 0 });
  }
  let now = 0;
  function show(sp, line, ms, cls = '') {
    const b = pool.find((x) => !x.on && !x.fade) || pool.find((x) => !x.on) || pool[0];
    b.on = true; b.fade = 0; b.line = line; b.p = sp.p; b.until = now + ms / 1000;
    b.el.className = 'rc-chat' + (cls ? ' ' + cls : '');
    setText(b.text, tr(line));
    b.el.style.visibility = 'hidden';
    b.el.classList.add('show');
    b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; b.x = b.y = b.tx = -1;
    call(sp.p, 'talk', Math.min(4, ms / 1000 * 0.6));
    place(b);
    return b;
  }
  function hide(b, quick) {
    if (!b.on) return;
    b.on = false;
    b.el.classList.remove('show');
    b.fade = quick ? 0 : 0.25;
    if (quick) b.el.style.visibility = 'hidden';
    try { call(b.p, 'talk', 0); } catch { /* ignore */ }
  }
  function hideAll(quick) { for (const b of pool) hide(b, quick); }
  function place(b) {
    if (!b.p?.root) return;
    const q = game.rig?.project ? game.rig.project(headOf(b.p, v), W(), H()) : null;
    const w = W(), h = H();
    if (!q || q.x < -30 || q.x > w + 30 || q.y < 20 || q.y > h + 20) { b.el.style.visibility = 'hidden'; return; }
    b.el.style.visibility = 'visible';
    const half = b.w / 2;
    const x = Math.round(Math.min(Math.max(q.x, 10 + half), w - 10 - half));
    const y = Math.round(Math.max(q.y - b.h - 8, 58));
    const tx = Math.round(Math.min(Math.max(q.x - x + half, 14), b.w - 14));
    if (x !== b.x || y !== b.y) { b.x = x; b.y = y; b.el.style.transform = `translate3d(${x - half}px, ${y}px, 0)`; }
    if (tx !== b.tx) { b.tx = tx; b.el.style.setProperty('--tx', `${tx}px`); }
  }
  // Burmese has no spaces inside a word group, so the browser may wrap mid-word (between syllables). Keep each
  // space-separated chunk whole (short chunks only, so a long one can still wrap rather than overflow).
  function setText(el, s) {
    el.textContent = '';
    for (const part of String(s).split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part) || glen(part) > 14) { el.appendChild(document.createTextNode(part)); continue; }
      const sp = document.createElement('span'); sp.className = 'nw'; sp.textContent = part; el.appendChild(sp);
    }
  }
  const msFor = (line) => Math.min(5200, Math.max(2600, 2000 + glen(tr(line)) * 65));
  document.addEventListener('mw:lang', () => {
    for (const b of pool) if (b.on && b.line) { setText(b.text, tr(b.line)); b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; b.x = -1; place(b); }
  });

  // ---- gates: never during talks, acts, cutscenes, dialogues, the town intro, or driving fast
  let paused = false, slowDomT = 0, domBlock = false;
  function blockReason() {
    if (paused) return 'paused';
    if (document.hidden) return 'hidden';
    if (story.talking) return 'talking';
    if (game.busy) return 'busy';
    if (game.ui?.dialogOpen) return 'dialog';
    if (game.ui?.sheetOpen) return 'sheet';
    if (game.rig?.cinematic) return 'cinematic';
    if (story.townIntro || story.introActive || story.cutscene) return 'intro';
    const cl = gameEl.classList;
    if (cl.contains('cinema') || cl.contains('talking') || cl.contains('choosing') || cl.contains('acting')) return 'scene';
    if (domBlock) return 'overlay';
    if (!story.inRoom && !story.footActive && carSpeed() > T.fastCar) return 'driving';
    return '';
  }
  function carSpeed() { return Math.abs(game.world?.drive?.state?.speed || 0); }

  // ---- Maya's arrival thought
  let pendingArrive = null;
  /** where she stands: the areas round her (a line's `area` tag) */
  function updateHere() {
    const mp = mayaPos();
    hereAreas = new Set(story.inRoom ? [] : insideAreas(mp.x, mp.z).map((a) => a.id));
  }
  function onArrive(districtId, first) {
    updateHere();
    const t = lines[districtId]?.arrive;
    if (first == null) first = !mem.seen[districtId];
    mem.seen[districtId] = true; remember();
    if (!t) return false;
    let line = null;
    if (first && t.first) line = [].concat(t.first).find(ok) || null;
    if (!line && !first && t.again?.length) {
      const it = pickLRU(t.again.filter(ok).map((l) => ({ l, key: keyOf('arrive:' + districtId, l) })));
      if (it) { line = it.l; markUsed(it.key); }
    }
    if (!line) return false;
    pendingArrive = { line, until: now + 25 };
    return true;
  }
  function sayMaya(line) {
    log('maya', 'maya', line);
    if (story.dialog?.bark) story.dialog.bark('maya', line);
    else game.ui?.bark?.(tr(line), { face: game.maya.faceCanvas?.('smile') });
  }

  // ---- the built-in district detector (the dev page; the town intro does this in the game)
  let autoArrive = params.get('chatter') === '1';
  let district = null, seenDistrict = null, districtT = 0;

  // ---- state
  let nextAt = 3 + Math.random() * 3; // a moment's quiet after loading
  let seq = null; // a playing exchange: { sp: [a, b], steps: [{ who, line }], i, t, b }
  let scanT = 0, pairWatch = null, lastPos = null, mayaSpeed = 0;
  let fast = false;
  const logArr = [];
  function log(kind, who, line) { logArr.push({ t: +now.toFixed(1), kind, who, my: line.my, en: line.en }); if (logArr.length > 60) logArr.shift(); }
  const gap = () => (fast ? rand(1, 2) : rand(T.gap[0], T.gap[1]));

  // ---- choosing what to say
  function insideAreas(mx, mz) {
    const out = [];
    for (const [d, t] of Object.entries(lines)) for (const [id, a] of Object.entries(t.areas)) {
      if (Math.hypot(mx - a.at.x, mz - a.at.z) <= (a.at.r || 6)) out.push({ d, id, a });
    }
    return out;
  }
  /** One line and a speaker: [{ key, l, sp }] candidates from a pool of lines. */
  function candidates(list, scope, speakers, { maxLen = Infinity } = {}) {
    const out = [];
    for (const l of list) {
      if (!ok(l)) continue;
      if (maxLen < Infinity && glen(tr(l)) > maxLen) continue;
      if (l.by === 'maya' || l.job === 'maya') { out.push({ key: keyOf(scope, l), l, sp: null }); continue; }
      const job = story.inRoom ? l.job : outdoorJob(l.job);
      const who = speakers.filter((s) => (job != null && job !== '*' ? jobMatch(s, job) : canSayJobless(s)) && ageOK(s, l.age) && !namesSelf(s, l));
      if (!who.length) continue;
      // nearer people speak more often
      const sp = who.length > 1 && Math.random() < 0.35 ? who[1] : who[0];
      out.push({ key: keyOf(scope, l), l, sp });
    }
    return out;
  }
  function trySingle(opts = {}) {
    const inCar = !story.inRoom && !story.footActive;
    const speakers = speakersNear(inCar ? T.carNear : T.near);
    const maxLen = inCar && carSpeed() > 0.3 ? T.slowCarLen : Infinity;
    const d = opts.district || forceDistrict || currentDistrict();
    let cands = [];
    if (story.inRoom) {
      const rd = roomDistrict(story.inRoom);
      const list = (rd && (lines[rd].rooms[story.inRoom] || (rd === story.inRoom ? lines[rd].town : null))) || [];
      cands = candidates(list, 'room:' + story.inRoom, speakers, { maxLen });
    } else {
      const mp = mayaPos();
      const areas = opts.area ? Object.entries(lines[d]?.areas || {}).filter(([id]) => id === opts.area).map(([id, a]) => ({ d, id, a })) : insideAreas(mp.x, mp.z);
      const areaC = [];
      for (const ar of areas) areaC.push(...candidates(ar.a.lines, 'area:' + ar.d + ':' + ar.id, speakers, { maxLen }));
      const townC = opts.area ? [] : candidates(lines[d]?.town || [], 'town:' + d, speakers, { maxLen });
      cands = areaC.length && (!townC.length || Math.random() < 0.6 || opts.area) ? areaC : townC;
    }
    if (opts.who) cands = cands.filter((c) => c.sp?.id === opts.who);
    const it = pickLRU(opts.any ? cands : notRecent(cands));
    if (!it) return false;
    markUsed(it.key);
    const ms = msFor(it.l);
    if (!it.sp) { sayMaya(it.l); nextAt = now + ms / 1000 + gap(); return true; }
    show(it.sp, it.l, ms);
    log(story.inRoom ? 'room' : 'town', it.sp.id, it.l);
    nextAt = now + ms / 1000 + gap();
    return true;
  }
  function whenOK(w) {
    if (!w) return true;
    if (!ok(w)) return false;
    if (w.room && w.room !== story.inRoom) return false;
    if (!w.room && story.inRoom && w.indoors === false) return false;
    if (w.at) { const mp = mayaPos(); if (Math.hypot(mp.x - w.at.x, mp.z - w.at.z) > (w.at.r || 6)) return false; }
    return true;
  }
  /** Overheard pairs that could play right now: [{ key, pair, sp: [a, b] }]. */
  function pairCandidates(opts = {}) {
    const d = opts.district || forceDistrict || currentDistrict();
    const list = lines[d]?.pairs || [];
    const speakers = speakersNear(T.near);
    const out = [];
    list.forEach((pair, i) => {
      if (opts.index != null && i !== opts.index) return;
      if (!whenOK(pair.when) || !pair.lines.some(ok)) return;
      let found = null;
      const ages = Array.isArray(pair.age) ? pair.age : [];
      // '*' = anyone of the district's own folk (outdoors the story cast keep to lines that name them)
      const fits = (s, k) => { const j = story.inRoom ? pair.who[k] : outdoorJob(pair.who[k]); return (j != null && j !== '*' ? jobMatch(s, j) : canSayJobless(s)) && ageOK(s, ages[k]) && !pair.lines.some((l) => namesSelf(s, l)); };
      for (const a of speakers) {
        if (!fits(a, 0)) continue;
        for (const b of speakers) {
          if (b === a || !fits(b, 1)) continue;
          const pa = a.p.root.getWorldPosition(new THREE.Vector3()), pb = b.p.root.getWorldPosition(v);
          if (Math.hypot(pa.x - pb.x, pa.z - pb.z) > T.pairApart) continue;
          found = [a, b]; break;
        }
        if (found) break;
      }
      // (the dev page may force a pair onto the two nearest people, whoever they are)
      if (!found && opts.anyone && speakers.length >= 2) found = [speakers[0], speakers[1]];
      if (found) out.push({ key: 'pair:' + d + ':' + (pair.id || pair.lines[0].my || pair.lines[0].en), pair, sp: found });
    });
    return out;
  }
  function startPair(c) {
    markUsed(c.key);
    let turn = 0;
    const steps = [];
    for (const l of c.pair.lines) {
      if (!ok(l)) continue;
      let who;
      if (l.by === 'maya' || l.job === 'maya') who = 'maya';
      else if (l.by === 0 || l.by === 'a') who = 0;
      else if (l.by === 1 || l.by === 'b') who = 1;
      else if (typeof l.by === 'string') who = jobMatch(c.sp[1], l.by) && !jobMatch(c.sp[0], l.by) ? 1 : 0;
      else who = turn % 2;
      turn = (who === 'maya' ? turn : who) + 1;
      steps.push({ who, line: l });
    }
    if (!steps.length) return false;
    seq = { sp: c.sp, steps, i: -1, t: 0, b: null };
    log('pair', c.sp.map((s) => s.id).join('+'), steps[0].line);
    return true;
  }
  function stepPair(dt) {
    seq.t -= dt;
    if (seq.t > 0) return;
    if (seq.b) hide(seq.b);
    seq.i++;
    if (seq.i >= seq.steps.length) { seq = null; nextAt = now + gap(); return; }
    const st = seq.steps[seq.i];
    const ms = msFor(st.line);
    if (st.who === 'maya') { sayMaya(st.line); seq.b = null; }
    else { seq.b = show(seq.sp[st.who], st.line, ms, st.who ? 'pb' : 'pa'); if (seq.i) log('pair', seq.sp[st.who].id, st.line); }
    seq.t = ms / 1000 + T.pairStep;
  }

  // ---- every frame
  let forceDistrict = null;
  // (an exchange started by chatter.play tells its owner when it ends, however it ends)
  function update(dt) {
    const s = seq;
    updateInner(dt);
    if (s && s.onDone && seq !== s) { try { s.onDone(); } catch (e) { console.error('chatter onDone', e); } }
  }
  function updateInner(dt) {
    if (!dt || !game.maya?.root) return;
    now += dt;
    // bubbles: follow their speaker, time out
    for (const b of pool) {
      if (b.on) { if (now >= b.until && !(seq && seq.b === b)) hide(b); else place(b); }
      else if (b.fade > 0) { b.fade -= dt; if (b.fade <= 0) { b.fade = 0; b.el.style.visibility = 'hidden'; } }
    }
    // Maya's speed (on foot, or the car)
    const mp = mayaPos();
    if (lastPos) mayaSpeed += (Math.hypot(mp.x - lastPos.x, mp.z - lastPos.z) / dt - mayaSpeed) * Math.min(1, dt * 6);
    lastPos = { x: mp.x, z: mp.z };
    // the expensive checks a few times a second
    slowDomT -= dt;
    if (slowDomT <= 0) {
      slowDomT = 0.3;
      updateHere();
      if (story.inRoom && !roomLooks.has(story.inRoom)) loadRoomLooks(story.inRoom);
      domBlock = !!document.querySelector('.act-wrap, .story-stamp, .story-letter, .rc-slip, .rc-lift, #story-panel, #story-choices, .story-got, #story-map, #story-fade.on'); // (.rc-slip/.rc-lift: the morning post's notebook line and lift-off)
    }
    const why = blockReason();
    if (why) {
      if (why !== 'driving') { if (seq || pool.some((b) => b.on)) { hideAll(true); seq = null; nextAt = Math.max(nextAt, now + 2); } }
      pairWatch = null;
      return;
    }
    // district detector
    const d = currentDistrict();
    if (d !== district) { district = d; districtT = 0; }
    else districtT += dt;
    if (autoArrive && district && district !== seenDistrict && districtT > 1.5) { seenDistrict = district; onArrive(district); }
    else if (!autoArrive && district) seenDistrict = district;
    // Maya's thought first (it waits for her own bubble to be free)
    if (pendingArrive) {
      if (now > pendingArrive.until) pendingArrive = null;
      else if (!game.ui?.barkOpen && !seq) { sayMaya(pendingArrive.line); pendingArrive = null; nextAt = Math.max(nextAt, now + 4 + gap() * 0.5); return; }
    }
    if (seq) {
      // she walked off: they finish the bubble showing, and stop there
      const a = seq.sp[0].p.root.getWorldPosition(v);
      if (Math.hypot(a.x - mp.x, a.z - mp.z) > (seq.far ? 34 : T.near * 2)) { if (seq.b) hide(seq.b); seq = null; nextAt = now + gap(); return; }
      stepPair(dt);
      return;
    }
    scanT -= dt;
    if (scanT > 0) return;
    scanT = T.scan;
    if (now < nextAt) { watchPairs(T.scan); return; }
    if (game.ui?.barkOpen) return; // Maya is saying something herself
    if (watchPairs(T.scan)) return;
    if (Math.random() < (fast ? 0.9 : T.chance)) trySingle();
  }
  /** Overheard pairs: two matching people near a Maya who stands still for ~2 s. Returns true if one started. */
  function watchPairs(dtScan) {
    const inCar = !story.inRoom && !story.footActive;
    if (mayaSpeed > T.pairStill || (inCar && carSpeed() > 0.3)) { pairWatch = null; return false; }
    const cs = notRecent(pairCandidates());
    if (!cs.length) { pairWatch = null; return false; }
    const pick = (pairWatch && cs.find((c) => c.key === pairWatch.key)) || pickLRU(cs);
    if (!pairWatch || pairWatch.key !== pick.key) pairWatch = { key: pick.key, t: 0 };
    pairWatch.t += dtScan;
    if (now < nextAt || game.ui?.barkOpen) return false;
    if (pairWatch.t >= (fast ? 0.5 : T.pairHold)) { pairWatch = null; return startPair(pick); }
    return false;
  }

  const chatter = {
    update,
    pause(on) { paused = !!on; if (paused) { const s = seq; hideAll(true); seq = null; s?.onDone?.(); } },
    /** (extras-chatter.js) play an exchange on speakers it found itself (small talk, a house's residents):
     * sp = [{ id, p }, ...], list = [{ who: 0 | 1 | 'maya', my, en }]; onDone() when it ends or is cut off.
     * Shares the one exchange slot, so nothing else talks over it. false = something is already playing or blocked. */
    play(sp, list, onDone = null, kind = 'small') {
      if (seq || pendingArrive || game.ui?.barkOpen || blockReason() || !sp?.length || !list?.length) return false;
      const steps = list.filter((l) => l && (l.my || l.en)).map((l) => ({ who: l.who === 'maya' ? 'maya' : Math.min(sp.length - 1, +l.who || 0), line: l }));
      if (!steps.length) return false;
      hideAll(true);
      seq = { sp: sp.map((s) => ({ id: s.id, p: s.p })), steps, i: -1, t: 0, b: null, onDone, far: kind === 'small' }; // (small talk is overheard up the street: extras-chatter.js SMALL.near)
      log(kind, seq.sp.map((s) => s.id).join('+'), steps[0].line);
      return true;
    },
    /** something showing or about to (an exchange, a bubble, Maya's arrival thought) */
    get busy() { return !!seq || !!pendingArrive || pool.some((b) => b.on); },
    blocked: () => blockReason(),
    get now() { return now; },
    onArrive,
    lines,
    ready,
    addLines,
    districtAt,
    get district() { return currentDistrict(); },
    get autoArrive() { return autoArrive; },
    set autoArrive(on) { autoArrive = !!on; },
    log: logArr,
    debug: {
      /** what the module sees right now */
      state() {
        const mp = mayaPos();
        return {
          district: currentDistrict(), force: forceDistrict, room: story.inRoom || null, blocked: blockReason(),
          areas: insideAreas(mp.x, mp.z).map((a) => a.d + ':' + a.id), nextIn: +(nextAt - now).toFixed(1), playing: !!seq,
          near: speakersNear(T.carNear).map((s) => ({ id: s.id, d: +s.d.toFixed(1), role: s.cast?.role?.en || s.who })),
          pairs: pairCandidates().map((c) => c.key + ' ' + c.sp.map((s) => s.id).join('+')),
          lineCount: Object.fromEntries(Object.entries(lines).map(([k, t]) => [k, t.town.length + Object.values(t.areas).reduce((n, a) => n + a.lines.length, 0) + Object.values(t.rooms).reduce((n, l) => n + l.length, 0) + t.pairs.length])),
        };
      },
      /** one line now (ignores the quiet gap): { district, area, who } */
      say(opts = {}) { hideAll(true); seq = null; return trySingle(opts); },
      /** an overheard exchange now: { district, index, anyone } */
      pair(opts = {}) {
        hideAll(true); seq = null;
        const cs = pairCandidates(opts);
        const c = pickLRU(cs);
        return c ? startPair(c) : false;
      },
      /** short gaps, quick pairs (testing) */
      fast(on = true) { fast = !!on; if (fast) nextAt = Math.min(nextAt, now + 1); },
      /** treat Maya as being in this district (null = where she really is) */
      force(o = {}) { if ('district' in o) forceDistrict = o.district || null; },
      reset() { mem = { created: save.created, seq: 0, used: {}, seen: {} }; remember(); },
      /** which `job` values no cast member of the district could say (room walk-on keys show up here too) */
      coverage(cast) {
        const out = {};
        for (const [d, t] of Object.entries(lines)) {
          const folk = (cast || []).filter((c) => c.district === d || AMBIENT_IDS.has(c.id)).map((c) => ({ id: c.id, cast: c }));
          const all = [...t.town, ...Object.values(t.areas).flatMap((a) => a.lines), ...t.pairs.flatMap((p) => p.who.map((w) => ({ job: w })))];
          const miss = {};
          for (const l of all) for (const j of [].concat(l.job ?? [])) {
            if (j === 'maya' || j === '*') continue;
            if (!folk.some((f) => jobMatch(f, j))) miss[j + (outdoorJob(j) ? '' : ' (-> ambient folk)')] = (miss[j + (outdoorJob(j) ? '' : ' (-> ambient folk)')] || 0) + 1;
          }
          out[d] = miss;
        }
        return out;
      },
    },
  };
  return chatter;
}

function injectStyle() {
  if (document.getElementById('rc-chatter-style')) return;
  const s = document.createElement('style');
  s.id = 'rc-chatter-style';
  s.textContent = `
  .rc-chat { position: absolute; left: 0; top: 0; z-index: 4; max-width: min(232px, calc(100% - 40px)); pointer-events: none; opacity: 0; visibility: hidden;
    transition: opacity .22s ease; will-change: transform; }
  .rc-chat.show { opacity: 1; z-index: 5; } /* the bubble showing sits over one still fading out (an exchange's turns) */
  .rc-chat p .nw { white-space: nowrap; }
  .rc-chat p { position: relative; margin: 0; padding: 3px 11px 4px; border-radius: 14px; background: rgba(255, 252, 244, .95); color: #2A2118;
    border: 1.5px solid rgba(164, 122, 44, .45); box-shadow: 0 3px 10px rgba(59, 42, 26, .16);
    font: 600 13.5px/1.75 "Noto Sans Myanmar", system-ui, sans-serif; word-break: keep-all; overflow-wrap: anywhere; text-align: center; }
  html[data-lang="en"] .rc-chat p { line-height: 1.35; padding: 5px 11px; font-weight: 600; }
  .rc-chat p::after { content: ""; position: absolute; left: var(--tx, 50%); bottom: -6px; width: 10px; height: 10px; margin-left: -5px;
    background: rgba(255, 252, 244, .95); border-right: 1.5px solid rgba(164, 122, 44, .45); border-bottom: 1.5px solid rgba(164, 122, 44, .45);
    transform: rotate(45deg); }
  .rc-chat.show p { animation: rcChatPop .28s cubic-bezier(.3, 1.4, .5, 1); }
  .rc-chat.pb p { background: rgba(250, 244, 232, .96); }
  .rc-chat.pb p::after { background: rgba(250, 244, 232, .96); }
  #game.cinema .rc-chat, #game.talking .rc-chat, #game.choosing .rc-chat, #game.acting .rc-chat { opacity: 0 !important; }
  @keyframes rcChatPop { from { transform: scale(.6) translateY(6px); opacity: 0; } }
  `;
  document.head.appendChild(s);
}
