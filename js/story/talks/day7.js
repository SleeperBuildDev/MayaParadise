// Day 7's talk: Ye Yint on the edge of the classroom platform, after the scenes went back to their owners.
// Format: see the top of js/story/talk.js. Burmese lines are drafts for Maya to proofread.
//
// Chapter 4 (ပြောင်းလဲခြင်း): his needs are that he CLINGS to last year (the ribbon, the speech); he holds
// himself apart, which looks like looking down but is FEAR of being "just one of them", nobody; he DOESN'T
// KNOW a part that isn't the lead; underneath, he has a little GIVEN UP on finding his own words.
// Never comfort him with "you are somebody": the relief is that nobody is the lead.
// Maya's hand: the four cards the classroom earned (meaning, heading, owners, tonight), two companions
// (Little Earth in pencil since this morning, the Black Sheep inked gold), one custom look-alike
// ("You're special") and, while rumour `prize` is unchecked, a pencil rumour look-alike; once the slip
// `proof:noprize` is in the bag, the slip itself replaces it and fits the prize line by itself.

export const D7_YY_CARDS = [
  { id: 'meaning', name: { my: 'ဆိုလိုရင်းကို ပြောပြပါ', en: 'Say what it means' },
    line: { my: 'အခုလေးတင် စာအုပ်မကြည့်ဘဲ ကိုယ့်စကားနဲ့ကိုယ် ပြောသွားတာပဲ။ အဲဒါ မင်းစကား အစစ်ပဲ။', en: 'Just now you said it in your own words, no book. That was yours.' },
    answers: ['cling', 'unknown'], from: { my: 'အစမ်းလေ့ကျင့်ခန်းဆီက', en: 'from the rehearsal' } },
  { id: 'heading', name: { my: 'ဘယ်ကို ဦးတည်နေလဲ မင်း မြင်ပြီးသားပါ', en: 'You saw where it goes' },
    line: { my: 'တံတားဆီ သွားတဲ့ လမ်းကို မင်း ပန်းချီဆွဲခဲ့တာပဲ။ ပြဇာတ်က ဘယ်ကို ဦးတည်နေလဲ မင်း သိပြီးသားပါ။', en: 'You painted the road to the bridge. You already know where the play goes.' },
    answers: ['unknown', 'given'], from: { my: 'နောက်ဆုံးတန်းဆီက', en: 'from the back row' } },
  { id: 'owners', name: { my: 'အခန်းတိုင်းမှာ သူ့ဇာတ်ဆောင်နဲ့သူ ရှိတယ်', en: 'Each scene its own lead' },
    line: { my: 'ဇာတ်ဝင်ခန်းတိုင်းမှာ သူ့အဓိကဇာတ်ဆောင်နဲ့သူ ရှိတယ်။ အခန်းတိုင်းကို ဘယ်သူမှ ဦးမဆောင်နိုင်ဘူး။ "မာရာ" တောင် မလုပ်နိုင်ဘူး။', en: 'Every scene has its own lead. Nobody leads them all. Not even "Maya".' },
    answers: ['afraid'], from: { my: 'သရုပ်ဆောင်စာရင်းဆီက', en: 'from the cast list' } },
  { id: 'tonight', name: { my: 'ဒီည အတွက်', en: "Tonight's" },
    line: { my: 'မနှစ်က ပြီးသွားပြီ။ နောက်နှစ်က မရောက်သေးဘူး။ ဒီညကသာ မင်း လုပ်နိုင်တဲ့ အရာပဲ။', en: "Last year's is gone. Next year's isn't here. Tonight's is the one you can work on." },
    answers: ['cling'], from: { my: 'ဇာတ်ပစ္စည်း ခြင်းတောင်းဆီက', en: 'from the prop basket' } },
  { id: 'earth', companion: 'earth', onlyIf: 'companion:earth', pencil: false,
    name: { my: 'မြေကြီးလိုပဲ', en: 'Like the earth' }, // Little Earth, still pencil (it lifted off this morning)
    line: { my: 'လက်ခုပ်တီးသည်ဖြစ်စေ၊ တိတ်ဆိတ်နေသည်ဖြစ်စေ မြေကြီးကတော့ အရင်အတိုင်းပါပဲ။', en: 'Clapping or silence, the ground stays the same.' },
    answers: ['cling'], from: { my: 'မြေကြီးလေး', en: 'Little Earth' } },
  { id: 'once', companion: 'sheep', onlyIf: 'companion:sheep', gold: true, // the Black Sheep, inked gold by now
    name: { my: 'နောက်တစ်ခေါက်', en: 'Once more' },
    line: { my: 'ကိုယ့်စကားနဲ့ကိုယ် နောက်တစ်ခေါက် ထပ်ပြောကြည့်။ အခုလေးတင် မင်း လုပ်နိုင်ခဲ့တာပဲ။', en: 'Once more, in your own words. You managed it just now.' }, // the Sheep's own word (ch 1)
    answers: ['given', 'afraid'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'special', lookalike: true, name: { my: 'မင်းက ထူးခြားတယ်', en: "You're special" },
    line: { my: 'မင်း တကယ် ထူးခြားတာပါ။ ပြဇာတ်က အခန်းတိုင်းမှာ မင်းကို လိုအပ်နေတယ်။', en: 'You really are special. The play needs you in every scene.' },
    shows: ['afraid'], really: { my: 'ဇာတ်ဆောင် လုပ်ချင်စိတ်ကို မြှောက်ပင့်ပေးမိတာ', en: 'flattery that feeds the wish to be the lead' },
    backfire: { they: { my: 'ဟုတ်တယ်မလား။ ဒါဆို ကျွန်တော် အခန်းတိုင်းမှာ မနှစ်က မိန့်ခွန်းကိုပဲ ပြောတော့မယ်။', en: "Right?! Then I'll say last year's speech in every scene!" },
                maya: { my: '(သူ့ကို ဝန်ပိစေတဲ့ အရာကိုပဲ ငါ ထပ်ဖြည့်ပေးလိုက်မိပြီ။)', en: '(I just fed the very thing that weighs on him.)' } } },
  // pencil rumour look-alike: in the hand only while rumour `prize` is unchecked (player review)
  { id: 'rumour:prize', lookalike: true, pencil: true, rumour: 'noprize', unless: 'bag:proof:noprize || d7.rumour.prize',
    name: { my: 'ဆု ထပ်ယူလိုက်ပေါ့', en: 'Win the prize again' },
    line: { my: 'ဒါဆို ဒီညလည်း အကောင်းဆုံး သရုပ်ဆောင်ဆု ထပ်ယူလိုက်ပေါ့။', en: 'Win best actor again tonight, then.' },
    shows: ['cling'], really: { my: 'မစစ်ဆေးရသေးတဲ့ ကောလာဟလကို လက်ဆင့်ကမ်းမိတာ', en: "passing on a rumour you haven't checked" },
    backfire: { they: { my: 'ဆု ရှိတယ်ဆိုရင်… အဓိကဇာတ်ဆောင်က ကျွန်တော်ပဲ ဖြစ်ရမှာပေါ့။', en: "If there's a prize… then the lead has to be me!" },
                maya: { my: '(ဆု ရှိမရှိ ငါ တစ်ခါမှ မမေးကြည့်မိဘူး။)', en: '(I never asked whether there is a prize.)' } } },
  // replaces rumour:prize once `proof:noprize` is in the bag; fits by itself when he repeats the rumour
  { id: 'proof:noprize', onlyIf: 'bag:proof:noprize',
    name: { my: 'သက်သေစာရွက်- ဆု မရှိပါ', en: 'Proof slip: no prize' },
    line: { my: 'ဒီည ဆုပေးပွဲ မရှိဘူး။ နှုတ်ဆက်ပွဲ သက်သက်ပဲ။ မင်းဆရာကို ငါကိုယ်တိုင် မေးခဲ့ပြီးပြီ။', en: "There's no prize tonight. It's a farewell. I asked your teacher myself." },
    answers: ['cling'], from: { my: 'ကိုယ်တိုင် စစ်ဆေးထားတာ', en: 'checked myself' } },
];

export const TALK_D7_YEYINT = {
  id: 'd7-yeyint',
  person: 'yeyint',
  with: ['hninwai', 'toetoe', 'micho', 'sunwe', 'maungnge'],
  steam: 2, calm: 4, turns: 8,
  noStepBack: true, // Act 1 (Days 1-7): no Step back yet
  hand: D7_YY_CARDS,
  stones: [
    { lines: [
      { my: 'မနှစ်က တစ်မိနစ်လုံး လက်ခုပ်တီးခဲ့ကြတာ။ ဒီညလည်း တစ်လုံးမကျန် ပြန်ပြောမယ်။', en: "Last year they clapped a whole minute. Tonight I'll say it again, word for word.", need: 'cling', seems: 'looksdown', face: 'think',
        tell: { my: 'မာနကြီးနေတာ မဟုတ်ဘူး။ အင်္ကျီအတွင်းဘက်က ဖဲကြိုးဟောင်းလေးကို လက်မနဲ့ ပွတ်သပ်နေတယ်။ မနှစ်က အချိန်ကို ဖက်တွယ်ထားတာ။', en: "Not pride. His thumb keeps rubbing the old ribbon inside his jacket. He's holding on to last year." } },
      { my: 'ဒီည အကောင်းဆုံး သရုပ်ဆောင်ဆု ရှိတယ် မဟုတ်လား။ မနှစ်က ကျွန်တော် ရခဲ့တာလေ။', en: "There's a best-actor prize tonight, isn't there? I won last year.", need: 'cling', seems: 'envy', face: 'think',
        tell: { my: 'သူ ဘယ်သူ့ကိုမှ မနာလို ဖြစ်နေတာ မဟုတ်ဘူး။ မနှစ်က အောင်မြင်မှုက အခုထိ အကျုံးဝင်သေးလား ဆိုတာကို မေးနေတာ။', en: "He doesn't envy anyone. He's asking whether last year still counts." } },
    ] },
    { lines: [
      { my: 'ခုံတန်းတွေ သယ်ရတာက တခြားလူတွေ အလုပ်ပါ။ ကျွန်တော်က မတူဘူး။', en: "Carrying benches is for the others. I'm different.", need: 'afraid', seems: 'looksdown', face: 'hot', steam: 1,
        tell: { my: 'သူတို့ကို အထင်သေးနေတာ မဟုတ်ဘူး။ ရယ်မောပြီး သယ်နေကြတဲ့ အတန်းကို ခိုးခိုးကြည့်နေတာ။ သူပါ ဝင်သယ်လိုက်ရင် သူတို့လိုပဲ သာမန်လူ ဖြစ်သွားမှာကို ကြောက်နေတာ။', en: "He doesn't look down on them. He keeps glancing at the line laughing as they carry. If he carried too, he'd be just one of them, and that scares him." } },
      { my: 'အဓိကဇာတ်ဆောင်က ခုံတန်း မသယ်ရဘူး။ အဲဒါ အားလုံး သိပြီးသားပဲ။', en: "The lead doesn't carry benches. Everyone knows that.", need: 'afraid', seems: 'looksdown', face: 'hot' },
    ] },
    { lines: [
      { my: '"မာရာ" က အခန်းတိုင်းမှာ မပါရင်… ကျွန်တော် မပါရင်… စင်ပေါ်မှာ ကျွန်တော်က ဘာမှ မဟုတ်တော့ဘူးပေါ့။', en: 'If "Maya" isn\'t in every scene… if I\'m not… then up there I\'m nobody.', need: 'afraid', face: 'sad', heard: true,
        tell: { my: 'စိတ်ကောက်နေတာ မဟုတ်ဘူး။ "ဘာမှ မဟုတ်တော့ဘူး" ဆိုတဲ့ စကားကို တကယ် ဖြစ်နေသလိုမျိုး တိုးတိုးလေး ပြောလိုက်တာ။', en: 'Not sulking. He says "nobody" very quietly, as if it might be true.' } },
    ] },
    { lines: [
      { my: 'ဒါဆို စင်ပေါ်မှာ ကျွန်တော် ဘာလုပ်ရမှာလဲ။ အဓိကဇာတ်ဆောင် နေရာကလွဲရင် ကျွန်တော် ဘာမှ မလုပ်တတ်ဘူး။', en: "Then what do I do on stage? I don't know any part but the lead.", need: 'unknown', seems: 'hot', face: 'think',
        tell: { my: 'သူ ငြင်းဆန်နေတာ မဟုတ်ဘူး။ သူ ဆွဲထားတဲ့ နောက်ခံပန်းချီကားကို ကြည့်ပြီး တကယ် မေးနေတာ။', en: "He isn't refusing. He's looking at the backdrop he painted, and truly asking." } },
      { my: 'မနှစ်က ဘာပြောရမလဲ ကျွန်တော် အတိအကျ သိခဲ့တယ်။ ဒီညတော့ မသိတော့ဘူး။', en: "Last year I knew exactly what to say. Tonight I don't.", need: 'unknown', face: 'worried' },
    ] },
    { lines: [
      { my: 'သုံးနှစ်လုံးလုံး ဒီမိန့်ခွန်း တစ်ခုတည်းပဲ။ ကျွန်တော် တခြား ဘာမှ မလုပ်တတ်တော့ဘူး ထင်ပါတယ်။', en: "Three years, the same speech. Maybe I can't do anything else.", need: 'given', seems: 'cling', face: 'sad', mood: 'down',
        tell: { my: 'မိန့်ခွန်းကို တွယ်ကပ်နေတာ မဟုတ်တော့ဘူး။ ဒါကို ငြီးငွေ့နေပြီ၊ ကိုယ်ပိုင်စကား ရှာဖို့ကိုလည်း လက်လျှော့ခါနီး ဖြစ်နေပြီ။', en: "He isn't clinging to the speech any more. He's tired of it, and close to giving up on finding his own." } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါ ပြဇာတ်နဲ့ ဘာဆိုင်လို့လဲ။', en: '…What does that have to do with the play?' },
    hot: { my: '(ရဲယဉ့် ဖဲကြိုးဟောင်းလေးကို ကျစ်ကျစ်ပါအောင် ဆုပ်ပြီး မိန့်ခွန်းကိုပဲ တတွတ်တွတ် ရွတ်နေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(Ye Yint grips the old ribbon, muttering the speech. Nothing gets through.)' },
  },
  decision: [
    { my: 'ဘယ်သူမှ အဓိကဇာတ်ဆောင် မဟုတ်ဘူးဆိုရင်… ပိုပေါ့ပါးသွားတာပေါ့။ ကျွန်တော့် တစ်ယောက်တည်းကိုပဲ လူတွေ ဝိုင်းကြည့်နေစရာ မလိုတော့ဘူး။', en: "If nobody's the lead… that's lighter. Nobody has to watch only me.", face: 'surprised' },
    { my: 'ဒီည တိုးတိုးရဲ့ ဇာတ်ဝင်ခန်းမှာ ကျွန်တော် ရေခွက်ကိုင်တဲ့ ကောင်လေး လုပ်မယ်။ ပြီးတော့ ကျွန်တော့် ကိုယ်ပိုင် အခန်းတစ်ခန်း- သုံးနှစ်လုံးလုံး မိန့်ခွန်းတစ်ခုတည်း ပြောခဲ့တဲ့ ကောင်လေး အကြောင်း။ ဒီည စကားလုံးတွေနဲ့ပေါ့။', en: "Tonight I'll be the boy with the water bowl in Toe Toe's scene. And one scene of my own: the boy who gave the same speech three years. In tonight's words.", face: 'happy' },
  ],
};
