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
  { id: 'care', name: { my: 'သူ့အတွက် စိတ်ပူလို့ပါ', en: 'Afraid for him' },
    line: { my: 'မီးဖိုတံခါးဝကနေ အာကာ့လက်ကို အန်တီ ဆွဲဖယ်လိုက်တာ မြင်လိုက်တယ်။ အန်တီ တကယ် စိတ်ပူနေတာ သူ့အတွက်ပါ။', en: "I saw you pull Arkar's hand back from the oven door. What you're really afraid of is for him." },
    answers: ['afraid'], from: { my: 'မီးဖိုတံခါးဝမှာ မြင်ခဲ့ရတာ', en: 'seen at the oven door' } },
  { id: 'heatfirst', name: { my: 'အပူ စတင်တဲ့ နေရာ', en: 'Where the heat starts' },
    line: { my: 'မုန့်ဗန်း နောက်ကျတာနဲ့ စကားတစ်ခွန်းမှ မထွက်ခင်ကတည်းက အန်တီ အရင် ဒေါသထွက်လာတာ မြင်လိုက်တယ်။', en: 'I saw you heat up first, the moment the tray was late. Before a word came out.' },
    answers: ['hot'], from: { my: 'မုန့်ဗန်းတစ်ဗန်းကို ကြည့်မိရာက', en: 'from watching one tray' } },
  { id: 'why', name: { my: 'ဘာလို့လဲလို့ မေးကြည့်', en: 'Ask why' }, companion: 'parrot', // the Why-Parrot (ch 3)
    line: { my: 'အာကာ ဘယ်အချိန်မှာ အမြန်ဆုံး သင်ယူနိုင်လဲ အန်တီ သတိထားမိလား။ ဘာလို့ အဲဒီအချိန်မှာ ဖြစ်ရတာလဲ။', en: 'Have you noticed when Arkar picks things up fastest, Aunty? Why then, do you think?' }, // an open question; no hint that shouting fails (p74 grants it works)
    answers: ['unknown'], from: { my: 'ဘာလို့လဲ ကြက်တူရွေးလေး', en: 'the Why-Parrot' } },
  { id: 'otherside', name: { my: 'တစ်ဖက်ခြမ်းက ကြည့်ရင်', en: 'From the other side' }, companion: 'beetle', // the Six-Nine Beetle (ch 13), new today
    line: { my: 'အန်တီ့ဘက်က ကြည့်ရင် စိတ်ပူလို့ပါ။ အာကာ့ဘက်က ကြည့်ရင် ဘယ်လို ကြားရမလဲ မသိဘူးနော်။', en: "From your side it's worry. I wonder how it sounds from Arkar's side." },
    answers: ['unknown', 'cling'], from: { my: 'ခြောက်ကိုး ပိုးကောင်လေး', en: 'the Six-Nine Beetle' } },
  { id: 'cool', name: { my: 'စေတနာက ပူလောင်မှု မရှိဘူး', en: "Goodwill doesn't burn" }, companion: 'cloud', // the Cool Cloud (ch 7)
    line: { my: 'အာကာ့အပေါ် ထားတဲ့ အန်တီ့စေတနာက အစစ်အမှန်ပါ။ အစစ်အမှန် ဖြစ်နေမှတော့ ကာကွယ်ဖို့ အော်ဟစ်နေစရာ မလိုပါဘူး။', en: "Your goodwill for Arkar is real. Being real, it doesn't need the shouting to guard it." },
    answers: ['cling', 'hot'], from: { my: 'တိမ်အေး', en: 'the Cool Cloud' } },
  { id: 'goodheart', lookalike: true, name: { my: 'အန်တီ့စိတ်ရင်းက ကောင်းပါတယ်', en: "Your heart's in the right place" }, // the rumour from the post
    line: { my: 'အန်တီက ပါးစပ်ကြမ်းပေမဲ့ စိတ်ရင်းကောင်းမှန်း အားလုံး သိတာပဲ။ ဘာမှ မဖြစ်ပါဘူး။', en: "Everyone knows you're rough-mouthed but good-hearted. It's nothing." },
    shows: ['afraid', 'cling'], really: { my: 'ကောင်းကွက်လေးနဲ့ အပြစ်ကို ဖုံးပေးမိတာ', en: 'shielding a fault with a good' },
    backfire: { they: { my: 'ဟုတ်တယ်မလား။ ဒါဆို ဘာမှ ပြင်စရာ မလိုတော့ဘူးပေါ့။', en: "Right? So there's nothing to fix." },
                maya: { my: '(ကောင်းကွက်လေးနဲ့ သူ့အပြစ်ကို ငါ ဖုံးပေးလိုက်မိပြီ။)', en: '(I just covered her fault with her good.)' } } },
  { id: 'useless', lookalike: true, name: { my: 'အော်နေလို့ ဘာမှ ထူးမလာဘူး', en: 'Shouting does nothing' },
    line: { my: 'အော်ဟစ်ပြီး သင်ပေးနေလို့ ဘာမှ ဖြစ်လာမှာ မဟုတ်ဘူး အန်တီရဲ့။', en: 'Teaching by shouting gets you nowhere, Aunty.' },
    shows: ['unknown'], really: { my: 'အမှန်တရားကို ငြင်းပယ်မိတာ- သူ တကယ် သင်ယူတတ်ပါတယ်', en: 'denying what is true: he does learn' },
    backfire: { they: { my: 'ဘာမှ ဖြစ်မလာဘူး ဟုတ်လား။ ဟိုပေါင်မုန့်တွေကို ကြည့်စမ်း။', en: 'Nowhere? Look at those loaves!' },
                maya: { my: '(သူ တတ်မြောက်လာတာကို ငါ့မျက်စိနဲ့ ကိုယ်တိုင် မြင်ခဲ့ရတာပဲ။ ငါ ပြောတာ မှားသွားပြီ။)', en: '(I saw with my own eyes that he learns. I said it wrong.)' } } },
];

export const TALK_D9_KHINMAY = {
  id: 'd9-khinmay',
  person: 'khinmay',
  with: ['maungarkar'],
  steam: 2, calm: 4, turns: 8, // day9.js adds 1 steam when Maya said "Shouting is wrong" in 5.1
  theirs: [4], // the last stone is hers: hold Step back
  hand: D9_KM_CARDS,
  tutorial: [ // first Day 9 talk only
    { at: 'acts', my: 'ဒီနေ့ကစပြီး နားထောင် ခလုတ်က မေး ဖြစ်သွားပြီ- အဖြေပေးမယ့်အစား မေးခွန်းနဲ့ ပြန်ဖြေပေးတာ။', en: 'From today the Listen button is Ask: answering with a question instead of an answer.' },
  ],
  stones: [
    { lines: [
      { my: 'မီးဖိုဆိုတာ လက်ကို ညှာတာ မဟုတ်ဘူး။ ငါ အော်မှပဲ အာကာက သတိထားတာ။', en: "An oven doesn't spare your hands. Arkar only takes care when I shout.", need: 'afraid', seems: 'hot', face: 'worried',
        tell: { my: 'စိတ်တိုနေတာ မဟုတ်ဘူး။ မျက်လုံးက မီးဖိုတံခါးနဲ့ အာကာ့လက်တွေဆီပဲ ရောက်ရောက်နေတယ်။', en: "Not temper. Her eyes go between the oven door and Arkar's hands." },
        ask: { my: 'အန်တီ တကယ် ကြောက်နေတာ ဘာလဲဟင်။', en: 'What are you really afraid of, Aunty?' } },
      { my: 'သူ အပူလောင်သွားရင် ဘယ်သူ့အပြစ် ဖြစ်မှာလဲ။', en: 'If he gets burned, whose fault is that?', need: 'afraid', face: 'worried' },
    ] },
    { lines: [
      { my: 'အာကာက နှေးတယ်။ မုန့်ဗန်း နောက်ကျတိုင်း ရင်ထဲမှာ တစ်ခုခု ဆူပွက်လာတာပဲ။', en: 'Arkar is slow. Every late tray, something boils up in me.', need: 'hot', seems: 'looksdown', face: 'hot', steam: 1,
        tell: { my: 'သူ အာကာ့ကို အထင်သေးနေတာ မဟုတ်ဘူး။ အော်ပြီးတိုင်း သူ့ရင်ဘတ်သူ ပြန်ပွတ်နေတယ်။ သူက အရင် ပူလောင်နေတာ။', en: "She doesn't look down on Arkar. After every shout she rubs her own chest. She burns first." },
        ask: { my: 'အန်တီ အော်ပြီးသွားရင် ဘယ်လို ခံစားရလဲဟင်။', en: 'How do you feel after you shout?' } },
      { my: 'ပြီးတော့ ငါ အော်ပြီးသွားရင် တစ်နေကုန် ရင်ဘတ်ထဲ ပူလောင်နေတာပဲ။', en: 'And after I shout, my chest burns all day.', need: 'hot', face: 'sad', heard: true },
    ] },
    { lines: [
      { my: 'ဒါပေမဲ့ သူ တတ်လာတာပဲလေ။ အော်တာ အလုပ်မဖြစ်ရင် ဘာလို့ သူ တတ်လာတာလဲ။', en: "But he learns! If shouting doesn't work, why is he learning?", need: 'unknown', seems: 'hot', face: 'think', heard: true,
        tell: { my: 'သူ ငြင်းနေတာ မဟုတ်ဘူး။ တခြားနည်းကို တစ်ခါမှ မစမ်းဖူးသေးလို့ မသိတာ။', en: "She isn't arguing. She has never tried another way, so she doesn't know." },
        ask: { my: 'အန်တီ ပူလောင်နေတာတောင် သူ တတ်လာသေးရင်… မပူလောင်ဘဲနဲ့ရော သူ မတတ်နိုင်ဘူးလား။', en: 'If he learns even while you burn… could he not learn without the burning?' } }, // the chapter's own question (p74)
      { my: 'ငါ့ဆရာတွေလည်း အော်ခဲ့တာပဲ။ ငါ သူတို့ကို ချစ်တယ်၊ ကြောက်တယ်၊ လေးစားတယ်။', en: 'My teachers shouted too. I loved them, feared them, respected them.', need: 'unknown', seems: 'cling', face: 'think', heard: true,
        tell: { my: 'သူ့ဆရာတွေကို ကာကွယ်နေတာ မဟုတ်ဘူး။ တခြားနည်းလမ်းကို သူ တစ်ခါမှ မမြင်ဖူးသေးတာ။', en: "She isn't guarding her teachers. She has simply never seen another way." },
        ask: { my: 'သူတို့ အော်တုန်းက အန်တီ့ဆီမှာ ဘာအရင် ကျန်ခဲ့လဲ- သင်ခန်းစာလား၊ အော်သံလား။', en: 'When they shouted, what stayed with you first: the lesson, or the shout?' } },
    ] },
    { lines: [
      { my: 'ပါးစပ်ကြမ်းပေမဲ့ စိတ်ရင်းကောင်းတယ်။ အဲဒါ ငါပဲ။ အားလုံး သိတယ်။', en: "Rough mouth, good heart. That's me. Everyone knows.", need: 'cling', seems: 'afraid', face: 'think',
        tell: { my: 'ကြောက်နေတာ မဟုတ်ဘူး။ \'စိတ်ရင်းကောင်းတယ်\' ဆိုတာကို ဒိုင်းတစ်ခုလို ကိုင်ထားတာ။', en: "Not fear. She holds up 'good heart' like a shield." } },
    ] },
    { lines: [ // hers
      { my: '…ဒါဆို နောက်တစ်ဗန်းကို ငါ ဘယ်လို သင်ပေးရမလဲ။ မပြောနဲ့။ ငါ့ဘာသာ စဉ်းစားမယ်။', en: "…Then how will I teach the next tray? Don't tell me. I'll think.", need: 'own', face: 'think',
        tell: { my: 'ဒီခြေလှမ်းက သူ့အပိုင်းပဲ။ နောက်ဆုတ်ပေးလိုက်ပါ။', en: 'This step is hers. Step back.' } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါ ပေါင်မုန့်နဲ့ ဘာမှ မဆိုင်ဘူး ကောင်မလေးရဲ့။', en: '…That has nothing to do with bread, girl.' },
    hot: { my: '(ဒေါ်ခင်မေ ဂျုံနယ်တာကိုပဲ ထုရိုက်နေတယ်။ ဘာမှ နားထဲ မဝင်တော့ဘူး။)', en: '(Daw Khin May is pounding the dough. Nothing gets through.)' },
    lean: { my: 'ဒါဆို ဘယ်လို သင်ရမလဲ နင် ပြောပြလေ။ …ပြီးတော့ နင် မရှိတဲ့ မနက်တွေကျရင်ရော။', en: "Then you tell me how to teach. …And the mornings you aren't here?" },
  },
  decision: [
    { my: 'ငါ့အပြစ် ငါ့ဘာသာ ပြန်ပြင်မယ်။ ဆင်ခြေ မပေးဘူး။', en: "My fault, I'll put right myself. No excuses.", face: 'think' },
    { my: 'နောက်တစ်ဗန်းကျရင် မအော်ဘဲ သင်ပေးမယ်။ ဒေါသထွက်လာရင် ငါ့ဘာသာ သတိထားလိုက်မယ်။', en: "The next tray I'll teach without the shouting. If the heat rises, I'll notice it myself.", face: 'happy' },
  ],
};

// ---------------------------------------------------------------------------------------------
// ch 15 · Ei Mon sits with Maung Arkar (the back yard)
// ---------------------------------------------------------------------------------------------
export const D9_EM_CARDS = [
  { id: 'load', name: { my: 'အလေးတွေကို အောက်မှာထား', en: 'Heavy at the bottom' },
    line: { my: 'လေးတဲ့ ဗန်းတွေကို အောက်မှာထား၊ ပေါ့တာကို အပေါ်တင်ပြီး ကြိုးတစ်ချောင်းတည်းနဲ့ ချည်လိုက်။ တို့ဆိုင်မှာလည်း အဲဒီလိုပဲ စီတာ။', en: 'Heavy trays at the bottom, light on top, one rope across. Our shop stacks the same way.' },
    answers: ['unknown'], from: { my: 'အိမွန်ရဲ့ ဆိုင်က', en: "from Ei Mon's shop" } },
  { id: 'kept', name: { my: 'နင် ငါ့အတွက် ပေါင်မုန့်တစ်လုံး ချန်ထားပေးခဲ့တယ်', en: 'You kept me a loaf' },
    line: { my: 'ငါ နောက်ကျတဲ့ ညတုန်းက နင် ပေါင်မုန့်တစ်လုံး ချန်ထားပေးခဲ့တာ မှတ်မိသေးလား။ နင်က အရင် သူငယ်ချင်း ပီသခဲ့တာ။', en: 'Remember the night I was late and you kept me a loaf? You were the friend first.' },
    answers: ['afraid'], from: { my: 'အိမွန် မှတ်မိနေတာလေး', en: 'what Ei Mon remembers' } },
  { id: 'eat', name: { my: 'အတူတူ စားကြရအောင်', en: "Let's eat together" },
    line: { my: 'မနက်ဖြန် ဆိုင်ကို ထမင်းချိုင့် ယူလာခဲ့လေ။ ငါ ခုံတစ်လုံး ဖယ်ထားပေးမယ်။', en: "Bring your tiffin to the shop tomorrow. I'll keep you a stool." },
    answers: ['afraid', 'given'], from: { my: 'အိမွန့်ကိုယ်ပိုင်', en: "Ei Mon's own" } },
  { id: 'cheer', lookalike: true, name: { my: 'စိတ်ဓာတ်မကျပါနဲ့', en: 'Cheer up' },
    line: { my: 'စိတ်မကောင်း ဖြစ်မနေပါနဲ့။ ပြုံးပြုံးလေး နေလိုက်၊ ပြီးသွားမှာပါ။', en: "Don't be down. Keep smiling, it'll pass." },
    shows: ['given'], really: { my: 'သူ ရင်ဖွင့်မလို့ တံခါးဖွင့်လိုက်တုန်း ပြန်ပိတ်ပစ်လိုက်သလို ဖြစ်သွားတာ', en: 'shutting the door just as he opens it' },
    backfire: { they: { my: '…ဟုတ်ကဲ့။ ကျွန်တော် ပြုံးနေပါတယ်။', en: "…Sure. I'm smiling." },
                maya: { my: '(သူ ထပ်ပြုံးနေပြန်ပြီ။ အပြုံးက ဖုံးကွယ်စရာ ဖြစ်နေတယ်။)', en: "(He's smiling again. The smile is the cover.)" } } },
  { id: 'forhim', lookalike: true, name: { my: 'ငါ တင်ပေးမယ်', en: "I'll load it for you" },
    line: { my: 'လှည်းပေါ် ငါ တင်ပေးမယ်။ နင် လုပ်မနေနဲ့တော့။', en: "I'll load the cart for you. Don't you bother." },
    shows: ['unknown'], really: { my: 'သူ့လမ်းကြောင်းကို ယူပစ်လိုက်တာ', en: 'taking his road from him' },
    backfire: { they: { my: 'ဒါဆို ကျွန်တော်က လှည်းပေါ်တောင် မတင်တတ်တော့ဘူးပေါ့။', en: "So I can't even load a cart." },
                maya: { my: '(ကူညီချင်စိတ်နဲ့ သူ့နေရာကို ဝင်ယူလိုက်မိတယ်။)', en: '(Meaning to help, she took his place.)' } } },
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
    { at: 'path', my: 'ဒီတစ်ခါတော့ မောင်အာကာနဲ့ အတူထိုင်ပေးတာ အိမွန်ပါ။ မာရာက ဘေးကနေပဲ ရပ်ကြည့်နေတယ်။', en: "This time it's Ei Mon who sits with Maung Arkar. Maya only stands by." },
    { at: 'hand', my: 'အိမွန်ရဲ့ အကြံပြုချက်က မှောက်ထားတုန်းပဲ။ သူ ပြောလို့ မပြီးခင် လှန်မကြည့်နဲ့ဦး။ အရင် မေးပြီး နားထောင်ပေးလိုက်ပါ။', en: "Ei Mon's advice is face down. Don't turn it over before he's finished. Ask and listen first." },
  ],
  stones: [
    { lines: [
      { my: 'ရပါတယ်။ ကျွန်တော် တစ်ယောက်တည်း စားရတာ ကြိုက်တယ်။', en: "It's fine. I like eating on my own.", need: 'afraid', seems: 'own', face: 'happy', heard: true,
        tell: { my: 'ရွေးချယ်မှု မဟုတ်ဘူး။ ဆိုင်တွေဘက်ကို လှမ်းလှမ်းကြည့်နေတယ်။ သူများကို အနှောင့်အယှက် ဖြစ်မှာ ကြောက်နေတာ။', en: "Not a choice. He keeps glancing at the stalls. He's afraid of being a bother." },
        ask: { my: 'မင်း တကယ် တစ်ယောက်တည်း စားရတာ ကြိုက်လို့လား။', en: 'Do you really like eating alone?' } }, // Ei Mon asks
    ] },
    { lines: [
      { my: 'အိမ်မှာတော့ အားလုံး ထမင်းအိုးတစ်အိုးတည်း ဝိုင်းစားကြတာ။ ဒီမှာတော့ ဘယ်သူ့ကို ခေါ်ရမှန်း မသိဘူး။', en: "At home everyone eats round one pot. Here I don't know who to ask.", need: 'unknown', seems: 'looksdown', face: 'sad', heard: true,
        tell: { my: 'မီးဖိုတန်းကို အထင်သေးနေတာ မဟုတ်ဘူး။ ဘယ်လို ဝင်ရောရမလဲ မသိတာ။', en: "He doesn't look down on the Row. He doesn't know how to come in." },
        ask: { my: 'အိမ်မှာတုန်းက ဘယ်သူတွေနဲ့ အတူ စားခဲ့တာလဲ။', en: 'Who did you eat with, back home?' } },
    ] },
    { lines: [
      { my: 'လှည်း မှောက်သွားတုန်းက ကျွန်တော် ရယ်လိုက်မိတယ်။ တကယ်တော့… အိမ်ပဲ ပြန်ချင်နေတာ။', en: 'When the cart tipped I laughed. Really… I just wanted to go home.', need: 'given', seems: 'hot', face: 'sad', mood: 'down', heard: true, steam: 1,
        tell: { my: 'စိတ်တိုနေတာ မဟုတ်ဘူး။ ထမင်းချိုင့်ကို ပိတ်ပြီး အဖုံးကို ဖိထားတယ်။ လက်လျှော့ဖို့ နီးနေပြီ။', en: "Not temper. He's shut the tiffin and is pressing the lid down. He's close to giving up." },
        ask: { my: 'ရယ်မောပြီး ဖုံးလိုက်တော့ ပိုလေးသွားသလား။', en: 'Did laughing it off make it heavier?' } },
    ] },
    { lines: [
      { my: 'လှည်း ဘာလို့ မှောက်သွားလဲ ကျွန်တော် မသိဘူး။ ကျွန်တော် ညံ့လို့ပဲ နေမှာပါ။', en: "I don't know why the cart tipped. I must just be no good.", need: 'unknown', face: 'think',
        tell: { my: 'ညံ့လို့ မဟုတ်ဘူး။ လေးတဲ့ဗန်းတွေက အပေါ်မှာ ရောက်နေလို့။ သူ နည်းလမ်း မသိသေးတာပဲ ရှိတာ။', en: "Not no good. The heavy trays were on top. He just doesn't know the way yet." } },
      { my: 'ဒီလမ်းထဲမှာ ကျွန်တော့်ကို ဘယ်သူမှ လိုအပ်မယ် မထင်ပါဘူး။', en: "I don't think anyone on this street needs me.", need: 'afraid', face: 'sad',
        tell: { my: 'သူ တကယ် ပြောတာ မဟုတ်ဘူး။ သူများကို ဝန်ထုပ်ဝန်ပိုး ဖြစ်မှာ ကြောက်နေတာ။', en: "He doesn't mean it. He's afraid he's a burden." } },
    ] },
    { lines: [ // his
      { my: 'လှည်းပေါ် ပြန်တင်ရဦးမယ်… ကျွန်တော်…', en: 'I have to load the cart again… I…', need: 'own', face: 'think',
        tell: { my: 'ဒီခြေလှမ်းက သူ့အပိုင်းပဲ။ အိမွန် နောက်ဆုတ်ပေးလိုက်တယ်။', en: 'This step is his. Ei Mon steps back.' } },
    ] },
  ],
  react: {
    miss: { my: '…ဟုတ်ကဲ့။', en: '…Right.' },
    hot: { my: '(မောင်အာကာ မြေကြီးကို ကြည့်ပြီး ပြုံးနေတယ်။ ဘာမှ ရင်ထဲ မဝင်တော့ဘူး။)', en: '(Maung Arkar smiles at the ground. Nothing gets in.)' },
    interrupt: { my: '(အိမွန်က အကြံပေးဖို့ ကြားဖြတ်ပြောလိုက်တယ်။ မောင်အာကာ တံခါးပြန်ပိတ်သွားပြန်ပြီ။)', en: '(Ei Mon cuts in with advice. Maung Arkar closes up again.)' },
    lean: { my: 'အိမွန် ပြောတဲ့အတိုင်းပဲ လုပ်ပါ့မယ်…', en: "I'll just do what you say, Ei Mon…" },
  },
  decision: [
    { my: 'အလေးတွေကို အောက်မှာထား။ ငါ့ဘာသာ တင်မယ်။ မှားရင် ပြပေးနော်။', en: "Heavy at the bottom. I'll load it myself. If I get it wrong, show me?", face: 'happy' },
    { my: 'မနက်ဖြန် နင့်ဆိုင်ကို ထမင်းချိုင့် ယူလာခဲ့မယ်။', en: "Tomorrow I'll bring my tiffin to your shop.", face: 'happy' },
  ],
};

// ---------------------------------------------------------------------------------------------
// ch 15 · their first squabble at the cart (two voices)
// ---------------------------------------------------------------------------------------------
export const D9_SQ_CARDS = [
  { id: 'cloud', name: { my: 'စေတနာက ပူလောင်မှု မရှိဘူး', en: "Goodwill doesn't burn" }, companion: 'cloud', // Cool Cloud (ch 7)
    line: { my: 'နှစ်ယောက်စလုံးက စေတနာနဲ့ပါ။ စေတနာဆိုတာ ပူလောင်နေစရာ မလိုပါဘူး။', en: "You both mean well. Meaning well doesn't have to burn." },
    answers: ['hot'], from: { my: 'တိမ်အေး', en: 'the Cool Cloud' } },
  { id: 'earth', name: { my: 'မြေကြီးလိုပဲ', en: 'Like the earth' }, companion: 'earth', // Little Earth (ch 8)
    line: { my: 'မြေကြီးလိုပဲ ခဏလောက် ငြိမ်ငြိမ်လေး ထိုင်နေကြရအောင်။ ဘယ်သူ့ဘက်မှ မလိုက်ဘဲနဲ့ပေါ့။', en: "Let's sit still a moment, like the earth. Nobody's side." },
    answers: ['hot', 'looksdown'], from: { my: 'မြေကြီးလေး', en: 'Little Earth' } },
  { id: 'teach', name: { my: 'အချင်းချင်း သင်ပေးကြတာ', en: 'Each teaches the other' }, companion: 'firefly', // Firefly (ch 9)
    line: { my: 'အာကာက ပေါင်မုန့်အကြောင်း သိတယ်။ အိမွန်က ပစ္စည်းတင်တာ သိတယ်။ တစ်ယောက်ကို တစ်ယောက် ပြပေးလို့ ရတာပဲ။', en: 'Arkar knows bread. Ei Mon knows loading. Each can show the other.' },
    answers: ['afraid'], from: { my: 'ပိုးစုန်းကြူးလေး', en: 'the Firefly' } },
  { id: 'glad', name: { my: 'သူ့အတွက် ဝမ်းသာပေးလိုက်ပါ', en: 'Glad for her' }, companion: 'ribbon', // Two-Tailed Ribbon (ch 10)
    line: { my: 'အိမွန် စီတဲ့ဗန်းတွေ တစ်ခါမှ မမှောက်တာ အာကာ့အတွက်လည်း သတင်းကောင်းပဲလေ၊ သူ့နည်းလမ်းကို ယူသုံးလို့ ရတာပေါ့။', en: "Ei Mon's trays never tipping is good news for Arkar too: he can borrow the way." },
    answers: ['envy'], from: { my: 'အမြီးနှစ်ခွ ဖဲကြိုးလေး', en: 'the Two-Tailed Ribbon' } },
  { id: 'sideHer', lookalike: true, name: { my: 'အိမွန် ပြောတာ မှန်တယ်', en: "Ei Mon's right" },
    line: { my: 'အာကာ၊ အိမွန် ပြောတာ မှန်တယ်။ သူ ပြောတာပဲ နားထောင်လိုက်ပါ။', en: "Arkar, Ei Mon's right. Just listen to her." },
    shows: ['unknown'], really: { my: 'တစ်ဖက်သတ် ဘက်လိုက်မိတာ', en: 'taking a side' },
    backfire: { they: { my: 'ဒါဆို ကျွန်တော်ပဲ မှားတာပေါ့။ အမြဲတမ်းလိုပဲ။', en: "So it's me who's wrong. As always." },
                maya: { my: '(ငါ ဘက်လိုက်မိသွားပြီ။ ရန်ပွဲက ပိုကြီးသွားပြီ။)', en: '(I took a side. The squabble just got bigger.)' } } },
  { id: 'sideHim', lookalike: true, name: { my: 'သူ့ကို ငေါက်မနေပါနဲ့', en: "Don't snap at him" },
    line: { my: 'အိမွန်၊ အာကာ့ကို ငေါက်မနေပါနဲ့။ သူ မနက်ကတည်းက ပင်ပန်းနေတာ။', en: "Ei Mon, don't snap at Arkar. He's been worn out since morning." },
    shows: ['hot'], really: { my: 'တစ်ဖက်သတ် ဘက်လိုက်မိတာ', en: 'taking a side' },
    backfire: { they: { my: 'ငါ ကူညီဖို့ ကြိုးစားနေတာလေ။ ဒါဆို ငါက လူဆိုးပေါ့။', en: "I was trying to help! So I'm the bad one." },
                maya: { my: '(ငါ ဘက်လိုက်မိသွားပြီ။)', en: '(I took a side.)' } } },
];

export const TALK_D9_SQUABBLE = {
  id: 'd9-squabble',
  person: 'eimon',
  with: ['maungarkar'],
  steam: 1, calm: 4, turns: 7, // Ei Mon's first line adds 1: warm, not yet hot
  theirs: [2, 3],
  hand: D9_SQ_CARDS,
  tutorial: [
    { at: 'acts', my: 'ရန်ပွဲ မဟုတ်ဘူး၊ စကားများကြတာ။ ဘယ်သူ့ဘက်မှ မလိုက်နဲ့၊ နှစ်ယောက်စလုံးကို အေးအောင် လုပ်ပေးလိုက်။ ကိုယ့်လေသံ ကိုယ်ပြန်ပြင်ဖို့က သူတို့အပိုင်းပဲ။', en: 'Not a fight, a squabble. Take no side; cool them both. Mending their own tone is theirs.' },
  ],
  stones: [
    { lines: [
      { who: 'eimon', my: 'ငါ ပြောသားပဲ။ အလေးတွေကို အောက်မှာထားလို့။ ဘာလို့ အပေါ် ပြန်တင်လိုက်တာလဲ။', en: "I told you! Heavy at the bottom! Why'd you put it on top again!", need: 'hot', seems: 'looksdown', face: 'hot', steam: 1,
        tell: { my: 'သူ့ကို အထင်သေးနေတာ မဟုတ်ဘူး။ လူအများရှေ့မှာ ထပ်မှောက်သွားမှာကို ကြောက်နေတာ။', en: "She doesn't look down on him. She's scared it'll tip again in front of everyone." },
        ask: { my: 'အခုလေးတင် နင် ဘာကို စိတ်ပူသွားတာလဲ။', en: 'What were you worried about, just then?' } },
      { who: 'maungarkar', my: 'ရွာက လာလို့ ဘာမှ မသိဘူး ထင်နေတာလား။', en: "Think I know nothing because I'm from a village?", need: 'afraid', seems: 'hot', face: 'hot',
        tell: { my: 'ဒေါသထွက်နေတာ မဟုတ်ဘူး။ ရှက်နေတာ။', en: 'Not angry. Ashamed.' } },
    ] },
    { lines: [
      { who: 'maungarkar', my: 'နင့်ဆိုင်က ဗန်းတွေကျ တစ်ခါမှ မမှောက်ဘူး မဟုတ်လား။ နင်က အရာရာ တော်နေတာပဲ။', en: "Your shop's trays never tip, right! You're good at everything!", need: 'envy', seems: 'hot', face: 'hot',
        tell: { my: 'ဒေါသထွက်နေတာ မဟုတ်ဘူး။ နည်းနည်း မနာလို ဖြစ်ပြီး သိမ်ငယ်သွားတာ။', en: 'Not anger. A little envy, and feeling small.' } },
    ] },
    { lines: [ // hers
      { who: 'eimon', my: '…ငါ အသံကျယ်သွားတယ်။ စိတ်ပူသွားလို့ပါ။ …ဆောရီးနော်။', en: '…I got loud. Because I was worried. …Sorry.', need: 'own', face: 'sad',
        tell: { my: 'သူ့လေသံ သူ ပြန်ပြင်နေပြီ။ နောက်ဆုတ်ပေးလိုက်ပါ။', en: 'She is mending her own tone. Step back.' } },
    ] },
    { lines: [ // his
      { who: 'maungarkar', my: 'ငါ မနာလို ဖြစ်သလို ပြောမိသွားတယ်။ …နောက်တစ်ခေါက် ပြန်ပြပေးပါလား။ ဖြည်းဖြည်းချင်းပေါ့။', en: 'I said it like I was jealous. …Show me again? Slowly.', need: 'own', face: 'think',
        tell: { my: 'သူ့လေသံ သူ ပြန်ပြင်နေပြီ။ နောက်ဆုတ်ပေးလိုက်ပါ။', en: 'He is mending his own tone. Step back.' } },
    ] },
  ],
  react: {
    miss: { my: '…ဘာလဲ အစ်မ။', en: '…What, sister?' },
    hot: { my: '(တစ်ယောက်က လှည်းတစ်ဖက်စီကို ဆုပ်ကိုင်ထားတယ်။ ဘယ်သူမှ ဘာမှ မကြားတော့ဘူး။)', en: '(Each grips one side of the cart. Neither hears a thing.)' },
    lean: { my: 'အစ်မ ပြောကြည့်လေ၊ ဘယ်သူ မှန်လဲ။', en: "You say, sister, who's right?" },
  },
  decision: [
    { who: 'eimon', my: 'နင် တင်ကြည့်၊ ငါ ကြည့်ပေးမယ်။ မှားမှပဲ ပြောမယ်။', en: "You load, I'll watch. I'll only say if it's wrong.", face: 'happy' },
    { who: 'maungarkar', my: 'အလေးတွေကို အောက်မှာထား… ငါ ကြိုးချည်ပေးမယ်။', en: "Heavy at the bottom… I'll tie the rope.", face: 'happy' },
  ],
};
