// Day 5's words (day5-spec sections 4-9), kept apart from the play code in day5.js.
// Every Burmese line is a draft for Maya to proofread. Lines marked (added) are small connective lines the
// spec did not write (a waiting line, a look at a minor prop); they carry the same lesson and never point.

/** Day 4's night table: the notebook line read this morning (day4-spec 9, `slept4`). */
export const SLEPT4 = {
  kophyo: { my: '"မနက်ဦးခွက်ကို ဒီနေ့လည်း ငှဲ့တယ်။ ဘယ်သူ သောက်လဲ မကြည့်ဘူး။ နည်းနည်း ခါးသွားတယ်။ နောက်တစ်ခါ။" — ကိုဖြိုး', en: '"Poured the first cup again today. Didn\'t look who drank it. A bit bitter. Next time." — Ko Phyo' },
  thiri: { my: '"လေယာဉ်တစ်စင်း ခေါက်ပြီး ကိုယ့်အတွက် သိမ်းထားတယ်။ ပထမဆုံးအကြိမ်ပဲ။" — မသီရိ', en: '"Folded a plane and kept it for myself. First time ever." — Ma Thiri' },
  luaye: { my: '"လေယာဉ်စာကို ကောင်တာ နံရံမှာ ကပ်ထားတယ်။ ပြန်စာ မလိုတဲ့ စာ။" — ဦးလူအေး', en: '"Pinned the plane on the counter wall. A letter that needs no answer." — U Lu Aye' },
  tintin: { my: '"ရွက်တစ်ဆုပ်၊ အသက်သုံးချက်။ ကျွန်မ အမေ့နည်းပဲ။" — ဒေါ်တင်တင်', en: '"One pinch, three breaths. My mother\'s way." — Daw Tin Tin' },
  yi: { my: '"ထမင်းအိုး ပြည့်တယ်။ ဒါပဲ ရေးစရာ ရှိတယ်။" — ဒေါ်ရီ', en: '"The rice pot is full. That\'s all there is to write." — Daw Yi' },
  naychi: { my: '"မြေပုံပါတော့ ကိုယ်တိုင် ကြည့်စရာ မလိုဘူး ထင်တာ။ …နာရီဝက် ရပ်နေခဲ့တယ်။" — နေခြည်', en: '"With a map, I thought I wouldn\'t need to look myself. …I stood there half an hour." — Nay Chi' },
  other: { my: '(လက်ဖက်ရွက် ခြောက်လေး တစ်ရွက် ညှပ်ထားတယ်။)', en: '(A dry tea leaf, pressed.)' },
};

/** Tonight's table, for Day 6's morning (day5-spec 9). */
export const SLEPT5 = {
  kolwin: { my: '"ပူတဲ့အတွေး ဝင်လာတိုင်း ထွင်းတံကို ခဏ ချတယ်။ ပြီးမှ ပြန်ကောက်တယ်။" — ကိုလွင်', en: '"Every time the hot thought comes, I put the gouge down a moment. Then I pick it up again." — Ko Lwin' },
  khwarnyo: { my: '"အနားကွပ်က ဘယ်သူ့လက်ရာလဲ မမေးတော့ဘူး။ သိပြီးသားပဲ။" — ခွာညို', en: '"I won\'t ask whose hand carved the border. I know already." — Khwar Nyo' },
  kothiha: { my: '"မြစ်ကို ကျွန်တော် မရွေးခဲ့ဘူး။ ဒီနေ့ ဆိပ်နှစ်ခု ရွေးခဲ့တယ်။" — ကိုသီဟ', en: '"I didn\'t choose the stream. Today I chose two jetties." — Ko Thiha' },
  dawsanda: { my: '"ဖောင်လေး ရေထဲ ပြန်ရောက်ပြီ။ ဒါပဲ။" — ဒေါ်စန္ဒာ', en: '"The raft is back on the water. That\'s all." — Daw Sanda' },
  maungnge: { my: '"ဒီနေ့ တံဆိပ် နှစ်ခု ကိုယ်တိုင် ဖတ်တယ်။ ဆိပ်နာမည်တွေပါ။" — မောင်ငယ်', en: '"Today I read two labels myself. Jetty names." — Maung Nge' },
  naychi: { my: '"မာရာ ပြောတဲ့အတိုင်း စောင့်နေတယ်။" — နေခြည်', en: '"I\'m waiting, like Maya said." — Nay Chi' },
};

/** Walk-ons with lines but no cast id (shown name only). */
export const WALKON_NAMES = {
  appr1: { my: 'တံဆိပ်ထွင်း တပည့်', en: "Carver's apprentice" },
  appr2: { my: 'တံဆိပ်ထွင်း တပည့်', en: "Carver's apprentice" },
  carver1: { my: 'တံဆိပ်ထွင်းသူ', en: 'Stamp carver' },
  carver2: { my: 'တံဆိပ်ထွင်းသူ', en: 'Stamp carver' },
  seller: { my: 'စာအိတ်ရောင်းသူ', en: 'Envelope seller' },
  drinker: { my: 'လက်ဖက်ရည်သောက်သူ', en: 'Tea drinker' },
  porterT1: { my: 'ဆိပ်ကမ်း ထမ်းသမား', en: 'Wharf porter' },
  porterT2: { my: 'ဆိပ်ကမ်း ထမ်းသမား', en: 'Wharf porter' },
  ferryman: { my: 'ကူးတို့ ဆရာ', en: 'The ferryman' },
  porterW1: { my: 'ထမ်းသမား', en: 'Porter' },
  porterW2: { my: 'ထမ်းသမား', en: 'Porter' },
  duckkeeper: { my: 'ဘဲထိန်း', en: 'Duck-keeper' },
};

export const L = {
  // ---- 4. morning
  ww1: [{ my: 'မာရာရေ… မှတ်စုစာအုပ်လေး ပြန်ရောက်ပြီ။ ဒီတစ်ခါလည်း စာတစ်ကြောင်း ပါလာတယ်။', en: 'Maya… your notebook is back. Another line came with it.' }],
  ww2: [{ my: 'ကိုဖြိုးဆီကလည်း စာလေး ပါလာတယ်။', en: 'And a note from Ko Phyo.' }],
  kpNote: { my: 'အစ်မ… မနေ့ကစပြီး ကိုယ့်အိုးလေး ကိုယ်ရှိသွားပြီ။\nဒီမနက် ထမ်းသမားတစ်ယောက် တစ်ခွက်သောက်ပြီး ဘာမှမပြောဘဲ ထွက်သွားတယ်။\nထူးဆန်းတယ်… ရင်ထဲ အေးသွားတယ်။', en: "Sister… since yesterday I've had a pot of my own.\nThis morning a porter drank a cup and walked off without a word.\nStrange… my chest felt cool." },
  lift: { my: '(မနေ့က စာမျက်နှာပေါ်က အိုးလေးနဲ့ တိမ်အေးလေး တစ်ကောင်ပြီးတစ်ကောင် ထွက်လာကြတယ်။)', en: "(The Little Pot, then the Cool Cloud, climb out of yesterday's pages.)" },
  liftMaya: { my: 'နှစ်ကောင်လုံး လိုက်ခဲ့ကြ။ ကိုယ့်အိုး ပြည့်ပြည့်နဲ့ စိတ်အေးအေး… ဒီနေ့ နှစ်ခုလုံး လိုမယ် ထင်တယ်။', en: "Come along, both of you. A full pot and a cool head… I think I'll need both today." },
  ttQ: { my: '"ဒီနေ့မေးခွန်း: မြစ်ရေက ဘာလို့ တစ်ဖက်တည်းကိုပဲ စီးတာလဲ။" — တိုးတိုး', en: '"Today\'s question: why does river water only flow one way?" — Toe Toe' },
  ww3: [
    { my: 'ဈေးထဲ စာတိုက်ကောင်တာဘေးက တံဆိပ်ထွင်းတန်းမှာ ဒီမနက် အကုန် တီးတိုးပြောနေကြတယ်။', en: "Everyone at the stamp-carvers' row by the Market's letter counter was whispering this morning." },
    { my: 'စာအုပ်မိတ်ဆက်ပွဲနေ့ တံဆိပ်ပုံစံကို ခွာညိုက နိုင်သွားတယ်တဲ့။ သူ့ဆရာဟောင်းကတော့ ထွင်းတံတွေ ချထားလိုက်ပြီ။', en: "Khwar Nyo's design won the launch-day postmark. Her old teacher has put his gouges away." },
    { my: 'ပြီးတော့ ထမ်းသမားတွေ ပြောတယ်။ ဈေးရဲ့ တောင်ဘက်လမ်းကြားက ဆင်းသွားရင် တိမ်မြစ်ကမ်းမှာ ဆိပ်ကမ်းတစ်ခု ပေါ်လာပြီတဲ့။', en: "And the porters say if you go down the Market's south lane, there's a wharf on the cloud-stream now." },
    { my: 'ကူးတို့သင်္ဘောအသစ်က အရမ်းမြန်ပြီး ဆိပ်တိုင်းမှာ ရပ်တယ်တဲ့။ ကိုယ်တိုင်တော့ မစီးဖူးဘူး။', en: "The new ferry's very fast and stops at every jetty, they say. I haven't been on it myself." },
  ],
  wwLater: [{ my: 'တံဆိပ်ထွင်းတန်းလား။ စာတိုက်ကောင်တာနဲ့ ကပ်လျက်၊ အစင်းကြောင်း မိုးကာတွေအောက်မှာ။', en: "The carvers' row? Right next to the letter counter, under the striped awnings." }],
  wwEvening: [{ my: 'စာတိုက်နံရံမှာ မာရာ့အတွက် စာရွက် နှစ်ဆယ့်နှစ်စောင် ရှိနေပြီ။', en: 'Twenty-two notes for you on the Post Office wall now.' }],
  wwAfterBoth: [{ my: 'နှစ်နေရာလုံး ရောက်ခဲ့ပြီပဲ။ ညကျရင် စာရေးခန်းမှာ ရေးဖို့ မမေ့နဲ့နော်။', en: "You've been to both today. Don't forget to write it up at the Writing Room tonight." }], // (added)
  appr: { my: 'ဆရာလွင် ဒီနေ့လည်း ထွင်းတံ မကိုင်ဘူးဟ။ မီးဖိုတောင် မမွှေးဘူး။', en: "Teacher Lwin hasn't picked up a gouge again today. Hasn't even lit his brazier." },
  apprAfter: { my: 'ကြားပြီလား။ ဆရာလွင် ပြန်ထွင်းနေပြီတဲ့။', en: "Heard? Teacher Lwin's carving again." }, // (added)

  // ---- 5.1 Ko Lwin at his cold bench
  returned: [{ my: '(သူ့တုံးလည်း ပြိုင်ခဲ့တာပဲ။ မျဉ်းဖြောင့်လေးတွေ။)', en: '(His block was in the contest too. Neat straight lines.)' }],
  kl1: [
    { my: 'ဘာလာလုပ်တာလဲ။ ဒီမှာ ဘာမှ မထွင်းတော့ဘူး။', en: 'What is it? Nothing gets carved here any more.' },
    { my: 'ခွာညိုလား။ ကံကောင်းသွားတာပါ။ အရင်ကတော့ ဒီလို မဟုတ်ပါဘူး။', en: 'Khwar Nyo? She got lucky. She was never like this before.' },
    { my: 'ကျွန်တော့်တုံးကို ပြန်ပို့လိုက်တယ်။ သူ့ဟာကို ရွေးလိုက်ကြတယ်။', en: 'They sent mine back. They picked hers.' },
    { my: 'အနားကွပ် ထွင်းပေးပါတဲ့။ ညနေ ကောင်တာ ပိတ်ချိန်မတိုင်ခင်။ …မထွင်းပေးရင် သူ မသွားရဘူးပေါ့။', en: "Carve the border, she says. Before the counter shuts tonight. …If I don't, she can't go, can she." },
  ],
  klChoices: [
    { my: '"ကံကောင်းလိုက်တာနော်၊ ခွာညိုက။"', en: '"Lucky her, isn\'t she."' },
    { my: '"သူ့ကို မေ့ပစ်လိုက်ပါ။ မရှိသလို နေလိုက်။"', en: '"Just forget her. Act as if she isn\'t there."' },
    { my: '"ခွာညိုဆီ ခဏ သွားကြည့်ပြီး ပြန်လာခဲ့မယ်။"', en: '"I\'ll go and see Khwar Nyo, and come back."' },
  ],
  klLucky: [{ my: 'ဟုတ်တယ်မလား။ မာရာတောင် ကံလို့ ပြောတယ်။', en: "See? Even you say it's luck." }],
  klLuckyMaya: [{ my: '(ချီးမွမ်းသလိုနဲ့ သူ့အပူကို ထပ်လောင်းလိုက်မိပြီ။)', en: '(It sounded like praise, and it fed his heat.)' }],
  klForget: [{ my: 'မေ့ရမယ်? တစ်နေ့လုံး ဒီတုံးကိုပဲ ကြည့်နေတာ။', en: "Forget her? I've stared at this block all day." }],
  klForgetMaya: [{ my: '(မရှိသလို နေခိုင်းတာက အေးဆေးသလို ထင်ရတယ်။ အေးတာ မဟုတ်ဘူး။)', en: "(Pretending she doesn't exist looks calm. It isn't.)" }],
  klGo: [{ my: '…စာတိုက်ကောင်တာ နောက်က အခန်းထဲမှာ အထုပ်ထုပ်နေတယ်။ ကောင်တာအဆုံးက တံခါးပဲ။ ကျွန်တော် မသွားဘူး။', en: "…She's packing in the room behind the letter counter. The door at the counter's end. I'm not going." }],
  klNotYet: [{ my: 'ခဏ ထားပါဦး။ ကောင်တာ မပိတ်သေးပါဘူး။', en: "Leave it a while. The counter's not shut yet." }],

  // ---- 5.2 looks: [pencil (what's said), gold (what's seen)]
  look: {
    trials: [{ my: 'ကံကောင်းလို့', en: 'lucky' }, { my: 'စမ်းထွင်းတုံး လေးဆယ်။ ရှေ့ကဟာတွေ ကြမ်းတယ်။ နောက်ကဟာတွေ သေသပ်တယ်။', en: 'Forty trial blocks: rough at first, fine at the end.' }],
    offer: [{ my: 'ဆရာ့ကို ထားခဲ့တာ', en: 'she walked out on him' }, { my: 'ပိုကောင်းတဲ့ အခွင့်အရေး။ တံတားပွင့်ရင် စောင့်မနေဘူး။', en: "A better chance, and it won't wait." }],
    notice: [{ my: 'ဆရာ့ပုံစံ ကူးထားတာ', en: 'she copied him' }, { my: 'ကိုလွင့်လက်ရာက မျဉ်းဖြောင့်တွေ။ သူ့ပုံစံက အကွေးတွေချည်းပဲ။', en: 'His work is all straight lines; hers is all curls.' }],
    bench: [{ my: 'အလုပ်မရှိလို့', en: 'no work' }, { my: 'မီးဖို ငြိမ်းနေတယ်။ ထွင်းတံတွေ အဝတ်နဲ့ တင်းတင်း ချည်ထားတယ်။ ဒီအပူက သူ့ကိုပဲ အရင် လောင်နေတာ။', en: 'Brazier dead, gouges tied up tight. The heat burns him first.' }],
    patches: [{ my: 'အဟောင်းကြီး', en: 'a wreck' }, { my: 'ဖာထေးရာ ခုနစ်ခု။ တစ်နှစ် တစ်ခု။ အချုပ်တိုင်း အမေ့လက်ရာ။', en: 'Seven patches, one a year, every stitch hers.' }],
    grip: [{ my: 'လှော်တက် ဆွေးနေပြီ', en: "the pole's rotten" }, { my: 'လှော်တက် လက်ကိုင်နဲ့ အရောင်တူ အဝတ်စ။ ဒီအပတ်ထဲ ညှပ်ထားတာ။ အပ်လေး ထိုးထားတုန်း။', en: "A strip the colour of the pole's new grip, cut this week, her needle still in it." }],
    bail: [{ my: 'ကူးတို့က အေးဆေး', en: 'the ferry has it easy' }, { my: 'ကူးတို့ပေါ်မှာလည်း ရေခပ်ထုတ်နေရတယ်။', en: "They're bailing on the ferry too." }],
    shallow: [{ my: 'ဘယ်သူမှ မသွားဘူး', en: 'nobody goes there' }, { my: 'ရေတိမ်တယ်။ ကူးတို့ မဝင်နိုင်ဘူး။ ဆိပ်မှာ လူတွေ စောင့်နေတယ်။', en: 'Too shallow for the ferry. People are waiting on the jetties.' }],
    shifts: [{ my: 'အမေက အလုပ်အေး', en: 'Mum has it easy' }, { my: 'ဒေါ်စန္ဒာ နာမည် နှစ်ခါ။ အလှည့် နှစ်ခု ဆင်းတယ်။', en: "Daw Sanda's name twice: two shifts." }],
  },
  lookHeard: { my: 'ကြားခဲ့တာ', en: 'heard' },
  lookSeen: { my: 'ကိုယ်တိုင် မြင်တာ', en: 'seen' },
  lookTap: { my: 'နှိပ်ပြီး ဆက်မယ်', en: 'tap to go on' },
  kn1: [
    { my: 'ဆရာ ထွင်းပေးမှာပါ။ မထွင်းပေးလည်း ကျွန်မ စိတ်မဆိုးပါဘူး။', en: "Teacher will carve it. If he doesn't, I won't be angry." },
    { my: 'သူ ထွင်းနေတာကို ပြန်မြင်ချင်ရုံပါ။ ရလဒ်ထွက်ကတည်းက သူ့မီးဖို မမွှေးတော့ဘူးတဲ့။', en: "I just want to see him carving again. They say his brazier hasn't been lit since the result came out." },
  ],
  offerMaya: [{ my: '(သူ့အတွက်ပဲ ကောင်းတာ မဟုတ်ဘူး။ ကိုလွင့်အတွက်လည်း ကောင်းရမယ်။)', en: "(It mustn't be good for her alone. It has to be good for him too.)" }],
  lookedAll: [{ my: '(သူ မကြည့်ဖူးသေးတာတွေ ကျွန်မ မြင်ခဲ့ပြီ။ ကိုလွင့်ဆီ ပြန်သွားမယ်။)', en: "(I've seen what he never looked at. Back to Ko Lwin.)" }], // (added)
  pupilPlace: [{ my: '(တပည့်ရဲ့ ခုံလေး။ ဖုန်လေး တက်နေပြီ။)', en: "(The pupil's little bench. Dust on it now.)" }], // (added)
  apronLook: [{ my: '(ချိတ်မှာ ခါးစည်းလေး တစ်ထည်။ ခွာညိုရဲ့ဟာ ထင်တယ်။)', en: "(A small apron on the peg. Khwar Nyo's, I think.)" }], // (added)
  apronGone: [{ my: '(ချိတ်က လွတ်နေပြီ။)', en: '(The peg is empty now.)' }], // (added)
  blockRack: [{ my: '(သူ့တုံးဟောင်းတွေ။ အားလုံး မျဉ်းဖြောင့်။)', en: '(His old blocks. All straight lines.)' }], // (added)

  // ---- 5.3 the envelope seller (tea shop)
  es1: [{ my: 'ကြားပြီလား။ ခွာညိုက ဆရာ့ပုံစံကို ကူးပြီး ပြိုင်ပွဲ နိုင်တာတဲ့။ အောင်မြင်တော့မှ ပေါ်လာတာ။', en: "Heard? Khwar Nyo copied her teacher's design to win. It only came out once she'd won." }],
  esChoices: [
    { my: '"ဟုတ်လား… ထင်သားပဲ။"', en: '"Really… I thought so."' },
    { my: '"သူ့ စမ်းထွင်းတုံး လေးဆယ်ကို ကိုယ်တိုင် မြင်ခဲ့တယ်။ ဒီစကား သူ့ကို နာစေတယ်။ ဆက်မပြောပါနဲ့။"', en: '"I saw her forty trial blocks myself. That talk hurts her. Please don\'t pass it on."' },
  ],
  esLaugh: [{ my: '(ကိုယ်တိုင် မမြင်ဘဲ လိုက်ခေါင်းညိတ်မိပြီ။ ဒီလိုနဲ့ပဲ ပုံမှန်လို ဖြစ်သွားတာ။)', en: "(I nodded along to something I haven't seen. That's how it starts to sound normal.)" }],
  esStop: [{ my: '…လေးဆယ်တုံး? ဒါဆို… ကျွန်မ မပြောတော့ပါဘူး။', en: "…Forty blocks? Then… I'll stop saying it." }],
  esAfter: [{ my: 'စာအိတ် ဝယ်ဦးမလား။ …သတင်းတော့ မရောင်းတော့ဘူး။', en: "Envelopes? …I've stopped selling gossip." }],

  // ---- 5.5 carve / 5.6 own words / 5.7 close
  carveTitle: { my: 'ခွာညိုရဲ့ တံဆိပ်ကို အနားကွပ် ထွင်းမယ်', en: "Carve the border round Khwar Nyo's mark" },
  carveHint: { my: 'အနားကြောင်းအတိုင်း ဖြည်းဖြည်း ဆွဲ။ ပူတဲ့အတွေး ဝင်လာရင် လက်ကြွ', en: 'Follow the border slowly. When a hot thought comes, lift your finger' },
  heat: [
    { my: 'ကံကောင်းလို့ပါ…', en: 'just luck…', cool: { my: 'လေးဆယ်တုံး ကြိုးစားခဲ့တာ။ ရထိုက်တယ်။', en: 'Forty blocks of trying. She earned it.' } },
    { my: 'ငါ့တပည့်ပဲ…', en: 'she was mine…', cool: { my: 'သူ့လမ်း သူ သွားပါစေ။ အဆင်ပြေပါစေ။', en: 'Let her go her road. May it go well.' } },
    { my: 'ဘယ်သူမှ မမှတ်မိဘူး…', en: 'nobody will remember…', cool: { my: 'ဘာမှ ပြန်မလိုချင်ဘူး။ သူ ဝမ်းသာရင် ရပြီ။', en: 'I want nothing back. Her gladness is enough.' } },
  ],
  klLight: [{ my: '(ကိုလွင် မီးဖိုကို ကိုယ်တိုင် မွှေးတယ်။ ဆိုင်ထဲ ပထမဆုံး မီးရောင် ထွက်လာတယ်။)', en: '(Ko Lwin lights the brazier himself. The first glow in the shop.)' }], // (added, stage line)
  firstLift: { my: 'ဒီလိုအတွေး လူတိုင်း ဝင်တတ်တယ်။ ပူတယ်။ ဆက်တွေးရင် ငါ့ကိုပဲ ဒုက္ခပေးမယ်။ ဒီမှာ ရပ်မယ်။', en: 'Anyone gets a thought like this. It burns. Follow it and it only brings me trouble. I stop here.' },
  laterLift: { my: 'ဒီမှာ ရပ်မယ်။', en: 'I stop here.' },
  nick: { my: 'ဒါ ပြန်ပြင်လို့ မရတော့ဘူး။ …နောက်တစ်ခါ စောစော ရပ်မယ်။', en: "That can't be undone. …Next time I'll stop sooner." },
  carved: { my: 'အနားကွပ်က တံဆိပ်ကို ဖုံးမထားဘူး။ ဝိုင်းပေးထားတာ။', en: "The border doesn't cover her mark. It frames it." },
  noteTitle: { my: 'ကိုလွင့် ကိုယ်ပိုင်စကားနဲ့ စာတိုလေး', en: "Ko Lwin's note, in his own words" },
  noteHint: { my: 'သူ တကယ် ဆိုလိုတာ သုံးပိုင်း ရွေးပါ', en: 'Pick the three pieces he truly means' },
  notePrompt: { my: 'တုံးနဲ့အတူ ထည့်ပေးမယ့် စာ (နာမည် မပါ)', en: 'A note to go with the block (no name)' },
  noteFragments: [
    { my: 'တံဆိပ်က မင်းဟာပဲ။', en: 'The mark is yours.', good: true },
    { my: 'သွားပါ။', en: 'Go.', good: true },
    { my: 'အဆင်ပြေပါစေ။', en: 'Be well.', good: true },
    { my: 'ဆရာ့ကို မမေ့နဲ့။', en: "Don't forget your teacher.", good: false },
    { my: 'ကံကောင်းလို့ပါ။', en: 'You were lucky.', good: false },
    { my: 'ငါ့ကြောင့် ရတာ။', en: 'You owe it to me.', good: false },
  ],
  noteWrong: [{ my: 'အဲဒါ ငါ့အတွက် ရေးတာ။ သူ့အတွက် မဟုတ်ဘူး။', en: "That's written for me, not for her." }],
  apronIn: [{ my: '(စကားတစ်ခွန်းမှ မပြောဘဲ ချိတ်ပေါ်က ခါးစည်းလေးကို ဖြုတ်ပြီး အထုပ်ထဲ ထည့်လိုက်တယ်။)', en: '(Without a word, he takes the small apron off its peg and lays it in too.)' }], // (stage line, 5.6)
  klSend: [
    { my: 'မာရာ ယူသွားပေးပါ။ ဘယ်သူ ထွင်းတယ်လို့ မပြောပါနဲ့။', en: "You take it, Maya. Don't say who carved it." },
    { my: 'ကောင်တာ မပိတ်ခင်။ မြန်မြန်တော့ မဟုတ်ဘူး… ဂရုစိုက်ပြီး။', en: "Before the counter shuts. Not fast… carefully." },
  ],
  carryWalk: { my: 'လက်ထဲမှာ တုံးလေး ပါနေတယ်။ လမ်းလျှောက်သွားမယ်။', en: "I'm carrying the block. I'll walk." },
  klWaiting: [{ my: '…ယူသွားပြီးပြီလား။', en: '…Have you taken it over?' }], // (added)
  knEnd: [
    { my: 'အနားကွပ်… ကျွန်မ ပုံစံကို ဝိုင်းပေးထားတယ်။', en: 'The border… it holds my design.' },
    { my: '"သွားပါ"… တဲ့။ ကောင်တာကို ပေးလိုက်မယ်။', en: '"Go," it says. I\'ll hand it in.' },
  ],
  knLooks: [{ my: '(ခွာညို နောက်ပြတင်းပေါက်ကနေ တံဆိပ်ထွင်းတန်းဘက် ကြည့်လိုက်တယ်။ တတိယ မီးခိုးတိုင်က မီးခိုး တက်နေပြီ။)', en: '(Khwar Nyo looks out of the back window at the carvers\' row. Smoke is rising from the third chimney pipe.)' }], // (stage line, 5.7)
  knAsk: [{ my: 'တံတား ပွင့်တဲ့အထိ ဘာလုပ်ထားရမလဲ မာရာ။', en: 'What should I do till the bridge opens, Maya?' }],
  mayaInk: [{ my: '"တံဆိပ်ထုမယ့်နေ့အတွက် မင်တစ်အိုး သိမ်းထား။ ကျန်တာ ပြင်ဆင်ရုံပဲ။"', en: '"Keep one pot of ink back for the stamp day. The rest is just getting ready."' }],
  klEnd: [
    { my: 'ကျေးဇူးဆပ်တာ မဟုတ်ဘူး။ လက်က ပြန်ထွင်းချင်လာလို့။ ဒါ မာရာ့ ဖိတ်စာတွေအတွက်။', en: "It's not to pay you back. My hands just want to carve again. This one's for your invitations." },
    { my: 'ပူတဲ့အတွေး ဝင်လာဦးမှာပဲ။ ဝင်လာရင်… ဒီမှာ ရပ်မယ်။', en: 'The hot thoughts will come again. When they do… I stop there.' },
  ],
  mayaEnd: [{ my: '(ကံကောင်းလိုက်တာ… ဆိုတဲ့ကတ်ကို လွှင့်ပစ်လိုက်ပြီ။ ချီးမွမ်းသလို ကြားရပေမဲ့ ပူတယ်။)', en: "(I've thrown away the 'Lucky You' card. It sounded like praise, and it burned.)" }],
  klAfter: [{ my: 'ပူတဲ့အတွေး လာရင် ထွင်းတံကို ခဏ ချတယ်။ ပြီးမှ ပြန်ကောက်တယ်။', en: 'When the hot thought comes, I put the gouge down a moment. Then I pick it up again.' }], // (added, from slept5)

  // ---- 8.1 Market ambient
  knAfter: [{ my: 'တံတား ပွင့်ရင် သွားမယ်။ ဒီပြတင်းကနေ ဆရာ့ မီးခိုးတိုင် မြင်ရတယ်။ မီးခိုး ပြန်ထွက်နေပြီ။', en: "I'll go when the bridge opens. From this window I can see Teacher's chimney. There's smoke again." }],
  knWait: [{ my: 'ကောင်တာ မပိတ်ခင် ထုပ်ပိုးပြီးအောင် လုပ်နေတယ်။', en: "I'm getting packed before the counter shuts." }], // (added)
  luaye: [{ my: 'ပြိုင်ပွဲ ဝင်တုံး အကုန် ဒီမှာ ပြန်ပို့ရတယ်။ ရှုံးတဲ့တုံးကလည်း တုံးပဲ။ လက်ရာပဲ။', en: "I had to send every losing block back from here. A block that loses is still a block. Still someone's work." }],
  carvers: [
    { my: 'ဆရာလွင့် လက်က တန်းထဲမှာ အဖြောင့်ဆုံး။ ခုတော့ ချထားတယ်။', en: 'Teacher Lwin has the straightest hand in the row. He\'s put it down.' },
    { my: 'လက်ဖက်ရည်ဆိုင်ထဲမှာ ခွာညို ကူးတာတဲ့ ပြောနေကြတယ်။ ငါကတော့ သူ ညတိုင်း ထွင်းတာ ကိုယ်တိုင် မြင်ခဲ့တယ်။', en: "In the tea shop they're saying Khwar Nyo copied. I watched her carve every night myself." },
  ],
  carversAfter: [{ my: 'ဟိုမှာ… ကိုလွင့် မီးခိုးတိုင်က မီးခိုး ထွက်လာပြီ!', en: "Look… smoke from Ko Lwin's chimney!" }],
  donorTintin: [{ my: 'ဆိပ်ခံ ခြောက်ခုလုံး သစ်ကုန်သည်ကြီး လှူထားတာတဲ့။ ပိုက်ဆံ ဘယ်ကရလဲ မသိဘူး။', en: 'That timber merchant gave all six jetties, they say. Who knows where his money came from.' }],
  donorDrinker: [{ my: 'လှူနိုင်လို့ လှူတာပေါ့။ ထမ်းသမားတွေ ဆိပ်ရတယ်။ လက်ဖက်ရည် အေးအေးလေး သောက်ပါ။', en: 'He could give, so he gave. The porters got jetties. Drink your tea and cool down.' }],
  tintinTea: [{ my: 'ရေနွေးကြမ်း တစ်အိုး ယူသွားမလား။ လမ်းမှာ သောက်ရအောင်။', en: 'Take a pot of plain tea? For the road.' }], // (added: supply)
  tintinFull: [{ my: 'အိုးပြည့်နေသေးတယ်။ ကုန်မှ ပြန်လာခဲ့။', en: "Your pot's still full. Come back when it's empty." }], // (added)
  portersTea: [{ my: 'ကူးတို့က ဆိပ်ကြီးမှာပဲ ကပ်တာ။ ငါတို့ အထုပ်တွေ သောင်ပြင်ဘက် ဘယ်လို ရောက်မလဲ မသိဘူး။', en: 'The ferry only ties up at the Big Jetty. No idea how our parcels get out to the sandbar.' }],
  kophyo: [{ my: 'ဒီမနက် ဆိပ်ကမ်းက ထမ်းသမားတွေကို ကိုယ့်အိုးထဲက ငှဲ့ပေးလိုက်တယ်။ ဘာမှ မပြောဘဲ သောက်သွားကြတယ်။ ရပါတယ်။', en: "Poured for the wharf porters from my own pot this morning. They drank and said nothing. That's fine." }],
  kophyoAfter: [{ my: 'ကိုလွင် ပြန်ထွင်းနေပြီတဲ့။ ကောင်းတယ်။ လက်ဖက်ရည် တစ်ခွက် ပို့လိုက်တယ်။ မော့တောင် မကြည့်ဘူး။ ရပါတယ်။', en: "Ko Lwin's carving again, they say. Good. I sent him a cup. He didn't even look up. That's fine." }],
  thiri: [{ my: 'ကျွန်မ စွန်က ကိုယ့်တိုင်မှာ ချည်ထားတာ။ အပေါ်ကကြည့်ရင် ဈေးတောင်ဘက် လမ်းကြားအဆုံးမှာ ဆိပ်ကမ်းအသစ် မြင်ရတယ်။', en: "My kite's tied to my own post. From up there you can see the new wharf, at the bottom of the south lane." }],
  resultPoster: [{ my: '(တံခါးဘေးမှာ စာရွက်လေး: «ပြိုင်ပွဲရလဒ် — အထဲမှာ»)', en: '(A small poster by the door: «Contest result — inside»)' }], // (spec 1.1 poster, read when tapped)

  // ---- 6.1 hooks
  mn1: [
    { my: 'ကူးတို့က ဒီအထုပ်တွေ မယူဘူးတဲ့။ ဒီဆိပ်တွေက ရေတိမ်လွန်းလို့။', en: "The ferry won't take these. Their jetties are too shallow." },
    { my: 'ဒီတံဆိပ်… ဘဲ… ဆိပ်။ ကိုယ်တိုင် ဖတ်တာ! ဟိုဘက် သောင်ပြင်ပေါ်မှာ။', en: "This label… Duck… Jetty. I read it myself! It's out on the sandbar." },
    { my: 'ဆိပ်ငယ်က ဖောင်ဟောင်းလေးဆို ရောက်မှာ။ ဒါပေမဲ့ ကိုသီဟက လှော်မှ မလှော်တာ။ မျောနေတာပဲ။', en: "The old raft at Little Jetty could get there. But Ko Thiha never poles. He just drifts." },
  ],
  mnWait: [{ my: 'အထုပ်တွေ ဒီမှာ စောင့်နေမယ်။', en: 'The parcels and I will wait here.' }],
  mnAfter: [{ my: 'တံဆိပ် နှစ်ခုလုံး ကိုယ်တိုင် ဖတ်ခဲ့တယ်။ စုနွယ့်ကို ပြောပြမယ်။', en: "I read both labels myself. I'm telling Su Nwe." }],
  fm1: [
    { my: 'ဆိပ်တိုင်း ရပ်တယ်? မဟုတ်ဘူး။ ဒီသင်္ဘော ရေနက်တယ်။ ဆိပ်ကြီးမှာပဲ ကပ်လို့ရတယ်။', en: 'Every jetty? No. She sits deep. She can only tie up at the Big Jetty.' },
    { my: 'အသစ်ဆိုပေမဲ့ ယိုတယ်။ မနက်တိုင်း ရေခပ်ထုတ်ရတယ်။', en: 'New, and she still leaks. I bail every morning.' },
    { my: 'အရှေ့ကမ်းလား။ ဘယ်သူမှ မကပ်ရဘူး။ ဟိုဘက်က နှင်းထဲမှာ ခေါက်ထားတုန်း။ ဒီဘက်ကမ်းတစ်လျှောက်ပဲ ပြေးတာ။', en: "The east bank? Nobody lands there. That side's still folded in the mist. We only run up and down this bank." },
  ],
  fmAsk: [{ my: 'ဦးလေး… မြစ်ရေက ဘာလို့ တစ်ဖက်တည်းကိုပဲ စီးတာလဲ။ တိုးတိုးက မေးခိုင်းလို့။', en: 'Uncle… why does river water only flow one way? Toe Toe asked me to ask.' }], // (added: Maya's question)
  fmTT: [{ my: 'မြင့်ရာက နိမ့်ရာ ဆင်းတာပေါ့။ ဘယ်သူမှ မခိုင်းဘူး။ ဘယ်ဆိပ် ကပ်မလဲကတော့ ငါတို့ ရွေးရတယ်။', en: 'High ground to low. Nobody tells it to. Which jetty you tie up at, though: that you choose.' }],
  fmTTMaya: [{ my: '(တိုးတိုးအတွက် ခဲတံနဲ့ မှတ်ထားမယ်။)', en: "(I'll pencil that down for Toe Toe.)" }], // (added)
  fmAfter: [{ my: 'ဖောင်လေး သောင်ပြင်ဘက် ဝင်သွားတာ မြင်တယ်။ ငါတို့ မဝင်နိုင်တဲ့နေရာ။', en: "Saw the raft go in to the sandbar. Somewhere we can't." }],
  fmAgain: [{ my: 'ဒီဘက်ကမ်းတစ်လျှောက်ပဲ ပြေးတာ။ ဆိပ်ကြီးကနေ ဆိပ်ကြီးပဲ။', en: 'Up and down this bank only. Big Jetty to Big Jetty.' }], // (added)

  // ---- 6.2 Ko Thiha on the raft
  th1: [
    { my: 'လှော်ပါ ဆိုလား။ အမေ ဖာထားတဲ့ ဖောင်ဟောင်းနဲ့၊ ဒီဆိပ်ကနေ? ဘယ်လိုမှ မဖြစ်နိုင်ဘူး။', en: "Pole, you say? With Mum's patched-up raft, from this jetty? No chance." },
    { my: 'ဟိုကူးတို့ကြည့်။ ချောချောမောမော။ ကျွန်တော်တို့ကျမှ ရုန်းကန်ရတာ။', en: 'Look at the ferry. Smooth as anything. Only we have to struggle.' },
    { my: 'ကျွန်တော့် စာရင်း ရေးထားတယ်။ အကုန် မြစ်ရဲ့ အပြစ်။', en: "I've written my list. All the stream's fault." },
  ],
  thChoices: [
    { my: '"မြစ်ကြီးက မတရားတာပါ။ မင်းအပြစ် လုံးဝ မဟုတ်ဘူး။"', en: '"The stream\'s unfair. None of it is your fault."' },
    { my: '"ကူးတို့ကို ပြိုင်လှော်ပြလိုက်။"', en: '"Race the ferry. Show them."' },
    { my: '"မင်းစာရင်းကို အတူတူ ပြန်ကြည့်ရအောင်။"', en: '"Let\'s look at your list together."' },
  ],
  thBlame: [{ my: 'ဟုတ်တယ်မလား။ ဒါဆို ဘာလုပ်ဖို့ လိုသေးလဲ။ (ပြန်လှဲချလိုက်တယ်။)', en: '"Right? So why do anything?" (He lies back down.)' }],
  thBlameMaya: [{ my: '(အပြစ်ကို မြစ်ပေါ် ပုံချလိုက်တော့ သူ ဆက်မျောနေရုံပဲ။)', en: '(I heaped the blame on the stream, and he just keeps drifting.)' }],
  thRace: [{ my: 'ပြိုင်ရင် ရှုံးမှာ သိပြီးသား။ …ဒါကြောင့် မလှော်တာ။', en: "I already know I'd lose a race. …That's why I don't pole." }],
  thRaceMaya: [{ my: '(မြစ်ကို ရန်သူလုပ်လိုက်မိပြီ။ ပြိုင်ဖို့ မဟုတ်ဘူး။)', en: "(I made the stream an enemy. It isn't a race.)" }],
  thList: [{ my: '…အိမ်နံရံမှာ ကပ်ထားတယ်။ ဆိပ်ငယ်ထိပ်က လှေကား ငါးထစ်။ လာ။', en: "…It's pinned on the wall at home. Five steps up, at the head of Little Jetty. Come." }], // (INDEX 13.2: five steps)
  doorShut: [{ my: '(တံခါး ပိတ်ထားတယ်။ ကိုသီဟ မပါဘဲ မဝင်ဘူး။)', en: "(The door's shut. I won't go in without Ko Thiha.)" }],
  thTiffin: [{ my: 'အမေ့ ထမင်းချိုင့်။ ပထမအလှည့် မဆင်းခင် ထုပ်ထားခဲ့တာ။ နေ့တိုင်းပဲ။', en: "Mum's left my rice. She packs it before her first shift. Every day." }],
  thRead: [{ my: 'ရော့။ ဖတ်ကြည့်။', en: 'Here. Read it.' }],
  sortTitle: { my: 'ကိုသီဟရဲ့ စာရင်း', en: "Ko Thiha's list" },
  sortHint: { my: 'တစ်ကြောင်းချင်း သင့်တော်တဲ့ ခြင်းထဲ ထည့်ပါ', en: 'Put each line in the basket it belongs in' },
  sortBaskets: [
    { id: 'nobody', my: 'ဘယ်သူမှ မရွေးခဲ့ဘူး', en: 'Nobody chose this' },
    { id: 'mine', my: 'ကိုယ်ရွေးလို့ရတယ်', en: 'Mine to choose' },
  ],
  sortCards: [
    { id: 'born', my: 'ဒီဆိပ်မှာ မွေးတာ', en: 'Being born at this jetty', basket: 'nobody' },
    { id: 'fast', my: 'မြစ်ရေ မြန်တာ', en: 'The stream running fast', basket: 'nobody' },
    { id: 'old', my: 'ဖောင်က ဟောင်းနေတာ', en: 'The raft being old', basket: 'nobody' },
    { id: 'mum', my: 'အမေက ကျွန်တော့်ကို ရွေးမွေးတာ မဟုတ်၊ ကျွန်တော်လည်း အမေ့ကို မရွေးခဲ့', en: "Mum didn't pick me, and I didn't pick her", basket: 'nobody' },
    { id: 'ferry', my: 'ကူးတို့က ပိုမြန်တာ', en: 'The ferry being faster', basket: 'nobody' },
    { id: 'steer', my: 'လှော်မလား မျောမလား', en: 'Whether I steer or drift', basket: 'mine' },
    { id: 'which', my: 'ဘယ်ဆိပ်ကို သွားမလဲ', en: 'Which jetty I head for', basket: 'mine' },
    { id: 'help', my: 'ဘယ်သူ့ကို ကူမလဲ — အမေ၊ မောင်ငယ်', en: 'Who I help: Mum, Maung Nge', basket: 'mine' },
  ],
  sortWrongNobody: { my: 'ဟင့်အင်း… ဒါ ကိုယ်တိုင် ရွေးခဲ့တာ မဟုတ်ဘူး။', en: 'No… nobody picks that.', who: 'kothiha' },
  sortWrongMine: { my: 'ဒါကတော့ ကျွန်တော့်လက်ထဲမှာ။', en: "That one's in my hands.", who: 'kothiha' },
  thSorted: [{ my: 'ဒီဘက်ခြင်းက… နည်းနည်းပဲ။ ဒါပေမဲ့ ဒါတွေက ကျွန်တော့်ဟာ။', en: "This basket's… small. But these are mine." }],
  mayaSorted: [{ my: 'ဘယ်သူ့ကိုမှ အပြစ်တင်စရာ မလိုဘူး။ ဘယ်သူမှ မရွေးခဲ့တာပဲ။', en: 'No one to blame. Nobody chose it.' }],
  thBackDown: [{ my: 'ဖောင်ဆီ ပြန်ဆင်းမယ်။', en: "I'll go back down to the raft." }], // (added)
  looked2: [{ my: 'မြစ်က မတရားဘူး။ ဒါပေမဲ့ ဘယ်သူ့ကိုမှ ရွေးမခံရဘူး။ ကူးတို့ကလည်း ရုန်းရတာပဲ။', en: "The stream is unfair. But it doesn't single anyone out. The ferry struggles too." }],
  thWait: [{ my: 'ကျွန်တော့်စာရင်းက နံရံမှာ ရှိတယ်။ …ဒီမြစ်ကို ခဏ ကြည့်နေဦးမယ်။', en: "My list's on the wall. …I'll watch the river a while." }], // (added: before the talk opens)
  thNotYet: [{ my: 'ခဏ မျောနေပါရစေဦး…', en: 'Let me drift a little longer…' }],
  windowLook: [{ my: '(ပြတင်းပေါက်ကနေ သောင်ပြင်ပေါ်က ဆိပ်နိမ့်လေး နှစ်ခု မြင်ရတယ်။)', en: '(From the window: the two low jetties out on the sandbar.)' }], // (added)
  basketEarly: [{ my: '(ကိုယ့်အိမ် မဟုတ်ဘူး။ ခွင့်မတောင်းဘဲ မမွှေဘူး။)', en: "(Not my house. I won't rummage without asking.)" }], // (added, ch 20 p97)

  // ---- 6.6 pole
  poleTitle: { my: 'ကိုသီဟနဲ့ ဖောင်လှော်မယ်', en: 'Pole the raft with Ko Thiha' },
  poleHint: { my: 'လှော်တက်က ကြမ်းပြင်ထိတဲ့အချိန် ထိပါ', en: 'Tap when the pole touches the bottom' },
  poleFerry: { my: 'သွားပါစေ။ ဒီဘက်ကို သူ မလာနိုင်ဘူး။', en: "Let it go. It can't come this side.", who: 'kothiha' },
  poleDrift: { my: 'မျောသွားရင် ကျော်သွားတာပဲ။ ပြန်လှည့်မယ်။', en: 'Drift, and you go right past. Round again.', who: 'kothiha' },
  poleDuck: { my: 'ဖောင်လေး ရောက်လာပြီ! ကူးတို့ကို တစ်ပတ်လုံး စောင့်နေတာ။', en: "The raft's here! I've waited all week on the ferry." },
  poleCane: { my: 'ကြိမ်… ဆိပ်။ ကိုယ်တိုင် ဖတ်တာ!', en: 'Cane… Jetty. I read it!', who: 'maungnge' },
  poleHalf: { my: 'အောက်ကို ထိုး၊ နောက်ကို တွန်း။ ဖြည်းဖြည်း။ ဟုတ်ပြီ။', en: "Push down, then back. Slowly. That's it.", who: 'kothiha' },
  poleBoard: [{ my: 'မောင်ငယ်၊ အထုပ်တွေ တင်ခဲ့။', en: 'Maung Nge, bring the parcels.' }], // (added)

  // ---- 6.7 close
  ds1: [{ my: 'ဖောင်လေး ရေထဲ ပြန်ရောက်ပြီပဲ။', en: "So the raft's back on the water." }],
  thMum: [{ my: 'အမေ… ဖာထေးတာတွေ… ဘယ်လောက်…', en: 'Mum… all the patching… how much did…' }],
  ds2: [
    { my: 'ဖောင်ဆိုတာ ရေပေါ်မှာ ရှိဖို့ပဲ သားရဲ့။', en: "A raft's for being on the water, son." },
    { my: 'ညနေ ဆန်အိတ်တွေ ဘဲဆိပ်ကို ပို့စရာ ရှိတယ်။ လှော်ပေးမလား။', en: 'There are rice sacks for Duck Jetty this evening. Will you pole them over?' },
  ],
  thEnd: [{ my: 'လှော်မယ်။ …အမေ့အိတ်တွေ အရင် တင်မယ်။', en: "I'll pole. …Your sacks go on first." }],
  mayaEnd2: [{ my: '(မြစ်က မတရားတုန်းပဲ။ ဖောင်က နောက်ကျတုန်းပဲ။ ဒါပေမဲ့ လှော်ရင် ရောက်တယ်။ ရောက်တော့ လိုအပ်တယ်။)', en: "(The stream's still unfair. The raft's still slower. But steer, and you arrive. Arrive, and you're needed.)" }],
  thToWeigh: [{ my: 'အမေ့ဆီ သွားမယ်။ ချိန်ခွင်ရုံမှာ။', en: "I'm going to Mum. At the weigh-house." }], // (added)
  dsScale: [{ my: 'ချိန်ခွင်ကို စစ်ချင်ရင် စစ်။ အလေးတုံးတွေ သေတ္တာထဲမှာ။', en: 'Want to check the scale? Go ahead. The weights are in the box.' }],
  dsSon: [{ my: 'သားလား။ ဆိပ်ငယ်မှာ။ မြစ်ကို ကြည့်နေတာ များတယ်။', en: 'My son? At Little Jetty. He mostly watches the river.' }],
  dsAfter: [{ my: 'အိတ်တွေ တင်ပြီးပြီ။ သွားပါစေ။', en: "The sacks are aboard. Let him go." }], // (added)
  weighCheck: [{ my: '(ကြေးအလေးတုံး တစ်လုံး ချိန်ခွင်ပေါ် တင်လိုက်တယ်။ လက်တံက ညီညီလေး ငြိမ်သွားတယ်။)', en: '(A brass weight on the platform. The beam settles level.)' }], // (stage line, 6.4)
  weighSign: { my: 'ချိန်ခွင် စစ်ချင်သူ စစ်နိုင်ပါတယ်', en: 'Anyone may check the scale' },
  bookLook: [{ my: '(အလေးချိန်စာအုပ် ဖွင့်ထားတယ်။ ဘယ်သူမဆို ကြည့်လို့ရတယ်။)', en: '(The weights book lies open. Anyone may look.)' }], // (added)
  thAfter: [{ my: 'ညနေ အမေ့ဆန်အိတ်တွေ ဘဲဆိပ် ပို့ရမယ်။ နောက်ကျရင်တောင် ရောက်တယ်။', en: "Mum's rice sacks go to Duck Jetty this evening. Late or not, they'll get there." }],
  portersW: [
    { my: 'ဆေးရေးမြေပုံထဲမှာ ဆိပ်ခြေကနေ တံတားရှိတယ်တဲ့။ မိန်းကလေးတစ်ယောက် မနက်ကတည်းက အဲဒီမှာ ရပ်စောင့်နေတယ်။', en: 'The painted map shows a bridge from Jetty End. A girl\'s been standing out there since morning.' },
    { my: 'ဖောင်နဲ့ဆို အရှေ့ကမ်း ကူးလို့ရတယ်တဲ့။', en: 'They say you can raft across to the east bank.' },
    { my: 'ကူးတို့ ဆရာတွေလည်း မနက်တိုင်း ရေခပ်ရတယ်ဗျ။ သင်္ဘောအသစ်ဆိုပေမဲ့။', en: 'Even the ferry lads bail every morning. New boat or not.' },
  ],

  // ---- 7 main quest and desks
  deskHeadQ: { my: 'ဒီနေရာအကြောင်း ကိုယ်တိုင် မြင်ရတာကို ရေးမယ်။', en: 'Write what you can see here yourself.' },
  deskHead: [
    { my: 'ဆိပ်ခံ ခြောက်ခု ရှိတယ်။ ကူးတို့က ဆိပ်ကြီးမှာပဲ ကပ်ထားတယ်။', en: 'Six jetties. The ferry is tied up at the Big Jetty only.' },
    { my: 'ကူးတို့က ဆိပ်တိုင်းမှာ ရပ်တယ်။', en: 'The ferry stops at every jetty.' },
    { my: 'ဒီဆိပ်ကနေ အရှေ့ကမ်းကို တံတား ရှိတယ်။', en: 'A bridge runs from this wharf to the east bank.' },
  ],
  deskWrong: { my: '(ဒါ ကြားခဲ့တာ။ မျက်လုံးနဲ့ ပြန်ကြည့်ပါဦး။)', en: "(That's what I heard. Look again.)" },
  deskHeadDone: [{ my: 'ဖဲကြိုးလေး တက်သွားပြီ။ ဆိပ်ကမ်းကနေ အိမ်ကို စာမျက်နှာ လှန်လို့ရပြီ။', en: 'The ribbon is up. I can turn the page home from the wharf now.' }],
  deskEnd: [
    { my: 'ပျဉ်ချပ်တွေ ကြိုးချည်တိုင်မှာ ဆုံးတယ်။ ဟိုဘက်မှာ နှင်းနဲ့ ခေါက်ထားတဲ့ စာမျက်နှာပဲ။', en: 'The planks end at a mooring post. Beyond: mist, and a folded page.' },
    { my: 'ဒီကနေ တံတား ဆက်သွားတယ်။', en: 'The bridge carries on from here.' },
    { my: 'ဖောင်နဲ့ အရှေ့ကမ်းကို ကူးလို့ရတယ်။', en: 'You can raft across to the east bank.' },
  ],
  bridgeMaya: [{ my: 'မြေပုံထဲမှာ တံတား ရှိတယ်။ ရေပေါ်မှာ မရှိဘူး။', en: "The bridge is on the map. It isn't on the water." }],
  bridgeRub: [{ my: '(ကလောင်နဲ့ မြေပုံပေါ်က တံတားကို ဖျက်လိုက်မယ်။)', en: "(I'll rub the bridge off the map with the quill.)" }], // (added, said if the map closes unrubbed)
  eastLook: [{ my: '(အရှေ့ဘက်ကို ကြည့်တော့ နှင်းထဲမှာ ခေါက်ထားတဲ့ စာမျက်နှာ တစ်ရွက်ပဲ။ ကပ်စရာ ဆိပ် မရှိဘူး။)', en: '(Looking east: only a folded page in the mist. Nowhere to land.)' }], // (added)
  nc1: [
    { my: 'မာရာ! ဒီမြေပုံထဲမှာ တံတားရှိတယ်လို့… ဈေးထဲက ဝယ်ခဲ့တာ။', en: "Maya! This map says there's a bridge… I bought it at the Market." },
    { my: 'သုံးရက်ကြာရင် ဟိုဘက်မှာ ပထမဆုံး အလုပ် စရမှာ။ တံတား မရှိရင် ဘယ်လို သွားရမလဲ။', en: "My first job starts over there in three days. If there's no bridge, how do I get across?" },
    { my: 'မာရာ ပြောတဲ့အတိုင်း လုပ်မယ်။ ပြောပါ။', en: "I'll do whatever you say. Tell me." },
  ],
  ncChoices: [
    { my: '"တကယ့်တံတားက ခေါက်ရိုးမှာ။ နှစ်ရက်နေရင် ပွင့်မယ်။ စောင့်ပါ။"', en: '"The real bridge is at the Fold. It opens in two days. Wait for it."' },
    { my: '"ကူးတို့ကို မစီးနဲ့။ ဒီဘက်ကမ်းပဲ ပြေးတာ။ ဈေးကနေ ခေါက်ရိုးဘက် လမ်းလျှောက်ပါ။"', en: '"Don\'t take the ferry, it keeps to this bank. Walk from the Market toward the Fold."' },
    { my: '"ကျွန်မမြေပုံကို ကြည့်ပါ။ ကိုယ်တိုင် စစ်ပြီးသား။ ကျွန်မ ပြတဲ့လမ်းအတိုင်း လိုက်ပါ။"', en: '"Go by my map. I\'ve checked it myself. Follow the way I show you."' },
  ],
  ncAfter: [{ my: 'ဟုတ်ကဲ့… မာရာ ပြောတဲ့အတိုင်း လုပ်မယ်။ ဆေးရေးမြေပုံက မယုံရဘူး။ မာရာ့ဟာကတော့ ယုံရတယ်။', en: "Okay… I'll do as you say. The painted map can't be trusted. Yours can." }],
  mayaNc: [{ my: '(ကူညီလိုက်ရလို့ ဝမ်းသာတယ်… ဒါပေမဲ့ သူ ဒီဆိပ်ကို ကိုယ်တိုင် ဘာလို့ မလာကြည့်ခဲ့တာလဲ။ …ကျွန်မမြေပုံလည်း မြေပုံပဲလေ။)', en: "(I'm glad I could help… but why didn't she come and look at this jetty herself? …My map is a map too.)" }],
  ncWait: [{ my: 'မာရာ ပြောတဲ့အတိုင်း စောင့်နေမယ်။', en: "I'll wait, like you said." }],
  ncBefore: [{ my: 'ဒီမှာ တံတား ရှိရမှာ… မြေပုံထဲမှာတော့ ရှိတယ်။', en: 'There should be a bridge here… it\'s on the map.' }], // (added, if tapped before the beat)
  replyLine: { my: 'ကျွန်မမြေပုံကို ကိုယ်တိုင် စစ်ပြီးပြီ။ အဲဒီအတိုင်း လိုက်ရင် လမ်းမပျောက်ဘူး။', en: "I've checked my map myself. Follow it and you won't get lost." },

  // ---- 7.4 board (home)
  boardQ: [{ my: '(စာတိုက်နံရံက မေးခွန်းစာရွက်တွေ။ နှစ်ရွက် အသစ်။)', en: '(The question notes on the Post Office wall. Two are new.)' }], // (added)
  board: [
    { from: { my: 'ဈေးထဲက ကုန်သည်', en: 'a trader at the Market' }, my: 'မာရာ၊ ဆေးရေးမြေပုံထဲက ဖြတ်လမ်းတွေ ယုံရမလား။ ပြောသလို လုပ်မယ်။', en: "Maya, can I trust the painted map's shortcuts? I'll do what you say.",
      replies: [{ my: 'မယုံနဲ့။', en: "Don't." }, { my: 'ကျွန်မမြေပုံ ကြည့်ပါ။', en: 'Use my map.' }, { my: 'တချို့ပဲ မှန်တယ်။', en: 'Only some are true.' }] },
    { from: { my: 'ဆိပ်ကမ်းက ကလေး', en: 'a child at the wharf' }, my: 'ကူးတို့ပေါ် အလုပ်ဝင်ရမလား၊ ဖောင်ပေါ်မှာ ကူရမလား။', en: 'Should I work on the ferry or help on a raft?',
      replies: [{ my: 'ကူးတို့။', en: 'The ferry.' }, { my: 'ဖောင်။', en: 'The raft.' }, { my: 'အမေ့ကို မေးပါ။', en: 'Ask your mum.' }] },
  ],
  boardDone: [{ my: '(ပြန်စာ ကပ်ခဲ့ပြီ။)', en: '(Replies pinned.)' }], // (added)

  // ---- 9 night
  nightQ: { my: 'ဒီနေ့အကြောင်း မှန်မှန်ကန်ကန် ဘယ်လို ရေးမလဲ။', en: 'How will she write today, truthfully?' },
  nightChoices: [
    { my: 'ကိုသီဟ လှော်လိုက်တော့ ကူးတို့ထက် မြန်သွားတယ်။ ကိုလွင်လည်း ချက်ချင်း ဝမ်းသာသွားပြီး မနာလိုစိတ် လုံးဝ ပျောက်သွားတယ်။', en: "Once Ko Thiha poled he was faster than the ferry. And Ko Lwin was glad at once; the envy's gone for good." },
    { my: 'မြစ်က မတရားတုန်း၊ ဖောင်က နောက်ကျတုန်းပဲ။ ဒါပေမဲ့ ကိုသီဟ လှော်လို့ ကူးတို့ မရောက်တဲ့ဆိပ်တွေ ရောက်တယ်။ ကိုလွင်က ပူတဲ့အတွေးကို ရပ်ပြီး အနားကွပ်ကို နာမည်မပါဘဲ ထွင်းပေးတယ်။', en: "The stream's still unfair and the raft still slower, but Ko Thiha poled and reached the jetties the ferry can't. Ko Lwin stopped the hot thought and carved the border with no name on it." },
    { my: 'ဖောင်ဟောင်းနဲ့ ဘယ်တော့မှ မမီဘူး။ မနာလိုစိတ်လည်း ဘယ်တော့မှ မပျောက်ဘူး။', en: 'An old raft will never catch up. And envy never goes away.' },
  ],
  nightWrong: [
    [{ my: '(မဟုတ်ဘူး… ဒါ ချော့ပြောတာ။ ဖောင်က နောက်ကျတုန်းပဲ။ ပူတဲ့အတွေးလည်း ပြန်လာဦးမှာ။)', en: '(No… that flatters. The raft is still slower, and the hot thoughts will come back.)' }],
    [],
    [{ my: '(မဟုတ်ဘူး… ဒါ အားလျှော့ပြောတာ။ မမီပေမဲ့ ရောက်တယ်။ အတွေးလည်း ရပ်လို့ရတယ်။)', en: "(No… too gloomy. It didn't catch up, but it arrived. And a thought can be stopped.)" }],
  ],
  sleepQ: { my: 'ဒီည မှတ်စုစာမျက်နှာလေး ဘယ်သူ့အိမ်မှာ အိပ်မလဲ။', en: "Whose house does tonight's notebook page sleep at?" },
  stamp2: { my: 'စာမျက်နှာ ၂ — လူ့ဘဝ\nမြစ်ကို ဘယ်သူမှ မရွေးခဲ့ဘူး။ လှော်မလား မျောမလား ကိုယ်ရွေးတယ်။ တခြားသူတစ်ယောက်အတွက်လည်း မှန်ကြောင်း ကိုယ်တိုင် တွေ့ခဲ့ပြီ။', en: 'Page 2 — Human Life\nNobody chose the stream. Steer or drift is ours to choose. She saw for herself it holds for someone else too.' },
  stamp10: { my: 'စာမျက်နှာ ၁၀ — မုဒိတာ\nပူတဲ့အတွေးကို ရပ်ပြီး တစ်ဖက်သူအတွက် ဝမ်းသာတယ်။ နှစ်ဖက်လုံး အဆင်ပြေမှ မှန်တယ်။', en: "Page 10 — Gladness for Others\nStop the hot thought and be glad for them. It's right only when both sides are fine." },
  tomorrow: { my: 'နောက်တစ်နေ့ မနက် ရောက်ပြီ။', en: 'Morning comes.' },
};

/** Proof slips given today (bag id 'proof:<id>'; text in save.proofs). */
export const PROOFS = {
  copied: { my: 'ခွာညို ဆရာ့ပုံစံ မကူးဘူး။ စမ်းထွင်းတုံး လေးဆယ် ကိုယ်တိုင် မြင်ခဲ့ပြီ။', en: "Khwar Nyo didn't copy her teacher. I saw her forty trial blocks myself." },
  ferry: { my: 'ကူးတို့က ဆိပ်ကြီးမှာပဲ ကပ်တယ်။ ရေတိမ်တဲ့ဆိပ်တွေ မရောက်ဘူး။', en: 'The ferry only ties up at the Big Jetty. It cannot reach shallow jetties.' },
  weigh: { my: 'ဆိပ်ကမ်း ချိန်ခွင်ကို ဘယ်သူမဆို စစ်လို့ရတယ်။ မှန်တယ်။', en: 'Anyone may check the wharf scale. True.' },
  eastbank: { my: 'အရှေ့ကမ်းမှာ ဆိပ်မရှိဘူး။ နှင်းထဲမှာ ခေါက်ထားတုန်း။', en: 'No jetty on the east bank. It is still folded in the mist.' },
  bridge: { my: 'ဆိပ်ခြေမှာ တံတား မရှိဘူး။ ဆေးရေးမြေပုံထဲမှာပဲ ရှိတာ။', en: 'There is no bridge at Jetty End. Only on the painted map.' },
};
