// Day 9's words (day9-spec 4-9), kept apart from the logic in day9.js. Every Burmese line is a draft for
// Maya to proofread. Lines changed from the spec to fit the built world are marked WORLD (the Row lies NORTH of
// the Junction square in the open world, and the torn crease is the lane north from the Row's middle).

export const L = {
  // ---- 4. morning at home
  ww1: [{ my: 'မာရာရေ… မှတ်စုစာအုပ် ပြန်ရောက်လာပြီ။ ဒီတစ်ခါလည်း စာတစ်ကြောင်း ပါလာတယ်။', en: 'Maya… your notebook is back. Another line in it.' }],
  // the notebook line from last night's house (day8-spec section 9, `slept8`)
  slept8: {
    naychi: { my: '"တစ်နေကုန် စောင့်ခဲ့တယ်။ မနက်ဖြန် ကိုယ့်ခြေနဲ့ တစ်လှမ်း လှမ်းကြည့်မယ်။" — နေခြည်', en: '"I waited all day. Tomorrow I\'ll take one step on my own feet." — Nay Chi' },
    thida: { my: '"တွင်းကို ဒီမနက်လည်း ကြည့်ခဲ့တယ်။ ပြည့်နေတုန်း။" — မသီတာ', en: '"I looked in the well again this morning. Still full." — Ma Thida' },
    kowunna: { my: '"မနေ့က မေးတတ်လာတယ်။ ဒီနေ့ နားထောင်တတ်အောင် သင်မယ်။" — ကိုဝဏ္ဏ', en: '"Yesterday I learned to ask. Today I\'ll learn to listen." — Ko Wunna' },
    utint: { my: '"အနှစ်လေးဆယ်ကြာမှ တစ်ဖက်ဘက်က ကြည့်ဖူးတယ်။" — ဦးတင့်', en: '"Forty years, and I\'d never looked from the other side." — U Tint' },
    kan: { my: '"ရှေးစကားကို လေးစားတယ်။ ဒါပေမဲ့ တွင်းကို ကိုယ်တိုင် ကြည့်တယ်။" — ဦးကံ', en: '"I respect the old sayings. And I look in the well myself." — U Kan' },
  },
  ww2: [{ my: 'ကိုဝဏ္ဏဆီကလည်း စာလေး ပါလာတယ်။', en: 'And a note from Ko Wunna.' }],
  kwNote: { my: 'အစ်မ… ဆရာကြီးကို အရင်ခွင့်တောင်းပြီးမှ ခေါင်းစီးတုံးကို အတူတူ ပြန်ဆင်ခဲ့တယ်။\nနာရီ မှန်တဲ့ စာရွက် ဒီမနက် ထွက်သွားပြီ။\nဆရာကြီး မရယ်တော့ဘူး။ ကျွန်တော်လည်း မမေးဘဲ ဘာမှ မလုပ်တော့ဘူး။', en: "Sister… I asked the old printer first, then we set the title block back together.\nThe sheet with the right hour went out this morning.\nHe didn't scoff. And I don't do anything without asking now." },
  ttQ: { my: '"ဒီနေ့မေးခွန်း: ပေါင်မုန့်က မီးဖိုထဲမှာ ဘာလို့ ဖောင်းလာတာလဲ။" — တိုးတိုး', en: '"Today\'s question: why does bread puff up in the oven?" — Toe Toe' },
  cat: { my: '(မနေ့က စာမျက်နှာပေါ်ကနေ ပိုးကောင်လေး တစ်ကောင် တွန့်လိမ်ပြီး ထွက်လာတယ်။ ကွင်း ခုနစ်ကွင်း။)', en: "(A little caterpillar wriggles off yesterday's page. Seven rings.)" },
  beetle: { my: '(နောက်ပြီး ပိုးတောင်မာလေး။ ကျောပေါ်မှာ ၆… ပတ်လှည့်လိုက်တော့ ၉။)', en: '(Then a little beetle. A 6 on its back… it turns round: a 9.)' },
  mayaPets: [{ my: 'ကြားရုံနဲ့ မယုံဘူး။ ဟိုဘက်ကနေလည်း ကြည့်မယ်။ လိုက်ခဲ့ကြ။', en: 'Not believing just what I hear. Looking from the other side too. Come on, both of you.' }],
  ww3: [
    // WORLD: "north of the Junction" (the spec said east; in the open world the Row is up the road north)
    { my: 'ပုံနှိပ်ဆရာကြီး ပြောတယ်… လမ်းဆုံရဲ့ မြောက်ဘက်မှာ ခေါင်းတိုင်တွေ မီးခိုး မပြတ်တဲ့ လမ်းတစ်လမ်း ရှိတယ်တဲ့။ မီးဖိုတန်း။', en: "The old printer says north of the Junction there's a street whose chimneys never stop smoking. Hearth Row." },
    { my: 'အဲဒီက မုန့်ဖုတ်သည်ရဲ့ အော်သံက ပုံနှိပ်တိုက်အထိ ကြားရတယ်တဲ့။ "နှုတ်ကြမ်းပေမဲ့ စိတ်ရင်းကောင်းတယ်" တဲ့။', en: 'That baker\'s shouting carries all the way to the printing shed, they say. "Rough mouth, good heart," they say.' },
    { my: 'သူ့တပည့် လှည်းတွန်းတဲ့ ကောင်လေးကတော့ အမြဲ ပြုံးနေတာပဲတဲ့။ ဘာမှ ပူပင်ပုံ မပေါ်ဘူး။', en: 'Her apprentice, the cart boy, is always smiling, they say. Nothing seems to bother him.' },
    { my: 'ဒါနဲ့… အဲဒီဘက်က လူတွေက ကိုယ့်ဟာကိုယ်ပဲ နေကြတာ၊ တစ်ယောက်ကို တစ်ယောက် မကူကြဘူးတဲ့။ ကြားတာပဲနော်။', en: "Oh… people over there keep to themselves, they say. Nobody helps anybody. Only what I heard." }, // rumour `keepto` (false)
  ],
  wwLater: [{ my: 'လမ်းဆုံ ရင်ပြင်ကနေ မီးခိုးကို လိုက်သွား။ မြောက်ဘက် လမ်းအတိုင်းပဲ။', en: 'From the Junction square, follow the smoke. Up the road, north.' }], // WORLD
  wwBoard: [{ my: 'ညက ဘုတ်ပေါ်မှာ စာရွက်အသစ် တစ်ရွက် ရောက်လာတယ်။ "မယုံနဲ့ဦး" ဆိုတဲ့ မာရာ့စာအောက်မှာ။', en: 'A new note went up on the board overnight. Right under your "don\'t believe it yet".' }],
  wwAfter: [{ my: 'မီးဖိုတန်းက ပြန်လာပြီလား။ မုန့်နံ့ လိုက်ပါလာတယ်။', en: "Back from Hearth Row? You've brought the smell of bread with you." }],
  // the people of the Row, pencilled on the notebook's people page by their labels
  labels: {
    khinmay: { my: 'အော်တတ်တဲ့ မုန့်ဖုတ်သည်', en: 'the Shouting Baker' },
    maungarkar: { my: 'အမြဲပြုံးတဲ့ လှည်းကောင်လေး', en: 'the Always-Smiling Cart Boy' },
    eimon: { my: 'စကားနည်းတဲ့ ကောင်မလေး', en: 'the Quiet Girl' },
  },
  arrive: [{ my: 'စက္ကူညိုကြီးပေါ်မှာ မီးလောင်ကွင်းလေးတွေ… ပူတာက ပြီးသွားပြီ၊ အမာရွတ်ကတော့ ကျန်နေတယ်။ ပေါင်မုန့်နံ့လည်း မွှေးလိုက်တာ။', en: 'Brown paper with little scorch rings… the burn is long over, but the mark stays. And the smell of bread.' }],

  // ---- 5. chapter 14 · Daw Khin May (inside the bakery)
  kmShout: { my: 'အာကာ! ဒုတိယဗန်း! ဘယ်ရောက်နေတာလဲ!', en: 'Arkar! The second tray! Where are you!' },
  kmNoCart: [{ my: 'အာကာ လှည်းနဲ့ ထွက်သွားတယ်။ မီးဖိုကတော့ ဘယ်သူ့ကိုမှ မစောင့်ဘူး။', en: "Arkar's out with the cart. The oven waits for nobody." }], // new: before the cart
  km1: [
    { my: 'စာရေးဆရာမလား။ ထိုင်ချင် ထိုင်။ မုန့်က ဘယ်သူ့ကိုမှ မစောင့်ဘူး။', en: 'A writer? Sit if you like. Bread waits for nobody.' },
    { my: 'ကျွန်မ အသံကျယ်တာ သိပါတယ်။ နှုတ်ကြမ်းပေမဲ့ စိတ်ရင်းကောင်းပါတယ်။ အာကာ ကောင်းဖို့ပဲ။', en: "I know I'm loud. Rough mouth, good heart. It's for Arkar's own good." },
    { my: 'ကြည့်ပါလား၊ သူ တတ်လာတယ်။ လအနည်းငယ်နဲ့ မုန့်ဖုတ်သမား ဖြစ်လာပြီ။', en: "Look, he's learning. A few months and he's a baker." },
  ],
  kmAgain: [{ my: 'ကဲ… စာရေးဆရာမ။ ဘာလုပ်မလဲ။', en: 'Well, writer. What will it be?' }], // new: coming back to her before the watch
  kmChoices: [
    { my: '"အော်တာ မှားပါတယ် ဒေါ်ဒေါ်။"', en: '"Shouting is wrong, Aunty."' },
    { my: '"ဟုတ်တယ်၊ သူ တတ်လာတာပဲ။ ဒါဆို ပြီးတာပဲ။"', en: '"True, he\'s learning. Then that\'s that."' },
    { my: '"ဗန်းတစ်ဗန်း ပြီးတဲ့အထိ ဘေးကနေ ကြည့်ခွင့်ပေးပါ။"', en: '"May I watch from the side for one tray?"' },
  ],
  kmWrong: [{ my: 'မှားတယ်? ကျွန်မ ဆရာတွေလည်း အော်ပြီး သင်ခဲ့တာ။ ကျွန်မ မုန့်ဖုတ်တတ်တယ် မဟုတ်လား။', en: "Wrong? My teachers shouted too. And I can bake, can't I?" }],
  kmWrongMaya: [{ my: '(မကြည့်ရသေးဘဲ အမှားလို့ ပြောလိုက်မိပြီ။ သူ ပိုတင်းသွားတယ်။)', en: "(I called it wrong before I'd even looked. She's only dug in.)" }], // new
  kmAgree: [{ my: '(ချော့ပြောလိုက်တာပဲ။ ကိုယ်တိုင် မကြည့်ရသေးဘူး။)', en: "(I just agreed with her. I haven't looked yet.)" }],
  kmWatch: [{ my: 'ကြည့်ချင် ကြည့်။ မီးဖိုတံခါးနား မကပ်နဲ့။', en: 'Watch, then. Keep away from the oven door.' }],
  // 5.2 the watch
  watchHow: { my: 'ကြည့်ပြီး တကယ် ဖြစ်နေတာကို နှိပ်ပါ', en: "Watch, and tap what's really happening" }, // the act's one instruction, never a pointer
  watchCue: {
    khinHeat: { my: '(ဗန်းခေါင်းလောင်း မြည်တယ်။ ဗန်း နောက်ကျနေပြီ။)', en: '(The tray bell rings. The tray is late.)' },
    arkarHeat: { my: 'အာကာ! မီးဖိုတံခါး! ခုချက်ချင်း!', en: 'Arkar! The oven door! Now!' },
    door: { my: '(ဒေါ်ခင်မေ ပြေးသွားပြီး သူ့လက်ကောက်ဝတ်ကို ဆွဲလိုက်တယ်။)', en: '(Daw Khin May hurries over and grabs his wrist.)' },
    loaves: { my: '(ဗန်း ထွက်လာပြီ။ စင်ပေါ် တင်လိုက်တယ်။)', en: '(The tray comes out. Onto the rack it goes.)' },
  },
  looks: {
    khinHeat: { pencil: { my: 'ဒေါသကြီးလို့', en: "she's just bad-tempered" }, gold: { my: 'ဗန်းနောက်ကျတာ မြင်ရုံနဲ့ သူ့ခွက်က အရင်ပူလာတယ်။ စကား မထွက်ခင်ကတည်းက။', en: 'Her cup heats first, the moment the tray is late, before a word.' } },
    arkarHeat: { pencil: { my: 'ကျင့်သားရနေပြီ', en: "he's used to it" }, gold: { my: 'အော်သံ ရောက်မှ သူ့ခွက် ပူလာတယ်။ ကော်ပြား လက်ထဲက ချော်လုနီးပါး။', en: 'His cup heats only when the shout reaches him; the peel nearly slips.' } },
    door: { pencil: { my: 'အလကား အော်တာ', en: 'shouting for nothing' }, gold: { my: 'သူ့လက်ကောက်ဝတ်ကို မီးဖိုတံခါးနားကနေ ဆွဲထုတ်လိုက်တာ။ သူ့အတွက် တကယ် ကြောက်နေတာ။', en: "She pulled his wrist back from the hot door. She's truly afraid for him." } },
    loaves: { pencil: { my: 'အော်မှ မုန့်ကောင်းတာ', en: 'bread needs shouting' }, gold: { my: 'မုန့်တွေ ကောင်းတယ်။ သူ တကယ် တတ်လာတာ မှန်တယ်။', en: 'The loaves are good. He really is learning.' } },
    // 6.3 behind the bakery
    tiffin: { pencil: { my: 'အေးအေးဆေးဆေး စားနေတာ', en: 'enjoying a quiet lunch' }, gold: { my: 'ထမင်းချိုင့် သုံးဆင့်။ တစ်ဆင့်ပဲ ဖွင့်ထားတယ်။ မစားဘဲ ကိုင်ထားတာ။', en: "Three tiers, one open. He's holding it, not eating." } },
    west: { pencil: { my: 'လမ်းကို ငေးနေတာ', en: 'daydreaming' }, gold: { my: 'အနောက်ဘက် တိမ်ချောင်းဘက်ကို လှည့်ထိုင်တယ်။ ရွာက အဲဒီဘက်မှာ။', en: 'He sits facing west, toward the cloud-stream. Home is that way.' } },
    hum: { pencil: { my: 'ပျော်လို့ ညည်းနေတာ', en: "humming because he's happy" }, gold: { my: 'ရွာက သီချင်းတစ်ပိုဒ်ကိုပဲ ထပ်ခါထပ်ခါ ညည်းနေတယ်။', en: 'One line of a village tune, over and over.' } },
  },
  watched: [{ my: 'အပူက ဒေါ်ဒေါ့်ဆီက အရင်စတယ်။ ပြီးမှ အာကာ့ဆီ ကူးသွားတယ်။ ဒါပေမဲ့ မုန့်ကတော့ ကောင်းတယ်။', en: 'The heat starts in her. Then it passes to him. And the bread is still good.' }],
  kmSits: [{ my: '(ဒေါ်ခင်မေ လက်သုတ်ပြီး ဂျုံပုံးပေါ် ထိုင်လိုက်တယ်။ မာရာက "Writer" ခွက်လေး ချလိုက်တယ်။)', en: '(Daw Khin May wipes her hands and sits on the flour bin. Maya sets down the Writer mug.)' }],
  kmNotYet: [{ my: 'ကဲ… ဗန်းတွေ စောင့်နေတယ်။', en: 'Well… the trays are waiting.' }],
  // 5.4 sort
  kmTry: [{ my: 'အာကာ့ကို ဘာပြောမလဲ ရွတ်ကြည့်မယ်။ ဆင်ခြေ ဖြစ်နေတာကို ပြပေး။', en: "Let me try out what I'll say to Arkar. Show me which ones are excuses." }],
  sortTitle: { my: 'ဒေါ်ခင်မေရဲ့ စကားတွေ', en: "Daw Khin May's sentences" },
  sortHint: { my: 'စကားလုံး မကြည့်နဲ့။ စာကြောင်းက ဘာလုပ်နေလဲ ကြည့်။', en: "Don't look at the words. Look at what each sentence does." },
  sortBaskets: [
    { id: 'names', my: 'အမှားကို နာမည်တပ်တယ်', en: 'Names the fault' },
    { id: 'leans', my: 'ကောင်းတာကို အကာအကွယ်ယူတယ်', en: 'Leans on a good' },
  ],
  sortSlips: [
    { id: 'a', basket: 'names', my: 'ဒီမနက် ငါ အော်တာ မှားတယ်။', en: 'Shouting this morning was wrong of me.' },
    { id: 'b', basket: 'leans', my: 'အော်မိတာတော့ ဟုတ်တယ်… မင်း ကောင်းဖို့ပါ။', en: 'Yes, I shouted… it was for your own good.' },
    { id: 'c', basket: 'leans', my: 'နှုတ်ကြမ်းပေမဲ့ စိတ်ရင်းကောင်းပါတယ်ကွယ်။', en: 'Rough mouth, good heart, dear.' },
    { id: 'd', basket: 'names', my: 'ငါ့အပူကို မင်းဆီ ပို့လိုက်မိတယ်။', en: 'I passed my heat on to you.' },
    { id: 'e', basket: 'leans', my: 'ဘာပဲပြောပြော မင်း တတ်လာတာပဲ။', en: "Whatever I said, you learned, didn't you?" },
    { id: 'f', basket: 'names', my: 'ဒါပေမဲ့ အမှန်တကယ်က အော်စရာ မလိုခဲ့ဘူး။', en: 'But truly, there was no need to shout.' }, // begins with ဒါပေမဲ့, still names it
  ],
  sortWrong: { who: 'khinmay', my: 'ဟင့်အင်း… ဒီစာကြောင်းက ကောင်းတာနဲ့ ကာထားတာ။', en: 'No… that one hides behind something good.' },
  sortWrongNames: { who: 'khinmay', my: 'ဟင့်အင်း… ဒါက ဆင်ခြေ မဟုတ်ဘူး။ အမှားကို နာမည်တပ်နေတာ။', en: "No… that one isn't an excuse. It names the fault." }, // the reverse
  kmFaceDown: [{ my: '(ဒေါ်ခင်မေ ကာထားတဲ့ စာရွက်တွေကို ကိုယ်တိုင် ဂျုံပုံးပေါ် မှောက်ထားလိုက်တယ်။ ပြီးမှ အာကာ့ကို ခေါ်တယ်။)', en: '(Daw Khin May turns the leaning slips face down on the flour bin herself, then calls Arkar over.)' }],
  kmSays: [
    { my: 'အာကာ… ဒီမနက် ငါ အော်တာ မှားတယ်။ ငါ့အပူကို မင်းဆီ ပို့လိုက်မိတယ်။', en: 'Arkar… shouting this morning was wrong of me. I passed my heat on to you.' },
    { my: 'ဒါပေမဲ့ အမှန်တကယ်က အော်စရာ မလိုခဲ့ဘူး။ နောက်ဗန်းကစပြီး မအော်ဘဲ ပြမယ်။', en: "But truly, there was no need to shout. From the next tray I'll show you without it." },
  ],
  arkarHears: [{ my: '…ဟုတ်ကဲ့ ဒေါ်ဒေါ်။ (ပြုံးတယ်။ ဒီတစ်ခါ မျက်လုံးပါ ပြုံးတယ်။)', en: '…Yes, Aunty. (He smiles. This time his eyes do too.)' }],
  // 5.5 holdback
  hbTitle: { my: 'နောက်ဗန်း', en: 'The next tray' },
  hbHint: { my: 'နောက်ဆုတ်ပေးကို ဖိထား။ သင်တာ သူ့ဟာ။', en: 'Hold Step back. The teaching is hers.' },
  hbBeats: [
    { cue: { my: '(အာကာ ဗန်းကို စောင်းကိုင်လိုက်တယ်။ ဒေါ်ခင်မေ့ ခွက်က ငွေ့ တက်လာတယ်…)', en: "(Arkar lifts the tray crooked. Daw Khin May's cup starts to steam…)" }, steamTo: 2, ms: 2600,
      then: { my: '…ဖြည်းဖြည်း။ ဗန်းကို နှစ်ဖက်ညီအောင် ကိုင်။', en: '…Slowly. Hold the tray level on both sides.' } },
    { cue: { my: '(လက်ဗလာနဲ့ မီးဖိုတံခါးကို လှမ်းလိုက်တယ်။ ခွက်က ပိုပူလာတယ်…)', en: '(He reaches for the oven door bare-handed. The cup steams harder…)' }, steamTo: 3, ms: 3000,
      then: { my: 'လက်အိတ်။ ဟိုမှာ ချိတ်ထားတယ်။', en: 'The mitt. On the hook, there.' } },
    { cue: { my: '(မုန့်တစ်လုံး အပေါ်က ကွဲသွားတယ်။)', en: '(One loaf splits on top.)' }, steamTo: 2, ms: 2600,
      then: { my: 'ကွဲတာ ဘာကြောင့်လို့ မင်း ထင်လဲ။', en: 'Why do you think it split?' } },
  ],
  hbEarly: { maya: { my: 'ကျွန်မ ပြောပြမယ်…', en: 'Let me tell him…' }, they: { my: 'ဒါဆို မင်းပဲ သင်လိုက်တော့လေ။', en: 'Then you teach him.' } },
  hbEnd: { my: 'အပေါ်က ဓားနဲ့ မခြစ်ခဲ့လို့… နောက်ဗန်းကျ ခြစ်မယ်။', en: "I didn't score the top… next tray I will." },
  // 5.6 the two trays
  kmTrays: [{ my: 'စင်ပေါ်က ဗန်းနှစ်ဗန်း ကြည့်ပါဦး။', en: 'Have a look at the two trays on the rack.' }], // new: said, not pointed
  trayLooks: [
    { pencil: { my: 'အော်ပြီး ဖုတ်တဲ့ဗန်း', en: 'the shouted tray' }, gold: { my: 'ရွှေဝါရောင်၊ အပေါ်က ခြစ်ရာ ညီညီ။', en: 'Golden, the tops scored evenly.' } },
    { pencil: { my: 'အော်သံ မပါတဲ့ဗန်း', en: 'the quiet tray' }, gold: { my: 'ရွှေဝါရောင်၊ အပေါ်က ခြစ်ရာ ညီညီ။ အတူတူပဲ။', en: 'Golden, the tops scored evenly. The same.' } },
  ],
  trays: [{ my: 'တူတူပဲ။ အော်သံ မပါလည်း မုန့်က အတူတူပဲ။', en: 'The same. Without the shout, the same loaves.' }],
  kmEnd: [
    { my: 'တစ်ဗန်းလုံး မအော်ဘဲ ပြီးသွားတာ ဘယ်တုန်းကလဲ မမှတ်မိဘူး။ ရင်ထဲလည်း ပေါ့သွားတယ်။', en: "I can't remember the last time a whole tray went by without shouting. My chest feels lighter too." },
    { my: 'အပူ ပြန်လာဦးမှာပဲ။ လာရင် ကိုယ့်ဘာသာ သိမယ်၊ ကိုယ့်ဘာသာ ပြင်မယ်။ ဒါ ကျွန်မ တာဝန်။', en: "The heat will come back. When it does, I'll catch it myself and put it right myself. That's my job." },
    { my: 'ရော့… မှာစာအုပ်က ခဲဖျက်။ မှားရေးမိရင် ကိုယ့်လက်နဲ့ ဖျက်ပြီး "မှားသွားတယ်" လို့ ပြော။ ဆင်ခြေ မပါနဲ့။', en: 'Here… the eraser off my order book. When you write something wrong, rub it out with your own hand and say "I got that wrong." No excuses.' },
  ],
  kmAfter: [{ my: 'တိုးတိုးဆိုတဲ့ ကလေးရဲ့ မေးခွန်း ကြားတယ်။ ပေါင်မုန့် ဘာလို့ ဖောင်းလဲတဲ့။ ညနေတန်းမှာ ကျွန်မ ပြမယ်… အော်သံ မပါဘဲ။', en: "I heard that Toe Toe child's question, why bread rises. I'll show the evening class… without the shouting." }],
  kmAfter2: [{ my: 'အပူ တက်လာရင် ကိုယ့်ရင်ဘတ်ကို ကိုယ်ပဲ အရင် ကြည့်တယ်။', en: 'When the heat rises, I look at my own chest first.' }],

  // ---- 6. chapter 15 · Maung Arkar and Ei Mon
  ml1: [{ my: 'ရပါတယ်! ရပါတယ်! ဘာမှ မဖြစ်ဘူး! ဟဲဟဲ။', en: "It's fine! Fine! Nothing happened! Heh." }],
  rowHelp: [
    { who: 'sawyu', my: 'ကဲ ကောက်ကြ ကောက်ကြ။ ဖုန်မကပ်ခင်။', en: 'Come on, pick them up before the dust gets them.' },
    { who: 'micho', my: 'ကျွန်မ ခြင်းထဲ ထည့်ထားမယ်။ အိုးတွေ ပို့ပြီးသွားပြီ။', en: "I'll put them in my basket. My pots are delivered." },
    { who: 'toetoe', my: 'လှည်းက ဘာလို့ မှောက်တာလဲ။ အပေါ်က လေးနေလို့လား။', en: 'Why did the cart tip? Was the top too heavy?' },
    { who: 'lampman', my: 'ဘီးက မီးလောင်ကွင်းထဲ ကျသွားတာ။ ဘီးတံ ငါ ကြည့်ပေးမယ်။', en: "The wheel dropped in the scorch ring. I'll check the axle." },
  ],
  loafCarry: { my: 'မုန့်လုံးကို လှည်းဆီ ယူသွားမယ်။', en: "I'll take this loaf to the cart." },
  handsFull: { my: 'လက်ထဲမှာ တစ်လုံး ကိုင်ထားတုန်း။', en: "I'm already holding one." },
  ml2: [{ my: 'ကျေးဇူးပဲ ကျေးဇူးပဲ! ဒေါ်ဒေါ် မသိပါစေနဲ့နော်… ဟဲဟဲ။', en: "Thanks, thanks! Don't let Aunty know… heh." }],
  mayaRow: [{ my: '(လမ်းတစ်လမ်းလုံး ကူကြတယ်။ ဘာလုပ်ရမလဲ ကျွန်မကို ဘယ်သူမှ မမေးကြဘူး။)', en: '(The whole street helped. Nobody asked me what to do.)' }],
  em1: [
    { my: 'သူ ရယ်နေတယ်… ဒါပေမဲ့ မျက်လုံးက မရယ်ဘူး။', en: "He was laughing… but his eyes weren't." },
    { my: 'ညနေတန်းက နောက်ကျတဲ့ ညတစ်ညက ဆိုင်တွေ ပိတ်ကုန်ပြီ။ သူ မုန့်တစ်လုံး ချန်ထားပေးခဲ့တယ်။ ဘာမှ မပြောဘဲ။', en: "One night I was late from class and every shop was shut. He'd kept me a loaf. Didn't say a word." },
    { my: 'ကျွန်မဆိုင်မှာ တစ်ခါမှ ထမင်းမစားဘူး။ မုန့်တိုက်ရဲ့ နောက်ဖေး ဂျုံအိတ်တွေကြားမှာ တစ်ယောက်တည်း စားတယ် ထင်တယ်။', en: 'He never eats in our shop. Out behind the bakery, among the flour sacks, by himself, I think.' },
  ],
  emWait: [{ my: 'မုန့်တိုက်ရဲ့ အနောက်ဘက်နံရံဘေးက လမ်းကြားလေး… ဂျုံအိတ်တွေ ပုံထားတဲ့နေရာ။', en: 'The little lane on the bakery\'s west wall… where the flour sacks are piled.' }], // new: until d9.alone
  aloneMaya: [{ my: '(ဘယ်သူမှ မမြင်တဲ့ ဒုက္ခ။ ဒါပေမဲ့ ဒါ ကျွန်မ ဝင်ထိုင်ရမယ့်နေရာ မဟုတ်ဘူး။ အိမွန်က အရင် မြင်ခဲ့တာ။)', en: "(Trouble nobody can see. But this isn't my place to sit. Ei Mon saw it first.)" }],
  em2: [{ my: 'သွားထိုင်ချင်တယ်… ဒါပေမဲ့ ဘာပြောရမှန်း မသိဘူး။ ကျွန်မက စကား သိပ်မပြောတတ်ဘူး။', en: "I want to go and sit with him… but I don't know what to say. I'm not much of a talker." }],
  emChoices: [
    { my: '"ကျွန်မ သွားပြောလိုက်မယ်။"', en: '"I\'ll go and talk to him."' },
    { my: '"စိတ်မညစ်နဲ့လို့ ပြောလိုက်ပါ။"', en: '"Tell him to cheer up."' },
    { my: '"အဲဒီည မုန့်ချန်ပေးတုန်းက သူ ဘာတွေ ပြောခဲ့လဲ။"', en: '"That night he kept you a loaf: what did he say?"' },
  ],
  emMaya0: [{ my: '(အကျင့်ဟောင်း။ သူ မုန့်ချန်ပေးခဲ့တာ ကျွန်မကို မဟုတ်ဘူး။ ဒါ အိမွန့်လမ်း။)', en: "(Old habit. It wasn't me he kept a loaf for. This is Ei Mon's road.)" }],
  emCheer: [{ my: 'အဲဒါ ပြောရင် သူ ပြုံးပြပြီး ပြီးသွားမှာ။', en: "Then he'll just smile, and that'll be that." }],
  emAsk: [
    { my: '…ဘာမှ မပြောဘူး။ ချန်ထားပေးရုံပဲ။', en: '…Nothing. He just kept it for me.' },
    { my: 'ဒါဆို ကျွန်မလည်း စကားတွေ မလိုဘူးပေါ့။ သွားထိုင်၊ မေး၊ နားထောင်ရုံပဲ။', en: "Then I don't need words either. Just go and sit, ask, and listen." },
  ],
  mayaTea: [{ my: '(လက်ဖက်ရည်အိုးကို အိမွန့်လက်ထဲ ထည့်ပေးလိုက်တယ်။ စကားတော့ ထည့်မပေးဘူး။)', en: "(Maya puts the pot of tea in Ei Mon's hands. No words to go with it.)" }],
  emTea: [
    { my: 'လက်ဖက်ရည်အိုး… ဒါဆို ထိုင်စရာ အကြောင်း ရှိသွားပြီ။', en: 'A pot of tea… then I have a reason to sit down.' },
    { my: 'အစ်မ နားနားမှာ နေပေးနော်။ ပြောတာက ကျွန်မ ပြောမယ်။', en: "Stay close, sister? I'll do the talking." },
  ],
  teaGiven: { my: 'အိမွန့်လက်ထဲ', en: "In Ei Mon's hands" },
  emNotYet: [{ my: 'ခဏနေမှ ပြန်လာထိုင်မယ်။ လက်ဖက်ရည် နွေးနေသေးတယ်။', en: "I'll come and sit again in a while. The tea's still warm." }],
  emSettle: [{ my: '(အိမွန် ဂျုံအိတ်ပေါ်မှာ ခွက်နှစ်ခွက် ချလိုက်တယ်။ မာရာက လမ်းကြားထိပ်မှာပဲ နေတယ်။)', en: '(Ei Mon sets two cups on the flour sacks. Maya stays at the mouth of the lane.)' }], // new
  sqLoad: [{ my: '(လှည်းကို ပြန်တင်ကြတယ်။ အကျင့်ပါနေလို့ မောင်အာကာ လေးတဲ့ဗန်းကို အပေါ်ဆုံး ပြန်တင်လိုက်တယ်။)', en: '(They load the cart again. Out of habit Maung Arkar puts a heavy tray on top.)' }], // new
  sqDone: [{ my: '(သူ ပြန်တင်တယ်။ အိမွန် တစ်ချက် ခေါင်းညိတ်တယ်။ ကြိုးနဲ့ ချည်လိုက်တယ်။)', en: '(He loads it. She nods once. He ties it down with twine.)' }],
  emTwine: [{ my: 'ကြိုး ကျန်သေးတယ်။ အစ်မ ယူထား။ ခုနက ကျွန်မတို့လိုပဲ… ပြဲသွားလည်း ပြန်ချည်လို့ ရတယ်။ ဦးလေးက လမ်းအလယ်က လမ်းကြားလေးထဲမှာ စက္ကူခေါက်ရိုး ပြဲနေတယ်တဲ့။', en: "There's twine left. Keep it, sister. Like us just now… what tears can be tied back. Uncle says the paper's split along the fold, up the little lane in the middle of the Row." }], // WORLD
  mlUmbrella: [
    { my: 'အစ်မ… ဒီထီး ရွာက ယူလာတာ။ ဒီမှာ မိုးမရွာဖူးသေးဘူး။ အစ်မ ယူထား။', en: "Sister… I brought this umbrella from home. It hasn't rained here yet. You keep it." },
    { my: 'မိုးဆိုတာ ဖိတ်မှ လာတာ မဟုတ်ဘူးလေ။ သူငယ်ချင်းလည်း ခေါ်မှ လာစရာ မလိုဘူး။', en: "Rain doesn't wait to be invited. A friend shouldn't wait to be called either." },
  ],
  teapotBack: [{ my: '(အိမွန် လက်ဖက်ရည်အိုးကို ပြည့်အောင် ပြန်ဖြည့်ပြီး ပြန်ပေးတယ်။)', en: '(Ei Mon fills the pot of tea again and hands it back.)' }], // new
  teapotRefilled: { my: 'ပြန်ဖြည့်ပြီး ပြန်ရောက်လာတယ်', en: 'Back, refilled' },
  mayaFriend: [{ my: '(ကျွန်မ တစ်ခွန်းမှ မဖြေပေးခဲ့ဘူး။ အိမွန်က မေးတယ်၊ နားထောင်တယ်၊ ပြီးမှ ပြတယ်။)', en: "(I didn't answer one thing. Ei Mon asked, listened, and only then showed him.)" }],

  // ---- 7. ambient (they hint, never point)
  arkarBefore: [
    [{ my: 'ရွာကနေ ကိုယ့်ဘာသာ ရွေးလာတာ။ ဆယ့်ရှစ်နှစ်ပြီ။ မုန့်ဖုတ်ချင်လို့။ …ကိုယ်ရွေးတဲ့လမ်းမှာလည်း လေးတဲ့နေ့တွေ ရှိတာပဲ။', en: "I came from my village by my own choice. I'm eighteen. I want to bake. …Even a road you chose has its heavy days." }],
    [{ my: 'ဟဲဟဲ၊ အဆင်ပြေပါတယ်!', en: 'Heh, all good!' }],
  ],
  arkarAfter: [{ my: 'လေးတာ အောက်ဆုံး။ ပြုံးပြနေစရာ မလိုတော့ဘူး။', en: 'Heavy at the bottom. No need to put on a smile.' }],
  emBefore: [{ my: '…ခေါက်ဆွဲ စားမလား။', en: '…Noodles?' }],
  emAfter: [{ my: 'မေးပြီးရင် နားထောင်။ အကြံက နောက်မှ။ ဒီနေ့ ကိုယ်တိုင် သိသွားတာ။', en: 'Ask, then listen. Advice comes after. I found that out myself today.' }],
  na: [
    { my: 'အိမွန်လား။ စကားနည်းတယ်။ ဒါပေမဲ့ သူ မြင်တာ များတယ်။', en: "Ei Mon? Doesn't say much. But she sees a lot." },
    { my: 'မုန့်ဖုတ်သည်ရဲ့ အော်သံ? ကြားနေကျပါ။ မုန့်ကတော့ ကောင်းတယ်၊ ဝယ်စားကြည့်။', en: "The baker's shouting? We're used to it. Her bread is good, though. Try some." },
    { my: 'ညနေတန်းက ကလေးတွေအတွက်ပဲတဲ့။ ကျွန်မတော့ မရောက်ဖူးဘူး။', en: 'They say the evening class is just for children. Never been myself.' }, // rumour `childclass` (false)
  ],
  naIn: [{ my: 'အိမွန်လား။ အထဲမှာ စားပွဲ သုတ်နေတယ်။ လှည်းမှောက်ကတည်းက တစ်ခွန်းမှ မပြောဘူး။ စဉ်းစားနေတာ။', en: "Ei Mon? Inside, wiping tables. Hasn't said a word since the cart tipped. She's thinking." }],
  lm: [
    { my: 'မုန့်ဖိုက ညဘက်ပဲ မီးမွှေးတာတဲ့။ ငါ မျက်စိမှုန်ပြီ၊ ကိုယ်တိုင် ကြည့်ပေါ့။', en: "They say the ovens only burn at night. My eyes are going; look for yourself." }, // `nightbake` (false)
    { my: 'လမ်းအဆုံးမှာ ဒိုင်ယာရီ ချိတ်ကြီး ပိတ်ထားတယ်။ မနက်ဖြန်လောက်မှ ပွင့်မယ် ထင်တယ်။', en: "There's a great diary clasp shut across the end of the Row. Opens tomorrow or so, I'd guess." }, // `gardenshut` (true)
    { my: 'ငါ့ခုံဘေးက လမ်းကြားလေးထဲမှာ စက္ကူ ပြဲနေတယ်။ ဟိုဘက်မှာ ဥယျာဉ်ရဲ့ ခြံစည်းရိုးတွေ မြင်ရတယ်။', en: "Up the little lane by my bench the paper's split. You can see the Garden's hedges across it." }, // `crease` (true) WORLD
    { my: 'ပေါက်နေတဲ့ မီးအိမ်ကို လွှင့်မပစ်ဘူး။ ကိုယ့်လက်နဲ့ ဖာလိုက်ရင် ပြန်လင်းတာပဲ။', en: "I don't throw out a torn lamp. Patch it with your own hands and it shines again." },
  ],
  lmNayChi: [{ my: 'ပုံနှိပ်တိုက်ဘက်က ကောင်မလေး တစ်ယောက် ညနေတန်းထဲ ဝင်သွားတယ်။ တစ်ယောက်ယောက်ကို စောင့်နေပုံပဲ။', en: 'A girl from the printing-shed side went into the evening class. Waiting for someone, by the look of it.' }],
  lmName: { my: 'မီးအိမ်ပြင်တဲ့ အဘိုး', en: 'the lamp-mender' },
  ncAfter: [{ my: 'အိမွန်က မောင်အာကာ့ကို အဖြေ မပေးဘူး။ မေးပြီး နားထောင်တာ။ …အစ်မလိုပဲ။ မကြိုက်ဘူးနော်။', en: "Ei Mon didn't give him answers. She asked and listened. …Like you. I don't like it, you know." }],
  ncBefore: [{ my: 'နောက်ကျပြီ… ပုံနှိပ်တိုက်ဘက် ပြန်သွားဦးမယ်။', en: "It's late… I'm heading back toward the press." }],
  micho: [{ my: 'အိုးတွေ အရိပ်မှာ ဖြည်းဖြည်း ခြောက်အောင် ထားသလိုပဲ… ဗန်းတွေကိုလည်း အောက်က အရင်။', en: 'Like drying pots slowly in the shade… trays go bottom first.' }],
  toetoe: [{ my: 'လှည်းက ဘာလို့ မှောက်တာလဲ စဉ်းစားနေတယ်။ အပေါ်က လေးနေလို့ ထင်တယ်။', en: "I'm still thinking about why the cart tipped. Top-heavy, I bet." }], // new: before ch 14 is done
  toetoeAfter: [{ my: 'ပေါင်မုန့် ဘာလို့ ဖောင်းလဲ ဒေါ်ခင်မေ ပြမယ်တဲ့! ညနေတန်း လာခဲ့ဦးမယ်။', en: "Daw Khin May's going to show why bread rises! I'll come to the evening class." }],

  // ---- 7. rumours and places checked
  proofs: {
    keepto: { my: 'မီးဖိုတန်းက လူတွေ လှည်းကို ဝိုင်းကူကြတယ်။ ကိုယ့်ဟာကိုယ် မနေကြဘူး။', en: "The Row all helped with the cart. They don't keep to themselves." },
    nightbake: { my: 'မုန့်ဖို နေ့ခင်းမှာလည်း မီးမွှေးတယ်။ ခေါင်းတိုင် နှစ်ခုလုံး မီးခိုးတက်နေတယ်။', en: 'The ovens burn by day too. Both chimneys are smoking.' },
    childclass: { my: 'ညနေတန်းမှာ လူကြီးခုံတွေ ရှိတယ်။ ကလေးတွေချည်း မဟုတ်ဘူး။', en: "The evening class has grown-ups' benches. Not only children." },
    crease: { my: 'လမ်းကြားလေးထဲမှာ စက္ကူခေါက်ရိုး တကယ် ပြဲနေတယ်။', en: 'The paper really is split along the fold, up the little lane.' }, // WORLD
    gardenshut: { my: 'လမ်းအဆုံးက ဒိုင်ယာရီ ချိတ်ကြီး ပိတ်ထားတယ်။ ဒီနေ့တော့ ဝင်လို့ မရဘူး။', en: 'The great diary clasp at the end of the Row is shut. No way in today.' },
  },
  chimneys: [{ my: 'ခေါင်းတိုင် နှစ်ခုလုံး မီးခိုး တက်နေတယ်။ နေ့ခင်းကြီးမှာ။', en: 'Both chimneys are smoking. In broad daylight.' }],
  ovenLit: [{ my: 'မီးဖိုထဲမှာ မီးတောက်နေတယ်။ နေ့လယ်ကြီးမှာ။', en: 'The fire is going in the oven. At midday.' }],
  benchSeen: [{ my: 'လူကြီးထိုင်တဲ့ ခုံရှည်တွေ။ ကလေးခုံက နှစ်ခုပဲ။', en: "Long benches for grown-ups. Only two small ones." }],
  creaseSeen: [{ my: 'စက္ကူက ခေါက်ရိုးအတိုင်း တကယ် ပြဲနေတယ်။ ကြိုးတစ်ချောင်း ရှိရင် ချုပ်လို့ ရမလား။', en: 'The paper really is split along the fold. With some twine, could it be laced?' }],
  creaseTitle: { my: 'ခေါက်ရိုးကို ကြိုးနဲ့ ချုပ်မယ်', en: 'Lace the split with twine' },
  creaseHint: { my: 'ကြိုးကို ဖြည်းဖြည်း၊ တစ်ကွင်းချင်း', en: 'Slowly, one loop at a time' },
  creaseDone: [{ my: 'ပြဲသွားတာကို ပြန်ချုပ်လို့ ရတယ်။ ဦးကျော်ညွန့်ရဲ့ ချုပ်ရိုးလို ဖြည်းဖြည်း၊ တစ်ကွင်းချင်း။', en: "What's torn can be laced back. Like U Kyaw Nyunt's stitches: slowly, one loop at a time." }],
  creaseAgain: [{ my: 'ကြိုး လျော့သွားပြီ။ နောက်တစ်ကွင်း။', en: 'The twine slipped. One more loop.' }], // new
  claspSeen: [{ my: 'ဒိုင်ယာရီ ချိတ်ကြီး ပိတ်ထားတယ်။ ဒီနေ့တော့ ဝင်လို့ မရဘူး။', en: 'The great diary clasp is shut. No way in today.' }],
  shelfLoad: [{ my: '(လေးတဲ့ ခေါက်ဆွဲဗန်း အောက်ဆုံး၊ ပန်းကန်တွေ အလယ်၊ ဟင်းရွက် အပေါ်ဆုံး။ ကြိုးတစ်ချောင်း ဖြတ်ချည်ထားတယ်။)', en: '(Heavy noodle tray at the bottom, bowls in the middle, herbs on top. One rope across.)' }],
  board9: [{ my: '"ပေါင်မုန့် ဘာလို့ ဖောင်းလဲ" — မနက်ဖြန်ည ဒေါ်ခင်မေ ပြမယ်', en: '"Why does bread rise?" — Daw Khin May shows us tomorrow night' }],
  bakery: {
    mitt: [{ my: 'မီးဖိုဘေးမှာ လက်အိတ်တစ်ဖက် ချိတ်ထားတယ်။', en: 'An oven mitt hangs on a hook by the oven.' }],
    ovenBell: [{ my: 'ဗန်းခေါင်းလောင်း။ ဗန်း နောက်ကျရင် မြည်တယ်။', en: 'The tray bell. It rings when a tray is late.' }],
    workTable: [{ my: 'မုန့်စိမ်း၊ ပန်းကန်၊ အပေါ်ခြစ်တဲ့ ဓားလေး။', en: 'Dough, a bowl, and a little knife for scoring the tops.' }],
    flourBin: [{ my: 'ဂျုံပုံး။ အဖုံးက ထိုင်လို့ရတယ်။', en: 'The flour bin. Its lid is a seat.' }],
    orderBook: [{ my: 'ခဲတံနဲ့ ရေးထားတဲ့ မှာစာအုပ်။ ခဲဖျက်လေး ကြိုးနဲ့ ချိတ်ထားတယ်။', en: 'A pencil order book, its eraser on a string.' }],
    orderBookAfter: [{ my: 'ကြိုးလေး အလွတ် ဆွဲထားတယ်။ ခဲဖျက်က ကျွန်မအိတ်ထဲမှာ။', en: 'The string hangs empty. The eraser is in my bag.' }],
    breadShelf: [{ my: 'တံခါးဘေးက မုန့်စင်။ ပူပူနွေးနွေး။', en: 'The bread shelf by the door. Still warm.' }],
    backDoor: [{ my: 'နောက်ဖေးတံခါး ပိတ်ထားတယ်။', en: 'The back door is shut.' }],
    rackA: [{ my: 'အာကာ့ ဗန်းတွေ။', en: "Arkar's trays." }],
  },
  classSill: [{ my: 'ပြတင်းပေါက်ခုံပေါ်မှာ သံပြားအိုးလေး။', en: 'A little tin pot on the windowsill.' }],
  classCal: [{ my: 'နံရံပြက္ခဒိန်။', en: 'A wall calendar.' }],

  // ---- 8.1 the "ask Maya" board (on the Post Office's outside wall)
  note9From: { my: 'ပုံနှိပ်တိုက်နားက ကျောင်းသူ', en: 'a student near the printing shed' },
  note9: { my: 'မာရာက "မယုံနဲ့ဦး" တဲ့။ ဒါဆို ဘာကို ယုံရမလဲ။ ပြောပေးပါ။', en: 'Maya says "don\'t believe it yet." Then what do I believe? Tell me.' },
  replies9: [
    { my: 'ကျွန်မ ပြောတာကို ယုံပါ။', en: 'Believe what I tell you.' },
    { my: 'ဘာမှ မယုံပါနဲ့။', en: 'Believe nothing.' },
    { my: 'ဒီနေ့ ကိုယ်တိုင် သွားကြည့်ခဲ့တာ ဘာရှိလဲ။', en: 'What did you go and look at yourself today?' }, // true
  ],
  replyWrong: [
    [{ my: '(ဒါ ကျွန်မ သူ့အစား ပြန်ဖြေနေတာပဲ။ မေးခွန်းနဲ့ ပြန်ဖြေမယ်။)', en: "(That's me answering for her again. I'll answer with a question.)" }],
    [{ my: '(ဒါ မေးခွန်းကို ပိတ်ပစ်လိုက်တာ။)', en: '(That just shuts the question down.)' }],
  ],
  boardDone: [{ my: '(ကျွန်မ မေးခွန်းလေး ချိတ်ခဲ့ပြီ။ တခြား စာရွက် သုံးရွက်မှာလည်း ခဲတံနဲ့ «?» လေးတွေ ပေါ်လာတယ်။)', en: '(My question is pinned up. Three other notes have little pencilled «?» marks now too.)' }],
  boardAgain: [{ my: '(ကျွန်မ မေးခွန်းလေး ချိတ်ထားပြီးပြီ။)', en: '(My question is already pinned up.)' }],

  // ---- 8.2 Nay Chi (the empty evening class)
  nc1: [
    { my: 'အစ်မ… မနေ့က အစ်မ ပြောမှာကို တစ်နေကုန် စောင့်နေခဲ့တာ။ အလုပ်ခေါ်တဲ့ အချိန် လွတ်သွားတယ်။', en: 'Sister… yesterday I waited all day for you to tell me. I missed the call for work.' },
    { my: 'ဒီနေ့တော့ ပြောပေး။ ပုံနှိပ်တိုက်ကို ပြန်တောင်းရမလား၊ ဒီမုန့်တိုက်မှာ အကူ လိုလား မေးရမလား။', en: 'So today, just tell me. Ask the press again, or ask whether the bakery needs help?' },
  ],
  ncChoices: [
    { my: '"ပုံနှိပ်တိုက်ကို ပြန်သွား။"', en: '"Go back to the press."' },
    { my: '"မုန့်တိုက်က ပိုကောင်းတယ်။"', en: '"The bakery\'s better."' },
    { my: '"နှစ်နေရာလုံး ကိုယ်တိုင် ကြည့်ပြီးပြီလား။ ဘယ်နေရာမှာ နင့်လက် အလုပ်ဖြစ်မလဲ။"', en: '"Have you looked at both places yourself? Where would your hands be busy?"' },
  ],
  ncTold: [{ my: '(ပြောလိုက်ရင် သူ ဒီနေ့လည်း ကျွန်မစကားကိုပဲ ကိုင်ပြီး လျှောက်မှာ။)', en: "(If I tell her, she'll walk on my words again today.)" }],
  ncAsked: [
    { my: '…အစ်မက အခု မေးခွန်းပဲ ပြန်မေးတော့တာပဲ။', en: '…All you do now is ask me back.' },
    { my: 'ကောင်းပြီ။ ကိုယ်တိုင် သွားကြည့်မယ်။ …မကြိုက်ဘူးနော်။', en: "Fine. I'll go and look myself. …I don't like it, you know." },
  ],
  mayaAsked: [{ my: '(အဖြေပေးရတာ ပိုလွယ်တယ်။ ကျွန်မ ပိုကြိုက်တယ်ဆိုတာလည်း ဝန်ခံရမယ်။ လမ်းကတော့ သူ့ခြေထောက်အောက်မှာ။)', en: "(Giving answers is easier. I'll admit I like it more. But the road is under her own feet.)" }],

  // ---- 8.4 the two desks
  deskQ: { my: 'ဒီနေရာအကြောင်း ကိုယ်တိုင် မြင်ရတာကို ရေးမယ်။', en: 'Write what you can see here yourself.' },
  deskWest: [
    { my: 'မုန့်တိုက်ရဲ့ ခေါင်းတိုင် နှစ်ခုလုံးက မီးခိုး တက်နေတယ်။', en: "Smoke is rising from both of the bakery's chimneys." }, // true
    { my: 'ဒီက မုန့်ဖိုတွေ ညဘက်မှပဲ မီးမွှေးတာ။', en: 'The ovens here only burn at night.' },
    { my: 'ဒီလမ်းမှာ ဘယ်သူမှ ဘယ်သူ့ကိုမှ မကူဘူး။', en: 'Nobody on this street helps anybody.' },
  ],
  deskClass: [
    { my: 'ညနေတန်း ကျောက်သင်ပုန်းပေါ်မှာ မေးခွန်း တစ်ခု ရေးထားတယ်။', en: 'A question is chalked on the evening-class blackboard.' }, // true
    { my: 'ညနေတန်းက ကလေးတွေအတွက်ပဲ။', en: 'The evening class is just for children.' },
    { my: 'စာတိုနံရံပေါ်မှာ ရန်ဖြစ်စာတွေ အပြည့်ပဲ။', en: 'The Note Wall is covered in quarrel notes.' },
  ],
  deskWrong: [{ my: '(ဒါ ကြားခဲ့တာ။ မျက်လုံးနဲ့ ပြန်ကြည့်ပါဦး။)', en: "(That's what I heard. Look again.)" }],
  noteWallNotes: [
    { my: 'ပေါင်မုန့် ချက်နည်း — ဂျုံ၊ ရေ၊ တဆေး၊ ဆား၊ စောင့်ချိန်', en: 'Bread: flour, water, yeast, salt, and time' },
    { my: 'ကြောင်ဖြူလေး ပျောက်နေတယ် — တွေ့ရင် ခေါက်ဆွဲဆိုင်ကို ပြောပါ', en: 'Lost: a little white cat. Tell the noodle shop' },
  ],

  // ---- 8.6 the reply letter, 9. the night page
  replyLine: { my: 'လမ်းမေးလာရင် မေးခွန်းနဲ့ ပြန်ဖြေမယ်။ လမ်းက မေးတဲ့သူရဲ့ ခြေထောက်အောက်မှာ။', en: "When they ask me the way, I'll answer with a question. The road is under the asker's own feet." },
  replyTitle: { my: 'ပြန်စာ နောက်ကျောစာမျက်နှာ · ခဲတံ', en: 'The reply, back page · pencil' },
  nightQ: { my: 'ဒီနေ့အကြောင်း မှန်မှန်ကန်ကန် ဘယ်လို ရေးမလဲ။', en: 'How will she write today, truthfully?' },
  nightChoices: [
    { my: 'ဒေါ်ခင်မေကို ကျွန်မ ပြင်ပေးလိုက်တယ်။ မောင်အာကာ့ကိုလည်း သူငယ်ချင်း ရှာပေးလိုက်တယ်။', en: 'I fixed Daw Khin May, and I found Maung Arkar a friend.' },
    { my: 'ဒေါ်ခင်မေက ဆင်ခြေမပါဘဲ ကိုယ့်အမှား ကိုယ်ပြင်တယ်။ အော်သံမပါတဲ့ ဗန်းက မုန့်လည်း အတူတူပဲ။ အိမွန်က မောင်အာကာ့ကို အရင်နားထောင်ပြီးမှ လမ်းပြတယ်။ ကတောက်ကဆတ် ဖြစ်တော့ ကိုယ့်အသံ ကိုယ်ပြင်ကြတယ်။', en: 'Daw Khin May put her own fault right, no excuses; the quiet tray\'s bread was the same. Ei Mon listened to Maung Arkar first, then showed him the way. When they squabbled, each mended their own tone.' },
    { my: 'အော်တတ်တဲ့လူက ဘယ်တော့မှ မပြောင်းဘူး။ ရွာလွမ်းတဲ့ ကောင်လေးလည်း တစ်ယောက်တည်းပဲ ကျန်မှာ။', en: 'People who shout never change. And a homesick boy stays alone.' },
  ],
  nightWrong: [
    [{ my: '(မဟုတ်ဘူး… သူ့အမှား သူကိုယ်တိုင် ပြင်တာ။ မောင်အာကာ့ကို မေးခဲ့တာ အိမွန်။)', en: '(No… she put her own fault right. It was Ei Mon who asked him.)' }],
    [],
    [{ my: '(မဟုတ်ဘူး… ဒီနေ့ ကိုယ့်မျက်လုံးနဲ့ မြင်ခဲ့တာ အဲဒါ မဟုတ်ဘူး။)', en: "(No… that isn't what I saw today with my own eyes.)" }],
  ],
  sleepQ: { my: 'ဒီည မှတ်စုစာမျက်နှာလေး ဘယ်သူ့အိမ်မှာ အိပ်မလဲ။', en: "Whose house does tonight's notebook page sleep at?" },
  stampText: { my: 'စာမျက်နှာ ၁၄ — ကိုယ့်ကြောင့်\nကိုယ့်မှာ မကောင်းတာရှိရင် ကောင်းအောင် ပြင်တာ ကိုယ့်တာဝန်။ တခြားသူ တစ်ယောက်အတွက်လည်း မှန်ကြောင်း ကိုယ်တိုင် တွေ့ခဲ့ပြီ။', en: 'Page 14 — Because of Me\nIf there is something bad in you, putting it right is your own duty. She saw for herself it holds for someone else too.' },
  page15: { my: 'စာမျက်နှာ ၁၅ — ခဲတံနဲ့ပဲ ရှိသေးတယ်။ မနက်ဖြန် မောင်အာကာ တစ်ယောက်ယောက်ကို သတိထားမိမလား။', en: 'Page 15 — still in pencil. Tomorrow, will Maung Arkar notice someone?' },
  tomorrow: { my: 'နောက်တစ်နေ့ မနက် ရောက်ပြီ။', en: 'Morning comes.' },
  mayaWrite: [{ my: 'ဒီနေ့အကြောင်း စာရေးခန်းမှာ ပြန်ရေးမှ ဖြစ်မယ်။', en: 'I should write today down at my Writing Room.' }],
};

/** Day 10 morning lines from tonight's house (day9-spec 9; Day 10's script reads them). */
export const SLEPT9 = {
  khinmay: { my: '"ပူလောင်ပြီးတောင် သင်လို့ရရင် မပူလောင်ဘဲလည်း ရတယ်။ ကိုယ်တိုင် စမ်းကြည့်ပြီးပြီ။" — ဒေါ်ခင်မေ', en: '"If he can learn while you burn, he can learn without it. I tried it myself." — Daw Khin May' },
  maungarkar: { my: '"လေးတာ အောက်ဆုံး။ ပြုံးပြဖို့ မလိုဘူး။" — မောင်အာကာ', en: '"Heavy at the bottom. No need to put on a smile." — Maung Arkar' },
  eimon: { my: '"မေးပြီးရင် နားထောင်။ အကြံက နောက်မှ။" — အိမွန်', en: '"Ask, then listen. Advice comes after." — Ei Mon' },
  naychi: { my: '"အစ်မက မေးခွန်းပဲ ပြန်မေးတယ်။ နှစ်နေရာလုံး ကိုယ်တိုင် သွားကြည့်ခဲ့ပြီ။" — နေခြည်', en: '"She only asks me back. I went and looked at both places myself." — Nay Chi' },
};
