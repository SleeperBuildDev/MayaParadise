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
  { id: 'burn', flag: 'd11.p1', name: { my: 'ကိုယ်အရင် လောင်', en: 'You burn first' },
    line: { my: 'ပူတဲ့စာကို ကိုင်ကြည့်တာနဲ့ ကိုယ့်လက် အရင် ပူတယ်။ ဒေါ်ခင်မေ ကိုယ်တိုင် ပြခဲ့တာ။', en: 'Just holding a hot note burns your own hand first. Daw Khin May showed me.' },
    answers: ['hot'], from: { my: 'စာတို ၁', en: 'note 1' } },
  { id: 'weigh', flag: 'd11.p7', name: { my: 'တစ်ခုချင်း ချိန်ကြည့်', en: 'Weigh each one' },
    line: { my: 'လူကြိုက်များတာနဲ့ ပြောသမျှ မှန်တာ မဟုတ်ဘူး။ တစ်ခုချင်း ကိုယ်တိုင် ချိန်ကြည့်ရတယ်။', en: "Being liked doesn't make everything said right. Each thing gets weighed, by you." },
    answers: ['unknown'], from: { my: 'စာတို ၇', en: 'note 7' } },
  // the temptation, kept early so it sits in the first hand: every word is right, and it is still Maya deciding for her
  { id: 'answer', lookalike: true, name: { my: 'ကျွန်မ ပြောမယ်', en: "I'll tell you" },
    line: { my: 'ဖဲကြိုး မပေးနဲ့။ ဒေါ်ငြိမ်းဆီ သွားပြီး တိုးတိုးလေး ပြောလိုက်။ ဒါပဲ။', en: "Don't give the ribbon. Go to Daw Nyein and tell her quietly. That's all." },
    shows: ['unknown', 'cling'], really: { my: 'သူ့အစား ဆုံးဖြတ်ပေးတာ', en: 'deciding for her' },
    backfire: { they: { my: 'ဟုတ်ကဲ့… အစ်မ ပြောတဲ့အတိုင်း။ (ခဲတံနဲ့ ချရေးတယ်။)', en: 'Okay… just as you say. (She writes it on her pad.)' },
      maya: { my: '(စကားက မှန်တယ်။ ဒါပေမဲ့ ကျွန်မရဲ့ ဆုံးဖြတ်ချက် ဖြစ်သွားပြီ။)', en: "(The words are right. But now it's my decision, not hers.)" } } },
  { id: 'standard', flag: 'd11.p6', name: { my: 'သတ်မှတ်ထားတာ မလျှော့နဲ့', en: 'Keep what you set' },
    line: { my: 'ချယ်ရီ တစ်ယောက်တည်း ဆိုခဲ့တာ မြင်လား။ ကိုယ်သတ်မှတ်ထားတာကို လူများလို့ မလျှော့ခဲ့ဘူး။', en: "Did you see Cherry sing alone? She didn't lower what she'd set because of the crowd." },
    answers: ['afraid'], from: { my: 'စာတို ၆', en: 'note 6' } },
  // ch 7 Cool Cloud, worded as Day 9 words it ("goodwill doesn't burn")
  { id: 'cool', companion: 'cloud', name: { my: 'စေတနာက မပူဘူး', en: "Goodwill doesn't burn" },
    line: { my: 'ဒေါ်ငြိမ်းကို ကောင်းစေချင်တာ အစစ်ဆိုရင် နံရံရဲ့ အပူကို ငှားစရာ မလိုဘူး။', en: "If you truly wish Daw Nyein well, you don't need to borrow the wall's heat." },
    answers: ['hot'], from: { my: 'တိမ်အေး', en: 'the Cool Cloud' } },
  // ch 15 Two-Seat Bench, new today (pencil), Day 14's wording; fits her fear, which she has not said yet
  { id: 'bench', companion: 'bench', name: { my: 'ပြောပါ၊ နားထောင်နေတယ်', en: "Say it, I'm listening" },
    line: { my: 'ဘာကို အကြောက်ဆုံးလဲ ပြောပါ။ အစ်မ နားထောင်နေတယ်။', en: "Tell me what scares you most. I'm listening." },
    answers: ['afraid'], from: { my: 'ခုံတန်းလေး', en: 'the Two-Seat Bench' } },
  // ch 17 Sound-Asleep Cat, new today (pencil): a true page that fits nothing today (review: let true pages miss)
  { id: 'sleep', companion: 'cat', name: { my: 'မနက်ဖြန် ကြည့်ရဲမလား', en: 'Can you face yourself tomorrow?' },
    line: { my: 'ဘယ်လိုပဲ လုပ်လုပ်၊ မနက်ဖြန် ကိုယ့်ကိုယ်ကို ကြည့်ရဲရင် ပြီးတာပဲ။', en: 'Whatever you do, as long as you can look at yourself tomorrow.' },
    answers: [], miss: { my: '…မနက်ဖြန် မဟုတ်သေးဘူး အစ်မ။ ကျွန်မ ကြောက်နေတာက ဒီည နံရံကို။', en: "…It isn't tomorrow yet, sister. What scares me is the wall tonight." },
    from: { my: 'အိပ်ပျော်ကြောင်', en: 'the Sound-Asleep Cat' } },
  { id: 'seven', companion: 'caterpillar', name: { my: 'မယုံနဲ့ဦး', en: "Don't believe it yet" }, // ch 12 Seven-Ring Caterpillar
    line: { my: 'ကြားရတိုင်း မယုံနဲ့ဦး။ ကိုယ်တိုင် စစ်ကြည့်ပါ။', en: "Don't believe it just because you heard it. Check it yourself." },
    answers: ['unknown'], from: { my: 'ခုနစ်ဆစ်ပိုး', en: 'the Seven-Ring Caterpillar' } },
  { id: 'key', companion: 'key', name: { my: 'သော့က ကိုယ့်လက်ထဲ', en: 'The key is yours' }, // ch 11 Little Key
    line: { my: 'နေခြည့်သော့ နေခြည့်လည်ပင်းမှာ ရှိတယ်လေ။ ကျွန်မလက်ထဲမှာ မဟုတ်ဘူး။', en: 'Your key hangs round your own neck, Nay Chi. Not in my hand.' },
    answers: ['cling'], from: { my: 'သော့လေး', en: 'the Little Key' } },
  { id: 'tendril', companion: 'tendril', name: { my: 'ထိပြီးရင် လွှတ်', en: 'Touch, then let go' }, // ch 16 Tendril, new today, pencil
    line: { my: 'ကျွန်မ ဘေးမှာ ရှိတယ်။ ဒါပေမဲ့ နေခြည့်ကို မနွယ်ဘူး။', en: "I'm beside you. But I won't wind round you." },
    answers: ['cling'], from: { my: 'နွယ်ညွန့်လေး', en: 'the Tendril' } },
  { id: 'once', companion: 'sheep', name: { my: 'နောက်တစ်ခါ', en: 'Once more' }, // ch 1 Black Sheep (line per the review: apart from the crowd, in a good way)
    line: { my: 'အုပ်စုနဲ့ မတူတာ ကောင်းတဲ့ဘက်မှာဆို ရပါတယ်။ မှားရင် နောက်တစ်ခါ ပြန်ကြိုးစားရုံပဲ။', en: "Standing apart from the crowd is fine when it's the good side. If you get it wrong, just try once more." },
    answers: ['given', 'afraid'], from: { my: 'သိုးမည်းလေး', en: 'the Black Sheep' } },
  // pencil look-alike from an unchecked rumour (review: player audit); only while d11.rumour.wall is unchecked
  { id: 'pins', lookalike: true, pencil: true, rumour: 'wall', unless: 'd11.rumour.wall', name: { my: 'လူတိုင်း ကပ်ထားတာပဲ', en: 'Everyone pinned it' },
    line: { my: 'လူသုံးဆယ်လောက် ပင်ထိုးထားတာ မှန်လို့နေမှာပေါ့။', en: 'Thirty people pinned it. It must be right.' },
    shows: ['unknown'], really: { my: 'မစစ်ရသေးတာကို ဆင့်ပြောတာ', en: 'passing on what nobody checked' },
    backfire: { they: { my: 'ဒါဆို… ကိုဒိုးကို ပေးရမှာပေါ့။ (ဖဲကြိုးကို ထုတ်တယ်။)', en: 'Then… I have to give it to Ko Doe. (She takes out the ribbon.)' },
      maya: { my: '(ပင်ရေက အမှန်ကို မတိုင်းဘူး။)', en: "(Counting pins doesn't measure what's true.)" } } },
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
      { my: 'ဆိုင်းဘုတ်က တစ်ပတ်လုံး မှားနေတာ။ လူတိုင်း ရယ်နေကြတယ်။ ကျွန်မလည်း စိတ်ညစ်လာပြီ။', en: "That sign's been wrong all week. Everyone's laughing. I'm fed up too.", need: 'hot', seems: 'looksdown', face: 'hot', steam: 1,
        tell: { my: 'ဒေါ်ငြိမ်းကို အထင်သေးတာ မဟုတ်ဘူး။ သူ့ မီးအိမ်လေးတွေကို ခဏခဏ လှမ်းကြည့်နေတယ်။ ချစ်လို့ စိတ်တိုနေတာ။', en: "She doesn't look down on Daw Nyein. She keeps glancing at the little lamps. She's cross because she's fond of her." } },
      { my: 'ဒီလောက် မှားတာ ဖဲကြိုး ထိုက်တယ်တဲ့။ ကိုဒိုး ပြောတာ။', en: 'A mistake that big deserves the ribbon, Ko Doe says.', need: 'hot', face: 'think', heard: true },
    ] },
    { lines: [
      { my: 'ကိုဒိုးစာမှာ ပင် သုံးဆယ်။ လူသုံးဆယ်လုံး မှားနေမှာလား။', en: "Thirty pins on Ko Doe's note. Can thirty people all be wrong?", need: 'unknown', seems: 'envy', face: 'think',
        tell: { my: 'ကိုဒိုးရဲ့ ပင်တွေကို မနာလိုတာ မဟုတ်ဘူး။ ပင်များတာနဲ့ မှန်သလား တကယ် မသိလို့ ရေတွက်နေတာ။', en: "Not envy of his pins. She's counting them because she truly doesn't know if many pins make it right." } },
      { my: 'အမှားကို လူတိုင်းမြင်အောင် ကပ်ထားတာနဲ့ သူ့ကို ပြောတာနဲ့ အတူတူပဲလား။', en: 'Pinning a mistake up for everyone… is that the same as telling her?', need: 'unknown', face: 'think' },
    ] },
    { lines: [
      { my: 'အစ်မ ပြောပါ။ အစ်မက အမြဲ သိတာပဲ။', en: 'Just tell me, sister. You always know.', need: 'cling', seems: 'unknown', face: 'worried',
        tell: { my: 'သူ မသိတာ မဟုတ်ဘူး။ လည်ပင်းက သော့ကြိုးကို လက်မနဲ့ ပွတ်နေတယ်။ သူ့သော့ သူ့ဆီမှာ ရှိတယ်။', en: "It isn't that she doesn't know. Her thumb rubs the key string at her neck. Her key is with her." } },
      { my: 'ဖဲကြိုး ဖြုတ်ချလိုက်ရင်… နောက်တစ်စောင်က ကျွန်မအကြောင်း ဖြစ်လာမှာ။', en: 'If I take the ribbon down… the next note will be about me.', need: 'afraid', seems: 'hot', face: 'worried',
        tell: { my: 'ကိုဒိုးကို ဒေါသ မဟုတ်ဘူး။ နံရံပေါ် ကိုယ့်နာမည် ရောက်မှာကို ကြောက်နေတာ။', en: "Not anger at Ko Doe. She's afraid of her own name going up on the wall." } },
    ] },
    { lines: [
      { my: '…စာလုံးက တကယ် မှားနေတာပဲ။ တစ်ယောက်ယောက် ပြောပေးရမယ်။ တိုးတိုးလေး။ နံရံပေါ်မှာ မဟုတ်ဘဲ။', en: '…The letter really is wrong. Someone should tell her. Quietly. Not on the wall.', need: 'own', face: 'think',
        tell: { my: 'ဒါ သူ့ဟာ။ အခု ကျွန်မ ဘာပြောပြော ကျွန်မ ဆုံးဖြတ်ချက် ဖြစ်သွားမယ်။', en: 'This one is hers. Anything I say now becomes my decision.' } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါက ဖဲကြိုးနဲ့ ဘာဆိုင်လို့လဲ အစ်မ။', en: "…What's that got to do with the ribbon, sister?" },
    hot: { my: '(နေခြည် ဖဲကြိုးကို ဆုပ်ထားပြီး ကိုဒိုးဘက် လှည့်ကြည့်နေတယ်။ ဘာမှ မကြားဘူး။)', en: '(Nay Chi grips the ribbon, glaring toward Ko Doe. Nothing gets through.)' },
    lean: { my: 'အင်း… အစ်မ ပြောတာ မှန်မှာပါ။ အဲဒီအတိုင်း လုပ်မယ်။', en: "Mm… you'll be right. I'll do it your way." },
  },
  decision: [
    { my: 'ဒီအပတ် ဖဲကြိုး ဘယ်သူ့မှ မပေးဘူး။ နံရံကို စောင့်တာ ကျွန်မ။', en: "No ribbon for anyone this week. I'm the one who keeps this wall.", face: 'think' },
    { my: 'ဒေါ်ငြိမ်းဆီ ကျွန်မ ကိုယ်တိုင် သွားပြောမယ်။ သူ တစ်ယောက်တည်းကိုပဲ။', en: "I'll go and tell Daw Nyein myself. Just her.", face: 'happy' },
  ],
};

// After the talk (day11.js plays these): a lean on her last stone, then her "not yet"
export const D11_NC_AFTER = {
  leanMaya: [{ my: '(မှန်တာ ပြောလိုက်မိပြီ… ဒါပေမဲ့ သူ့နေရာကနေ ပြောလိုက်တာ။)', en: '(I said the right thing… from her place, not mine.)' }],
  notYet: [{ my: 'ခဏ… ကိုယ့်ဘာသာ စဉ်းစားပါရစေဦး။', en: 'Wait… let me think on my own a bit.' }],
};
