// Day 6's talk: Ko Thiha at the low table in his mother's house (sandahouse), over his rice and a cup of plain
// tea. Format: see the top of js/story/talk.js. Burmese lines are drafts for Maya to proofread.
//
// Chapter 8 (ဥပေက္ခာ, p51-54): his true needs are that he doesn't know he keeps two ways of treating people
// (the grudge everyone sees isn't there), that it galls him a rude man does well (envy, not anger), and that
// he has given up on the old man since the laugh. The last stone is his own question: only Listen moves it
// (`heard`). The Cool Cloud fits no line today (a true page that doesn't fit this person); the day script
// adds Maya's thought after it misses (day6.js, L.cloudMiss).
//
// Hand gates (talk.js prepare(), save.js testFlags): `count` once the run is ridden and written; `owndoing`
// only after the four Cane Jetty looks; `fish` / `seedling` / `cloud` only if that companion is out; the
// pencil look-alike `grudge` leaves the hand once rumour `grudge` has a proof slip.
// Checked against talk-rules.js (seeded): count fit → fish fit → Breathe → fish fit → Listen = won in 5 of 7.

export const D6_TH_CARDS = [
  { id: 'count', onlyIf: 'd6.rideSeen', name: { my: 'တစ်ယောက်ကလွဲရင် အားလုံးကိုပါပဲ', en: 'Everyone but one' },
    line: { my: 'ဒီတစ်ခေါက်မှာ မင်း အားလုံးကို "နေကောင်းကြရဲ့လား" လို့ လှမ်းနှုတ်ဆက်ခဲ့တယ်။ ကြိမ်ဆိပ်က အဘိုးကြီး တစ်ယောက်တည်းပဲ ဘာမှ မရလိုက်တာ။', en: 'On this run you called "keeping well!" to everyone. Only the old man on Cane Jetty got nothing.' },
    answers: ['unknown'], from: { my: 'ဖောင်ပေါ်ကနေ မြင်ခဲ့ရတာ', en: 'seen from the raft' } },
  { id: 'cloud', onlyIf: 'companion:cloud', companion: 'cloud', name: { my: 'တိမ်အေး', en: 'Cool Cloud' }, // ch 7's companion: fits nothing today
    line: { my: 'စေတနာဆိုတာ ပူလောင်မှု မရှိဘူး။ အေးအေးလေးပဲ ထားပါ။', en: "Goodwill doesn't burn. Keep it cool." },
    answers: ['hot'], from: { my: 'တိမ်အေး', en: 'the Cool Cloud' } },
  { id: 'ignore', lookalike: true, name: { my: 'ဂရုစိုက်မနေနဲ့တော့', en: 'Just Ignore Them' },
    line: { my: 'သူ့ကို စိတ်ထဲ ထားမနေနဲ့။ မရှိသလိုပဲ သဘောထားလိုက်။', en: "Don't mind him. Treat him as if he isn't there." },
    shows: ['hot'], really: { my: 'စိတ်အေးသလိုလိုနဲ့ အဖက်မလုပ်ဘဲ နေခိုင်းမိတာ', en: 'freezing someone out that passes for calm' },
    backfire: { they: { my: 'ကျွန်တော် အခုလည်း အဲဒီလိုပဲ လုပ်နေတာပဲ။ အဲဒါ မှန်တယ်ဆိုရင်… သူ့ကို ဆက်ကျော်သွားလိုက်မယ်။', en: "That's what I already do. If it's right… I'll keep skipping him." },
                maya: { my: '(မရှိသလို သဘောထားတာက စိတ်အေးတာ မဟုတ်ဘူး။ လူတွေကို ခွဲခြားဆက်ဆံနေတာပဲ။)', en: "(Treating him as if he isn't there isn't calm. It's two ways of treating people.)" } } },
  { id: 'fish', onlyIf: 'companion:fish', companion: 'fish', name: { my: 'ရေဆန်ငါး', en: 'Upstream Fish' }, // ch 2's companion, lifted off this morning
    line: { my: 'ရေစီးကြောင်းက မတရားဘူး။ ဘယ်လို ကူးခတ်မလဲ ဆိုတာက မင်းအပိုင်းပဲ။', en: "The stream isn't fair. How you swim it is yours." },
    answers: ['envy', 'given'], from: { my: 'ရေဆန်ငါး', en: 'the Upstream Fish' } },
  { id: 'owndoing', onlyIf: 'd6.looked', name: { my: 'သူ့အပိုင်းက သူ့အပိုင်းပဲ', en: 'His is his' },
    line: { my: 'သူ့ကြိမ်တွေ ရောင်းရတာ သူ ကြိုးစားထားလို့။ သူ့စကား ကြမ်းတမ်းတာက သူ့အပိုင်း။ မင်း လုပ်ရမှာက မင်းအပိုင်းပဲ။', en: 'His cane sells for the work he puts in. His sharp words are his. What you do is yours.' },
    answers: ['envy'], from: { my: 'ကြိမ်ဆိပ်ကို ကြည့်မိရာက', en: 'from looking at Cane Jetty' } },
  { id: 'seedling', onlyIf: 'companion:seedling', companion: 'seedling', name: { my: 'မဖြစ်သေးတဲ့ ပျိုးပင်လေး', en: 'Not-Yet Seedling' }, // ch 5's companion
    line: { my: 'မဖြစ်သေးတာပါ။', en: 'Not yet.' },
    answers: ['given'], from: { my: 'မဖြစ်သေးတဲ့ ပျိုးပင်လေး', en: 'the Not-Yet Seedling' } },
  { id: 'grudge', lookalike: true, pencil: true, rumour: 'grudge', name: { my: 'အငြိုးတွေ လွှတ်ချလိုက်ပါ', en: 'Let the grudge go' },
    line: { my: 'အငြိုးတွေ လွှတ်ချလိုက်ပါ။ ဒေါသဆိုတာ ကိုယ့်ကိုပဲ ပူလောင်စေတာ။', en: 'Let your grudge go. Anger only burns you.' },
    shows: ['hot'], really: { my: 'ဘယ်သူမှ မစစ်ဆေးထားတဲ့ ကောလာဟလကို ပြန်ပြောမိတာ', en: 'repeating a rumour nobody checked' },
    backfire: { they: { my: 'အငြိုး ဟုတ်လား။ ကျုပ်မှာ ဘာအငြိုးမှ မရှိဘူး။ ဘယ်သူ ပြောတာလဲ။', en: "A grudge? I haven't got any grudge! Who said that?" },
                maya: { my: '(ကိုယ်တိုင် မကြည့်ဘဲ အထမ်းသမားတွေ ပြောတာကို ပြန်ပြောမိပြီ။)', en: '(I repeated the porters without looking myself.)' } } },
];

export const TALK_D6_THIHA = {
  id: 'd6-thiha',
  person: 'kothiha',
  with: [], // draft 3: the talk is at home; Daw Sanda is at the scale
  steam: 0, calm: 4, turns: 7, // he is cool: steam starts at 0 (a look-alike can still heat him)
  noStepBack: true, // Days 1-7
  hand: D6_TH_CARDS,
  stones: [
    { lines: [
      { my: 'ဒေါသထွက်နေတာလား။ မထွက်ပါဘူး။ ကျုပ်အတွက်တော့ သူ မရှိသလိုပါပဲ။ ကြိမ်ခုတ်သမားတွေကို ပါဆယ်ပေးပြီး ပြန်လာတာပဲ။', en: "Angry? I'm not. For me he just doesn't exist. I hand the cutters their parcel and go.", need: 'unknown', seems: 'hot', face: 'smile',
        tell: { my: 'သူ့ခွက်ထဲက အငွေ့ မထွက်ဘူး၊ အသံကလည်း အေးအေးဆေးဆေးပဲ။ တကယ် ဒေါသမထွက်ပါဘူး။ သူ မမြင်သေးတာက သူ ချန်လှပ်ထားတဲ့ လူတစ်ယောက် အကြောင်းပဲ။', en: "No steam from his cup; his voice is level. He truly isn't angry. What he hasn't seen is the one person he leaves out." } },
      { my: 'လူတစ်ယောက်တည်း ဘာဖြစ်လဲ။ ကျန်တဲ့သူ အားလုံးကို နှုတ်ဆက်တာပဲလေ။', en: "What's one person? I greet all the rest.", need: 'unknown', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'လွန်ခဲ့တဲ့ ခုနစ်နှစ်၊ ဖောင်စထွက်တဲ့ ပထမဆုံးနေ့မှာ အမေ့ရဲ့ ပထမဆုံး ဖာထေးရာကို သူ လှောင်ရယ်ခဲ့တာ။ အခုတော့ သူ့ကြိမ်တွေက တစ်ဈေးလုံးမှာ အရောင်းရဆုံး ဖြစ်နေပြီ။', en: "Seven years back, the raft's first day, he laughed at mother's first patch. Now his cane sells best in the whole Market.", need: 'envy', seems: 'hot', face: 'think',
        tell: { my: 'သူ့မျက်လုံးက အဘိုးကြီးဆီ မရောက်ဘဲ အမြင့်ကြီး ပုံထားတဲ့ ကြိမ်ပုံတွေဆီ ရောက်နေတယ်။ ဒေါသထွက်တာ မဟုတ်ဘူး၊ ရိုင်းစိုင်းတဲ့သူက အဆင်ပြေနေတာကို မခံချင် ဖြစ်နေတာ။', en: 'His eyes go not to the old man but to the tall stacks of cane. Not anger: it galls him that a rude man does well.' } },
      { my: 'ရိုင်းတဲ့သူက အဆင်ပြေနေတာ။ မတရားဘူး။', en: "The rude one's the one doing well. It isn't fair.", need: 'envy', seems: 'looksdown', face: 'sad',
        tell: { my: 'အဘိုးကြီးကို အထင်သေးနေတာ မဟုတ်ဘူး။ "မတရားဘူး" ဆိုတာကိုပဲ ထပ်ခါထပ်ခါ ပြောနေတာ။', en: 'He doesn\'t look down on the old man. He keeps coming back to "it isn\'t fair".' } },
    ] },
    { lines: [
      { my: 'အဲဒါကြောင့် ကျုပ် သူ့ကို ဘာမှ မပေးတာ။ စကားတစ်ခွန်းတောင် မပြောဘူး။ အဲဒါ စိတ်အေးအေး ထားတာ မဟုတ်ဘူးလား။', en: "So I give him nothing. Not even a word. That's keeping cool, isn't it?", need: 'given', seems: 'own', face: 'think',
        tell: { my: 'စိတ်အေးတဲ့ ရွေးချယ်မှု မဟုတ်ဘူး။ လှောင်ရယ်ခံရတဲ့ နေ့ကတည်းက အဘိုးကြီးကို သူ လက်လျှော့ထားတာ။ ကြိမ်ဆိပ်နား ရောက်တိုင်း ဝါးလုံးကိုင်တဲ့ လက်က အမြဲ တင်းကျပ်သွားတယ်။', en: "Not a calm choice. Since the day of the laugh he's given up on the old man. Near Cane Jetty his grip on the pole always tightens." } },
      // lesson (audit): was "He'll never change.", which made the fix hang on the old man changing; the book's turn
      // is in her own two ways (p52-53), so the line now hangs his manners on the old man's, and the cards answer that
      { my: 'သူ ဘယ်တော့မှ ပြောင်းလဲမှာ မဟုတ်ဘူး။ အဲဒီတော့ ကျုပ်က ဘာလို့ ပြောင်းလဲရမှာလဲ။', en: "He'll never change. So why should I?", need: 'given', face: 'sad', mood: 'down',
        tell: { my: 'သူ့ရဲ့ အပြုအမူကို အဘိုးကြီးရဲ့ အပြုအမူပေါ်မှာ သွားချိတ်ထားတယ်။ ကိုယ်လုပ်တာ ကိုယ့်အပိုင်း ဆိုတာကို သူ မေ့နေတယ်။', en: "He's hung his own manners on the old man's. He forgets that what he does is his." } },
    ] },
    { lines: [
      { my: '…ဒါပေမဲ့ အားလုံးကိုကျ ကျုပ်က "နေကောင်းကြရဲ့လား" လို့ နှုတ်ဆက်ပြီး သူ့ကိုကျ ဘာမှ မပြောဘူး။ ကျုပ် ဘာလို့ နှစ်မျိုး ဖြစ်နေတာလဲ။', en: '…But everyone gets my "keeping well!" and he gets nothing. Why am I two ways?', need: 'own', face: 'think', heard: true,
        tell: { my: 'သူ အဖြေ လိုချင်တာ မဟုတ်ဘူး။ သူ့ကိုယ်သူ ပြန်မေးနေတာ။ နားထောင်ပေးရုံပဲ။', en: "He doesn't need an answer. He's asking himself. Just listen." } },
      { my: 'အားလုံးအပေါ် တစ်မျိုး၊ တစ်ယောက်တည်းအပေါ် တစ်မျိုး… အဲဒါ ကျုပ် မဟုတ်ဘူး။', en: "One way for everyone, another for one… that isn't me.", need: 'own', face: 'think', heard: true },
    ] },
  ],
  react: {
    miss: { my: '…ဟင်? အဲဒါ ကျုပ်ပုံစံနဲ့ မတူပါဘူး။', en: "…Hm? That doesn't sound like me." },
    hot: { my: '(ကိုသီဟ ထမင်းပန်းကန်ကို တွန်းဖယ်လိုက်ပြီး ကြမ်းပြင်ကို စိုက်ကြည့်နေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(Ko Thiha pushes his rice bowl away and stares at the floorboards. Nothing gets through.)' },
    lean: { my: 'ခင်ဗျား ပြောတဲ့အတိုင်းပဲ လုပ်ပါ့မယ်…', en: "I'll just do whatever you say…" },
  },
  decision: [
    { my: 'နောက်တစ်ခေါက်ကျရင် ကြိမ်ဆိပ်မှာ ရပ်ပြီး အားလုံးကို နှုတ်ဆက်သလိုပဲ သူ့ကိုလည်း "နေကောင်းရဲ့လား" လို့ နှုတ်ဆက်လိုက်မယ်။', en: 'Next run I\'ll stop at Cane Jetty and say "keeping well!" to him, same as to everyone.', face: 'think' },
    { my: 'သူ ဘာပဲ ပြန်ပြောပြော… အဲဒါ သူ့အပိုင်းပဲ။', en: "Whatever he says back… that's his.", face: 'smile' },
  ],
};
