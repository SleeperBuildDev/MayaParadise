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
  { id: 'counted', name: { my: 'မင်း တွက်တတ်ခဲ့သားပဲ', en: 'You worked it out' },
    line: { my: 'ဒီမနက် ပြန်အမ်းငွေကို မင်းဘာသာ တွက်နိုင်ခဲ့တာပဲ။ ညနေကျူရှင် တက်စရာတောင် မလိုပါဘူး။', en: 'This morning you worked out the change yourself. No evening class needed.' },
    answers: ['given'], from: { my: 'မုန့်ဆိုင်လေးဆီက', en: 'from the snack shop' }, onlyIf: 'd2.stopShop' },
  { id: 'askwhy', name: { my: 'ဘာလို့လဲလို့ မေးကြည့်', en: 'Ask why' },
    line: { my: 'အလွတ်ရွတ်နေမယ့်အစား ခဏရပ်ပြီး "ဘာလို့လဲ" လို့ မေးကြည့်ရအောင်။', en: 'Instead of reciting, let\'s stop and ask "why?"' },
    answers: ['unknown'], from: { my: 'မီးအိမ်နဲ့ ပဲစေ့ဗူးလေးဆီက', en: 'from the lamp and the bean box' }, onlyIf: 'd2.stopLamp' },
  { id: 'want', name: { my: 'ဆရာမ လိုချင်တာ', en: 'What your teacher wants' },
    line: { my: 'မင်းရဲ့ ဆရာမက အမှတ်တွေထက် မင်း တကယ်နားလည်တာကိုပဲ ပိုသိချင်တာ။ သူကိုယ်တိုင် ပြောခဲ့တာပဲလေ။', en: 'Your teacher would rather know you understand than see the marks. She said so herself.' },
    answers: ['afraid'], from: { my: 'ဒေါ်နှင်းဝေဆီက', en: 'from Daw Hnin Wai' }, onlyIf: 'd2.hwMet' },
  { id: 'once', name: { my: 'နောက်တစ်ခေါက်', en: 'Once more' }, companion: 'sheep', onlyIf: 'companion:sheep', // the Black Sheep's card (pencil until it has fitted three people)
    line: { my: 'အခု မရသေးလည်း ကိစ္စမရှိဘူး။ ထပ်မေးကြည့်၊ ထပ်ကြည့်လိုက်ရုံပဲ။', en: 'Not getting it yet is fine. Just ask again, look again.' },
    answers: ['given', 'afraid'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'recite', lookalike: true, name: { my: 'အလွတ်ပြန်ကျက်လိုက်', en: 'Learn it by heart again' },
    line: { my: 'ကဗျာကို နောက်တစ်ခေါက် အလွတ်ပြန်ကျက်လိုက်။', en: 'Learn the rhyme by heart once more.' },
    shows: ['given', 'unknown'], really: { my: 'အဓိပ္ပာယ်မသိဘဲ စာတွေ ထပ်ရွတ်နေတာ', en: 'repeating words without the meaning' },
    backfire: { they: { my: '"ပဲစေ့လေးချ၊ ရေလောင်းကြ…" အဲဒါ ကျွန်တော် အလွတ်ရပြီးသားဗျ။', en: '"Drop the bean, water it…" I already KNOW it by heart!' },
                maya: { my: '(နောက်တစ်ခေါက်ဆိုတာ ထပ်စမ်းကြည့်ခိုင်းတာ၊ နားမလည်တဲ့ စကားလုံးတွေ ပြန်ရွတ်ခိုင်းတာ မဟုတ်ဘူး။)', en: "(Once more means trying again, not repeating words he doesn't understand.)" } } },
  { id: 'tell', lookalike: true, name: { my: 'အဖြေ ပြောပြမယ်', en: "I'll tell you the answer" },
    line: { my: 'ပဲပင်တွေ ဘာလို့ သေသွားလဲ ပြောပြမယ်။ မှတ်ထားနော်။', en: "I'll tell you why the beans died. Remember it." },
    shows: ['unknown'], really: { my: 'သူ့ဘာသာ ရှာတွေ့နိုင်တာကို ယူပစ်လိုက်တာ', en: 'taking away what he could find himself' },
    backfire: { they: { my: 'ဟုတ်ကဲ့… အလွတ်ကျက်စရာ နောက်တစ်ကြောင်း ထပ်တိုးပြီပေါ့။', en: 'Okay… one more line to learn by heart.' },
                maya: { my: '(အဖြေ ပြောပြလိုက်တော့ သူ့ရဲ့ စူးစမ်းချင်စိတ်လေး ငြိမ်ကျသွားတယ်။)', en: '(I gave the answer, and his curiosity went quiet.)' } } },
];

export const TALK_D2_TOETOE = {
  id: 'd2-toetoe',
  person: 'toetoe',
  with: ['hninwai'],
  noStepBack: true,
  steam: 1, calm: 4, turns: 7,
  hand: D2_TT_CARDS,
  tutorial: [
    { at: 'hand', my: 'သိုးမည်းလေး ကတ်ပြားက ခဲတံရာပဲ ရှိသေးတယ်။ လူသုံးယောက်နဲ့ တကယ် အံဝင်ခွင်ကျ ဖြစ်သွားရင် ရွှေရောင် ပြောင်းသွားလိမ့်မယ်။', en: "The Black Sheep's card is still in pencil. Once it has truly fitted three people, it turns gold." },
  ],
  stones: [
    { lines: [
      { my: 'လမ်းလျှောက်တာက လမ်းလျှောက်တာ သက်သက်ပဲ။ တကယ့် ပညာက ညနေကျူရှင်မှာ သင်တာ။ ကျွန်တော်တို့က မတတ်နိုင်ဘူးလေ။', en: "A walk's just a walk. Real learning is at the evening class. We can't afford it.", need: 'given', seems: 'envy', face: 'sad', mood: 'down',
        tell: { my: 'ညနေကျူရှင် တက်ရတဲ့ ကလေးတွေကို မနာလို ဖြစ်နေတာ မဟုတ်ဘူး။ သူ့ကိုယ်သူ လက်လျှော့ထားတာ။ သူ ရေတွက်ထားတဲ့ တစ်ရာတန်လေးကို ကိုင်ထားတယ်။', en: "Not envy of the evening-class kids. He has given up on himself. He's holding the hundred he counted." } },
      { my: 'ကျွန်တော့်လို ကလေးက ဘယ်တော့မှ ဉာဏ်ကောင်းလာမှာ မဟုတ်ပါဘူး။', en: 'A kid like me will never be clever.', need: 'given', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'ဒါပေမဲ့… ကျွန်တော် တစ်လုံးမကျန် မှန်အောင် ရွတ်ခဲ့တာပဲ။ ဘာလို့ သေသွားတာလဲ။ ဘာလို့ အလုပ်မဖြစ်တာလဲ။', en: "But… I said every word right. Why did they still die? Why didn't it work?", need: 'unknown', seems: 'hot', face: 'think',
        tell: { my: 'သူ စိတ်တိုနေတာ မဟုတ်ဘူး။ ပဲစေ့ဗူးလေးကိုပဲ ပြန်ပြန်ကြည့်နေတယ်။ တကယ် သိချင်နေတာ။', en: "He isn't cross. He keeps looking back at the box. He truly wants to know." } },
      { my: 'ကဗျာက မှန်နေရင် ပဲပင်တွေ ပေါက်ရမှာပေါ့။', en: 'If the rhyme is right, the beans should grow.', need: 'unknown', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'ကျွန်တော့်ကြောင့် ဆရာမရဲ့ ဇယားမှာ ကျောင်းအဆင့် ကျသွားတော့မယ်။', en: "Because of me the school will drop on Teacher's chart.", need: 'afraid', seems: 'hot', face: 'worried', steam: 1,
        tell: { my: 'ဇယားကို စိုက်ကြည့်နေတာ မဟုတ်ဘူး။ ဆရာမ စိတ်ပျက်သွားမှာကို ကြောက်နေတာ။', en: "He isn't glaring at the chart. He's afraid of letting his teacher down." } },
      { my: 'ဆရာမကတော့ ကျွန်တော့်ကို စာမလိုက်နိုင်တဲ့ ကောင်လေးလို့ပဲ ထင်နေမှာ။', en: "Teacher must think I'm the boy who can't learn.", need: 'afraid', seems: 'looksdown', face: 'sad',
        tell: { my: 'ဆရာမကို အထင်သေးတာ မဟုတ်ဘူး။ ဆရာမ သူ့ကို ဘယ်လိုမြင်မလဲ ဆိုတာကို ကြောက်နေတာ။', en: "He doesn't look down on her. He's afraid of how she sees him." } },
    ] },
    { lines: [
      { my: 'ကျူရှင် မတက်နိုင်လည်း… နေ့တိုင်း "ဘာလို့လဲ" လို့ မေးနေရင် ကျွန်တော် တတ်လာနိုင်မလားဟင်။', en: 'Even without the class… could I learn if I ask "why?" every day?', need: 'given', seems: 'unknown', face: 'think',
        tell: { my: 'သူ အဖြေ လိုချင်တာ မဟုတ်ဘူး။ သူ့ကိုယ်သူ ယုံကြည်ချင်နေတာ။ နေရောင်ထဲမှာ ဘောလုံးလေးကို ပြန်လှည့်နေပြန်ပြီ။', en: "He doesn't need an answer. He wants to believe in himself. He's turning the ball in the sun again." } },
    ] },
  ],
  react: {
    miss: { my: '…ဟင်? ကျွန်တော် နားမလည်ဘူး။', en: "…Huh? I don't get it." },
    hot: { my: '(တိုးတိုး ခေါင်းငုံ့ပြီး ကဗျာကိုပဲ တတွတ်တွတ် ရွတ်နေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(Toe Toe looks down, muttering the rhyme. Nothing gets through.)' },
  },
  decision: [
    { my: 'နေရောင်ရတဲ့ နေရာမှာ ပဲစေ့တွေ ပြန်စိုက်ကြည့်မယ်။ မပေါက်လာရင် ဘာလို့လဲလို့ ထပ်မေးမယ်။', en: "I'll plant the beans again where the sun reaches. If they don't come up, I'll ask why again.", face: 'happy' },
    { my: 'မနက်တိုင်း ဆရာမဆီ မေးခွန်းတစ်ခု ယူသွားမယ်။ ကျွန်တော့်ဘာသာ ရှာတွေ့တဲ့ မေးခွန်းလေး။', en: "Every morning I'll take Teacher one question. One I found myself.", face: 'happy' },
  ],
};

export const D2_OHN_CARDS = [
  { id: 'same', name: { my: 'နည်းတူပေမဲ့ လက်မတူဘူး', en: 'Same way, different hands' },
    line: { my: 'ရှင့်ဆရာရဲ့ နည်းလမ်းက ရှင့်လက်နဲ့ အံကိုက်ဖြစ်ခဲ့တာ။ မိချိုရဲ့ လက်တွေက မတူဘူးလေ။', en: "Your master's way fitted your hands. Mi Cho's are different hands." },
    answers: ['cling'], from: { my: 'စင်နှစ်ခုလုံးကို ကြည့်မိရာက', en: 'from looking at both shelves' }, onlyIf: 'd2.looked' },
  { id: 'thanks', name: { my: 'ကျေးဇူးတရားက ရှိနေဆဲပါ', en: 'The thanks stay' },
    line: { my: 'သူ့နည်းလမ်းက ရှင့်အတွက် မှန်ခဲ့တယ်။ မိချိုကို တခြားနည်းနဲ့ သင်ပေးလိုက်လို့ ဆရာ့ကျေးဇူး ပျက်ပြယ်မသွားပါဘူး။', en: "His way was right for you. Teaching her another way doesn't undo what you owe him." },
    answers: ['afraid'], from: { my: 'စံပယ်ပန်းတင်ထားတဲ့ အိုးထိန်းစက်ဆီက', en: 'from the wheel with the jasmine' }, onlyIf: 'd2.look.masterWheel' },
  { id: 'trial', name: { my: 'တစ်ရက်လောက် စမ်းကြည့်ပါလား', en: "One day's trial" },
    line: { my: 'တစ်ရက်တည်းပါပဲ၊ မိချိုကို သူ့လက်နိုင်သလောက် ပမာဏလေး ရွေးခိုင်းကြည့်ပါလား။', en: 'Why not let Mi Cho choose a load that fits her hands, just for one day?' },
    answers: ['unknown'], from: { my: 'မိချိုဆီက', en: 'from Mi Cho' }, onlyIf: 'd2.mcMet' },
  { id: 'once', name: { my: 'နောက်တစ်ခေါက်', en: 'Once more' }, companion: 'sheep', onlyIf: 'companion:sheep', // the Black Sheep
    line: { my: 'မိချိုကို နောက်တစ်ခေါက် အခွင့်အရေး ပေးလိုက်ပါ။ ရှင်လည်း အခွင့်အရေးတွေ အများကြီး ရခဲ့ဖူးမှာပဲ။', en: 'Give Mi Cho one more chance. You must have been given a few.' },
    answers: ['given', 'afraid'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'wrongway', lookalike: true, name: { my: 'ရှင့်နည်းလမ်းက မှားနေတယ်', en: 'Your way is wrong' },
    line: { my: 'တစ်နေ့ ဆယ့်နှစ်လုံးဆိုတာ မှားနေတဲ့ နည်းလမ်းပဲ။', en: 'Twelve a day is simply the wrong way.' },
    shows: ['cling'], really: { my: 'သူ့ဆရာကို အပြစ်တင်မိတာ', en: 'finding fault with her master' },
    backfire: { they: { my: 'မှားတယ် ဟုတ်လား။ ငါ့စင်ကို ကြည့်စမ်း။ ငါ့ဆရာအကြောင်း အဲဒီလို လာမပြောနဲ့။', en: "Wrong? Look at my shelf! Don't talk about my master like that!" },
                maya: { my: '(သူ့အတွက် မှန်ကန်ခဲ့တာကို ငါက မှားတယ်လို့ ပြောမိပြီ။)', en: '(I called wrong what was right for her.)' } } },
  { id: 'doit', lookalike: true, name: { my: 'ကျွန်မကိုယ်တိုင် သင်ပေးမယ်', en: "I'll teach her myself" },
    line: { my: 'မိချိုကို ကျွန်မကိုယ်တိုင်ပဲ သင်ပေးလိုက်တော့မယ်။', en: "I'll just teach Mi Cho myself." },
    shows: ['unknown', 'given'], really: { my: 'ကူညီသလိုလိုနဲ့ အထင်သေးမိတာ', en: 'looking down that passes for help' },
    backfire: { they: { my: 'အိုးတစ်လုံးတောင် မလုပ်ဖူးဘဲ ငါ့တပည့်ကို နင်က သင်ပေးမယ် ဟုတ်လား။', en: "You've never made a pot and you'll teach MY apprentice?" },
                maya: { my: '(ကူညီချင်စိတ်နဲ့ သူ့နေရာကို ဝင်ယူဖို့ ကြိုးစားမိတယ်။)', en: '(Meaning to help, I tried to take her place.)' } } },
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
      { my: 'ငါ့ဆရာက ပထမအပတ်ကတည်းက တစ်နေ့ ဆယ့်နှစ်လုံး လုပ်ခိုင်းတာ။ ငါ့စင်ကို ကြည့်။', en: 'My master gave me twelve a day from the first week. Look at my shelf.', need: 'cling', seems: 'looksdown', face: 'think',
        tell: { my: 'သူ မိချိုကို အထင်သေးတာ မဟုတ်ဘူး။ စံပယ်ပန်းတင်ထားတဲ့ အိုးထိန်းစက်ပေါ် လက်တင်ထားတယ်။ သူ့ကို လူဖြစ်စေခဲ့တဲ့ နည်းလမ်းကို ဖက်တွယ်ထားတာ။', en: "She isn't looking down on Mi Cho. Her hand rests on the jasmine wheel. She's holding on to the way that made her." } },
      { my: '"အိုးကောင်းတစ်လုံး ဖြစ်ဖို့ ပြင်းပြင်းထန်ထန် အရိုက်ခံရတယ်။" ငါ့ဆရာ ပြောခဲ့တဲ့ စကား။', en: '"A good pot takes a hard beating." My master\'s words.', need: 'cling', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'တချို့လက်တွေက ငါ့လို ရွှံ့စေးအတွက် မွေးဖွားလာတာ။ သူ့လက်က မဟုတ်ဘူး။ ဆက်မမျှော်လင့်တော့အောင် ငါ ခြစ်ချလိုက်တာ။', en: "Some hands are born for clay, like mine. Hers aren't. I chalked it so she'd stop hoping.", need: 'given', seems: 'looksdown', face: 'hot', steam: 1,
        tell: { my: 'မိချိုရဲ့ ပထမဆုံး အိုးလေးက သူ့စင်ပေါ်မှာ ရှိနေတုန်းပဲ။ မျှော်လင့်ချက် ကုန်သွားတာ မဟုတ်ဘူး၊ ပင်ပန်းပြီး လက်လျှော့လိုက်တာ။', en: "Mi Cho's very first pot still sits on her own shelf. She hasn't stopped hoping; she's tired, and gave up." } },
    ] },
    { lines: [
      { my: 'သူ့ကို တခြားနည်းနဲ့ သင်ပေးလိုက်ရင်… ငါ့ဆရာ မှားတယ်လို့ ပြောရာရောက်သွားမှာပေါ့။', en: "If I teach her another way… it's like saying my master was wrong.", need: 'afraid', seems: 'hot', face: 'worried', heard: true,
        tell: { my: 'ဒေါသထွက်နေတာ မဟုတ်ဘူး။ ကျေးဇူးကန်းသလို ဖြစ်သွားမှာကို ကြောက်နေတာ။', en: "Not anger. She's afraid of seeming ungrateful." } },
      { my: 'ဆရာ ဒီခြံဝင်းထဲက ထွက်သွားတာ ကြာပြီ ဆိုပေမဲ့ သူ့နည်းလမ်းက ငါ့လက်ထဲမှာ ရှိနေတုန်းပဲ။', en: "He's long gone from this yard, but his way is still in my hands.", need: 'afraid', seems: 'cling', face: 'sad' },
    ] },
    { lines: [
      { my: 'ပြီးတော့… ငါ တခြားနည်းလည်း မသိဘူး။ မိချိုက ငါ့ရဲ့ ပထမဆုံး တပည့်ပဲ။', en: "And… I don't know any other way. Mi Cho is the first pupil I've ever had.", need: 'unknown', seems: 'given', face: 'think',
        tell: { my: 'လက်လျှော့တာ မဟုတ်ဘူး။ စာသင်ပေးရတာ သူ့အတွက်လည်း အသစ်အဆန်း ဖြစ်နေတာ။', en: 'Not giving up. Teaching is new for her too.' } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါ ရွှံ့စေးနဲ့ ဘာမှ မဆိုင်ဘူး ကလေးရဲ့။', en: '…That has nothing to do with clay, dear.' },
    hot: { my: '(ဒေါ်အုန်း ရွှံ့စေးကိုပဲ ထုရိုက်နေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(Daw Ohn is pounding the clay. Nothing gets through.)' },
  },
  decision: [
    { my: 'နင် မှန်တယ်လို့ ပြောတာ မဟုတ်ဘူးနော်။ တစ်ရက်ပဲ။ မိချို သူ့ပမာဏ သူ့ဘာသာ ရွေးပါစေ။', en: "I'm not saying you're right. One day. Mi Cho chooses her own load.", face: 'think' },
    { my: 'မနက်ဖြန် မီးဖို ဖွင့်မယ်။ အဲဒီကျရင် ကြည့်ကြတာပေါ့။', en: "Tomorrow we open the kiln. Then we'll see.", face: 'think' },
  ],
};
