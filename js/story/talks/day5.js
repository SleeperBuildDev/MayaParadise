// Day 5's two talks (day5-spec 5.4 and 6.5). Format: see the top of js/story/talk.js.
// Burmese lines are drafts for Maya to proofread.
//
// Ko Lwin (ch 10 မုဒိတာ, inside his carving shop `carvershop`): he doesn't know what her win cost her (he
// never looked), he is hot inside and calls it calm, and the "I" wants something back (keep her, be
// remembered). Envy is only a pencil label: the book frames it as a thought anyone gets, not a trait.
// Look-alikes: Lucky You (removed for good at the end of ch 10) and Just Ignore Them (until Day 6).
//
// Ko Thiha (ch 2 လူ့ဘဝ, on Little Jetty): he has given up (drifting is easier), doesn't know that hardship
// meets the ferry too or that anyone needs his raft, and is afraid of wasting his mother's patches.
// Look-alikes: the two wrong answers he was offered on the raft (blame the stream / race the ferry).

export const D5_KL_CARDS = [
  { id: 'forty', name: { my: 'သစ်သားတုံး လေးဆယ်', en: 'Forty blocks' },
    line: { my: 'ကံကောင်းသွားတာ မဟုတ်ဘူး။ တစ်ညကို တစ်တုံးနှုန်းနဲ့ အတုံးလေးဆယ်။ ကျွန်မ ကိုယ်တိုင် မြင်ခဲ့တာ။', en: "It wasn't luck. One a night, forty blocks. I saw them myself." },
    answers: ['unknown'], from: { my: 'ခွာညိုရဲ့ အိတ်ထဲမှာ မြင်ခဲ့ရတာ', en: "seen in Khwar Nyo's bag" } },
  { id: 'burns', name: { my: 'ကိုယ့်ကို အရင် လောင်ကျွမ်းစေတယ်', en: 'It burns you first' },
    line: { my: 'အဲဒီအတွေးက သူ့ကို လောင်ကျွမ်းစေတာ မဟုတ်ဘူး။ ရှင့်ကို အရင် လောင်ကျွမ်းစေတာ။ ရှင့်မီးဖိုတောင် မီးငြိမ်းသွားပြီ။', en: "That thought doesn't burn her. It burns you. Even your brazier has gone out." },
    answers: ['hot'], from: { my: 'အေးစက်နေတဲ့ ခုံတန်းမှာ မြင်ခဲ့ရတာ', en: 'seen at the cold bench' } },
  { id: 'bothfine', name: { my: 'နှစ်ဖက်စလုံး', en: 'Both sides' },
    line: { my: 'တစ်ယောက်တည်းပဲ အဆင်ပြေနေရင် မှန်ကန်တဲ့ ရွေးချယ်မှု မဟုတ်သေးဘူး။ သူလည်း အဆင်ပြေတယ်၊ ရှင်လည်း အဆင်ပြေတယ် ဆိုမှ မှန်တာ။', en: "If only one of you is fine, it isn't the right choice. She's fine, and you're fine: then it is." },
    answers: ['cling'], from: { my: 'သူ့အလုပ်ခေါ်စာကို ဖတ်မိရာက', en: 'from reading her offer letter' } },
  { id: 'cool', companion: 'cloud', name: { my: 'အေးမြတဲ့ ဆုတောင်း', en: 'A cool wish' }, // the Cool Cloud
    line: { my: 'သူများအတွက် ဆုတောင်းပေးတာက ဘာမှ ပြန်မမျှော်လင့်ဘူး။ ပြန်မမျှော်လင့်တော့ ပူလောင်မှုလည်း မရှိဘူးပေါ့။', en: "Wishing someone well asks nothing back. Asking nothing, it doesn't burn." },
    answers: ['cling', 'hot'], from: { my: 'တိမ်အေး', en: 'the Cool Cloud' } },
  { id: 'pot', companion: 'pot', name: { my: 'ကိုယ့်အိုးလေး အရင်ဖြည့်ပါဦး', en: 'Your own pot first' }, // the Little Pot: his goodwill pot is the empty one (ch 6 p47)
    line: { my: 'သူများအိုးထဲ မဖြည့်ခင် ကိုယ့်အိုးလေး အရင် ပြည့်နေဖို့ လိုတယ်။ ရှင့်မှာ ဆောက်တွေရော လက်ရာရော ရှိပြီးသား။ စေတနာလေးပဲ ခန်းခြောက်နေတာ။', en: "Before you fill someone else's pot, your own must be full. You have the gouges and the hand. It's the goodwill that's run dry." },
    answers: ['hot'], from: { my: 'အိုးသေးသေးလေး', en: 'the Little Pot' } },
  { id: 'lucky', lookalike: true, name: { my: 'ကံကောင်းလိုက်တာနော်', en: 'Lucky You' }, // leaves every hand for good at the end of ch 10
    line: { my: 'ခွာညို ကံကောင်းလိုက်တာနော်။', en: "Lucky Khwar Nyo, isn't she." },
    shows: ['envy'], really: { my: 'ချီးကျူးသလိုလိုနဲ့ မနာလို ဖြစ်နေတာ', en: 'envy that passes for praise' },
    backfire: { they: { my: 'ဟုတ်တယ်မလား။ ကံကောင်းသွားတာ။ နင်တောင် မြင်တယ်မလား။', en: 'Right? Luck. Even you see it.' },
                maya: { my: '(ကံကောင်းတာလို့ ပြောလိုက်တော့ သူ ကြိုးစားထားတဲ့ အတုံးလေးဆယ်ကို ဖျက်ပစ်လိုက်သလို ဖြစ်သွားပြီ။)', en: '(Calling it luck rubbed out her forty blocks.)' } } },
  { id: 'ignore', lookalike: true, name: { my: 'မရှိသလို နေလိုက်', en: 'Just Ignore Them' },
    line: { my: 'သူ့ကို မေ့လိုက်တော့။ မရှိသလိုပဲ သဘောထားလိုက်။', en: "Forget her. Act as if she isn't there." },
    shows: ['hot', 'cling'], really: { my: 'စိတ်အေးသလိုလိုနဲ့ အဖက်မလုပ်ဘဲ နေခိုင်းမိတာ', en: 'freezing someone out that passes for calm' },
    backfire: { they: { my: 'မရှိသလို သဘောထားရမယ် ဟုတ်လား။ သူ့သစ်သားတုံးက ငါ့ခုံပေါ်မှာ ရှိနေတာလေ။', en: "As if she isn't there? Her block is on my bench!" },
                maya: { my: '(မျက်နှာလွှဲလိုက်တာက အပူကို ဖုံးထားရုံပဲ ရှိတာ။)', en: '(Looking away only covers the heat.)' } } },
];

export const TALK_D5_KOLWIN = {
  id: 'd5-kolwin',
  person: 'kolwin',
  with: ['khwarnyo'], // she is a few doors along, in the post room: going to her is not "something else"
  steam: 2, calm: 4, turns: 7, // day5.js adds +1 steam if Maya said "Lucky her" at his bench (5.1)
  noStepBack: true,
  hand: D5_KL_CARDS,
  stones: [
    { lines: [
      { my: 'သူ ကံကောင်းသွားတာပါ။ ငါ့ဆီမှာ နှစ်နှစ်ပဲ နေခဲ့ရတာ။', en: 'She got lucky. She was only with me two years.', need: 'unknown', seems: 'envy', face: 'think',
        tell: { my: 'မနာလိုတာထက် ပိုတယ်… သူ ထွက်သွားကတည်းက သူ့လက်ရာကို တစ်ခါမှ မကြည့်ဖူးဘူး။ မသိဘဲ ပြောနေတာ။', en: "More than envy… he hasn't looked at her work once since she left. He's talking without knowing." } },
      { my: 'အဲဒါမျိုးတော့ ဘယ်သူမဆို ထွင်းတတ်တာပဲ။', en: 'Anyone could carve that.', need: 'unknown', seems: 'looksdown', face: 'think',
        tell: { my: 'အထင်သေးနေတာ မဟုတ်ဘူး။ သူ့ဒီဇိုင်းကို အနီးကပ် တစ်ခါမှ မကြည့်ဖူးသေးတာ။', en: "Not looking down on it. He's never once looked at her design up close." } },
    ] },
    { lines: [
      { my: 'ငါ စိတ်အေးအေးပါပဲ။ ဘာမှ မခံစားရပါဘူး။', en: "I'm perfectly calm. I don't feel a thing.", need: 'hot', seems: 'given', face: 'think', steam: 1,
        tell: { my: 'စိတ်အေးနေတာ မဟုတ်ဘူး။ မေးရိုးတွေ တင်းနေတယ်။ မီးဖိုက မီးငြိမ်းနေပေမဲ့ ရင်ထဲမှာ လောင်ကျွမ်းနေတာ။', en: "Not calm. His jaw is tight. The brazier's out, but he's burning inside." } },
      { my: 'ညတိုင်း သူ့ဒီဇိုင်းအကြောင်းပဲ တွေးနေမိလို့ အိပ်လို့ မရဘူး။', en: "Every night I think of her design and can't sleep.", need: 'hot', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'သူ့ကို ဘယ်သူ သင်ပေးခဲ့လဲ ဆိုတာ… ဘယ်သူမှ မှတ်မိကြမှာ မဟုတ်ဘူး။', en: 'Nobody will remember… who taught her.', need: 'cling', seems: 'afraid', face: 'sad',
        tell: { my: 'ကြောက်နေတာ မဟုတ်ဘူး။ "ငါ" ဆိုတဲ့ အတ္တက တစ်ခုခု ပြန်လိုချင်နေတာ။ အနည်းဆုံး နာမည်လေး တစ်လုံးလောက်ပေါ့။', en: 'Not fear. The "I" wants something back. A name, at least.' } },
    ] },
    { lines: [
      { my: 'သူက ငါ့တပည့်ပဲ။ သူ့ကို ဆက်ထိန်းထားဖို့ ငါ့မှာ အခွင့်အရေး ရှိတယ်။', en: 'She was my pupil. Keeping her is my right.', need: 'cling', seems: 'own', face: 'hot', steam: 1,
        tell: { my: 'ဆောက်ကို အောက်မချနိုင်ဘူး။ သူ့အခွင့်အရေးလို့ ပြောနေပေမဲ့ တကယ်တော့ လက်မလွှတ်နိုင် ဖြစ်နေတာ။', en: "He won't put the gouge down. He calls it his right; really, he can't let go." } },
      { my: 'ငါ ဘောင်မထွင်းပေးရင် သူ ဒီမှာပဲ ဆက်နေရမှာ…', en: "If I don't carve the border, she stays here…", need: 'cling', face: 'worried',
        tell: { my: 'သူ့ကို နာကျင်စေချင်တာ မဟုတ်ဘူး။ သူ ထွက်သွားမှာကို မခံစားနိုင် ဖြစ်နေတာ။', en: "He doesn't want to hurt her. He can't bear her going." } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါ ပန်းပုထွင်းတာနဲ့ ဘာမှ မဆိုင်ဘူး။', en: "…That's nothing to do with carving." },
    hot: { my: '(ကိုလွင် ဆောက်ကိုပဲ အပြန်ပြန်အလှန်လှန် လှည့်ကြည့်နေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(Ko Lwin turns the gouge over and over. Nothing gets through.)' },
  },
  decision: [
    { my: 'ငါ ဘောင်ထွင်းပေးလိုက်မယ်။ နာမည် မထိုးတော့ဘူး။', en: "I'll carve the border. No name on it.", face: 'think' },
    { my: 'သူ သွားပါစေတော့။ သူ အဆင်ပြေသွားမှာပါ၊ ငါလည်း… ပြန်ထွင်းနိုင်မှာပါ။', en: "Let her go. She'll be fine, and I'll… carve again.", face: 'happy' },
  ],
};

export const D5_TH_CARDS = [
  { id: 'mine', name: { my: 'ကိုယ်တိုင် ရွေးရမယ့် လမ်း', en: 'Mine to choose' },
    line: { my: 'ရေစီးကြောင်းကို ဘယ်သူမှ မရွေးချယ်ခဲ့ရဘူး။ ဒါပေမဲ့ ပဲ့ကိုင်မလား၊ ဒီအတိုင်း မျောလိုက်မလား ဆိုတာတော့ မင်းကိုယ်တိုင် ရွေးရမှာ။', en: "Nobody chose the stream. But steer or drift: that's yours to choose." },
    answers: ['given'], from: { my: 'သူ့စာရင်းကို ပြန်စီရာက', en: 'from re-sorting his list' } },
  { id: 'bail', name: { my: 'သူတို့လည်း ရေပက်ထုတ်ရတာပဲ', en: 'They bail too' },
    line: { my: 'ဒီမနက် ကူးတို့သင်္ဘောပေါ်မှာလည်း ရေပက်ထုတ်နေကြတာပဲ။ မင်းတစ်ယောက်တည်း ပင်ပန်းနေတာ မဟုတ်ပါဘူး။', en: "They were bailing on the ferry this morning. You're not the only one it's hard for." },
    answers: ['unknown'], from: { my: 'ကူးတို့သင်္ဘောကို ကြည့်မိရာက', en: 'from watching the ferry' } },
  { id: 'patches', name: { my: 'အမေ့ရဲ့ ဖာထေးရာတွေ', en: "Mum's patches" },
    line: { my: 'အမေက တစ်နှစ်တစ်ခါ ဖာထေးပေးပြီး ဘယ်လောက်ကုန်လဲ တစ်ခါမှ မပြောခဲ့ဘူး။ မင်း သွားနိုင်အောင်လို့ ဖာထေးပေးခဲ့တာ။', en: 'She patched it once a year and never said what it cost. She patched it so you could go.' },
    answers: ['afraid'], from: { my: 'ဖောင်နဲ့ ဝါးလုံးပေါ်မှာ မြင်ခဲ့ရတာ', en: 'seen on the raft and the pole' } },
  { id: 'shallow', name: { my: 'မင်းကို လိုအပ်နေတယ်', en: 'You are needed' },
    line: { my: 'ကူးတို့သင်္ဘောက ဘဲဆိပ်ရော ကြိမ်ဆိပ်ရော မကပ်နိုင်ဘူး။ ဖောင်ပဲ ကပ်နိုင်တာ။ ပါဆယ်ထုပ်တွေ စောင့်နေကြတယ်။', en: "The ferry can't reach Duck Jetty or Cane Jetty. Only a raft can. The parcels are waiting." },
    answers: ['unknown', 'given'], from: { my: 'မောင်ငယ်ဆီက', en: 'from Maung Nge' } },
  { id: 'notyet', companion: 'seedling', name: { my: 'မဖြစ်သေးတာပါ', en: 'Not yet' }, // the Not-Yet Seedling
    line: { my: '\'မလုပ်နိုင်ဘူး\' မဟုတ်ဘူး။ မလုပ်နိုင်သေးတာပါ။', en: "Not 'can't'. Not yet." },
    answers: ['given'], from: { my: 'မဖြစ်သေးတဲ့ ပျိုးပင်လေး', en: 'the Not-Yet Seedling' } },
  { id: 'once', companion: 'sheep', name: { my: 'နောက်တစ်ခေါက်', en: 'Once more' }, // the Black Sheep
    line: { my: 'ဝါးလုံးကို တစ်ချက် ထိုးကြည့်လိုက်။ မရသေးရင် နောက်တစ်ခေါက် ထပ်ထိုးကြည့်။', en: "Push the pole in once. If it doesn't work, once more." },
    answers: ['given', 'afraid'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'blame', lookalike: true, name: { my: 'ရေစီးကြောင်းရဲ့ အပြစ်', en: "The stream's fault" },
    line: { my: 'ရေစီးကြောင်းက မတရားဘူး။ မင်းအပြစ် တစ်ခုမှ မပါဘူး။', en: "The stream's unfair. None of it is your fault." },
    shows: ['given', 'afraid'], really: { my: 'တစ်ခုခုအပေါ် အပြစ်ပုံချမိတာ', en: 'heaping the blame on something' },
    backfire: { they: { my: 'ဒါဆို ဘာလို့ လုပ်နေတော့မှာလဲ။', en: 'So why do anything?' },
                maya: { my: '(အပြစ်ပုံချစရာ တစ်ခု ပေးလိုက်တော့ သူ ပိုပြီး လွင့်မျောသွားပြီ။)', en: '(Give him something to blame, and he drifts further.)' } } },
  { id: 'race', lookalike: true, name: { my: 'သူတို့နဲ့ ပြိုင်လိုက်', en: 'Race them' },
    line: { my: 'ကူးတို့သင်္ဘောနဲ့ ပြိုင်လိုက်စမ်း။ သူတို့ ရှုံးအောင် လုပ်ပြလိုက်။', en: 'Race the ferry. Make them lose!' },
    shows: ['given', 'envy'], really: { my: 'ရေစီးကြောင်းကို ရန်သူလို သဘောထားမိတာ', en: 'turning the stream into an enemy' },
    backfire: { they: { my: 'မမီနိုင်မှန်း ကျုပ် သိတာပေါ့။ အဲဒါကြောင့် ဝါးလုံး မထိုးတော့တာ။', en: "I know I can't catch it! That's why I don't pole!" },
                maya: { my: '(ပြိုင်ပွဲလို လုပ်လိုက်ရင် ရှုံးဖို့ပဲ ကျန်တော့တာပေါ့။)', en: '(Make it a race, and all that is left is losing.)' } } },
];

export const TALK_D5_THIHA = {
  id: 'd5-thiha',
  person: 'kothiha',
  with: ['maungnge'],
  steam: 1, calm: 4, turns: 7, // day5.js adds +1 steam if Maya said "Race the ferry" on the raft (6.2)
  noStepBack: true,
  hand: D5_TH_CARDS,
  stones: [
    { lines: [
      { my: 'အမေ ဖာထေးပေးထားတဲ့ ဖောင်နဲ့ ဒီဆိပ်ကမ်းကနေ ဟုတ်လား။ ဘယ်လိုမှ မဖြစ်နိုင်ဘူး။', en: "With Mum's patched raft, from this jetty? No chance.", need: 'given', seems: 'envy', face: 'sad', mood: 'down',
        tell: { my: 'ကူးတို့သင်္ဘောကို မနာလို ဖြစ်နေတာ မဟုတ်ဘူး။ သူ့ဝါးလုံး ရေမထိတာ ကြာလှပြီ။ လက်လျှော့ထားတာ။', en: "Not envy of the ferry. It's been ages since his pole touched the water. He's given up." } },
      { my: 'ရေစီးအတိုင်း မျောလိုက်တာက ပိုလွယ်တယ်။ ရေစီးက တစ်နေရာရာတော့ ရောက်အောင် ပို့ပေးမှာပဲ။', en: 'Drifting\'s easier. The stream takes you somewhere anyway.', need: 'given', face: 'sad' },
    ] },
    { lines: [
      { my: 'ကူးတို့သင်္ဘောက ငြိမ့်နေတာပဲ။ ငါတို့ချည်းပဲ ရုန်းကန်နေရတာ။', en: 'The ferry glides. Only we have to struggle.', need: 'unknown', seems: 'hot', face: 'think',
        tell: { my: 'ဒေါသထွက်နေတာ မဟုတ်ဘူး။ ကူးတို့သင်္ဘောပေါ်က ရေပက်တဲ့ ပုံးကို သူ မမြင်ဖူးသေးလို့ပါ။', en: "Not anger. He just hasn't seen the bucket on the ferry." } },
      { my: 'ဒီချောင်းထဲမှာ ငါတို့ပဲ ကံအဆိုးဆုံး ဖြစ်နေတာ။', en: "We're the only unlucky ones on this stream.", need: 'unknown', seems: 'hot', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'ကျုပ် ဝါးလုံးထိုးပြီး နောက်ဆုံးမှ ရောက်ရင်… အမေ ဖာထေးပေးခဲ့သမျှ အလကား ဖြစ်သွားမှာပေါ့။', en: "If I pole and still come last… all Mum's patching was for nothing.", need: 'afraid', seems: 'given', face: 'worried', steam: 1,
        tell: { my: 'လက်လျှော့တာထက် ပိုတယ်… အမေ့ကို စိတ်ပျက်စေမှာကို ကြောက်နေတာ။ သူ့လက်က ဖာထေးရာလေးကိုပဲ ပွတ်သပ်နေတယ်။', en: "More than giving up… he's afraid of letting his mother down. His hand keeps smoothing a patch." } },
    ] },
    { lines: [
      { my: 'ဒီလိုဖောင်မျိုးကို ဘယ်သူကများ လိုအပ်မှာလဲ။', en: 'Who would ever need a raft like this?', need: 'unknown', seems: 'given', face: 'think', heard: true,
        tell: { my: 'သူ တကယ် မသိတာပါ။ မျက်လုံးက မောင်ငယ့် ပါဆယ်ထုပ်တွေဆီ ရောက်သွားပြီ။', en: "He truly doesn't know. His eyes have gone to Maung Nge's parcels." } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါ ရေနဲ့ ဘာမှ မဆိုင်ဘူး။', en: "…That's got nothing to do with water." },
    hot: { my: '(ကိုသီဟ မျက်နှာလွှဲပြီး ကူးတို့သင်္ဘောကိုပဲ ကြည့်နေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(Ko Thiha turns away and watches the ferry. Nothing gets through.)' },
  },
  decision: [
    { my: 'ကူးတို့သင်္ဘောကို မီအောင် မလိုက်တော့ဘူး။ မီဖို့လည်း မထိုးတော့ဘူး။ ကူးတို့သင်္ဘော မကပ်နိုင်တဲ့ ဆိပ်ကမ်းတွေဆီပဲ ဝါးလုံးထိုး သွားတော့မယ်။', en: "I won't catch the ferry. I won't pole to catch it. I'll pole to the jetties it can't reach.", face: 'think' },
    { my: 'မောင်ငယ်၊ တက်လာခဲ့။ ဝါးလုံး ဘယ်လိုကိုင်ရလဲ ငါ ပြပေးမယ်။', en: "Maung Nge, hop on. I'll show you how to hold the pole.", face: 'happy' },
  ],
};
