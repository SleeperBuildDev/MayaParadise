// Day 14's talk: Toe Toe's "where I got it" list (ch 23, ကိုးကား). Format: see the top of js/story/talk.js.
// Every Burmese line is a draft for Maya to proofread.
//
// His needs here: he is AFRAID a credit list makes him look less clever; he DOESN'T KNOW a teacher or a
// friend can be a source ("books only list famous people"); then two stones that are HIS OWN (whom to name;
// that he will write it himself): the player holds Step back there (a card on his stone answers for him and
// he leans). Hand: Maya's last-page card (earned by choice 2), three companions' cards, two look-alikes, and
// the pencil look-alike of the unchecked `essay` rumour (talk.js drops it once proof:essay is in the bag).
//
// Companion card wording (parrot, check, bench) must match the days that give them (3, 9, 11); the cards
// only come into the hand once that companion has lifted off (onlyIf 'companion:<id>').

export const D14_TT_CARDS = [
  { id: 'page', onlyIf: 'd14.page', name: { my: 'ငါ့ရဲ့ နောက်ဆုံး စာမျက်နှာ', en: 'My last page' },
    line: { my: 'ငါ့ရဲ့ နောက်ဆုံး စာမျက်နှာမှာ နာမည်တွေနဲ့တကွ တခြားလူတွေရဲ့ စကားတွေချည်းပဲ။ အဲဒီလို ရေးလိုက်လို့ ငါ့စာအုပ် သေးငယ်မသွားပါဘူး။', en: "My last page is all other people's words, with names. It doesn't make my book any smaller." },
    answers: ['afraid'], from: { my: 'မှတ်စုစာအုပ်ထဲက', en: 'from the notebook' } },
  { id: 'parrot', companion: 'parrot', onlyIf: 'companion:parrot', name: { my: 'ဘယ်မှာ အရင်ဆုံး မြင်ခဲ့တာလဲ', en: 'Where did you first see it?' }, // the Why-Parrot (ch 3)
    line: { my: 'ပဲပင်တွေ ဘာလို့ သေသွားလဲ ဆိုတာ ဘယ်မှာ အရင်ဆုံး မြင်ခဲ့တာလဲ။ ဘယ်သူနဲ့ အတူ ရှိနေခဲ့တာလဲ။', en: 'Where did you first see why the beans died? Who were you with?' },
    answers: ['unknown'], from: { my: 'ဘာလို့လဲ ကြက်တူရွေးလေး', en: 'the Why-Parrot' } },
  { id: 'check', companion: 'caterpillar', onlyIf: 'companion:caterpillar', name: { my: 'ကိုယ်တိုင် စစ်ဆေးကြည့်ပါ', en: 'Check for yourself' }, // the Seven-Ring Caterpillar (ch 12)
    line: { my: 'စာအုပ်ထဲမှာ နာမည်ကြီးတဲ့ လူတွေပဲ ထည့်ရတယ် ဆိုတာ မင်း ကိုယ်တိုင် စစ်ဆေးကြည့်ပြီးပြီလား၊ ကြားဖူးနားဝနဲ့ ပြောနေတာလား။', en: 'Only famous names go in a book: did you check that, or only hear it?' },
    answers: ['unknown'], from: { my: 'အရစ်ခုနစ်ရစ် ပိုးကောင်လေး', en: 'the Seven-Ring Caterpillar' } },
  { id: 'bench', companion: 'bench', onlyIf: 'companion:bench', name: { my: 'ပြောပြပါ၊ ငါ နားထောင်နေတယ်', en: "Say it, I'm listening" }, // the Two-Seat Bench (ch 15)
    line: { my: 'အကြောက်ဆုံးက ဘာလဲ ပြောပြပါ။ ငါ နားထောင်နေတယ်။', en: "Tell me what scares you most. I'm listening." },
    answers: ['afraid'], from: { my: 'နှစ်ယောက်ထိုင် ခုံတန်းလေး', en: 'the Two-Seat Bench' } },
  { id: 'mename', lookalike: true, name: { my: 'ငါ မင်းအစား ရွေးပေးမယ်', en: "I'll choose for you" },
    line: { my: 'မင်းအတွက် နာမည်တွေ ငါ ရွေးပေးမယ်။ ဆရာမရယ်၊ ငါရယ်။ ပြီးပြီ။', en: "I'll pick the names for you. Teacher, and me. Done." },
    shows: ['unknown'], really: { my: 'သူ့အစား ဖြေပေးမိတာ', en: 'answering for him' },
    backfire: { they: { my: 'အစ်မ ပြောမှတော့… အစ်မ နာမည်ကို ထိပ်ဆုံးမှာ ထည့်လိုက်မယ်။', en: 'Since you say so… your name goes at the top.' },
                maya: { my: '(သူ့စာရင်းကို ငါ ထပ်ရေးပေးလိုက်မိပြန်ပြီ။)', en: '(I wrote his list for him again.)' } } },
  { id: 'everyone', lookalike: true, name: { my: 'အားလုံးကို ကျေးဇူးတင်ပါတယ်', en: 'Thanks to everyone' },
    line: { my: '"အားလုံးကို ကျေးဇူးတင်ပါတယ်" လို့ပဲ ရေးလိုက်။ ဘယ်သူမှ စိတ်မဆိုးတော့ဘူး။', en: 'Just write "thanks to everyone". Nobody gets upset.' },
    shows: ['afraid'], really: { my: 'ဘယ်သူ့နာမည်မှ မထည့်တာ', en: 'naming no one' },
    backfire: { they: { my: 'ဒါဆို ဆရာမလည်း မပါတော့ဘူး၊ စုနွယ်လည်း မပါတော့ဘူးပေါ့။', en: "Then Teacher isn't in it, and Su Nwe isn't either." },
                maya: { my: '(စိတ်ချရသလိုတော့ ထင်ရတာပဲ။ တကယ်တော့ ဘယ်သူ့ကိုမှ ကျေးဇူးမတင်လိုက်တာ။)', en: '(It feels safe. Really it thanks nobody.)' } } },
  // the pencil rumour card: only while `essay` is unchecked (talk.js drops it once proof:essay is in the bag)
  { id: 'copied', lookalike: true, pencil: true, rumour: 'essay', name: { my: 'ကူးချထားတာလား', en: 'Did you copy it?' },
    line: { my: 'စာကြည့်တိုက် စာအုပ်ထဲက ကူးချထားတာလို့ ကြားတယ်။ ဟုတ်လား။', en: 'I heard you copied it from a library book. Did you?' },
    shows: ['unknown'], really: { my: 'မစစ်ဆေးရသေးတဲ့ ကောလာဟလ', en: 'a rumour not yet checked' },
    backfire: { they: { my: 'ကျွန်တော် ကူးမချပါဘူး။ ကျွန်တော့် ပဲပင်တွေ အကြောင်း ကျွန်တော် ရေးထားတာ။', en: "I didn't copy! I wrote about my own beans!" },
                maya: { my: '(မစစ်ဆေးရသေးတဲ့ စကားကို ငါ ပြန်ပြောမိပြီ။)', en: "(I repeated something I hadn't checked.)" } } },
];

export const TALK_D14_TOETOE = {
  id: 'd14-toetoe',
  person: 'toetoe',
  with: ['hninwai'],
  steam: 1, calm: 4, turns: 7,
  theirs: [2, 4],
  hand: D14_TT_CARDS,
  stepBackLines: {
    2: { my: '…ဆရာမရယ်… စုနွယ်ရယ်… (လက်ချောင်းလေးတွေ ချိုးပြီး ရေတွက်နေတယ်။)', en: '…Teacher… and Su Nwe… (counting on his fingers.)' }, // NEW draft
    4: { my: '(ခဲတံကို ကောက်ကိုင်ပြီး သူ့ဘာသာ စရေးနေပြီ။)', en: '(He picks up the pencil and starts writing himself.)' }, // NEW draft
  },
  stones: [
    { lines: [
      { my: 'အဆုံးမှာ နာမည်တွေ ထည့်လိုက်ရင် ဒါ ကျွန်တော့် အကြံဉာဏ် မဟုတ်မှန်း အားလုံး သိသွားကြမှာပေါ့။', en: "If I put names at the end, everyone will know it wasn't my idea.", need: 'afraid', seems: 'looksdown', face: 'worried',
        tell: { my: 'နာမည်စာရင်းကို အထင်သေးနေတာ မဟုတ်ဘူး။ ဉာဏ်မကောင်းဘူးလို့ အထင်ခံရမှာ ကြောက်လို့ စာရွက်ကို ရင်ဘတ်မှာ ကပ်ထားတာ။', en: "He doesn't look down on a list of names. He hugs the page to his chest: afraid of looking not clever." } },
      { my: 'ဉာဏ်ကောင်းတဲ့ လူတွေက အရာရာကို ကိုယ့်ဘာသာ စဉ်းစားကြတာလို့ ပြောကြတယ်။', en: 'Clever people think of everything themselves, they say.', need: 'afraid', seems: 'envy', face: 'sad',
        tell: { my: 'သူ ဘယ်သူ့ကိုမှ မနာလို မဖြစ်ပါဘူး။ "ဉာဏ်ကောင်းတယ်" ဆိုတဲ့ စကားလုံး ပျောက်သွားမှာကို ကြောက်နေတာ။', en: "He envies no one. He's afraid of losing the word \"clever\"." } },
    ] },
    { lines: [
      { my: 'ပြီးတော့ ဆရာမနဲ့ မောင်ငယ်က နာမည်ကြီးတွေ မဟုတ်ဘူးလေ။ စာအုပ်တွေမှာ နာမည်ကြီးတဲ့ လူတွေကိုပဲ ထည့်ကြတာ။', en: "And Teacher and Maung Nge aren't famous. Books only list famous people.", need: 'unknown', seems: 'looksdown', face: 'think',
        tell: { my: 'သူတို့ကို အထင်သေးနေတာ မဟုတ်ဘူး။ ဆရာမ ဒါမှမဟုတ် သူငယ်ချင်း ဆီကနေလည်း အကိုးအကား ယူလို့ ရမှန်း သူ တကယ် မသိတာ။', en: "He doesn't look down on them. He truly doesn't know a teacher or a friend can be a source." } },
      // ch 3: the world is the biggest school, the snack shop included (p26–30; Day 2 he worked out change there)
      { my: 'မုန့်ဆိုင်လေးက ချိန်ခွင်မှာ ပြန်အမ်းငွေ တွက်တတ်လာတာ။ မုန့်ဆိုင်လေးကိုကျ စာရင်းထဲ ထည့်လို့ မရဘူး မဟုတ်လား။', en: "I learned to work out change at the snack-shop scale. You can't list a snack shop, right?", need: 'unknown', face: 'think', heard: true },
    ] },
    { lines: [ // his: whom to name
      { my: 'ဒါဆို… ဘယ်သူ့ဆီက ရခဲ့တာလဲ… ခဏနေဦး၊ ကျွန်တော် စဉ်းစားကြည့်ဦးမယ်။', en: 'So… who did I get it from… wait, let me think.', need: 'own', face: 'think',
        tell: { my: 'လက်ချောင်းလေးတွေ ချိုးပြီး ရေတွက်နေတယ်။ ဒီခြေလှမ်းက သူ့အပိုင်းပဲ။', en: "He's counting on his fingers. This step is his." } },
    ] },
    { lines: [
      { my: 'တစ်ယောက်ယောက် ကျန်ခဲ့ရင် ဘယ်လိုလုပ်မလဲ။ သူတို့ စိတ်မကောင်း ဖြစ်သွားကြမှာ။', en: "What if I leave someone out? They'll be upset.", need: 'afraid', seems: 'hot', face: 'worried', steam: 1, heard: true,
        tell: { my: 'စိတ်တိုနေတာ မဟုတ်ဘူး။ တစ်ယောက်ယောက် စိတ်ထိခိုက်သွားမှာ စိုးရိမ်ပြီး ခဲတံကို ကိုက်နေတာ။', en: "He isn't cross. He's chewing his pencil, worried someone will be hurt." } },
    ] },
    { lines: [ // his: he will write it himself
      { my: 'ဆရာမ အရင်… ပြီးရင်… ကျန်တာတွေ ကျွန်တော် သိပြီ။', en: 'Teacher first… then… I know the rest.', need: 'own', face: 'happy',
        tell: { my: 'မာရာ့ကို မကြည့်တော့ဘူး။ သူ့စာရွက်ကိုပဲ ကြည့်နေပြီ။', en: "He isn't looking at Maya any more. Only at his page." } },
    ] },
  ],
  react: {
    miss: { my: '…ဟင်? အဲဒါ နာမည်တွေနဲ့ ဘာမှ မဆိုင်ဘူး။', en: "…Huh? That's got nothing to do with names." },
    hot: { my: '(တိုးတိုး စာရွက်ကို ခေါက်ပိတ်လိုက်တယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(Toe Toe folds the page shut. Nothing gets through.)' },
    lean: { my: 'အစ်မ ပြောတဲ့အတိုင်းပဲ ရေးလိုက်ပါ့မယ်…', en: "I'll just write what you say…" },
  },
  decision: [
    { my: 'နာမည်တွေကို ကျွန်တော့်ဘာသာ ရေးမယ်။ ဘယ်သူ့စကားတွေကို သယ်ဆောင်လာလဲ ဆိုတာကိုပေါ့။', en: "I'll write the names myself. Whose words I'm carrying.", face: 'happy' },
    { my: 'မကြည့်နဲ့ဦး အစ်မ။ ပြီးသွားမှ ပြမယ်။', en: "Don't look, sister. I'll show you when it's done.", face: 'happy' },
  ],
};
