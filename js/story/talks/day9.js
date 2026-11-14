// Day 9's talks (day9-spec 5.3, 6.5, 6.6). Format: see the top of js/story/talk.js.
// Every Burmese line is a draft for Maya to proofread.
//
//   TALK_D9_KHINMAY   ch 14 · Daw Khin May on the flour bin in the bakery: "rough mouth, good heart" is a cover;
//                     the one who burns first is the teacher, then the heat strikes the pupil. Her last stone is
//                     hers (Step back). From Day 9 the Listen button reads Ask, and lines carry the question asked.
//   TALK_D9_ARKAR     ch 15 · Ei Mon sits with Maung Arkar in the back yard (`by: 'eimon'`): her advice is face down
//                     until he has finished (stones 0-2: only Ask moves him). His last stone is his.
//   TALK_D9_SQUABBLE  ch 15 · their first squabble at the cart: two voices (`who` per line), no side taken, the last
//                     two stones are theirs: each mends their own tone.

// ---------------------------------------------------------------------------------------------
// ch 14 · Daw Khin May
// ---------------------------------------------------------------------------------------------
export const D9_KM_CARDS = [
  { id: 'care', name: { my: 'သူ့အတွက် ကြောက်တာ', en: 'Afraid for him' },
    line: { my: 'ဒေါ်ဒေါ် အာကာ့လက်ကို မီးဖိုတံခါးနားက ဆွဲထုတ်လိုက်တာ မြင်တယ်။ တကယ် ကြောက်နေတာ သူ့အတွက်ပဲ။', en: "I saw you pull Arkar's hand back from the oven door. What you're really afraid of is for him." },
    answers: ['afraid'], from: { my: 'မီးဖိုတံခါးမှာ မြင်ခဲ့တာ', en: 'seen at the oven door' } },
  { id: 'heatfirst', name: { my: 'အပူ အရင်စတဲ့နေရာ', en: 'Where the heat starts' },
    line: { my: 'ဗန်းနောက်ကျတာ မြင်တာနဲ့ ဒေါ်ဒေါ် အရင် ပူလာတာ ကျွန်မ မြင်လိုက်တယ်။ အော်သံ မထွက်ခင်ကတည်းက။', en: 'I saw you heat up first, the moment the tray was late. Before a word came out.' },
    answers: ['hot'], from: { my: 'ဗန်းတစ်ဗန်း ကြည့်ပြီး ရခဲ့တာ', en: 'from watching one tray' } },
  { id: 'why', name: { my: 'ဘာကြောင့်လဲ', en: 'Ask why' }, companion: 'parrot', // the Why-Parrot (ch 3)
    line: { my: 'အာကာ ဘယ်အချိန်မှာ အမြန်ဆုံး တတ်သွားလဲ ဒေါ်ဒေါ် သတိထားမိလား။ ဘာကြောင့် ဖြစ်မလဲ။', en: 'Have you noticed when Arkar picks things up fastest, Aunty? Why then, do you think?' }, // an open question; no hint that shouting fails (p74 grants it works)
    answers: ['unknown'], from: { my: 'ဘာကြောင့်ကြက်တူရွေး', en: 'the Why-Parrot' } },
  { id: 'otherside', name: { my: 'ဟိုဘက်က ကြည့်ရင်', en: 'From the other side' }, companion: 'beetle', // the Six-Nine Beetle (ch 13), new today
    line: { my: 'ဒေါ်ဒေါ့်ဘက်ကတော့ စိတ်ပူလို့ အော်တာ။ အာကာ့ဘက်ကနေ ကြားရတာက ဘယ်လိုလဲ မသိဘူးနော်။', en: "From your side it's worry. I wonder how it sounds from Arkar's side." },
    answers: ['unknown', 'cling'], from: { my: '၆-၉ ပိုး', en: 'the Six-Nine Beetle' } },
  { id: 'cool', name: { my: 'စေတနာက မပူဘူး', en: "Goodwill doesn't burn" }, companion: 'cloud', // the Cool Cloud (ch 7)
    line: { my: 'အာကာ့အပေါ် စေတနာက အစစ်ပါ။ အစစ်ဆိုတော့ အော်သံနဲ့ ကာပေးစရာ မလိုဘူးလေ။', en: "Your goodwill for Arkar is real. Being real, it doesn't need the shouting to guard it." },
    answers: ['cling', 'hot'], from: { my: 'တိမ်အေး', en: 'the Cool Cloud' } },
  { id: 'goodheart', lookalike: true, name: { my: 'စိတ်ရင်းကောင်းတာပဲ', en: "Your heart's in the right place" }, // the rumour from the post
    line: { my: 'ဒေါ်ဒေါ်က နှုတ်ကြမ်းပေမဲ့ စိတ်ရင်းကောင်းတာ လူတိုင်း သိပါတယ်။ ဘာမှ မဖြစ်ပါဘူး။', en: "Everyone knows you're rough-mouthed but good-hearted. It's nothing." },
    shows: ['afraid', 'cling'], really: { my: 'အမှားကို ကောင်းတာနဲ့ ဖုံးပေးတာ', en: 'shielding a fault with a good' },
    backfire: { they: { my: 'ဟုတ်တယ် မဟုတ်လား! ဒါဆို ပြင်စရာ ဘာမှ မရှိဘူးပေါ့။', en: "Right? So there's nothing to fix." },
                maya: { my: '(သူ့အမှားကို ကောင်းတာနဲ့ ဖုံးပေးလိုက်မိပြီ။)', en: '(I just covered her fault with her good.)' } } },
  { id: 'useless', lookalike: true, name: { my: 'အော်တာ အလကားပဲ', en: 'Shouting does nothing' },
    line: { my: 'အော်ပြီး သင်တာ ဘာမှ မရပါဘူး ဒေါ်ဒေါ်။', en: 'Teaching by shouting gets you nowhere, Aunty.' },
    shows: ['unknown'], really: { my: 'မှန်တာကို ငြင်းတာ: သူ တကယ် တတ်လာတယ်', en: 'denying what is true: he does learn' },
    backfire: { they: { my: 'ဘာမှ မရဘူး? မုန့်တွေကို ကြည့်စမ်း!', en: 'Nowhere? Look at those loaves!' },
                maya: { my: '(သူ တတ်လာတာ ကျွန်မ ကိုယ်တိုင် မြင်ခဲ့တယ်။ မှားပြောမိပြီ။)', en: '(I saw with my own eyes that he learns. I said it wrong.)' } } },
];

export const TALK_D9_KHINMAY = {
  id: 'd9-khinmay',
  person: 'khinmay',
  with: ['maungarkar'],
  steam: 2, calm: 4, turns: 8, // day9.js adds 1 steam when Maya said "Shouting is wrong" in 5.1
  theirs: [4], // the last stone is hers: hold Step back
  hand: D9_KM_CARDS,
  tutorial: [ // first Day 9 talk only
    { at: 'acts', my: 'ဒီနေ့ကစပြီး "နားထောင်" ခလုတ်က "မေးကြည့်" ဖြစ်သွားပြီ။ အဖြေ မပေးဘဲ မေးခွန်းနဲ့ ပြန်ဖြေတာ။', en: 'From today the Listen button is Ask: answering with a question instead of an answer.' },
  ],
  stones: [
    { lines: [
      { my: 'မီးဖိုဆိုတာ လက်ကို မညှာဘူး။ အော်မှ အာကာ သတိထားတာ။', en: "An oven doesn't spare your hands. Arkar only takes care when I shout.", need: 'afraid', seems: 'hot', face: 'worried',
        tell: { my: 'ဒေါသ မဟုတ်ဘူး။ မျက်လုံးက မီးဖိုတံခါးနဲ့ အာကာ့လက်ကြား သွားနေတယ်။', en: "Not temper. Her eyes go between the oven door and Arkar's hands." },
        ask: { my: 'ဒေါ်ဒေါ် တကယ် ကြောက်နေတာ ဘာလဲ။', en: 'What are you really afraid of, Aunty?' } },
      { my: 'မီးလောင်သွားရင် ဘယ်သူ တာဝန်ယူမလဲ။', en: 'If he gets burned, whose fault is that?', need: 'afraid', face: 'worried' },
    ] },
    { lines: [
      { my: 'အာကာက နှေးတယ်။ ဗန်းနောက်ကျတိုင်း ရင်ထဲက ဆူလာတာ။', en: 'Arkar is slow. Every late tray, something boils up in me.', need: 'hot', seems: 'looksdown', face: 'hot', steam: 1,
        tell: { my: 'အာကာ့ကို အထင်သေးတာ မဟုတ်ဘူး။ အော်ပြီးတိုင်း သူ့ရင်ဘတ်ကို သူ ပွတ်နေတယ်။ အရင်လောင်တာ သူကိုယ်တိုင်။', en: "She doesn't look down on Arkar. After every shout she rubs her own chest. She burns first." },
        ask: { my: 'အော်ပြီးရင် ဒေါ်ဒေါ် ဘယ်လို ခံစားရလဲ။', en: 'How do you feel after you shout?' } },
      { my: 'အော်ပြီးရင်လည်း တစ်နေကုန် ရင်ထဲ ပူနေတာပဲ။', en: 'And after I shout, my chest burns all day.', need: 'hot', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'ဒါပေမဲ့ သူ တတ်လာတယ်လေ! အော်လို့ မရဘူးဆိုရင် ဘာလို့ တတ်လာတာလဲ။', en: "But he learns! If shouting doesn't work, why is he learning?", need: 'unknown', seems: 'hot', face: 'think', heard: true,
        tell: { my: 'ငြင်းချင်တာ မဟုတ်ဘူး။ တခြားနည်း တစ်ခါမှ စမ်းမကြည့်ဖူးလို့ မသိတာ။', en: "She isn't arguing. She has never tried another way, so she doesn't know." },
        ask: { my: 'ပူလောင်ပြီးတောင် သင်လို့ ရနေရင်… မပူလောင်ဘဲရော မရနိုင်ဘူးလား။', en: 'If he learns even while you burn… could he not learn without the burning?' } }, // the chapter's own question (p74)
      { my: 'ကျွန်မ ဆရာတွေလည်း အော်ပြီး သင်ခဲ့တာ။ သူတို့ကို ချစ်တယ်၊ ကြောက်တယ်၊ ရိုသေတယ်။', en: 'My teachers shouted too. I loved them, feared them, respected them.', need: 'unknown', seems: 'cling', face: 'think', heard: true,
        tell: { my: 'ဆရာတွေကို အပြစ်ပြောခံရမှာ စိုးနေတာ မဟုတ်ဘူး။ တခြားနည်း မမြင်ဖူးသေးတာ။', en: "She isn't guarding her teachers. She has simply never seen another way." },
        ask: { my: 'သူတို့ အော်တဲ့အချိန် ဒေါ်ဒေါ် ဘာကို အရင် မှတ်မိခဲ့လဲ။ စာလား၊ အော်သံလား။', en: 'When they shouted, what stayed with you first: the lesson, or the shout?' } },
    ] },
    { lines: [
      { my: 'နှုတ်ကြမ်းပေမဲ့ စိတ်ရင်းကောင်းတယ်။ ကျွန်မ ဒီလိုပဲ။ လူတိုင်း သိတယ်။', en: "Rough mouth, good heart. That's me. Everyone knows.", need: 'cling', seems: 'afraid', face: 'think',
        tell: { my: 'ကြောက်တာ မဟုတ်ဘူး။ "စိတ်ရင်းကောင်းတယ်" ဆိုတာကို ဒိုင်းလို ကိုင်ထားတာ။', en: "Not fear. She holds up 'good heart' like a shield." } },
    ] },
    { lines: [ // hers
      { my: '…ဒါဆို နောက်ဗန်းကို ကျွန်မ ဘယ်လို သင်မလဲ။ မပြောနဲ့နော်။ ကျွန်မ စဉ်းစားမယ်။', en: "…Then how will I teach the next tray? Don't tell me. I'll think.", need: 'own', face: 'think',
        tell: { my: 'ဒီတစ်လှမ်းက သူ့ဟာ။ နောက်ဆုတ်ပေး။', en: 'This step is hers. Step back.' } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါက မုန့်နဲ့ မဆိုင်ဘူး ကလေးမ။', en: '…That has nothing to do with bread, girl.' },
    hot: { my: '(ဒေါ်ခင်မေ မုန့်စိမ်းကို ဆောင့်ဆောင့် နယ်နေတယ်။ ဘာမှ မကြားဘူး။)', en: '(Daw Khin May is pounding the dough. Nothing gets through.)' },
    lean: { my: 'ဒါဆို မင်းပဲ ပြောပါလား ဘယ်လို သင်ရမလဲ။ …မင်း မရှိတဲ့ မနက်တွေကျရင်ကော။', en: "Then you tell me how to teach. …And the mornings you aren't here?" },
  },
  decision: [
    { my: 'ကျွန်မ မှားတာ ကျွန်မ ကိုယ်တိုင် ပြင်မယ်။ ဆင်ခြေ မပါဘဲ။', en: "My fault, I'll put right myself. No excuses.", face: 'think' },
    { my: 'နောက်ဗန်းကို အော်သံ မပါဘဲ သင်ကြည့်မယ်။ ရင်ထဲ ပူလာရင် ကိုယ့်ဘာသာ သိအောင် နေမယ်။', en: "The next tray I'll teach without the shouting. If the heat rises, I'll notice it myself.", face: 'happy' },
  ],
};

// ---------------------------------------------------------------------------------------------
// ch 15 · Ei Mon sits with Maung Arkar (the back yard)
// ---------------------------------------------------------------------------------------------
export const D9_EM_CARDS = [
  { id: 'load', name: { my: 'လေးတာ အောက်ဆုံး', en: 'Heavy at the bottom' },
    line: { my: 'လေးတဲ့ ဗန်း အောက်ဆုံး၊ ပေါ့တာ အပေါ်။ ကြိုးတစ်ချောင်း ဖြတ်ချည်။ ငါ့ဆိုင်က ဗန်းတွေလည်း ဒီလိုပဲ။', en: 'Heavy trays at the bottom, light on top, one rope across. Our shop stacks the same way.' },
    answers: ['unknown'], from: { my: 'အိမွန့်ဆိုင်က', en: "from Ei Mon's shop" } },
  { id: 'kept', name: { my: 'မုန့်ချန်ထားခဲ့တာ', en: 'You kept me a loaf' },
    line: { my: 'ငါ နောက်ကျတဲ့ညက နင် မုန့်တစ်လုံး ချန်ထားပေးခဲ့တာ မှတ်မိလား။ နင် အရင် သူငယ်ချင်း ဖြစ်ခဲ့တာ။', en: 'Remember the night I was late and you kept me a loaf? You were the friend first.' },
    answers: ['afraid'], from: { my: 'အိမွန် မှတ်မိနေတာ', en: 'what Ei Mon remembers' } },
  { id: 'eat', name: { my: 'အတူစားမယ်', en: "Let's eat together" },
    line: { my: 'မနက်ဖြန် ထမင်းချိုင့် ငါ့ဆိုင် ယူလာခဲ့။ ခုံတစ်လုံး ချန်ထားမယ်။', en: "Bring your tiffin to the shop tomorrow. I'll keep you a stool." },
    answers: ['afraid', 'given'], from: { my: 'အိမွန့်ကိုယ်ပိုင်', en: "Ei Mon's own" } },
  { id: 'cheer', lookalike: true, name: { my: 'စိတ်မညစ်နဲ့', en: 'Cheer up' },
    line: { my: 'စိတ်မညစ်ပါနဲ့ဟာ။ ပြုံးထား၊ ပြီးသွားမှာပါ။', en: "Don't be down. Keep smiling, it'll pass." },
    shows: ['given'], really: { my: 'ဖွင့်ခါနီး တံခါးကို ပြန်ပိတ်ခိုင်းတာ', en: 'shutting the door just as he opens it' },
    backfire: { they: { my: '…ဟုတ်။ ပြုံးနေပါတယ်။', en: "…Sure. I'm smiling." },
                maya: { my: '(သူ ပြန်ပြုံးပြီ။ ပြုံးပြတာက ဖုံးတာပဲ။)', en: "(He's smiling again. The smile is the cover.)" } } },
  { id: 'forhim', lookalike: true, name: { my: 'ငါ တင်ပေးမယ်', en: "I'll load it for you" },
    line: { my: 'လှည်းကို ငါ တင်ပေးမယ်လေ။ နင် မလုပ်နဲ့တော့။', en: "I'll load the cart for you. Don't you bother." },
    shows: ['unknown'], really: { my: 'သူ့လမ်းကို ယူသွားတာ', en: 'taking his road from him' },
    backfire: { they: { my: 'ကျွန်တော်က လှည်းတောင် မတင်တတ်ဘူးပေါ့။', en: "So I can't even load a cart." },
                maya: { my: '(ကူမယ်ဆိုပြီး သူ့နေရာကို ယူလိုက်တာ။)', en: '(Meaning to help, she took his place.)' } } },
];

export const TALK_D9_ARKAR = {
  id: 'd9-arkar',
  person: 'maungarkar',
  by: 'eimon', // the helper who holds the mug (portrait, calm dots); Maya stands by
  with: ['eimon'],
  steam: 1, calm: 4, turns: 8,
  theirs: [4],
  faceDownUntil: 3, // cards are face down while he stands on stones 0..2
  hand: D9_EM_CARDS,
  tutorial: [ // first time `by` is used
    { at: 'path', my: 'ဒီတစ်ခါ မောင်အာကာနဲ့ ထိုင်တာ အိမွန်။ မာရာက ဘေးကနေ ကူရုံပဲ။', en: "This time it's Ei Mon who sits with Maung Arkar. Maya only stands by." },
    { at: 'hand', my: 'အိမွန့် အကြံတွေ မှောက်ထားတယ်။ သူ ပြောလို့ မပြီးခင် မလှန်နဲ့။ အရင် မေး၊ နားထောင်။', en: "Ei Mon's advice is face down. Don't turn it over before he's finished. Ask and listen first." },
  ],
  stones: [
    { lines: [
      { my: 'ရပါတယ်။ ကျွန်တော် တစ်ယောက်တည်း စားရတာ ကြိုက်လို့ပါ။', en: "It's fine. I like eating on my own.", need: 'afraid', seems: 'own', face: 'happy', heard: true,
        tell: { my: 'ရွေးထားတာ မဟုတ်ဘူး။ ဆိုင်တန်းဘက်ကို ခဏခဏ လှမ်းကြည့်တယ်။ အနှောင့်အယှက် ဖြစ်မှာ စိုးလို့။', en: "Not a choice. He keeps glancing at the stalls. He's afraid of being a bother." },
        ask: { my: 'တစ်ယောက်တည်း စားရတာ တကယ် ကြိုက်လို့လား။', en: 'Do you really like eating alone?' } }, // Ei Mon asks
    ] },
    { lines: [
      { my: 'ရွာမှာဆို ထမင်းကို အားလုံး ဝိုင်းစားတာ။ ဒီမှာ ဘယ်သူ့ကို ခေါ်ရမှန်း မသိဘူး။', en: "At home everyone eats round one pot. Here I don't know who to ask.", need: 'unknown', seems: 'looksdown', face: 'sad', heard: true,
        tell: { my: 'လမ်းကို အထင်သေးလို့ မဟုတ်ဘူး။ ဘယ်လို ဝင်ရမလဲ မသိတာ။', en: "He doesn't look down on the Row. He doesn't know how to come in." },
        ask: { my: 'ရွာမှာတုန်းက ဘယ်သူတွေနဲ့ စားခဲ့လဲ။', en: 'Who did you eat with, back home?' } },
    ] },
    { lines: [
      { my: 'မနက်က လှည်းမှောက်တော့ ရယ်ပြလိုက်တာ။ တကယ်တော့… ရွာ ပြန်ချင်လိုက်တာ။', en: 'When the cart tipped I laughed. Really… I just wanted to go home.', need: 'given', seems: 'hot', face: 'sad', mood: 'down', heard: true, steam: 1,
        tell: { my: 'စိတ်တိုတာ မဟုတ်ဘူး။ ထမင်းချိုင့်ကို ပိတ်ပြီး လက်နဲ့ ဖိထားတယ်။ လက်လျှော့ချင်နေပြီ။', en: "Not temper. He's shut the tiffin and is pressing the lid down. He's close to giving up." },
        ask: { my: 'ရယ်ပြလိုက်ရတော့ ပိုလေးသွားလား။', en: 'Did laughing it off make it heavier?' } },
    ] },
    { lines: [
      { my: 'လှည်း ဘာလို့ မှောက်တာလဲ မသိဘူး။ ကျွန်တော် ညံ့လို့ပဲ နေမှာ။', en: "I don't know why the cart tipped. I must just be no good.", need: 'unknown', face: 'think',
        tell: { my: 'ညံ့တာ မဟုတ်ဘူး။ လေးတဲ့ဗန်းတွေ အပေါ်ဆုံးမှာ။ နည်းကို မသိသေးတာ။', en: "Not no good. The heavy trays were on top. He just doesn't know the way yet." } },
      { my: 'ဒီလမ်းမှာ ကျွန်တော့်ကို ဘယ်သူမှ မလိုဘူး ထင်တယ်။', en: "I don't think anyone on this street needs me.", need: 'afraid', face: 'sad',
        tell: { my: 'တကယ် ပြောနေတာ မဟုတ်ဘူး။ ကိုယ့်ကိုယ်ကို ဝန်ထုပ်လို့ ထင်ပြီး ကြောက်နေတာ။', en: "He doesn't mean it. He's afraid he's a burden." } },
    ] },
    { lines: [ // his
      { my: 'လှည်း ပြန်တင်ရဦးမယ်… ကျွန်တော်…', en: 'I have to load the cart again… I…', need: 'own', face: 'think',
        tell: { my: 'ဒီတစ်လှမ်းက သူ့ဟာ။ အိမွန် နောက်ဆုတ်ပေး။', en: 'This step is his. Ei Mon steps back.' } },
    ] },
  ],
  react: {
    miss: { my: '…ဟုတ်။', en: '…Right.' },
    hot: { my: '(မောင်အာကာ ပြုံးပြီး ခေါင်းငုံ့နေတယ်။ ဘာမှ မဝင်ဘူး။)', en: '(Maung Arkar smiles at the ground. Nothing gets in.)' },
    interrupt: { my: '(အိမွန် အကြံပေးချင်လို့ စကား ဖြတ်ပြောမိတယ်။ မောင်အာကာ ပါးစပ် ပြန်ပိတ်သွားတယ်။)', en: '(Ei Mon cuts in with advice. Maung Arkar closes up again.)' },
    lean: { my: 'အိမွန် ပြောတဲ့အတိုင်း လုပ်မယ်လေ…', en: "I'll just do what you say, Ei Mon…" },
  },
  decision: [
    { my: 'လေးတာ အောက်ဆုံး။ ကျွန်တော် ကိုယ်တိုင် ပြန်တင်မယ်။ မှားရင် ပြပေးနော်။', en: "Heavy at the bottom. I'll load it myself. If I get it wrong, show me?", face: 'happy' },
    { my: 'မနက်ဖြန် ထမင်းချိုင့် နင့်ဆိုင် ယူလာမယ်။', en: "Tomorrow I'll bring my tiffin to your shop.", face: 'happy' },
  ],
};

// ---------------------------------------------------------------------------------------------
// ch 15 · their first squabble at the cart (two voices)
// ---------------------------------------------------------------------------------------------
export const D9_SQ_CARDS = [
  { id: 'cloud', name: { my: 'စေတနာက မပူဘူး', en: "Goodwill doesn't burn" }, companion: 'cloud', // Cool Cloud (ch 7)
    line: { my: 'နှစ်ယောက်လုံး စေတနာ ရှိကြတာပဲ။ စေတနာက ပူစရာ မလိုဘူးလေ။', en: "You both mean well. Meaning well doesn't have to burn." },
    answers: ['hot'], from: { my: 'တိမ်အေး', en: 'the Cool Cloud' } },
  { id: 'earth', name: { my: 'မြေကြီးလို', en: 'Like the earth' }, companion: 'earth', // Little Earth (ch 8)
    line: { my: 'မြေကြီးလို ခဏ ငြိမ်ငြိမ်လေး ထိုင်ကြရအောင်။ ဘယ်သူ့ဘက်မှ မဟုတ်ဘူး။', en: "Let's sit still a moment, like the earth. Nobody's side." },
    answers: ['hot', 'looksdown'], from: { my: 'မြေကြီးလေး', en: 'Little Earth' } },
  { id: 'teach', name: { my: 'တစ်ယောက်ကို တစ်ယောက်', en: 'Each teaches the other' }, companion: 'firefly', // Firefly (ch 9)
    line: { my: 'အာကာက မုန့်ကို သိတယ်။ အိမွန်က ဗန်းတင်တာ သိတယ်။ တစ်ယောက်ကို တစ်ယောက် ပြပေးလို့ ရတာပဲ။', en: 'Arkar knows bread. Ei Mon knows loading. Each can show the other.' },
    answers: ['afraid'], from: { my: 'ပိုးစုန်းကြူး', en: 'the Firefly' } },
  { id: 'glad', name: { my: 'သူ့အတွက် ဝမ်းသာ', en: 'Glad for her' }, companion: 'ribbon', // Two-Tailed Ribbon (ch 10)
    line: { my: 'အိမွန့်ဗန်းတွေ မမှောက်တာ အာကာ့အတွက်လည်း ဝမ်းသာစရာပဲ။ ဒီနည်းကို ယူလို့ ရတာကိုး။', en: "Ei Mon's trays never tipping is good news for Arkar too: he can borrow the way." },
    answers: ['envy'], from: { my: 'သူလည်းကိုယ်လည်း ဖဲကြိုး', en: 'the Two-Tailed Ribbon' } },
  { id: 'sideHer', lookalike: true, name: { my: 'အိမွန် မှန်တယ်', en: "Ei Mon's right" },
    line: { my: 'အာကာ၊ အိမွန် ပြောတာ မှန်တယ်လေ။ နားထောင်လိုက်ပါ။', en: "Arkar, Ei Mon's right. Just listen to her." },
    shows: ['unknown'], really: { my: 'ဘက်တစ်ဖက် လိုက်တာ', en: 'taking a side' },
    backfire: { they: { my: 'ဒါဆို ကျွန်တော်ပဲ မှားတာပေါ့။ အမြဲတမ်း။', en: "So it's me who's wrong. As always." },
                maya: { my: '(ဘက်လိုက်လိုက်မိပြီ။ ကတောက်ကဆတ်က ပိုကြီးသွားတယ်။)', en: '(I took a side. The squabble just got bigger.)' } } },
  { id: 'sideHim', lookalike: true, name: { my: 'သူ့ကို မအော်နဲ့', en: "Don't snap at him" },
    line: { my: 'အိမွန်၊ အာကာ့ကို မအော်ပါနဲ့လား။ မနက်ကတည်းက ပင်ပန်းနေတာ။', en: "Ei Mon, don't snap at Arkar. He's been worn out since morning." },
    shows: ['hot'], really: { my: 'ဘက်တစ်ဖက် လိုက်တာ', en: 'taking a side' },
    backfire: { they: { my: 'ငါက ကူမလို့ပါ! ဒါဆို ငါက လူဆိုးပေါ့။', en: "I was trying to help! So I'm the bad one." },
                maya: { my: '(ဘက်လိုက်လိုက်မိပြီ။)', en: '(I took a side.)' } } },
];

export const TALK_D9_SQUABBLE = {
  id: 'd9-squabble',
  person: 'eimon',
  with: ['maungarkar'],
  steam: 1, calm: 4, turns: 7, // Ei Mon's first line adds 1: warm, not yet hot
  theirs: [2, 3],
  hand: D9_SQ_CARDS,
  tutorial: [
    { at: 'acts', my: 'ရန်ပွဲ မဟုတ်ဘူး၊ ကတောက်ကဆတ်လေးပဲ။ ဘယ်သူ့ဘက်မှ မလိုက်ဘဲ နှစ်ယောက်လုံး အေးအောင်။ ကိုယ့်အသံ ကိုယ်ပြင်တာကတော့ သူတို့ဟာ။', en: 'Not a fight, a squabble. Take no side; cool them both. Mending their own tone is theirs.' },
  ],
  stones: [
    { lines: [
      { who: 'eimon', my: 'ပြောပြီးပြီလေ! လေးတာ အောက်ဆုံးလို့! ဘာလို့ ထပ်ပြီး အပေါ်တင်တာလဲ!', en: "I told you! Heavy at the bottom! Why'd you put it on top again!", need: 'hot', seems: 'looksdown', face: 'hot', steam: 1,
        tell: { my: 'သူ့ကို အထင်သေးတာ မဟုတ်ဘူး။ လမ်းပေါ်က လူတွေရှေ့ ထပ်မှောက်မှာ စိုးနေတာ။', en: "She doesn't look down on him. She's scared it'll tip again in front of everyone." },
        ask: { my: 'ဘာကို အရင် စိုးရိမ်သွားတာလဲ။', en: 'What were you worried about, just then?' } },
      { who: 'maungarkar', my: 'ကျွန်တော် ရွာသားမို့ ဘာမှ မသိဘူး ထင်နေတာလား!', en: "Think I know nothing because I'm from a village?", need: 'afraid', seems: 'hot', face: 'hot',
        tell: { my: 'စိတ်ဆိုးတာ မဟုတ်ဘူး။ ရှက်နေတာ။', en: 'Not angry. Ashamed.' } },
    ] },
    { lines: [
      { who: 'maungarkar', my: 'နင့်ဆိုင်က ဗန်းတွေ တစ်ခါမှ မမှောက်ဘူးပေါ့! နင်က အကုန် တော်တာပေါ့!', en: "Your shop's trays never tip, right! You're good at everything!", need: 'envy', seems: 'hot', face: 'hot',
        tell: { my: 'ဒေါသ မဟုတ်ဘူး။ နည်းနည်း မနာလိုပြီး ကိုယ့်ကိုယ်ကို အားငယ်နေတာ။', en: 'Not anger. A little envy, and feeling small.' } },
    ] },
    { lines: [ // hers
      { who: 'eimon', my: '…ငါ အသံကျယ်သွားတယ်။ စိတ်ပူလို့ပါ။ …ဆောရီးနော်။', en: '…I got loud. Because I was worried. …Sorry.', need: 'own', face: 'sad',
        tell: { my: 'သူ့အသံ သူကိုယ်တိုင် ပြင်နေတာ။ နောက်ဆုတ်ပေး။', en: 'She is mending her own tone. Step back.' } },
    ] },
    { lines: [ // his
      { who: 'maungarkar', my: 'ကျွန်တော်လည်း မနာလိုသလို ပြောမိတယ်။ …ပြန်ပြပါဦး။ ဖြည်းဖြည်း။', en: 'I said it like I was jealous. …Show me again? Slowly.', need: 'own', face: 'think',
        tell: { my: 'သူ့အသံ သူကိုယ်တိုင် ပြင်နေတာ။ နောက်ဆုတ်ပေး။', en: 'He is mending his own tone. Step back.' } },
    ] },
  ],
  react: {
    miss: { my: '…အစ်မ ဘာပြောတာလဲ။', en: '…What, sister?' },
    hot: { my: '(နှစ်ယောက်လုံး လှည်းကို တစ်ယောက်တစ်ဖက် ဆွဲထားကြတယ်။ ဘာမှ မကြားကြဘူး။)', en: '(Each grips one side of the cart. Neither hears a thing.)' },
    lean: { my: 'အစ်မပဲ ပြောပါ၊ ဘယ်သူ မှန်လဲ။', en: "You say, sister, who's right?" },
  },
  decision: [
    { who: 'eimon', my: 'နင် တင်၊ ငါ ကြည့်မယ်။ မှားမှ ပြမယ်။', en: "You load, I'll watch. I'll only say if it's wrong.", face: 'happy' },
    { who: 'maungarkar', my: 'လေးတာ အောက်ဆုံး… ကြိုးကို ကျွန်တော် ချည်မယ်။', en: "Heavy at the bottom… I'll tie the rope.", face: 'happy' },
  ],
};
