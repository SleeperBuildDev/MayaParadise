// The morning post and the night page (days/INDEX.md 6): the same two rituals every day, called by the
// day scripts with that day's words. Day 1 wrote the first versions; these are them, generalised.
//
//   await morningPost(story, {
//     day,                      story day (default save.day); the flag `d<day>.morning` is set at the end
//     hour: 8.5,                scripted morning light (null: leave the clock alone)
//     walkUp: true,             Ma Wint War walks over to Maya first (outdoors, when she is spawned)
//     ww: [line],               her first words (the notebook is back)
//     slept: { personId: line } the line from the house the notebook slept in last night (save.notebook.sleptAt)
//     after: [line],            her words before the letters ("And a note from …")
//     letters: [{ from, text, sign? }]   yesterday's person's letter (and a second one): paper overlays
//     question: line,           Toe Toe's question of the day (from Day 3): a small slip
//     companions: [id] | null,  who lifts off the page (default: the ones due by today and not yet out)
//     lift: { id: [line] },     what is said as each lifts off (else the companion's own line)
//     where: [line],            the day's "where", said (never shown on a map)
//     whereBy: 'wintwar',       who says it
//   })
//
//   await nightPage(story, {
//     day, ch,                  story day; chapter(s) for the seal
//     hour: 20.5,               the night look while the page is written
//     truth: { q, choices, right, wrong: [[line]] }   the true sentence: wrong picks are answered, then asked again
//     before: async () => {},   e.g. planting seeds, said after the true sentence
//     sleep: { q, who: [ids] }  where the notebook sleeps tonight (people met today)
//     stamps: [3],              chapters stamped tonight (pencil: [15] for a pencilled one)
//     stampText: line,          the page title and one line; extra: line (a second small line)
//     tomorrow: line,
//     seal: true,               false: no stamp overlay (e.g. a scene draws its own)
//     turn: true,               turn to the next page afterwards (story.turnPage)
//   }) -> { sleptWith }
//
//   showLetter(game, text, { sign })   ·   showSlip(game, line, { kind: 'notebook'|'question' })
//   stampOverlay(game, { stamps, pencil, text, extra, tomorrow })   ·   liftOff(game, companion, line)
import { tr, lang } from '../game/ui.js';
import { castById } from './cast.js';
import { companionById, companionIcon } from './companions.js';
import { persist, today } from './save.js';
import { myNum } from './api.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const gameEl = () => document.getElementById('game');
const T = {
  goodnight: { my: 'ကောင်းသောညပါ', en: 'Good night' },
  tomorrow: { my: 'နောက်တစ်နေ့ မနက် ရောက်ပြီ။', en: 'Morning comes.' },
  question: { my: 'ဒီနေ့ မေးခွန်း', en: "Today's question" },
  notebook: { my: 'မှတ်စုစာအုပ်ထဲက တစ်ကြောင်း', en: 'A line in the notebook' },
  lifts: { my: 'စာမျက်နှာပေါ်က ခုန်ထွက်လာတယ်', en: 'hops off the page' },
  tap: { my: 'နှိပ်ပြီး ဆက်မယ်', en: 'tap to go on' },
};

// ---------------------------------------------------------------------------------------------
// overlays
// ---------------------------------------------------------------------------------------------
/** A letter on lined paper; resolves when tapped. text: { my, en } (\n for new lines). */
export function showLetter(game, text, o = {}) {
  injectPostStyle();
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'story-letter';
    el.innerHTML = '<div class="paper"><p></p><small></small></div>';
    el.querySelector('p').innerText = tr(text);
    const sign = o.sign ?? (o.from ? castById(o.from)?.name : null);
    el.querySelector('small').textContent = sign ? `— ${tr(sign)}` : '— ?';
    call(game.audio, 'play', 'page');
    el.addEventListener('click', (ev) => { ev.stopPropagation(); el.classList.add('out'); setTimeout(() => el.remove(), 220); resolve(); });
    gameEl().appendChild(el);
  });
}

/** A small slip: a notebook line (handwriting on a page corner) or Toe Toe's question card. */
export function showSlip(game, line, o = {}) {
  injectPostStyle();
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = `rc-slip ${o.kind || 'notebook'}`;
    el.innerHTML = '<div class="slip"><small></small><p></p><i></i></div>';
    el.querySelector('small').textContent = tr(o.title || (o.kind === 'question' ? T.question : T.notebook));
    el.querySelector('p').innerText = tr(line);
    el.querySelector('i').textContent = tr(T.tap);
    call(game.audio, 'play', o.kind === 'question' ? 'chalk' : 'page');
    el.addEventListener('click', (ev) => { ev.stopPropagation(); el.classList.add('out'); setTimeout(() => el.remove(), 220); resolve(); });
    gameEl().appendChild(el);
  });
}

/** The notebook page with yesterday's companion drawn on it; it lifts off with a sparkle. */
export function liftOff(game, comp, o = {}) {
  injectPostStyle();
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'rc-lift';
    el.innerHTML = `<div class="page"><div class="ink"></div><div class="who"><span class="c">${companionIcon(comp.id)}</span></div>
      <div class="cap"><b></b><small></small><q></q></div></div>`;
    el.querySelector('.ink').innerHTML = companionIcon(comp.id);
    el.querySelector('.cap b').textContent = tr(comp.name);
    el.querySelector('.cap small').textContent = tr(T.lifts);
    el.querySelector('.cap q').textContent = tr(o.line || comp.line);
    gameEl().appendChild(el);
    call(game.audio, 'play', 'page');
    setTimeout(() => { el.classList.add('up'); call(game.audio, 'play', 'sparkle'); }, 700);
    setTimeout(() => call(game.audio, 'play', 'chime'), 1300);
    let done = false;
    const fin = (ev) => { ev?.stopPropagation(); if (done) return; done = true; el.classList.add('out'); setTimeout(() => el.remove(), 260); resolve(); };
    setTimeout(() => el.addEventListener('click', fin), 900);
    setTimeout(fin, o.ms ?? 6000);
  });
}

/** The Reality Check seal(s) for tonight's page; resolves on "Good night". */
export function stampOverlay(game, { stamps = [], pencil = [], text, extra, tomorrow, button } = {}) {
  injectPostStyle();
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'story-stamp';
    const seals = [...stamps.map((n) => ({ n, pencil: false })), ...pencil.map((n) => ({ n, pencil: true }))];
    const num = (n) => (n === 'reply' ? '✉' : lang() === 'en' ? String(n) : myNum(n));
    el.innerHTML = `<div class="seals">${seals.map((s, i) => `<div class="seal${s.pencil ? ' pencil' : ''}" style="animation-delay:${i * 0.55}s"><small>Reality Check</small><b>✓</b><small>${num(s.n)}</small></div>`).join('')}</div>
      <p class="t"></p><p class="x"></p><p class="n"></p><button type="button"></button>`;
    el.querySelector('.t').innerText = tr(text || '');
    el.querySelector('.x').innerText = tr(extra || '');
    el.querySelector('.n').innerText = tr(tomorrow || T.tomorrow);
    el.querySelector('button').textContent = tr(button || T.goodnight);
    seals.forEach((s, i) => setTimeout(() => call(game.audio, 'play', s.pencil ? 'chalk' : 'bell'), 80 + i * 550));
    el.querySelector('button').addEventListener('click', (ev) => { ev.stopPropagation(); call(game.audio, 'play', 'click'); el.remove(); resolve(); });
    gameEl().appendChild(el);
  });
}

// ---------------------------------------------------------------------------------------------
// the morning post
// ---------------------------------------------------------------------------------------------
export async function morningPost(story, o = {}) {
  const { game, dialog: D, save } = story;
  const day = o.day ?? save.day;
  const wasTalking = story.talking;
  story.talking = true;
  if (o.hour !== null) { game.day?.set?.(o.hour ?? 8.5); game.applyDayLook(); }
  try {
    // Ma Wint War comes over (outdoors), as on Day 1
    const ww = story.people.get('wintwar');
    if (o.walkUp !== false && ww && story.foot?.active && ww.p.root.parent === game.maya.root.parent) {
      const mp = game.maya.root.position;
      if (Math.hypot(ww.p.root.position.x - mp.x, ww.p.root.position.z - mp.z) > 1.6) {
        ww.paused = true;
        await Promise.race([story.walkPerson('wintwar', mp.x + 1.15, mp.z + 0.05, 1.5), wait(9000)]);
        ww.paused = false;
      }
    }
    game.ui.cinema(true);
    if (o.ww?.length) await D.say('wintwar', o.ww, { face: 'smile' });
    // the notebook comes back from the house it slept in
    const slept = save.notebook.sleptAt.filter((s) => s.day === day - 1).pop() || save.notebook.sleptAt[save.notebook.sleptAt.length - 1];
    const line = slept && o.slept?.[slept.who];
    if (line) await showSlip(game, line, { kind: 'notebook' });
    if (o.after?.length) await D.say('wintwar', o.after, { face: 'happy' });
    for (const l of o.letters || []) await showLetter(game, l.text, { from: l.from, sign: l.sign });
    if (o.question) await showSlip(game, o.question, { kind: 'question' });
    // last night's companion(s) lift off the page
    const due = o.companions || story.companions.due(day).map((c) => c.id);
    for (const id of due) {
      const c = companionById(id);
      if (!c || story.companions.has(id)) continue;
      await liftOff(game, c, { line: o.liftCaption?.[id] });
      story.companions.add(id);
      if (o.lift?.[id]?.length) await D.say('maya', o.lift[id], { face: 'happy' });
    }
    if (o.where?.length) await D.say(o.whereBy || 'wintwar', o.where, { face: 'smile' });
    story.flag(`d${day}.morning`, true);
  } finally {
    game.ui.cinema(false);
    story.talking = wasTalking;
  }
}

// ---------------------------------------------------------------------------------------------
// the night page
// ---------------------------------------------------------------------------------------------
export async function nightPage(story, o = {}) {
  const { game, dialog: D, save } = story;
  const day = o.day ?? save.day;
  const wasTalking = story.talking;
  story.talking = true;
  game.ui.cinema(true);
  if (o.hour !== null) { game.day?.set?.(o.hour ?? 20.5); game.applyDayLook(); }
  story.sound?.cue('nightpage'); // the night page's own quiet song (extras-sound.js)
  let sleptWith = null;
  try {
    // the true sentence: only what she saw herself
    if (o.truth) {
      if (o.truth.q) await D.say('maya', [o.truth.q], { face: 'think' });
      const right = o.truth.right ?? 1;
      for (;;) {
        const i = await D.choose(o.truth.choices);
        if (i === right) break;
        const w = o.truth.wrong?.[i];
        if (w?.length) await D.say('maya', w, { face: 'think' });
      }
      call(game.audio, 'play', 'type');
    }
    if (o.before) await o.before();
    // where the notebook sleeps tonight
    const who = (o.sleep?.who || []).filter((id) => castById(id));
    if (who.length) {
      if (o.sleep.q) await D.say('maya', [o.sleep.q], { face: 'smile' });
      const i = who.length === 1 ? 0 : await D.choose(who.map((id) => castById(id).name));
      sleptWith = who[i];
      save.notebook.sleptAt.push({ day, who: sleptWith });
    }
    for (const n of o.stamps || []) if (!save.stamps.includes(n)) save.stamps.push(n);
    save.pencilStamps = (save.pencilStamps || []).filter((n) => !save.stamps.includes(n));
    for (const n of o.pencil || []) if (!save.pencilStamps.includes(n) && !save.stamps.includes(n)) save.pencilStamps.push(n);
    // no waiting for a real day: sleeping turns the page, and the next morning starts at once
    save.dayDone = true;
    save.dayDoneOn = today();
    story.flag(`d${day}.done`, true);
    save.day = Math.min(15, day + 1);
    save.dayDone = false;
    if (o.place) save.place = o.place;
    persist(save);
    if (o.seal !== false) await stampOverlay(game, { stamps: o.stamps || [], pencil: o.pencil || [], text: o.stampText, extra: o.extra, tomorrow: o.tomorrow });
  } finally {
    story.sound?.cue(null);
    game.day?.set?.(null);
    game.applyDayLook();
    game.ui.cinema(false);
    story.talking = wasTalking;
  }
  if (o.turn !== false && day < 15) await story.turnPage();
  return { sleptWith };
}

function injectPostStyle() {
  if (document.getElementById('rc-post-style')) return;
  const s = document.createElement('style');
  s.id = 'rc-post-style';
  s.textContent = `
  .story-letter.out, .rc-slip.out, .rc-lift.out { opacity: 0; transition: opacity .22s; }
  .rc-slip { position: absolute; inset: 0; z-index: 46; display: flex; align-items: center; justify-content: center; background: rgba(42,33,24,.28); animation: rcpin .25s ease; }
  .rc-slip .slip { position: relative; width: min(80vw, 320px); padding: 22px 20px 16px; background: #FFFDF8; border-radius: 4px; transform: rotate(1.2deg);
    font: 16px/1.85 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; box-shadow: 0 10px 26px rgba(42,33,24,.32);
    background-image: linear-gradient(90deg, transparent 22px, #E9B7B0 22px 23.5px, transparent 23.5px), repeating-linear-gradient(transparent 0 28px, #DCE6EE 28px 29px); }
  .rc-slip.notebook .slip::before { content: ""; position: absolute; left: 50%; top: -9px; width: 70px; height: 20px; transform: translateX(-50%) rotate(-3deg);
    background: rgba(233,215,160,.8); box-shadow: 0 1px 2px rgba(0,0,0,.1); }
  .rc-slip.question .slip { background: #F4F7EE; transform: rotate(-1.5deg); border: 2px solid #2F6B4F;
    background-image: repeating-linear-gradient(transparent 0 28px, #CFE0D3 28px 29px); }
  .rc-slip small { display: block; color: #8C6A28; font-weight: 700; padding-left: 14px; }
  .rc-slip p { margin: 4px 0 6px; padding-left: 14px; } .rc-slip i { display: block; text-align: right; font-size: 11.5px; color: #B0A288; font-style: normal; }
  @keyframes rcpin { from { opacity: 0; transform: translateY(14px); } }
  .rc-lift { position: absolute; inset: 0; z-index: 47; display: flex; align-items: center; justify-content: center; background: rgba(42,33,24,.36); animation: rcpin .3s ease; }
  .rc-lift .page { position: relative; width: min(84vw, 340px); height: 300px; background: #FBF7EC; border-radius: 6px 14px 14px 6px; box-shadow: 0 14px 34px rgba(42,33,24,.38);
    background-image: linear-gradient(90deg, rgba(90,67,32,.16), transparent 9%), repeating-linear-gradient(transparent 0 26px, #E4DCC8 26px 27px); overflow: visible; }
  .rc-lift .ink { position: absolute; left: 50%; top: 58px; width: 120px; height: 120px; transform: translateX(-50%); opacity: .9; filter: grayscale(.2) sepia(.35); }
  .rc-lift .ink svg, .rc-lift .who svg { display: block; width: 100%; height: 100%; }
  .rc-lift .who .c { display: block; width: 100%; height: 100%; filter: drop-shadow(0 6px 6px rgba(42,33,24,.28)); }
  .rc-lift .who { position: absolute; left: 50%; top: 58px; width: 120px; height: 120px; transform: translateX(-50%); opacity: 0; }
  .rc-lift.up .ink { opacity: .16; transition: opacity .6s; }
  .rc-lift.up .who { opacity: 1; transform: translate(-50%, -64px) scale(1.1) rotate(3deg); animation: rclift 1.4s cubic-bezier(.3,1.5,.5,1) forwards; }
  .rc-lift.up .who::after { content: ""; position: absolute; inset: -18px; border-radius: 50%; background: radial-gradient(circle, rgba(243,210,122,.55), rgba(243,210,122,0) 70%); z-index: -1; animation: rcglow 1.6s ease-out forwards; }
  @keyframes rclift { 0% { opacity: 1; transform: translate(-50%, 0) scale(1); } 60% { opacity: 1; transform: translate(-50%, -78px) scale(1.18) rotate(-6deg); } 100% { opacity: 1; transform: translate(-50%, -64px) scale(1.1) rotate(3deg); } }
  @keyframes rcglow { from { opacity: 0; transform: scale(.4); } 50% { opacity: 1; } to { opacity: 0; transform: scale(1.4); } }
  .rc-lift .cap { position: absolute; left: 0; right: 0; bottom: 18px; text-align: center; font: 15px/1.7 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; opacity: 0; }
  .rc-lift.up .cap { opacity: 1; transition: opacity .5s .7s; }
  .rc-lift .cap b { display: block; color: #6E1F2A; font-size: 17px; } .rc-lift .cap small { display: block; color: #8C6A28; }
  .rc-lift .cap q { display: block; margin: 4px 18px 0; font-style: italic; color: #4A3A2A; }
  .story-stamp .seals { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .story-stamp .seals .seal { animation-fill-mode: both; }
  .story-stamp .seals .seal:not(:only-child) { width: 112px; height: 112px; border-width: 5px; }
  .story-stamp .seals .seal:not(:only-child) b { font-size: 32px; }
  .story-stamp .seal.pencil { border: 4px dashed #8A847C; color: #8A847C; transform: rotate(8deg); }
  .story-stamp .x:empty { display: none; } .story-stamp .x { color: #8C6A28; font-size: 14px; }
  `;
  document.head.appendChild(s);
}
