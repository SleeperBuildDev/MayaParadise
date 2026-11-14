// Day 14's words (day14-spec.md 4–9, verbatim where the spec gives them). Every Burmese line is a draft for
// Maya to proofread. Lines marked "NEW draft" are not in the spec: small connective lines the code needs
// (a tap that must say something); keep them or cut them as Maya decides.
//
// Also here: the invitation template and each district's fallback line (spec 6), Day 13's slept13 / emNote
// (day13-spec 9: the morning reads them; local copies until day13.js exports them), and tonight's slept14
// (Day 15's morning reads it: exported again from day14.js as SLEPT / SLEPT14).

export const L = {
  // ---- 4. morning at home
  ww1: [{ my: 'မာရာရေ… မှတ်စုစာအုပ်လေး ပြန်ရောက်လာပြီ။ ဒီတစ်ခါလည်း စာတစ်ကြောင်း ပါလာတယ်။', en: 'Maya… your notebook is back. With a line again.' }],
  ink21: { my: 'စာမျက်နှာ ၂၁ — မကြိုက်ဆုံးအရာ\nအိမွန် ကိုယ်တိုင် ရေးလိုက်ပြီ။ ခဲတံ အမှန်ခြစ်က မင်ဖြစ်သွားပြီ။', en: 'Page 21 — What I Dislike Most\nEi Mon wrote it herself. The pencil tick turns to ink.' }, // NEW draft (spec: "inks ✓ ၂၁")
  lift: [
    { my: '(မနေ့က စာမျက်နှာပေါ်က ထိကရုန်းလေးနဲ့ မျက်မှန်ကြည်လေး ထွက်လာကြတယ်။)', en: "(A little touch-me-not and a pair of clear glasses climb out of yesterday's page.)" },
  ],
  liftFold: { my: '(သိုးမည်းလေး ပွတ်မိတော့ ရွက်လေးတွေ ပိတ်သွားတယ်။ ခဏနေတော့ ကိုယ့်ဘာသာ ပြန်ပွင့်လာတယ်။)', en: '(The Sheep brushes it and its leaves fold shut. A breath later they open again by themselves.)' }, // NEW draft (spec: shown, not said; said once here as a caption)
  ww2: [
    { my: 'ပြီးတော့… ဘုတ်ပေါ်မှာ စာရွက် တစ်ရွက်ပဲ ကျန်တော့တယ်။ ကျန်တာတွေ ရေးတဲ့သူတွေ ကိုယ်တိုင် လာဖြုတ်သွားကြပြီ။', en: 'And… only one note is left on the board. The rest were taken down by the people who wrote them.' },
    { my: 'မနက်ဖြန်ည စာအုပ်မိတ်ဆက်ပွဲအတွက် စာစောင်လေး ထုတ်မယ်တဲ့။ လူတိုင်း တစ်ပုဒ်စီ ရေးပေးကြတယ်။', en: "There'll be a little booklet for tomorrow night's launch. Everyone's written a piece." },
    { my: 'ဖိတ်စာတွေ ပုံစံဆိုင်မှာ အသင့်ဖြစ်နေပြီ။ ကိုယ်တိုင် လိုက်ပေးမှာဆို တံဆိပ်တုံးလေး မမေ့နဲ့နော်။', en: "The invitations are ready at the Template Shop. If you're taking them round yourself, don't forget the stamp block." },
    { my: 'ဒါနဲ့… စာအုပ်ကြီးရဲ့ နောက်ကျောဖုံးထဲမှာ မာရာ့ မြေပုံအပြည့်အစုံ ချိတ်ထားတယ်တဲ့။ ကိုယ်တိုင်တော့ မရောက်ဖူးဘူး။', en: "Oh… they say your full map of every road hangs inside the book's back cover. I've never been." }, // rumour `map` (false)
  ],
  // the last note (pinned low, a child's hand)
  note: { my: 'မာရာ… စာစောင်ထဲက ကျွန်တော့် စာစီစာကုံး အဆုံးမှာ "ဘယ်ကရခဲ့လဲ" ဘယ်သူ့နာမည်တွေ ထည့်ရမလဲ။ အစ်မ ရွေးပေးပါ။\n— တိုးတိုး (စာသင်ခန်း၊ ပြတင်းပေါက်နား)', en: "Maya… at the end of my essay for the booklet, whose names go under \"where I got it\"? You choose.\n— Toe Toe (the classroom, by the window)" },
  noteTitle: { my: 'ဘုတ်ပေါ်က နောက်ဆုံးစာရွက်', en: 'The last note on the board' }, // NEW draft (slip heading)
  noteMaya: [{ my: '(နောက်ဆုံးစာရွက်… ဒါကိုတော့ ကျွန်မ ရွေးမပေးသင့်ဘူး။ သူ့ဆီ ကိုယ်တိုင် သွားမယ်။)', en: "(The last note… this one isn't mine to choose. I'll go to him.)" }],
  boardEmpty: [{ my: '(ဘုတ်ပေါ်မှာ ဘာမှ မကျန်တော့ဘူး။ သူ့စာရွက်ကို သူ ကိုယ်တိုင် လာဖြုတ်သွားပြီ။)', en: '(Nothing left on the board. He took his note down himself.)' }], // NEW draft (spec 5.4: seen at home)
  boardBoardHeading: { my: 'မာရာ့ကို မေးပါ', en: 'Ask Maya' }, // NEW draft (the cork board's heading)
  shopInv: [
    { my: '(ဖိတ်စာ ရှစ်စောင်။ စာအိတ်တိုင်းမှာ နာမည်နဲ့ သူတို့နေရာ ပုံလေး ဆွဲထားတယ်။)', en: '(Eight invitations. Each envelope has a name and a little drawing of where they are.)' },
    { my: '(စာကြောင်းတိုင်းအောက်မှာ ပြောခဲ့တဲ့သူ နာမည်။ ကျွန်မစကား မဟုတ်ရင် ကျွန်မနာမည် မတပ်ဘူး။)', en: "(Under every line, the name of who said it. If the words aren't mine, my name doesn't go under them.)" },
  ],
  shopTaken: [{ my: '(ဖိတ်စာတွေ အိတ်ထဲမှာ ရှိပြီ။)', en: '(The invitations are in my bag.)' }], // NEW draft
  wwLater: [{ my: 'တိုးတိုးလား။ ဗလာစာအုပ်ရပ်က ကျောင်းထဲမှာ၊ ပဲပုံးဘက် ပြတင်းပေါက်နားက သူ့ခုံမှာ။ ဖဲကြိုးလမ်းက ရေပန်းအရှေ့ဘက်က စတာ။', en: "Toe Toe? In the Quarter's school, at his desk by the window over the bean box. The ribbon road starts east of the fountain." }],
  wwBoard: [{ my: 'ဘုတ်ပေါ်က နောက်ဆုံးစာရွက်လေး ကြည့်ပြီးပြီလား။ စာတိုက်နံရံမှာ နိမ့်နိမ့်လေး ချိတ်ထားတာ။', en: "Seen the last note on the board? Pinned low on the Post Office wall." }], // NEW draft (before the board is read: she says where, no marker)

  // ---- home stop: Pho Thar at his windmill table
  ptBefore: [{ my: 'ဒီနေ့ လေကောင်းတယ် မာရာ။ လေရဟတ်တွေ အကုန် လည်နေတယ်။', en: 'Good wind today, Maya. Every windmill is turning.' }], // NEW draft
  ptInv: [
    { my: 'ဖိတ်စာလား! …ဟယ်၊ ကျွန်တော့်စကား ပါတယ်။ ကျွန်တော့်နာမည်နဲ့။', en: 'An invitation! …Hey, my words are in it. With my name.' },
    { my: '"ဒီစာမျက်နှာကို ကျွန်မနဲ့အတူ စမ်းကြည့်ပေးလို့ ကျေးဇူးပါ" တဲ့။ ကျွန်တော်က စမ်းကြည့်ပေးတာလား။', en: '"Thank you for trying this page with me." I was trying it out?' },
  ],
  ptAfter: [{ my: 'မနက်ဖြန် ပွဲမှာ လေရဟတ်တွေ ယူလာမယ်။', en: "I'll bring windmills to the launch tomorrow." }], // NEW draft
  ukInv: [{ my: 'ကိုယ့်စကားကို သူများက နာမည်နဲ့တကွ ပြန်ပြောတာ ကြားရတော့ ချုပ်ရိုး ဖြောင့်သွားသလိုပဲကွဲ့။', en: 'Hearing your own words said back with your name on them… like a stitch running straight.' }],
  ukBefore: [{ my: 'ဖိုးသားလေးက ဒီနေ့ ကလေးတွေကို လေရဟတ် ခေါက်နည်း သင်ပေးနေတယ်ကွဲ့။', en: "Pho Thar's showing the little ones how to fold windmills today." }], // NEW draft

  // ---- invitation (one template; {line} and {name} per person; Maya signs it: the letter's own signature)
  invite: { my: 'မနက်ဖြန်ည စာရေးခန်းရှေ့မှာ စာအုပ်မိတ်ဆက်ပွဲ။\n"{line}" — {name}\nဒီစာမျက်နှာကို ကျွန်မနဲ့အတူ စမ်းကြည့်ပေးလို့ ကျေးဇူးပါ။', en: 'The launch, tomorrow night, in front of the Writing Room.\n"{line}" — {name}\nThank you for trying this page with me.' },
  mayaSign: { my: 'မာရာ', en: 'Maya' },
  postmarked: { my: 'တံဆိပ်ခတ်လိုက်ပြီ', en: 'Postmarked' }, // NEW draft (the stamp card's caption)
  needInv: [{ my: '(ဖိတ်စာတွေက ပုံစံဆိုင်မှာ ကျန်နေသေးတယ်။)', en: '(The invitations are still at the Template Shop.)' }], // NEW draft (Maya's own memory of ww2)

  // ---- 5. Quarter
  kids: [
    { my: 'တိုးတိုးက စာစီစာကုံးကို စာကြည့်တိုက်စာအုပ်ထဲက ကူးရေးတာတဲ့!', en: 'They say Toe Toe copied his essay out of a library book!' }, // rumour `essay` (false)
    { my: 'မနက်ကတည်းက စာသင်ခန်းထဲ ပြတင်းပေါက်နားက သူ့ခုံမှာ ထိုင်ရေးနေတာ။ ဘယ်သူ့မှ မပြဘူး။', en: "He's been at his desk by the classroom window since morning, writing. Won't show anyone." },
  ],
  tt1: [
    { my: 'အစ်မ! ကျွန်တော့် စာရွက်လေး မြင်ခဲ့လား။', en: 'Sister! You saw my note?' },
    { my: 'ဆရာမက စာစီစာကုံး အဆုံးမှာ "ဘယ်ကရခဲ့လဲ" ရေးရမယ်တဲ့။ ကျွန်တော် ဘာမှ မရေးထားဘူး။', en: 'Teacher says the end of the essay needs "where I got it". I haven\'t written anything.' },
    { my: 'အကုန် ကိုယ်တိုင် စဉ်းစားတာလို့ ထင်စေချင်တယ်။ …ဒါပေမဲ့ မမှန်ဘူးလေ။ အစ်မပဲ ရွေးပေးပါ။', en: 'I want them to think I thought of it all myself. …But that isn\'t true. You choose for me.' },
  ],
  essayTitle: { my: 'ကျွန်တော့် ကျောင်းသွားလမ်း', en: 'My way to school' },
  essayHolds: [{ my: '(စာအုပ်ကို ကမ်းပေးထားတယ်။)', en: '(He holds the exercise book out.)' }], // NEW draft (stage direction as a line)
  essayRead: [{ my: '"ကျွန်တော့် ပဲပင်တွေ အရိပ်ထဲမှာ နေလို့ နေရောင်မရဘဲ သေသွားတယ်"… ဒါ သူ့ကိုယ်ပိုင် စာကြောင်းပဲ။ ကူးထားတာ မဟုတ်ဘူး။', en: '"My beans stayed in the shade, got no sun, and died"… That\'s his own line. Nothing copied.' }],
  ttChoices: [
    { my: '"ဆရာမနာမည်နဲ့ အစ်မနာမည် ထည့်လိုက်ပေါ့။ အစ်မ ရွေးပေးမယ်။"', en: '"Put Teacher\'s name and mine. I\'ll choose for you."' },
    { my: '"\'လူတိုင်းကို ကျေးဇူးတင်ပါတယ်\' လို့ပဲ ရေးလိုက်။"', en: '"Just write \'thanks to everyone\'."' },
    { my: '"အစ်မ မှတ်စုစာအုပ်ရဲ့ နောက်ဆုံးစာမျက်နှာကို အရင် ကြည့်ပါလား။"', en: '"First, look at the last page of my notebook?"' },
  ],
  ttMe: [{ my: 'အစ်မ နာမည်က ထိပ်ဆုံးမှာလား။ …ဟုတ်ကဲ့။', en: 'Your name at the top? …Okay.' }],
  ttMeMaya: [{ my: '(သူ့အစား ကျွန်မ ရွေးပေးလိုက်ပြီ။ သူ့စာမျက်နှာပေါ်မှာ ကျွန်မ စာရင်း ဖြစ်သွားပြီ။)', en: "(I chose for him. Now it's my list on his page.)" }],
  ttAll: [{ my: 'လူတိုင်း… ဆိုတော့ ဘယ်သူမှ မဟုတ်ဘူးပေါ့။', en: 'Everyone… so, nobody.' }],
  ttAllMaya: [{ my: '(အားလုံးကို ကျေးဇူးတင်တာက ဘယ်သူ့ကိုမှ နာမည် မတပ်တာနဲ့ အတူတူပဲ။)', en: '(Thanking everyone is the same as naming no one.)' }],
  ttPageMaya: [{ my: '(ကျွန်မ မှတ်စုစာအုပ်ရဲ့ နောက်ဆုံးစာမျက်နှာ။ ညတိုင်း အိပ်ခဲ့တဲ့ အိမ်က စကားတစ်ကြောင်းစီ၊ နာမည်တစ်ခုစီ။)', en: '(The last page of my notebook. A line from every house it slept at, each with a name.)' }],
  ttPageTt: [{ my: 'အကုန် သူများ စကားတွေ… နာမည်တွေနဲ့။ ဒါပေမဲ့ ဒါ အစ်မ စာအုပ်ပဲလေ။', en: "All other people's words… with names. But it's still your book." }],
  ttNotYet: [{ my: 'ခဏ စဉ်းစားဦးမယ်… ကျွန်တော့်ခုံမှာ ရှိမယ်။', en: "Let me think a bit… I'll be at my desk." }],
  ttDontLook: { my: 'အစ်မ… မကြည့်နဲ့ဆို!', en: "Sister… I said don't look!" },
  bean: [{ my: '(အရိပ်ထဲက ရွှေ့ခဲ့တာ သူကိုယ်တိုင်။ အခု ပွင့်နေပြီ။)', en: '(He moved them out of the shade himself. Now they flower.)' }],
  ttDone: { my: 'ပြီးပြီ! လာကြည့်!', en: 'Done! Come and see!' },
  ttListTitle: { my: 'တိုးတိုးရဲ့ စာရင်း', en: "Toe Toe's list" }, // NEW draft (slip heading)
  ttList: { my: 'ဘယ်ကရခဲ့လဲ\n— ဆရာမ ဒေါ်နှင်းဝေ (ဘာကြောင့်လဲ မေးခိုင်းလို့)\n— စုနွယ် (မသိရင် မသိဘူး ပြောတတ်လို့)\n— မောင်ငယ် (လမ်းကို ပုံနဲ့ မှတ်တတ်လို့)\n— မီးတိုင်က ကြေးပြားပေါ်က အကြိမ်ကြိမ် ကြိုးစားခဲ့တဲ့ လူတွေ', en: 'Where I got it\n— Teacher Daw Hnin Wai (for making me ask why)\n— Su Nwe (for saying "I don\'t know" when she didn\'t)\n— Maung Nge (for knowing the way by pictures)\n— the people on the lamp plate who kept trying' },
  ttListMaya: [{ my: '(ကျွန်မ နာမည် မပါဘူး။ …သူ့စာရင်း၊ သူ့ရွေးချယ်မှု။ နာမည်တိုင်းနားမှာ ဘာကြောင့်လဲ ရေးထားတာ ကြည့်ပါဦး။)', en: "(My name isn't there. …His list, his choice. And look: beside every name, what for.)" }],
  ttCarry: [
    { my: 'ဒါ ဗလာစာအုပ်ရပ်အတွက် ဖိတ်စာလား။ ကျွန်တော့် လူတွေကို ကျွန်တော် ကိုယ်တိုင် ပေးမယ်။', en: "Is this the Quarter's invitation? I'll give it to my people myself." },
    { my: 'စာစီစာကုံးကိုတော့ ပုံနှိပ်တိုက်ကို ယူသွားပေးပါလား။ တံတားကူးပြီး ခေါက်ရိုးမှာလေ။ ကိုဝဏ္ဏ စောင့်နေတယ်။', en: "Could you take the essay to the printing shed? Across the bridge, at the Fold. Ko Wunna's waiting." },
    { my: 'စာတိုက်ဘုတ်က ကျွန်တော့်စာရွက်ကိုလည်း ကျွန်တော် ကိုယ်တိုင် လာဖြုတ်မယ်။', en: "And I'll take my note off the Post Office board myself." },
  ],
  ttCarryNoInv: [{ my: 'ဖိတ်စာတွေ ရလာရင် ဗလာစာအုပ်ရပ်ရဲ့ဟာ ကျွန်တော့်ကို ပေးနော်။ ကျွန်တော့် လူတွေကို ကိုယ်တိုင် ပေးချင်လို့။', en: "When you've got the invitations, give me the Quarter's? I want to hand them to my people myself." }], // NEW draft (if Maya came before the Template Shop)
  ttOut: [{ my: 'ဆရာမ ပြီးရင် အိုးတဲက မိချိုနဲ့ ဒေါ်အုန်း၊ ပြီးတော့ စုနွယ်နဲ့ မောင်ငယ်!', en: 'Teacher first, then Mi Cho and Daw Ohn at the shed, then Su Nwe and Maung Nge!' }], // NEW draft (he runs out)

  // ---- 6.1 Market
  thiri: [
    { my: 'မိတ်ဆက်ပွဲ တံဆိပ်ကို ခွာညို တစ်ယောက်တည်း အကုန်ထွင်းတာတဲ့။', en: 'They say Khwar Nyo carved the whole launch postmark by herself.' }, // rumour `border` (false)
    { my: 'သူနဲ့ ကိုလွင် ဒေါ်တင်တင့် လက်ဖက်ရည်ဆိုင်ထဲမှာ။ ကရားကြီး ငွေ့တက်နေတဲ့ ထောင့်ဆိုင်လေ။', en: "She and Ko Lwin are inside Daw Tin Tin's tea shop. The corner one with the big steaming kettle." },
  ],
  knSits: [{ my: '(ဖိတ်စာကို စားပွဲပေါ်မှာ တံဆိပ်ခတ်လိုက်တယ်။)', en: '(Maya stamps the invitation on the table.)' }], // NEW draft (stage direction)
  knQ: [
    { my: 'ဒီဘောင်လေး… ကျွန်မ ထွင်းတာ မဟုတ်ဘူး။ နာမည်လည်း မပါဘူး။', en: "This border… I didn't carve it. There's no name on it." },
    { my: 'ပွဲမှာ လူတွေ မေးရင် ဘယ်သူ့လက်ရာလို့ ပြောရမလဲ အစ်မ။', en: 'If people ask at the launch, whose work do I say it is?' },
  ],
  knChoices: [
    { my: '"ကိုလွင် ထွင်းတာ။ ညီမ ဒီဇိုင်းကို ဘောင်ခတ်ပေးခဲ့တာ။"', en: '"Ko Lwin carved it. He framed your design."' }, // true
    { my: '"ညီမ ကိုယ်တိုင်ပဲလို့ ပြောလိုက်ပါ။ လူတိုင်း အဲဒီလို ထင်နေကြတာ။"', en: '"Say it was you. Everyone thinks so."' }, // heard
    { my: '"ဘယ်သူမှ မသိဘူးလေ။ ဘောင်ပဲ ဟာ။"', en: '"Nobody knows. It\'s only a border."' }, // naming no one
  ],
  knWrong: [{ my: '(ဒါ ကြားခဲ့တာ… ကျွန်မ ကိုယ်တိုင် မြင်ခဲ့တာ မဟုတ်ဘူး။)', en: "(That's what I heard… not what I saw.)" }],
  knEnd: [{ my: 'ဒါဆို ကျွန်မ ဖိတ်စာနောက်ကျောမှာ ရေးထားမယ်။ "ဘောင် — ကိုလွင်"။', en: 'Then I\'ll write it on the back of my invitation. "Border — Ko Lwin."' }],
  ktEnd: [{ my: '…မလိုပါဘူးကွာ။ သူ့တံဆိပ် လူတိုင်းဆီ ရောက်သွားတာ မြင်ရတာနဲ့ ဝမ်းသာပါတယ်။', en: '…No need. Seeing her mark reach everyone is enough to make me glad.' }],
  knEnd2: [{ my: 'ရေးထားမှာပဲ အစ်ကို။ မှန်တာကိုး။', en: "I'm writing it anyway. It's true." }],
  knBefore: [{ my: 'ဒီနေ့ တံဆိပ်တုံး အစမ်းတွေ ထုတ်ကြည့်နေတာ။ ပွဲအတွက်။', en: "I'm going over my trial blocks today. For the launch." }], // NEW draft
  knAfter: [{ my: '"ဘောင် — ကိုလွင်"။ ရေးထားပြီ။', en: '"Border — Ko Lwin." Written.' }], // NEW draft (her own slept14 wording)
  klBefore: [{ my: 'သူ့ဒီဇိုင်းက လှတယ်ကွာ။ ငါက ဘောင်လေး ခတ်ပေးရုံပဲ။', en: 'Her design is a fine one. I only cut the frame round it.' }], // NEW draft
  kpTea: [
    { my: 'လက်ဖက်ရည် တစ်ခွက် ထိုင်သောက်သွားဦး။ ဒီတစ်ခွက် ငါတိုက်မယ်။', en: "Sit and have a cup. This one's on me." },
    { my: 'ပုံနှိပ်တိုက်က မာရာ ခွင့်ပြုမှ ရိုက်တယ်တဲ့။ ငါတော့ မစစ်ရသေးဘူး။ ကြားရုံပဲ။', en: "They say the printing shed prints nothing without Maya's say-so. I haven't checked. Only heard." }, // rumour `shed` (false)
  ],

  // ---- 6.2 Wharf
  cmBefore: [{ my: 'ဒီနေ့ ဆိပ်ကမ်းတိုင်း ပါဆယ်တွေ ပို့ရမယ်။', en: 'Parcels for every jetty today.' }], // NEW draft
  cmInv: [
    { my: 'ဖိတ်စာ နှစ်စောင်လား။ ဦးဘိုလေးအတွက်လည်း ပါတယ်ပေါ့။', en: 'Two invitations? One for U Bo Lay too, then.' },
    { my: 'ဒီဖောင်က ဆိပ်ကမ်းတိုင်းမှာ ရပ်တယ်။ လိုက်ခဲ့လေ။ ကိုယ့်ဖိတ်စာ ကိုယ်ပေး။', en: 'This raft stops at every jetty now. Come along. Hand yours over yourself.' },
  ],
  rideTitle: { my: 'ကိုသီဟရဲ့ ဖောင်နဲ့ လိုက်မယ်', en: "Ride Ko Thiha's raft" },
  rideHint: { my: 'ဆိပ်ကမ်းမှာ ရပ်တိုင်း လူကို ထိပြီး နှုတ်ဆက်ပါ', en: 'At every jetty, tap the person to say hello' },
  rideStops: {
    firewood: { my: 'ထင်းဆိပ်', en: 'Firewood' },
    big: { my: 'ဆိပ်ကြီး', en: 'Big Jetty' },
    duck: { my: 'ဘဲဆိပ်', en: 'Duck' },
    cane: { my: 'ကြိမ်ဆိပ်', en: 'Cane Jetty' },
  },
  nt1: [{ my: 'ငါ့ကိုလည်း ဖိတ်တာလား။ …ဟင်း။ ဖောင်ဟောင်းက ဒီနေ့ နည်းနည်း မြန်လာသလိုပဲ။', en: 'Me too? …Hmph. That old raft seems a little faster today.' }],
  cmEnd: [{ my: 'သူ ပြုံးမှာ မဟုတ်ဘူး။ ဒါပေမဲ့ ဖိတ်စာကိုတော့ အိတ်ထဲ ထည့်သွားတယ်။', en: "He won't smile. But he put the invitation in his pocket." }],
  cmAfter: [{ my: 'ဆိပ်ကမ်း လေးခုလုံးမှာ ရပ်ခဲ့တယ်။ ဦးဘိုလေးလည်း လက်ပြတယ်။ နည်းနည်းလေး။', en: 'We stopped at all four jetties. U Bo Lay waved. A little.' }], // = his slept14 line

  // ---- 6.3 Junction
  kwNoEssay: [{ my: 'တိုးတိုးရဲ့ စာမူ မရောက်သေးဘူး။ ဗလာစာအုပ်ရပ်က ကလေးလေ။ သူ့စာ မပါရင် စာစောင် မပြီးဘူး။', en: "Toe Toe's piece hasn't come. The boy from the Quarter. The booklet isn't done without it." }],
  kw1: [
    { my: 'မာရာ ခွင့်ပြုမှ ရိုက်တယ်? မဟုတ်ပါဘူး။ ရေးတဲ့သူကိုပဲ မေးတာ။ မသိရင် မေး၊ ကိုယ့်ဘာသာ မခန့်မှန်းဘူး။', en: "Print only with Maya's say-so? No. I ask whoever wrote it. Don't know, ask: no guessing on my own." }, // proof:shed
    { my: 'တိုးတိုးက နာမည် စာလုံးပေါင်းတွေကို နောက်ကျောမှာ ရေးပေးထားတယ်။ သူ့ကို မေးစရာ မလိုတော့ဘူး။', en: 'Toe Toe wrote the spellings on the back. Nothing left to ask him.' },
    { my: 'အစ်မ မှတ်စုစာအုပ်က စကားတွေကိုလည်း စာစောင်ရဲ့ နောက်ဆုံးစာမျက်နှာမှာ ထည့်မယ်ဆို။ ဘယ်စကား ဘယ်သူ့ဟာလဲ မှန်မှန် တွဲပေးပါ။', en: "And your notebook's lines go on the booklet's last page, you said. Pair each line with its person, exactly." },
  ],
  matchTitle: { my: 'ဘယ်စကား ဘယ်သူ ပြောခဲ့တာလဲ', en: 'Who said which line?' },
  matchHint: { my: 'စကားတစ်ကြောင်း နှိပ်ပြီး ပြောခဲ့တဲ့သူကို နှိပ်ပါ', en: 'Tap a line, then the person who said it' },
  kwUnsure: [{ my: 'ခဏ… မသေချာရင် မှတ်စုစာအုပ်ကို ပြန်ဖွင့်ကြည့်။ ခန့်မှန်းမနေနဲ့။', en: "Wait… if unsure, open the notebook again. Don't guess." }],
  kwPrint: [
    { my: 'ပြီးပြီ။ စာစောင်တွေ အစ်မကားပေါ် တင်ပေးမယ်။', en: "Done. I'll load the booklets into your car." },
    { my: 'သတိ… ဒီထဲမှာ လူအများကြီးရဲ့ စကားတွေ ပါတယ်။ ကုန်တင်ထားရင် စာမျက်နှာ လှန်လို့ မရဘူး။ ဖဲကြိုးက ကုန်ကို မသယ်ဘူး။ ကားနဲ့ပဲ မောင်းသွားရမယ်။', en: "Careful… a lot of people's words are in there. With cargo aboard you can't turn the page. Ribbons don't carry freight. You'll have to drive." },
    { my: 'အရှေ့ဘက်လမ်းက မီးဖိုတန်းနဲ့ ဥယျာဉ်ကို ဖြတ်ပြီး နောက်ဆုံးရွက်ထိ ရောက်တယ်။ အိမ်ပြန်လမ်းက အဲဒီက စတာလေ။', en: 'The road east runs through Hearth Row and the Garden to the last leaf. The road home starts there.' },
  ],
  pressRuns: [{ my: '(စက်ဘီး လီဗာ ဆွဲလိုက်တိုင်း စာရွက်တစ်ရွက်စီ ထွက်လာတယ်။)', en: '(With every pull of the lever, another sheet comes off the press.)' }], // NEW draft (the scene)
  kwAfter: [{ my: 'ခြောက်လား ကိုးလား၊ နာမည်လား ဘယ်သူ့လဲ… မသေချာရင် မေးတယ်။', en: "Six or nine, whose name… if I'm not sure, I ask." }], // = amb.kowunna
  nc1: [
    { my: 'အစ်မ! ဖိတ်စာလား။ ကျေးဇူးနော်။', en: 'Sister! An invitation? Thank you.' },
    { my: 'ပွဲကို ဘယ်အချိန် လာမလဲ ကျွန်မ ဆုံးဖြတ်ပြီးပြီ။ ဒီဘောင်ကို သူနဲ့အတူ ပိတ်ပြီးမှ လာမယ်။', en: "I've decided when I'll come. After I've locked this frame with her." },
  ],
  ncChoices: [
    { my: '"ဘောင်က မနက်ဖြန်မှ လုပ်ပါလား။ စောစော လာခဲ့။"', en: '"Do the frame tomorrow. Come early."' },
    { my: '"အစ်မဆီ ညနေ လာခဲ့။ ဘာလုပ်ရမလဲ ပြောပြမယ်။"', en: '"Come to me this evening. I\'ll tell you what to do."' },
    { my: '"ကောင်းတယ်။ ပွဲမှာ တွေ့မယ်နော်။"', en: '"Good. See you there."' },
  ],
  ncLean: [{ my: 'အစ်မ… ကျွန်မ ဆုံးဖြတ်ပြီးသားပါ။', en: "Sister… I've already decided." }],
  ncLeanMaya: [{ my: '(ပြန်ပြီး ဖြေပေးမိပြန်ပြီ။ သူ့ဆုံးဖြတ်ချက်ပါ။)', en: "(I answered for her again. It's her decision.)" }],
  ncEnd: [{ my: 'ကိုယ့်သော့ ကိုယ်ကိုင်ထားတယ်။ ဘောင်ပိတ်ပြီးရင် ပုံနှိပ်တိုက်ကို ကိုယ်တိုင် သော့ခတ်ခဲ့မယ်။', en: "I hold my own key. When the frame's locked I'll lock up the shed myself." }],
  ncBusy: [{ my: '(နေခြည်က ဘောင်ပိတ်နည်း ပြပေးနေတယ်။ ကျွန်မကို လှည့်မကြည့်ဘူး။ ကောင်းပါတယ်။)', en: "(Nay Chi is showing her how to lock a frame. She doesn't look round. That's good.)" }], // NEW draft
  utint: [{ my: 'ဒီလူငယ်တွေ အလုပ်ကောင်းတယ်။ ငါကတော့ လက်ဖက်ရည်ပဲ သောက်နေတယ်။', en: 'These young ones work well. I just drink my tea.' }], // NEW draft
  newcomer: [{ my: 'ဒီ ကျောက်သွားကို ဒီလို လှည့်ရတာလား… ဟုတ်ပြီ။', en: 'You turn the quoin like this…? Got it.' }], // NEW draft

  // ---- 6.4 the drive
  cargoNo: { my: '(စာစောင်တွေ ကားပေါ်မှာ ရှိနေတယ်။ စာမျက်နှာ မလှန်ခင် ကားနဲ့ပဲ မောင်းသွားမယ်။)', en: "(The booklets are in the car. I'll drive, not turn the page.)" },
  myRun: [
    { my: 'အစ်မ! ကားထဲက အထုပ်တွေ လေးနေမယ်။ ချဖို့ လိုရင် ပြော။', en: 'Sister! That bundle looks heavy. Say if you need a hand.' },
    { my: 'ဒေါ်ခင်မေက မနက်ဖြန်ပွဲအတွက် တစ်ရပ်ကွက်လုံးစာ မုန့်ဖုတ်နေတာတဲ့။ အထဲ ဝင်ကြည့်လေ။', en: "Daw Khin May's baking for the whole launch tomorrow, they say. Go in and see." }, // rumour `bread` (true)
  ],
  myAfter: [{ my: 'အစ်မ ကားကို ကျွန်တော် ကြည့်ထားပေးမယ်။', en: "I'll keep an eye on your car." }], // NEW draft
  breadSeen: [{ my: '(စင်တိုင်း ပြည့်နေတယ်။ မီးဖိုလည်း တောက်နေတယ်။)', en: '(Every rack is full. The ovens are lit.)' }], // NEW draft (seen before confirmed)
  kmBefore: [{ my: 'ဒီနေ့ မုန့်ဖို ပူတယ်ကွယ်။ ခဏ နေဦး။', en: "The ovens are hot today, dear. Mind yourself." }], // NEW draft
  kmInv: [
    { my: 'ဖိတ်စာအတွက် ကျေးဇူး။ မနက်ဖြန် မုန့်တွေ ကျွန်မ ကိုယ်တိုင် ယူလာမယ်။', en: "Thank you for the invitation. I'll bring the bread myself tomorrow." },
    { my: 'ဒီလုံးကတော့ အမေ့နည်း။ ဗန်းပေါ်မှာ အဲဒီအတိုင်း ရေးထားမယ်။ ကျွန်မ တီထွင်တာလို့ ထင်နေကြတာ။', en: "The round one is my mother's recipe. I'll write that on the tray. People think I made it up." },
  ],
  kmAfter: [{ my: '"အမေ့ မုန့်လုံး"။ ဗန်းမှာ ရေးထားပြီ။', en: '"Mother\'s round loaf." It\'s on the tray now.' }], // NEW draft
  emShop: [{ my: 'မုန့်လုံးတစ်လုံး ဝယ်နေတာ အစ်မ။', en: "Just buying a loaf, sister." }], // NEW draft
  emAsk: [{ my: 'စာစောင်လေး တစ်အုပ် ဖွင့်ကြည့်ခွင့် ရမလား အစ်မ။', en: 'May I open one of the booklets, sister?' }],
  emChoices: [
    { my: '«ဖွင့်ကြည့်ပါ»', en: '"Go ahead."' },
    { my: '«မဖွင့်နဲ့»', en: '"Better not."' },
  ],
  emRead: [{ my: 'ဒီမှာ… ကျွန်မစကား၊ ကျွန်မနာမည်နဲ့။ ကိုဝဏ္ဏ မရိုက်ခင် ကျွန်မကို လာမေးသွားတယ်လေ။ ဒါကြောင့် စိတ်ချတယ်။', en: "Here… my words, with my name. Ko Wunna came and asked me before he printed them. That's why I don't mind." }],
  emNo: [{ my: 'ရပါတယ်။ မနက်ဖြန်မှ ကြည့်မယ်။', en: "That's fine. I'll see it tomorrow." }],
  hhBefore: [{ my: 'တံခါး ဖွင့်ထားတယ်ကွယ်။ ဝင်ချင်ရင် ဝင်။', en: "The gate's open. Come in if you like." }], // NEW draft
  hhInv: [
    { my: 'တံခါး ပိတ်မထားတော့ဘူး။ လမ်းကိုလည်း မစောင့်ကြည့်တော့ဘူး။', en: "The gate stays open. I don't watch the lane any more, either." },
    { my: 'ပွဲကို လာမလား မလာဘူးလား… ကိုယ့်ဘာသာ ဆုံးဖြတ်မယ်ကွယ်။', en: "Whether I come or not… I'll decide that myself." },
  ],
  hhMaya: [{ my: '(ဖိတ်ပြီးပြီ။ ကျန်တာ သူ့ဟာ။)', en: "(He's invited. The rest is his.)" }],
  spBefore: [{ my: 'ခြောက်တဲ့ ထုပ်တွေမှ နာမည်ရေးတယ်။ စိုတဲ့ဟာ မရောင်းဘူး။', en: "Only the dry bales get my name. I don't sell damp ones." }], // NEW draft (ch 17 lived)
  spInv: [{ my: 'ငါ့ကိုလည်း? …ကောင်းပြီ။ ပွဲမှာ စက္ကူထုပ်တွေ ချိန်ပြီးမှ ပေးမယ်။ ခြောက်ခြောက်သွေ့သွေ့။', en: "Me too? …All right. I'll bring paper for the launch. Weighed. Dry." }],

  // ---- 6.5 the Blank Page
  psBefore: [{ my: 'ဒီမှာ ခဏ နားကြတာ။ ထိုင်ပါဦး။', en: "We're resting here a while. Sit down." }], // NEW draft
  psInv: [
    { my: 'ဖိတ်စာ? ကျွန်တော်တို့က ခရီးသည်တွေပဲလေ။ …ဒါပေမဲ့ လာမယ်။', en: "An invitation? We're only travellers. …But we'll come." },
    { my: 'မနေ့က အတူလျှောက်ခဲ့တဲ့လမ်းက မြောက်ဘက် မာရာ့ စာအုပ်ကြီးရဲ့ နောက်ကျောဖုံးအထိ ရောက်တယ်။', en: 'The road we walked yesterday runs north to the back cover of your big book.' },
    { my: 'နောက်ကျောဖုံး တံခါးမှာ သော့ပေါက် မရှိဘူးတဲ့။ အထဲကပဲ ဖွင့်လို့ရတယ်တဲ့။', en: 'They say the Back Cover door has no keyhole. Opens only from inside.' }, // rumour `keyhole` (false)
  ],
  psAfter: [{ my: 'လမ်းက မြောက်ဘက်ကို တည့်တည့်ပဲ။ ကိုယ်တိုင် လျှောက်ကြည့်ပေါ့။', en: 'The road runs straight north. Walk it and see.' }], // NEW draft
  guestCup: [{ my: '(လက်ခံခွက်လေး ကျွန်မနေရာမှာ ချထားပေးပြီးသား။ မမေးဘဲနဲ့။)', en: '(The Guest Cup is already set at my place. Nobody asked.)' }], // NEW draft (spec 6.5 shown)

  // ---- 7. ambient
  amb: {
    hninwai: [
      { my: 'တိုးတိုးကို "ဘယ်ကရခဲ့လဲ" ရေးခိုင်းထားတယ်။ ကျွန်မနာမည် ပါမပါ မမေးဘူး။ သူ့ဆုံးဖြတ်ချက်။', en: 'I asked Toe Toe for "where I got it". I won\'t ask if my name is in it. His decision.' },
      { my: 'ကျွန်မနာမည် ထိပ်ဆုံးမှာ… ဇယားထက် ပိုဂုဏ်ယူစရာ။', en: 'My name at the top of his list… prouder than any chart.' }, // after d14.ttNames
    ],
    micho: [{ my: 'ဘီးပေါ်က "မရသေးဘူး" ကို မဖျက်ဘဲ ထားထားတယ်။ ပွဲမှာ အိုးလေးလုံး ပြမယ်။', en: 'I kept "not yet" on my wheel. I\'ll show four pots at the launch.' }],
    dawohn: [{ my: 'ဆရာ့ကျေးဇူးလည်း မမေ့ဘူး။ တပည့်ဆီက သင်ရတာလည်း မမေ့ဘူး။', en: "I don't forget what I owe my master. Or what my pupil taught me." }],
    sunwe: [{ my: 'တိုးတိုးက ကျွန်မနာမည် ထည့်တယ်တဲ့! "မသိရင် မသိဘူး ပြောတတ်လို့" တဲ့။', en: 'Toe Toe put my name in! "For saying I don\'t know", he says.' }],
    maungnge: [{ my: 'ကျွန်တော့်နာမည်ကို စာထဲမှာ ကိုယ်တိုင် ဖတ်ကြည့်မယ်။ စာလုံး သုံးလုံးလောက် ဖတ်တတ်နေပြီ။', en: "I'll read my own name in it myself. I can read three letters of it already." }],
    yeyint: [{ my: 'မနက်ဖြန် စင်ပေါ်မှာ ကျွန်တော် ခုံတွေပဲ ချပေးမယ်။ ဇာတ်ဆောင်က တခြားသူ။ အေးဆေးပဲ။', en: "Tomorrow I'm just setting out the benches. Someone else leads. It's a relief." }],
    thiri: [{ my: 'အကြောင်းပြန်စာ မစောင့်တော့ဘူး။ ဖိတ်စာကိုတော့ ဝမ်းသာစွာ လက်ခံတယ်။', en: "I don't wait for replies now. This one I'm glad to take." }],
    kowunna: [{ my: 'ခြောက်လား ကိုးလား၊ နာမည်လား ဘယ်သူ့လဲ… မသေချာရင် မေးတယ်။', en: "Six or nine, whose name… if I'm not sure, I ask." }],
    wintwar: [{ my: 'ဖိတ်စာ ကျန်ရင် ထားခဲ့။ မနက်ဖြန် မနက် ကျွန်မ လိုက်ပို့ပေးမယ်။', en: "If any invitations are left, leave them. I'll take them round in the morning." }],
    dawpwint: [{ my: 'ဒီမှာ ဘယ်သူ့ကိုမှ ယုံခိုင်းမထားဘူး။ ကိုယ်တိုင် စမ်းကြည့်ပြီး မှန်မှ ဘုတ်အောက်မှာ လက်မှတ်ထိုးကြတာ။', en: 'Nobody here is told to believe. They try it themselves, and sign under the board if it holds.' }],
    tintin: [{ my: 'ဆိပ်ကမ်းကလူ၊ ဈေးကလူ၊ ခရီးသည်… ပထမခွက်က အတူတူပဲ။', en: 'Wharf people, market people, travellers… the first cup is the same for all.' }],
  },

  // ---- 8. the Back Cover
  doorNoKey: [{ my: '(ကိုယ့်သော့ ပါမှ ဖွင့်လို့ရမယ်။)', en: '(It needs my own key.)' }], // NEW draft (only if the key is somehow missing)
  door: [
    { my: '(သော့ပေါက် ရှိတယ်။ အပြင်က ဖွင့်လို့ ရတယ်။)', en: '(There is a keyhole. It opens from outside.)' }, // proof:keyhole
    { my: 'နောက်ဆုံးတံခါးကို တခြားသူ့သော့နဲ့ မဟုတ်ဘဲ ကိုယ့်သော့နဲ့ ဖွင့်ရတယ်။', en: "The last door opens with my own key, not anyone else's." },
  ],
  mapSheet: [{ my: 'မြေပုံ မရှိဘူး။ ဗလာစာရွက် တစ်ရွက်ပဲ။', en: 'No map. One blank sheet.' }],
  deskQ: { my: 'ဒီနေရာအကြောင်း ကိုယ်တိုင် မြင်ရတာကို ရေးမယ်။', en: 'Write what you can see here yourself.' },
  desk: [
    { my: 'အတွင်းဖုံးမှာ ပိတောက်ခက်ပုံတွေ ရိုက်ထားတယ်။ မီးတိုင် တစ်တိုင်နဲ့ ဗလာစာရွက် တစ်ရွက်ပဲ ရှိတယ်။', en: 'Padauk sprigs printed on the endpaper. One lamp, one blank sheet.' }, // true
    { my: 'အထဲမှာ လမ်းတိုင်းပါတဲ့ မာရာ့ မြေပုံအပြည့်အစုံ ချိတ်ထားတယ်။', en: "Maya's complete map of every road hangs inside." }, // heard (Ma Wint War)
    { my: 'ဒီတံခါးမှာ သော့ပေါက် မရှိဘူး။ အထဲကပဲ ဖွင့်လို့ရတယ်။', en: 'This door has no keyhole; it only opens from inside.' }, // heard (Ko Pyae Sone)
  ],
  deskWrong: { my: '(ဒါ ကြားခဲ့တာ။ မျက်လုံးနဲ့ ပြန်ကြည့်ပါဦး။)', en: "(That's what I heard. Look again.)" },
  deskDone: [{ my: 'နောက်ဆုံး ဖဲကြိုး တက်သွားပြီ။ အိမ်ရဲ့ အောက်ဆုံးမှာ ကိုယ့်သော့နဲ့ ဖွင့်ရတဲ့ အခန်းလေး။', en: 'The last ribbon is up. A little room under my own home, opened with my own key.' }],
  unload: [{ my: 'မနက်ဖြန် မဝင့်ဝါ လာယူမယ်။ ဒီည ဒီမှာ အိပ်ပါစေ။', en: 'Ma Wint War will fetch them tomorrow. Let them sleep here tonight.' }],
  holesEmpty: [{ my: '(အကန့်ငယ် ရှစ်ခု။ ဘာမှ မထည့်ရသေးဘူး။)', en: '(Eight pigeonholes, still empty.)' }], // NEW draft
  holesFull: [{ my: '(စာစောင်တွေ အကန့်ထဲမှာ အိပ်နေကြပြီ။)', en: '(The booklets are asleep in the pigeonholes.)' }], // NEW draft
  replyTitle: { my: 'နာမည်မပါတဲ့ စာကို ပြန်စာ', en: 'Reply to the unsigned letter' },
  replyHint: { my: 'ကိုယ်တိုင် စမ်းကြည့်ခဲ့တာကိုပဲ ရေးပါ', en: 'Write only what you have tried yourself' },
  replyPrompt: { my: '"လမ်းမပျောက်အောင် မြေပုံလေး ရှိလား" တဲ့။', en: '"Is there a map, so I don\'t get lost?"' },
  replyFragments: [ // the good ones are written out in this order
    { my: 'ကျွန်မ စာမျက်နှာတွေ ကျွန်မအတွက် မှန်ခဲ့တယ်။ တခြားသူတွေနဲ့လည်း စမ်းကြည့်ခဲ့ပြီ။', en: 'My pages were true for me. I have tried them beside others too.', good: true },
    { my: 'မြေပုံဆိုတာ လမ်းကို ပြရုံပဲ။', en: 'A map only shows the road.', good: true },
    { my: 'လမ်းကို ကိုယ်တိုင် လျှောက်ပြီး ကိုယ်တိုင် စစ်ကြည့်ပါ။', en: 'Walk it yourself, and check it yourself.', good: true },
    { my: 'ကျွန်မ စာထဲက စကားတွေ ဘယ်သူ့ဆီကလဲ နောက်ဆုံးစာမျက်နှာမှာ ရေးထားတယ်။', en: 'Where my words came from is written on my last page.', good: true },
    { my: 'ကိုယ့်ကိုယ်ကို အားကိုးပါ။', en: 'Rely on yourself.', good: true },
    { my: 'လမ်းပျောက်မှာ စိုးရင် ကျွန်မကို မေးပါ။', en: "If you're afraid of getting lost, ask me.", good: false }, // Day 2's crossed-out line
    { my: 'ကျွန်မ ပြောသလို လုပ်ရင် မမှားဘူး။', en: "Do as I say and you won't go wrong.", good: false },
  ],
  replyParrot: [{ my: '(ဒါ မှီခိုင်းတဲ့ စာကြောင်း။ ဖြတ်ခဲ့ပြီးသား။)', en: '(That line asks them to lean. I crossed it out already.)' }],
  replySit: [{ my: '(မှတ်စုစာအုပ်ရဲ့ နောက်ကျောစာမျက်နှာ "စာကို ပြန်စာ"။ ခဲတံနဲ့ ရေးခဲ့တာတွေ။ အခု မင်နဲ့ ရေးမယ်။)', en: '(The notebook\'s back page, "Reply to the letter". My pencil lines. Now I write it in ink.)' }], // NEW draft (spec 8.4 narration)
  lastQ: { my: 'နောက်ဆုံး တစ်ကြောင်း…', en: 'One last line…' },
  lastChoices: [
    { my: 'ကျွန်မ လျှောက်ခဲ့တဲ့လမ်းအတိုင်း လိုက်ခဲ့ပါ။', en: 'Follow the road I walked.' },
    { my: 'လမ်းပျောက်ရင် ပြန်စာရေးပါ။ ကျွန်မ ဖြေပေးမယ်။', en: "If you get lost, write back. I'll answer." },
    { my: '(ဒီစာကြောင်းကို ချန်ထားမယ်။)', en: '(Leave this line.)' },
  ],
  lastWrong: [
    [{ my: '(ဒါ ကျွန်မ လမ်း။ သူ့လမ်း မဟုတ်ဘူး။)', en: "(That's my road. Not theirs.)" }],
    [{ my: '(ပြန်ပြီး ကျွန်မကို မှီခိုင်းနေပြန်ပြီ။)', en: '(Asking them to lean on me again.)' }],
  ],
  lastBlank: [{ my: 'နောက်ဆုံးစာကြောင်းက ကျွန်မဟာ မဟုတ်ဘူး။ စာရေးခဲ့တဲ့သူ ကိုယ်တိုင် ရေးရမှာ။', en: "The last line isn't mine. Whoever wrote to me will write it themselves." }],
  replyDone: [{ my: '(ပြန်စာကို တစ်ခေါက် ခေါက်ပြီး စာရေးစင်ပေါ်မှာ ထားခဲ့မယ်။)', en: '(I fold the reply once and leave it on the slope.)' }], // NEW draft (spec 8.4 narration)
  deskHomeCargo: [{ my: '(စာစောင်တွေ အရင် အကန့်ထဲ ထည့်ရမယ်။ ကုန်တင်ထားရင် စာမျက်နှာ မလှန်ဘူး။)', en: "(The booklets go in the pigeonholes first. No page-turns with cargo aboard.)" }], // NEW draft

  // ---- 9. night page
  nightQ: { my: 'ဒီနေ့အကြောင်း မှန်မှန်ကန်ကန် ဘယ်လို ရေးမလဲ။', en: 'How will she write today, truthfully?' },
  nightChoices: [
    { my: 'ကျွန်မ စာမျက်နှာတွေက လူတိုင်းကို ကယ်လိုက်ပြီ။ လူတိုင်း ကျွန်မကို ကျေးဇူးတင်ကြတယ်။', en: 'My pages saved everyone. Everyone thanked me.' },
    { my: 'ကျွန်မနဲ့အတူ စာမျက်နှာတွေ စမ်းကြည့်ပေးခဲ့တဲ့သူတွေကို နာမည်နဲ့ ကျေးဇူးတင်ခဲ့တယ်။ တိုးတိုးက သူ့နာမည်တွေ ကိုယ်တိုင် ရေးတယ်။ ပြန်စာရဲ့ နောက်ဆုံးစာကြောင်းကို ချန်ထားခဲ့တယ်။', en: "I thanked, by name, the people who tried my pages with me. Toe Toe wrote his names himself. I left the reply's last line blank." },
    { my: 'ဘယ်သူမှ ကျွန်မကို မလိုတော့ဘူး။ ဘုတ်ပေါ်မှာ စာရွက် တစ်ရွက်မှ မကျန်တော့ဘူး။', en: 'Nobody needs me any more. Not one note is left on the board.' },
  ],
  nightWrong: [
    [{ my: '(မဟုတ်ဘူး… ချော့ပြောတာ။ ကယ်တာ မဟုတ်ဘူး၊ လမ်းကို ကိုယ်တိုင် လျှောက်ကြတာ။)', en: '(No… that flatters. I saved nobody; they walked it themselves.)' }],
    [],
    [{ my: '(မဟုတ်ဘူး… အားလျှော့ပြောတာ။ မမှီတော့တာ၊ ဘေးကနေ လက်တွဲလို့ ရသေးတယ်။)', en: "(No… too gloomy. They don't lean now; we can still walk side by side.)" }],
  ],
  sleepQ: { my: 'ဒီည မှတ်စုစာမျက်နှာလေး ဘယ်သူ့အိမ်မှာ အိပ်မလဲ။', en: "Whose house does tonight's notebook page sleep at?" },
  stampText: { my: 'စာမျက်နှာ ၂၃ — ကိုးကား\nကိုယ်သယ်လာတဲ့ စကားတွေ ဘယ်သူ့ဆီကလဲ ပြောခဲ့ပြီ။ တခြားသူ တစ်ယောက်လည်း ကိုယ်တိုင် ပြောတတ်သွားတာ မြင်ခဲ့ပြီ။', en: 'Page 23 — References\nShe said whose words she carries, and saw someone else learn to say it himself.' },
  allPages: { my: 'စာမျက်နှာ နှစ်ဆယ့်သုံးမျက်နှာလုံး ရွှေမင်နဲ့ ဖြစ်သွားပြီ။', en: 'All twenty-three pages are in gold ink.' },
  leftover: { my: 'ပေးမပြီးသေးတဲ့ ဖိတ်စာတွေကို မဝင့်ဝါ မနက်ဖြန် လိုက်ပို့ပေးမယ်။', en: 'Ma Wint War will carry the invitations not yet given, in the morning.' },
  tomorrow: { my: 'နောက်ဆုံးနေ့ မနက် ရောက်ပြီ။', en: 'The last morning comes.' },
};

/** Proof slip texts (spec 2): save.proofs[id] -> the slip's line in the bag. */
export const PROOFS = {
  essay: { my: 'တိုးတိုး စာစီစာကုံးက ကူးထားတာ မဟုတ်ဘူး။ သူ့ကိုယ်ပိုင်စာကြောင်း ပါတယ်။', en: "Toe Toe's essay isn't copied. His own line is in it." },
  border: { my: 'တံဆိပ်ဘောင်ကို ကိုလွင် ထွင်းတာ။ ခွာညို တစ်ယောက်တည်း မဟုတ်ဘူး။', en: 'Ko Lwin carved the border, not Khwar Nyo alone.' },
  shed: { my: 'ပုံနှိပ်တိုက်က မာရာ့ခွင့်ပြုချက် မစောင့်ဘူး။ ရေးတဲ့သူကို မေးတာ။', en: "The shed doesn't wait for Maya's say-so. It asks the writer." },
  bread: { my: 'ဒေါ်ခင်မေ မိတ်ဆက်ပွဲအတွက် မုန့်ဖုတ်နေတယ်။ မှန်တယ်။', en: 'Daw Khin May is baking for the launch. True.' },
  map: { my: 'နောက်ကျောဖုံးထဲမှာ မြေပုံ မရှိဘူး။ ဗလာစာရွက် တစ်ရွက်ပဲ။', en: 'No map inside the Back Cover. One blank sheet.' },
  keyhole: { my: 'တံခါးမှာ သော့ပေါက် ရှိတယ်။ ကိုယ့်သော့နဲ့ အပြင်က ဖွင့်လို့ရတယ်။', en: 'The door has a keyhole. Your own key opens it from outside.' },
};

/**
 * One invitation per district (spec 6): who it is for (shown as the speaker of the credited line) and the
 * fallback line, used when the notebook never slept at that person's house. Fallbacks are the person's own
 * words, verbatim from the day that has them (Pho Thar: day1.js ptSpins[0]).
 */
export const INVITES = {
  home: { who: 'phothar', line: { my: 'လည်ပြီ! ချုပ်ရိုးလိုပဲ… ထပ်ခါထပ်ခါ လုပ်မှ ရတာပဲ။', en: 'It turns! Just like the stitches… it takes again and again.' } },
  quarter: { who: 'toetoe', line: { my: 'ကျွန်တော့် ပဲပင်တွေ အရိပ်ထဲမှာ နေလို့ နေရောင်မရဘဲ သေသွားတယ်။', en: 'My beans stayed in the shade, got no sun, and died.' } },
  market: { who: 'khwarnyo', line: { my: 'အစမ်း လေးဆယ် ထွင်းပြီးမှ ရတာ။', en: 'It took forty trial blocks.' } },
  wharf: { who: 'kothiha', line: { my: 'ရေစီးက မမျှဘူး။ မျှောမလား၊ လှော်မလား၊ ကိုယ်ရွေးတယ်။', en: "The stream isn't fair. Drift or pole: I choose." } },
  junction: { who: 'naychi', line: { my: 'ကိုယ့်သော့က ကိုယ့်လက်ထဲမှာ။', en: 'My key is in my own hand.' } },
  hearth: { who: 'khinmay', line: { my: 'တောင်းပန်တယ်။ နောက်က ဒါပေမဲ့ မပါဘူး။', en: "I'm sorry. No 'but' after it." } },
  garden: { who: 'hpohtaw', line: { my: 'ဆက်ပါ၊ မနွယ်ပါနဲ့။', en: "Connect. Don't entwine." } },
  blank: { who: 'pyaesone', line: { my: 'ကိုယ်တိုင် စမ်းကြည့်ပြီးမှ လက်မှတ်ထိုးမယ်။', en: "I'll sign once I've tried it myself." } },
};

/** Day 13's next-morning lines (day13-spec 9 `slept13`), until day13.js exports them as SLEPT. */
export const SLEPT13 = {
  eimon: { my: '"မကြိုက်တာ ရှိခွင့် ရှိတယ်။ မုန်းနေဖို့ကတော့ မလိုဘူး။" — အိမွန်', en: '"You\'re allowed to dislike something. You don\'t have to keep hating it." — Ei Mon' },
  sithu: { my: '"ကြည့်ချင်ရင် မေး။ ရိုးရိုးလေး။ ဘာလို့ အခုမှ သိရတာလဲ။" — စည်သူ', en: '"Want to look? Ask. Simple. Why did it take me this long?" — Sithu' },
  yadanar: { my: '"အကြောင်းရင်း ပြောတာနဲ့ ဆင်ခြေပေးတာ မတူဘူး။" — ရတနာ', en: '"Giving a reason isn\'t the same as making an excuse." — Yadanar' },
  khinmay: { my: '"မကျက်သေးတဲ့ မုန့်ကို မဖော်နဲ့။ လူလည်း ဒီလိုပဲ။" — ဒေါ်ခင်မေ', en: '"Don\'t uncover a loaf before it\'s baked. People too." — Daw Khin May' },
  maungarkar: { my: '"တစ်ယောက်ယောက် ပျောက်နေရင် စာနံရံမှာ ရေးတာထက် ကိုယ်တိုင် သွားရှာ။" — မောင်အာကာ', en: '"If someone\'s missing, go and look, don\'t just write it on the wall." — Maung Arkar' },
  dawpwint: { my: '"တိတ်ဆိတ်တာ တံခါးပိတ်တာ မဟုတ်ဘူး။ ပြတင်းဖွင့်တာ။" — ဒေါ်ပွင့်', en: '"Quiet isn\'t a shut door. It\'s an open window." — Daw Pwint' },
  pyaesone: { my: '"မသိဘူးလို့ ပြောတဲ့ ခေါင်းဆောင်နောက် လိုက်ရတာ ပိုလုံခြုံတယ်။" — ပြည့်စုံ', en: '"Safer to follow a leader who says \'I don\'t know\'." — Pyae Sone' },
  shwesin: { my: '"နှစ်ကြောင်းမြောက်ကို မနက်ဖြန် ထိုးမယ်။ ဒီနေ့ မေးပြီးမှ ငှားခဲ့ပြီ။" — ရွှေစင်', en: '"I\'ll sign line two tomorrow. Today I asked before borrowing." — Shwe Sin' },
  moe: { my: '"အိမ်မြှောင်လေး တွန်တယ်။ တိတ်တော့ ကြားရတယ်။" — မိုး', en: '"The gecko chirped. You only hear it in the quiet." — Moe' },
  naychi: { my: '"လမ်းကို မေးမယ့်အစား လျှောက်ကြည့်ခဲ့တယ်။ ခြေရာ ကျန်ခဲ့တယ်။" — နေခြည်', en: '"Instead of asking the way, I walked it. It left footprints." — Nay Chi' },
};

/** Ei Mon's note (Day 13's emNote, the signature split off: the letter overlay signs it). Inks ✓ ၂၁. */
export const EM_NOTE = {
  my: 'အစ်မ…\nဒီနေ့ ရတနာက ကျွန်မ ရက်ကန်းဖုံးဆီ လက်လှမ်းလာတယ်။\nအပူ တက်လာတာ သိလိုက်တယ်။ အသက်ရှူတယ်။ "အရင်မေး" လို့ ပြောတယ်။\nသူ မေးတယ်။ ကျွန်မက "မရသေးဘူး" လို့ ဖြေတယ်။ သူ ပြုံးပြီး ပြန်သွားတယ်။\nမကြိုက်တာကတော့ ရှိတုန်းပဲ။ မုန်းတာကတော့ မရှိတော့ဘူး။',
  en: "Sister…\nToday Yadanar reached for my loom cover.\nI felt the heat coming. I breathed. I said \"ask first\".\nShe asked. I said \"not yet\". She smiled and went back.\nI still don't like it. I don't hate it any more.",
};

/** Day 15's morning lines from tonight's house (spec 9 `slept14`). */
export const SLEPT14 = {
  toetoe: { my: '"ဒီနေ့မေးခွန်း: စာအုပ်တစ်အုပ်ထဲမှာ လူဘယ်နှစ်ယောက်ရဲ့ စကား ပါသလဲ။" — တိုးတိုး', en: '"Today\'s question: how many people\'s words are in one book?" — Toe Toe' },
  khwarnyo: { my: '"ဘောင် — ကိုလွင်။ ရေးလိုက်ပြီ။" — ခွာညို', en: '"Border — Ko Lwin. Written." — Khwar Nyo' },
  kothiha: { my: '"ဆိပ်ကမ်း လေးခုလုံးမှာ ရပ်တယ်။ ဦးဘိုလေးလည်း လက်ပြတယ်။ နည်းနည်းလေး။" — ကိုသီဟ', en: '"Stopped at all four jetties. U Bo Lay waved. A little." — Ko Thiha' },
  naychi: { my: '"ဘောင်ပိတ်ပြီးပြီ။ သော့ခတ်ပြီးပြီ။ လာခဲ့မယ်။" — နေခြည်', en: '"Frame locked. Shed locked. On my way." — Nay Chi' },
  hpohtaw: { my: '"လာမယ်။ ကိုယ့်ဘာသာ ဆုံးဖြတ်တာ။" — ဦးဖိုးထော်', en: '"I\'ll come. My own decision." — U Hpo Htaw' },
};

/** The match's fallback Sayings (day2-spec 9), credited exactly as written there. */
export const SAYINGS_FALLBACK = [
  { left: { my: 'ဒီနေ့မေးခွန်း: ကြယ်တွေက နေ့ခင်းဘက် ဘယ်ရောက်သွားလဲ။', en: "Today's question: where do the stars go in the daytime?", icon: 'book' }, right: { my: 'တိုးတိုး', en: 'Toe Toe' } },
  { left: { my: 'ကလေးတစ်ယောက် မေးတဲ့ ဘာကြောင့်လဲ တစ်ခုက အမှတ်ဇယားထက် ကျွန်မကို ပိုသင်ပေးတယ်။', en: "One child's 'why?' teaches me more than the marks chart.", icon: 'book' }, right: { my: 'ဒေါ်နှင်းဝေ', en: 'Daw Hnin Wai' } },
  { left: { my: 'ဒေါ်ဒေါ်လည်း ဆရာလုပ်ရတာ ပထမဆုံးပဲ။', en: "It's Aunty's first time teaching, too.", icon: 'book' }, right: { my: 'မိချို', en: 'Mi Cho' } },
  { left: { my: 'စာတွေ အိမ်တိုင်းရောက်အောင် ပို့တယ်။ ကိုယ့်စာ ကိုယ်ရေးဖို့ မေ့နေတာ။', en: "I carry everyone's letters. I forgot to write my own.", icon: 'book' }, right: { my: 'မဝင့်ဝါ', en: 'Ma Wint War' } },
];
