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
  { id: 'theirs', flag: 'd4.card.theirs', name: { my: 'သူ့လက်ဆောင်၊ သူ့ရွေးချယ်မှု', en: 'Their gift, their choice' },
    line: { my: 'ဘယ်မှာ ပေးမလဲဆိုတာ ပေးတဲ့သူ ရွေးတာလေ။ ကျွန်မ သယ်ရုံပဲ သယ်ခဲ့တာ။', en: "Where to give is the giver's choice. I only carried." },
    answers: ['envy'], from: { my: 'လက်ဆောင်သုံးခု ပို့ရင်း', en: 'from carrying the three gifts' } },
  { id: 'glad', flag: 'd4.card.glad', name: { my: 'ရေသောက်တာ မြင်ရတော့', en: 'Watching it drink' },
    line: { my: 'ခွေးအိုကြီး ရေသောက်တာ မြင်ရတော့ ရင်ထဲ အေးသွားတယ်။ ကိုဖြိုးရော အဲဒီလို ခံစားဖူးလား။', en: 'When the old dog drank, it went cool inside me. Have you ever felt that, Ko Phyo?' },
    answers: ['envy', 'hot'], from: { my: 'ကုက္ကိုပင်အောက်မှာ', en: 'under the rain tree' } },
  { id: 'scold', lookalike: true, name: { my: 'ကိုယ်တိုင် ပေးကြည့်ပါလား', en: 'Why not give something yourself?' },
    line: { my: 'ဝေဖန်နေမယ့်အစား ကိုယ်တိုင် တစ်ခုခု ပေးကြည့်ပါလား။', en: 'Instead of judging, why not give something yourself?' },
    shows: ['envy', 'given'], really: { my: 'အမှန်ပြောသလို အထင်သေးတာ', en: 'looking down that passes for honesty' },
    backfire: { they: { my: 'ဘာနဲ့ ပေးရမှာလဲ! ဒါပဲ မဟုတ်လား၊ ကျွန်တော်က ဘာမှ မရှိတဲ့လူ။', en: "Give what?! That's it, isn't it: I'm the man with nothing." },
                maya: { my: '(အမှန်ကို အထက်စီးနဲ့ ပြောလိုက်တော့ သူ ပိုကျုံ့သွားတယ်။)', en: '(Said from above, the truth only shrank him.)' } } },
  { id: 'notyet', companion: 'seedling', name: { my: 'မရသေးဘူး', en: 'Not yet' },
    line: { my: 'ပေးစရာ မရှိသေးတာပါ။ ဘယ်တော့မှ မရှိဘူး မဟုတ်ဘူး။', en: "You've nothing to give yet. That isn't never." },
    answers: ['given'], from: { my: 'မရသေးပျိုးပင်လေး', en: 'the Not-Yet Seedling' } },
  { id: 'fillfirst', flag: 'd4.card.fillfirst', name: { my: 'ကိုယ့်အိုး အရင်ဖြည့်', en: 'Your own pot first' },
    line: { my: 'ဒေါ်တင်တင်က ပြောတယ်။ သူများအိုး မဖြည့်ခင် ကိုယ့်အိုးထဲ ရွက်၊ ဖျော်နည်း၊ စေတနာ ရှိရမယ်တဲ့။', en: "Daw Tin Tin says: before you fill another's pot, yours needs leaves, know-how and goodwill." },
    answers: ['given', 'unknown'], from: { my: 'ဒေါ်တင်တင် ပြောခဲ့တာ', en: 'from Daw Tin Tin' } },
  { id: 'why', companion: 'parrot', name: { my: 'ဘာကြောင့်လဲ', en: 'Why?' },
    line: { my: 'ဒေါ်တင်တင့် ရေနွေးကြမ်း ဘာလို့ မခါးတာလဲ။ သွားမေးကြည့်ရအောင်။', en: "Why isn't Daw Tin Tin's tea bitter? Let's go and ask her." },
    answers: ['unknown'], from: { my: 'ဘာကြောင့်ကြက်တူရွေး', en: 'the Why-Parrot' } },
  { id: 'nobody', flag: 'd4.card.nobody', name: { my: 'နာမည်မပါတဲ့ ထမင်းအိုး', en: 'The rice pot with no name' },
    line: { my: 'ဒေါ်ကြာက နာမည် မပြောခိုင်းဘူး။ ဒေါ်ရီကလည်း ဘယ်သူပေးလဲ မမေးဘူး။ ကြည့်တဲ့လူ မလိုဘူးလေ။', en: "Daw Kyar wouldn't give her name. Daw Yi never asks who gave. Nobody needs to be watching." },
    answers: ['cling'], from: { my: 'စေတနာထမင်းဆိုင်မှာ', en: 'from the free-food shop' } },
  { id: 'agree', lookalike: true, name: { my: 'ဟုတ်တယ်၊ အလဟဿပဲ', en: "You're right, it's a waste" },
    line: { my: 'ဟုတ်ပါတယ်။ ခွေးထက် လူကို ပေးသင့်တာပေါ့။', en: "You're right. People should come before dogs." },
    shows: ['envy'], really: { my: 'မနာလိုစိတ်ကို ဉာဏ်လို့ ထောက်ခံပေးတာ', en: 'backing envy as if it were wisdom' },
    backfire: { they: { my: 'မြင်လား! စာရေးဆရာမတောင် ကျွန်တော့်ဘက်!', en: "See! Even the writer's on my side!" },
                maya: { my: '(သူ့အပူကို ကျွန်မ မီးထိုးပေးလိုက်မိပြီ။)', en: '(I just fanned his heat.)' } } },
  { id: 'once', companion: 'sheep', name: { my: 'နောက်တစ်ခါ', en: 'Once more' },
    line: { my: 'ခါးသွားလည်း ရပါတယ်။ နောက်တစ်ခါ ပြန်ဖျော်ရုံပဲ။', en: 'Bitter is fine. Just brew it once more.' },
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
      { my: 'ခွေးအတွက် ရေခွက်တဲ့! လူတွေတောင် ရေငတ်နေတာ။ ဘယ်သူမှ နားမလည်ကြဘူး။', en: 'Water bowls for dogs! People are thirsty too. Nobody understands anything.', need: 'envy', seems: 'looksdown', face: 'hot',
        tell: { my: 'ယုယုကို အထင်သေးတာ မဟုတ်ဘူး။ သူ့လက်ကို ကြည့်ပြီး ကိုယ့်လက်ဗလာကို ပြန်ကြည့်နေတယ်။', en: "He isn't looking down on Yu Yu. He looks at her hands, then back at his own empty ones." } },
      { my: 'ပေးချင်ရင် ပညာနဲ့ ပေးရတယ်။ ကျွန်တော်ဆို ဒီလို… ', en: "If you give, give with sense. If it were me, I'd…", need: 'envy', seems: 'looksdown', face: 'think',
        tell: { my: '"ကျွန်တော်ဆို" လို့ ပြောပြီး ရပ်သွားတယ်။ ပေးစရာ မရှိလို့။', en: 'He says "if it were me" and stops. He has nothing to give.' } },
    ] },
    { lines: [
      { my: 'စာအုပ်ကို စာအုပ်ရှိတဲ့ကျောင်း၊ ဆန်ကို အလုပ်လုပ်နိုင်တဲ့လူ။ ကျွန်တော့်ကိုတော့ ဘယ်သူမှ မမေးဘူး။', en: 'Books to a school with books, rice to people who could work. And nobody ever asks me.', need: 'envy', seems: 'hot', face: 'hot', steam: 1,
        tell: { my: 'ဒေါသ မဟုတ်ဘူး။ "ကျွန်တော့်ကို ဘယ်သူမှ မမေးဘူး" ဆိုတဲ့နေရာမှာ အသံ တိုးသွားတယ်။', en: 'Not anger. His voice drops at "nobody ever asks me".' } },
      { my: 'သူတို့ ပေးရင် လူတွေ ကျေးဇူးတင်ကြတယ်။ ကျွန်တော် ပြောရင် ဘယ်သူမှ နားမထောင်ဘူး။', en: 'When they give, people thank them. When I talk, nobody listens.', need: 'envy', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'ဘာဖြစ်ဖြစ်… ကျွန်တော့်မှာ ပေးစရာ ဘာမှ မရှိဘူး။ ကိုယ်ပိုင် ကရားအိုလေးတောင် မရှိဘူး။', en: "Anyway… I've nothing to give. Not even a little pot of my own.", need: 'given', seems: 'envy', face: 'sad', mood: 'down',
        tell: { my: 'မနာလိုတာထက် လက်လျှော့နေတာ။ ဆိုင်က စင်ပေါ်ရှိ ကရားလေးတွေကို ခဏခဏ ကြည့်နေတယ်။', en: "More given up than envious. His eyes keep going to the little pots on the shop's shelf." } },
    ] },
    { lines: [
      { my: 'ရွက်ရှိလည်း ဖျော်တတ်မှာ မဟုတ်ဘူး။ ခါးနေမှာ။ ဘယ်သူမှ မသင်ပေးဖူးဘူး။', en: "Even with leaves I couldn't brew it. It'd come out bitter. Nobody ever showed me.", need: 'unknown', seems: 'given', face: 'worried', heard: true,
        tell: { my: 'ဖျော်ချင်နေတာ။ မသိသေးလို့ ကြောက်နေတာ။', en: "He wants to brew. He's only afraid because he doesn't know how yet." } },
    ] },
    { lines: [
      { my: 'ပေးလိုက်ပြီး ဘယ်သူမှ မမြင်ရင်… ကျွန်တော် ပါးစပ်သက်သက် မဟုတ်မှန်း ဘယ်သူ သိမှာလဲ။', en: "And if I give and nobody sees… who'll know I'm not just a mouth?", need: 'cling', seems: 'afraid', face: 'think',
        tell: { my: 'ကြောက်တာ မဟုတ်ဘူး။ လမ်းပေါ်က လူတွေ သူ့ကို တစ်မျိုး မြင်စေချင်တာ။ ပေးချင်တာက ကြည့်တဲ့သူတွေအတွက်။', en: 'Not fear. He wants the street to see him differently. The gift would be for the watchers.' } },
      { my: 'တံခါးဝ စားပွဲမှာ ငှဲ့ရင်တော့ လမ်းက လူတွေ မြင်မှာပေါ့…', en: 'If I poured at the table by the door, the whole street would see…', need: 'cling', face: 'think' },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါက လက်ဖက်ရည်နဲ့ ဘာဆိုင်လဲ။', en: '…What has that got to do with tea?' },
    hot: { my: '(ကိုဖြိုး ခွက်ကို ဆောင့်ချပြီး တံခါးအပြင်ကို မျက်စောင်းထိုးနေတယ်။ ဘာမှ မကြားဘူး။)', en: '(Ko Phyo bangs his cup down and glares out of the door. Nothing gets through.)' },
  },
  decision: [
    { my: 'ရေသုံးပုံး ခပ်ပြီး ကိုယ့်ရွက် ကိုယ်ရှာမယ်။ ပြီးရင် ဒေါ်တင်တင့်ကို ဖျော်နည်း မေးမယ်။', en: "I'll fetch three pails and earn my own leaves. Then I'll ask Daw Tin Tin how to brew.", face: 'think' },
    { my: 'ပထမခွက်ကို ဖြတ်သွားတဲ့သူ ဘယ်သူပဲဖြစ်ဖြစ် ငှဲ့မယ်။ ဘယ်သူ ကြည့်လဲ မကြည့်ဘူး။', en: "The first cup goes to whoever passes. I won't look who's watching.", face: 'happy' },
  ],
};

// ---------------------------------------------------------------------------------------------
// Ma Thiri
// ---------------------------------------------------------------------------------------------
export const D4_TH_CARDS = [
  { id: 'notwind', flag: 'd4.card.notwind', name: { my: 'အလံက လေ မဟုတ်ဘူး', en: "The flag isn't the wind" },
    line: { my: 'ကြိုးကို ဖူးဖူးရဲ့ အလံနဲ့ ချည်ထားတော့ အလံ မတက်ရင် ဘယ်လိုမှ မတက်ဘူးလေ။', en: "With the line tied to Phoo Phoo's flag, it can't rise unless the flag does." },
    answers: ['cling'], from: { my: 'စွန်ကြိုးကို လိုက်ကြည့်ရင်း', en: 'from following the line' } },
  { id: 'holdtight', lookalike: true, name: { my: 'တင်းတင်း ဆုပ်ထား', en: 'Hold On Tight' },
    line: { my: 'ထပ်ရေးပါ။ ပြန်မရေးမချင်း နေ့တိုင်း ရေး။ တကယ့်သူငယ်ချင်းဆို လက်မလွှတ်ဘူး။', en: "Write again. Every day until she answers. Real friends don't let go." },
    shows: ['cling', 'afraid'], really: { my: 'ကောင်းစေချင်တာလို့ ထင်ရတဲ့ တွယ်တာမှု', en: 'clinging that passes for goodwill' },
    backfire: { they: { my: 'ဟုတ်တယ်! တစ်နေ့ နှစ်စောင် ရေးမယ်!', en: "Yes! I'll write twice a day!" },
                maya: { my: '(ကြိုးကို ပိုတင်းအောင် ဆွဲခိုင်းလိုက်မိပြီ။ စွန် ပိုထိုးကျသွားတယ်။)', en: '(I told her to grip harder. The kite dives.)' } } },
  { id: 'ownhands', flag: 'd4.card.ownhands', name: { my: 'ကိုယ့်လက်နဲ့ ခေါက်တာ', en: 'Folded by your own hands' },
    line: { my: 'ဒီလေယာဉ်တွေ မသီရိ ကိုယ်တိုင် ခေါက်တာ။ ထောင့်တိုင်း တည့်တယ်။ စာရောက်ရောက် မရောက်ရောက် တည့်နေတာပဲ။', en: 'You folded these planes yourself. Every corner true, letter or no letter.' },
    answers: ['given'], from: { my: 'သူ့စားပွဲပေါ်က လေယာဉ်တွေ', en: 'from the planes on her table' } },
  { id: 'wishwell', flag: 'd4.card.wishwell', name: { my: 'ပေါ့တဲ့စာ', en: 'The light letter' },
    line: { my: 'ပြန်စာ စောင့်တဲ့စာက လေးတယ်တဲ့။ ဆုတောင်းရုံ စာက ပေါ့တယ်။ ဦးလူအေး ပြောတာ။', en: 'U Lu Aye says a letter that waits for an answer is heavy, and one that only wishes well is light.' },
    answers: ['afraid'], from: { my: 'ဦးလူအေး ပြောခဲ့တာ', en: 'from U Lu Aye' } },
  { id: 'once', companion: 'sheep', name: { my: 'နောက်တစ်ခါ', en: 'Once more' }, // a true page that does not fit her
    line: { my: 'နောက်တစ်ခါ ထပ်ရေးကြည့်ပါလား။', en: 'Why not write once more?' },
    answers: [], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'ignore', lookalike: true, name: { my: 'မေ့ပစ်လိုက်', en: 'Just Ignore Her' },
    line: { my: 'မေ့ပစ်လိုက်ပါ။ စာတစ်စောင်တောင် မတန်ဘူး။', en: "Forget her. She isn't worth a stamp." },
    shows: ['hot'], really: { my: 'အေးသလို ထင်ရတဲ့ ဖြတ်တောက်မှု', en: 'cutting someone off that passes for calm' },
    backfire: { they: { my: 'ဖူးဖူးကို အဲဒီလို မပြောနဲ့!', en: "Don't talk about Phoo Phoo like that!" },
                maya: { my: '(သူငယ်ချင်းကို ဖြတ်ခိုင်းတာ အေးတာ မဟုတ်ဘူး။ နောက်တစ်မျိုး ပူတာပဲ။)', en: "(Telling her to cut her friend off isn't cool. It's just another heat.)" } } },
  { id: 'notyet', companion: 'seedling', name: { my: 'မရသေးဘူး', en: 'Not yet' },
    line: { my: 'ကိုယ့်ဟာကိုယ် ပြန်မကြည့်ရသေးတာပါ။ ဘာမှ မဟုတ်တာ မဟုတ်ဘူး။', en: "You just haven't looked at your own things yet. That isn't nothing." },
    answers: ['given'], from: { my: 'မရသေးပျိုးပင်လေး', en: 'the Not-Yet Seedling' } },
  { id: 'ownpost', flag: 'd4.card.ownpost', name: { my: 'ကိုယ့်တိုင်', en: 'Your own post' },
    line: { my: 'ဆိုင်ဘေးက ဝါးတိုင်မှာ ကြိုးရာတွေ ရှိသေးတယ်။ အရင်က အဲဒီမှာ ချည်ခဲ့တာ မဟုတ်လား။', en: "There are string marks on the bamboo post by your stall. You used to tie it there, didn't you?" },
    answers: ['unknown', 'given'], from: { my: 'ဝါးတိုင်', en: 'from the bamboo post' } },
  { id: 'why', companion: 'parrot', name: { my: 'ဘာကြောင့်လဲ', en: 'Why?' },
    line: { my: 'ဖူးဖူး မပြောင်းခင်က မသီရိ ဘာလုပ်ရတာ အကြိုက်ဆုံးလဲ။', en: 'Before Phoo Phoo moved, what did you love doing most?' },
    answers: ['unknown'], from: { my: 'ဘာကြောင့်ကြက်တူရွေး', en: 'the Why-Parrot' } },
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
      { my: 'သုံးရက် ရှိပြီ။ မနက်တိုင်း ရေးတယ်။ သူကတော့… ဘာမှ မရေးဘူး။', en: 'Three days. I write every morning. She… writes nothing.', need: 'cling', seems: 'hot', face: 'sad',
        tell: { my: 'စိတ်ဆိုးနေတာ မဟုတ်ဘူး။ စကားတစ်ခွန်းပြောတိုင်း အကွက် ၁၄ ကို လှမ်းကြည့်တယ်။ ခုံစွန်းကို လက်ဆစ်ဖြူအောင် ဆုပ်ထားတယ်။', en: 'Not angry. She glances at hole ၁၄ after every word, gripping the bench edge till her knuckles go pale.' } },
      { my: 'အလံ တက်လာရင် စွန်လည်း တက်မှာ။ ခဏလေး စောင့်ကြည့်ရအောင်။', en: "If the flag goes up, the kite will too. Let's just wait a little.", need: 'cling', face: 'worried' },
    ] },
    { lines: [
      { my: 'ကျွန်မ သူ့အပေါ် ကောင်းလိုက်ရတာ။ အကောင်းဆုံး ဘောပင်တောင် ပေးလိုက်တာ။ ဒီလို လုပ်ရက်တယ်နော်။', en: 'I was so good to her. I even gave her my best pen. And she does this.', need: 'hot', face: 'hot', steam: 1, heard: true,
        tell: { my: 'ဒီအတွေးက ဖူးဖူးကို မလောင်ဘူး။ သူ့ကိုပဲ ပြန်လောင်နေတာ။', en: "This thought doesn't burn Phoo Phoo. It only burns her." } },
      { my: 'နေ့တိုင်း ရေးခဲ့တာ ကျွန်မပဲ။ အမြဲ ကျွန်မပဲ။', en: "I'm the one who wrote every day. Always me.", need: 'hot', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'သူ့စာ ရောက်ရင် ကျွန်မ အဆင်ပြေတယ်။ မရောက်ရင်… ကျွန်မ ဘာမှ မဟုတ်သလိုပဲ။', en: "When her letter comes, I'm fine. When it doesn't… it's like I'm nothing.", need: 'given', seems: 'cling', face: 'sad', mood: 'down',
        tell: { my: 'ဖူးဖူးကို တွယ်ရုံ မဟုတ်ဘူး။ ကိုယ့်အကြောင်း တစ်ခွန်းမှ မပြောတော့ဘူး။ စားပွဲပေါ်က လေယာဉ်လေးတွေကို မေ့နေတယ်။', en: "Not only clinging to Phoo Phoo. She hasn't said one thing about herself. She's forgotten the planes on her own table." } },
    ] },
    { lines: [
      { my: 'စောင့်တာ ရပ်လိုက်ရင် ဂရုမစိုက်တော့ဘူးလို့ သူ ထင်မှာ။ ဆုံးရှုံးသွားမှာ။', en: "If I stop waiting, she'll think I don't care. I'll lose her.", need: 'afraid', seems: 'cling', face: 'worried',
        tell: { my: 'တွယ်တာလို့ မဟုတ်ဘူး။ လွှတ်လိုက်ရင် သူငယ်ချင်းပါ ပျောက်မှာ ကြောက်နေတာ။', en: "Not clinging. She's afraid that letting go means losing her friend." } },
    ] },
    { lines: [
      { my: 'ဒါဆို… စောင့်နေရင်း ကျွန်မ ဒီမှာ ဘာလုပ်ရမလဲ။', en: 'Then… what do I do here while I wait?', need: 'unknown', face: 'think', heard: true,
        tell: { my: 'တံခါးဝကနေ ကိုယ့်ဆိုင်ဘက်ကို ပထမဆုံးအကြိမ် လှည့်ကြည့်တယ်။', en: 'For the first time, she turns to look out of the door at her own stall.' } },
    ] },
  ],
  react: {
    miss: { my: '…ဟင်? အဲဒါ စွန်နဲ့ မဆိုင်ဘူး။', en: "…Huh? That's nothing to do with the kite." },
    hot: { my: '(မသီရိ အကွက် ၁၄ ကိုပဲ စိုက်ကြည့်နေတယ်။ ဘာမှ မကြားဘူး။)', en: '(Thiri only stares at hole ၁၄. Nothing gets through.)' },
  },
  decision: [
    { my: 'စွန်ကို ကိုယ့်ဝါးတိုင်မှာ ပြန်ချည်မယ်။', en: "I'll tie the kite back to my own post.", face: 'think' },
    { my: 'ဖူးဖူးကို ဆုတောင်းစာ ပို့မယ်။ လူတိုင်းကို ပို့သလိုပဲ။ ပြန်စာ မစောင့်ဘူး။', en: "I'll send Phoo Phoo a good wish. The same as anyone. And not wait for an answer.", face: 'happy' },
  ],
};
