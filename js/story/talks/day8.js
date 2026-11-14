// Day 8's two talks (day8-spec 6.4 and 7.5). Format: see the top of js/story/talk.js.
// Both are the first talks with a stone that is theirs (`stepBack: true`): no card fits the last stone;
// Maya holds Step back and they decide. Every Burmese line is a draft for Maya to proofread.
//
//   TALK_D8_THIDA   Ma Thida, in her letter room (room `letterroom`), Moe Moe in the doorway with her empty pot.
//                   ch 12 (p67-68): not because "Maya says"; understand it yourself, good for all.
//   TALK_D8_TINT    U Tint at the imposing stone (room `press`), Ko Wunna waiting on the door bench.
//                   ch 13 (p69-73): one deed, a 6 and a 9; knowing and goodwill held together.
//
// Cards only come into the hand once earned (flag expressions, save.js testFlags):
//   sixside: d8.turned · asked: d8.asked · title: d8.look.title · proofsays: bag:proof:mayasays ·
//   proofwell: d8.wellSeen · the five questions (self, all, blameless, good, wise): d8.sorted.
// Unchecked rumours sit in the hand as pencil look-alikes (review): `grump` until rumour `printer` is checked.

// ---------------------------------------------------------------------------------------------
// U Tint (ch 13)
// ---------------------------------------------------------------------------------------------
export const D8_TINT_CARDS = [
  { id: 'cool', name: { my: 'အေးအေးဆေးဆေး', en: 'Cool first' }, // Cool Cloud (ch 7)
    line: { my: 'အလျင်မလိုပါဘူး ဦး။ ရေနွေးကြမ်း တစ်ခွက် သောက်ပြီးမှ ပြောကြတာပေါ့။', en: "No hurry, U Tint. A cup of tea first, then we'll talk." },
    answers: ['hot'], from: { my: 'တိမ်အေးလေး', en: 'the Cool Cloud' } },
  { id: 'sixside', name: { my: 'သူ့ဘက်က ကြည့်ရင်', en: 'From his side' }, onlyIf: 'd8.turned',
    line: { my: 'ဒီတုံးကို ကိုဝဏ္ဏဘက်က ကြည့်ရင် ညီညီညာညာ စီထားတာ။ သူ့အတွက်တော့ ကူညီတာပါ။', en: "Seen from Ko Wunna's side this block stands straight and even. To him it was help." },
    answers: ['unknown'], from: { my: 'စာလုံးတုံးကို လှည့်ကြည့်ပြီး ရခဲ့တာ', en: 'from turning the block' } },
  { id: 'why', name: { my: 'ဘာကြောင့်လဲ', en: 'Why?' }, // Why-Parrot (ch 3): a new question every time
    line: { my: 'သူ ဘာကြောင့် အဲဒီလို လုပ်တယ်လို့ ဦး ထင်လဲ။ သူ့ကို မေးကြည့်ဖူးလား။', en: 'Why do you think he did it? Have you asked him?' },
    answers: ['unknown'], from: { my: 'ဘာကြောင့်ကြက်တူရွေး', en: 'the Why-Parrot' } },
  { id: 'road', name: { my: 'လမ်းပြပေး', en: 'Show the road' }, // Firefly (ch 9)
    // LESSON (p71 point two): knowledge does good only when goodwill carries it to someone
    line: { my: 'ဦး သိတာတွေ ကောင်လေးဆီ ရောက်မှ အကျိုးရှိမှာ။ လမ်းပြပေးနိုင်တာ ဦးပဲ ရှိတယ်။', en: 'What you know only does good once it reaches the boy. Only you can show him the way.' },
    answers: ['looksdown'], from: { my: 'ပိုးစုန်းကြူး', en: 'the Firefly' } },
  { id: 'asked', name: { my: 'သူ မေးဖို့ အသင့်', en: "He's ready to ask" }, onlyIf: 'd8.asked',
    line: { my: 'ကိုဝဏ္ဏက အံဆွဲနာမည်တွေ ကိုယ်တိုင် ဖတ်ပြီးပြီ။ မသိတာကို စက်ရပ်မှ ရှင်းရှင်း မေးမယ်တဲ့။', en: "Ko Wunna has read the drawer names himself. He'll ask the rest clearly, when the press stops." },
    answers: ['looksdown'], from: { my: 'ကိုဝဏ္ဏ ရေးထားတာ', en: "from Ko Wunna's drafts" } },
  { id: 'title', name: { my: 'နာမည်တုံး', en: 'The title block' }, onlyIf: 'd8.look.title',
    line: { my: 'မပျောက်ပါဘူး ဦး။ ဒီမှာ။ ပြောင်းပြန်စာလုံးတွေ ဖတ်တတ်တဲ့သူ မရှိလို့ပဲ။', en: "It isn't lost, U Tint. Here. Nobody could read backwards letters, that's all." },
    answers: ['given'], from: { my: 'အမှိုက်ပုံးထဲက ရှာတွေ့ခဲ့တာ', en: 'found in the scrap crate' } },
  { id: 'once', name: { my: 'နောက်တစ်ခါ', en: 'Once more' }, // Black Sheep (ch 1), gold by now
    line: { my: 'စာလုံးတွေ နောက်တစ်ခါ စီလို့ရပါတယ်။ အခါခါ စီဖူးတာပဲ။', en: "The letters can be set once more. You've set them a thousand times." },
    answers: ['given'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'blame', lookalike: true, name: { my: 'ဦး့အပြစ်ပဲ', en: 'Your own fault' },
    line: { my: 'ဦး ရှင်းရှင်း မပြောခဲ့လို့ ဖြစ်တာပဲလေ။', en: "It happened because you didn't tell him clearly." },
    shows: ['looksdown'], really: { my: 'အပြစ်ရှာတာ', en: 'finding fault' },
    backfire: { they: { my: 'ငါ့အပြစ်? ငါ့တိုက်ထဲမှာ ငါ့အပြစ်?', en: 'MY fault? In my own shed?' },
                maya: { my: '(ပြင်ချင်လို့ ပြောတာ… သူ့ဘက်က ကြားရတာ တရားခံရှာသလိုပဲ။)', en: '(I meant to fix it… from his side it sounded like blame.)' } } },
];
// only while rumour `printer` is unchecked (an unchecked rumour sits in the hand as a pencil look-alike)
export const D8_TINT_RUMOUR = { id: 'grump', lookalike: true, pencil: true, rumour: 'printer', name: { my: 'လူငယ်မုန်းတယ်တဲ့', en: 'They say you hate the young' },
  line: { my: 'ဦးက လူငယ်တွေကို မကြိုက်ဘူးလို့ လူတွေ ပြောကြတယ်။', en: "People say you can't stand young people." },
  shows: ['looksdown'], really: { my: 'မစစ်ရသေးတဲ့ ကောလာဟလ', en: 'a rumour never checked' },
  backfire: { they: { my: 'မကြိုက်ရင် ဘာလို့ တံခါး ဖွင့်ပေးမလဲ!', en: 'Then why would I open my door to one!' },
              maya: { my: '(ကြားဖူးရုံနဲ့ ပြောမိပြီ။ တံခါးဝက ကျောက်သင်ပုန်းကို မဖတ်ခဲ့ဘူး။)', en: "(I repeated what I'd only heard. I never read the slate by his door.)" } } };

export const TALK_D8_TINT = {
  id: 'd8-utint',
  person: 'utint',
  with: ['kowunna'],
  steam: 2, calm: 4, turns: 8,
  stepBack: true, // the last stone is his: how he answers the boy
  hand: [...D8_TINT_CARDS, D8_TINT_RUMOUR], // (talk.js drops `grump` once rumour `printer` has its proof slip)
  stones: [
    { lines: [
      { my: 'အနှစ်လေးဆယ် စာလုံးတုံး တစ်တုံးမှ နေရာမလွဲဖူးဘူး။ တစ်မနက်တည်းနဲ့ ငါ့အံဆွဲတွေ ဟင်းချိုဖြစ်ကုန်ပြီ!', en: 'Forty years, not one block out of place. One morning and my drawers are soup!', need: 'hot', face: 'hot', steam: 1, heard: true,
        tell: { my: 'ကောင်လေးကို မုန်းတာ မဟုတ်ဘူး။ လက်က အံဆွဲကို လိုက်စမ်းနေတယ်။ သူ့အလုပ်ကို နာနေတာ။', en: "Not hatred of the boy. His hand keeps feeling along the drawers. His work hurts." } },
    ] },
    { lines: [
      { my: 'ငါ့ကို အရှက်ခွဲချင်လို့ လုပ်တာ။ ဒီအဖိုးကြီး တိုက်မသပ်တတ်ဘူး ထင်လို့။', en: "He did it to show me up. Thinks this old man can't keep a tidy shed.", need: 'unknown', seems: 'looksdown', face: 'hot',
        tell: { my: 'အထင်သေးတာ မဟုတ်ဘူး။ ဘာကြောင့် လုပ်လဲ တကယ် မသိဘူး။ ဒီတုံးကို တစ်ဖက်တည်းက ကြည့်နေတာ။', en: "Not contempt. He truly doesn't know why. He's looking at the block from one side only." } },
      { my: 'ဒီမနက် ငါ ပြောခဲ့တာ "ကြိုက်သလို လုပ်" တဲ့။ ဒါ "မနှောင့်ယှက်နဲ့" ဆိုတဲ့ အဓိပ္ပာယ်လေ။ ဒါလေးတောင် နားမလည်ဘူး။', en: 'I told him "do what you like". That means "don\'t bother me". He couldn\'t even tell that.', need: 'unknown', face: 'think',
        tell: { my: 'သူ့စကား ကောင်လေးဘက်က ဘယ်လို ကြားရလဲ မစဉ်းစားဖူးဘူး။', en: "He never thought how his words sounded from the boy's side." } },
    ] },
    { lines: [
      { my: 'ငါ့အံဆွဲ ငါသိရင် ပြီးတာပဲ။ ရှင်းပြတာ ငါ့အလုပ် မဟုတ်ဘူး။ ငါလည်း ကိုယ့်ဘာသာ သင်ခဲ့ရတာ။', en: "Knowing my drawers is my job. Explaining isn't. I learned on my own too.", need: 'looksdown', seems: 'given', face: 'think',
        tell: { my: 'ပျင်းလို့ မဟုတ်ဘူး။ တစ်ယောက်တည်း သင်ခဲ့ရလို့ အဲဒါ တစ်နည်းတည်းလို့ ထင်နေတာ။ အသိက ပြည့်ပြီး စေတနာက ခပ်ပါးပါး။', en: "Not lazy. He learned alone, so he thinks that's the only way. Full of knowing, thin on goodwill." } },
    ] },
    { lines: [
      { my: 'နာမည်တုံးလည်း ပျောက်ပြီ။ နှစ်ငါးဆယ် ဒီတိုက်နာမည်ကို ရိုက်ခဲ့တဲ့ တုံး။ အမှိုက်ပဲ ဖြစ်သွားပြီ။', en: "And the title block's gone. Fifty years it printed this shed's name. Scrap now.", need: 'given', face: 'sad', mood: 'down',
        tell: { my: 'ဒေါသ ကုန်သွားပြီ။ စားပွဲထောင့်ကို ငေးနေတယ်။ နာမည်တုံး ထားခဲ့တဲ့ နေရာ။', en: "The anger is spent. He's staring at the corner of the stone where the block used to sit." } },
    ] },
    { lines: [
      { my: 'ကဲ… အဲဒီ ကောင်လေးကို ငါ ဘာပြောရမလဲ။', en: 'Well… what am I to say to that boy?', need: 'own', face: 'think',
        tell: { my: 'အဖြေ မလိုဘူး။ သူ့ဘာသာ ရွေးနေတာ။ ကောင်လေး ရပ်နေတဲ့ တံခါးဝဘက်ကို ကြည့်နေတယ်။', en: "He doesn't need an answer. He's choosing. He's looking at the door where the boy waits." } },
      { my: 'မင်း ပြောလေ… မင်း စာရေးဆရာပဲ။', en: "You tell me… you're the writer.", need: 'own', face: 'think' },
    ] },
  ],
  react: {
    miss: { my: '…ဒါက စာလုံးတုံးနဲ့ မဆိုင်ဘူး။', en: '…That has nothing to do with type.' },
    hot: { my: '(ဦးတင့် စာရွက်ကို ဆောင့်ဆွဲနေတယ်။ ဘာမှ မကြားဘူး။)', en: '(U Tint is yanking sheets off the press. Nothing gets through.)' },
    lean: { my: 'ဒါဆို မင်းပြောသလို ပြောလိုက်မယ်… (သူ့စကား မဟုတ်တော့ဘူး။)', en: "Then I'll say what you said… (They aren't his words any more.)" },
  },
  decision: [
    { my: 'ဒီမှာ လာ ကောင်လေး။ ရှင်းရှင်း မေး။ အံဆွဲတိုင်း တစ်ခါ ပြမယ်။ ပြီးရင် မင်း မှတ်။', en: "Come here, boy. Ask me properly and I'll show you every drawer, once. Then they're yours to remember.", face: 'think' },
    { my: 'ပြီးတော့ မင်းလည်း ငါ့ကို ပြ။ ဒီလောက် ညီညီညာညာ ဘယ်လို စီလိုက်တာလဲ။', en: 'And you show me something too. How did you get them so even?', face: 'happy' },
  ],
};

// ---------------------------------------------------------------------------------------------
// Ma Thida (ch 12): the first Step back
// ---------------------------------------------------------------------------------------------
export const D8_THIDA_CARDS = [
  { id: 'self', name: { my: 'ကိုယ်တိုင် နားလည်လို့လား', en: 'Do you understand it yourself?' }, onlyIf: 'd8.sorted',
    line: { my: 'ကျွန်မ ပြောလို့ပဲလား။ ညီမ ကိုယ်တိုင် ဘာကြောင့်လဲ နားလည်လို့ လက်ခံတာလား။', en: 'Is it only because I said it? Or do you understand why, yourself?' },
    answers: ['cling'], from: { my: 'မေးခွန်းငါးခု', en: 'the five questions' } },
  { id: 'proofsays', name: { my: 'တစ်ယောက်၊ တစ်အိုး၊ တစ်နေ့', en: 'One person, one pot, one day' }, onlyIf: 'bag:proof:mayasays',
    line: { my: 'အဲဒီစကားကို ခွာညိုတစ်ယောက်တည်းကို ပြောခဲ့တာ။ တံဆိပ်ထုမယ့်နေ့အတွက် တစ်အိုးပဲ။', en: 'I said that to Khwar Nyo alone. One pot, for her stamp day.' },
    answers: ['cling'], from: { my: 'ကိုယ့် မှတ်စုထဲက', en: 'from my own notebook' } },
  { id: 'key', name: { my: 'သော့က ကိုယ့်လက်ထဲ', en: 'The key is in your hand' }, // Little Key (ch 11), new today
    line: { my: 'ဘယ်သူ့စကားမဆို ဖွင့်ကြည့်တဲ့ သော့က ညီမ လက်ထဲမှာပဲ။', en: "Whoever's words they are, the key to open them is in your own hand." },
    answers: ['cling'], from: { my: 'သော့လေး', en: 'the Little Key' } },
  { id: 'stage', name: { my: 'ညီမရဲ့ ဇာတ်ခုံ', en: "It's your stage" }, // Little Stage (ch 4), new today
    line: { my: 'ဒါ ညီမရဲ့ စားပွဲ၊ ညီမရဲ့ စာတွေ။ ကျွန်မက ဘေးက ကြည့်သူပဲ။', en: "This is your table, your letters. I'm only watching from the side." },
    answers: ['cling'], from: { my: 'ဇာတ်ခုံလေး', en: 'the Little Stage' } },
  { id: 'proofwell', name: { my: 'တွင်း၊ ဒီနေ့', en: 'The well, today' }, onlyIf: 'd8.wellSeen',
    line: { my: 'ဒီနေ့ တွင်းကို ကိုယ်တိုင် သွားကြည့်ခဲ့တယ်။ တတိယ အကွင်းအထိ ပြည့်နေတယ်။', en: 'I went and looked at the well today. Full to the third ring.' },
    answers: ['afraid'], from: { my: 'ရွှေမင်တွင်းမှာ', en: 'at the well' } },
  { id: 'all', name: { my: 'အားလုံးအတွက် ကောင်းလား', en: 'Good for everyone?' }, onlyIf: 'd8.sorted',
    line: { my: 'ညီမအတွက်ရော၊ ကလေးတွေအတွက်ရော၊ ရပ်ကွက်တစ်ခုလုံးအတွက်ရော ကောင်းလား။', en: 'Is it good for you, and for the children, and for the whole Junction?' },
    answers: ['unknown'], from: { my: 'မေးခွန်းငါးခု', en: 'the five questions' } },
  { id: 'blameless', name: { my: 'အပြစ်ကင်းလား', en: 'Free of fault?' }, onlyIf: 'd8.sorted',
    line: { my: 'အိုးတွေ စင်ပေါ်မှာ ငြိမ်နေပေမဲ့ တွင်းဘေးက မင်အိုးလေးတွေ ဗလာ။ အပြစ်ကင်းလား။', en: 'The jars sit quietly on your shelf, and the little pots by the well are empty. Is it free of fault?' },
    answers: ['unknown'], from: { my: 'မေးခွန်းငါးခု', en: 'the five questions' } },
  { id: 'good', name: { my: 'ကောင်းတဲ့အလုပ်လား', en: 'Is it good?' }, onlyIf: 'd8.sorted',
    line: { my: 'တွင်း ပြည့်နေတဲ့နေ့မှာ အိုးဆယ့်နှစ်လုံး သိမ်းတာ ကောင်းတဲ့ အလုပ်လား။', en: 'Keeping twelve jars on a day the well is full: is that a good thing to do?' },
    answers: ['unknown'], from: { my: 'မေးခွန်းငါးခု', en: 'the five questions' } },
  { id: 'wise', name: { my: 'ပညာရှိ ချီးမွမ်းမလား', en: 'Would the wise praise it?' }, onlyIf: 'd8.sorted',
    line: { my: 'ညီမ လေးစားတဲ့ ပညာရှိ တစ်ယောက်ယောက် ဒါကို မြင်ရင် ချီးမွမ်းမလား။', en: 'If someone wise you respect saw this, would they praise it?' },
    answers: ['unknown'], from: { my: 'မေးခွန်းငါးခု', en: 'the five questions' } },
  { id: 'cool', name: { my: 'အေးအေးဆေးဆေး', en: 'Cool first' }, // Cool Cloud (ch 7)
    line: { my: 'ဘယ်သူမှ အပြစ်မတင်ပါဘူး။ ခဏ ထိုင်ပြီး အသက်ရှူကြရအောင်။', en: "Nobody's blaming you. Let's sit a moment and breathe." },
    answers: ['hot'], from: { my: 'တိမ်အေးလေး', en: 'the Cool Cloud' } },
  { id: 'mayasays', lookalike: true, name: { my: 'မာရာ ပြောတယ်: ပြန်ပေး', en: 'Maya says: give it back' },
    line: { my: 'ကျွန်မ ပြောမယ်… အိုးတွေ ပြန်ပေးလိုက်။', en: "I'll tell you… give the jars back." },
    shows: ['cling', 'unknown'], really: { my: 'မှီစရာ "မာရာ ပြောတယ်" နောက်တစ်ခု', en: 'one more "Maya says" to lean on' },
    backfire: { they: { my: 'ဟုတ်… မာရာ ပြောရင်တော့… (ဘာကြောင့်လဲ မသိဘဲ အိုးတစ်လုံး ချလိုက်တယ်။)', en: 'Okay… if Maya says… (She sets one jar down without knowing why.)' },
                maya: { my: '(စကားက မှန်တယ်။ ဒါပေမဲ့ ဒါလည်း ကျွန်မ နာမည်နဲ့ ယုံခိုင်းတာပဲ။)', en: "(The words are right. But it's still asking her to believe my name.)" } } },
];

export const TALK_D8_THIDA = {
  id: 'd8-thida',
  person: 'thida',
  with: ['moemoe'], // Moe Moe waits in the doorway with her empty school pot (from d8.wellSeen)
  steam: 1, calm: 4, turns: 8,
  stepBack: true,
  hand: D8_THIDA_CARDS, // first hand in data order: self, proofsays, key, stage -> then the deck
  tutorial: [
    { at: 'acts', my: 'ဒီနေ့ကစပြီး နောက်ဆုံး ကျောက်တုံးက သူ့ဟာ ဖြစ်နိုင်တယ်။ ကတ်တစ်ကတ်မှ မကိုက်ဘူး။ "နောက်ဆုတ်ပေး" ကို ဖိထားပြီး သူ့ဘာသာ ဆုံးဖြတ်ခွင့် ပေးပါ။', en: 'From today the last stone can be theirs. No card fits it. Hold Step back and let them decide.' },
    { at: 'label', my: 'ကြည့်ရင် "ကိုယ်တိုင် ရွေးမယ်" လို့ ရွှေမင်နဲ့ ပေါ်လာမယ်။ အဲဒါ သူ့ကျောက်တုံး။', en: 'Look shows "their own choice" in gold. That stone is theirs.' },
  ],
  stones: [
    { lines: [
      { my: 'မာရာ ပြောတယ်လေ၊ မင်သိမ်းထားတဲ့။ မာရာ ကိုယ်တိုင် ရောက်လာတော့ ပိုသေချာပြီ။', en: "Maya said keep ink back. And now Maya herself is here, so it's certain.", need: 'cling', seems: 'own', face: 'smile',
        tell: { my: 'သူ့ဘာသာ ဆုံးဖြတ်ထားတာ မဟုတ်ဘူး။ "မာရာ ပြောတယ်" စာရွက်ကို လက်မှတ်လို ကိုင်ထားတယ်။', en: 'Not her own decision. She holds the "Maya says" slip like a ticket.' } },
      { my: 'မာရာ့စကားကို ဘာလို့ စစ်ရမှာလဲ။ အမြဲ မှန်တာပဲ။', en: "Why would I check Maya's words? They're always right.", need: 'cling', face: 'smile' },
    ] },
    { lines: [
      { my: 'တွင်းခန်းသွားရင် ဘယ်သူ့စာမှ ရေးပေးလို့ မရတော့ဘူး။ ကျွန်မမှာ ဘာမှ မကျန်တော့ဘူး။', en: "If the well dries I can't write anyone's letters. I'll have nothing.", need: 'afraid', seems: 'envy', face: 'worried', heard: true,
        tell: { my: 'လောဘ မဟုတ်ဘူး။ အိုးတွေကို ရက်ရေတွက်သလို လက်တုန်တုန်နဲ့ ရေနေတယ်။', en: 'Not greed. She counts the jars with shaking hands, like counting days.' } },
      { my: 'အိုးတစ်လုံးဆို အလုပ်လုပ်ရမယ့် ရက်တစ်ရက်ပဲ။', en: 'Every jar is one more day I can work.', need: 'afraid', face: 'worried' },
    ] },
    { lines: [
      { my: 'ကလေးတွေ မင်လာတောင်းတယ်။ မရှိဘူး ပြောလိုက်တယ်။ ကိုယ့်ဘာသာ ရှာကြပါစေ။', en: 'The children came asking for ink. I said there was none. Let them find their own.', need: 'unknown', seems: 'looksdown', face: 'think',
        tell: { my: 'ကလေးတွေကို အထင်သေးတာ မဟုတ်ဘူး။ တံခါးဝက မိုးမိုးရဲ့ ဗလာအိုးလေးကို ခဏခဏ လှမ်းကြည့်ပြီး မျက်နှာလွှဲတယ်။ မစဉ်းစားဖူးသေးတာ။', en: "Not contempt. She keeps glancing at Moe Moe's empty pot in the doorway, then away. She hasn't thought it through." } },
      { my: 'ကိုယ့်စင်ပေါ်က အိုးက ဘယ်သူ့ကိုမှ မထိခိုက်ပါဘူး။', en: 'A jar on my own shelf hurts nobody.', need: 'unknown', face: 'think' },
    ] },
    { lines: [
      { my: 'အခု လူတွေက ကျွန်မကို လောဘကြီးတယ် ပြောနေပြီ! ကျွန်မ မာရာ ပြောတာကိုပဲ လုပ်ခဲ့တာ!', en: 'Now people are calling ME greedy! I only did what Maya said!', need: 'hot', face: 'hot', steam: 1, heard: true,
        tell: { my: 'မာရာ့ကို စိတ်ဆိုးတာ မဟုတ်ဘူး။ ရှက်နေတာ။ ပါးတွေ နီနေတယ်။', en: "She isn't angry at Maya. She's ashamed. Her cheeks are red." } },
    ] },
    { lines: [
      { my: 'ကဲ… အိုးတွေ ပြန်ပေးရမလား၊ သိမ်းထားရမလား။ ပြောပါ မာရာ။ မာရာ အသိဆုံးပဲ။', en: 'So… do I give the jars back or keep them? Tell me, Maya. You know best.', need: 'own', face: 'think',
        tell: { my: 'အဖြေ မလိုတော့ဘူး။ တွင်းကို ကြည့်ရင်း ကိုယ့်ဘာသာ တွက်နေတယ်။ သူ့ ကျောက်တုံး။', en: "She doesn't need an answer now. She's looking at the well, weighing it herself. Her stone." } },
      { my: 'ပြောလိုက်ရုံပဲ… ကျွန်မ လုပ်မှာပါ။', en: "Just say it… I'll do it.", need: 'own', face: 'worried' },
    ] },
  ],
  react: {
    miss: { my: '…ဟင်? ဒါ မင်နဲ့ ဘာဆိုင်လဲ။', en: '…Huh? What has that to do with ink?' },
    hot: { my: '(မသီတာ အိုးတွေကို ဖက်ထားတယ်။ ဘာမှ မကြားဘူး။)', en: '(Ma Thida is hugging the jars. Nothing gets through.)' },
    lean: { my: 'ဟုတ်ကဲ့… မာရာ ပြောသလို လုပ်မယ်။ (သူ့ဆုံးဖြတ်ချက် မဟုတ်တော့ဘူး။)', en: "Okay… I'll do what Maya says. (It isn't her decision any more.)" },
  },
  decision: [
    { my: 'တစ်လုံးပဲ ထားမယ်။ ဒီတစ်ပတ် စာရေးဖို့။ ကျန်တာ တွင်းထဲ ပြန်လောင်းမယ်။', en: "I'll keep one jar. For this week's letters. The rest go back in the well.", face: 'think' },
    { my: 'မနက်ဖြန် ကျွန်မ ကိုယ်တိုင် တွင်းကို ထပ်ကြည့်မယ်။ မာရာ ပြောလို့ မဟုတ်ဘူးနော်။', en: "And tomorrow I'll look in the well again myself. Not because Maya said so.", face: 'happy' },
  ],
};
