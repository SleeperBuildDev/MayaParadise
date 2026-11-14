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
  { id: 'forty', name: { my: 'လေးဆယ်တုံး', en: 'Forty blocks' },
    line: { my: 'ကံ မဟုတ်ပါဘူး။ တစ်ညကို တစ်တုံး၊ လေးဆယ်တုံး ထွင်းခဲ့တာ။ ကျွန်မ ကိုယ်တိုင် မြင်ခဲ့တယ်။', en: "It wasn't luck. One a night, forty blocks. I saw them myself." },
    answers: ['unknown'], from: { my: 'ခွာညိုရဲ့ အိတ်ထဲမှာ မြင်ခဲ့တာ', en: "seen in Khwar Nyo's bag" } },
  { id: 'burns', name: { my: 'ကိုယ့်ကိုပဲ အရင်လောင်', en: 'It burns you first' },
    line: { my: 'ဒီအတွေးက ခွာညိုကို မလောင်ဘူး။ ကိုလွင့်ကိုပဲ လောင်နေတာ။ မီးဖိုတောင် ငြိမ်းသွားပြီ။', en: "That thought doesn't burn her. It burns you. Even your brazier has gone out." },
    answers: ['hot'], from: { my: 'အေးစက်နေတဲ့ ခုံမှာ မြင်ခဲ့တာ', en: 'seen at the cold bench' } },
  { id: 'bothfine', name: { my: 'နှစ်ဖက်လုံး', en: 'Both sides' },
    line: { my: 'တစ်ယောက်တည်း အဆင်ပြေရင် မှန်တဲ့ရွေးချယ်မှု မဟုတ်ဘူးလေ။ သူလည်း အဆင်ပြေ၊ ကိုလွင်လည်း အဆင်ပြေမှ။', en: "If only one of you is fine, it isn't the right choice. She's fine, and you're fine: then it is." },
    answers: ['cling'], from: { my: 'သူ့ကို ခေါ်တဲ့ စာကို ဖတ်ပြီး', en: 'from reading her offer letter' } },
  { id: 'cool', companion: 'cloud', name: { my: 'အေးအေးလေး ကောင်းစေချင်', en: 'A cool wish' }, // the Cool Cloud
    line: { my: 'ကောင်းစေချင်တဲ့စိတ်က ဘာမှ ပြန်မတောင်းဘူး။ ပြန်မတောင်းတော့ မပူတော့ဘူး။', en: "Wishing someone well asks nothing back. Asking nothing, it doesn't burn." },
    answers: ['cling', 'hot'], from: { my: 'တိမ်အေးလေး', en: 'the Cool Cloud' } },
  { id: 'pot', companion: 'pot', name: { my: 'ကိုယ့်အိုး အရင်', en: 'Your own pot first' }, // the Little Pot: his goodwill pot is the empty one (ch 6 p47)
    line: { my: 'သူများအိုး မဖြည့်ခင် ကိုယ့်အိုး ပြည့်ရမယ်။ ထွင်းတံ ရှိတယ်၊ လက်ရာ ရှိတယ်။ ခန်းနေတာ စေတနာအိုးပဲ။', en: "Before you fill someone else's pot, your own must be full. You have the gouges and the hand. It's the goodwill that's run dry." },
    answers: ['hot'], from: { my: 'အိုးလေး', en: 'the Little Pot' } },
  { id: 'lucky', lookalike: true, name: { my: 'ကံကောင်းလိုက်တာ', en: 'Lucky You' }, // leaves every hand for good at the end of ch 10
    line: { my: 'ခွာညိုက ကံကောင်းလိုက်တာနော်။', en: "Lucky Khwar Nyo, isn't she." },
    shows: ['envy'], really: { my: 'ချီးမွမ်းသလိုနဲ့ မနာလိုတာ', en: 'envy that passes for praise' },
    backfire: { they: { my: 'ဟုတ်တယ်မလား! ကံပဲ။ မာရာတောင် သိတယ်။', en: 'Right? Luck. Even you see it.' },
                maya: { my: '(ကံလို့ ပြောလိုက်တော့ သူ့လေးဆယ်တုံးကို ဖျက်ပစ်လိုက်သလို ဖြစ်သွားပြီ။)', en: '(Calling it luck rubbed out her forty blocks.)' } } },
  { id: 'ignore', lookalike: true, name: { my: 'မရှိသလို နေလိုက်', en: 'Just Ignore Them' },
    line: { my: 'သူ့ကို မေ့ပစ်လိုက်ပါ။ မရှိသလိုပဲ နေလိုက်။', en: "Forget her. Act as if she isn't there." },
    shows: ['hot', 'cling'], really: { my: 'အေးဆေးသလိုနဲ့ ချန်ထားတာ', en: 'freezing someone out that passes for calm' },
    backfire: { they: { my: 'မရှိသလို? သူ့တုံးက ကျွန်တော့် ခုံပေါ်မှာလေ!', en: "As if she isn't there? Her block is on my bench!" },
                maya: { my: '(မျက်နှာလွှဲခိုင်းတာ အပူကို ဖုံးထားရုံပဲ။)', en: '(Looking away only covers the heat.)' } } },
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
      { my: 'ကံကောင်းသွားတာပါ။ ကျွန်တော့်ဆီမှာ နှစ်နှစ်ပဲ နေခဲ့တာ။', en: 'She got lucky. She was only with me two years.', need: 'unknown', seems: 'envy', face: 'think',
        tell: { my: 'မနာလိုတာထက်… သူ ထွက်သွားကတည်းက သူ့လက်ရာကို တစ်ခါမှ မကြည့်ဖူးဘူး။ မသိဘဲ ပြောနေတာ။', en: "More than envy… he hasn't looked at her work once since she left. He's talking without knowing." } },
      { my: 'ဒီလောက်ပုံစံ ဘယ်သူမဆို ထွင်းလို့ရတယ်။', en: 'Anyone could carve that.', need: 'unknown', seems: 'looksdown', face: 'think',
        tell: { my: 'အထင်သေးတာ မဟုတ်ဘူး။ သူ့ပုံစံကို အနီးကပ် တစ်ခါမှ မကြည့်ဖူးလို့ ပြောနေတာ။', en: "Not looking down on it. He's never once looked at her design up close." } },
    ] },
    { lines: [
      { my: 'ကျွန်တော် အေးအေးဆေးဆေးပါ။ ဘာမှ မခံစားရဘူး။', en: "I'm perfectly calm. I don't feel a thing.", need: 'hot', seems: 'given', face: 'think', steam: 1,
        tell: { my: 'အေးနေတာ မဟုတ်ဘူး။ မေးရိုး တင်းနေတယ်။ မီးဖိုက ငြိမ်းပေမဲ့ သူ့ထဲမှာ ပူနေတယ်။', en: "Not calm. His jaw is tight. The brazier's out, but he's burning inside." } },
      { my: 'ညတိုင်း သူ့ပုံစံကို တွေးပြီး အိပ်မပျော်ဘူး။', en: "Every night I think of her design and can't sleep.", need: 'hot', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'ဘယ်သူမှ မှတ်မိမှာ မဟုတ်ဘူး… သူ့ကို ဘယ်သူ သင်ပေးခဲ့လဲဆိုတာ။', en: 'Nobody will remember… who taught her.', need: 'cling', seems: 'afraid', face: 'sad',
        tell: { my: 'ကြောက်တာ မဟုတ်ဘူး။ "ငါ" ဆိုတဲ့စိတ်က တစ်ခုခု ပြန်လိုချင်နေတာ။ နာမည်လေး တစ်ခုလောက်။', en: 'Not fear. The "I" wants something back. A name, at least.' } },
    ] },
    { lines: [
      { my: 'သူက ကျွန်တော့် တပည့်။ ဆက်ထားချင်တာ ကျွန်တော့် အခွင့်အရေးပဲ။', en: 'She was my pupil. Keeping her is my right.', need: 'cling', seems: 'own', face: 'hot', steam: 1,
        tell: { my: 'ထွင်းတံကို လက်ထဲက မချဘူး။ အခွင့်အရေးလို့ ခေါ်နေပေမဲ့ တကယ်က လက်မလွှတ်ချင်တာ။', en: "He won't put the gouge down. He calls it his right; really, he can't let go." } },
      { my: 'အနားကွပ် မထွင်းရင် သူ ဒီမှာပဲ နေရမှာ…', en: "If I don't carve the border, she stays here…", need: 'cling', face: 'worried',
        tell: { my: 'သူ့ကို ထိခိုက်ချင်တာ မဟုတ်ဘူး။ ထွက်သွားမှာ မခံနိုင်တာ။', en: "He doesn't want to hurt her. He can't bear her going." } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါ ထွင်းတံနဲ့ မဆိုင်ဘူး။', en: "…That's nothing to do with carving." },
    hot: { my: '(ကိုလွင် ထွင်းတံကို လက်ထဲမှာ လှည့်နေတယ်။ ဘာမှ မကြားဘူး။)', en: '(Ko Lwin turns the gouge over and over. Nothing gets through.)' },
  },
  decision: [
    { my: 'အနားကွပ် ထွင်းမယ်။ နာမည် မထိုးဘူး။', en: "I'll carve the border. No name on it.", face: 'think' },
    { my: 'သူ သွားပါစေ။ သူလည်း အဆင်ပြေ၊ ကျွန်တော်လည်း… ပြန်ထွင်းမယ်။', en: "Let her go. She'll be fine, and I'll… carve again.", face: 'happy' },
  ],
};

export const D5_TH_CARDS = [
  { id: 'mine', name: { my: 'ကိုယ်ရွေးလို့ရတာ', en: 'Mine to choose' },
    line: { my: 'မြစ်ကို ဘယ်သူမှ မရွေးခဲ့ဘူး။ ဒါပေမဲ့ လှော်မလား မျောမလားကတော့ မင်းရွေးလို့ရတယ်။', en: "Nobody chose the stream. But steer or drift: that's yours to choose." },
    answers: ['given'], from: { my: 'သူ့စာရင်းကို ပြန်စီပြီး ရခဲ့တာ', en: 'from re-sorting his list' } },
  { id: 'bail', name: { my: 'သူတို့လည်း ရေခပ်ရ', en: 'They bail too' },
    line: { my: 'ဒီမနက် ကူးတို့ပေါ်မှာလည်း ရေခပ်ထုတ်နေရတယ်။ ခက်ခဲတာ မင်းတစ်ယောက်တည်း မဟုတ်ဘူး။', en: "They were bailing on the ferry this morning. You're not the only one it's hard for." },
    answers: ['unknown'], from: { my: 'ကူးတို့ကို ကြည့်ပြီး ရခဲ့တာ', en: 'from watching the ferry' } },
  { id: 'patches', name: { my: 'အမေ့ ဖာထေးရာ', en: "Mum's patches" },
    line: { my: 'အမေက တစ်နှစ် တစ်ဖာ ဖာပေးခဲ့တယ်။ ဘယ်လောက်ကုန်လဲ တစ်ခါမှ မပြောဘူး။ မင်း သွားနိုင်ဖို့ ဖာတာ။', en: 'She patched it once a year and never said what it cost. She patched it so you could go.' },
    answers: ['afraid'], from: { my: 'ဖောင်နဲ့ လှော်တက်မှာ မြင်ခဲ့တာ', en: 'seen on the raft and the pole' } },
  { id: 'shallow', name: { my: 'မင်းကို လိုနေတယ်', en: 'You are needed' },
    line: { my: 'ဘဲဆိပ်နဲ့ ကြိမ်ဆိပ်ကို ကူးတို့ မရောက်နိုင်ဘူး။ ဖောင်ပဲ ရောက်နိုင်တယ်။ အထုပ်တွေ စောင့်နေတယ်။', en: "The ferry can't reach Duck Jetty or Cane Jetty. Only a raft can. The parcels are waiting." },
    answers: ['unknown', 'given'], from: { my: 'မောင်ငယ် ပြောခဲ့တာ', en: 'from Maung Nge' } },
  { id: 'notyet', companion: 'seedling', name: { my: 'မရသေးဘူး', en: 'Not yet' }, // the Not-Yet Seedling
    line: { my: 'မရဘူး မဟုတ်ဘူး။ မရသေးတာ။', en: "Not 'can't'. Not yet." },
    answers: ['given'], from: { my: 'မရသေးပျိုးပင်', en: 'the Not-Yet Seedling' } },
  { id: 'once', companion: 'sheep', name: { my: 'နောက်တစ်ခါ', en: 'Once more' }, // the Black Sheep
    line: { my: 'လှော်တက်ကို တစ်ချက်ပဲ ထိုးကြည့်။ မရရင် နောက်တစ်ချက်။', en: "Push the pole in once. If it doesn't work, once more." },
    answers: ['given', 'afraid'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'blame', lookalike: true, name: { my: 'မြစ်ရဲ့အပြစ်', en: "The stream's fault" },
    line: { my: 'မြစ်ကြီးက မတရားတာပါ။ မင်းအပြစ် လုံးဝ မဟုတ်ဘူး။', en: "The stream's unfair. None of it is your fault." },
    shows: ['given', 'afraid'], really: { my: 'အပြစ်ကို တစ်ခုခုပေါ် ပုံချတာ', en: 'heaping the blame on something' },
    backfire: { they: { my: 'ဒါဆို ဘာလုပ်ဖို့ လိုသေးလဲ။', en: 'So why do anything?' },
                maya: { my: '(အပြစ်တင်စရာ ပေးလိုက်တော့ သူ ပိုမျောသွားတယ်။)', en: '(Give him something to blame, and he drifts further.)' } } },
  { id: 'race', lookalike: true, name: { my: 'ပြိုင်လှော်', en: 'Race them' },
    line: { my: 'ကူးတို့ကို ပြိုင်လှော်ပြလိုက်။ အရှုံးပေးခိုင်း!', en: 'Race the ferry. Make them lose!' },
    shows: ['given', 'envy'], really: { my: 'မြစ်ကို ရန်သူလုပ်တာ', en: 'turning the stream into an enemy' },
    backfire: { they: { my: 'မမီတာ သိပြီးသား! ဒါကြောင့် မလှော်တာ!', en: "I know I can't catch it! That's why I don't pole!" },
                maya: { my: '(ပြိုင်ပွဲလုပ်လိုက်တော့ ရှုံးဖို့ပဲ ကျန်တော့တယ်။)', en: '(Make it a race, and all that is left is losing.)' } } },
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
      { my: 'အမေ ဖာထားတဲ့ ဖောင်နဲ့၊ ဒီဆိပ်ကနေ? ဘယ်လိုမှ မဖြစ်နိုင်ဘူး။', en: "With Mum's patched raft, from this jetty? No chance.", need: 'given', seems: 'envy', face: 'sad', mood: 'down',
        tell: { my: 'ကူးတို့ကို မနာလိုတာ မဟုတ်ဘူး။ လှော်တက်ကို ရေထဲ မထိုးတော့တာ ကြာပြီ။ လက်လျှော့ထားတာ။', en: "Not envy of the ferry. It's been ages since his pole touched the water. He's given up." } },
      { my: 'မျောနေတာ ပိုလွယ်တယ်။ မြစ်က ရောက်ချင်ရာ ပို့ပေးမှာပဲ။', en: 'Drifting\'s easier. The stream takes you somewhere anyway.', need: 'given', face: 'sad' },
    ] },
    { lines: [
      { my: 'ကူးတို့က ချောချောမောမော။ ကျွန်တော်တို့ကျမှ ရုန်းကန်ရတာ။', en: 'The ferry glides. Only we have to struggle.', need: 'unknown', seems: 'hot', face: 'think',
        tell: { my: 'ဒေါသ မဟုတ်ဘူး။ ကူးတို့ပေါ်က ရေပုံးကို မမြင်ဖူးသေးလို့ ပြောတာ။', en: "Not anger. He just hasn't seen the bucket on the ferry." } },
      { my: 'ဒီမြစ်ပေါ်မှာ ကျွန်တော်တို့ပဲ ကံဆိုးတာ။', en: "We're the only unlucky ones on this stream.", need: 'unknown', seems: 'hot', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'လှော်ကြည့်ပြီး နောက်ဆုံးမှ ရောက်ရင်… အမေ ဖာပေးထားတာတွေ အလကား ဖြစ်ကုန်မှာ။', en: "If I pole and still come last… all Mum's patching was for nothing.", need: 'afraid', seems: 'given', face: 'worried', steam: 1,
        tell: { my: 'လက်လျှော့တာထက်… အမေ့ကို စိတ်ပျက်အောင် လုပ်မိမှာ ကြောက်နေတာ။ ဖာထေးရာကို လက်နဲ့ ပွတ်နေတယ်။', en: "More than giving up… he's afraid of letting his mother down. His hand keeps smoothing a patch." } },
    ] },
    { lines: [
      { my: 'ဒီလို ဖောင်မျိုးကို ဘယ်သူက လိုမှာလဲ။', en: 'Who would ever need a raft like this?', need: 'unknown', seems: 'given', face: 'think', heard: true,
        tell: { my: 'တကယ် မသိလို့ မေးနေတာ။ မောင်ငယ့် အထုပ်တွေဘက် မျက်လုံး ရောက်နေတယ်။', en: "He truly doesn't know. His eyes have gone to Maung Nge's parcels." } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါ ရေနဲ့ မဆိုင်ဘူး။', en: "…That's got nothing to do with water." },
    hot: { my: '(ကိုသီဟ မျက်နှာလွှဲပြီး ကူးတို့ကိုပဲ ကြည့်နေတယ်။ ဘာမှ မကြားဘူး။)', en: '(Ko Thiha turns away and watches the ferry. Nothing gets through.)' },
  },
  decision: [
    { my: 'ကူးတို့ကို မမီဘူး။ မီဖို့လည်း မလှော်ဘူး။ ကူးတို့ မရောက်တဲ့ဆိပ်တွေကို လှော်မယ်။', en: "I won't catch the ferry. I won't pole to catch it. I'll pole to the jetties it can't reach.", face: 'think' },
    { my: 'မောင်ငယ်၊ တက်။ လှော်တက် ဘယ်လိုကိုင်ရလဲ ပြမယ်။', en: "Maung Nge, hop on. I'll show you how to hold the pole.", face: 'happy' },
  ],
};
