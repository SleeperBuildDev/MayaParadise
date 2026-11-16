// Day 10's talks (day10-spec 5.7, 6.6, 8.2). Format: the top of js/story/talk.js. Burmese lines are drafts
// for Maya to proofread.
//
//   TALK_D10_HPOHTAW  ch 16 at his gate: hot / cling / unknown, then the gate is his (stone 3: Step back)
//   TALK_D10_KOPHYO   ch 17 at the tea shop's window table: stones 2 and 4 are his (Day 8 on: the stone that
//                     is theirs is not always the last)
//   TALK_D10_KAUNG    the main beat in the packing room: both stones his; every card is a kind lean
//
// Companion cards carry onlyIf 'companion:<id>' (they are in the hand only once that companion is out);
// the rumour look-alike `shutout` is pencil (talk.js drops it once rumour `hates` has a proof slip).

const l = (my, en) => ({ my, en });

export const D10_HP_CARDS = [
  { id: 'alone', name: l('တစ်ယောက်တည်း နေတာ မမှားပါဘူး', "Alone isn't wrong"),
    line: l('တစ်ယောက်တည်း နေတာ မမှားပါဘူး ဦးလေးရဲ့။ ဘယ်သူ့ကိုမှ ရှင်းပြနေစရာ မလိုပါဘူး။', "Living alone isn't wrong, Uncle. You don't owe anyone an explanation."),
    answers: ['hot'], from: l('ခြံတံခါးဝက', 'from the gate'), onlyIf: 'd10.hpSit' },
  { id: 'touch', name: l('ထိကြည့်ပြီး လွှတ်လိုက်ပါ', 'Touch, then let go'),
    line: l('နွယ်ပင်လေးတွေလိုပဲ လမ်းကြားလေးကို ထိကြည့်ပြီး ပြန်လွှတ်လိုက်ရင်ရော ဦးလေးရယ်။', 'What if you touched the lane like the tendril, Uncle, and let it go?'),
    answers: ['cling'], from: l('နွယ်ပင်လေးတွေဆီက', 'from the tendrils'), onlyIf: 'd10.tendrils' },
  { id: 'take', name: l('ကိုယ်နဲ့ဆိုင်တာကိုပဲ နားထောင်ပါ', "Listen to what's yours"),
    line: l('ကိုယ်နဲ့ဆိုင်တာလေးပဲ ယူပြီး ကျန်တာတွေကို လေတိုက်သလို လွှတ်ထားလိုက်ရင်… တံခါး ဖွင့်ထားထား၊ ပိတ်ထားထား ဦးလေးစိတ်က အရင်အတိုင်း ငြိမ်သက်နေမှာ မဟုတ်ဘူးလား။', "If you took in only what's yours and let the rest blow past… open or shut, would your mind stay just as still?"),
    answers: ['unknown'], from: l('လမ်းကြားထဲက အသံတွေဆီက', "from the lane's voices"), onlyIf: 'd10.lanes' },
  { id: 'c:ember', companion: 'ember', onlyIf: 'companion:ember', name: l('မီးငြိမ်းသွားတဲ့ မီးခဲလေး', 'Cooled Ember'),
    line: l('မီးခဲကို ကိုင်ထားရင် ကိုယ့်လက် အရင် လောင်တာပဲ။ အောက်ချထားလိုက်လို့ ရပါတယ်။', 'Hold an ember and your own hand burns first. You can set it down.'),
    answers: ['hot'], from: l('မီးငြိမ်းသွားတဲ့ မီးခဲလေး', 'the Cooled Ember') },
  { id: 'c:earth', companion: 'earth', onlyIf: 'companion:earth', name: l('မြေကြီးလေး', 'Little Earth'),
    line: l('မြေကြီးလိုပဲ… ချီးကျူးခံရလည်း ဒီနေရာမှာပဲ ရှိနေတယ်၊ အပြစ်တင်ခံရလည်း ဒီနေရာမှာပဲ ရှိနေတယ်။', 'Like the earth… praised, it stays put; blamed, it stays put.'),
    answers: ['unknown'], from: l('မြေကြီးလေး', 'Little Earth') },
  { id: 'openup', lookalike: true, name: l('ခြံတံခါး ဖွင့်လိုက်ပါ', 'Open the gate'),
    line: l('ခြံတံခါး ဖွင့်လိုက်ပါ ဦးလေးရယ်။ လူတွေကြားထဲ နေမှ ဦးလေး ပျော်ရွှင်မှာပါ။', "Open the gate, Uncle. You'll only be happy among people."),
    shows: ['unknown', 'hot'], really: l('သူ့ခြံတံခါးအတွက် သူ့အစား ဆုံးဖြတ်ပေးမိတာ', 'deciding his gate for him'),
    backfire: { they: l('တွေ့လား… ငါ့ကို လာရစ်ပတ်မယ့် နောက်တစ်ယောက် လာပြန်ပြီ။', 'See… here comes another one winding round me.'),
      maya: l('(သူ့ခြံတံခါးကို ငါကိုယ်တိုင် ဆွဲဖွင့်ပေးချင်နေမိတယ်။)', '(I wanted to pull his gate open myself.)') } },
  { id: 'shutout', lookalike: true, pencil: true, rumour: 'hates', name: l('အပြင်မှာပဲ ထားလိုက်ပါ', 'Keep them out'),
    line: l('ဦးလေး ပြောတာ မှန်တယ်။ လူတွေက မကောင်းဘူး။ တစ်ယောက်မှ အထဲ မဝင်စေနဲ့။', "You're right, Uncle. People are no good. Keep every one of them out."),
    shows: ['hot'], really: l('စိတ်အေးသလိုလိုနဲ့ အငြိုးကို မီးထိုးပေးမိတာ', 'a grudge fanned, passing for calm'),
    backfire: { they: l('…ဟုတ်တယ်။ (လမ်းကြားလေးကို ပိုပြီး စိုက်ကြည့်နေတယ်။)', '…Right. (He stares at the lane even harder.)'),
      maya: l('("သူ လူတွေကို မုန်းတယ်" ဆိုတဲ့ စကားကို မစစ်ဆေးဘဲ ငါ ယုံမိသွားပြီ။)', '(I believed "he hates people" without checking.)') } },
];

export const TALK_D10_HPOHTAW = {
  id: 'd10-hpohtaw',
  person: 'hpohtaw',
  with: ['gourdaunty'],
  steam: 2, calm: 4, turns: 7,
  theirs: [3], // the gate is his
  hand: D10_HP_CARDS,
  stones: [
    { lines: [
      { my: 'လူတွေ လာရင် ယူသွားကြတာချည်းပဲ။ အကိုင်းဖြတ်တွေရော၊ ငါ့ပေါက်တူးရော၊ သူတို့ ချန်ထားခဲ့တာက အတင်းအဖျင်းတွေပဲ။', en: 'When people come, they take. Cuttings, my hoe, and what they leave behind is talk.', need: 'hot', seems: 'looksdown', face: 'hot', steam: 1,
        tell: l('အထင်သေးတာ မဟုတ်ဘူး။ နှစ်တွေ ကြာလာတာ။ ပြန်မရောက်လာတော့တဲ့ ပေါက်တူးချိတ်တဲ့ ချိတ်အလွတ်လေးကိုပဲ ကြည့်နေတာ။', "Not contempt. Years of it. He's looking at the empty hook where the hoe never came back.") },
      { my: 'တစ်ယောက်တည်းဆို တိတ်ဆိတ်တယ်။ ရန်ဖြစ်စရာ မရှိဘူး။ ဆုံးရှုံးစရာ ဘာမှ မရှိဘူး။', en: "Alone, it's quiet. No quarrels. Nothing to lose.", need: 'hot', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'ငါ စိတ်အေးအေးပါပဲ။ …ပါဆယ်ပို့တဲ့ ကောင်လေး ဖြတ်သွားပြီလား။ ဒီအချိန်ဆို ဖြတ်သွားနေကျလေ။', en: "I'm perfectly calm. …Has the parcel boy gone by yet? He usually passes about now.", need: 'cling', seems: 'own', face: 'think',
        tell: l('စိတ်အေးနေတာ မဟုတ်ဘူး။ ခေါင်းက လမ်းကြားဘက်ရော၊ တိုင်ပေါ်က ပေါင်မုန့်ဘက်ရော လှည့်လှည့်ကြည့်နေတယ်။ သူ သော့ခတ်ပိတ်ထားတဲ့ လမ်းကြားလေးနဲ့ပဲ ပြန်ရစ်ပတ်နေတာ။', "Not calm. His head keeps turning to the lane, and to the loaf on the post. He's wound round the very lane he locked out.") },
      { my: 'လမ်းကြားထဲက ပြောသံတွေ… တစ်ညလုံး ငါ ကြားနေရတယ်။', en: 'What the lane says… I hear it all night.', need: 'cling', seems: 'hot', face: 'sad',
        tell: l('ဒေါသထွက်နေတာ မဟုတ်ဘူး။ ကြားရုံတင် မဟုတ်ဘဲ စကားလုံးတိုင်းကို ရင်ထဲ သိမ်းထားမိတာ။', "Not anger. He didn't just hear it; he took every word inside.") },
    ] },
    { lines: [
      { my: 'ဖွင့်ထားရင် ဝင်လာပြီး ရစ်ပတ်ကြတယ်။ ပိတ်ထားပြန်တော့လည်း သူတို့ လာမလားဆိုပြီး ဒီမှာ ထိုင်စောင့်ကြည့်နေမိပြန်ရော။ ငါ ဘာလုပ်ရမှန်း မသိတော့ဘူး။', en: "Open it and they come in winding. Shut it and I sit here watching for them. I don't know what to do.", need: 'unknown', seems: 'afraid', face: 'worried',
        tell: l('ကြောက်နေတာ မဟုတ်ဘူး။ တံခါး ဖွင့်တာနဲ့ ပိတ်တာ နှစ်မျိုးပဲ သူ သိတာ။ တတိယနည်းလမ်းကို သူ တစ်ခါမှ မမြင်ဖူးသေးဘူး။', 'Not fear. He knows two kinds of gate, open and shut. He has never seen a third way.') },
      { my: 'ဘယ်အရာမှ ထာဝရ မတည်မြဲမှန်း ကျုပ် သိပါတယ်။ ဒါပေမဲ့ လမ်းကြားလေးကိုပဲ စောင့်ကြည့်နေမိတုန်းပဲ။', en: 'I know nothing stays for ever. And I still watch the lane.', need: 'unknown', face: 'think', heard: true },
    ] },
    { lines: [ // his stone: no card moves it; hold Step back
      { my: 'ဒီခြံတံခါးကို… ဘယ်လို ထားခဲ့ရမလဲ။', en: 'This gate… how should I leave it?', need: 'own', seems: 'unknown', face: 'think',
        tell: l('သူ အဖြေ တောင်းနေတာ မဟုတ်ဘူး။ လက်ထဲက သော့ကို လှည့်ရင်း ဆုံးဖြတ်နေတာ။', "He isn't asking for an answer. He's turning the key in his hand, deciding.") },
      { my: 'သော့ခလောက်ကို… ဖြုတ်ထားရမလား၊ ခတ်ထားရမလား။', en: 'The padlock… off, or on?', need: 'own', face: 'think' },
    ] },
  ],
  react: {
    miss: l('…အဲဒါ အပင်တွေနဲ့ ဘာမှ မဆိုင်ဘူး။', "…That's nothing to do with plants."),
    hot: l('(ဦးဖိုးထော် ဂေါ်ပြားသေးလေးနဲ့ မြေကြီးကိုပဲ ထိုးဆွနေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', '(U Hpo Htaw is stabbing the soil with his trowel. Nothing gets through.)'),
    lean: l('(မာရာ့ကို ကြည့်ပြီး စောင့်နေတယ်။ အခုတော့ ခြံတံခါးက သူ့အဖြေ မဟုတ်တော့ဘဲ မာရာ့အဖြေ ဖြစ်သွားပြီ။)', "(He looks at Maya and waits. Now the gate is Maya's answer, not his.)"),
  },
  decision: [
    { my: 'သော့ခလောက်ကို ဖြုတ်ပြီး တိုင်မှာ ချိတ်ထားလိုက်မယ်။ ခြံတံခါးကို လက်တစ်ဝါးစာလောက် ဟထားလိုက်မယ်။ ဝင်ချင်တဲ့သူ တွန်းဝင်လာပါစေ။', en: "I'll take the padlock off and hang it on the post. Leave the gate open a hand-width. Whoever wants can push it.", face: 'think' },
    { my: 'ပြီးတော့ ကျုပ်ခုံတန်းကို စိုက်ခင်းဘက် လှည့်ထားလိုက်မယ်။ လူလာလာ မလာလာ စိုက်ခင်းတွေက ရေလိုတယ်လေ။', en: "And I'll turn my bench to face the beds. People or no people, the beds need water.", face: 'happy' },
  ],
};

export const D10_KP_CARDS = [
  { id: 'nine', name: l('ကိုးပိဿာ', 'Nine viss'),
    line: l('ကိုးပိဿာ… နည်းတော့ နည်းတာပေါ့။ ဒါပေမဲ့ ပိဿာတိုင်းက ကိုယ့်ချွေးနဲ့ကိုယ် ရှာထားတာပဲ မဟုတ်လား။', "Nine viss… less. But every viss of it is yours, isn't it?"),
    answers: ['given'], from: l('သူ့ရဲ့ ချိန်ခွင်သေးသေးလေးဆီက', 'from his own little scale'), onlyIf: 'd10.weighed' },
  { id: 'lane', name: l('သူ့ရဲ့ ညနေခင်း', 'His evening'),
    line: l('ဒီည သူ့ပြတင်းပေါက်ကို မြင်ခဲ့တယ် မဟုတ်လား။ အဲဒါ ကိုပြည့်စုံ လိုချင်တဲ့ ညမျိုးလား။', 'You saw his window tonight. Is that the night you want?'),
    answers: ['unknown'], from: l('ရင်ပြင်ဆီက', 'from the square'), onlyIf: 'd10.matched' },
  { id: 'doors', name: l('တံခါး သုံးပေါက်', 'Three doors'),
    line: l('လက်ရယ်၊ ပါးစပ်ရယ်၊ စိတ်ရယ်… နောက်နှစ်ကျလို့ ပြန်တွေးကြည့်ရင် ဘယ်တစ်ခုကို မရှက်မကြောက် ကြည့်ရဲမလဲ။', 'Hand, mouth, mind… next year, looking back, which could you look at without shame?'),
    answers: ['looksdown'], from: l('ဦးကြည်ငြိမ်းရဲ့ ကမ်းလှမ်းချက်ဆီက', "from U Kyi Nyein's offer"), onlyIf: 'd10.offer' },
  { id: 'c:pot', companion: 'pot', onlyIf: 'companion:pot', name: l('အိုးသေးသေးလေး', 'Little Pot'),
    line: l('ကိုယ့်အိုးလေးကို ကိုယ်တိုင် ဖြည့်ခဲ့တာပဲ… ကိုယ့်လက်နဲ့၊ ကိုယ့်ချွေးနဲ့လေ။', 'You filled your own pot yourself… with your own hands, your own sweat.'),
    answers: ['given'], from: l('အိုးသေးသေးလေး', 'Little Pot') },
  { id: 'c:beetle', companion: 'beetle', onlyIf: 'companion:beetle', name: l('ခြောက်ကိုး ပိုးကောင်လေး', 'Six-Nine Beetle'),
    line: l('ဝယ်တဲ့သူ ဘက်က ကြည့်ရင် ဒီအထုပ်က ဘယ်လို မြင်ရမလဲ။', "From the buyer's side, how does this bale look?"),
    answers: ['looksdown'], from: l('ခြောက်ကိုး ပိုးကောင်လေး', 'the Six-Nine Beetle') },
  { id: 'caught', lookalike: true, name: l('မိသွားလိမ့်မယ်', "You'll get caught"),
    line: l('ရေစွတ်လိုက်ရင် တစ်နေ့ကျ မိသွားလိမ့်မယ်။', "Wet it and one day you'll get caught."),
    shows: ['unknown', 'afraid'], really: l('မိသွားမှာနဲ့ ခြောက်လှန့်မိတာ၊ ပေးဆပ်ရမှာက စိတ်အေးချမ်းသာမှုပဲ', 'scaring him with getting caught; the cost is the ease'),
    backfire: { they: l('မမိရင်ရော။ ဦးကြည်ငြိမ်းလည်း တစ်ခါမှ မမိဖူးဘူးလေ။', "And if I'm not? U Kyi Nyein never has been."),
      maya: l('(မိသွားမှာ မသွားမှာနဲ့ မဆိုင်ဘူး။ သူ့ပြတင်းပေါက်က အဖြေပေးပြီးသားပဲ။)', "(It isn't about being caught. His window already said it.)") } },
  { id: 'richbad', lookalike: true, name: l('ချမ်းသာတာ မကောင်းဘူး', 'Rich is bad'),
    line: l('သူဌေးတွေက ဘယ်တော့မှ အိပ်မပျော်ကြဘူး။ ချမ်းသာတာ မကောင်းဘူး။', 'Rich people never sleep. Being rich is bad.'),
    shows: ['envy', 'unknown'], really: l('ချမ်းသာတဲ့သူတွေကို အထင်သေးမိတာ၊ အပြစ်က ရေစွတ်တာပဲ', 'looking down on the rich; the fault is the water'),
    backfire: { they: l('ဒါဆို ကျုပ် ဆင်းရဲနေတာက ကောင်းတယ်ပေါ့။ တကယ်လား။', 'So me being poor is good? Really?'),
      maya: l('(ချမ်းသာတာက အပြစ် မဟုတ်ဘူး။ ရေစွတ်တာကသာ အပြစ်။)', "(Being rich isn't the fault. The water is.)") } },
];

export const TALK_D10_KOPHYO = {
  id: 'd10-kophyo',
  person: 'kophyo',
  with: [], // U Kyi Nyein is behind his curtain, not in the scene
  steam: 1, calm: 4, turns: 7,
  theirs: [2, 4],
  hand: D10_KP_CARDS,
  stones: [
    { lines: [
      { my: 'သူ့မှာ ဆိုင်အပြည့် ရှိတယ်။ ငါ့မှာ လှည်းတစ်စီးပဲ ရှိတာ။ ရေတစ်ခွက်လောက်နဲ့ ဘယ်သူ့ကိုများ ထိခိုက်သွားမှာမို့လဲ။', en: "He has a full store. I've one cart. Who's hurt by a cup of water?", need: 'given', seems: 'envy', face: 'sad', mood: 'down',
        tell: l('မနာလို ဖြစ်နေတာ မဟုတ်ဘူး။ လက်ဖက်ခြောက်ဖိုး ရသမျှ အကြွေစေ့လေးတွေအထိ ရေတွက်ပြီးပြီ။ ပင်ပန်းနေပြီ၊ ရိုးသားတဲ့ လမ်းကြောင်းကို လက်လျှော့ဖို့ အသင့်ဖြစ်နေပြီ။', "Not envy. He's counted his tea-leaf money to the last coin. He's tired, ready to give up on the honest road.") },
      { my: 'ရိုးသားတော့ရော ငါ ဘာရလဲ။ လှည်းတစ်စီးပဲ ရတာလေ။', en: 'And honest got me what? One cart.', need: 'given', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'ဦးကြည်ငြိမ်းကတော့ ဟိုအိမ်ကြီးပေါ်မှာ အေးအေးဆေးဆေး အိပ်ပျော်နေမှာပဲ။', en: 'U Kyi Nyein must sleep easy up in that big house.', need: 'unknown', seems: 'envy', face: 'think',
        tell: l('မနာလို ဖြစ်နေတာ မဟုတ်ဘူး။ တံခါးအပြင်ဘက်က ဆိုင်ကြီးဆီကိုပဲ လှမ်းလှမ်းကြည့်နေတယ်။ ချမ်းသာရင် စိတ်အေးချမ်းသာတယ်လို့ပဲ သူ အမြဲ ထင်ခဲ့တာ။', 'Not envy. He keeps looking out of the door toward the store. He always thought rich meant at ease.') },
    ] },
    { lines: [ // his: his own question
      { my: 'ငါ ရေစွတ်လိုက်ရင်… ဒီည သူ့လိုပဲ ထိုင်စောင့်နေရမလား မသိဘူး။', en: 'If I wet it… would I sit up tonight like him?', need: 'own', seems: 'unknown', face: 'think',
        tell: l('မာရာ့ကို မေးနေတာ မဟုတ်ဘူး။ သူ့ကိုယ်သူ မေးနေတာ။ ရေပုံးကို ကြည့်လိုက်၊ တံခါးကို ကြည့်လိုက်၊ ရေပုံးကို ပြန်ကြည့်လိုက်နဲ့။', "He isn't asking Maya. He's asking himself. The can; the door; the can.") },
    ] },
    { lines: [
      { my: 'ဝယ်တဲ့သူက ငါ့ကို သိတာမှ မဟုတ်တာ။ ဘယ်သူမှ သိမှာ မဟုတ်ပါဘူး။', en: "The buyer doesn't know me. Nobody would ever know.", need: 'looksdown', seems: 'afraid', face: 'worried',
        tell: l('ကြောက်နေတာ မဟုတ်ဘူး။ ဝယ်တဲ့သူနဲ့ တစ်ခါမှ မျက်လုံးချင်း မဆုံဖူးဘူးလေ။ တစ်ခါမှ မမြင်ဖူးတဲ့ သူတစ်ယောက်ကို အထင်သေးဖို့က လွယ်တာပေါ့။', "Not fear. He's never once met the buyer's eye. It's easy to think little of someone you've never seen.") },
      { my: 'ဒါပေမဲ့ ငါကတော့ သိနေမှာပဲ… (ခြေထောက်နဲ့ ရေပုံးကို ဘေးဖယ်လိုက်တယ်)', en: "I'd know, though… (he nudges the can aside with his foot)", need: 'looksdown', face: 'think', heard: true },
    ] },
    { lines: [ // his: the decision
      { my: '…ငါ ဆုံးဖြတ်လိုက်ပြီ။', en: "…I've decided.", need: 'own', face: 'think',
        tell: l('သူ့ဘာသာ ဆုံးဖြတ်လိုက်ပြီ။ ဘေးကနေ တိတ်တိတ်လေးပဲ နေပေးလိုက်ပါ။', "He's decided for himself. Just stay quietly beside him.") },
    ] },
  ],
  react: {
    miss: l('…အဲဒါ စက္ကူနဲ့ ဘာမှ မဆိုင်ဘူး မာရာ။', "…That's nothing to do with paper, Maya."),
    hot: l('(ကိုဖြိုး အထုပ်ကြိုးကို တင်းနေအောင် ဆွဲချည်နေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', "(Ko Phyo is yanking the bale's string tight. Nothing gets through.)"),
    lean: l('မာရာ ပြောတယ်ဆိုရင်… မှန်မှာပါပဲ။ (ဒါ သူ့ဆုံးဖြတ်ချက် မဟုတ်တော့ဘူး။)', "If Maya says so… it must be right. (It's no longer his decision.)"),
  },
  decision: [
    { my: 'ကိုးပိဿာ။ အခြောက်စစ်စစ်။ မနက်ဖြန်ကျရင် ဝယ်တဲ့သူရဲ့ မျက်လုံးကို တည့်တည့်ကြည့်ပြီး ရောင်းမယ်။', en: "Nine viss. Dry. Tomorrow I'll sell it looking the buyer in the eye.", face: 'happy' },
    { my: 'ဦးကြည်ငြိမ်းဆီ သူ့ရေပုံး ပြန်သွားပေးလိုက်မယ်။ ကျေးဇူးတင်ပါတယ်လို့ ပြောမယ်။ ဒါပဲ။', en: "I'll take U Kyi Nyein his can back. Say thank you. Nothing more.", face: 'think' },
  ],
};

export const D10_KO_CARDS = [
  { id: 'c:seedling', companion: 'seedling', name: l('မဖြစ်သေးတဲ့ ပျိုးပင်လေး', 'Not-Yet Seedling'),
    // a true saying laid on someone who has already found his own answer takes it from him (ch 5)
    line: l('မဖြစ်သေးတာပါ။ နောက်လကျရင် ခြောက်ပိဿာ စမ်းကြည့်ပေါ့။', 'Not yet. Try six next month.'),
    answers: ['unknown'], from: l('မဖြစ်သေးတဲ့ ပျိုးပင်လေး', 'the Not-Yet Seedling') },
  { id: 'c:sheep', companion: 'sheep', name: l('နောက်တစ်ခေါက်', 'Once more'),
    line: l('တစ်ခုမှ မကွဲတော့တဲ့အထိ နောက်တစ်ခေါက် ထပ်စမ်းကြည့်ပေါ့။', 'Try once more, till none crack.'),
    answers: ['given'], from: l('သိုးမည်းလေး', 'the Black Sheep') },
  { id: 'five', lookalike: true, name: l('ငါးပိဿာက မှန်တယ်', 'Five is right'),
    line: l('ငါးပိဿာက မှန်တယ်။ ကျွန်မ အာမခံတယ်။', 'Five is right. I promise.'),
    shows: ['unknown'], really: l('သူ့အဖြေပေါ်မှာ ငါ့တံဆိပ်တုံး ရိုက်နှိပ်ပေးမိတာ', 'stamping my seal on his answer') },
];

export const TALK_D10_KAUNG = {
  id: 'd10-kaung', person: 'kaung', with: [],
  steam: 0, calm: 4, turns: 5,
  theirs: [0, 1],
  hand: D10_KO_CARDS,
  stones: [
    { lines: [
      { my: 'ဒါဆို… ငါးပိဿာက မှန်တယ်ပေါ့ မာရာ။ မှန်တယ်လို့ ငါ့ကို ပြောပေးမလား။', en: "So… is five right, Maya? Will you tell me it's right?", need: 'own', seems: 'unknown', face: 'think',
        tell: l('သူ မသိတာ မဟုတ်ဘူး။ ထုပ်ပိုးတဲ့ ခုံပေါ်က အိုးငါးလုံးကို ကြည့်ပြီး ပြုံးနေတာ။ သူ သိပြီးသား။ မာရာ့ဆီက အတည်ပြုချက်လေးပဲ လိုချင်နေတာ။', "It isn't that he doesn't know. He's smiling at the five pots on the packing bench. He knows. He only wants Maya's seal on it.") },
    ] },
    { lines: [
      { my: '…ဟုတ်သားပဲ။ ငါ့လက်တွေက အသိဆုံးပဲလေ။', en: '…Right. My own hands know best.', need: 'own', face: 'happy' },
    ] },
  ],
  react: { lean: l('ဟုတ်ကဲ့… မာရာ ပြောတယ်ဆိုရင် မှန်တာပေါ့။ (အပြုံး ပျောက်သွားပြီ။ အခုတော့ မာရာ့စကားကိုပဲ မှီခိုလိုက်ပြန်ပြီ။)', "Okay… if Maya says so, it's right. (The smile goes. He's leaning on Maya's word now.)") },
  decision: [
    { my: 'ငါ့စာရွက်ကို ငါ့ဘာသာ ပြန်ဖြုတ်လိုက်မယ်။ အဖြေက ငါ့ဆီမှာ ရှိပြီးသားပဲ။', en: "I'll take my note down myself. The answer's with me already.", face: 'happy' },
    { my: 'ဒီည အိမ်အပြန်ကျရင် စာတိုက်ကို ဝင်လိုက်ဦးမယ်။', en: "I'll stop by the Post Office on my way home tonight.", face: 'happy' },
  ],
};
