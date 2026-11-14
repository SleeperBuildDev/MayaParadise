// Day 13 (Hearth Row and the Blank Page) — chapters 21 မကြိုက်ဆုံးအရာ (The Thing I Dislike Most) and
// 22 ဘာသာရေး (Religion); main-quest beat: the road home appears on the last leaf. Script: day13-spec.md
// (draft 2); rooms: INDEX 13.2; flags: INDEX 9 (`d13.road`, `d13.ch21Done`, `d13.ch22Done`, `d13.signed.*`).
//
// Lesson, ch 21 (p99–102): everyone has a touchy spot; knowing it and minding it is your own job. Study it in
//   order: why it happens, how to stop it, how to hold it if it happens anyway. Seeing cause and effect ends
//   the pointless hatred, not the dislike, and a cause is never an excuse.
// Lesson, ch 22 (p103–109): take the label off and test a teaching yourself instead of taking it on authority;
//   what you want from the people around you, keep yourself; restraint (quiet) is an aid to seeing what is,
//   as it is, not a punishment.
//
// The day, in order (any order between the two chapters; the main beat after ch 22):
//   morning      Writing Room door (outdoors): Ma Wint War, the notebook line, U Hpo Htaw's letter, Maung
//                Arkar's note, the Guest Cup and the Little Lid lift off, rumour `empty` in pencil.
//   ch 21        bakery (room `bakery`): Daw Khin May (card `cover`), a customer (rumour `shuttle`) ·
//                Maung Arkar at his cart outside · the back step in the yard behind the bakery: Ei Mon ·
//                she takes Maya into the proving room (room `provingroom`): recall (act), she names her sore
//                spot · the loom shed (room `loomshed`): Sithu and Yadanar, their own words (proof `shuttle`)
//                · back in the proving room: their words carried unedited, sort (act), Ei Mon's talk ·
//                C2: the bundles carried back (the peek at the oven vents), laid on their looms, six tags.
//   ch 22        the Diary Garden's last hedge (U Hpo Htaw) · first step on the white (proof `empty`) · desk
//                `blank` (the one true line) · Daw Pwint on the lodge verandah · inside the lodge (room
//                `lodge`): the board (proof `scrubbed`), Maya says plainly what it is and covers the title,
//                Ko Pyae Sone's talk, five line scenes and signing, dusk spot rounds (din, quiet), they lift
//                the cover themselves.
//   main beat    Nay Chi knocks; everyone on the verandah; Maya holds back (held Step back) · the walk north;
//                footprints · the back cover's keyhole (the Own Key fits; not yet) · Maya inks the walked
//                line: road edge `blankHome` (gate `backCover`), proof `noroad`.
//   evening      Ma Wint War by the Post Office (the board: 6 notes) · the night page at the Writing Room
//                door: ✓22 stamped, 21 in pencil, save.day = 14.
// No markers anywhere: every "where" is said by someone or can be seen (the clack of the looms, the oven air
// at the back step, the lodge's smoke, the din through its shutters).
//
// Test hooks: window.__day13 = { skipTo(beat), go(place), run(flow), flags(), beats, state }.
// Burmese lines are drafts for Maya to proofread (they live in day13-lines.js and talks/day13.js).
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { recall } from './acts/recall.js';
import { sort } from './acts/sort.js';
import { nightPage, showLetter, showSlip, liftOff } from './post.js';
import { companionById } from './companions.js';
import { castById } from './cast.js';
import { createPerson } from './people.js';
import { coveredBundle } from './props5.js';
import { L } from './day13-lines.js';
import { buildWorld, P, ROAD, inBlank, tapDist } from './day13-world.js';
import { TALK_D13_EIMON, TALK_D13_PYAESONE } from './talks/day13.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const CUSTOMER_LOOK = { age: 'adult', build: 'mid', skin: 1, hair: 'bob', hairColor: 'brown', top: 'blouse', topColor: 'sky', bottom: 'htamein', bottomColor: 'brown', extras: ['satchel'], extraColor: 'tan' };
const MET = ['eimon', 'sithu', 'yadanar', 'khinmay', 'maungarkar', 'dawpwint', 'pyaesone', 'shwesin', 'moe', 'naychi'];
const BEATS = ['morning', 'hearth', 'proving', 'shed', 'carry', 'sort', 'talkEm', 'c2', 'returned', 'blank', 'desk', 'lodge', 'plain', 'psTalk', 'scenes', 'dusk', 'lift', 'naychi', 'walk', 'ink', 'night'];

export { SLEPT13 } from './day14-lines.js'; // tonight's hosts' lines (the copy Day 14's morning reads)

export async function create(story) {
  const { game, dialog: D, save } = story;
  const F = (k, v) => story.flag(`d13.${k}`, v);
  const W = buildWorld(story, { note: L.noteChalk });
  const v3 = new THREE.Vector3();
  const mine = new Set(); // outdoor people this page spawned (syncStreet keeps them in step with the flags)
  const scripted = new Set(); // outdoor people a running scene owns (syncStreet leaves them alone)
  let busy = false; // a scripted flow is running
  let queued = null; // a flow to start as soon as nothing else runs
  let disposed = false;
  let arriving = false; // Ei Mon leads Maya into the proving room right now
  let layPhase = false; // in the loom shed: waiting for Maya to lay the green bundle on Yadanar's loom
  let liftPhase = false; // in the lodge: the cover is theirs to lift
  let lodgeRunning = false; // the lodge sequence (6.6-6.8) is playing
  let carried = null; // the green-tied bundle in Maya's arms (C2)
  let customer = null; // the bakery customer (a walk-on Maya can talk to)
  let lastHour = undefined;
  const signedBoards = new WeakSet();

  // ---------------------------------------------------------------------------------------------
  // small helpers
  // ---------------------------------------------------------------------------------------------
  const met = (id) => F(`met.${id}`, true);
  /** A rumour heard: pencil on the map (map support: SHARED NEEDS), and its look-alike card can enter a hand. */
  function heard(id) {
    if (F(`rumour.${id}`)) return;
    F(`heard.${id}`, true);
    if (save.flags[`rumour.${id}`] !== 'checked') story.flag(`rumour.${id}`, 'pencil');
  }
  /** A rumour checked with her own eyes: the proof slip (its text in save.proofs) and the ink. */
  function proof(id) {
    if (F(`rumour.${id}`)) return;
    save.proofs[id] = L.proofs[id];
    F(`rumour.${id}`, true);
    story.flag(`rumour.${id}`, 'checked');
    story.give(`proof:${id}`);
  }
  /** Say a line as someone not in cast.js (the dialog shows the right name). */
  async function sayAs(id, name, lines, o = {}) {
    const p = D.say(id, lines, o);
    const el = document.querySelector('#dialog .dialog-name');
    if (el) el.textContent = tr(name);
    await p;
  }
  /** Walk someone to (x, z); never waits forever (a blocked path puts them there). */
  function walkTo(id, x, z, speed = 1.3, ms = 14000, h = null) {
    const e = story.people.get(id);
    if (!e) return Promise.resolve();
    e.job = null;
    return Promise.race([story.walkPerson(id, x, z, speed), wait(ms)]).then(() => {
      const q = story.people.get(id);
      if (!q) return;
      if (q.walking) q.walking = null;
      const pos = q.p.root.position;
      if (Math.hypot(pos.x - x, pos.z - z) > 0.7) pos.set(x, pos.y, z);
      q.ob.x = pos.x; q.ob.z = pos.z; q.home.x = pos.x; q.home.z = pos.z;
      if (h != null) { q.p.root.rotation.y = h; q.home.h = h; }
    });
  }
  const spotOf = (name) => story.room?.spots?.[name] || null;
  function walkToSpot(id, name, speed = 1.2) {
    const s = spotOf(name);
    return s ? walkTo(id, s.x, s.z, speed, 9000, s.h ?? null) : Promise.resolve();
  }
  function mayaTo(x, z, ms = 12000) {
    return new Promise((r) => { let done = false; const fin = () => { if (!done) { done = true; r(); } }; story.foot.walkTo(x, z, fin); setTimeout(fin, ms); });
  }
  /** Run a flow as a scene (letterbox on, taps go to the dialog); re-entrant inside a talk. */
  async function scene(fn) {
    if (busy) return;
    busy = true;
    const was = story.talking;
    story.talking = true;
    game.ui.cinema(true);
    try { await fn(); } catch (err) { console.error('day13', err); } finally {
      busy = false;
      story.talking = was;
      if (!was) { game.ui.cinema(false); game.rig.release(); }
    }
  }
  /** Talk to someone with a one-off handler (the low two-shot), as if the player had tapped them. */
  async function talkNow(id, fn) {
    const e = story.people.get(id);
    if (!e || story.talking) return scene(fn);
    const prev = e.onTalk;
    e.onTalk = async () => { e.onTalk = prev; await fn(); };
    await story.talkTo(e);
    if (e.onTalk !== prev) e.onTalk = prev;
  }
  const queue = (fn) => { queued = fn; };
  const look = () => {
    const h = desiredHour();
    if (h === lastHour || !game.day?.set) return;
    lastHour = h;
    game.day.set(h);
    game.applyDayLook();
  };
  function desiredHour() {
    if (nightBusy) return lastHour;
    const mp = game.maya.root.position;
    const blank = story.inRoom === 'lodge' || (!story.inRoom && inBlank(mp.x, mp.z));
    if (F('road')) return 19.0; // the evening, after the walk
    if (blank) return F('dusk') ? 19.3 : 18.0; // the Blank Page is always under the sunset
    return F('morning') ? 10.5 : 8.5;
  }

  // ---------------------------------------------------------------------------------------------
  // the people outdoors, as the flags say (indoor people come from roomCast)
  // ---------------------------------------------------------------------------------------------
  function streetCast() {
    const out = [];
    out.push(['wintwar', F('road') ? { x: P.post.x, z: P.post.z, heading: P.post.h } : { x: P.about.x + 2.6, z: P.about.z + 1.2, heading: -Math.PI / 2 }]);
    out.push(['maungarkar', { x: P.arkar.x, z: P.arkar.z, heading: P.arkar.h }]);
    if (!F('emMet')) out.push(['eimon', { x: P.emStep.x, z: P.emStep.z, heading: P.emStep.h }]);
    else if (F('c2') && !F('returned')) out.push(['eimon', F('peeked') ? { x: P.shedDoor.x + 0.9, z: P.shedDoor.z + 1.1, heading: -0.4 } : { x: P.backDoor.x + 1.0, z: P.backDoor.z + 0.9, heading: 0.3 }]);
    out.push(['hpohtaw', { x: P.hpohtaw.x, z: P.hpohtaw.z, heading: P.hpohtaw.h }]);
    if (!F('dpMet')) out.push(['dawpwint', { x: P.dpVerandah.x, z: P.dpVerandah.z, heading: P.dpVerandah.h, y: P.dpVerandah.y }]);
    return out;
  }
  function syncStreet() {
    if (disposed || story.inRoom) return;
    const want = new Map(streetCast());
    for (const id of [...mine]) {
      if (scripted.has(id)) continue;
      if (!want.has(id)) { story.remove(id); mine.delete(id); }
    }
    for (const [id, at] of want) {
      if (scripted.has(id)) continue;
      const e = story.people.get(id);
      if (e && mine.has(id)) {
        // moved since (e.g. Ma Wint War to the Post Office): put them on their new mark
        if (Math.hypot(e.home.x - at.x, e.home.z - at.z) > 3 && !e.walking) { story.remove(id); mine.delete(id); } else { e.p.root.visible = true; continue; }
      } else if (e) continue; // someone else's (a district's own people)
      const n = story.spawn(id, at);
      if (!n) continue;
      if (at.y) n.p.root.position.y = at.y;
      mine.add(id);
    }
    // Ma Wint War keeps to her doorstep; Maung Arkar to his cart
    if (story.people.get('maungarkar') && mine.has('maungarkar')) story.setJob('maungarkar', { area: { x: P.cart.x + 0.6, z: P.cart.z + 0.9, r: 1.6 }, spot: { x: P.arkar.x, z: P.arkar.z, h: P.arkar.h }, mood: 'work', workChance: 0.7, workFor: [6, 12] });
    // C2: the green-tied bundle is in Maya's arms until it is on Yadanar's loom (a reload gives it back)
    if (F('c2') && !F('returned') && !F('greenLaid') && !story.carrying) carryGreen();
    syncDoors();
  }
  function syncDoors() {
    W.setDoor('provingroom', !!F('emMet'));
    W.setDoor('lodge', !!F('dpMet'));
  }
  function carryGreen() {
    if (carried) { carried.root.parent?.remove(carried.root); call(carried, 'dispose'); }
    carried = coveredBundle({ tie: 'green' });
    (game.maya.root.parent || game.world.scene).add(carried.root);
    story.carry(carried.root, { axis: 'x', lift: 0.62, speed: 0.75 });
  }
  function dropGreen() {
    if (story.carrying && carried && story.carrying === carried.root) story.carry(null, { remove: true });
    if (carried) { carried.root.parent?.remove(carried.root); call(carried, 'dispose'); carried = null; }
  }

  // ---------------------------------------------------------------------------------------------
  // morning (4)
  // ---------------------------------------------------------------------------------------------
  const sansSign = (t) => ({ my: t.my.replace(/\s*— [^\n]*$/, ''), en: t.en.replace(/\s*— [^\n]*$/, '') });
  async function morning() {
    game.day?.set?.(8.5); game.applyDayLook(); lastHour = 8.5;
    await D.say('wintwar', L.ww1, { face: 'smile' });
    const slept = save.notebook.sleptAt.filter((s) => s.day === 12).pop();
    await showSlip(game, (slept && L.slept12[slept.who]) || L.slept12other, { kind: 'notebook' });
    await showLetter(game, sansSign(L.hptNote), { from: 'hpohtaw' });
    await D.say('wintwar', L.ww2, { face: 'happy' });
    await showLetter(game, sansSign(L.myNote), { from: 'maungarkar' });
    await D.say('maya', L.lift, { face: 'surprised' });
    for (const id of ['cup', 'lid']) {
      const c = companionById(id);
      if (!c || story.companions.has(id)) continue;
      await liftOff(game, c);
      story.companions.add(id);
    }
    await D.say('maya', L.liftMaya, { face: 'smile' });
    await D.say('wintwar', L.ww3, { face: 'think' });
    heard('empty');
    F('morning', true);
  }

  // ---------------------------------------------------------------------------------------------
  // ch 21 · Ei Mon
  // ---------------------------------------------------------------------------------------------
  async function emStep() { // 5.2, outdoors on the back step
    const em = story.people.get('eimon');
    await D.say('eimon', L.em1, { face: 'worried' });
    for (;;) {
      const i = await D.choose(L.emChoices);
      if (i === 0) { await D.say('eimon', L.emOpen, { face: 'worried' }); await D.say('maya', L.emOpenMaya, { face: 'think' }); continue; }
      if (i === 1) { await D.say('eimon', L.emSmall, { face: 'hot', emote: 'fists' }); await D.say('maya', L.emSmallMaya, { face: 'think' }); continue; }
      break;
    }
    await D.say('eimon', L.emYes, { face: 'sad' });
    F('emMet', true);
    await D.say('eimon', L.emInside, { face: 'think' });
    // she picks up both bundles herself and goes up the three steps; Maya follows her in
    for (const b of W.props.bundles) b.root.visible = false;
    call(W.props.step, 'setOpen', 0.9);
    syncDoors();
    scripted.add('eimon');
    await walkTo('eimon', P.backDoor.x + 0.1, P.backDoor.z + 0.25, 1.1, 5000);
    if (em) em.p.root.visible = false;
    arriving = true;
    const ok = await story.enter('provingroom', { at: 'mayaEnter', fast: true });
    if (!ok) { arriving = false; scripted.delete('eimon'); if (em) em.p.root.visible = true; }
  }
  async function provingArrive() { // inside: she takes her seat; the recall
    arriving = false;
    scripted.delete('eimon');
    await scene(async () => {
      await Promise.all([walkToSpot('eimon', 'eimonSeat', 1.0), (async () => { const s = spotOf('mayaSeat'); if (s) await mayaTo(s.x + 0.2, s.z + 0.35, 5000); })()]);
    });
    await talkNow('eimon', provingRecall);
  }
  async function provingRecall() { // 5.3
    const r = await recall({ ...L.recall, who: 'eimon' });
    if (!r.ok) return; // cancelled: she is still here, the next tap starts it again
    await D.say('eimon', L.emPattern, { face: 'think' });
    await D.say('maya', L.mayaFound, { face: 'think' });
    await D.say('eimon', L.emAsk, { face: 'worried' });
    F('recall', true);
  }
  async function provingNext() { // Ei Mon in the proving room, by how far the day has gone
    met('eimon');
    if (!F('recall')) return provingRecall();
    if (!F('shed')) { await D.say('eimon', L.emWaitShed, { face: 'worried' }); return; }
    if (!F('carried')) { const ok = await carryWords(); if (!ok) return; }
    if (!F('sorted')) { const ok = await sortQuestions(); if (!ok) return; }
    if (!F('emTalk')) {
      if (story.talk.waiting(TALK_D13_EIMON.id)) { await D.say('eimon', L.emNotYet, { face: 'sad' }); return; }
      const r = await story.talk.run(TALK_D13_EIMON);
      if (!r.won) { await D.say('eimon', L.emNotYet, { face: 'sad' }); return; }
      F('emTalk', true);
    }
    if (!F('c2')) await c2Start();
  }
  async function carryWords() { // C1: their words as said, or a "kinder" edit
    for (let k = 0; k < L.carry.length; k++) {
      const c = L.carry[k];
      for (;;) {
        await D.say('maya', [L.carryQ], { face: 'think', auto: true });
        const flip = (k + (F('carryFlip') ? 1 : 0)) % 2 === 1;
        const opts = flip ? [c.soft, c.said] : [c.said, c.soft];
        const i = await D.choose(opts);
        if (opts[i] === c.said) { await D.say('maya', [c.said], { face: 'smile' }); break; }
        await D.say('eimon', L.emSoft, { face: 'hot' });
      }
    }
    await D.say('eimon', L.emHeard, { face: 'think' });
    F('carried', true);
    return true;
  }
  async function sortQuestions() { // 5.5
    const r = await sort({ ...L.sort, who: 'eimon', ordered: true });
    if (!r.ok) return false;
    await D.say('eimon', L.emCools, { face: 'think' });
    F('sorted', true);
    // the Writer mug on the flour-sack ledge between them
    call(story.room?.props, 'show', 'mug', true);
    await D.say('maya', L.mugDown, { face: 'smile' });
    return true;
  }
  async function c2Start() { // 5.7: she takes the blue tie, Maya the green; out by the back door
    await D.say('eimon', L.emTake, { face: 'smile' });
    F('c2', true);
    call(story.room?.props, 'show', 'bundles', false);
    carryGreen();
    queue(async () => { if (story.inRoom === 'provingroom') await story.exit(); });
  }
  async function peekScene() { // C2 on the back step: the oven draught lifts a corner
    await scene(async () => {
      F('peeked', true);
      call(carried, 'liftCorner', 1);
      call(game.audio, 'play', 'flutter');
      await D.say('maya', [L.peekQ], { face: 'surprised' });
      for (;;) {
        const i = await D.choose(L.peekChoices);
        if (i === 1) { F('peek', 1); await D.say('eimon', L.peekYes, { face: 'worried' }); continue; }
        call(carried, 'liftCorner', 0);
        await D.say('maya', L.peekNo, { face: 'smile' });
        break;
      }
      if (F('peek') == null) F('peek', 0);
      await D.say('eimon', L.emToShed, { face: 'smile' });
    });
    // she goes ahead round the oven lane to the shed and waits at its door
    scripted.add('eimon');
    walkTo('eimon', P.shedDoor.x + 0.9, P.shedDoor.z + 1.1, 1.2, 30000, -0.4).then(() => scripted.delete('eimon'));
  }
  async function shedWords() { // 5.4 in the loom shed
    met('sithu'); met('yadanar');
    await D.say('sithu', L.st1, { face: 'shy' });
    await D.say('yadanar', L.yd1, { face: 'worried' });
    await D.say('maya', L.stYdMaya, { face: 'smile' });
    if (F('heard.shuttle') && !F('rumour.shuttle')) {
      const i = await D.choose(L.askShuttle);
      if (i === 0) { await D.say('sithu', L.stShuttle, { face: 'surprised' }); proof('shuttle'); }
    }
    F('shed', true);
  }
  async function shedReturn() { // C2 inside the loom shed: the clack stops; she walks the row anyway
    const R = story.room;
    if (!R) return;
    if (!F('blueLaid')) {
      await scene(async () => {
        R.props.setWeaving?.('weaverL', false); R.props.setWeaving?.('weaverR', false);
        F('weaving', false);
        await walkTo('eimon', -0.3, 0.6, 1.0, 7000);
        await walkTo('eimon', -1.2, -0.9, 1.0, 7000, -Math.PI / 2);
        R.props.setBundle?.('sithu', true);
        call(game.audio, 'play', 'thud');
        F('blueLaid', true);
        await D.say('maya', L.emLayHint, { face: 'think' });
      });
    }
    layPhase = true;
  }
  async function layGreen() { // Maya lays the green-tied bundle on Yadanar's bare loom
    if (F('greenLaid')) return;
    layPhase = false;
    dropGreen();
    const R = story.room;
    // (Ei Mon's blue-tied one is on Sithu's loom first; a resumed page may not have shown her walk)
    if (!F('blueLaid')) { R?.props?.setBundle?.('sithu', true); F('blueLaid', true); }
    F('greenLaid', true);
    R?.props?.setBundle?.('yadanar', true);
    call(game.audio, 'play', 'thud');
    await talkNow('eimon', async () => {
      await D.say('eimon', L.emShed, { face: 'think' });
      await D.say('yadanar', L.ydShed, { face: 'sad' });
      await D.say('sithu', L.stShed, { face: 'smile' });
      // six small cream tags on the peg board, Ei Mon's cover included (by her nod)
      call(story.people.get('eimon')?.p, 'emote', 'nod');
      for (let n = 1; n <= 6; n++) { R?.props.setTags?.(n); call(game.audio, 'play', 'chalk'); await wait(260); }
      F('returned', true);
      // she sits at her own loom, her back to the room, her cover still on; the clack starts again
      await walkToSpot('eimon', 'eimonLoom', 1.0);
      R?.props.setWeaving?.('weaverL', true); R?.props.setWeaving?.('weaverR', true);
      F('weaving', true);
      await D.say('maya', L.mayaNeverSaw, { face: 'smile' });
      F('ch21Done', true);
    });
  }

  // ---------------------------------------------------------------------------------------------
  // ch 22 · the lodge
  // ---------------------------------------------------------------------------------------------
  async function arriveBlank() { // 6.1: the first step on the white
    F('arrivedBlank', true);
    await scene(async () => {
      await D.say('maya', L.arrive, { face: 'surprised' });
      proof('empty');
    });
  }
  async function deskQuestion() { // 8.1: only what she can see from here
    await D.say('maya', [L.deskBlankQ], { face: 'think' });
    for (;;) {
      const i = await D.choose(L.deskBlank);
      if (i === 0) return true;
      await D.say('maya', [L.deskWrong], { face: 'think' });
    }
  }
  async function dpVerandah() { // 6.2, outdoors
    met('dawpwint');
    await D.say('dawpwint', L.ds1, { face: 'smile' });
    F('dpMet', true);
    heard('scrubbed'); heard('noroad');
    if (story.inRoom === 'lodge') return; // (Maya came in first: she meets her at her hearth instead)
    await D.say('dawpwint', L.dsIn, { face: 'smile' });
    syncDoors();
    const e = story.people.get('dawpwint');
    if (e) { scripted.add('dawpwint'); call(W.props.lodge, 'setOpen', 1); await walkTo('dawpwint', P.lodgeDoor.x, P.lodgeDoor.z - 0.2, 1.0, 2500); e.p.root.visible = false; }
    const ok = await story.enter('lodge', { fast: true });
    call(W.props.lodge, 'setOpen', 0);
    scripted.delete('dawpwint');
    if (!ok && e) e.p.root.visible = true;
  }
  async function boardTap() {
    if (story.talking) return;
    if (liftPhase) { story.bark('maya', L.notMine, 2600); return; }
    await scene(boardLook);
  }
  async function boardLook() { // the board by the door, read (6.2 / 6.4); also from inside a talk
    const covered = F('plain') && !F('lifted');
    const title = covered ? { my: '▒▒▒▒▒▒', en: '▒▒▒▒▒▒' } : L.boardTitle;
    const txt = { my: [title.my, '', ...L.boardLines.map((l) => l.my)].join('\n'), en: [title.en, '', ...L.boardLines.map((l) => l.en)].join('\n') };
    await showLetter(game, txt, { sign: { my: 'ဒေါ်ပွင့်ရဲ့ အိမ်', en: "Daw Pwint's house" } });
    if (!F('boardSeen')) { await D.say('maya', L.boardSeen, { face: 'smile' }); proof('scrubbed'); F('boardSeen', true); }
    else if (F('lifted')) await D.say('maya', L.boardLifted, { face: 'smile' });
    else if (covered) await D.say('maya', L.boardLook, { face: 'smile' });
  }
  let psGrumbled = false;
  async function pyaeSone() { // 6.3 → 6.5 → (6.6–6.8)
    met('pyaesone');
    if (F('ch22Done')) return D.say('pyaesone', L.psAfter, { face: 'smile' });
    if (F('psTalk')) return lodgeSequence();
    if (!F('boardSeen')) {
      // the first time he only grumbles about it; after that his grumble turns her to the board itself
      if (!psGrumbled) { psGrumbled = true; return D.say('pyaesone', L.ps1, { face: 'hot' }); }
      await D.say('maya', L.psLook, { face: 'think' });
      await boardLook();
    }
    if (!F('plain')) {
      await D.say('pyaesone', L.ps1, { face: 'hot' });
      for (;;) {
        const i = await D.choose(L.psChoices);
        if (i === 0) { await D.say('pyaesone', L.psRespect, { face: 'hot', emote: 'shrug' }); await D.say('maya', L.psRespectMaya, { face: 'think' }); continue; }
        if (i === 1) { await D.say('pyaesone', L.psDown, { face: 'surprised' }); await D.say('maya', L.psDownMaya, { face: 'think' }); continue; }
        break;
      }
      // a plain cloth from Daw Pwint (she nods) over the title strip only
      call(story.people.get('dawpwint')?.p, 'emote', 'nod');
      call(story.room, 'setCover', true);
      call(game.audio, 'play', 'flutter');
      F('plain', true);
      await D.say('maya', L.mayaPlain, { face: 'smile' });
    }
    if (story.talk.waiting(TALK_D13_PYAESONE.id)) return D.say('pyaesone', L.psNotYet, { face: 'think' });
    const r = await story.talk.run(TALK_D13_PYAESONE);
    if (!r.won) return D.say('pyaesone', L.psNotYet, { face: 'think' });
    F('psTalk', true);
    await lodgeSequence();
  }
  async function lodgeSequence() { // 6.6 → 6.8, inside the lodge; resumable at every step
    if (lodgeRunning) return;
    lodgeRunning = true;
    try { await lodgeSteps(); } finally { lodgeRunning = false; }
  }
  async function lodgeSteps() {
    const R = story.room;
    if (!R || story.inRoom !== 'lodge') return;
    const signers = { moe: [], pyaesone: [], shwesin: [] };
    // 6.6 the five lines, tested
    for (const sc of L.scenes) {
      const n = sc.line;
      for (const who of Object.keys(signers)) if (!(who === 'shwesin' && n === 2)) signers[who].push(n);
      if (F(`line.${n}`)) continue;
      await walkToSpot('dawpwint', 'dawpwintBoard', 1.1);
      call(story.people.get('dawpwint')?.p, 'emote', 'point');
      await D.say('dawpwint', [L.dsPoint, L.boardLines[n - 1]], { face: 'smile' });
      const actor = { 1: 'moe', 2: 'moe', 3: 'moe', 4: 'pyaesone', 5: 'dawpwint' }[n];
      const s = spotOf(sc.spot);
      if (s && actor !== 'dawpwint') await walkTo(actor, s.x, s.z, 1.1, 6000, s.h ?? null);
      if (n === 1) call(R.gecko, 'run');
      if (n === 5) await walkToSpot('dawpwint', sc.spot, 1.0);
      await D.say('maya', [sc.play], { face: 'think' });
      for (;;) {
        await D.say('maya', [L.testQ], { face: 'think', auto: true });
        const i = await D.choose(L.testA);
        if (i === 1) break;
        await D.say('maya', [L.testYes], { face: 'think' });
        await D.say(sc.yes.who, [sc.yes], { face: 'think' });
      }
      const who = sc.keep.who === 'all' ? 'pyaesone' : sc.keep.who;
      await D.say(who, [sc.keep], { face: n === 2 ? 'shy' : 'smile' });
      if (sc.prop === 'gecko:settles') call(R.gecko, 'settle', 0.06, -0.12);
      if (sc.prop === 'mats:together') call(R, 'setMats', 'together');
      if (sc.prop === 'map:crossed') call(R, 'setMap', true);
      if (sc.prop === 'lamp:hungHigh') call(R, 'setHung', 'high');
      call(game.audio, 'play', 'chalk');
      F(`line.${n}`, true);
    }
    if (!F('scenesDone')) {
      for (const [who, lines] of Object.entries(signers)) F(`signed.${who}`, lines);
      signBoard(R);
      await D.say('dawpwint', L.dsFaiths, { face: 'smile' });
      F('scenesDone', true);
      await Promise.all(['moe', 'pyaesone', 'shwesin'].map((id) => walkToSpot(id, id, 1.1)));
      await walkToSpot('dawpwint', 'dawpwint', 1.0);
    }
    // 6.7 dusk: three small things, in the din and then in the quiet
    if (!F('spotQuiet') && F('spotQuiet') !== 0) {
      F('dusk', true);
      look();
      await D.say('dawpwint', L.dsDusk, { face: 'smile' });
      const din = await spotRound('din');
      F('spotDin', din);
      await D.say('maya', L.spotDin, { face: 'think' });
      await D.say('maya', L.psRadioOff, { face: 'surprised' });
      const quiet = await spotRound('quiet');
      F('spotQuiet', quiet);
      await D.say('shwesin', L.spotQuietSS, { face: 'happy' });
      await D.say('pyaesone', L.spotQuietPS, { face: 'think' });
      await D.say('dawpwint', L.dsQuiet, { face: 'smile' });
    }
    // 6.8 they lift the cover: Maya does not move
    if (!F('lifted')) {
      liftPhase = true;
      const cloth = document.createElement('div');
      cloth.className = 'd13-spot d13-lift';
      cloth.addEventListener('pointerdown', (ev) => {
        ev.stopPropagation(); ev.preventDefault();
        const b = cloth.getBoundingClientRect();
        if (tapDist(game, ev.clientX - b.left, ev.clientY - b.top, { x: 2.85, y: 1.45, z: 2.4 }) < 70) story.bark('maya', L.notMine, 2600);
      });
      document.getElementById('game').appendChild(cloth);
      try { await D.choose([L.wait]); } finally { cloth.remove(); liftPhase = false; }
      await walkToSpot('pyaesone', 'mayaBoard', 1.0);
      call(R, 'setCover', false);
      call(game.audio, 'play', 'flutter');
      await D.say('pyaesone', L.psLift, { face: 'smile' });
      await D.say('moe', L.moeLift, { face: 'happy' });
      await D.say('dawpwint', L.dsEnd, { face: 'smile' });
      await D.say('maya', L.mayaLift, { face: 'smile' });
      F('lifted', true);
      F('ch22Done', true);
      walkToSpot('pyaesone', 'pyaesone', 1.1);
    }
    queue(naychiKnock);
  }
  function signBoard(R) {
    const board = R?.board;
    if (!board || signedBoards.has(board)) return;
    signedBoards.add(board);
    for (const who of ['pyaesone', 'shwesin', 'moe']) {
      const lines = F(`signed.${who}`);
      if (Array.isArray(lines) && lines.length) call(board, 'sign', tr(castById(who)?.name || { my: who, en: who }), lines);
    }
  }
  /** 6.7: tap three small things (the gecko, the drip, the hairpin) in the din (20 s) or in the quiet. */
  function spotRound(kind) {
    return new Promise((resolve) => {
      const R = story.room;
      const gpos = new THREE.Vector3();
      const targets = [
        { id: 'gecko', at: () => (R?.gecko?.root ? R.gecko.root.getWorldPosition(gpos) : { x: 1.0, y: 2.0, z: 0.1 }), ph: 0.3 },
        { id: 'drip', at: () => ({ x: -2.9, y: 0.32, z: 1.92 }), ph: 2.1 },
        { id: 'hairpin', at: () => ({ x: -0.5, y: 0.05, z: 3.42 }), ph: 4.4 },
      ];
      const found = new Set();
      const din = kind === 'din';
      // the whole house in view from the doorway side (the round is about looking, not walking): the gecko by
      // the lamp, the water pot, the sandals by the door all in frame; nothing on screen points at them
      const aspect = game.rig.camera?.aspect || game.camera?.aspect || 0.45;
      const back = aspect < 1 ? 12.0 : 8.0;
      game.rig.shot(new THREE.Vector3(-0.95, 1.2 + back * 0.36, 0.9 + back), new THREE.Vector3(-0.95, 0.9, 0.9), 0.9);
      const el = document.createElement('div');
      el.className = 'd13-spot';
      el.innerHTML = '<div class="tag"><b></b><small></small></div>';
      el.querySelector('b').textContent = tr(L.spotRound[kind]);
      const count = () => { el.querySelector('small').textContent = `${tr(L.spotFound)} · ${tr({ my: '၀၁၂၃'[found.size], en: String(found.size) })}`; };
      count();
      document.getElementById('game').appendChild(el);
      const t0 = performance.now();
      const blocked = (tg, t) => din && Math.sin(t * 1.7 + tg.ph) + Math.sin(t * 0.9 + tg.ph * 2) > -0.35; // people and noise in the way
      el.addEventListener('pointerdown', (ev) => {
        ev.stopPropagation(); ev.preventDefault();
        const b = el.getBoundingClientRect();
        const x = ev.clientX - b.left, y = ev.clientY - b.top;
        const t = (performance.now() - t0) / 1000;
        for (const tg of targets) {
          if (found.has(tg.id)) continue;
          if (tapDist(game, x, y, tg.at()) < (din ? 24 : 40) && !blocked(tg, t)) {
            found.add(tg.id);
            call(game.audio, 'play', tg.id === 'gecko' ? 'chirp' : tg.id === 'drip' ? 'pop' : 'sparkle');
            count();
            break;
          }
        }
      });
      let tickT = 0, chirped = false, raf = 0, last = performance.now();
      const step = (now) => {
        const t = (now - t0) / 1000, dt = (now - last) / 1000;
        last = now;
        tickT -= dt;
        if (din) {
          // the radio, the cards slapping, Moe drumming the floorboards
          if (tickT <= 0) { tickT = 0.22 + Math.random() * 0.25; call(game.audio, 'play', Math.random() < 0.6 ? 'click' : 'thud'); }
          if (Math.random() < dt * 0.6) call(story.people.get('moe')?.p, 'emote', Math.random() < 0.5 ? 'fists' : 'cheer');
        } else {
          if (tickT <= 0) { tickT = 2; call(game.audio, 'play', 'pop'); } // a soft tick every two seconds
          if (!chirped && t > 3) { chirped = true; call(R?.gecko, 'chirp'); call(game.audio, 'play', 'chirp'); }
        }
        const over = din ? t >= 20 : found.size >= 3 || t >= 30;
        if (over || disposed) { cancelAnimationFrame(raf); el.remove(); resolve(found.size); return; }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      if (window.__day13) window.__day13.spot = { targets, found, finish: () => { for (const tg of targets) found.add(tg.id); } };
    });
  }

  // ---------------------------------------------------------------------------------------------
  // main beat · Nay Chi, the walk north, the road home (8)
  // ---------------------------------------------------------------------------------------------
  const GROUP = ['naychi', 'pyaesone', 'shwesin', 'moe', 'dawpwint'];
  const VERANDAH = { naychi: [131.9, -5.6, 0.2], pyaesone: [133.0, -5.9, -0.4], shwesin: [129.9, -5.7, 0.3], moe: [134.0, -5.5, -0.5], dawpwint: [128.9, -6.0, 0.4] };
  function spawnGroup(at = VERANDAH) {
    for (const id of GROUP) {
      scripted.add(id);
      if (story.people.get(id)) story.remove(id);
      const [x, z, h] = at[id];
      story.spawn(id, { x, z, heading: h });
      mine.add(id);
    }
  }
  async function naychiKnock() { // 8.2 (the knock is heard inside; they all step out onto the verandah)
    if (F('ncMet')) return northScene();
    await scene(async () => {
      if (story.inRoom === 'lodge') {
        call(game.audio, 'play', 'thud'); await wait(260); call(game.audio, 'play', 'thud');
        await D.say('maya', L.knock, { face: 'surprised' });
        await story.exit();
      }
    });
    await northScene();
  }
  async function northScene() {
    if (story.inRoom) return;
    if (!F('decided')) {
      spawnGroup();
      F('ncMet', true);
      met('naychi');
      await talkNow('naychi', async () => {
        await D.say('naychi', L.nc1, { face: 'happy' });
        await D.say('pyaesone', L.pyaeNorth, { face: 'think' });
        await D.say('dawpwint', L.dpNorth, { face: 'think' });
        await D.say('maya', [L.roadQ], { face: 'think' });
        let drew = false;
        for (;;) {
          const i = await D.choose(L.roadChoices);
          if (i === 0) { drew = true; await D.say('maya', L.roadDraw, { face: 'surprised' }); continue; }
          break;
        }
        F('stepBack', drew ? 0 : 1);
        await D.say('naychi', L.ncDecide, { face: 'smile' });
        F('decided', true);
      });
    }
    if (!F('walked')) await walkNorth();
    if (!F('road')) await inkRoad();
  }
  async function walkNorth() { // 8.3: side by side on one line; the prints of many stay
    if (!GROUP.every((id) => story.people.get(id))) spawnGroup();
    await scene(async () => {
      const fp = story.footprints;
      for (const id of ['maya', ...GROUP]) fp.track(id, { life: 40 });
      const foot = story.foot;
      const sp0 = foot.speedScale ?? 1;
      foot.speedScale = 0.5;
      const order = ['naychi', 'maya', 'pyaesone', 'shwesin', 'moe', 'dawpwint'];
      let lead = 0;
      const legs = order.map((id, k) => (async () => {
        await wait(k * 1100);
        for (let w = 0; w < ROAD.length; w++) {
          const [x, z] = ROAD[w];
          if (id === 'maya') await mayaTo(x, z, 20000); else await walkTo(id, x, z, 1.15, 20000);
          if (id === 'naychi') {
            lead = w;
            if (w === 2) story.bark('moe', L.walk1[0], 3600);
            if (w === 4) story.bark('naychi', L.walk2[0], 4200);
          }
        }
        // side by side in front of the back cover
        const k2 = order.indexOf(id);
        const fx = P.board.x - 2.3 + k2 * 0.92, fz = P.board.z + 3.6;
        if (id === 'maya') await mayaTo(fx, fz, 8000); else await walkTo(id, fx, fz, 1.0, 8000, Math.PI);
      })());
      await Promise.all(legs);
      void lead;
      foot.speedScale = sp0;
      F('walked', true);
      // the keyhole: the Own Key would fit; not yet (Day 14 turns it)
      const k = P.keyhole;
      game.rig.shot(new THREE.Vector3(k.x + 1.4, 1.5, k.z + 2.6), new THREE.Vector3(k.x, 1.0, k.z), 0.9);
      if (story.has('ownkey')) story.use('ownkey', { quiet: true });
      await D.say('maya', L.keyhole, { face: 'think' });
    });
  }
  async function inkRoad() { // 8.3: she looks back; the walked line darkened; she has seen it now
    await scene(async () => {
      game.rig.shot(new THREE.Vector3(P.board.x - 1.5, 6.2, P.board.z + 1.0), new THREE.Vector3(133.5, 0, -24), 1.4);
      await wait(900);
      await D.say('maya', [L.inkQ], { face: 'smile', auto: true });
      await D.choose([L.inkHold]);
      story.footprints.ink();
      story.openWorld?.setFlagGate?.('backCover', true);
      proof('noroad');
      F('road', true);
      await D.say('maya', L.inkDone, { face: 'happy' });
      await D.say('naychi', L.ncEnd, { face: 'smile' });
      await D.say('pyaesone', L.psEnd, { face: 'happy' });
      if (!deskLit()) await D.say('maya', L.deskHome, { face: 'think' }); // the cover stays shut: home by ribbon
      // the reply letter's own line (Act 2), automatically (the notebook's back page: SHARED NEEDS)
      save.reply = Array.isArray(save.reply) ? save.reply : [];
      if (!save.reply.some((r) => r.day === 13)) save.reply.push({ day: 13, line: L.replyLine });
      story.flag('board.notes', 6);
      story.persist();
      look();
    });
    // they wave and go back to the lodge for the night; Nay Chi walks with them; the cover stays shut
    for (const id of GROUP) call(story.people.get(id)?.p, 'emote', 'wave');
    await wait(900);
    for (const id of GROUP) story.footprints.untrack(id);
    story.footprints.untrack('maya');
    GROUP.forEach((id, i) => {
      walkTo(id, P.lodgeDoor.x + (i - 2) * 0.6, P.lodgeDoor.z + 0.6, 1.2, 50000).then(() => { if (!disposed && !story.inRoom && story.people.get(id) && mine.has(id)) { story.remove(id); mine.delete(id); } scripted.delete(id); });
    });
  }

  // ---------------------------------------------------------------------------------------------
  // the night page (9), at the Writing Room door
  // ---------------------------------------------------------------------------------------------
  let nightBusy = false;
  const deskLit = () => !!(F('desk') || save.flags['desk:blank']);
  const ready = () => F('ch21Done') && F('ch22Done') && F('road') && deskLit() && !F('done');
  async function night() {
    if (nightBusy || !ready()) return;
    nightBusy = true;
    try {
      if (story.inRoom) await story.exit({ instant: true });
      const who = MET.filter((id) => F(`met.${id}`));
      await nightPage(story, {
        day: 13,
        truth: { q: L.nightQ, choices: L.nightChoices, right: 1, wrong: L.nightWrong },
        before: async () => { if (F('peek') === 1) await D.say('maya', L.peekNight, { face: 'think' }); },
        sleep: { q: L.sleepQ, who: who.length ? who : MET },
        stamps: [22],
        pencil: [21],
        stampText: L.stampText,
        extra: L.page21,
        tomorrow: L.tomorrow,
      });
    } finally { nightBusy = false; }
  }

  // ---------------------------------------------------------------------------------------------
  // what people say (by how far the day has gone)
  // ---------------------------------------------------------------------------------------------
  let arkarK = 0, hptK = 0;
  const talk = {
    wintwar: async () => {
      if (!F('morning')) return morning();
      if (F('road')) { await D.say('wintwar', L.wwEvening, { face: 'happy' }); story.flag('board.notes', 6); return; }
      await D.say('wintwar', L.wwLater, { face: 'smile' });
    },
    khinmay: async () => {
      met('khinmay');
      if (F('ch21Done')) return D.say('khinmay', L.kmAfter, { face: 'happy' });
      if (!F('kmMet')) { await D.say('khinmay', L.km1, { face: 'smile' }); F('kmMet', true); return; }
      await D.say('khinmay', L.kmAgain, { face: 'smile' });
    },
    maungarkar: async () => {
      met('maungarkar');
      if (F('ch21Done')) return D.say('maungarkar', L.arkarAfter, { face: 'happy' });
      if (!F('arMet')) { F('arMet', true); return D.say('maungarkar', L.arkar1, { face: 'worried' }); }
      await D.say('maungarkar', L.arkarMore[arkarK++ % L.arkarMore.length], { face: 'think' });
    },
    eimon: async () => {
      met('eimon');
      if (story.inRoom === 'provingroom') return provingNext();
      if (story.inRoom === 'loomshed') {
        if (F('returned')) return D.say('eimon', L.emAfter, { face: 'smile' });
        if (layPhase) return D.say('maya', L.emLayHint, { face: 'think' });
        return D.say('eimon', L.emShed.slice(0, 1), { face: 'think' });
      }
      if (!F('emMet')) return emStep();
      // C2 by the back step: the oven draught lifts the corner while they stand there
      if (F('c2') && !F('peeked') && !F('returned')) { if (!story.carrying) carryGreen(); return peekScene(); }
      if (F('c2') && !F('returned')) return D.say('eimon', L.emToShed, { face: 'smile' });
      return D.say('eimon', L.emAfter, { face: 'smile' });
    },
    sithu: async () => {
      if (layPhase) return D.say('maya', L.wrongLoom, { face: 'think' }); // (his loom has Ei Mon's blue one now)
      if (!F('recall')) return D.say('sithu', L.stBefore, { face: 'worried' });
      if (!F('shed')) return shedWords();
      if (!F('ch21Done')) return D.say('sithu', L.stAfterShed, { face: 'think' });
      return D.say('sithu', L.stAfter, { face: 'smile' });
    },
    yadanar: async () => {
      // (she stands at her own bare loom: the green-tied bundle goes onto it, beside her)
      if (layPhase && story.inRoom === 'loomshed') { layPhase = false; queue(layGreen); return; }
      if (!F('recall')) return D.say('yadanar', L.stBefore, { face: 'worried' });
      if (!F('shed')) return shedWords();
      if (!F('ch21Done')) return D.say('yadanar', L.stAfterShed, { face: 'think' });
      return D.say('yadanar', L.ydAfter, { face: 'smile' });
    },
    hpohtaw: async () => {
      const k = hptK++ % L.hpt.length;
      await D.say('hpohtaw', L.hpt[k], { face: 'smile' });
      if (k === 1) heard('scrubbed');
    },
    dawpwint: async () => {
      if (!F('dpMet')) return dpVerandah();
      met('dawpwint');
      if (F('ch22Done')) return D.say('dawpwint', L.dsAfter, { face: 'smile' });
      if (F('psTalk') && story.inRoom === 'lodge') return lodgeSequence();
      return D.say('dawpwint', L.dsInside, { face: 'smile' });
    },
    pyaesone: async () => pyaeSone(),
    shwesin: async () => {
      met('shwesin');
      if (F('lifted')) return D.say('shwesin', L.ssAfter, { face: 'smile' });
      await D.say('shwesin', L.ssBefore, { face: 'surprised' });
      if (!F('rumour.scrubbed')) proof('scrubbed');
    },
    moe: async () => { met('moe'); return D.say('moe', F('lifted') ? L.moeAfter : L.moeBefore, { face: F('lifted') ? 'happy' : 'think' }); },
    naychi: async () => { met('naychi'); return D.say('naychi', L.ncEnd, { face: 'smile' }); },
  };

  // ---------------------------------------------------------------------------------------------
  // rooms (doors.js hooks)
  // ---------------------------------------------------------------------------------------------
  function roomCast(id) {
    if (id === 'bakery') return [{ id: 'khinmay', spot: 'kmBin' }]; // on the flour bin, in full view (behind the work table only her head showed)
    if (id === 'provingroom') {
      if (!F('emMet') || F('c2')) return [];
      return [{ id: 'eimon', spot: arriving ? 'eimonEnter' : 'eimonSeat' }];
    }
    if (id === 'loomshed') {
      const list = [{ id: 'sithu', spot: 'sithu' }, { id: 'yadanar', spot: 'yadanar' }, { id: 'weaverA', spot: 'weaverL' }, { id: 'weaverB', spot: 'weaverR' }];
      if (F('returned')) list.push({ id: 'eimon', spot: 'eimonLoom' });
      else if (F('c2')) list.push({ id: 'eimon', spot: F('blueLaid') ? { x: -1.2, z: -0.9, h: -Math.PI / 2 } : 'eimonEnter' });
      return list;
    }
    if (id === 'lodge') {
      const list = [{ id: 'dawpwint', spot: 'dawpwint' }, { id: 'moe', spot: 'moe' }, { id: 'pyaesone', spot: 'pyaesone' }, { id: 'shwesin', spot: 'shwesin' }];
      if (F('road')) list.push({ id: 'naychi', spot: 'dawpwintBoard' });
      return list;
    }
    return undefined;
  }
  function spawnCustomer(room) {
    const sp = room?.spots?.customer;
    if (!sp || customer) return;
    const p = createPerson(CUSTOMER_LOOK);
    p.root.position.set(sp.x, 0, sp.z);
    p.root.rotation.y = sp.h ?? Math.PI;
    p.root.userData.isPerson = true;
    room.scene.add(p.root);
    customer = {
      id: 'd13customer', cast: { name: L.custName, look: CUSTOMER_LOOK }, p, indoor: 'bakery', walking: null,
      home: { x: sp.x, z: sp.z, h: p.root.rotation.y }, ob: { type: 'circle', x: sp.x, z: sp.z, r: p.radius || 0.3 },
      onTalk: async () => { await sayAs('d13customer', L.custName, L.custShuttle, { face: 'think' }); heard('shuttle'); },
    };
    story.people.set(customer.id, customer);
  }
  function dropCustomer() {
    if (!customer) return;
    if (story.people.get(customer.id) === customer) story.people.delete(customer.id);
    customer.p.root.removeFromParent();
    customer.p.dispose();
    customer = null;
  }
  async function enterRoom(id, room) {
    // inside: the shared close, low follow camera (never the whole-room view)
    if (story.doors?.roomCam) { try { story.doors.roomCam(); } catch (err) { console.warn('day13 room camera', err); } }
    if (id === 'bakery') spawnCustomer(room);
    if (id === 'provingroom') {
      call(room.props, 'show', 'bundles', !F('c2'));
      call(room.props, 'show', 'mug', !!F('sorted'));
      if (arriving) queue(provingArrive);
    }
    if (id === 'loomshed') {
      const p = room.props || {};
      p.setBundle?.('sithu', !!(F('blueLaid') || F('returned')));
      p.setBundle?.('yadanar', !!(F('greenLaid') || F('returned')));
      p.setTags?.(F('returned') ? 6 : 0);
      p.setCover?.('eimon', true); // her cover stays on (the Day 14 dressing lifts it; not today)
      if (F('c2') && !F('greenLaid')) { if (!story.carrying) carryGreen(); queue(shedReturn); }
    }
    if (id === 'lodge') {
      call(room, 'setCover', !!(F('plain') && !F('lifted')));
      call(room, 'setHung', F('line.5') ? 'high' : 'low');
      call(room, 'setMats', F('line.3') ? 'together' : 'apart');
      call(room, 'setMap', !!F('line.4'));
      if (F('scenesDone')) signBoard(room);
      if (F('ch22Done') && !F('decided')) queue(naychiKnock);
    }
    if (id === 'about' && ready()) queue(night);
  }
  /** People on a room spot that has a seat (stacked sacks, a bench, a mat) sit on it (after their own update). */
  function seatPeople() {
    const spots = story.room?.spots;
    if (!spots) return;
    for (const e of story.people.values()) {
      const b = e?.p?.bones;
      if (!b || e.walking || !e.p.root.visible) continue;
      const pos = e.p.root.position;
      for (const s of Object.values(spots)) {
        if (!s || (s.sit == null && s.seat == null) || s.sit === false) continue;
        if (Math.hypot(pos.x - s.x, pos.z - s.z) > 0.22) continue;
        const y = typeof s.seat === 'number' ? s.seat : typeof s.sit === 'number' ? s.sit : 0.3;
        b.hips.position.y = y + 0.03;
        b.legL.rotation.x = -1.3;
        b.legR.rotation.x = -1.3;
        break;
      }
    }
  }
  let deskNagged = false;
  function leaveRoom(id) {
    if (id === 'bakery') dropCustomer();
    layPhase = false;
  }
  function station(id) {
    const r = story.inRoom;
    if (r === 'loomshed' && layPhase && (id === 'yadanarLoom' || id === 'sithuLoom' || id === 'eimonLoom')) {
      if (id === 'yadanarLoom') layGreen();
      else story.bark('maya', L.wrongLoom[0], 2800);
      return true;
    }
    if (r === 'lodge' && id === 'board') { boardTap(); return true; }
    if (r === 'lodge' && (id === 'dawpwint' || id === 'hearth') && story.people.get('dawpwint')) { story.talkTo(story.people.get('dawpwint')); return true; }
    if (r === 'provingroom' && id === 'bundles' && !F('c2') && story.people.get('eimon')) {
      story.talkTo(Object.assign(story.people.get('eimon'), { onTalk: async (e) => { e.onTalk = null; await D.say('eimon', L.em1.slice(0, 1), { face: 'worried' }); } }));
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------------------------
  // the Blank Page desk: the one true line before the ribbon rises (world/index.js lightDesk asks day.desk first)
  // ---------------------------------------------------------------------------------------------
  const ow = story.openWorld;
  async function deskHook(id) {
    if (id !== 'blank' || F('desk')) return true;
    if (story.talking || game.busy) return false;
    story.talking = true;
    game.ui.cinema(true);
    try { await deskQuestion(); } finally { story.talking = false; game.ui.cinema(false); }
    F('desk', true);
    heard('scrubbed'); heard('noroad');
    queue(() => scene(() => D.say('maya', L.deskDone, { face: 'happy' }))); // after the ribbon has risen
    return true;
  }
  // the keyhole (after the walk): the Own Key would fit; not yet
  const keyHook = (x, y) => {
    if (!F('walked') || story.inRoom || story.talking) return false;
    const mp = game.maya.root.position;
    if (Math.hypot(mp.x - P.keyhole.x, mp.z - P.keyhole.z) > 6 || tapDist(game, x, y, P.keyhole) > 46) return false;
    scene(() => D.say('maya', L.keyhole, { face: 'think' }));
    return true;
  };
  story.tapHooks = story.tapHooks || [];
  story.tapHooks.push(keyHook);

  // ---------------------------------------------------------------------------------------------
  // the page
  // ---------------------------------------------------------------------------------------------
  const onRoom = (ev) => { if (!ev.detail?.inside) setTimeout(syncStreet, 0); };
  document.addEventListener('rc:room', onRoom);
  for (const b of W.props.bundles) b.root.visible = !F('emMet');
  syncStreet();

  // ---- test hooks (the tester drives the day with these)
  const FLAGS_AT = {
    morning: [], hearth: ['morning'], proving: ['kmMet', 'heard.shuttle'], shed: ['emMet'], carry: ['recall'], sort: ['shed'],
    talkEm: ['carried'], c2: ['sorted'], returned: ['emTalk'], blank: ['c2', 'peeked', 'blueLaid', 'greenLaid', 'returned', 'ch21Done'],
    desk: ['arrivedBlank', 'rumour.empty'], lodge: ['desk'], plain: ['dpMet', 'boardSeen', 'rumour.scrubbed'], psTalk: ['plain'],
    scenes: ['psTalk'], dusk: ['line.1', 'line.2', 'line.3', 'line.4', 'line.5', 'scenesDone'], lift: ['dusk', 'spotDin', 'spotQuiet'],
    naychi: ['lifted', 'ch22Done'], walk: ['ncMet', 'decided'], ink: ['walked'], night: ['road'],
  };
  const PLACES = {
    home: () => [P.about.x + 1.2, P.about.z + 1.6], bakery: () => [P.bakeryDoor.x - 0.6, P.bakeryDoor.z + 2.2], yard: () => [P.yard.x, P.yard.z + 0.4],
    shed: () => [P.shedDoor.x - 0.6, P.shedDoor.z + 2.2], hedge: () => [P.hedge.x, P.hedge.z + 2.6], blank: () => [139.6, 14], desk: () => [P.deskBlank.x - 1.2, P.deskBlank.z + 1.6], lodge: () => [P.lodgeDoor.x + 0.4, P.lodgeDoor.z + 2.2],
    cover: () => [P.board.x + 0.6, P.board.z + 3.6], post: () => [P.post.x - 1.2, P.post.z + 0.6],
  };
  const hooks = {
    beats: BEATS,
    get state() { return { busy, queued: !!queued, layPhase, liftPhase, arriving, carrying: !!story.carrying, room: story.inRoom, hour: lastHour }; },
    flags: () => Object.fromEntries(Object.entries(save.flags).filter(([k]) => k.startsWith('d13.'))),
    /** Sets every flag a beat needs (cumulative) and re-syncs the street; does not move Maya (see go). */
    skipTo(beat) {
      const k = BEATS.indexOf(beat);
      if (k < 0) return false;
      for (let i = 0; i <= k; i++) for (const f of FLAGS_AT[BEATS[i]]) F(f, f.startsWith('rumour.') ? true : f === 'spotDin' || f === 'spotQuiet' ? 3 : true);
      if (k >= BEATS.indexOf('hearth')) for (const id of ['cup', 'lid']) story.companions.add(id);
      if (k >= BEATS.indexOf('dusk')) { F('signed.pyaesone', [1, 2, 3, 4, 5]); F('signed.moe', [1, 2, 3, 4, 5]); F('signed.shwesin', [1, 3, 4, 5]); }
      if (k >= BEATS.indexOf('night')) story.openWorld?.setFlagGate?.('backCover', true);
      if (k >= BEATS.indexOf('blank')) dropGreen();
      for (const b of W.props.bundles) b.root.visible = !F('emMet');
      syncStreet();
      look();
      return hooks.flags();
    },
    /** Puts Maya (on foot) at a named place: home, bakery, yard, shed, hedge, blank, desk, lodge, cover, post. */
    async go(place) {
      const p = PLACES[place]?.();
      if (!p) return false;
      if (story.inRoom) await story.exit({ instant: true });
      if (!story.foot.active) await story.foot.toFoot();
      story.openWorld?.jump(p[0], p[1], 0);
      setTimeout(syncStreet, 0);
      return true;
    },
    /** Starts a flow by name (e.g. 'morning', 'emStep', 'recall', 'carry', 'sort', 'talkEm', 'peek', 'shedWords', 'lay', 'arrive',
     *  'desk', 'dp', 'board', 'ps', 'lodge', 'knock', 'north', 'walk', 'ink', 'night'), or enters a room: run('enter:lodge'). */
    run(name) {
      if (name.startsWith('enter:')) return story.enter(name.slice(6));
      const flows = {
        morning: () => talkNow('wintwar', morning), emStep: () => talkNow('eimon', emStep), recall: () => talkNow('eimon', provingRecall),
        carry: () => talkNow('eimon', carryWords), sort: () => talkNow('eimon', sortQuestions), talkEm: () => talkNow('eimon', provingNext),
        peek: () => peekScene(), shedWords: () => talkNow('sithu', shedWords), lay: () => layGreen(), arrive: () => arriveBlank(),
        desk: () => { const d = ow?.desks?.byId?.('blank'); return d ? ow.lightDesk(d) : deskHook('blank'); }, dp: () => talkNow('dawpwint', dpVerandah), board: () => boardTap(), ps: () => talkNow('pyaesone', pyaeSone),
        lodge: () => talkNow('pyaesone', lodgeSequence), knock: () => naychiKnock(), north: () => northScene(), walk: () => walkNorth(), ink: () => inkRoad(), night: () => night(),
      };
      return flows[name]?.();
    },
    spot: null,
  };
  window.__day13 = hooks;

  return {
    talk,
    roomCast,
    roomOpts(id) { return id === 'lodge' ? { cover: false, lampLow: !F('line.5') } : undefined; },
    desk: deskHook,
    enterRoom,
    leaveRoom,
    station,
    /** The page turns in place: this page's props, keep-out boxes, doors, people and hooks go away. */
    dispose() {
      disposed = true;
      document.removeEventListener('rc:room', onRoom);
      const k = story.tapHooks.indexOf(keyHook);
      if (k >= 0) story.tapHooks.splice(k, 1);
      dropGreen();
      dropCustomer();
      for (const id of mine) story.remove(id);
      mine.clear();
      W.dispose();
      if (window.__day13 === hooks) window.__day13 = null;
    },
    async start() {
      if (save.weather) story.weather(null); // yesterday's rain is over
      look();
      if (!F('morning')) {
        if (story.inRoom) await story.exit({ instant: true });
        if (!story.foot.active) await story.foot.toFoot();
        story.refreshHud?.();
        // the day opens with Maya stepping out at her Writing Room door
        const mp = game.maya.root.position;
        if (Math.hypot(mp.x - P.about.x, mp.z - P.about.z) > 5) story.openWorld?.jump(P.about.x + 0.4, P.about.z + 1.4, 0);
        syncStreet();
        const ww = story.people.get('wintwar');
        if (ww) {
          ww.paused = true;
          const m = game.maya.root.position;
          await Promise.race([story.walkPerson('wintwar', m.x + 1.15, m.z + 0.05, 1.5), wait(8000)]);
          setTimeout(() => { ww.paused = false; }, 4000);
          await story.talkTo(ww);
        }
      }
    },
    update(dt, t) {
      if (disposed) return;
      const mp = game.maya.root.position;
      const indoors = !!story.inRoom;
      W.update(dt, t, mp, indoors);
      if (indoors) {
        seatPeople();
        // inside, always the shared close low follow camera: if the whole-room view (main.js, tilt 48 /
        // minHeight 9.6) is back on after a scene or a fast walk-in, put the close one back
        const fo = game.rig.follow;
        if (fo && (fo.minHeight > 1 || fo.tilt > 40) && !story.talking && !game.busy && !game.rig.cinematic) { try { story.doors?.roomCam?.(); } catch (err) { console.warn('day13 room camera', err); } }
      }
      look();
      // the carried bundle follows her into rooms and back out
      if (story.carrying && game.maya.root.parent && story.carrying.parent !== game.maya.root.parent) game.maya.root.parent.add(story.carrying);
      if (queued && !busy && !story.talking && !game.busy && !game.ui.dialogOpen) { const f = queued; queued = null; Promise.resolve().then(f).catch((e) => console.error('day13 flow', e)); return; }
      if (busy || story.talking || game.busy || game.mode !== 'world') return;
      // a desk lit some other way (an older save): the line is written
      if (!F('desk') && save.flags['desk:blank']) F('desk', true);
      if (!indoors && story.foot.active) {
        // C2: on the back step the oven draught lifts the corner of Maya's cover (she comes out of the back door here)
        if (F('c2') && !F('peeked') && story.carrying && Math.hypot(mp.x - P.backDoor.x, mp.z - P.backDoor.z) < 3.2) { peekScene(); return; }
        // the first step on the white
        if (!F('arrivedBlank') && inBlank(mp.x, mp.z)) { arriveBlank(); return; }
        // after the lodge: the verandah, the walk, the ink (resumes after a reload)
        if (F('ch22Done') && !F('road') && Math.hypot(mp.x - P.lodgeDoor.x, mp.z - P.lodgeDoor.z) < 14) { queue(northScene); return; }
        // the night page at the Writing Room door
        if (ready() && Math.hypot(mp.x - P.about.x, mp.z - P.about.z) < 1.9) { night(); return; }
        // (everything else done, but the Blank Page's line unwritten: she remembers it at her own door)
        const atDoor = Math.hypot(mp.x - P.about.x, mp.z - P.about.z) < 2.4;
        if (atDoor && !deskNagged && F('road') && !deskLit() && !F('done')) { deskNagged = true; story.bark('maya', L.deskFirst, 4200); }
        if (!atDoor) deskNagged = false;
      }
      if (indoors && story.inRoom === 'lodge' && F('psTalk') && !F('ch22Done') && story.room && !lodgeRunning) queue(() => talkNow('pyaesone', lodgeSequence));
      if (indoors && story.inRoom === 'provingroom' && F('emTalk') && !F('c2')) queue(() => talkNow('eimon', c2Start));
    },
  };
}

// a little style for the spot rounds (a label and a count; nothing points anywhere)
if (typeof document !== 'undefined' && !document.getElementById('d13-style')) {
  const s = document.createElement('style');
  s.id = 'd13-style';
  s.textContent = `.d13-spot { position: absolute; inset: 0; z-index: 43; touch-action: none; }
  .d13-spot .tag { position: absolute; left: 50%; top: calc(96px + env(safe-area-inset-top)); transform: translateX(-50%); padding: 6px 16px; border-radius: 999px;
    background: rgba(255,253,248,.9); border: 2px solid #A47A2C; font: 700 13px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; color: #6E1F2A; text-align: center; pointer-events: none; }
  .d13-spot .tag small { display: block; font-weight: 600; color: #8C6A28; }
  .d13-spot.d13-lift { z-index: 35; }`;
  document.head.appendChild(s);
}
