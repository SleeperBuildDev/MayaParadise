// Day 1's talk: the fair. Pho Thar must pick ONE table (stitching or windmills) and picks for himself.
// Format: see the top of js/story/talk.js. Burmese lines are drafts for Maya to proofread.
//
// His real needs here: he doesn't know which (မသိ), he is afraid of letting his teacher down
// (ကြောက်), and he has a little given up on the windmills (လက်လျှော့). The pencil labels are what it
// looks like from outside; twice they are wrong (hearsay), and Look shows the truth.
// Maya's hand: two plain cards earned in the practice, and one look-alike (choosing for him).

export const D1_CARDS = [
  {
    id: 'once',
    name: { my: 'နောက်တစ်ခါ', en: 'Once more' },
    line: { my: 'မှားလည်း ရပါတယ်။ နောက်တစ်ခါ ထပ်လုပ်ကြည့်ရုံပဲနော်။', en: "Getting it wrong is fine. We just try once more." },
    answers: ['given', 'afraid'],
    from: { my: 'လေ့ကျင့်ရင်း ရခဲ့တာ', en: 'from the practice' },
  },
  {
    id: 'love',
    name: { my: 'ဘာကို အချစ်ဆုံးလဲ', en: 'What do you love most?' },
    line: { my: 'ဖိုးသား ဘာလုပ်ရတာကို အချစ်ဆုံးလဲဟင်။', en: 'Pho Thar, what do you love doing most?' },
    answers: ['unknown'],
    from: { my: 'မာရာ့ကိုယ်ပိုင်', en: "Maya's own" },
  },
  {
    id: 'stitch',
    lookalike: true,
    name: { my: 'ချုပ်ရိုးပဲ ဝင်ပါ', en: 'Enter stitching' },
    line: { my: 'ချုပ်ရိုးပဲ ဝင်ပါ၊ ခုနကပဲ နိုင်ခဲ့တာ။', en: 'Enter stitching, you just won.' },
    shows: ['unknown'], // looks like it answers "doesn't know"…
    really: { my: 'သူ့အစား ရွေးပေးတာ', en: 'choosing for him' }, // …but it is this
    backfire: {
      they: { my: 'ဟုတ်… ဟုတ်ကဲ့…', en: 'Oh… okay…' },
      maya: { my: '(ကျွန်မ သူ့အစား ရွေးပေးနေမိပြီ။ ဒါ သူ့လမ်းပဲ။)', en: "(I'm choosing for him. It's his road.)" },
    },
  },
];

export const TALK_D1_FAIR = {
  id: 'd1-fair',
  person: 'phothar',
  with: ['ukyaw'], // also in the scene: talking to him is not "doing something else"
  steam: 1,
  calm: 4,
  turns: 7,
  hand: D1_CARDS,
  tutorial: [
    { at: 'path', my: 'ဖိုးသားက သူ့လမ်းညွှန်တိုင်ဆီ ကိုယ်တိုင် လျှောက်ရမယ်။ မာရာက ဘေးကနေ ကူပေးရုံပဲ။', en: 'Pho Thar walks to his own signpost himself. Maya only helps from beside him.' },
    { at: 'label', my: 'ခဲတံစာက အပြင်က မြင်ရတာ။ "ကြည့်" ရင် အမှန်ကို ရွှေမင်နဲ့ မြင်ရမယ်။ စိတ်အေး တစ်စက် ကုန်တယ်။', en: 'The pencil word is how it looks from outside. Look shows the truth in gold, for one calm.' },
    { at: 'hand', my: 'လေ့ကျင့်ရင်း ရခဲ့တဲ့ စကားတွေပါ။ ကိုက်ရင် တစ်လှမ်း တိုးမယ်။ မကိုက်ရင် စိတ်အေး တစ်စက် လျော့မယ်။', en: 'Words you earned in the practice. One that fits moves him a step; one that does not costs a calm.' },
    { at: 'steam', my: 'ခွက်က ငွေ့ သုံးကြောင်း တက်ရင် စကား နားထဲ မဝင်တော့ဘူး။ အရင် နားထောင်ပေးပါ။', en: 'Three wisps from his cup and words stop entering the ear. Listen first.' },
  ],
  stones: [
    {
      lines: [
        { my: 'ချုပ်ရိုးမှာ နိုင်ခဲ့ပြီ… ဒါပေမဲ့ လေရဟတ်… မာရာ၊ ကျွန်တော် ဘာရွေးရမလဲ။', en: 'I just won at stitching… but the windmills… Maya, which should I pick?', need: 'unknown', face: 'worried',
          tell: { my: 'တကယ်ကို မဆုံးဖြတ်နိုင်သေးဘူး။ စားပွဲ နှစ်လုံးကို တလှည့်စီ ကြည့်နေတယ်။', en: 'He truly has not decided. His eyes go from one table to the other.' } },
        { my: 'စားပွဲ နှစ်လုံး၊ တစ်ခုပဲ ရွေးရမယ်… ခေါင်းထဲမှာ လေရဟတ်လို လည်နေတယ်။', en: "Two tables, only one entry… my head's spinning like a windmill.", need: 'unknown', face: 'think',
          tell: { my: 'ဘယ်ဟာ ပိုချစ်လဲ ကိုယ့်ကိုယ်ကို မမေးဖူးသေးဘူး။', en: 'He has never asked himself which one he loves more.' } },
      ],
    },
    {
      lines: [
        { my: 'ဘာရွေးရမှန်း… ကျွန်တော် မသိဘူး။', en: "I… don't know what to pick.", need: 'afraid', seems: 'unknown', face: 'worried',
          tell: { my: 'မျက်လုံးက ဦးကျော်ညွန့်ဆီ ခဏခဏ ရောက်သွားတယ်။ မသိလို့ မဟုတ်ဘူး… ဆရာ စိတ်ပျက်မှာ ကြောက်နေတာ။', en: "His eyes keep going to U Kyaw Nyunt. It isn't that he doesn't know… he's afraid of letting his teacher down." } },
        { my: 'ဆရာက နေ့တိုင်း သင်ပေးခဲ့တာ။ ချုပ်ရိုး မဝင်ရင် ဆရာ စိတ်မကောင်း ဖြစ်မှာ။', en: "He taught me every day. If I don't enter stitching, he'll be sad.", need: 'afraid', seems: 'cling', face: 'sad',
          tell: { my: 'ဆရာ့ကို တွယ်တာလို့ မဟုတ်ဘူး။ ဆရာ စိတ်ပျက်မှာကို ကြောက်နေတာ။', en: "He isn't clinging to his teacher. He's afraid of disappointing him." } },
      ],
    },
    {
      lines: [
        { my: 'လေရဟတ်က ကလေးကစားစရာပဲတဲ့။ လူကြီးတွေ ပြောတာ။', en: 'Windmills are just toys, the grown-ups say.', need: 'given', seems: 'looksdown', face: 'sad', mood: 'down',
          tell: { my: 'လေရဟတ်ကို အထင်သေးတာ မဟုတ်ဘူး။ အိတ်ထဲက လေရဟတ်လေးကို တင်းတင်း ကိုင်ထားတယ်။ လက်လျှော့ချင်နေပြီ။', en: "He doesn't look down on windmills: he's holding the little one in his pocket tight. He's close to giving up on them." } },
        { my: 'ချုပ်ရိုးတုန်းကလိုပဲ… ကျွန်တော် မတတ်ပါဘူးလို့ပဲ ထင်နေမိတယ်။', en: 'Like with the stitches… I keep thinking I just can\'t.', need: 'given', face: 'sad', mood: 'down',
          tell: { my: 'ချုပ်ရိုးမှာ "ပါရမီ မပါဘူး" လို့ ပြောခဲ့သလိုပဲ။', en: 'The same "I have no gift" he said about stitching.' } },
      ],
    },
  ],
  react: {
    miss: { my: '…ဟင်?', en: '…Huh?' },
    hot: { my: '(ဖိုးသား ခေါင်းငုံ့နေတယ်။ ဘာမှ မကြားဘူး။)', en: '(Pho Thar stares at the ground. Nothing gets through.)' },
  },
  // his own decision, in his own words
  decision: [
    { my: 'လေရဟတ်။ ငယ်ငယ်ကတည်းက အချစ်ဆုံး။', en: "Windmills. I've loved them since I was little.", face: 'happy' },
    { my: 'ချုပ်တတ်လာပြီဆိုလည်း… ကျွန်တော် ကိုယ်တိုင် ရွေးတာ။ လေရဟတ်။', en: 'Even if I can stitch now… I choose for myself. Windmills.', face: 'happy' },
  ],
};
