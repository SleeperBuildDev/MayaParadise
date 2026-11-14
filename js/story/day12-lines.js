// Day 12's words (day12-spec.md 4–9), kept apart from the script so day12.js stays readable.
// Every line is { my, en }; every Burmese line is a draft for Maya to proofread.
// The two talks are in talks/day12.js. SLEPT12 (tonight's hosts' lines) is what Day 13's morning reads.

const T = (my, en) => ({ my, en });

export const L = {
  // ------------------------------------------------------------------ 4. morning, inside the Writing Room
  knock: [T('(ခေါက် ခေါက်… အမိုးပေါ်မှာ မိုးသံ။ နောက်ဘက် ပြတင်းပေါက်က တဖြန်းဖြန်း ရိုက်နေတယ်။)', '(Knock, knock… rain on the roof. The back window keeps banging.)')],
  mayaIn: [T('မဝင့်ဝါ၊ အထဲ ဝင်ပါဦး။ မိုးရေတွေ စိုကုန်ပြီ။', "Ma Wint War, come in. You're soaked.")],
  ww1: [T('မာရာရေ… ညက မိုးကြီး ရွာသွားတယ်။ ဒါပေမဲ့ မှတ်စုစာအုပ်လေးကတော့ ပုဆိုးစနဲ့ ထုပ်ပြီး ခြောက်ခြောက်လေး ပြန်ရောက်လာတယ်။', 'Maya… it poured all night. But your notebook came back dry, wrapped in oilcloth.')],
  sleptOther: T('"မနေ့က စာတိုတွေ၊ ကျွန်တော်တို့ကိုယ်တိုင် လုပ်ခဲ့တာ။"', '"Yesterday\'s short pieces: we did them ourselves."'),
  ncNote: T('အစ်မ… ဒီနေ့ ဘာလုပ်ရမလဲ လာမမေးတော့ဘူး။\nနေ့စဉ်မှတ်တမ်းဥယျာဉ်က ပန်းခင်းတွေ မိုးလဲကုန်ပြီတဲ့။ ကျွန်မ သွားကူမယ်။\nသွားသင့်လား ဘယ်သူ့ကိုမှ မမေးခဲ့ဘူး။ — နေခြည်', "Sister… I won't come asking what to do today.\nThe Diary Garden's beds are flat from the rain, they say. I'm going to help.\nI didn't ask anyone whether I should. — Nay Chi"),
  ncNoteMaya: [T('(မေးမလာဘူး။ ကိုယ်တိုင် သွားတယ်။)', "(She didn't come to ask. She just went.)")],
  comp: [T('(မနေ့က စာမျက်နှာပေါ်က အဖော်လေး ထွက်လာတယ်။ မိုးစက်ထဲမှာ ခဏ ငြိမ်နေပြီး လိုက်လာတယ်။)', "(Yesterday's companion lifts off the page, sits a moment in the rain, then follows.)")],
  ww2: [
    T('မာရာ့ ပန်းခင်းလေးလည်း ကြည့်ပါဦး… မနေ့ကပဲ ပွင့်ထားတာ။', 'And look at your flower bed… it only bloomed yesterday.'),
    T('ဥယျာဉ်ထဲမှာတော့ ပိုဆိုးတယ်တဲ့။ ဦးဖိုးထော်က ခြံဝင်းတံခါးဘေး ခုံတန်းပေါ် ထိုင်ပြီး "ဘာလို့ ငါ့ကိုမှ" ပဲ ပြောနေတယ်။', 'Worse in the Garden, they say. U Hpo Htaw is sitting on the bench by his gate, saying only "why me?"'),
    T('မိုးက သူ့ပန်းခင်းကိုပဲ ရွာတာတဲ့။ ဒီလိုပဲ ကြားတာ။', "They say the rain fell on his beds alone. That's what I heard."),
    T('ဒေါ်အုန်းလည်း အဲဒီမှာ ရှိတယ်။ ခုနစ်ရက်တစ်ခါ အိုးဖိုကြီးဈေးမှာ အိုးလာရောင်းတာ။ ဒီနေ့ ပူနေပုံပဲ။', "Daw Ohn's there too. Every seventh day she sells pots at the big kiln's market. She sounded hot today."),
  ],
  wwLater: [T('ဥယျာဉ်က ကြေးညှပ်ကြီးကနေ ဝင်ရတာ။ အဲဒီဘေးက စာညှပ်ခုံ ဖဲကြိုးကို မာရာ ထောင်ထားပြီးသားလေ။ ဦးဖိုးထော့်ခြံက လမ်းကြားထဲ သုံးခြံမြောက်။', "The Garden starts at the big brass clasp; you raised the desk ribbon beside it the other day. U Hpo Htaw's is the third plot down the lane.")],
  wwBye: [T('ကဲ… ကျွန်မ စာတိုက် ပြန်မယ်။ ထီး မမေ့နဲ့နော်။', "Well… back to the Post Office. Don't forget your umbrella.")],
  // Day 11 said "it'll rain tomorrow" (rumour `rain`, pencil): today it is seen, so it inks
  rainSeen: [T('(ဦးချစ် ပြောခဲ့တဲ့အတိုင်း မိုးရွာလာပြီ။ မနေ့က ကြားတာ၊ ဒီနေ့ ကိုယ်တိုင် မြင်ပြီ။)', "(It rained, as Uncle Chit said. Yesterday I heard it; today I've seen it.)")],
  // the window desk / trunk (tapped any time today)
  desk: [
    T('(ပြတင်းပေါက် ပွင့်သွားတယ်။ သေတ္တာထဲက စာရွက်တွေ စိုရွှဲနေတယ်။ မင်တွေ ပျော့ပြီး မီးခိုးရောင် အစင်းတွေပဲ ကျန်တော့တယ်။)', '(The window blew open. The papers in the trunk are soaked; the ink has run into grey streaks.)'),
  ],
  deskPot: T('အိုးထဲ ထည့်ထားတာတွေကတော့ ခြောက်တယ်။', 'What I put in the pot is dry.'),
  deskGold: T('မြေပုံပေါ်က ရွှေမင်ကတော့ မပျက်ဘူး။ ကိုယ်တိုင်မြင်ခဲ့တာ မြင်ခဲ့ပြီးပြီ။ စာရွက်ပဲ ပျောက်တာ။', "The gold ink on the map is fine. What I saw, I saw. Only the paper's gone."),
  deskMap: T('(ခြယ်မြေပုံက အရောင်တောက်တောက် ဖြတ်လမ်းတွေ ရေထဲ ပျော်ကျသွားပြီ။)', "(The Painted Map's bright shortcuts have run off in the water.)"),
  deskNone: [T('(စိုတာက သေတ္တာအဖုံးပဲ။ စာရွက်တွေ အကုန် အိုးထဲမှာ။)', '(Only the trunk lid got wet. Every paper was in the pot.)')],
  deskAgain: [T('(စိုသွားတဲ့ စာရွက်တွေ။ ပြန်ခြောက်ရင်လည်း စာရွက်ပဲ ဖြစ်တော့မယ်။)', "(Soaked paper. When it dries, it'll just be paper.)")],
  windowLook: [T('(ပြတင်းပေါက်ကနေ ပဲခင်းကို မြင်ရတယ်။ အကုန် လဲနေတယ်။)', '(Through the window, the bean bed. All of it flat.)')],
  umbrellaOut: [T('(ထီးလေး ဖွင့်လိုက်တယ်။ ကျွန်မကိုတော့ ခြောက်အောင် ထားပေးမယ်။ တခြားဘာကိုမှ မစောင့်ပေးနိုင်ဘူး။)', "(I open the umbrella. It keeps me dry. It can't guard anything else.)")],
  bed: [
    T('(မနေ့ညက ပွင့်နေတဲ့ ပဲပင်တွေ။ အကုန် မြေကြီးထဲ လဲနေပြီ။)', '(Last night they were in flower. All of them are down in the mud.)'),
    T('ကိုယ့်ပန်းခင်းဆိုတော့ ရင်ထဲ နာတယ်။ လမ်းဘေးက မြက်တွေလည်း လဲတာပဲ။ အဲဒါကျတော့ ဘာမှ မခံစားရဘူး။', "It's my bed, so it hurts. The grass by the road went flat too, and that I don't feel at all."),
    T('ပွင့်တွေ ပြန်မလာတော့ဘူး။ ပဲတောင့်ခြောက် နည်းနည်းတော့ ကျန်သေးတယ်။', "The flowers won't come back. A few dry pods are left."),
  ],
  bedAgain: [T('(မိုးရွာနေတုန်းပဲ။ ညကျမှ ပြန်စိုက်မယ်။)', "(Still pouring. I'll plant tonight.)")],

  // ------------------------------------------------------------------ 8.1 arrival: the wet crowd at the clasp
  arrive: [T('(ကြေးညှပ်ကြီးပေါ်မှာ မိုးစက်တွေ တဖျောက်ဖျောက်။)', '(Rain drumming on the brass clasp.)')],
  crowd: [T('မာရာ ရောက်လာပြီ! ဘာကို အရင် ကယ်ရမလဲ ပြောပါဦး။ ပျိုးခင်းလား၊ စက္ကူဂိုဒေါင်လား။', "Maya's here! Tell us what to save first. The seedbeds or the paper store?")],
  crowdChoices: [
    T('"ပျိုးခင်းကို အရင်လုပ်။ ပြီးမှ ဂိုဒေါင်။"', '"The seedbeds first. Then the store."'),
    T('"ကျွန်မ မသိဘူး။ ကိုယ့်ဘာသာ စဉ်းစားကြ။"', '"I don\'t know. Work it out yourselves."'),
    T('(ဘာမှ မပြောဘဲ ရေခပ်နေပြီးသား အဒေါ်ဘေးမှာ ပုံးတစ်လုံး ကောက်ပြီး ဝင်ကူမယ်)', '(Say nothing; pick up a bucket beside the aunty already bailing)'),
  ],
  crowdTell: [T('ဟုတ်ကဲ့… (လူတိုင်း ပျိုးခင်းဘက် ပြေးသွားကြတယ်။ ဂိုဒေါင်တံခါးက ပွင့်ပြီး ကျန်ခဲ့တယ်။)', 'Right… (They all run to the seedbeds. The store door is left banging open.)')],
  crowdTellMaya: [T('(ကျွန်မ ရှေ့က ရပ်လိုက်တော့ သူတို့ ကိုယ့်မျက်စိနဲ့ မကြည့်ကြတော့ဘူး။)', '(When I stood in front, they stopped looking with their own eyes.)')],
  crowdCold: [T('…(တစ်ယောက်က ခေါင်းငုံ့သွားတယ်။)', '…(One of them looks at the ground.)')],
  crowdColdMaya: [T('(နောက်ဆုတ်တာနဲ့ ကျောခိုင်းတာ မတူဘူး။)', '(Stepping back is not the same as turning away.)')],
  crowdBeside: [
    T('(အဒေါ်က ခေါင်းညိတ်ပြီး ရေ ဆက်ခပ်တယ်။ တစ်ယောက်က ဂိုဒေါင်တံခါး ပိတ်ဖို့ ပြေးသွားတယ်။ နောက်တစ်ယောက် ပျိုးခင်းဘက် သွားတယ်။)', '(The aunty nods and keeps bailing. One runs to shut the store door; another goes to the seedbeds.)'),
    T('(ဘယ်သူမှ ကျွန်မကို မစောင့်ကြတော့ဘူး။ ဒါ ကောင်းတယ်။)', '(Nobody waits on me. Good.)'),
  ],
  crowdName: T('မိုးစိုနေတဲ့ လူအုပ်', 'the wet crowd'),

  // ------------------------------------------------------------------ 5.1 ch 19 hook
  ht1: [
    T('ကြည့်စမ်း။ တစ်ခင်းမှ မကျန်ဘူး။ ပျိုးပင်တိုင်း လဲကုန်ပြီ။', 'Look. Not one bed left. Every seedling down.'),
    T('အနှစ်လေးဆယ် ဒီခြံ စိုက်လာတာ။ ဘာလို့ ငါ့ကိုမှ ဒီလို ဖြစ်ရတာလဲ။', "Forty years I've kept this garden. Why does it have to be me?"),
    T('တံခါး? ဖွင့်ထားလိုက်တာပဲ။ ပိတ်လည်း မိုးက ဝင်လာမှာပဲလေ။', 'The gate? I left it open. Shut it and the rain comes in anyway.'),
  ],
  htMaya: [T('(ကျွန်မ ပန်းခင်းလည်း ဒီမနက် လဲသွားတာပဲ။ ဘာမှ မပြောသေးဘဲ အရင် ကြည့်မယ်။)', "(My bed went flat this morning too. I'll look first, before I say anything.)")],
  htWait: [T('ကြည့်ချင်ကြည့်။ ပြင်လို့ ရမှာ မဟုတ်ဘူး။', "Look if you like. It can't be put right.")],
  htIn: [T('မိုးထဲ ထိုင်နေလို့လည်း ပျိုးပင်တွေ ပြန်မထဘူး။', "Sitting in the rain won't stand the seedlings up.")],
  htDoor: [T('ဝင်ချင် ဝင်။ ရွှံ့ပေနေလည်း ရတယ်။', 'Come in if you like. Mud and all.')],
  htInside: [T('…(သူ နာမည်တုတ်တစ်ချောင်းကို လက်ထဲမှာ လှည့်နေတယ်။)', '…(He turns a name stick over in his fingers.)')],
  htNotYet: [T('ခဏ ငြိမ်ငြိမ်လေး ထိုင်ပါရစေဦး။', 'Let me sit quietly a while.')],
  basin: [T('(အမိုးက ယိုနေတယ်။ မိုးကို သူ မတားနိုင်ဘူး။ အောက်မှာ ဇလုံလေး ခံထားတယ်။)', "(The roof leaks. He can't stop the rain; he's put a basin under it.)")],
  hook: [T('(နံရံပေါ်က ချိတ်အလွတ်။ တစ်ချိန်က တစ်ခုခု ချိတ်ခဲ့ဖူးတယ်။)', '(An empty hook on the wall. Something hung here once.)')],
  trowelLook: [T('(သံချောင်းပေါ်က ပေါက်တူး။ ရွှံ့ ခြောက်နေတုန်း။)', '(The trowel on its nail. Yesterday\'s mud still dry on it.)')],

  // ------------------------------------------------------------------ 5.2 the six looks (pencil, then gold)
  looks: {
    sheets: { pencil: T('(ကြားတာ: «ဘာမှ မဟုတ်ဘူး»)', '(Heard: «nothing»)'), gold: T('စာရွက် တစ်ဒါဇင်လောက် ရေထဲမှာ။ လူတွေ ကျော်လျှောက်သွားကြတယ်။ ဘယ်သူ့ဟာမှ မဟုတ်လို့ ဘယ်သူမှ မငိုကြဘူး။', "A dozen sheets in the water. People step over them. Nobody's, so nobody grieves.") },
    gourd: { pencil: T('(ကြားတာ: «သူ့ခြံ တစ်ခြံတည်း»)', '(Heard: «only his»)'), gold: T('ဘူးစင်လည်း မြေကြီးထဲ လဲနေတယ်။ မိုးက ခြံတိုင်းကို ရွာတာ။', 'The gourd trellis is down too. The rain fell on every plot.') },
    sticks: { pencil: T('(ကြားတာ: «ပျိုးပင်တွေ သေကုန်ပြီ»)', '(Heard: «all dead»)'), gold: T('တုတ်ချောင်းတိုင်းမှာ "ဦးဖိုးထော့် ပျိုးပင်" လို့ ရေးထားတယ်။ နာမည်တပ်ထားတဲ့ဟာတွေမှ ပိုနာတာ။', 'Every stick reads "U Hpo Htaw\'s seedlings". What has a name on it hurts more.') },
    diary: { pencil: T('(ကြားတာ: «ဒီလို တစ်ခါမှ မဖြစ်ဖူး»)', '(Heard: «never before»)'), gold: T('စင်ပေါ်မှာ မှတ်တမ်းစာအုပ် လေးဆယ်။ မနှစ်က ဒီရက်: "မိုးကြီး၊ ပန်းခင်း လဲ"။ တစ်နှစ်စောစောကလည်း ဒီလိုပဲ။', 'Forty diaries on the shelf. Last year, this date: "Heavy rain, beds flat." The year before, the same.') },
    tin: { pencil: T('(ကြားတာ: «ဘာမှ မကျန်ဘူး»)', '(Heard: «nothing left»)'), gold: T('အဖုံးနဲ့ သံဗူး။ အထဲက မျိုးစေ့တွေ ခြောက်ခြောက်လေး။ ကိုယ့်လက်ထဲ ကျန်တာ ရှိသေးတယ်။', 'A lidded tin, the seed inside quite dry. Something is still in his hands.') },
    beans: { pencil: T('(ကြားတာ: «ကျွန်မက မထိခိုက်ဘူး»)', '(Heard: «it didn\'t touch me»)'), gold: T('ဒီမနက် ကျွန်မ ပဲခင်းလိုပဲ လဲနေတယ်။ ဒီဟာကို ဘာမှ မခံစားရဘူး။ ကိုယ့်ဟာကျတော့ နာခဲ့တယ်။', 'Down, just like my bed this morning. This one I hardly feel; mine, I minded.') },
  },
  lookAgain: T('(ကိုယ့်မျက်စိနဲ့ ပြန်ကြည့်မယ်။)', "(I'll look with my own eyes.)"),
  diaryBefore: [T('(သူ့ မှတ်တမ်းစာအုပ်။ သူ ဒီနားကို မရောက်သေးဘဲ မဖွင့်ချင်ဘူး။)', "(His diary. I won't open it before he's here.)")],
  lookedAll: [T('မိုးက လူတိုင်းဆီ ရောက်တာပဲ။ "ငါ့ဟာ" လို့ ခေါ်ထားတာမှ နာတာ။', 'The rain came to everyone. Only what we called "mine" hurts.')],
  lookedHt: [T('…(ဦးဖိုးထော် ဘာမှ မပြောဘူး။ နာမည်တုတ်တစ်ချောင်းကို လှန်ကြည့်တယ်။)', '…(U Hpo Htaw says nothing. He turns one name stick over.)')],

  // ------------------------------------------------------------------ 5.3 sort: mine to steer / not mine
  sort19: {
    title: T('ဦးဖိုးထော့် မနက်ခင်း', "U Hpo Htaw's morning"),
    hint: T('ကိုယ် ထိန်းလို့ရတာ / ကိုယ် ထိန်းလို့မရတာ', 'Mine to steer / not mine to steer'),
    baskets: [
      { id: 'mine', label: T('ငါ ထိန်းလို့ရတာ', 'Mine to steer') },
      { id: 'not', label: T('ငါ ထိန်းလို့ မရတာ', 'Not mine to steer') },
    ],
    cards: [
      { basket: 'not', ...T('ညက မိုး', "Last night's rain") },
      { basket: 'not', ...T('နောက်နှစ် မိုး', "Next year's rain") },
      { basket: 'not', ...T('အိမ်နီးချင်းတွေ ကူချင်မကူချင်', 'Whether the neighbours come to help') },
      { basket: 'not', ...T('လမ်းထဲက လူတွေ ငါ့အကြောင်း ဘာပြောပြော', 'What people in the lane say about me') },
      { basket: 'mine', ...T('ဒီမိုးကို ငါ ဘယ်လို လက်ခံမလဲ', 'How I take this rain') },
      { basket: 'mine', ...T('နောက်တစ်နာရီ ဘာလုပ်မလဲ', 'What I do in the next hour') },
      { basket: 'mine', ...T('သံဗူးထဲက မျိုးစေ့', 'The seed in the tin') },
      { basket: 'mine', ...T('နောက်နှစ်အတွက် ပျိုးခင်းအမိုး', 'A cover for the seedbed next season') },
    ],
    wrongMine: T('ဟင့်အင်း… အဲဒါ ငါ့လက်ထဲမှာ မရှိဘူး။', "No… that one isn't in my hands."),
    wrongNot: T('ဟင့်အင်း… အဲဒါကတော့ ငါ့လက်ထဲမှာ ရှိတယ်။', '…No. That one is in my hands.'),
  },
  sortIntro: [T('မနက်ကတည်းက ခေါင်းထဲမှာ ရှုပ်နေတာ။ ခွဲကြည့်မယ်။ …ခြင်းတောင်းကို ကိုင်ထားပေး။', "It's been tangled in my head all morning. I'll sort it. …Hold the basket steady.")],
  sortDone: [T('ထိန်းလို့ မရတာ လေးခု။ ထိန်းလို့ရတာလည်း လေးခု။ …ငါ့လက်ထဲက လေးခုကိုပဲ ကိုင်မယ်။', "Four I can't steer. Four I can. …I'll hold the four in my hands.")],
  sortWait: [T('(သူ့ ပန်းခင်းတွေကို အရင် ကိုယ်တိုင် ကြည့်ဦးမယ်။ လမ်းကြားထဲရော၊ ဒီအထဲရော။)', "(I'll look at it all myself first: the lane, and in here.)")],
  mug: [T('(သူ့ စားပွဲအောက်က ခုံပုလေးမှာ ထိုင်ပြီး စာရေးဆရာ ခွက်လေးကို ချထားလိုက်တယ်။)', '(I take the low stool across his table and set down the Writer mug.)')],

  // ------------------------------------------------------------------ 5.5 ownwords: his diary line
  ow19: {
    title: T('ဥယျာဉ်မှတ်တမ်း · ဒီနေ့', 'Garden diary · today'),
    hint: T('ရှိတဲ့အတိုင်း သုံးပိုင်း ရွေးပါ', 'Pick three pieces, as it is'),
    prompt: T('မိုးက ဘာယူသွားလဲ၊ ဘာကျန်လဲ။', 'What did the rain take, and what is left?'),
    fragments: [
      { ...T('ညက မိုးကြီး ပန်းခင်း သုံးခင်းကို လှဲသွားတယ်။', 'The night rain flattened three beds.'), good: true },
      { ...T('သံဗူးထဲက မျိုးစေ့ ခြောက်တယ်။', 'The seed in the tin is dry.'), good: true },
      { ...T('မိုးက နောက်နှစ်လည်း ပြန်လာမယ်။', 'The rain will come again next year.'), good: true },
      { ...T('အကုန် ပျက်စီးသွားပြီ။', 'Everything is ruined.'), bad: 0 },
      { ...T('ဘာမှ မဖြစ်ဘူး။', 'Nothing happened.'), bad: 1 },
      { ...T('ငါ့ကိုမှ ဒီလို ဖြစ်တယ်။', 'It happens only to me.'), bad: 2 },
    ],
    badLines: [
      T('အကုန်? သံဗူး ရှိသေးတယ်လေ။', "Everything? The tin's still there."),
      T('ဘာမှ မဖြစ်? ငါ ညာနေတာပဲ။', "Nothing? I'd be lying."),
      T('ငါ့ကိုမှ? ဘူးစင်လည်း လဲတယ်။', 'Only me? The gourds went down too.'),
    ],
  },
  owIntro: [T('ဒီနေ့ ရက်စွဲမှာ ဖွင့်မယ်။ ဘာရေးမလဲ…', "I'll open it at today's date. What to write…")],
  owMaya: [T('(ကောင်းအောင် ချော့မရေးဘူး၊ ဆိုးအောင်လည်း မရေးဘူး။ ရှိတဲ့အတိုင်းပဲ။)', '(Not sweetened, not darkened. As it is.)')],
  htGoes: [T('…(ဦးဖိုးထော် ထရပ်တယ်။ သံချောင်းပေါ်က ပေါက်တူးကို ဖြုတ်ယူတယ်။ သံဗူးကို ကောက်ယူတယ်။ ဘယ်သူ့ကိုမှ မစောင့်ဘဲ အပြင်ထွက်သွားတယ်။)', '…(U Hpo Htaw gets up, takes the trowel off its nail and the tin off the table, and walks out without waiting for anyone.)')],

  // ------------------------------------------------------------------ 5.6 the far bed, the gate scene
  trace: {
    title: T('အဝေးဆုံးခင်း ပြန်စိုက်မယ်', 'Replant the far bed'),
    hint: T('တန်းအတိုင်း ဖြည်းဖြည်း ဆွဲပြီး မျိုးစေ့ ချပါ', 'Draw along the row slowly; the seed drops as you go'),
  },
  crooked: [T('ကောက်သွားပြီ။ ပြန်ဆွဲမယ်။', 'Crooked. Again.')],
  farBedWait: [T('(သူ့လက်နဲ့ သူ စိုက်နေတာ။ ကျွန်မ တံခါးဘက်မှာပဲ ထီးလေးနဲ့ ရပ်နေမယ်။)', "(His hands, his planting. I'll stay at the gate end with the umbrella.)")],
  gate: [
    { who: 'naychi', ...T('ဦးဦး၊ ပျိုးခင်းဘက်ကို ကျွန်မ ယူမလား။', 'Uncle, shall I take the seedbed side?') },
    { who: 'hpohtaw', ...T('ယူချင် ယူ။ မျိုးစေ့ သံဗူးထဲမှာ။', 'Take it if you like. Seed is in the tin.') },
    { who: 'gourdaunty', ...T('ကျုပ်ဘူးစင်လည်း လဲတယ်။ နင့်ဟာပြီးရင် ကျုပ်ဆီ လာခဲ့ဦး။', 'My gourds went down too. Come by mine when yours is done.') },
    { who: 'kophyo', ...T('ကောက်ရိုး ခြောက်တွေ။ ပျိုးခင်း အုပ်ဖို့။ ပိုက်ဆံ မယူဘူး။', 'Dry straw, to cover the seedbed. No charge.') },
  ],
  // d11.ncLean (she leaned once on Day 11 before deciding): one short line of her own before Maya speaks
  ncLeanOwn: [T('အစ်မ… မနေ့က တစ်ခါ အစ်မကို မှီမိသေးတယ်။ ဒီနေ့တော့ မမှီဘူး။', "Sister… yesterday I still leaned on you once. Not today.")],
  naychiMaya: [T('အစ်မ… ဒီတစ်ခါ ဘာလုပ်ရမလဲ မမေးတော့ဘူးနော်။ စိုက်ရုံပဲ။', "Sister… I'm not asking what to do this time. Just planting.")],
  mayaNaychi: [T('(ကျွန်မ ဘာမှ မပြောရဘူး။ ဘေးမှာ ထိုင်ပြီး မျိုးစေ့ ဗူးကို ကိုင်ပေးရုံပဲ။)', "(I didn't have to say a thing. I just sit beside her and hold the tin.)")],
  htEnd: [
    T('အဝေးဆုံးခင်း ပြီးပြီ။ ကျန်တာ မနက်ဖြန်။', 'The far bed is done. The rest, tomorrow.'),
    T('ပျိုးပင်ဟောင်းတွေတော့ မရတော့ဘူး။ မိုးကလည်း ပြန်လာဦးမှာပဲ။ ငါလည်း ပြန်စိုက်မှာပဲ။', 'The old seedlings are gone. The rain will come back. So will I, and plant.'),
  ],
  htDate: [T('(တုတ်ချောင်းအသစ်ပေါ်မှာ သူ့နာမည် မရေးတော့ဘူး။ ဒီနေ့ ရက်စွဲပဲ ရေးတယ်။)', "(On the new stick he doesn't write his name. Only today's date.)")],
  htAfter: [T('မိုးက နှစ်တိုင်း လာမှာပဲ။ ငါလည်း နှစ်တိုင်း စိုက်မှာပဲ။', "The rain comes every year. So do I, and plant.")],
  ncAfter: [T('ပျိုးခင်း ပြီးရင် ဘူးစင်အဒေါ်ဆီ သွားဦးမယ်။', "After the seedbed I'll go to the gourd aunty's.")],

  // ------------------------------------------------------------------ 6.1 ch 20 hook (drying hall)
  kpHint: [T('ဒေါ်အုန်းလား။ မိုးရွာလို့ ဈေးက အိုးလှမ်းဆောင်ထဲ ပြောင်းသွားပြီ။ တံခါးဝင်ဝင်ချင်း ပထမဆိုင်။ ထမင်းအိုးဖုံးက တစ်မနက်လုံး ခုန်နေတာ။', "Daw Ohn? The market's moved into the drying hall for the rain. First stall inside the door. Her pot lid's been jumping all morning.")],
  oh1: [
    T('သမီးလား။ မိုးထဲမှာ ဘာလာလုပ်တာလဲ။ …ထိုင်။ ထမင်းအိုး တည်ထားတယ်။', 'You, dear? What are you doing out in this rain? …Sit. The rice is on.'),
    T('ခုနစ်ရက်တစ်ခါ အိုးတွေ ဒီကိုသယ်ပြီး ရောင်းတာ။ ဒီတစ်ခါ မိချိုက ကိုယ့်အိုး လေးလုံး ကိုယ်တိုင် ရောင်းချင်လို့ လိုက်လာတယ်။', 'Every seventh day I bring the pots here to sell. This time Mi Cho came to sell four of her own.'),
    T('ဒီမနက်တော့… ကလေးတွေက အိုးဖုံးကို တုတ်နဲ့ ခေါက်ပြီး "ဒေါသအိုး" တဲ့။ ဆန်ကလည်း ထပ်လျော့ပြန်ပြီ။', 'This morning… the kids knock my lid with sticks and call me "anger pot". And my rice came short again.'),
    T('ရပါတယ်။ ကျွန်မ သည်းခံနေတာ။', "It's fine. I'm being patient."),
  ],
  mcHere: [T('ဒေါ်ဒေါ့် ထမင်းအိုးက ဒီမနက် သုံးခါ ပွက်လျှံတော့မလို ဖြစ်တယ်။', "Aunty's rice pot nearly boiled over three times this morning.")],
  kidsCome: [T('(ကလေးနှစ်ယောက် တုတ်ကိုယ်စီနဲ့ ထောင့်ကနေ ပြန်ပြေးလာကြတယ်။)', '(The two children come running back from their corner with their sticks.)')],
  kidsTease: [T('ဒေါသအိုး! ဒေါသအိုး!', 'Anger pot! Anger pot!')],
  simmer: {
    title: T('အိုးဖုံး စခုန်တာနဲ့', 'At the first rattle'),
    hint: T('ဖုံး စခုန်တာနဲ့ အိုးကို မီးအေးဘက် ဆွဲချပါ', 'When the lid first rattles, slide the pot to the cool edge'),
    early: T('မပွက်သေးဘူး သမီး။ ပြန်တင်လိုက်။', 'Not boiling yet, dear. Put it back.'),
    late: T('အိုး… လျှံသွားပြီ။ နောက်တစ်ခါ စောစော သတိထားမယ်။', "Oh… it boiled over. Next time I'll notice sooner."),
  },
  lidDone: [T('မပွက်ခင် မိသွားတယ်။ …ဒီနေ့အတွက်တော့ အောင်တယ်ပေါ့။ မနက်ဖြန် ထပ်စစ်ဦးမှာ။', "Caught it before it boiled. …A pass for today, then. Tomorrow it'll be tested again.")],
  potLook: [T('(ထမင်းအိုး တဖွားဖွား။ အခုတော့ မီးအေးဘက်မှာ ငြိမ်နေတယ်။)', '(The rice pot simmers. On the cool edge now, quiet.)')],
  // 6.3 the four market looks
  mlooks: {
    kids: { pencil: T('(ကြားတာ: «ဆိုးတဲ့ ကလေးတွေ»)', '(Heard: «bad kids»)'), gold: T('သံအိုးလေးနဲ့ "အိုးဖို" ကစားနေကြတာ။ အိုးဖုံး ဘာလို့ ခုန်လဲ မသိကြသေးဘူး။', 'Playing "kiln" with a tin pot. They don\'t know yet why a lid jumps.') },
    shards: { pencil: T('(ကြားတာ: «ကံကောင်းလို့»)', '(Heard: «just lucky»)'), gold: T('ဆေးသုတ်ပြီး ကွဲသွားတဲ့ စမ်းအိုး အပိုင်းအစ တစ်သေတ္တာ။ တစ်ခုချင်းမှာ နံပါတ် ခြစ်ထားတယ်: ၁ ကနေ ၄၀ အထိ။', 'A crate of glazed trial shards, each scratched with a number, 1 to 40. She tried again and again.') },
    queue: { pencil: T('(ကြားတာ: «ဘယ်သူမှ မငြင်းဘူး»)', '(Heard: «nobody minds»)'), gold: T('သူ့ဆန်အိတ်က မနက်က ဒေါ်အုန်းအိတ်လိုပဲ ပါးနေတယ်။ နောက်တစ်ယောက်လည်း လျော့မှာပဲ။', "Her rice bag is as thin as Daw Ohn's was. The next one will come short too.") },
    hand: { pencil: T('(ကြားတာ: «လူလိမ်»)', '(Heard: «a cheat»)'), gold: T('ချိန်သီးသေတ္တာကို လက်နဲ့ ခဏခဏ ဖုံးထားတယ်။ မျက်လုံးက ဈေးတန်းကို ကြည့်နေတယ်။ (မြင်တာ မြင်တယ်။ သက်သေတော့ မဟုတ်သေးဘူး။ ချိန်ကြည့်မှ သိမယ်။)', 'He keeps a hand over the box of weights, eyes on the row. (Seen, but not proof: that needs a weighing.)') },
  },
  mlookedAll: [T('ကလေးတွေက မသိသေးလို့။ ဟိုဆိုင်က ကြိုးစားခဲ့လို့။ ချိန်ခွင်ကတော့ နောက်လူကိုပါ ထိမယ်။', "The kids don't know yet. The blue stall worked for it. And the scale will catch the next buyer too.")],
  ohNotYet: [T('ကဲ… ထမင်းအိုး ကြည့်ရဦးမယ်။', "Well… I've the rice to watch.")],
  ohLater: [T('ဈေးထဲ လှည့်ကြည့်ချင် ကြည့်ပါဦး သမီး။ ထမင်းကျက်ရင် လာစား။', "Have a look round the market if you like, dear. Come and eat when the rice is done.")],
  ohKids: [T('ဒီမှာ ကြည့်။ အထဲက ရေနွေးငွေ့က ဖုံးကို တွန်းတာ။ ဒေါသ မဟုတ်ဘူး။', "Look here. The steam inside pushes the lid. It isn't anger.")],
  ohKidsMaya: [T('(သူ ကလေးတွေဆီ ကိုယ်တိုင် သွားပြီး တိုးတိုးလေး ပြတယ်။ ဘယ်သူမှ မဆူဘူး။ ခန်းမထဲ ဘယ်သူမှ မကြားဘူး။)', '(She goes to the children herself and shows them, quietly. Nobody scolds. Nobody else in the hall hears.)')],
  // 6.5 the true weight
  ohWeight: [T('ကော်မတီဆီ မသွားခင် ကိုယ်တိုင် အရင် စစ်ချင်တယ်။ မစစ်ဘဲ တိုင်ရင် ကြားတာပဲ ဖြစ်မှာ။ …သမီးမှာ ချိန်သီးမှန် ရှိတယ်ဆို။', "Before I go to the committee I want to check it myself. Complain without checking and it's only hearsay. …You have a true weight, I heard.")],
  wChoices: [
    T('"ကျွန်မ သွားချိန်ပေးမယ်။"', '"I\'ll go and weigh it for you."'),
    T('"ဒီမှာပါ။" (ချိန်သီးကို ပေးပြီး နောက်ဆုတ်နေမယ်)', '"Here." (hand it over and stand back)'),
  ],
  wFront: [T('ကျွန်မ ဆန်၊ ကျွန်မ ချိန်မယ် သမီး။', "My rice. I'll weigh it, dear.")],
  ohGoScale: [T('(ဒေါ်အုန်း ဆန်အိတ်ကို ကိုယ်တိုင် ဆွဲပြီး မိုးထဲ ထွက်သွားတယ်။ ကျွန်မ ထီးလေးနဲ့ နောက်က တစ်လှမ်း။)', '(Daw Ohn takes up the rice bag herself and goes out into the rain. I follow a step behind with the umbrella.)')],
  weighHang: [T('(သူ့ ဆန်အိတ်ကို ကုန်သည်ရဲ့ ကြေးချိန်သီးနဲ့ ချိန်တယ်။ ပြီးတော့ ချိန်သီးမှန်နဲ့ ချိန်တယ်။ ချိန်ခွင်တန်း နိမ့်ကျသွားတယ်။)', "(She hangs her bag against the trader's brass weight, then against the true weight. The beam dips.)")],
  weightBox: [T('(ကြေးချိန်သီးရဲ့ အောက်ခြေကို တံစဉ်းနဲ့ ခြစ်ထားတယ်။)', "(The brass weight's underside has been filed.)")],
  ohQuiet: [T('တစ်ပိဿာ ဆိုပြီး ကျပ်သား ကိုးဆယ်ပဲ ရှိတယ်။', 'Sold as one viss, it holds only ninety ticals.')],
  weightBack: [T('(ချိန်သီးမှန် အိတ်ထဲ ပြန်ရောက်ပြီ။ ကုန်သည် ဘာမှ မပြောဘူး။ ချိန်သီးသေတ္တာပေါ်က လက်ကို ဖယ်လိုက်တယ်။)', "(The true weight goes back in my bag. The trader says nothing; his hand comes off the box.)")],
  ohToCommittee: [T('(ဒေါ်အုန်း အိုးဖိုဆောင် ဘေးကနေ ကော်မတီ တံခါးဆီ လျှောက်သွားတယ်။ တံခါးကို ကိုယ်တိုင် ဖွင့်ပြီး ဝင်သွားတယ်။)', '(Daw Ohn walks on past the kiln shed to the committee door, opens it herself and goes in.)')],
  // 6.6 the report
  sort20: {
    title: T('ကော်မတီအတွက် ဒေါ်အုန်းရဲ့ စာ', "Daw Ohn's report for the committee"),
    hint: T('အမှန်တွေ ထည့် · အပူတွေ တံခါးအပြင်မှာ ချန်ခဲ့', 'Facts go in · heat stays outside the door'),
    baskets: [
      { id: 'in', label: T('စာထဲ ထည့်', 'Into the report') },
      { id: 'out', label: T('တံခါးအပြင်မှာ ချန်ခဲ့', 'Leave outside the door') },
    ],
    cards: [
      { basket: 'in', ...T('တစ်ပိဿာ ဆိုပြီး ကျပ်သား ကိုးဆယ်ပဲ ရှိတယ်။ ချိန်သီးမှန်နဲ့ ချိန်ခဲ့တယ်။', 'Sold as one viss, it held ninety ticals. Weighed against a true weight.') },
      { basket: 'in', ...T('ကြေးချိန်သီး အောက်ခြေကို ခြစ်ထားတယ်။', "The brass weight's underside is filed.") },
      { basket: 'in', ...T('ဒီမနက် တန်းထဲက ဝယ်သူတွေလည်း လျော့နိုင်တယ်။ ပြန်ချိန်ပေးပါ။', "This morning's buyers may have come short too. Please re-weigh for them.") },
      { basket: 'out', blot: true, my: '██████', en: '██████' },
      { basket: 'out', blot: true, my: '████ ███', en: '████ ███' },
      { basket: 'out', ...T('လူတိုင်း သိတယ်၊ သူ လူလိမ်။', "Everyone knows he's a cheat.") },
      { basket: 'out', ...T('ဈေးထဲက မောင်းထုတ်ပစ်!', 'Throw him out of the market!') },
    ],
    wrongIn: T('ဟင့်အင်း… အဲဒါ အပူ။ စာထဲ မပါစေနဲ့။', "No… that's heat. Keep it out of the paper."),
    wrongOut: T('ဟင့်အင်း… အဲဒါ အမှန်။ စာထဲ ထည့်ရမယ်။', "No… that's a fact. It goes in."),
  },
  benchIntro: [T('(တံခါးဝင်ဝင်ချင်း ခုံတစ်ခု၊ မင်နဲ့ စာရွက်တွေ။ ကတ်ပြားလေးမှာ «တိုင်ကြားစာ ဒီမှာ ရေးပါ»။)', '(Just inside the door, a plain bench with ink and slips under a card: «Write complaints here».)')],
  ohWrite: [T('မနက်က ကျွန်မ ပြောခဲ့တာတွေ အကုန် ဒီမှာ။ …ဘယ်ဟာ ထည့်ရမလဲ ခွဲမယ်။', "Everything I said this morning is here. …I'll sort what goes in.")],
  reportDone: [T('(သူ့စာမှာ သူ့လက်ရေးနဲ့ သုံးကြောင်းပဲ။)', '(Her slip reads three lines, in her hand.)')],
  // 6.7 she hands it in
  cChoices: [
    T('"ကျွန်မ ယူသွားပေးမယ်။"', '"I\'ll take it over for you."'),
    T('"ဘေးကနေ လိုက်ခဲ့မယ်။"', '"I\'ll walk with you."'),
  ],
  cFront: [T('ကျွန်မ စာ၊ ကျွန်မ ပေးမယ်။ သမီး ဘေးမှာ ရှိရင် ရပြီ။', 'My paper, I hand it in. Having you beside me is enough.')],
  mm1: [
    T('ဒေါ်အုန်း၊ ထိုင်ပါ။ …ချိန်သီးမှန်နဲ့ ချိန်ထားတာလား။ ကော်မတီကပါ ပြန်ချိန်ကြည့်မယ်။', 'Sit, Daw Ohn. …Weighed with a true weight? The committee will weigh it again too.'),
    T('အမှန်တွေပဲ ရေးထားတာ ကောင်းတယ်။ စာထဲ ဆဲစာ မပါတော့ ဖတ်ရ လွယ်တယ်။', 'Good, only facts. With no curses in it, it reads easily.'),
  ],
  mmCall: [T('ချိန်သီးသေတ္တာလေး အထဲ ယူခဲ့ပါဦး။', 'Bring your box of weights inside, please.')],
  mmWeigh: [T('(ပိတ်ထားတဲ့ အခန်းထဲမှာ၊ ဈေးရှေ့မှာ မဟုတ်ဘဲ၊ ဒေါ်မြမြက ကုန်သည့်ချိန်သီးကို ကော်မတီရဲ့ ကိုယ်ပိုင် ချိန်သီးနဲ့ ယှဉ်ချိန်တယ်။)', "(Inside the closed room, not in front of the market, Daw Mya Mya weighs one of his against the committee's own set.)")],
  notice: T('ဒီနေ့ ဈေးချိန်ခွင်ရဲ့ ချိန်သီးဟောင်းတွေ ပါးနေတာ ကော်မတီက စစ်တွေ့လို့ သိမ်းလိုက်ပြီ။ ချိန်သီးအသစ် ချိတ်ပြီးပါပြီ။ မနက်က ဝယ်ထားတာ ကော်မတီအခန်းမှာ ပြန်ချိန်ပေးပါမယ်။', 'The committee checked the market scale today and found its old weights light; they have been taken in and a new set hung. Anything bought this morning can be re-weighed in the committee room.'),
  noticeTitle: T('အသိပေးချက် · ဈေးကော်မတီ', 'Notice · Market Committee'),
  kyNew: [T('…ချိန်သီးအသစ်နဲ့ ချိန်မယ်။', "…I'll weigh with the new set.")],
  girlGets: [T('(တန်းထဲက ကောင်မလေး ဝင်လာပြီး ဆန်အိတ်ကို ပြန်ချိန်တယ်။ လျော့တာကို ပြန်ရတယ်။)', '(The girl from the queue comes in, re-weighs her bag at the table and gets her rice.)')],
  mayaDistinct: [T('(ကလေးတွေရဲ့ အမှားကို ကလေးတွေဆီ တိုးတိုးလေး။ နောက်ဝယ်သူကို ထိမယ့် အမှားကိုတော့ အမှန်တွေနဲ့ မှန်တဲ့တံခါးကနေ။)', "(The kids' mistake: quietly, to the kids. A wrong that would cheat the next buyer: facts, through the proper door.)")],
  ohBack: [T('(ဒေါ်အုန်း သူ့ဆိုင်ကို ပြန်သွားပြီ။ အပူကတော့ တံခါးအပြင်မှာ ကျန်ခဲ့တယ်။)', '(Daw Ohn has gone back to her stall. The heat stayed outside the door.)')],
  ohEnd: [
    T('ဒီနေ့ စာမေးပွဲတော့ အောင်တယ်လို့ ထင်တယ်။ ဒီနေ့အတွက်ပဲနော်။', "I think I passed today's exam. For today, mind."),
    T('မနေ့ကနဲ့ မတူဘူး။ အဲဒီလူအကြောင်း ညကျရင် မတွေးတော့ဘူး။ စာထဲ ထည့်ပြီးပြီ။', "Not like before. I won't think about that man tonight. It's in the paper now."),
  ],
  mcEnd: [T('ကျွန်မ အိုးလေးလုံးထဲက နှစ်လုံး ရောင်းရပြီ အစ်မ!', 'Two of my four pots sold, sister!')],
  drizzle: [T('(ရင်ပြင်ပေါ်က မိုးက မိုးဖွဲလေး ဖြစ်လာပြီ။)', '(Over the square the rain eases to a drizzle.)')],

  // ------------------------------------------------------------------ 7. other Garden people
  ga: [
    [T('ကျုပ်ဘူးစင်လည်း လဲတယ်။ ဦးဖိုးထော်ကတော့ သူ့ခြံပဲ ပျက်တယ် ထင်နေတာ။', 'My gourds are down too. U Hpo Htaw thinks only his plot got it.')],
    [T('နှစ်တိုင်း ဒီအချိန်ဆို မိုးကြီး ရွာတယ်တဲ့။ ကျုပ်က ဒီမှာ နှစ်နှစ်ပဲ ရှိသေးတော့ မသေချာဘူး။', "Every year about now the big rains come, they say. I've only been here two years, so I can't be sure.")],
    [T('အိုးဖိုဈေးက လမ်းအဆုံး၊ မီးခိုးတက်နေတဲ့ဘက်။ ဒီနေ့ မိုးရွာလို့ အိုးလှမ်းဆောင်ထဲမှာ ရောင်းကြတယ်။', "The kiln market is at the lane's end, where the smoke is. With the rain they're selling inside the drying hall today.")],
  ],
  gaAfter: [T('ကောင်မလေးက ပျိုးခင်းကို လာကူတယ်။ ဘယ်သူမှ မခေါ်ဘဲနဲ့။', 'That girl came to help with the seedbed. Nobody called her.')],
  gaName: T('ဘူးစင်အဒေါ်', 'the gourd aunty'),
  kp: [
    [T('ဒီနေ့ ပေကျင်း အကုန် စိုတယ်။ ခြောက်မှ ချိန်မယ်။ ဝယ်သူ စောင့်လို့ရတယ်။', "Every bale's damp today. I'll weigh when they're dry. The buyer can wait.")],
    [T('ဆန်တန်းက ချိန်ခွင်ရဲ့ ချိန်သီးတွေ ပါးတယ်တဲ့။ ကြားတာပဲ။ ကိုယ်တိုင် မစစ်ရသေးဘူး။', "They say the weights at the rice scale are light. Only heard it. Haven't checked.")],
    [T('မိုးကြောင့် အိုးဖိုကြီး ငြိမ်းသွားပြီတဲ့။', 'They say the rain put the big kiln out.')],
  ],
  pl: [
    [T('ဆောရီး… တန်းစီပေးပါ။ မနက်ကတည်းက ခေါင်းမဖော်ရသေးဘူး။', "Sorry… please queue. I haven't looked up since dawn.")],
    [T('ဆေးရောင်လား။ လေးဆယ်ခါလောက် ကွဲပြီးမှ ရတာ။ စားပွဲအောက်က သေတ္တာထဲမှာ သိမ်းထားတယ်။', 'The glaze? About forty cracked ones before I got it. I keep them in the crate under the table.')],
  ],
  plAfter: [T('ဒေါ်အုန်းက ဒီနေ့ လှမ်းပြုံးပြတယ်။ ကျွန်မလည်း ခေါင်းညိတ်ပြလိုက်တယ်။ အရင်က မမြင်မိဘူး။', 'Daw Ohn smiled across today. I nodded back. I never noticed her before.')],
  kidsBefore: [T('ဒေါသအိုး! ဒေါသအိုး!', 'Anger pot! Anger pot!')],
  kidsAfter: [T('ရေနွေးငွေ့က တွန်းတာတဲ့! ဒေါသ မဟုတ်ဘူးတဲ့!', "It's the steam that pushes it! Not anger!")],
  kidsName: T('ကလေးတွေ', 'the children'),
  myamya: [T('တိုင်ချင်ရင် အမှန်တွေပဲ ယူလာခဲ့။ ကော်မတီက ပြန်စစ်တယ်။', 'Bring facts if you have a complaint. The committee checks them again.')],
  ky: [T('ချိန်မယ်၊ ချိန်မယ်။ မြန်မြန်။', 'Weigh here, weigh here. Quickly.')],
  kyAfter: [T('…(ချိန်သီးအသစ်ကို သုတ်နေတယ်။ မျက်လုံး မဆုံဘူး။)', "…(He polishes the new weights. He doesn't meet your eye.)")],
  girlName: T('ကောင်မလေး', 'the girl'),
  girlBefore: [T('(ကောင်မလေးက ဆန်အိတ်ပါးပါးလေး ကိုင်ပြီး တန်းစီနေတယ်။)', '(The girl waits in the queue with a thin rice bag.)')],
  girlAfter: [T('ကော်မတီမှာ ပြန်ချိန်ပေးတယ်! ဆန် ပြည့်ပြည့် ရပြီ။', 'They re-weighed it at the committee! A full bag now.')],
  stallSlate: [T('(ဒေါ်အုန်းရဲ့ ဆိုင်လွတ်ပေါ်က ကျောက်သင်ပုန်း: «ဒေါ်အုန်း · အိုး → အိုးလှမ်းဆောင်»)', '(The slate on Daw Ohn\'s empty stall: «Daw Ohn · pots → drying hall»)')],
  hallSlate: [T('(တံခါးတိုင်က ကျောက်သင်ပုန်း: «ဈေး · မိုးရွာလို့ အထဲမှာ»)', '(The doorpost slate: «Market · inside, for the rain»)')],
  racks: [T('(မဖုတ်ရသေးတဲ့ အိုးစိမ်းတွေ စင်သုံးဆင့်ပေါ်မှာ။ မိုးရွာလို့ အထဲမှာ ခြောက်နေတယ်။)', '(Unfired green pots on three tiers, drying indoors out of the rain.)')],
  cupboard: [T('(မှန်ဗီရိုထဲမှာ ကော်မတီရဲ့ ကြေးချိန်သီး အစုံ။)', "(Behind the glass, the committee's own brass weights.)")],
  notices: [T('(ကြော်ငြာဟောင်းတွေ: ဈေးနေ့၊ ဆိုင်ခ၊ ချိန်ခွင် စစ်ဆေးရက်။)', '(Old notices: market days, stall fees, scale inspection days.)')],
  ledger: [T('(ကော်မတီ စာရင်းစာအုပ်။ တိုင်ကြားစာတိုင်း ရက်စွဲနဲ့ မှတ်ထားတယ်။)', "(The committee ledger. Every complaint written in with its date.)")],
  boardOut: [T('(တံခါးဘေးက အများပြည် ကြော်ငြာဘုတ်။ ဝယ်သူတိုင်း မြင်ရတယ်။)', '(The public notice board by the door, where every buyer can see it.)')],
  kiln: [T('(အိုးဖိုကြီးရဲ့ မီးခိုးခေါင်းတိုင်က မိုးထဲမှာတောင် မီးခိုး တက်နေတယ်။ မငြိမ်းဘူး။)', "(The big kiln's chimney is smoking, even in the rain. It isn't out.)")],
  kilnAgain: [T('(မီးခိုး တက်နေတုန်းပဲ။)', '(Still smoking.)')],
  scaleLook: [T('(ဈေးချိန်ခွင်။ ကုန်သည့်လက်က ချိန်သီးသေတ္တာပေါ်မှာ။)', "(The market scale. The trader's hand rests on the box of weights.)")],
  scaleAfter: [T('(ချိန်ခွင်မှာ ချိန်သီးအသစ် ချိတ်ထားပြီ။)', '(New weights hang at the scale now.)')],

  // ------------------------------------------------------------------ rumours (pencil, then checked)
  proof: {
    onlyme: T('မိုးက လမ်းထဲက ပန်းခင်းတိုင်းကို ရွာတာ။ ဦးဖိုးထော်ဆီ တစ်ယောက်တည်း မဟုတ်ဘူး။', 'The rain fell on every bed in the lane, not on U Hpo Htaw alone.'),
    again: T('ဥယျာဉ်မှတ်တမ်းထဲမှာ နှစ်တိုင်း ဒီရက်တွေမှာ မိုးကြီး ရွာခဲ့တယ်။ ပြန်လာဦးမှာ။', 'His garden diary shows heavy rain on these dates every year. It will come again.'),
    kilnout: T('အိုးဖိုကြီး မငြိမ်းဘူး။ မိုးထဲမှာတောင် မီးခိုး တက်နေတယ်။', 'The big kiln is not out. It smokes even in the rain.'),
    weights: T('ဈေးချိန်ခွင်ရဲ့ ချိန်သီးက ပါးနေတယ်။ ဒေါ်အုန်း ကိုယ်တိုင် ချိန်ကြည့်ခဲ့တာ။', "The market scale's weight was light. Daw Ohn weighed it herself."),
  },

  // ------------------------------------------------------------------ 8.2 the kiln desk
  deskKilnQ: T('ဒီနေရာမှာ ကိုယ်တိုင် မြင်ရတာကို ရေးမယ်။', 'Write what you can see from here yourself.'),
  deskKiln: [
    T('အိုးဖိုကြီးရဲ့ မီးခိုးခေါင်းတိုင်က မိုးထဲမှာတောင် မီးခိုး တက်နေတယ်။', "The big kiln's chimney is smoking, even in the rain."),
    T('မိုးကြောင့် အိုးဖိုကြီး ငြိမ်းသွားပြီ။', 'The rain has put the big kiln out.'),
    T('ဒီဥယျာဉ်မှာ ဦးဖိုးထော့်ခြံကိုပဲ မိုးရွာတာ။', "In this garden only U Hpo Htaw's plot got rain."),
  ],
  deskWrong: [T('(ဒါ ကြားခဲ့တာ။ မျက်လုံးနဲ့ ပြန်ကြည့်ပါဦး။)', "(That's what I heard. Look again.)")],
  deskDone: [T('မိုးထဲမှာလည်း ဖဲကြိုး တက်သွားတယ်။', 'The ribbon rises, rain and all.')],

  // ------------------------------------------------------------------ 8.3 the soaked board (home, evening)
  wwBoard: [
    T('မိုးက ဘုတ်ပေါ်က စာတွေကိုပါ စိုသွားစေတယ်။ အကုန် မင်ပျော့သွားပြီ။', 'The rain got the board too. Every note ran.'),
    T('နေ့လယ်က လူတွေ လာကြတယ်။ ကိုးယောက်ပဲ စာအသစ် ပြန်ချိတ်တယ်။ နှစ်ယောက်က "ကိုယ့်ဘာသာ ဖြေရှင်းပြီးပြီ" လို့ ရေးချိတ်သွားတယ်။', 'People came by at noon. Only nine pinned a fresh note. Two pinned "sorted it myself".'),
  ],
  boardChoices: [
    T('(စိုသွားတဲ့ စာတွေကို မှတ်မိသလောက် ပြန်ရေးပြီး ချိတ်မယ်)', '(Rewrite the soaked notes from memory and pin them back)'),
    T('(ဘုတ်ကို ဒီအတိုင်း ထားမယ်။ လိုသေးရင် ရေးသူကိုယ်တိုင် ပြန်ချိတ်ပါစေ)', '(Leave the board as it is; whoever still needs to can pin their own again)'),
    T('(ဘုတ်ကို ဖြုတ်ချလိုက်မယ်)', '(Take the board down)'),
  ],
  boardFront: [T('(ကျွန်မ မှတ်မိသလောက်… ဒါ သူတို့စကား မဟုတ်တော့ဘူး။ ကျွန်မ စကား ဖြစ်သွားပြီ။)', "(As far as I remember… they aren't their words any more. They're mine.)")],
  boardCold: [T('(ကူညီတာ ရပ်ဖို့ မဟုတ်ဘူး။ ရှေ့က မရပ်ဖို့ပဲ။)', "(The point isn't to stop helping. It's to stop standing in front.)")],
  boardLeave: [T('(ကိုးစောင်။ အရင်က သုံးဆယ့်တစ်စောင်။ ဘုတ်က ကျဉ်းသွားတာ မဟုတ်ဘူး၊ လမ်းတွေ ကျယ်လာတာ။)', "(Nine. Once thirty-one. The board hasn't shrunk; the roads have widened.)")],
  boardBefore: [T('(မိုးစိုနေတဲ့ ဘုတ်။ မင်တွေ အကုန် ပျော့ကျနေတယ်။)', '(The soaked board. Every note has run.)')],
  boardAgain: [T('(ဘုတ်ပေါ်မှာ စာအသစ် ကိုးစောင်။ "ကိုယ့်ဘာသာ ဖြေရှင်းပြီးပြီ" နှစ်စောင်။)', '(Nine fresh notes on the board. Two that say "sorted it myself".)')],
  wwEve: [T('ဥယျာဉ်က ပြန်လာပြီလား။ ဘုတ်ကို ကြည့်ပါဦး… မိုးက ဘယ်သူ့ကိုမှ မချန်ဘူး။', "Back from the Garden? Have a look at the board… the rain spared nobody.")],
  // 8.4 the reply letter's back page (pencil, after the stamp)
  reply: T('မိုးက မေးပြီးမှ မရွာဘူး။ ရွာလာရင် နောက်တစ်နာရီကို ကိုယ်တိုင် ရွေးပါ။ ကျွန်မ ရှေ့က မဟုတ်ဘဲ ဘေးက ရှိမယ်။', "Rain doesn't ask before it falls. When it comes, choose your next hour yourself. I'll be beside you, not in front."),

  // ------------------------------------------------------------------ 9. the night page
  goHome: [T('(ဥယျာဉ်ရော ဈေးရော ကိုယ့်ဘာသာ ကိုယ် ဖြေရှင်းကြပြီ။ အိမ်ပြန်မယ်။)', '(The garden and the market are handling it themselves. Home.)')],
  replant: [
    T('ပွင့်တွေ ပြန်မလာဘူး။ ဒါပေမဲ့ အစေ့ ရှိသေးတယ်။ ပြန်စိုက်မယ်။', "The flowers won't come back. But there's seed. I'll plant again."),
    T('မိုးက ပြန်လာဦးမှာပဲ။ ကျွန်မလည်း ပြန်စိုက်မှာပဲ။', 'The rain will come again. And I will plant again.'),
  ],
  nightQ: T('ဒီနေ့အကြောင်း မှန်မှန်ကန်ကန် ဘယ်လို ရေးမလဲ။', 'How will she write today, truthfully?'),
  nightChoices: [
    T('မိုးက ဘာမှ မထိခိုက်ပါဘူး။ ကျွန်မ ညွှန်ပြလိုက်တော့ ဥယျာဉ်ရော ဈေးရော အကုန် ပြန်ကောင်းသွားတယ်။', 'The rain did no real harm. Maya gave directions, and the garden and the market were set right.'),
    T('မိုးက ပန်းခင်းတွေကို လှဲသွားတယ်၊ ကျွန်မဟာပါ။ စာရွက်တချို့ ပြန်မရတော့ဘူး။ ဦးဖိုးထော်က ဘယ်သူမှ မရောက်ခင် ပေါက်တူး ကိုယ်တိုင် ကောက်ကိုင်တယ်။ ဒေါ်အုန်းက ကိုယ်တိုင် ချိန်ပြီး ကိုယ့်စာ ကိုယ်တိုင် တင်တယ်။ ကျွန်မ ဘေးမှာ ရှိခဲ့တယ်။', 'The rain flattened the beds, mine too, and some papers are gone for good. U Hpo Htaw picked up his trowel before anyone came. Daw Ohn weighed it herself and handed in her own report. I was beside them.'),
    T('မိုးက အကုန် ဖျက်ဆီးသွားတယ်။ ဒုက္ခက အမြဲ တူတဲ့လူတွေကိုပဲ ရွေးလာတာ။', 'The rain ruined everything. Trouble always picks the same people.'),
  ],
  nightWrong: [
    [T('(မဟုတ်ဘူး… ဒါ ချော့ပြောတာ။ ပျောက်တာ တကယ်ပျောက်တယ်။ ကျွန်မ ညွှန်ပြတာလည်း မဟုတ်ဘူး။)', '(No… that flatters. What was lost is lost, and I gave no directions.)')],
    [],
    [T('(မဟုတ်ဘူး… ဒါ အားလျှော့ပြောတာ။ သံဗူးထဲက မျိုးစေ့ ကျန်တယ်။ မိုးက လူတိုင်းဆီ ရောက်တာ။)', '(No… too gloomy. Seed was left in the tin, and the rain came to everyone.)')],
  ],
  sleepQ: T('ဒီည မှတ်စုစာမျက်နှာလေး ဘယ်သူ့အိမ်မှာ အိပ်မလဲ။', "Whose house does tonight's notebook page sleep at?"),
  stampText: T('စာမျက်နှာ ၁၉ — ဒုက္ခ\nမဖိတ်ဘဲ လူတိုင်းဆီ ရောက်လာတယ်။ နောက်တစ်နာရီကတော့ ကိုယ့်ဟာ။\nစာမျက်နှာ ၂၀ — သည်းခံခြင်း\nအသိဉာဏ်နဲ့ သည်းခံပြီး မှန်တဲ့တံခါးကနေ ကိုယ်တိုင် သွားတယ်။', "Page 19 — Suffering\nIt came uninvited, and to everyone. The next hour is one's own.\nPage 20 — Patience\nPatient with good sense, she went through the proper door herself."),
  tomorrow: T('နောက်တစ်နေ့ မနက် ရောက်ပြီ။', 'Morning comes.'),
  nightNotYet: [T('(ဥယျာဉ်ထဲမှာ ကိစ္စတွေ ကျန်သေးတယ်။ ညမဖြစ်သေးဘူး။)', "(There's still the Garden. It isn't night yet.)")],

  // Day 13 morning lines from tonight's house (day12-spec 9; Day 13's script reads them)
  slept12: {
    hpohtaw: T('"မနှစ်က ဒီရက်: မိုးကြီး။ ဒီနှစ် ဒီရက်: မိုးကြီး၊ အဝေးဆုံးခင်း ပြန်စိုက်တယ်။" — ဦးဖိုးထော်', '"Last year, this date: heavy rain. This year: heavy rain; replanted the far bed." — U Hpo Htaw'),
    dawohn: T('"ဒီနေ့ စာမေးပွဲ ဒီနေ့ပဲ။ မနက်ဖြန် ထမင်းအိုး ထပ်ကြည့်ရဦးမယ်။" — ဒေါ်အုန်း', '"Today\'s exam is for today. Tomorrow I watch the rice pot again." — Daw Ohn'),
    micho: T('"ဒေါ်ဒေါ်က ကလေးတွေကို ရေနွေးငွေ့ အကြောင်း သင်ပေးတယ်။ ကျွန်မကိုလည်း အဲဒီလို သင်ပေးခဲ့တာ။" — မိချို', '"Aunty taught the kids about steam. She taught me like that too." — Mi Cho'),
    naychi: T('"ဘယ်သူမှ မခေါ်ဘဲ သွားကူတာ ပထမဆုံးပဲ။ ကြောက်တော့ ကြောက်တယ်။" — နေခြည်', '"First time I went to help with nobody asking me. I was scared, a bit." — Nay Chi'),
    kophyo: T('"ခြောက်မှ ချိန်တယ်။ ဝယ်သူက စောင့်ပေးတယ်။" — ကိုဖြိုး', '"Weighed it dry. The buyer waited." — Ko Phyo'),
    palae: T('"ခေါင်းမော့ကြည့်မှ ဘေးဆိုင်ကို မြင်တယ်။" — မပုလဲ', '"Only when I looked up did I see the stall beside me." — Ma Pa Lae'),
    kyinyein: T('"ချိန်သီးအသစ်နဲ့ ညက စောစော အိပ်ပျော်တယ်။" — ဦးကြည်ငြိမ်း', '"With the new weights I slept early last night." — U Kyi Nyein'),
    myamya: T('"အမှန်တွေပဲ ပါတဲ့ စာက အမြန်ဆုံး ဖြေရှင်းလို့ရတယ်။" — ဒေါ်မြမြ', '"A report with only facts in it is the quickest to settle." — Daw Mya Mya'),
  },
};

export const SLEPT12 = L.slept12;
