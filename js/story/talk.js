// The talk: the game's turn-based "helping" encounter (GAME-PLAN.md 4.4), drawn over the low two-shot.
// The rules live in talk-rules.js (numbers at its top); this file stages the scene and draws the screen.
//
//   const talk = createTalk(game, story, { twoShot })   story.js makes one: story.talk
//   const { won, turns, stones, reason } = await story.talk.run(talkData)
//   story.talk.waiting(id)        true after "not yet" until Maya has done something else
//                                 (talked to someone not in the scene, walked 6 m away, or 60 s passed)
//
// ---- Talk data (lines are { my, en }; every Burmese line is a draft for Maya to proofread) ----
// {
//   id: 'd1-fair',                       saves progress under story flag `talk.<id>` (stones gained stay)
//   person: 'phothar',                   cast id (must be spawned on the page)
//   with: ['ukyaw'],                     others in the scene (talking to them is not "something else")
//   steam: 1, calm: 4, turns: 7,         start steam 0..5 (hot at 3+), Maya's calm, turn limit
//   stepBack: false,                     true: the last stone is theirs (hold Step back; a card = they lean)
//   theirs: [3],                         or any stones that are theirs (overrides stepBack)
//   hand: [card, ...],                   up to 4 in the hand at once (more cards = a deck; the hand scrolls)
//   stones: [{ lines: [line, ...] }],    one entry per stone (1..5); while standing on stone k they say
//                                        stones[k].lines in turn, one per turn
//   react: { miss, hot, lean, interrupt }, optional reactions (else generic ones)
//   decision: [line, ...],               their own decision, said at the signpost (lines may carry `who`)
//   tutorial: [{ at, my, en }],          first talk only, 3-4 lines; at = 'path'|'label'|'hand'|'steam'|'acts'
//   ---- additions for Days 3-15 (days/INDEX.md 10)
//   noStepBack: true,                    Days 1-7: no Step back button; a stone that is theirs looks plain (a card there = lean)
//   handAt: { [stone]: [cardId] },       on that stone the hand is exactly these cards
//   leanEnd: 'thanks',                   a lean ends warmly: their card.leanLine (else react.lean), no "not yet" panel
//   ask: true|false,                     the Listen button reads Ask (default: from story day 9)
//   by: 'eimon',                         a helper sits with them: her portrait and name on Maya's side; she says the cards
//   faceDownUntil: k,                    cards face down until stone k; one turned up early = a miss + react.interrupt
//   items: { max, ban: [itemId] },       bag items offered in this talk (default one per talk; banned ones greyed)
//   stepBackLines: { [stone]: line },    what they say when Step back is held on that stone (else nothing extra)
// }
// line: { my, en, need, seems?, tell?, face?, mood?, emote?, steam?, heard?, ask?, who? }
//   need   the TRUE need: 'afraid' | 'given' | 'hot' | 'looksdown' | 'envy' | 'cling' | 'unknown' | 'own'
//   seems  the pencil label (what it looks like; hearsay); defaults to need
//   tell   what Look shows (the close look), e.g. { my, en } "his eyes keep going to his teacher"
//   steam  heat this line adds when said; heard: Listen alone moves a stone on this line
//   ask    the question Maya (or `by`) says when Ask is used on this line
//   who    a cast id: which of two people says it (two-voice talks: the portrait swaps)
// card: { id, name, line, answers: [need...], gold?, lookalike?, shows?: [need...], really?, backfire?: { they, maya }, from?,
//         leanLine?, miss?, once?, onlyIf?, flag?, unless?, pencil?, rumour?, companion? }
//   a look-alike answers nothing; it only shows the needs in `shows`, and `really` names what it is
//   miss: what they say when this card misses · once: fits once, then gone for good (save.cardsGone)
//   onlyIf / flag / unless: flag expressions (save.js testFlags) read when the hand is built
//   pencil: a rumour look-alike drawn in pencil; dropped once its `rumour` has a proof slip
// run() -> { won, turns, stones, reason, card (last card id), played: [{ id, result }], items: [itemId] }
import * as THREE from '../game/three.js';
import { tr, lang } from '../game/ui.js';
import { castById } from './cast.js';
import { createTalkState, RULES } from './talk-rules.js';
import { itemInfo } from './items.js';
import { testFlags } from './save.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const LENS = 0.17; // the pair is lifted into the top half (lens shift), so the cards never cover them
const MY_DIGITS = '၀၁၂၃၄၅၆၇၈၉';
const num = (n) => (lang() === 'en' ? String(n) : String(n).replace(/\d/g, (d) => MY_DIGITS[d]));
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('my', { granularity: 'grapheme' }) : null;
const graphemes = (s) => (segmenter ? Array.from(segmenter.segment(s), (x) => x.segment) : Array.from(s));

// ---- the needs, in plain words from the book, with small original line icons (24 px grid)
const I = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
export const NEEDS = {
  afraid: { my: 'ကြောက်', en: 'afraid', icon: I('<circle cx="12" cy="8" r="3.2"/><path d="M6.5 20c1-4 3-6 5.5-6s4.5 2 5.5 6"/><path d="M3 6.5l1.6 1-1.6 1 1.6 1"/><path d="M21 6.5l-1.6 1 1.6 1-1.6 1"/>') },
  given: { my: 'လက်လျှော့', en: 'given up', icon: I('<path d="M12 21.5v-6.5c0-4-1.6-6.6-4.6-7.4"/><path d="M7.4 7.6c-2.1.2-3.2 2-2.8 4.2 2 .2 3.5-1 3.8-3"/><path d="M12 17.5c1.4-2.6 3.9-3.6 6.6-3.1-1 2.5-3.6 3.8-6.6 3.1z"/><path d="M8 21.5h8"/>') },
  hot: { my: 'ပူလောင်', en: 'hot inside', icon: I('<path d="M12 2.8c3 4 6.2 6.3 6.2 11a6.2 6.2 0 0 1-12.4 0c0-3 1.8-5 3.2-6.2 0 2 .8 3.2 2 3.4-.4-3 0-5.6 1-8.2z"/>') },
  looksdown: { my: 'အထင်သေး', en: 'looks down', icon: I('<path d="M3 9.5c3-2.6 6-3.6 9-3.6s6 1 9 3.6"/><path d="M5 10.5c2 2 4.4 3 7 3s5-1 7-3"/><circle cx="12" cy="11.6" r="1.4"/><path d="M12 16.5v5"/><path d="M9.6 19.2 12 21.6l2.4-2.4"/>') },
  envy: { my: 'မနာလို', en: 'envious', icon: I('<path d="M1.8 13c2.4-3.3 4.9-4.8 7.7-4.8s5.3 1.5 7.7 4.8c-2.4 3.3-4.9 4.8-7.7 4.8S4.2 16.3 1.8 13z"/><circle cx="12.4" cy="13" r="1.7"/><path d="M19.6 2.6l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>') },
  cling: { my: 'တွယ်တာ', en: 'clinging', icon: I('<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>') },
  unknown: { my: 'မသိ', en: "doesn't know", icon: I('<path d="M8.8 8.6a3.3 3.3 0 1 1 4.7 3c-.9.5-1.5 1.1-1.5 2.1v1"/><circle cx="12" cy="18.6" r=".6" fill="currentColor"/><path d="M4 4.5c-1.5 2-2 4.6-1.4 7M20 4.5c1.5 2 2 4.6 1.4 7"/>') },
  own: { my: 'ကိုယ်တိုင် ရွေးမယ်', en: 'their own choice', icon: I('<path d="M12 22V3"/><path d="M5 5.5h10.5l3 2.5-3 2.5H5z"/>') },
};
const ICON = {
  look: I('<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  listen: I('<path d="M7 9.5a5 5 0 0 1 10 0c0 3.2-3 4-3 7a3 3 0 0 1-6 .2"/><path d="M10 9.6a2 2 0 0 1 4 0"/>'),
  breathe: I('<path d="M3 8h10.5a3 3 0 1 0-3-3"/><path d="M3 12.5h15a3 3 0 1 1-3 3"/><path d="M3 17h7"/>'),
  back: I('<path d="M14.5 5 7.5 12l7 7"/><path d="M19.5 5 12.5 12l7 7" opacity=".45"/>'),
  pencil: I('<path d="M4 20l1.2-4.6L16.5 4.1a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z"/><path d="M14.5 6l3.5 3.5"/>'),
  quill: I('<path d="M20 3C12 4 7 9 5.5 17.5"/><path d="M20 3c-1 6-5 10.5-11.5 11.5"/><path d="M4 21l1.5-3.5"/>'),
  lang: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>'),
  bag: I('<path d="M5 8.5h14l1.6 12H3.4z"/><path d="M8.6 8.5V7a3.4 3.4 0 0 1 6.8 0v1.5"/><path d="M4.4 13h15.2"/>'),
};
// the person's cup: wisps of steam show how hot they are (no health bars on people)
const MUG = `<svg class="tk-mug" viewBox="0 0 30 34" aria-hidden="true">
  ${[0, 1, 2, 3, 4].map((i) => `<path class="w w${i}" d="M${7 + i * 4} 15c-1.6-1.8 1.6-3 0-5s1.2-3 0-4.6"/>`).join('')}
  <path class="body" d="M5 17h18v9.5a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 5 26.5z"/>
  <path class="handle" d="M23 19.5h2.2a3 3 0 0 1 0 6H23"/>
  <path class="band" d="M5 21h18"/></svg>`;

const T = {
  maya: { my: 'မာရာ', en: 'Maya' },
  calm: { my: 'စိတ်အေး', en: 'calm' },
  turn: (a, b) => ({ my: `အလှည့် ${num(a)} / ${num(b)}`, en: `Turn ${a} / ${b}` }),
  steam: [{ my: 'အေးဆေး', en: 'cool' }, { my: 'နွေးနေ', en: 'warm' }, { my: 'ပူလာပြီ', en: 'heating up' }, { my: 'ပူနေ', en: 'hot' }],
  hotTag: { my: 'ပူနေတုန်း · စကား နားထဲ မဝင်ဘူး', en: "Too hot · words won't enter the ear" },
  look: { my: 'ကြည့်', en: 'Look' }, lookSub: { my: 'စိတ်အေး −၁', en: '−1 calm' }, lookSeen: { my: 'မြင်ပြီ', en: 'seen' }, lookTired: { my: 'မောနေပြီ', en: 'too tired' },
  listen: { my: 'နားထောင်', en: 'Listen' }, listenSub: { my: 'ငွေ့ −၁', en: '−1 steam' },
  ask: { my: 'မေးကြည့်', en: 'Ask' },
  asked: { my: 'မေးကြည့်လိုက်တယ် · ငွေ့ လျော့', en: 'Maya asks · the steam drops' },
  bag: { my: 'အိတ်', en: 'Bag' },
  bagHint: { my: 'တစ်ခု ပေးလို့ရတယ် · အလှည့် မကုန်ဘူး', en: 'Offer one · it costs no turn' },
  why: { ban: { my: 'ဒီမှာ မသုံးဘူး', en: 'not here' }, max: { my: 'သုံးပြီးပြီ', en: 'used' }, late: { my: 'အစမှာပဲ', en: 'first turn only' }, full: { my: 'စိတ်အေး ပြည့်နေ', en: 'calm is full' }, cool: { my: 'အေးနေပြီ', en: 'already cool' }, nothing: { my: 'မလိုသေး', en: 'not needed' } },
  used: (n) => ({ my: `${n} ပေးလိုက်တယ်`, en: `Offered: ${n}` }),
  shield: { my: 'ယပ်တောင်က စိတ်အေးကို ကာပေးလိုက်တယ်', en: 'The fan kept her calm' },
  glassOn: { my: 'မှန်ဘီလူး · ကတ်ကို ရွေးရင် တစ်ဖက်က ဘယ်လို ကြားရမလဲ မြင်ရမယ်', en: 'The glass · lift a card to hear it from their side' },
  glassFit: { my: 'တစ်ဖက်က: နားထဲ ဝင်မယ့်ပုံ', en: 'From their side: it would land' },
  glassHot: { my: 'တစ်ဖက်က: အခု ဘာမှ မကြားနိုင်သေးဘူး', en: "From their side: nothing gets through yet" },
  glassLean: { my: 'တစ်ဖက်က: သူ့ကိုယ်စား ဖြေပေးသလို', en: 'From their side: answering for them' },
  checkOn: { my: 'မေးခွန်းငါးခု · ခဲတံကတ်တွေက ကြားရုံ ကြားထားတာ', en: 'Five questions · the pencil cards are only hearsay' },
  erased: { my: 'ကျွန်မ မှားသွားတယ်။ အဲဒါ ပြန်ဖျက်ပါရစေ။', en: 'That was my mistake. Let me rub it out.' },
  faceDown: { my: 'မှောက်ထား', en: 'face down' },
  interrupt: { my: 'စောလွန်းသေးတယ် · စိတ်အေး တစ်စက် လျော့', en: 'Too soon · one calm gone' },
  breathe: { my: 'အသက်ရှူ', en: 'Breathe' }, breatheSub: { my: 'စိတ်အေး +၁', en: '+1 calm' },
  back: { my: 'နောက်ဆုတ်ပေး', en: 'Step back' }, backSub: { my: 'ဖိထားပါ · သူ ဆုံးဖြတ်ပါစေ', en: 'hold · let them decide' },
  say: { my: 'ပြောမယ် ▸', en: 'Say it ▸' },
  hollow: { my: 'ကြည့်ရုံပဲ', en: 'only looks like it' },
  pencil: { my: 'ခဲတံ', en: 'pencil' },
  closer: { my: 'သေချာ ကြည့်လိုက်တော့', en: 'Looking closer' },
  fit: { my: 'တစ်လှမ်း တိုးလာတယ်', en: 'A step forward' },
  fit2: { my: 'နှစ်လှမ်း တိုးလာတယ်', en: 'Two steps forward' },
  miss: { my: 'မကိုက်ဘူး · စိတ်အေး တစ်စက် လျော့', en: "Didn't fit · one calm gone" },
  backfire: { my: 'နောက်ပြန် ဆုတ်သွားတယ်', en: 'A step back' },
  hot: { my: 'စကားက နားထဲ မဝင်ဘူး', en: "The words don't enter the ear" },
  listened: { my: 'နားထောင်ပေးလိုက်တယ် · ငွေ့ လျော့', en: 'Maya listens · the steam drops' },
  heard: { my: 'ကြားပေးတာနဲ့တင် တစ်လှမ်း တိုးလာတယ်', en: 'Being heard was a step' },
  breathed: { my: 'အသက် ဖြည်းဖြည်း ရှူလိုက်တယ်', en: 'A slow breath' },
  newHand: { my: 'စကား အသစ်တွေ', en: 'a fresh hand' },
  leanT: { my: 'သူ့အစား ဖြေပေးလိုက်မိပြီ', en: 'Maya answered for them' },
  missLine: { my: '…', en: '…' },
  hotLine: { my: '(ဘာမှ မကြားဘူး။ ရင်ထဲ ပူနေတုန်း။)', en: "(Nothing gets through. It's still too hot inside.)" },
  leanLine: { my: 'ဟုတ်လား… ဒါဆို အဲဒီလို လုပ်မယ်…', en: "Really… then I'll do that…" },
  next: { my: 'ဆက်မယ် ▸', en: 'Next ▸' },
  cont: { my: 'ဆက်မယ်', en: 'Continue' },
  okay: { my: 'ဟုတ်ကဲ့', en: 'Okay' },
  won: (n) => ({ my: `${n} ကိုယ်တိုင် ဆုံးဖြတ်လိုက်ပြီ`, en: `${n} made their own choice` }),
  notyet: { my: 'မရသေးဘူးနော်', en: 'Not yet' },
  notyetWhy: { calm: { my: 'မာရာ့ စိတ်အေး ကုန်သွားပြီ။', en: "Maya's calm ran out." }, turns: { my: 'အလှည့်တွေ ကုန်သွားပြီ။', en: 'The turns ran out.' }, lean: { my: 'သူ့ကိုယ်စား ဖြေပေးလိုက်လို့ မာရာ့ကို မှီသွားတယ်။', en: 'Maya answered for them, so they leaned on her.' } },
  notyetNone: { my: 'တခြား တစ်ခုခု လုပ်ပြီးမှ ပြန်လာခဲ့နော်။', en: 'Do something else, then come back.' },
  notyetKeep: (n, a, b) => ({ my: `${n} တွေးမိသလောက်က မပျောက်ဘူး (ကျောက်တုံး ${num(a)} / ${num(b)})။ တခြား တစ်ခုခု လုပ်ပြီးမှ ပြန်လာခဲ့နော်။`, en: `What ${n} worked out stays (stone ${a} of ${b}). Do something else, then come back.` }),
};

export function createTalk(game, story, opts = {}) {
  injectStyle();
  const waits = new Map(); // talk id -> { x, z, t, scene: Set of ids }
  const memo = {}; // progress when there is no story save (dev page)
  let active = false;

  // talking to someone outside the scene counts as "doing something else"
  if (story && typeof story.talkTo === 'function' && !story.talkTo.__wrapped) {
    const orig = story.talkTo;
    story.talkTo = function (e, ...a) {
      for (const [id, w] of waits) if (!w.scene.has(e?.id)) waits.delete(id);
      return orig.call(this, e, ...a);
    };
    story.talkTo.__wrapped = true;
  }
  const mayaXZ = () => { const p = game?.maya?.root?.position; return p ? { x: p.x, z: p.z } : { x: 0, z: 0 }; };

  const api = {
    get active() { return active; },
    waiting(id) {
      const w = waits.get(id);
      if (!w) return false;
      const m = mayaXZ();
      if (Math.hypot(m.x - w.x, m.z - w.z) > 6 || performance.now() - w.t > 60000 || (story?.foot && !story.foot.active)) { waits.delete(id); return false; }
      return true;
    },
    clearWait(id) { waits.delete(id); },
    progress(id) { return (story?.flag ? story.flag(`talk.${id}`) : memo[id]) || 0; },
    run,
    debug: null,
    autoPlay,
  };
  // test hook: window.__talk.autoPlay(care) plays every talk that opens from now on, turn by turn, through
  // the same buttons a player uses (ui.act), skipping typing and pauses; the tutorial and the end card are
  // clicked through. care 1: the best card each turn (a card that fits the line; Step back on a stone that
  // is theirs; Listen while it is hot, face down or nothing fits; Breathe for a fresh hand when calm is low).
  // care 0: a look-alike (else any card that does not fit). -> stop(); window.__talk.autoLog lists the moves.
  let autoStop = null;
  function autoPlay(care = 1, { every = 120 } = {}) {
    autoStop?.();
    const log = (api.autoLog = []);
    const pick = (st, data) => {
      const hand = st.hand.map((id) => st.card(id)).filter(Boolean);
      if (care >= 1) {
        if (st.onTheirs && !data?.noStepBack) return { type: 'stepBack' }; // their stone: let them decide (no card)
        // (Days 1-7 have no Step back: on their stone Maya only holds her own answers, so one is played: the lean)
        if (st.onTheirs) { const c = hand.find((x) => st.fits(x)) || hand.find((x) => !x.lookalike) || hand[0]; if (c) return { type: 'play', id: c.id }; }
        if (st.faceDown() || st.hot) return { type: 'listen' };
        const fit = hand.find((c) => st.fits(c));
        if (fit) return { type: 'play', id: fit.id };
        if (st.line?.heard) return { type: 'listen' };
        // nothing in hand fits: a fresh hand (Breathe) only if a card left in the deck would fit this need;
        // else Listen/Ask (cools, inks the next line, and is what an 'unknown' need asks for)
        const deckFit = st.atStone == null && [...st.cards.values()].some((c) => !st.hand.includes(c.id) && !st.gone?.has(c.id) && st.fits(c));
        return { type: deckFit ? 'breathe' : 'listen' };
      }
      const alike = hand.find((c) => c.lookalike) || hand.find((c) => !st.fits(c)) || hand[0];
      return alike ? { type: 'play', id: alike.id } : { type: 'listen' };
    };
    const t = setInterval(() => {
      const d = api.debug;
      if (!d) return;
      const { st, ui, data } = d;
      const root = ui.el;
      const coach = root?.querySelector('.tk-coach');
      if (coach && !coach.hidden) { coach.querySelector('button')?.click(); return; }
      const end = root?.querySelector('.tk-end');
      if (end && !end.hidden) { end.querySelector('button')?.click(); return; }
      if (ui.typing) ui.typing.skip = true;
      if (ui.tapLine) ui.tapLine();
      if (ui.busy || !ui.resolve || st.over) return;
      const a = pick(st, data);
      log.push({ talk: data.id, turn: st.turn, pos: st.pos, need: st.line?.need, ...a });
      ui.act(a);
    }, every);
    autoStop = () => { clearInterval(t); autoStop = null; };
    return autoStop;
  }
  if (typeof window !== 'undefined') window.__talk = api;

  // the hand as the save allows it today: look-alikes gone for good, `once` cards used up, flag-gated cards,
  // pencil rumour cards whose rumour has been checked
  function prepare(data) {
    const save = story?.save;
    if (!save) return data;
    const gone = new Set([...(save.lookalikesGone || []), ...(save.cardsGone || [])]);
    const hand = data.hand.filter((c) => {
      if (gone.has(c.id) || (c.lookalikeId && gone.has(c.lookalikeId))) return false;
      if (c.onlyIf && !testFlags(save, c.onlyIf)) return false;
      if (c.flag && !testFlags(save, c.flag)) return false;
      if (c.unless && testFlags(save, c.unless)) return false;
      if (c.pencil && c.rumour && ((save.bag[`proof:${c.rumour}`] || 0) > 0 || save.flags[`rumour.${c.rumour}`] === 'checked')) return false;
      return true;
    });
    if (hand.length === data.hand.length) return data;
    const ids = new Set(hand.map((c) => c.id));
    const handAt = data.handAt ? Object.fromEntries(Object.entries(data.handAt).map(([k, v]) => [k, v.filter((id) => ids.has(id))])) : undefined;
    return { ...data, hand, handAt };
  }

  async function run(data0) {
    if (active) return { won: false, turns: 0, busy: true };
    active = true;
    const data = prepare(data0);
    const e = story?.people?.get(data.person) || null;
    const cast = castById(data.person) || e?.cast || { name: { my: data.person, en: data.person } };
    const st = createTalkState(data, { start: Math.max(api.progress(data.id), data.start || 0) });
    const gameEl = document.getElementById('game') || document.body;
    const prevLetter = gameEl.classList.contains('cinema');
    let view = null;
    try {
      call(game?.ui, 'hideDialog');
      view = await stage(e);
      const ui = buildScreen(data, cast, e, st);
      gameEl.classList.add('rc-talk');
      api.debug = { st, ui, data };
      const res = await play(data, cast, e, st, ui);
      res.card = st.lastCard;
      res.played = st.played.slice();
      res.items = st.itemsUsed.slice();
      if (story?.flag) story.flag(`talk.${data.id}`, res.won ? 0 : st.best); else memo[data.id] = res.won ? 0 : st.best;
      // `once` cards that fitted leave every later hand
      if (story?.save && st.gone.size) { for (const id of st.gone) if (!story.save.cardsGone.includes(id)) story.save.cardsGone.push(id); story.persist?.(); }
      // a warm lean leaves a faint pencil smudge on their signpost (Day 8 explains it)
      if (res.reason === 'lean' && data.leanEnd && story?.flag) story.flag(`talk.${data.id}.smudge`, true);
      if (!res.won) { const m = mayaXZ(); waits.set(data.id, { x: m.x, z: m.z, t: performance.now(), scene: new Set([data.person, ...(data.with || []), ...(data.by ? [data.by] : [])]) }); }
      ui.el.classList.add('out');
      await wait(260);
      ui.dispose();
      return res;
    } finally {
      gameEl.classList.remove('rc-talk');
      if (view?.camera) { view.camera.clearViewOffset(); }
      if (story && e && story.talkWith === e) story.talkWith = prevWith;
      prevWith = null;
      call(e?.p, 'setMood', null);
      if (prevLetter) game?.ui?.cinema?.(true);
      api.debug = null;
      active = false;
    }
  }

  // ---- staging: Maya beside them, both a little toward the camera, the low two-shot, lens lifted
  let shotAz = 0;
  let prevWith = null;
  async function stage(e) {
    const camera = game?.camera;
    if (e && story?.foot?.active && game?.maya) {
      const foot = story.foot;
      const pp = e.p.root.position;
      const mp = foot.pos;
      // beside them at a talking distance: not across the street, and not so close they overlap on screen
      const gap = Math.hypot(pp.x - mp.x, pp.z - mp.y);
      if (gap > 1.8 || gap < 0.85 || Math.abs(pp.z - mp.y) > 0.6) {
        const sx = mp.x < pp.x ? -1 : 1;
        // beside them; if that spot can't be reached, the other side, then in front or behind
        const spots = [[sx * 1.15, 0.05], [-sx * 1.15, 0.05], [0, 1.15], [0, -1.15]];
        await new Promise((r) => {
          let done = false;
          const fin = () => { if (!done) { done = true; r(); } };
          const tryAt = (i) => { if (done) return; if (i >= spots.length) return fin(); foot.walkTo(pp.x + spots[i][0], pp.z + spots[i][1], (ok) => (ok === false ? tryAt(i + 1) : fin())); };
          tryAt(0);
          setTimeout(fin, 9000);
        });
        foot.walker.stop?.();
      }
      // stand still (no leftover walking speed to turn her heading back)
      foot.walker.teleport?.(foot.pos.x, foot.pos.y);
      const m = game.maya.root.position;
      foot.walker.heading = Math.atan2(pp.x - m.x, pp.z - m.z);
      game.maya.root.rotation.set(0, foot.walker.heading, 0);
      e.p.root.rotation.y = Math.atan2(m.x - pp.x, m.z - pp.z);
      if (opts.twoShot) {
        shotAz = opts.twoShot(m, pp);
        const cheat = (h) => { let d = shotAz - h; d = Math.atan2(Math.sin(d), Math.cos(d)); return h + d * 0.5; };
        foot.walker.heading = cheat(foot.walker.heading);
        game.maya.root.rotation.set(0, foot.walker.heading, 0);
        e.p.root.rotation.y = cheat(e.p.root.rotation.y);
      }
      // story.js turns people square to Maya every frame when she is close (except the one she talks
      // with, story.talkWith); hold the three-quarter
      // cheat for the whole talk so their face stays to the camera (no edit to story.js needed)
      prevWith = story.talkWith;
      story.talkWith = e;
      const face = e.p.root.rotation.y;
      const hold = () => { if (!active) return; e.p.root.rotation.y = face; requestAnimationFrame(hold); };
      requestAnimationFrame(hold);
    }
    if (camera?.setViewOffset) camera.setViewOffset(1000, 1000, 0, LENS * 1000, 1000, 1000);
    return { camera };
  }
  // Look: a short close-up on their face, then back to the two-shot
  async function closeUp(e) {
    if (!e || !game?.rig || !opts.twoShot) return wait(900);
    const p = e.p.root.position;
    const hy = (e.p.height || 1.1) * 0.82;
    // from the two-shot side, turned a little toward their face: Maya stays out of the frame (a camera
    // straight in front of their face would look past her shoulder and crop her), head and shoulders in
    // the upper half: the lens shift lifts the look point, so aim at the chest
    const f = e.p.root.rotation.y;
    let d = shotAz - f; d = Math.atan2(Math.sin(d), Math.cos(d));
    let az = f + d * 0.7;
    // keep well away from the line toward Maya
    const m = game.maya.root.position;
    const toMaya = Math.atan2(m.x - p.x, m.z - p.z);
    let off = az - toMaya; off = Math.atan2(Math.sin(off), Math.cos(off));
    const side = Math.sign(off || 1);
    if (Math.abs(off) < 1.25) az = toMaya + side * 1.25;
    // then swing further from her until none of her (hair to shoes) is left at the edge of the frame
    const look = new THREE.Vector3(p.x, hy - 0.38, p.z);
    const pos = new THREE.Vector3();
    const c = new THREE.PerspectiveCamera(game.camera.fov, game.camera.aspect, 0.1, 100);
    const q = new THREE.Vector3();
    for (let k = 0; k < 8; k++) {
      pos.set(p.x + Math.sin(az) * 3.0, hy + 0.15, p.z + Math.cos(az) * 3.0);
      c.position.copy(pos); c.lookAt(look); c.updateMatrixWorld();
      let seen = false;
      for (const y of [0.2, 0.8, 1.35]) for (const sx of [-0.4, 0.4]) {
        q.set(m.x + Math.cos(az) * sx, y, m.z - Math.sin(az) * sx).project(c);
        if (q.z < 1 && Math.abs(q.x) < 1.04 && Math.abs(q.y) < 1.1) seen = true;
      }
      if (!seen) break;
      az += side * 0.1;
    }
    // they look ahead (thinking) rather than at Maya, so the close-up has their face, not an ear
    if (story) story.talkGaze = 'ahead';
    try {
      await game.rig.shot(pos, look, 0.55);
      await wait(1100);
    } finally { if (story) story.talkGaze = null; }
    opts.twoShot(game.maya.root.position, p);
  }

  // ---- the screen
  function buildScreen(data, cast, e, st) {
    const el = document.createElement('div');
    el.id = 'rc-talk';
    el.innerHTML = `
      <div class="tk-hud">
        <div class="tk-row">
          <div class="tk-who them"><canvas class="tk-face" width="128" height="128"></canvas>
            <div class="tk-meta"><b class="tk-name"></b><div class="tk-steam">${MUG}<small></small></div></div></div>
          <div class="tk-mid"><span class="tk-turns"></span><button type="button" class="tk-lang" aria-label="Language">${ICON.lang}</button></div>
          <div class="tk-who maya"><div class="tk-meta"><b class="tk-name"></b><div class="tk-calm"><span class="dots"></span><small></small></div></div>
            <canvas class="tk-face" width="128" height="128"></canvas></div>
        </div>
        <div class="tk-path"><div class="tk-track"></div><div class="tk-token"><canvas width="64" height="64"></canvas></div></div>
      </div>
      <div class="tk-toast" aria-live="polite"></div>
      <div class="tk-bottom">
        <div class="tk-line">
          <div class="tk-label"></div>
          <div class="tk-say"><b class="tk-speaker"></b><p class="tk-text"></p></div>
          <p class="tk-tell"></p>
        </div>
        <div class="tk-hand"></div>
        <div class="tk-items" hidden><p class="tk-items-hint"></p><div class="tk-chips"></div></div>
        <div class="tk-acts">
          <button type="button" data-act="look"><i>${ICON.look}</i><span><b></b><small></small></span></button>
          <button type="button" data-act="listen"><i>${ICON.listen}</i><span><b></b><small></small></span></button>
          <button type="button" data-act="breathe"><i>${ICON.breathe}</i><span><b></b><small></small></span></button>
          <button type="button" data-act="back" class="tk-hold"><i>${ICON.back}</i><span><b></b><small></small></span><em class="fill"></em></button>
          <button type="button" data-act="bag" class="tk-bagbtn" hidden><i>${ICON.bag}</i></button>
        </div>
      </div>
      <div class="tk-coach" hidden><div class="tk-coach-card"><p></p><button type="button"></button></div></div>
      <div class="tk-end" hidden></div>`;
    const host = document.getElementById('game') || document.body;
    host.appendChild(el);
    const $ = (s) => el.querySelector(s);
    const $$ = (s) => el.querySelectorAll(s);
    const ui = { el, $, $$, sel: null, resolve: null, busy: true, said: null, typing: null, glass: false };
    const N = st.N;
    const plainStones = !!data.noStepBack; // Days 1-7: a stone that is theirs looks like any other
    const askLabel = data.ask ?? ((story?.save?.day || 1) >= 9);
    // a helper sitting with them (data.by): her face and name on Maya's side, her voice for the cards
    const helper = data.by ? { cast: castById(data.by), e: story?.people?.get(data.by) } : null;
    ui.helperName = helper ? (helper.cast?.name || { my: data.by, en: data.by }) : T.maya;
    // two voices: the person a line belongs to (line.who), else the talk's person
    ui.themName = cast.name;

    // faces
    const themFace = $('.tk-who.them .tk-face').getContext('2d');
    const mayaFace = $('.tk-who.maya .tk-face').getContext('2d');
    const tokenFace = $('.tk-token canvas').getContext('2d');
    ui.setThemFace = (f, who) => {
      const src = who && who !== data.person ? story?.people?.get(who)?.p : e?.p;
      const c = call(src, 'portrait', f || 'smile');
      if (c) {
        themFace.clearRect(0, 0, 128, 128); themFace.drawImage(c, 0, 0, 128, 128);
        if (!who || who === data.person) { tokenFace.clearRect(0, 0, 64, 64); tokenFace.drawImage(c, 0, 0, 64, 64); }
      }
    };
    ui.setMayaFace = (f) => {
      const c = helper ? call(helper.e?.p, 'portrait', f === 'think' ? 'think' : f === 'surprised' ? 'surprised' : 'smile') : call(game?.maya, 'faceCanvas', f || 'smile');
      if (c) { mayaFace.clearRect(0, 0, 128, 128); mayaFace.drawImage(c, 0, 0, 128, 128); }
    };
    ui.setThemFace('smile');
    ui.setMayaFace('smile');

    // the stepping stones: their spot, N stones, their signpost on the last one
    const track = $('.tk-track');
    const spots = [];
    for (let i = 0; i <= N; i++) {
      const s = document.createElement('i');
      s.className = i === 0 ? 'start' : 'stone' + (st.theirs.has(i - 1) && !plainStones ? ' theirs' : '') + (i === N ? ' last' : '');
      if (i === N) s.innerHTML = `<span class="post">${NEEDS.own.icon}</span>`;
      track.appendChild(s);
      spots.push(s);
    }
    ui.placeToken = () => {
      const s = spots[Math.min(st.pos, N)];
      const tok = $('.tk-token');
      tok.style.transform = `translateX(${(s.offsetLeft + s.offsetWidth / 2 - 18).toFixed(1)}px)`;
      spots.forEach((x, i) => x.classList.toggle('passed', i > 0 && i <= st.pos));
    };

    ui.hud = () => {
      $('.tk-who.them .tk-name').textContent = tr(ui.themName);
      $('.tk-who.maya .tk-name').textContent = tr(ui.helperName);
      const steam = $('.tk-steam');
      steam.classList.toggle('hot', st.steam >= RULES.hot);
      el.querySelectorAll('.tk-mug .w').forEach((w, i) => w.classList.toggle('on', i < st.steam));
      steam.querySelector('small').textContent = tr(T.steam[Math.min(3, st.steam)]);
      const dots = $('.tk-calm .dots');
      if (dots.children.length !== st.calmMax) dots.innerHTML = '<i></i>'.repeat(st.calmMax);
      [...dots.children].forEach((d, i) => d.classList.toggle('on', i < st.calm));
      $('.tk-calm small').textContent = tr(T.calm);
      $('.tk-turns').textContent = tr(T.turn(st.over ? st.turn : Math.min(st.turn + 1, st.turns), st.turns));
      el.classList.toggle('over', !!st.over);
      ui.placeToken();
      // actions
      const theirs = st.onTheirs && !st.over && !plainStones;
      el.classList.toggle('theirs', theirs);
      el.classList.toggle('facedown', st.faceDown() && !st.over);
      const bagB = $('[data-act="bag"]');
      bagB.hidden = !ui.bagItems().length || st.over;
      bagB.classList.toggle('spent', st.itemsUsed.length >= (data.items?.max ?? RULES.items));
      bagB.setAttribute('aria-label', tr(T.bag));
      const look = $('[data-act="look"]');
      look.querySelector('b').textContent = tr(T.look);
      look.querySelector('small').textContent = tr(st.inked ? T.lookSeen : st.calm < RULES.lookMinCalm ? T.lookTired : T.lookSub);
      look.disabled = !st.canLook();
      const li = $('[data-act="listen"]');
      li.querySelector('b').textContent = tr(askLabel ? T.ask : T.listen); li.querySelector('small').textContent = tr(T.listenSub);
      const br = $('[data-act="breathe"]');
      br.querySelector('b').textContent = tr(T.breathe); br.querySelector('small').textContent = tr(T.breatheSub);
      const bk = $('[data-act="back"]');
      bk.querySelector('b').textContent = tr(T.back); bk.querySelector('small').textContent = tr(T.backSub);
      el.classList.toggle('hot', st.steam >= RULES.hot && !theirs);
    };

    // bag items that can be offered in a talk (supplies and keepsakes with a `talk` effect)
    ui.bagItems = () => {
      const bag = story?.save?.bag || {};
      return Object.keys(bag).filter((id) => bag[id] > 0).map((id) => itemInfo(id, story?.save)).filter((it) => it && it.talk);
    };
    ui.items = (open) => {
      const box = $('.tk-items');
      if (open === undefined) open = box.hidden;
      box.hidden = !open;
      if (!open) return;
      box.querySelector('.tk-items-hint').textContent = tr(T.bagHint);
      const chips = box.querySelector('.tk-chips');
      chips.innerHTML = '';
      for (const it of ui.bagItems()) {
        const why = st.canUse(it.id, it.talk);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tk-chip' + (why ? ' off' : '') + (why === 'ban' ? ' ban' : '');
        b.innerHTML = `<i class="ico">${it.icon}</i><span><b></b><small></small></span>`;
        const n = story?.save?.bag?.[it.id] || 0;
        b.querySelector('b').textContent = tr(it.name) + (it.supply && n > 1 ? ` ×${num(n)}` : '');
        b.querySelector('small').textContent = why ? tr(T.why[why] || T.why.nothing) : tr(it.about);
        b.addEventListener('click', (ev) => { ev.stopPropagation(); if (why || ui.busy) { call(game?.audio, 'play', 'pop'); return; } box.hidden = true; ui.act({ type: 'item', id: it.id }); });
        chips.appendChild(b);
      }
    };

    // the line: pencil label (what it looks like) or gold ink (what it is)
    ui.label = () => {
      const L = st.line;
      const lab = $('.tk-label');
      if (!L) { lab.innerHTML = ''; return; }
      const seems = L.seems || L.need;
      const pencil = `<span class="pencil${st.inked && seems !== L.need ? ' wrong' : ''}">${ICON.pencil}<i>${NEEDS[seems]?.icon || ''}</i>${tr(NEEDS[seems] || { my: seems, en: seems })}</span>`;
      const ink = st.inked ? `<span class="ink">${ICON.quill}<i>${NEEDS[L.need]?.icon || ''}</i>${tr(NEEDS[L.need] || { my: L.need, en: L.need })}</span>` : '';
      lab.innerHTML = (st.inked && seems === L.need ? ink : pencil + ink) + (st.steam >= RULES.hot && !st.onTheirs ? `<span class="hottag">${tr(T.hotTag)}</span>` : '');
      $('.tk-tell').textContent = st.inked && st.looked && L.tell ? `${tr(T.closer)}: ${tr(L.tell)}` : '';
    };

    // the hand
    ui.hand = () => {
      const hand = $('.tk-hand');
      const keep = hand.scrollLeft;
      hand.innerHTML = '';
      hand.classList.toggle('few', st.hand.length <= 3);
      for (const id of st.hand) {
        const c = st.card(id);
        const b = document.createElement('button');
        b.type = 'button';
        const down = st.faceDown();
        b.className = 'tk-card' + (c.gold ? ' gold' : '') + (c.pencil ? ' pencil' : '') + (down ? ' down' : '');
        b.dataset.id = id;
        const shows = c.shows || c.answers || [];
        b.innerHTML = `<span class="icons">${shows.map((n) => `<i title="${tr(NEEDS[n] || {})}">${NEEDS[n]?.icon || ''}</i>`).join('')}</span><b></b><span class="cl"></span><em class="really"></em><em class="peek"></em><em class="go"></em>`;
        b.querySelector('b').textContent = down ? '' : tr(c.name);
        b.querySelector('.cl').textContent = down ? tr(T.faceDown) : tr(c.line);
        b.querySelector('.go').textContent = tr(T.say);
        if (!down && st.inked && !st.onTheirs) {
          if (c.lookalike) { b.classList.add('hollow'); b.querySelector('.really').textContent = c.really ? tr(c.really) : tr(T.hollow); }
          else if (st.fits(c)) b.classList.add('fit');
          else b.classList.add('nofit');
        }
        // the five-question card: hearsay cards show what they are
        if (!down && st.checked && c.pencil && !b.classList.contains('hollow')) { b.classList.add('hollow'); b.querySelector('.really').textContent = c.really ? tr(c.really) : tr(T.hollow); }
        // the reading glass: how Maya's own lifted card would sound from their side
        if (!down && ui.glass && ui.sel === id) {
          const pv = st.preview(id);
          const peek = pv.result === 'fit' ? T.glassFit : pv.result === 'hot' ? T.glassHot : pv.result === 'lean' ? T.glassLean
            : pv.result === 'backfire' ? (c.backfire?.they || T.hollow) : (c.miss || data.react?.miss || T.missLine);
          b.querySelector('.peek').textContent = tr(peek);
          b.classList.add('peeking');
        }
        if (ui.sel === id) b.classList.add('sel');
        b.addEventListener('click', (ev) => {
          ev.stopPropagation();
          if (ui.busy) return;
          if (ui.sel !== id) {
            ui.sel = id; call(game?.audio, 'play', 'click');
            if (ui.glass) ui.hand(); else hand.querySelectorAll('.tk-card').forEach((x) => x.classList.toggle('sel', x.dataset.id === id));
            hand.querySelector(`.tk-card[data-id="${id}"]`)?.scrollIntoView?.({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            return;
          }
          ui.act({ type: 'play', id });
        });
        hand.appendChild(b);
      }
      hand.scrollLeft = keep;
    };

    ui.act = (a) => { if (ui.busy || !ui.resolve) return; const r = ui.resolve; ui.resolve = null; ui.sel = null; r(a); };
    for (const k of ['look', 'listen', 'breathe']) $(`[data-act="${k}"]`).addEventListener('click', (ev) => { ev.stopPropagation(); $('.tk-items').hidden = true; ui.act({ type: k }); });
    $('[data-act="bag"]').addEventListener('click', (ev) => { ev.stopPropagation(); if (ui.busy) return; call(game?.audio, 'play', 'click'); ui.items(); });
    // Step back is held, not tapped: they need a moment to decide
    const bk = $('[data-act="back"]');
    let holdT = null;
    const HOLD = 1600;
    const down = (ev) => {
      ev.preventDefault();
      if (ui.busy || !st.onTheirs) return;
      bk.classList.add('holding');
      holdT = setTimeout(() => { bk.classList.remove('holding'); holdT = null; ui.act({ type: 'stepBack' }); }, HOLD);
    };
    const up = () => { if (holdT) { clearTimeout(holdT); holdT = null; } bk.classList.remove('holding'); };
    bk.addEventListener('pointerdown', down);
    for (const t of ['pointerup', 'pointerleave', 'pointercancel']) bk.addEventListener(t, up);
    bk.addEventListener('contextmenu', (ev) => ev.preventDefault());
    bk.style.setProperty('--hold', `${HOLD}ms`);
    // tap the line to finish its typing; tap empty space to put a lifted card back
    $('.tk-line').addEventListener('click', () => { if (ui.typing) ui.typing.skip = true; ui.tapLine?.(); });
    el.addEventListener('click', (ev) => {
      if (ev.target.closest('.tk-card, .tk-acts, .tk-line, .tk-coach, .tk-end, .tk-lang, .tk-items')) return;
      $('.tk-items').hidden = true;
      if (ui.sel) { ui.sel = null; ui.hand(); }
    });
    // language
    $('.tk-lang').addEventListener('click', (ev) => {
      ev.stopPropagation();
      const b = document.getElementById('btn-lang');
      if (b) b.click();
      else { document.documentElement.setAttribute('data-lang', lang() === 'en' ? 'my' : 'en'); document.dispatchEvent(new CustomEvent('mw:lang')); }
    });
    const onLang = () => { ui.hud(); ui.label(); ui.hand(); if (ui.said) $('.tk-text').textContent = tr(ui.said.line); if (ui.said) $('.tk-speaker').textContent = tr(ui.said.who); };
    document.addEventListener('mw:lang', onLang);
    const onResize = () => ui.placeToken();
    window.addEventListener('resize', onResize);
    ui.dispose = () => { document.removeEventListener('mw:lang', onLang); window.removeEventListener('resize', onResize); el.remove(); };

    // a line in the panel, typed out; who = name {my,en}; maya: true styles it as Maya's
    ui.say = async (who, line, { maya = false, hold = 0 } = {}) => {
      ui.said = { who, line };
      $('.tk-say').classList.toggle('maya', maya);
      $('.tk-speaker').textContent = tr(who);
      const text = tr(line);
      const out = $('.tk-text');
      const parts = graphemes(text);
      const typing = (ui.typing = { skip: false });
      out.textContent = '';
      // typed against the clock (26 ms a letter, a little pause after a stop), so a slow phone that
      // misses timer ticks shows several letters at once and still finishes on time
      const due = [];
      let at = 0;
      for (const ch of parts) { due.push(at); at += /[။၊.!?…]/.test(ch) ? 90 : 26; }
      const t0 = performance.now();
      let i = 0;
      while (i < parts.length && !typing.skip) {
        const now = performance.now() - t0;
        const was = i;
        while (i < parts.length && due[i] <= now) i++;
        if (i === was) i++;
        out.textContent = parts.slice(0, i).join('');
        if (Math.floor(i / 3) !== Math.floor(was / 3)) call(game?.audio, 'play', 'type');
        if (i < parts.length) await wait(Math.max(16, due[i] - (performance.now() - t0)));
      }
      out.textContent = text;
      ui.typing = null;
      if (hold) await ui.pause(hold + parts.length * 22);
    };
    // wait a little, or until the line is tapped
    ui.pause = (ms) => new Promise((r) => { const t = setTimeout(() => { ui.tapLine = null; r(); }, ms); ui.tapLine = () => { clearTimeout(t); ui.tapLine = null; r(); }; });

    ui.toast = (text, kind = '') => {
      const t = $('.tk-toast');
      t.className = `tk-toast show ${kind}`;
      t.textContent = tr(text);
      clearTimeout(ui.toastT);
      ui.toastT = setTimeout(() => t.classList.remove('show'), 2200);
    };

    ui.coach = (steps) => new Promise((resolve) => {
      const box = $('.tk-coach');
      const p = box.querySelector('p');
      const btn = box.querySelector('button');
      let i = 0;
      const targets = { path: '.tk-path', label: '.tk-label', hand: '.tk-hand', steam: '.tk-steam', acts: '.tk-acts' };
      const show = () => {
        el.querySelectorAll('.tk-focus').forEach((x) => x.classList.remove('tk-focus'));
        if (i >= steps.length) { box.hidden = true; resolve(); return; }
        const s = steps[i];
        p.textContent = tr(s);
        btn.textContent = tr(T.next);
        const tgt = $(targets[s.at] || '.tk-line');
        tgt?.classList.add('tk-focus');
        box.hidden = false;
        // the card sits on the far side of what it talks about
        const r = tgt?.getBoundingClientRect();
        const card = box.firstElementChild;
        const H = window.innerHeight;
        if (r && r.top + r.height / 2 < H * 0.45) { card.style.top = `${Math.round(r.bottom + 14)}px`; card.style.bottom = ''; }
        else if (r) { card.style.bottom = `${Math.round(H - r.top + 14)}px`; card.style.top = ''; }
      };
      btn.onclick = (ev) => { ev.stopPropagation(); call(game?.audio, 'play', 'page'); i++; show(); };
      show();
    });

    ui.end = (html, btnText) => new Promise((resolve) => {
      const box = $('.tk-end');
      box.innerHTML = `<div class="tk-end-card">${html}<button type="button"></button></div>`;
      box.querySelector('button').textContent = tr(btnText);
      box.hidden = false;
      el.classList.add('ended');
      $('.tk-toast').classList.remove('show');
      box.querySelector('button').addEventListener('click', (ev) => { ev.stopPropagation(); call(game?.audio, 'play', 'click'); resolve(); });
    });

    ui.hud();
    requestAnimationFrame(() => ui.placeToken());
    return ui;
  }

  // ---- one talk, turn by turn
  async function play(data, cast, e, st, ui) {
    const them = cast.name;
    const p = e?.p;
    const helperP = data.by ? story?.people?.get(data.by)?.p : null;
    const mayaVoice = data.by ? (castById(data.by)?.name || T.maya) : T.maya;
    // a line may belong to the second voice (line.who): their actor, name and portrait
    const voice = (line) => {
      const who = line?.who && line.who !== data.person ? line.who : null;
      if (!who) return { who: null, p, name: them };
      return { who, p: story?.people?.get(who)?.p, name: castById(who)?.name || { my: who, en: who } };
    };
    const sayThem = async (line, o = {}) => {
      if (!line) return;
      const v = voice(line);
      const f = line.face || 'talk';
      call(v.p, 'setFace', f === 'talk' ? 'smile' : f, 99);
      if (line.mood !== undefined) call(v.p, 'setMood', line.mood);
      if (line.emote) call(v.p, 'emote', line.emote);
      call(v.p, 'talk', Math.min(6, 0.8 + tr(line).length * 0.05));
      ui.themName = v.name;
      ui.$('.tk-who.them .tk-name').textContent = tr(v.name);
      ui.setThemFace(f === 'talk' ? 'smile' : f, v.who);
      await ui.say(v.name, line, o);
      call(v.p, 'talk', 0);
    };
    // Maya's words (or the helper's, when someone sits with them)
    const sayMaya = async (line, face = 'smile', o = {}) => {
      const a = helperP || game?.maya;
      call(a, 'setFace', helperP ? (face === 'surprised' ? 'surprised' : face === 'think' ? 'think' : 'smile') : face, 6);
      call(a, 'talk', Math.min(5, 0.8 + tr(line).length * 0.05));
      ui.setMayaFace(face);
      await ui.say(mayaVoice, line, { maya: true, ...o });
      call(a, 'talk', 0);
    };
    const flash = (sel, cls = 'flash') => { const x = ui.$(sel); if (!x) return; x.classList.remove(cls); void x.offsetWidth; x.classList.add(cls); };

    st.nextLine();
    ui.label(); ui.hand(); ui.hud();
    // first talk: a few lines that teach the screen
    // each talk's tutorial shows once (its own flag: talk.tutorial.<tutorialKey | id>), so a later day can
    // teach something new (the steam, a pencil card) after Day 1's first lesson; 'talk.tutorial' stays the
    // "any tutorial seen" flag older saves carry
    const tutKey = data.tutorialKey ? `talk.tutorial.${data.tutorialKey}` : data.id && !/^d1-/.test(data.id) ? `talk.tutorial.${data.id}` : 'talk.tutorial'; // (Day 1's: the old flag)
    const seenTut = (k) => (story?.flag ? story.flag(k) : memo[k]);
    if (data.tutorial?.length && !seenTut(tutKey)) {
      ui.$('.tk-text').textContent = tr(st.line);
      ui.$('.tk-speaker').textContent = tr(voice(st.line).name);
      await ui.coach(data.tutorial);
      for (const k of new Set([tutKey, 'talk.tutorial'])) { if (story?.flag) story.flag(k, true); else memo[k] = true; }
    }
    await sayThem(st.line);

    for (;;) {
      ui.busy = false;
      ui.hud(); ui.label(); ui.hand();
      const a = await new Promise((r) => { ui.resolve = r; });
      ui.busy = true;
      if (a.type === 'look') {
        const o = st.look();
        if (!o.ok) continue;
        call(game?.audio, 'play', 'sparkle');
        flash('.tk-calm', 'drop');
        ui.label(); ui.hud(); ui.hand();
        flash('.tk-label', 'inking');
        call(game?.maya, 'setFace', 'think', 2);
        ui.setMayaFace('think');
        await closeUp(voice(st.line).who ? story?.people?.get(voice(st.line).who) : e);
        continue;
      }
      if (a.type === 'item') {
        // a bag item: offered, not a turn
        const it = itemInfo(a.id, story?.save);
        const o = it && st.useItem(a.id, it.talk);
        if (!o?.ok) continue;
        if (it.talk.use === 'spend') story?.take?.(a.id, 1, { quiet: true });
        call(game?.audio, 'play', 'sparkle');
        ui.toast(T.used(tr(it.name)), 'good');
        if (o.calm) flash('.tk-calm', 'gain');
        if (o.steam) flash('.tk-steam', 'cool');
        if (o.preview) { ui.glass = true; await wait(500); ui.toast(T.glassOn, 'good'); }
        if (o.check) { await wait(500); ui.toast(T.checkOn, 'good'); }
        if (o.back) { await sayMaya(T.erased, 'shy', { hold: 600 }); }
        ui.hud(); ui.hand(); ui.label();
        if (o.steps) { call(p, 'emote', 'nod'); ui.placeToken(); }
        await wait(700);
        continue;
      }
      let out;
      if (a.type === 'play') {
        const card = st.card(a.id);
        const cardEl = ui.$(`.tk-card[data-id="${a.id}"]`);
        cardEl?.classList.add('said');
        ui.$('.tk-tell').textContent = ''; // the close look was about the line before; Maya has answered it
        const wasDown = st.faceDown();
        if (!wasDown) await sayMaya(card.line, 'smile', { hold: 500 });
        const before = new Set(st.hand);
        out = st.play(a.id);
        ui.glass = false; // the glass shows one card, then it is said
        if (out.result !== 'hot' && out.result !== 'lean') {
          // the said card is gone; the next one is dealt into its place
          ui.hand();
          ui.$$('.tk-card').forEach((c) => { if (!before.has(c.dataset.id) || c.dataset.id === a.id) c.classList.add('dealt'); });
        }
        if (out.result === 'lean' && data.leanEnd) { await leanThanks(card); return { won: false, turns: st.turn, stones: st.best, reason: 'lean' }; }
        await showPlay(out, card, cardEl);
      } else if (a.type === 'listen') {
        // Ask (from Day 9): Maya (or the helper) says the line's question first
        if (st.line?.ask) await sayMaya(st.line.ask, 'smile', { hold: 400 });
        out = st.listen();
        call(helperP || game?.maya, 'emote', 'nod');
        call(game?.audio, 'play', 'page');
        ui.hud();
        const askLabel = data.ask ?? ((story?.save?.day || 1) >= 9);
        ui.toast(out.heard ? T.heard : askLabel ? T.asked : T.listened, out.heard ? 'good' : '');
        flash('.tk-steam', 'cool');
        if (out.heard) { call(p, 'emote', 'nod'); call(game?.audio, 'play', 'chime'); }
        await wait(1100);
      } else if (a.type === 'breathe') {
        out = st.breathe();
        call(game?.audio, 'play', 'whoosh');
        ui.hud(); ui.hand();
        ui.toast({ my: `${tr(T.breathed)} · ${tr(T.newHand)}`, en: `${tr(T.breathed)} · ${tr(T.newHand)}` });
        flash('.tk-calm', 'gain');
        flash('.tk-hand', 'deal');
        ui.setMayaFace('smile');
        await wait(1000);
      } else if (a.type === 'stepBack') {
        const at = st.pos;
        out = st.stepBack();
        call(game?.audio, 'play', 'chime');
        ui.hud();
        await wait(700);
        const sb = data.stepBackLines?.[at];
        if (sb && !st.over) await sayThem({ face: 'think', ...sb }, { hold: 900 });
      }
      if (out?.shielded) ui.toast(T.shield, 'good');
      ui.hud();
      if (st.over) break;
      st.nextLine();
      ui.label(); ui.hand(); ui.hud();
      await sayThem(st.line);
    }

    // ---- ends
    ui.busy = true;
    ui.hud();
    if (st.over === 'won') {
      ui.$('.tk-path').classList.add('won');
      call(game?.audio, 'play', 'cheer');
      call(p, 'setMood', null);
      call(p, 'emote', 'cheer');
      const v = new THREE.Vector3();
      if (p && game?.fx) game.fx.burst('sparkle', p.headTop(v), { count: 14, spread: 0.5, up: 0.7 });
      ui.$('.tk-label').innerHTML = `<span class="ink">${ICON.quill}<i>${NEEDS.own.icon}</i>${tr(NEEDS.own)}</span>`;
      ui.$('.tk-tell').textContent = '';
      el(ui, '.tk-hand').classList.add('gone');
      for (const line of data.decision || []) await sayThem(line, { hold: 900 });
      call(game?.maya, 'setFace', 'happy', 4);
      ui.setMayaFace('happy');
      const quote = (data.decision || []).map((l) => `<q>${esc(tr(l))}</q>`).join('');
      await ui.end(`<div class="tk-seal">${NEEDS.own.icon}</div><h3>${esc(tr(T.won(tr(them))))}</h3>${quote}`, T.cont);
      return { won: true, turns: st.turn, stones: st.N, reason: st.reason };
    }
    call(game?.audio, 'play', 'page');
    call(p, 'setFace', 'think', 4);
    call(game?.maya, 'setFace', 'smile', 4);
    ui.setMayaFace('smile');
    const why = T.notyetWhy[st.reason] || T.notyetWhy.turns;
    await ui.end(`<h3 class="ny">${esc(tr(T.notyet))}</h3><p>${esc(tr(why))}</p><p class="keep">${esc(tr(st.best > 0 ? T.notyetKeep(tr(them), st.best, st.N) : T.notyetNone))}</p>`, T.okay);
    return { won: false, turns: st.turn, stones: st.best, reason: st.reason };

    // leanEnd 'thanks': a warm lean, no "not yet" panel; a faint pencil smudge on their signpost
    async function leanThanks(card) {
      call(game?.audio, 'play', 'chime');
      ui.$('.tk-path').classList.add('smudged');
      call(p, 'setMood', null);
      call(p, 'emote', 'nod');
      el(ui, '.tk-hand').classList.add('gone');
      await sayThem({ ...(card.leanLine || data.react?.lean || T.leanLine), face: 'happy' }, { hold: 1200 });
      call(game?.maya, 'setFace', 'smile', 4);
      ui.setMayaFace('smile');
      await wait(400);
    }

    async function showPlay(out, card, cardEl) {
      ui.hud();
      if (out.result === 'fit') {
        call(game?.audio, 'play', 'chime');
        ui.toast(out.steps > 1 ? T.fit2 : T.fit, 'good');
        call(p, 'emote', 'nod');
        call(p, 'setFace', 'think', 3);
        ui.setThemFace('think');
        await wait(1200);
      } else if (out.result === 'interrupt') {
        // a card turned up before its time: they were not done talking
        call(game?.audio, 'play', 'pop');
        ui.toast(out.shielded ? T.shield : T.interrupt, out.shielded ? 'good' : 'bad');
        flash('.tk-calm', 'drop');
        call(game?.maya, 'setFace', 'shy', 3);
        ui.setMayaFace('shy');
        await sayThem({ ...(data.react?.interrupt || data.react?.miss || T.missLine), face: 'worried' }, { hold: 600 });
      } else if (out.result === 'miss') {
        call(game?.audio, 'play', 'pop');
        ui.toast(out.shielded ? T.shield : T.miss, out.shielded ? 'good' : 'bad');
        ui.$('.tk-calm').classList.add('drop');
        call(game?.maya, 'setFace', 'think', 3);
        ui.setMayaFace('think');
        await sayThem({ face: 'think', ...(card.miss || data.react?.miss || T.missLine) }, { hold: 500 });
      } else if (out.result === 'backfire') {
        call(game?.audio, 'play', 'pop');
        ui.toast(T.backfire, 'bad');
        flash('.tk-calm', 'drop');
        flash('.tk-steam', 'heat');
        call(p, 'emote', out.from > st.pos ? 'slump' : 'shrug');
        await sayThem({ ...(card.backfire?.they || T.missLine), face: 'sad', mood: 'down' }, { hold: 600 });
        if (card.backfire?.maya) await sayMaya(card.backfire.maya, 'surprised', { hold: 900 });
      } else if (out.result === 'hot') {
        call(game?.audio, 'play', 'pop');
        cardEl?.classList.remove('said');
        cardEl?.classList.add('bounce');
        ui.toast(T.hot, 'hot');
        flash('.tk-steam', 'heat');
        await sayThem({ ...(data.react?.hot || T.hotLine), face: 'hot' }, { hold: 700 });
      } else if (out.result === 'lean') {
        call(game?.audio, 'play', 'pop');
        ui.toast(T.leanT, 'bad');
        await sayThem({ ...(card.leanLine || data.react?.lean || T.leanLine), face: 'worried' }, { hold: 900 });
      }
    }
  }


  return api;
}

const el = (ui, s) => ui.$(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function injectStyle() {
  if (document.getElementById('rc-talk-style')) return;
  const s = document.createElement('style');
  s.id = 'rc-talk-style';
  s.textContent = `
  #game.rc-talk #letterbox, #game.rc-talk #topbar, #game.rc-talk #dock, #game.rc-talk #joystick, #game.rc-talk #tip, #game.rc-talk #bark, #game.rc-talk .story-round { opacity: 0 !important; pointer-events: none !important; }
  #rc-talk { --cream: #F6F0E2; --paper: #FFFDF8; --gold: #C9A24A; --gold-d: #A47A2C; --ink: #2A2118; --maroon: #6E1F2A; --wood: #8C6A28; --pencil: #8A847C;
    position: absolute; inset: 0; z-index: 37; pointer-events: none; font: 15px/1.65 "Noto Sans Myanmar", system-ui, sans-serif; color: var(--ink);
    animation: tkIn .3s ease; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
  #rc-talk.out { opacity: 0; transition: opacity .25s; }
  @keyframes tkIn { from { opacity: 0; } }
  #rc-talk > * { pointer-events: auto; }
  #rc-talk .tk-toast { pointer-events: none; }
  #rc-talk .tk-coach[hidden], #rc-talk .tk-end[hidden], #rc-talk .tk-items[hidden], #rc-talk .tk-bagbtn[hidden] { display: none !important; }
  #rc-talk svg { display: block; }
  #rc-talk i > svg, #rc-talk .post > svg, #rc-talk .tk-seal > svg, #rc-talk .tk-lang > svg { width: 100%; height: 100%; }
  #rc-talk button { font: inherit; color: inherit; -webkit-tap-highlight-color: transparent; }

  /* top: the two of them, the steam, the calm, the stones */
  .tk-hud { position: absolute; left: 0; right: 0; top: 0; padding: calc(8px + env(safe-area-inset-top)) 10px 0;
    background: linear-gradient(rgba(246,240,226,.97) 70%, rgba(246,240,226,0)); }
  .tk-row { display: flex; align-items: center; gap: 6px; }
  .tk-who { display: flex; align-items: center; gap: 8px; flex: 1 1 0; min-width: 0; }
  .tk-who.maya { justify-content: flex-end; text-align: right; }
  .tk-face { width: 58px; height: 58px; border-radius: 16px; border: 3px solid var(--gold-d); background: var(--paper); flex: none; box-shadow: 0 3px 0 var(--wood); }
  .tk-who.maya .tk-face { border-color: var(--maroon); box-shadow: 0 3px 0 #4A1520; }
  .tk-meta { min-width: 0; }
  .tk-name { display: block; font-size: 16px; line-height: 1.5; color: var(--maroon); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tk-steam { display: flex; align-items: center; gap: 4px; }
  .tk-steam small, .tk-calm small { font-size: 12.5px; color: #6A5A48; line-height: 1.4; white-space: nowrap; }
  .tk-mug { width: 30px !important; height: 34px !important; flex: none; overflow: visible; }
  .tk-mug .body { fill: var(--paper); stroke: var(--ink); stroke-width: 1.8; }
  .tk-mug .handle { fill: none; stroke: var(--ink); stroke-width: 1.8; }
  .tk-mug .band { stroke: var(--gold); stroke-width: 2; }
  .tk-mug .w { fill: none; stroke: #9A8E7A; stroke-width: 2; stroke-linecap: round; opacity: .14; transition: opacity .4s, stroke .4s; }
  .tk-mug .w.on { opacity: 1; animation: tkWisp 1.8s ease-in-out infinite; }
  .tk-mug .w1.on { animation-delay: -.4s; } .tk-mug .w2.on { animation-delay: -.9s; } .tk-mug .w3.on { animation-delay: -1.3s; } .tk-mug .w4.on { animation-delay: -.6s; }
  @keyframes tkWisp { 50% { transform: translateY(-1.6px); } }
  .tk-steam.hot .w.on { stroke: #B24A3A; }
  .tk-steam.hot small { color: #9A2E2A; font-weight: 700; }
  .tk-steam.hot .tk-mug { animation: tkJig .5s ease-in-out infinite; }
  @keyframes tkJig { 25% { transform: rotate(-4deg); } 75% { transform: rotate(4deg); } }
  .tk-steam.heat { animation: tkPop .5s; } .tk-steam.cool { animation: tkPop .5s reverse; }
  .tk-calm { display: flex; flex-direction: column; align-items: flex-end; }
  .tk-calm .dots { display: flex; gap: 5px; padding: 3px 0 1px; }
  .tk-calm .dots i { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--gold-d); background: transparent; transition: background .3s, transform .3s; }
  .tk-calm .dots i.on { background: radial-gradient(circle at 35% 35%, #F3D27A, var(--gold) 60%, var(--gold-d)); }
  .tk-calm.drop .dots { animation: tkShake .45s; } .tk-calm.gain .dots { animation: tkPop .5s; }
  @keyframes tkShake { 20%, 60% { transform: translateX(-4px); } 40%, 80% { transform: translateX(4px); } }
  @keyframes tkPop { 40% { transform: scale(1.18); } }
  .tk-mid { display: flex; flex-direction: column; align-items: center; gap: 2px; flex: none; }
  .tk-turns { font-size: 12.5px; color: var(--wood); font-weight: 700; white-space: nowrap; }
  .tk-lang { width: 28px; height: 28px; padding: 5px; border-radius: 50%; border: 2px solid #D9C9A3; background: var(--paper); color: var(--wood); }

  .tk-path { position: relative; margin: 6px 4px 0; height: 52px; }
  .tk-track { position: absolute; left: 0; right: 0; top: 18px; display: flex; align-items: center; justify-content: space-between; padding: 0 6px; }
  .tk-track::before { content: ""; position: absolute; left: 22px; right: 22px; top: 50%; border-top: 2px dashed #D3C4A0; }
  .tk-track i { position: relative; flex: none; }
  .tk-track .stone.last { margin-right: 22px; }
  .tk-track .start { width: 30px; height: 14px; border-radius: 50%; background: #CFE0B8; border: 2px solid #8FAE76; }
  .tk-track .stone { width: 34px; height: 18px; border-radius: 50% 50% 46% 54%; background: #E5DCCB; border: 2px solid #9C8F78; box-shadow: inset 0 -4px 0 rgba(0,0,0,.08); transition: background .4s, border-color .4s; }
  .tk-track .stone.passed { background: #F1DD9E; border-color: var(--gold-d); }
  .tk-track .stone.theirs { border-style: dashed; border-color: var(--maroon); background: #F4E3E1; }
  .tk-track .post { position: absolute; left: 62%; bottom: 6px; width: 34px; height: 34px; color: var(--maroon); z-index: 3; }
  .tk-path.won .post { color: var(--gold-d); filter: drop-shadow(0 0 6px #F3D27A); animation: tkPop .6s 2; }
  .tk-path.smudged .post { color: var(--pencil); opacity: .75; }
  .tk-path.smudged .stone.last::after { content: ""; position: absolute; left: 2px; right: -14px; top: -26px; height: 10px; border-radius: 6px; background: rgba(138,132,124,.4); transform: rotate(-14deg); }
  .tk-token { position: absolute; z-index: 2; left: 0; top: -2px; width: 36px; height: 36px; border-radius: 50%; overflow: hidden; border: 2.5px solid var(--gold-d); background: var(--paper);
    box-shadow: 0 3px 6px rgba(59,42,26,.3); transition: transform .7s cubic-bezier(.3,1.5,.5,1); }
  .tk-token canvas { width: 100%; height: 100%; display: block; }

  .tk-toast { position: absolute; left: 50%; top: calc(126px + env(safe-area-inset-top)); transform: translate(-50%, 10px); white-space: nowrap; opacity: 0; transition: opacity .25s, transform .25s; max-width: 86vw; text-align: center;
    background: var(--paper); border: 2px solid var(--gold); border-radius: 999px; padding: 6px 18px; font-weight: 700; font-size: 16px; box-shadow: 0 6px 18px rgba(59,42,26,.22); overflow: hidden; text-overflow: ellipsis; }
  .tk-toast.show { opacity: 1; transform: translate(-50%, 0); }
  .tk-toast.good { color: #7A5A12; border-color: var(--gold-d); background: #FFF6D8; }
  .tk-toast.bad { color: var(--maroon); border-color: #C98A8A; }
  .tk-toast.hot { color: #9A2E2A; border-color: #D98A7A; background: #FBEDE6; }

  /* bottom: their line, Maya's hand, the three things she can do */
  .tk-bottom { position: absolute; left: 0; right: 0; bottom: 0; padding: 0 0 calc(10px + env(safe-area-inset-bottom));
    background: linear-gradient(rgba(246,240,226,0), rgba(246,240,226,.96) 26px); display: flex; flex-direction: column; gap: 8px; padding-top: 24px; }
  .tk-line { margin: 0 12px; background: var(--paper); border: 2px solid #E2D5B8; border-radius: 18px; padding: 8px 14px 9px; box-shadow: 0 4px 0 #E2D5B8; position: relative; min-height: 98px; }
  .tk-label { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; min-height: 26px; font-size: 14px; }
  .tk-label > span { display: inline-flex; align-items: center; gap: 4px; line-height: 1.5; }
  .tk-label > span > svg { width: 16px; height: 16px; flex: none; }
  .tk-label i { width: 20px; height: 20px; display: inline-block; }
  .tk-label .pencil { color: var(--pencil); border-bottom: 1.5px dashed #B5AFA6; padding-bottom: 1px; }
  .tk-label .pencil.wrong { text-decoration: line-through; text-decoration-thickness: 2px; opacity: .7; }
  .tk-label .hottag { margin-left: auto; color: #9A2E2A; font-weight: 700; font-size: 13px; background: #FBEDE6; border-radius: 999px; padding: 0 9px; }
  .tk-label .ink { color: #8C6414; font-weight: 700; background: linear-gradient(transparent 60%, #F7E3A4 60%); padding: 0 4px; border-radius: 3px; }
  .tk-label.inking .ink { animation: tkInk .7s ease-out; }
  @keyframes tkInk { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
  .tk-say { display: flex; gap: 8px; align-items: baseline; }
  .tk-speaker { flex: none; font-size: 13.5px; color: var(--maroon); }
  .tk-say.maya .tk-speaker { color: var(--gold-d); }
  .tk-text { margin: 0; font-size: 17px; line-height: 1.7; min-height: 29px; }
  .tk-say.maya .tk-text { color: #4A3A28; }
  .tk-tell { margin: 2px 0 0; font-size: 14px; line-height: 1.6; color: #7A5A12; }
  .tk-tell:empty { display: none; }

  .tk-hand { display: flex; gap: 8px; overflow-x: auto; overflow-y: visible; padding: 12px 12px 4px; scroll-snap-type: x mandatory; scrollbar-width: none; scroll-padding: 0 12px; }
  .tk-hand::-webkit-scrollbar { display: none; }
  .tk-hand.few { justify-content: center; }
  .tk-hand.gone { visibility: hidden; }
  .tk-hand.deal .tk-card, .tk-card.dealt { animation: tkDeal .45s ease both; }
  .tk-card.dealt { animation-delay: .35s; }
  @keyframes tkDeal { from { transform: translateY(30px); opacity: 0; } }
  .tk-card { flex: 0 0 calc((100% - 24px - 16px) / 3.15); scroll-snap-align: start; min-height: 168px; display: flex; flex-direction: column; align-items: stretch; gap: 3px; text-align: left;
    background: var(--paper); border: 2px solid #D9C9A3; border-radius: 16px; padding: 8px 9px 9px; box-shadow: 0 4px 0 #D9C9A3; position: relative; transition: transform .18s, box-shadow .18s, opacity .25s; cursor: pointer; }
  .tk-hand.few .tk-card { flex-basis: calc((100% - 24px - 16px) / 3); max-width: 150px; }
  .tk-card .icons { display: flex; gap: 4px; height: 26px; }
  .tk-card .icons i { width: 26px; height: 26px; color: var(--wood); }
  .tk-card b { font-size: 16px; line-height: 1.55; color: var(--maroon); }
  .tk-card .cl { font-size: 14.5px; line-height: 1.6; color: #4A3A28; }
  .tk-card em { font-style: normal; }
  .tk-card .go { display: none; margin-top: auto; align-self: stretch; text-align: center; background: var(--maroon); color: var(--paper); border-radius: 10px; font-size: 14px; font-weight: 700; padding: 3px 0; }
  .tk-card .really { display: none; font-size: 13px; line-height: 1.5; color: var(--pencil); }
  .tk-card .peek { display: none; font-size: 13px; line-height: 1.55; color: #2F5F7A; background: #E6F0F5; border-radius: 8px; padding: 2px 6px; }
  .tk-card.peeking .peek { display: block; }
  .tk-card.sel { transform: translateY(-10px); border-color: var(--gold-d); box-shadow: 0 8px 0 var(--gold), 0 12px 20px rgba(59,42,26,.25); }
  .tk-card.sel .go { display: block; }
  .tk-card.gold { border-color: var(--gold); background: linear-gradient(160deg, #FFF8E4, var(--paper) 55%); }
  .tk-card.gold b::after { content: " ✦"; color: var(--gold); }
  .tk-card.pencil { border-style: dashed; border-color: #B5AFA6; box-shadow: 0 4px 0 #D8D3CB; }
  .tk-card.pencil b, .tk-card.pencil .cl { color: #6A655E; }
  .tk-card.fit { border-color: var(--gold-d); box-shadow: 0 4px 0 var(--gold), 0 0 14px rgba(217,169,59,.55); }
  .tk-card.fit .icons i { color: #B8861C; }
  .tk-card.nofit { opacity: .6; }
  .tk-card.hollow { background: repeating-linear-gradient(-35deg, var(--paper) 0 7px, #F0ECE4 7px 8px); }
  .tk-card.hollow .icons i { color: var(--pencil); position: relative; }
  .tk-card.hollow .icons i::after { content: ""; position: absolute; left: -2px; right: -2px; top: 50%; border-top: 2px solid var(--pencil); transform: rotate(-30deg); }
  .tk-card.hollow .really { display: block; }
  .tk-card.down { background: repeating-linear-gradient(45deg, #8A2E3A 0 6px, #7A2533 6px 12px); border-color: #4A1520; box-shadow: 0 4px 0 #4A1520; }
  .tk-card.down .icons { visibility: hidden; }
  .tk-card.down .cl { margin: auto 0; text-align: center; color: #F1DD9E; font-weight: 700; font-size: 13px; }
  .tk-card.down b::after { content: none; }
  .tk-card.said { transform: translateY(-34px) scale(.96); opacity: 0; }
  .tk-card.bounce { animation: tkBounce .6s; }
  @keyframes tkBounce { 30% { transform: translateY(-26px); } 55% { transform: translateY(4px) rotate(-3deg); } 75% { transform: translateY(-4px) rotate(2deg); } }
  #rc-talk.hot .tk-card:not(.sel) { filter: saturate(.6); }
  #rc-talk.hot .tk-line { border-color: #E8B4A6; box-shadow: 0 4px 0 #E8B4A6; }

  .tk-acts { display: flex; gap: 8px; padding: 0 12px; }
  .tk-acts button { flex: 1 1 0; min-width: 0; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 7px 4px; border-radius: 14px; border: 2px solid var(--gold-d);
    background: var(--paper); box-shadow: 0 3px 0 var(--wood); min-height: 54px; position: relative; overflow: hidden; }
  .tk-acts button:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--wood); }
  .tk-acts button i { width: 22px; height: 22px; flex: none; color: var(--maroon); }
  .tk-acts button span { display: flex; flex-direction: column; text-align: left; min-width: 0; }
  .tk-acts button b { font-size: 14.5px; line-height: 1.75; white-space: nowrap; }
  .tk-acts button small { font-size: 11.5px; line-height: 1.5; color: #6A5A48; white-space: nowrap; }
  .tk-acts button:disabled { opacity: .45; box-shadow: none; }
  .tk-acts [data-act="look"] { border-color: var(--gold); background: #FFF8E4; }
  .tk-acts .tk-hold { display: none; }
  .tk-acts .tk-bagbtn { flex: 0 0 46px; padding: 0; }
  .tk-acts .tk-bagbtn i { width: 24px; height: 24px; color: var(--wood); }
  .tk-acts .tk-bagbtn.spent { opacity: .45; }
  #rc-talk.theirs .tk-acts [data-act="listen"], #rc-talk.theirs .tk-acts [data-act="breathe"] { display: none; }
  #rc-talk.theirs .tk-acts .tk-hold { display: flex; flex: 2 1 0; border-color: var(--maroon); background: #F8ECEA; touch-action: none; }
  .tk-hold .fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(110,31,42,.16); }
  .tk-hold.holding .fill { width: 100%; transition: width var(--hold, 1.6s) linear; }
  .tk-hold > * { position: relative; }
  #rc-talk.theirs .tk-hand { opacity: .9; }

  /* bag items offered in a talk */
  .tk-items { margin: 0 12px; background: var(--paper); border: 2px solid var(--gold); border-radius: 16px; padding: 6px 8px 8px; box-shadow: 0 6px 18px rgba(59,42,26,.2); animation: tkIn .2s; }
  .tk-items-hint { margin: 0 4px 4px; font-size: 12.5px; color: #6A5A48; }
  .tk-chips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
  .tk-chip { flex: 0 0 auto; max-width: 62%; display: flex; gap: 6px; align-items: center; text-align: left; border: 1.5px solid #D9C9A3; border-radius: 12px; background: #FFFDF8; padding: 5px 9px 5px 6px; }
  .tk-chip .ico { width: 30px; height: 30px; flex: none; }
  .tk-chip span { display: flex; flex-direction: column; min-width: 0; }
  .tk-chip b { font-size: 13.5px; line-height: 1.55; color: var(--maroon); white-space: nowrap; }
  .tk-chip small { font-size: 11.5px; line-height: 1.5; color: #6A5A48; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tk-chip.off { opacity: .5; } .tk-chip.ban .ico { filter: grayscale(1); }

  /* first-talk coach */
  .tk-coach { position: absolute; inset: 0; background: rgba(42,33,24,.32); }
  .tk-coach-card { position: absolute; left: 14px; right: 14px; background: var(--paper); border: 3px solid var(--gold); border-radius: 18px; padding: 12px 16px; box-shadow: 0 10px 28px rgba(42,33,24,.35);
    display: flex; flex-direction: column; gap: 8px; animation: tkIn .25s; }
  .tk-coach-card p { margin: 0; font-size: 16px; line-height: 1.75; }
  .tk-coach-card button { align-self: flex-end; border: 0; border-radius: 999px; background: var(--maroon); color: var(--paper); font-weight: 700; padding: 6px 18px; font-size: 15px; }
  .tk-focus { position: relative; z-index: 2; box-shadow: 0 0 0 4px #F3D27A, 0 0 22px 6px rgba(243,210,122,.9) !important; border-radius: 14px; background-color: rgba(255,253,248,.92); }

  /* ends */
  .tk-end { position: absolute; inset: 0; display: flex; align-items: flex-end; justify-content: center; background: linear-gradient(rgba(42,33,24,0) 35%, rgba(42,33,24,.3)); padding: 20px 16px calc(24px + env(safe-area-inset-bottom)); }
  .tk-end-card { width: min(100%, 360px); background: var(--cream); border: 3px solid var(--gold); border-radius: 22px; padding: 18px 18px 16px; text-align: center; box-shadow: 0 14px 34px rgba(42,33,24,.35);
    display: flex; flex-direction: column; align-items: center; gap: 8px; animation: tkIn .3s; }
  .tk-end-card h3 { margin: 0; font-size: 20px; line-height: 1.6; color: var(--maroon); }
  .tk-end-card h3.ny { font-size: 26px; }
  .tk-end-card p { margin: 0; font-size: 15px; line-height: 1.7; }
  .tk-end-card p.keep { color: #6A5A48; }
  .tk-end-card button { margin-top: 6px; border: 2px solid var(--gold-d); border-radius: 999px; background: var(--paper); color: var(--maroon); font-weight: 700; font-size: 16px; padding: 8px 28px; box-shadow: 0 3px 0 var(--wood); }
  .tk-end-card q { display: block; font-size: 15.5px; line-height: 1.7; color: #4A3A28; quotes: "“" "”"; }
  #rc-talk.over .tk-acts, #rc-talk.over .tk-hand, #rc-talk.over .tk-items { visibility: hidden; }
  #rc-talk.ended .tk-line { opacity: 0; transition: opacity .25s; }
  .tk-seal { width: 64px; height: 64px; border-radius: 50%; border: 4px double var(--gold-d); color: var(--gold-d); padding: 12px; background: #FFF8E4; transform: rotate(-8deg); }
  @media (min-width: 700px) { .tk-bottom, .tk-hud { left: 50%; right: auto; width: 480px; transform: translateX(-50%); } }
  `;
  document.head.appendChild(s);
}
