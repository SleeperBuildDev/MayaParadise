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
  { id: 'alone', name: l('တစ်ယောက်တည်း မမှားဘူး', "Alone isn't wrong"),
    line: l('တစ်ယောက်တည်း နေတာ မမှားပါဘူး ဦး။ ဘယ်သူ့ကိုမှ ရှင်းပြစရာ မလိုပါဘူး။', "Living alone isn't wrong, Uncle. You don't owe anyone an explanation."),
    answers: ['hot'], from: l('တံခါးရှေ့မှာ ရခဲ့တာ', 'from the gate'), onlyIf: 'd10.hpSit' },
  { id: 'touch', name: l('ထိပြီး လွှတ်', 'Touch, then let go'),
    line: l('လမ်းကိုလည်း နွယ်ညွန့်လေးလိုပဲ ထိပြီး လွှတ်ထားရင်ရော ဦး။', 'What if you touched the lane like the tendril, Uncle, and let it go?'),
    answers: ['cling'], from: l('နွယ်ညွန့်တွေဆီက ရခဲ့တာ', 'from the tendrils'), onlyIf: 'd10.tendrils' },
  { id: 'take', name: l('ကိုယ့်ဟာကိုပဲ နားထောင်', "Listen to what's yours"),
    line: l('ဦးနဲ့ ဆိုင်တာကိုပဲ နားထောင်ပြီး ကျန်တာ အာကာ့သွားပါစေဆိုရင်… တံခါး ဖွင့်ဖွင့် ပိတ်ပိတ် စိတ်က အတူတူ ငြိမ်နေမလား။', "If you took in only what's yours and let the rest blow past… open or shut, would your mind stay just as still?"),
    answers: ['unknown'], from: l('လမ်းက စကားသံတွေဆီက ရခဲ့တာ', "from the lane's voices"), onlyIf: 'd10.lanes' },
  { id: 'c:ember', companion: 'ember', onlyIf: 'companion:ember', name: l('မီးခဲအေးလေး', 'Cooled Ember'),
    line: l('မီးခဲကို ကိုင်ထားရင် ကိုယ့်လက်ပဲ အရင်ပူတယ်။ ချထားလိုက်လို့ ရပါတယ်။', 'Hold an ember and your own hand burns first. You can set it down.'),
    answers: ['hot'], from: l('မီးခဲအေးလေး', 'the Cooled Ember') },
  { id: 'c:earth', companion: 'earth', onlyIf: 'companion:earth', name: l('မြေကြီးလေး', 'Little Earth'),
    line: l('မြေကြီးလိုပေါ့… ချီးမွမ်းလည်း ဒီနေရာ၊ ကဲ့ရဲ့လည်း ဒီနေရာ။', 'Like the earth… praised, it stays put; blamed, it stays put.'),
    answers: ['unknown'], from: l('မြေကြီးလေး', 'Little Earth') },
  { id: 'openup', lookalike: true, name: l('တံခါး ဖွင့်လိုက်', 'Open the gate'),
    line: l('တံခါး ဖွင့်လိုက်ပါ ဦး။ လူတွေနဲ့ နေမှ ပျော်မှာပါ။', "Open the gate, Uncle. You'll only be happy among people."),
    shows: ['unknown', 'hot'], really: l('သူ့တံခါးကို သူ့အစား ဆုံးဖြတ်ပေးတာ', 'deciding his gate for him'),
    backfire: { they: l('ကြည့်… ဒီမှာလည်း ငါ့ကို ရစ်ပတ်လာပြန်ပြီ။', 'See… here comes another one winding round me.'),
      maya: l('(သူ့တံခါးကို ကျွန်မ ဆွဲဖွင့်ချင်နေမိတယ်။)', '(I wanted to pull his gate open myself.)') } },
  { id: 'shutout', lookalike: true, pencil: true, rumour: 'hates', name: l('လူတွေကို ပိတ်ထား', 'Keep them out'),
    line: l('ဦး မှန်ပါတယ်။ လူဆိုတာ မကောင်းဘူး။ အကုန် ပိတ်ထားလိုက်။', "You're right, Uncle. People are no good. Keep every one of them out."),
    shows: ['hot'], really: l('အေးသလိုလိုနဲ့ နာကျည်းချက်ကို မီးမွှေးတာ', 'a grudge fanned, passing for calm'),
    backfire: { they: l('…ဟုတ်တယ်။ (လမ်းကို ပိုပြီး စိုက်ကြည့်တယ်။)', '…Right. (He stares at the lane even harder.)'),
      maya: l('(လူတွေပြောတဲ့ "လူမုန်းတယ်" ကို မစစ်ဘဲ ယုံလိုက်မိတယ်။)', '(I believed "he hates people" without checking.)') } },
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
      { my: 'လူတွေ လာရင် ယူသွားတာပဲ။ ပန်းပင်ခွဲလည်း ယူ၊ ပေါက်ပြားလည်း ယူ၊ ကျန်ခဲ့တာက စကားတွေ။', en: 'When people come, they take. Cuttings, my hoe, and what they leave behind is talk.', need: 'hot', seems: 'looksdown', face: 'hot', steam: 1,
        tell: l('အထင်သေးတာ မဟုတ်ဘူး။ နှစ်ပေါင်းများစွာ ခံခဲ့ရတာ။ ပေါက်ပြား ပြန်မလာတော့တဲ့ ချိတ်လွတ်ကို ကြည့်နေတယ်။', "Not contempt. Years of it. He's looking at the empty hook where the hoe never came back.") },
      { my: 'တစ်ယောက်တည်းဆို ငြိမ်တယ်။ ရန်လည်း မဖြစ်ဘူး၊ ဘာမှလည်း မဆုံးရှုံးဘူး။', en: "Alone, it's quiet. No quarrels. Nothing to lose.", need: 'hot', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'ငါ အေးအေးဆေးဆေးပါ။ …ဒါနဲ့ ပါဆယ်ကောင်လေး ဖြတ်သွားပြီလား။ ဒီအချိန်ဆို ဖြတ်လေ့ရှိတယ်။', en: "I'm perfectly calm. …Has the parcel boy gone by yet? He usually passes about now.", need: 'cling', seems: 'own', face: 'think',
        tell: l('အေးနေတာ မဟုတ်ဘူး။ ခေါင်းက လမ်းဘက် ခဏခဏ လှည့်သွားတယ်။ တံခါးတိုင်ပေါ်က ပေါင်မုန့်ကိုလည်း။ ပိတ်ထားတဲ့ လမ်းကိုပဲ ရစ်ပတ်ထားတာ။', "Not calm. His head keeps turning to the lane, and to the loaf on the post. He's wound round the very lane he locked out.") },
      { my: 'လမ်းက ဘာပြောလဲ… ညလုံးပေါက် ကြားယောင်နေတယ်။', en: 'What the lane says… I hear it all night.', need: 'cling', seems: 'hot', face: 'sad',
        tell: l('ဒေါသ မဟုတ်ဘူး။ ကြားရုံ မဟုတ်ဘဲ စိတ်ထဲ အကုန် သွင်းထားတာ။', "Not anger. He didn't just hear it; he took every word inside.") },
    ] },
    { lines: [
      { my: 'တံခါးဖွင့်ရင် လူတွေ ဝင်ပြီး ရစ်ပတ်မယ်။ ပိတ်ထားရင် ဒီမှာ ထိုင်စောင့်ကြည့်နေမယ်။ ဘယ်လိုလုပ်ရမှန်း မသိဘူး။', en: "Open it and they come in winding. Shut it and I sit here watching for them. I don't know what to do.", need: 'unknown', seems: 'afraid', face: 'worried',
        tell: l('ကြောက်တာ မဟုတ်ဘူး။ တံခါး နှစ်မျိုးပဲ သိတယ်၊ ဖွင့်တာနဲ့ ပိတ်တာ။ တတိယလမ်း မမြင်ဖူးသေးဘူး။', 'Not fear. He knows two kinds of gate, open and shut. He has never seen a third way.') },
      { my: 'ဘာမှ ထာဝရ မနေဘူးဆိုတာ သိတယ်။ ဒါတောင် လမ်းကို ကြည့်နေတုန်းပဲ။', en: 'I know nothing stays for ever. And I still watch the lane.', need: 'unknown', face: 'think', heard: true },
    ] },
    { lines: [ // his stone: no card moves it; hold Step back
      { my: 'ဒီတံခါး… ဘယ်လို ထားရမလဲ။', en: 'This gate… how should I leave it?', need: 'own', seems: 'unknown', face: 'think',
        tell: l('အဖြေ တောင်းတာ မဟုတ်ဘူး။ သော့ကို လက်ထဲမှာ လှည့်နေတယ်။ သူ့ဘာသာ ဆုံးဖြတ်နေတာ။', "He isn't asking for an answer. He's turning the key in his hand, deciding.") },
      { my: 'သော့ခလောက်… ဖြုတ်မလား၊ ထားမလား။', en: 'The padlock… off, or on?', need: 'own', face: 'think' },
    ] },
  ],
  react: {
    miss: l('…အဲဒါ ပန်းပင်နဲ့ မဆိုင်ဘူး။', "…That's nothing to do with plants."),
    hot: l('(ဦးဖိုးထော် ပေါက်တူးလေးနဲ့ မြေကို ဆောင့်ပေါက်နေတယ်။ ဘာမှ မကြားဘူး။)', '(U Hpo Htaw is stabbing the soil with his trowel. Nothing gets through.)'),
    lean: l('(သူ မာရာ့ကို ကြည့်ပြီး စောင့်နေတယ်။ အခု တံခါးက မာရာ့အဖြေ ဖြစ်သွားပြီ။ သူ့ဟာ မဟုတ်တော့ဘူး။)', "(He looks at Maya and waits. Now the gate is Maya's answer, not his.)"),
  },
  decision: [
    { my: 'သော့ခလောက်ကို ဖြုတ်ပြီး တိုင်မှာ ချိတ်ထားမယ်။ တံခါးကို လက်တစ်ဝါးစာ ဟထားမယ်။ ဝင်ချင်တဲ့သူ တွန်းဝင်လို့ရတယ်။', en: "I'll take the padlock off and hang it on the post. Leave the gate open a hand-width. Whoever wants can push it.", face: 'think' },
    { my: 'ခုံကိုလည်း ပန်းခင်းဘက် လှည့်ထားမယ်။ လူလာလာ မလာလာ ပန်းခင်းတွေက ရေလိုတာပဲ။', en: "And I'll turn my bench to face the beds. People or no people, the beds need water.", face: 'happy' },
  ],
};

export const D10_KP_CARDS = [
  { id: 'nine', name: l('ကိုးပိဿာ', 'Nine viss'),
    line: l('ကိုးပိဿာ… နည်းတယ်။ ဒါပေမဲ့ တစ်ပိဿာချင်းစီ ကိုဖြိုးဟာပဲ မဟုတ်လား။', "Nine viss… less. But every viss of it is yours, isn't it?"),
    answers: ['given'], from: l('ကိုယ့်ချိန်ခွင်လေးဆီက', 'from his own little scale'), onlyIf: 'd10.weighed' },
  { id: 'lane', name: l('သူ့ညနေ', 'His evening'),
    line: l('ဒီည သူ့ပြတင်းပေါက်ကို မြင်ခဲ့တယ်နော်။ အဲဒါ ကိုဖြိုး လိုချင်တဲ့ ညလား။', 'You saw his window tonight. Is that the night you want?'),
    answers: ['unknown'], from: l('ရင်ပြင်ကနေ မြင်ခဲ့တာ', 'from the square'), onlyIf: 'd10.matched' },
  { id: 'doors', name: l('တံခါး သုံးပေါက်', 'Three doors'),
    line: l('လက်၊ နှုတ်၊ စိတ်… နောက်နှစ် ပြန်ကြည့်ရင် ဘယ်ဟာကို ရှက်စရာမလိုဘဲ ကြည့်နိုင်မလဲ။', 'Hand, mouth, mind… next year, looking back, which could you look at without shame?'),
    answers: ['looksdown'], from: l('ဦးကြည်ငြိမ်း ပြောတာကနေ', "from U Kyi Nyein's offer"), onlyIf: 'd10.offer' },
  { id: 'c:pot', companion: 'pot', onlyIf: 'companion:pot', name: l('အိုးလေး', 'Little Pot'),
    line: l('ကိုယ့်အိုးကို ကိုယ်တိုင် ဖြည့်ခဲ့တာလေ… ကိုယ့်လက်နဲ့၊ ကိုယ့်ချွေးနဲ့။', 'You filled your own pot yourself… with your own hands, your own sweat.'),
    answers: ['given'], from: l('အိုးလေး', 'Little Pot') },
  { id: 'c:beetle', companion: 'beetle', onlyIf: 'companion:beetle', name: l('၆-၉ ပိုးလေး', 'Six-Nine Beetle'),
    line: l('ဝယ်သူဘက်က ကြည့်ရင် ဒီစက္ကူထုပ်က ဘယ်လို မြင်ရမလဲ။', "From the buyer's side, how does this bale look?"),
    answers: ['looksdown'], from: l('၆-၉ ပိုးလေး', 'the Six-Nine Beetle') },
  { id: 'caught', lookalike: true, name: l('မိသွားမယ်', "You'll get caught"),
    line: l('ရေဖျန်းရင် တစ်နေ့ မိသွားမှာနော်။', "Wet it and one day you'll get caught."),
    shows: ['unknown', 'afraid'], really: l('မိမှာနဲ့ ခြောက်တာ၊ အခက အေးချမ်းမှု', 'scaring him with getting caught; the cost is the ease'),
    backfire: { they: l('မမိရင်ရော။ ဦးကြည်ငြိမ်း ဘယ်တုန်းကမှ မမိဘူးလေ။', "And if I'm not? U Kyi Nyein never has been."),
      maya: l('(မိမမိ မဟုတ်ဘူး။ သူ့ပြတင်းပေါက်က ပြောပြီးသား။)', "(It isn't about being caught. His window already said it.)") } },
  { id: 'richbad', lookalike: true, name: l('ချမ်းသာရင် မကောင်းဘူး', 'Rich is bad'),
    line: l('ချမ်းသာတဲ့လူတွေ ဘယ်တော့မှ အိပ်မပျော်ဘူး။ ချမ်းသာတာ မကောင်းဘူး။', 'Rich people never sleep. Being rich is bad.'),
    shows: ['envy', 'unknown'], really: l('ချမ်းသာသူကို အထင်သေးတာ၊ အပြစ်က ရေဖျန်းတာ', 'looking down on the rich; the fault is the water'),
    backfire: { they: l('ဒါဆို ကျွန်တော် ဆင်းရဲနေတာ ကောင်းတာပေါ့။ ဟုတ်လို့လား။', 'So me being poor is good? Really?'),
      maya: l('(ချမ်းသာတာ အပြစ် မဟုတ်ဘူး။ ရေဖျန်းတာက အပြစ်။)', "(Being rich isn't the fault. The water is.)") } },
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
      { my: 'သူ့မှာ ဂိုဒေါင်အပြည့်။ ကျွန်တော့်မှာ လှည်းတစ်စီး။ ရေတစ်ခွက်လောက်နဲ့ ဘယ်သူ နာမှာလဲ။', en: "He has a full store. I've one cart. Who's hurt by a cup of water?", need: 'given', seems: 'envy', face: 'sad', mood: 'down',
        tell: l('မနာလိုတာ မဟုတ်ဘူး။ လက်ဖက်ခြောက်ဖိုးကို တစ်ပြားမကျန် ရေတွက်ထားတယ်။ ပင်ပန်းပြီး ရိုးရိုးလမ်းကို လက်လျှော့ချင်နေတာ။', "Not envy. He's counted his tea-leaf money to the last coin. He's tired, ready to give up on the honest road.") },
      { my: 'ရိုးရိုးနေတော့ရော ဘာရလဲ။ လှည်းတစ်စီးပဲ။', en: 'And honest got me what? One cart.', need: 'given', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'ဦးကြည်ငြိမ်းကတော့ အိမ်ကြီးထဲမှာ အေးအေးဆေးဆေး အိပ်ရမှာပဲ။', en: 'U Kyi Nyein must sleep easy up in that big house.', need: 'unknown', seems: 'envy', face: 'think',
        tell: l('မနာလိုတာ မဟုတ်ဘူး။ တံခါးပေါက်ကနေ စက္ကူဆိုင်ဘက်ကို ခဏခဏ လှမ်းကြည့်နေတယ်။ ချမ်းသာရင် အေးချမ်းမယ်လို့ပဲ ထင်ခဲ့တာ။', 'Not envy. He keeps looking out of the door toward the store. He always thought rich meant at ease.') },
    ] },
    { lines: [ // his: his own question
      { my: 'ရေဖျန်းလိုက်ရင်… ဒီည ကျွန်တော်လည်း သူ့လို ထိုင်စောင့်နေမှာလား။', en: 'If I wet it… would I sit up tonight like him?', need: 'own', seems: 'unknown', face: 'think',
        tell: l('မာရာ့ကို မေးတာ မဟုတ်ဘူး။ ကိုယ့်ကိုယ်ကို မေးနေတာ။ ရေပုံးကို ကြည့်၊ တံခါးပေါက်ကို ကြည့်။', "He isn't asking Maya. He's asking himself. The can; the door; the can.") },
    ] },
    { lines: [
      { my: 'ဝယ်သူက ကျွန်တော့်ကို မသိဘူး။ ဘယ်သူမှ သိမှာ မဟုတ်ဘူး။', en: "The buyer doesn't know me. Nobody would ever know.", need: 'looksdown', seems: 'afraid', face: 'worried',
        tell: l('ကြောက်တာ မဟုတ်ဘူး။ ဝယ်သူနဲ့ တစ်ခါမှ မျက်နှာချင်း မဆိုင်ဖူးဘူး။ မမြင်ဖူးတဲ့လူကို အထင်သေးရတာ လွယ်တယ်။', "Not fear. He's never once met the buyer's eye. It's easy to think little of someone you've never seen.") },
      { my: 'ကိုယ်ကိုတိုင်တော့ သိနေမှာပေါ့… (ရေပုံးကို ခြေထောက်နဲ့ ဘေးတွန်းထားတယ်)', en: "I'd know, though… (he nudges the can aside with his foot)", need: 'looksdown', face: 'think', heard: true },
    ] },
    { lines: [ // his: the decision
      { my: '…ကျွန်တော် ဆုံးဖြတ်ပြီ။', en: "…I've decided.", need: 'own', face: 'think',
        tell: l('သူ့ဘာသာ ဆုံးဖြတ်ပြီးပြီ။ ဘေးမှာ ငြိမ်ငြိမ်လေး ရှိပေးရုံပဲ။', "He's decided for himself. Just stay quietly beside him.") },
    ] },
  ],
  react: {
    miss: l('…အဲဒါ စက္ကူနဲ့ မဆိုင်ဘူး မာရာ။', "…That's nothing to do with paper, Maya."),
    hot: l('(ကိုဖြိုး စက္ကူထုပ်ကြိုးကို တင်းတင်း ဆွဲချည်နေတယ်။ ဘာမှ မကြားဘူး။)', "(Ko Phyo is yanking the bale's string tight. Nothing gets through.)"),
    lean: l('မာရာ ပြောတော့လည်း… ဟုတ်မှာပေါ့။ (သူ့ဘာသာ မဆုံးဖြတ်ရတော့ဘူး။)', "If Maya says so… it must be right. (It's no longer his decision.)"),
  },
  decision: [
    { my: 'ကိုးပိဿာ။ ခြောက်ခြောက်။ မနက်ဖြန် ဝယ်သူ့မျက်နှာကို တည့်တည့်ကြည့်ပြီး ရောင်းမယ်။', en: "Nine viss. Dry. Tomorrow I'll sell it looking the buyer in the eye.", face: 'happy' },
    { my: 'ရေပုံးကို ဦးကြည်ငြိမ်းဆီ ပြန်ပေးမယ်။ ကျေးဇူးပဲ ပြောမယ်။ ဘာမှ ထပ်မပြောဘူး။', en: "I'll take U Kyi Nyein his can back. Say thank you. Nothing more.", face: 'think' },
  ],
};

export const D10_KO_CARDS = [
  { id: 'c:seedling', companion: 'seedling', name: l('မရသေးပျိုးပင်', 'Not-Yet Seedling'),
    // a true saying laid on someone who has already found his own answer takes it from him (ch 5)
    line: l('မရသေးဘူးလေ။ နောက်လ ခြောက်လုံး ထပ်စမ်းကြည့်ပါ။', 'Not yet. Try six next month.'),
    answers: ['unknown'], from: l('မရသေးပျိုးပင်', 'the Not-Yet Seedling') },
  { id: 'c:sheep', companion: 'sheep', name: l('နောက်တစ်ခါ', 'Once more'),
    line: l('မကွဲမချင်း နောက်တစ်ခါ ထပ်စမ်းကြည့်ပါ။', 'Try once more, till none crack.'),
    answers: ['given'], from: l('သိုးမည်းလေး', 'the Black Sheep') },
  { id: 'five', lookalike: true, name: l('ငါးလုံး မှန်တယ်', 'Five is right'),
    line: l('ငါးလုံး မှန်ပါတယ်။ ကျွန်မ အာမခံတယ်။', 'Five is right. I promise.'),
    shows: ['unknown'], really: l('သူ့အဖြေပေါ် ကိုယ့်တံဆိပ် ခတ်ပေးတာ', 'stamping my seal on his answer') },
];

export const TALK_D10_KAUNG = {
  id: 'd10-kaung', person: 'kaung', with: [],
  steam: 0, calm: 4, turns: 5,
  theirs: [0, 1],
  hand: D10_KO_CARDS,
  stones: [
    { lines: [
      { my: 'ဒါဆို… ငါးလုံးဆိုတာ မှန်ရဲ့လား မာရာ။ မှန်တယ်လို့ ပြောပေးပါလား။', en: "So… is five right, Maya? Will you tell me it's right?", need: 'own', seems: 'unknown', face: 'think',
        tell: l('မသိလို့ မဟုတ်ဘူး။ ထုပ်ပိုးခုံပေါ်က အိုးငါးလုံးကို ကြည့်ပြီး ပြုံးနေတယ်။ သိပြီးသား။ မာရာ့တံဆိပ်ပဲ လိုချင်နေတာ။', "It isn't that he doesn't know. He's smiling at the five pots on the packing bench. He knows. He only wants Maya's seal on it.") },
    ] },
    { lines: [
      { my: '…ဟုတ်ပြီ။ ကိုယ့်လက်ကို ကိုယ်ပဲ အသိဆုံးပဲ။', en: '…Right. My own hands know best.', need: 'own', face: 'happy' },
    ] },
  ],
  react: { lean: l('ဟုတ်ကဲ့… မာရာ ပြောတော့ မှန်တာပေါ့။ (အပြုံး ပျောက်သွားတယ်။ မာရာ့စကားကို မှီလိုက်ပြီ။)', "Okay… if Maya says so, it's right. (The smile goes. He's leaning on Maya's word now.)") },
  decision: [
    { my: 'စာရွက်ကို ကိုယ်တိုင် ပြန်ဖြုတ်မယ်။ အဖြေက ကျွန်တော့်ဆီမှာ ရှိပြီးသား။', en: "I'll take my note down myself. The answer's with me already.", face: 'happy' },
    { my: 'ဒီည အိမ်ပြန်ရင် စာတိုက်ကို ဝင်ခဲ့မယ်။', en: "I'll stop by the Post Office on my way home tonight.", face: 'happy' },
  ],
};
