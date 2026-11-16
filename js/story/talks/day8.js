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
  { id: 'cool', name: { my: 'အရင် စိတ်အေးအေး ထားပါ', en: 'Cool first' }, // Cool Cloud (ch 7)
    line: { my: 'မလောပါနဲ့ ဦးတင့်ရယ်။ လက်ဖက်ရည် တစ်ခွက် အရင်သောက်ပြီးမှ စကားပြောကြတာပေါ့။', en: "No hurry, U Tint. A cup of tea first, then we'll talk." },
    answers: ['hot'], from: { my: 'တိမ်အေး', en: 'the Cool Cloud' } },
  { id: 'sixside', name: { my: 'သူ့ဘက်က ကြည့်ရင်', en: 'From his side' }, onlyIf: 'd8.turned',
    line: { my: 'ကိုဝဏ္ဏ ဘက်က ကြည့်ရင် ဒီတုံးက ဖြောင့်ဖြောင့်တန်းတန်းနဲ့ ညီညာနေတာ။ သူ့အတွက်တော့ ကူညီပေးလိုက်တာပဲ။', en: "Seen from Ko Wunna's side this block stands straight and even. To him it was help." },
    answers: ['unknown'], from: { my: 'သစ်သားတုံးကို လှည့်ကြည့်ရာက', en: 'from turning the block' } },
  { id: 'why', name: { my: 'ဘာလို့လဲ', en: 'Why?' }, // Why-Parrot (ch 3): a new question every time
    line: { my: 'သူ ဘာလို့ အဲဒီလို လုပ်တယ်လို့ ဦးထင်လဲ။ သူ့ကို မေးကြည့်ပြီးပြီလား။', en: 'Why do you think he did it? Have you asked him?' },
    answers: ['unknown'], from: { my: 'ဘာလို့လဲ ကြက်တူရွေးလေး', en: 'the Why-Parrot' } },
  { id: 'road', name: { my: 'လမ်းပြပေးလိုက်ပါ', en: 'Show the road' }, // Firefly (ch 9)
    // LESSON (p71 point two): knowledge does good only when goodwill carries it to someone
    line: { my: 'ဦး သိထားတာတွေက ကောင်လေးဆီ ရောက်မှ အကျိုးရှိမှာ။ ဦးတစ်ယောက်တည်းပဲ သူ့ကို လမ်းပြပေးနိုင်တာ။', en: 'What you know only does good once it reaches the boy. Only you can show him the way.' },
    answers: ['looksdown'], from: { my: 'ပိုးစုန်းကြူးလေး', en: 'the Firefly' } },
  { id: 'asked', name: { my: 'သူ မေးဖို့ အဆင်သင့် ဖြစ်နေပြီ', en: "He's ready to ask" }, onlyIf: 'd8.asked',
    line: { my: 'ကိုဝဏ္ဏက အံဆွဲနာမည်တွေကို သူ့ဘာသာ ဖတ်ပြီးပြီ။ ပုံနှိပ်စက် ရပ်သွားရင် ကျန်တာတွေကို ရှင်းရှင်းလင်းလင်း မေးလိမ့်မယ်။', en: "Ko Wunna has read the drawer names himself. He'll ask the rest clearly, when the press stops." },
    answers: ['looksdown'], from: { my: 'ကိုဝဏ္ဏရဲ့ စာကြမ်းတွေဆီက', en: "from Ko Wunna's drafts" } },
  { id: 'title', name: { my: 'ခေါင်းစဉ်တုံး', en: 'The title block' }, onlyIf: 'd8.look.title',
    line: { my: 'ပျောက်သွားတာ မဟုတ်ဘူး ဦးတင့်ရဲ့။ ဒီမှာလေ။ ပြောင်းပြန် စာလုံးတွေကို ဘယ်သူမှ မဖတ်တတ်ကြလို့ပါ။', en: "It isn't lost, U Tint. Here. Nobody could read backwards letters, that's all." },
    answers: ['given'], from: { my: 'စက္ကူစုတ် ပုံးထဲမှာ တွေ့ခဲ့ရတာ', en: 'found in the scrap crate' } },
  { id: 'once', name: { my: 'နောက်တစ်ခေါက်', en: 'Once more' }, // Black Sheep (ch 1), gold by now
    line: { my: 'ခဲစာလုံးတွေကို နောက်တစ်ခေါက် ပြန်စီလို့ ရတာပဲ။ ဦးလေး စီလာတာ အကြိမ်တစ်ထောင်တောင် ရှိနေပြီပဲ။', en: "The letters can be set once more. You've set them a thousand times." },
    answers: ['given'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'blame', lookalike: true, name: { my: 'ဦးလေးအပြစ်ပဲ', en: 'Your own fault' },
    line: { my: 'ဦးလေး သူ့ကို ရှင်းရှင်းလင်းလင်း မပြောခဲ့လို့ ဖြစ်ရတာ။', en: "It happened because you didn't tell him clearly." },
    shows: ['looksdown'], really: { my: 'အပြစ်တင်မိတာ', en: 'finding fault' },
    backfire: { they: { my: 'ငါ့အပြစ် ဟုတ်လား။ ငါ့ပုံနှိပ်တဲထဲမှာ ငါ့အပြစ် ဟုတ်လား။', en: 'MY fault? In my own shed?' },
                maya: { my: '(ပြေလည်အောင် ရှင်းပြမလို့ပါပဲ… သူ့ဘက်က ကြည့်တော့ အပြစ်တင်သလို ဖြစ်သွားပြီ။)', en: '(I meant to fix it… from his side it sounded like blame.)' } } },
];
// only while rumour `printer` is unchecked (an unchecked rumour sits in the hand as a pencil look-alike)
export const D8_TINT_RUMOUR = { id: 'grump', lookalike: true, pencil: true, rumour: 'printer', name: { my: 'လူငယ်တွေကို မုန်းတယ်လို့ ပြောကြတယ်', en: 'They say you hate the young' },
  line: { my: 'ဦးလေးက လူငယ်တွေကို ကြည့်မရဘူးလို့ လူတွေ ပြောနေကြတယ်။', en: "People say you can't stand young people." },
  shows: ['looksdown'], really: { my: 'မစစ်ဆေးဖူးတဲ့ ကောလာဟလ', en: 'a rumour never checked' },
  backfire: { they: { my: 'ဒါဆို လူငယ်တစ်ယောက်အတွက် ငါ ဘာလို့ တံခါးဖွင့်ပေးထားမှာလဲ။', en: 'Then why would I open my door to one!' },
              maya: { my: '(ကြားဖူးနားဝကိုပဲ ပြန်ပြောမိပြီ။ သူ့တံခါးဘေးက ကျောက်သင်ပုန်းလေးကို ငါ တစ်ခါမှ မဖတ်ကြည့်မိဘူး။)', en: "(I repeated what I'd only heard. I never read the slate by his door.)" } } };

export const TALK_D8_TINT = {
  id: 'd8-utint',
  person: 'utint',
  with: ['kowunna'],
  steam: 2, calm: 4, turns: 8,
  stepBack: true, // the last stone is his: how he answers the boy
  hand: [...D8_TINT_CARDS, D8_TINT_RUMOUR], // (talk.js drops `grump` once rumour `printer` has its proof slip)
  stones: [
    { lines: [
      { my: 'အနှစ်လေးဆယ်လုံးလုံး ခဲစာလုံးတစ်တုံးတောင် နေရာမလွဲခဲ့ဘူး။ တစ်မနက်တည်းနဲ့ ငါ့အံဆွဲတွေ စွပ်ပြုတ်ဖြစ်ကုန်ပြီ။', en: 'Forty years, not one block out of place. One morning and my drawers are soup!', need: 'hot', face: 'hot', steam: 1, heard: true,
        tell: { my: 'ကောင်လေးကို မုန်းနေတာ မဟုတ်ဘူး။ သူ့လက်က အံဆွဲတွေတစ်လျှောက် ပွတ်သပ်ကြည့်နေတယ်။ သူ့လက်ရာတွေ ပျက်သွားလို့ ရင်နာနေတာ။', en: "Not hatred of the boy. His hand keeps feeling along the drawers. His work hurts." } },
    ] },
    { lines: [
      { my: 'ငါ့ကို အရှက်ခွဲချင်လို့ လုပ်တာ။ ဒီအဘိုးကြီး ပုံနှိပ်တဲကို သပ်သပ်ရပ်ရပ် မထားတတ်ဘူးလို့ ထင်နေတာ။', en: "He did it to show me up. Thinks this old man can't keep a tidy shed.", need: 'unknown', seems: 'looksdown', face: 'hot',
        tell: { my: 'အထင်သေးနေတာ မဟုတ်ဘူး။ ဘာလို့လဲ ဆိုတာကို သူ တကယ် မသိတာ။ သစ်သားတုံးကို တစ်ဖက်တည်းကပဲ ကြည့်နေတာ။', en: "Not contempt. He truly doesn't know why. He's looking at the block from one side only." } },
      { my: '"မင်းကြိုက်သလို လုပ်" လို့ ငါ ပြောလိုက်တယ်။ အဲဒါ "ငါ့ကို လာမနှောင့်ယှက်နဲ့" လို့ ပြောတာပဲ။ အဲဒါလေးတောင် သူ နားမလည်ဘူး။', en: 'I told him "do what you like". That means "don\'t bother me". He couldn\'t even tell that.', need: 'unknown', face: 'think',
        tell: { my: 'သူ့စကားတွေက ကောင်လေးဘက်က ကြည့်ရင် ဘယ်လိုထင်ရမလဲ ဆိုတာကို သူ တစ်ခါမှ မတွေးမိဘူး။', en: "He never thought how his words sounded from the boy's side." } },
    ] },
    { lines: [
      { my: 'ငါ့အံဆွဲတွေအကြောင်း သိဖို့က ငါ့အလုပ်။ ရှင်းပြနေဖို့က ငါ့အလုပ် မဟုတ်ဘူး။ ငါလည်း ကိုယ့်ဘာသာ သင်ယူခဲ့ရတာပဲ။', en: "Knowing my drawers is my job. Explaining isn't. I learned on my own too.", need: 'looksdown', seems: 'given', face: 'think',
        tell: { my: 'ပျင်းနေတာ မဟုတ်ဘူး။ တစ်ယောက်တည်း သင်ယူခဲ့ရတော့ ဒါပဲ တစ်ခုတည်းသော နည်းလမ်းလို့ ထင်နေတာ။ ပညာတော့ ပြည့်ဝပေမဲ့ စေတနာ ပါးနေတာ။', en: "Not lazy. He learned alone, so he thinks that's the only way. Full of knowing, thin on goodwill." } },
    ] },
    { lines: [
      { my: 'ပြီးတော့ ခေါင်းစဉ်တုံးလည်း ပျောက်သွားပြီ။ အနှစ်ငါးဆယ်လုံးလုံး ဒီပုံနှိပ်တဲ နာမည်ကို ရိုက်နှိပ်လာခဲ့တာ။ အခုတော့ အစုတ်အပြတ် ဖြစ်သွားပြီ။', en: "And the title block's gone. Fifty years it printed this shed's name. Scrap now.", need: 'given', face: 'sad', mood: 'down',
        tell: { my: 'ဒေါသတွေ ပြေသွားပြီ။ အရင်က ခေါင်းစဉ်တုံး ထားနေကျ ကျောက်ပြားထောင့်လေးကိုပဲ စိုက်ကြည့်နေတယ်။', en: "The anger is spent. He's staring at the corner of the stone where the block used to sit." } },
    ] },
    { lines: [
      { my: 'အင်း… အဲဒီကောင်လေးကို ငါ ဘာပြောရမလဲ။', en: 'Well… what am I to say to that boy?', need: 'own', face: 'think',
        tell: { my: 'သူ အဖြေ မလိုချင်ဘူး။ သူ့ဘာသာ ရွေးချယ်နေတာ။ ကောင်လေး စောင့်နေတဲ့ တံခါးဝကိုပဲ ကြည့်နေတယ်။', en: "He doesn't need an answer. He's choosing. He's looking at the door where the boy waits." } },
      { my: 'မင်း ပြောပြပါဦး… မင်းက စာရေးဆရာမပဲ။', en: "You tell me… you're the writer.", need: 'own', face: 'think' },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါ ခဲစာလုံးနဲ့ ဘာမှ မဆိုင်ဘူး။', en: '…That has nothing to do with type.' },
    hot: { my: '(ဦးတင့် ပုံနှိပ်စက်ပေါ်က စာရွက်တွေကို ဆွဲထုတ်နေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(U Tint is yanking sheets off the press. Nothing gets through.)' },
    lean: { my: 'ဒါဆို မင်း ပြောတဲ့အတိုင်းပဲ ငါ ပြောလိုက်မယ်… (အဲဒါ သူ့စကားတွေ မဟုတ်တော့ဘူး။)', en: "Then I'll say what you said… (They aren't his words any more.)" },
  },
  decision: [
    { my: 'ဒီလာခဲ့ ကောင်လေး။ ငါ့ကို သေချာမေးရင် အံဆွဲတိုင်းကို တစ်ခေါက် ပြပေးမယ်။ ပြီးရင်တော့ မှတ်မိအောင် လုပ်ဖို့က မင်းအပိုင်းပဲ။', en: "Come here, boy. Ask me properly and I'll show you every drawer, once. Then they're yours to remember.", face: 'think' },
    { my: 'ပြီးတော့ မင်းလည်း ငါ့ကို တစ်ခု ပြန်ပြဦး။ ဒါတွေကို ဘယ်လိုများ ဒီလောက် ညီညာအောင် စီလိုက်တာလဲ။', en: 'And you show me something too. How did you get them so even?', face: 'happy' },
  ],
};

// ---------------------------------------------------------------------------------------------
// Ma Thida (ch 12): the first Step back
// ---------------------------------------------------------------------------------------------
export const D8_THIDA_CARDS = [
  { id: 'self', name: { my: 'ကိုယ်တိုင်ရော နားလည်ရဲ့လား', en: 'Do you understand it yourself?' }, onlyIf: 'd8.sorted',
    line: { my: 'ငါ ပြောလို့ပဲ လုပ်တာလား။ ဒါမှမဟုတ် ဘာလို့လဲ ဆိုတာကို ကိုယ်တိုင် နားလည်လို့လား။', en: 'Is it only because I said it? Or do you understand why, yourself?' },
    answers: ['cling'], from: { my: 'မေးခွန်း ငါးခု', en: 'the five questions' } },
  { id: 'proofsays', name: { my: 'လူတစ်ယောက်၊ အိုးတစ်လုံး၊ တစ်ရက်', en: 'One person, one pot, one day' }, onlyIf: 'bag:proof:mayasays',
    line: { my: 'အဲဒါ ခွာညို တစ်ယောက်တည်းကိုပဲ ငါ ပြောခဲ့တာ။ သူ့တံဆိပ်တုံး နေ့အတွက် အိုးတစ်လုံး ဆိုပြီးတော့လေ။', en: 'I said that to Khwar Nyo alone. One pot, for her stamp day.' },
    answers: ['cling'], from: { my: 'ငါ့ကိုယ်ပိုင် မှတ်စုစာအုပ်ထဲက', en: 'from my own notebook' } },
  { id: 'key', name: { my: 'သော့က မင်းလက်ထဲမှာ ရှိတယ်', en: 'The key is in your hand' }, // Little Key (ch 11), new today
    line: { my: 'ဘယ်သူ့စကားပဲ ဖြစ်ဖြစ် ဖွင့်ကြည့်ဖို့ သော့ကတော့ မင်းလက်ထဲမှာပဲ ရှိတာ။', en: "Whoever's words they are, the key to open them is in your own hand." },
    answers: ['cling'], from: { my: 'သော့သေးသေးလေး', en: 'the Little Key' } },
  { id: 'stage', name: { my: 'ဒါ မင်းရဲ့ စင်မြင့်ပဲ', en: "It's your stage" }, // Little Stage (ch 4), new today
    line: { my: 'ဒါ မင်းရဲ့ စားပွဲ၊ မင်းရဲ့ စာလုံးတွေပဲ။ ငါက ဘေးကနေ ကြည့်ပေးရုံသက်သက်ပါ။', en: "This is your table, your letters. I'm only watching from the side." },
    answers: ['cling'], from: { my: 'စင်မြင့်သေးသေးလေး', en: 'the Little Stage' } },
  { id: 'proofwell', name: { my: 'ဒီနေ့ ရေတွင်း အခြေအနေ', en: 'The well, today' }, onlyIf: 'd8.wellSeen',
    line: { my: 'ဒီနေ့ ငါ ရေတွင်းကို သွားကြည့်ခဲ့တယ်။ တတိယ အရစ်အထိ ရေအပြည့်ပဲ။', en: 'I went and looked at the well today. Full to the third ring.' },
    answers: ['afraid'], from: { my: 'ရေတွင်းနားမှာ', en: 'at the well' } },
  { id: 'all', name: { my: 'အားလုံးအတွက် ကောင်းရဲ့လား', en: 'Good for everyone?' }, onlyIf: 'd8.sorted',
    line: { my: 'နင့်အတွက်ရော၊ ကလေးတွေအတွက်ရော၊ တစ်လမ်းဆုံလုံး အတွက်ရော ကောင်းရဲ့လား။', en: 'Is it good for you, and for the children, and for the whole Junction?' },
    answers: ['unknown'], from: { my: 'မေးခွန်း ငါးခု', en: 'the five questions' } },
  { id: 'blameless', name: { my: 'အပြစ်ကင်းရဲ့လား', en: 'Free of fault?' }, onlyIf: 'd8.sorted',
    line: { my: 'နင့်စင်ပေါ်မှာ စဉ့်အိုးတွေ အပြည့် ငြိမ်သက်နေပြီး ရေတွင်းနားက အိုးသေးသေးလေးတွေကျ ဗလာ ဖြစ်နေတာ အပြစ်ကင်းရဲ့လား။', en: 'The jars sit quietly on your shelf, and the little pots by the well are empty. Is it free of fault?' },
    answers: ['unknown'], from: { my: 'မေးခွန်း ငါးခု', en: 'the five questions' } },
  { id: 'good', name: { my: 'ကောင်းတဲ့ လုပ်ရပ်လား', en: 'A good deed?' }, onlyIf: 'd8.sorted',
    line: { my: 'ရေတွင်းထဲ ရေအပြည့် ရှိနေတဲ့ နေ့မှာ စဉ့်အိုး ဆယ့်နှစ်လုံး သိမ်းထားတာ ကောင်းတဲ့ လုပ်ရပ် ဟုတ်ရဲ့လား။', en: 'Keeping twelve jars on a day the well is full: is that a good thing to do?' },
    answers: ['unknown'], from: { my: 'မေးခွန်း ငါးခု', en: 'the five questions' } },
  { id: 'wise', name: { my: 'ပညာရှိတွေသာ မြင်ရင် ချီးကျူးပါ့မလား', en: 'Would the wise praise it?' }, onlyIf: 'd8.sorted',
    line: { my: 'နင် လေးစားရတဲ့ ပညာရှိ တစ်ယောက်ယောက်သာ ဒါကို မြင်သွားရင် ချီးကျူးပါ့မလား။', en: 'If someone wise you respect saw this, would they praise it?' },
    answers: ['unknown'], from: { my: 'မေးခွန်း ငါးခု', en: 'the five questions' } },
  { id: 'cool', name: { my: 'အရင် စိတ်အေးအေး ထားပါ', en: 'Cool first' }, // Cool Cloud (ch 7)
    line: { my: 'ဘယ်သူမှ နင့်ကို အပြစ်မတင်ပါဘူး။ ခဏလောက် ထိုင်ပြီး အသက်ဝဝ ရှူလိုက်ရအောင်။', en: "Nobody's blaming you. Let's sit a moment and breathe." },
    answers: ['hot'], from: { my: 'တိမ်အေး', en: 'the Cool Cloud' } },
  { id: 'mayasays', lookalike: true, name: { my: 'မာရာ ပြောတယ်- ပြန်ပေးလိုက်ပါတဲ့', en: 'Maya says: give it back' },
    line: { my: 'ငါ ပြောမယ်… စဉ့်အိုးတွေ ပြန်ပေးလိုက်ပါ။', en: "I'll tell you… give the jars back." },
    shows: ['cling', 'unknown'], really: { my: 'မှီခိုစရာ နောက်ထပ် "မာရာ ပြောတယ်" တစ်ခု', en: 'one more "Maya says" to lean on' },
    backfire: { they: { my: 'ဟုတ်ကဲ့… မာရာ ပြောတယ်ဆိုရင်… (ဘာကြောင့်မှန်း မသိဘဲ စဉ့်အိုး တစ်လုံးကို အောက်ချလိုက်တယ်။)', en: 'Okay… if Maya says… (She sets one jar down without knowing why.)' },
                maya: { my: '(စကားလုံးတွေက မှန်ပါတယ်။ ဒါပေမဲ့ ငါ့နာမည်ကို ယုံခိုင်းနေသလို ဖြစ်နေတုန်းပဲ။)', en: "(The words are right. But it's still asking her to believe my name.)" } } },
];

export const TALK_D8_THIDA = {
  id: 'd8-thida',
  person: 'thida',
  with: ['moemoe'], // Moe Moe waits in the doorway with her empty school pot (from d8.wellSeen)
  steam: 1, calm: 4, turns: 8,
  stepBack: true,
  hand: D8_THIDA_CARDS, // first hand in data order: self, proofsays, key, stage -> then the deck
  tutorial: [
    { at: 'acts', my: 'ဒီနေ့ကစပြီး နောက်ဆုံး ကျောက်တုံးလေးက သူတို့အပိုင် ဖြစ်သွားပြီ။ ဘယ်ကတ်ပြားနဲ့မှ မကိုက်တော့ဘူး။ နောက်ဆုတ်ပြီး သူတို့ဘာသာ ဆုံးဖြတ်ပါစေ။', en: 'From today the last stone can be theirs. No card fits it. Hold Step back and let them decide.' },
    { at: 'label', my: 'ကြည့် ကိုနှိပ်ရင် "ကိုယ်ပိုင် ရွေးချယ်မှု" ဆိုပြီး ရွှေရောင်နဲ့ ပေါ်လာမယ်။ အဲဒီကျောက်တုံးက သူတို့အပိုင်ပဲ။', en: 'Look shows "their own choice" in gold. That stone is theirs.' },
  ],
  stones: [
    { lines: [
      { my: 'မင်တွေ ချန်ထားဖို့ မာရာ ပြောခဲ့တာ။ အခု မာရာကိုယ်တိုင် ဒီရောက်နေပြီဆိုတော့ သေချာသွားပြီပေါ့။', en: "Maya said keep ink back. And now Maya herself is here, so it's certain.", need: 'cling', seems: 'own', face: 'smile',
        tell: { my: 'သူ့ကိုယ်ပိုင် ဆုံးဖြတ်ချက် မဟုတ်ဘူး။ "မာရာ ပြောတယ်" ဆိုတဲ့ စာရွက်ပိုင်းလေးကို လက်မှတ်တစ်စောင်လို ကိုင်ထားတာ။', en: 'Not her own decision. She holds the "Maya says" slip like a ticket.' } },
      { my: 'မာရာ့စကားကို ငါ ဘာလို့ ပြန်စစ်နေရမှာလဲ။ အမြဲတမ်း မှန်နေတာပဲ။', en: "Why would I check Maya's words? They're always right.", need: 'cling', face: 'smile' },
    ] },
    { lines: [
      { my: 'ရေတွင်း ခန်းသွားရင် ဘယ်သူ့စာကိုမှ ရေးပေးနိုင်တော့မှာ မဟုတ်ဘူး။ ငါ့မှာ ဘာမှ ကျန်တော့မှာ မဟုတ်ဘူး။', en: "If the well dries I can't write anyone's letters. I'll have nothing.", need: 'afraid', seems: 'envy', face: 'worried', heard: true,
        tell: { my: 'လောဘကြီးတာ မဟုတ်ဘူး။ နေ့ရက်တွေကို ရေတွက်နေသလိုမျိုး တုန်ယင်နေတဲ့ လက်တွေနဲ့ စဉ့်အိုးတွေကို ရေတွက်နေတာ။', en: 'Not greed. She counts the jars with shaking hands, like counting days.' } },
      { my: 'စဉ့်အိုး တစ်လုံးက ငါ အလုပ်လုပ်နိုင်မယ့် နောက်ထပ် တစ်ရက်ပဲ။', en: 'Every jar is one more day I can work.', need: 'afraid', face: 'worried' },
    ] },
    { lines: [
      { my: 'ကလေးတွေ မင်လာတောင်းကြတယ်။ မရှိဘူးလို့ ငါ ပြောလိုက်တယ်။ သူတို့ဘာသာ ရှာကြပါစေ။', en: 'The children came asking for ink. I said there was none. Let them find their own.', need: 'unknown', seems: 'looksdown', face: 'think',
        tell: { my: 'အထင်သေးတာ မဟုတ်ဘူး။ တံခါးဝက မိုးမိုးရဲ့ အိုးအလွတ်လေးကို လှမ်းလှမ်းကြည့်လိုက်၊ အကြည့်လွှဲလိုက် လုပ်နေတယ်။ သူ သေချာ မစဉ်းစားမိသေးတာ။', en: "Not contempt. She keeps glancing at Moe Moe's empty pot in the doorway, then away. She hasn't thought it through." } },
      { my: 'ငါ့စင်ပေါ်မှာ စဉ့်အိုးတစ်လုံး ရှိနေတာ ဘယ်သူ့ကိုမှ မထိခိုက်ပါဘူး။', en: 'A jar on my own shelf hurts nobody.', need: 'unknown', face: 'think' },
    ] },
    { lines: [
      { my: 'အခု လူတွေက ငါ့ကို လောဘကြီးတယ်လို့ ပြောနေကြပြီ။ မာရာ ပြောတဲ့အတိုင်းပဲ ငါ လုပ်ခဲ့တာလေ။', en: 'Now people are calling ME greedy! I only did what Maya said!', need: 'hot', face: 'hot', steam: 1, heard: true,
        tell: { my: 'မာရာ့ကို စိတ်ဆိုးနေတာ မဟုတ်ဘူး။ ရှက်နေတာ။ ပါးတွေ ရဲနေပြီ။', en: "She isn't angry at Maya. She's ashamed. Her cheeks are red." } },
    ] },
    { lines: [
      { my: 'ဒါဆို… စဉ့်အိုးတွေ ပြန်ပေးရမလား၊ သိမ်းထားရမလား။ ပြောပြပါဦး မာရာ။ နင်က အသိဆုံးပဲလေ။', en: 'So… do I give the jars back or keep them? Tell me, Maya. You know best.', need: 'own', face: 'think',
        tell: { my: 'သူ အခု အဖြေ မလိုချင်ဘူး။ ရေတွင်းကို ကြည့်ပြီး သူ့ဘာသာ ချိန်ဆနေတာ။ ဒါ သူ့ကျောက်တုံးပဲ။', en: "She doesn't need an answer now. She's looking at the well, weighing it herself. Her stone." } },
      { my: 'ပြောသာပြောလိုက်ပါ… ငါ လုပ်ပါ့မယ်။', en: "Just say it… I'll do it.", need: 'own', face: 'worried' },
    ] },
  ],
  react: {
    miss: { my: '…ဟင်? အဲဒါ မင်နဲ့ ဘာဆိုင်လို့လဲ။', en: '…Huh? What has that to do with ink?' },
    hot: { my: '(မသီတာ စဉ့်အိုးတွေကို ဖက်ထားတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(Ma Thida is hugging the jars. Nothing gets through.)' },
    lean: { my: 'ဟုတ်ကဲ့… မာရာ ပြောတဲ့အတိုင်း လုပ်ပါ့မယ်။ (ဒါ သူ့ဆုံးဖြတ်ချက် မဟုတ်တော့ဘူး။)', en: "Okay… I'll do what Maya says. (It isn't her decision any more.)" },
  },
  decision: [
    { my: 'တစ်အိုးပဲ သိမ်းထားမယ်။ ဒီအပတ် စာရေးဖို့အတွက်။ ကျန်တာတွေ ရေတွင်းထဲ ပြန်ထည့်လိုက်မယ်။', en: "I'll keep one jar. For this week's letters. The rest go back in the well.", face: 'think' },
    { my: 'ပြီးတော့ မနက်ဖြန်ကျရင် ရေတွင်းထဲကို ငါ့ဘာသာ ပြန်ကြည့်မယ်။ မာရာ ပြောလို့ မဟုတ်ဘဲနဲ့ပေါ့။', en: "And tomorrow I'll look in the well again myself. Not because Maya said so.", face: 'happy' },
  ],
};
