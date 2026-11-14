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
  { id: 'count', onlyIf: 'd6.rideSeen', name: { my: 'လူတိုင်း၊ တစ်ယောက်မှလွဲ', en: 'Everyone but one' },
    line: { my: 'ဒီခေါက်မှာ လူတိုင်းကို "နေကောင်းလား" အော်တယ်နော်။ ကြိမ်ဆိပ်က အဘိုးကြီး တစ်ယောက်ပဲ ဘာမှ မရဘူး။', en: 'On this run you called "keeping well!" to everyone. Only the old man on Cane Jetty got nothing.' },
    answers: ['unknown'], from: { my: 'ဖောင်ပေါ်ကနေ ကိုယ်တိုင် မြင်ခဲ့တာ', en: 'seen from the raft' } },
  { id: 'cloud', onlyIf: 'companion:cloud', companion: 'cloud', name: { my: 'တိမ်အေး', en: 'Cool Cloud' }, // ch 7's companion: fits nothing today
    line: { my: 'ကောင်းစေချင်တဲ့စိတ်က ပူမလောင်ဘူး။ အေးအေးဆေးဆေး ထားလိုက်။', en: "Goodwill doesn't burn. Keep it cool." },
    answers: ['hot'], from: { my: 'တိမ်အေးလေး', en: 'the Cool Cloud' } },
  { id: 'ignore', lookalike: true, name: { my: 'ဂရုမစိုက်နဲ့', en: 'Just Ignore Them' },
    line: { my: 'ဂရုမစိုက်နဲ့။ သူ့ကို မရှိတဲ့လူလိုပဲ သဘောထားလိုက်။', en: "Don't mind him. Treat him as if he isn't there." },
    shows: ['hot'], really: { my: 'အေးဆေးသလိုနဲ့ လူကို ပယ်ထားတာ', en: 'freezing someone out that passes for calm' },
    backfire: { they: { my: 'အဲဒါ ကျွန်တော် လုပ်နေတာပဲလေ။ မှန်တယ်ဆိုရင်… ဆက်ကျော်မယ်။', en: "That's what I already do. If it's right… I'll keep skipping him." },
                maya: { my: '(မရှိတဲ့လူလို ဆက်ဆံတာ အေးဆေးတာ မဟုတ်ဘူး။ ဆက်ဆံပုံ နှစ်မျိုး ဖြစ်သွားတာ။)', en: "(Treating him as if he isn't there isn't calm. It's two ways of treating people.)" } } },
  { id: 'fish', onlyIf: 'companion:fish', companion: 'fish', name: { my: 'ရေဆန်ငါး', en: 'Upstream Fish' }, // ch 2's companion, lifted off this morning
    line: { my: 'ရေစီးက မမျှတဘူး။ ဘယ်လို ကူးမလဲကတော့ ကိုယ့်ဟာ။', en: "The stream isn't fair. How you swim it is yours." },
    answers: ['envy', 'given'], from: { my: 'ရေဆန်ငါးလေး', en: 'the Upstream Fish' } },
  { id: 'owndoing', onlyIf: 'd6.looked', name: { my: 'သူ့ဟာ သူ့ဟာ', en: 'His is his' },
    line: { my: 'သူ့ကြိမ် ရောင်းကောင်းတာ သူ လုပ်ထားလို့။ စကားထက်တာက သူ့ဟာ။ ကိုယ်လုပ်တာကတော့ ကိုယ့်ဟာ။', en: 'His cane sells for the work he puts in. His sharp words are his. What you do is yours.' },
    answers: ['envy'], from: { my: 'ကြိမ်ဆိပ်ကို ကိုယ်တိုင် ကြည့်ခဲ့တာ', en: 'from looking at Cane Jetty' } },
  { id: 'seedling', onlyIf: 'companion:seedling', companion: 'seedling', name: { my: 'မရသေးပျိုးပင်', en: 'Not-Yet Seedling' }, // ch 5's companion
    line: { my: 'မရသေးဘူး။', en: 'Not yet.' },
    answers: ['given'], from: { my: 'မရသေးပျိုးပင်လေး', en: 'the Not-Yet Seedling' } },
  { id: 'grudge', lookalike: true, pencil: true, rumour: 'grudge', name: { my: 'အငြိုး ဖြေလိုက်', en: 'Let the grudge go' },
    line: { my: 'အငြိုးတွေ ဖြေလိုက်ပါ။ ဒေါသက ကိုယ့်ကိုပဲ ပူစေတာ။', en: 'Let your grudge go. Anger only burns you.' },
    shows: ['hot'], really: { my: 'မစစ်ရသေးတဲ့ ကောလာဟလကို ပြန်ပြောတာ', en: 'repeating a rumour nobody checked' },
    backfire: { they: { my: 'အငြိုး? ကျွန်တော် ဘာအငြိုးမှ မရှိဘူး! ဘယ်သူ ပြောတာလဲ။', en: "A grudge? I haven't got any grudge! Who said that?" },
                maya: { my: '(အထမ်းသမားတွေ ပြောတာကို ကိုယ်တိုင် မကြည့်ဘဲ ပြန်ပြောမိပြီ။)', en: '(I repeated the porters without looking myself.)' } } },
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
      { my: 'ဒေါသ? မထွက်ပါဘူး။ သူ ကျွန်တော့်အတွက် မရှိတဲ့လူပဲ။ ကြိမ်ခုတ်သမားတွေကို အထုပ်ပေးပြီး ထွက်လာရုံပဲ။', en: "Angry? I'm not. For me he just doesn't exist. I hand the cutters their parcel and go.", need: 'unknown', seems: 'hot', face: 'smile',
        tell: { my: 'ခွက်က ငွေ့ မထွက်ဘူး။ အသံ ငြိမ်တယ်။ တကယ် ဒေါသ မရှိဘူး။ မမြင်သေးတာက လူတစ်ယောက်ကို ချန်ထားတာ။', en: "No steam from his cup; his voice is level. He truly isn't angry. What he hasn't seen is the one person he leaves out." } },
      { my: 'တစ်ယောက် ကျော်တာ ဘာဖြစ်လဲ။ ကျန်တဲ့သူ အကုန် နှုတ်ဆက်တာပဲ။', en: "What's one person? I greet all the rest.", need: 'unknown', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'ခုနစ်နှစ်လောက်က ဖောင် ပထမဆုံး ချတဲ့နေ့၊ အမေ့ ပထမဆုံး ဖာရာကို သူ ရယ်ခဲ့တယ်။ အခု သူ့ကြိမ်က ဈေးထဲမှာ အရောင်းရဆုံး။', en: "Seven years back, the raft's first day, he laughed at mother's first patch. Now his cane sells best in the whole Market.", need: 'envy', seems: 'hot', face: 'think',
        tell: { my: 'မျက်လုံးက အဘိုးကြီးဆီ မရောက်ဘူး။ မြင့်မြင့် စီထားတဲ့ ကြိမ်စည်းတွေဆီ ရောက်နေတယ်။ ဒေါသ မဟုတ်ဘူး။ ရိုင်းတဲ့သူ အဆင်ပြေနေတာကို မကျေနပ်တာ။', en: 'His eyes go not to the old man but to the tall stacks of cane. Not anger: it galls him that a rude man does well.' } },
      { my: 'ရိုင်းတဲ့သူကမှ အဆင်ပြေနေတာ။ မတရားဘူး။', en: "The rude one's the one doing well. It isn't fair.", need: 'envy', seems: 'looksdown', face: 'sad',
        tell: { my: 'အဘိုးကြီးကို အထင်သေးတာ မဟုတ်ဘူး။ "မတရားဘူး" ဆိုတာကိုပဲ ပြန်ပြန်ပြောနေတယ်။', en: 'He doesn\'t look down on the old man. He keeps coming back to "it isn\'t fair".' } },
    ] },
    { lines: [
      { my: 'ဒါကြောင့် ဘာမှ မပေးဘူး။ စကားတစ်ခွန်းတောင်။ ဒါ အေးဆေးနေတာပဲ မဟုတ်လား။', en: "So I give him nothing. Not even a word. That's keeping cool, isn't it?", need: 'given', seems: 'own', face: 'think',
        tell: { my: 'အေးအေးဆေးဆေး ရွေးထားတာ မဟုတ်ဘူး။ ရယ်ခံရတဲ့နေ့ကတည်းက အဘိုးကြီးကို လက်လျှော့ထားတာ။ ကြိမ်ဆိပ်နား ရောက်တိုင်း ဝါးကို ပိုတင်းတင်း ဆုပ်တယ်။', en: "Not a calm choice. Since the day of the laugh he's given up on the old man. Near Cane Jetty his grip on the pole always tightens." } },
      // lesson (audit): was "He'll never change.", which made the fix hang on the old man changing; the book's turn
      // is in her own two ways (p52-53), so the line now hangs his manners on the old man's, and the cards answer that
      { my: 'သူ ဘယ်တော့မှ ပြောင်းမှာ မဟုတ်ဘူး။ ဒါဆို ကျွန်တော်က ဘာလို့ ပြောင်းရမှာလဲ။', en: "He'll never change. So why should I?", need: 'given', face: 'sad', mood: 'down',
        tell: { my: 'ကိုယ့်ဆက်ဆံပုံကို အဘိုးကြီးရဲ့ ဆက်ဆံပုံမှာ ချိတ်ထားတယ်။ ကိုယ်လုပ်တာက ကိုယ့်ဟာ ဆိုတာ မေ့နေတယ်။', en: "He's hung his own manners on the old man's. He forgets that what he does is his." } },
    ] },
    { lines: [
      { my: '…ဒါပေမဲ့ လူတိုင်း "နေကောင်းလား" ရတယ်။ သူကျ ဘာမှ မရဘူး။ ကျွန်တော် ဘာလို့ နှစ်မျိုး ဖြစ်နေရတာလဲ။', en: '…But everyone gets my "keeping well!" and he gets nothing. Why am I two ways?', need: 'own', face: 'think', heard: true,
        tell: { my: 'အဖြေ မလိုဘူး။ သူ့ကိုယ်သူ မေးနေတာ။ နားထောင်ပေးရုံပဲ။', en: "He doesn't need an answer. He's asking himself. Just listen." } },
      { my: 'လူတိုင်းကို တစ်မျိုး၊ တစ်ယောက်ကို တခြားတစ်မျိုး… အဲဒါ ကျွန်တော် မဟုတ်ဘူး။', en: "One way for everyone, another for one… that isn't me.", need: 'own', face: 'think', heard: true },
    ] },
  ],
  react: {
    miss: { my: '…အင်း? အဲဒါ ကျွန်တော်နဲ့ မဆိုင်သလိုပဲ။', en: "…Hm? That doesn't sound like me." },
    hot: { my: '(ကိုသီဟ ထမင်းပန်းကန်ကို တွန်းဖယ်ပြီး ကြမ်းပြင်ကိုပဲ စိုက်ကြည့်နေတယ်။ ဘာမှ မကြားဘူး။)', en: '(Ko Thiha pushes his rice bowl away and stares at the floorboards. Nothing gets through.)' },
    lean: { my: 'အစ်မ ပြောတာပဲ လုပ်မယ်လေ…', en: "I'll just do whatever you say…" },
  },
  decision: [
    { my: 'နောက်တစ်ခေါက် ကြိမ်ဆိပ်မှာ ရပ်မယ်။ လူတိုင်းကို ပြောသလိုပဲ သူ့ကိုလည်း "နေကောင်းလား" ပြောမယ်။', en: 'Next run I\'ll stop at Cane Jetty and say "keeping well!" to him, same as to everyone.', face: 'think' },
    { my: 'သူ ဘာပြန်ပြောပြော… အဲဒါ သူ့ဟာ။', en: "Whatever he says back… that's his.", face: 'smile' },
  ],
};
