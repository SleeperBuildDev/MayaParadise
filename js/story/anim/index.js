// NPC animation: every townsperson moves with what they do and what they say (owner: "make animation for all the
// actions that npc do ... even while talking their dialogs, make them animate their context").
//
// One layer on top of people.js's own pose (people.js calls PEOPLE_ANIM.layer once per person per update, after its
// walk / moods / emotes and before lookAt): per person a BASE layer (job loops, attitudes, sit), an UPPER layer
// (talk gestures, reactions) and a HEAD layer (listening nods, head shakes), two slots each so the old clip fades
// out while the new one fades in. Clips are static tables (clips-*.js); playing one only sets numbers in a slot made
// when the person was first seen: nothing is allocated per frame. pose.js safe() keeps every result within the
// glitch rules (hips never low enough for feet.js to take them for seated, no arm through the body, the elder's
// stick hand kept low). Gestures never move anyone: no new positions, so nothing stands in a door, path or road.
//
//   import { install, CLIPS } from './anim/index.js';
//   const anim = install(game, story);        once (story.js); also story.anim and window.__anim
//   CLIPS                                     frozen list of clip names
//   anim.play(who, name, { loop, dur, speed, amp, delay, fade, layer, target, prop, seat, face, side, n }) -> Promise
//   anim.loop(who, name, opts)                play(..., { loop: true })
//   anim.stop(who, { layer, fade })           fade out one layer (or all)
//   anim.gesture(who, line, { listener, dur, quiet, target }) -> clip name     the line's own gesture (cues.js)
//   anim.listen(who, speaker, dur)            head-layer listening toward the speaker
//   anim.react(list, kind, { at, stagger, dur }) -> Promise   'gather'|'cheer'|'applaud'|'shelter'|'lookUp'|'startle'|'pointAt'
//   anim.job(entryOrPerson) -> clip|null      start the role's loop now (otherwise it starts by itself with the job mood)
//   anim.hold(who, prop|null, side)           a held prop outside any clip
//   anim.cue(line) -> clip name               pure classifier
//   anim.current(who) -> { base, upper, head }
//   anim.frame(camera)                        story.update, once a frame (the LOD centre)
//   anim.stats() -> { people, full, cheap, off, props, ms }
//   anim.enabled                              false: everyone back to plain people.js
//   anim.dispose()
// who: a people.js person, a story.people entry, a cast id, Ko Hein Htet (his own animations), or game.maya (her
// own emotes). Unknown who / clip: nothing happens and the Promise resolves at once. Nothing here throws.
import { PEOPLE_ANIM } from '../people.js';
import { TALK } from './clips-talk.js';
import { WORK, MOOD_CLIPS } from './clips-work.js';
import { REACT } from './clips-react.js';
import { safe, smooth, bodyInK } from './pose.js';
import { cue as cueOf, cueCount, listenerCue } from './cues.js';
import { jobClip, ATTITUDES } from './jobs.js';
import { createProps } from './props.js';

// listener-only small clips (head layer, or a light upper touch)
const LISTEN = {
  sorryBack: { layer: 'head', dur: 2, walkable: true, face: false, fn(P, c) { P.headX += 0.14 * c.w; P.headZ += 0.1 * (c.k > 0.5 ? 1 : -1) * c.w; P.headY += c.yaw * 0.6 * c.w; } },
  thinkLate: { layer: 'head', dur: 2, walkable: true, face: false, fn(P, c) { const k = c.u > 0.6 ? c.w : 0; P.headZ += 0.12 * k; P.headX -= 0.06 * k; P.headY += c.yaw * 0.6 * c.w; } },
  leanBack: { layer: 'upper', dur: 1.2, walkable: true, face: 'surprised', fn(P, c) { P.torsoX -= 0.08 * c.w; P.headX -= 0.06 * c.w; } },
};
const LIB = Object.assign({}, TALK, WORK, REACT, LISTEN);
export const CLIPS = Object.freeze(Object.keys(LIB));
// clips that hold as long as the line types (the rest are one motion of their own length)
const HOLDS = new Set(['explain', 'explainBoth', 'beat', 'palmUp', 'handsBehind', 'hipTalk', 'leanIn', 'thinkChin', 'sad', 'angry', 'worry', 'handsHips', 'proud', 'read', 'phone', 'write', 'showItem', 'calmDown', 'insist', 'listen', 'laugh', 'giggle']);
const HEAD_ONLY_OK = new Set(['nod', 'shake', 'listen', 'sorryBack', 'thinkLate']);

// Ko Hein Htet plays his own (elbows and knees): names mapped onto his HH_ANIMS
const HH_MAP = {
  cheer: 'jumpCheer', cheerReact: 'jumpCheer', shrug: 'shrug', waveHi: 'wave', waveBye: 'wave', greet: 'bow', thanks: 'bow',
  thinkChin: 'checkWatch', laugh: 'thumbsUp', giggle: 'thumbsUp', clap: 'highFive', applaud: 'highFive', facepalm: 'facepalm',
  point: 'pointAtWatch', pointAt: 'pointAtWatch', proud: 'thumbsUp', handOver: 'handshake', startle: 'skid', worry: 'pocketSearch',
  nod: 'nod', sad: 'slump', angry: 'fists', explain: 'straightenJacket', lookUp: 'peek', shelter: 'peek',
};
// Maya: her own EMOTES (maya.js), one at most per line, only while she stands
const MAYA_MAP = {
  point: 'point', pointAt: 'point', thinkChin: 'think', nod: 'nod', laugh: 'laugh', giggle: 'laugh', waveHi: 'wave', waveBye: 'wave',
  cheer: 'cheer', cheerReact: 'cheer', thanks: 'bow', proud: 'thumbsUp', phone: 'phone', write: 'write', read: 'readHold',
};
const REACT_CLIP = { gather: 'gatherLook', cheer: 'cheerReact', applaud: 'applaud', shelter: 'shelter', lookUp: 'lookUp', startle: 'startle', pointAt: 'pointAt' };
const REACT_DUR = { gather: 4, cheer: 1.8, applaud: 3, shelter: 3, lookUp: 2.5, startle: 1.2, pointAt: 1.8 };

const NEAR = 25, NEAR_OUT = 28, PROP_NEAR = 20;
const FADE = 0.2;
const RESOLVED = Promise.resolve();
const noop = () => {};

function newSlot() {
  return { clip: null, name: '', t: 0, age: 0, dur: 1, loop: false, until: 0, w: 0, raw: 0, fade: FADE, delay: 0, stop: -1, w0: 0,
    speed: 1, a: 1, s: -1, k: 0, n: 0, yaw: 0, pitch: 0, seat: 0, prop: null, face: null, faceSet: null, faceWas: null, resolve: null, auto: 0, u: 0 };
}
function endSlot(sl) {
  const r = sl.resolve;
  sl.clip = null; sl.name = ''; sl.resolve = null; sl.w = 0; sl.raw = 0; sl.stop = -1; sl.auto = 0; sl.prop = null;
  if (r) r();
}

export function install(game, story, opts = {}) {
  const cam = { x: 0, y: 0, z: 0, ok: false };
  const st = { people: 0, full: 0, cheap: 0, off: 0, props: 0, ms: 0 };
  let frameNo = 0, profile = false, acc = 0;
  const warned = new Set();
  const holders = []; // S with a prop showing (or fading)
  const MAX_HOLDERS = opts.maxHolders || 8; // (the dev gallery shows them all)
  const props = createProps(game, holders);
  const entryOf = new WeakMap(); // person -> story.people entry
  let entryScan = -1;

  const reg = new Set(); // every person anim has seen (pruned of the ones taken out of the scene)
  let on = true;
  const A = {
    /** false: the layer is unhooked (people.js exactly as before: the A/B for timing), every clip let go */
    get enabled() { return on; },
    set enabled(v) {
      v = !!v;
      if (v === on) return;
      on = v;
      PEOPLE_ANIM.layer = on ? layer : null;
      if (!on) { for (const S of reg) { idle(S); S.P.ownMood = 0; S.P.ownTalk = 0; } for (const S of holders) { S.holding = false; S.propK = 0; } holders.length = 0; }
    },
    get profile() { return profile; }, set profile(v) { profile = !!v; },
    play, loop: (who, name, o = {}) => play(who, name, { ...o, loop: true }), stop, gesture, listen, react, job, hold, current,
    cue: (line) => { try { return cueOf(line); } catch { return 'explain'; } },
    frame, stats: () => ({ ...st }), dispose,
  };

  // ---------------- people: their state, made once
  function register(p) {
    const r = p.rig || {};
    const age = r.age || p.spec?.age || 'adult';
    const S = {
      p, P: p.P, rig: r, k: ((p.root.id * 0.6180339887) % 1 + 1) % 1,
      ampK: age === 'elder' ? 0.75 : age === 'child' ? 1.2 : 1, spdK: age === 'elder' ? 0.85 : age === 'child' ? 1.15 : 1,
      L: { base: [newSlot(), newSlot()], upper: [newSlot(), newSlot()], head: [newSlot(), newSlot()] },
      cur: { base: 0, upper: 0, head: 0 },
      mood: undefined, near: false, d2: 0, baseGate: 1, emoteGate: 0, seat: false, busy: false,
      propK: 0, propKind: null, propSide: -1, propWant: null, holdProp: null, holdSide: -1, holding: false,
      lineI: 0, mayaT: 0, lastFrame: -1, inK: bodyInK(r), wMax: 0,
    };
    for (const k in S.L) for (const sl of S.L[k]) sl.k = S.k;
    p._an = S;
    reg.add(S);
    return S;
  }
  const stateOf = (p) => p._an || register(p);

  // story.people entry for a person (role text for the job loop): scanned at event time, never per frame
  function entry(p) {
    let e = entryOf.get(p);
    if (e !== undefined) return e;
    if (entryScan !== frameNo) {
      entryScan = frameNo;
      for (const x of story?.people?.values?.() || []) if (x?.p) entryOf.set(x.p, x);
    }
    e = entryOf.get(p) || null;
    if (!e) entryOf.set(p, null);
    return e;
  }

  // ---------------- who: a person, an entry, a cast id, Hein Htet or Maya
  function resolve(who) {
    if (!who) return null;
    if (typeof who === 'string') {
      if (who === 'maya') return { maya: game.maya };
      const e = story?.people?.get?.(who);
      if (e?.p) return { p: e.p };
      if (who === 'heinhtet' && story?.heinhtet) return { hh: story.heinhtet };
      return null;
    }
    if (who === game.maya) return { maya: who };
    if (typeof who.play === 'function' && typeof who.run === 'function') return { hh: who };
    if (who.P && who.rig && typeof who.update === 'function') return { p: who };
    if (who.p && who.p.P && who.p.rig) return { p: who.p };
    return null;
  }

  // ---------------- the layer people.js calls
  function layer(p, P, dt) {
    if (p.root.name === 'heinhtet') { P.ownMood = 0; P.ownTalk = 0; return; } // (his own library drives him)
    const S = p._an || register(p);
    if (S.gone) { S.gone = false; reg.add(S); }
    const t0 = profile ? performance.now() : 0;
    st.people++;
    P.ownMood = 1; P.ownTalk = 1;
    // distance from the camera (last frame's world matrix: no work of our own)
    const e = p.root.matrixWorld.elements;
    const dx = e[12] - cam.x, dz = e[14] - cam.z;
    S.d2 = dx * dx + dz * dz;
    const r = S.near ? NEAR_OUT : NEAR;
    S.near = !cam.ok || S.d2 < r * r;
    if (S.near) st.full++; else st.cheap++;
    // the held mood: a job loop or an attitude, faded (people.js leaves moods to us while ownMood is on)
    if (P.mood !== S.mood) moodChanged(S, P.mood, false, S.mood === undefined ? 0 : 0.3); // (first sight: at once, so people.js's own mood pose never shows for a frame)
    // talking with no gesture of its own: small beats in time with the letters (people.js's wobble is off)
    talkFill(S, P);
    // the gates: non-walkable clips give way to the walk; anim gives way to a people.js emote
    const walking = P.walk > 0.15 ? 1 : 0;
    S.baseGate += ((1 - walking) - S.baseGate) * Math.min(1, dt * 6);
    S.emoteGate += (P.emote - S.emoteGate) * Math.min(1, dt * 10);
    let any = false;
    S.seat = false;
    S.wMax = 0;
    const r0x = P.aRx, r0z = P.aRz; // (the stick arm before anim: pose.js safe())
    any = run(S, P, S.L.base, dt, 'base') || any;
    any = run(S, P, S.L.upper, dt, 'upper') || any;
    any = run(S, P, S.L.head, dt, 'head') || any;
    S.busy = any;
    if (any) safe(P, S.rig, S.seat, true, S.wMax, S.inK, r0x, r0z);
    // the prop in hand
    propStep(S, dt);
    if (profile) acc += performance.now() - t0;
  }
  PEOPLE_ANIM.layer = layer;

  function run(S, P, pair, dt, kind) {
    let any = false, sum = 0;
    for (let i = 0; i < 2; i++) {
      // the outgoing slot first, then the current one: TARGET mixes compose in that order
      const sl = pair[(S.cur[kind] + 1 + i) % 2];
      if (!sl.clip) continue;
      if (!step(S, P, sl, dt, kind)) continue;
      any = true;
      if (sl.w > 0.0005) {
        sum += sl.w;
        sl.clip.fn(P, sl);
        if (sl.clip.seat && sl.w > 0.01) S.seat = true;
      }
    }
    if (sum > S.wMax) S.wMax = sum > 1 ? 1 : sum; // (the two slots of a crossfade add up: the stick rule holds through it)
    return any;
  }
  // advance a slot; false when it has ended
  function step(S, P, sl, dt, kind) {
    if (sl.delay > 0) { sl.delay -= dt; sl.w = 0; return true; }
    sl.age += dt;
    sl.t += dt * sl.speed;
    let w;
    if (sl.stop >= 0) {
      sl.stop += dt;
      w = sl.w0 * (1 - sl.stop / sl.fade);
      if (w <= 0) { finish(S, sl); return false; }
    } else {
      w = sl.fade > 0 ? Math.min(1, sl.age / sl.fade) : 1;
      if (sl.loop) { if (sl.until > 0 && sl.age >= sl.until) beginStop(sl); }
      else {
        const left = sl.dur - sl.t;
        if (left <= 0) { finish(S, sl); return false; }
        if (sl.fade > 0 && left < sl.fade) w = Math.min(w, left / sl.fade);
      }
    }
    sl.raw = w;
    sl.u = sl.loop ? (sl.t / sl.dur) % 1 : Math.min(1, sl.t / sl.dur);
    let g = 1;
    const c = sl.clip;
    if (kind === 'base') { if (!c.walkable) g = S.baseGate; }
    else {
      if (!c.walkable) g = 1 - 0.7 * P.walk;
      if (kind === 'upper') g *= 1 - S.emoteGate;
      // far away: gestures fade off (LOD); they come back faded when she is near again
      if (!S.near && sl.stop < 0) beginStop(sl);
    }
    sl.w = smooth(w) * g;
    return true;
  }
  function beginStop(sl, fade) {
    if (!sl.clip || sl.stop >= 0) return;
    sl.w0 = sl.delay > 0 ? 0 : sl.raw;
    sl.delay = 0;
    sl.fade = Math.max(0.01, fade ?? (sl.fade < 0.05 ? FADE : sl.fade));
    sl.stop = 0;
  }
  function finish(S, sl) {
    // the face this clip set goes back to what it was (unless someone else changed it meanwhile)
    if (sl.faceSet && S.P.face === sl.faceSet) call(S.p, 'setFace', sl.faceWas || 'smile', 0);
    sl.faceSet = null;
    endSlot(sl);
    if (!S.L.base[0].clip && !S.L.base[1].clip && S.mood) moodChanged(S, S.mood, true); // an explicit base clip ended: the mood's loop again
  }
  function idle(S) {
    for (const k in S.L) for (const sl of S.L[k]) if (sl.clip) endSlot(sl);
    S.busy = false; S.mood = undefined;
  }

  function moodChanged(S, m, again = false, fade = 0.3) {
    S.mood = m;
    const pair = S.L.base, cur = pair[S.cur.base];
    // an explicit base clip (sit, carry, an event's) wins over the mood
    if (!again && cur.clip && !cur.auto && cur.stop < 0) return;
    let clip = null;
    if (m && m !== 'kick') {
      const name = ATTITUDES.has(m) ? null : jobClip(entry(S.p), m);
      clip = name ? LIB[name] : MOOD_CLIPS[m] || null;
      if (clip && clip.seat) clip = MOOD_CLIPS.work; // (a seat only from a caller who knows there is one)
      if (clip) { start(S, clip, name || 'mood:' + m, { loop: true, fade }); pair[S.cur.base].auto = 1; return; }
    }
    if (cur.clip && cur.auto) beginStop(cur, 0.3);
  }

  function talkFill(S, P) {
    const pair = S.L.upper, cur = pair[S.cur.upper];
    if (P.talk > 0.05 && S.near) {
      if (!cur.clip || cur.stop >= 0) start(S, LIB.beat, 'beat', { loop: true, fade: 0.3 }).auto = 1;
      else if (!cur.loop && !cur.auto && cur.dur - cur.t < cur.fade && P.talk > 0.4) start(S, LIB.beat, 'beat', { loop: true, fade: cur.fade }).auto = 1; // (crossfade into the beats)
    } else if (cur.clip && cur.auto && cur.stop < 0) beginStop(cur, 0.3);
  }

  // ---------------- starting a clip on a person
  function start(S, clip, name, o = {}) {
    // a child plays the clip's kid version (carryHead: the basket in front, their arms cannot reach the head top)
    let kidProp;
    if (clip.kid && S.rig.age === 'child' && LIB[clip.kid]) { kidProp = clip.kidProp; clip = LIB[clip.kid]; }
    const kind = o.layer || clip.layer || 'upper';
    const pair = S.L[kind] || S.L.upper;
    const k = kind in S.L ? kind : 'upper';
    const out = pair[S.cur[k]];
    const sl = pair[(S.cur[k] + 1) % 2];
    if (sl.clip) { if (sl.faceSet && S.P.face === sl.faceSet) call(S.p, 'setFace', sl.faceWas || 'smile', 0); sl.faceSet = null; endSlot(sl); } // (a third request replaces the one already fading)
    if (out.clip) beginStop(out, o.fade);
    S.cur[k] = (S.cur[k] + 1) % 2;
    sl.clip = clip; sl.name = name;
    sl.t = 0; sl.age = 0; sl.stop = -1; sl.w = 0; sl.raw = 0;
    sl.loop = o.loop ?? !!clip.loop;
    sl.dur = Math.max(0.2, (o.loop ? clip.dur : o.dur) || clip.dur);
    sl.until = sl.loop && o.dur ? o.dur : 0;
    if (sl.loop && o.loop && o.dur) sl.dur = clip.dur;
    sl.speed = (o.speed || 1) * S.spdK;
    sl.a = (o.amp ?? 1) * S.ampK;
    sl.delay = o.delay || 0;
    sl.fade = o.fade ?? FADE;
    sl.n = o.n || 0;
    sl.seat = o.seat || 0;
    sl.auto = 0;
    sl.prop = o.prop === undefined ? kidProp || clip.prop || null : o.prop;
    aim(S, sl, clip, o);
    // the face: the clip's own, only when the line has none (o.face === false leaves it alone)
    sl.faceSet = null;
    const face = o.face === false ? null : o.face || clip.face || null;
    if (face && S.near) {
      sl.faceWas = S.P.face;
      call(S.p, 'setFace', face, sl.dur);
      sl.faceSet = face;
    }
    sl.resolve = null;
    return sl;
  }
  // which arm, and where a target is (person space yaw / pitch)
  function aim(S, sl, clip, o) {
    const e = S.p.root.matrixWorld.elements;
    let yaw = 0, pitch = 0, has = false;
    const tg = o.target;
    if (tg) {
      let x, y, z;
      if (tg.isVector3) { x = tg.x; y = tg.y; z = tg.z; }
      else if (tg.isObject3D) { const m = tg.matrixWorld.elements; x = m[12]; y = m[13] + 0.6; z = m[14]; }
      else if (tg.root?.isObject3D) { const m = tg.root.matrixWorld.elements; x = m[12]; y = m[13] + (tg.height ? tg.height * 0.8 : 1); z = m[14]; }
      else if (typeof tg.x === 'number') { x = tg.x; y = tg.y || 1; z = tg.z; }
      if (x !== undefined) {
        const dx = x - e[12], dy = y - (e[13] + (S.rig.shoulderY || 0.64)), dz = z - e[14];
        // root axes (columns 0 and 2): person space x (their left) and z (forward)
        const lx = dx * e[0] + dy * e[1] + dz * e[2], lz = dx * e[8] + dy * e[9] + dz * e[10];
        yaw = Math.atan2(lx, lz); pitch = Math.atan2(dy, Math.hypot(lx, lz));
        yaw = Math.max(-1.2, Math.min(1.2, yaw)); pitch = Math.max(-0.6, Math.min(0.9, pitch));
        has = true;
      }
    }
    sl.yaw = yaw; sl.pitch = pitch;
    // the arm: asked for; the target's side; the camera's side; the elder's free (left) hand
    let s = o.side === 'left' || o.side === 1 ? 1 : o.side === 'right' || o.side === -1 ? -1 : 0;
    if (!s && has && Math.abs(yaw) > 0.15) s = yaw > 0 ? 1 : -1;
    if (!s && cam.ok) {
      const cx = cam.x - e[12], cy = cam.y - e[13], cz = cam.z - e[14];
      s = cx * e[0] + cy * e[1] + cz * e[2] > 0 ? 1 : -1;
    }
    if (!s) s = -1;
    if (S.rig.stick && (clip.side === 'one' || sl.prop)) s = 1;
    if (clip.hand && clip.side !== 'one') s = clip.hand;
    sl.s = s;
  }

  // ---------------- the API
  function warn(name) { if (!warned.has(name)) { warned.add(name); console.warn('anim: no clip', name); } }
  function play(who, name, o = {}) {
    try {
      if (!A.enabled) return RESOLVED;
      const R = resolve(who);
      if (!R) return RESOLVED;
      if (R.hh) { const n = HH_MAP[name] || name; return R.hh.play ? Promise.resolve(R.hh.play(n, { loop: !!o.loop })).then(noop, noop) : RESOLVED; }
      if (R.maya) return mayaEmote(R.maya, name, true);
      let clip = LIB[name];
      if (!clip && typeof name === 'string' && name.startsWith('mood:')) clip = MOOD_CLIPS[name.slice(5)];
      if (!clip) { warn(name); return RESOLVED; }
      if ((name === 'point' || name === 'pointAt') && !o.target) { clip = LIB.explain; name = 'explain'; } // (never points the way)
      if (clip.seat && !(o.seat > 0)) { warn(name + ' (needs a seat)'); return RESOLVED; }
      const S = stateOf(R.p);
      if (o.prop !== undefined && o.prop !== null && !props.has(o.prop)) o = { ...o, prop: null };
      const sl = start(S, clip, name, o);
      return new Promise((res) => { sl.resolve = res; });
    } catch (err) { console.warn('anim.play', err); return RESOLVED; }
  }
  function stop(who, o = {}) {
    try {
      const R = resolve(who);
      if (!R) return;
      if (R.hh) { R.hh.stopAnim?.(); return; }
      if (!R.p) return;
      const S = stateOf(R.p);
      for (const k of o.layer ? [o.layer] : ['base', 'upper', 'head']) {
        const pair = S.L[k];
        if (!pair) continue;
        for (const sl of pair) if (sl.clip) { sl.auto = 0; beginStop(sl, o.fade ?? FADE); }
      }
    } catch (err) { console.warn('anim.stop', err); }
  }
  function current(who) {
    const R = resolve(who);
    if (!R?.p || !R.p._an) return { base: null, upper: null, head: null };
    const S = R.p._an, nm = (k) => { const sl = S.L[k][S.cur[k]]; return sl.clip && sl.stop < 0 ? sl.name : null; };
    return { base: nm('base'), upper: nm('upper'), head: nm('head') };
  }

  // Maya: her own emotes, at most one every 3 s, only while she stands (not walking, driving or busy)
  function mayaEmote(m, name, forced) {
    const e = MAYA_MAP[name];
    if (!e || typeof m.emote !== 'function') return RESOLVED;
    const now = performance.now();
    if (!forced && (now - (m._anT || 0) < 3000)) return RESOLVED;
    if (m.cur || m.mode === 'drive' || (m.walkW || 0) > 0.1) return RESOLVED;
    m._anT = now;
    return Promise.resolve(m.emote(e)).then(noop, noop);
  }

  /** The gesture for a line while it types, and the listener's answer. */
  function gesture(who, line, o = {}) {
    try {
      if (!A.enabled || !line) return '';
      const R = resolve(who);
      if (!R) return '';
      const len = typeof line === 'string' ? line.length : Math.max((line.my || '').length * 0.6, (line.en || '').length);
      const dur = o.dur || Math.min(6, 0.8 + len * 0.05);
      const S = R.p ? stateOf(R.p) : null;
      const i = S ? S.lineI++ : 0;
      let name = cueOf(line, i, S ? S.k : 0.5);
      if ((name === 'point' || name === 'pointAt') && !o.target) name = o.quiet ? 'explain' : 'explainBoth';
      if (!LIB[name]) name = 'explain';
      if (R.maya) { if (!line.emote) mayaEmote(R.maya, name, false); }
      else if (R.hh) { const n = HH_MAP[name]; if (n && !line.emote && Math.random() < 0.6) R.hh.play?.(n); }
      else if (S && !line.emote) {
        const clip = LIB[name];
        const excited = typeof line.en === 'string' && /!["')]*$/.test(line.en.trim());
        const hold = HOLDS.has(name) ? Math.min(4, Math.max(clip.dur, dur)) : clip.dur;
        // the kick (chinlone) keeps its arms: only head moves while they play
        if (S.mood === 'kick' && !HEAD_ONLY_OK.has(name)) name = 'nod';
        start(S, LIB[name], name, {
          dur: hold, amp: (o.quiet ? 0.7 : 1) * (excited ? 1.2 : 1), target: o.target,
          face: line.face ? false : undefined, n: name === 'count' ? cueCount(line) || 3 : 0,
          layer: S.mood === 'kick' ? 'head' : undefined,
        });
      }
      if (o.listener && o.listener !== who) {
        const lc = listenerCue(name);
        listen(o.listener, who, dur, lc);
      }
      return name;
    } catch (err) { console.warn('anim.gesture', err); return ''; }
  }

  function listen(who, speaker, dur = 2, kind = 'listen') {
    try {
      if (!A.enabled) return;
      const R = resolve(who);
      if (!R) return;
      if (R.maya) { if (kind !== 'listen' || Math.random() < 0.35) mayaEmote(R.maya, kind === 'giggle' ? 'laugh' : kind === 'waveBye' ? 'waveBye' : 'nod', false); return; }
      if (R.hh) return;
      const S = stateOf(R.p);
      if (!S.near) return;
      const sp = resolve(speaker);
      const target = sp?.p ? sp.p : sp?.maya ? sp.maya : sp?.hh || null;
      const clip = LIB[kind] || LIB.listen;
      const delay = kind === 'giggle' ? 0.25 : 0;
      start(S, clip, kind, { dur: clip.layer === 'head' ? Math.max(1, dur) : clip.dur, delay, amp: kind === 'giggle' ? 0.6 : 1, target, face: kind === 'listen' ? false : undefined });
    } catch (err) { console.warn('anim.listen', err); }
  }

  function react(list, kind, o = {}) {
    try {
      if (!A.enabled) return RESOLVED;
      const name = REACT_CLIP[kind] || (LIB[kind] ? kind : null);
      if (!name) { warn(kind); return RESOLVED; }
      const [a, b] = o.stagger || [0, 0.6];
      const all = [];
      for (const who of Array.isArray(list) ? list : [list]) {
        const R = resolve(who);
        if (!R) continue;
        const delay = a + Math.random() * (b - a);
        all.push(play(who, name, { delay, dur: o.dur || REACT_DUR[kind] || LIB[name].dur, target: o.at || (name === 'pointAt' ? null : undefined) }));
      }
      return Promise.all(all).then(noop);
    } catch (err) { console.warn('anim.react', err); return RESOLVED; }
  }

  function job(who) {
    try {
      const R = resolve(who);
      if (!R?.p) return null;
      const S = stateOf(R.p);
      const e = who && who.p ? who : entry(R.p);
      const name = jobClip(e, S.P.mood || e?.job?.mood || 'work');
      if (!name || !LIB[name] || LIB[name].seat) return null;
      start(S, LIB[name], name, { loop: true, fade: 0.3 }).auto = 0;
      return name;
    } catch (err) { console.warn('anim.job', err); return null; }
  }

  function hold(who, prop, side = 'auto') {
    const R = resolve(who);
    if (!R?.p) return;
    const S = stateOf(R.p);
    S.holdProp = prop && props.has(prop) ? prop : null;
    S.holdSide = side === 'left' ? 1 : side === 'right' ? -1 : S.rig.stick ? 1 : -1;
  }

  // ---------------- props: which one, in which hand, grown in and out
  function propStep(S, dt) {
    let want = S.holdProp, side = S.holdSide, w = 1;
    if (!want) {
      for (const kind of ['upper', 'base']) {
        const sl = S.L[kind][S.cur[kind]];
        if (sl.clip && sl.prop && sl.stop < 0 && sl.raw > 0.5) { want = sl.prop; side = sl.clip.hand && sl.clip.side !== 'one' ? sl.clip.hand : sl.s; w = sl.w; break; }
      }
    }
    if (want && (!S.near || S.d2 > PROP_NEAR * PROP_NEAR || w < 0.3)) want = null;
    if (want && want !== S.propKind && S.propK > 0.02) want = null; // the old one goes first, then the new one grows
    const k0 = S.propK;
    S.propK = Math.max(0, Math.min(1, S.propK + (want ? dt : -dt) / 0.15));
    if (want && k0 <= 0.02) { S.propKind = want; S.propSide = side; }
    if (S.propK > 0 && !S.holding) {
      if (holders.length >= MAX_HOLDERS) {
        // the farthest holder gives way (shrinking from where it is; it is simply not drawn once replaced)
        let far = -1, fd = S.d2;
        for (let i = 0; i < holders.length; i++) if (holders[i].d2 > fd) { fd = holders[i].d2; far = i; }
        if (far < 0) { S.propK = 0; return; }
        const o = holders[far]; o.holding = false; o.propK = 0; holders.splice(far, 1);
      }
      S.holding = true; holders.push(S);
    } else if (S.propK <= 0 && S.holding) {
      S.holding = false;
      const i = holders.indexOf(S);
      if (i >= 0) holders.splice(i, 1);
    }
  }

  // ---------------- per frame
  function frame(camera) {
    frameNo++;
    if (camera) {
      const m = camera.matrixWorld.elements;
      cam.x = m[12]; cam.y = m[13]; cam.z = m[14]; cam.ok = true;
    }
    st.ms = acc; acc = 0;
    if (frameNo % 600 === 0) for (const S of reg) if (!S.p.root.parent) { S.gone = true; reg.delete(S); } // (a passer-by gone for good is not kept)
    for (let i = holders.length - 1; i >= 0; i--) if (!holders[i].p.root.parent) { holders[i].holding = false; holders[i].propK = 0; holders.splice(i, 1); } // (taken out of the scene)
    st.props = holders.length;
    st.people = st.full = st.cheap = 0;
    st.off = on ? 0 : reg.size;
    props.frame(frameNo);
  }

  function dispose() {
    if (PEOPLE_ANIM.layer === layer) PEOPLE_ANIM.layer = null;
    reg.clear();
    props.dispose();
    holders.length = 0;
  }

  function call(o, fn, ...a) { try { return o && typeof o[fn] === 'function' ? o[fn](...a) : undefined; } catch { return undefined; } }

  if (story) story.anim = A;
  if (typeof window !== 'undefined') window.__anim = A;
  return A;
}
