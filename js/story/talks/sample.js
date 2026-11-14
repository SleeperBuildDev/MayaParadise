// A sample talk for dev/talk.html (not a chapter of the book; for previews only).
// Ko Phyo's tea stall lost its customers to a new stall next door. He starts hot, four stones, the last one is his
// (stepBack), the hand is bigger than four cards (it scrolls), and one card is inked gold (+2 stones).
export const SAMPLE_CARDS = [
  { id: 'glad', name: { my: 'ဝမ်းသာပေး', en: 'Glad for them' }, line: { my: 'သူတို့အတွက် ဝမ်းသာပေးလိုက်ရင် ရင်ထဲ ပေါ့သွားမယ်နော်။', en: "Be glad for them, and your chest gets lighter." }, answers: ['envy'] },
  { id: 'earth', name: { my: 'မြေကြီးလို', en: 'Like the earth' }, line: { my: 'မြေကြီးလို ခံနိုင်ရင် ပူတာ ငြိမ်သွားမယ်။', en: 'Hold it like the earth does, and the heat settles.' }, answers: ['hot', 'looksdown'] },
  { id: 'notyet', gold: true, name: { my: 'မဖြစ်သေးဘူး', en: 'Not yet' }, line: { my: 'မရဘူး မဟုတ်ဘူး။ မရသေးဘူး၊ ဒါပဲ။', en: "It's not 'can't'. It's 'not yet', that's all." }, answers: ['given', 'afraid'] },
  { id: 'letgo', name: { my: 'လွှတ်ပေး', en: 'Let it go' }, line: { my: 'အရင်ပုံစံကို လွှတ်ပေးမှ အသစ် ဝင်လာမှာပေါ့။', en: 'Let the old way go, and the new one can come in.' }, answers: ['cling'] },
  { id: 'love', name: { my: 'ဘာကို အချစ်ဆုံးလဲ', en: 'What do you love most?' }, line: { my: 'ဒီဆိုင်မှာ ဘာကို အချစ်ဆုံးလဲဟင်။', en: 'What do you love most about this stall?' }, answers: ['unknown'] },
  { id: 'lucky', lookalike: true, name: { my: 'ကံကောင်းလိုက်တာ', en: 'Lucky you!' }, line: { my: 'သူတို့ ကံကောင်းလိုက်တာနော်!', en: 'Lucky them, huh!' }, shows: ['envy'], really: { my: 'မနာလိုစိတ်ကို ချီးမွမ်းတာ', en: 'envy dressed as praise' },
    backfire: { they: { my: 'ဟုတ်တယ်! ကံကောင်းလို့ပဲ! ကျွန်တော်က ကံဆိုးတာ!', en: "Right! Just luck! And I'm the unlucky one!" }, maya: { my: '(မနာလိုစိတ်ကို ပိုမီးထိုးလိုက်မိပြီ။)', en: '(I just fed the envy.)' } } },
  { id: 'doit', lookalike: true, name: { my: 'ကျွန်မ လုပ်ပေးမယ်', en: 'Let me do it for you' }, line: { my: 'ကျွန်မ ဆိုင်ကို ပြင်ပေးမယ်လေ။', en: "I'll fix the stall for you." }, shows: ['given', 'unknown'], really: { my: 'ကူညီသလို အထင်သေးတာ', en: 'looking down that passes for help' },
    backfire: { they: { my: 'ကျွန်တော် ကိုယ်တိုင် မလုပ်နိုင်ဘူးလို့ ထင်လို့လား။', en: "You think I can't do it myself?" }, maya: { my: '(ကူညီတာ မဟုတ်ဘူး… သူ့ကို အထင်သေးလိုက်သလို ဖြစ်သွားပြီ။)', en: "(That wasn't help… it looked down on him.)" } } },
  { id: 'ignore', lookalike: true, name: { my: 'ဂရုမစိုက်နဲ့', en: 'Just ignore them' }, line: { my: 'ဘေးဆိုင်ကို ဂရုမစိုက်နဲ့။', en: 'Just ignore the stall next door.' }, shows: ['hot'], really: { my: 'အေးသလို ပိတ်ပယ်တာ', en: 'freezing out that passes for calm' },
    backfire: { they: { my: 'ဂရုမစိုက်ရအောင် ကျွန်တော့် ဖောက်သည်တွေပဲ!', en: "Ignore them? They're my customers!" }, maya: { my: '(ငြိမ်ခိုင်းတာက ပိုပူစေတယ်။)', en: '(Telling him to freeze them out made it hotter.)' } } },
  { id: 'hold', lookalike: true, name: { my: 'တင်းတင်း ဆုပ်ထား', en: 'Hold on tight' }, line: { my: 'အဖေ့ဆိုင်ကို ဘာမှ မပြောင်းနဲ့၊ တင်းတင်း ဆုပ်ထား။', en: "Don't change a thing in your father's stall. Hold on tight." }, shows: ['cling'], really: { my: 'ချစ်သလို တွယ်တာတာ', en: 'clinging that passes for love' },
    backfire: { they: { my: 'ဒါပေမဲ့… ဒီအတိုင်းဆို ဆိုင်ပိတ်ရမှာ…', en: "But… like this I'll have to close…" }, maya: { my: '(သူ ပိုတွယ်ကပ်သွားပြီ။)', en: '(He is clinging even harder now.)' } } },
];

export const TALK_SAMPLE = {
  id: 'sample-kophyo',
  person: 'kophyo',
  steam: 3,
  calm: 4,
  turns: 7,
  stepBack: true,
  hand: SAMPLE_CARDS.filter((c) => c.id !== 'ignore' && c.id !== 'love'), // seven cards: the hand of four scrolls
  stones: [
    { lines: [
      { my: 'ဘေးဆိုင်က ကျွန်တော့် ဖောက်သည်တွေ အကုန် ခေါ်သွားတယ်!', en: 'The stall next door took all my customers!', need: 'hot', face: 'hot', mood: 'hot', emote: 'fists', heard: true,
        tell: { my: 'လက်သီး ဆုပ်ထားတယ်။ ပြောချင်တာ အများကြီး ရှိနေတယ်။', en: 'Fists tight. He has a lot he needs to say.' } },
      { my: 'ကျွန်တော့် လက်ဖက်ရည်က ပိုကောင်းတာ သိလား!', en: 'My tea is better, you know!', need: 'envy', seems: 'hot', face: 'hot',
        tell: { my: 'ဒေါသ မဟုတ်ဘူး။ ဘေးဆိုင်ကို ခိုးကြည့်နေတယ်။ မနာလိုဖြစ်နေတာ။', en: "Not anger: he keeps glancing next door. It's envy." } },
    ] },
    { lines: [
      { my: 'သူ့ဆိုင်က ကံကောင်းလို့ပဲ။', en: "Their stall's just lucky.", need: 'envy', seems: 'looksdown', face: 'think',
        tell: { my: 'အထင်သေးတာ မဟုတ်ဘူး။ သူတို့လို ဖြစ်ချင်နေတာ။', en: "He isn't looking down on them. He wishes he were them." } },
      { my: 'ဒီလမ်းမှာ ကျွန်တော့်ကို ဘယ်သူမှ မလိုတော့ဘူး။', en: 'Nobody on this street needs me now.', need: 'given', heard: true, face: 'sad', mood: 'down' },
    ] },
    { lines: [
      { my: 'အရင်ကလို ပြန်ဖြစ်ချင်တယ်။ ဒီဆိုင်က အဖေ့ဆိုင်။', en: 'I want it the way it was. This was my father\'s stall.', need: 'cling', face: 'sad', heard: true },
      { my: 'ဆိုင်ပိတ်ရမလား မသိဘူး။', en: "I don't know if I should close.", need: 'unknown', seems: 'given', face: 'worried',
        tell: { my: 'လက်လျှော့တာ မဟုတ်ဘူး။ ကောင်တာကို လက်နဲ့ သုတ်နေတယ်။ မဆုံးဖြတ်နိုင်သေးတာ။', en: "Not giving up: he's still wiping the counter. He just can't decide." } },
      { my: 'တစ်ခုခု ပြောင်းရင် အကုန် ပျက်သွားမှာ ကြောက်တယ်။', en: "I'm scared that if I change anything it'll all fall apart.", need: 'afraid', seems: 'cling', face: 'worried' },
    ] },
    { lines: [
      { my: '…ဒါဆို ကျွန်တော် ဘာလုပ်သင့်လဲ။', en: '…So what should I do?', need: 'own', seems: 'unknown', face: 'think',
        tell: { my: 'သူ့ အဖြေက သူ့ဆီမှာ ရှိပြီးသား။ မျက်လုံးက လက်ဖက်ရည်အိုးဆီ ရောက်နေတယ်။', en: 'His answer is already with him. His eyes are on his teapot.' } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါ မဟုတ်ဘူး။', en: "…That's not it." },
    hot: { my: '(ကိုဖြိုး ဒေါသနဲ့ မကြားဘူး။)', en: "(Ko Phyo is too hot to hear it.)" },
    lean: { my: 'ဟုတ်လား… ဒါဆို မာရာ ပြောသလို လုပ်မယ်…', en: "Really… then I'll do what you say…" },
  },
  decision: [
    { my: 'မနက်ဖြန် ကျွန်တော့် လက်ဖက်ရည် တစ်ခွက် ဘေးဆိုင်ကို သွားတိုက်မယ်။', en: "Tomorrow I'll take a cup of my tea next door.", face: 'happy' },
    { my: 'ပြီးမှ ကိုယ့်ဆိုင်ကို ကိုယ့်နည်းနဲ့ ပြန်ပြင်မယ်။', en: "Then I'll fix my own stall, my own way.", face: 'happy' },
  ],
};
