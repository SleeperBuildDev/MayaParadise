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
  { id: 'notyet', flag: 'd3.hook9', name: { my: 'သူ မသိသေးဘူး', en: "He doesn't know yet" },
    line: { my: 'သူ အမှတ်စာရင်းကို တစ်ခါမှ မမြင်ဖူးဘူး။ မသိလို့ ပြောလိုက်တာပါ။ နင် ပြပေးလိုက်လို့ ရတာပဲ။', en: "He's never seen a marks sheet. He said it because he didn't know. You could show him." },
    answers: ['unknown', 'looksdown'], from: { my: 'မောင်ငယ် ကိုယ်တိုင်ဆီက', en: 'from Maung Nge himself' } },
  { id: 'price', flag: 'd3.looked9', name: { my: 'အရာအားလုံးကို ဘယ်သူမှ မရနိုင်ဘူး', en: 'Nobody gets everything' },
    line: { my: 'နင့်ညတွေက အမှတ်စာရင်း ဖြစ်လာတယ်။ သူ့နေ့ရက်တွေက ဖောင်တွေ၊ လှေတွေ ဖြစ်လာတယ်။ အရာတိုင်းမှာ ပေးဆပ်ရတာ ရှိစမြဲပဲ။', en: 'Your nights became your marks. His days became the raft and his boats. Each thing costs something.' },
    answers: ['envy', 'looksdown'], from: { my: 'နှစ်ယောက်စလုံးကို ကြည့်မိရာက', en: 'from looking at them both' } },
  { id: 'wouldnt', lookalike: true, name: { my: 'နင် နားလည်မှာ မဟုတ်ပါဘူး', en: "You Wouldn't Understand" }, // leaves the hand for good tonight
    line: { my: 'သူ့ပါဆယ်ထုပ်တွေကိုပဲ ဖတ်ပြလိုက်ပါ။ သူ နားလည်မှာ မဟုတ်ပါဘူး။', en: "Just read the parcels for him. He wouldn't understand anyway." },
    shows: ['unknown'], really: { my: 'ကူညီသလိုလိုနဲ့ အထင်သေးမိတာ', en: 'talking down that passes for help' },
    backfire: { they: { my: 'ဟုတ်တယ်မလား။ နင်တောင် အဲဒီလို ထင်တယ်မလား။ ဒါဆို ဘာလို့ အပင်ပန်းခံနေတော့မလဲ။', en: 'Right? Even you think so. Then why bother?' },
                maya: { my: '(ကူညီချင်စိတ်နဲ့ သူ့ကို အထင်သေးသလို ပြောမိပြီ။ သူ မသိသေးတာပဲ ရှိတာ။ မလုပ်နိုင်တာ မဟုတ်ဘူး။)', en: "(Meaning to help, I talked down to him. He doesn't know yet. It isn't that he can't.)" } } },
  { id: 'why', onlyIf: 'companion:parrot', name: { my: 'ဘာလို့လဲ', en: 'Why?' }, // the Why-Parrot: a new question in every talk
    line: { my: 'သူ ဘာလို့ ထုပ်ပိုးစက္ကူ လိုချင်တာလဲလို့ နင် တွေးကြည့်ဖူးလား။', en: 'Have you wondered why he wanted wrapping paper?' },
    answers: ['unknown'], from: { my: 'ဘာလို့လဲ ကြက်တူရွေးလေး', en: 'the Why-Parrot' } },
  { id: 'once', onlyIf: 'companion:sheep', name: { my: 'နောက်တစ်ခေါက်', en: 'Once more' }, // the Black Sheep
    line: { my: 'ပထမတစ်ခေါက်မှာ သူ နားမလည်လည်း ကိစ္စမရှိဘူး။ နောက်တစ်ခေါက် ထပ်ပြပေးလိုက်ရုံပဲ။', en: "If he doesn't get it the first time, that's fine. You just show him once more." },
    answers: ['given', 'afraid'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'rude', lookalike: true, name: { my: 'သူ ရိုင်းလိုက်တာ', en: 'He was rude' },
    line: { my: 'သူ သက်သက် ရိုင်းတာပါ။ စိတ်ထဲ မထားပါနဲ့။', en: 'He was just rude. Pay him no mind.' },
    shows: ['hot', 'looksdown'], really: { my: 'မသိသေးတဲ့သူကို အပြစ်တင်မိတာ', en: "finding fault in someone who doesn't know yet" },
    backfire: { they: { my: 'ဟုတ်တယ်၊ ရိုင်းတယ်။ အဲဒါကြောင့် သူက ငါတို့နဲ့ မတူတာ။', en: "Yes, rude. That's why he's not like us." },
                maya: { my: '(ငါ အပြစ်တင်မိတော့ သူ့ရင်ထဲက တံတိုင်းက ပိုမြင့်သွားပြီ။)', en: '(I found fault, and the wall inside her went up higher.)' } } },
];

export const TALK_D3_SUNWE = {
  id: 'd3-sunwe',
  person: 'sunwe',
  with: ['maungnge', 'hninwai'],
  steam: 3, calm: 4, turns: 8, // starts hot: two Listens before any card can enter the ear
  hand: D3_SN_CARDS,
  tutorial: [
    { at: 'steam', my: 'စုနွယ်ရဲ့ ခွက်ထဲက အငွေ့သုံးမျှင် ထွက်နေပြီ။ သူ ဒေါသထွက်နေတုန်း ဘာပြောပြော နားထဲ မဝင်ဘူး။ အရင် နားထောင် ပေးလိုက်ပါ။', en: "Su Nwe's cup shows three wisps. While she's hot, no words enter the ear. Listen first." },
  ],
  stones: [
    { lines: [
      { my: 'ငါ့အမှတ်စာရင်းကို သူက ထုပ်ပိုးစက္ကူတဲ့။ သူက ငါတို့နဲ့ တစ်တန်းတည်း မဟုတ်ဘူး။', en: 'He called my marks sheet wrapping paper. He is not on our level.', need: 'hot', seems: 'looksdown', face: 'hot',
        tell: { my: 'အထင်သေးတာထက် စိတ်နာသွားတာ ပိုများတယ်။ နားရွက်တွေ ရဲနေပြီ။ အလှောင်ခံရတယ်လို့ ထင်နေတာ။', en: 'More hurt than scornful. Her ears are red. She thinks she was mocked.' } },
      { my: 'အဲဒီစာရွက်ရဖို့ ငါ တစ်နှစ်ပတ်လုံး စာကြိုးစားခဲ့ရတာ။', en: 'I studied all term for that sheet.', need: 'hot', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'အမှတ်စာရင်းဆိုတာ ဘာမှန်းတောင် မသိတဲ့သူအတွက် ဘာလို့ အချိန်ဖြုန်းနေမှာလဲ။', en: "Why waste time on someone who doesn't even know what a marks sheet is?", need: 'unknown', seems: 'looksdown', face: 'think',
        tell: { my: 'သူ အမှတ်စာရင်းကို တစ်ခါမှ မမြင်ဖူးမှန်း စုနွယ် မသိဘူး။ ဇောက်ထိုးကြီး ကိုင်ထားတာကိုလည်း သတိမထားမိဘူး။', en: "She doesn't know he had never seen a marks sheet. She didn't notice he held it upside down." } },
      { my: 'သူ့ပါဆယ်ထုပ်ပေါ်က စာလုံးတွေကိုတောင် သူ မဖတ်တတ်ဘူး။', en: "He doesn't even know the letters on his own parcels.", need: 'looksdown', face: 'hot',
        tell: { my: 'ဒီတစ်ယောက်ကတော့ တကယ် အထင်သေးနေတာ။ သူက လူရှေ့မှာ တစ်ခါမှ မသိတာ မရှိခဲ့ဖူးဘူးလေ။', en: 'This one really is looking down. She has never once not known something in front of people.' } },
    ] },
    { lines: [
      { my: 'သူ့နေ့ရက်တွေက လှေတွေနဲ့ ကစားဖို့ချည်းပဲ။ ငါက မနက်တစ်နာရီအထိ စာကျက်ရတာ။', en: 'His days are boats and play. I study till one in the morning.', need: 'envy', seems: 'looksdown', face: 'sad',
        tell: { my: 'သူ့လှည်းပေါ်က လှေလေးတွေကို ခိုးခိုးကြည့်နေတယ်။ စုနွယ်မှာ တစ်နှစ်လုံး နေ့လယ်ခင်း အားလပ်ချိန် တစ်ရက်မှ မရှိခဲ့ဘူး။', en: "She keeps stealing looks at the boats on his cart. She hasn't had one free afternoon all term." } },
    ] },
    { lines: [
      { my: 'ငါ သင်ပေးပြီး သူ မတတ်ရင်… ငါ မတော်လို့လို့ လူတွေက ပြောကြမှာ။', en: "If I teach him and he doesn't get it… people will say it's because I'm no good.", need: 'afraid', seems: 'hot', face: 'worried',
        tell: { my: 'စိတ်တိုနေတာ မဟုတ်ဘူး။ အတော်ဆုံးကျောင်းသူက လူရှေ့မှာ မအောင်မြင်မှာကို ကြောက်နေတာ။', en: 'Not cross. The top pupil is afraid of failing in front of people.' } },
      { my: 'ငါ ဘယ်သူ့ကိုမှ စာမသင်ပေးဖူးဘူး။', en: "I've never taught anyone.", need: 'afraid', face: 'worried', heard: true },
    ] },
  ],
  react: {
    miss: { my: '…ဘာ?', en: '…What?' },
    hot: { my: '(စုနွယ် အမှတ်စာရင်းကို ရင်ဘတ်မှာ ကပ်ထားတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(Su Nwe holds the sheet against her chest. Nothing gets through.)' },
  },
  decision: [
    { my: 'ငါ ပြပေးမယ်။ စာလုံးတွေအောက်မှာ ငါ့ခဲတံထားမယ်၊ သူ့လက်ညှိုးက နောက်ကလိုက်မယ်။ သူ လိုက်နိုင်တဲ့ အရှိန်အတိုင်းပဲ။', en: "I'll show him. My pencil under the letters, his finger after it. At his speed.", face: 'think' },
    { my: 'ပြီးတော့ နောက်ဆုံး ပါဆယ်ထုပ်ကို သူ့ဘာသာ ဖတ်လိမ့်မယ်။', en: 'And the last parcel he reads by himself.', face: 'happy' },
  ],
};

export const D3_NC_CARDS = [
  { id: 'why', onlyIf: 'companion:parrot', name: { my: 'ဘာလို့လဲ', en: 'Why?' }, // a different question from Su Nwe's
    line: { my: 'စာရွက်နှစ်ခုလုံးကို ဘာလို့ သိမ်းထားတာလဲ။ တစ်ခုချင်းစီက မင်းကို ဘာဆွဲဆောင်နေတာလဲ။', en: 'Why keep both papers? What pulls you to each one?' },
    answers: ['unknown'], from: { my: 'ဘာလို့လဲ ကြက်တူရွေးလေး', en: 'the Why-Parrot' } },
  { id: 'sorted', flag: 'd3.card.sorted', name: { my: 'စာတွေ စီတဲ့အခါ', en: 'When you sort the post' },
    line: { my: 'မဝင့်ဝါ ပြောတယ်၊ မင်း စာတွေကို စနစ်တကျ စီနေရရင် မျက်နှာလေး ဝင်းလက်နေတာပဲတဲ့။', en: 'Ma Wint War says you light up when you get letters into order.' },
    answers: ['unknown'], from: { my: 'မဝင့်ဝါဆီက', en: 'from Ma Wint War' } },
  { id: 'once', onlyIf: 'companion:sheep', name: { my: 'နောက်တစ်ခေါက်', en: 'Once more' }, // the Black Sheep
    line: { my: 'မှားသွားရင် ပြန်ပြင်လို့ ရတာပဲ။ နောက်တစ်ခေါက် ထပ်ကြိုးစားကြည့်ရုံပေါ့။', en: 'If it turns out wrong, you can put it right. You just try once more.' },
    answers: ['given', 'afraid'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  // Maya's own answers. On stones 0-1 they answer nothing (a plain miss: she isn't asking yet).
  // On stone 2 they are the whole hand (handAt): playing one answers for her.
  { id: 'shed', name: { my: 'ပုံနှိပ်တဲလေး', en: 'The printing shed' },
    line: { my: 'ပုံနှိပ်တဲလေးကိုပဲ ရွေးလိုက်ပါ။ ခဲစာလုံးလေးတွေ အတန်းလိုက် စီရတာ မင်းနဲ့ လိုက်ဖက်တယ်။', en: 'Take the printing shed. Setting letters in rows suits you.' },
    answers: [], leanLine: { my: 'ပုံနှိပ်တဲလေးပေါ့။ ဒါဆို သေချာသွားပြီ။ မာရာ ပြောတာပဲ။ မမှားနိုင်ပါဘူး။', en: "The shed! Then it's settled. Maya said so. It can't be wrong." } },
  { id: 'square', name: { my: 'ကြော်ငြာရင်ပြင်', en: 'The notice square' },
    line: { my: 'ကြော်ငြာရင်ပြင်ကိုပဲ ရွေးလိုက်ပါ။ မင်းက လူတွေကြားထဲ နေရတာ ကြိုက်တယ် မဟုတ်လား။', en: "Take the notice square. You like being among people, don't you?" },
    answers: [], leanLine: { my: 'ကြော်ငြာရင်ပြင်ပေါ့။ ဒါဆို သေချာသွားပြီ။ မာရာ ပြောတာပဲ။ မမှားနိုင်ပါဘူး။', en: "The square! Then it's settled. Maya said so. It can't be wrong." } },
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
      { my: 'ပုံနှိပ်တဲလေးက စာစီအလုပ်သင် လိုချင်နေတယ်။ ကြော်ငြာရင်ပြင်က သတင်းကပ်ဖို့ လူလိုနေတယ်။ နှစ်ခုစလုံး တံတားဖွင့်ရင် စမယ်။', en: 'The printing shed wants an apprentice typesetter. The notice square wants someone to paste up the news. Both start when the bridge opens.', need: 'unknown', face: 'think',
        tell: { my: 'စာရွက်နှစ်ခုစလုံး ထောင့်တွေတောင် ပျော့နေပြီ။ သူ အထပ်ထပ်အခါခါ ဖတ်ထားတာ။', en: 'Both papers have gone soft at the corners. She has read them over and over.' } },
      { my: 'ပုံနှိပ်တဲက မင်နံ့လေးကို ကြိုက်တယ်… ရင်ပြင်က လူတွေကိုလည်း ကြိုက်တယ်…', en: 'I like the smell of ink at the shed… and I like the people in the square…', need: 'unknown', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'အမေက ရင်ပြင်က ပိုစိတ်ချရတယ်တဲ့။ သူငယ်ချင်းက ပုံနှိပ်တဲက ပိုကောင်းတယ်တဲ့။ ကျွန်မကလွဲရင် အားလုံးမှာ အဖြေရှိနေကြတယ်။', en: 'Mum says the square is safer. My friend says the shed is better. Everyone has an answer except me.', need: 'afraid', seems: 'cling', face: 'worried',
        tell: { my: 'သူ့အမေစကားကို တွယ်ကပ်နေတာ မဟုတ်ဘူး။ အရွေးမှားမှာကို ကြောက်နေတာ။ စာရွက်တွေကို သေးသေးလေးဖြစ်အောင် ထပ်ခါထပ်ခါ ခေါက်နေတယ်။', en: "She isn't clinging to her mother's word. She's afraid of choosing wrong. She keeps folding the papers smaller." } },
      { my: 'ကျွန်မ အရွေးမှားသွားရင် ပြန်ပြင်လို့ မရတော့ဘူး။', en: "If I pick wrong, there's no putting it right.", need: 'afraid', face: 'sad' },
    ] },
    { lines: [
      { my: 'အစ်မ၊ အစ်မက နေရာစုံ ရောက်ဖူးတာပဲ။ ဘယ်ဟာ ရွေးရမလဲ ပြောပြပါ။ မာရာ ပြောတဲ့အတိုင်း ကျွန်မ လုပ်ပါ့မယ်။', en: "Sister, you've been everywhere. Just tell me which. I'll do whatever Maya says.", need: 'own', seems: 'unknown', face: 'happy',
        tell: { my: 'သူ့လက်မက ပုံနှိပ်တဲ ကြော်ငြာစာရွက်ကိုပဲ ပွတ်သပ်နေတယ်။ သူ့စိတ်တစ်ပိုင်းက ရွေးပြီးနေပြီ။', en: 'Her thumb keeps smoothing the shed notice. Part of her has already chosen.' } }, // for Day 11
    ] },
  ],
  react: {
    miss: { my: '…တကယ်လား။ ဒါပေမဲ့ ကျွန်မ ဘယ်ဟာ ရွေးရမလဲ မသိသေးဘူး။', en: "…Really? But I still don't know which." },
    hot: { my: '(နေခြည် စာရွက်တွေကို ထပ်ခါထပ်ခါ ခေါက်နေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(Nay Chi folds the papers again and again. Nothing gets through.)' },
    lean: { my: 'ဒါဆို အဲဒါပဲပေါ့။ မာရာ ပြောတာဆိုရင် ကျွန်မ သေချာသွားပြီ။', en: "Then that's the one! If Maya says so, I'm sure." },
  },
  decision: [], // never reached on Day 3: her signpost waits for Day 11
};
