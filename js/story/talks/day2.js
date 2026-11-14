// Day 2's two talks (day2-spec 5.5 and 6.4). Format: see the top of js/story/talk.js.
// Every Burmese line is a draft for Maya to proofread.
//
// Toe Toe (ch 3, in the classroom at his own desk): he has given up on learning (no evening class, no
// money), he doesn't know why reciting failed, and he is afraid of letting his teacher down. The walk
// earned three plain cards; the Black Sheep adds its pencil card `once`. The two look-alikes are the two
// wrong choices from the playground (recite again / hand him the answer).
//
// Daw Ohn (ch 5 Act 1, in her shed at her wheel): she clings to the one way that made her, has given up
// on Mi Cho (the chalk), is afraid another way calls her master wrong, and doesn't know another way (Mi Cho
// is her first pupil). She is NOT won over: her signpost is a one-day trial, in her own words.
//
// Card gating (talk.js `onlyIf`): a card is in the hand only once Maya has earned it today.

export const D2_TT_CARDS = [
  { id: 'counted', name: { my: 'ကိုယ်တိုင် တွက်ခဲ့တာ', en: 'You worked it out' },
    line: { my: 'ဒီမနက် အမ်းငွေကို ကိုယ်တိုင် တွက်ခဲ့တာလေ။ ညနေတန်း မလိုဘဲ။', en: 'This morning you worked out the change yourself. No evening class needed.' },
    answers: ['given'], from: { my: 'မုန့်ဆိုင်မှာ ရခဲ့တာ', en: 'from the snack shop' }, onlyIf: 'd2.stopShop' },
  { id: 'askwhy', name: { my: 'ဘာကြောင့်လဲ မေးကြည့်', en: 'Ask why' },
    line: { my: 'အလွတ်ရွတ်မယ့်အစား ရပ်ပြီး "ဘာကြောင့်လဲ" လို့ မေးကြည့်ရအောင်။', en: 'Instead of reciting, let\'s stop and ask "why?"' },
    answers: ['unknown'], from: { my: 'မီးတိုင်နဲ့ ပဲပုံးမှာ ရခဲ့တာ', en: 'from the lamp and the bean box' }, onlyIf: 'd2.stopLamp' },
  { id: 'want', name: { my: 'ဆရာမ လိုချင်တာ', en: 'What your teacher wants' },
    line: { my: 'ဆရာမက အမှတ်ထက် မင်းနားလည်တာကို ပိုသိချင်တယ်တဲ့။ သူကိုယ်တိုင် ပြောတာ။', en: 'Your teacher would rather know you understand than see the marks. She said so herself.' },
    answers: ['afraid'], from: { my: 'ဒေါ်နှင်းဝေ ပြောခဲ့တာ', en: 'from Daw Hnin Wai' }, onlyIf: 'd2.hwMet' },
  { id: 'once', name: { my: 'နောက်တစ်ခါ', en: 'Once more' }, companion: 'sheep', onlyIf: 'companion:sheep', // the Black Sheep's card (pencil until it has fitted three people)
    line: { my: 'မရသေးလည်း ရပါတယ်။ နောက်တစ်ခါ ထပ်မေး၊ ထပ်ကြည့်ရုံပဲ။', en: 'Not getting it yet is fine. Just ask again, look again.' },
    answers: ['given', 'afraid'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'recite', lookalike: true, name: { my: 'ထပ်ကျက်ပါဦး', en: 'Learn it by heart again' },
    line: { my: 'ကဗျာကို နောက်တစ်ခါ အလွတ်ကျက်လိုက်ပါဦး။', en: 'Learn the rhyme by heart once more.' },
    shows: ['given', 'unknown'], really: { my: 'အဓိပ္ပာယ်မပါဘဲ ပြန်ရွတ်ခိုင်းတာ', en: 'repeating words without the meaning' },
    backfire: { they: { my: '"ပဲစေ့လေး မြေထဲချ၊ ရေလေးလောင်း…" ရွတ်တတ်ပြီးသားပါဆို!', en: '"Drop the bean, water it…" I already KNOW it by heart!' },
                maya: { my: '(နောက်တစ်ခါဆိုတာ ကြိုးစားဖို့ပါ။ အဓိပ္ပာယ်မပါဘဲ ပြန်ရွတ်ဖို့ မဟုတ်ဘူး။)', en: "(Once more means trying again, not repeating words he doesn't understand.)" } } },
  { id: 'tell', lookalike: true, name: { my: 'အဖြေ ပြောပြမယ်', en: "I'll tell you the answer" },
    line: { my: 'ပဲပင်က ဘာလို့သေတာလဲ အစ်မ ပြောပြမယ်။ မှတ်ထားနော်။', en: "I'll tell you why the beans died. Remember it." },
    shows: ['unknown'], really: { my: 'သူ့ကိုယ်တိုင် တွေ့ရမယ့်ဟာကို ယူသွားတာ', en: 'taking away what he could find himself' },
    backfire: { they: { my: 'ဟုတ်ကဲ့… နောက်ထပ် အလွတ်ကျက်စရာ တစ်ကြောင်း တိုးလာပြန်ပြီ။', en: 'Okay… one more line to learn by heart.' },
                maya: { my: '(ကျွန်မ အဖြေပေးလိုက်တော့ သူ့စူးစမ်းချင်စိတ် ငြိမ်သွားတယ်။)', en: '(I gave the answer, and his curiosity went quiet.)' } } },
];

export const TALK_D2_TOETOE = {
  id: 'd2-toetoe',
  person: 'toetoe',
  with: ['hninwai'],
  noStepBack: true,
  steam: 1, calm: 4, turns: 7,
  hand: D2_TT_CARDS,
  tutorial: [
    { at: 'hand', my: 'သိုးမည်းလေးရဲ့ ကတ်က ခဲတံနဲ့ပဲ ရှိသေးတယ်။ လူသုံးယောက်နဲ့ တကယ်ကိုက်မှ ရွှေမင် ဖြစ်မယ်။', en: "The Black Sheep's card is still in pencil. Once it has truly fitted three people, it turns gold." },
  ],
  stones: [
    { lines: [
      { my: 'လမ်းလျှောက်တာက လမ်းလျှောက်တာပဲလေ။ တကယ့်စာက ညနေတန်းမှာ။ ကျွန်တော်တို့ မတတ်နိုင်ဘူး။', en: "A walk's just a walk. Real learning is at the evening class. We can't afford it.", need: 'given', seems: 'envy', face: 'sad', mood: 'down',
        tell: { my: 'ညနေတန်းသွားတဲ့ ကလေးတွေကို မနာလိုတာ မဟုတ်ဘူး။ သူ့ကိုယ်သူ လက်လျှော့နေတာ။ ပိုက်ဆံအိတ်ထဲက တစ်ရာကို ဆုပ်ထားတယ်။', en: "Not envy of the evening-class kids. He has given up on himself. He's holding the hundred he counted." } },
      { my: 'ကျွန်တော့်လို ကလေးက ဘယ်လိုမှ တော်လာမှာ မဟုတ်ဘူး။', en: 'A kid like me will never be clever.', need: 'given', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'ဒါပေမဲ့… စကားလုံးတိုင်း မှန်အောင် ရွတ်ခဲ့တာပဲ။ ဘာလို့ ပဲပင် သေရတာလဲ။ ဘာလို့ မရတာလဲ။', en: "But… I said every word right. Why did they still die? Why didn't it work?", need: 'unknown', seems: 'hot', face: 'think',
        tell: { my: 'စိတ်တိုတာ မဟုတ်ဘူး။ ပဲပုံးကို ပြန်ပြန်ကြည့်နေတယ်။ တကယ် သိချင်နေတာ။', en: "He isn't cross. He keeps looking back at the box. He truly wants to know." } },
      { my: 'ကဗျာက မှန်ရင် ပဲပင်လည်း ပေါက်ရမှာပေါ့။', en: 'If the rhyme is right, the beans should grow.', need: 'unknown', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'ဆရာမ ဇယားမှာ ကျွန်တော့်ကြောင့် ကျောင်း အမှတ်ကျမှာ။', en: "Because of me the school will drop on Teacher's chart.", need: 'afraid', seems: 'hot', face: 'worried', steam: 1,
        tell: { my: 'ဇယားကို ဒေါသနဲ့ ကြည့်တာ မဟုတ်ဘူး။ ဆရာမ စိတ်ပျက်မှာကို ကြောက်နေတာ။', en: "He isn't glaring at the chart. He's afraid of letting his teacher down." } },
      { my: 'ဆရာမက ကျွန်တော့်ကို စာမတတ်တဲ့ကလေးလို့ ထင်နေမှာ။', en: "Teacher must think I'm the boy who can't learn.", need: 'afraid', seems: 'looksdown', face: 'sad',
        tell: { my: 'ဆရာမကို အထင်သေးတာ မဟုတ်ဘူး။ သူ့ကို ဘယ်လိုမြင်လဲ သိချင်ပြီး ကြောက်နေတာ။', en: "He doesn't look down on her. He's afraid of how she sees him." } },
    ] },
    { lines: [
      { my: 'အတန်းမရှိလည်း… ကျွန်တော် နေ့တိုင်း "ဘာကြောင့်လဲ" မေးရင် ရနိုင်မလား။', en: 'Even without the class… could I learn if I ask "why?" every day?', need: 'given', seems: 'unknown', face: 'think',
        tell: { my: 'အဖြေ မလိုတော့ဘူး။ ကိုယ့်ကိုယ်ကို ယုံကြည်ချင်နေတာ။ ဘောလုံးကို နေထဲမှာ ပြန်လှည့်နေတယ်။', en: "He doesn't need an answer. He wants to believe in himself. He's turning the ball in the sun again." } },
    ] },
  ],
  react: {
    miss: { my: '…ဟင်? နားမလည်ဘူး။', en: "…Huh? I don't get it." },
    hot: { my: '(တိုးတိုး ခေါင်းငုံ့ပြီး ကဗျာကို တိုးတိုးလေး ရွတ်နေတယ်။ ဘာမှ မကြားဘူး။)', en: '(Toe Toe looks down, muttering the rhyme. Nothing gets through.)' },
  },
  decision: [
    { my: 'ပဲတွေ နေရောင်ရတဲ့နေရာမှာ ပြန်စိုက်မယ်။ မပေါက်ရင် "ဘာကြောင့်လဲ" ထပ်မေးမယ်။', en: "I'll plant the beans again where the sun reaches. If they don't come up, I'll ask why again.", face: 'happy' },
    { my: 'မနက်တိုင်း ဆရာမဆီ မေးခွန်း တစ်ခုစီ ယူသွားမယ်။ ကျွန်တော့်ဟာ ကျွန်တော် တွေ့တဲ့ မေးခွန်း။', en: "Every morning I'll take Teacher one question. One I found myself.", face: 'happy' },
  ],
};

export const D2_OHN_CARDS = [
  { id: 'same', name: { my: 'နည်းတူ၊ လက်မတူ', en: 'Same way, different hands' },
    line: { my: 'ဆရာ့နည်းက ဒေါ်ဒေါ့်လက်နဲ့ ကိုက်ခဲ့တာ။ မိချိုရဲ့လက်က တခြားလက်လေ။', en: "Your master's way fitted your hands. Mi Cho's are different hands." },
    answers: ['cling'], from: { my: 'စင်နှစ်ခုကို ကြည့်ပြီး ရခဲ့တာ', en: 'from looking at both shelves' }, onlyIf: 'd2.looked' },
  { id: 'thanks', name: { my: 'ကျေးဇူးက မပျက်ဘူး', en: 'The thanks stay' },
    line: { my: 'ဆရာ့နည်းက ဒေါ်ဒေါ့်အတွက် မှန်ခဲ့တာပဲ။ တခြားနည်းနဲ့ သင်ပေးလည်း ဆရာ့ကျေးဇူးက မပျက်ပါဘူး။', en: "His way was right for you. Teaching her another way doesn't undo what you owe him." },
    answers: ['afraid'], from: { my: 'ပန်းကုံးတင်ထားတဲ့ ဘီး', en: 'from the wheel with the jasmine' }, onlyIf: 'd2.look.masterWheel' },
  { id: 'trial', name: { my: 'တစ်ရက် စမ်းကြည့်', en: "One day's trial" },
    line: { my: 'တစ်ရက်လောက် မိချိုကို ကိုယ့်လက်နဲ့ကိုက်တဲ့ အရေအတွက် ရွေးခွင့်ပေးကြည့်ပါလား။', en: 'Why not let Mi Cho choose a load that fits her hands, just for one day?' },
    answers: ['unknown'], from: { my: 'မိချို ပြောခဲ့တာ', en: 'from Mi Cho' }, onlyIf: 'd2.mcMet' },
  { id: 'once', name: { my: 'နောက်တစ်ခါ', en: 'Once more' }, companion: 'sheep', onlyIf: 'companion:sheep', // the Black Sheep
    line: { my: 'မိချိုကို နောက်တစ်ခါ အခွင့်ပေးကြည့်ပါ။ ဒေါ်ဒေါ်လည်း အခွင့်တွေ ရခဲ့ဖူးမှာပဲ။', en: 'Give Mi Cho one more chance. You must have been given a few.' },
    answers: ['given', 'afraid'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'wrongway', lookalike: true, name: { my: 'ဒီနည်း မှားတယ်', en: 'Your way is wrong' },
    line: { my: 'တစ်နေ့ ဆယ့်နှစ်လုံးဆိုတာ မှားတဲ့နည်းပါ။', en: 'Twelve a day is simply the wrong way.' },
    shows: ['cling'], really: { my: 'သူ့ဆရာကို အပြစ်ရှာတာ', en: 'finding fault with her master' },
    backfire: { they: { my: 'မှားတယ်? ကျွန်မ စင်ကို ကြည့်စမ်း! ဆရာ့ကို ဒီလို မပြောနဲ့!', en: "Wrong? Look at my shelf! Don't talk about my master like that!" },
                maya: { my: '(သူ့အတွက် မှန်ခဲ့တာကို မှားတယ် ပြောလိုက်မိပြီ။)', en: '(I called wrong what was right for her.)' } } },
  { id: 'doit', lookalike: true, name: { my: 'ကျွန်မ သင်ပေးမယ်', en: "I'll teach her myself" },
    line: { my: 'မိချိုကို ကျွန်မ ကိုယ်တိုင် သင်ပေးလိုက်မယ်လေ။', en: "I'll just teach Mi Cho myself." },
    shows: ['unknown', 'given'], really: { my: 'ကူညီသလို အထင်သေးတာ', en: 'looking down that passes for help' },
    backfire: { they: { my: 'အိုး တစ်လုံးမှ မလုပ်ဖူးဘဲ ကျွန်မ တပည့်ကို သင်မယ်?', en: "You've never made a pot and you'll teach MY apprentice?" },
                maya: { my: '(ကူညီမယ်ဆိုပြီး သူ့နေရာကို ယူလိုက်မိပြီ။)', en: '(Meaning to help, I tried to take her place.)' } } },
];

export const TALK_D2_DAWOHN = {
  id: 'd2-dawohn',
  person: 'dawohn',
  with: ['micho'],
  noStepBack: true,
  steam: 2, calm: 4, turns: 7, // day2.js adds +1 steam if Maya picked "I can show you this way is wrong" (6.2)
  hand: D2_OHN_CARDS,
  stones: [
    { lines: [
      { my: 'ကျွန်မဆရာက ပထမအပတ်ကတည်းက တစ်နေ့ ဆယ့်နှစ်လုံး ခိုင်းတာ။ ကျွန်မ စင်ကို ကြည့်။', en: 'My master gave me twelve a day from the first week. Look at my shelf.', need: 'cling', seems: 'looksdown', face: 'think',
        tell: { my: 'မိချိုကို အထင်သေးတာ မဟုတ်ဘူး။ ပန်းကုံးတင်ထားတဲ့ ဘီးကို လက်နဲ့ ထိနေတယ်။ သူ့ကို လူဖြစ်စေခဲ့တဲ့ နည်းကို ဆုပ်ကိုင်ထားတာ။', en: "She isn't looking down on Mi Cho. Her hand rests on the jasmine wheel. She's holding on to the way that made her." } },
      { my: 'အိုးကောင်းရဖို့ နာနာပုတ်ရတယ်။ ဒါ ဆရာ့စကား။', en: '"A good pot takes a hard beating." My master\'s words.', need: 'cling', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'တချို့လက်က ရွှံ့အတွက် မွေးလာတာ။ ကျွန်မလက်လိုပေါ့။ သူ့လက်က မဟုတ်ဘူး။ မြေဖြူနဲ့ ရေးထားလိုက်တာ မမျှော်လင့်တော့အောင်။', en: "Some hands are born for clay, like mine. Hers aren't. I chalked it so she'd stop hoping.", need: 'given', seems: 'looksdown', face: 'hot', steam: 1,
        tell: { my: 'မိချိုရဲ့ ပထမဆုံးအိုးလေးကို ကိုယ့်စင်ပေါ်မှာ သိမ်းထားသေးတယ်။ မျှော်လင့်ချက် မကုန်သေးဘူး။ ပင်ပန်းပြီး လက်လျှော့လိုက်တာ။', en: "Mi Cho's very first pot still sits on her own shelf. She hasn't stopped hoping; she's tired, and gave up." } },
    ] },
    { lines: [
      { my: 'တခြားနည်းနဲ့ သင်ရင်… ကျွန်မဆရာ မှားတယ်လို့ ပြောသလို ဖြစ်မှာပေါ့။', en: "If I teach her another way… it's like saying my master was wrong.", need: 'afraid', seems: 'hot', face: 'worried', heard: true,
        tell: { my: 'ဒေါသ မဟုတ်ဘူး။ ကျေးဇူးမသိတတ်သလို ဖြစ်မှာ ကြောက်နေတာ။', en: "Not anger. She's afraid of seeming ungrateful." } },
      { my: 'သူ မရှိတော့ပေမဲ့ ကျွန်မ လက်ထဲမှာ သူ့နည်း ရှိနေတယ်။', en: "He's long gone from this yard, but his way is still in my hands.", need: 'afraid', seems: 'cling', face: 'sad' },
    ] },
    { lines: [
      { my: 'ပြီးတော့… တခြားနည်း ကျွန်မ မသိဘူး။ မိချိုက ကျွန်မရဲ့ ပထမဆုံး တပည့်။', en: "And… I don't know any other way. Mi Cho is the first pupil I've ever had.", need: 'unknown', seems: 'given', face: 'think',
        tell: { my: 'လက်လျှော့တာ မဟုတ်ဘူး။ ဆရာလုပ်ရတာ သူ့အတွက်လည်း အသစ်ပဲ။', en: 'Not giving up. Teaching is new for her too.' } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါက ရွှံ့နဲ့ မဆိုင်ဘူး သမီး။', en: '…That has nothing to do with clay, dear.' },
    hot: { my: '(ဒေါ်အုန်း ရွှံ့ကို ဆောင့်နယ်နေတယ်။ ဘာမှ မကြားဘူး။)', en: '(Daw Ohn is pounding the clay. Nothing gets through.)' },
  },
  decision: [
    { my: 'မင်း မှန်တယ်လို့ မပြောသေးဘူးနော်။ တစ်ရက်ပဲ။ မိချို ကိုယ့်အရေအတွက် ကိုယ်ရွေး။', en: "I'm not saying you're right. One day. Mi Cho chooses her own load.", face: 'think' },
    { my: 'မနက်ဖြန် အိုးဖို ဖွင့်မယ်။ အဲဒီကျမှ ကြည့်ကြတာပေါ့။', en: "Tomorrow we open the kiln. Then we'll see.", face: 'think' },
  ],
};
