// Day 10 (the Diary Garden opens) — chapters 16 တစ်ယောက်တည်း နေချင်ခြင်း (Wanting to Be Alone) and 17
// မကောင်းတာလုပ်ပြီး ချမ်းသာခြင်း (Getting Rich by Doing Wrong); ch 15's next-day result arrives by post and page 15 is
// stamped tonight. Main beat: the first "ask Maya" note is taken down by its own writer (Ko Kaung).
// Script: writermaya-plan/game/days/day10-spec.md (INDEX 13.2 layouts and INDEX 9 flags win).
//
// Lessons (INDEX 14):
//   ch 16  wanting to be alone comes from what life dealt; living alone is not wrong; nothing stays, so cling to
//          nothing; connect, don't entwine; hearing is not listening; a gate opens in its owner's time. Played
//          OUTDOORS at U Hpo Htaw's gate on purpose: Maya never goes in, even when it stands a hand-width open.
//   ch 17  wrong done by hand, mouth or mind can make you rich (ချမ်းသာ) but never at ease (သုခ): the trader really
//          is rich; his locks, lamp and start at footsteps are the cost. Looked at only from the public kerb; the
//          sitting-with-him is indoors in the corner tea shop. Nobody is caught, exposed or shamed.
//   main   Ko Kaung found his own number by a month of trying; Maya steps back, and leaves the board's gap.
//
// Beats, in order (any order between the two chapters; ch 17's dusk waits for ch 16):
//   morning   (Home Book, the Writing Room door) post: the notebook line, Maung Arkar's letter, the Cooled Ember
//   arrived   (the great clasp, Hearth Row's east end) a carter's rumour; the dated beds
//   desk clasp / desk kiln (the two Bookmark Desks) one true line about what is seen
//   gourdhouse (the gourd aunty's kitchen, room) her lines; the empty jar
//   ch 16     (U Hpo Htaw's gate, the lane bench) hpSit -> looks through the bars -> sort ties -> hold tendrils ->
//             sort the lane's talk -> bulbs -> talk -> padlock off, gate a hand-width, bench turned
//   offer     (`paperstore`, room) U Kyi Nyein's wet bale; card `doors`
//   kpMet     (`kilntea` by day, room) Ko Phyo's tea break: "come and sit by my cart at lamp-light"
//   dusk      (Ko Phyo's cart, south kerb of the kiln square) after ch 16: the page folds to dusk; four looks
//   inside    (`kilntea` at dusk, room) match -> hold (scale) -> talk -> the true weight
//   ch17Done  (the square) the can on the trader's stair; the 6 s vignette
//   kaung     (`packroom`, room) Ko Kaung, both stones his
//   board     (Home Book, the "ask Maya" board by the Post Office) the gap, left as it is
//   night     (the Writing Room `about`, at the desk) the night page; stamps 15, 16, 17; bulbs planted; day 11
// No markers anywhere: the player learns where to go from what people say and what can be seen.
// Burmese lines are drafts for Maya to proofread (day10-lines.js, talks/day10.js).
//
// Test hooks: window.__day10 = { skipTo(beat), beats, look(id), tap(id), state(), P, set }
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { sort } from './acts/sort.js';
import { hold } from './acts/hold.js';
import { match } from './acts/match.js';
import { createPerson } from './people.js';
import { castById } from './cast.js';
import { morningPost, nightPage, showSlip } from './post.js';
import { pageTurn } from './world/map.js';
import { L, GATE_LOOKS, SQUARE_LOOKS, RUMOURS, SLEPT9, NAMES } from './day10-lines.js';
import { buildGarden, buildBoard, P } from './day10-garden.js';
import { TALK_D10_HPOHTAW, TALK_D10_KOPHYO, TALK_D10_KAUNG } from './talks/day10.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const l = (my, en) => ({ my, en });

/** Scripted looks (day10-spec 1): day from arrival, dusk from the cart until the night page. */
const HOUR = { morning: 8.5, day: 10.5, dusk: 18.4, night: 21 };

/** People with no cast.js entry (looks as rooms/garden.js WALKON_LOOKS draws them). */
const LOOKS = {
  gourdaunty: { age: 'elder', build: 'wide', skin: 2, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'leaf', bottom: 'htamein', bottomColor: 'brown', extras: ['apron', 'thanaka'] },
  carter: { age: 'adult', build: 'wide', skin: 3, hair: 'short', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'brown', check: true, extras: ['towel'] },
};

/** The beats in order, and what each one's flags are (skipTo sets every beat before the one asked for). */
const BEATS = [
  ['morning', ['morning']],
  ['arrived', ['arrived', 'desk.clasp', 'rumour.dog']],
  ['hpSit', ['hpMet', 'hpSit', 'aunty', 'rumour.hates']],
  ['looked', ['look.bell', 'look.loaf', 'look.bench', 'look.rack', 'look.visitors', 'look.tendril', 'look.vine', 'looked']],
  ['sorted', ['sorted']],
  ['tendrils', ['tendrils']],
  ['lanes', ['lanes']],
  ['bulbs', ['bulbs', 'rumour.bulbs']],
  ['ch16Done', ['hpTalk', 'ch16Done']],
  ['offer', ['offer', 'rumour.wet']],
  ['kpMet', ['kpMet']],
  ['dusk', ['dusk', 'rumour.clasp', 'noteDown']],
  ['inside', ['sq.store', 'sq.locks', 'sq.lamp', 'sq.steps', 'rumour.lamp']],
  ['matched', ['matched']],
  ['weighed', ['weighed']],
  ['kpTalk', ['kpTalk', 'kpEndDone']],
  ['ch17Done', ['ch17Done']],
  ['kaung', ['kaungMet', 'kaungTalk', 'desk.kiln', 'rumour.market', 'rumour.kilncold']],
  ['board', ['wwEve', 'board']],
  ['night', []],
];

export { SLEPT10 } from './day10-lines.js'; // tonight's hosts' lines (later days read dayN.js SLEPTn)

export async function create(story) {
  const { game, dialog: D, save } = story;
  const F = (k, v) => story.flag(`d10.${k}`, v);
  const ow = story.openWorld;
  const v3 = new THREE.Vector3();
  const people = story.people;
  const aboutDoor = () => game.world.places.find((p) => p.id === 'about')?.door || { x: 0, z: 7 };
  const both = () => !!(F('ch16Done') && F('ch17Done'));
  const squareDone = () => SQUARE_LOOKS.every((s) => F(`sq.${s.id}`));
  const gateLooked = () => GATE_LOOKS.every((g) => F(`look.${g.id}`));

  // ---- the set (the Garden's plots, gate, kiln square; the board at home)
  const set = buildGarden(story);
  /** Where the region's store, stair, tea shop and packing room really are (P.R), or the old stand-ins' spots. */
  const R = P.R || {
    store: P.store, stair: { x: P.stair.x + 0.35, y: 0, z: P.stair.z + 0.25 }, stairStand: { x: P.stair.x, z: P.stair.z + 0.7 },
    offerStand: { x: P.store.x, z: P.store.z + 4.4 }, teaStand: { x: P.tea.x - 0.9, z: P.tea.z + 3.4 }, kaungStand: { x: P.pack.x, z: P.pack.z + 3.4 },
  };
  const board = buildBoard(story, { notes: 30, gap: true });
  const { gate, hpBench, trellis, rack, store, cart, can, bale } = set;

  // ---- small helpers
  /** Say, with the right name for walk-ons that have no cast.js entry. */
  async function say(id, lines, opts = {}) {
    const pr = D.say(id, lines, opts);
    if (NAMES[id]) { const el = document.querySelector('#dialog .dialog-name'); if (el) el.textContent = tr(NAMES[id]); }
    return pr;
  }
  /** A short staged moment outside a talk: the letterbox on, taps held, everything released after. */
  async function scene(fn) {
    if (story.talking || game.busy) return false;
    story.talking = true;
    game.ui.cinema(true);
    try { await fn(); } catch (e) { console.error('day10', e); } finally { story.talking = false; game.ui.cinema(false); game.rig.release(); }
    return true;
  }
  /** Maya's walker: the room's inside a room (foot.walkTo drives the outdoor one), else the open world's. */
  const mayaWalker = () => (story.inRoom && game.walker ? game.walker : null);
  const walkMaya = (x, z, ms = 9000) => new Promise((r) => {
    let done = false; const fin = () => { if (!done) { done = true; r(); } };
    const w = mayaWalker();
    if (w) w.goTo(x, z, fin); else story.foot.walkTo(x, z, fin);
    setTimeout(fin, ms);
  });
  function faceMaya(x, z) {
    const p = mayaWalker()?.pos || story.foot.pos;
    story.foot.walker.heading = Math.atan2(x - p.x, z - p.y);
    game.maya.root.rotation.set(0, story.foot.walker.heading, 0);
  }
  function setHour(h) { call(game.day, 'set', h); call(game, 'applyDayLook'); }
  function mayaXZ() { const o = story.foot?.active ? game.maya.root.position : game.car.root.position; return { x: o.x, z: o.z }; }
  function placePerson(id, at) {
    const e = people.get(id);
    if (!e) return;
    e.walking = null;
    e.p.root.position.set(at.x, 0, at.z);
    if (at.h != null) e.p.root.rotation.y = at.h;
    e.ob.x = at.x; e.ob.z = at.z;
    e.home = { x: at.x, z: at.z, h: at.h ?? e.home.h };
  }
  /** Walk someone and never hang the beat: a walk that has not arrived after `ms` (a path blocked by a table or a
   * stool, say) stops, and they are simply set on the spot. -> true when they walked all the way. */
  async function walkSure(id, x, z, speed = 1.3, ms = 7000) {
    let arrived = false;
    await Promise.race([story.walkPerson(id, x, z, speed).then(() => { arrived = true; }), wait(ms)]);
    if (!arrived) { const e = people.get(id); if (e) { e.walking = null; placePerson(id, { x, z }); } }
    return arrived;
  }
  /** A townsperson with no cast.js entry (the gourd aunty, a carter): tappable, talks through day.talk[id]. */
  function walkOn(id, at, parent = game.world.scene) {
    dropWalkOn(id);
    const look = LOOKS[id] || LOOKS.carter;
    const p = createPerson(look);
    p.root.position.set(at.x, 0, at.z);
    p.root.rotation.y = at.h ?? at.heading ?? 0;
    p.root.userData.isPerson = true;
    parent.add(p.root);
    const e = { id, cast: { id, name: NAMES[id] || l(id, id), look }, p, home: { x: at.x, z: at.z, h: at.h ?? 0 }, ob: { type: 'circle', x: at.x, z: at.z, r: p.radius || 0.3, person: id }, onTalk: null, walking: null, local: true };
    people.set(id, e);
    return e;
  }
  function dropWalkOn(id) {
    const e = people.get(id);
    if (!e?.local) return;
    e.p.root.removeFromParent();
    e.p.dispose();
    people.delete(id);
  }

  // ---- rumours: heard (pencil) and checked (a proof slip in the bag, days/INDEX 4)
  function hear(id) {
    if (story.flag(`rumour.${id}`) === 'checked' || F(`rumour.${id}`)) return;
    story.flag(`rumour.${id}`, 'pencil');
    F(`heard.${id}`, true);
  }
  function check(id, o = {}) {
    if (F(`rumour.${id}`)) return false;
    F(`rumour.${id}`, true);
    story.flag(`rumour.${id}`, 'checked');
    if (RUMOURS[id]) save.proofs[id] = RUMOURS[id].proof;
    story.persist();
    story.give(`proof:${id}`, 1, { quiet: !!o.quiet });
    return true;
  }

  // ---- how the Garden looks, from the flags (on load, after skipTo, after each change)
  function applyState() {
    const done16 = !!F('ch16Done');
    gate.setLocked(!done16);
    gate.setAjar(done16 ? 0.15 : 0);
    gate.setLoaf(!done16);
    hpBench.setTurn(done16 ? Math.PI : 0);
    if (F('tendrils')) { trellis.setTendril(1, 'touch'); trellis.setBend(0); } else { trellis.setTendril(1, 'coil'); trellis.setBend(0.7); }
    rack.setCount(F('bulbs') ? 34 : 60);
    const hp = people.get('hpohtaw');
    if (hp && !story.inRoom) { hp.home.h = done16 ? Math.PI : 0; hp.p.root.rotation.y = hp.home.h; }
    can.root.visible = !!(F('offer') && !squareDone());
    bale.root.visible = !squareDone();
    const dusk = !!F('dusk');
    store.setLit(dusk ? 1 : 0);
    call(store.lampWindow, 'silhouette', dusk);
    store.setShutter(dusk && squareDone() ? 1 : 0);
    cart.setLit(dusk && !F('ch17Done') ? 1 : 0);
    story.doors?.setDoor?.('paperstore', !dusk); // the store shuts at dusk (the region's door: setDoor, never delete)
    call(set.kiln, 'setSmoke', 0.2);
  }

  // ---- people
  const ab = aboutDoor();
  function placeWintWar() {
    if (!people.has('wintwar')) story.spawn('wintwar', { x: ab.x + 2.6, z: ab.z + 1.2, heading: -Math.PI / 2 });
    const ww = people.get('wintwar');
    if (!ww || story.inRoom) return;
    if (both()) {
      if (Math.hypot(ww.home.x - P.wwEve.x, ww.home.z - P.wwEve.z) > 0.3) { ww.job = null; ww.life = null; placePerson('wintwar', P.wwEve); }
    } else if (!ww.job) {
      story.setJob('wintwar', { area: { x: ab.x + 3.5, z: ab.z + 2.2, r: 3.2 }, spot: { x: ab.x + 2.6, z: ab.z + 1.2, h: -0.4 }, mood: 'read', workChance: 0.5, workFor: [5, 9] });
    }
  }
  story.spawn('hpohtaw', { x: P.hp.x, z: P.hp.z, heading: F('ch16Done') ? Math.PI : 0 });
  story.spawn('maungnge', { x: P.mnLane.x, z: P.mnLane.z, heading: -Math.PI / 2 });
  story.setJob('maungnge', { area: { x: 244, z: 101.4, r: 5.5 }, spot: { x: P.mnLane.x, z: P.mnLane.z, h: Math.PI }, mood: 'read', workChance: 0.4, workFor: [4, 8], speed: 0.9 });
  placeWintWar();
  /** Who stands where outdoors as the day goes on (called on load and twice a second). */
  function ensureCast() {
    if (story.inRoom) return;
    placeWintWar();
    if (F('kpMet') && !people.has('kophyo')) {
      story.spawn('kophyo', { x: P.kp.x, z: P.kp.z, heading: P.kp.h });
      if (F('ch17Done')) call(people.get('kophyo')?.p, 'setMood', 'down');
    }
    const gaOut = F('hpSit') && !F('ch16Done');
    if (gaOut && !people.has('gourdaunty')) walkOn('gourdaunty', P.ga);
    if (!gaOut && people.get('gourdaunty')?.local) dropWalkOn('gourdaunty');
  }
  if (F('dusk')) setHour(HOUR.dusk);
  else if (F('morning')) setHour(HOUR.day);
  applyState();
  ensureCast();

  // ---- what people say
  const talk = {
    wintwar: async () => {
      if (!F('morning')) return morning();
      if (both()) return say('wintwar', F('board') ? L.wwAfterBoard : L.wwEvening, { face: 'smile' });
      return say('wintwar', L.wwLater, { face: 'smile' });
    },
    hpohtaw: () => hpTalk(),
    gourdaunty: () => gaTalk(),
    maungnge: async () => {
      const i = F('mnN') || 0;
      await say('maungnge', [L.mn[i % L.mn.length]], { face: 'happy' });
      if (i % 4 === 2) hear('hates');
      if (i % 4 === 3) hear('market');
      F('mnN', i + 1);
    },
    kophyo: () => kpTalk(),
    kyinyein: async () => {
      if (!F('offer')) return offerTalk();
      const i = F('knN') || 0;
      await say('kyinyein', [L.kn[i % 2]], { face: i % 2 ? 'think' : 'worried' });
      if (i % 2 === 1) hear('kilncold');
      F('knN', i + 1);
    },
    teauncle: async () => {
      if (F('dusk')) return say('teauncle', L.tuDusk, { face: 'smile' });
      const i = F('tuN') || 0;
      await say('teauncle', [L.tu[i % 2]], { face: 'smile' });
      if (i % 2 === 1) check('market');
      F('tuN', i + 1);
    },
    kaung: () => koTalk(),
    carter: () => say('carter', L.carter, { face: 'smile' }),
  };

  // =============================================================================================
  // 4 · the morning post (at the Writing Room door) and the arrival under the clasp
  // =============================================================================================
  async function morning() {
    await morningPost(story, {
      day: 10, hour: HOUR.morning,
      ww: L.ww1, slept: SLEPT9, after: L.ww2,
      letters: [{ from: 'maungarkar', text: L.mlNote }],
      companions: ['ember'], liftCaption: { ember: L.ember }, lift: { ember: L.emberMaya },
      where: L.ww3,
    });
    hear('dog');
    setHour(HOUR.day);
  }

  function checkArrival() {
    if (F('arrived') || story.talking || game.busy || story.inRoom) return;
    const p = mayaXZ();
    if (p.z < P.clasp.z - 0.8 && p.z > 116 && Math.abs(p.x - P.clasp.x) < 7) arrive();
  }
  async function arrive() {
    F('arrived', true);
    story.flag('rumour.gardenshut', 'rubbed'); // Day 9's "the clasp is shut": open today
    setHour(HOUR.day);
    const p = mayaXZ();
    const c = walkOn('carter', { x: P.clasp.x + 1.6, z: Math.min(p.z - 3.2, 131), h: 0 });
    await scene(async () => {
      call(c.p, 'emote', 'wave');
      await say('carter', L.carter, { face: 'smile' });
      hear('clasp');
      await D.say('maya', L.arriveMaya, { face: 'smile' });
    });
    // he goes on out under the clasp toward Hearth Row
    story.walkPerson('carter', P.clasp.x + 1.6, P.clasp.z + 6, 1.3).then(() => dropWalkOn('carter'));
    setTimeout(() => dropWalkOn('carter'), 14000);
  }

  // =============================================================================================
  // 8.1 · the Garden's two Bookmark Desks: one true line about what is seen (wraps the world's lightDesk)
  // =============================================================================================
  const light0 = ow?.lightDesk;
  if (ow && light0) {
    ow.lightDesk = async function lightDesk10(d) {
      if ((d.id !== 'clasp' && d.id !== 'kiln') || F(`desk.${d.id}`)) return light0.call(this, d);
      if (story.talking || game.busy) return undefined;
      let ok = false;
      story.talking = true;
      game.ui.cinema(true);
      try {
        await D.say('maya', [L.deskQ], { face: 'think' });
        const lines = d.id === 'clasp' ? L.deskClasp : L.deskKiln;
        const order = [0, 1, 2].sort(() => Math.random() - 0.5);
        for (;;) {
          const i = order[await D.choose(order.map((k) => lines[k]))];
          if (i === 0) { ok = true; break; }
          await D.say('maya', L.deskWrong, { face: 'think' });
        }
      } finally { story.talking = false; game.ui.cinema(false); }
      if (!ok) return undefined;
      await light0.call(this, d);
      F(`desk.${d.id}`, true);
      story.flag(`desk:${d.id}`, true);
      if (d.id === 'clasp') check('dog'); else { check('market'); check('kilncold'); }
      await scene(() => D.say('maya', L.deskDone, { face: 'happy' }));
      return undefined;
    };
  }

  // =============================================================================================
  // 7 · the gourd aunty (her kitchen `gourdhouse`; at her trellis from hpSit to ch16Done)
  // =============================================================================================
  async function gaTalk() {
    if (F('ch16Done') && !F('gaAfter')) { F('gaAfter', true); return say('gourdaunty', L.gaAfter16, { face: 'happy' }); }
    const i = F('gaN') || 0;
    const k = i % L.ga.length;
    await say('gourdaunty', [L.ga[k]], { face: 'smile' });
    F('aunty', true);
    if (k === 0) check('hates');
    if (k === 2) hear('bulbs');
    if (k === 3) hear('wet');
    F('gaN', i + 1);
  }

  // =============================================================================================
  // 5 · chapter 16 · U Hpo Htaw, at his gate (Maya stays on the lane side)
  // =============================================================================================
  async function hpTalk() {
    const hp = people.get('hpohtaw');
    if (F('ch16Done')) return D.say('hpohtaw', L.hpAfter, { face: 'smile' });
    if (!F('hpSit')) {
      F('hpMet', true);
      await D.say('hpohtaw', L.hp1, { face: 'hot', mood: 'hot' });
      for (;;) {
        const i = await D.choose(L.hpChoices);
        if (i === 0) { await D.say('hpohtaw', L.hpArgue, { face: 'hot', emote: 'fists' }); await D.say('maya', L.hpArgueMaya, { face: 'think' }); continue; }
        if (i === 1) { await D.say('hpohtaw', L.hpAgree, { face: 'think' }); await D.say('maya', L.hpAgreeMaya, { face: 'think' }); continue; }
        break;
      }
      call(hp?.p, 'setMood', null);
      await D.say('hpohtaw', L.hpSit, { face: 'think' });
      F('hpSit', true); // card `alone`
      // she sits on the lane's bench, a gate's width from him; next door the gourd aunty comes out to her trellis
      ensureCast();
      await walkMaya(P.laneBench.x + 0.3, P.laneBench.z - 0.5);
      faceMaya(P.gate.x, P.gate.z);
      await D.say('maya', L.mayaBench, { face: 'smile' });
      return undefined;
    }
    if (!gateLooked()) return D.say('hpohtaw', L.hpBench, { face: 'think' });
    // S · his ties: connected or entwined (two baskets only: the chapter has no "cut")
    if (!F('sorted')) {
      await D.say('maya', L.sortIntro, { face: 'smile' });
      const r = await sort({
        who: 'hpohtaw',
        title: l('ဆက်နေတာလား၊ နွယ်နေတာလား', 'Connected, or entwined?'),
        hint: l('ထိပြီး လွှတ်တာက ဆက်တာ။ ရစ်ပတ်ပြီး မလွှတ်နိုင်တာက နွယ်တာ။', 'Touching and letting go is connecting. Winding round and unable to let go is entwining.'),
        baskets: [{ id: 'link', my: 'ဆက်', en: 'connected', icon: 'touch' }, { id: 'wind', my: 'နွယ်', en: 'entwined', icon: 'coil' }],
        cards: [
          { id: 'water', goes: 'link', my: 'မနက်တိုင်း ကိုယ့်ပန်းခင်းတွေကို ရေလောင်းတယ်', en: 'Waters his beds every morning' },
          { id: 'nod', goes: 'link', my: 'ခြံစည်းရိုးကျော်ပြီး ဘူးစင်အဒေါ်ကို ခေါင်းညိတ်ပြတယ်', en: 'Nods to the gourd aunty over the fence' },
          { id: 'beans', goes: 'link', my: 'ပဲနွယ်က ဘေးခြံ ဘူးစင်ပေါ် ရောက်နေတယ်', en: "His beans are up the neighbour's gourd trellis" },
          { id: 'lane', goes: 'wind', my: 'တစ်နေကုန် လမ်းကို ထိုင်ကြည့်နေတယ်', en: 'Sits watching the lane all day', why: l('ကြည့်ရုံပါ… (မျက်လုံးက လမ်းပေါ်ကနေ မခွာဘူး။)', "I only look… (his eyes don't leave the lane)") },
          { id: 'night', goes: 'wind', my: 'လမ်းက ပြောတာတွေကို ညလုံးပေါက် ကြားယောင်နေတယ်', en: 'Hears what the lane said, all night long', why: l('အဲဒါ ဆက်တာ မဟုတ်ဘူး… ကိုင်ထားတာ။', "That isn't connecting… that's holding on.") },
          { id: 'seat', goes: 'wind', my: 'ဧည့်ခုံကို နံရံဘက် လှည့်ထားပြီး နေ့တိုင်း သုတ်တယ်', en: "Turned the visitors' bench to the wall, and wipes it every day", why: l('…လှည့်ထားတာ မမြင်ချင်လို့။ သုတ်တာ… မေ့မရလို့။', "…Turned it so I wouldn't see it. Wipe it… because I can't forget.") },
        ],
        wrong: l('ဟင့်အင်း… အဲဒီဘက် မဟုတ်ဘူး ထင်တယ်။', "No… I don't think that one goes there."),
      });
      if (!r.ok) return undefined;
      await D.say('hpohtaw', L.sorted, { face: 'surprised' });
      F('sorted', true);
    }
    // H · three tendrils: touch, then let go
    if (!F('tendrils')) {
      trellis.setTendril(0.2, 'reach'); trellis.setBend(0); // he unwinds the old one from the sapling himself
      await D.say('hpohtaw', L.tendrilAsk, { face: 'worried' });
      const r = await hold({
        mode: 'release', skin: 'tendril', rounds: 3, who: 'hpohtaw',
        title: l('နွယ်ညွန့်ကို တိုင်ဆီ လမ်းပြမယ်', 'Lead the tendril to the post'),
        hint: l('ဖိထားရင် ညွန့်က တိုင်ဆီ ထိုးသွားမယ်။ တိုင်ကို ထိတာနဲ့ လွှတ်လိုက်ပါ။', 'Hold and the tip reaches for the post. Let go the moment it touches.'),
        window: [0.8, 0.92], narrowing: 0.02,
        again: l('ရစ်သွားပြန်ပြီ။ ငါ ဖြည်လိုက်မယ်။ နောက်တစ်ခါ။', "It wound round again. I'll untwine it. Once more."),
        early: l('မထိသေးဘူး… လေထဲမှာ ကျန်ခဲ့တယ်။', "Not touching yet… it's left hanging in the air."),
      });
      if (!r.ok) { applyState(); return undefined; }
      F('tendrils', true); // card `touch`
      applyState();
      await D.say('hpohtaw', L.tendrilDone, { face: 'happy' });
    }
    // S · the lane's talk: let it pass, or take it in (Maya asks; she doesn't tell)
    if (!F('lanes')) {
      await D.say('hpohtaw', L.voices, { face: 'sad' });
      await D.say('maya', L.voicesMaya, { face: 'think' });
      const r = await sort({
        who: 'hpohtaw',
        title: l('ကြားရုံ ကြားထားမလား၊ နားထောင်မလား', 'Let it pass, or take it in?'),
        hint: l('ဦးနဲ့ ဆိုင်ပြီး ဦး လုပ်ပေးနိုင်တာကိုပဲ နားထောင်ပါ', 'Take in only what is his to act on'),
        baskets: [{ id: 'pass', my: 'ကြားရုံ ကြားထား', en: 'let it pass', icon: 'wind' }, { id: 'take', my: 'နားထောင်', en: 'take it in', icon: 'ear' }],
        cards: [
          { id: 'strange', goes: 'pass', my: '"အဘိုးကြီး တစ်မျိုးဖြစ်နေပြီ"', en: '"The old man\'s gone strange."' },
          { id: 'hates', goes: 'pass', my: '"လူမုန်းတယ်တဲ့"', en: '"They say he hates people."' },
          { id: 'price', goes: 'pass', my: '"လမ်းထိပ်ဆိုင် ဈေးတက်ပြီ"', en: '"The corner shop put its prices up."' },
          { id: 'bulbs', goes: 'take', my: '"ဦးရေ… ဒီနှစ် ပန်းဥ ရှိသေးလား"', en: '"Uncle… any bulbs this year?"' },
          { id: 'beans', goes: 'take', my: '"ဦးပဲနွယ် ကျုပ်ဘူးစင်ပေါ် တက်လာပြန်ပြီနော်"', en: '"Uncle, your beans are up my gourds again!"' },
        ],
        wrong: l('အဲဒါ ငါ ဘာလုပ်ပေးနိုင်လို့လဲ… အာကာ့သွားပါစေ။', 'What could I do about that… let it blow past.'),
      });
      if (!r.ok) return undefined;
      await D.say('hpohtaw', L.beansCall, { face: 'smile', emote: 'wave' });
      await D.say('hpohtaw', L.lanesDone, { face: 'think' });
      F('lanes', true); // card `take`
    }
    // the bulbs: nothing stays; give while it's good (both "take it in" voices were the gourd aunty's)
    if (!F('bulbs')) {
      await D.say('hpohtaw', L.hpBulbs, { face: 'smile' });
      check('bulbs');
      story.give('bulbs');
      F('bulbs', true);
      applyState();
    }
    // T · his talk; the gate stone is his (Step back)
    if (story.talk.waiting(TALK_D10_HPOHTAW.id)) return D.say('hpohtaw', L.hpWait, { face: 'think' });
    story.use('mug');
    await D.say('maya', L.mugDown, { face: 'smile' });
    const r = await story.talk.run(TALK_D10_HPOHTAW);
    if (!r.won) { await D.say('hpohtaw', L.hpWait, { face: 'think' }); return undefined; }
    F('hpTalk', true);
    // close: the padlock hung on the post, the gate a hand-width open, his bench turned to the beds
    F('ch16Done', true);
    gate.ring();
    applyState();
    hpBench.setTurn(0); hpBench.turnTo(Math.PI);
    ensureCast();
    await D.say('maya', L.hisGate, { face: 'smile' });
    await D.say('hpohtaw', L.hpAfter, { face: 'happy' });
    return undefined;
  }

  // =============================================================================================
  // 6 · chapter 17 · the offer (`paperstore`), Ko Phyo's tea break (`kilntea`), dusk, the window table
  // =============================================================================================
  async function offerTalk() {
    const kp = people.get('kophyo');
    await D.say('kyinyein', L.kn1.slice(0, 2), { face: 'smile' });
    check('wet'); // the beam reads 11 (rumour `wet`, true)
    await D.say('kyinyein', L.kn1.slice(2), { face: 'smile' });
    await D.say('kyinyein', L.knCan, { face: 'smile' });
    await D.say('maya', L.mayaDoors, { face: 'think' });
    F('offer', true); // card `doors`
    if (kp) await D.say('kophyo', L.kpOff, { face: 'think' });
    // he carries the can out with his empty sacks
    if (kp && story.inRoom === 'paperstore') {
      const dr = story.room?.spots?.door || { x: 0, z: 3.2 };
      walkSure('kophyo', dr.x, dr.z - 0.2, 1.4).then(() => { if (story.inRoom === 'paperstore') story.remove('kophyo'); });
    }
    applyState();
  }
  async function kpTalk() {
    const room = story.inRoom;
    if (room === 'paperstore') return F('offer') ? D.say('kophyo', [L.kpMutter], { face: 'think' }) : offerTalk();
    if (room === 'kilntea') {
      if (F('dusk') && !F('kpEndDone')) { await duskTable(); return closeLater(); }
      if (F('kpEndDone')) return D.say('kophyo', L.kpAfter, { face: 'happy' });
      if (!F('kpMet')) {
        await D.say('kophyo', L.kp1, { face: 'think' });
        F('kpMet', true);
        // after his cup he goes back to his cart (the place is said, not shown)
        const dr = story.room?.spots?.door || { x: 0, z: 3.2 };
        walkSure('kophyo', dr.x, dr.z - 0.2, 1.3).then(() => { if (story.inRoom === 'kilntea') story.remove('kophyo'); });
        return undefined;
      }
      return D.say('kophyo', [L.kpMutter], { face: 'think' });
    }
    // outdoors, at his cart on the south kerb
    if (F('ch17Done')) return D.say('kophyo', L.kpAfter, { face: 'happy' });
    if (!F('ch16Done')) return D.say('kophyo', L.kpNotYet, { face: 'smile' });
    if (!F('dusk')) return goDusk();
    if (!squareDone()) return D.say('kophyo', [L.kpMutter], { face: 'think' });
    setTimeout(goInside, 60);
    return undefined;
  }
  async function goDusk() {
    // she sits on the crate; a page corner folds over: dusk (scripted), lamps round the square
    await walkMaya(P.crate.x + 0.7, P.crate.z - 0.2);
    faceMaya(R.store.x, R.store.z);
    await pageTurn(game, async () => {
      F('dusk', true);
      setHour(HOUR.dusk);
      applyState();
    });
    F('noteDown', true); // Ko Kaung had decided before he ever spoke to her
    await D.say('maya', L.duskClasp, { face: 'smile' });
    check('clasp');
  }
  /** 6.3 · one dusk look from the kerb. */
  async function lookSquare(id) {
    const s = SQUARE_LOOKS.find((x) => x.id === id);
    if (!s) return;
    await scene(async () => {
      if (id === 'locks') call(store.lockDoor, 'jiggle');
      if (id === 'steps') {
        // Maung Nge crosses the square with a late parcel; the curtain jerks
        const mn = people.get('maungnge');
        if (mn) {
          mn.job = null; mn.life = null;
          placePerson('maungnge', { ...P.mnFrom, h: Math.PI / 2 });
          story.walkPerson('maungnge', P.mnTo.x, P.mnTo.z, 1.2);
        }
        await wait(900);
        call(store.lampWindow, 'jerk');
        await D.say('kyinyein', L.knCurtain, { face: 'surprised' });
        await D.say('maungnge', L.mnParcel, { face: 'happy' });
      }
      await D.say('maya', [L.heardWas(s.pencil), s.gold], { face: 'think' });
      F(`sq.${id}`, true);
      if (s.rumour) check(s.rumour);
      if (squareDone()) {
        await D.say('maya', L.squareDone, { face: 'think' });
        store.setShutter(1); // the shutter rattles down
        call(game.audio, 'play', 'thud');
      }
    });
    if (squareDone()) setTimeout(goInside, 120);
  }
  async function goInside() {
    if (F('kpEndDone') || story.inRoom || game.busy) return;
    const kp = people.get('kophyo');
    const ok = await scene(async () => {
      if (kp && Math.hypot(story.foot.pos.x - kp.p.root.position.x, story.foot.pos.y - kp.p.root.position.z) > 3) await walkMaya(P.crate.x + 0.7, P.crate.z - 0.2);
      await D.say('kophyo', L.kpTrip, { face: 'think' });
      can.root.visible = false;
      bale.root.visible = false;
      await D.say('kophyo', L.kpInside, { face: 'smile' });
    });
    if (ok) await story.enter('kilntea', { fast: true });
  }
  /** 6.4-6.7 · at the window table, dusk: match, the hook, the talk, the true weight. */
  async function duskTable() {
    const spots = story.room?.spots || {};
    if (!F('matched')) {
      const r = await match({
        title: l('သူ့မှာ ရှိတာနဲ့ အဲဒါနဲ့အတူ နေ့တိုင်း ပါလာတာ', 'What he has, and what comes with it every day'),
        hint: l('ဘယ်ဘက်က ရင်ပြင်ကနေ မြင်ခဲ့တာ။ ညာဘက်က အဲဒါရဲ့ အခ။', 'Left: what the square showed. Right: what it costs him.'),
        pairs: [
          { left: { my: 'သော့ သုံးလုံး', en: 'Three locks', icon: '🔒' }, right: l('ရှိတာ ဆုံးရှုံးမှာ ကြောက်တာ', 'fear of losing what he has') },
          { left: { my: 'တစ်ညလုံး လင်းနေတဲ့ မီး', en: 'A lamp lit all night', icon: 'lamp' }, right: l('အမှန် ပေါ်လာမှာ စိုးရိမ်တာ', 'worry the truth will come out') },
          { left: { my: 'ခြေသံကြားရင် လန့်တာ', en: 'Starting at footsteps', icon: '👣' }, right: l('လူတွေ သိသွားမှာ သံသယ', 'suspicion people will find out') },
        ],
        shuffle: true,
      });
      if (!r.ok) return;
      await D.say('maya', L.cards2, { face: 'think' });
      await D.say('kophyo', L.matched, { face: 'surprised' });
      F('matched', true); // card `lane`
    }
    if (!F('weighed')) {
      // the carters' hook on the middle beam; his own hand steelyard, a weight Ko Lwin stamped
      if (spots.kophyoHold) await walkSure('kophyo', spots.kophyoHold.x, spots.kophyoHold.z, 1.2, 6000);
      if (spots.mayaHold) { await walkMaya(spots.mayaHold.x, spots.mayaHold.z, 6000); faceMaya(spots.kophyoHold?.x ?? 2.4, spots.kophyoHold?.z ?? 0); }
      await D.say('teauncle', L.tuHook, { face: 'smile' });
      await D.say('kophyo', L.kpWeight, { face: 'think' });
      const r = await hold({
        mode: 'scale', skin: 'scale', rounds: 2, who: 'kophyo',
        title: l('ခြောက်ခြောက် ချိန်မယ်', 'Weigh it dry'),
        hint: l('ချိန်ခွင်တံကို ဖိထားပြီး ညီအောင် ထိန်းပါ။ အပ်ငြိမ်သွားမှ ဖတ်ရမယ်။', 'Hold the beam level. Read it only when the needle is still.'),
        band: 0.12, seconds: 2, drift: 0.6,
        readouts: [l('၁ ပိဿာ — အတိအကျ', '1 viss — exact'), l('၉ ပိဿာ', '9 viss')],
        can: L.canNot,
      });
      if (!r.ok) return;
      await D.say('kophyo', L.kpNine, { face: 'think' });
      F('weighed', true); // card `nine`
      if (spots.kophyo) await walkSure('kophyo', spots.kophyo.x - 0.15, spots.kophyo.z + 0.5, 1.2, 6000);
      // and Maya back to the window table beside him (so the talk's two-shot has them side by side, not in a line)
      if (spots.maya && spots.kophyo) { await walkMaya(spots.maya.x + 0.35, spots.maya.z + 0.45, 5000); faceMaya(spots.kophyo.x - 0.15, spots.kophyo.z + 0.5); }
    }
    if (!F('kpTalk')) {
      if (story.talk.waiting(TALK_D10_KOPHYO.id)) { await D.say('kophyo', L.kpWait, { face: 'think' }); return; }
      story.use('mug');
      const r = await story.talk.run(TALK_D10_KOPHYO);
      if (!r.won) { await D.say('kophyo', L.kpWait, { face: 'think' }); return; }
      F('kpTalk', true);
    }
    await D.say('kophyo', L.kpEnd, { face: 'happy' });
    story.give('trueweight');
    F('kpEndDone', true);
    await D.say('maya', L.tuStools, { face: 'smile' });
  }
  function closeLater() { if (F('kpEndDone') && !F('ch17Done')) setTimeout(closeSeventeen, 80); }
  /** 6.7 · out on the square: the can on the trader's stair, then the night vignette (6 s, no input). */
  async function closeSeventeen() {
    if (F('ch17Done') || closing) return;
    closing = true;
    try {
      if (story.inRoom) { if (story.talking || game.busy) { closing = false; setTimeout(closeSeventeen, 300); return; } await story.exit({}); }
      await wait(400);
      ensureCast();
      await scene(async () => {
        const kp = people.get('kophyo');
        if (kp) {
          kp.job = null;
          can.root.position.set(R.stair.x, R.stair.y, R.stair.z); can.root.visible = false;
          // seen from the public kerb: the store front, its stair, Ko Phyo carrying the can to the bottom step
          game.rig.shot(new THREE.Vector3(R.stair.x + 1.2, 3.4, R.stair.z + 8.6), new THREE.Vector3(R.stair.x - 1.4, 1.5, R.stair.z - 0.6), 1.2);
          await walkSure('kophyo', R.stairStand.x, R.stairStand.z, 1.3, 9000);
          can.root.visible = true;
          await D.say('kophyo', L.kpThanks, { face: 'smile' });
          call(store.lockDoor, 'jiggle');
          await D.say('kyinyein', L.knThanks, { face: 'think' });
          await walkSure('kophyo', P.kp.x, P.kp.z, 1.3, 9000);
          kp.p.root.rotation.y = P.kp.h;
        }
        // the vignette: his lantern out first; across the square the window stays lit and the shadow walks
        game.rig.shot(new THREE.Vector3(P.cart.x + 2.2, 2.6, P.cart.z + 7.2), new THREE.Vector3((P.cart.x + R.store.x) / 2, 1.6, (P.cart.z + R.store.z) / 2), 1.6);
        await wait(1200);
        cart.setLit(0);
        call(kp?.p, 'setMood', 'down');
        call(kp?.p, 'setFace', 'blink', 99);
        store.setLit(1);
        call(store.lampWindow, 'silhouette', true);
        await wait(4800);
        await D.say('maya', L.vignette, { face: 'smile' });
        F('ch17Done', true);
        F('noteDown', true);
        can.root.visible = true;
      });
    } finally { closing = false; }
  }
  let closing = false;

  // =============================================================================================
  // 8.2 · Ko Kaung in the kiln's packing room (both stones his)
  // =============================================================================================
  async function koTalk() {
    if (F('kaungTalk')) return D.say('kaung', L.koAfter, { face: 'happy' });
    if (!F('kaungMet')) {
      await D.say('kaung', [L.ko[0]], { face: 'smile' });
      await D.say('kaung', [L.ko[1]], { face: 'think' });
      hear('lamp');
      await D.say('kaung', L.koNote, { face: 'shy' });
      const rep = save.flags['d2.boardNote'] === 1 ? ['six', 'teacher', 'four'][save.flags['d2.boardReply']] : null;
      await D.say('kaung', [L.koReply[rep || 'none']], { face: 'think' });
      await D.say('kaung', L.koFound, { face: 'happy' });
      F('kaungMet', true);
    }
    if (story.talk.waiting(TALK_D10_KAUNG.id)) return D.say('kaung', L.koWait, { face: 'smile' });
    // the mug goes on the warm brick ledge where the kiln's back wall comes through
    const sp = story.room?.spots?.kokaungLedge;
    if (sp) await walkSure('kaung', sp.x, sp.z, 1.1, 6000);
    story.use('mug');
    const r = await story.talk.run(TALK_D10_KAUNG);
    if (r.won) F('kaungTalk', true);
    else await D.say('kaung', L.koWait, { face: 'smile' });
    return undefined;
  }

  // =============================================================================================
  // 8.3 · the board at home: Ma Wint War from the sorting room's door; the gap, left as it is
  // =============================================================================================
  async function boardTap() {
    await scene(async () => {
      faceMaya(P.board.x, P.board.z);
      if (!both()) { await D.say('maya', L.boardEarly, { face: 'think' }); return; }
      F('noteDown', true);
      await D.say('maya', L.boardLook, { face: 'surprised' });
      if (F('board')) return;
      await D.say('maya', [L.gapQ], { face: 'think' });
      for (;;) {
        const i = await D.choose(L.gapChoices);
        if (i === 0) { await D.say('maya', L.gapSeal, { face: 'think' }); continue; }
        if (i === 1) { await D.say('maya', L.gapAll, { face: 'think' }); continue; }
        break;
      }
      await D.say('maya', L.gapLeave, { face: 'happy' });
      F('board', true);
      F('replyLine', true);
      await showSlip(game, L.replyLine, { title: l('စာကို ပြန်စာ · ခဲတံ', 'Reply to the letter · pencil') });
      await D.say('maya', L.writeHome, { face: 'smile' });
    });
  }
  function checkBoardApproach() {
    if (!both() || F('wwEve') || story.talking || game.busy || story.inRoom || !story.foot.active) return;
    const p = story.foot.pos;
    if (Math.hypot(p.x - P.board.x, p.y - P.board.z) > 4.5) return;
    const ww = people.get('wintwar');
    if (!ww) return;
    F('wwEve', true);
    ww.onTalk = async () => { await say('wintwar', L.wwEvening, { face: 'smile' }); };
    story.talkTo(ww).finally(() => { ww.onTalk = null; });
  }

  // =============================================================================================
  // 9 · the night page, at the writing desk inside the Writing Room
  // =============================================================================================
  let nightBusy = false;
  async function night() {
    if (nightBusy || F('done')) return;
    nightBusy = true;
    try {
      await wait(900);
      const spots = story.room?.storyLayer?.spots || story.room?.spots || {};
      const sp = spots.mayaDesk;
      if (sp && game.walker) { await new Promise((r) => { let d = false; const fin = () => { if (!d) { d = true; r(); } }; game.walker.goTo(sp.x, sp.z, fin); setTimeout(fin, 6000); }); }
      await nightPage(story, {
        day: 10, hour: HOUR.night,
        truth: { q: L.nightQ, choices: L.nightChoices, right: 1, wrong: L.nightWrong },
        before: async () => {
          // the bulbs go in beside Toe Toe's beans, under the window (five nights, story days)
          await D.say('maya', L.bulbsPlant, { face: 'smile' });
          story.take('bulbs', 1, { quiet: true });
          save.home.bed = { ...(save.home.bed || {}), bulbs: { planted: 10, blooms: 15 } };
          // where the notebook sleeps tonight: everyone spoken to today
          const who = ['hpohtaw', 'kophyo', 'gourdaunty', 'kaung'];
          if (F('mnN')) who.push('maungnge');
          if (F('offer')) who.push('kyinyein');
          await D.say('maya', [L.sleepQ], { face: 'smile' });
          const i = await D.choose(who.map((id) => castById(id)?.name || NAMES[id] || l(id, id)));
          save.notebook.sleptAt.push({ day: 10, who: who[i] });
          story.persist();
        },
        stamps: [15, 16, 17],
        stampText: l([L.stamp15.my, L.stamp16.my, L.stamp17.my].join('\n\n'), [L.stamp15.en, L.stamp16.en, L.stamp17.en].join('\n\n')),
        extra: L.page17b,
        tomorrow: L.tomorrow,
        turn: false,
      });
      F('done', true);
      if (story.inRoom) await story.exit({ instant: true });
      await story.turnPage();
    } finally { nightBusy = false; }
  }

  // =============================================================================================
  // taps on things (no marker: the props themselves); a person nearer the tap always wins
  // =============================================================================================
  const T = set.targets;
  function activeTargets() {
    const out = [];
    if (F('hpSit') && !F('ch16Done')) {
      for (const g of GATE_LOOKS) if (!F(`look.${g.id}`)) out.push({ ...T[g.id], fn: () => lookGate(g.id) });
      out.push({ ...T.hook, fn: () => scene(() => D.say('maya', L.hook, { face: 'think' })) });
    }
    if (F('dusk') && !squareDone()) {
      for (const s of SQUARE_LOOKS) {
        if (F(`sq.${s.id}`)) continue;
        if (s.id === 'steps') { if (F('sq.lamp')) out.push({ ...T.lamp, fn: () => lookSquare('steps') }); continue; }
        out.push({ ...T[s.id], fn: () => lookSquare(s.id) });
      }
    }
    if (F('dusk') && squareDone()) {
      out.push({ ...T.shutter, fn: () => scene(() => D.say('maya', L.storeShut, { face: 'think' })) });
      if (F('ch17Done')) out.push({ ...T.locks, fn: () => scene(() => D.say('kyinyein', L.knAfter17, { face: 'think' })) });
    }
    out.push({ ...board.target, fn: () => boardTap() });
    return out;
  }
  async function lookGate(id) {
    const g = GATE_LOOKS.find((x) => x.id === id);
    if (!g) return;
    await scene(async () => {
      if (id === 'bell') gate.ring();
      await D.say('maya', [L.heardWas(g.pencil), g.gold], { face: 'think' });
      F(`look.${id}`, true);
      if (g.rumour) check(g.rumour);
      if (gateLooked() && !F('looked')) { F('looked', true); await D.say('maya', L.looked, { face: 'think' }); }
    });
  }
  const tapHook = (x, y) => {
    if (story.talking || game.busy || story.inRoom || !story.foot?.active) return false;
    const mp = story.foot.pos;
    let best = null, bd = 46;
    for (const t of activeTargets()) {
      if (Math.hypot(mp.x - t.x, mp.y - t.z) > t.r) continue;
      const q = game.rig.project(v3.set(t.x, t.y, t.z), game.viewW, game.viewH);
      if (!q) continue;
      const d = Math.hypot(q.x - x, q.y - y);
      if (d < bd) { bd = d; best = t; }
    }
    if (!best) return false;
    for (const e of people.values()) for (const h of [0.4, e.p.height * 0.75]) {
      const q = game.rig.project(v3.set(e.p.root.position.x, h, e.p.root.position.z), game.viewW, game.viewH);
      if (q && Math.hypot(q.x - x, q.y - y) < bd - 4) return false;
    }
    best.fn();
    return true;
  };
  story.tapHooks.push(tapHook);

  // =============================================================================================
  // rooms (INDEX 13.1 / 13.2): who is inside, what each tap does
  // =============================================================================================
  async function gourdRoom(room) {
    if (F('hpSit') && !F('ch16Done')) return; // she is out at her trellis
    const sp = room?.spots?.aunty || { x: -1.3, z: -2.05, h: 0.6 };
    walkOn('gourdaunty', sp, room?.scene || game.scene);
  }
  async function enterRoom(id, room) {
    if (id === 'gourdhouse') return gourdRoom(room);
    if (id === 'paperstore' && !F('offer') && !F('dusk')) {
      await wait(800);
      const kn = people.get('kyinyein');
      if (kn && !story.talking) await story.talkTo(kn);
      return undefined;
    }
    if (id === 'kilntea') {
      if (F('dusk') && !F('kpEndDone')) {
        await wait(700);
        const kp = people.get('kophyo');
        if (kp && !story.talking) { await story.talkTo(kp); closeLater(); }
      } else if (F('offer') && !F('kpMet') && people.has('kophyo')) story.bark('kophyo', L.kpMutter, 2600);
      return undefined;
    }
    if (id === 'about' && both() && F('board') && !F('done')) return night();
    return undefined;
  }
  function station(sid, ctx) {
    const room = ctx?.room;
    const sayM = (lines) => { scene(() => D.say('maya', lines, { face: 'think' })); return true; };
    if (room === 'gourdhouse') {
      const ga = people.get('gourdaunty');
      if (sid === 'aunty' && ga) { story.talkTo(ga); return true; }
      if (sid === 'gaJar') { scene(() => say(ga ? 'gourdaunty' : 'maya', L.gaJar, { face: 'smile' })); return true; }
      if (sid === 'fritters') return sayM(L.gaFritters);
      if (sid === 'window') return sayM(L.gaWindow);
    }
    if (room === 'paperstore') {
      if (sid === 'scale') return sayM(L.storeScale);
      if (sid === 'rope') return sayM(L.storeRope);
    }
    if (room === 'kilntea') {
      const tu = people.get('teauncle');
      if (sid === 'teauncle' && tu) { story.talkTo(tu); return true; }
      if (sid === 'calendar') { scene(async () => { await D.say('maya', L.calendar, { face: 'think' }); check('market'); }); return true; }
      if (sid === 'hook' && !F('dusk')) { if (tu) scene(() => D.say('teauncle', [L.tu[0]], { face: 'smile' })); return true; }
      if (sid === 'windowTable' && people.get('kophyo')) { story.talkTo(people.get('kophyo')); return true; }
    }
    if (room === 'packroom') {
      if (sid === 'tally') return sayM(L.koTally);
      if (sid === 'pots') { scene(async () => { await D.say('maya', L.koPots, { face: 'think' }); check('kilncold'); }); return true; }
      if (sid === 'trials') return sayM(L.koTrials);
      if (sid === 'ledge') return sayM(L.koLedge);
    }
    return false;
  }

  // =============================================================================================
  // test hooks (the tester drives the day with these; nothing here is reachable in play)
  // =============================================================================================
  function skipTo(beat) {
    const k = BEATS.findIndex((b) => b[0] === beat);
    if (k < 0) return `no beat ${beat}; beats: ${BEATS.map((b) => b[0]).join(' ')}`;
    for (let i = 0; i < k; i++) for (const f of BEATS[i][1]) F(f, true);
    if (k > BEATS.findIndex((b) => b[0] === 'bulbs') && !story.has('bulbs') && !F('done')) story.give('bulbs', 1, { quiet: true });
    if (F('kpEndDone') && !story.has('trueweight')) story.give('trueweight', 1, { quiet: true });
    if (!story.companions.has('ember')) story.companions.add('ember');
    setHour(F('dusk') ? HOUR.dusk : HOUR.day);
    applyState();
    ensureCast();
    const where = {
      morning: { x: ab.x + 0.4, z: ab.z + 1.6 }, arrived: { x: 258, z: 140.5 }, hpSit: { x: 241.2, z: 99.3 }, looked: { x: 241.5, z: 101.4 },
      sorted: { x: 241.2, z: 99.3 }, tendrils: { x: 241.2, z: 99.3 }, lanes: { x: 241.2, z: 99.3 }, bulbs: { x: 241.2, z: 99.3 }, ch16Done: { x: 241.2, z: 99.3 },
      offer: R.offerStand, kpMet: R.teaStand, dusk: { x: P.kp.x + 1.6, z: P.kp.z + 0.2 },
      inside: { x: P.crate.x + 0.7, z: P.crate.z - 0.2 }, matched: R.teaStand, weighed: R.teaStand,
      kpTalk: R.teaStand, ch17Done: R.teaStand, kaung: R.kaungStand,
      board: { x: story.board.stand.x - 0.3, z: story.board.stand.z + 0.9 }, night: { x: ab.x, z: ab.z + 1.4 },
    }[beat];
    if (where && ow && !story.inRoom) ow.jump(where.x, where.z, Math.PI);
    return `day 10 at ${beat}`;
  }
  window.__day10 = {
    beats: BEATS.map((b) => b[0]),
    skipTo,
    P,
    set,
    look: (id) => (GATE_LOOKS.some((g) => g.id === id) ? lookGate(id) : lookSquare(id)),
    tap: (id) => activeTargets().find((t) => t === T[id] || (t.x === T[id]?.x && t.z === T[id]?.z))?.fn(),
    board: () => boardTap(),
    night: () => night(),
    state: () => Object.fromEntries(Object.entries(save.flags).filter(([k]) => k.startsWith('d10.'))),
  };

  // =============================================================================================
  // the day module
  // =============================================================================================
  let tick = 0;
  return {
    talk,
    roomOpts(id) { return id === 'kilntea' && F('dusk') ? { variant: 'dusk' } : null; },
    roomCast(id) {
      if (id === 'gourdhouse') return []; // the aunty is placed by enterRoom (she has no cast.js entry yet)
      if (id === 'paperstore') {
        if (F('dusk')) return [];
        return [{ id: 'kyinyein', spot: F('offer') ? 'kyinyein' : 'kyinyeinScale' }, ...(F('offer') ? [] : [{ id: 'kophyo', spot: 'kophyo' }])];
      }
      if (id === 'kilntea') {
        if (F('dusk')) return [{ id: 'teauncle', spot: 'teauncle' }, ...(F('kpEndDone') ? [] : [{ id: 'kophyo', spot: 'kophyo' }])];
        return [{ id: 'teauncle', spot: 'teauncle' }, { id: 'carter1', spot: 'carter1' }, { id: 'carter2', spot: 'carter2' },
          ...(F('offer') && !F('kpMet') ? [{ id: 'kophyo', spot: 'kophyo' }] : [])];
      }
      if (id === 'packroom') return [{ id: 'kaung', spot: 'kokaung' }];
      return undefined;
    },
    enterRoom(id, room) { return enterRoom(id, room); },
    leaveRoom(id) { if (id === 'gourdhouse') dropWalkOn('gourdaunty'); },
    station,
    /** The page turns in place: this page's props, keep-out boxes, doors, people and hooks go away. */
    dispose() {
      set.dispose();
      board.dispose();
      const k = story.tapHooks.indexOf(tapHook);
      if (k >= 0) story.tapHooks.splice(k, 1);
      if (ow && light0) ow.lightDesk = light0;
      for (const id of ['gourdaunty', 'carter']) dropWalkOn(id);
      for (const id of ['wintwar', 'hpohtaw', 'maungnge', 'kophyo']) if (people.has(id) && !people.get(id).local) story.remove(id);
      call(game.day, 'set', null);
      if (window.__day10) delete window.__day10;
    },
    async start() {
      if (F('done')) return;
      if (!F('morning')) {
        if (story.inRoom) await story.exit({ instant: true });
        if (!story.foot.active) await story.foot.toFoot();
        story.refreshHud?.();
        const mp = game.maya.root.position;
        if (Math.hypot(mp.x - ab.x, mp.z - ab.z) > 14 && ow) ow.jump(ab.x + 0.4, ab.z + 1.6, 0);
        await morning();
      }
    },
    update(dt, t) {
      set.update(dt, t);
      if (story.inRoom) return;
      checkArrival();
      checkBoardApproach();
      tick -= dt;
      if (tick <= 0) {
        tick = 0.5;
        ensureCast();
        // coming home after both chapters: his note is already off the board
        if (both() && !F('noteDown')) { const p = mayaXZ(); if (Math.abs(p.x) < 26 && Math.abs(p.z) < 18) F('noteDown', true); }
      }
    },
  };
}
