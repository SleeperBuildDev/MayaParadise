// Day 7's words (day7-spec.md 4–9). Every Burmese line is a draft for Maya to proofread.
// Kept apart from day7.js so the script stays readable; nothing here runs.

export const L = {
  // ---- 4. morning at home
  ww1: [{ my: 'မာရာရေ… မှတ်စုစာအုပ်လေး ပြန်ရောက်လာပြီ။ စာတစ်ကြောင်း ပါလာတယ်။', en: 'Maya… your notebook is back. With a line in it.' }],
  // the notebook line from the house it slept in on Day 6 (day6-spec section 9, `slept6`), plus Ma Wint War's
  slept6: {
    kothiha: { my: '"လူတိုင်း၊ တစ်မျိုးတည်း။" — ကိုသီဟ', en: '"Everyone, one way." — Ko Thiha' },
    dawsanda: { my: '"စာရင်းရဲ့ နောက်ဆုံးမှာ ကြိမ်ဆိပ်က အဘိုးကြီး။ နောက်ဆုံးပဲ၊ ဒါပေမဲ့ စာရင်းထဲမှာ။" — ဒေါ်စန္ဒာ', en: '"Last on my list: the old man on Cane Jetty. Last, but on the list." — Daw Sanda' },
    maungnge: { my: '"လှည်းပုံလေးပါတဲ့ စာရွက် ရတယ်။ နာမည်ကိုလည်း ကိုယ်တိုင် ဖတ်တယ်။" — မောင်ငယ်', en: '"I got a note with my cart drawn on it. I read my name myself." — Maung Nge' },
    naychi: { my: '"ကြားပါစေ၊ နားမထောင်နဲ့… ပြုံးထားရင် ပိုလွယ်တယ်။" — နေခြည်', en: '"Let it reach the ear, don\'t listen… it\'s easier smiling." — Nay Chi' },
    kophyo: { my: '"ဒီနေ့ ပထမဆုံးခွက်ကို ကိုယ့်ခွက် ကိုယ်ကိုင်တဲ့ ကလေးကို တိုက်ခဲ့တယ်။" — ကိုဖြိုး', en: '"Today\'s first cup went to the girl who carried her own." — Ko Phyo' },
    ubolay: { my: '"ငါ့ကြိမ်ကို မနင်းနဲ့။" — ဦးဘိုလေး', en: '"Don\'t tread on my cane." — U Bo Lay' },
    khwarnyo: { my: '"တံဆိပ်ခေါင်းပုံထဲက ကျောက်သင်ပုန်းကို ကိုယ်တိုင် မကောက်ခဲ့ဘူး။ နောက်ဆို ကောက်ပေးမယ်။" — ခွာညို', en: '"I didn\'t pick up the slate in the stamp heap. Next time I will." — Khwar Nyo' },
    kolwin: { my: '"ဘောင်တစ်ခု ပြီးသွားပြီ။ ဘယ်သူ့အတွက်မှ မဟုတ်ဘူး။ ကောင်းတယ်။" — ကိုလွင်', en: '"Finished a border. For nobody. It\'s good." — Ko Lwin' },
    wintwar: { my: '"ကိုယ့်စာ ကိုယ်ရေးဖို့ ဒီတစ်ပတ် အချိန်ရခဲ့တယ်။" — မဝင့်ဝါ', en: '"This week I found time to write my own letter." — Ma Wint War' }, // a host only Day 7 adds
  },
  ww2: [{ my: 'ဖောင်ကောင်လေးဆီကလည်း စာလေး ပါလာတယ်။', en: 'And a note from the raft boy.' }],
  thNote: { my: 'အစ်မ… ဒီမနက်လည်း ဦးဘိုလေးရဲ့ ဆိပ်မှာ ရပ်ခဲ့တယ်။\nလူတိုင်းကို နှုတ်ဆက်သလိုပဲ နှုတ်ဆက်တယ်။ သူ ခေါင်းညိတ်ရုံပဲ။\nဒါပဲ။ ဒါနဲ့ ရပါပြီ။', en: "Sister… I stopped at U Bo Lay's jetty again this morning.\nThe same greeting as everyone. He only nodded.\nThat's all. It's enough." },
  ttQ: { my: 'ဒီနေ့မေးခွန်း: စင်နာရီက ဘယ်သူမှ မကြည့်ရင်ရော လည်နေသေးလား။ — တိုးတိုး', en: "Today's question: does the stage clock keep going when nobody's looking? — Toe Toe" },
  earthCap: { my: 'မနေ့က စာမျက်နှာပေါ်ကနေ မြေကွက်လေး တစ်ကွက် ကြွတက်လာတယ်။ မြက်ပင်လေး နှစ်ပင်နဲ့။', en: "A little patch of earth lifts off yesterday's page, two blades of grass on top." },
  earthMaya: [{ my: 'ချီးမွမ်းလည်း ဒီအတိုင်း၊ ပစ်ပေါက်လည်း ဒီအတိုင်း။ လိုက်ခဲ့မလား။', en: 'Praised, the same; pelted, the same. Coming along?' }],
  ww3: [
    { my: 'ဘုတ်ပြားမှာ စာရွက် သုံးဆယ့်တစ်ရွက် ရှိနေပြီ။ ဒီမနက် အပေါ်ဆုံးမှာ ပြဇာတ်စာရွက် တစ်ရွက် လာကပ်သွားတယ်။', en: 'Thirty-one notes on the board now. And this morning a play programme pinned on top.' },
    { my: 'ဗလာစာအုပ်ရပ်ရဲ့ နှုတ်ဆက်ပွဲ ပြဇာတ်တဲ့။ ဒီည ခြောက်နာရီ၊ အောက်ဆုံးလမ်းက စင်မြင့်လေးမှာ။', en: "The Quarter's farewell play. Tonight at six, at the little stage on the last street." },
    { my: 'ကြည့်ပါဦး… ခန်းတိုင်းမှာ "မာရာ" ဆိုတဲ့ ဇာတ်ကောင် ပါတယ်။ မာရာက သိလား။', en: 'Look… a part called "Maya" in every scene. Did you know?' },
  ],
  programme: { my: 'နှုတ်ဆက်ပွဲ ပြဇာတ် · "ကျွန်တော်တို့ရဲ့ တစ်နှစ်"\nဒီည ၆ နာရီ · စင်မြင့်လေး\n၁။ အရိပ်ထဲက ပဲပင် ····· မာရာ — ရဲယဉ့်\n၂။ နေပူထဲက အိုး ····· မာရာ — ရဲယဉ့်\n၃။ ပါဆယ်တံဆိပ် ····· မာရာ — ရဲယဉ့်\n၄။ တံတားဘုတ် ····· မာရာ — ရဲယဉ့်\n၅။ နှုတ်ဆက်စကား ····· ရဲယဉ့်\nရေးသူ — ရဲယဉ့်\n\n(ခဲတံနဲ့ ဘေးမှာ: အကောင်းဆုံး သရုပ်ဆောင်ဆု ရှိမယ်တဲ့)',
    en: 'Farewell play · "Our Year"\nTonight 6 pm · the little stage\n1. Beans in the shade ····· Maya — Ye Yint\n2. Pots in the sun ····· Maya — Ye Yint\n3. The parcel labels ····· Maya — Ye Yint\n4. The bridge board ····· Maya — Ye Yint\n5. Farewell words ····· Ye Yint\nWritten by Ye Yint\n\n(pencilled in the margin: they say there\'s a best-actor prize)' },
  programmeSign: { my: 'ပြဇာတ်စာရွက်', en: 'the programme' },
  mayaProg: [{ my: '(ကျွန်မ… ခန်းတိုင်းမှာ? ဘယ်သူ ရေးတာလဲ။)', en: '(Me… in every scene? Who wrote this?)' }],
  ww4: [
    { my: 'နေခြည်လည်း မိုးလင်းကတည်းက ဖဲကြိုးလမ်းကနေ ဆင်းသွားပြီ။ မနေ့က လေတိုက်တုန်းက ကျောက်သင်ပုန်းလေး သုံးချပ် ဗလာစာအုပ်ရပ်ထဲ ကျနေတယ်တဲ့။ တစ်ချပ်က ပြဇာတ်တိုက်နေတဲ့ နေရာမှာ။', en: "Nay Chi went down the ribbon road at first light. Yesterday's wind dropped three of her slates in the Quarter, she said. One where they're rehearsing the play." },
    { my: 'နောက်တစ်ချပ်ကတော့ အရှေ့ဘက် တံတားဆီအထိ လွင့်သွားတယ်တဲ့။ စာမျက်နှာ ခေါက်ရိုးမှာ။', en: 'And one blew all the way east to the bridge, at the fold of the page.' },
  ],
  wwLater: [
    { my: 'ဇာတ်တိုက်တာက ကျောင်းစာသင်ခန်းထဲမှာ၊ ဒုတိယလမ်းပေါ်။ ပြတင်းပေါက်ကနေ ရွတ်သံ ကြားရလိမ့်မယ်။', en: "They're rehearsing inside the school classroom, on the second street. You'll hear the reciting through the windows." },
    { my: 'ညပွဲကတော့ နောက်ဆုံးလမ်းက စင်မြင့်လေးမှာ၊ လမ်းမကြီးရဲ့ အနောက်ဘက်။', en: 'The play itself is at the little stage on the last street, west of the avenue.' },
  ],
  wwEvening: [{ my: 'ဘုတ်ပြားမှာ စာရွက်တွေ တံခါးပေါ်အထိ ကပ်လာကြပြီ။ အားလုံးက "မာရာ ပြောပါ" တဲ့။', en: 'The notes have spread onto the door now. All of them: "Maya, tell me."' }],
  wwDone: [{ my: 'ပြဇာတ်လည်း ပြီး၊ တံတားလည်း ပွင့်ပြီတဲ့။ စာရေးခန်းမှာ ဒီနေ့အကြောင်း ရေးဖို့ပဲ ကျန်တော့တယ်။', en: "The play's done and the bridge is open, they say. Only today's page left to write, in the Writing Room." }],

  // ---- the street outside the school (heard through the open windows)
  recite: { my: '"…မာရာ ရောက်ပြီ! ပဲပင်တွေကို နေရောင်ထဲ ငါ ရွှေ့ပေးမယ်!…"', en: '"…Maya is here! I shall move your beans into the sun!…"' },

  // ---- 5.1 the rehearsal and the prank
  yy1: [{ my: '"မကြောက်ပါနဲ့ တိုးတိုး၊ မာရာ ရောက်ပြီ! ပဲပင်တွေကို နေရောင်ထဲ ငါ ရွှေ့ပေးမယ်!"', en: '"Fear not, Toe Toe, Maya is here! I shall move your beans into the sun!"' }],
  ttStage: [{ my: '(တိုးတိုး တိုးတိုးလေး) ကျွန်တော် ကိုယ်တိုင် ရွှေ့ခဲ့တာပါ…', en: '(Toe Toe, quietly) I moved them myself…' }],
  kidsName: { my: 'ကလေး နှစ်ယောက်', en: 'Two chorus kids' },
  kids: [{ my: 'ရှူး… မမနေခြည်၊ လက်ခုပ်တီး! ရဲယဉ့် စာအုပ်မရှိရင် ဘာမှ ပြောတတ်မှာ မဟုတ်ဘူး!', en: "Shh… Nay Chi, clap! Without his book Ye Yint can't say a thing!" }],
  nc8: [
    { my: '(လက်ခုပ်မတီးဘူး။ ကျောက်သင်ပုန်းတစ်ချပ်ကို သတိရသလို ခဏ ငြိမ်နေတယ်။)', en: "(She doesn't clap. She goes still, as if remembering a slate.)" },
    { my: 'ငါ့အတွက်တော့ မရယ်စရာပါဘူး။', en: "It isn't funny to me." },
  ],
  kidsAfter: [{ my: '…ဟုတ်ပါပြီ။ (ပျင်းသွားပြီး ထွက်ပြေးသွားကြတယ်။)', en: '…Fine. (They lose interest and run off.)' }],
  hwNoBook: [{ my: 'နောက်ဆုံးစကားလေး ပြောကြည့်ပါ ရဲယဉ့်။ စာအုပ် မလိုပါဘူး။', en: "Say the closing line, Ye Yint. You don't need the book." }],
  yyStuck: [
    { my: '"ဒီနေ့ ဒီကနေ ထွက်သွားကြမယ့်သူတိုင်း… ကိုယ့်…" …ကိုယ့်ဘာလဲ။ စာအုပ်ထဲမှာ ပါတယ်လေ!', en: '"May all who leave here today… their own…" …their own what? It\'s in the book!' },
    { my: 'မနှစ်က တစ်လုံးမကျန် ပြောခဲ့တာ။ ဘာအဓိပ္ပာယ်လဲတော့… မစဉ်းစားဖူးဘူး။', en: 'Last year I said it word for word. What it means… I never thought about it.' },
  ],
  // ---- 5.2 W: what the closing line means
  hwLine: [{ my: '"ဒီနေ့ ဒီကနေ ထွက်သွားကြမယ့်သူတိုင်း ကိုယ့်လမ်းကို ကိုယ်တိုင် လျှောက်ကြပါစေ" တဲ့။ နှစ်တိုင်း ပြောနေကျ စကားပါ။', en: '"May all who leave here today walk their own road themselves." The school says it every year.' }],
  wQ: { my: 'ဒီစကားက ဘာကို ဆိုလိုတာလဲ။', en: 'What does the line mean?' },
  wChoices: [
    { my: 'လမ်းသိတဲ့သူ နောက်က လိုက်သွားကြ။', en: 'Follow whoever knows the way.' },
    { my: 'အကောင်းဆုံး ပြောနိုင်သူက နောက်ဆုံး ပြောရတယ်။', en: 'The best speaker gets the last word.' },
    { my: 'ကိုယ့်လမ်းကို ဘယ်သူမှ လျှောက်ပေးလို့ မရဘူး။ ကိုယ်တိုင် လျှောက်ရမယ်။', en: 'Nobody can walk your road for you. You walk it yourself.' }, // true
  ],
  wWrong: [
    [{ my: '"လမ်းသိတဲ့သူ နောက်လိုက်"… ဒါဆို "ကိုယ့်လမ်း" ဘယ်ရောက်သွားလဲ။', en: '"Follow whoever knows"… then where did "their own road" go?' }],
    [{ my: 'ဒါ မနှစ်က ကျွန်တော် ထင်ခဲ့တာ။ စကားထဲမှာတော့ မပါဘူး။', en: "That's what I thought last year. It isn't in the words." }],
  ],
  wOk: [
    { my: '(စာအုပ်မပါဘဲ) "ဒီကနေ ထွက်သွားတဲ့သူ တစ်ယောက်ချင်းစီ… ကိုယ့်လမ်းကို ဘယ်သူမှ လျှောက်မပေးနိုင်ဘူး။ ကိုယ့်ခြေထောက်နဲ့ ကိုယ် လျှောက်ကြပါ။"', en: '(No book) "Each one who leaves here… nobody can walk your road for you. Walk it on your own feet."' },
    { my: '…ပြောလို့ရသွားတယ်။ စာအုပ်ထဲက စကားလုံးနဲ့ မတူပေမဲ့ အဓိပ္ပာယ်က တူတယ်။', en: "…I could say it. Not the book's words, but the same meaning." },
    { my: 'ဒါဆို… ကျွန်တော့် ပြဇာတ်ထဲက "မာရာ" က လူတိုင်းရဲ့လမ်းကို လျှောက်ပေးနေတာပဲ။', en: 'But then… the "Maya" in my play walks everyone\'s road for them.' },
  ],
  // ---- 6.1 slate 8 (in the classroom, right after W)
  nc8b: [{ my: 'ဒါ ငါ့ရဲ့ရှစ်ခုမြောက်။ ခုနက ကလေးတွေကို လက်ခုပ်မတီးလိုက်တာ… ဒါပဲလား။', en: 'My eighth. Not clapping for the kids just now… is that all it is?' }],
  maya8: [{ my: 'ကိုယ်တိုင် မလုပ်ရုံ မကဘူး။ သူများလုပ်တာကိုလည်း အားမပေးတာ။ နေခြည် လုပ်ခဲ့ပြီလေ။', en: 'Not just not doing it. Not cheering it on, either. You just did.' }],
  ncToStage: [{ my: 'မောင်ငယ် စင်မြင့်မှာ လိုက်ကာ ချိတ်နေတယ်။ နောက်တစ်ချပ်လည်း အဲဒီနားမှာ။', en: "Maung Nge's down at the stage hanging the curtain. The next one is near there." }],
  mnGo: [{ my: 'လိုက်ကာ ချိတ်ရဦးမယ်! ကျွန်တော့်တာဝန်။', en: "I've got to hang the curtain! It's my job." }],
  // ---- 5.3 hooks
  hw1: [
    { my: 'ပြဇာတ်ကို ရဲယဉ့် ကိုယ်တိုင် ရေးတာ။ မြို့ကလူတွေ "မာရာ့ကို မေး" "မာရာ ပြောတယ်" နဲ့ပဲ ပြောနေကြတော့ မာရာကို ခန်းတိုင်းထည့်ရေးလိုက်တာတဲ့။', en: 'Ye Yint wrote the play himself. The whole town says "ask Maya", "Maya says", so he put Maya in every scene.' },
    { my: 'ပြီးတော့ မာရာ အပိုင်းကို သူကိုယ်တိုင် ကတယ်။ ခန်းတိုင်းမှာ သူပဲ။', en: 'And he plays Maya himself. He is in every scene.' },
    { my: 'နောက်ဆုံးတန်းက ခုံမှာ ထိုင်ကြည့်ပါလား။ အဲဒီကမှ အခန်းရှေ့ တစ်ခုလုံး မြင်ရတာ။', en: 'Try sitting at the back-row desk. Only from there do you see the whole front of the room.' },
  ],
  askPrize: [{ my: 'ဆရာမ… ဒီည အကောင်းဆုံး သရုပ်ဆောင်ဆု ရှိတယ်တဲ့။ ဟုတ်လား။', en: "Teacher… they say there's a best-actor prize tonight. Is that so?" }],
  hwPrize: [{ my: 'ဆု? မရှိပါဘူး။ နှုတ်ဆက်ပွဲပဲလေ။ မနှစ်က ဆုက စကားပြောပြိုင်ပွဲက ဆု။', en: "A prize? No. It's a farewell. Last year's prize was from the speech contest." }],
  proofNoprize: { my: 'ဒီည ပြဇာတ်မှာ ဆုမရှိဘူး။ နှုတ်ဆက်ပွဲပဲ။', en: "No prize at tonight's play. It is a farewell." },
  proofClock: { my: 'စင်နာရီက လည်နေတယ်။ ရပ်မနေဘူး။', en: 'The stage clock runs. It never stopped.' },
  proofRope: { my: 'ကြိုးတံတားဟောင်း မပြတ်ဘူး။ လွှဲတယ်၊ ခိုင်တယ်။', en: 'The old rope footbridge is not broken. It sways; it holds.' },
  yyBench: [
    { my: 'ခုံတွေ? ကျောင်းလှေကားပေါ်မှာ ကျန်သေးတယ်။ တခြားသူတွေ သယ်လိမ့်မယ်။', en: 'Benches? The rest are on the school steps. The others will carry them.' },
    { my: 'ကျွန်တော်က တခြားသူတွေနဲ့ မတူဘူး။ ဇာတ်လိုက်က ခုံမသယ်ဘူး။', en: "I'm different. The lead doesn't carry benches." },
  ],
  hwWait: [{ my: 'အချိန်ရှိတုန်း ကလေးတွေ လေ့ကျင့်ပါစေ။ မီးမထွန်းခင် ပြီးရမယ်။', en: "Let them practise while there's time. It must be ready before the lamps." }],
  // the stage clock (rumour `clock`)
  clockPencil: { my: 'ရပ်နေတာ ကြာပြီ', en: 'stopped long ago' },
  clockGold: { my: 'လက်တံ ရွေ့နေတယ်။ ဘယ်သူမှ မကြည့်လည်း ရွေ့နေတာပဲ။', en: 'The hand is moving. It moves whether anyone looks or not.' },
  // ---- 5.4 L: the back row
  sitBack: [{ my: '(နောက်ဆုံးတန်းမှာ ထိုင်ကြည့်မယ်။)', en: '(I\'ll sit in the back row.)' }],
  looks: {
    backdrop: { pencil: { my: 'ပြီးပြီ', en: "it's finished" }, gold: { my: 'လမ်းက တံတားမရောက်ခင် ရပ်နေတယ်။ စက္ကူဖြူပဲ ကျန်တယ်။', en: 'The road stops short of the bridge. Bare paper.' } },
    roads: { pencil: { my: 'အလှဆင်ထားတာ', en: 'just decoration' }, gold: { my: 'လမ်းလေးတွေ ရပ်ကွက်ထဲကနေ အပြင်ကို ထွက်သွားကြတယ်။ လမ်းတိုင်းမှာ လူလေး တစ်ယောက်စီ။', en: 'Little roads lead out of the Quarter, one small figure on each.' } },
    ending: { pencil: { my: 'မာရာက အားလုံးကို ကယ်တယ်', en: '"Maya saves everyone"' }, gold: { my: 'နောက်ဆုံးစကားက "ကိုယ့်လမ်း ကိုယ်တိုင်" တဲ့။ ဇာတ်သိမ်းနဲ့ မကိုက်ဘူး။', en: 'The closing line says "your own road". The ending doesn\'t match it.' } },
    list: { pencil: { my: 'နာမည်စာရင်းပဲ', en: 'just a list of names' }, gold: { my: 'နာမည်တိုင်းဘေးမှာ သွားမယ့်နေရာ ရေးထားတယ်။ နေခြည် — တံတားတစ်ဖက်က ပုံနှိပ်တိုက်။ ရဲယဉ့်ဘေးမှာပဲ ကွက်လပ်။', en: "Beside every name, where they go next. Nay Chi: the press across the bridge. Only Ye Yint's is blank." } },
  },
  lookDone: { my: 'ပြီးပြီ', en: 'Done' },
  headQ: { my: 'ဒီပြဇာတ်က တကယ်တော့ ဘယ်ကို ဦးတည်နေတာလဲ။', en: 'Where is this play really heading?' },
  headChoices: [
    { my: 'မာရာက လူတိုင်းကို ကယ်တင်တဲ့ဆီ။', en: 'To Maya saving everyone.' },
    { my: 'မနှစ်က ဆုရ မိန့်ခွန်းဆီ။', en: "To last year's prize speech." },
    { my: 'ထွက်သွားမယ့်သူ တစ်ယောက်ချင်း ကိုယ့်လမ်းပေါ် ကိုယ် တက်သွားတဲ့ဆီ။', en: 'To each one who leaves stepping onto their own road.' }, // true
  ],
  headWrong: { my: '(ဒါ စာရွက်ပေါ်မှာ ရေးထားတာ။ နောက်ခံကားကို ပြန်ကြည့်ပါဦး။)', en: "(That's what's written. Look at the backdrop again.)" },
  headOk: [{ my: '(လမ်းလေးတွေက အပြင်ကို ထွက်သွားကြတာ။ ဇာတ်လိုက်တစ်ယောက်ဆီ မဟုတ်ဘူး။)', en: '(The little roads all lead out. Not to one lead.)' }],
  // ---- 5.5 H: he finishes the backdrop
  yyLater: [{ my: 'နောက်မှ ဆေးသုတ်မယ်။ မိန့်ခွန်း အရင်ကျက်ရဦးမယ်။', en: "I'll paint it later. I have to learn the speech first." }],
  mayaPaint: [{ my: '"နောက်ခံကားက ပြဇာတ် ဘယ်ကိုသွားလဲ ပြနေတယ်။ မင်း မြင်တဲ့ အဆုံးကို အခု ဆွဲလိုက်ပါလား။"', en: '"The backdrop shows where the play goes. Paint the end you can see, now?"' }],
  yyPaint: [{ my: '…လမ်းကို တံတားအထိ ဆက်ဆွဲမယ်။ ပြီးရင် တံတားပေါ်မှာ လူလေးတွေ။', en: "…I'll carry the road on to the bridge. Then little people on the bridge." }],
  paintTitle: { my: 'ရဲယဉ့် နောက်ခံကား ဆေးသုတ်မယ်', en: 'Ye Yint paints the backdrop' },
  paintHint: { my: 'လမ်းကို တံတားအထိ ဖြည်းဖြည်း ဆွဲပါ', en: 'Draw the road on to the bridge, steadily' },
  paintAgain: { my: 'ဆေး ပြန့်သွားတယ်။ နောက်တစ်ခါ။', en: 'The paint ran. Again.' },
  yyPainted: [{ my: 'ပြီးပြီ… တကယ် ပြီးပြီ။ ကြာနေတာ ကျွန်တော် မလုပ်ချင်လို့ပဲ။', en: "Done… really done. It only took this long because I didn't want to." }],
  // ---- 5.6 S: props, then scenes to their owners
  hwSort: [{ my: 'ပစ္စည်းခြင်းကို စင်မြင့်ဆီ မပို့ခင် သေချာ ခွဲထားရအောင်။', en: 'Tidy it before it goes down to the stage.' }],
  sortTitle: { my: 'ပစ္စည်းတွေကို ခွဲထားမယ်', en: 'Sort the props' },
  sortHint: { my: 'ပြီးသွားပြီ၊ မရောက်သေး၊ ဒီည', en: 'Gone, not yet, tonight' },
  sortBaskets: [
    { id: 'gone', label: { my: 'ပြီးသွားပြီ', en: 'Gone' }, icon: '🍂' },
    { id: 'notyet', label: { my: 'မရောက်သေး', en: 'Not yet' }, icon: '🌱' },
    { id: 'tonight', label: { my: 'ဒီည', en: 'Tonight' }, icon: '🪔' },
  ],
  sortItems: [
    { id: 'ribbon', basket: 'gone', label: { my: 'မနှစ်က ဆုဖဲကြိုး', en: "Last year's prize ribbon" }, icon: '🎀' },
    { id: 'speech', basket: 'gone', label: { my: 'မနှစ်က မိန့်ခွန်းစာရွက်', en: "Last year's speech sheet" }, icon: '📜' },
    { id: 'badge', basket: 'notyet', label: { my: 'အလုပ်သစ် ကတ်ပြား (ပုံစံ)', en: 'A new-job badge (pretend)' }, icon: '🪪' },
    { id: 'plan', basket: 'notyet', label: { my: 'နောက်နှစ် အချိန်ဇယား', en: "Next year's timetable" }, icon: '🗓️' },
    { id: 'wick', basket: 'tonight', label: { my: 'ဒီညအတွက် မီးစာတွေ', en: "Tonight's lamp wicks" }, icon: '🕯️' },
    { id: 'rope', basket: 'tonight', label: { my: 'လိုက်ကာကြိုး', en: 'The curtain rope' }, icon: '🪢' },
  ],
  sortWrong: { my: 'ဟင့်အင်း… ဒါက အဲဒီအချိန်က မဟုတ်ဘူး။', en: "No… that isn't from that time.", who: 'yeyint' },
  yySorted: [
    { my: 'မနှစ်ကဆု ပြီးသွားပြီ။ အဲဒီပေါ်မှာ ရပ်ပြီး ကြွားလို့ မရတော့ဘူး။', en: "Last year's prize is gone. I can't stand on it and boast any more." },
    { my: 'အလုပ်သစ်ကလည်း မရောက်သေးဘူး။ ရပြီးသားလို မပြောနိုင်ဘူး။', en: "The new job isn't here yet either. I can't talk as if I had it." },
    { my: 'လုပ်လို့ရတာ ဒီညဟာပဲ။', en: "Tonight's is the one I can work on." },
  ],
  hwMatch: [{ my: 'ကဲ… ကျောက်သင်ပုန်းပေါ်က ဇာတ်ကောင်စာရင်းကို ကြည့်။ ခန်းတစ်ခန်းချင်း ဘယ်သူ့ဇာတ်လမ်းလဲ။', en: 'Now… look at the cast list on the board. Whose story is each scene?' }],
  matchTitle: { my: 'ခန်းတစ်ခန်းချင်း ဘယ်သူ့ဇာတ်လမ်းလဲ', en: 'Whose story is each scene?' },
  matchHint: { my: 'ခန်းကို နှိပ်၊ ပြီးရင် ပိုင်ရှင်ကို နှိပ်', en: 'Tap a scene, then its owner' },
  matchPairs: [
    { left: { my: 'အရိပ်ထဲက ပဲပင်', en: 'Beans in the shade', icon: 'beanpot' }, right: { my: 'တိုးတိုး', en: 'Toe Toe' } },
    { left: { my: 'နေပူထဲက အိုး', en: 'Pots in the sun', icon: '🏺' }, right: { my: 'မိချို', en: 'Mi Cho' } },
    { left: { my: 'ပါဆယ်တံဆိပ်', en: 'The parcel labels', icon: '📦' }, right: { my: 'စုနွယ်နဲ့ မောင်ငယ်', en: 'Su Nwe and Maung Nge' } },
    { left: { my: 'တံတားဘုတ်', en: 'The bridge board', icon: '🌉' }, right: { my: 'နေခြည်', en: 'Nay Chi' } },
    { left: { my: 'နှုတ်ဆက်စကား', en: 'Farewell words', icon: 'book' }, right: { my: 'ရဲယဉ့်', en: 'Ye Yint' } },
  ],
  owned: [{ my: '(ခန်းတိုင်းက သူ့ပိုင်ရှင်ဆီ ပြန်ရောက်သွားပြီ။ "မာရာ" ဝတ်စုံကတော့ ချိတ်မှာပဲ ကျန်တယ်။)', en: '(Every scene has gone back to its owner. The "Maya" costume stays on its hook.)' }],
  // ---- 5.7 after the talk
  yyNotYet: [{ my: 'ခဏ… ဒီအခန်းထဲမှာပဲ ရှိမယ်။', en: "Give me a bit… I'll be here in the classroom." }],
  stillWrite: [{ my: '(ရဲယဉ့်က နှုတ်ဆက်စာရင်းဆီ သွားပြီး ကြိုးနဲ့ချိတ်ထားတဲ့ မြေဖြူခဲတံကို ယူတယ်။ သူ့နာမည်ဘေးက ကွက်လပ်မှာ "ရှာနေဆဲ" လို့ ရေးတယ်။ ဘာမှ မပြောဘူး။)', en: '(Ye Yint goes to the leavers\' list, takes the chalk pencil on its string and writes "still looking" in the blank by his name. He says nothing about it.)' }],
  stillText: { my: 'ရှာနေဆဲ', en: 'still looking' },
  hwAfterTalk: [{ my: 'ကလေးတွေ ခုံတွေ စင်မြင့်ဆီ သယ်တော့မယ်။ ကျွန်မ နောက်က လိုက်ခဲ့မယ်။', en: "The children are taking the benches down to the stage. I'll follow on." }],
  // ---- 5.8 C: benches with everyone
  yyEnd1: [{ my: 'တစ်ဖက် ကူကိုင်ပေးမလား အစ်မ။', en: 'Take the other end, sister?' }],
  yyNext: { my: 'နောက်တစ်ခေါက် ငါ လာသယ်မယ်။', en: "I'll take the next trip." },
  carryNo: [{ my: '(ခုံကို ကိုယ်တစ်ယောက်တည်း မသယ်နိုင်ဘူး။ ရဲယဉ့် ကျောင်းလှေကားမှာ စောင့်နေတယ်။)', en: "(I can't carry a bench alone. Ye Yint is waiting on the school steps.)" }],
  benchesDown: [{ my: '(ခုံလေးလုံး စင်ရှေ့မှာ နေရာချပြီးပြီ။ ကလေးတွေ ရယ်သံထဲမှာ ရဲယဉ့်လည်း ပါတယ်။)', en: "(Four benches in front of the stage. Ye Yint's laugh is in with the children's.)" }],
  snSeat: [{ my: 'ရှေ့ဆုံးတန်းက အလယ်နေရာကတော့ မာရာ့အတွက်။', en: "The middle of the front row is kept for Maya." }],
  seatCard: { my: 'မာရာ — ဧည့်သည်တော်', en: 'Maya — guest of honour' },
  // ---- 5.9 dusk: the brimming bowl
  hwDusk: [{ my: 'မီးမထွန်းခင် နောက်ဆုံး တစ်ခေါက် လေ့ကျင့်ကြမယ်။', en: 'One last run before the lamps.' }],
  mcBowl: [{ my: 'ဒီဇလုံက အိုးဖိုထဲက ကောင်းကောင်း ထွက်လာတဲ့ လေးလုံးထဲက တစ်လုံး။', en: 'This bowl is one of the four that came out of the kiln whole.' }],
  bowlTitle: { my: 'ဇလုံကို ရေမဖိတ်အောင် သယ်ပါ', en: 'Carry the bowl without spilling' },
  bowlHint: { my: 'ဇလုံကိုပဲ ကြည့်။ ဖိထားရင် လျှောက်၊ လွှတ်ရင် ရပ်', en: 'Watch the bowl. Hold to walk, let go to stop' },
  bowlSpill: { my: 'ဖိတ်သွားပြီ။ ခြေလှမ်းကို စိတ်မထားမိဘူး။ နောက်တစ်ခါ။', en: "Spilled. My mind wasn't on my steps. Again." },
  bowlOk: [{ my: 'နာရီက ဘယ်လိုပဲ လည်လည်… ဒီခြေလှမ်းကိုပဲ ကြည့်ရင် ရတယ်။', en: 'Whatever the clock does… it works if I just watch this step.' }],
  ttBowl: [{ my: 'ဘယ်သူမှ မကြည့်လည်း နာရီက လည်နေတာပဲ။ ဒါကြောင့် ခြေလှမ်းတိုင်းကို သတိထားပြီး လှမ်းရမှာပေါ့။', en: 'The clock goes on whether anyone watches or not. So every step is worth minding.' }],
  // ---- 5.10 the play (once) and the costume
  seatQ: { my: 'ဘယ်မှာ ထိုင်မလဲ။', en: 'Where will she sit?' },
  seatChoices: [
    { my: 'ရှေ့ဆုံးတန်း၊ "မာရာ — ဧည့်သည်တော်" ကတ်ပေါ်။', en: 'The front row, on the "Maya — guest of honour" card.' },
    { my: 'နောက်ဆုံးတန်း၊ မီးတိုင်ဘေး။', en: 'The back row, by the lamp.' },
  ],
  seat0: [{ my: '(ဒီနေရာ ကျွန်မအတွက် ချန်ထားတာ။ စင်ကို တည့်တည့်မော့ကြည့်ရတယ်။)', en: '(They kept this seat for me. I look straight up at the stage.)' }],
  seat1: [{ my: '(ဒီကနေ စင်တစ်ခုလုံး မြင်ရတယ်။ ကလေးတွေရဲ့ မိဘတွေလည်း မြင်ရတယ်။)', en: "(From here I see the whole stage. And the children's parents.)" }],
  hwSix: [{ my: 'ခြောက်နာရီ ထိုးပြီ။ မီးထွန်းကြ။', en: "Six o'clock. Light the lamps." }],
  play1: [{ my: '(မောင်ငယ်က ကြိုးကို တစ်ချက်တည်း ဆွဲလိုက်တယ်။ လိုက်ကာ ပွင့်သွားတယ်။)', en: '(Maung Nge gives the rope one tug. The curtain opens.)' }],
  play2: [{ my: '(ခန်း ၁ — တိုးတိုးက သူ့ပဲပင်တွေကို နေရောင်ထဲ ကိုယ်တိုင် ရွှေ့တယ်။ ရဲယဉ့်က ရေပြည့်ဇလုံကို တစ်စက်မှ မဖိတ်ဘဲ ဖြတ်သယ်သွားတယ်။)', en: '(Scene 1 — Toe Toe moves his own beans into the sun. Ye Yint walks the brimming bowl across, not a drop spilled.)' }],
  play3: [{ my: '(ခန်း ၂ — မိချိုက ဘီးနားမှာ။ ကတ်ထူဘီးပေါ်မှာ ဒေါ်အုန်းရဲ့ မြေဖြူစာ "မရသေးဘူး"။)', en: '(Scene 2 — Mi Cho at a wheel. On a cardboard wheel, Daw Ohn\'s chalk: "not yet".)' }],
  play4: [{ my: '(ခန်း ၃ — စုနွယ့် ခဲတံက တံဆိပ်အောက်မှာ၊ မောင်ငယ့် လက်ညှိုးက နောက်က လိုက်ဖတ်တယ်။)', en: "(Scene 3 — Su Nwe's pencil under a label, Maung Nge's finger following.)" }],
  play5: [{ my: '(ခန်း ၄ — နေခြည်က ကျောက်သင်ပုန်း ဆယ်ချပ်ပါတဲ့ ကတ်ထူဘုတ်နားမှာ ရပ်နေတယ်။)', en: '(Scene 4 — Nay Chi at a cardboard board with ten slates.)' }],
  play6: [{ my: '(ခန်း ၅ — ရဲယဉ့် တစ်ယောက်တည်း။)', en: '(Scene 5 — Ye Yint alone.)' }],
  play7: [{ my: '(လက်ခုပ်သံတွေ။ စင်ပေါ်မှာ "မာရာ" မရှိဘူး။ စင်နာရီက ခုနစ်နာရီ ပြနေပြီ။)', en: '(Applause. No "Maya" on the stage. The stage clock reads seven.)' }],
  yyEnd: [
    { my: 'ဒီညတော့ ဒီဝတ်စုံ မလိုခဲ့ဘူး အစ်မ။ ပြန်ပေးချင်လို့။', en: "We didn't need this tonight, sister. I wanted to give it back." },
    { my: 'ကျွန်တော့်ခန်းကို ကျွန်တော့်စကားနဲ့ပဲ ကခဲ့တယ်။ ခုံသယ်ရတာထက်တောင် ပေါ့သေးတယ်။', en: 'I played my own scene, in my own words. It felt lighter than the benches.' },
  ],
  mayaEnd: [{ my: '(သူတို့ခန်းတွေမှာ "မာရာ" မပါလည်း ကောင်းကောင်း ကပြသွားကြတယ်။ …ဝမ်းသာလိုက်တာ။)', en: '(Their scenes played beautifully with no "Maya" in them. …I\'m glad.)' }],
  hwEnd: [{ my: 'ရဲယဉ့် ဒီည ပြောတဲ့ စကားတွေ စာအုပ်ထဲမှာ မပါဘူး။ ကျွန်မ အရင်က မကြားဖူးဘူး။', en: "The words Ye Yint said tonight aren't in any book. I'd never heard them before." }],
  costumeBack: [{ my: '(ဝတ်စုံကို ချိတ်ပေါ် ပြန်ချိတ်လိုက်တယ်။ အိတ်ထဲ မထည့်ဘူး။)', en: '(The costume goes back on its hook. Not into the bag.)' }],

  // ---- 6. chapter 11: Nay Chi's slates
  slates: {
    1: { my: 'ကိုယ့်ကိုယ်ကို ကိုယ်ပဲ ထိန်းနိုင်တယ်။', en: 'Only I can keep myself in check.' },
    2: { my: 'ကြားပါစေ၊ နားမထောင်နဲ့။ ပြုံးထား။', en: "Let it reach the ear; don't listen. Smile." },
    3: { my: 'စည်းကမ်းနဲ့ နေရတာ ထင်တာထက် ခက်တယ်။ တန်တယ်။', en: 'Living by a rule is harder than I thought. Worth it.' },
    4: { my: 'မှားရင် တောင်းပန်။ ပြီးရင် ပြင်။', en: "If I'm wrong, say sorry. Then put it right." },
    5: { my: 'လူတိုင်း ကိုယ့်ဘဝရဲ့ ဇာတ်လိုက်ပဲ။', en: 'Everyone is the lead of their own life.' },
    6: { my: 'ကြောက်လို့ရတယ်။ နောက်ပြန်မလှည့်နဲ့။', en: "Afraid is allowed. Turning back isn't." },
    7: { my: 'လုပ်သမျှ စေတနာ ထည့်။', en: 'Put goodwill into whatever you do.' },
    8: { my: 'မကောင်းတာကို လက်ခုပ်မတီးနဲ့။', en: "Don't clap for a wrong." },
    9: { my: 'မမျှော်လင့်ဘဲ ပေး။ အရာရာ ပြောင်းတတ်တယ်။', en: 'Give, expecting nothing. Everything changes.' },
    10: { my: 'ဘယ်သူ့ကိုမှ မထိန်းနဲ့။ သော့က ကိုယ့်လက်ထဲမှာ။', en: 'Steer no one. The key is in your own hand.' },
  },
  // 6.1 slate 7 at the stage: the curtain knot
  mnKnot: [{ my: 'လိုက်ကာ ဖွင့်တာ ကျွန်တော့်တာဝန်။ ကြိုးက တင်းလွန်းတယ်။ ရဲယဉ့်က မနက်က "မပြုတ်အောင်" ဆိုပြီး တင်းတင်း ချည်သွားတာ။', en: "Opening the curtain's my job. The knot's too tight. Ye Yint tied it hard this morning \"so it won't slip\"." }],
  mayaKnotQ: [{ my: '"ဒီညမှာ ဒီလိုက်ကာကို ဘယ်သူ ဖွင့်မှာလဲ။"', en: '"Who opens this curtain tonight?"' }],
  nc7: [
    { my: 'မောင်ငယ်။ လက်သေးသေးလေးနဲ့ တစ်ချက်တည်း ဆွဲရမှာ။', en: 'Maung Nge. Small hands, one pull.' },
    { my: 'ဒါဆို တင်းတင်း မချည်ဘူး။ သူ တစ်ချက်ဆွဲရင် ပြေသွားမယ့် ကြိုးထုံး ချည်မယ်။ မပြုတ်အောင်လည်း နောက်တစ်ပတ် ပတ်ထားမယ်။', en: "Then not a hard knot. One that comes free when he pulls once. And one more turn so it won't slip." },
  ],
  mn7: [{ my: '(ဆွဲကြည့်တယ်) …ပွင့်သွားပြီ! ငါ့အတွက် ချည်ပေးတာလား။', en: '(He tries) …It opened! You tied it for me?' }],
  nc7b: [{ my: 'ဒီည ဖွင့်မယ့်သူအတွက်လေ။', en: 'For whoever opens it tonight.' }],
  ncTo9: [{ my: 'နောက်တစ်ချပ်က ပထမလမ်းက မုန့်ဆိုင်ထဲမှာတဲ့။ "တစ်ခုယူ တစ်ခုထား" စင်ပေါ်မှာ။ အဲဒီဘက် သွားမယ်။', en: "The next one is inside the snack shop on the first street, on the take-one-leave-one shelf. I'm going there." }],
  ncWaitStage: [{ my: 'ခုနစ်ခုမြောက်က လိုက်ကာတန်းပေါ်မှာ။ မောင်ငယ်နဲ့ အတူ ကြည့်ရအောင်။', en: "The seventh is up on the curtain beam. Let's see with Maung Nge." }],
  // 6.2 slate 9
  nc9: [
    { my: 'ဒီစာအုပ်တွေ ဆယ်နှစ်လုံး ယူလာခဲ့တာ။ မနက်ဖြန်ကစပြီး မလိုတော့ဘူး။', en: "I carried these for ten years. From tomorrow I won't need them." },
    { my: 'ဒီမှာ ထားခဲ့မယ်။ ဘယ်သူယူမလဲ မကြည့်ဘူး။ ကျေးဇူးတင်စကားလည်း မစောင့်ဘူး။', en: "I'll leave them here. I won't watch who takes them. I won't wait for a thank-you." },
  ],
  ncDontLook: [{ my: 'အစ်မ… မကြည့်နဲ့လေ။ ပေးပြီးရင် ပြီးပြီ။', en: "Sister… don't look. Once it's given, it's given." }],
  ncOldWay: [{ my: 'ကျောင်းသွားတဲ့ လမ်းဟောင်းကို နောက်တစ်ခေါက် လျှောက်ချင်တယ်။ ဆယ်နှစ် လျှောက်ခဲ့တာ။ ဘယ်တော့မှ မပြောင်းဘူး။', en: "I want to walk my old way to school once more. I've walked it ten years. It'll always be the same." }],
  changed: {
    beans: { pencil: { my: 'အရိပ်ထဲက ပဲပုံး၊ ပဲပင်သေ', en: 'the box in the shade, dead beans' }, gold: { my: 'နေရောင်ထဲ ရွှေ့ထားပြီ။ အညွန့်လေးတွေ ထွက်နေပြီ။', en: 'Moved into the sun. Shoots.' } },
    chart: { pencil: { my: 'အမှတ်ဇယား တစ်ခုတည်း', en: 'just the marks chart' }, gold: { my: 'ဘေးမှာ တိုးတိုးရဲ့ ကိုယ်ပိုင်စာကြောင်း ကပ်ထားတယ်။', en: "Toe Toe's own line pinned beside it." } },
    wheel: { pencil: { my: '"မရဘူး"', en: '"can\'t"' }, gold: { my: '"မရသေးဘူး"', en: '"not yet"' } },
  },
  ncChangedWait: [{ my: 'ဒီမှာ… ဘာရှိလဲ ကြည့်ပါဦး။', en: "Here… look what's there." }],
  ncChanged: [
    { my: 'ဒီလမ်းက ဘယ်တော့မှ မပြောင်းဘူး ထင်ခဲ့တာ။ ကျွန်မ ကျောင်းကနေ ထွက်ခဲ့တာ တစ်ပတ်တောင် မပြည့်သေးဘူး။', en: "I thought this street would never change. I haven't even been gone a week." },
    { my: 'ဒါဆို တံတားတစ်ဖက်ကလည်း ကျွန်မ ထင်ထားသလို ဖြစ်နေမှာ မဟုတ်ဘူးပေါ့။', en: "Then the other side of the bridge won't be the way I imagine either." },
  ],
  ncFold: [
    { my: 'နောက်ဆုံးတစ်ချပ်က တံတားဆီ ရောက်နေတယ်။ ဒီလမ်းမအတိုင်း တောင်ဘက်ဆင်း၊ စာအိတ်ဈေးကို ဖြတ်။', en: 'The last one is at the bridge. Down this avenue south, through the Envelope Market.' },
    { my: 'တံဆိပ်ခေါင်း အမိုးတွေ ကျော်ရင် အရှေ့ဘက်ကို လမ်းတစ်လမ်းတည်း။ စာရွက် ခေါက်ချိုးရာအထိ။ ဘုတ်ပြားက တံတားဝမှာ။ အဲဒီမှာ စောင့်မယ်။', en: "Past the stamp awnings there's one road east, to where the paper folds. The board's at the bridge mouth. I'll wait there." },
  ],
  ncWalking: [{ my: 'တံတားဝမှာ တွေ့မယ်နော် အစ်မ။', en: 'See you at the bridge mouth, sister.' }],
  // 6.3 the Fold
  foldArrive: [{ my: 'မြေကြီးပေါ်မှာ သတင်းစာ စာကြောင်းတွေ။ ဟိုဘက်ကမ်းက မီးခိုးခေါင်းတိုင်ကနေ မီးခိုး တက်နေတယ်။', en: 'Lines of newsprint underfoot. Smoke rising from a chimney across the fold.' }],
  bhName: { my: 'တံတားသမား', en: 'Bridge hand' },
  bh: [
    { my: 'ဘုတ်ပြားမှာ ကျောက်သင်ပုန်း ဆယ်ချပ် ပြန်ပြည့်မှ ဘားတန်း မတင်မယ်။ ဖွင့်ပွဲ ဓလေ့ပဲ။', en: "The boom goes up when the board has its ten slates back. It's the opening custom." },
    { my: 'ကြိုးတံတားဟောင်းက ပြတ်နေပြီတဲ့။ ကျွန်တော်ကတော့ မသွားကြည့်ရသေးဘူး။', en: "They say the old rope footbridge has snapped. I haven't gone to look." },
    { my: 'ဟိုဘက်ကမ်းမှာ ရွှေမင်ရေတွင်း ခန်းနေပြီလို့ ကြားတယ်။ မနက်ဖြန် တံတားဖြတ်ရင် သိမှာပေါ့။', en: "I hear the gold-ink well over there is drying up. You'll know when you cross tomorrow." },
  ],
  bhAfter: [{ my: 'မနက်ဖြန် မနက်ကစ ဖြတ်လို့ရပြီ။ ဒီည ကျွန်တော်တို့ စောင့်နေမယ်။', en: "From tomorrow morning you can cross. We'll keep watch tonight." }],
  bhTomorrow: { my: 'မနက်ဖြန် မနက်ကစ ဖြတ်ကူးလို့ ရမယ်တဲ့။', en: 'They say it opens to crossing from tomorrow morning.' },
  // 6.4 slate 6: the rope footbridge
  nc6: [{ my: 'ခြောက်ခုမြောက်က ဟိုအလယ်တိုင်ပေါ်မှာ။ ကြိုးတံတားက လွှဲနေတယ်… ကြောက်တယ် အစ်မ။', en: "The sixth is out on the middle pier. The rope bridge sways… I'm scared, sister." }],
  mayaFear: [{ my: '"ကြောက်တာ ရပါတယ်။ ကြောက်ရင်း သွားလို့ရလား။"', en: '"Being scared is fine. Can you go while scared?"' }],
  nc6b: [{ my: '…ခြေထောက် တုန်နေတုန်းပဲ။ ဒါပေမဲ့ သွားမယ်။', en: "…My legs are still shaking. But I'll go." }],
  plankTitle: { my: 'နေခြည် ကြိုးတံတားပေါ် လျှောက်မယ်', en: 'Nay Chi crosses the rope bridge' },
  plankHint: { my: 'ဖိထားရင် ရှေ့တိုး၊ လွှတ်ရင် ရပ်။ လွှဲရင် ငြိမ်အောင် စောင့်', en: 'Hold to step, let go to stop. When it sways, wait for it to settle' },
  plankBack: { my: 'နောက်ပြန်လှည့်မယ်', en: 'Turn back' },
  plankBackLine: { my: 'ဟင့်အင်း… ကြောက်လို့ရတယ်။ နောက်ပြန်လှည့်တာတော့ မဟုတ်ဘူး။', en: "No… afraid is allowed. Turning back isn't." },
  plankBackTitle: { my: 'ကလေးနဲ့ အတူ ပြန်လျှောက်မယ်', en: 'Walk back with the child' },
  plankBackHint: { my: 'ဖြည်းဖြည်း။ ကလေးလက်ကို ကိုင်ထား', en: "Slowly. Keep hold of the child's hand" },
  pierChild: { my: 'ကလေး', en: 'A child' },
  childStuck: [{ my: '(တိုင်ကို တင်းတင်းဖက်ထားတယ်) …မပြန်ရဲတော့ဘူး…', en: "(clinging to the winch) …I can't go back…" }],
  ncChild: [{ my: 'ငါလည်း ကြောက်တာပဲ။ လက်ချင်း ကိုင်ပြီး အတူတူ ပြန်ကြမလား။', en: "I'm scared too. Shall we hold hands and go back together?" }],
  nc6c: [{ my: 'ကြောက်ရက်နဲ့ သွားတာ… ကလေးလက်ကို ကိုင်ထားရတော့ ကိုယ့်ကြောက်တာ မေ့သွားတယ်။', en: 'Going while scared… holding her hand, I forgot my own fear.' }],
  ncNeedSlates: [{ my: 'ကျောက်သင်ပုန်းတွေ စုပြီးမှ ဘုတ်ပေါ် ပြန်ချိတ်မယ်။ ကျန်တာတွေက ဗလာစာအုပ်ရပ်ထဲမှာ။', en: "I'll hang them once they're all together. The others are still in the Quarter." }],
  // 6.5 slate 10 and the ordering (inside the hut)
  bhHut: [{ my: 'ဒီမှာ လေက ကျောက်သင်ပုန်းကို ယူသွားတတ်တယ်။ တဲထဲမှာ ခင်းပါ။', en: 'The wind here takes slates. Lay them out in the hut.' }],
  ncHut: [{ my: 'ဆယ်ခုမြောက်ကတော့ မလွင့်သွားဘူး။ ဘုတ်ပေါ်မှာပဲ ရှိနေတာ။ တဲထဲ သွားခင်းမယ်။', en: "The tenth never blew away. It stayed on the board. I'll lay them out in the hut." }],
  ncOrderQ: [{ my: 'ဘယ်ဟာ အရင် ချိတ်ရမလဲ။ အစ်မ စီပေးပါလား။', en: 'Which goes up first? Will you put them in order for me?' }],
  ncOrderChoices: [
    { my: '"နံပါတ်အတိုင်း စီလိုက်။ တစ်ကနေ ဆယ်။"', en: '"By number. One to ten."' },
    { my: '"အရေးကြီးတာတွေ အစ်မ အရင်ချိတ်ပေးမယ်။"', en: '"I\'ll put the important ones up first."' },
    { my: '"မနက်တိုင်း နေခြည် ဖတ်မယ့် အစီအစဉ်အတိုင်း ကိုယ်တိုင် စီပါ။"', en: '"Put them in the order you\'ll read them every morning."' },
  ],
  ncByNumber: [{ my: 'ဟုတ်ကဲ့… (တစ်ချပ် ကောက်ပြီး ရပ်သွားတယ်။ အစ်မမျက်နှာကို ကြည့်နေတယ်။)', en: "Okay… (She picks one up and stops, watching Maya's face.)" }],
  ncByNumberMaya: [{ my: '(ဒါ ရေးခဲ့တဲ့ အစီအစဉ်။ သူ ဖတ်မယ့် အစီအစဉ် ဟုတ်ချင်မှ ဟုတ်မယ်။)', en: "(That's the order they were written in. Maybe not the order she'll read them in.)" }],
  ncMaya: [{ my: '(လက်ကို နောက်ဆုတ်ပြီး ကျွန်မကိုပဲ ကြည့်နေတယ်။)', en: '(She steps back, hands at her sides, watching me.)' }],
  ncMayaMaya: [{ my: '(ကျွန်မလက်က သူ့ဘုတ်ပြားပေါ် ရောက်နေပြီ။ မနက်တိုင်း ကျွန်မ စီတဲ့အတိုင်း ဖတ်ရတော့မှာ။)', en: "(My hand is on her board. Every morning she'd be reading my order.)" }],
  ncOwn: [
    { my: 'သော့က ပထမ။ မနက်ဖြန် ကိုယ့်သေတ္တာကို ကိုယ်ဖွင့်ရမှာ။ ပြီးတော့ ကြောက်လို့ရတယ်… ကြောက်မှာ သေချာတယ်။', en: 'The key first: tomorrow I open my own locker. Then afraid-is-allowed… because I will be.' },
    { my: 'ပြီးရင် မှားရင် တောင်းပန်။ ပြုံးထား… (ကျန်တာတွေကို တိုးတိုးလေး ဖတ်ရင်း ကိုယ်တိုင် စီတယ်။)', en: 'Then sorry-and-fix. Smile… (She orders the rest herself, reading each under her breath.)' },
  ],
  ncHang: [{ my: '(ဘုတ်ပေါ်မှာ သူ့အစီအစဉ်အတိုင်း တစ်ချပ်ချင်း ကိုယ်တိုင် ချိတ်တယ်။ မြေဖြူစာတွေက ခဲတံရောင် မှိန်မှိန်လေးပဲ ရှိသေးတယ်။)', en: '(She hangs them on the board one by one, in her own order. The chalk is still a faint pencil-grey.)' }],
  mayaOrder: [{ my: '(စာအုပ်ထဲက အစီအစဉ်နဲ့ မတူဘူး။ သူ့အစီအစဉ်က သူ့အတွက် မှန်တယ်။)', en: "(Not the book's order. Hers is right for her.)" }],
  // 6.6 two keys
  ncKeys: [
    { my: 'ချိတ်မှာ သော့ နှစ်ချောင်း။ နာမည်ကတ် အလွတ်တွေ။', en: 'Two keys on the hooks. Blank name tags.' },
    { my: 'တစ်ချောင်းက ကျွန်မအတွက်။ ပုံနှိပ်တိုက်မှာ ကိုယ့်သေတ္တာ။ ကျွန်မ နာမည် ကျွန်မ ရေးမယ်။', en: "One's for me: my own locker at the print shed. I'll write my name myself." },
    { my: 'နောက်တစ်ချောင်းက… အစ်မ ကိုယ်တိုင် နာမည်ရေးပါ။', en: 'The other… write your own name, sister.' },
  ],
  mayaKey: [{ my: '(ကိုယ့်နာမည် ကိုယ်ရေးတဲ့ သော့။ ဘာကို ဖွင့်မလဲ မသိသေးဘူး။ သိမ်းထားမယ်။)', en: "(A key with my own name, written by me. I don't know what it opens yet. I'll keep it.)" }],
  tagNay: 'နေခြည်',
  tagMaya: 'မာရာ',
  bhBoom: [{ my: 'ဆယ်ချပ် ပြည့်ပြီ! ဘားတန်း မတင်ကြစို့!', en: "All ten! Raise the boom!" }],
  lantern: { my: 'မနက်ဖြန် မနက်ကစ', en: 'from tomorrow morning' },
  bhTea: [{ my: 'ဖွင့်ပွဲ လက်ဖက်ရည် သောက်ကြရအောင်။ တဲထဲ ဝင်ခဲ့ကြ။', en: 'Opening tea! Come inside, both of you.' }],
  // 6.7 "what do I do tomorrow?"
  hutTea: [{ my: '(ကရားထဲက လက်ဖက်ရည်ကို ခွက်နှစ်ခွက် ငှဲ့ပေးတယ်။ ဘယ်သူ့အတွက်လဲ မမေးဘူး။)', en: "(Tea from the kettle, two cups poured without asking who they're for.)" }],
  ncTomorrow: [{ my: 'မနက်ဖြန် ဟိုဘက်ရောက်ရင် ဘာအရင် လုပ်ရမလဲ အစ်မ။ ပြောပြပါ။', en: 'Tomorrow, when I get over there, what do I do first, sister? Tell me.' }],
  ncTomorrowChoices: [
    { my: '"မနက် အစ်မဆီ အရင်လာခဲ့။ ဘာလုပ်ရမလဲ ပြောပြမယ်။"', en: '"Come to me first in the morning. I\'ll tell you what to do."' },
    { my: '"ပုံနှိပ်ဆရာ ပြောသလို လုပ်။"', en: '"Do what the printer tells you."' },
    { my: '"အခက်ကြုံရင် အစ်မကို ရှာ။ အစ်မ ဖြေပေးမယ်။"', en: '"If you get stuck, find me. I\'ll answer."' },
  ],
  ncThanks: [{ my: 'ကျေးဇူးပဲ အစ်မ။ အစ်မ ပြောရင် စိတ်ချရတယ်။', en: 'Thank you, sister. When you say it, I feel safe.' }],
  ncUnderBoard: [{ my: 'ဘုတ်အောက်မှာ ခဏ ရပ်နေဦးမယ်။', en: "I'll stand under the board a while." }],
  ncAfter: [{ my: 'သော့က ကျွန်မလက်ထဲမှာ။ မနက်ဖြန်… အစ်မ ပြောတဲ့အတိုင်း လုပ်မယ်။', en: "The key's in my hand. Tomorrow… I'll do as you said, sister." }],

  // ---- 7. other people (ambient: they hint, never point)
  ttA: [
    { my: 'ကျွန်တော့်ခန်းမှာ "မာရာ" က ပဲပင်တွေကို ရွှေ့ပေးတယ်တဲ့။ ကျွန်တော် ကိုယ်တိုင် ရွှေ့ခဲ့တာလေ!', en: 'In my scene "Maya" moves my beans for me. I moved them myself!' },
    { my: 'ဒီနေ့မေးခွန်း: စင်နာရီက ဘယ်သူမှ မကြည့်ရင်ရော လည်နေသေးလား။', en: "Today's question: does the stage clock keep going when nobody's looking?" },
  ],
  snA: [
    { my: 'စင်နာရီက ရပ်နေတာ ကြာပြီတဲ့။ ကျွန်မတော့ မကြည့်ဖူးဘူး။', en: "They say the stage clock stopped long ago. I've never checked." },
    { my: 'ခုံ လေးလုံး ကျန်သေးတယ်။ ကျောင်းလှေကားပေါ်မှာ။ ရဲယဉ့်ကတော့ မသယ်ဘူး။', en: "Four benches still on the school steps. Ye Yint won't carry." },
    { my: 'မောင်ငယ် ဒီနေ့ တံဆိပ် သုံးခု ကိုယ်တိုင် ဖတ်နိုင်ပြီ။', en: 'Maung Nge read three labels by himself today.' },
  ],
  mnA: [
    { my: 'ဒီည အကောင်းဆုံး သရုပ်ဆောင်ဆု ရှိတယ်တဲ့။ ရဲယဉ့် ထပ်ရမှာပဲ။', en: "They say there's a best-actor prize tonight. Ye Yint will win again." },
    { my: 'ဒီည ပွဲတကယ်ရှိတယ်နော်! ညတိုင်းတော့ မဟုတ်ဘူး။', en: "There's a real show tonight! Not every night, though." },
    { my: 'လိုက်ကာ ဖွင့်တာ ကျွန်တော့်တာဝန်။ ကြိုးက တင်းလွန်းတယ်။', en: "Opening the curtain's my job. The knot's too tight." },
  ],
  mnAfter: [{ my: 'တစ်ချက်ဆွဲတာနဲ့ ပွင့်သွားတယ်! ဘယ်သူ ချည်ပေးလဲ သိလား။', en: 'One tug and it opened! Know who tied it?' }],
  mcA: [
    { my: 'ဒီည ရေဇလုံက ကျွန်မ အိုးတွေထဲက တစ်လုံး။ စင်မြင့်ကို ယူသွားပေးရမယ်။', en: "Tonight's water bowl is one of my pots. I have to take it to the stage." },
    { my: 'ကျွန်မခန်းမှာ "မာရာ" က ဘီးကို လှည့်ပေးတယ်တဲ့။ …ဘီးကို ကျွန်မ ကိုယ်တိုင် လှည့်ခဲ့တာ။', en: 'In my scene "Maya" turns the wheel for me. …I turned it myself.' },
  ],
  ohA: [{ my: 'မိချို တစ်နေ့ လေးလုံး၊ အကုန် ကောင်းတယ်။ ဆရာလုပ်ရတာ ကျွန်မလည်း သင်နေတုန်းပဲ။', en: "Mi Cho makes four a day, all whole. I'm still learning to teach, too." }],
  hwA: [{ my: 'ခြောက်နာရီ မီးထွန်းရင် ပွဲစမယ်။ နာရီက ဘယ်သူ့ကိုမှ မစောင့်ဘူးနော်။', en: 'At six, when the lamps light, we begin. The clock waits for nobody.' }],
  yyAfter: [{ my: 'ခုံတွေ ပေါ့တယ်နော် အစ်မ။ ဇာတ်လိုက် မဟုတ်တော့ ပိုပေါ့တယ်။', en: 'The benches are light, sister. Lighter when you\'re not the lead.' }],
  kpA: [
    { my: 'တံတားသမားတွေ ဒီနေ့ တစ်နေကုန် တူထုနေကြတယ်။ တံဆိပ်ခေါင်းအမိုးတွေ ကျော်ပြီး အရှေ့ဘက် လမ်းဆုံးမှာ။', en: 'The bridge men have hammered all day. Past the stamp awnings, where the east road ends.' },
    { my: 'ကြိုးတံတားဟောင်း ပြတ်နေပြီတဲ့။ အဲဒီကောင်မလေး ကျောက်သင်ပုန်းနဲ့ ဘယ်လိုလုပ်မလဲ မသိဘူး။', en: "They say the old rope bridge snapped. Don't know what that girl with the slates will do." },
  ],
  thA: [{ my: 'ကျောက်သင်ပုန်းအိတ်နဲ့ ကောင်မလေး ခုနက အရှေ့ဘက် ဖြတ်သွားတယ်။ ပြန်မလှည့်ဘဲ။', en: "A girl with a bag of slates went east just now. Didn't look back." }],
  ttnA: [{ my: 'ဒီနေ့ တံတားဖွင့်တဲ့နေ့။ ဒီခွက်က ဘယ်သူ့ဆီကမှ ပိုက်ဆံ မယူဘူး။ သောက်သွား။', en: "Bridge-opening day. I'm not taking money for this cup from anyone. Drink." }],
  childName: { my: 'ကလေးလေး', en: 'A small child' },
  childShop: [{ my: '(စာအုပ်တစ်အုပ် ယူပြီး ရင်ခွင်ထဲ ဖက်ထားတယ်။)', en: '(She takes a book and hugs it to her chest.)' }],

  // ---- 8.1 the Fold's Bookmark Desk
  deskFoldQ: { my: 'ဒီနေရာအကြောင်း ကိုယ်တိုင် မြင်ရတာကို ရေးမယ်။', en: 'Write what you can see here yourself.' },
  deskFold: [
    { my: 'ဈေးလက်ဖက်ရည်ဆိုင်လမ်းကနေ ဒီအထိ ဖဲကြိုးတံတား တည့်တည့် ရှိတယ်။', en: 'A ribbon bridge runs straight here from the Market tea street.' }, // the Painted Map (Day 4)
    { my: 'ကြိုးတံတားဟောင်းက ပြတ်ကျနေပြီ။', en: 'The old rope footbridge has fallen.' }, // heard (bridge hand)
    { my: 'တံတားသစ်ဝမှာ ဘားတန်း ချထားတယ်။ ဘေးမှာ ကြိုးတံတားဟောင်း လွှဲနေတယ်။', en: 'A boom is down across the new bridge. Beside it the old rope bridge sways.' }, // true
  ],
  deskFoldAfter: { my: 'တံတားသစ်ရဲ့ ဘားတန်း တင်ထားတယ်။ မီးတွေ လင်းနေတယ်။', en: "The new bridge's boom is up, its lamps lit." },
  deskWrong: { my: '(ဒါ ကြားခဲ့တာ၊ ဒါမှမဟုတ် ဆေးခြယ်ထားတာ။ မျက်လုံးနဲ့ ပြန်ကြည့်ပါဦး။)', en: "(That's heard, or painted. Look again.)" },
  deskDone: [{ my: 'ဖဲကြိုး တက်သွားပြီ။ စာမျက်နှာ ခေါက်ရိုးကနေ အိမ်ကို လှန်လို့ရပြီ။', en: 'The ribbon is up. From the fold of the page I can turn home.' }],
  deskStage: [{ my: '(စင်ပေါ်က နာရီက လည်နေတယ်။ ကိုယ်တိုင် မြင်ရတယ်။)', en: '(The clock on the stage is running. I can see it myself.)' }],

  // ---- 8.3 the reply line
  replyTitle: { my: 'စာကို ပြန်စာ', en: 'Reply to the letter' },
  reply: { my: 'သူတို့ စင်ပေါ်မှာ "မာရာ" မပါလည်း ပြဇာတ်က ပြီးသွားတယ်။', en: 'Without a "Maya" on their stages, the play still came to its end.' },

  // ---- 9. the night page
  mayaWrite: [{ my: 'ဒီနေ့အကြောင်း စာရေးခန်းမှာ ပြန်ရေးမှ ဖြစ်မယ်။', en: 'I should write today down at my Writing Room.' }],
  nightQ: { my: 'ဒီနေ့အကြောင်း မှန်မှန်ကန်ကန် ဘယ်လို ရေးမလဲ။', en: 'How will she write today, truthfully?' },
  nightChoices: [
    { my: 'ကျွန်မ မရှိရင် ပြဇာတ်လည်း၊ တံတားလည်း ဖြစ်လာမှာ မဟုတ်ဘူး။', en: "Without me there'd have been no play and no bridge." },
    { my: 'ရဲယဉ့်က ခန်းတိုင်းကို ပိုင်ရှင်တွေဆီ ပြန်ပေးပြီး ခုံအတူသယ်တယ်။ နေခြည်က ကျောက်သင်ပုန်းတွေကို ကိုယ့်အစီအစဉ်နဲ့ ချိတ်တယ်… ပြီးတော့ မနက်ဖြန်အတွက် ကျွန်မကို မေးတယ်။ ကျွန်မ ဖြေလိုက်တယ်။', en: 'Ye Yint gave every scene back to its owner and carried benches with everyone. Nay Chi hung her slates in her own order… then asked me about tomorrow, and I answered.' },
    { my: 'ပြဇာတ်ထဲမှာ "မာရာ" မလိုတော့ဘူး။ ဘယ်သူမှ ကျွန်မကို မလိုတော့ဘူး။', en: 'The play didn\'t need "Maya". Nobody needs me any more.' },
  ],
  nightWrong: [
    [{ my: '(မဟုတ်ဘူး… ဒါ ချော့ပြောတာ။ သူတို့ကိုယ်တိုင် လုပ်ခဲ့ကြတာ။)', en: '(No… that flatters. They did it themselves.)' }],
    [],
    [{ my: '(မဟုတ်ဘူး… ဒါ အားလျှော့ပြောတာ။ နေခြည်က ဒီညတောင် မေးသေးတယ်။)', en: '(No… too gloomy. Nay Chi asked me something only tonight.)' }],
  ],
  sleepQ: { my: 'ဒီည မှတ်စုစာမျက်နှာလေး ဘယ်သူ့အိမ်မှာ အိပ်မလဲ။', en: "Whose house does tonight's notebook page sleep at?" },
  stamp4: { my: 'စာမျက်နှာ ၄ — ပြောင်းလဲခြင်း\nကိုယ့်ဇာတ်ခုံမှာပဲ ကိုယ်က ဇာတ်လိုက်။ တခြားသူ တစ်ယောက်အတွက်လည်း မှန်ကြောင်း ကိုယ်တိုင် တွေ့ခဲ့ပြီ။', en: 'Page 4 — Change\nEach leads only on their own stage. She saw for herself that it holds for someone else too.' },
  stamp11: { my: 'စာမျက်နှာ ၁၁ — သင်ခန်းစာတိုများ\nသော့က ကိုယ့်လက်ထဲမှာ။ (ကျောက်သင်ပုန်းတွေ ခဲတံရောင် ရှိသေးတယ်။)', en: 'Page 11 — Short Lessons\nThe key is in your own hand. (Her slates are still pencil-grey.)' },
  part1: { my: 'ပထမပိုင်း ပြီးပြီ — စာမျက်နှာ ၁ မှ ၁၁', en: 'Part One done — pages 1 to 11' },
  tomorrow: { my: 'နောက်တစ်နေ့ မနက် ရောက်ပြီ။ တံတား ပွင့်နေပြီ။', en: 'Morning comes. The bridge is open.' },
};

/** Nay Chi's own order for the board (day7-spec 6.5): slate numbers, first to last. */
export const NC_ORDER = [10, 6, 4, 2, 1, 7, 9, 3, 5, 8];
