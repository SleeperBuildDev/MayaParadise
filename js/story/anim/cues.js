// DATA: which gesture a spoken line gets (js/story/anim). Nothing here is ever shown on screen, so these words need no
// proofreading; they only have to be safe to search for. Pure: node can import this file (tools/anim-cues.mjs).
//
//   cue(line, i = 0, seed = 0) -> clip name     i: the line's index in its scene (varies the default)
//   cueCount(line) -> 1..5 | 0                   a number said in the line (the count gesture's taps)
//
// Order (first hit wins): line.anim, line.emote, strong words (English + Burmese), the line's face tag,
// punctuation (a question, an exclamation, a trailing ellipsis), a number, then the explaining moves in turn.
//
// Burmese words NOT used (they hide inside other words, or are only polite): ရှင် / ခင်ဗျာ (polite particles,
// not "yes"), လေး (little / four), နှစ် (two / year), ငါး (five / fish), bare ငါ (inside ငါး), bare ပူ (hot
// weather, not worry), bare မ (the negative prefix is in half the language).

// people.js emote names -> the clips that look the same
export const EMOTE_CLIP = { wave: 'waveHi', nod: 'nod', bow: 'greet', cheer: 'cheer', shrug: 'shrug', think: 'thinkChin', slump: 'sad', fists: 'insist', point: 'point' };
// the line's face tag -> a clip
export const FACE_CLIP = { think: 'thinkChin', sad: 'sad', worried: 'worry', hot: 'angry', happy: 'explainBoth', surprised: 'surprised', shy: 'giggle' };

// [kind, English regex (word boundaries, any case), Burmese substrings, clip]
const RULES = [
  ['greet', /\b(hello|hi|hey there|good (morning|evening|afternoon)|mingalaba)\b/i, ['မင်္ဂလာပါ', 'နေကောင်းလား'], 'waveHi'],
  ['bye', /\b(bye|goodbye|see you|off i go|take care)\b/i, ['သွားတော့မယ်', 'နောက်မှတွေ့', 'တာ့တာ', 'သွားပြီနော်'], 'waveBye'],
  ['thanks', /\b(thank|thanks|grateful)\b/i, ['ကျေးဇူး'], 'thanks'],
  ['sorry', /\b(sorry|apolog\w*|forgive|my fault)\b/i, ['တောင်းပန်', 'ဆောရီး', 'စိတ်မရှိပါနဲ့', 'အပြစ်ပါ'], 'sorry'],
  ['laugh', /\b(ha ?ha\w*|hehe\w*|funny|joke|laugh\w*)\b/i, ['ဟားဟား', 'ဟဲဟဲ', 'ခစ်ခစ်', 'ရယ်ရ', 'ရယ်စရာ'], 'laugh'],
  ['angry', /\b(angry|fed up|furious|enough!)/i, ['စိတ်ဆိုး', 'ဒေါသ'], 'angry'],
  ['worry', /\b(worr\w*|afraid|scared|nervous|frighten\w*)\b/i, ['စိတ်ပူ', 'စိုးရိမ်', 'ကြောက်'], 'worry'],
  ['wow', /\b(wow|whoa|really\?|oh!|what\?!)/i, ['ဟယ်', 'အမလေး', 'ဝိုး', 'တကယ်လား'], 'surprised'],
  ['no', /^(no\b|nope\b)|\b(not at all|no way|never)\b/i, ['မဟုတ်ဘူး', 'မဟုတ်ပါဘူး', 'မရဘူး', 'မရပါဘူး', 'ဟင့်အင်း', 'မလုပ်နဲ့'], 'shake'],
  ['yes', /^(yes|yeah|yep|of course|sure|right)\b/i, ['ဟုတ်ကဲ့', 'ဟုတ်တယ်', 'ဟုတ်ပါတယ်', 'ရပါတယ်'], 'nod'],
  ['show', /\b(look at this|here it is|this one|see this)\b/i, ['ဒီမှာကြည့်', 'ဒါလေးကြည့်'], 'showItem'],
  ['money', /\b(kyats?|price|costs?|cheap|pay|paid|money)\b/i, ['ကျပ်', 'ဈေးနှုန်း', 'ပိုက်ဆံ', 'ဈေးကြီးတယ်', 'ဈေးကြီးလွန်း', 'ဈေးပေါ'], 'count'],
  ['me', /^(i\b|i'm\b|me\b|myself\b)|\b(my own)\b/i, [], 'pointSelf'],
  ['look', /\b(look over there|see that|over there)\b/i, ['ဟိုမှာ', 'ဟိုဘက်ကြည့်'], 'point'],
];
// "me" in Burmese only at the very start of a line (the speaker is about to talk about themselves)
const MY_ME = ['ကျွန်တော်', 'ကျွန်မ', 'ကျွန်တော့်'];
const MY_QUESTION_END = /(လား|လဲ|သလဲ|မလား|နော်)[\s။?!.…]*$/;
const NUM_WORDS = { two: 2, three: 3, four: 4, five: 5, six: 5, seven: 5, eight: 5, nine: 5, ten: 5 };
const NUM_EN = /\b(?<!\ban? )(two|three|four|five|six|seven|eight|nine|ten)\b/i; // ("a nine" is a mark, not a count)
const DIGITS = /[0-9၀-၉]+/;
const DEFAULTS = ['explain', 'explainBoth', 'beat', 'explain', 'handsHips', 'beat', 'explainBoth', 'explain'];

const text = (line, k) => (line && typeof line[k] === 'string' ? line[k] : '');

/** The kind of a line by its words alone ('greet', 'bye', ...) or ''. */
// a feeling word that is denied or only asked about does not get its gesture ("I'm not angry any more", "who do we thank?")
const NEG_KINDS = new Set(['angry', 'worry', 'laugh']);
const NEG = /\b(not|n't|no|never|without|nor|stopped being)\b[^.!?]*$/i;
export function cueKind(line) {
  const en = text(line, 'en').trim(), my = text(line, 'my');
  const asks = /\?["')]*$/.test(en);
  for (const [kind, re, words] of RULES) {
    const m = en ? re.exec(en) : null;
    if (m && !(NEG_KINDS.has(kind) && NEG.test(en.slice(Math.max(0, m.index - 24), m.index))) && !(kind === 'thanks' && asks)) return kind;
    for (const w of words) if (my.includes(w)) return kind;
  }
  for (const w of MY_ME) if (my.startsWith(w)) return 'me';
  return '';
}
const KIND_CLIP = Object.fromEntries(RULES.map((r) => [r[0], r[3]]));
KIND_CLIP.me = 'pointSelf';

/** A number said in the line, 1..5 (more is counted as 5), or 0. */
export function cueCount(line) {
  const en = text(line, 'en'), my = text(line, 'my');
  const d = en.match(DIGITS) || my.match(DIGITS);
  if (d) {
    const s = d[0].replace(/[၀-၉]/g, (c) => String(c.charCodeAt(0) - 0x1040));
    const n = parseInt(s, 10);
    if (n > 0 && n < 1000) return Math.min(5, n);
  }
  const w = en.match(NUM_EN);
  return w ? NUM_WORDS[w[1].toLowerCase()] : 0;
}

/** The clip for a line. Never throws (a string line or an empty object get a default). */
export function cue(line, i = 0, seed = 0) {
  if (typeof line === 'string') line = { en: line };
  if (!line || typeof line !== 'object') return DEFAULTS[i % DEFAULTS.length];
  if (line.anim) return typeof line.anim === 'string' ? line.anim : line.anim.name || 'explain';
  if (line.emote && EMOTE_CLIP[line.emote]) return EMOTE_CLIP[line.emote];
  const kind = cueKind(line);
  if (kind) return kind === 'money' && !cueCount(line) ? 'explainBoth' : KIND_CLIP[kind];
  if (line.face === 'happy') return (Math.floor(seed * 3) + i) % 3 === 2 ? 'proud' : 'explainBoth';
  if (line.face && FACE_CLIP[line.face]) return FACE_CLIP[line.face];
  const en = text(line, 'en').trim(), my = text(line, 'my').trim();
  const q = /\?["')]*$/.test(en) || MY_QUESTION_END.test(my) || /\?$/.test(my);
  const pick = (Math.floor(seed * 7) + i) % 10;
  if (q) return pick < 6 ? 'shrug' : 'thinkChin';
  if (/!["')]*$/.test(en) || /!$/.test(my)) return pick < 4 ? 'explainBoth' : pick < 8 ? 'explain' : 'proud';
  if (/(\.\.\.|…)["')]*$/.test(en) || /(\.\.\.|…)$/.test(my)) return 'thinkChin';
  if (cueCount(line)) return 'count';
  return DEFAULTS[(Math.floor(seed * 5) + i) % DEFAULTS.length];
}

/** What the one who hears a line does while it types: a head-only listen, or a small answer. */
export function listenerCue(clip) {
  switch (clip) {
    case 'laugh': case 'giggle': return 'giggle';
    case 'sad': case 'sorry': return 'sorryBack';
    case 'shrug': case 'thinkChin': return 'thinkLate';
    case 'surprised': return 'leanBack';
    case 'waveHi': case 'greet': return 'greet';
    case 'waveBye': return 'waveBye';
    case 'thanks': return 'nod';
    default: return 'listen';
  }
}
