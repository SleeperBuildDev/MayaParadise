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
  { id: 'meaning', name: { my: 'အဓိပ္ပာယ်နဲ့ ပြော', en: 'Say what it means' },
    line: { my: 'ခုနက စာအုပ်မပါဘဲ ကိုယ့်စကားနဲ့ ပြောနိုင်ခဲ့တယ်လေ။ အဲဒါ မင်းဟာ။', en: 'Just now you said it in your own words, no book. That was yours.' },
    answers: ['cling', 'unknown'], from: { my: 'အစမ်းကပြမှာ ရခဲ့တာ', en: 'from the rehearsal' } },
  { id: 'heading', name: { my: 'ဘယ်ကိုသွားလဲ မြင်ပြီ', en: 'You saw where it goes' },
    line: { my: 'နောက်ခံကားကို တံတားအထိ မင်း ဆွဲခဲ့တာ။ ပြဇာတ် ဘယ်ကိုသွားလဲ မင်း သိပြီးသား။', en: 'You painted the road to the bridge. You already know where the play goes.' },
    answers: ['unknown', 'given'], from: { my: 'နောက်ဆုံးတန်းက ရခဲ့တာ', en: 'from the back row' } },
  { id: 'owners', name: { my: 'ခန်းတိုင်းမှာ ကိုယ်ပိုင် ဇာတ်လိုက်', en: 'Each scene its own lead' },
    line: { my: 'ခန်းတိုင်းမှာ ကိုယ့်ဇာတ်လိုက် ကိုယ်ရှိတယ်။ ခန်းအားလုံးကို တစ်ယောက်တည်း ဦးဆောင်တာ မရှိဘူး။ "မာရာ" တောင် မဟုတ်ဘူး။', en: 'Every scene has its own lead. Nobody leads them all. Not even "Maya".' },
    answers: ['afraid'], from: { my: 'ဇာတ်ကောင်စာရင်းက ရခဲ့တာ', en: 'from the cast list' } },
  { id: 'tonight', name: { my: 'ဒီညဟာ', en: "Tonight's" },
    line: { my: 'မနှစ်ကဟာ ပြီးသွားပြီ။ နောက်နှစ်ဟာ မရောက်သေးဘူး။ ဒီည ကိုင်ထားတာပဲ လုပ်လို့ရတာ။', en: "Last year's is gone. Next year's isn't here. Tonight's is the one you can work on." },
    answers: ['cling'], from: { my: 'ပစ္စည်းခြင်းထဲက ရခဲ့တာ', en: 'from the prop basket' } },
  { id: 'earth', companion: 'earth', onlyIf: 'companion:earth', pencil: false,
    name: { my: 'မြေကြီးလို', en: 'Like the earth' }, // Little Earth, still pencil (it lifted off this morning)
    line: { my: 'လက်ခုပ်သံ ကြားကြား မကြားကြား မြေကြီးက ဒီအတိုင်းပဲ။', en: 'Clapping or silence, the ground stays the same.' },
    answers: ['cling'], from: { my: 'မြေကြီးလေး', en: 'Little Earth' } },
  { id: 'once', companion: 'sheep', onlyIf: 'companion:sheep', gold: true, // the Black Sheep, inked gold by now
    name: { my: 'နောက်တစ်ခါ', en: 'Once more' },
    line: { my: 'နောက်တစ်ခါ ကိုယ့်စကားနဲ့ ပြောကြည့်။ ခုနကလည်း ရခဲ့တာပဲ။', en: 'Once more, in your own words. You managed it just now.' }, // the Sheep's own word (ch 1)
    answers: ['given', 'afraid'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'special', lookalike: true, name: { my: 'မင်းက ထူးခြားတယ်', en: "You're special" },
    line: { my: 'မင်းက တကယ် ထူးခြားတယ်။ ပြဇာတ်က ခန်းတိုင်းမှာ မင်းကို လိုတယ်။', en: 'You really are special. The play needs you in every scene.' },
    shows: ['afraid'], really: { my: 'ဇာတ်လိုက်ဖြစ်ချင်စိတ်ကို မြှောက်ပေးတာ', en: 'flattery that feeds the wish to be the lead' },
    backfire: { they: { my: 'ဟုတ်တယ်မလား! ဒါဆို ခန်းတိုင်းမှာ မနှစ်က မိန့်ခွန်း ပြန်ပြောမယ်!', en: "Right?! Then I'll say last year's speech in every scene!" },
                maya: { my: '(သူ့ကို ဖိထားတဲ့အရာကိုပဲ ကျွန်မ ထပ်ကျွေးလိုက်မိပြီ။)', en: '(I just fed the very thing that weighs on him.)' } } },
  // pencil rumour look-alike: in the hand only while rumour `prize` is unchecked (player review)
  { id: 'rumour:prize', lookalike: true, pencil: true, rumour: 'noprize', unless: 'bag:proof:noprize || d7.rumour.prize',
    name: { my: 'ဆု ထပ်ယူလိုက်', en: 'Win the prize again' },
    line: { my: 'ဒီညလည်း အကောင်းဆုံး သရုပ်ဆောင်ဆု ယူလိုက်ပေါ့။', en: 'Win best actor again tonight, then.' },
    shows: ['cling'], really: { my: 'မစစ်ရသေးတဲ့ ကောလာဟလကို ဆက်ပြောတာ', en: "passing on a rumour you haven't checked" },
    backfire: { they: { my: 'ဆု ရှိတယ်ဆိုရင်… ဇာတ်လိုက် ကျွန်တော်ပဲ ဖြစ်ရမယ်!', en: "If there's a prize… then the lead has to be me!" },
                maya: { my: '(ဆုရှိမရှိ ကျွန်မ ကိုယ်တိုင် မမေးရသေးဘူး။)', en: '(I never asked whether there is a prize.)' } } },
  // replaces rumour:prize once `proof:noprize` is in the bag; fits by itself when he repeats the rumour
  { id: 'proof:noprize', onlyIf: 'bag:proof:noprize',
    name: { my: 'သက်သေစာရွက်: ဆုမရှိ', en: 'Proof slip: no prize' },
    line: { my: 'ဒီည ဆုမရှိဘူး။ နှုတ်ဆက်ပွဲပဲ။ ဆရာမကို ကိုယ်တိုင် မေးခဲ့တယ်။', en: "There's no prize tonight. It's a farewell. I asked your teacher myself." },
    answers: ['cling'], from: { my: 'ကိုယ်တိုင် စစ်ခဲ့တာ', en: 'checked myself' } },
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
      { my: 'မနှစ်က လက်ခုပ်သံ တစ်မိနစ်လုံး မပြတ်ဘူး။ ဒီညလည်း တစ်လုံးမကျန် ပြန်ပြောမယ်။', en: "Last year they clapped a whole minute. Tonight I'll say it again, word for word.", need: 'cling', seems: 'looksdown', face: 'think',
        tell: { my: 'ကိုယ့်ကိုယ်ကို ဂုဏ်ယူနေတာ မဟုတ်ဘူး။ အင်္ကျီအတွင်းက ဖဲကြိုးဟောင်းကို လက်မနဲ့ ပွတ်နေတယ်။ မနှစ်ကို ဆုပ်ကိုင်ထားတာ။', en: "Not pride. His thumb keeps rubbing the old ribbon inside his jacket. He's holding on to last year." } },
      { my: 'ဒီည အကောင်းဆုံး သရုပ်ဆောင်ဆု ရှိတယ်မလား။ မနှစ်က ကျွန်တော် ရခဲ့တာ။', en: "There's a best-actor prize tonight, isn't there? I won last year.", need: 'cling', seems: 'envy', face: 'think',
        tell: { my: 'ဘယ်သူ့ဆုကိုမှ မနာလိုတာ မဟုတ်ဘူး။ မနှစ်ကဟာ ဒီနှစ်ထိ အလုပ်ဖြစ်သေးလား မေးနေတာ။', en: "He doesn't envy anyone. He's asking whether last year still counts." } },
    ] },
    { lines: [
      { my: 'ခုံသယ်တာ တခြားသူတွေ အလုပ်။ ကျွန်တော်က မတူဘူး။', en: "Carrying benches is for the others. I'm different.", need: 'afraid', seems: 'looksdown', face: 'hot', steam: 1,
        tell: { my: 'သူတို့ကို အထင်သေးတာ မဟုတ်ဘူး။ အတူတူ ရယ်ပြီး ခုံသယ်နေတဲ့ တန်းကို ခဏခဏ လှည့်ကြည့်တယ်။ သူလည်း သယ်ရင် သူတို့ထဲက တစ်ယောက်ပဲ ဖြစ်သွားမှာ ကြောက်နေတာ။', en: "He doesn't look down on them. He keeps glancing at the line laughing as they carry. If he carried too, he'd be just one of them, and that scares him." } },
      { my: 'ဇာတ်လိုက်က ခုံမသယ်ဘူး။ လူတိုင်း သိတယ်။', en: "The lead doesn't carry benches. Everyone knows that.", need: 'afraid', seems: 'looksdown', face: 'hot' },
    ] },
    { lines: [
      { my: 'ခန်းတိုင်းမှာ "မာရာ" မပါရင်… ကျွန်တော် မပါရင်… စင်ပေါ်မှာ ကျွန်တော်က ဘယ်သူမှ မဟုတ်တော့ဘူး။', en: 'If "Maya" isn\'t in every scene… if I\'m not… then up there I\'m nobody.', need: 'afraid', face: 'sad', heard: true,
        tell: { my: 'စိတ်ကောက်နေတာ မဟုတ်ဘူး။ "ဘယ်သူမှ မဟုတ်" ဆိုတဲ့စကားကို တကယ်ဖြစ်မှာ စိုးသလို တိုးတိုးလေး ပြောတယ်။', en: 'Not sulking. He says "nobody" very quietly, as if it might be true.' } },
    ] },
    { lines: [
      { my: 'ဒါဆို စင်ပေါ်မှာ ကျွန်တော် ဘာလုပ်ရမလဲ။ ဇာတ်လိုက်ကလွဲရင် ဘာအပိုင်းမှ မသိဘူး။', en: "Then what do I do on stage? I don't know any part but the lead.", need: 'unknown', seems: 'hot', face: 'think',
        tell: { my: 'ငြင်းနေတာ မဟုတ်ဘူး။ သူ ဆေးသုတ်ခဲ့တဲ့ နောက်ခံကားကို ကြည့်ပြီး တကယ် မေးနေတာ။', en: "He isn't refusing. He's looking at the backdrop he painted, and truly asking." } },
      { my: 'မနှစ်က ဘာပြောရမလဲ အတိအကျ သိခဲ့တယ်။ ဒီည မသိဘူး။', en: "Last year I knew exactly what to say. Tonight I don't.", need: 'unknown', face: 'worried' },
    ] },
    { lines: [
      { my: 'မိန့်ခွန်း တစ်ခုတည်းကို သုံးနှစ် ပြောခဲ့တယ်။ ကျွန်တော် တခြားဟာ မတတ်တော့ဘူး ထင်တယ်။', en: "Three years, the same speech. Maybe I can't do anything else.", need: 'given', seems: 'cling', face: 'sad', mood: 'down',
        tell: { my: 'မိန့်ခွန်းကို တွယ်တာနေတာ မဟုတ်တော့ဘူး။ ငြီးငွေ့နေပြီ။ ကိုယ့်စကား ရှာဖို့ လက်လျှော့ချင်နေတာ။', en: "He isn't clinging to the speech any more. He's tired of it, and close to giving up on finding his own." } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါ ပြဇာတ်နဲ့ ဘာဆိုင်လဲ။', en: '…What does that have to do with the play?' },
    hot: { my: '(ရဲယဉ့် ဖဲကြိုးဟောင်းကို တင်းတင်းဆုပ်ပြီး မိန့်ခွန်းကို တိုးတိုးရွတ်နေတယ်။ ဘာမှ မကြားဘူး။)', en: '(Ye Yint grips the old ribbon, muttering the speech. Nothing gets through.)' },
  },
  decision: [
    { my: 'ဘယ်သူမှ ဇာတ်လိုက် မဟုတ်ဘူးဆိုတော့… ပေါ့သွားတယ်။ လူတိုင်းက ကျွန်တော့်ကိုပဲ ကြည့်နေစရာ မလိုတော့ဘူး။', en: "If nobody's the lead… that's lighter. Nobody has to watch only me.", face: 'surprised' },
    { my: 'ဒီည တိုးတိုးရဲ့ခန်းမှာ ရေဇလုံသယ်တဲ့ကောင်လေး လုပ်မယ်။ ပြီးတော့ ကျွန်တော့်ခန်း တစ်ခန်းတည်း: မိန့်ခွန်းတစ်ခုတည်း သုံးနှစ်ပြောခဲ့တဲ့ ကောင်လေး။ ဒီညရဲ့ စကားနဲ့ ပြောမယ်။', en: "Tonight I'll be the boy with the water bowl in Toe Toe's scene. And one scene of my own: the boy who gave the same speech three years. In tonight's words.", face: 'happy' },
  ],
};
