// Day 11's talk: Nay Chi and the critic ribbon (day11-spec 5.4a). Format: see the top of js/story/talk.js.
// It is a quiet talk at the tea-shop corner table (room `hearthtea`), away from the Note Wall: the setting
// itself is the book's "quietly" (ch 18 p86). The last stone is HERS (stepBack: true): no card moves it;
// any card played there answers for her (she leans: "not yet"). The temptation is a look-alike whose words
// are right: Maya's own answer, which would still be Maya deciding for her.
//
// Cards earned today carry `flag` (talk.js drops a card whose piece is not done yet); companions always
// stay in the hand, so the talk can always be won. `pins` is the pencil look-alike from the unchecked
// rumour `wall` (gone once the rumour is checked).
// Burmese lines are drafts for Maya to proofread.

export const D11_NC_CARDS = [
  { id: 'burn', flag: 'd11.p1', name: { my: 'ကိုယ် အရင် ပူလောင်ရတယ်', en: 'You burn first' },
    line: { my: 'ပူလောင်တဲ့ စာရွက်လေးကို ကိုင်ထားရုံနဲ့ ကိုယ့်လက် အရင် လောင်တာပဲ။ ဒေါ်ခင်မေ ငါ့ကို ပြပေးခဲ့တာ။', en: 'Just holding a hot note burns your own hand first. Daw Khin May showed me.' },
    answers: ['hot'], from: { my: 'မှတ်စု ၁', en: 'note 1' } },
  { id: 'weigh', flag: 'd11.p7', name: { my: 'တစ်ခုချင်းစီကို ချိန်ဆပါ', en: 'Weigh each one' },
    line: { my: 'လူချစ်လူခင် များတိုင်း ပြောသမျှ အကုန် မှန်နေတာ မဟုတ်ဘူး။ တစ်ခုချင်းစီကို နင်ကိုယ်တိုင် ချိန်ဆရမှာ။', en: "Being liked doesn't make everything said right. Each thing gets weighed, by you." },
    answers: ['unknown'], from: { my: 'မှတ်စု ၇', en: 'note 7' } },
  // the temptation, kept early so it sits in the first hand: every word is right, and it is still Maya deciding for her
  { id: 'answer', lookalike: true, name: { my: 'ငါ ပြောပြမယ်', en: "I'll tell you" },
    line: { my: 'ဖဲကြိုး မပေးနဲ့တော့။ ဒေါ်ငြိမ်းဆီ သွားပြီး တိုးတိုးလေး ပြောပြလိုက်။ ဒါပဲ။', en: "Don't give the ribbon. Go to Daw Nyein and tell her quietly. That's all." },
    shows: ['unknown', 'cling'], really: { my: 'သူ့အစား ဆုံးဖြတ်ပေးမိတာ', en: 'deciding for her' },
    backfire: { they: { my: 'ဟုတ်ကဲ့… အစ်မ ပြောတဲ့အတိုင်းပါပဲ။ (မှတ်စုစာအုပ်ပေါ်မှာ ရေးမှတ်လိုက်တယ်။)', en: 'Okay… just as you say. (She writes it on her pad.)' },
      maya: { my: '(စကားလုံးတွေက မှန်ပါတယ်။ ဒါပေမဲ့ အခုတော့ သူ့ဆုံးဖြတ်ချက် မဟုတ်တော့ဘဲ ငါ့ဆုံးဖြတ်ချက် ဖြစ်သွားပြီ။)', en: "(The words are right. But now it's my decision, not hers.)" } } },
  { id: 'standard', flag: 'd11.p6', name: { my: 'ကိုယ်သတ်မှတ်ထားတာကို ထိန်းထားပါ', en: 'Keep what you set' },
    line: { my: 'ချယ်ရီ တစ်ယောက်တည်း သီချင်းဆိုတာ မြင်လိုက်လား။ လူအုပ်ကြီးကြောင့် သူ သတ်မှတ်ထားတဲ့ အဆင့်ကို လျှော့မချခဲ့ဘူး။', en: "Did you see Cherry sing alone? She didn't lower what she'd set because of the crowd." },
    answers: ['afraid'], from: { my: 'မှတ်စု ၆', en: 'note 6' } },
  // ch 7 Cool Cloud, worded as Day 9 words it ("goodwill doesn't burn")
  { id: 'cool', companion: 'cloud', name: { my: 'စေတနာက ပူလောင်မှု မရှိဘူး', en: "Goodwill doesn't burn" },
    line: { my: 'ဒေါ်ငြိမ်းကို တကယ် စေတနာထားတယ်ဆိုရင် နံရံပေါ်က အပူတွေကို ငှားသုံးစရာ မလိုပါဘူး။', en: "If you truly wish Daw Nyein well, you don't need to borrow the wall's heat." },
    answers: ['hot'], from: { my: 'တိမ်အေး', en: 'the Cool Cloud' } },
  // ch 15 Two-Seat Bench, new today (pencil), Day 14's wording; fits her fear, which she has not said yet
  { id: 'bench', companion: 'bench', name: { my: 'ပြောပြပါ၊ ငါ နားထောင်နေတယ်', en: "Say it, I'm listening" },
    line: { my: 'အကြောက်ဆုံးက ဘာလဲ ပြောပြပါ။ ငါ နားထောင်နေတယ်။', en: "Tell me what scares you most. I'm listening." },
    answers: ['afraid'], from: { my: 'နှစ်ယောက်ထိုင် ခုံတန်းလေး', en: 'the Two-Seat Bench' } },
  // ch 17 Sound-Asleep Cat, new today (pencil): a true page that fits nothing today (review: let true pages miss)
  { id: 'sleep', companion: 'cat', name: { my: 'မနက်ဖြန်ကျရင် ကိုယ့်ကိုယ်ကိုယ် ရင်ဆိုင်ရဲပါ့မလား', en: 'Can you face yourself tomorrow?' },
    line: { my: 'ဘာပဲလုပ်လုပ် မနက်ဖြန်ကျရင် ကိုယ့်ကိုယ်ကိုယ် မရှက်မကြောက် ပြန်ကြည့်ရဲဖို့ပဲ အရေးကြီးတယ်။', en: 'Whatever you do, as long as you can look at yourself tomorrow.' },
    answers: [], miss: { my: '…မနက်ဖြန် မရောက်သေးဘူး အစ်မရဲ့။ ကျွန်မ ကြောက်နေတာ ဒီည နံရံကြီးကိုပါ။', en: "…It isn't tomorrow yet, sister. What scares me is the wall tonight." },
    from: { my: 'နှစ်နှစ်ခြိုက်ခြိုက် အိပ်ပျော်နေတဲ့ ကြောင်လေး', en: 'the Sound-Asleep Cat' } },
  { id: 'seven', companion: 'caterpillar', name: { my: 'မယုံလိုက်ပါနဲ့ဦး', en: "Don't believe it yet" }, // ch 12 Seven-Ring Caterpillar
    line: { my: 'ကြားရုံနဲ့ မယုံလိုက်ပါနဲ့ဦး။ ကိုယ်တိုင် စစ်ဆေးကြည့်ပါဦး။', en: "Don't believe it just because you heard it. Check it yourself." },
    answers: ['unknown'], from: { my: 'အရစ်ခုနစ်ရစ် ပိုးကောင်လေး', en: 'the Seven-Ring Caterpillar' } },
  { id: 'key', companion: 'key', name: { my: 'သော့က နင့်အပိုင်ပါ', en: 'The key is yours' }, // ch 11 Little Key
    line: { my: 'နင့်သော့က နင့်လည်ပင်းမှာပဲ ဆွဲထားတာ နေခြည်။ ငါ့လက်ထဲမှာ မဟုတ်ဘူး။', en: 'Your key hangs round your own neck, Nay Chi. Not in my hand.' },
    answers: ['cling'], from: { my: 'သော့သေးသေးလေး', en: 'the Little Key' } },
  { id: 'tendril', companion: 'tendril', name: { my: 'ထိကြည့်ပြီး လွှတ်လိုက်ပါ', en: 'Touch, then let go' }, // ch 16 Tendril, new today, pencil
    line: { my: 'ငါ နင့်ဘေးမှာ ရှိနေတယ်။ ဒါပေမဲ့ နင့်ကို လာမရစ်ပတ်ပါဘူး။', en: "I'm beside you. But I won't wind round you." },
    answers: ['cling'], from: { my: 'နွယ်ပင်လေး', en: 'the Tendril' } },
  { id: 'once', companion: 'sheep', name: { my: 'နောက်တစ်ခေါက်', en: 'Once more' }, // ch 1 Black Sheep (line per the review: apart from the crowd, in a good way)
    line: { my: 'ကောင်းတဲ့ဘက်က ရပ်တည်တာဆိုရင် လူအုပ်ကြီးနဲ့ ကွဲထွက်နေလည်း ကိစ္စမရှိပါဘူး။ မှားသွားရင် နောက်တစ်ခေါက် ထပ်ကြိုးစားကြည့်ရုံပေါ့။', en: "Standing apart from the crowd is fine when it's the good side. If you get it wrong, just try once more." },
    answers: ['given', 'afraid'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  // pencil look-alike from an unchecked rumour (review: player audit); only while d11.rumour.wall is unchecked
  { id: 'pins', lookalike: true, pencil: true, rumour: 'wall', unless: 'd11.rumour.wall', name: { my: 'အားလုံးက ထောက်ခံမဲ ပေးထားကြတာ', en: 'Everyone pinned it' },
    line: { my: 'လူသုံးဆယ်တောင် ပင်အပ်ထိုး ထောက်ခံထားတာ။ မှန်မှာပါပဲ။', en: 'Thirty people pinned it. It must be right.' },
    shows: ['unknown'], really: { my: 'ဘယ်သူမှ မစစ်ဆေးထားတာကို လက်ဆင့်ကမ်းမိတာ', en: 'passing on what nobody checked' },
    backfire: { they: { my: 'ဒါဆို… ကိုဒိုးကို ပေးရတော့မှာပေါ့။ (ဖဲကြိုးကို ထုတ်လိုက်တယ်။)', en: 'Then… I have to give it to Ko Doe. (She takes out the ribbon.)' },
      maya: { my: '(ပင်အပ် အရေအတွက် ရေတွက်နေရုံနဲ့ အမှန်တရားကို တိုင်းတာလို့ မရဘူး။)', en: "(Counting pins doesn't measure what's true.)" } } },
];

export const TALK_D11_NAYCHI = {
  id: 'd11-naychi',
  person: 'naychi',
  with: [], // the talk is at the tea table; Ko Doe is outside (his call through the window comes before it)
  steam: 1, calm: 4, turns: 7,
  stepBack: true, // the last stone is hers
  hand: D11_NC_CARDS,
  stones: [
    { lines: [
      { my: 'အဲဒီဆိုင်းဘုတ်က တစ်ပတ်လုံး မှားနေတာ။ အားလုံးက ဝိုင်းရယ်နေကြပြီ။ ကျွန်မလည်း စိတ်ပျက်နေပြီ။', en: "That sign's been wrong all week. Everyone's laughing. I'm fed up too.", need: 'hot', seems: 'looksdown', face: 'hot', steam: 1,
        tell: { my: 'ဒေါ်ငြိမ်းကို အထင်သေးနေတာ မဟုတ်ဘူး။ မီးအိမ်သေးသေးလေးတွေကို လှမ်းလှမ်းကြည့်နေတယ်။ ဒေါ်ငြိမ်းကို ချစ်ခင်လွန်းလို့ စိတ်တိုနေတာ။', en: "She doesn't look down on Daw Nyein. She keeps glancing at the little lamps. She's cross because she's fond of her." } },
      { my: 'ဒီလောက် ကြီးမားတဲ့ အမှားမျိုးက ဖဲကြိုး ရသင့်တယ်လို့ ကိုဒိုး ပြောတယ်။', en: 'A mistake that big deserves the ribbon, Ko Doe says.', need: 'hot', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'ကိုဒိုးရဲ့ စာရွက်မှာ ပင်အပ် သုံးဆယ်တောင် ရှိတယ်။ လူသုံးဆယ်လုံး မှားနိုင်ပါ့မလား။', en: "Thirty pins on Ko Doe's note. Can thirty people all be wrong?", need: 'unknown', seems: 'envy', face: 'think',
        tell: { my: 'သူ့ပင်အပ်တွေကို မနာလို ဖြစ်နေတာ မဟုတ်ဘူး။ ပင်အပ် များတိုင်း မှန်သလား ဆိုတာကို သူ တကယ် မသိလို့ ရေတွက်နေတာ။', en: "Not envy of his pins. She's counting them because she truly doesn't know if many pins make it right." } },
      { my: 'အားလုံးမြင်အောင် အမှားကို နံရံပေါ် ကပ်လိုက်တာက… သူ့ကို သွားပြောပြတာနဲ့ အတူတူပဲလား။', en: 'Pinning a mistake up for everyone… is that the same as telling her?', need: 'unknown', face: 'think' },
    ] },
    { lines: [
      { my: 'ပြောသာပြောပြပါ အစ်မရယ်။ အစ်မက အမြဲ သိနေတာပဲ။', en: 'Just tell me, sister. You always know.', need: 'cling', seems: 'unknown', face: 'worried',
        tell: { my: 'သူ မသိတာ မဟုတ်ဘူး။ လက်မက လည်ပင်းက သော့ကြိုးလေးကို ပွတ်သပ်နေတယ်။ သူ့သော့က သူ့ဆီမှာ ရှိပြီးသား။', en: "It isn't that she doesn't know. Her thumb rubs the key string at her neck. Her key is with her." } },
      { my: 'ကျွန်မ ဖဲကြိုးကို ဖြုတ်ချလိုက်ရင်… နောက်တစ်စောင်က ကျွန်မအကြောင်း ဖြစ်လာလိမ့်မယ်။', en: 'If I take the ribbon down… the next note will be about me.', need: 'afraid', seems: 'hot', face: 'worried',
        tell: { my: 'ကိုဒိုးကို ဒေါသထွက်နေတာ မဟုတ်ဘူး။ နံရံပေါ်မှာ သူ့နာမည် တက်လာမှာကို ကြောက်နေတာ။', en: "Not anger at Ko Doe. She's afraid of her own name going up on the wall." } },
    ] },
    { lines: [
      { my: '…စာလုံးက တကယ် မှားနေတာ။ တစ်ယောက်ယောက်တော့ သူ့ကို ပြောပြသင့်တယ်။ တိုးတိုးတိတ်တိတ်ပေါ့။ နံရံပေါ်မှာ မဟုတ်ဘူး။', en: '…The letter really is wrong. Someone should tell her. Quietly. Not on the wall.', need: 'own', face: 'think',
        tell: { my: 'ဒီတစ်ခုက သူ့အပိုင်းပဲ။ အခု ငါ ဘာပဲပြောပြော ငါ့ဆုံးဖြတ်ချက် ဖြစ်သွားလိမ့်မယ်။', en: 'This one is hers. Anything I say now becomes my decision.' } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါ ဖဲကြိုးနဲ့ ဘာဆိုင်လို့လဲ အစ်မရဲ့။', en: "…What's that got to do with the ribbon, sister?" },
    hot: { my: '(နေခြည် ဖဲကြိုးကို ကျစ်ကျစ်ပါအောင် ဆုပ်ပြီး ကိုဒိုးဘက်ကို စိုက်ကြည့်နေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(Nay Chi grips the ribbon, glaring toward Ko Doe. Nothing gets through.)' },
    lean: { my: 'အင်း… အစ်မ ပြောတာ မှန်မှာပါ။ အစ်မ နည်းအတိုင်းပဲ လုပ်လိုက်မယ်။', en: "Mm… you'll be right. I'll do it your way." },
  },
  decision: [
    { my: 'ဒီအပတ် ဘယ်သူ့ကိုမှ ဖဲကြိုး မပေးတော့ဘူး။ ဒီနံရံကို ထိန်းသိမ်းရတာ ကျွန်မပဲ။', en: "No ribbon for anyone this week. I'm the one who keeps this wall.", face: 'think' },
    { my: 'ဒေါ်ငြိမ်းကို ကျွန်မကိုယ်တိုင် သွားပြောပြလိုက်မယ်။ သူ တစ်ယောက်တည်းကိုပဲပေါ့။', en: "I'll go and tell Daw Nyein myself. Just her.", face: 'happy' },
  ],
};

// After the talk (day11.js plays these): a lean on her last stone, then her "not yet"
export const D11_NC_AFTER = {
  leanMaya: [{ my: '(မှန်ကန်တာကို ငါ ပြောလိုက်မိတယ်… သူ့နေရာကနေ ပြောလိုက်တာ၊ ငါ့နေရာက မဟုတ်ဘူး။)', en: '(I said the right thing… from her place, not mine.)' }],
  notYet: [{ my: 'ခဏနေဦး… ကျွန်မဘာသာ နည်းနည်း စဉ်းစားပါရစေဦး။', en: 'Wait… let me think on my own a bit.' }],
};
