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
  { id: 'c:sheep', companion: 'sheep', name: { my: 'နောက်တစ်ခေါက်', en: 'Once more' },
    line: { my: 'အသံထွက်ပြီး တစ်ခေါက် ဖတ်ကြည့်လိုက်။ မှားသွားရင် နောက်တစ်ခေါက် ထပ်ဖတ်ကြည့်။', en: 'Read it aloud once. If it goes wrong, once more.' },
    answers: ['afraid', 'given'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  { id: 'c:seedling', companion: 'seedling', name: { my: 'မဖြစ်သေးတာပါ', en: 'Not yet' },
    line: { my: 'မဖြစ်သေးတာက တစ်သက်လုံး မဖြစ်တာမှ မဟုတ်တာ။', en: "Not yet isn't never." },
    answers: ['given', 'afraid'], from: { my: 'မဖြစ်သေးတဲ့ ပျိုးပင်လေး', en: 'the Not-Yet Seedling' } },
  { id: 'c:earth', companion: 'earth', name: { my: 'မြေကြီးလိုပဲ', en: 'Like the earth' },
    line: { my: 'လက်ခုပ်တီးသည်ဖြစ်စေ၊ ရယ်မောသည်ဖြစ်စေ ဘာပဲလာလာ မြေကြီးလိုပဲ ခိုင်ခိုင်မာမာ ရပ်တည်လိုက်ပါ။', en: 'Claps or laughs, whatever comes, just stand steady, like the earth.' },
    answers: ['afraid'], from: { my: 'မြေကြီးလေး', en: 'the Little Earth' } },
  { id: 'c:bench', companion: 'bench', name: { my: 'ငါ နင့်ဘေးမှာ ရှိနေတယ်', en: "I'm beside you" },
    line: { my: 'ငါ နင့်ဘေးမှာ ရှိနေမယ်။ အရှေ့မှာ မဟုတ်ဘူး။ ဘေးမှာပဲ။', en: "I'll be beside you. Not in front. Beside." },
    answers: ['afraid'], from: { my: 'နှစ်ယောက်ထိုင် ခုံတန်းလေး', en: 'the Two-Seat Bench' } },
  { id: 'c:parrot', companion: 'parrot', name: { my: 'ဘာလို့လဲ', en: 'Why?' },
    line: { my: 'တစ်မြို့လုံးက နင့်ကို ဘာလို့ ရွေးချယ်ခဲ့တာလဲ။ အဲဒါကို ကိုယ့်ကိုယ်သူ အရင် မေးကြည့်ပါ။', en: 'Why did the town pick you? Ask yourself that first.' },
    answers: ['unknown'], from: { my: 'ဘာလို့လဲ ကြက်တူရွေးလေး', en: 'the Why-Parrot' } },
  { id: 'c:star', companion: 'star', name: { my: 'ဘယ်သူ့စကားတွေလဲ', en: 'Whose words?' },
    // ch 23: borrowed words go out with their owner's name; what you saw yourself goes out in your own
    line: { my: 'တခြားလူရဲ့ စကားကို သုံးရင် သူ့နာမည်ပါ တွဲပြောပါ။ ကိုယ်တိုင် မြင်ခဲ့တာကိုတော့ ကိုယ့်စကားနဲ့ကိုယ် ပြောပါ။', en: "If you use someone else's words, say their name with them. What you saw yourself, say in your own." },
    answers: ['unknown', 'cling'], from: { my: 'အောက်ခြေမှတ်စု ကြယ်လေး', en: 'the Footnote-Star' } },
  { id: 'c:key', companion: 'key', name: { my: 'သော့က နင့်အပိုင်ပါ', en: 'The key is yours' },
    line: { my: 'သော့က နင့်လက်ထဲမှာ ရှိပြီးသားပဲ။ ငါ့လက်ထဲမှာ မဟုတ်ဘူး။', en: "The key's already in your hand. Not in mine." },
    answers: ['cling'], from: { my: 'သော့သေးသေးလေး', en: 'the Little Key' } },
  { id: 'c:tendril', companion: 'tendril', name: { my: 'ချိတ်ဆက်ထားပါ၊ ရစ်ပတ်မနေပါနဲ့', en: "Connect, don't entwine" },
    line: { my: 'တို့ အတူတူ ရှိနေမယ်။ ဒါပေမဲ့ နင့်စကားလုံးတွေကြားထဲ ငါ ဝင်မရစ်ပတ်တော့ဘူး။', en: "We'll be together. But I won't wind myself round your words any more." },
    answers: ['cling'], from: { my: 'နွယ်ပင်လေး', en: 'the Tendril' } },
  { id: 'c:stage', companion: 'stage', name: { my: 'ဒါ သူတို့ရဲ့ စင်မြင့်ပဲ', en: "It's their stage" },
    line: { my: 'ဒီည ကြိုဆိုနှုတ်ခွန်းဆက် စကားပြောရမှာ နင့်ရဲ့ စင်မြင့်ပဲ။ ငါက ပရိသတ် နေရာမှာပဲ ရှိမယ်။', en: "Tonight the welcome is your stage. I'm in the audience." },
    answers: ['cling', 'afraid'], from: { my: 'စင်မြင့်သေးသေးလေး', en: 'the Little Stage' } },
  { id: 'justonce', lookalike: true, name: { my: 'ဒီတစ်ခါပဲ ငါ ရေးပေးမယ်', en: "Just this once, I'll write it" },
    line: { my: 'ကဲပါ၊ လုပ်ပါ။ ဒီတစ်ခါပဲ နင့်အတွက် ငါ ရေးပေးလိုက်မယ်။', en: "Oh, go on. Just this once, I'll write it for you." },
    shows: ['cling', 'unknown'], really: { my: 'သူ့နေရာကနေ ဝင်ပြောပေးမိတာ', en: 'speaking in her place' },
    backfire: { they: { my: 'ဟုတ်ကဲ့… အစ်မ စကားလုံးတွေနဲ့ဆို ပိုကောင်းမှာပါ… (သူ့စာရွက်ကို သူ ခေါက်သိမ်းလိုက်တယ်။)', en: "Yes… it'll be better in your words… (she folds her own paper away)" },
      maya: { my: '(ငါ့စကားလုံးတွေ ကောင်းချင် ကောင်းမယ်။ ဒါပေမဲ့ ဒီညက သူ့ညပါ။)', en: '(My words might be good. But tonight is hers.)' } } },
  // only while rumour `speech` is unchecked (after Day 6, an unchecked rumour sits in the hand as a pencil look-alike)
  { id: 'mayasays', lookalike: true, pencil: true, rumour: 'speech', name: { my: '"မာရာ ပြောလိမ့်မယ်"', en: '"Maya will say it"' },
    line: { my: 'ဒီည ငါက အားလုံးကို အကြံဉာဏ်တွေ ပေးနေရမှာပဲလေ။ နင်က စကားနည်းနည်းပဲ ပြောဖို့ လိုတာ။', en: "Tonight I'm giving everyone advice anyway. You only need to say a few words." },
    shows: ['afraid'], really: { my: 'ဘယ်သူမှ မစစ်ဆေးထားတဲ့ ကောလာဟလ', en: 'a rumour nobody checked' },
    backfire: { they: { my: 'ဒါဆို ကျွန်မ စကားလုံးတွေ မလိုတော့ဘူးပေါ့…', en: "Then my words aren't needed…" },
      maya: { my: '(အစီအစဉ် စာရွက်ကို ကိုယ်တိုင် မဖတ်ကြည့်ဘဲ ငါ ပြောမိသွားပြီ။)', en: '(I said it without reading the programme myself.)' } } },
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
      { my: 'လူတွေ အများကြီးပဲ။ ကျွန်မ စကားထစ်သွားရင်… အားလုံး ဝိုင်းရယ်ကြမှာ။', en: "So many people. If I stumble… they'll all laugh.", need: 'afraid', seems: 'hot', face: 'worried',
        tell: { my: 'စိတ်တိုနေတာ မဟုတ်ဘူး။ စာရွက်ကိုင်ထားတဲ့ လက်က တုန်နေတာ။', en: "She isn't cross. The hand holding the paper is shaking." } },
      { my: 'အရှေ့မှာ ရပ်နေရုံနဲ့တင် ကျွန်မ ကြောက်နေပြီ။', en: 'Just standing at the front scares me.', need: 'afraid', face: 'worried', heard: true },
    ] },
    { lines: [
      { my: 'ဒီလိုပွဲတွေမှာ လူတွေ ဘာပြောကြလဲ ကျွန်မ မသိဘူး။ ကျွန်မ စကားလုံးတွေက အရမ်း သေးငယ်လွန်းတယ်။', en: "I don't know what people say at these. My words are such small ones.", need: 'unknown', seems: 'given', face: 'think',
        tell: { my: 'လက်လျှော့နေတာ မဟုတ်ဘူး။ ခြစ်ဖျက်ထားတဲ့ စာကြောင်းတွေကြားထဲက တစ်ကြောင်းကိုပဲ အထပ်ထပ် ပြန်ဖတ်နေတာ။', en: 'Not giving up. She keeps rereading one line between the crossings-out.' } },
      { my: 'ခြစ်ဖျက်ထားတဲ့ စာကြောင်းတွေထဲက တစ်ကြောင်းက… ကျွန်မဆီမှာ တကယ် ဖြစ်ပျက်ခဲ့တာပါ။', en: 'One of the crossed-out lines… did really happen to me.', need: 'unknown', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'အစ်မက ဘာပြောရမလဲ အမြဲ သိနေတာပဲ။ ဒါ နောက်ဆုံးအကြိမ်ပါပဲ… အစ်မ ရေးပေးမလားဟင်။', en: 'You always know what to say. This is the last time… will you write it?', need: 'cling', seems: 'unknown', face: 'sad', steam: 1,
        tell: { my: 'စာရွက်ကို မဟုတ်ဘဲ ခဲတံကို ကမ်းပေးနေတယ်။ မသိတာ မဟုတ်ဘူး။ ထပ်ပြီး မှီခိုချင်နေတာ။', en: "She holds out the pencil, not the paper. It isn't that she doesn't know. She wants to lean again." } },
      { my: 'တစ်နေ့လည်လုံး စောင့်ခဲ့ရတဲ့ နေ့ကို ကျွန်မ မှတ်မိပါတယ်… ဒါပေမဲ့ ဒီနေ့တော့ ကျွန်မ ကြောက်နေတယ်။', en: "I remember the day I waited all afternoon… but today I'm scared.", need: 'cling', seems: 'afraid', face: 'sad', heard: true },
    ] },
    { lines: [ // theirs: no card moves it; hold Step back
      { my: '…ဒီဆယ့်ငါးရက်အတွင်း ကျွန်မ ကိုယ်တိုင် ဘာတွေ မြင်ခဲ့ရလဲ။', en: '…What did I see myself, in these fifteen days?', need: 'own', face: 'think',
        tell: { my: 'သူ ခဲတံကို ပြန်ယူလိုက်ပြီ။', en: "She's taken the pencil back." } },
    ] },
    { lines: [ // theirs
      { my: 'ကျွန်မ မြင်ခဲ့တာကိုပဲ ပြောမယ်။ ကျွန်မ စကားလုံးတွေနဲ့ပေါ့။ တိုတိုတုတ်တုတ်ပဲ။', en: "I'll say only what I saw. In my words. Short.", need: 'own', face: 'think',
        tell: { my: 'စာရွက်အသစ် တစ်ရွက်ပေါ်မှာ စာတစ်ကြောင်းတည်းကို သူ ရေးနေပြီ။', en: 'She is writing a single line on a fresh sheet.' } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါ ဒီညနဲ့ ဘာမှ မဆိုင်ဘူး အစ်မရဲ့။', en: "…That's not about tonight, sister." },
    hot: { my: '(နေခြည် စာရွက်ကို လက်သီးထဲမှာ ဆုပ်ခြေလိုက်တယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(Nay Chi crumples the paper in her fist. Nothing gets through.)' },
    lean: { my: 'ဟုတ်ကဲ့… အစ်မ ပြောတဲ့အတိုင်းပါပဲ…', en: 'Okay… whatever you say…' },
  },
  decision: [
    { my: 'ကျွန်မ ကိုယ်တိုင် မြင်ခဲ့တာကို ကျွန်မ စကားလုံးတွေနဲ့ပဲ ပြောမယ်။', en: "I'll say what I saw myself, in my own words.", face: 'happy' },
    { my: 'အစ်မ၊ ပရိသတ် ကြားထဲကပဲ နားထောင်ပေးနော်။ အရှေ့ဆုံးက မဟုတ်ဘူးနော်။', en: 'Sister, listen from the crowd, all right? Not from the front.', face: 'happy' },
  ],
};
