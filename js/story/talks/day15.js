// Day 15's talk: Nay Chi, in the Library's reading nook, on launch day. The town asked her to give the
// welcome; she has copied fine lines out of the shelf's books and crossed them all out, and today she
// slips back once: "Just write it for me, this last time." The last two stones are hers.
// Lesson: Maya shows the road; each walks it (preface p11; ch 11 p61-64); her words are her own light.
// Format: see the top of js/story/talk.js. Burmese lines are drafts for Maya to proofread.
//
// The hand is the companions Maya brought (any eight) plus two look-alikes. Every stone's second line is
// `heard` (Listen alone moves it), so the talk can be finished with any eight. The extra fields
// `companion` (and `pencil`/`rumour`) are read by day15.js to filter the hand; talk.js ignores `companion`.

export const D15_NC_CARDS = [
  { id: 'c:sheep', companion: 'sheep', name: { my: 'နောက်တစ်ခါ', en: 'Once more' },
    line: { my: 'တစ်ခါ အသံထွက် ဖတ်ကြည့်။ မှားလည်း နောက်တစ်ခါပေါ့။', en: 'Read it aloud once. If it goes wrong, once more.' },
    answers: ['afraid', 'given'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'c:seedling', companion: 'seedling', name: { my: 'မရသေးဘူး', en: 'Not yet' },
    line: { my: 'မရသေးဘူးဆိုတာ မရဘူး မဟုတ်ဘူးလေ။', en: "Not yet isn't never." },
    answers: ['given', 'afraid'], from: { my: 'မရသေးပျိုးပင်', en: 'the Not-Yet Seedling' } },
  { id: 'c:earth', companion: 'earth', name: { my: 'မြေကြီးလို', en: 'Like the earth' },
    line: { my: 'လက်ခုပ်သံ လာလာ၊ ရယ်သံ လာလာ၊ မြေကြီးလို ငြိမ်ငြိမ်လေး ရပ်နေရုံပဲ။', en: 'Claps or laughs, whatever comes, just stand steady, like the earth.' },
    answers: ['afraid'], from: { my: 'မြေကြီးလေး', en: 'the Little Earth' } },
  { id: 'c:bench', companion: 'bench', name: { my: 'ဘေးမှာ ရှိတယ်', en: "I'm beside you" },
    line: { my: 'အစ်မ ဘေးမှာ ရှိနေမယ်။ ရှေ့မှာ မဟုတ်ဘူး။ ဘေးမှာ။', en: "I'll be beside you. Not in front. Beside." },
    answers: ['afraid'], from: { my: 'ခုံတန်းလေး', en: 'the Two-Seat Bench' } },
  { id: 'c:parrot', companion: 'parrot', name: { my: 'ဘာကြောင့်လဲ', en: 'Why?' },
    line: { my: 'မြို့က ဘာကြောင့် နေခြည်ကို ရွေးတာလဲ။ ကိုယ့်ကိုယ်ကို အရင် မေးကြည့်။', en: 'Why did the town pick you? Ask yourself that first.' },
    answers: ['unknown'], from: { my: 'ဘာကြောင့်ကြက်တူရွေး', en: 'the Why-Parrot' } },
  { id: 'c:star', companion: 'star', name: { my: 'ဘယ်သူ့စကားလဲ', en: 'Whose words?' },
    // ch 23: borrowed words go out with their owner's name; what you saw yourself goes out in your own
    line: { my: 'တခြားသူ့စကား ယူသုံးရင် နာမည်လေး တွဲပြောလိုက်။ ကိုယ်တိုင်မြင်ခဲ့တာကျတော့ ကိုယ့်စကားနဲ့ပေါ့။', en: "If you use someone else's words, say their name with them. What you saw yourself, say in your own." },
    answers: ['unknown', 'cling'], from: { my: 'ခရေပွင့်လေး', en: 'the Footnote-Star' } },
  { id: 'c:key', companion: 'key', name: { my: 'သော့က ကိုယ့်လက်ထဲ', en: 'The key is yours' },
    line: { my: 'သော့က နေခြည့်လက်ထဲမှာ ရှိပြီးသား။ ကျွန်မလက်ထဲမှာ မဟုတ်ဘူး။', en: "The key's already in your hand. Not in mine." },
    answers: ['cling'], from: { my: 'သော့လေး', en: 'the Little Key' } },
  { id: 'c:tendril', companion: 'tendril', name: { my: 'ဆက်ပါ၊ မနွယ်ပါနဲ့', en: "Connect, don't entwine" },
    line: { my: 'အတူ ရှိမယ်။ ဒါပေမဲ့ နေခြည့်စကားကို ကျွန်မ မပတ်ဖွဲ့တော့ဘူး။', en: "We'll be together. But I won't wind myself round your words any more." },
    answers: ['cling'], from: { my: 'နွယ်ညွန့်လေး', en: 'the Tendril' } },
  { id: 'c:stage', companion: 'stage', name: { my: 'သူ့ဇာတ်ခုံ', en: "It's their stage" },
    line: { my: 'ဒီည ကြိုဆိုစကားက နေခြည့် ဇာတ်ခုံ။ ကျွန်မက ပရိသတ်ထဲမှာ။', en: "Tonight the welcome is your stage. I'm in the audience." },
    answers: ['cling', 'afraid'], from: { my: 'ဇာတ်ခုံလေး', en: 'the Little Stage' } },
  { id: 'justonce', lookalike: true, name: { my: 'ဒီတစ်ခါပဲ ရေးပေးမယ်', en: "Just this once, I'll write it" },
    line: { my: 'ကဲပါ၊ ဒီတစ်ခါပဲ အစ်မ ရေးပေးလိုက်မယ်။', en: "Oh, go on. Just this once, I'll write it for you." },
    shows: ['cling', 'unknown'], really: { my: 'သူ့အစား ပြောပေးတာ', en: 'speaking in her place' },
    backfire: { they: { my: 'ဟုတ်… အစ်မ စကားနဲ့ဆို ပိုကောင်းမှာပဲ… (စာရွက်ကို ခေါက်လိုက်တယ်)', en: "Yes… it'll be better in your words… (she folds her own paper away)" },
      maya: { my: '(ကျွန်မ စကားက ကောင်းချင် ကောင်းမယ်။ ဒါပေမဲ့ ဒီညက သူ့ည။)', en: '(My words might be good. But tonight is hers.)' } } },
  // only while rumour `speech` is unchecked (after Day 6, an unchecked rumour sits in the hand as a pencil look-alike)
  { id: 'mayasays', lookalike: true, pencil: true, rumour: 'speech', name: { my: '"မာရာ ပြောမယ်"', en: '"Maya will say it"' },
    line: { my: 'ဒီည ကျွန်မက လူတိုင်းကို လမ်းညွှန် ပြောမှာလေ။ နေခြည်က တိုတိုလေးပဲ ပြောရင် ရပါတယ်။', en: "Tonight I'm giving everyone advice anyway. You only need to say a few words." },
    shows: ['afraid'], really: { my: 'မစစ်ရသေးတဲ့ ကောလာဟလ', en: 'a rumour nobody checked' },
    backfire: { they: { my: 'ဒါဆို ကျွန်မစကား မလိုတော့ပါဘူး…', en: "Then my words aren't needed…" },
      maya: { my: '(ပွဲစဉ်ဘုတ်ကို ကိုယ်တိုင် မဖတ်ရသေးဘဲ ပြောလိုက်မိပြီ။)', en: '(I said it without reading the programme myself.)' } } },
];

export const TALK_D15_NAYCHI = {
  id: 'd15-naychi',
  person: 'naychi',
  with: [], // she is alone in the Library
  steam: 1, calm: 4, turns: 8, // 8: a Listen-only path (2 turns a stone + 2 Step backs) still reaches the signpost
  theirs: [3, 4], // from Day 8 the last stone is theirs; by the end, two are
  hand: D15_NC_CARDS, // filtered by day15.js: c:* only if brought; 'mayasays' only while rumour `speech` is unchecked
  stones: [
    { lines: [
      { my: 'လူတွေ အများကြီး လာမှာ။ စကား ထစ်သွားရင်… အားလုံး ရယ်ကြမှာ။', en: "So many people. If I stumble… they'll all laugh.", need: 'afraid', seems: 'hot', face: 'worried',
        tell: { my: 'စိတ်တိုနေတာ မဟုတ်ဘူး။ စာရွက်ကိုင်ထားတဲ့ လက်က တုန်နေတယ်။', en: "She isn't cross. The hand holding the paper is shaking." } },
      { my: 'ရှေ့မှာ ရပ်ရမှာကိုက ကြောက်တယ်။', en: 'Just standing at the front scares me.', need: 'afraid', face: 'worried', heard: true },
    ] },
    { lines: [
      { my: 'ဒီလိုပွဲမှာ ဘာပြောကြလဲ မသိဘူး။ ကျွန်မ စကားတွေက သေးသေးလေးတွေ။', en: "I don't know what people say at these. My words are such small ones.", need: 'unknown', seems: 'given', face: 'think',
        tell: { my: 'လက်လျှော့တာ မဟုတ်ဘူး။ ခြစ်ထားတဲ့ စာကြောင်းတွေကြားက တစ်ကြောင်းကို ပြန်ပြန်ဖတ်နေတယ်။', en: 'Not giving up. She keeps rereading one line between the crossings-out.' } },
      { my: 'ခြစ်ထားတဲ့ထဲက တစ်ကြောင်းတော့… ကိုယ်တိုင် ဖြစ်ခဲ့တာ။', en: 'One of the crossed-out lines… did really happen to me.', need: 'unknown', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'အစ်မက အမြဲ ဘာပြောရမလဲ သိတာပဲ။ ဒီတစ်ခါ နောက်ဆုံးပါ… ရေးပေးပါလား။', en: 'You always know what to say. This is the last time… will you write it?', need: 'cling', seems: 'unknown', face: 'sad', steam: 1,
        tell: { my: 'စာရွက်ကို မကမ်းဘူး။ ခဲတံကိုပဲ ကမ်းနေတယ်။ မသိလို့ မဟုတ်ဘူး။ ပြန်မှီချင်နေတာ။', en: "She holds out the pencil, not the paper. It isn't that she doesn't know. She wants to lean again." } },
      { my: 'နေ့လယ်တစ်နေကုန် စောင့်ခဲ့တဲ့နေ့ကို သတိရတယ်… ဒါပေမဲ့ ဒီနေ့ ကြောက်တယ်။', en: "I remember the day I waited all afternoon… but today I'm scared.", need: 'cling', seems: 'afraid', face: 'sad', heard: true },
    ] },
    { lines: [ // theirs: no card moves it; hold Step back
      { my: '…ဆယ့်ငါးရက်အတွင်း ကျွန်မ ကိုယ်တိုင် ဘာမြင်ခဲ့လဲ။', en: '…What did I see myself, in these fifteen days?', need: 'own', face: 'think',
        tell: { my: 'ခဲတံကို ပြန်ယူလိုက်ပြီ။', en: "She's taken the pencil back." } },
    ] },
    { lines: [ // theirs
      { my: 'ကိုယ်တိုင်မြင်ခဲ့တာကိုပဲ ပြောမယ်။ ကိုယ့်စကားနဲ့။ တိုတိုလေး။', en: "I'll say only what I saw. In my words. Short.", need: 'own', face: 'think',
        tell: { my: 'စာရွက်အသစ်ပေါ်မှာ တစ်ကြောင်းတည်း ရေးနေတယ်။', en: 'She is writing a single line on a fresh sheet.' } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါက ဒီည အကြောင်း မဟုတ်ဘူးလေ အစ်မ။', en: "…That's not about tonight, sister." },
    hot: { my: '(နေခြည် စာရွက်ကို လိပ်ပြီး ဆုပ်ထားတယ်။ ဘာမှ မကြားဘူး။)', en: '(Nay Chi crumples the paper in her fist. Nothing gets through.)' },
    lean: { my: 'ဟုတ်ကဲ့… အစ်မ ပြောတဲ့အတိုင်း…', en: 'Okay… whatever you say…' },
  },
  decision: [
    { my: 'ကိုယ်တိုင် မြင်ခဲ့တာကိုပဲ ကိုယ့်စကားနဲ့ ပြောမယ်။', en: "I'll say what I saw myself, in my own words.", face: 'happy' },
    { my: 'အစ်မ၊ ပရိသတ်ထဲကနေ နားထောင်ပေးနော်။ ရှေ့က မဟုတ်ဘူး။', en: 'Sister, listen from the crowd, all right? Not from the front.', face: 'happy' },
  ],
};
