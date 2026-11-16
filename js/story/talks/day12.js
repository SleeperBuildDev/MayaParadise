// Day 12's two talks (day12-spec.md 5.4 and 6.4): U Hpo Htaw in his garden house (ch 19, Suffering) and
// Daw Ohn at her stall in the kiln's drying hall (ch 20, Patience). Format: the top of js/story/talk.js.
// Every Burmese line is a draft for Maya to proofread.
//
// Ch 19 (p89-93): trouble is a guest nobody invited, and it comes to everyone; it hurts most where we cling
// ("mine"); what is ours to steer is how we take it and the next hour. His needs: hot ("why only me"),
// cling (what he named "mine"), given ("what's the use"); stones 3 and 5 (index 2 and 4) are his own.
// Ch 20 (p94-98): catch the first rattle; one fail is not for life; compassion for those who don't know yet,
// gladness for those who worked for it; patience with good sense: a wrong that would cheat the next buyer goes
// as checked facts through the proper door. Her last stone is hers.
//
// Companion cards (ch 5 Not-Yet Seedling, ch 8 Little Earth, ch 9 Firefly, ch 10 Two-Tailed Ribbon, ch 18
// Folded Note) are in the hand only when that companion is on the page (`onlyIf: 'companion:<id>'`).
// The rumour card `r-onlyme` is drawn in pencil and leaves the hand once rumour `onlyme` is checked
// (talk.js drops `pencil` cards whose `rumour` has a proof slip).

const L = (my, en) => ({ my, en });

// ---------------------------------------------------------------------------------------------
// ch 19 · U Hpo Htaw
// ---------------------------------------------------------------------------------------------
export const D12_HT_CARDS = [
  { id: 'everyone', name: L('အားလုံးဆီ ရောက်လာတာပါ', 'It came to everyone'),
    line: L('ဘူးစင်လည်း ပြိုကျသွားပြီ။ ငါ့စိုက်ခင်းလည်း ပျက်သွားပြီ။ မိုးက ဦးလေး တစ်ယောက်တည်းကို ရွေးရွာတာ မဟုတ်ပါဘူး။', "The gourd trellis is down. My bed too. The rain didn't pick you out."),
    answers: ['hot'], from: L('လမ်းကြားတစ်လျှောက် ကြည့်မိရာက', 'from looking along the lane'), onlyIf: 'd12.looked' },
  { id: 'blank', name: L('နာမည်မပါတဲ့ စာရွက်တွေ', 'The sheets with no name'),
    line: L('လမ်းကြားထဲက စာရွက်တွေလည်း ရေစိုကုန်တာပဲ။ ဘယ်သူမှ မငိုကြဘူး။ "ငါ့ဟာ" လို့ စွဲလမ်းထားတာကသာ နာကျင်စေတာ။', 'The sheets in the lane got soaked too. Nobody cried. It\'s what we call "mine" that hurts.'),
    answers: ['cling'], from: L('ရေစိုနေတဲ့ စာရွက်အလွတ်တွေဆီက', 'from the soaked blank sheets'), onlyIf: 'd12.looked' },
  { id: 'steer', name: L('နောက်တစ်နာရီ', 'The next hour'),
    line: L('မိုးရွာတာကို ဦးလေး ပဲ့ကိုင်လို့ မရဘူး။ ဒါပေမဲ့ နောက်လာမယ့် တစ်နာရီကိုတော့ ဦးလေးကိုယ်တိုင်ပဲ ပဲ့ကိုင်ရမှာ။', "You can't steer the rain. The next hour, only you steer."),
    answers: ['given'], from: L('ခြင်းတောင်း နှစ်လုံးဆီက', 'from the two baskets'), onlyIf: 'd12.sorted' },
  { id: 'seedling', name: L('မဖြစ်သေးတာပါ', 'Not yet'), companion: 'seedling', onlyIf: 'companion:seedling',
    line: L('အားလုံး ပြီးဆုံးသွားတာ မဟုတ်ပါဘူး။ အပင် မပေါက်သေးတာပဲ ရှိတာ။ သံဘူးထဲမှာ မျိုးစေ့တွေ ကျန်ပါသေးတယ်။', "It isn't over. It just hasn't come up yet. There's seed in the tin."),
    answers: ['given'], from: L('မဖြစ်သေးတဲ့ ပျိုးပင်လေး', 'the Not-Yet Seedling') },
  { id: 'earth', name: L('မြေကြီးလိုပဲ', 'Like the earth'), companion: 'earth', onlyIf: 'companion:earth',
    line: L('မြေကြီးက မိုးရေကိုရော နေရောင်ကိုရော အတူတူ လက်ခံပြီး ဘယ်သူ့ကိုမှ ဘာမှ ပြန်မပြောဘူး။', 'The earth takes the rain and the sun alike, and answers neither.'),
    answers: ['hot'], from: L('မြေကြီးလေး', 'the Little Earth') },
  { id: 'nothing', lookalike: true, name: L('ဘာမှ မဖြစ်ပါဘူး', "It's nothing"),
    line: L('ဘာမှ မဖြစ်ပါဘူး ဦးလေးရယ်။ အားလုံး ပြန်ကောင်းသွားမှာပါ။', "It's nothing, uncle. It'll all come back."),
    shows: ['hot', 'given'], really: L('ဆုံးရှုံးမှုက တကယ် မဟုတ်သလိုမျိုး ပြောမိတာ', "talking as if the loss isn't real"),
    backfire: { they: L('ဘာမှ မဖြစ်ဘူး ဟုတ်လား။ အနှစ်လေးဆယ်စာ ပျိုးပင်တွေ ရေထဲ ပါသွားတာလေ။', 'Nothing? Forty years of seedlings in the water!'),
      maya: L('(ဆုံးရှုံးသွားတာက တကယ် ဆုံးရှုံးသွားတာပဲ။ စကားလုံးတွေနဲ့ ဖျောက်ပစ်လို့ မရဘူး။)', "(What's gone is really gone. I can't talk it away.)") } },
  { id: 'unlucky', lookalike: true, name: L('ကံဆိုးလိုက်တာ ဦးလေးရယ်', 'Poor unlucky you'),
    line: L('ဦးလေး တကယ် ကံဆိုးတာပဲ။ ဒုက္ခဆိုတာ ဦးလေးဆီပဲ အမြဲ ရောက်လာတယ်။', 'You really are unlucky. Trouble always finds you.'),
    shows: ['hot'], really: L('"ငါ တစ်ယောက်တည်းပဲ" ဆိုတဲ့ စိတ်ကို ပိုအားပေးမိတာ', 'feeding the "only me"'),
    backfire: { they: L('ဟုတ်တယ်… အမြဲတမ်း ငါ တစ်ယောက်တည်းပဲ…', 'Yes… always me…'),
      maya: L('(ကြင်နာချင်စိတ်နဲ့ "ငါ တစ်ယောက်တည်းပဲ" ဆိုတဲ့ စိတ်ကို ပိုခိုင်မာအောင် လုပ်ပေးလိုက်မိပြီ။)', '(Meaning to be kind, I made "only me" stronger.)') } },
];

/** In the hand only while rumour `onlyme` is unchecked: the town's pencil, not Maya's. */
export const D12_HT_RUMOUR = {
  id: 'r-onlyme', lookalike: true, pencil: true, rumour: 'onlyme', name: L('ကြားခဲ့ရတာ (ခဲတံ)', 'Heard (pencil)'),
  line: L('ဦးလေး စိုက်ခင်း တစ်ခုတည်းပေါ်ကိုပဲ မိုးရွာချတာလို့ လူတွေ ပြောနေကြတယ်။', 'They say the rain fell on your plot alone.'),
  shows: ['hot'], really: L('ဘယ်သူမှ မစစ်ဆေးထားတဲ့ ကောလာဟလ', 'a rumour nobody checked'),
  backfire: { they: L('တွေ့လား။ အားလုံး သိနေတာပဲ။ ငါ တစ်ယောက်တည်းပဲ။', 'See! Everyone knows! Only me!'),
    maya: L('(မစစ်ဆေးရသေးတာကို ပြန်ပြောမိပြီ။ အရင်ဆုံး ဘေးအိမ်ကို ကြည့်လိုက်သင့်တာ။)', "(I repeated what I hadn't checked. I should have looked next door first.)") },
};

const htCard = (id) => (id === 'r-onlyme' ? D12_HT_RUMOUR : D12_HT_CARDS.find((c) => c.id === id));

export const TALK_D12_HPOHTAW = {
  id: 'd12-hpohtaw',
  person: 'hpohtaw',
  with: [],
  steam: 2, calm: 4, turns: 8,
  theirs: [2, 4], // what to do now; which bed first: Step back only (0-based stones)
  // the first hand is dealt in this order, so a look-alike (and, while unchecked, the rumour) is in it from the start
  hand: ['everyone', 'r-onlyme', 'nothing', 'blank', 'unlucky', 'steer', 'seedling', 'earth'].map(htCard),
  stones: [
    { lines: [
      { my: 'ဘာလို့ ငါမှလဲ။ တစ်လမ်းကြားလုံးမှာ ငါ့စိုက်ခင်း တစ်ခုတည်း ပျက်စီးသွားတာ။', en: 'Why me? In the whole lane only my plot is ruined.', need: 'hot', seems: 'envy', face: 'hot', steam: 1,
        tell: L('တခြားသူတွေကို မနာလို ဖြစ်နေတာ မဟုတ်ဘူး၊ ဘေးအိမ်ကို သူ တစ်ချက်မှ မကြည့်ရသေးဘူး။ ရင်ထဲမှာ လောင်ကျွမ်းနေတာ။', "Not envy of the others: he hasn't once looked next door. It's burning inside.") },
      { my: 'အနှစ်လေးဆယ်။ အနှစ်လေးဆယ်လုံးလုံး။', en: 'Forty years. Forty.', need: 'hot', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'အဲဒါ ငါ့ပျိုးပင်တွေပဲ။ တုတ်ချောင်းတိုင်းမှာ ငါ့နာမည် ငါကိုယ်တိုင် ရေးထားတာ။', en: 'Those are MY seedlings. I wrote my name on every stick myself.', need: 'cling', seems: 'given', face: 'sad',
        tell: L('လက်လျှော့နေတာ မဟုတ်ဘူး၊ လက်ချောင်းတွေကြားထဲမှာ နာမည်ရေးထားတဲ့ တုတ်ချောင်းလေးကို လှည့်ကြည့်နေတယ်။ တံခါးအောက်ကနေ လေတိုက်ဝင်လာတဲ့ ရေစိုစာရွက်တွေကို ဒီအတိုင်း ကျော်ခွသွားတယ်။', "Not giving up: he's turning a name stick in his fingers. The soaked sheets blown in under his door he just steps over.") },
      { my: 'လမ်းကြားထဲက စာရွက်တွေလား။ ငါ့ဟာ မဟုတ်ဘူး။ အဲဒါတွေကို ဘယ်သူ ဂရုစိုက်မှာလဲ။', en: 'The sheets in the lane? Not mine. Who cares about those.', need: 'cling', face: 'think', heard: true },
    ] },
    { lines: [
      { my: '…ဒါဆို အခု ငါ ဘာလုပ်ရမလဲ။', en: '…So what do I do now?', need: 'own', seems: 'unknown', face: 'think',
        tell: L('မာရာ့ကို မေးနေတာ မဟုတ်ဘူး။ မျိုးစေ့သံဘူးကို ကြည့်ပြီး သူ့ကိုယ်သူ ပြန်မေးနေတာ။', "He isn't asking Maya. He's looking at the seed tin, asking himself.") },
    ] },
    { lines: [
      { my: 'ပြန်စိုက်လည်း နောက်နှစ်ကျ မိုးက ရွာဦးမှာပဲ။ ဘာထူးမှာလဲ။', en: "Plant again and next year's rain comes anyway. What's the use?", need: 'given', seems: 'hot', face: 'sad', mood: 'down',
        tell: L('ဒေါသထွက်နေတာ မဟုတ်ဘူး။ စင်ပေါ်က မနှစ်က နေ့စဉ်မှတ်တမ်းစာအုပ်ကို ဆွဲထုတ်ပြီး ဖွင့်ထားတယ်- မိုးသည်းသည်းရွာတယ်၊ ပြီးတော့ စိုက်ခင်းတွေ ပြန်ပွင့်လန်းလာတယ်။', "Not anger. He has pulled last year's diary off the shelf and it lies open: heavy rain; and after it the beds bloomed again.") },
      { my: 'မိုးက နှစ်တိုင်း ရွာနေမှာပဲ။ နှစ်တိုင်းပဲ။', en: 'The rain will come every year. Every year.', need: 'given', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'ဟိုဘက်အစွန် စိုက်ခင်းက စရမလား… ဒါမှမဟုတ် ပျိုးခင်းက စရမလား…', en: 'Start with the far bed… or the seedbed…', need: 'own', face: 'think',
        tell: L('သူ ဆုံးဖြတ်နေပြီ။ မျက်လုံးက တံခါးဘေး သံချိတ်မှာ ချိတ်ထားတဲ့ ဂေါ်ပြားသေးလေးဆီ ရောက်သွားပြီ။', "He's deciding. His eyes have gone to the trowel on its nail by the door.") },
    ] },
  ],
  react: {
    miss: L('…ဟင်? အဲဒါ စိုက်ခင်းတွေနဲ့ ဘာမှ မဆိုင်ဘူး။', "…Eh? That's nothing to do with the beds."),
    hot: L('(ဦးဖိုးထော် ရေနစ်သွားတဲ့ ပျိုးပင်တွေကိုပဲ စိုက်ကြည့်နေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', '(U Hpo Htaw stares at the drowned seedlings. Nothing gets through.)'),
    lean: L('အင်း… ဒါဆို မင်း ပြောတဲ့အတိုင်းပဲ လုပ်ပါ့မယ်။ မင်း စီစဉ်လိုက်။', "Hm… then I'll do as you say. You plan it."),
  },
  decision: [
    { my: 'ဒီနေ့ အဖြစ်အပျက်ကို မှတ်တမ်းစာအုပ်ထဲ ဒီအတိုင်း ရေးမှတ်ထားမယ်။ ပြီးရင် ဟိုဘက်အစွန် စိုက်ခင်းက စပြီး ပြန်စိုက်မယ်။', en: "I'll write today in the diary as it is. Then I'll replant, starting with the far bed.", face: 'think' },
    { my: 'ဝိုင်းကူချင်တဲ့သူ လာပါစေ။ ဘယ်သူမှ မလာလည်း ငါ ဆက်စိုက်မယ်။', en: "Whoever comes to help, comes. If nobody does, I'll still plant.", face: 'happy' },
  ],
};

// ---------------------------------------------------------------------------------------------
// ch 20 · Daw Ohn
// ---------------------------------------------------------------------------------------------
export const D12_OHN_CARDS = [
  { id: 'notice', name: L('မဝေကျခင် ဖမ်းမိလိုက်တာ', 'Caught before it boiled'),
    line: L('ထမင်းအိုး မဝေကျခင် အန်တီ ဖမ်းမိလိုက်တာပဲ။ ဒီဒေါသအပူကိုလည်း အဖုံး စလှုပ်ကတည်းက ဖမ်းထိန်းနိုင်မှာပါ။', 'You caught the rice before it boiled. You can catch this heat at its first rattle too.'),
    answers: ['hot'], from: L('မီးဖိုပေါ်က အိုးလေးဆီက', 'from the pot on the stove'), onlyIf: 'd12.lid' },
  { id: 'firefly', name: L('သူတို့ မသိသေးဘူး', "They don't know yet"), companion: 'firefly', onlyIf: 'companion:firefly',
    line: L('အိုးအဖုံး ဘာလို့ ခုန်နေလဲ ကလေးတွေ မသိသေးဘူး။ ပြပေးလိုက်ရင် သူတို့ သိသွားမှာပါ။', "The kids don't know yet why a lid jumps. Show them and they'll know."),
    answers: ['hot'], from: L('ပိုးစုန်းကြူးလေး', 'the Firefly') },
  { id: 'glad', name: L('သူ ကြိုးစားထားလို့ ရတာပါ', 'She worked for it'), companion: 'ribbon', onlyIf: 'companion:ribbon',
    line: L('သူ့ဆိုင်နောက်က အိုးကွဲပုံကြီးကို တွေ့လား။ သူ ကြိုးစားထားလို့ ရတာပါ။ သူ့အတွက် ဝမ်းသာပေးလိုက်ကြရအောင်။', "See the shard heap behind her stall? She worked for it. Let's be glad for her."),
    answers: ['envy'], from: L('အမြီးနှစ်ခွ ဖဲကြိုးလေး', 'the Two-Tailed Ribbon') },
  { id: 'today', name: L('ဒီနေ့ အတွက်ပဲ', 'Only for today'),
    line: L('တစ်ခါ ဝေကျရုံနဲ့ တစ်သက်လုံး ဒေါသအိုး ဖြစ်မသွားပါဘူး။ တစ်ခါ အောင်မြင်ရုံနဲ့လည်း တစ်သက်လုံး အတွက် မဟုတ်ပါဘူး။', "One boil-over doesn't make you an anger pot for life. One pass isn't for life either."),
    answers: ['afraid'], from: L('မိချိုရဲ့ အိုးလေးလုံးဆီက', "from Mi Cho's four pots") },
  { id: 'nextbuyer', name: L('နောက်ထပ် ဝယ်မယ့်သူ', 'The next buyer'),
    line: L('အန်တီ့အတွက် အလေးချိန် လျော့နေရင် တန်းစီနေတဲ့ ကောင်မလေးအတွက်လည်း လျော့နေမှာပဲ။', "If it's short for you, it's short for the girl in the queue too."),
    answers: ['given'], from: L('ချိန်ခွင်တန်းစီနေတာကို ကြည့်မိရာက', 'from watching the scale queue'), onlyIf: 'd12.mlooked' },
  // ch 18's quiet correction is for a mistake (the children's); the trader's deliberate wrong goes through the
  // committee (p97-98), so this card must not read as "tell him quietly" (lesson audit)
  { id: 'quiet', name: L('တိုးတိုးတိတ်တိတ်ပဲ', 'Quietly'), companion: 'note', onlyIf: 'companion:note',
    line: L('တစ်ခန်းလုံး ကြားအောင် ကလေးတွေကို မအော်ပါနဲ့။ အနားသွားပြီး တိုးတိုးတိတ်တိတ်ပဲ ပြောပြလိုက်ပါ။', "Don't shout at the kids for the whole hall to hear. Go over and tell them quietly."),
    answers: ['hot'], from: L('ခေါက်ထားတဲ့ စာရွက်လေး', 'the Folded Note') },
  { id: 'bepatient', lookalike: true, name: L('သည်းခံလိုက်ပါတော့', 'Just be patient'),
    line: L('ထားလိုက်ပါတော့ အန်တီရယ်။ သည်းခံလိုက်ရင် ပြီးသွားမှာပါ။', "Let it go, aunty. Be patient and it's over."),
    shows: ['given', 'hot'], really: L('အသိဉာဏ် မပါတဲ့ သည်းခံခြင်း', 'patience without good sense'),
    backfire: { they: L('အင်း… ထားလိုက်ပါတော့မယ်။ (အပြင်က ချိန်ခွင်နားမှာ ကောင်မလေးက ပိုက်ဆံ ပေးနေပြီ။)', "Yes… I'll let it go. (Outside at the scale, the girl hands over her money.)"),
      maya: L('(သည်းခံတာ ကောင်းပါတယ်။ ဒါပေမဲ့ အသိဉာဏ် မပါရင် နောက်တစ်ယောက် အလိမ်ခံရလိမ့်မယ်။)', '(Patience is good, but without good sense the next one gets cheated.)') } },
  { id: 'tellhim', lookalike: true, name: L('သွားဆူလိုက်စမ်းပါ', 'Go tell him off'),
    line: L('သွားလိုက်စမ်းပါ။ အားလုံးရှေ့မှာ သူ ဘယ်လိုလူလဲဆိုတာ ပြောပစ်လိုက်။', 'Go on! Tell him what he is, in front of everyone!'),
    shows: ['given'], really: L('ကိုယ့်ပါးစပ် ကိုယ် အညစ်အကြေး ပေစေတာ', 'dirtying your own mouth'),
    backfire: { they: L('(ဒေါ်အုန်း တစ်ဝက်လောက် ထရပ်လိုက်တယ်၊ အိုးအဖုံးက ဒုန်းခနဲ မြည်သွားတယ်။) …အဲဒီလို လူမျိုးအတွက် ငါ့ပါးစပ်ကို အညစ်အကြေး မပေစေဘူး။', "(Daw Ohn half rises; the lid bangs.) …I won't dirty my mouth over a man like that."),
      maya: L('(ငါ အပူ ထပ်ဖြည့်ပေးလိုက်မိပြီ။)', '(I just added heat.)') } },
];

const ohnCard = (id) => D12_OHN_CARDS.find((c) => c.id === id);

export const TALK_D12_DAWOHN = {
  id: 'd12-dawohn',
  person: 'dawohn',
  with: ['micho'],
  steam: 2, calm: 4, turns: 8,
  stepBack: true, // the last stone is hers
  // first hand: notice, bepatient, firefly, today (one look-alike in view from the start)
  hand: ['notice', 'bepatient', 'firefly', 'today', 'glad', 'nextbuyer', 'tellhim', 'quiet'].map(ohnCard),
  stones: [
    { lines: [
      { my: 'အဲဒီကလေးတွေ။ အဘွားကြီး တစ်ယောက်ရဲ့ အိုးကို တိုက်ချပြီး ရယ်နေကြတယ်။', en: "Those kids! Knocking an old woman's pot and laughing.", need: 'hot', seems: 'looksdown', face: 'hot', steam: 1,
        tell: L('အထင်သေးနေတာ မဟုတ်ဘူး၊ သူတို့ ပြေးထွက်သွားတာကို လိုက်ကြည့်နေတာ။ ရင်ထဲမှာ ပူလောင်နေတာ။', "Not looking down on them: she watches them run off. It's heat inside.") },
      { my: '"ဒေါသအိုး" တဲ့… သူတို့ ပြောတာ မှန်မှာပါ။ ငါ မွေးကတည်းက အဲဒီလို ဖြစ်လာတာ ထင်ပါတယ်။', en: '"Anger pot"… maybe they\'re right. Maybe I was born that way.', need: 'afraid', seems: 'hot', face: 'sad',
        tell: L('ဒေါသထွက်နေတာ မဟုတ်ဘူး။ တစ်ချိန်က "မလုပ်နိုင်ဘူး" လို့ သူ ခြစ်ချခဲ့တဲ့ မိချိုရဲ့ အိုးလေးလုံးကို လှမ်းကြည့်နေတယ်။ သူ တစ်သက်လုံး ဒီလိုပဲ ဖြစ်သွားမှာကို ကြောက်နေတာ။', "Not anger. She glances at Mi Cho's four pots: the girl she once chalked \"can't\" for. She's afraid she'll be this way for life.") },
    ] },
    { lines: [
      { my: 'ခန်းမ ဟိုဘက်ခြမ်းက ကောင်မလေးက မွန်းမတည့်ခင်ကတည်းက ရောင်းကုန်သွားပြီ။ ငါ့ကို တစ်ချက်တောင် ခေါင်းမညိတ်ပြဘူး။', en: "That girl across the hall sells out before noon. She hasn't nodded to me once.", need: 'envy', seems: 'hot', face: 'think',
        tell: L('စိတ်တိုနေတာ မဟုတ်ဘူး၊ အဲဒီ ညီညာလှပတဲ့ အပြာရောင် စဉ့်ရည်သုတ်လက်ရာကနေ မျက်လုံး မခွာနိုင် ဖြစ်နေတာ။', "Not temper: she can't take her eyes off that even blue glaze.") },
      { my: 'အဲဒီလို စဉ့်ရည်မျိုး ရဖို့ မီးဖို အကြိမ်လေးဆယ် ဖုတ်ရတယ်လို့ ပြောကြတယ်။', en: 'Forty firings to get a glaze like that, they say.', need: 'envy', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'ပြီးတော့ ငါ့ဆန်ကလည်း အလေးချိန် ထပ်လျော့နေပြန်ပြီ။ ရပါတယ်။ ငါ သည်းခံနေပါတယ်။', en: "And my rice came short again. It's fine. I'm being patient.", need: 'given', seems: 'own', face: 'think', mood: 'down',
        tell: L('"သည်းခံတယ်" လို့ ပြောနေပေမဲ့ သူ့လက်က ပါးလျနေတဲ့ ဆန်အိတ်ကို မလွှတ်နိုင်ဘူး၊ တံခါးအပြင်ဘက်မှာ တန်းစီနေတဲ့ ကောင်မလေးကိုပဲ လှမ်းလှမ်းကြည့်နေတယ်။ တရားမျှတမှုကို သူ လက်လျှော့ထားပြီ။', 'She says "patient", but her hand won\'t let go of her thin rice bag, and she keeps glancing out of the door at the girl in the queue. She has given up on fairness.') },
    ] },
    { lines: [
      { my: '…ငါ့ဘာသာ ပြန်ချိန်ကြည့်မယ်။ ငါ ယုံကြည်ရတဲ့ အလေးချိန်ခွင်နဲ့ပေါ့။', en: "…I'll weigh it myself. With a weight I can trust.", need: 'own', face: 'think',
        tell: L('သူ ဆုံးဖြတ်နေပြီ။ ဆန်အိတ်ကို သူ့ဘာသာ ပြန်ကောက်ကိုင်လိုက်ပြီ။', "She's deciding. She has already picked up the rice bag herself.") },
    ] },
  ],
  react: {
    miss: L('…အဲဒါ ဆန်နဲ့ ဘာမှ မဆိုင်ဘူး ကလေးရဲ့။', "…That's nothing to do with the rice, dear."),
    hot: L('(ဒေါ်အုန်း မီးသွေးခဲတွေကို ယပ်တောင်နဲ့ အပြင်းအထန် ခတ်နေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', '(Daw Ohn fans the coals hard. Nothing gets through.)'),
    lean: L('ဒါဆို သမီးပဲ ငါ့အတွက် သွားချိန်ပေးပါဦး ကလေးရယ်…', 'Then you go and weigh it for me, dear…'),
  },
  decision: [
    { my: 'ငါ့ဘာသာ ချိန်ကြည့်မယ်။ တွေ့သမျှကို ကော်မတီဆီ ငါ့ဘာသာ ယူသွားမယ်။ အမှန်တရား အတိုင်းပဲ။', en: "I'll weigh it myself. What I find, I'll take to the committee myself. Facts only.", face: 'think' },
    { my: 'မအော်တော့ဘူး။ ကလေးတွေ ကြည့်ချင်ရင် ကြည့်ကြပါစေ။', en: 'No shouting. The kids can watch if they like.', face: 'smile' },
    // her Number Two ends "do your best; the rest, each gets what they work for" (p96)
    { my: 'ငါ့အိုးတွေကို အကောင်းဆုံး ဖြစ်အောင် လုပ်မယ်။ ရောင်းရသလောက် ရောင်းရပါစေ။', en: "I'll make my pots as well as I can. What sells, sells.", face: 'think' },
  ],
};
