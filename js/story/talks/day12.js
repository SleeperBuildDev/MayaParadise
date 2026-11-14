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
  { id: 'everyone', name: L('လူတိုင်းဆီ ရောက်တယ်', 'It came to everyone'),
    line: L('ဘူးစင်လည်း လဲတယ်။ ကျွန်မ ပန်းခင်းလည်း လဲတယ်။ မိုးက ဦးဦးကို ရွေးပြီး ရွာတာ မဟုတ်ဘူး။', "The gourd trellis is down. My bed too. The rain didn't pick you out."),
    answers: ['hot'], from: L('လမ်းကြားကို ကြည့်ပြီး ရခဲ့တာ', 'from looking along the lane'), onlyIf: 'd12.looked' },
  { id: 'blank', name: L('နာမည်မပါတဲ့ စာရွက်', 'The sheets with no name'),
    line: L('လမ်းထဲက စာရွက်တွေလည်း စိုတာပဲ။ ဘယ်သူမှ မငိုဘူး။ "ငါ့ဟာ" လို့ ခေါ်ထားတာမှ နာတာ။', 'The sheets in the lane got soaked too. Nobody cried. It\'s what we call "mine" that hurts.'),
    answers: ['cling'], from: L('စိုနေတဲ့ စာရွက်လွတ်တွေ', 'from the soaked blank sheets'), onlyIf: 'd12.looked' },
  { id: 'steer', name: L('နောက်တစ်နာရီ', 'The next hour'),
    line: L('မိုးကို ဦးဦး မထိန်းနိုင်ဘူး။ နောက်တစ်နာရီကိုတော့ ဦးဦးပဲ ထိန်းတာ။', "You can't steer the rain. The next hour, only you steer."),
    answers: ['given'], from: L('ခြင်းတောင်း နှစ်လုံး', 'from the two baskets'), onlyIf: 'd12.sorted' },
  { id: 'seedling', name: L('မရသေးဘူး', 'Not yet'), companion: 'seedling', onlyIf: 'companion:seedling',
    line: L('ပြီးသွားပြီ မဟုတ်ဘူး။ မပေါက်သေးတာပဲ။ သံဗူးထဲမှာ မျိုးစေ့ ရှိသေးတယ်။', "It isn't over. It just hasn't come up yet. There's seed in the tin."),
    answers: ['given'], from: L('မရသေးပျိုးပင်', 'the Not-Yet Seedling') },
  { id: 'earth', name: L('မြေကြီးလို', 'Like the earth'), companion: 'earth', onlyIf: 'companion:earth',
    line: L('မြေကြီးက မိုးကိုလည်း ခံတယ်။ နေကိုလည်း ခံတယ်။ ဘာမှ ပြန်မပြောဘူး။', 'The earth takes the rain and the sun alike, and answers neither.'),
    answers: ['hot'], from: L('မြေကြီးလေး', 'the Little Earth') },
  { id: 'nothing', lookalike: true, name: L('ဘာမှ မဖြစ်ပါဘူး', "It's nothing"),
    line: L('ဘာမှ မဖြစ်ပါဘူး ဦးဦးရယ်။ ပြန်ပေါက်လာမှာပါ။', "It's nothing, uncle. It'll all come back."),
    shows: ['hot', 'given'], really: L('ဆုံးရှုံးတာကို မရှိသလို ပြောတာ', "talking as if the loss isn't real"),
    backfire: { they: L('ဘာမှ မဖြစ်? အနှစ်လေးဆယ်စာ ပျိုးပင်တွေ ရေထဲမှာ!', 'Nothing? Forty years of seedlings in the water!'),
      maya: L('(ပျောက်သွားတာ တကယ် ပျောက်တာ။ မရှိသလို ပြောလို့ မရဘူး။)', "(What's gone is really gone. I can't talk it away.)") } },
  { id: 'unlucky', lookalike: true, name: L('ကံဆိုးလိုက်တာ', 'Poor unlucky you'),
    line: L('ဦးဦးက တကယ် ကံဆိုးတာပဲ။ ဒုက္ခတွေ ဦးဦးဆီပဲ လာတာ။', 'You really are unlucky. Trouble always finds you.'),
    shows: ['hot'], really: L('"ငါ့မှ" ဆိုတဲ့ အတွေးကို ထပ်ထည့်ပေးတာ', 'feeding the "only me"'),
    backfire: { they: L('ဟုတ်တယ်… အမြဲ ငါ့ကိုပဲ…', 'Yes… always me…'),
      maya: L('(သနားတယ်လို့ ထင်ပြီး "ငါ့ကိုပဲ" ကို ပိုခိုင်အောင် လုပ်လိုက်မိပြီ။)', '(Meaning to be kind, I made "only me" stronger.)') } },
];

/** In the hand only while rumour `onlyme` is unchecked: the town's pencil, not Maya's. */
export const D12_HT_RUMOUR = {
  id: 'r-onlyme', lookalike: true, pencil: true, rumour: 'onlyme', name: L('ကြားခဲ့တာ (ခဲတံ)', 'Heard (pencil)'),
  line: L('မိုးက ဦးဦးခြံကိုပဲ ရွာတာတဲ့။', 'They say the rain fell on your plot alone.'),
  shows: ['hot'], really: L('မစစ်ရသေးတဲ့ ကောလာဟလ', 'a rumour nobody checked'),
  backfire: { they: L('တွေ့လား! လူတိုင်း သိတယ်! ငါ့ကိုပဲ!', 'See! Everyone knows! Only me!'),
    maya: L('(ကိုယ်တိုင် မစစ်ရသေးတာကို ပြောလိုက်မိပြီ။ ဘေးခြံကို အရင် ကြည့်ရမှာ။)', "(I repeated what I hadn't checked. I should have looked next door first.)") },
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
      { my: 'ဘာလို့ ငါ့ကိုမှ ဖြစ်ရတာလဲ။ တစ်လမ်းလုံးမှာ ငါ့ခြံပဲ ပျက်တယ်။', en: 'Why me? In the whole lane only my plot is ruined.', need: 'hot', seems: 'envy', face: 'hot', steam: 1,
        tell: L('တခြားခြံတွေကို မနာလိုတာ မဟုတ်ဘူး။ ဘေးခြံကို တစ်ချက်မှ မကြည့်ရသေးဘူး။ ရင်ထဲ ပူနေတာ။', "Not envy of the others: he hasn't once looked next door. It's burning inside.") },
      { my: 'အနှစ်လေးဆယ်။ လေးဆယ်။', en: 'Forty years. Forty.', need: 'hot', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'ဒါ ငါ့ ပျိုးပင်တွေ။ တုတ်ချောင်းတိုင်းမှာ ငါ့နာမည် ကိုယ်တိုင် ရေးထားတာ။', en: 'Those are MY seedlings. I wrote my name on every stick myself.', need: 'cling', seems: 'given', face: 'sad',
        tell: L('လက်လျှော့တာ မဟုတ်ဘူး။ နာမည်တုတ်ကို လက်ထဲမှာ လှည့်နေတယ်။ တံခါးအောက်က လွင့်ဝင်လာတဲ့ စိုစိုစာရွက်တွေကိုတော့ ကျော်နင်းသွားတာပဲ။', "Not giving up: he's turning a name stick in his fingers. The soaked sheets blown in under his door he just steps over.") },
      { my: 'လမ်းထဲက စာရွက်တွေ? ငါ့ဟာ မဟုတ်ဘူး။ ဘယ်သူ ဂရုစိုက်လို့လဲ။', en: 'The sheets in the lane? Not mine. Who cares about those.', need: 'cling', face: 'think', heard: true },
    ] },
    { lines: [
      { my: '…ဒါဆို အခု ဘာလုပ်ရမလဲ။', en: '…So what do I do now?', need: 'own', seems: 'unknown', face: 'think',
        tell: L('မာရာ့ကို မေးတာ မဟုတ်ဘူး။ သံဗူးကို ကြည့်ပြီး ကိုယ့်ကိုယ်ကို မေးနေတာ။', "He isn't asking Maya. He's looking at the seed tin, asking himself.") },
    ] },
    { lines: [
      { my: 'ပြန်စိုက်လည်း နောက်နှစ် မိုးက ပြန်လာဦးမှာပဲ။ ဘာအသုံးကျလို့လဲ။', en: "Plant again and next year's rain comes anyway. What's the use?", need: 'given', seems: 'hot', face: 'sad', mood: 'down',
        tell: L('ဒေါသ မဟုတ်ဘူး။ စင်ပေါ်က မနှစ်က မှတ်တမ်းစာအုပ်ကို ဆွဲချပြီး ဖွင့်ထားတယ်: မိုးကြီး၊ ပြီးတော့ ပန်းခင်းတွေ ပြန်ပွင့်ခဲ့တယ်။', "Not anger. He has pulled last year's diary off the shelf and it lies open: heavy rain; and after it the beds bloomed again.") },
      { my: 'မိုးက နှစ်တိုင်း လာမှာပဲ။ နှစ်တိုင်း။', en: 'The rain will come every year. Every year.', need: 'given', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'အဝေးဆုံး ခင်းကနေ စမလား… ဒါမှမဟုတ် ပျိုးခင်းကနေ…', en: 'Start with the far bed… or the seedbed…', need: 'own', face: 'think',
        tell: L('ဆုံးဖြတ်နေပြီ။ တံခါးဘေး သံချောင်းပေါ်က ပေါက်တူးကို လှမ်းကြည့်နေပြီ။', "He's deciding. His eyes have gone to the trowel on its nail by the door.") },
    ] },
  ],
  react: {
    miss: L('…ဟင်? အဲဒါ ပန်းခင်းနဲ့ မဆိုင်ဘူး။', "…Eh? That's nothing to do with the beds."),
    hot: L('(ဦးဖိုးထော် ရေထဲက ပျိုးပင်တွေကိုပဲ စိုက်ကြည့်နေတယ်။ ဘာမှ မကြားဘူး။)', '(U Hpo Htaw stares at the drowned seedlings. Nothing gets through.)'),
    lean: L('အင်း… ဒါဆို မင်း ပြောတဲ့အတိုင်း လုပ်မယ်။ မင်းပဲ စီစဉ်ပေးတော့။', "Hm… then I'll do as you say. You plan it."),
  },
  decision: [
    { my: 'ဒီနေ့ကို ရှိတဲ့အတိုင်း မှတ်တမ်းထဲ ရေးမယ်။ ပြီးရင် အဝေးဆုံးခင်းကနေ ပြန်စိုက်မယ်။', en: "I'll write today in the diary as it is. Then I'll replant, starting with the far bed.", face: 'think' },
    { my: 'လာကူမယ့်သူ လာမှာပေါ့။ မလာလည်း ငါ စိုက်မှာပဲ။', en: "Whoever comes to help, comes. If nobody does, I'll still plant.", face: 'happy' },
  ],
};

// ---------------------------------------------------------------------------------------------
// ch 20 · Daw Ohn
// ---------------------------------------------------------------------------------------------
export const D12_OHN_CARDS = [
  { id: 'notice', name: L('မပွက်ခင် မိတယ်', 'Caught before it boiled'),
    line: L('ထမင်းအိုးကို မပွက်ခင် မိခဲ့တာပဲ။ ဒီအပူကိုလည်း စခုန်တာနဲ့ မိနိုင်တာပဲ။', 'You caught the rice before it boiled. You can catch this heat at its first rattle too.'),
    answers: ['hot'], from: L('မီးဖိုပေါ်က အိုး', 'from the pot on the stove'), onlyIf: 'd12.lid' },
  { id: 'firefly', name: L('မသိသေးလို့', "They don't know yet"), companion: 'firefly', onlyIf: 'companion:firefly',
    line: L('ကလေးတွေက အိုးဖုံး ဘာလို့ ခုန်လဲ မသိသေးလို့ပါ။ ပြလိုက်ရင် သိသွားမှာ။', "The kids don't know yet why a lid jumps. Show them and they'll know."),
    answers: ['hot'], from: L('ပိုးစုန်းကြူး', 'the Firefly') },
  { id: 'glad', name: L('ကြိုးစားလို့ ရတာ', 'She worked for it'), companion: 'ribbon', onlyIf: 'companion:ribbon',
    line: L('ဟိုဆိုင်နောက်က စမ်းအိုးကွဲပုံ မြင်လား။ ကြိုးစားလို့ ရတာ။ ဝမ်းသာပေးလိုက်ရအောင်။', "See the shard heap behind her stall? She worked for it. Let's be glad for her."),
    answers: ['envy'], from: L('သူလည်းကိုယ်လည်း ဖဲကြိုး', 'the Two-Tailed Ribbon') },
  { id: 'today', name: L('ဒီနေ့အတွက်ပဲ', 'Only for today'),
    line: L('တစ်ခါ လျှံတိုင်း ဒေါသအိုး ဖြစ်မသွားဘူး။ တစ်ခါ အောင်တိုင်းလည်း တစ်သက်လုံး မဟုတ်ဘူး။', "One boil-over doesn't make you an anger pot for life. One pass isn't for life either."),
    answers: ['afraid'], from: L('မိချိုရဲ့ အိုးလေးလုံး', "from Mi Cho's four pots") },
  { id: 'nextbuyer', name: L('နောက်လူ', 'The next buyer'),
    line: L('ဒေါ်ဒေါ့်အတွက် လျော့ရင် တန်းစီနေတဲ့ ကလေးမလေးအတွက်လည်း လျော့မှာပဲ။', "If it's short for you, it's short for the girl in the queue too."),
    answers: ['given'], from: L('ချိန်ခွင်တန်းကို ကြည့်ပြီး ရခဲ့တာ', 'from watching the scale queue'), onlyIf: 'd12.mlooked' },
  // ch 18's quiet correction is for a mistake (the children's); the trader's deliberate wrong goes through the
  // committee (p97-98), so this card must not read as "tell him quietly" (lesson audit)
  { id: 'quiet', name: L('တိုးတိုးလေး', 'Quietly'), companion: 'note', onlyIf: 'companion:note',
    line: L('ကလေးတွေကို ဈေးတစ်ခုလုံး ကြားအောင် မအော်နဲ့။ သူတို့နား သွားပြီး တိုးတိုးလေး ပြောပြပါ။', "Don't shout at the kids for the whole hall to hear. Go over and tell them quietly."),
    answers: ['hot'], from: L('ခေါက်စာလေး', 'the Folded Note') },
  { id: 'bepatient', lookalike: true, name: L('သည်းခံလိုက်ပါ', 'Just be patient'),
    line: L('ထားလိုက်ပါ ဒေါ်ဒေါ်။ သည်းခံလိုက်ရင် ပြီးတာပဲ။', "Let it go, aunty. Be patient and it's over."),
    shows: ['given', 'hot'], really: L('အသိဉာဏ် မပါတဲ့ သည်းခံခြင်း', 'patience without good sense'),
    backfire: { they: L('ဟုတ်ပါတယ်… ထားလိုက်မယ်။ (အပြင်က ချိန်ခွင်မှာ ကလေးမလေး ပိုက်ဆံ ပေးလိုက်ပြီ။)', "Yes… I'll let it go. (Outside at the scale, the girl hands over her money.)"),
      maya: L('(သည်းခံတာ ကောင်းပေမဲ့ အသိဉာဏ် မပါရင် နောက်လူ ထပ်ခံရတယ်။)', '(Patience is good, but without good sense the next one gets cheated.)') } },
  { id: 'tellhim', lookalike: true, name: L('သွားပြောလိုက်', 'Go tell him off'),
    line: L('သွား! ဘယ်လိုလူလဲဆိုတာ လူအများရှေ့မှာ ပြောလိုက်!', 'Go on! Tell him what he is, in front of everyone!'),
    shows: ['given'], really: L('ပါးစပ် ညစ်ပတ်ခံတာ', 'dirtying your own mouth'),
    backfire: { they: L('(ဒေါ်အုန်း ထရပ်တယ်။ အိုးဖုံး ဒေါင်းခနဲ ခုန်တယ်။) …အဲဒီလိုလူအတွက် ကျွန်မ ပါးစပ် မညစ်ချင်ဘူး။', "(Daw Ohn half rises; the lid bangs.) …I won't dirty my mouth over a man like that."),
      maya: L('(အပူကို ပိုထည့်ပေးလိုက်မိပြီ။)', '(I just added heat.)') } },
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
      { my: 'ဒီကလေးတွေ! အဘွားကြီးကို တုတ်နဲ့ ခေါက်ပြီး ရယ်နေကြတယ်။', en: "Those kids! Knocking an old woman's pot and laughing.", need: 'hot', seems: 'looksdown', face: 'hot', steam: 1,
        tell: L('ကလေးတွေကို အထင်သေးတာ မဟုတ်ဘူး။ သူတို့ ပြေးသွားတာကို လိုက်ကြည့်နေတယ်။ ရင်ထဲ ပူနေတာ။', "Not looking down on them: she watches them run off. It's heat inside.") },
      { my: 'ဒေါသအိုးတဲ့… ဟုတ်ချင်လည်း ဟုတ်မှာပေါ့။ ကျွန်မက အဲဒီလို မွေးလာတာ။', en: '"Anger pot"… maybe they\'re right. Maybe I was born that way.', need: 'afraid', seems: 'hot', face: 'sad',
        tell: L('ဒေါသ မဟုတ်ဘူး။ မိချိုရဲ့ အိုးလေးလုံးကို လှမ်းကြည့်နေတယ်။ "မရဘူး" လို့ တစ်ခါ ရေးခဲ့ဖူးတဲ့ ကလေး။ ကိုယ်လည်း တစ်သက်လုံး ဒီလိုပဲ ဖြစ်နေမှာ ကြောက်နေတာ။', "Not anger. She glances at Mi Cho's four pots: the girl she once chalked \"can't\" for. She's afraid she'll be this way for life.") },
    ] },
    { lines: [
      { my: 'ဟိုဆိုင်က ကောင်မလေး၊ နေ့လယ်မရောက်ခင် ကုန်တယ်။ ကျွန်မကို ခေါင်းတစ်ချက်တောင် မညိတ်ဘူး။', en: "That girl across the hall sells out before noon. She hasn't nodded to me once.", need: 'envy', seems: 'hot', face: 'think',
        tell: L('စိတ်တိုတာ မဟုတ်ဘူး။ ဟိုဆိုင်ရဲ့ အပြာရောင် ညီညီလေးကို မျက်စိ မခွာဘဲ ကြည့်နေတယ်။', "Not temper: she can't take her eyes off that even blue glaze.") },
      { my: 'အဲဒီ ဆေးရောင်ရဖို့ အကြိမ်လေးဆယ် ဖုတ်ရတယ်တဲ့။', en: 'Forty firings to get a glaze like that, they say.', need: 'envy', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'ဆန်ကလည်း ထပ်လျော့ပြန်ပြီ။ ရပါတယ်။ ကျွန်မ သည်းခံနေတာ။', en: "And my rice came short again. It's fine. I'm being patient.", need: 'given', seems: 'own', face: 'think', mood: 'down',
        tell: L('"သည်းခံ" လို့ ပြောပေမဲ့ ဆန်အိတ်ပါးပါးလေးကို လက်က မလွှတ်ဘူး။ တံခါးအပြင် တန်းထဲက ကလေးမလေးဆီ ခဏခဏ လှမ်းကြည့်တယ်။ မျှတမှုကို လက်လျှော့ထားတာ။', 'She says "patient", but her hand won\'t let go of her thin rice bag, and she keeps glancing out of the door at the girl in the queue. She has given up on fairness.') },
    ] },
    { lines: [
      { my: '…ကျွန်မ ကိုယ်တိုင် ချိန်ကြည့်မယ်။ ယုံရတဲ့ ချိန်သီးနဲ့။', en: "…I'll weigh it myself. With a weight I can trust.", need: 'own', face: 'think',
        tell: L('ဆုံးဖြတ်နေပြီ။ ဆန်အိတ်ကို ကိုယ်တိုင် ဆွဲယူထားပြီ။', "She's deciding. She has already picked up the rice bag herself.") },
    ] },
  ],
  react: {
    miss: L('…အဲဒါက ဆန်နဲ့ မဆိုင်ဘူး သမီး။', "…That's nothing to do with the rice, dear."),
    hot: L('(ဒေါ်အုန်း မီးဖိုကို ယပ်နဲ့ ခပ်ပြင်းပြင်း ခတ်နေတယ်။ ဘာမှ မကြားဘူး။)', '(Daw Ohn fans the coals hard. Nothing gets through.)'),
    lean: L('ဒါဆို သမီးပဲ သွားချိန်ပေးပါတော့…', 'Then you go and weigh it for me, dear…'),
  },
  decision: [
    { my: 'ကိုယ်တိုင် ချိန်မယ်။ တွေ့တာကို ကော်မတီဆီ ကိုယ်တိုင် ယူသွားမယ်။ အမှန်တွေပဲ။', en: "I'll weigh it myself. What I find, I'll take to the committee myself. Facts only.", face: 'think' },
    { my: 'အော်ဟစ်တာ မရှိဘူး။ ကလေးတွေ ကြည့်ချင်ကြည့်ပါစေ။', en: 'No shouting. The kids can watch if they like.', face: 'smile' },
    // her Number Two ends "do your best; the rest, each gets what they work for" (p96)
    { my: 'ကိုယ့်အိုး ကိုယ် အကောင်းဆုံး လုပ်မယ်။ ရောင်းရတာ ရောင်းရသလောက်ပဲ။', en: "I'll make my pots as well as I can. What sells, sells.", face: 'think' },
  ],
};
