// Day 4's two talks (day4-spec 5.5 and 6.4). Format: see the top of js/story/talk.js.
// Burmese lines are drafts for Maya to proofread.
//
// Ko Phyo (ch 6, inside the tea shop, on his stool by the door): envy that passes for wisdom, "nothing to
// give" (given up), not knowing how to brew, wanting the giving to be seen. Cards earned in 5.1-5.4 are gated
// on their `d4.card.<id>` flag; the companions lend Once more / Why? / Not yet.
// Ma Thiri (ch 7, inside the post office, on the waiting bench facing hole ၁၄): she clings to the flag; the
// hot thought "I was so good to her"; nothing without a reply; afraid that letting go loses the friend; what
// to do while waiting. The Black Sheep's "Once more" is a true page that does NOT fit her (answers nothing).

// ---------------------------------------------------------------------------------------------
// Ko Phyo
// ---------------------------------------------------------------------------------------------
export const D4_KP_CARDS = [
  { id: 'theirs', flag: 'd4.card.theirs', name: { my: 'သူတို့လက်ဆောင်၊ သူတို့ရွေးချယ်မှု', en: 'Their gift, their choice' },
    line: { my: 'ဘယ်မှာ ပေးမလဲဆိုတာ ပေးတဲ့သူရဲ့ ရွေးချယ်မှုပဲ။ ကျွန်တော်က သယ်ပေးရုံသက်သက်ပါ။', en: "Where to give is the giver's choice. I only carried." },
    answers: ['envy'], from: { my: 'လက်ဆောင်သုံးခု သယ်ပေးခဲ့ရာက', en: 'from carrying the three gifts' } },
  { id: 'glad', flag: 'd4.card.glad', name: { my: 'ရေသောက်တာလေး ကြည့်ရင်း', en: 'Watching it drink' },
    line: { my: 'ခွေးအိုကြီး ရေသောက်သွားတော့ ကျွန်တော့်ရင်ထဲ အေးသွားတာပဲ။ ကိုဖြိုးရော အဲဒီလို ခံစားဖူးလား။', en: 'When the old dog drank, it went cool inside me. Have you ever felt that, Ko Phyo?' },
    answers: ['envy', 'hot'], from: { my: 'ကုက္ကိုပင်အောက်က', en: 'under the rain tree' } },
  { id: 'scold', lookalike: true, name: { my: 'ကိုယ်တိုင် ဘာလို့ တစ်ခုခု မပေးကြည့်တာလဲ', en: 'Why not give something yourself?' },
    line: { my: 'ဝေဖန်နေမယ့်အစား ကိုယ်တိုင် ဘာလို့ တစ်ခုခု မပေးကြည့်တာလဲ။', en: 'Instead of judging, why not give something yourself?' },
    shows: ['envy', 'given'], really: { my: 'ရိုးသားသလိုလိုနဲ့ အထင်သေးမိတာ', en: 'looking down that passes for honesty' },
    backfire: { they: { my: 'ဘာပေးရမှာလဲ။ ဟုတ်တယ်မလား၊ ကျုပ်က ဘာမှမရှိတဲ့ ကောင်ပါ။', en: "Give what?! That's it, isn't it: I'm the man with nothing." },
                maya: { my: '(အပေါ်စီးက ပြောလိုက်တော့ အမှန်တရားက သူ့ကို ပိုသိမ်ငယ်သွားစေတယ်။)', en: '(Said from above, the truth only shrank him.)' } } },
  { id: 'notyet', companion: 'seedling', name: { my: 'မရှိသေးတာပါ', en: 'Not yet' },
    line: { my: 'အခု ပေးစရာ မရှိသေးတာပါ။ တစ်သက်လုံး မရှိတာမှ မဟုတ်တာ။', en: "You've nothing to give yet. That isn't never." },
    answers: ['given'], from: { my: 'မဖြစ်သေးတဲ့ ပျိုးပင်လေး', en: 'the Not-Yet Seedling' } },
  { id: 'fillfirst', flag: 'd4.card.fillfirst', name: { my: 'ကိုယ့်အိုးလေး အရင်ဖြည့်ပါဦး', en: 'Your own pot first' },
    line: { my: 'ဒေါ်တင်တင် ပြောတယ်၊ သူများအိုးထဲ မထည့်ခင် ကိုယ့်အိုးထဲမှာ လက်ဖက်ခြောက်ရယ်၊ နည်းပညာရယ်၊ စေတနာရယ် အရင်ရှိဖို့ လိုတယ်တဲ့။', en: "Daw Tin Tin says: before you fill another's pot, yours needs leaves, know-how and goodwill." },
    answers: ['given', 'unknown'], from: { my: 'ဒေါ်တင်တင်ဆီက', en: 'from Daw Tin Tin' } },
  { id: 'why', companion: 'parrot', name: { my: 'ဘာလို့လဲ', en: 'Why?' },
    line: { my: 'ဒေါ်တင်တင့် လက်ဖက်ရည်က ဘာလို့ မခါးတာလဲ။ သွားမေးကြည့်ရအောင်။', en: "Why isn't Daw Tin Tin's tea bitter? Let's go and ask her." },
    answers: ['unknown'], from: { my: 'ဘာလို့လဲ ကြက်တူရွေးလေး', en: 'the Why-Parrot' } },
  { id: 'nobody', flag: 'd4.card.nobody', name: { my: 'နာမည်မပါတဲ့ ထမင်းအိုး', en: 'The rice pot with no name' },
    line: { my: 'ဒေါ်ကြာက နာမည် မပြောဘူး။ ဒေါ်ရီကလည်း ဘယ်သူပေးလဲ ဘယ်တော့မှ မမေးဘူး။ ဘယ်သူမှ စောင့်ကြည့်နေစရာ မလိုဘူးလေ။', en: "Daw Kyar wouldn't give her name. Daw Yi never asks who gave. Nobody needs to be watching." },
    answers: ['cling'], from: { my: 'စတုဒိသာဆိုင်လေးဆီက', en: 'from the free-food shop' } },
  { id: 'agree', lookalike: true, name: { my: 'ဟုတ်တယ်၊ အလဟဿ ဖြစ်တာပဲ', en: "You're right, it's a waste" },
    line: { my: 'ရှင် ပြောတာ မှန်တယ်။ ခွေးတွေထက် လူတွေကို အရင် ဦးစားပေးသင့်တာ။', en: "You're right. People should come before dogs." },
    shows: ['envy'], really: { my: 'မနာလိုစိတ်ကို ပညာရှိစကားလို ထောက်ခံမိတာ', en: 'backing envy as if it were wisdom' },
    backfire: { they: { my: 'တွေ့လား။ စာရေးဆရာမတောင် ကျုပ်ဘက်က ရှိတယ်။', en: "See! Even the writer's on my side!" },
                maya: { my: '(သူ့ရင်ထဲက အပူကို ငါ ယပ်ခတ်ပေးလိုက်မိပြီ။)', en: '(I just fanned his heat.)' } } },
  { id: 'once', companion: 'sheep', name: { my: 'နောက်တစ်ခေါက်', en: 'Once more' },
    line: { my: 'ခါးသွားလည်း ကိစ္စမရှိဘူး။ နောက်တစ်ခေါက် ထပ်နှပ်ကြည့်ရုံပေါ့။', en: 'Bitter is fine. Just brew it once more.' },
    answers: ['unknown'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
];

export const TALK_D4_KOPHYO = {
  id: 'd4-kophyo',
  person: 'kophyo',
  with: ['tintin'],
  noStepBack: true,
  steam: 2, calm: 4, turns: 7, // the script passes calm: 4 - Math.min(2, d4.forked)
  hand: D4_KP_CARDS, // first hand (data order): theirs, glad, scold, notyet
  stones: [
    { lines: [
      { my: 'ခွေးတွေအတွက် ရေခွက်တွေတဲ့။ လူတွေလည်း ရေငတ်တာပဲ။ ဘယ်သူမှ ဘာမှ နားမလည်ကြဘူး။', en: 'Water bowls for dogs! People are thirsty too. Nobody understands anything.', need: 'envy', seems: 'looksdown', face: 'hot',
        tell: { my: 'သူ ယုယုကို အထင်သေးနေတာ မဟုတ်ဘူး။ ယုယုလက်ကို ကြည့်လိုက်၊ ဗလာဖြစ်နေတဲ့ သူ့လက်ကို ပြန်ကြည့်လိုက် လုပ်နေတာ။', en: "He isn't looking down on Yu Yu. He looks at her hands, then back at his own empty ones." } },
      { my: 'ပေးမယ်ဆိုရင်လည်း အဓိပ္ပာယ်ရှိရှိ ပေးပေါ့။ ကျုပ်သာဆိုရင်…', en: "If you give, give with sense. If it were me, I'd…", need: 'envy', seems: 'looksdown', face: 'think',
        tell: { my: '"ကျုပ်သာဆိုရင်" လို့ ပြောပြီး ရပ်သွားတယ်။ သူ့မှာ ပေးစရာ ဘာမှ မရှိဘူးလေ။', en: 'He says "if it were me" and stops. He has nothing to give.' } },
    ] },
    { lines: [
      { my: 'စာအုပ်ရှိတဲ့ ကျောင်းကို စာအုပ်တွေ ပေးတယ်၊ အလုပ်လုပ်နိုင်တဲ့ လူတွေကို ဆန်တွေ ပေးတယ်။ ကျုပ်ကိုကျ ဘယ်သူမှ တစ်ခါမှ မမေးဘူး။', en: 'Books to a school with books, rice to people who could work. And nobody ever asks me.', need: 'envy', seems: 'hot', face: 'hot', steam: 1,
        tell: { my: 'ဒေါသထွက်နေတာ မဟုတ်ဘူး။ "ကျုပ်ကိုကျ ဘယ်သူမှ တစ်ခါမှ မမေးဘူး" ဆိုတဲ့နေရာမှာ အသံ တိမ်ဝင်သွားတယ်။', en: 'Not anger. His voice drops at "nobody ever asks me".' } },
      { my: 'သူတို့ ပေးရင် လူတွေက ကျေးဇူးတင်ကြတယ်။ ကျုပ် ပြောရင် ဘယ်သူမှ နားမထောင်ဘူး။', en: 'When they give, people thank them. When I talk, nobody listens.', need: 'envy', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'ဘာပဲဖြစ်ဖြစ်… ကျုပ်မှာ ပေးစရာ ဘာမှ မရှိဘူး။ ကိုယ်ပိုင် အိုးသေးသေးလေးတောင် မရှိဘူး။', en: "Anyway… I've nothing to give. Not even a little pot of my own.", need: 'given', seems: 'envy', face: 'sad', mood: 'down',
        tell: { my: 'မနာလိုတာထက် လက်လျှော့ထားတာ ပိုများတယ်။ မျက်လုံးက ဆိုင်စင်ပေါ်က အိုးသေးသေးလေးတွေဆီပဲ ရောက်ရောက်နေတယ်။', en: "More given up than envious. His eyes keep going to the little pots on the shop's shelf." } },
    ] },
    { lines: [
      { my: 'လက်ဖက်ခြောက် ရှိရင်တောင် ကျုပ် မနှပ်တတ်ဘူး။ ခါးသွားမှာပဲ။ ဘယ်သူမှ တစ်ခါမှ မပြပေးဖူးဘူးလေ။', en: "Even with leaves I couldn't brew it. It'd come out bitter. Nobody ever showed me.", need: 'unknown', seems: 'given', face: 'worried', heard: true,
        tell: { my: 'သူ လက်ဖက်ရည် နှပ်ချင်နေတာ။ မနှပ်တတ်သေးလို့သာ ကြောက်နေတာ။', en: "He wants to brew. He's only afraid because he doesn't know how yet." } },
    ] },
    { lines: [
      { my: 'ပြီးတော့ ကျုပ် ပေးတာကို ဘယ်သူမှ မမြင်ရင်… ကျုပ်က ပါးစပ်သက်သက် မဟုတ်ဘူးဆိုတာ ဘယ်သူ သိမှာလဲ။', en: "And if I give and nobody sees… who'll know I'm not just a mouth?", need: 'cling', seems: 'afraid', face: 'think',
        tell: { my: 'ကြောက်နေတာ မဟုတ်ဘူး။ တစ်လမ်းလုံးက သူ့ကို အမြင်ပြောင်းစေချင်တာ။ ပေးမယ့် အလှူက ကြည့်မယ့်သူတွေအတွက် ဖြစ်နေတယ်။', en: 'Not fear. He wants the street to see him differently. The gift would be for the watchers.' } },
      { my: 'တံခါးဝနားက စားပွဲမှာ ငှဲ့ပေးရင် တစ်လမ်းလုံး မြင်ရမှာ…', en: 'If I poured at the table by the door, the whole street would see…', need: 'cling', face: 'think' },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါ လက်ဖက်ရည်နဲ့ ဘာဆိုင်လို့လဲ။', en: '…What has that got to do with tea?' },
    hot: { my: '(ကိုဖြိုး ခွက်ကို စားပွဲပေါ် ဆောင့်ချပြီး တံခါးအပြင်ကို စိုက်ကြည့်နေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(Ko Phyo bangs his cup down and glares out of the door. Nothing gets through.)' },
  },
  decision: [
    { my: 'ရေသုံးပုံး ခပ်ပြီး ကိုယ့်လက်ဖက်ခြောက်ဖိုး ကိုယ်ရှာမယ်။ ပြီးရင် ဒေါ်တင်တင့်ဆီမှာ ဘယ်လိုနှပ်ရမလဲ သွားမေးမယ်။', en: "I'll fetch three pails and earn my own leaves. Then I'll ask Daw Tin Tin how to brew.", face: 'think' },
    { my: 'ပထမဆုံး တစ်ခွက်ကို ဖြတ်သွားတဲ့ ဘယ်သူ့ကိုမဆို တိုက်မယ်။ ဘယ်သူ ကြည့်နေလဲ လိုက်မကြည့်တော့ဘူး။', en: "The first cup goes to whoever passes. I won't look who's watching.", face: 'happy' },
  ],
};

// ---------------------------------------------------------------------------------------------
// Ma Thiri
// ---------------------------------------------------------------------------------------------
export const D4_TH_CARDS = [
  { id: 'notwind', flag: 'd4.card.notwind', name: { my: 'အလံက လေ မဟုတ်ဘူး', en: "The flag isn't the wind" },
    line: { my: 'ဖူးဖူးရဲ့ အလံမှာ ကြိုးချည်ထားရင် အလံ မတက်မချင်း စွန်က တက်နိုင်မှာ မဟုတ်ဘူး။', en: "With the line tied to Phoo Phoo's flag, it can't rise unless the flag does." },
    answers: ['cling'], from: { my: 'ကြိုးတန်းနောက် လိုက်ကြည့်ရာက', en: 'from following the line' } },
  { id: 'holdtight', lookalike: true, name: { my: 'တင်းတင်း ဆုပ်ထား', en: 'Hold On Tight' },
    line: { my: 'ထပ်ရေးလိုက်ပါ။ သူ စာပြန်တဲ့အထိ နေ့တိုင်း ရေး။ သူငယ်ချင်းအစစ်ဆိုတာ လက်မလွှတ်ဘူး။', en: "Write again. Every day until she answers. Real friends don't let go." },
    shows: ['cling', 'afraid'], really: { my: 'စေတနာလိုလိုနဲ့ တွယ်ကပ်နေမိတာ', en: 'clinging that passes for goodwill' },
    backfire: { they: { my: 'ဟုတ်တယ်။ ကျွန်မ တစ်နေ့ နှစ်စောင် ရေးမယ်။', en: "Yes! I'll write twice a day!" },
                maya: { my: '(ပိုတင်းတင်း ဆုပ်ထားဖို့ ငါ ပြောလိုက်မိတယ်။ စွန်က ထိုးစိုက်ကျသွားပြီ။)', en: '(I told her to grip harder. The kite dives.)' } } },
  { id: 'ownhands', flag: 'd4.card.ownhands', name: { my: 'ကိုယ့်လက်နဲ့ ကိုယ်တိုင် ခေါက်ထားတာ', en: 'Folded by your own hands' },
    line: { my: 'ဒီစက္ကူလေယာဉ်လေးတွေကို မင်းကိုယ်တိုင် ခေါက်ထားတာပဲ။ စာပြန်လာလာ မလာလာ ထောင့်တိုင်းက သေသပ်နေတာပဲ။', en: 'You folded these planes yourself. Every corner true, letter or no letter.' },
    answers: ['given'], from: { my: 'သူ့စားပွဲပေါ်က စက္ကူလေယာဉ်လေးတွေဆီက', en: 'from the planes on her table' } },
  { id: 'wishwell', flag: 'd4.card.wishwell', name: { my: 'ပေါ့ပါးတဲ့ စာလေး', en: 'The light letter' },
    line: { my: 'ဦးလူအေး ပြောတယ်၊ အဖြေကို မျှော်နေတဲ့ စာက လေးလံပြီး ဆုတောင်းကောင်းလေးပဲ ပို့ပေးတဲ့ စာက ပေါ့ပါးတယ်တဲ့။', en: 'U Lu Aye says a letter that waits for an answer is heavy, and one that only wishes well is light.' },
    answers: ['afraid'], from: { my: 'ဦးလူအေးဆီက', en: 'from U Lu Aye' } },
  { id: 'once', companion: 'sheep', name: { my: 'နောက်တစ်ခေါက်', en: 'Once more' }, // a true page that does not fit her
    line: { my: 'နောက်တစ်ခေါက် ထပ်ရေးကြည့်ပါလား', en: 'Why not write once more?' },
    answers: [], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'ignore', lookalike: true, name: { my: 'မေ့ပစ်လိုက်', en: 'Just Ignore Her' },
    line: { my: 'သူ့ကို မေ့လိုက်တော့။ တံဆိပ်ခေါင်းဖိုးတောင် မတန်ဘူး။', en: "Forget her. She isn't worth a stamp." },
    shows: ['hot'], really: { my: 'စိတ်အေးသလိုလိုနဲ့ အဆက်ဖြတ်ခိုင်းမိတာ', en: 'cutting someone off that passes for calm' },
    backfire: { they: { my: 'ဖူးဖူးအကြောင်း အဲဒီလို မပြောပါနဲ့။', en: "Don't talk about Phoo Phoo like that!" },
                maya: { my: '(သူငယ်ချင်းကို အဆက်ဖြတ်ခိုင်းတာ စိတ်အေးတာ မဟုတ်ဘူး။ နောက်ထပ် အပူတစ်မျိုးပဲ။)', en: "(Telling her to cut her friend off isn't cool. It's just another heat.)" } } },
  { id: 'notyet', companion: 'seedling', name: { my: 'မရှိသေးတာပါ', en: 'Not yet' },
    line: { my: 'ကိုယ့်မှာ ရှိတာတွေကို မင်း မကြည့်ရသေးတာပဲ ရှိတာ။ ဘာမှ မရှိတာ မဟုတ်ဘူး။', en: "You just haven't looked at your own things yet. That isn't nothing." },
    answers: ['given'], from: { my: 'မဖြစ်သေးတဲ့ ပျိုးပင်လေး', en: 'the Not-Yet Seedling' } },
  { id: 'ownpost', flag: 'd4.card.ownpost', name: { my: 'ကိုယ်ပိုင် တိုင်လေး', en: 'Your own post' },
    line: { my: 'မင်းဆိုင်ဘေးက ဝါးတိုင်မှာ ကြိုးရာတွေ ရှိနေတာပဲ။ အရင်က အဲဒီမှာ ချည်ထားဖူးတယ် မဟုတ်လား။', en: "There are string marks on the bamboo post by your stall. You used to tie it there, didn't you?" },
    answers: ['unknown', 'given'], from: { my: 'ဝါးတိုင်လေးဆီက', en: 'from the bamboo post' } },
  { id: 'why', companion: 'parrot', name: { my: 'ဘာလို့လဲ', en: 'Why?' },
    line: { my: 'ဖူးဖူး မပြောင်းခင်တုန်းက မင်း အလုပ်ချင်ဆုံးက ဘာလဲဟင်။', en: 'Before Phoo Phoo moved, what did you love doing most?' },
    answers: ['unknown'], from: { my: 'ဘာလို့လဲ ကြက်တူရွေးလေး', en: 'the Why-Parrot' } },
];

export const TALK_D4_THIRI = {
  id: 'd4-thiri',
  person: 'thiri',
  with: ['luaye', 'pwapwa'],
  noStepBack: true,
  steam: 1, calm: 4, turns: 7, // stone 2 adds +1 (the hot thought); Listen there both cools and moves
  hand: D4_TH_CARDS, // first hand (data order): notwind, holdtight, ownhands, wishwell
  stones: [
    { lines: [
      { my: 'သုံးရက် ရှိပြီ။ ကျွန်မ မနက်တိုင်း စာရေးတယ်။ သူက… ဘာစာမှ ပြန်မရေးဘူး။', en: 'Three days. I write every morning. She… writes nothing.', need: 'cling', seems: 'hot', face: 'sad',
        tell: { my: 'ဒေါသထွက်နေတာ မဟုတ်ဘူး။ စကားတစ်ခွန်း ပြောပြီးတိုင်း အပေါက်နံပါတ် ၁၄ ကို လှမ်းလှမ်းကြည့်နေတယ်၊ လက်ဆစ်တွေ ဖြူလာတဲ့အထိ ခုံတန်းအစွန်းကို ကျစ်ကျစ်ပါအောင် ဆုပ်ထားတယ်။', en: 'Not angry. She glances at hole ၁၄ after every word, gripping the bench edge till her knuckles go pale.' } },
      { my: 'အလံ တက်သွားရင် စွန်လည်း တက်သွားမှာပါ။ ခဏလောက် စောင့်ကြည့်ရအောင်။', en: "If the flag goes up, the kite will too. Let's just wait a little.", need: 'cling', face: 'worried' },
    ] },
    { lines: [
      { my: 'ကျွန်မ သူ့အပေါ် အရမ်းကောင်းခဲ့တာ။ ကျွန်မရဲ့ အကောင်းဆုံး ဘောပင်တောင် ပေးခဲ့တာ။ ဒါကို သူက ဒီလိုလုပ်တယ်။', en: 'I was so good to her. I even gave her my best pen. And she does this.', need: 'hot', face: 'hot', steam: 1, heard: true,
        tell: { my: 'ဒီအတွေးက ဖူးဖူးကို ပူလောင်စေတာ မဟုတ်ဘူး။ သူ့ကိုပဲ ပူလောင်စေတာ။', en: "This thought doesn't burn Phoo Phoo. It only burns her." } },
      { my: 'နေ့တိုင်း စာရေးခဲ့တာ ကျွန်မပါ။ အမြဲတမ်း ကျွန်မချည်းပဲ။', en: "I'm the one who wrote every day. Always me.", need: 'hot', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'သူ့စာ လာရင် ကျွန်မ အဆင်ပြေတယ်။ မလာရင်… ကျွန်မက ဘာမှ မဟုတ်တော့သလိုပဲ။', en: "When her letter comes, I'm fine. When it doesn't… it's like I'm nothing.", need: 'given', seems: 'cling', face: 'sad', mood: 'down',
        tell: { my: 'ဖူးဖူးကို တွယ်ကပ်နေတာ တစ်ခုတည်း မဟုတ်ဘူး။ သူ့အကြောင်း တစ်ခွန်းမှ မပြောဘူး။ သူ့စားပွဲပေါ်က စက္ကူလေယာဉ်လေးတွေကို မေ့နေပြီ။', en: "Not only clinging to Phoo Phoo. She hasn't said one thing about herself. She's forgotten the planes on her own table." } },
    ] },
    { lines: [
      { my: 'ကျွန်မ ဆက်မစောင့်တော့ရင် သူ့ကို ဂရုမစိုက်တော့ဘူးလို့ ထင်သွားမှာ။ သူ့ကို ဆုံးရှုံးရလိမ့်မယ်။', en: "If I stop waiting, she'll think I don't care. I'll lose her.", need: 'afraid', seems: 'cling', face: 'worried',
        tell: { my: 'တွယ်ကပ်နေတာ မဟုတ်ဘူး။ လက်လွှတ်လိုက်ရင် သူငယ်ချင်းကို ဆုံးရှုံးရမှာကို ကြောက်နေတာ။', en: "Not clinging. She's afraid that letting go means losing her friend." } },
    ] },
    { lines: [
      { my: 'ဒါဆို… စောင့်နေတုန်း ဒီမှာ ကျွန်မ ဘာလုပ်ရမလဲဟင်။', en: 'Then… what do I do here while I wait?', need: 'unknown', face: 'think', heard: true,
        tell: { my: 'ပထမဆုံးအကြိမ်အဖြစ် သူ တံခါးအပြင်ဘက်က သူ့ဆိုင်လေးကို လှည့်ကြည့်လိုက်တယ်။', en: 'For the first time, she turns to look out of the door at her own stall.' } },
    ] },
  ],
  react: {
    miss: { my: '…ဟင်? အဲဒါ စွန်နဲ့ ဘာမှ မဆိုင်ဘူး။', en: "…Huh? That's nothing to do with the kite." },
    hot: { my: '(သီရိက အပေါက်နံပါတ် ၁၄ ကိုပဲ စိုက်ကြည့်နေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(Thiri only stares at hole ၁၄. Nothing gets through.)' },
  },
  decision: [
    { my: 'စွန်ကို ကျွန်မရဲ့ ကိုယ်ပိုင်တိုင်မှာပဲ ပြန်ချည်ထားတော့မယ်။', en: "I'll tie the kite back to my own post.", face: 'think' },
    { my: 'ဖူးဖူးဆီ ဆုတောင်းကောင်းလေး ပို့ပေးမယ်။ တခြားလူတွေလိုပဲ။ ပြီးတော့ အဖြေကို မျှော်မနေတော့ဘူး။', en: "I'll send Phoo Phoo a good wish. The same as anyone. And not wait for an answer.", face: 'happy' },
  ],
};
