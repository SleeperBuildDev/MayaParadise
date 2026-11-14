// Day 5 — Ledger Wharf and the Envelope Market. Chapters 10 မုဒိတာ (Gladness for Others) and
// 2 လူ့ဘဝ (My Human Life at Twenty); main quest: the Painted Map's bridge is not there.
// Script: days/day5-spec.md (INDEX 13.2 room layouts and INDEX 9 flags win over it).
//
// Ch 10 (p57–60): when someone who was your equal pulls ahead, the hot thought comes to most people;
// notice it, see that it burns you first and will hurt you, stop there, and be glad for them instead.
// A right choice leaves both sides fine. Spoiling talk is not to be accepted as normal.
//   Ko Lwin (in his shop `carvershop`) has stopped carving since his pupil Khwar Nyo's design won and his
//   own block was sent back. Looks in the post room `postroom` (her forty trial blocks, the offer letter,
//   the contest notice) and at his cold bench; the envelope seller's rumour in the tea shop `teashop`;
//   talk (Lucky You leaves for good); `carve` the border, lifting for each hot thought; `ownwords` his
//   unsigned note; Maya carries the bundle on foot to the post room; he carves again; `stampblock`.
// Ch 2 (p20–25): where you grow up matters and the world is unfair; blame neither it nor anyone; nobody
// chose it; hardship meets everyone; how you meet it is yours, and steering makes you needed.
//   Ko Thiha drifts on his mother's patched raft at Little Jetty. Maung Nge's parcels for the shallow
//   jetties; the ferryman bailing; `sort` his list in Daw Sanda's house `sandahouse` (nobody chose this /
//   mine to choose); looks (patches, grip, bail, shallow, shifts in the weigh-house `weighhouse`); talk on the
//   jetty; `pole` to Duck Jetty and Cane Jetty; Daw Sanda at the scale, inside the weigh-house.
// Main quest: at Jetty End the Painted Map's bridge is only on the map: the quill rubs it out; Nay Chi asks
// Maya what to do, and Maya tells her (Act 1: the town leans on Maya).
// No markers anywhere: every "where" is said by someone or can be seen. Burmese lines are drafts for Maya.
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { sort } from './acts/sort.js';
import { pole } from './acts/pole.js';
import { carve } from './acts/carve.js';
import { ownwords } from './acts/ownwords.js';
import { nightPage, morningPost, showSlip } from './post.js';
import { TALK_D5_KOLWIN, TALK_D5_THIHA } from './talks/day5.js';
import { L, SLEPT4, SLEPT5, PROOFS, WALKON_NAMES } from './day5-lines.js';
import { buildDay5World, spawnWalkOn, removeWalkOn, lookCard, bundleProp, LOOKS, JETTY } from './day5-world.js';
import { DOORS } from './doors.js';
import { VoxelBuilder } from '../game/voxel.js';

export { SLEPT5 }; // Day 6's morning reads tonight's table

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const PI = Math.PI;

// The beats in order (window.__day5.skipTo): flags each sets, and where Maya stands for the next one.
const BEATS = [
  { id: 'morning', flags: { morning: true, news: true }, comps: ['pot', 'cloud'] },
  { id: 'market', flags: { market: true, appr: true }, place: 'carvers' },
  { id: 'klMet', flags: { klMet: true, klLook: true }, place: 'postroom' },
  { id: 'looked', flags: { kn1: true, 'look.trials': true, 'look.offer': true, 'look.notice': true, 'look.bench': true, looked: true }, proofs: ['copied'], place: 'carvers' },
  { id: 'klTalk', flags: { klTalk: true }, place: 'carvers' },
  { id: 'carved', flags: { carved: true, nicks: 0 }, place: 'carvers' },
  { id: 'note', flags: { note: true, bundle: true }, place: 'postroom' },
  { id: 'carried', flags: { carried: true, inkLine: true }, place: 'carvers' },
  { id: 'ch10Done', flags: { ch10Done: true }, give: ['stampblock'], gone: ['lucky'], place: 'wharf' },
  { id: 'arrived', flags: { arrived: true, mnMet: true }, place: 'raft' },
  { id: 'thMet', flags: { thMet: true }, place: 'sanda' },
  { id: 'sorted', flags: { sorted: true }, place: 'raft' },
  { id: 'looked2', flags: { 'look2.patches': true, 'look2.grip': true, 'look2.bail': true, 'look2.shallow': true, 'look2.shifts': true, looked2: true, fmMet: true }, proofs: ['ferry', 'eastbank'], place: 'raft' },
  { id: 'thTalk', flags: { thTalk: true }, place: 'raft' },
  { id: 'poled', flags: { poled: true }, place: 'weigh' },
  { id: 'ch2Done', flags: { ch2Done: true }, place: 'jettyEnd' },
  { id: 'bridge', flags: { bridge: true, ncMet: true, ncTold: 0 }, proofs: ['bridge'], place: 'home' },
];

export async function create(story) {
  const { game, dialog: D, save } = story;
  const F = (k, v) => story.flag(`d5.${k}`, v);
  const ow = story.openWorld;
  const v3 = new THREE.Vector3();
  const W = buildDay5World(story);
  const A = W.A;
  W.setCarved(!!F('carved'));
  const nameEl = () => document.querySelector('#dialog .dialog-name');
  const ab = game.world.places.find((p) => p.id === 'about')?.door || { x: 0, z: 7 };

  // ---------------------------------------------------------------------------------------------
  // small helpers
  // ---------------------------------------------------------------------------------------------
  /** say for walk-ons (no cast id): D.say sets the name synchronously, then we put the real one in */
  function say(id, lines, opts = {}) {
    const pr = D.say(id, lines, opts);
    if (WALKON_NAMES[id]) { const n = nameEl(); if (n) n.textContent = tr(WALKON_NAMES[id]); }
    return pr;
  }
  /** run a little scene with the story marked busy (station taps and prop taps) */
  async function withTalk(fn) {
    if (story.talking) return;
    story.talking = true;
    try { await fn(); } catch (e) { console.error('day5', e); } finally { story.talking = false; game.ui.cinema(false); }
  }
  const proof = (id) => {
    if (story.has(`proof:${id}`)) return;
    save.proofs[id] = PROOFS[id];
    story.give(`proof:${id}`);
    story.flag(`rumour.${id}`, 'checked');
    F(`rumour.${id}`, true);
  };
  const heard = (id) => { if (!story.flag(`rumour.${id}`)) story.flag(`rumour.${id}`, 'heard'); };
  const mayaXZ = () => {
    if (story.foot?.active && !story.inRoom) return { x: story.foot.pos.x, z: story.foot.pos.y };
    const p = story.inRoom ? null : game.car.root.position;
    return p ? { x: p.x, z: p.z } : { x: 0, z: 0 };
  };
  const place = (e, at) => {
    if (!e) return;
    e.walking = null;
    e.p.root.position.set(at.x, 0, at.z);
    e.p.root.rotation.y = at.heading ?? 0;
    e.home = { x: at.x, z: at.z, h: at.heading ?? 0 };
    e.ob.x = at.x; e.ob.z = at.z;
  };

  // ---------------------------------------------------------------------------------------------
  // people outdoors (the rooms' people come from roomCast below)
  // ---------------------------------------------------------------------------------------------
  const outdoor = {};
  outdoor.wintwar = story.spawn('wintwar', { x: ab.x + 2.6, z: ab.z + 1.2, heading: -PI / 2 });
  story.setJob('wintwar', { area: { x: ab.x + 3.5, z: ab.z + 2.2, r: 3.2 }, spot: { x: ab.x + 2.6, z: ab.z + 1.2, h: -0.4 }, mood: 'read', workChance: 0.5, workFor: [5, 9] });
  outdoor.thiri = story.spawn('thiri', A.thiri);
  outdoor.maungnge = story.spawn('maungnge', A.maungnge);
  const thihaSpot = () => (F('ch2Done') ? A.kothiha : F('poled') ? A.kothihaMum : F('thMet') && !F('sorted') ? sandaFront() : A.kothiha);
  outdoor.kothiha = story.spawn('kothiha', thihaSpot());
  if (!F('thTalk')) { outdoor.kothiha.baseMood = 'down'; outdoor.kothiha.p.setMood('down'); }
  // the first meeting: he sits on his mother's raft below Little Jetty, the pole by him, drifting on its rope
  // (6.2), not standing on the planks; he climbs up onto the jetty when he goes to his door
  const outSeats = new Map(); // outdoor sitters: id -> hips height
  const thihaRaft = A.raft ? { x: A.raftAt.x + 0.75, z: A.raftAt.z - 0.42, y: -0.2, heading: PI } : null;
  if (thihaRaft && !F('thMet') && outdoor.kothiha) {
    place(outdoor.kothiha, thihaRaft);
    outdoor.kothiha.p.root.position.y = thihaRaft.y;
    outSeats.set('kothiha', 0.1);
  }
  outdoor.naychi = story.spawn('naychi', A.naychi);
  const walkOnIds = [];
  const wo = (id, at) => { const e = spawnWalkOn(story, id, LOOKS[id], at, WALKON_NAMES[id]); walkOnIds.push(id); return e; };
  wo('carver1', A.carver1);
  wo('carver2', A.carver2);
  wo('ferryman', A.ferryman);
  wo('porterW1', A.porterW1);
  wo('porterW2', A.porterW2);
  if (F('appr')) { wo('appr1', { ...A.apprStop[0], heading: PI }); wo('appr2', { ...A.apprStop[1], heading: PI }); }
  function sandaFront() { const d = A.sandaDoor; return { x: d.x + Math.sin(d.facing) * 0.9, z: d.z + Math.cos(d.facing) * 0.9 + 0.6, heading: d.facing + PI }; }
  // Daw Sanda's door opens only once Ko Thiha opens it (6.2)
  if (F('thMet') && !DOORS.sandahouse) A.reg([A.sandaDoor]);

  // the Painted Map's bridge at Jetty End (Day 4 painted it; if not, it is drawn here from the same item)
  const JE = A.J?.end || { x: JETTY.end.tip, z: JETTY.end.z };
  const END_AT = { x: JE.x - 2.5, z: JE.z + 0.4 };
  function bridgeStroke() {
    if (!story.has('paintedmap')) return null;
    let s = save.paint.find((x) => x.rumour === 'bridge');
    const pts = [[JE.x - 1, JE.z], [JE.x + 9, JE.z - 0.5], [JE.x + 19, JE.z - 1.5], [JE.x + 29, JE.z - 2]];
    if (!s) story.paint.add({ id: 'd5bridge', rumour: 'bridge', pts, at: END_AT, color: '#E0503A' });
    else if (!s.at || Math.hypot(s.at.x - END_AT.x, s.at.z - END_AT.z) > 8) {
      const near = s.pts?.some(([x, z]) => Math.hypot(x - END_AT.x, z - END_AT.z) < 15);
      story.paint.add({ ...s, at: END_AT, pts: near ? s.pts : pts });
    }
    return save.paint.find((x) => x.rumour === 'bridge');
  }
  bridgeStroke();
  const onRub0 = story.paint.onRub;
  story.paint.onRub = (s) => { onRub0?.(s); if (s?.rumour === 'bridge') bridgeRubbed(); };

  // ---------------------------------------------------------------------------------------------
  // 4. morning
  // ---------------------------------------------------------------------------------------------
  async function morning() {
    if (!story.foot.active) await story.foot.toFoot();
    story.refreshHud?.();
    const mp = game.maya.root.position;
    if (Math.hypot(mp.x - ab.x, mp.z - ab.z) > 24 && ow) { ow.jump(ab.x, ab.z + 1.2, 0); }
    await morningPost(story, {
      day: 5,
      ww: L.ww1,
      slept: SLEPT4,
      after: L.ww2,
      letters: [{ from: 'kophyo', text: L.kpNote }],
      companions: ['pot', 'cloud'],
      lift: { cloud: [L.lift, L.liftMaya] },
    });
    story.talking = true;
    game.ui.cinema(true);
    try {
      await showSlip(game, L.ttQ, { kind: 'question' });
      await D.say('wintwar', L.ww3, { face: 'smile' });
      heard('ferry');
      F('news', true);
      F('morning', true);
    } finally { story.talking = false; game.ui.cinema(false); }
  }

  // ---------------------------------------------------------------------------------------------
  // 5. chapter 10 — Ko Lwin and Khwar Nyo
  // ---------------------------------------------------------------------------------------------
  async function apprentices() {
    F('appr', true);
    const m = mayaXZ();
    const a1 = wo('appr1', { x: m.x + 1.6, z: m.z - 1.2, heading: PI });
    const a2 = wo('appr2', { x: m.x + 2.3, z: m.z - 0.6, heading: PI });
    void a1; void a2;
    story.walkPerson('appr1', A.apprStop[0].x, A.apprStop[0].z, 1.15).then(() => { const e = story.people.get('appr1'); if (e) e.home.h = A.carvershop.facing + PI; });
    story.walkPerson('appr2', A.apprStop[1].x, A.apprStop[1].z, 1.1).then(() => { const e = story.people.get('appr2'); if (e) e.home.h = A.carvershop.facing + PI; });
    await story.wait(900);
    story.bark('appr1', L.appr, 5200);
  }

  const lookIds = ['trials', 'offer', 'notice', 'bench'];
  const look2Ids = ['patches', 'grip', 'bail', 'shallow', 'shifts'];
  async function look(id, ch = 10) {
    const [pen, gold] = L.look[id];
    await lookCard(game, pen, gold, { heard: L.lookHeard, seen: L.lookSeen, tap: L.lookTap });
    if (ch === 10) {
      F(`look.${id}`, true);
      if (id === 'offer') await D.say('maya', L.offerMaya, { face: 'think' });
      if (id === 'notice') proof('copied');
      if (!F('looked') && lookIds.every((k) => F(`look.${k}`))) { F('looked', true); await D.say('maya', L.lookedAll, { face: 'think' }); }
    } else {
      F(`look2.${id}`, true);
      if (!F('looked2') && look2Ids.every((k) => F(`look2.${k}`))) { F('looked2', true); await D.say('maya', L.looked2, { face: 'think' }); }
    }
  }

  async function klTalk(e) {
    if (F('ch10Done')) return D.say('kolwin', L.klAfter, { face: 'smile' });
    if (F('carried')) return klEnd();
    if (F('note')) {
      if (story.carrying?.name !== 'd5Bundle') { giveBundle(); return D.say('kolwin', L.klSend, { face: 'think' }); }
      return D.say('kolwin', L.klWaiting, { face: 'think' });
    }
    if (F('carved')) return noteAct();
    if (F('klTalk')) return carveAct();
    if (!F('klMet')) {
      await D.say('kolwin', L.kl1, { face: 'think', mood: 'down' });
      for (;;) {
        const i = await D.choose(L.klChoices);
        if (i === 0) { F('luckySaid', true); await D.say('kolwin', L.klLucky, { face: 'hot' }); await D.say('maya', L.klLuckyMaya, { face: 'think' }); continue; }
        if (i === 1) { await D.say('kolwin', L.klForget, { face: 'hot' }); await D.say('maya', L.klForgetMaya, { face: 'think' }); continue; }
        break;
      }
      await D.say('kolwin', L.klGo, { face: 'sad' });
      F('klMet', true);
      F('klLook', true);
      return;
    }
    if (!F('looked')) return D.say('kolwin', L.klGo, { face: 'sad' });
    if (story.talk.waiting(TALK_D5_KOLWIN.id)) return D.say('kolwin', L.klNotYet, { face: 'think' });
    const r = await story.talk.run({ ...TALK_D5_KOLWIN, steam: TALK_D5_KOLWIN.steam + (F('luckySaid') ? 1 : 0) });
    if (!r.won) return;
    F('klTalk', true);
    // he turns to face his bench from now on
    if (e) { e.p.root.rotation.y = PI; e.home.h = PI; }
    await carveAct();
  }

  async function carveAct() {
    const room = story.room;
    await D.say('maya', L.klLight, { face: 'smile' });
    call(room, 'set', 'lit', true);
    call(room, 'set', 'block', 'bare');
    call(game.audio, 'play', 'chime');
    const r = await carve({
      title: L.carveTitle, hint: L.carveHint, heat: L.heat, nickStays: true,
      lines: { firstLift: L.firstLift, lift: L.laterLift, nick: L.nick, done: L.carved },
    });
    if (!r || r.cancelled) { call(room, 'set', 'lit', false); call(room, 'set', 'block', 'cloth'); return; }
    F('carved', true);
    F('nicks', Math.max(0, Math.min(3, r.nicks | 0)));
    W.setCarved(true);
    await D.say('kolwin', [L.carved], { face: 'think' });
    await noteAct();
  }

  async function noteAct() {
    const r = await ownwords({ title: L.noteTitle, hint: L.noteHint, prompt: L.notePrompt, fragments: L.noteFragments, need: 3 });
    if (!r || r.cancelled || !r.ok) return;
    if ((r.picks || []).some((k) => !L.noteFragments[k]?.good)) await D.say('kolwin', L.noteWrong, { face: 'think' });
    F('note', true);
    call(story.room, 'set', 'apron', false);
    await D.say('maya', L.apronIn, { face: 'think' });
    await D.say('kolwin', L.klSend, { face: 'think' });
    giveBundle();
  }
  function giveBundle() {
    if (story.carrying?.name === 'd5Bundle') return;
    F('bundle', true);
    story.carry(bundleProp(), { lift: 0.62, speed: 0.75 });
  }

  // 5.7 the close: in the post room with the bundle
  async function postClose() {
    const e = story.people.get('khwarnyo');
    if (e && !story.talking) {
      // through story.talkTo: she walks up beside Khwar Nyo and the low two-shot shows both faces
      const on0 = e.onTalk;
      e.onTalk = async () => {
        await story.wait(200);
        story.carry(null, { remove: true });
        call(story.room, 'set', 'carved', true);
        await D.say('khwarnyo', L.knEnd, { face: 'happy' });
        await D.say('maya', L.knLooks, { face: 'smile' });
        await D.say('khwarnyo', L.knAsk, { face: 'think' });
        await D.say('maya', L.mayaInk, { face: 'smile' });
        F('inkLine', true);
        F('carried', true);
      };
      try { await story.talkTo(e); } finally { e.onTalk = on0; }
      if (F('carried')) return;
    }
    story.talking = true;
    game.ui.cinema(true);
    try {
      const s = story.room?.spots?.mayaKn1;
      if (s) await new Promise((res) => { let d = false; const fin = () => { if (!d) { d = true; res(); } }; story.foot.walkTo(s.x, s.z, fin); setTimeout(fin, 5000); });
      if (e) await story.wait(200);
      story.carry(null, { remove: true });
      call(story.room, 'set', 'carved', true);
      await D.say('khwarnyo', L.knEnd, { face: 'happy' });
      await D.say('maya', L.knLooks, { face: 'smile' });
      await D.say('khwarnyo', L.knAsk, { face: 'think' });
      await D.say('maya', L.mayaInk, { face: 'smile' });
      F('inkLine', true);
      F('carried', true);
    } finally { story.talking = false; game.ui.cinema(false); }
  }

  async function klEnd() {
    const e = story.people.get('kolwin');
    if (e) { e.p.root.rotation.y = PI; e.home.h = PI; }
    await D.say('kolwin', L.klEnd, { face: 'happy' });
    story.give('stampblock');
    await D.say('maya', L.mayaEnd, { face: 'think' });
    story.lookalikeGone('lucky');
    if (!save.lookalikesGone.includes('lucky')) save.lookalikesGone.push('lucky');
    F('ch10Done', true);
    story.persist();
  }

  async function sellerTalk() {
    if (F('copiedSaid') === 1) return say('seller', L.esAfter, { face: 'smile' });
    await say('seller', L.es1, { face: 'talk' });
    const opts = F('look.trials') ? L.esChoices : [L.esChoices[0], { my: '"ကိုယ်တိုင် မမြင်ရသေးဘူး။"', en: '"I haven\'t seen it myself yet."' }]; // (added) without the blocks seen, Maya can only hold back
    const i = await D.choose(opts);
    if (i === 0) { F('copiedSaid', 0); await D.say('maya', L.esLaugh, { face: 'think' }); return; }
    if (F('look.trials')) { F('copiedSaid', 1); await say('seller', L.esStop, { face: 'sad' }); }
  }

  // ---------------------------------------------------------------------------------------------
  // 6. chapter 2 — Ko Thiha and his mother's raft
  // ---------------------------------------------------------------------------------------------
  async function thihaTalk(e) {
    if (F('ch2Done')) return D.say('kothiha', L.thAfter, { face: 'smile' });
    if (F('poled')) return D.say('kothiha', L.thToWeigh, { face: 'think' });
    if (F('thTalk')) return poleScene();
    if (!F('thMet')) {
      await D.say('kothiha', L.th1, { face: 'sad', mood: 'down' });
      for (;;) {
        const i = await D.choose(L.thChoices);
        if (i === 0) { await D.say('kothiha', L.thBlame, { face: 'sad' }); await D.say('maya', L.thBlameMaya, { face: 'think' }); continue; }
        if (i === 1) { F('raceSaid', true); await D.say('kothiha', L.thRace, { face: 'hot' }); await D.say('maya', L.thRaceMaya, { face: 'think' }); continue; }
        break;
      }
      await D.say('kothiha', L.thList, { face: 'think' });
      F('thMet', true);
      if (!DOORS.sandahouse) A.reg([A.sandaDoor]);
      // he ties the raft, walks up to his door and opens it; Maya follows if she likes
      const f = sandaFront();
      if (outSeats.delete('kothiha') && e) { place(e, { ...A.kothiha, heading: e.p.root.rotation.y }); e.p.update(0, { speed: 0 }); } // up onto the jetty
      story.talking = false;
      story.walkPerson('kothiha', f.x, f.z, 1.3).then(() => { if (e) { e.p.root.rotation.y = f.heading; e.home.h = f.heading; } });
      return;
    }
    if (!F('sorted')) return D.say('kothiha', L.thList, { face: 'think' });
    if (!F('looked2')) return D.say('kothiha', L.thWait, { face: 'sad' });
    if (story.talk.waiting(TALK_D5_THIHA.id)) return D.say('kothiha', L.thNotYet, { face: 'sad' });
    const r = await story.talk.run({ ...TALK_D5_THIHA, steam: TALK_D5_THIHA.steam + (F('raceSaid') ? 1 : 0) });
    if (!r.won) return;
    F('thTalk', true);
    if (e) { e.baseMood = null; e.p.setMood(null); }
    await poleScene();
  }

  async function sortScene() {
    const room = story.room;
    story.talking = true;
    game.ui.cinema(true);
    try {
      const s = room?.spots?.maya;
      if (s) await new Promise((res) => { let d = false; const fin = () => { if (!d) { d = true; res(); } }; story.foot.walkTo(s.x, s.z, fin); setTimeout(fin, 5000); });
      await D.say('kothiha', L.thTiffin, { face: 'think' });
      await D.say('kothiha', L.thRead, { face: 'sad' });
      const r = await sort({
        title: L.sortTitle, hint: L.sortHint, who: 'kothiha',
        baskets: L.sortBaskets, cards: L.sortCards,
        react: { nobody: L.sortWrongMine, mine: L.sortWrongNobody }, wrong: L.sortWrongNobody,
      });
      if (!r || r.cancelled) return;
      F('sorted', true);
      await D.say('kothiha', L.thSorted, { face: 'think' });
      await D.say('maya', L.mayaSorted, { face: 'smile' });
      await D.say('kothiha', L.thBackDown, { face: 'smile' });
    } finally { story.talking = false; game.ui.cinema(false); }
    // he pins the page back, takes the tiffin and goes down to the raft; Maya may stay (the grip look)
    const e = story.people.get('kothiha');
    if (e && story.inRoom === 'sandahouse') {
      const out = room?.spots?.entry || { x: 0, z: 2.3 };
      story.walkPerson('kothiha', out.x, out.z, 1.3).then(() => { if (story.inRoom === 'sandahouse') story.remove('kothiha'); });
    }
    place(outdoor.kothiha, A.kothiha);
  }

  async function poleScene() {
    const mn = outdoor.maungnge, th = outdoor.kothiha;
    story.talking = true;
    game.ui.cinema(true);
    let r = null;
    try {
      await D.say('kothiha', L.poleBoard, { face: 'happy' });
      if (mn) { place(mn, { x: A.kothiha.x - 1.6, z: A.kothiha.z, heading: 0 }); }
      call(A.raft, 'setParcels', 4);
      call(A.raft, 'setPole', false);
      r = await pole({
        title: L.poleTitle, hint: L.poleHint, route: 'raftSide',
        stops: [{ id: 'duck', at: 0.42, label: { my: 'ဘဲဆိပ်', en: 'Duck Jetty' } }, { id: 'cane', at: 0.78, label: { my: 'ကြိမ်ဆိပ်', en: 'Cane Jetty' } }],
        beat: 1100, window: 220, current: 0.6, ferryPasses: 0.25,
        lines: { ferry: L.poleFerry, drift: L.poleDrift, half: L.poleHalf, duck: L.poleDuck, cane: L.poleCane },
      });
    } finally {
      story.talking = false;
      game.ui.cinema(false);
      call(A.raft, 'setParcels', 0);
      call(A.raft, 'setPole', true);
      if (mn) place(mn, A.maungnge);
    }
    if (!r || r.cancelled) return;
    F('poled', true);
    if (th) story.walkPerson('kothiha', A.kothihaMum.x, A.kothihaMum.z, 1.4).then(() => { th.p.root.rotation.y = A.kothihaMum.heading; th.home.h = A.kothihaMum.heading; });
    await story.wait(300);
    if (!story.talking) await withTalk(() => D.say('kothiha', L.thToWeigh, { face: 'happy' }));
  }

  async function weighClose() {
    story.talking = true;
    game.ui.cinema(true);
    const ds = story.people.get('dawsanda'), kt = story.people.get('kothiha');
    const with0 = story.talkWith;
    if (ds && kt) {
      // they turn to each other; the room's cut-away clears what stands before her (the scale's frame)
      const a = ds.p.root.position, b = kt.p.root.position;
      ds.p.root.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      kt.p.root.rotation.y = Math.atan2(a.x - b.x, a.z - b.z);
      story.talkWith = ds;
      try { pairShot(ds, kt); } catch (err) { console.warn('day5 pair shot', err); }
    }
    try {
      await D.say('dawsanda', L.ds1, { face: 'smile' });
      await D.say('kothiha', L.thMum, { face: 'worried' });
      await D.say('dawsanda', L.ds2, { face: 'smile' });
      await D.say('kothiha', L.thEnd, { face: 'happy' });
    } finally { story.talkWith = with0; story.talking = false; game.ui.cinema(false); game.rig.release(); }
    // he shoulders the first sack and carries it out: the answer is done, not said
    const room = story.room;
    const pick = room?.spots?.sackPick, out = room?.spots?.entry;
    if (pick) await Promise.race([story.walkPerson('kothiha', pick.x - 0.5, pick.z, 1.3), story.wait(5000)]);
    const e = story.people.get('kothiha');
    if (e) call(e.p, 'emote', 'cheer');
    if (out) story.walkPerson('kothiha', out.x, out.z, 1.1).then(() => { if (story.inRoom === 'weighhouse') story.remove('kothiha'); });
    await withTalk(() => D.say('maya', L.mayaEnd2, { face: 'smile' }));
    F('ch2Done', true);
  }

  async function weighCheck() {
    const sc = story.room?.props?.scale;
    call(sc, 'kick', 1);
    call(sc, 'settle', 0);
    call(game.audio, 'play', 'thud');
    await D.say('maya', L.weighCheck, { face: 'smile' });
    proof('weigh');
  }

  // ---------------------------------------------------------------------------------------------
  // 7. the bridge at Jetty End, Nay Chi, the desks, the board
  // ---------------------------------------------------------------------------------------------
  let mapWait = false, endInside = false, bridgeBusy = false;
  async function bridgeBeat() {
    if (bridgeBusy || F('bridge')) return;
    bridgeBusy = true;
    try {
      const s = bridgeStroke();
      await withTalk(async () => {
        if (s && s.state === 'paint') await D.say('maya', L.bridgeMaya, { face: 'think' });
        else await D.say('maya', L.eastLook, { face: 'think' });
      });
      if (s && s.state === 'paint') { mapWait = true; story.paint.open(); } else { bridgeRubbed(); }
    } finally { bridgeBusy = false; }
  }
  function bridgeRubbed() {
    if (F('bridge')) return;
    F('bridge', true);
    proof('bridge');
    if (!story.has('proof:eastbank')) proof('eastbank');
    if (!mapWait) { ncScene(); return; }
    // the map closes itself a moment after the rub (the smudge seen first); update() then starts Nay Chi's scene
    setTimeout(() => { const m = document.getElementById('story-map'); if (m) (m.querySelector('.x') || m).click(); }, 1300);
  }
  async function ncScene() {
    if (F('ncMet') || story.talking || game.busy) return;
    const e = story.people.get('naychi');
    if (e && story.foot.active && !story.inRoom) await story.talkTo(e);
  }
  async function naychiTalk() {
    if (F('ncMet')) return D.say('naychi', L.ncWait, { face: 'smile' });
    if (!F('bridge')) {
      await D.say('naychi', L.ncBefore, { face: 'worried' });
      setTimeout(() => bridgeBeat(), 50);
      return;
    }
    await D.say('naychi', L.nc1, { face: 'worried' });
    const i = await D.choose(L.ncChoices);
    F('ncTold', i);
    await D.say('naychi', L.ncAfter, { face: 'happy' });
    await D.say('maya', L.mayaNc, { face: 'think' });
    F('ncMet', true);
    // the reply letter's back page gains a second pencil line (Act 1's confidence; Day 8 crosses half out)
    save.home.replyLines = (save.home.replyLines || []).filter((x) => x.day !== 5);
    save.home.replyLines.push({ day: 5, line: L.replyLine, pencil: true });
    story.persist();
  }

  // desks: the Wharf head and Jetty End ask first what Maya sees there herself (pencil vs gold, 7.1/7.3)
  const lightDesk0 = ow?.lightDesk;
  if (ow && lightDesk0) {
    ow.lightDesk = async (d) => {
      const mine = d.id === 'wharfHead' || d.id === 'wharfEnd';
      if (mine && !d.unlocked) {
        if (story.talking || game.busy) return;
        let ok = false;
        await withTalk(async () => {
          await D.say('maya', [L.deskHeadQ], { face: 'think' });
          const lines = d.id === 'wharfHead' ? L.deskHead : L.deskEnd;
          for (;;) { const i = await D.choose(lines); if (i === 0) break; await D.say('maya', [L.deskWrong], { face: 'think' }); }
          ok = true;
        });
        if (!ok) return;
      }
      await lightDesk0.call(ow, d);
      if (!mine) return;
      if (d.id === 'wharfHead' && !F('desk')) {
        F('desk', true);
        proof('ferry');
        heard('weigh'); heard('eastbank'); heard('bridge');
        await withTalk(() => D.say('maya', L.deskHeadDone, { face: 'happy' }));
      }
      if (d.id === 'wharfEnd' && !F('deskEnd')) { F('deskEnd', true); proof('eastbank'); proof('bridge'); }
    };
  }

  // a ribbon (page-turn) while carrying the bundle: she walks (5.7)
  const travel0 = ow?.travel;
  if (ow && travel0) {
    ow.travel = async (id) => {
      if (story.carrying?.name === 'd5Bundle') { story.bark('maya', L.carryWalk, 3200); return; }
      return travel0.call(ow, id);
    };
    ow.travel.__guarded = true;
  }

  // the "ask Maya" board (7.4), the shared one (api.js story.board): 22 notes, two new ones to answer
  const board = story.board.root;
  story.board.set({ notes: 22, replies: F('board') ? 5 : 3 });
  async function boardRead() {
    if (!F('evening')) { await D.say('maya', L.wwEvening.map((l) => ({ ...l })), { face: 'smile' }); return; }
    await D.say('maya', L.boardQ, { face: 'think' });
    for (let k = 0; k < L.board.length; k++) {
      const n = L.board[k];
      await D.say('maya', [{ my: `${n.from.my}: "${n.my}"`, en: `${n.from.en}: "${n.en}"` }], { face: 'think' });
      const i = await D.choose(n.replies);
      F(`boardReply${k + 1}`, i);
    }
    F('board', true);
    story.board.set({ replies: 5 });
    await D.say('maya', L.boardDone, { face: 'smile' });
  }

  // ---------------------------------------------------------------------------------------------
  // taps on outdoor things (no markers: the raft, the ferry, the sandbar, the board are simply there)
  // ---------------------------------------------------------------------------------------------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  // (a thing Day 5 built is hit by a ray; one the district drew into its merged chunks by a point on the water)
  const WATER = -0.6;
  const propTaps = [
    { id: 'patches', objs: [A.raft?.root], at: A.raft ? null : { ...A.raftAt, y: WATER }, walk: () => ({ x: A.kothiha.x - 1.4, z: A.kothiha.z + 0.1 }), fn: () => look('patches', 2) },
    { id: 'bail', objs: [A.ferry?.root], at: A.ferry ? null : { ...A.ferryAt, y: WATER }, walk: () => ({ x: A.ferryman.x - 1.3, z: A.ferryman.z + 0.2 }), fn: () => look('bail', 2) },
    { id: 'shallow', objs: A.sandbarObjs || [], at: (A.sandbarObjs || []).length ? null : { ...A.sandbar, y: WATER }, fn: () => look('shallow', 2) },
    { id: 'board', objs: [board], walk: () => story.board.stand, fn: () => boardRead() },
  ].map((t) => ({ ...t, objs: t.objs.filter(Boolean) })).filter((t) => t.objs.length || t.at);
  const tapPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const tapPt = new THREE.Vector3();
  function personNear(x, y) {
    for (const e of story.people.values()) for (const h of [0.4, e.p.height * 0.75]) {
      const q = game.rig.project(v3.set(e.p.root.position.x, h, e.p.root.position.z), game.viewW, game.viewH);
      if (q && Math.hypot(q.x - x, q.y - y) < 52) return true;
    }
    return false;
  }
  const tapHook = (x, y) => {
    if (story.inRoom || story.talking || game.busy || !story.foot?.active || game.mode !== 'world') return false;
    if (personNear(x, y)) return false;
    ndc.set((x / game.viewW) * 2 - 1, -(y / game.viewH) * 2 + 1);
    ray.setFromCamera(ndc, game.camera);
    let best = null;
    for (const t of propTaps) {
      if (t.objs.length) {
        const hits = ray.intersectObjects(t.objs, true).filter((h) => h.object.visible && !h.object.userData.isOutline);
        if (hits[0] && (!best || hits[0].distance < best.h.distance)) best = { t, h: hits[0] };
      } else if (t.at) {
        tapPlane.constant = -(t.at.y ?? 0);
        const q = ray.ray.intersectPlane(tapPlane, tapPt);
        if (q && Math.hypot(q.x - t.at.x, q.z - t.at.z) < (t.at.r ?? 2)) {
          const dist = ray.ray.origin.distanceTo(q);
          if (!best || dist < best.h.distance) best = { t, h: { point: q.clone(), distance: dist } };
        }
      }
    }
    if (!best) return false;
    const mp = story.foot.pos, hp = best.h.point;
    if (Math.hypot(hp.x - mp.x, hp.z - mp.y) > 26) return false;
    const go = () => withTalk(best.t.fn);
    const w = best.t.walk?.();
    if (w && Math.hypot(w.x - mp.x, w.z - mp.y) > 2.5) story.foot.walkTo(w.x, w.z, (ok) => { if (ok !== false) go(); });
    else go();
    return true;
  };
  story.tapHooks.push(tapHook);

  // ---------------------------------------------------------------------------------------------
  // what people say
  // ---------------------------------------------------------------------------------------------
  const rot = {}; // rotating ambient lines
  const next = (k, list) => { const i = (rot[k] = ((rot[k] ?? -1) + 1) % list.length); return [list[i]]; };
  const talk = {
    wintwar: async () => {
      if (!F('morning')) return morning();
      if (!F('news')) { await D.say('wintwar', L.ww3, { face: 'smile' }); heard('ferry'); F('news', true); return; }
      if ((F('ch10Done') || F('ch2Done')) && !F('evening')) { F('evening', true); return D.say('wintwar', L.wwEvening, { face: 'smile' }); }
      if (F('ch10Done') && F('ch2Done')) return D.say('wintwar', L.wwAfterBoth, { face: 'happy' });
      return D.say('wintwar', L.wwLater, { face: 'smile' });
    },
    thiri: () => D.say('thiri', L.thiri, { face: 'smile' }),
    kolwin: (e) => klTalk(e),
    khwarnyo: async () => {
      if (F('carried')) return D.say('khwarnyo', L.knAfter, { face: 'happy' });
      if (!F('kn1')) { F('kn1', true); return D.say('khwarnyo', L.kn1, { face: 'smile' }); }
      return D.say('khwarnyo', L.knWait, { face: 'smile' });
    },
    luaye: () => D.say('luaye', L.luaye, { face: 'think' }),
    tintin: async () => {
      if (!F('donor')) {
        F('donor', true);
        await D.say('tintin', L.donorTintin, { face: 'think' });
        if (story.people.get('drinker')) await say('drinker', L.donorDrinker, { face: 'smile' });
        return;
      }
      if ((save.bag.tea || 0) < 3) { await D.say('tintin', L.tintinTea, { face: 'smile' }); story.give('tea'); return; }
      return D.say('tintin', L.tintinFull, { face: 'smile' });
    },
    drinker: async () => { if (!F('donor')) { F('donor', true); await D.say('tintin', L.donorTintin, { face: 'think' }); } return say('drinker', L.donorDrinker, { face: 'smile' }); },
    kophyo: () => D.say('kophyo', F('ch10Done') ? L.kophyoAfter : L.kophyo, { face: 'smile' }),
    seller: () => sellerTalk(),
    porterT1: () => say('porterT1', L.portersTea, { face: 'think' }),
    porterT2: () => say('porterT2', L.portersTea, { face: 'think' }),
    carver1: () => say('carver1', F('carved') ? L.carversAfter : next('c1', L.carvers), { face: F('carved') ? 'happy' : 'think' }),
    carver2: () => say('carver2', F('carved') ? L.carversAfter : next('c2', [L.carvers[1], L.carvers[0]]), { face: F('carved') ? 'happy' : 'think' }),
    appr1: () => say('appr1', [F('carved') ? L.apprAfter : L.appr], { face: 'talk' }),
    appr2: () => say('appr2', [F('carved') ? L.apprAfter : L.appr], { face: 'talk' }),
    maungnge: async () => {
      if (F('poled')) return D.say('maungnge', L.mnAfter, { face: 'happy' });
      if (!F('mnMet')) { await D.say('maungnge', L.mn1, { face: 'happy' }); F('mnMet', true); return; }
      return D.say('maungnge', L.mnWait, { face: 'smile' });
    },
    ferryman: async () => {
      if (F('poled')) return say('ferryman', L.fmAfter, { face: 'smile' });
      if (!F('fmMet')) {
        await say('ferryman', L.fm1, { face: 'talk' });
        F('fmMet', true);
        proof('ferry');
        proof('eastbank');
      } else if (F('ttAns') || !F('morning')) return say('ferryman', L.fmAgain, { face: 'smile' });
      if (F('morning') && !F('ttAns')) {
        await D.say('maya', L.fmAsk, { face: 'smile' });
        await say('ferryman', L.fmTT, { face: 'smile' });
        await D.say('maya', L.fmTTMaya, { face: 'happy' });
        F('ttAns', true);
      }
    },
    porterW1: async () => { const l = next('pw', L.portersW); if (l[0] === L.portersW[0]) heard('bridge'); if (l[0] === L.portersW[1]) heard('eastbank'); return say('porterW1', l, { face: 'talk' }); },
    porterW2: async () => { const l = next('pw', L.portersW); if (l[0] === L.portersW[0]) heard('bridge'); if (l[0] === L.portersW[1]) heard('eastbank'); return say('porterW2', l, { face: 'talk' }); },
    kothiha: (e) => thihaTalk(e),
    dawsanda: async () => {
      if (F('ch2Done')) return D.say('dawsanda', L.dsAfter, { face: 'smile' });
      heard('weigh');
      return D.say('dawsanda', next('ds', [L.dsScale[0], L.dsSon[0]]), { face: 'smile' });
    },
    naychi: () => naychiTalk(),
  };

  // ---------------------------------------------------------------------------------------------
  // rooms: who is inside, how the set is dressed, story taps
  // ---------------------------------------------------------------------------------------------
  // A camera on two people talking while Maya watches (story.js's two-shot is Maya + one): across their
  // line, the side nearer the room's usual camera first, backed off until both stand inside the frame;
  // a side where anyone else (a porter, Maya, a post) stands before either face is passed over.
  const shotRay = new THREE.Raycaster(), shotCam = new THREE.PerspectiveCamera(), shotPt = new THREE.Vector3();
  function pairShot(a, b) {
    const pa = a.p.root.position, pb = b.p.root.position;
    const mid = new THREE.Vector3((pa.x + pb.x) / 2, 0, (pa.z + pb.z) / 2);
    const look = mid.clone().setY(0.68);
    const norm = (h) => Math.atan2(Math.sin(h), Math.cos(h));
    const across = Math.atan2(pb.x - pa.x, pb.z - pa.z);
    const sides = [across + PI / 2, across - PI / 2].sort((x, y) => Math.abs(norm(x)) - Math.abs(norm(y)));
    const mine = (o) => { for (let q = o; q; q = q.parent) if (q === a.p.root || q === b.p.root) return true; return false; };
    const blockers = game.scene.children.filter((o) => o !== a.p.root && o !== b.p.root);
    const heads = [new THREE.Vector3(pa.x, (a.p.height || 1.2) * 0.8, pa.z), new THREE.Vector3(pb.x, (b.p.height || 1.2) * 0.8, pb.z)];
    shotCam.fov = game.camera.fov; shotCam.aspect = game.camera.aspect; shotCam.updateProjectionMatrix();
    const fit = (az, h) => {
      const rx = Math.cos(az), rz = -Math.sin(az);
      for (let d = 3.2; d < 11; d += 0.3) {
        shotCam.position.set(mid.x + Math.sin(az) * d, h, mid.z + Math.cos(az) * d);
        shotCam.lookAt(look); shotCam.updateMatrixWorld();
        let ok = true;
        for (const q of [pa, pb]) for (const y of [0.1, 1.3]) for (const s of [-0.42, 0.42]) {
          shotPt.set(q.x + rx * s, y, q.z + rz * s).project(shotCam);
          if (Math.abs(shotPt.x) > 0.8 || shotPt.y > 0.62) ok = false; // (the top band stays clear)
        }
        if (ok) return d;
      }
      return 11;
    };
    let pick = null, best = Infinity;
    for (const h of [1.7, 2.6]) for (const s of sides) for (const off of [0, 0.4, -0.4]) {
      const az = s + off, d = fit(az, h);
      const pos = new THREE.Vector3(mid.x + Math.sin(az) * d, h, mid.z + Math.cos(az) * d);
      let blocked = 0;
      for (const t of heads) {
        const dir = t.clone().sub(pos), len = dir.length();
        shotRay.set(pos, dir.normalize()); shotRay.far = len - 0.35;
        if (shotRay.intersectObjects(blockers, true).some((x) => x.object.visible && !x.object.userData.isOutline && !mine(x.object))) blocked++;
      }
      const score = blocked * 100 + d;
      if (score < best) { best = score; pick = pos; }
      if (!blocked && h === 1.7 && off === 0) break;
    }
    if (pick) game.rig.shot(pick, look, 0.8);
    return pick;
  }

  const seats = new Map(); // person id -> seat height (stools, benches, cushions)
  function roomCast(id, room) {
    seats.clear();
    const sp = room?.spots || {};
    const at = (name) => sp[name] ? { x: sp[name].x, z: sp[name].z, heading: sp[name].h ?? 0 } : null;
    const seat = (who, name) => { const s = sp[name]; const y = s?.seat ?? s?.sit; if (y != null) seats.set(who, y); };
    if (id === 'carvershop') {
      const s = F('klTalk') ? 'kolwinBench' : 'kolwin';
      seat('kolwin', s);
      return [{ id: 'kolwin', spot: s }];
    }
    if (id === 'postroom') { seat('luaye', 'luaye'); return [{ id: 'khwarnyo', spot: 'khwarnyo' }, { id: 'luaye', spot: 'luaye' }]; }
    if (id === 'teashop') {
      seat('kophyo', 'kophyo');
      const add = (who, name) => { const a = at(name); if (!a) return; spawnWalkOn(story, who, LOOKS[who], a, WALKON_NAMES[who]); seat(who, name); };
      add('seller', 'sellerA');
      add('drinker', 'yaungA');
      add('porterT1', 'drinkerB1');
      add('porterT2', 'drinkerB2');
      return [{ id: 'tintin', spot: 'tintin' }, { id: 'kophyo', spot: 'kophyo' }];
    }
    if (id === 'weighhouse') {
      const list = [{ id: 'dawsanda', spot: 'dawsanda' }, { id: 'clerk', spot: 'clerk' }, { id: 'porterC', spot: 'porter3' }];
      if (F('poled') && !F('ch2Done')) list.push({ id: 'kothiha', spot: 'kothiha' });
      return list;
    }
    if (id === 'sandahouse') {
      if (F('thMet') && !F('sorted')) { seat('kothiha', 'kothiha'); return [{ id: 'kothiha', spot: 'kothiha' }]; }
      return [];
    }
    return null; // other rooms: their own default people
  }

  async function enterRoom(id, room) {
    F(`in.${id}`, true);
    // still the shared close, low follow camera; a little wider in the three rooms whose people and boards
    // stand well off the doorway's line (Khwar Nyo's table, the tea-shop seller, the tally board)
    const roomView = () => { if ((id === 'postroom' || id === 'teashop' || id === 'weighhouse') && story.inRoom === id && story.doors?.roomCam) story.doors.roomCam({ width: 4.1 }); };
    roomView();
    if (id === 'carvershop') {
      call(room, 'set', 'lit', !!F('carved'));
      call(room, 'set', 'block', F('carved') ? 'bare' : 'cloth');
      call(room, 'set', 'apron', !F('note'));
      if (F('carried') && !F('ch10Done')) await withTalk(async () => { game.ui.cinema(true); await klEnd(); });
      return;
    }
    if (id === 'postroom') {
      call(room, 'set', 'carved', !!F('carved'));
      if (story.carrying?.name === 'd5Bundle' && !F('carried')) { await postClose(); roomView(); } // (back to the close follow camera after the scene)
      return;
    }
    if (id === 'weighhouse') {
      if (F('poled') && !F('ch2Done')) { await weighClose(); roomView(); }
      return;
    }
    if (id === 'sandahouse') {
      if (!F('thMet')) { await withTalk(() => D.say('maya', L.doorShut, { face: 'think' })); story.exit({ instant: true }); return; }
      if (!F('sorted')) await sortScene();
    }
  }

  function leaveRoom(id) {
    seats.clear();
    // the outdoor Ko Thiha goes where the story has him next (he is waiting outside while she is in)
    if (id === 'sandahouse' && F('sorted') && !F('thTalk')) place(outdoor.kothiha, A.kothiha);
    if (id === 'weighhouse' && F('ch2Done')) place(outdoor.kothiha, A.kothiha);
  }

  function station(sid, ctx) {
    const room = ctx?.room;
    const run = (fn) => { withTalk(fn); return true; };
    if (room === 'carvershop') {
      if (sid === 'bench') return run(() => look('bench'));
      if (sid === 'returned') return run(() => D.say('maya', L.returned, { face: 'think' }));
      if (sid === 'pupilPlace') return run(() => D.say('maya', L.pupilPlace, { face: 'think' }));
      if (sid === 'apron') return run(() => D.say('maya', F('note') ? L.apronGone : L.apronLook, { face: 'think' }));
      if (sid === 'blockRack') return run(() => D.say('maya', L.blockRack, { face: 'think' }));
      return false;
    }
    if (room === 'postroom') {
      if (sid === 'trials' || sid === 'offer' || sid === 'notice') {
        return run(async () => {
          if (!F('kn1') && sid !== 'notice') { F('kn1', true); await D.say('khwarnyo', L.kn1, { face: 'smile' }); }
          await look(sid);
        });
      }
      if (sid === 'benchDrop') return true;
      return false;
    }
    if (room === 'weighhouse') {
      if (sid === 'tally') return run(() => look('shifts', 2));
      if (sid === 'scale' || sid === 'checkweights') return run(() => weighCheck());
      if (sid === 'book') return run(() => D.say('maya', L.bookLook, { face: 'smile' }));
      return false;
    }
    if (room === 'sandahouse') {
      if (sid === 'basket') return run(() => (F('sorted') ? look('grip', 2) : D.say('maya', L.basketEarly, { face: 'think' })));
      if (sid === 'window') return run(() => D.say('maya', L.windowLook, { face: 'think' }));
      if (sid === 'list' || sid === 'table') { if (F('thMet') && !F('sorted') && story.people.get('kothiha')) { sortScene(); return true; } return false; }
      if (sid === 'tiffin') return run(() => D.say('maya', [{ my: '(ထမင်းချိုင့်ပေါ်မှာ «သီဟ» လို့ ရေးထားတယ်။)', en: '(The tiffin has «Thiha» written on it.)' }], { face: 'smile' })); // (added)
      return false;
    }
    return false;
  }

  // ---------------------------------------------------------------------------------------------
  // the night page (at the Writing Room door, as Day 1) — chapters 2 and 10
  // ---------------------------------------------------------------------------------------------
  let nightBusy = false;
  async function night() {
    if (nightBusy) return;
    nightBusy = true;
    try {
      await nightPage(story, {
        day: 5,
        truth: { q: L.nightQ, choices: L.nightChoices, right: 1, wrong: L.nightWrong },
        before: async () => { story.lookalikeGone('lucky'); },
        sleep: { q: L.sleepQ, who: ['kolwin', 'khwarnyo', 'kothiha', 'dawsanda', 'maungnge', ...(F('ncMet') ? ['naychi'] : [])] },
        stamps: [2, 10],
        stampText: L.stamp2,
        extra: L.stamp10,
        tomorrow: L.tomorrow,
      });
    } finally { nightBusy = false; }
  }

  // ---------------------------------------------------------------------------------------------
  // test hooks (window.__day5)
  // ---------------------------------------------------------------------------------------------
  // the night page waits until she has moved since the page loaded (a reload, or a skipTo, parks her by the
  // Writing Room: the night must not fire before the player can act)
  let armPos = null, armed = false;
  function nightArmed() {
    if (armed) return true;
    const c = story.foot.active ? { x: story.foot.pos.x, z: story.foot.pos.y } : { x: game.car.root.position.x, z: game.car.root.position.z };
    if (!armPos) { armPos = c; return false; }
    armed = Math.hypot(c.x - armPos.x, c.z - armPos.z) > 1.0;
    return armed;
  }
  const PLACES = {
    home: { x: ab.x, z: ab.z + 1.4 },
    market: { x: 7, z: 290 },
    carvers: { x: A.carvershop.x + Math.sin(A.carvershop.facing) * 1.6, z: A.carvershop.z + Math.cos(A.carvershop.facing) * 1.6 },
    postroom: { x: A.postroom.x, z: A.postroom.z + 1.5 },
    teashop: { x: A.teashop.x, z: A.teashop.z + 1.6 },
    wharf: { x: 62, z: 422 },
    pile: { x: A.maungnge.x - 1, z: A.maungnge.z + 0.5 },
    weigh: { x: A.weighhouse.x, z: A.weighhouse.z + 1.4 },
    raft: { x: A.kothiha.x - 1.6, z: A.kothiha.z },
    sanda: sandaFront(),
    ferry: { x: A.ferryman.x - 1.4, z: A.ferryman.z },
    jettyEnd: { x: JE.x - 5.2, z: JE.z + 0.4 },
  };
  const hooks = {
    BEATS: BEATS.map((b) => b.id),
    A, PLACES,
    flags: () => Object.fromEntries(Object.entries(save.flags).filter(([k]) => k.startsWith('d5.'))),
    /** set every beat before `id` as done, put Maya where the next beat happens, and reload */
    skipTo(id, { reload = true } = {}) {
      const k = BEATS.findIndex((b) => b.id === id);
      const upto = k < 0 ? BEATS.length : k;
      for (let i = 0; i < upto; i++) {
        const b = BEATS[i];
        for (const [f, v] of Object.entries(b.flags || {})) save.flags[`d5.${f}`] = v;
        for (const c of b.comps || []) if (!save.companions.includes(c)) save.companions.push(c);
        for (const p of b.proofs || []) { save.proofs[p] = PROOFS[p]; save.bag[`proof:${p}`] = 1; save.flags[`rumour.${p}`] = 'checked'; save.flags[`d5.rumour.${p}`] = true; }
        for (const g of b.give || []) save.bag[g] = 1;
        for (const g of b.gone || []) if (!save.lookalikesGone.includes(g)) save.lookalikesGone.push(g);
      }
      // (home: a few steps out from the Writing Room door, not on it: the night page waits for her to walk up)
      const pl = (BEATS[upto - 1] || {}).place || 'home';
      const at = pl === 'home' ? { x: ab.x + 1.2, z: ab.z + 3.4 } : PLACES[pl] || PLACES.home;
      save.place = { mode: 'foot', x: +at.x.toFixed(2), z: +at.z.toFixed(2), heading: 0 };
      story.persist();
      if (reload) location.reload();
      return upto;
    },
    /** jump Maya (on foot) to a named place */
    async go(name) {
      const at = PLACES[name];
      if (!at || !ow) return false;
      if (story.inRoom) await story.exit({ instant: true });
      if (!story.foot.active) await story.foot.toFoot();
      await ow.streamer?.ensureAsync?.(at.x, at.z);
      ow.jump(at.x, at.z, at.heading ?? 0);
      return true;
    },
    enter: (room) => story.enter(room),
    /** run a beat's scene directly */
    run(name, ...args) {
      const fns = {
        morning, apprentices, klTalk: () => withTalk(() => klTalk(story.people.get('kolwin'))), carve: () => withTalk(carveAct), note: () => withTalk(noteAct),
        bundle: giveBundle, close: postClose, klEnd: () => withTalk(klEnd), seller: () => withTalk(sellerTalk), sort: sortScene, pole: poleScene,
        weighClose, weighCheck: () => withTalk(weighCheck), bridge: bridgeBeat, nc: ncScene, night, board: () => withTalk(boardRead),
        look: (id) => withTalk(() => look(id, lookIds.includes(id) ? 10 : 2)),
      };
      return fns[name]?.(...args);
    },
    pairShot: (a, b) => pairShot(story.people.get(a), story.people.get(b)),
    rub: () => { const s = bridgeStroke(); return s ? story.paint.rub(s.id) : (bridgeRubbed(), true); },
  };
  window.__day5 = hooks;

  // ---------------------------------------------------------------------------------------------
  // the page
  // ---------------------------------------------------------------------------------------------
  return {
    talk,
    roomCast,
    enterRoom,
    leaveRoom,
    station,
    roomOpts: (id) => (id === 'weighhouse' || id === 'sandahouse' ? { day: 5 } : {}),
    dispose() {
      if (story.carrying?.name === 'd5Bundle') story.carry(null, { remove: true });
      const k = story.tapHooks.indexOf(tapHook);
      if (k >= 0) story.tapHooks.splice(k, 1);
      story.paint.onRub = onRub0 || null;
      if (ow && lightDesk0) ow.lightDesk = lightDesk0;
      if (ow && travel0) ow.travel = travel0;
      for (const id of ['wintwar', 'thiri', 'maungnge', 'kothiha', 'naychi', 'kolwin', 'khwarnyo', 'luaye', 'tintin', 'kophyo', 'dawsanda']) story.remove(id);
      for (const id of [...walkOnIds, 'appr1', 'appr2', 'seller', 'drinker', 'porterT1', 'porterT2']) removeWalkOn(story, id);
      W.dispose();
      if (window.__day5 === hooks) delete window.__day5;
    },
    async start() {
      if (!F('morning')) { await morning(); return; }
      if (F('bundle') && !F('carried') && !story.carrying) {
        if (!story.foot.active && !story.inRoom) await story.foot.toFoot();
        giveBundle();
      }
    },
    update(dt, t) {
      W.update(dt, t);
      // seated people inside (after their own update this frame)
      for (const [id, y] of seats) {
        const e = story.people.get(id);
        const b = e?.p?.bones;
        if (!b || e.walking) continue;
        b.hips.position.y = y + 0.03;
        b.legL.rotation.x = -1.3;
        b.legR.rotation.x = -1.3;
      }
      if (!story.inRoom) for (const [id, y] of outSeats) {
        const e = story.people.get(id);
        const b = e?.p?.bones;
        if (!b || e.walking) continue;
        b.hips.position.y = y + 0.03;
        b.legL.rotation.x = -1.3;
        b.legR.rotation.x = -1.3;
      }
      // the bundle travels in her hands between the street and the rooms
      const c = story.carrying;
      if (c && game.maya.root.parent && c.parent !== game.maya.root.parent) game.maya.root.parent.add(c);
      if (story.talking || game.busy || story.inRoom || game.mode !== 'world') return;
      const m = mayaXZ();
      // first steps in the Market and on the Wharf
      if (!F('market') && m.z > 258 && m.z < 378 && m.x < 39 && m.x > -96) F('market', true);
      if (F('market') && !F('appr') && story.foot.active && Math.hypot(m.x - A.carvershop.x, m.z - A.carvershop.z) < 30) apprentices();
      if (!F('arrived') && m.z >= 378 && m.z < 500 && m.x > -71) F('arrived', true);
      // Jetty End: the notebook opens on the map by itself (7.2)
      const onEnd = story.foot.active && m.x > A.jettyEnd.minX && m.z > A.jettyEnd.minZ && m.z < A.jettyEnd.maxZ;
      if (onEnd && !endInside && !F('bridge')) bridgeBeat();
      endInside = onEnd;
      if (mapWait && !document.getElementById('story-map')) {
        mapWait = false;
        if (F('bridge')) setTimeout(() => ncScene(), 250);
        else withTalk(() => D.say('maya', L.bridgeRub, { face: 'think' }));
      }
      // the night page: at the Writing Room door once both chapters are done
      if (F('ch10Done') && F('ch2Done') && !F('done') && nightArmed()) {
        const near = story.foot.active ? Math.hypot(m.x - ab.x, m.z - ab.z) < 1.8 : Math.hypot(game.car.root.position.x - ab.x, game.car.root.position.z - (ab.z + 3)) < 2.2;
        if (near) night();
      }
    },
  };
}
