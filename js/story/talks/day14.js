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
  { id: 'page', onlyIf: 'd14.page', name: { my: 'နောက်ဆုံးစာမျက်နှာ', en: 'My last page' },
    line: { my: 'အစ်မ စာမျက်နှာက သူများစကားတွေချည်းပဲ၊ နာမည်နဲ့။ ဒါကြောင့် အစ်မစာအုပ် သေးသွားတာ မဟုတ်ဘူး။', en: "My last page is all other people's words, with names. It doesn't make my book any smaller." },
    answers: ['afraid'], from: { my: 'မှတ်စုစာအုပ်', en: 'from the notebook' } },
  { id: 'parrot', companion: 'parrot', onlyIf: 'companion:parrot', name: { my: 'ဘယ်မှာ စမြင်ခဲ့လဲ', en: 'Where did you first see it?' }, // the Why-Parrot (ch 3)
    line: { my: 'ပဲပင် ဘာလို့သေလဲ ဆိုတာ ပထမဆုံး ဘယ်မှာ မြင်ခဲ့လဲ။ ဘယ်သူနဲ့ အတူလဲ။', en: 'Where did you first see why the beans died? Who were you with?' },
    answers: ['unknown'], from: { my: 'ဘာကြောင့်ကြက်တူရွေး', en: 'the Why-Parrot' } },
  { id: 'check', companion: 'caterpillar', onlyIf: 'companion:caterpillar', name: { my: 'ကိုယ်တိုင် စစ်ကြည့်', en: 'Check for yourself' }, // the Seven-Ring Caterpillar (ch 12)
    line: { my: 'နာမည်ကျော်မှ စာထဲ ထည့်ရတယ်ဆိုတာ ကြားဖူးရုံလား၊ ကိုယ်တိုင် စစ်ကြည့်ဖူးလား။', en: 'Only famous names go in a book: did you check that, or only hear it?' },
    answers: ['unknown'], from: { my: 'ခုနစ်ဆစ်ပိုး', en: 'the Seven-Ring Caterpillar' } },
  { id: 'bench', companion: 'bench', onlyIf: 'companion:bench', name: { my: 'ပြောပါ၊ နားထောင်နေတယ်', en: "Say it, I'm listening" }, // the Two-Seat Bench (ch 15)
    line: { my: 'ဘာကို အကြောက်ဆုံးလဲ ပြောပါ။ အစ်မ နားထောင်နေတယ်။', en: "Tell me what scares you most. I'm listening." },
    answers: ['afraid'], from: { my: 'ထိုင်ခုံလေး', en: 'the Two-Seat Bench' } },
  { id: 'mename', lookalike: true, name: { my: 'အစ်မ ရွေးပေးမယ်', en: "I'll choose for you" },
    line: { my: 'နာမည်တွေ အစ်မ ရွေးပေးမယ်။ ဆရာမရယ်၊ အစ်မရယ်။ ပြီးပြီ။', en: "I'll pick the names for you. Teacher, and me. Done." },
    shows: ['unknown'], really: { my: 'သူ့အစား ဖြေပေးတာ', en: 'answering for him' },
    backfire: { they: { my: 'အစ်မ ပြောတာဆိုတော့… အစ်မနာမည် ထိပ်ဆုံးမှာ ထားမယ်။', en: 'Since you say so… your name goes at the top.' },
                maya: { my: '(သူ့စာရင်းကို ကျွန်မ ရေးပေးမိပြန်ပြီ။)', en: '(I wrote his list for him again.)' } } },
  { id: 'everyone', lookalike: true, name: { my: 'လူတိုင်းကို ကျေးဇူး', en: 'Thanks to everyone' },
    line: { my: '"လူတိုင်းကို ကျေးဇူးတင်ပါတယ်" လို့ပဲ ရေးလိုက်။ ဘယ်သူမှ စိတ်မဆိုးဘူး။', en: 'Just write "thanks to everyone". Nobody gets upset.' },
    shows: ['afraid'], really: { my: 'ဘယ်သူ့ကိုမှ နာမည်မတပ်တာ', en: 'naming no one' },
    backfire: { they: { my: 'ဒါဆို ဆရာမလည်း မပါ၊ စုနွယ်လည်း မပါဘူးပေါ့။', en: "Then Teacher isn't in it, and Su Nwe isn't either." },
                maya: { my: '(လုံခြုံသလို ထင်ရတယ်။ တကယ်တော့ ဘယ်သူ့ကိုမှ ကျေးဇူးမတင်တာပဲ။)', en: '(It feels safe. Really it thanks nobody.)' } } },
  // the pencil rumour card: only while `essay` is unchecked (talk.js drops it once proof:essay is in the bag)
  { id: 'copied', lookalike: true, pencil: true, rumour: 'essay', name: { my: 'ကူးထားတာလား', en: 'Did you copy it?' },
    line: { my: 'စာကြည့်တိုက်စာအုပ်ထဲက ကူးထားတာလို့ ကြားတယ်။ ဟုတ်လား။', en: 'I heard you copied it from a library book. Did you?' },
    shows: ['unknown'], really: { my: 'မစစ်ရသေးတဲ့ ကောလာဟလ', en: 'a rumour not yet checked' },
    backfire: { they: { my: 'ကျွန်တော် မကူးဘူး! ကျွန်တော့် ပဲပင်အကြောင်း ကျွန်တော် ရေးတာ!', en: "I didn't copy! I wrote about my own beans!" },
                maya: { my: '(မစစ်ရသေးဘဲ ကြားတာကို ပြန်ပြောမိပြီ။)', en: "(I repeated something I hadn't checked.)" } } },
];

export const TALK_D14_TOETOE = {
  id: 'd14-toetoe',
  person: 'toetoe',
  with: ['hninwai'],
  steam: 1, calm: 4, turns: 7,
  theirs: [2, 4],
  hand: D14_TT_CARDS,
  stepBackLines: {
    2: { my: '…ဆရာမ… ပြီးတော့ စုနွယ်… (လက်ချောင်းလေးတွေနဲ့ ရေတွက်နေတယ်။)', en: '…Teacher… and Su Nwe… (counting on his fingers.)' }, // NEW draft
    4: { my: '(ခဲတံကို ကိုင်ပြီး ကိုယ်တိုင် ရေးစပြီ။)', en: '(He picks up the pencil and starts writing himself.)' }, // NEW draft
  },
  stones: [
    { lines: [
      { my: 'အဆုံးမှာ နာမည်တွေ ထည့်ရင် ကျွန်တော့် စိတ်ကူး မဟုတ်ဘူးလို့ လူတိုင်း သိသွားမှာပေါ့။', en: "If I put names at the end, everyone will know it wasn't my idea.", need: 'afraid', seems: 'looksdown', face: 'worried',
        tell: { my: 'နာမည်စာရင်းကို အထင်သေးတာ မဟုတ်ဘူး။ စာရွက်ကို ရင်ဘတ်မှာ ပိုက်ထားတယ်။ မတော်ဘူး ထင်မှာ ကြောက်နေတာ။', en: "He doesn't look down on a list of names. He hugs the page to his chest: afraid of looking not clever." } },
      { my: 'တော်တဲ့သူတွေက အကုန် ကိုယ်တိုင် စဉ်းစားတာတဲ့။', en: 'Clever people think of everything themselves, they say.', need: 'afraid', seems: 'envy', face: 'sad',
        tell: { my: 'ဘယ်သူ့ကိုမှ မနာလိုတာ မဟုတ်ဘူး။ "တော်တယ်" ဆိုတဲ့စကား မရမှာ ကြောက်နေတာ။', en: "He envies no one. He's afraid of losing the word \"clever\"." } },
    ] },
    { lines: [
      { my: 'ပြီးတော့ ဆရာမတို့၊ မောင်ငယ်တို့က နာမည်ကျော်တွေ မှ မဟုတ်တာ။ စာအုပ်ထဲမှာ နာမည်ကျော်တွေပဲ ပါတာ။', en: "And Teacher and Maung Nge aren't famous. Books only list famous people.", need: 'unknown', seems: 'looksdown', face: 'think',
        tell: { my: 'သူတို့ကို အထင်သေးတာ မဟုတ်ဘူး။ ဆရာမ၊ သူငယ်ချင်းကလည်း ကိုးကားလို့ ရတယ်ဆိုတာ တကယ် မသိသေးတာ။', en: "He doesn't look down on them. He truly doesn't know a teacher or a friend can be a source." } },
      // ch 3: the world is the biggest school, the snack shop included (p26–30; Day 2 he worked out change there)
      { my: 'အမ်းငွေ တွက်တတ်တာ မုန့်ဆိုင်က ချိန်ခွင်နားမှာ သင်ခဲ့တာ။ မုန့်ဆိုင်ကို ကိုးကားလို့ ရလား။ မရဘူးမလား။', en: "I learned to work out change at the snack-shop scale. You can't list a snack shop, right?", need: 'unknown', face: 'think', heard: true },
    ] },
    { lines: [ // his: whom to name
      { my: 'ဒါဆို… ကျွန်တော် ဘယ်သူ့ဆီက ရခဲ့လဲ… ခဏ၊ စဉ်းစားပါရစေ။', en: 'So… who did I get it from… wait, let me think.', need: 'own', face: 'think',
        tell: { my: 'လက်ချောင်းလေးတွေနဲ့ ရေတွက်နေတယ်။ ဒီတစ်လှမ်းက သူ့ဟာ။', en: "He's counting on his fingers. This step is his." } },
    ] },
    { lines: [
      { my: 'တစ်ယောက်ယောက်ကို မေ့ကျန်ခဲ့ရင်ကော။ စိတ်ဆိုးမှာပေါ့။', en: "What if I leave someone out? They'll be upset.", need: 'afraid', seems: 'hot', face: 'worried', steam: 1, heard: true,
        tell: { my: 'စိတ်တိုတာ မဟုတ်ဘူး။ ခဲတံကို ကိုက်နေတယ်။ တစ်ယောက်ယောက် နာမှာ စိုးနေတာ။', en: "He isn't cross. He's chewing his pencil, worried someone will be hurt." } },
    ] },
    { lines: [ // his: he will write it himself
      { my: 'ဆရာမ အရင်… ပြီးတော့… ကျန်တာ ကျွန်တော် သိတယ်။', en: 'Teacher first… then… I know the rest.', need: 'own', face: 'happy',
        tell: { my: 'အစ်မကို မကြည့်တော့ဘူး။ စာရွက်ကိုပဲ ကြည့်နေတယ်။', en: "He isn't looking at Maya any more. Only at his page." } },
    ] },
  ],
  react: {
    miss: { my: '…ဟင်? အဲဒါ နာမည်တွေနဲ့ မဆိုင်ဘူးလေ။', en: "…Huh? That's got nothing to do with names." },
    hot: { my: '(တိုးတိုး စာရွက်ကို ခေါက်ပြီး ဖုံးထားလိုက်တယ်။ ဘာမှ မကြားဘူး။)', en: '(Toe Toe folds the page shut. Nothing gets through.)' },
    lean: { my: 'အစ်မ ပြောတဲ့အတိုင်းပဲ ရေးလိုက်မယ်…', en: "I'll just write what you say…" },
  },
  decision: [
    { my: 'နာမည်တွေ ကျွန်တော် ကိုယ်တိုင် ရေးမယ်။ ကျွန်တော် သယ်လာတဲ့ စကားတွေ ဘယ်သူ့ဆီကလဲ။', en: "I'll write the names myself. Whose words I'm carrying.", face: 'happy' },
    { my: 'မကြည့်နဲ့နော် အစ်မ။ ပြီးမှ ပြမယ်။', en: "Don't look, sister. I'll show you when it's done.", face: 'happy' },
  ],
};
