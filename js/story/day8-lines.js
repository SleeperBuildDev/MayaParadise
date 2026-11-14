// Day 8's words (day8-spec 4-10), kept apart from the script (day8.js) so the script stays readable.
// Every Burmese line is a DRAFT for Maya to proofread; each carries its English. Lines marked (new) are
// small linking lines the spec left to the script (a look, a door, a tap); they follow the spec's lessons.
//
//   L        every line the day says, by beat
//   SLEPT7   Day 7's notebook lines for this morning (day7-spec 9; day7.js may export SLEPT7, which wins)
//   SLEPT8   tonight's lines for Day 9's morning (day8-spec 10)

export const SLEPT7 = {
  yeyint: { my: '"ဇာတ်လိုက်မဟုတ်တော့ ခုံသယ်ရတာ ပေါ့ပါးတယ်။" — ရဲယဉ့်', en: '"Not the lead, the benches felt light." — Ye Yint' },
  naychi: { my: '"သော့က ကျွန်မလက်ထဲမှာ။ မနက်ဖြန်… ဘာလုပ်ရမလဲ မာရာ ပြောပြမှာ။" — နေခြည်', en: '"The key is in my hand. Tomorrow… Maya will tell me what to do." — Nay Chi' },
  hninwai: { my: '"ဒီနှစ် ပြဇာတ်က စာအုပ်ထဲမှာ မပါတဲ့ စကားတွေနဲ့ ပြီးတယ်။" — ဒေါ်နှင်းဝေ', en: '"This year\'s play ended in words no book had." — Daw Hnin Wai' },
  maungnge: { my: '"တစ်ချက်ဆွဲတာနဲ့ ပွင့်တယ်။ ဘယ်သူ ချည်ပေးလဲ ကျွန်တော် သိတယ်။" — မောင်ငယ်', en: '"One tug and it opened. I know who tied it." — Maung Nge' },
  toetoe: { my: '"ဒီနေ့မေးခွန်း: တံတားက ဘာလို့ အလယ်မှာ မကျတာလဲ။" — တိုးတိုး', en: '"Today\'s question: why doesn\'t a bridge fall in the middle?" — Toe Toe' },
};

export const SLEPT8 = {
  naychi: { my: '"တစ်နေကုန် စောင့်ခဲ့တယ်။ မနက်ဖြန် ကိုယ့်ခြေနဲ့ တစ်လှမ်း လှမ်းကြည့်မယ်။" — နေခြည်', en: '"I waited all day. Tomorrow I\'ll take one step on my own feet." — Nay Chi' },
  thida: { my: '"တွင်းကို ဒီမနက်လည်း ကြည့်ခဲ့တယ်။ ပြည့်နေတုန်း။" — မသီတာ', en: '"I looked in the well again this morning. Still full." — Ma Thida' },
  kowunna: { my: '"မနေ့က မေးတတ်လာတယ်။ ဒီနေ့ နားထောင်တတ်အောင် သင်မယ်။" — ကိုဝဏ္ဏ', en: '"Yesterday I learned to ask. Today I\'ll learn to listen." — Ko Wunna' },
  utint: { my: '"အနှစ်လေးဆယ်ကြာမှ တစ်ဖက်ဘက်က ကြည့်ဖူးတယ်။" — ဦးတင့်', en: '"Forty years, and I\'d never looked from the other side." — U Tint' },
  kan: { my: '"ရှေးစကားကို လေးစားတယ်။ ဒါပေမဲ့ တွင်းကို ကိုယ်တိုင် ကြည့်တယ်။" — ဦးကံ', en: '"I respect the old sayings. And I look in the well myself." — U Kan' },
};

export const L = {
  // ---- 4. morning at home
  ww1: [{ my: 'မာရာရေ… မှတ်စုစာရွက်လေး ပြန်ရောက်ပြီ။ စာတစ်ကြောင်း ရေးပေးလိုက်တယ်တဲ့။', en: 'Maya… your notebook page is back. They wrote you a line.' }],
  yyNote: { my: 'အစ်မ… မနေ့ညက မနှစ်က မိန့်ခွန်း မပြောတော့ဘူး။ ဒီနှစ်အခန်းကိုပဲ ပြောတယ်။\nကိုယ့်အခန်း ပြီးတော့ ခုံတွေ ဝိုင်းသယ်တယ်။ စင်ပေါ်က နာရီက ဆက်လည်နေတာပဲ။\nဘာမှ မဖြစ်ဘူး။ ပေါ့သွားတယ်။', en: "Sister… last night I didn't give last year's speech. I said this year's scene.\nAfter my part I helped carry the benches. The stage clock kept going.\nNothing bad happened. I felt lighter." },
  // LESSON (ch 12, p67 line 2): an old saying, honoured and still checked with her own eyes
  ttQ: { my: '"ဒီနေ့မေးခွန်း: ပဲပင်ကို စကားပြောရင် မြန်မြန်ကြီးတယ်လို့ အဖွားက ပြောတယ်။ တကယ်လား။ အိုးတစ်လုံးကို စကားပြောမယ်၊ တစ်လုံးကို မပြောဘူး။ ကိုယ်တိုင် ကြည့်မယ်။" — တိုးတိုး', en: '"Today\'s question: Grandma says beans grow faster if you talk to them. Is it true? I\'ll talk to one pot and not the other, and see for myself." — Toe Toe' },
  // the signature is drawn by the letter overlay (— Nay Chi), so the text stops before it
  ncNote: { my: 'အစ်မ… ဦးတင့်က ပြောတယ်။ မနက်ဖြန် ပုံနှိပ်တိုက် ဖွင့်ချိန်မှာ အရင်ရောက်တဲ့သူ စာစီသင်ရမယ်တဲ့။\nကျွန်မ သွားသင့်လား။ အစ်မ ပြောတာကိုပဲ စောင့်နေမယ်။\nတံတားဘုတ်အောက်မှာ ရှိမယ်။', en: "Sister… U Tint says whoever is at the printing shed first when it opens tomorrow may learn to set type.\nShould I go? I'll wait for your word.\nI'll be under the bridge-board." },
  // CONTINUITY (d3.ncRoad === 'square'): the square's paster works for the press too; same chance, same miss
  ncNoteSquare: { my: 'အစ်မ… ဦးတင့်က ပြောတယ်။ မနက်ဖြန် ပုံနှိပ်တိုက် ဖွင့်ချိန်မှာ တံခါးဝ အရင်ရောက်တဲ့သူ စာရွက်ကပ်တဲ့ အလုပ် ရမယ်တဲ့။\nကျွန်မ သွားသင့်လား။ အစ်မ ပြောတာကိုပဲ စောင့်နေမယ်။\nတံတားဘုတ်အောက်မှာ ရှိမယ်။', en: "Sister… U Tint says whoever is at the shed door first when it opens tomorrow takes the paste-up round.\nShould I go? I'll wait for your word.\nI'll be under the bridge-board." },
  ncMaya: [{ my: '(ပုံနှိပ်တိုက်က အာရုဏ်တက်ကတည်းက ဖွင့်ပြီးပြီ… သူ ကျွန်မစကားကို မနက်ကတည်းက စောင့်နေတာ။)', en: "(The shed opened at dawn… and she's been waiting for my word since then.)" }],
  lift: [{ my: '(မနေ့က စာမျက်နှာပေါ်က ဇာတ်ခုံလေးနဲ့ သော့လေး ခုန်ထွက်လာကြတယ်။)', en: "(The little stage and the little key hop off yesterday's page.)" }],
  liftMaya: [{ my: 'ဇာတ်ခုံက သူတို့ဟာ။ သော့က သူတို့လက်ထဲမှာ။ ဒီနေ့ မမေ့ပါစေနဲ့။', en: "Their stage. The key in their own hand. Let me not forget it today." }],
  ww2: [
    { my: 'ဒါနဲ့… တံတားဟိုဘက်က နေ့စဉ်စာရွက် ဒီမနက် ရောက်လာတယ်။ တံတားထိပ်က စာတိုက်ပုံးကို ကိုးနာရီမှ ထုတ်တယ်တဲ့။', en: 'Oh… the day sheet from over the bridge came this morning. It says the box at the bridge foot is cleared at nine.' },
    { my: 'အဲဒီပုံးကို ကျွန်မကိုယ်တိုင် ခြောက်နာရီ ထုတ်တာ။ ဒီမနက်လည်း ခြောက်နာရီ ထုတ်ခဲ့တယ်။ စာရွက်ကို ယုံပြီး နောက်ကျမှ ထည့်တဲ့သူတွေ တစ်ရက် နောက်ကျကုန်မှာပဲ။', en: 'I clear that box myself, at six. I did this morning too. Anyone who trusts the sheet and posts late will lose a day.' },
    { my: 'ပြီးတော့… စာတိုက်နံရံက မာရာ့အဖြေတွေကို လူတွေက စာရွက်ပေါ် ကူးပြီး တံတားဟိုဘက် ယူသွားကြတယ်။', en: 'And… people copy your answers off the Post Office wall onto slips and carry them over the bridge.' },
  ],
  wwLater: [{ my: 'တံတားက စာအိတ်ဈေးရဲ့ အရှေ့ဘက်အစွန်ကနေ စတာ။ ကားနဲ့ပဲ ဖြတ်ဖြတ်၊ လမ်းလျှောက်ပဲ ဖြတ်ဖြတ်။ ပုံနှိပ်နေ့ဆို ပိတ်တယ်လို့ ပြောကြတာပဲ… ကျွန်မ ခြောက်နာရီ ဖြတ်တုန်းကတော့ ဖွင့်ထားတယ်။', en: "The bridge starts at the Envelope Market's east edge. Drive it or walk it. People say it's shut on printing days… it was open when I crossed at six." }],
  wwEvening: [{ my: 'နေ့ချင်းပြင်ချက် စာရွက်လေး ပါလာတယ်။ မနက်ဖြန် ခြောက်နာရီ ပုံး ပြည့်နေမှာ။', en: 'A correction came with the evening sheets. Tomorrow at six that box will be full.' }],
  // Khwar Nyo (Envelope Market, optional)
  kn: [
    { my: 'မာရာ! တံဆိပ်ထုဖို့ မင်တစ်အိုး သိမ်းထားလို့ မာရာ ပြောခဲ့တာလေ။ ကျွန်မ တစ်အိုးပဲ သိမ်းထားတာ။', en: 'Maya! You told me to keep a pot of ink for the stamp day. I kept ONE pot.' },
    { my: 'အခု တံတားဟိုဘက်မှာ လူတိုင်း မင်အိုးတွေ ပိုက်ပြီး "မာရာ ပြောတယ်" တဲ့။ ကျွန်မ ပြောပြလို့လားမသိဘူး… စိတ်မကောင်းဘူး။', en: 'Now everyone over the bridge is hugging ink jars saying "Maya says". Maybe because I told the story… I feel bad.' },
  ],
  knLater: [{ my: 'တစ်အိုးပဲနော် မာရာ။ တစ်ယောက်၊ တစ်နေ့။', en: 'Just the one pot, Maya. One person, one day.' }], // (new)
  arrival: { my: 'ဒီတံတားက ပုံနှိပ်နေ့လည်း ဖွင့်ထားသားပဲ။ စာမျက်နှာရဲ့ အခေါက်ကြောင်းပေါ် ရောက်ပြီ။', en: "The bridge is open on a printing day after all. I'm standing on the page's fold." },

  // ---- 5. Nay Chi at the bridge-board
  ncCall: { my: 'အစ်မ! အစ်မ!', en: 'Sister! Sister!' },
  nc1: [
    { my: 'အစ်မ ပြောမှ သွားမယ်ဆိုပြီး အာရုဏ်ကတည်းက ဒီမှာ စောင့်နေတာ။', en: "I've been waiting here since dawn, so I'd go when you said." },
    { my: 'ကိုဝဏ္ဏက ပုံနှိပ်တိုက် တံခါးဝမှာ အရင်ရောက်သွားတယ်။ အခု သူ စာစီသင်နေပြီ။', en: "Ko Wunna got to the shed door first. He's learning to set type now." },
    { my: 'ကျောက်သင်ပုန်း ဆယ်ချပ် ရှိတယ်။ ဒီနေ့ ဘာလုပ်ရမလဲ ဆိုတာတော့ တစ်ချပ်မှာမှ မပါဘူး။ ပြောပါ အစ်မ။', en: 'I have the ten slates. None of them says what to do today. Tell me, sister.' },
  ],
  ncRead: [{ my: 'မနက်တိုင်း ဖတ်ပြမယ်လို့ အစ်မ ပြောခဲ့တယ်လေ… ဒီမနက် ကိုယ့်ဘာသာ ဖတ်ကြည့်တယ်။ ဒီနေ့ ဘာလုပ်ရမလဲ ဆိုတာ မပါဘူး။', en: "You said you'd read them to me every morning… I read them myself this morning. None says what to do today." }],
  ncChoices: [
    { my: '"မနက်ဖြန် အာရုဏ်မတက်ခင် သွားလိုက်။"', en: '"Go tomorrow before dawn."' },
    { my: '"ဦးတင့်ကို အစ်မ ပြောပေးမယ်။"', en: '"I\'ll speak to U Tint for you."' },
    { my: '"အစ်မ ဒီမှာ မရှိရင် ညီမ ဘာလုပ်မလဲ။"', en: '"If I weren\'t here, what would you do?"' },
  ],
  ncGo: [{ my: 'ဟုတ်ကဲ့! အစ်မ ပြောတဲ့အတိုင်း လုပ်မယ်။ …နောက်တစ်ခါလည်း ပြောပေးနော်။', en: "Okay! I'll do what you say. …Tell me next time too, okay?" }],
  ncGoMaya: [{ my: '(နောက်ထပ် "မာရာ ပြောတယ်" တစ်ခု။ သူ ကျွန်မကိုပဲ ထပ်မှီလိုက်ပြန်ပြီ။)', en: '(One more "Maya says". She\'s leaning on me again.)' }],
  ncSpeak: [{ my: 'ကျေးဇူးပဲ အစ်မ… အစ်မ ပြောရင် ရမှာပါ။', en: "Thank you, sister… if you ask, it'll work." }],
  ncSpeakMaya: [{ my: '(ဒါဆို အဲဒီအခွင့်က ကျွန်မ အခွင့် ဖြစ်သွားမယ်။ သူ့ဟာ မဟုတ်တော့ဘူး။)', en: '(Then the chance would be mine, not hers.)' }],
  ncHand: [
    { my: '…', en: '…' },
    { my: 'အရင်က အစ်မ အမြဲ ပြောပေးခဲ့တာပဲ။ ဒီနေ့ ဘာလို့ မပြောတာလဲ။', en: 'You always told me before. Why not today?' },
    { my: '(သော့ကြိုးကို ဆုပ်ထားရင်း တံတားဘက် လှည့်သွားတယ်။)', en: '(She grips the key string and turns to the bridge.)' },
  ],
  ncHandMaya: [
    { my: '(ကျွန်မ ပြောခဲ့တာ တစ်ခုမှ မမှားဘူး။ ကျွန်မအတွက် မှန်ခဲ့တာ။)', en: '(Nothing I told her was wrong. It was true for me.)' },
    { my: '(ဒါပေမဲ့ သူ တစ်နေကုန် ဒီမှာ ရပ်နေခဲ့တယ်။ သူ့ခြေထောက်က ကျွန်မ စကားကို စောင့်နေခဲ့တာ။)', en: '(But she stood here all day. Her feet were waiting for my words.)' },
  ],
  ncLater: [{ my: 'စဉ်းစားနေတုန်း… ဒီနားမှာပဲ ရှိမယ်။', en: "I'm still thinking… I'll be around here." }],
  ncAfter: [{ my: 'ကိုဝဏ္ဏကို စာစီတာ သွားကြည့်တယ်… ကျွန်မလည်း တစ်နေ့… (သော့ကို ကိုင်ကြည့်တယ်။)', en: 'I watched Ko Wunna set type… one day I… (She looks at her key.)' }],
  ncWell: [{ my: 'ဘာရေးရမလဲ မသိသေးဘူး… ကိုယ့်ဘာသာ စဉ်းစားမယ်။', en: "I don't know what to write yet… I'll think on my own." }],

  // ---- 6. ch 13: Ko Wunna and U Tint
  wunna: [{ my: 'အစ်မ… ဒီမနက် ပုံနှိပ်တိုက် အရင်ရောက်တာ ကျွန်တော်ပါ။ နေခြည် မလာဘူး။ မနေ့က သူလည်း ကြားခဲ့တာ။', en: "Sister… I was first at the shed this morning. Nay Chi didn't come. She heard it too, yesterday." }],
  kw1: [
    { my: 'မနက်ကတည်းက ကျွန်တော် အရင်ရောက်တာ။ ရှင်းပေးမလားလို့ မေးပြီးမှ လုပ်တာနော်။', en: 'I was first here this morning. And I ASKED before I tidied, okay?' },
    { my: 'အံဆွဲထဲက စာလုံးတုံးတွေ အကုန် တစ်ဖက်တည်း လှည့်ပြီး သပ်သပ်ရပ်ရပ် စီပေးခဲ့တယ်။', en: 'I turned every type block the same way up, nice and neat.' },
    { my: 'ဦးတင့်ကတော့ ကျွန်တော့်ကို စကားမပြောတော့ဘူး။ နေ့စဉ်စာရွက်လည်း မှားသွားတယ်တဲ့။ ကျွန်တော် ဘာမှားလဲ မသိဘူး။', en: "Now U Tint won't speak to me. And the day sheet came out wrong, they say. I don't know what I did." },
  ],
  kwWait: [{ my: 'အထဲမှာ အံဆွဲတွေ ကြည့်ပါလား။ ကျွန်တော် ကောင်းအောင် လုပ်ထားတာ။', en: 'Look at the drawers inside. I did them nicely.' }],
  kwInside: [{ my: 'ကြည့်… ညီညီညာညာ။ တံခါးဝကကြည့်ရင် လှတယ်မဟုတ်လား။', en: "See… all even. Lovely from the door, isn't it?" }], // (new)
  // the three looks: pencil (heard) -> gold (seen)
  look: {
    cases: { pencil: { my: '(ကောင်လေးက ဖျက်ဆီးသွားတာ… လို့ ကြားတယ်။)', en: '(The boy wrecked them… so they say.)' },
      gold: { my: 'ဖျက်ဆီးတာ မဟုတ်ဘူး။ အကုန် တစ်ဖက်တည်း လှည့်ပြီး သေသေသပ်သပ် စီထားတာ။ တံခါးဝကကြည့်ရင် လှတယ်။', en: 'Not wrecked: every block turned one way, neat. From the door it looks lovely.' } },
    labels: { pencil: { my: '(ဘာမှ ရေးမထားဘူး… လို့ ကြားတယ်။)', en: "(Nothing's marked… so they say.)" },
      gold: { my: 'အံဆွဲတိုင်းမှာ ကြေးပြားလေးနဲ့ နာမည် ရေးထားတယ်။ ကိုဝဏ္ဏ ကိုယ်တိုင် ဖတ်ကြည့်လို့ ရခဲ့တာ။', en: 'Every drawer has a small brass name. Ko Wunna could have read them himself.' } },
    title: { pencil: { my: '(အပိုင်းအစတွေပဲ… လို့ ကြားတယ်။)', en: '(Just scrap… so they say.)' },
      gold: { my: 'အမှိုက်ပုံးထဲမှာ ဒီတိုက်ရဲ့ နာမည်တုံး။ ဘာမှန်းမသိလို့ ပစ်လိုက်တာ… ရွှေတုံးကို ကျောက်ခဲထင်သလိုပဲ။', en: "The shed's own name block, in the scrap. Thrown out because nobody knew what it was… like taking a gold nugget for a stone." } },
    rings: { pencil: { my: '(ခန်းတော့မယ်… လို့ ကြားတယ်။)', en: '(Drying up… so they say.)' },
      gold: { my: 'အပေါ်ကနေ တတိယ အကွင်းအထိ ရှိတယ်။ ဒီနေ့ ပြည့်နေတယ်။', en: 'Up to the third ring from the top. Full, today.' } },
    oldmark: { pencil: { my: '(အရင်က ခန်းဖူးတယ်… လို့ ကြားတယ်။)', en: '(It went dry before… so they say.)' },
      gold: { my: 'တကယ် ကျဖူးတယ်။ ကိုမင်း မှန်တယ်။ ဒါပေမဲ့ အခု အဲဒီအောက်မှာ မဟုတ်ဘူး။', en: "It really did drop once; Ko Min is right. It isn't there now." } },
    queue: { pencil: { my: '(အကုန် ယူကုန်ပြီ… လို့ ကြားတယ်။)', en: '(Everyone took it all… so they say.)' },
      gold: { my: 'ခပ်လေ ပြန်ပြည့်လေ။ ဒါပေမဲ့ အိုးတွေက အိမ်မှာ စုထားလို့ လမ်းမှာ ကုန်နေတာ။', en: "The well refills as they dip. The jars sit at home; it's the street that runs short." } },
    pots: { pencil: { my: '(ကလေးတွေ ကိုယ့်ဘာသာ ရှာ… လို့ ကြားတယ်။)', en: '(Let the kids find their own… so they say.)' },
      gold: { my: 'ကျောင်းသုံး မင်အိုးလေးတွေ ဗလာ။ ဆိုင်တွေမှာ မင်မကျန်တော့လို့။', en: 'Little school ink pots, empty: the stalls have none left.' } },
  },
  titlePress: { my: '(ပြောင်းပြန်စာလုံးတွေနဲ့ တုံးကို စာရွက်အပိုင်းပေါ် ဖိကြည့်တော့… "ရွှေမင် ပုံနှိပ်တိုက်"။)', en: '(She presses the backwards block on a scrap of newsprint… "Gold Ink Press".)' }, // (new)
  kwTitle: [{ my: 'အဲဒါ… ကျိုးနေတယ်ထင်လို့။ စာလုံးတွေ ပြောင်းပြန်ဖြစ်နေလို့လေ။', en: 'That… I thought it was broken. The letters were all backwards.' }],
  turnTitle: { my: 'စာလုံးတုံး တစ်တုံး၊ လူနှစ်ယောက်', en: 'One block, two people' },
  turnHint: { my: 'တုံးကို တစ်ဝက်လှည့်ပြီး တစ်ဖက်လူဘက်က ကြည့်ပါ', en: 'Turn the block half round to see it from the other side' },
  turnSides: [
    { who: 'kowunna', reads: '6', line: { my: 'ကျွန်တော့်ဘက်က ကြည့်ရင် အကုန် ညီညီညာညာ။ ကူညီတာပဲလေ။', en: "From my side they're all straight and even. I was helping." } },
    { who: 'utint', reads: '9', line: { my: 'ငါ့ဘက်က ကြည့်ရင် တစ်တုံးမကျန် ဇောက်ထိုး။ ငါ့အံဆွဲကို လှောင်တာ။', en: 'From my side every one is upside down. He mocked my drawers.' } },
  ],
  turnDone: [{ my: 'တုံးက တစ်တုံးတည်း။ အလုပ်ကလည်း တစ်ခုတည်း။ ကြည့်တဲ့ဘက်ပဲ မတူတာ။', en: 'One block. One deed. Only the side you look from differs.' }],
  stoneWait: [{ my: '(ဦးတင့် ကျောက်ပြားပေါ်မှာ တုံးတစ်တုံးကို အလင်းဘက် ထောင်ကြည့်နေတယ်။)', en: '(U Tint holds a block up to the light over the stone.)' }], // (new)
  stoneAfter: [{ my: '(တုံးက တစ်တုံးတည်း။ ဘက်နှစ်ဖက်။)', en: '(One block. Two sides.)' }], // (new)
  kwAskQ: [{ my: 'ဦးတင့်ကို ဘယ်လို မေးရမလဲ… သုံးမျိုး ရေးကြည့်ထားတယ်။', en: 'How do I ask U Tint… I wrote three ways.' }],
  kwDrafts: [
    { my: '"ဆရာ၊ ကျွန်တော် ဘာမှ မသိဘူး။ အကုန် ပြပေးပါ။"', en: '"Teacher, I don\'t know anything. Show me everything."' },
    { my: '"ဆရာ၊ ကျွန်တော် အကုန် ပြန်စီထားပေးမယ်။ ဘာမှ ထပ်မမေးတော့ပါဘူး။"', en: '"Teacher, I\'ll put it all back. I won\'t bother you with questions."' },
    { my: '"ဆရာ၊ အံဆွဲ နာမည်တွေ ကျွန်တော် ဖတ်ပြီးပြီ။ စာလုံး ဘယ်ဘက်လှည့်ရမလဲတော့ မသိဘူး။ စက်ရပ်တဲ့အချိန် ခဏ ပြပေးနိုင်မလား။"', en: '"Teacher, I\'ve read the drawer names myself. But I don\'t know which way up the letters go. When the press stops, could you show me?"' },
  ],
  kwAll: [{ my: 'ဒါဆို ကိုယ်ဖတ်လို့ရတာကိုတောင် ဆရာ့ဆီ ပုံချသလို ဖြစ်မယ်။', en: "Then I'd be dumping even what I can read myself on him." }],
  kwNone: [{ my: 'မမေးဘဲ ထပ်လုပ်ရင်… ဒီမနက်လိုပဲ ထပ်ဖြစ်မှာ။', en: "If I just do it again without asking… it'll be this morning all over." }],
  kwRight: [
    { my: 'ကိုယ်သိနိုင်တာ အရင်သိ။ မသိတာကို ရှင်းရှင်းမေး။ စက်သံ ဆူနေတုန်း မမေးနဲ့။', en: "Find out what I can myself. Ask the rest clearly. Not while the press is thumping." },
    { my: 'ဒီမနက်က "ရှင်းပေးရမလား" လို့ပဲ မေးခဲ့တာ။ ဘာကို၊ ဘယ်လို ဆိုတာ မမေးခဲ့ဘူး။', en: 'This morning I only asked "shall I tidy?". Not what, or how.' },
  ],
  askedMaya: [{ my: '(မေးတတ်တာလည်း အသိပညာပဲ။)', en: '(Knowing how to ask is knowledge too.)' }],
  kwTalkToHim: [{ my: 'ဆရာ့ကို ခဏ စကားပြောပေးပါလား အစ်မ။ ကျွန်တော် ဒီမှာ စောင့်မယ်။ စက်ရပ်မှ မေးမယ်။', en: "Would you talk to him a moment, sister? I'll wait here. I'll ask when the press stops." }],
  kwLooking: [{ my: 'အံဆွဲတွေ၊ ကျောက်ပြားပေါ်က တုံး… ကြည့်ပြီးမှ ပြောပါ အစ်မ။', en: 'The drawers, the block on the stone… look first, then tell me, sister.' }], // (new)
  kwBench: [{ my: 'ဒီမှာ စောင့်နေမယ်။ စက်ရပ်မှ မေးမယ်။', en: "I'll wait here. I'll ask when the press stops." }], // (new)
  tint: [{ my: 'အလုပ်များတယ်။ ကြိုက်သလို လုပ်။', en: "I'm busy. Do what you like." }],
  tintNotYet: [{ my: 'ကဲ… စက်ကို ပြန်လည်ရဦးမယ်။', en: 'Well… the press needs turning.' }],
  tintAfter: [{ my: 'ကောင်လေးက မေးတတ်လာပြီ။ ငါကလည်း ဖြေတတ်အောင် ကြိုးစားနေတယ်။', en: "The boy's learning to ask. I'm learning to answer." }],
  tintBring: [{ my: 'ဟိုစာရွက်အတွက် စကား ရလာရင် ယူခဲ့။ ဘောင်က အသင့်ပဲ။', en: "Bring me the words for that other sheet when you have them. The frame's ready." }],
  tintPrintBlank: [{ my: 'စကား ရလာပြီလား။ ကဲ… ဘောင်ထဲ ထည့်လိုက်ပြီ။ ကွက်လပ်ကို ဗလာ ချန်ထားမယ်။', en: 'Got the words? Right… into the frame. The blank stays blank.' }], // (new)
  lockTitle: { my: 'ဦးတင့် ခေါ်၊ ကိုဝဏ္ဏ စီ', en: 'U Tint calls, Ko Wunna sets' },
  lockHint: { my: 'ခေါ်သံ ဆုံးမှ တုံးကို နှိပ်ပါ။ ဇောက်ထိုးဖြစ်နေရင် အရင်လှည့်ပါ', en: 'Wait for the call, then tap the block. Turn it first if it is upside down' },
  lockWrong: { my: 'ငါ ခေါ်တာ မဟုတ်သေးဘူး။', en: "I haven't called that one yet." },
  pullBar: [{ my: '(ဘားတန်းကို ဆွဲလိုက်တော့ စက်က တစ်ချက် ဒုန်းခနဲ။ ပြင်ဆင်ချက် စာရွက် ထွက်လာပြီ။)', en: '(She pulls the bar; the press thumps once. The correction sheet comes off.)' }], // (new)
  kwRun: [{ my: 'စာတိုက်ပုံးဆီနဲ့ ဘုတ်ဆီ ကျွန်တော် ကိုယ်တိုင် ပြေးကပ်မယ်!', en: "I'll run it to the box and the board myself!" }], // (new)
  tintEnd: [
    { my: 'ဒီမှန်ဘီလူးနဲ့ ပြောင်းပြန်စာလုံးတွေ စစ်တယ်။ ငါ့ဆီမှာ နှစ်ခု ရှိတယ်။ တစ်ခု ယူသွား။', en: 'I check backwards letters with this glass. I have two. Take one.' },
    { my: 'ကိုယ့်စကားကိုလည်း တစ်ဖက်လူဘက်က အရင် ကြည့်ပြီးမှ ပြောနော်။ ငါ ဒီနေ့မှ သင်ရတာ။', en: 'Look at your own words from the other side before you say them. I only learned that today.' },
  ],
  kwEnd: [{ my: 'နေ့စဉ်စာရွက်မှာ နာမည်တုံး ပြန်ပါလာပြီ။ ဆရာက အဲဒီတုံးကို ဘယ်လိုကိုင်ရလဲ ပြတယ်။ ကျွန်တော် ရှာဖွေ မေးမြန်းတတ်အောင် ဆက်သင်မယ်။', en: "The title block is back on the sheet. He showed me how to hold it. I'll keep learning, and learn how to ask." }],
  mayaEnd13: [{ my: '(အသိနဲ့ စေတနာ။ တစ်ခုတည်းဆိုရင် ကိုးဖြစ်သွားတတ်တယ်။ နှစ်ခုကို တွဲကိုင်ရမယ်။)', en: '(Knowing and goodwill. Either alone can come out a nine. Hold them together.)' }],
  kwOutside: [{ my: 'ပြင်ဆင်ချက် ကပ်ပြီးပြီ။ ဟိုဘုတ်ပေါ်မှာလည်း။', en: "Correction's up. On the board too." }], // (new)
  // the press's other corners (new)
  locker: [{ my: '(သော့ပေါက်ပါတဲ့ သေတ္တာလေး တစ်လုံး ပိတ်ထားတယ်။ တံဆိပ်ကွက်လပ်က ဗလာ။)', en: '(One little box with a keyhole, shut. Its tag is blank.)' }],
  dryingLine: [{ my: '(ကြိုးပေါ်က နေ့စဉ်စာရွက်တစ်ရွက်မှာ စာတိုက်ပုံးအချိန် "9:00" တဲ့။)', en: '(One day sheet on the line gives the box time as "9:00".)' }],
  pressIdle: [{ my: '(ပုံနှိပ်စက်။ ဘားတန်း ဆွဲရင် ဒုန်းခနဲ မြည်မယ်။)', en: '(The press. Pull the bar and it thumps.)' }],
  backYard: [{ my: '(နောက်ဖေးခြံမှာ စက္ကူနံရံနဲ့ ကြက်ခြံပဲ ရှိတယ်။ တွင်းဆီ ဖြတ်လမ်း မရှိဘူး။)', en: '(The back yard: a paper wall and a hen run. No lane to the well.)' }],
  backYardNoMap: [{ my: '(နောက်ဖေးခြံ။ စက္ကူနံရံနဲ့ ကြက်ခြံ။)', en: '(The back yard. A paper wall and a hen run.)' }],
  knee: [{ my: '(ကိုယ့်မြေပုံတောင် ကိုယ့်ဒူးလိုပဲ။ မမှီခင် စစ်ရတယ်။)', en: '(Even my own map is like my own knee: check it before you lean on it.)' }],
  slate: [{ my: '(ကျောက်သင်ပုန်းမှာ "မနက်ဖွင့်ချိန် အရင်ရောက်သူ စာစီသင်ရမယ်" တဲ့။ ဦးတင့် ကိုယ်တိုင် ကမ်းခဲ့တာ။)', en: '(The slate says "First at the door at opening learns to set type." U Tint offered it himself.)' }], // (new)

  // ---- 7. ch 12: the seven and the well
  slipTitle: { my: '"မာရာ ပြောတယ်" စာရွက်', en: 'A "Maya says" slip' },
  slips: [
    { slip: { my: 'မာရာ ပြောတယ်: တစ်နေ့ အိုးလေးလုံးပဲ လုပ်။', en: 'Maya says: make four pots a day.' },
      seen: { my: 'မိချိုက ကိုယ့်လက်နဲ့ ကိုယ်ရွေးတဲ့ အရေအတွက်။ မုန့်ဖုတ်တဲ့သူ တစ်ယောက်က မုန့် လေးလုံးပဲ ဖုတ်နေပြီ။', en: "Mi Cho's own load, chosen for her own hands. Now a baker bakes only four loaves." } },
    { slip: { my: 'မာရာ ပြောတယ်: နေရောင်ရတဲ့ နေရာမှာ စိုက်။', en: 'Maya says: plant where the sun reaches.' },
      seen: { my: 'တိုးတိုးရဲ့ ပဲပင်အတွက်။ အရိပ်ကြိုက်တဲ့ ပန်းအိုးတွေကိုပါ နေပူထဲ ရွှေ့ထားကြပြီ။', en: "For Toe Toe's beans. Now even shade-loving plants are dragged into the sun." } },
    { slip: { my: 'မာရာ ပြောတယ်: မင် သိမ်းထား။', en: 'Maya says: keep ink back.' },
      seen: { my: 'ခွာညိုကို တစ်အိုး၊ တံဆိပ်ထုမယ့်နေ့ တစ်နေ့အတွက် ပြောခဲ့တာ။', en: 'To Khwar Nyo: one pot, for one stamp day.' } },
  ],
  ownPage: [{ my: '(ကိုယ့် မှတ်စုစာအုပ်ထဲက ပဉ္စမနေ့ စာမျက်နှာကို ပြန်ဖွင့်ကြည့်တယ်။ "တစ်အိုး၊ တံဆိပ်ထုမယ့်နေ့ တစ်နေ့"။)', en: '(She opens her own notebook at the fifth day\'s page: "one pot, for one stamp day".)' }], // (new)
  slipsMaya: [
    { my: '(တစ်ကြောင်းမှ မမှားဘူး။ တစ်ယောက်အတွက် မှန်ခဲ့တာ။)', en: '(Not one of them is wrong. Each was right for one person.)' },
    { my: '(ဒါပေမဲ့ ဘယ်သူမှ မစစ်ဘဲ လိုက်လုပ်နေကြတယ်။ ကျွန်မ နာမည်ကြောင့်ပဲ။)', en: '(But everyone follows them unchecked. Because of my name.)' },
  ],
  boardAgain: [{ my: '(ကြော်ငြာစာ၊ နေ့စဉ်စာရွက်၊ "မာရာ ပြောတယ်" စာရွက် နှစ်ဆယ်လောက်။)', en: '(The handbill, the day sheet, about twenty "Maya says" slips.)' }], // (new)
  r7: {
    sein: [{ my: 'တံတားထိပ်မှာ လူတိုင်း ပြောနေကြတာ ကြားတာပဲ။ ကြားရင် သိမ်းထားရတာပေါ့။', en: 'Everyone at the bridge foot was saying it. You hear it, you keep some back.' }],
    kan: [{ my: 'ရှေးလူကြီးတွေ ပြောတယ်… "ခိုတွေ တွင်းက ထွက်သွားရင် မင်ကုန်မယ်" တဲ့။ ငါ ငယ်ငယ်ကတည်းက ကြားခဲ့တာ။', en: 'The old folk say: "when the pigeons leave the well, the ink goes." I\'ve heard it since I was small.' }],
    komin: [{ my: 'နွေရှည်နှစ်တုန်းက တစ်ခါ တကယ် ခန်းဖူးတယ်။ တွင်းထဲမှာ အမှတ်တောင် ရှိသေးတယ်။', en: "It really did go low once, the long-heat year. There's still a mark in the well." }],
    moemoe: [{ my: 'လူတွေ နေ့တိုင်း ခပ်နေတော့ ကုန်ရမှာပေါ့! ကျွန်မ ကိုယ်တိုင် တွက်ကြည့်တာ။', en: 'People dip every day, so it HAS to run out! I worked it out myself.' }],
    dawhla: [{ my: 'ကောင်းတာတွေက ဘယ်တော့မှ မခံဘူး။ ကျွန်မ အမြဲ ပြောတယ်။ ဒါကြောင့် ကြော်ငြာစာ ရိုက်ခိုင်းလိုက်တာ။', en: "Good things never last. I always say so. That's why I had the handbill printed." }],
    kosan: [{ my: '"ရွှေမင်တွင်း ခန်းတော့မယ်"… ဒီမှာ ပုံနှိပ်ထားတယ်လေ။ ပုံနှိပ်ထားရင် တစ်ခုခုတော့ ရှိမှာပေါ့။', en: '"The gold-ink well is drying up"… it\'s printed right here. If it\'s printed, there must be something in it.' }],
    thida: [{ my: 'မာရာ ပြောတယ်လေ… မင် သိမ်းထားတဲ့။ မာရာ့စကား ဘယ်တော့မှ မမှားဘူး။', en: "Maya says so… keep ink back. Maya's words are never wrong." }],
  },
  r7Maya: [{ my: '(လူခုနစ်ယောက်၊ အကြောင်းခုနစ်မျိုး။ ဘယ်သူမှ မလိမ်ဘူး။ ဒါပေမဲ့ တွင်းကို ဘယ်သူမှ သွားမကြည့်ရသေးဘူး။)', en: "(Seven people, seven reasons. Nobody's lying. But nobody has gone to look in the well.)" }],
  where: {
    kosan: [
      { my: 'ပုံနှိပ်တိုက်က ရင်ပြင်ကနေ အရှေ့ဘက် ထွက်တဲ့လမ်းမှာ။ တံခါးကြီး ဖွင့်ထားတယ်။ စက်သံ ဒုန်းဒုန်း ကြားရမှာ။', en: "The shed's on the street running east from the square. Big doors open. You'll hear the press thump." },
      { my: 'ဒေါ်စိန့် လက်ဖက်ရည်ဆိုင်ထဲမှာ လူတိုင်း ဒီအကြောင်းပဲ ပြောနေကြတယ်။ လှည်းရပ်ထားတဲ့ ဆိုင်လေ။', en: "Everyone's in Daw Sein's tea shop talking about it. The one with the cart outside." },
    ],
    sein: [
      { my: 'တွင်းက ရင်ပြင်အလယ်မှာပဲ။ တန်းစီနေတဲ့ နေရာ။ ကျွန်မတော့ မသွားရဲဘူး။', en: "The well's right in the middle of the square, where the queue is. I daren't go and see." },
      { my: 'စာရေးပေးတဲ့ မသီတာဆီ သွားကြည့်။ တံတားထိပ် စာတိုက်ပုံးဘေးက တံခါးပြာလေး။ အိုး ဆယ့်နှစ်လုံး ရှိတယ်တဲ့။', en: 'Go and see Ma Thida the letter-writer: the little blue door by the box at the bridge foot. Twelve jars, they say.' },
    ],
    dawhla: [{ my: 'ကျောင်းက မိုးမိုးကတောင် မြေဖြူနဲ့ တွက်ပြီးပြီ။ ရင်ပြင်ရဲ့ အရှေ့မြောက်ထောင့်၊ ခေါင်းလောင်းလေးနဲ့ အိမ်။', en: 'Even little Moe Moe at the school worked it out in chalk. The north-east corner, the house with the little bell.' }],
    kan: [{ my: 'ထောင့်က လှေကားပေါ်က ကိုမင်းကို မေးကြည့်။ နွေရှည်နှစ်ကို သူ မှတ်မိတယ်။', en: 'Ask Ko Min, up the ladder at the corner. He remembers the long-heat year.' }],
  },
  moemoeSum: { my: 'ခပ် + ခပ် + ခပ် … → ကုန်!', en: 'dip + dip + dip … → gone!' },
  sitThink: [{ my: '(ထိုင်ပြီး စဉ်းစားဖို့ လိုတယ်။ ဒေါ်စိန့်ဆိုင်က တံခါးဘေး စားပွဲလေး…)', en: "(I need to sit and think. The little table by Daw Sein's door…)" }],
  seinCup: [{ my: 'ရော့… ရေနွေးကြမ်း။ အကြံဉာဏ် မပါဘူးနော်။', en: 'Here… tea. No advice in it.' }], // (new)
  sortTitle: { my: 'ဘာကြောင့် ယုံလဲ', en: 'Why do they believe it?' },
  sortHint: { my: 'စာရွက်တစ်ရွက်ချင်း သင့်တော်တဲ့ ခြင်းထဲ ထည့်ပါ', en: 'Put each slip in the basket it belongs to' },
  baskets: [
    { id: 'told', label: { my: 'သူများ ပြောလို့', en: 'Others told me' } },
    { id: 'self', label: { my: 'ကိုယ့်ဘာသာ ယူဆလို့', en: 'I told myself' } },
  ],
  sortSlips: [
    { id: 'heard', who: 'sein', fits: 'told', label: { my: 'ပြောသံ ကြားလို့', en: 'I heard it said' } },
    { id: 'old', who: 'kan', fits: 'told', label: { my: 'ရှေးစကား ရှိလို့', en: 'An old saying' } },
    { id: 'printed', who: 'kosan', fits: 'told', label: { my: 'စာထဲမှာ ပါလို့', en: "It's printed" } },
    { id: 'revered', who: 'thida', fits: 'told', label: { my: 'ရိုသေတဲ့သူ ပြောလို့ (မာရာ)', en: 'Someone I revere said it (Maya)' } },
    { id: 'before', who: 'komin', fits: 'self', label: { my: 'အရင်က ဖြစ်ဖူးလို့', en: 'It happened before' } },
    { id: 'thought', who: 'moemoe', fits: 'self', label: { my: 'ကိုယ်တိုင် တွေးမိလို့', en: 'I worked it out' } },
    { id: 'view', who: 'dawhla', fits: 'self', label: { my: 'ကိုယ့်အမြင်နဲ့ ကိုက်လို့', en: 'It fits what I think' } },
  ],
  stampAll: { my: 'ဒါတစ်ခုတည်းနဲ့ မလုံလောက်သေးဘူး', en: 'Not enough on its own yet' },
  sortDone: [{ my: 'ခြင်းနှစ်ခုစလုံး မလုံလောက်သေးဘူး။ ကိုယ့်ဒူးကိုတောင် ကြည့်ပြီးမှ မှီရတာ။ …ဒါဆို ဘာနဲ့ ဆုံးဖြတ်မလဲ။', en: 'Neither basket is enough yet. You check even your own knee before you lean on it. …Then how do you decide?' }],
  fiveRise: [{ my: '(စာမျက်နှာ ၁၂ ကို ဖွင့်လိုက်တော့ မေးခွန်းငါးခု ခဲတံနဲ့ ထွက်လာတယ်။ ကောင်းလား။ အပြစ်ကင်းလား။ ပညာရှိ ချီးမွမ်းမလား။ အားလုံးအတွက် ကောင်းလား။ ကိုယ်တိုင် နားလည်လို့လား။)', en: '(She opens page 12; five questions rise off it in pencil. Is it good? Free of fault? Would the wise praise it? Good for all? Understood myself?)' }], // (new: the five pencil cards)
  sortOwnBook: [{ my: 'ဒီမေးခွန်းငါးခုကို ကျွန်မ စာအုပ်ကိုလည်း မေးခဲ့ရတာ။', en: 'I had to ask my own book these five questions too.' }],
  wellAll: [{ my: 'ဒီနေ့ ပြည့်နေတယ်။ ကိုယ်တိုင် ကြည့်ခဲ့တယ်။ မနက်ဖြန်လည်း ထပ်ကြည့်ရမှာပဲ။', en: 'Full today. I looked myself. Tomorrow, look again.' }],
  thidaNotYet: [{ my: 'စာ နှစ်စောင် ရေးစရာ ရှိသေးတယ်… ပြီးမှ။', en: 'I have two letters to finish… later.' }],
  thidaLean: [{ my: '(ကျွန်မ ပြန်ဖြေပေးလိုက်မိပြီ။ နောက်တစ်ခါ နောက်ဆုတ်ပေးမယ်။)', en: '(I answered for her again. Next time, step back.)' }],
  stepTitle: { my: 'နောက်ဆုတ်ပေး · Step back', en: 'Step back' },
  stepLine: { my: 'နောက်ဆုံးခြေလှမ်းက သူတို့ဟာ။', en: 'The last step is theirs.' },
  ownTitle: { my: 'ဘုတ်ပေါ်မှာ မာရာ ကိုယ်တိုင် ကပ်မယ့် စာကြောင်း', en: 'The line Maya pins on the board herself' },
  ownHint: { my: 'ကိုယ်တိုင် စစ်ကြည့်ပြီးသား စကားသုံးပိုင်းကို ရွေးပါ', en: 'Pick the three pieces you have checked yourself' },
  ownPrompt: { my: 'မာရာ ပြောတယ် စာရွက်တွေအပေါ်မှာ…', en: 'Above the "Maya says" slips…' },
  ownFragments: [
    { my: 'မယုံနဲ့ဦး။', en: "Don't believe it yet.", good: true },
    { my: 'ကိုယ်တိုင် သွားကြည့်ပါ။', en: 'Go and look yourself.', good: true },
    { my: 'ကိုယ်ရော သူများရော အားလုံးအတွက် ကောင်းတယ်လို့ ကိုယ်တိုင် နားလည်မှ လက်ခံပါ။', en: "Accept it once you yourself understand it's good for you, for others, for everyone.", good: true },
    { my: 'မာရာ ပြောတာ အမြဲ မှန်တယ်။', en: "What Maya says is always right.", good: false },
    { my: 'ဘယ်သူ့ကိုမှ မယုံနဲ့။', en: 'Believe nobody.', good: false },
    { my: 'ပုံနှိပ်ထားရင် မှန်တယ်။', en: "If it's printed, it's true.", good: false },
  ],
  parroted: [{ my: "(ဒါလည်း မှီစရာ နောက်တစ်ခုပဲ။)", en: "(That's just one more thing to lean on.)" }],
  pinnedMaya: [{ my: '(ကျွန်မ စာအုပ်ကိုလည်း ဒီအတိုင်း စစ်ပါ။ ကျွန်မ ကိုယ်တိုင် စစ်ခဲ့တယ်။ နောက်တစ်ယောက်ကလည်း ကိုယ်တိုင် စစ်ရမယ်။)', en: '(Test my book the same way. I tested it myself. The next person must test it themselves.)' }],
  pinSheet: { title: 'မယုံနဲ့ဦး။', lines: ['ကိုယ်တိုင် သွားကြည့်ပါ။', 'ကိုယ်တိုင် နားလည်မှ', 'လက်ခံပါ။', '— မာရာ'], color: '#E8E6E0' },
  blankSheet: { title: 'မယုံနဲ့ဦး။', lines: ['ကိုယ်တိုင် သွားကြည့်ပါ။', '— မာရာ', 'ကိုယ်တိုင် သွားကြည့်ခဲ့တယ် —', '______'], color: '#E8E6E0' },
  replyTitle: { my: 'စာအုပ်နောက်ဆုံး စာမျက်နှာ · စာပြန်', en: 'The back page · the reply' },
  replyCrossTitle: { my: 'ခြစ်ပစ်လိုက်တဲ့ စာကြောင်း', en: 'A line struck through' },
  replyCross: { my: 'လမ်းပျောက်မှာ စိုးရင် ကျွန်မကို မေးပါ။', en: "If you're afraid of getting lost, ask me." },
  replyNew: { my: 'မြေပုံက လမ်းကိုပဲ ပြတယ်။ ကိုယ်တိုင် စစ်ကြည့်ပြီး ကိုယ့်ခြေနဲ့ လျှောက်ပါ။', en: 'A map only shows the road. Check it yourself, and walk it on your own feet.' },
  kwPrintNow: [{ my: 'ဘောင်က အသင့်ပဲ! ပြေးရိုက်လိုက်မယ်။', en: "The frame's ready! I'll run and print it." }], // (new)
  kwSheets: [{ my: 'ကွက်လပ် ချန်ထားတယ်။ ကိုယ်တိုင် သွားကြည့်ပြီးမှ ကိုယ့်စကားနဲ့ ဖြည့်ကြ။', en: 'There is a blank left. Look yourselves first, then fill it in your own words.' }], // (new)
  looked: {
    sein: { my: 'သွားကြည့်ခဲ့တယ်: တတိယ အကွင်းအထိ ရှိတယ်။ ဒီနေ့ပေါ့။', en: 'I looked: up to the third ring. Today, anyway.' },
    kan: { my: 'သွားကြည့်ခဲ့တယ်: ခိုတွေလည်း ရှိတယ်၊ မင်လည်း ရှိတယ်။ ရှေးစကားကို ဒီနေ့ ကိုယ်တိုင် စစ်ကြည့်ရတယ်။', en: 'I looked: the pigeons are here, and so is the ink. Today I checked the old saying myself.' },
    komin: { my: 'သွားကြည့်ခဲ့တယ်: နွေရှည်နှစ်ရဲ့ အမှတ်က အောက်ဆုံးမှာ။ တစ်ခါ ကျဖူးတယ်။ အခု မဟုတ်ဘူး။', en: 'I looked: the long-heat mark is way down. It dropped once. Not now.' },
    moemoe: { my: 'သွားကြည့်ခဲ့တယ်: ခပ်လေ ပြည့်လေ! ဘာကြောင့်လဲ သိချင်တယ်။', en: 'I looked: the more you dip, the more it fills! I want to know why.' },
    dawhla: { my: 'သွားကြည့်ခဲ့တယ်: ပြည့်နေတယ်။ မနက်ဖြန် စိုးရိမ်ရင် မနက်ဖြန် ထပ်ကြည့်မယ်။', en: "I looked: full. If I worry tomorrow, I'll look again tomorrow." },
    kosan: { my: 'သွားကြည့်ခဲ့တယ်: ပုံနှိပ်ထားတာနဲ့ တွင်းထဲက မတူဘူး။ ဒီနေ့တော့။', en: "I looked: what's printed and what's in the well don't match. Today." },
    thida: { my: 'သွားကြည့်ခဲ့တယ်: ပြည့်နေတယ်။ တစ်အိုးပဲ ထားမယ်။', en: "I looked: full. I'll keep one jar." },
  },
  thidaEnd: [{ my: 'မေးခွန်းငါးခုကို ကတ်ပေါ် ကူးထားတယ်။ တစ်ခု မာရာ့အတွက်။ ကိုယ်တိုင် မေးဖို့ မမေ့အောင်။', en: 'I copied the five questions onto cards. One is for you. So we both remember to ask them ourselves.' }],
  mayaEnd12: [{ my: '(ကျွန်မ စကားကိုလည်း ဒီမေးခွန်းငါးခုနဲ့ပဲ စစ်ကြပါစေ။)', en: '(Let them test my words with these five questions too.)' }],

  // ---- 8. desks
  deskQ: { my: 'ဒီနေရာမှာ ကိုယ်တိုင် မြင်ရတာကို ရေးမယ်။', en: 'Write what you can see here yourself.' },
  deskFold: [
    { my: 'တံတားဘုတ်မှာ ချိတ် ဆယ်ခု ရှိတယ်။ တစ်ခုမှ မချိတ်ထားဘူး။', en: 'The bridge-board has ten hooks. Nothing hangs on any of them.' },
    { my: 'ပုံနှိပ်နေ့ဆို တံတား ပိတ်တယ်။', en: 'The bridge is shut on printing days.' },
    { my: 'အရှေ့ဘက်ကမ်းမှာ ဘာမှ ပုံမနှိပ်ဘူး။', en: 'Nothing is printed on the east bank.' },
  ],
  deskWell: [
    { my: 'တွင်းထဲက မင်က အပေါ်ကနေ တတိယ အကွင်းအထိ ရှိတယ်။', en: 'The ink in the well stands at the third ring from the top.' },
    { my: 'ရွှေမင်တွင်း ခန်းတော့မယ်။', en: 'The gold-ink well is drying up.' },
    { my: 'ဒီတွင်းကို ဘယ်သူမှ မလာတော့ဘူး။', en: 'Nobody comes to this well any more.' },
  ],
  deskWrong: [{ my: '(ဒါ ကြားခဲ့တာ။ မျက်လုံးနဲ့ ပြန်ကြည့်ပါဦး။)', en: "(That's what I heard. Look again.)" }],
  deskDone: [{ my: 'ဖဲကြိုးလေး တက်သွားပြီ။ အခေါက်ကြောင်းပေါ်ကနေ ကမ်းနှစ်ဖက်လုံး မြင်ရတယ်။ စာမျက်နှာ တစ်ရွက်တည်း၊ ဘက်နှစ်ဖက်။', en: 'The ribbon is up. From the fold I can see both banks. One page, two sides.' }],

  // ---- 8.2 ambient (one line per tap; variants by flag)
  sein: [{ my: 'ရေနွေးကြမ်း သောက်ဦးမလား။ အပြင်က လှည်းမှာ မင်အိုးတွေ ချိတ်ထားလို့ တွန်းလို့တောင် မရတော့ဘူး။', en: "Tea? I've hung so many ink jars on the cart outside, I can't even push it." }],
  seinAfter: [{ my: 'အိုးတွေ ပြန်လောင်းလိုက်တော့ လှည်းက ပေါ့သွားတယ်။', en: 'Poured the jars back. The cart rolls easy again.' }],
  kan: [{ my: 'ငါ့အဖေလည်း ခိုတွေအကြောင်း ပြောခဲ့တာပဲ။ အဖေက လိမ်တတ်တဲ့သူ မဟုတ်ဘူး။', en: 'My father told me about the pigeons too. He was no liar.' }],
  kanAfter: [{ my: 'အဖေ မလိမ်ဘူး။ ဒါပေမဲ့ ဒီနေ့ တွင်းကို ငါ ကိုယ်တိုင် ကြည့်ရမှာ။', en: "Father didn't lie. But today's well, I have to see myself." }],
  komin: [{ my: 'ဆိုင်းဘုတ်ကို မင်နည်းနည်းနဲ့ ရေးနေရတယ်။ အိုးတွေ အိမ်မှာ စုထားလို့။', en: "I'm painting this sign thin. My jars are all stored at home." }],
  moemoe: [{ my: 'ကျောင်းမင်အိုး ဗလာ။ ဆိုင်မှာ မကျန်တော့ဘူးတဲ့။ ဘာကြောင့်လဲ!', en: "My school ink pot's empty. The stalls have none. Why!" }],
  moemoeAfter: [{ my: 'ကိုမင်းကို မေးတော့ မင်က မြေအောက်ကနေ စိမ့်တက်လာတာတဲ့။ ကိုယ်တိုင် ထပ်ကြည့်မယ်!', en: "Ko Min says the ink seeps up from below. I'll go and see for myself!" }],
  dawhla: [{ my: 'ကြော်ငြာစာကို ကျွန်မ ရိုက်ခိုင်းခဲ့တာ။ ကောင်းတာတွေ မခံဘူးလေ။', en: 'I had that handbill printed. Good things never last, you know.' }],
  kosan: [{ my: 'ကျွန်တော့် အစ်မဆီ စာကို ရှစ်နာရီ ထည့်ခဲ့တယ်။ စာရွက်မှာ ကိုးနာရီတဲ့လေ။', en: 'I posted my letter to my sister at eight. The sheet says nine.' }],
  kosanAfter: [{ my: 'တစ်ရက် နောက်ကျမှာပေါ့။ အစ်မ နားလည်မှာပါ။', en: "It'll be a day late. She'll understand." }],
  thida: [{ my: 'စာရေးပေးရမလား။ မင်ကတော့ အများကြီး ရှိတယ်။', en: 'Need a letter written? I have plenty of ink.' }],
  // room looks (new)
  hoard: [{ my: '(ကောင်တာ စင်ပေါ်မှာ ဒေါ်စိန့် ကိုယ်ပိုင် မင်အိုး ကိုးလုံး စီထားတယ်။)', en: "(Nine of Daw Sein's own ink jars stacked on the counter shelf.)" }],
  hoardAfter: [{ my: '(ကောင်တာ စင်ပေါ်က မင်အိုးတွေ မရှိတော့ဘူး။)', en: '(The counter shelf is clear of jars.)' }],
  teaHandbill: [{ my: '(နံရံမှာလည်း "ရွှေမင်တွင်း ခန်းတော့မယ်" ကပ်ထားတယ်။ စားပွဲတစ်လုံးကနေ တစ်လုံး ပြန်ပြောနေကြတယ်။)', en: '(The wall has "the gold-ink well is drying up" too. It travels from table to table.)' }],
  teaCorrection: [{ my: '(ကြော်ငြာစာပေါ်မှာ ပြင်ဆင်ချက် စာရွက် ကပ်ထားပြီ။)', en: '(The correction is pinned over the handbill now.)' }],
  sortTable: [{ my: '(တံခါးဘေးက စားပွဲလေး။)', en: '(The little table by the door.)' }],
  schoolBoard: [{ my: '(မိုးမိုးရဲ့ မြေဖြူ: တွင်းပုံ၊ ခပ်တာ သုံးခါ၊ မြှားက အောက်ကို။)', en: "(Moe Moe's chalk: a drawn well, three dips, an arrow down.)" }],
  schoolBoardAfter: [{ my: '(တွက်ချက်ထားတာကို သူ့ဘာသာ ခြစ်ပစ်ပြီး အောက်မှာ "ကိုယ်တိုင် ကြည့်မယ်" တဲ့။)', en: '(She has crossed out her own sum and chalked "I\'ll look myself" under it.)' }],
  teacherDesk: [{ my: '(ဆရာမ စားပွဲပေါ်မှာ မြေဖြူစာ: "မင် သွားရှာနေတယ်"။)', en: '(A chalk note on the teacher\'s desk: "gone to find ink".)' }],
  inkPots: [{ my: '(စားပွဲတိုင်းက ကျောင်းသုံး မင်အိုးလေးတွေ ဗလာ။)', en: "(Every desk's little school ink pot is empty.)" }],
  inkPotsAfter: [{ my: '(စားပွဲတိုင်းက မင်အိုးလေးတွေ ပြည့်နေပြီ။)', en: "(Every desk's little ink pot is full again.)" }],
  jars: [{ my: '(စင်ပေါ်မှာ မင်အိုး ဆယ့်နှစ်လုံး၊ အကုန် ပြည့်နေတယ်။ တံခါးဝမှာတော့ ကျောင်းသုံး အိုးလေး ဗလာ။)', en: '(Twelve ink jars on the shelf, every one full.)' }],
  jarsOne: [{ my: '(စင်ပေါ်မှာ အိုးတစ်လုံးပဲ ကျန်တော့တယ်။)', en: '(One jar left on the shelf.)' }],
  letterLine: [{ my: '(ကြိုးပေါ်မှာ ရေးပြီးသား စာတွေ ချိတ်ထားတယ်။ သူများအတွက် ရေးပေးတဲ့ စာတွေ။)', en: '(Finished letters pegged on a string: letters she wrote for others.)' }],
  basket: [{ my: '(ကြိမ်တောင်းလေး တစ်လုံး။)', en: '(A woven basket.)' }],
  // home, evening (optional)
  homeBoard: [{ my: '(ဒီည တစ်ခုမှ မဖြေတော့ဘူး။ ကိုယ်တိုင် ဖြေနိုင်အောင် ဘာလုပ်ရမလဲ စဉ်းစားမယ်။)', en: "(I won't answer any tonight. I'll think how to help them answer it themselves.)" }],
  homeBoardBefore: [{ my: '(မေးခွန်း သုံးဆယ့်တစ်ခု။ ဒီနေ့ တစ်ခုမှ မတိုးဘူး။)', en: '(Thirty-one questions. Not one more today.)' }], // (new)

  // ---- 10. night page
  nightQ: { my: 'ဒီနေ့အကြောင်း မှန်မှန်ကန်ကန် ဘယ်လို ရေးမလဲ။', en: 'How will she write today, truthfully?' },
  nightChoices: [
    { my: 'ဒီနေ့ လမ်းဆုံတစ်ခုလုံးကို ကျွန်မ ပြင်ပေးခဲ့တယ်။ အခု အားလုံး ကျွန်မကို ယုံကြပြီ။', en: 'Today I put the whole Junction right. Now everyone believes me.' },
    { my: 'တစ်ယောက်တည်းအတွက် ပြောခဲ့တဲ့ ကျွန်မစကားကို လူတိုင်း မစစ်ဘဲ လိုက်နေကြတယ်။ နေခြည်က တစ်နေကုန် စောင့်ခဲ့တယ်။ နောက်ဆုတ်ပေးတော့ သူတို့ ကိုယ်တိုင် သွားကြည့်ကြတယ်။', en: 'Words I said for one person were being followed by everyone, unchecked; Nay Chi waited all day. When I stepped back, they went and looked themselves.' },
    { my: 'ကျွန်မ ပြောခဲ့သမျှ အကုန်မှားတယ်။ ဘယ်သူ့ကိုမှ ထပ်မကူညီတော့ဘူး။', en: "Everything I said was wrong. I won't help anyone again." },
  ],
  nightWrong: [
    [{ my: '(မဟုတ်ဘူး… ဒါ "မာရာ ပြောတယ်" ကို ပြန်ယုံခိုင်းတာ။)', en: '(No… that just asks them to believe "Maya says" again.)' }],
    [],
    [{ my: '(မဟုတ်ဘူး… ကျွန်မ စကားတွေ မမှားဘူး။ မစစ်ဘဲ မှီတာက ထိခိုက်တာ။)', en: "(No… my words weren't wrong. Leaning on them unchecked is what hurt.)" }],
  ],
  sleepQ: { my: 'ဒီည မှတ်စုစာမျက်နှာလေး ဘယ်သူ့အိမ်မှာ အိပ်မလဲ။', en: "Whose house does tonight's notebook page sleep at?" },
  stampText: { my: 'စာမျက်နှာ ၁၂ — မယုံနဲ့\nကြားရုံ၊ ရိုသေရုံ၊ ပုံနှိပ်ထားရုံနဲ့ မယုံနဲ့ဦး။ ကိုယ်တိုင် နားလည်ပြီး အားလုံးအတွက် ကောင်းမှ လက်ခံ။ သူတို့ ကိုယ်တိုင် သွားကြည့်တာ မြင်ခဲ့ပြီ။', en: "Page 12 — Don't Believe\nNot just because you heard it, revere the speaker or saw it printed. Accept it once you understand it yourself and it is good for all. She saw them go and look for themselves." },
  stampText13: { my: 'စာမျက်နှာ ၁၃ — ကြောက်ဖို့ကောင်းတဲ့ မသိခြင်း\nကိုယ်ကောင်းမယ်ထင်တာကို တစ်ဖက်လူက တခြားပုံ မြင်တတ်တယ်။ အသိနဲ့ စေတနာကို တွဲကိုင်။ နှစ်ယောက်စလုံးမှာ မှန်ကြောင်း ကိုယ်တိုင် တွေ့ခဲ့ပြီ။', en: 'Page 13 — The Frightening Not-Knowing\nWhat you meant as good, the other may see another way. Hold knowing and goodwill together. She saw it hold true for two people.' },
  stepPage: { my: 'နောက်ဆုတ်ပေး — နောက်ဆုံးခြေလှမ်းက သူတို့ဟာ။', en: 'Step back — the last step is theirs.' },
  tomorrow: { my: 'နောက်တစ်နေ့ မနက် ရောက်ပြီ။', en: 'Morning comes.' },
};
