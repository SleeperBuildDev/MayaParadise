// Day 3 talks (talk.js format). Every Burmese line is a draft for Maya to proofread.
//
//   TALK_D3_SUNWE   ch 9 · Su Nwe at her classroom desk. Starts HOT (three wisps): Day 3 is where heat is
//                   taught (listen first). Two look-alikes: `rude` (fault-finding) and `wouldnt` (talking
//                   down that passes for help; it leaves the hand for good tonight).
//   TALK_D3_NAYCHI  main quest · Nay Chi at the window table of the border tea shop. Her last stone is hers,
//                   but Step back does not exist yet (noStepBack): on it Maya holds only her own answers
//                   (handAt), so the only way through is to answer for her (a warm lean, leanEnd 'thanks').
//
// Card gates (save.js testFlags): `notyet` after the classroom hook (d3.hook9), `price` after the four looks
// (d3.looked9), `sorted` after the morning post (d3.card.sorted), the parrot's `why` once the Why-Parrot is
// out, the Black Sheep's `once` once the sheep is out.

export const D3_SN_CARDS = [
  { id: 'notyet', flag: 'd3.hook9', name: { my: 'သူ မသိသေးတာ', en: "He doesn't know yet" },
    line: { my: 'သူ အမှတ်စာရွက် တစ်ခါမှ မမြင်ဖူးဘူး။ မသိလို့ ပြောတာ။ သိအောင် ပြပေးရင် ရတယ်။', en: "He's never seen a marks sheet. He said it because he didn't know. You could show him." },
    answers: ['unknown', 'looksdown'], from: { my: 'မောင်ငယ် ကိုယ်တိုင် ပြောခဲ့တာ', en: 'from Maung Nge himself' } },
  { id: 'price', flag: 'd3.looked9', name: { my: 'ဘယ်သူမှ အကုန်မရ', en: 'Nobody gets everything' },
    line: { my: 'စုနွယ့်ညတွေက အမှတ်ဖြစ်လာတယ်။ သူ့နေ့တွေက ဖောင်နဲ့ လှေဖြစ်လာတယ်။ တစ်ခုရဖို့ တစ်ခု ပေးရတာပဲ။', en: 'Your nights became your marks. His days became the raft and his boats. Each thing costs something.' },
    answers: ['envy', 'looksdown'], from: { my: 'နှစ်ယောက်လုံးကို ကြည့်ပြီး ရခဲ့တာ', en: 'from looking at them both' } },
  { id: 'wouldnt', lookalike: true, name: { my: 'နားလည်မှာ မဟုတ်ပါဘူး', en: "You Wouldn't Understand" }, // leaves the hand for good tonight
    line: { my: 'ပါဆယ်တွေကို သူ့ကိုယ်စား ဖတ်ပေးလိုက်ရုံပဲ။ သူ နားလည်မှာ မဟုတ်ပါဘူး။', en: "Just read the parcels for him. He wouldn't understand anyway." },
    shows: ['unknown'], really: { my: 'ကူညီသလိုနဲ့ နှိမ့်ချတာ', en: 'talking down that passes for help' },
    backfire: { they: { my: 'ဟုတ်တယ်မလား။ အစ်မတောင် အဲဒီလို ထင်တာပဲ။ ဒါဆို ဘာလို့ ပင်ပန်းခံမှာလဲ။', en: 'Right? Even you think so. Then why bother?' },
                maya: { my: '(ကူညီမယ်ဆိုပြီး သူ့ကို နှိမ့်ချပြောမိပြီ။ သူ မသိသေးတာ၊ မသိနိုင်တာ မဟုတ်ဘူး။)', en: "(Meaning to help, I talked down to him. He doesn't know yet. It isn't that he can't.)" } } },
  { id: 'why', onlyIf: 'companion:parrot', name: { my: 'ဘာကြောင့်လဲ', en: 'Why?' }, // the Why-Parrot: a new question in every talk
    line: { my: 'သူ ဘာလို့ ထုပ်ပိုးစက္ကူ လိုချင်တာလဲ၊ စဉ်းစားကြည့်ဖူးလား။', en: 'Have you wondered why he wanted wrapping paper?' },
    answers: ['unknown'], from: { my: 'ဘာကြောင့်ကြက်တူရွေး', en: 'the Why-Parrot' } },
  { id: 'once', onlyIf: 'companion:sheep', name: { my: 'နောက်တစ်ခါ', en: 'Once more' }, // the Black Sheep
    line: { my: 'ပထမတစ်ခါ မရလည်း ရပါတယ်။ နောက်တစ်ခါ ထပ်ပြရုံပဲ။', en: "If he doesn't get it the first time, that's fine. You just show him once more." },
    answers: ['given', 'afraid'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'rude', lookalike: true, name: { my: 'သူ ရိုင်းတာ', en: 'He was rude' },
    line: { my: 'သူ ရိုင်းတာပဲ။ ဂရုမစိုက်နဲ့။', en: 'He was just rude. Pay him no mind.' },
    shows: ['hot', 'looksdown'], really: { my: 'မသိသေးတဲ့သူကို အပြစ်ရှာတာ', en: "finding fault in someone who doesn't know yet" },
    backfire: { they: { my: 'အင်း၊ ရိုင်းတယ်။ ဒါကြောင့် ငါတို့နဲ့ မတူတာ။', en: "Yes, rude. That's why he's not like us." },
                maya: { my: '(အပြစ်ရှာလိုက်တော့ သူ့စိတ်ထဲက နံရံ ပိုမြင့်သွားတယ်။)', en: '(I found fault, and the wall inside her went up higher.)' } } },
];

export const TALK_D3_SUNWE = {
  id: 'd3-sunwe',
  person: 'sunwe',
  with: ['maungnge', 'hninwai'],
  steam: 3, calm: 4, turns: 8, // starts hot: two Listens before any card can enter the ear
  hand: D3_SN_CARDS,
  tutorial: [
    { at: 'steam', my: 'စုနွယ့်ခွက်က ငွေ့ သုံးကြောင်း တက်နေတယ်။ ပူနေသရွေ့ ဘယ်စကားမှ နားထဲ မဝင်ဘူး။ အရင် နားထောင်ပေးပါ။', en: "Su Nwe's cup shows three wisps. While she's hot, no words enter the ear. Listen first." },
  ],
  stones: [
    { lines: [
      { my: 'သူက ကျွန်မ အမှတ်စာရွက်ကို ထုပ်ပိုးစက္ကူတဲ့။ ကျွန်မတို့နဲ့ အဆင့်အတန်း မတူဘူး။', en: 'He called my marks sheet wrapping paper. He is not on our level.', need: 'hot', seems: 'looksdown', face: 'hot',
        tell: { my: 'အထင်သေးတာထက် နာနေတာ။ နားရွက်လေးတွေ နီနေတယ်။ လှောင်ခံရတယ် ထင်နေတာ။', en: 'More hurt than scornful. Her ears are red. She thinks she was mocked.' } },
      { my: 'တစ်တန်းလုံး ကျက်ပြီး ရခဲ့တဲ့ စာရွက်လေ။', en: 'I studied all term for that sheet.', need: 'hot', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'အမှတ်စာရွက်ဆိုတာ ဘာလဲတောင် မသိတဲ့သူနဲ့ ဘာလို့ အချိန်ကုန်ခံရမှာလဲ။', en: "Why waste time on someone who doesn't even know what a marks sheet is?", need: 'unknown', seems: 'looksdown', face: 'think',
        tell: { my: 'သူ အမှတ်စာရွက် တစ်ခါမှ မမြင်ဖူးဘူးဆိုတာ စုနွယ် မသိဘူး။ စာရွက်ကို ဇောက်ထိုး ကိုင်ခဲ့တာ သတိမထားမိခဲ့ဘူး။', en: "She doesn't know he had never seen a marks sheet. She didn't notice he held it upside down." } },
      { my: 'ပါဆယ်ပေါ်က စာလုံးတောင် မသိဘူး။', en: "He doesn't even know the letters on his own parcels.", need: 'looksdown', face: 'hot',
        tell: { my: 'ဒီတစ်ကြောင်းကတော့ တကယ် အထင်သေးတာ။ သူ မသိတာ လူရှေ့မှာ တစ်ခါမှ မဖြစ်ဖူးဘူး။', en: 'This one really is looking down. She has never once not known something in front of people.' } },
    ] },
    { lines: [
      { my: 'သူ့နေ့တွေက လှေခေါက်၊ ဆော့ပဲ။ ကျွန်မက ည ၁ နာရီထိ စာကျက်ရတယ်။', en: 'His days are boats and play. I study till one in the morning.', need: 'envy', seems: 'looksdown', face: 'sad',
        tell: { my: 'သူ့လှည်းပေါ်က လှေလေးတွေကို ခိုးကြည့်နေတယ်။ ဒီတစ်တန်းလုံး နေ့ခင်း တစ်ခါမှ မအားခဲ့ဘူး။', en: "She keeps stealing looks at the boats on his cart. She hasn't had one free afternoon all term." } },
    ] },
    { lines: [
      { my: 'ကျွန်မ သင်ပေးလို့ သူ မရရင်… ကျွန်မ ညံ့လို့ပဲလို့ လူတွေ ပြောမှာ။', en: "If I teach him and he doesn't get it… people will say it's because I'm no good.", need: 'afraid', seems: 'hot', face: 'worried',
        tell: { my: 'စိတ်တိုတာ မဟုတ်ဘူး။ ထိပ်ဆုံးက ကလေးက လူရှေ့မှာ မအောင်မြင်မှာကို ကြောက်နေတာ။', en: 'Not cross. The top pupil is afraid of failing in front of people.' } },
      { my: 'ကျွန်မ ဘယ်သူ့ကိုမှ မသင်ဖူးဘူး။', en: "I've never taught anyone.", need: 'afraid', face: 'worried', heard: true },
    ] },
  ],
  react: {
    miss: { my: '…ဘာပြောတာလဲ။', en: '…What?' },
    hot: { my: '(စုနွယ် အမှတ်စာရွက်ကို ရင်ခွင်ထဲ ဖိထားတယ်။ ဘာမှ မကြားဘူး။)', en: '(Su Nwe holds the sheet against her chest. Nothing gets through.)' },
  },
  decision: [
    { my: 'ပြပေးမယ်။ ကျွန်မ ခဲတံက စာလုံးအောက်မှာ၊ သူ့လက်ချောင်းက နောက်ကနေ။ သူ့အမြန်နှုန်းနဲ့။', en: "I'll show him. My pencil under the letters, his finger after it. At his speed.", face: 'think' },
    { my: 'နောက်ဆုံး တစ်ထုပ်ကိုတော့ သူ ကိုယ်တိုင် ဖတ်ပါစေ။', en: 'And the last parcel he reads by himself.', face: 'happy' },
  ],
};

export const D3_NC_CARDS = [
  { id: 'why', onlyIf: 'companion:parrot', name: { my: 'ဘာကြောင့်လဲ', en: 'Why?' }, // a different question from Su Nwe's
    line: { my: 'စာရွက်နှစ်ရွက်လုံး ဘာလို့ သိမ်းထားတာလဲ။ တစ်ခုစီမှာ ဘာက ဆွဲဆောင်လဲ။', en: 'Why keep both papers? What pulls you to each one?' },
    answers: ['unknown'], from: { my: 'ဘာကြောင့်ကြက်တူရွေး', en: 'the Why-Parrot' } },
  { id: 'sorted', flag: 'd3.card.sorted', name: { my: 'စာခွဲတဲ့အခါ', en: 'When you sort the post' },
    line: { my: 'စာတွေကို အစီအစဉ်တကျ ခွဲရရင် နေခြည် အရမ်းပျော်တယ်လို့ မဝင့်ဝါ ပြောတယ်။', en: 'Ma Wint War says you light up when you get letters into order.' },
    answers: ['unknown'], from: { my: 'မဝင့်ဝါ ပြောခဲ့တာ', en: 'from Ma Wint War' } },
  { id: 'once', onlyIf: 'companion:sheep', name: { my: 'နောက်တစ်ခါ', en: 'Once more' }, // the Black Sheep
    line: { my: 'မှားရင်လည်း ပြန်ပြင်လို့ ရတယ်။ နောက်တစ်ခါ ထပ်ကြိုးစားရုံပဲ။', en: 'If it turns out wrong, you can put it right. You just try once more.' },
    answers: ['given', 'afraid'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  // Maya's own answers. On stones 0-1 they answer nothing (a plain miss: she isn't asking yet).
  // On stone 2 they are the whole hand (handAt): playing one answers for her.
  { id: 'shed', name: { my: 'ပုံနှိပ်တဲ', en: 'The printing shed' },
    line: { my: 'ပုံနှိပ်တဲကို ယူလိုက်။ စာလုံးတွေ အစီအစဉ်တကျ စီရတာ နေခြည်နဲ့ လိုက်တယ်။', en: 'Take the printing shed. Setting letters in rows suits you.' },
    answers: [], leanLine: { my: 'ပုံနှိပ်တဲ! ဒါဆို ပြီးပြီ။ မာရာ ပြောတာပဲ၊ မှားမှာ မဟုတ်ဘူး။', en: "The shed! Then it's settled. Maya said so. It can't be wrong." } },
  { id: 'square', name: { my: 'ကြော်ငြာကွင်း', en: 'The notice square' },
    line: { my: 'ကြော်ငြာကွင်းကို ယူလိုက်။ လူတွေကြားမှာ နေရတာ နေခြည် ကြိုက်တယ်မလား။', en: "Take the notice square. You like being among people, don't you?" },
    answers: [], leanLine: { my: 'ကြော်ငြာကွင်း! ဒါဆို ပြီးပြီ။ မာရာ ပြောတာပဲ၊ မှားမှာ မဟုတ်ဘူး။', en: "The square! Then it's settled. Maya said so. It can't be wrong." } },
];

export const TALK_D3_NAYCHI = {
  id: 'd3-naychi',
  person: 'naychi',
  steam: 1, calm: 4, turns: 7,
  theirs: [2], // the last stone is hers
  noStepBack: true, // Days 1-7: the Step back button is not drawn
  handAt: { 2: ['shed', 'square'] }, // on her stone Maya holds only her own answers
  leanEnd: 'thanks', // a lean ends warmly, no "not yet" panel; a pencil smudge on her signpost
  hand: D3_NC_CARDS,
  stones: [
    { lines: [
      { my: 'ပုံနှိပ်တဲက စာစီ အလုပ်သင် လိုတယ်။ ကြော်ငြာကွင်းက သတင်းကပ်သူ လိုတယ်။ နှစ်ခုလုံး တံတားဖွင့်မှ စမယ်။', en: 'The printing shed wants an apprentice typesetter. The notice square wants someone to paste up the news. Both start when the bridge opens.', need: 'unknown', face: 'think',
        tell: { my: 'စာရွက်နှစ်ရွက်လုံး ထောင့်တွေ နူးနေပြီ။ အကြိမ်ကြိမ် ပြန်ဖတ်ထားတာ။', en: 'Both papers have gone soft at the corners. She has read them over and over.' } },
      { my: 'တဲက မင်နံ့ကို ကြိုက်တယ်… ကွင်းထဲက လူတွေကိုလည်း ကြိုက်တယ်…', en: 'I like the smell of ink at the shed… and I like the people in the square…', need: 'unknown', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'အမေက ကွင်းက စိတ်ချရတယ်တဲ့။ သူငယ်ချင်းက တဲက ပိုကောင်းတယ်တဲ့။ လူတိုင်းမှာ အဖြေရှိတယ်။ ကျွန်မမှာပဲ မရှိဘူး။', en: 'Mum says the square is safer. My friend says the shed is better. Everyone has an answer except me.', need: 'afraid', seems: 'cling', face: 'worried',
        tell: { my: 'အမေ့စကားကို တွယ်ထားတာ မဟုတ်ဘူး။ မှားရွေးမိမှာ ကြောက်နေတာ။ စာရွက်တွေကို သေးသေးလေး ခေါက်နေတယ်။', en: "She isn't clinging to her mother's word. She's afraid of choosing wrong. She keeps folding the papers smaller." } },
      { my: 'မှားရွေးမိရင် ပြန်ပြင်လို့ ရမှာ မဟုတ်ဘူး။', en: "If I pick wrong, there's no putting it right.", need: 'afraid', face: 'sad' },
    ] },
    { lines: [
      { my: 'အစ်မက နေရာတိုင်း ရောက်ဖူးတယ်။ ဘယ်ဟာလဲ ပြောလိုက်ပါ။ မာရာ ပြောတဲ့အတိုင်း လုပ်မယ်။', en: "Sister, you've been everywhere. Just tell me which. I'll do whatever Maya says.", need: 'own', seems: 'unknown', face: 'happy',
        tell: { my: 'သူ့လက်မက ပုံနှိပ်တဲ စာရွက်ကို တဖြည်းဖြည်း သပ်နေတယ်။ တစ်စိတ်တစ်ပိုင်းက ရွေးပြီးသား။', en: 'Her thumb keeps smoothing the shed notice. Part of her has already chosen.' } }, // for Day 11
    ] },
  ],
  react: {
    miss: { my: '…ဟုတ်လား။ ဒါပေမဲ့ ဘယ်ဟာလဲ မသိသေးဘူး။', en: "…Really? But I still don't know which." },
    hot: { my: '(နေခြည် စာရွက်တွေကို ခေါက်ပြီး ခေါက်ပြီး လုပ်နေတယ်။ ဘာမှ မကြားဘူး။)', en: '(Nay Chi folds the papers again and again. Nothing gets through.)' },
    lean: { my: 'ဒါဆို အဲဒါပဲ! မာရာ ပြောတာဆို စိတ်ချတယ်။', en: "Then that's the one! If Maya says so, I'm sure." },
  },
  decision: [], // never reached on Day 3: her signpost waits for Day 11
};
