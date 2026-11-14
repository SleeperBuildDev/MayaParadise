// Day 10's words (day10-spec.md 4-9). Every Burmese line is a DRAFT for Maya to proofread («draft: Maya»).
// Kept apart from day10.js so the script stays readable. The talks' own words are in talks/day10.js.

const l = (my, en) => ({ my, en });

export const L = {
  // ---- 4. morning at home
  ww1: [l('မာရာရေ… မှတ်စုစာမျက်နှာလေး ပြန်ရောက်လာပြီ။ စာတစ်ကြောင်း ရေးပေးလိုက်တယ်တဲ့။', 'Maya… your notebook page is back. They wrote you a line.')],
  ww2: [l('မောင်အာကာဆီကလည်း စာလေး ပါလာတယ်။', 'And a note from Maung Arkar.')],
  mlNote: l('အစ်မ… ဒီမနက် ပထမဆုံး ပို့တဲ့ခရီးမှာ ဥယျာဉ်ထဲက အဘိုးကြီး ဥယျာဉ်မှူးကို တွေ့တယ်။\nသော့ခတ်ထားတဲ့ တံခါးနောက်ကနေ လမ်းကို တစ်နေကုန် ကြည့်နေတာ။ ဘယ်သူမှ သတိမထားမိဘူး။\nတံခါးတိုင်ပေါ်မှာ ပေါင်မုန့်တစ်လုံး တင်ခဲ့တယ်။ ဘာမှ မပြောခဲ့ဘူး။', "Sister… on my first round this morning I saw the old gardener in the Garden.\nBehind his locked gate, watching the lane all day. Nobody notices.\nI left a loaf on his gatepost. I didn't say anything."),
  ember: l('(မနေ့က စာမျက်နှာပေါ်က မီးခဲလေးတစ်ခု အာကာ့ထွက်လာတယ်။) အေးသွားပြီ။ ဘယ်သူ့ကိုမှ မလောင်တော့ဘူး။', "(A little ember floats up off yesterday's page.) Cooled. It burns nobody now."),
  emberMaya: [l('ပစ်ဖို့ ကောက်ကိုင်ရင် ကိုယ့်လက်ပဲ အရင်ပူတာ… နင်လည်း လိုက်ခဲ့မလား။', 'Pick it up to throw and your own hand burns first… Coming with me?')],
  ww3: [
    l('ပြီးတော့… မီးဖိုတန်း အဆုံးက ဒိုင်ယာရီ ချိတ်ကြီး ညက ပွင့်သွားပြီတဲ့။ အထဲမှာ နေ့စဉ်မှတ်တမ်းဥယျာဉ်။', 'And… the great diary clasp at the end of Hearth Row came open in the night, they say. The Diary Garden is inside.'),
    l('ကိုဖြိုးလည်း ဈေးက စက္ကူအဟောင်းတွေကို အဲဒီကို လှည်းနဲ့ တွန်းသွားတာ မြင်တယ်။ အလေးချိန်နဲ့ ဝယ်တာတဲ့။', "I've seen Ko Phyo pushing the market's old paper down there on his cart. They buy it by weight."),
    l('အထဲက အဘိုးကြီး ဥယျာဉ်မှူးက ခြံတံခါး သော့ခတ်ထားတယ်။ တံခါးမှာ ခွေးကြီး ချည်ထားတယ်လို့လည်း ကြားတယ်။', "And the old gardener in there keeps his gate locked. I heard he's tied a big dog at it."),
    l('နေခြည်လည်း မနက်က ဘုတ်ကို လာဖတ်သွားတယ်။ ဘာစာရွက်မှ မကပ်သွားဘူး။', "Nay Chi came and read the board this morning. She didn't pin anything."),
  ],
  wwLater: [l('ဥယျာဉ်က မီးဖိုတန်းရဲ့ အရှေ့ဘက် အဆုံးမှာ။ မနေ့က ပိတ်နေတာ ဒီနေ့ ပွင့်နေပြီ။ ဘာမှ အမြဲ တစ်မျိုးတည်း မနေဘူးလေ။', "The Garden's at the east end of Hearth Row. Shut yesterday, open today. Nothing stays one way for ever.")],
  wwEvening: [l('မာရာ… ဒီနေ့ ဘုတ်ကနေ စာရွက်တစ်ရွက် ပြုတ်သွားတယ်။ ကပ်ခဲ့တဲ့သူ ကိုယ်တိုင် လာဖြုတ်သွားတာ။ ပထမဆုံး တစ်ရွက်ပဲ။', 'Maya… a note came off the board today. The one who pinned it came and took it down himself. The very first.')],
  wwAfterBoard: [l('ကွက်လပ်လေး ဒီအတိုင်း ရှိပါစေ။ ညနေ စာတွေ ခွဲလိုက်ဦးမယ်။', "Let the gap be. I'll get on with the evening post.")], // (new, draft)

  // arrival (first step under the clasp)
  carter: [l('နေဝင်ရင် ချိတ်ကြီး ပြန်ပိတ်တယ်နော်! အထဲမှာ ပိတ်မိနေမယ်!', "The clasp shuts again at sunset, mind! You'll get locked in!")],
  arriveMaya: [l('နေ့စွဲမျဉ်းတိုင်းမှာ ပန်းခင်းတစ်ခု။ မနေ့ကဟာတွေ ညှိုးစပြုပြီ၊ ဒီနေ့ဟာတွေ ပွင့်နေတယ်။', "A flower bed on every dated line. Yesterday's are starting to wilt; today's are in flower.")],

  // ---- 5. chapter 16 · U Hpo Htaw
  hpShut: [l('တံခါး ပိတ်ထားတယ်။', 'The gate is shut.')],
  hp1: [
    l('တံခါး သော့ခတ်ထားတာ မမြင်ဘူးလား။ လူတွေက နွယ်ပင်တွေပဲ။ ဝင်လာရင် အကုန် ရစ်ပတ်ပြီး ဆွဲချတယ်။', "Can't you see the gate's locked? People are creepers. Let them in and they wind round everything and pull it down."),
    l('အကြံပေးဖို့ လာတာဆိုရင် မလိုဘူး။ တစ်ယောက်တည်း နေတာ အေးတယ်။', "If you've come with advice, don't. Alone is peaceful."),
  ],
  hpChoices: [
    l('"လူတိုင်း နွယ်ပင် မဟုတ်ပါဘူး ဦး။ တံခါးဖွင့်လိုက်ပါ။"', '"Not everyone\'s a creeper, Uncle. Open the gate."'),
    l('"ဟုတ်ပါတယ်။ လူတွေကို အကုန် ပိတ်ထားလိုက်။"', '"You\'re right. Shut them all out."'),
    l('"တစ်ယောက်တည်း နေတာ မမှားပါဘူး။ တံခါးအပြင်က ခုံလေးမှာ ခဏ ထိုင်ခွင့်ရမလား။"', '"Being alone isn\'t wrong. May I sit on the bench outside your gate a while?"'),
  ],
  hpArgue: [l('ကြည့်… စကားတစ်ခွန်းနဲ့တင် ရစ်ပတ်လာပြီ။', 'See… one sentence in and already winding round me.')],
  hpArgueMaya: [l('(သူ့တံခါးကို ကျွန်မ ဆုံးဖြတ်ပေးနေမိပြီ။)', '(I was deciding his gate for him.)')],
  hpAgree: [l('…ဟုတ်တယ်။ (မပြုံးဘူး။ မျက်လုံးက လမ်းပေါ် ပြန်ရောက်သွားတယ်။)', "…Right. (He doesn't smile. His eyes go back to the lane.)")],
  hpAgreeMaya: [l('(သူ့နာကျည်းချက်ကို မီးထပ်မွှေးလိုက်သလိုပဲ။)', '(That only fanned his grudge.)')],
  hpSit: [l('အပြင်ဘက် ခုံက လမ်းပိုင်။ ထိုင်ချင် ထိုင်။ စကားတော့ များများ မပြောနဲ့။', "The bench outside belongs to the lane. Sit if you like. Just don't talk much.")],
  hpBench: [l('ခုံက လမ်းပိုင်ပဲ။', "The bench is the lane's.")],
  mayaBench: [l('(ဒီခုံကနေ သံတိုင်ကြားက အထဲကို မြင်ရတယ်။)', '(From this bench I can see in through the bars.)')], // (new, draft: she says what she sees, nothing more)
  looked: [l('တံခါးက ပိတ်ထားတယ်။ စိတ်ကတော့ လမ်းပေါ်မှာ။', 'The gate is shut. His mind is out in the lane.')],
  hook: [l('(ပေါက်ပြား ချိတ်ရမယ့်နေရာ။ ချိတ်က လွတ်နေတယ်။)', '(Where a hoe should hang. The hook is empty.)')],
  heardWas: (p) => ({ my: `(ကြားခဲ့တာက «${p.my}»…)`, en: `(What I'd heard: "${p.en}"…)` }),

  sortIntro: [l('ဦးနဲ့ ဆက်နေတဲ့ အရာတွေကို စာရွက်လေးတွေပေါ် ရေးကြည့်ရအောင်လား။', "Shall we write the things you're tied to on slips?")],
  sorted: [l('တံခါး ပိတ်ထားတာတောင် ရစ်ပတ်နေတုန်းပဲလား။', "Even with the gate locked, I'm still winding round things?")],
  tendrilAsk: [l('ငါ့လက်က တုန်တယ်။ ဒီသုံးချောင်း တိုင်ဆီ လမ်းပြပေး။ အပင်ငယ်ကို မရစ်စေနဲ့။', "My hands shake. Lead these three to the post. Don't let them take the sapling.")],
  tendrilDone: [l('ထိပြီး လွှတ်လိုက်တာ… ဆက်တော့ ဆက်နေတာပဲ။ အပင်ငယ်လည်း မညွတ်တော့ဘူး။', 'Touched, then let go… still connected. And the sapling has stopped bending.')],
  voices: [l('ဒီအသံတွေ အကုန် ညလုံးပေါက် ကြားယောင်နေတာ။', 'I hear every one of these all night.')],
  voicesMaya: [l('ကြားရတာ အကုန် စိတ်ထဲ ထည့်ရမှာလား ဦး။', 'Does everything you hear have to go inside, Uncle?')],
  beansCall: [l('ပဲနွယ်ကို မနက်ဖြန် ပြန်ချည်ပေးမယ်!', "I'll tie the beans back tomorrow!")],
  lanesDone: [l('ကိုယ်နဲ့ ဆိုင်တာကိုပဲ နားထောင်… ကျန်တာ အာကာ့သွားပါစေ။', "Listen to what's mine… let the rest blow past.")],
  hpBulbs: [
    l('ပန်းဥဆိုတာ အံဆွဲထဲ သိမ်းထားရင် ပုပ်သွားတာပဲ။ ဘာမှ ထာဝရ မနေဘူး။ ကောင်းတုန်း ဝေလိုက်ရတယ်။', "Keep bulbs in a drawer and they rot. Nothing stays for ever. You give them out while they're good."),
    l('နေရောင်ရတဲ့ မြေထဲမှာ ငါးည အိပ်ရမယ်။ တစ်ညတည်းနဲ့ ပွင့်တယ်ဆိုတာ လူတွေ ပြောတာ။', "Five nights asleep in sunny soil. 'Flowers in one night' is just what people say."),
    l('မိုးရွာရွာ မရွာရွာ မြေအောက်မှာ အိပ်နေတာ။ ပေါက်ချိန်ကျ ပေါက်မှာပဲ။', "Rain or no rain, they sleep under the soil. They'll come up when it's time."),
  ],
  mugDown: [l('(ခွက်လေးကို ခုံပေါ် ချထားလိုက်တယ်။ နားထောင်ဖို့ပဲ။)', '(She sets her mug down on the bench. Only to listen.)')], // (new, draft)
  hpWait: [l('ခဏ… ငါ့ဘာသာ စဉ်းစားပါရစေ။', 'A moment… let me think on my own.')],
  hisGate: [l('(သူ့တံခါး။ သူ့ဆုံးဖြတ်ချက်။)', '(His gate. His decision.)')],
  hpAfter: [l('လာချင်ရင် တွန်းဝင်။ မလာလည်း ရတယ်။ ပန်းခင်းတွေကတော့ ရေလိုတယ်။', "Push it if you want to come in. Or don't, that's fine too. The beds need water either way.")],

  // ---- 6. chapter 17 · Ko Phyo and U Kyi Nyein
  kn1: [
    l('ကိုဖြိုး၊ စက္ကူထုပ်ကို အခြောက်လိုက် ချိန်ရင် ရှုံးတယ်ကွ။ ကြည့်… ကျုပ်ထုပ်က မနေ့က ကိုးပိဿာ။', 'Ko Phyo, weigh your bales dry and you lose out. Look… this bale of mine was nine viss yesterday.'),
    l('ရေနည်းနည်း ဖျန်းလိုက်တော့ ဆယ့်တစ်ပိဿာ။ စက်ရုံက အလေးချိန်နဲ့ ပေးတာ။', "A sprinkle of water, and it's eleven. The mill pays by weight."),
    l('ဝယ်သူက မေးရင် "မနက်ခင်း နှင်းစိုတာ" လို့ ပြောလိုက်။ မြို့က ဝယ်သူက ဘာသိမှာလဲ။', "If the buyer asks, say 'it's the morning dew'. A buyer from town — what would he know?"),
    l('ကျုပ်ဂိုဒေါင်က ခေါင်မိုးထိ ပြည့်နေပြီ။ ခင်ဗျား လှည်းလေးနဲ့ ဘယ်တော့ ရောက်မှာလဲ။', "My store's full to the roof. With your little cart, when will you ever get there?"),
  ],
  knCan: [l('ရော့… ရေပုံး ထားခဲ့မယ်။ ဒီည သုံးချင် သုံး။', "Here… I'll leave the can. Use it tonight if you like.")],
  mayaDoors: [l('(လက်က ရေဖျန်း၊ နှုတ်က နှင်းလို့ပြော၊ စိတ်က ဝယ်သူကို အထင်သေး… တံခါး သုံးပေါက်လုံးကနေ။)', "(The hand sprinkles, the mouth says 'dew', the mind thinks the buyer a fool… through all three doors.)")],
  kpOff: [l('လက်ဖက်ရည် တစ်ခွက် သွားသောက်လိုက်ဦးမယ်။ ထောင့်ဆိုင်မှာ။', "I'm off for a cup of tea. The corner shop.")],
  kpMutter: l('ကိုးလား… ဆယ့်တစ်လား…', 'Nine… or eleven…'),
  kp1: [
    l('မာရာ… ဈေးက စက္ကူအဟောင်းတွေ ဒီမှာ ရောင်းပြီး လက်ဖက်ခြောက်ဖိုး ကိုယ်တိုင် ရှာတာ။ အဲဒီနေ့ကတည်းက။', "Maya… I sell the market's old paper here and earn my tea-leaf money myself. Ever since that day."),
    l('ဦးကြည်ငြိမ်းက ချမ်းသာတယ်။ ဂိုဒေါင်အပြည့်။ ကျွန်တော်က လှည်းတစ်စီး။', "U Kyi Nyein's rich. A full store. Me, one cart."),
    l('ဝယ်သူက မနက် အာရုဏ်တက်ရင် လာမယ်။ ဒီည လှည်းဘေးမှာပဲ အိပ်မယ်။ သူ့ဆိုင် မျက်နှာချင်းဆိုင် ကန်ပေါ်မှာ။', "The buyer comes at dawn. I'll sleep by my cart tonight. On the kerb across from his store."),
    l('မီးထွန်းချိန်လောက် လှည်းဘေး လာထိုင်ပါလား။ …တစ်ယောက်တည်း စဉ်းစားရမှာ ကြောက်တယ်။', "Come and sit by my cart when the lamps are lit? …I'm scared to think it over alone."),
  ],
  kpNotYet: [l('မီး မထွန်းရသေးဘူး။ စက္ကူထုပ်တွေ စီရဦးမယ်။', "The lamps aren't lit yet. I've bales to stack.")],
  kpAtCartEarly: [l('ကိုဖြိုး ထောင့်ဆိုင်မှာ လက်ဖက်ရည် သောက်နေတယ် ထင်တယ်။', "Ko Phyo's having tea at the corner shop, I think.")], // (unused fallback)
  duskClasp: [l('မီးထွန်းပြီ။ ချိတ်ကြီးလည်း ပွင့်လျက်ပဲ။', 'Lamps lit, and the clasp is still open.')],
  squareDone: [l('ချမ်းသာမှုက တကယ် ရှိတယ်။ အေးချမ်းမှုကတော့… မရှိဘူး။', "The wealth is real. The ease… isn't there.")],
  knCurtain: [l('ဘယ်သူလဲ! …အော်၊ ပါဆယ်ကောင်လေးလား။', "Who's there! …Oh. The parcel boy.")],
  mnParcel: [l('ညနေ ပါဆယ်ပါ ဦး။ တံဆိပ်ကို ကိုယ်တိုင် ဖတ်လာတာ!', 'Evening parcel, Uncle. I read the label myself!')],
  kpTrip: [l('ဒီမှာ ထားခဲ့ရင် တစ်ယောက်ယောက် ခလုတ်တိုက်မယ်။', "Leave it out here and someone'll trip on it.")],
  kpInside: [l('ဦးလေးဆိုင် ဖွင့်တုန်းပဲ။ အထဲမှာ ထိုင်ရအောင်။ ချိတ်လည်း ရှိတယ်။', "The uncle's still open. Let's sit inside. He has a hook, too.")],
  matched: [l('ချမ်းသာတာနဲ့ အေးချမ်းတာ… စကားလုံး တစ်လုံးတည်းလို့ ထင်ခဲ့တာ။', 'Rich, and at ease… I thought that was one word.')],
  cards2: [l('(စားပွဲပေါ်မှာ စာရွက်ကတ် နှစ်ကတ်: «ချမ်းသာ · ပေါများတာ — သူ့မှာ ရှိတယ်»၊ «သုခ · သက်သောင့်သက်သာ — သူ့မှာ မရှိဘူး»)', '(Two paper cards settle on the table: "plenty: he has it", "ease: he hasn\'t".)')],
  tuHook: [l('ဒီချိတ်က ချိတ်ပဲ။ ဘယ်သူ့ဘက်မှ မလိုက်ဘူး။', "That hook's just a hook. It takes nobody's side.")],
  kpWeight: [l('ကိုလွင် တံဆိပ်ခတ်ပေးထားတဲ့ ချိန်သီး။ ချိန်ခွင် မှန်မမှန် အရင် စစ်မယ်။', 'A weight Ko Lwin stamped for me. First we check the scale is honest.')],
  kpNine: [l('ကိုးပိဿာ။ ရေမဖျန်းရင် ကိုးပဲ။ မနက်ဖြန်လည်း ကိုးပဲ။', 'Nine viss. No water, nine. Tomorrow, still nine.')],
  kpWait: [l('ခဏ… ညကြီး ရှိသေးတယ်။', 'A while… the night is long yet.')],
  kpEnd: [
    l('ကိုလွင်က ဒီချိန်သီး နှစ်လုံး တံဆိပ်ခတ်ပေးထားတယ်။ တစ်လုံးက ကျွန်တော့်လှည်းအတွက်။', 'Ko Lwin stamped two of these weights for me. One is for my cart.'),
    l('နောက်တစ်လုံး အစ်မ ယူထားပါ။ ချိန်ခွင်တစ်ခု မှန်မမှန် စစ်ဖို့ တစ်ယောက်ယောက် လိုလာမှာပဲ။', 'Take the other, sister. Someday someone will need to check a scale.'),
  ],
  kpThanks: [l('ရေပုံး ပြန်ပို့ပါတယ် ဦး။ ကျေးဇူးပါ။', "I've brought your can back, Uncle. Thank you.")], // (new, draft: the spec gives his thank-you as a stage direction)
  knThanks: [l('…အင်း။', '…Mm.')],
  vignette: [l('ဒီည သူ့မီး အရင်ငြိမ်းတယ်။', 'Tonight his lamp went out first.')],
  kpAfter: [l('မနက် ဝယ်သူ လာရင် မျက်နှာချင်း ဆိုင်ရဲပြီ။', "When the buyer comes in the morning, I can look him in the face.")],
  storeShut: [l('(ညအတွက် ပိတ်ထားပြီ။)', '(Shut for the night.)')],
  canNot: l('(ကျွန်မ ကိုင်ရမယ့်ဟာ မဟုတ်ဘူး။)', '(Not mine to pick up.)'),

  // ---- 7. other Garden people
  ga: [
    l('ဦးဖိုးထော်က နှစ်တိုင်း ပန်းဥ လှန်းပြီး လမ်းထဲက အိမ်တိုင်းကို ဝေတာ။ လူမုန်းတဲ့လူက ဒီလို လုပ်ပါ့မလား။', 'Every year U Hpo Htaw dried bulbs and gave them to every house in the lane. Would a man who hates people do that?'),
    l('လူတွေ သူ့ပေါက်ပြား ငှားပြီး ပြန်မပေးဘူး။ သူ့အကြောင်းလည်း ပြောကြတယ်။ အဲဒီကတည်းက တံခါး ပိတ်ထားတာ။', 'People borrowed his hoe and never gave it back. And talked about him. He has kept the gate shut since.'),
    l('ပန်းဥက တစ်ညတည်းနဲ့ ပွင့်တယ်တဲ့။ ကျုပ်မြေးက ပြောတာ။ ကျုပ်ကတော့ မယုံဘူး။', "Bulbs flower in one night, my grandson says. I don't believe it."),
    l('စက္ကူထုပ် စိုရင် ပိုလေးတာပေါ့။ ဒါပေမဲ့ ဝယ်သူက စက္ကူဝယ်တာ၊ ရေ ဝယ်တာ မဟုတ်ဘူးလေ။', "Damp paper weighs more, of course. But the buyer is buying paper, not water."),
    l('လှည်းတွေလား။ လမ်းအဆုံး မီးဖိုရင်ပြင်မှာ။ ကိုဖြိုးလှည်းက အသေးဆုံး။ ဒါပေမဲ့ ခေါင်းချတာနဲ့ အိပ်ပျော်တာ သူပဲ။', "The carts? On the kiln square at the lane's end. Ko Phyo's is the smallest. But he's the one who's asleep the moment his head's down."),
  ],
  gaJar: [l('မနှစ်က သူပေးတဲ့ ပန်းဥ ထည့်ခဲ့တဲ့ ပုလင်း။ စိုက်လိုက်တယ်၊ ပွင့်တယ်၊ ကုန်သွားတယ်။ ဒါကြောင့် နှစ်တိုင်း ပြန်ဝေတာပေါ့။', "The jar his bulbs came in last year. I planted them, they flowered, they're gone. That's why he gives them out every year.")],
  gaAfter16: [l('ကျုပ်ပဲနွယ်တွေ ပြန်ချည်ပေးမယ်တဲ့။ ပြီးတော့ ပန်းခင်းဆီ ပြန်သွားတယ်။ လမ်းကို လှည့်မကြည့်တော့ဘူး။', "He says he'll tie his beans back off my gourds. Then he went back to his beds. He doesn't look at the lane any more.")],
  gaFence: [l('(ခြံစည်းရိုးကျော်ပြီး) ဦးရေ… ဒီနှစ် ပန်းဥ ရှိသေးလား။', '(over the fence) Uncle… any bulbs this year?')], // her voice during 5.5 (from the sort card)
  gaFritters: [l('(ဘူးသီးကြော် နံ့ မွှေးနေတယ်။)', '(The gourd fritters smell wonderful.)')], // (new, draft)
  gaWindow: [l('(ပြတင်းပေါက်ကနေ သူ့ကိုယ်ပိုင် ဘူးစင်ကိုပဲ မြင်ရတယ်။)', '(The window shows only her own gourd trellis.)')], // (new, draft)
  mn: [
    l('ဒီဥယျာဉ်ထဲက ပါဆယ်တွေ ကျွန်တော် ပို့တယ်။ တံဆိပ်တွေ ဖြည်းဖြည်း ဖတ်တတ်လာပြီ!', "I deliver the Garden's parcels now. I can read the labels, slowly!"),
    l('တတိယခြံက အဘိုးရဲ့ တံခါးမှာ ခေါင်းလောင်းလေး ရှိတယ်။ ဘယ်သူမှ မဆွဲရဲဘူး။ ကျွန်တော် ဖြတ်သွားပြီလား ခဏခဏ မေးတယ်တဲ့။', "The grandpa in the third plot has a little bell on his gate. Nobody dares ring it. He keeps asking if I've gone by yet, they say."),
    l('အဲဒီ အဘိုးကြီးက လူမုန်းတယ်တဲ့။ လမ်းက လူတွေ ပြောတာ။', "They say that old man hates people. That's what the lane says."),
    l('မီးဖိုဈေးက နေ့တိုင်း စည်တယ်တဲ့။', "They say the kiln market's busy every day."),
  ],
  tu: [
    l('လှည်းသမားတွေ ဝယ်သူ မလာခင် ဒီချိတ်မှာ အရင်ချိန်ကြတယ်။ ချိတ်က ဘယ်သူ့ကိုမှ မချော့ဘူး။', 'The carters weigh at that hook before the buyer comes. A hook flatters nobody.'),
    l('ဈေးနေ့လား။ ပြက္ခဒိန်မှာ ဝိုင်းထားတယ်လေ။ ခုနစ်ရက်တစ်ခါ။ ကြားတာထက် ကိုယ်တိုင် ကြည့်တာ ကောင်းတယ်။', "Market day? It's ringed on the calendar. Every seventh day. Better to look than go by what you hear."),
  ],
  tuDusk: [l('အဲဒီ မီးကလည်း ညတိုင်း လင်းတာပဲ။ ကျုပ်ကတော့ ကိုယ့်ဆိုင် ပိတ်ပြီး အိပ်တာပဲ။', "That light's on every night. Me, I shut my shop and sleep.")],
  tuStools: [l('(ဦးလေးက ခုံတွေ စားပွဲပေါ် ပြန်တင်နေပြီ။ ဆိုင်ပိတ်ချိန်။)', '(The uncle is putting the stools up. Closing time.)')], // (new, draft)
  calendar: [l('(ခုနစ်ရက်တစ်ခါ အနီနဲ့ ဝိုင်းထားတယ်။ နောက်တစ်ဝိုင်းက သုံးရက်နေရင်။)', '(Every seventh day ringed in red. The next ring is three days on.)')], // (new, draft)
  ko: [
    l('ဗလာစာအုပ်ရပ် အရှေ့လမ်းက လာတာ။ ဒီလ တစ်လလုံး နေ့တိုင်း အိုးအရေအတွက် တစ်မျိုးစီ စမ်းနေတာ။', "I'm from the Quarter's east street. All this month I've tried a different number of pots every day."),
    l('စက္ကူဆိုင်ပိုင်ရှင် အိမ်ပေါ်က မီးက တစ်ညလုံး လင်းနေတယ်တဲ့။', "They say the light above the paper store burns all night."),
  ],
  koNote: [l('မာရာ… ကျွန်တော် စာတိုက်နံရံမှာ စာရွက် ကပ်ခဲ့တယ်။ "တစ်နေ့ အိုးဘယ်နှလုံး လုပ်ရမလဲ" ဆိုတာလေ။', 'Maya… I pinned a note on the Post Office wall. "How many pots a day?"')],
  koReply: {
    six: l('မာရာက "ခြောက်လုံး" တဲ့။ ခြောက်လုံး လုပ်ကြည့်တယ်။ နှစ်လုံး ကွဲတယ်။', 'You wrote "six". I tried six. Two cracked.'),
    teacher: l('မာရာက "ဆရာ ပြောသလောက်" တဲ့။ ဆရာက ရွာပြန်သွားပြီ… မေးစရာ လူ မရှိတော့ဘူး။', 'You wrote "as many as your teacher says". He\'s gone back to his village… nobody left to ask.'),
    four: l('မာရာက "မိချိုလို လေးလုံး" တဲ့။ လေးလုံး လုပ်ကြည့်တယ်။ ကျွန်တော့်လက်က မိချိုလက် မဟုတ်ဘူးလေ။', "You wrote \"four, like Mi Cho\". I tried four. My hands aren't Mi Cho's."),
    none: l('မာရာ့အဖြေ မလာခင်မှာပဲ ကိုယ့်ဘာသာ စမ်းကြည့်လိုက်တယ်။', 'Before any answer came, I just tried it myself.'),
  },
  koFound: [l('တစ်လလုံး တစ်နေ့တစ်မျိုး စမ်းတယ်။ ကျွန်တော့်လက်နဲ့ဆို ငါးလုံး။ ငါးလုံးဆို တစ်လုံးမှ မကွဲဘူး။', "All month I tried a different number each day. With my hands, it's five. At five, not one cracks.")],
  koTally: [l('(တစ်လလုံး သူ့လက်နဲ့ ရေတွက်ထားတာ။ အဖြေက ဒီနံရံပေါ်မှာ။ ကျွန်မ စာရွက်ပေါ်မှာ မဟုတ်ဘူး။)', '(A whole month, counted by his own hand. The answer is on this wall, not on my note.)')],
  koPots: [l('(အိုးတွေ နွေးနေတုန်း။ မီးဖိုကြီး မီးမငြိမ်းဘူး။)', "(The pots are still warm. The big kiln isn't cold.)")], // (new, draft: checks `kilncold`)
  koTrials: [l('(ကွဲတဲ့ အိုးတွေ။ သူ စမ်းခဲ့သမျှ။)', '(The cracked ones. Everything he tried.)')], // (new, draft)
  koLedge: [l('(အုတ်ခုံ နွေးနွေးလေး။ ခွက်ချထားလို့ ရတယ်။)', '(A warm brick ledge. A mug could sit here.)')], // (new, draft)
  koWait: [l('ခဏနော်… အိုးတွေ အရင် ထည့်လိုက်ဦးမယ်။', 'Just a moment… let me pack these pots first.')], // (new, draft: after a lean)
  koAfter: [l('စာရွက်ကို ကိုယ်တိုင် ပြန်ဖြုတ်မယ်။', "I'll take my note down myself.")],
  kn: [
    l('အထုပ်တွေနောက်ကို မဝင်နဲ့နော်! …စိတ်မရှိပါနဲ့။ ကျုပ်က စိုးရိမ်တတ်လို့။', "Not behind the bales, please! …Sorry. I'm the worrying kind."),
    l('အဲဒီ မီးဖိုကြီးလား။ မီးငြိမ်းနေတာ နှစ်ချီပြီ။ ကျုပ်ကတော့ အပြင် သိပ်မထွက်ဘူး။', "That big kiln? It's been cold for years. Not that I go out much."),
  ],
  knAfter17: [l('…ကောင်လေးက ရေပုံး ပြန်ပို့သွားတယ်။ ကျေးဇူးတင်တယ်တဲ့။ (မျက်လုံးအောက်မှာ အရိပ်မည်းတွေ။)', '…The lad brought my can back. Said thank you. (Dark rings under his eyes.)')],
  storeScale: [l('(ချိန်ခွင်တံက ဆယ့်တစ်ကို ညွှန်နေတုန်း။)', '(The beam still points at eleven.)')], // (new, draft)
  storeRope: [l('(ကြိုးနောက်ကို မသွားဘူး။ သူ့နေရာ။)', "(I won't go past the rope. That's his.)")], // (new, draft)

  // ---- 8. desks, the board
  deskQ: l('ဒီနေရာအကြောင်း ကိုယ်တိုင် မြင်ရတာကို ရေးမယ်။', 'Write what you can see here yourself.'),
  deskClasp: [
    l('ဒိုင်ယာရီ ချိတ်ကြီး ပွင့်ပြီး လမ်းပေါ်မှာ ခုံးနေတယ်။ ကြိုးပြားကို သားရေအစွန်းမှာ ပြန်ခေါက်ထားတယ်။', 'The great diary clasp stands open, arched over the road, its strap folded back on the leather.'),
    l('ချိတ်ကြီး ပိတ်ထားတယ်။ ဥယျာဉ်ထဲ ဝင်လို့ မရဘူး။', "The clasp is shut. There's no way into the Garden."),
    l('လမ်းထဲက တတိယခြံတံခါးမှာ ခွေးကြီး ချည်ထားတယ်။', 'A big dog is tied at the third gate down the lane.'),
  ],
  deskKiln: [
    l('မီးဖိုကြီးဘေးက ဈေးဆိုင်တွေ ဒီနေ့ လွတ်နေတယ်။ တစ်ဆိုင်မှာ "ဒေါ်အုန်း" လို့ မြေဖြူနဲ့ ရေးထားတယ်။', 'The stalls by the big kiln are empty today. One has "Daw Ohn" chalked on it.'),
    l('မီးဖိုဈေးက နေ့တိုင်း စည်တယ်။', 'The kiln market is busy every day.'),
    l('မီးဖိုကြီးက မီးငြိမ်းနေတာ နှစ်ချီပြီ။', 'The big kiln has been cold for years.'),
  ],
  deskWrong: [l('(ဒါ ကြားခဲ့တာ။ မျက်လုံးနဲ့ ပြန်ကြည့်ပါဦး။)', "(That's what I heard. Look again.)")],
  deskDone: [l('ကိုယ်တိုင် မြင်တာကိုပဲ ရေးလိုက်တော့ ဖဲကြိုးလေး တက်လာတယ်။ ဒီကနေ စာမျက်နှာ လှန်ပြီး ပြန်လာလို့ရပြီ။', 'I wrote only what I saw myself, and the ribbon rose. I can turn the page back to here now.')],
  gapQ: l('ကွက်လပ်လေးကို ဘာလုပ်မလဲ။', 'What will she do with the gap?'),
  gapChoices: [
    l('ကွက်လပ်မှာ "ငါးလုံး မှန်တယ်" လို့ ရေးကပ်မယ်။', 'Pin "five is right" in the gap.'),
    l('ကျန်တဲ့ စာရွက်တွေ အကုန် အခုပဲ ပြန်ဖြေမယ်။', 'Answer every other note right now.'),
    l('ကွက်လပ်ကို ဒီအတိုင်း ထားမယ်။ အဲဒါ သူ့ဟာ။', "Leave the gap as it is. It's his."),
  ],
  gapSeal: [l('(သူ့အဖြေပေါ် ကျွန်မတံဆိပ် ထပ်ခတ်တာပဲ ဖြစ်မယ်။)', '(That would only stamp my seal on his answer.)')],
  gapAll: [l('(နောက်တစ်ယောက်ကိုလည်း သူ့ဘာသာ တွေ့ခွင့် ပေးရမယ်။)', '(The next one should get to find theirs too.)')],
  gapLeave: [l('ဘုတ်ပေါ်က ပထမဆုံး ကွက်လပ်။ ကျွန်မ မဖြေလိုက်လို့ ရတာ။', "The board's first gap. I got it by not answering.")],
  boardLook: [l('(ပင်အလွတ် တစ်ချောင်း။ အောက်မှာ ခဲတံနဲ့: «ကိုယ့်လက်ကို ကိုယ်ပဲ အသိဆုံး — အိုးသမား»)', '(One empty pin. Under it, in pencil: "My own hands know best — the potter".)')],
  boardEarly: [l('(ဘုတ်ပေါ်မှာ စာရွက် သုံးဆယ့်တစ်ရွက်။ ဒီနေ့လည်း မေးခွန်းတွေ စောင့်နေကြတယ်။)', '(Thirty-one notes on the board. Questions, still waiting.)')], // (new, draft)
  replyLine: l('ကိုယ့်အဖြေကို ကိုယ်တိုင် တွေ့ရင် ကျွန်မဘုတ်ပေါ်က စာရွက်ကို ကိုယ်တိုင် ပြန်ဖြုတ်ပါ။', 'When you find your own answer, take your note off my board yourself.'),

  // ---- 9. night page
  writeHome: [l('ဒီနေ့အကြောင်း စာရေးခန်းမှာ ပြန်ရေးမှ ဖြစ်မယ်။', 'I should write today down at my Writing Room.')],
  nightQ: l('ဒီနေ့အကြောင်း မှန်မှန်ကန်ကန် ဘယ်လို ရေးမလဲ။', 'How will she write today, truthfully?'),
  nightChoices: [
    l('ကျွန်မကြောင့် ဦးဖိုးထော် တံခါးဖွင့်ပြီး လူတွေနဲ့ ပြန်ပျော်နေပြီ။ ကိုဖြိုးလည်း ချမ်းသာမှုမှန်သမျှ ငြင်းလိုက်ပြီ။', 'Thanks to me, U Hpo Htaw opened his gate and is happy among people again. And Ko Phyo turned down every kind of wealth.'),
    l('ဦးဖိုးထော်က တံခါးကို သူ့ဘာသာ ဆုံးဖြတ်ပြီး လမ်းကို စောင့်ကြည့်တာ ရပ်လိုက်တယ်။ ပန်းဥတွေ ဝေပေးတယ်။ ကိုဖြိုးက စက္ကူထုပ်ကို ခြောက်ခြောက် ချိန်တယ်။ ငွေ နည်းတယ်၊ ဒီည အရင် အိပ်ပျော်တယ်။ အိုးသမားတစ်ယောက်က သူ့စာရွက်ကို သူ့ဘာသာ ဖြုတ်သွားတယ်။', 'U Hpo Htaw decided his gate himself and stopped watching the lane; he gave his bulbs away. Ko Phyo weighed his bale dry: less money, and tonight he fell asleep first. A potter took his own note off my board.'),
    l('တစ်ယောက်တည်း အေးအေး နေလို့ မရဘူး။ ရိုးရိုးသားသား နေရင် ဆင်းရဲတာပဲ ကျန်မယ်။', 'Nobody can be alone in peace. The honest only stay poor.'),
  ],
  nightWrong: [
    [l('(မဟုတ်ဘူး… ဒါ ချော့ပြောတာ။ တံခါးက သူ့ဆုံးဖြတ်ချက်။ ကျွန်မကြောင့် မဟုတ်ဘူး။ ဦးကြည်ငြိမ်းလည်း ချမ်းသာတုန်းပဲ။)', '(No… that flatters. The gate was his decision, not mine. And U Kyi Nyein is still rich.)')],
    [],
    [l('(မဟုတ်ဘူး… ဒါ အားလျှော့ပြောတာ။ ကိုဖြိုးရဲ့ မီး အရင်ငြိမ်းတာ ကိုယ်တိုင် မြင်ခဲ့တယ်။)', "(No… too gloomy. I saw Ko Phyo's lamp go out first myself.)")],
  ],
  bulbsPlant: [l('ဦးဖိုးထော်ရဲ့ ပန်းဥတွေကို တိုးတိုးရဲ့ ပဲပင်ဘေးမှာ စိုက်လိုက်မယ်။ ငါးည အိပ်ပြီးရင် ပွင့်မယ်။', "I'll plant U Hpo Htaw's bulbs beside Toe Toe's beans. Five nights' sleep, then flowers.")],
  sleepQ: l('ဒီည မှတ်စုစာမျက်နှာလေး ဘယ်သူ့အိမ်မှာ အိပ်မလဲ။', "Whose house does tonight's notebook page sleep at?"),
  stamp15: l('စာမျက်နှာ ၁၅ — သူငယ်ချင်းကောင်း\nဘယ်သူမှ မမြင်တဲ့ ဒုက္ခကို ကြားပေးတယ်။ ပြီးတော့ ကိုယ်တိုင် သူငယ်ချင်း ဖြစ်လာတယ်။', 'Page 15 — A Good Friend\nHe was heard when nobody saw his trouble; today he was the friend himself.'),
  stamp16: l('စာမျက်နှာ ၁၆ — တစ်ယောက်တည်း နေချင်ခြင်း\nဆက်ပါ၊ မနွယ်ပါနဲ့။ တခြားသူ တစ်ယောက်အတွက်လည်း မှန်ကြောင်း ကိုယ်တိုင် တွေ့ခဲ့ပြီ။', "Page 16 — Wanting to Be Alone\nConnect; don't entwine. She saw for herself that it holds for someone else too."),
  stamp17: l('စာမျက်နှာ ၁၇ — မကောင်းတာလုပ်ပြီး ချမ်းသာခြင်း\nချမ်းသာတာနဲ့ အေးချမ်းတာ မတူဘူး။ တခြားသူ တစ်ယောက်အတွက်လည်း မှန်ကြောင်း ကိုယ်တိုင် တွေ့ခဲ့ပြီ။', 'Page 17 — Getting Rich by Doing Wrong\nPlenty and ease are not the same. She saw for herself that it holds for someone else too.'),
  page17b: l('မနက်ဖြန် မနက် ကိုဖြိုး ဝယ်သူနဲ့ တွေ့မယ်။', 'Tomorrow morning Ko Phyo meets the buyer.'),
  tomorrow: l('နောက်တစ်နေ့ မနက် ရောက်ပြီ။', 'Morning comes.'),
};

/** 5.2 · through the bars (pencil = heard, gold = seen). The hook has no label. */
export const GATE_LOOKS = [
  { id: 'bell', pencil: l('ခွေးကြီး ချည်ထားတယ်', 'a big dog'), gold: l('ခွေး မရှိဘူး။ သော့ခလောက်နဲ့ ခေါင်းလောင်းလေးပဲ။ ခေါင်းလောင်းကြိုးက လမ်းဘက်ကို ထွက်နေတယ်။', 'No dog. A padlock and a little bell, its cord hanging out on the lane side.'), rumour: 'dog' },
  { id: 'loaf', pencil: l('ဘယ်သူမှ မလာဘူး', 'nobody comes'), gold: l('မနက်က တင်ထားတဲ့ ပေါင်မုန့်။ မထိရသေးဘူး။ ဒါပေမဲ့ သူ ခဏခဏ လှမ်းကြည့်နေတယ်။', 'This morning\'s loaf. Not touched. But he keeps glancing at it.') },
  { id: 'bench', pencil: l('ဘယ်သူ့မှ မလိုချင်ဘူး', 'wants nobody'), gold: l('ခုံက လမ်းဘက်ကို လှည့်ထားတယ်။ တစ်နေကုန် လမ်းကို ကြည့်နေတာ။', 'His bench faces the lane. He watches it all day.') },
  { id: 'rack', pencil: l('လှောင်ထားတာ', 'hoarding'), gold: l('ပန်းဥတွေ ဒီနှစ်လည်း လှန်းထားတယ်။ သူ့ပန်းခင်းတွေ ဆံ့တာထက် အများကြီး ပိုတယ်။', 'Bulbs drying again this year: far more than his beds could take.') },
  { id: 'visitors', pencil: l('ဧည့်သည် မုန်းတယ်', 'hates visitors'), gold: l('ဖုန်တစ်စက်မှ မတက်ဘူး။ နေ့တိုင်း သုတ်ထားတယ်။', 'Not a speck of dust. He wipes it every day.') },
  { id: 'tendril', pencil: l('နွယ်ပင်က လူလိုပဲ', 'creepers are like people'), gold: l('နွယ်ညွန့်က တိုင်ကို လွဲပြီး ဘေးက အပင်ငယ်လေးကို ရစ်ပတ်ထားတယ်။ အပင်ငယ် ကိုင်းညွတ်နေပြီ။', 'The tendril missed the post and wound round the sapling. The sapling is bending.') },
  { id: 'vine', pencil: l('ဘယ်သူနဲ့မှ မဆိုင်ဘူး', 'tied to no one'), gold: l('သူ့ပဲနွယ်က ခြံစည်းရိုးကျော်ပြီး ဘေးခြံက ဘူးစင်ပေါ် ရောက်နေတယ်။ တစ်ယောက်တည်း နေပေမဲ့ ဆက်နေတာပဲ။', "His bean vine is over the fence and up the neighbour's gourd trellis. Alone, and still connected.") },
];

/** 6.3 · what the square shows at dusk, from the kerb. */
export const SQUARE_LOOKS = [
  { id: 'store', pencil: l('လိမ်ပြီး ရထားတာ', 'all cheated'), gold: l('ဂိုဒေါင်က ခေါင်မိုးထိ ပြည့်နေတယ်။ နောက်က တဲတွေလည်း ပြည့်တယ်။ သူ တကယ် ချမ်းသာတယ်။ ဒါလည်း အမှန်ပဲ။', "Full to the roof, the sheds behind too. He really is rich. That's true too.") },
  { id: 'locks', pencil: l('သတိကြီးလို့', 'just careful'), gold: l('သော့ သုံးလုံး။ ခုနက ပိတ်ပြီးသားကို ပြန်ဆွဲစမ်းနေတယ်။ ရှိတာ ဆုံးရှုံးမှာ ကြောက်နေတာ။', 'Three locks. He tries them again though he locked them a moment ago. Afraid of losing what he has.') },
  { id: 'lamp', pencil: l('အလုပ်ကြိုးစားလို့', 'works late'), gold: l('မီးက လင်းနေတယ်။ ဘာမှ မဖတ်ဘူး။ အရိပ်က ခေါက်တုံ့ခေါက်ပြန် လျှောက်နေတယ်။ အမှန် ပေါ်လာမှာ စိုးရိမ်နေတာ။', 'Lit, and nobody reading. The shadow walks up and down. Worried the truth will come out.'), rumour: 'lamp' },
  { id: 'steps', pencil: l('သတိရှိလို့', 'watchful'), gold: l('ခြေသံ ကြားတာနဲ့ ကန့်လန့်ကာ ဆွဲဖွင့်ပြီး "ဘယ်သူလဲ" တဲ့။ လူတွေ သိသွားမှာ သံသယ ဖြစ်နေတာ။', 'At a footstep the curtain jerks: "Who\'s there?" Suspicion that people will find out.') },
];

/** Rumours (7): what is heard (pencil) and the proof slip's words once checked (new drafts). */
export const RUMOURS = {
  dog: { proof: l('ခွေး မရှိဘူး။ ခေါင်းလောင်းကြိုးက လမ်းဘက်မှာ။', 'No dog. A bell, its cord on the lane side.') },
  clasp: { proof: l('မီးထွန်းချိန်မှာလည်း ချိတ်ကြီး ပွင့်လျက်။', 'At lamp-light the clasp was still open.') },
  hates: { proof: l('နှစ်တိုင်း ပန်းဥ လမ်းထဲက အိမ်တိုင်းကို ဝေတယ်။', 'He gives bulbs to every house in the lane each year.') },
  bulbs: { proof: l('နေရောင်ရ မြေထဲမှာ ငါးည။ တစ်ည မဟုတ်ဘူး။', 'Five nights in sunny soil, not one.') },
  wet: { proof: l('ခြောက်ရင် ကိုး၊ စိုရင် ဆယ့်တစ်။ ပိုတာက ရေ။', 'Nine dry, eleven wet. The extra is water.') },
  lamp: { proof: l('စက္ကူဆိုင်အပေါ်က မီး လင်းနေတယ်။ အရိပ်က လျှောက်နေတယ်။', 'The light above the store is on; the shadow walks.') },
  market: { proof: l('ဒီနေ့ ဆိုင်တွေ လွတ်နေတယ်။ ခုနစ်ရက်တစ်ခါ ဈေးနေ့။', 'Stalls empty today. Market every seventh day.') },
  kilncold: { proof: l('မီးဖိုကြီးက မီးခိုး ပါးပါး။ အိုးတွေ နွေးနေတုန်း။', 'Thin smoke from the big kiln; the pots still warm.') },
};

/** Day 9's notebook lines (day9-spec 9, `slept9`): shown this morning from the house it slept in. */
export const SLEPT9 = {
  khinmay: l('"ပူလောင်ပြီးတောင် သင်လို့ရရင် မပူလောင်ဘဲလည်း ရတယ်။ ကိုယ်တိုင် စမ်းကြည့်ပြီးပြီ။" — ဒေါ်ခင်မေ', '"If he can learn while you burn, he can learn without it. I tried it myself." — Daw Khin May'),
  maungarkar: l('"လေးတာ အောက်ဆုံး။ ပြုံးပြဖို့ မလိုဘူး။" — မောင်အာကာ', '"Heavy at the bottom. No need to put on a smile." — Maung Arkar'),
  eimon: l('"မေးပြီးရင် နားထောင်။ အကြံက နောက်မှ။" — အိမွန်', '"Ask, then listen. Advice comes after." — Ei Mon'),
  naychi: l('"အစ်မက မေးခွန်းပဲ ပြန်မေးတယ်။ နှစ်နေရာလုံး ကိုယ်တိုင် သွားကြည့်ခဲ့ပြီ။" — နေခြည်', '"She only asks me back. I went and looked at both places myself." — Nay Chi'),
};

/** Tonight's houses (9): Day 11's morning reads `slept10` (hpohtaw and kophyo lines live in Day 11's spec). */
export const SLEPT10 = {
  gourdaunty: l('"ပဲနွယ်တွေ ပြန်ချည်ပေးသွားတယ်။ ဘူးတွေ အတူ တက်နေကြတာ ချည်မနေနဲ့လို့ ပြောလိုက်တယ်။" — ဘူးစင်အဒေါ်', '"He came to tie his beans back. I told him not to bother; they climb fine together." — the gourd aunty'),
  kaung: l('"ဒီနေ့လည်း ငါးလုံး။ မနက်ဖြန် ပြောင်းချင်ရင် ပြောင်းမယ်။ ကိုယ့်ဟာ ကိုယ် ရွေးမယ်။" — ကိုကောင်း', '"Five again today. If I want to change tomorrow, I will. My own choice." — Ko Kaung'),
  maungnge: l('"ဒီနေ့ တံဆိပ် ခုနစ်ခု ကိုယ်တိုင် ဖတ်တယ်။" — မောင်ငယ်', '"I read seven labels myself today." — Maung Nge'),
  kyinyein: l('"ဒီစာအုပ်ထဲက လူတွေ အိပ်ပျော်ကြမှာပဲ။" — ဦးကြည်ငြိမ်း', '"The people in this notebook must sleep well." — U Kyi Nyein'),
};

/** Walk-ons with no cast.js entry (their names for the dialogue box). */
export const NAMES = {
  gourdaunty: l('ဘူးစင်အဒေါ်', 'the gourd aunty'),
  carter: l('လှည်းသမား', 'a carter'),
};
