// Day 6's words (day6-spec draft 3). Every Burmese line is a draft for Maya to proofread; every line is { my, en }.
// Split from day6.js only to keep that file readable. Lines marked "(added)" are not in the spec: small glue
// lines the play needs (walk-on names, a prop looked at, a wait); they never point anywhere.

export const NAMES = {
  porter: { my: 'ထမ်းသမား', en: 'Porter' },
  ferryman: { my: 'ကူးတို့သမား', en: 'The ferryman' },
  fishwoman: { my: 'ငါးဆိပ်က အမျိုးသမီး', en: 'The Fish Jetty woman' },
  stampwoman: { my: 'တံဆိပ်ခေါင်း ရေတွက်သူ', en: 'The stamp-counting woman' },
  merchant: { my: 'ကုန်သည်', en: 'Merchant' },
  child: { my: 'ကလေး', en: 'Child' },
  cutter: { my: 'ကြိမ်ခုတ်သမား', en: 'Cane-cutter' },
};

// Day 5's notebook lines (day5-spec 9, `slept5`): read this morning from the house the notebook slept in
export const SLEPT5 = {
  kolwin: { my: '"ပူတဲ့အတွေး ဝင်လာတိုင်း ထွင်းတံကို ခဏ ချတယ်။ ပြီးမှ ပြန်ကောက်တယ်။" — ကိုလွင်', en: '"Every time the hot thought comes, I put the gouge down a moment. Then I pick it up again." — Ko Lwin' },
  khwarnyo: { my: '"အနားကွပ်က ဘယ်သူ့လက်ရာလဲ မမေးတော့ဘူး။ သိပြီးသားပဲ။" — ခွာညို', en: '"I won\'t ask whose hand carved the border. I know already." — Khwar Nyo' },
  kothiha: { my: '"မြစ်ကို ကျွန်တော် မရွေးခဲ့ဘူး။ ဒီနေ့ ဆိပ်နှစ်ခု ရွေးခဲ့တယ်။" — ကိုသီဟ', en: '"I didn\'t choose the stream. Today I chose two jetties." — Ko Thiha' },
  dawsanda: { my: '"ဖောင်လေး ရေထဲ ပြန်ရောက်ပြီ။ ဒါပဲ။" — ဒေါ်စန္ဒာ', en: '"The raft is back on the water. That\'s all." — Daw Sanda' },
  maungnge: { my: '"ဒီနေ့ တံဆိပ် နှစ်ခု ကိုယ်တိုင် ဖတ်တယ်။ ဆိပ်နာမည်တွေပါ။" — မောင်ငယ်', en: '"Today I read two labels myself. Jetty names." — Maung Nge' },
  naychi: { my: '"မာရာ ပြောတဲ့အတိုင်း စောင့်နေတယ်။" — နေခြည်', en: '"I\'m waiting, like Maya said." — Nay Chi' },
};

// the ten slates' chalk (one source: day7-spec 6 `slates`); Day 6 plays 1-5
export const SLATES = {
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
};

export const PROOF = {
  wind: { my: 'နေ့လယ်ချိန် ရေစီးဘက်က လေကြီး တိုက်တယ်။ ချည်မထားတာ ယူသွားတယ်။ မှန်တယ်။', en: "A big wind comes off the stream at noon and takes what isn't tied. True." },
  grudge: { my: 'ကိုသီဟမှာ အငြိုး မရှိဘူး။ ကိုယ်တိုင် ကြည့်ခဲ့ပြီ။', en: 'Ko Thiha holds no grudge. Looked myself.' },
  cane: { my: 'ကြိမ်ဆိပ်က ကြိမ်စည်းတွေ ပြည့်ပြည့်၊ တင်းတင်း။ လိမ်တာ မဟုတ်ဘူး။', en: "Cane Jetty's bundles are full and tight. No cheating." },
};

export const L = {
  // ---- 4 · morning
  ww1: [{ my: 'မာရာရေ… မှတ်စုစာအုပ်လေး ပြန်ရောက်ပြီ။ ဒီတစ်ခါလည်း စာတစ်ကြောင်း ပါလာတယ်။', en: 'Maya… your notebook is back. A line came with it again.' }],
  ww2: [{ my: 'ကိုသီဟဆီကလည်း စာလေး ပါလာတယ်။ ဆိပ်ကမ်းက ကလေးတစ်ယောက် လာပို့တာ။', en: 'And a note from Ko Thiha. A wharf kid brought it up.' }],
  thNote: { my: 'အစ်မ… မနေ့ကစပြီး ဖောင်ကို ကိုယ်တိုင် ထိုးတယ်။ ဆိပ်တိုင်း ဝင်တယ်၊ လူတိုင်းကို "နေကောင်းလား" လို့ အော်တယ်။\nကူးတို့ မရောက်တဲ့ ဆိပ်တွေက ကျွန်တော့်ကို စောင့်ကြတယ်။\n…လူတိုင်းတော့ မဟုတ်ပါဘူး။ တစ်ယောက်ကိုတော့ ကျော်လိုက်တယ်။ ဘာမှ မဖြစ်ပါဘူး။', en: "Sister… since yesterday I pole the raft myself. I call at every jetty and shout \"keeping well!\" to everyone.\nThe jetties the ferry can't reach wait for me now.\n…Not everyone, really. One I skip. It's nothing." },
  fish: { my: '(မနေ့က စာမျက်နှာပေါ်က ငါးကလေး ရေဆန်ကူးသလို ခုန်ထွက်လာတယ်။)', en: "(A little fish leaps off yesterday's page, as if swimming upstream.)" },
  ribbon: { my: '(နောက်ကနေ အဖျားနှစ်ဖျားပါတဲ့ ဖဲကြိုးလေးလည်း လွင့်ထွက်လာတယ်။ အဖျားတစ်ဖက်စီ သူ့ဘာသာ လှုပ်နေတယ်။)', en: '(A little ribbon with two tails floats out after it, each tail waving on its own.)' },
  mayaLift: [{ my: 'ရေစီးက မမျှတဘူး၊ ဘယ်လိုကူးမလဲက ကိုယ့်ဟာ။ …နှစ်ဖက်လုံး အဆင်ပြေမှ။ လာ၊ လိုက်ခဲ့ကြ။', en: "The stream isn't fair; how you swim it is yours. …Both sides fine. Come on, you two." }],
  ww3: [
    { my: 'ပြီးတော့… နေခြည် အရုဏ်ကတည်းက စာတိုက်ထဲက ခုံတန်းလေးမှာ ထိုင်စောင့်နေတယ်။ မာရာ့ကို တစ်ခုခု မေးချင်တယ်တဲ့။', en: "And… Nay Chi's been sitting on the bench inside the Post Office since dawn. She wants to ask you something." },
    { my: 'အပြင်နံရံက စာရွက်တွေ သုံးဆယ့်တစ်စောင် ရှိပြီ။ ကျွန်မ ရေတွက်ထားတယ်။', en: 'The notes on the outside wall: thirty-one now. I counted.' },
  ],
  wwLater: [{ my: 'ဆိပ်ကမ်းကို သွားမလား။ ဈေးရဲ့ တောင်ဘက်လမ်းအတိုင်း ဆင်းသွား။ ချိန်ခွင်ရုံ မြင်ရမယ်။ ဒေါ်စန္ဒာက အထဲမှာ ချိန်တယ်။ အထုပ်ကြီးကြီး ငယ်ငယ် တစ်မျိုးတည်း ချိန်တာ။', en: "Off to the Wharf? Down the Market's south lane. You'll see the weigh-house. Daw Sanda weighs inside: big parcel or small, she weighs them all one way." }],
  wwEvening: [{ my: 'နံရံမှာ ဒီနေ့ နောက်ထပ် ချိတ်သွားကြပြန်ပြီ။ တချို့က "မာရာ ပြောတာ" လို့ စရေးထားကြတယ်။', en: 'More pinned on the wall today. Some of them begin "Maya says".' }],

  // ---- 5.2 · Daw Sanda (weigh-house)
  ds1: [
    { my: 'ကိုသီဟလား။ မနက်ခေါက် ထွက်သွားတယ်။ ဆိပ်ငယ်ကို မကြာခင် ပြန်ဖြတ်လာမယ်။', en: 'Ko Thiha? Out on the morning run. He comes back past Little Jetty before long.' },
    { my: 'ဆိပ်ငယ်ထိပ်မှာ ရပ်ပြီး လက်ပြလိုက်။ လက်ပြတဲ့သူတိုင်းအတွက် ရပ်ပေးတာ မနေ့ကစပြီး သူ့အကျင့်။', en: 'Stand at the end of Little Jetty and wave. Since yesterday he stops for anyone who waves.' },
  ],
  dsOrder: [
    { my: 'ညတိုင်း မအိပ်ခင် လူလေးယောက်ကို ကောင်းစေချင်တယ်လို့ စိတ်ထဲက ပြောတယ်။', en: 'Every night before I sleep, I wish four people well, in my head.' },
    { my: 'ကိုယ့်ကိုယ်ကို အရင်။ လက်တွေ နာနေတော့ တစ်ယောက်ယောက်က ကောင်းစေချင်ရမှာပေါ့။ ပြီးရင် သူငယ်ချင်း၊ ပြီးရင် ကိုယ့်သားလေး။', en: 'Myself first: my hands ache, somebody has to. Then a friend, then my boy.' },
    { my: 'နောက်ဆုံးကျ အဲဒီနေ့ ကိုယ့်ကို အဆိုးဆုံး ဆက်ဆံခဲ့တဲ့သူ။', en: 'And last, whoever treated me worst that day.' },
  ],
  dsEarly: [{ my: 'မရောက်သေးဘူး။ တံခါးပေါက်ကနေ မြောက်ဘက် ကြည့်ထား။ ဖာရာ အရောင်စုံနဲ့ ဖောင်ကို မြင်ရင် သူပဲ။', en: "Not yet. Watch north from the door. The raft with patches of every colour, that's him." }],
  dsScale: [{ my: 'ချိန်တဲ့အချိန် ဘယ်သူ့အထုပ်လဲ မကြည့်ဘူး။ ကြည့်မိရင် လက်က တစ်ဖက်ဖက် ယိမ်းသွားတတ်တယ်။', en: "When I weigh, I don't look whose parcel it is. If I look, my hand leans one way or the other." }],
  dsDone: { my: 'ရပြီ။', en: 'Done.' }, // «ရပြီ», over the big crate and the small parcel alike
  merchantAsk: [{ my: 'ကျွန်တော့် သေတ္တာကြီး ချိန်ပေးပါဦး။', en: 'Weigh my crate, would you.' }], // (added)
  childAsk: [{ my: 'အန်တီ… ဒီအထုပ်လေးလည်း ချိန်ပေးပါ။', en: 'Auntie… weigh this little one too?' }], // (added)
  dsAfter8: [{ my: 'ဒီည စာရင်းရဲ့ နောက်ဆုံးမှာ ကြိမ်ဆိပ်က အဘိုးကြီးကို ထားမယ်။ ကျွန်မ ဖာရာကို ရယ်ခဲ့တဲ့သူလေ။ သူလည်း နေကောင်းပါစေ။', en: "Tonight the last on my list is the old man on Cane Jetty. The one who laughed at my patch. May he keep well too." }],
  dsBusy: [{ my: 'ချိန်ခွင်က မစောင့်ဘူး။ ဒါပေမဲ့ ပြောချင်တာ ရှိရင် ပြော။', en: "The scale doesn't wait. But if you've something to say, say it." }], // (added)

  // ---- 5.3 · the run
  th1: [{ my: 'ဟာ… မာရာ! တစ်ခေါက်လုံး ပတ်မှာ။ လိုက်မလား။ လှော်တက် စည်းချက် ကူထိန်းပေး။', en: "Ah, Maya! I'm doing the whole run. Coming? Help me keep the stroke." }],
  hello: { my: 'နေကောင်းလား!', en: 'Keeping well!', who: 'kothiha' },
  answers: [
    { my: 'ကောင်းပါတယ်ကွ!', en: 'Doing fine!' },
    { my: 'သီဟ! ဒီနေ့ ပဲပုတ် ပါတယ်!', en: "Thiha! There's fermented beans today!" },
    { my: 'မင်းအမေကို ပြောလိုက်၊ ငါးပိ ကျန်သေးတယ်!', en: "Tell your mum there's fish paste left!" },
    { my: 'နေကောင်းတယ်၊ နေကောင်းတယ်!', en: 'Keeping well, keeping well!' },
  ],
  caneSilent: { my: '(ခုတ်သမားတွေကို "နေကောင်းလား"… အဘိုးကြီးဘက် မကြည့်ဘူး။ ဝါး နှစ်ချက် ပြင်းပြင်း ထိုးတယ်။)', en: '("Keeping well!" to the cutters… not a glance at the old man. Two hard pole strokes.)' },
  thEast: { my: 'ဟိုဘက်ကမ်းလား။ နှင်းထဲမှာ ခေါက်ထားတုန်းပဲ။ နှင်းကို ကျွန်တော် ဘာမှ မတတ်နိုင်ဘူး။ ရောက်နိုင်တဲ့ဆိပ်တွေကိုပဲ ထိုးတယ်။', en: "The far bank? Still folded up in the mist. I can't do a thing about mist. I pole to the jetties I can reach.", who: 'kothiha' },
  thHum: { my: '(ကိုသီဟ တစ်လမ်းလုံး သီချင်းညည်းလာတယ်။)', en: '(Ko Thiha hums the whole way.)' },
  rideTitle: { my: 'ကိုသီဟနဲ့ တစ်ခေါက်လုံး', en: 'The whole run with Ko Thiha' },
  rideHint: { my: 'ဝါးထိမယ့်အချိန် နှိပ်ပါ။ ဆိပ်နားရောက်ရင် "ရပ်မယ်"', en: 'Tap as the pole touches bottom. Near a jetty, Stop' },
  stopLabels: {
    firewood: { my: 'ထင်းဆိပ်', en: 'Firewood' }, fish: { my: 'ငါးဆိပ်', en: 'Fish Jetty' }, rice: { my: 'ဆန်ဆိပ်', en: 'Rice Jetty' },
    big: { my: 'ဆိပ်ကြီး', en: 'Big Jetty' }, end: { my: 'ဆိပ်ခြေ', en: 'Jetty End' }, duck: { my: 'ဘဲဆိပ်', en: 'Duck Jetty' }, cane: { my: 'ကြိမ်ဆိပ်', en: 'Cane Jetty' },
  },
  stepOn: { my: 'ဆိပ်ပေါ် တက်ကြည့်မယ် ▸', en: 'Step onto the jetty ▸' }, // (added) the Cane stop's offer, like the stop button
  thUnload: [{ my: 'ကျွန်တော် အထုပ်ချနေမယ်။ ဖြည်းဖြည်း ကြည့်။', en: "I'll unload. Take your time." }], // (added)
  rideQ: { my: 'ဒီခရီးမှာ ကိုယ်တိုင် မြင်ခဲ့တာ ဘာလဲ။', en: 'What did I see on this run, myself?' },
  rideChoices: [
    { my: 'လူတိုင်းကို နှုတ်ဆက်တယ်။', en: 'He greets everyone.' },
    { my: 'ဆိပ်တိုင်းက လူတိုင်းကို နှုတ်ဆက်တယ်။ ကြိမ်ဆိပ်က အဘိုးကြီး တစ်ယောက်ကိုပဲ ကျော်သွားတယ်။', en: 'He greeted everyone on every jetty, except the old man on Cane Jetty.' },
    { my: 'အဘိုးကြီးကို ဒေါသထွက်နေတယ်။', en: "He's angry with the old man." },
  ],
  rideWrong: [
    [{ my: '(သူ့စာထဲမှာ အဲလို စရေးထားတာ။ ကိုယ်တိုင်တော့ တစ်ယောက် ကျန်တာ မြင်ခဲ့တယ်။)', en: "(That's how his letter began. I saw one left out.)" }],
    [],
    [{ my: '(ဒေါသ မမြင်ခဲ့ဘူး။ တစ်လမ်းလုံး သီချင်းညည်းလာတာ။ ဒါ ကြားထားတာပဲ။)', en: "(I saw no anger. He hummed all the way. That's only what I heard.)" }],
  ],
  rideDone: [{ my: '(ဆက်ဆံပုံ နှစ်မျိုး။ လူတိုင်းကို တစ်မျိုး၊ တစ်ယောက်ကို တခြားတစ်မျိုး။)', en: '(Two ways of treating people. One way for everyone, another for one.)' }],
  thHome: [{ my: 'တစ်ခေါက်လုံး လိုက်စီးတဲ့သူတိုင်း ထမင်းစားရတယ်။ ဟိုလှေကားထိပ်က အိမ်လေး၊ ဖာရာစတွေ လှန်းထားတဲ့အိမ်။ တက်ခဲ့လေ အစ်မ။', en: 'Anyone who rides the whole run gets rice. The little house up the steps, patches on the line. Come up, sister.' }],
  thWaitHome: [{ my: 'ထမင်း ပြင်ထားတယ်။ တက်ခဲ့။', en: "Rice is ready. Come up." }], // (added)

  // ---- 5.4 · the cane shed
  looks: {
    rack: { pencil: { my: 'ကြိမ်ကို ပစ်ထားတာ', en: 'he leaves the cane lying' }, gold: { my: 'အရိပ်ထဲမှာ ဖြည်းဖြည်း ခြောက်အောင် လက်နဲ့ လှန်ထားတာ။', en: 'Drying slowly in the shade, turned by hand.' } },
    jar: { pencil: { my: 'ရေကို သူ့ဟာသူ သိမ်းထားတာ', en: 'keeps the water to himself' }, gold: { my: 'ကြိမ်ခုတ်သမားတွေအတွက် ကိုယ်တိုင် ဖြည့်ထားတဲ့ ရေအိုး။', en: 'A jar he fills himself, for the cutters.' } },
    tally: { pencil: { my: 'ကြိမ်စည်းကို လျှော့စည်းတယ်', en: 'short-ties his bundles' }, gold: { my: 'စည်းတိုင်း ရေတွက်ထားတယ်။ ပြည့်ပြည့်၊ တင်းတင်း။', en: 'Every bundle counted. Full and tight.' } },
    hands: { pencil: { my: 'လျှာထက်တဲ့ အဘိုးကြီး', en: 'sharp-tongued old man' }, gold: { my: 'လက်ဖဝါးမှာ ကြိမ်ရာတွေ ပြည့်နေတယ်။ နှစ်လေးဆယ် ခုတ်ခဲ့တာ။ စကားလည်း ထက်တယ်။', en: 'Cane scars all over his palms: forty years of cutting. His words are sharp too.' } },
  },
  heard: { my: 'ကြားထားတာ', en: 'heard' },
  seen: { my: 'ကိုယ်တိုင် မြင်တာ', en: 'seen' },
  ubTap: [{ my: 'ငါ့ကြိမ်ကို မနင်းနဲ့။ ရေသောက်ချင် သောက်၊ ခွက်ကို ပြန်ထား။', en: "Don't tread on my cane. Drink if you want; put the cup back." }],
  lookedAll: [{ my: 'သူ့ကြိမ် ရောင်းကောင်းတာ သူ လုပ်ထားလို့ပဲ။ စကားထက်တာကတော့ သူ့ဟာသူ သယ်ရမှာ။', en: 'His cane sells for the work he puts in. His sharp words are his to carry.' }],
  ucs: [
    { my: 'ဘာကြည့်နေတာလဲ။ ငါ့ကြိမ်ကို မနင်းနဲ့။', en: "What are you staring at? Don't tread on my cane." },
    { my: 'ဒီကြိမ်တွေ ငါ ကိုယ်တိုင် ခုတ်တာ။ နှစ်လေးဆယ်ရှိပြီ။', en: "I've cut this cane myself. Forty years now." },
  ],
  ubAfter: [{ my: '…ဟွန်း။', en: '…Hmph.' }],

  // ---- 5.5 / 5.6 · the talk and the four wishes (talk data: talks/day6.js)
  cloudMiss: [{ my: '(သူ ပူလောင်နေတာ မဟုတ်ဘူး။ အေးစေမယ့်စကား လိုမှ မလိုတာ။)', en: "(He isn't burning. Cooling words have nothing to cool.)" }],
  thNotYet: [{ my: 'ခဏ ထိုးလိုက်ဦးမယ်။ ပြန်လာရင် ဆိပ်ငယ်မှာပဲ။', en: "I'll do a quick run. I'll be back at Little Jetty." }],
  thC: [
    { my: 'အမေ ညတိုင်း လုပ်သလို လုပ်ကြည့်မယ်။ စာရွက်လေး လေးရွက်။', en: "I'll do what mother does every night. Four little notes." },
    { my: 'ပထမ တစ်ရွက်က ကိုယ့်အတွက်။ ဝါးမှာ ချိတ်ထားမယ်။', en: "The first one's for me. I'll pin it to my pole." },
    { my: 'ဒီနှစ်ရွက် ယူသွားပေးပါလား အစ်မ။ ကိုယ်တိုင် ပေးရင် မျက်နှာ နီမှာ။ အစဉ်လိုက်နော်။', en: "Would you take these two, sister? I'd go red giving them myself. In order, okay?" },
    { my: 'နောက်ဆုံး တစ်ရွက်ကတော့ စိတ်ထဲမှာပဲ ထားမယ်။ သူ့ကိုတော့ လူတိုင်းကို ပြောသလိုပဲ ပြောမယ်။', en: "The last one I'll keep in my head. To him I'll say what I say to everyone." },
  ],
  notes: [
    { my: 'ငါ စိတ်အေးအေးနဲ့ ထိုးနိုင်ပါစေ။', en: 'May I pole with a cool head.' },
    { my: 'မောင်ငယ့် အထုပ်တွေ အကုန် အချိန်မီ ရောက်ပါစေ။ (လှည်းပုံလေး)', en: "May all Maung Nge's parcels arrive on time. (a little cart drawn)" },
    { my: 'အမေ့လက်တွေ မနာပါစေနဲ့။', en: "May mother's hands stop aching." },
    { my: 'ဦးဘိုလေး နေကောင်းပါစေ။', en: 'May U Bo Lay keep well.' },
  ],
  noteTitle: (n) => ({ my: `ဆုတောင်းစာရွက် ${['၁', '၂', '၃', '၄'][n]}`, en: `Wish note ${n + 1}` }),
  mnNote: [{ my: 'ငါ့အတွက်လား။ …ဟဲဟဲ။ ငါ့လှည်းပုံ! "မောင်ငယ်" … ကိုယ်တိုင် ဖတ်လို့ရတယ်။', en: 'For me? …Heh. My cart! "Maung… Nge"… I can read that myself.' }],
  dsNote: [{ my: 'ကလေးက… ကျွန်မကို ဒုတိယ မထားဘဲ တတိယမှာ ထားတယ်။ ပိုချစ်လို့ပေါ့လေ။', en: 'My boy… he put me third, not second. The dearer one, then.' }],
  dsNotYet: [{ my: 'မောင်ငယ့်ဟာ ရောက်ပြီလား။ သူ အစဉ်လိုက် ရေးထားတာ။ အစဉ်လိုက် ပေးလိုက်ပါ။', en: "Has Maung Nge had his yet? He wrote them in order. Give them in order." }],
  thWait: [{ my: 'စာရွက်နှစ်ရွက် ရောက်ပြီလား အစ်မ။', en: 'Did the two notes get there, sister?' }],
  thBack: [{ my: 'ကဲ… နောက်တစ်ခေါက်။ ကြိမ်ဆိပ်ထိ လိုက်ခဲ့။', en: 'Right… another run. Come as far as Cane Jetty.' }],

  // ---- 5.7 · H at Cane Jetty
  steadyTitle: { my: 'ခေါင်းမငုံ့၊ မော့လည်း မမော့', en: 'Head not bowed, not tossed up' },
  steadyHint: { my: 'ကောင်းတာရော မကောင်းတာရော ဖြတ်သွားပါစေ။ မြေကြီးလို ငြိမ်ငြိမ်လေး။', en: 'Let the good and the bad both pass. Still, like the ground.' },
  gustsH: [
    { at: 1.0, from: 'post', kind: 'jeer', push: 0.6, text: { my: 'ဖာထေးထားတဲ့ ဖောင်အိုကြီး မိုးမကျခင် နစ်မှာပဲ။', en: "That patched-up old raft'll sink before the rains." } },
    { at: 3.2, from: 'jetty', kind: 'praise', push: 0.6, text: { my: 'ချောင်းတစ်ခုလုံးမှာ အတော်ဆုံး ဝါးထိုးသမား! ကူးတို့ကို မင်း မောင်းသင့်တယ်!', en: 'Best pole on the whole stream! You should be running the ferry!' } },
    { at: 5.4, from: 'post', kind: 'jeer', push: 0.8, text: { my: 'ငါ့ဆိပ်ကို အဲဒီအစုတ်နဲ့ မတိုက်နဲ့။', en: "Don't bump my jetty with that rag of a thing." } },
    { at: 7.0, from: 'jetty', kind: 'praise', push: 0.8, text: { my: 'မင်းမရှိရင် ငါတို့ကြိမ် ဒီမှာပဲ ဆွေးကုန်မှာ!', en: 'Without you our cane would rot out here!' } },
  ],
  steadyReact: {
    bowed: { my: 'ခေါင်းငုံ့ခံတာ မဟုတ်ဘူး… ပြန်ငြိမ်ပါရစေ။', en: 'Not bowing my head to it… let me settle again.' },
    tossed: { my: 'မြှောက်ခံရလို့ ပေါ့သွားပြီ… ပြန်ငြိမ်ပါရစေ။', en: 'The praise floated me off… let me settle again.' },
    clench: { my: 'တင်းနေပြီ။ လက်ကို လျှော့။', en: "I'm bracing. Loosen up." },
  },
  hInto: [{ my: '(ဖောင်ကို ကြိမ်ဆိပ်မှာ ချည်တယ်။ ကြိမ်ခုတ်သမားက အထုပ်ကို ဆွဲတင်တယ်။ ဦးဘိုလေးက သူ့တိုင်ပေါ်မှာ။)', en: '(The raft ties up at Cane Jetty. A cane-cutter hauls the parcel up. U Bo Lay sits on his post.)' }], // (added, from the stage note)
  shedOffer: [
    { my: 'ဖောင်ပေါ်မှာပဲ နေမယ်။', en: '(Stay on the raft.)' },
    { my: 'ကြိမ်တဲထဲ ခဏ ဝင်ကြည့်မယ်။', en: '(Step off and look inside the cane shed first.)' },
  ], // (added)
  thHello: [{ my: 'နေကောင်းလား!', en: 'Keeping well!' }],
  thAfter: [
    { my: 'ခေါင်းတစ်ချက် ညိတ်တာပဲ။ …ရပါတယ်။', en: "Just one nod. …That's fine." },
    { my: 'အခု လူတိုင်း တစ်မျိုးတည်း ဖြစ်သွားပြီ။', en: 'Everyone, one way now.' },
  ],
  mayaAfter: [{ my: '(ဘာမှ ပြန်မရဘူး။ ဒါပေမဲ့ ဆက်ဆံပုံ တစ်မျိုးတည်း ဖြစ်သွားပြီ။)', en: "(Nothing came back. But it's one way of treating people now.)" }],
  thAfter8: [{ my: 'လူတိုင်း "နေကောင်းလား"။ အသံတောင် ပိုကျယ်လာသလိုပဲ။', en: 'Everyone gets "keeping well!" now. My voice even feels bigger.' }],

  // ---- 6.1 · Nay Chi's ask (sorting room)
  nc1: [
    { my: 'မနေ့က အစ်မ ပြောတာ မှန်တယ်။ ဆေးရေးမြေပုံထဲက တံတား တကယ် မရှိဘူး။', en: "You were right yesterday. The bridge on the painted map really wasn't there." },
    { my: 'မနက်ဖြန် တံတားအသစ် ဖွင့်မယ်။ သန်ဘက်ခါ ဟိုဘက်ကမ်းမှာ ပထမဆုံး အလုပ် စဝင်ရမယ်။', en: 'The new bridge opens tomorrow. The day after, I start my first job on the far bank.' },
    { my: 'ဟိုရောက်ရင် လမ်းပျောက်မှာ ကြောက်တယ်။ အစ်မ မြေပုံက မှန်တဲ့ မြေပုံလေ။', en: "I'm scared I'll get lost over there. Your map is the one that's right." },
    { my: 'မှတ်ထားရမယ့်ဟာ ဆယ်ခု ရေးပေးပါလား။ တိုတိုလေး။ တံတားဘုတ်မှာ ချိတ်ပြီး ဖြတ်တိုင်း ဖတ်မယ်။', en: "Would you write me ten things to remember? Short ones. I'll hang them on the bridge board and read them every time I cross." },
  ],
  mayaYes: [{ my: 'ရတာပေါ့။ ကျွန်မမှာ ဆယ်ကြောင်းတိတိ ပါတဲ့ စာမျက်နှာတစ်မျက်နှာ ရှိတယ်။', en: 'Of course. I have a page with exactly ten lines.' }],
  mayaThink: [{ my: '(ဆယ်ကြောင်း ရေးပေးလိုက်ရင် သူ လမ်းမပျောက်တော့ဘူးပေါ့။)', en: "(If I write her ten lines, she won't get lost.)" }],
  chalking: { my: '(စာခွဲစားပွဲမှာ ကျောက်သင်ပုန်းလေး ဆယ်ချပ်ကို မီးခိုးရောင် မြေဖြူနဲ့ ရေးတယ်။ နေခြည်က လွယ်အိတ်ထဲ ထပ်ထည့်တယ်။)', en: '(At the sorting table Maya chalks ten small slates in grey chalk. Nay Chi stacks them in her satchel.)' }, // (added: the spec's cut, said)
  nc2: [{ my: 'ကျေးဇူးပဲ အစ်မ! ဈေးလမ်းအဆုံး တံတားထိပ်က ဘုတ်မှာ သွားချိတ်မယ်။ လက်ဖက်ရည်ဆိုင်လမ်း ကျော်ရင် ရောက်ပြီ။', en: "Thanks, sister! I'll hang them on the board at the bridgehead, the end of the Market road. Just past the tea-shop street." }],
  ncBoard: [{ my: 'ဆယ်ချပ်လုံး ချိတ်ပြီးပြီ။ …ဒါပေမဲ့ အစ်မ ရေးတာ ကျွန်မ မမှတ်မိဘူး။ ဘုတ်ကိုပဲ ကြည့်ရမှာ။', en: "All ten hung. …But I don't remember what you wrote. I'll just have to look at the board." }],
  ncHanging: [{ my: 'ချိတ်နေတုန်း။ တစ်ချပ်ချင်း သေချာ ချိတ်မယ်။', en: "Still hanging them. One by one, properly." }], // (added)

  // ---- 6.2 · the noon wind
  windUp: { my: 'လေထလာပြီ။', en: "Wind's getting up." },
  gustMaya: [{ my: '(လေကြီး ဝှီးခနဲ… တံတားဘက်က ကျောက်သင်ပုန်းလေးတွေ ကောင်းကင်ထဲ လွင့်တက်လာတယ်။)', en: '(A great gust… little slates come flying up from the bridge.)' }],
  ncGust: [
    { my: 'ကျွန်မ ကျောက်သင်ပုန်းတွေ! တစ်ချပ်ပဲ ဘုတ်မှာ ကျန်တော့တယ်။ လေးချပ်က အဝေးကြီး လွင့်သွားတာ မမြင်ရတော့ဘူး…', en: "My slates! Only one's left on the board. Four went so far I lost sight of them…" },
    { my: 'ကျန်တဲ့ ငါးချပ် ဈေးဘက်၊ ဆိပ်ကမ်းဘက် ကျသွားတယ်။ အစ်မ… အဲဒါတွေ မပါရင် ကျွန်မ ဘာမှ မမှတ်မိဘူး။', en: "Five came down over the Market and the Wharf. Sister… without them I can't remember a thing." },
  ],
  mayaGust: [{ my: 'ရှာကြမယ်။ ဘယ်သူ ဘယ်မှာ ကျတာ မြင်လိုက်လဲ မေးကြည့်ရအောင်။', en: "We'll find them. Let's ask who saw where they came down." }],
  clueKophyo: [{ my: 'ကျောက်သင်ပုန်းလား။ တစ်ချပ်က ဆိုင်တံခါးပေါ်က တံဆိပ်ခေါင်းမိုးပေါ် ကျတယ်။ နောက်တစ်ချပ်က နောက်ပြတင်းကနေ ဝင်လာပြီး လက်ဖက်ခြင်းထဲ ပြုတ်ကျတယ်။', en: 'Slates? One landed on the stamp awning over the shop door. Another came in the back window and dropped in the tea-leaf basket.' }],
  clueKhwarnyo: [{ my: 'တစ်ချပ်က စာကောင်တာပေါ်က တံဆိပ်ခေါင်းပုံထဲမှာ မှောက်ကျနေတယ်။ ကိုင်ရမှာ အားနာလို့။', en: "One's face down in the stamp heap on the letter counter. I didn't like to touch it." }],
  clueMaungnge: [{ my: 'တစ်ချပ်က ကျွန်တော့် လှည်းထဲ တည့်တည့် ကျတယ်! နောက်တစ်ချပ်က တံခါးပေါက်ကနေ လွင့်ဝင်သွားပြီး ချိန်ခွင်ရုံထဲက ကြိုးစင်မှာ ငြိနေတယ်။ အထမ်းသမားတွေ ထိုင်ပြောနေတဲ့နေရာ။', en: 'One fell smack into my cart! And one blew in through the door and caught on the rope rack inside the weigh-house, where the porters sit and talk.' }],
  ncFollow: [{ my: 'နောက်တစ်ချပ် ဘယ်မှာ ကျလဲ… မြင်လိုက်တဲ့သူ ရှိမှာပါ။', en: 'Where did the next one come down… somebody must have seen.' }], // (added)

  // ---- 6.3 · slate 1 (tea shop)
  kpHook: [{ my: 'ခဏ… ဇွန်းနဲ့ ချိတ်ချလိုက်မယ်။ …ရော့၊ ကလေး။', en: "Hang on… I'll hook it down with the ladle. …Here, girl." }], // (added: he hooks it off the awning)
  kpCup: [{ my: 'ထိုင်ဖတ်ချင်ရင် အထဲက နံရံကပ်ခုံတန်းမှာ ထိုင်။ ဒီခွက် ယူသွား။ ပိုက်ဆံ မပေးနဲ့။', en: "If you want to sit and read it, there's a bench along the wall inside. Take this cup. Don't pay." }],
  ncCupQ: [{ my: 'ဆိုင်ထဲမှာ လူတွေ ကျပ်နေတယ်… ဖိတ်မှာ ကြောက်တယ်။', en: "The shop's packed… I'm scared I'll spill it." }],
  cupTitle: { my: 'ကိုယ့်ခွက် ကိုယ်ကိုင်', en: 'Your own cup, your own hands' },
  cupHint: { my: 'ကူမယ့်လက်တွေကို ယဉ်ယဉ်ကျေးကျေး ငြင်း၊ ခွက်ကို ဖြောင့်ဖြောင့်ကိုင်', en: 'Turn the helping hands down kindly; keep the cup level' },
  gustsCup: [
    { at: 0.15, from: 'left', kind: 'hand', push: 0.5, text: { my: 'ငါ သယ်ပေးမယ်!', en: "I'll carry it!" } },
    { at: 0.35, from: 'right', kind: 'hand', push: 0.6, text: { my: 'ဘယ်ဘက်က သွား၊ ဘယ်ဘက်!', en: 'Go left, left!' } },
    { at: 0.55, from: 'left', kind: 'hand', push: 0.6, text: { my: 'လက်နှစ်ဖက်နဲ့ ကိုင်လေ!', en: 'Use both hands!' } },
    { at: 0.75, from: 'right', kind: 'hand', push: 0.7, maya: true, text: { my: 'ပေး၊ အစ်မ ကိုင်ပေးမယ်။', en: "Give it here, I'll hold it." } },
  ],
  cupSpill: { my: 'ဖိတ်သွားပြီ… ကိုဖြိုး၊ နောက်တစ်ခွက် ရမလား။', en: 'Spilled… Ko Phyo, could I have another?' },
  ncCupDone: [{ my: 'ကိုယ့်ခွက် ကိုယ်ကိုင်တော့ မဖိတ်ဘူး။ …အစ်မလက်ကိုလည်း ငြင်းလိုက်မိတယ်နော်။', en: "My own cup in my own hands didn't spill. …I even said no to your hand, sister." }],
  mayaCup: [{ my: '(ငြင်းတာ မှန်တယ်။ ကျွန်မလက်လည်း ဘေးက လက်တွေထဲက တစ်ဖက်ပဲ။)', en: '(She was right to. Mine was just one more hand from the side.)' }],
  kpAfter1: [{ my: 'ခွက်ကို ကိုယ်တိုင် ကိုင်သွားတဲ့ကလေး။ တော်တယ်။', en: 'The girl who carried her own cup. Good for her.' }],
  kpDefault: [{ my: 'နေ့လယ် လူကျပ်တယ်။ ခုံရရင် ထိုင်။', en: 'Packed at noon. Sit if you find a stool.' }], // (added)

  // ---- 6.4 · slate 3 (the tea-leaf basket)
  kpHabit: [
    { my: 'ဟိုနေ့ကစပြီး မနက်တိုင်း အရုဏ်မတက်ခင် လက်ဖက်ခြောက် ကိုယ်တိုင် သွားယူတယ်။ ထင်ထားတာထက် ခက်တယ်ကွ။', en: 'Since that day I fetch my own leaves before dawn, every morning. Harder than I thought.' },
    { my: 'တချို့မနက် ထချင်စိတ်တောင် မရှိဘူး။ ဒါပေမဲ့ အဲဒီကတည်းက ပထမခွက်က တစ်ခါမှ နောက်မကျဖူးဘူး။ လက်ဖက်ရည်လည်း ပိုကောင်းလာတယ်။', en: "Some mornings I don't even want to get up. But the first cup's never once been late since. And the tea's got better." },
  ],
  kpFind: [{ my: '(ကိုဖြိုး လက်ဖက်ခြောက် ကော်လိုက်တော့ ကျောက်သင်ပုန်းလေး ပါလာတယ်။)', en: '(Scooping leaves for his pot, Ko Phyo comes up with a little slate.)' }], // (added)
  ncHabitQ: [{ my: 'ကျွန်မလည်း တစ်ခုခု ထိန်းချင်တယ်။ အစ်မ… ဘာထိန်းရမလဲ ရွေးပေးပါလား။', en: 'I want to keep one too. Sister… pick one for me?' }],
  habitChoices: [
    { my: '"မနက်တိုင်း ကျောက်သင်ပုန်းတွေ ဖတ်။"', en: '"Read the slates every morning."' },
    { my: '"အလုပ်မှာ စကား နည်းနည်းပဲ ပြော။"', en: '"Talk less at work."' },
    { my: '"နေခြည် ကိုယ်တိုင် ဘာကို ထိန်းချင်လဲ။"', en: '"What would you like to keep, Nay Chi?"' },
  ],
  ncLean: [{ my: 'ဟုတ်… အစ်မ ပြောရင် လုပ်မှာပေါ့။', en: "Okay… if you say so, I'll do it." }],
  mayaLean: [{ my: '(ကျွန်မ ရွေးပေးရင် ကျွန်မ စည်းကမ်း ဖြစ်သွားမယ်။ သူ့ဟာ မဟုတ်ဘူး။)', en: "(If I pick it, it's my rule, not hers.)" }],
  ncOwn: [{ my: 'အင်း… တံတားထိပ်ကို ခေါင်းလောင်း ပထမတစ်ချက် မထိုးခင် ရောက်အောင် သွားမယ်။ မနက်ဖြန်ကစမယ်။', en: "Mm… I'll be at the bridgehead before the first bell. Starting tomorrow." }],
  tintin: [{ my: 'ကိုဖြိုးက မီးဖိုနားမှာ။ ငါ့ဆိုင်မှာ သူ လက်ဖက်ရည် ငှဲ့တယ်။', en: "Ko Phyo's at the stove. He pours in my shop." }], // (added)
  basketEmpty: [{ my: '(လက်ဖက်ခြောက် မွှေးမွှေး။)', en: '(Tea leaves, fragrant.)' }], // (added)

  // ---- 6.5 · slate 5 (letter counter)
  heapFind: [{ my: '(တံဆိပ်ခေါင်းပုံထဲမှာ ကျောက်သင်ပုန်းလေး မှောက်လျက်။ နေခြည် ကိုယ်တိုင် ဆွဲထုတ်တယ်။)', en: '(A little slate face down in the stamp heap. Nay Chi draws it out herself.)' }], // (added)
  ncSeen: [{ my: 'သန်ဘက်ခါ အလုပ်မှာ လူတိုင်း ကျွန်မကို ကြည့်နေကြမှာ။ အသစ်ဆိုတော့။', en: "At work everyone will be watching me. I'm new." }],
  mayaSeen: [{ my: 'ဒီကောင်တာနားက လူတွေ နင့်ကို ကြည့်နေလား။ တစ်ယောက်ချင်း ကြည့်ကြည့်။', en: 'Are the people round this counter watching you? Look at each one.' }],
  seen: {
    stampwoman: { my: 'သမီးဆီ စာပို့ဖို့ တံဆိပ်ခေါင်း ရေတွက်နေတယ်။ နှုတ်ခမ်းလေး လှုပ်နေတယ်။', en: 'Counting stamps for a letter to her daughter, lips moving.' },
    porter: { my: 'ပခုံးကို နှိပ်နေတယ်။ ထမင်းစားချိန် ရောက်ပြီလား နာရီကို ကြည့်နေတယ်။', en: 'Rubbing his shoulder, eyeing the clock for lunch.' },
    khwarnyo: { my: 'လျှာလေးထုတ်ပြီး ထွင်းနေတယ်။ ဘယ်သူ့ကိုမှ မမြင်ဘူး။', en: 'Carving with her tongue out. She sees no one.' },
  },
  ncSeenDone: [{ my: 'ဘယ်သူမှ ကျွန်မကို မကြည့်ဘူး။ ကိုယ့်ကိစ္စနဲ့ကိုယ်ပဲ။ …စိတ်သက်သာသွားတယ်။', en: "Nobody's looking at me. Each one's busy with their own. …What a relief." }],
  luaye: [{ my: 'တံဆိပ်ခေါင်း လိုသလား။ ကောင်တာပေါ်မှာ အပုံလိုက်ပဲ။', en: "Need stamps? There's a heap on the counter." }], // (added)
  kwBefore: [{ my: 'တံတားဘုတ်မှာ ကျောက်သင်ပုန်းလေးတွေ ချိတ်ထားတာ မြင်လား။ နေ့လယ်လေ တိုက်ရင် လွင့်ကုန်မှာ။', en: 'See the little slates on the bridge board? The noon wind will take them.' }],
  kwDefault: [{ my: 'ဘောင်ကွပ်လေး ထွင်းနေတယ်။ ခဏနော်။', en: "I'm carving a border. Just a moment." }], // (added)
  kolwin: [{ my: 'ဘောင်တစ်ခု ထွင်းနေတယ်။ ဘယ်သူ့အတွက်မှ မဟုတ်ဘူး၊ လက်ယားလို့။', en: 'Carving a border. For nobody; my hands itch.' }],

  // ---- 6.6 · slate 2 (rope rack)
  ropeFind: [{ my: '(ကြိုးခွေကြားမှာ ကျောက်သင်ပုန်းလေး ငြိနေတယ်။ နေခြည် ဖြုတ်ယူပြီး ခုံတန်းအစွန်းမှာ ထိုင်ဖတ်တယ်။)', en: "(A little slate caught between the coils. Nay Chi unhooks it and sits at the bench's end to read it.)" }], // (added)
  ncWindQ: [{ my: 'ဒီလူတွေ ပြောတာ ကြားရင် ရင်တုန်တယ်။ အကောင်းပြောရင် မြောက်တက်၊ အဆိုးပြောရင် ပြုတ်ကျ။', en: 'When I hear them my heart jumps. Good news, I float up. Bad news, I drop.' }],
  rockTitle: { my: 'ကျောက်တုံးလို', en: 'Like a rock' },
  rockHint: { my: 'လက်ကို လျှော့ထား။ စကားတွေ ဖြတ်သွားပါစေ။', en: 'Keep your hand loose. Let the words go past.' },
  gustsRock: [
    { at: 0.8, kind: 'talk', push: 0.5, up: true, text: { my: 'တံတား မနက်ဖြန် ဖွင့်မယ်တဲ့! ကောင်းလိုက်တာ!', en: 'Bridge opens tomorrow! Great!' } },
    { at: 2.2, kind: 'talk', push: 0.6, up: false, text: { my: 'တံတားက လှုပ်တယ်တဲ့။ ကြောက်စရာ။', en: 'They say the bridge sways. Scary.' } },
    { at: 3.6, kind: 'talk', push: 0.6, up: true, text: { my: 'ဟိုဘက်က အလုပ်တွေက အကောင်းဆုံးပဲ!', en: 'The jobs over there are the best!' } },
    { at: 5.0, kind: 'talk', push: 0.7, up: false, text: { my: 'အသစ်ဝင်တဲ့သူတွေ တစ်ပတ်တောင် မခံဘူးတဲ့။', en: "They say new starters don't last a week." } },
    { at: 6.4, kind: 'talk', push: 0.5, up: false, text: { my: 'မိုးကျရင် ဆိပ်ကမ်း ပိတ်မယ်တဲ့။', en: 'They say the wharf shuts when it rains.' } },
  ],
  rockReact: {
    bowed: { my: 'အဆိုးကြားတော့ ပြုတ်ကျသွားပြီ… ပြန်ငြိမ်မယ်။', en: 'The bad news dropped me… settling again.' }, // (added)
    tossed: { my: 'အကောင်းကြားတော့ မြောက်တက်သွားပြီ… ပြန်ငြိမ်မယ်။', en: 'The good news floated me up… settling again.' }, // (added)
    clench: { my: 'တင်းနေပြီ။ ကျောက်တုံးက မတင်းဘူး။', en: "I'm bracing. A rock doesn't brace." }, // (added)
  },
  ncWindDone: [{ my: 'ကြားတော့ ကြားတယ်။ ယူမထားလိုက်ဘူး။ ပြုံးထားရင် ပိုလွယ်တယ်။', en: "I heard them. I didn't keep them. It's easier smiling." }],

  // ---- 6.7 · slate 4 (the cart)
  cartLift: [{ my: '(နေခြည် အထုပ်တွေကို တစ်ထုပ်ချင်း မပြီး ကျောက်သင်ပုန်းကို ယူတယ်။ ပြီးတော့ အထုပ်တွေ ပြန်တင်တယ်။)', en: '(Nay Chi lifts the parcels off one by one, takes her slate, and puts them back.)' }], // (added)
  mnRound: [{ my: 'ကဲ၊ ငါ အထုပ်ပို့ထွက်ဦးမယ်။', en: "Right, I'm off on my round." }], // (added)
  mnLost: [{ my: 'ငါးဆိပ်က သူတို့အထုပ် မရောက်ဘူးတဲ့! ငါးဆိပ်စင်ပေါ်မှာ မရှိဘူး…', en: "Fish Jetty says their parcel never came! It's not on the Fish shelf…" }],
  ncLook: [{ my: 'ခဏ… ကျွန်မ ကြည့်မယ်။', en: 'Wait… let me look.' }],
  tagDuck: { my: 'ဘဲဆိပ် (ဘဲပုံ)', en: 'Duck Jetty (a duck)' },
  tagFish: { my: 'ငါးဆိပ် (ငါးပုံ)', en: 'Fish Jetty (a fish)' },
  shelfDuck: { my: 'ဘဲဆိပ် စင်', en: 'the Duck shelf' },
  shelfFish: { my: 'ငါးဆိပ် စင်', en: 'the Fish shelf' },
  ncFound: [{ my: 'ဒါ ကျွန်မ။ ကျောက်သင်ပုန်း ယူတုန်းက စင်မှားပြီး ပြန်တင်လိုက်တာ။', en: "That's me. I put it back on the wrong shelf when I got my slate." }],
  sorryChoices: [
    { my: 'ဆောရီး၊ ဒါပေမဲ့ တံဆိပ်တွေက ဆင်တူနေတာလေ။', en: 'Sorry, but the tags look alike.' },
    { my: 'ဆောရီး မောင်ငယ်။ ကျွန်မ စင်မှား တင်မိတာ။ အခုပဲ ငါးဆိပ်ကို ကိုယ်တိုင် ပို့ပေးမယ်။', en: "Sorry, Maung Nge. I put it on the wrong shelf. I'll take it to Fish Jetty myself, now." },
    { my: 'ကျွန်မ မဟုတ်ပါဘူး။ လေကြောင့်ပါ။', en: "It wasn't me. It was the wind." },
  ],
  sorryQ: { my: 'နေခြည် ဘယ်လို တောင်းပန်မလဲ။', en: 'How does Nay Chi say sorry?' }, // (added) the pick is hers
  sorryWrong: [
    [{ my: 'ဆောရီး ပြောပြီး "ဒါပေမဲ့" ဆက်ရင် ဆောရီးက ပျောက်သွားသလိုပဲ။', en: 'Say sorry and then "but", and the sorry sort of disappears.' }],
    [],
    [{ my: 'လေက အထုပ်ကို စင်ပေါ် ပြန်မတင်ဘူးလေ။', en: "The wind doesn't put parcels back on shelves." }],
  ],
  ncCarryNo: [{ my: 'ဟင့်အင်း၊ ကျွန်မ မှားတာ ကျွန်မ ပို့မယ်။', en: "No, my mistake, I'll take it." }],
  fishThanks: [{ my: 'ရောက်ပြီပဲ။ ကိစ္စမရှိဘူး သမီး။', en: "It's here, that's what matters. No harm done, dear." }],
  fishDefault: [{ my: 'ငါးပိ ဝယ်မလား။ ဒီနေ့ ကောင်းတယ်။', en: 'Fish paste? Good today.' }], // (added)
  mnAfter4: [{ my: 'ကျွန်တော်လည်း ဖြည်းဖြည်း ဖတ်ရတော့ နှစ်ခါ စစ်တယ်။ ဒီနေ့ကစပြီး စင်လည်း နှစ်ခါ စစ်မယ်။', en: "I read slowly, so I check twice. From today I'll check the shelves twice too." }],

  // ---- 6.8 · evening
  ncEve: [
    { my: 'ပြန်ရတဲ့ ကျောက်သင်ပုန်းတွေ ဒီမှာ။ ကျန်တာတွေ မနက်ဖြန် ရှာမယ်။ တံတားဖွင့်ပွဲလည်း ရှိတယ်။', en: "Here are the ones I got back. I'll look for the rest tomorrow. The bridge opens, too." },
    { my: 'အစ်မ… မနက်တိုင်း ဒါတွေ ကျွန်မကို ဖတ်ပြပေးမလား။ အစ်မ ဖတ်ပြမှ သေချာမှာ။', en: "Sister… will you read them to me every morning? I'll only be sure if you read them." },
  ],
  ncEve0: { my: 'ကျောက်သင်ပုန်းတွေ မနက်ဖြန် ရှာမယ်။', en: "I'll look for my slates tomorrow." },
  mayaEve: [{ my: 'ရတာပေါ့။ ယူလာခဲ့။', en: 'Of course. Bring them.' }],
  mayaPencil: [{ my: '(သူ့ကျောက်သင်ပုန်းတွေက မီးခိုးရောင် ခဲတံစာပဲ ရှိသေးတယ်။ ဘယ်သူမှ မခိုင်းဘဲ သူကိုယ်တိုင် ထပ်လုပ်တဲ့နေ့ ရွှေရောင် ဖြစ်မယ်။)', en: "(Her slates are still grey pencil. They'll turn gold the day she does them again without anyone asking.)" }],
  ncHome: [{ my: 'မနက်ဖြန် တွေ့မယ် အစ်မ။', en: 'See you tomorrow, sister.' }], // (added)

  // ---- 7 · ambient
  mn: [
    { my: 'နေ့လယ်ချိန် ရေစီးဘက်က လေကြီး တိုက်တတ်တယ်။ ချည်မထားတာ မှန်သမျှ ယူသွားတာ။', en: 'Around noon a big wind comes off the stream. It takes anything not tied down.' },
    { my: 'ကိုသီဟက ဆိပ်တိုင်းမှာ "နေကောင်းလား" အော်တယ်။ ကြိမ်ဆိပ်ကျ ခုတ်သမားတွေကိုပဲ အော်ပြီး တိတ်သွားတယ်။', en: 'Ko Thiha shouts "keeping well!" at every jetty. At Cane Jetty he shouts to the cutters, then goes quiet.' },
    { my: 'ချိန်ခွင်ရုံက အထမ်းသမားတွေ စကားများတယ်။ အကုန်ယုံရင် ခေါင်းကိုက်မယ်။', en: "The weigh-house porters talk a lot. Believe it all and you'll get a headache." },
    { my: 'ဒေါ်စန္ဒာက ချိန်ခွင်ရုံထဲမှာ။ ကျွန်တော့်အထုပ်သေးသေးလေးတွေကိုလည်း ကုန်သည်သေတ္တာကြီးတွေလိုပဲ သေချာ ချိန်ပေးတယ်။', en: "Daw Sanda's inside the weigh-house. She weighs my little parcels as carefully as the merchants' big crates." },
  ],
  mnAfter8: [{ my: 'ဒီနေ့ ကြိမ်ဆိပ်က အဘိုးကြီးကိုလည်း အော်သွားတယ်! အဘိုးကြီး ခေါင်းညိတ်တယ်။ ဒါပဲ။', en: "Today he shouted to the old man on Cane Jetty too! The old man nodded. That's all." }],
  pt: [
    { my: 'ကိုသီဟက ဦးဘိုလေးကို အငြိုးကြီးတယ်တဲ့။ ကြိမ်ဆိပ်ရောက်ရင် မကြည့်တောင် မကြည့်ဘူး။', en: "They say Ko Thiha holds a big grudge against U Bo Lay. At Cane Jetty he won't even look at him.", rumour: 'grudge' },
    { my: 'အဘိုးကြီး ကြိမ် ဘာလို့ ရောင်းကောင်းလဲ သိလား။ စည်းတိုင်း လျှော့စည်းလို့တဲ့။', en: "Know why the old man's cane sells so well? They say he short-ties every bundle.", rumour: 'cheat' },
    { my: 'တံတား မနက်ဖြန် ဖွင့်မယ်တဲ့။ အဲဒီကျမှ ဟိုဘက်ကမ်း ရောက်မှာ။', en: 'The bridge opens tomorrow, they say. Only then can anyone reach the far bank.', rumour: 'bridge' },
  ],
  ptProof: [{ my: 'ဟုတ်လား… ကိုယ်တိုင် ကြည့်ခဲ့တာဆိုရင်တော့ ဒီလိုပဲ ထားလိုက်မယ်။', en: "Really… well, if you looked yourself, I'll leave it there." }],
  ptAfter8: [{ my: 'ကိုသီဟ ဒီနေ့ ကြိမ်ဆိပ်မှာ အဘိုးကြီးကို နှုတ်ဆက်သွားတယ်ဆို။ အငြိုးရှိရင် ဒီလို လုပ်ပါ့မလား။', en: "Heard Ko Thiha greeted the old man today. Would he, if he held a grudge?" }],
  proofSay: {
    grudge: { my: 'ကိုယ်တိုင် ကြည့်ခဲ့ပြီ။ အငြိုး မရှိဘူး။', en: 'I looked myself. No grudge.' },
    cheat: { my: 'စာရင်းဘုတ်ကို ကိုယ်တိုင် ကြည့်ခဲ့ပြီ။ စည်းတိုင်း ပြည့်တယ်။', en: 'I looked at his tally board myself. Every bundle is full.' },
  },
  ferryman: [{ my: 'ဖောင်ကလေးက ကျွန်တော့်ကူးတို့ မရောက်တဲ့ဆိပ်တွေကို ဝင်တယ်။ စိတ်ဆိုးသင့်တယ်လို့ ပြောကြတယ်။ ဘာလို့လဲ။ သူ့အလုပ် သူလုပ်တာ၊ ကျွန်တော့်အလုပ် ကျွန်တော်လုပ်တာ။', en: "The raft calls at the jetties my ferry can't reach. Folk say I ought to mind. Why? He does his work, I do mine." }],

  // props looked at (added)
  boardBefore: [{ my: '(စာရွက် သုံးဆယ့်တစ်စောင်။ ထပ်နေကြတယ်။ နောက်မှ ဖတ်မယ်။)', en: '(Thirty-one notes, overlapping. I\'ll read them later.)' }],
  bridgeEmpty: [{ my: '(ကျောက်သင်ပုန်း ဘောင် ဆယ်ခု၊ ဗလာ။ နောက်ဆုံးဘောင်အောက်မှာ ကြေးဝါသော့ နှစ်ချောင်း။ တံတားအဝမှာ အစင်းကျားတုတ် ချထားတယ်။)', en: '(Ten empty slate frames, two brass keys under the last. A striped boom lies across the bridge mouth.)' }],
  bridgeFull: [{ my: '(ကျောက်သင်ပုန်း ဆယ်ချပ်၊ မီးခိုးရောင် မြေဖြူစာနဲ့ တန်းစီလျက်။)', en: '(Ten slates in a row, in grey chalk.)' }],
  bridgeAfter: [{ my: '(ဆယ်ခုမြောက် ဘောင်မှာ တစ်ချပ်ပဲ ကျန်တယ်။)', en: '(Only one slate left, in the tenth frame.)' }],
  awningSlate: [{ my: '(တံဆိပ်ခေါင်းမိုးပေါ်မှာ ကျောက်သင်ပုန်းလေး။ လက်မမီဘူး။)', en: '(A little slate up on the stamp awning. Out of reach.)' }],
  littleJetty: [{ my: '(ဆိပ်ငယ်ထိပ်။ ဖောင် မရှိသေးဘူး။)', en: '(The end of Little Jetty. No raft yet.)' }],
  wave: [{ my: 'ကိုသီဟ!', en: 'Ko Thiha!' }],
  shedSeen: [{ my: '(ရေလက်ကြားဟိုဘက် သောင်ပြင်ပေါ်က ကြိမ်ဆိပ်။ တိုင်ပေါ်မှာ အဘိုးကြီးတစ်ယောက် ထိုင်နေတယ်။)', en: '(Across the side channel, Cane Jetty on the sandbar. An old man sits on its post.)' }],

  // ---- 8.2 · the "ask Maya" board
  board: [
    { from: { my: 'ဈေးထဲက တစ်ယောက်', en: 'someone at the Market' }, my: 'ကျွန်မကို မကြိုက်တဲ့သူကို ဘယ်လို ဆက်ဆံရမလဲ။ ပြောပေးပါ။', en: "How should I treat someone who doesn't like me? Tell me.",
      replies: [{ my: 'ဂရုမစိုက်နဲ့။', en: 'Ignore them.' }, { my: 'လူတိုင်းလိုပဲ နှုတ်ဆက်။', en: 'Greet them like everyone.' }, { my: 'ရှောင်နေ။', en: 'Keep away.' }] },
    { from: { my: 'ဆိပ်ကမ်းက ဝါးထိုးသမား', en: 'a polesman at the Wharf' }, my: 'မနက်ဖြန် တံတားဖွင့်ရင် ကျွန်တော့်ဖောင် အလုပ်ပြုတ်မလား။', en: 'When the bridge opens tomorrow, will my raft lose its work?',
      replies: [{ my: 'ပြုတ်မယ်။', en: 'It will.' }, { my: 'မပြုတ်ပါဘူး။', en: "It won't." }, { my: 'ရေတိမ်ဆိပ်တွေ ရှိသေးတယ်။', en: 'There are still the shallow jetties.' }] },
    { from: { my: 'စာကောင်တာက မိန်းကလေး', en: 'a girl at the letter counter' }, my: 'နေခြည်လို ကျွန်မလည်း မာရာ့ဆယ်ချက် လိုချင်တယ်။', en: "I want Maya's ten too, like Nay Chi.",
      replies: [{ my: 'ရေးပေးမယ်။', en: "I'll write them." }, { my: 'နေခြည်ဆီက ငှားဖတ်။', en: "Borrow Nay Chi's." }, { my: 'တံတားဖွင့်ရင် ဘုတ်မှာ လာဖတ်။', en: 'Read them on the board when the bridge opens.' }] },
  ],
  boardMaya: [{ my: '(သုံးဆယ့်တစ်စောင်။ အကုန် ပြန်ရေးပေးနိုင်ပါ့မလား။)', en: '(Thirty-one. Can I answer them all?)' }],
  boardPick: { my: 'ဘယ်စာရွက်ကို ဖြေမလဲ။', en: 'Which note will she answer?' }, // (added)
  boardPinned: [{ my: '(ပင်ထိုးပြီး ချိတ်လိုက်ပြီ။)', en: '(Pinned.)' }], // (added)

  // ---- 8.4 · reply letter (notebook back page, pencil, after the stamp)
  replyTitle: { my: 'ပြန်စာ (ခဲတံ)', en: 'The reply (pencil)' },
  reply: { my: 'မှတ်စရာ ဆယ်ချက် ရေးပေးမယ်။ ယူသွားပါ။', en: "I'll write you ten things to remember. Take them with you." },

  // ---- 9 · night page
  nightQ: { my: 'ဒီနေ့အကြောင်း မှန်မှန်ကန်ကန် ဘယ်လို ရေးမလဲ။', en: 'How will she write today, truthfully?' },
  nightChoices: [
    { my: 'ကိုသီဟနဲ့ ဦးဘိုလေး ပြန်ခင်သွားကြပြီ။ နေခြည်လည်း မှတ်စရာ ဆယ်ချက်လုံး ရသွားပြီ။', en: 'Ko Thiha and U Bo Lay are friends now, and Nay Chi has all ten things to remember.' },
    { my: 'ကိုသီဟက လူတိုင်းကို "နေကောင်းလား" တစ်မျိုးတည်း နှုတ်ဆက်တယ်၊ ကြိမ်ဆိပ်က အဘိုးကြီးကိုလည်း။ ခေါင်းညိတ်တာပဲ ပြန်ရတယ်။ နေခြည်က ကျောက်သင်ပုန်းတွေကို ကိုယ့်လက်နဲ့ လုပ်ကြည့်ပြီး ပြန်ယူတယ်။ ခဲတံရောင်ပဲ ရှိသေးတယ်။', en: 'Ko Thiha called the same "keeping well!" to everyone, the old man on Cane Jetty too; only a nod came back. Nay Chi got slates back by doing them with her own hands. They\'re still pencil.' },
    { my: 'အဘိုးကြီးက နှုတ်တောင် မဆက်ဘူး။ နေခြည့် ကျောက်သင်ပုန်းတွေလည်း တစ်ဝက် ပျောက်သွားပြီ။', en: "The old man didn't even say hello back, and half of Nay Chi's slates are gone." },
  ],
  nightTrue0: { my: 'ကိုသီဟက လူတိုင်းကို "နေကောင်းလား" တစ်မျိုးတည်း နှုတ်ဆက်တယ်၊ ကြိမ်ဆိပ်က အဘိုးကြီးကိုလည်း။ ခေါင်းညိတ်တာပဲ ပြန်ရတယ်။ နေခြည့် ကျောက်သင်ပုန်းတွေက လေထဲ လွင့်သွားတယ်။ သူ့လက်နဲ့ သူ ပြန်ယူရမယ်။', en: 'Ko Thiha called the same "keeping well!" to everyone, the old man on Cane Jetty too; only a nod came back. Nay Chi\'s slates blew away. She\'ll fetch them back with her own hands.' },
  nightWrong: [
    [{ my: '(မဟုတ်ဘူး… ဒါ ချော့ပြောတာ။ ခေါင်းတစ်ချက် ညိတ်ရုံပဲ ရှိတာ။ ကျောက်သင်ပုန်းတွေလည်း သူ့ဟာ မဖြစ်သေးဘူး။)', en: "(No… that flatters. There was one nod, that's all. And the slates aren't hers yet.)" }],
    [],
    [{ my: '(မဟုတ်ဘူး… ဒါ အားလျှော့ပြောတာ။ ခေါင်းညိတ်တာလည်း တစ်ခုပဲ။ ကျန်တာတွေကလည်း တစ်နေရာရာမှာ စောင့်နေတာ။)', en: "(No… too gloomy. A nod is something. And the rest are waiting somewhere.)" }],
  ],
  strike: [{ my: '(ရွှေမင်နဲ့ "ဂရုမစိုက်နဲ့" ကတ်ကို ဖျက်လိုက်တယ်။ မရှိတဲ့လူလို ဆက်ဆံတာ အေးဆေးတာ မဟုတ်ဘူး။)', en: '(She strikes out the "Just Ignore Them" card in gold. Treating someone as if they aren\'t there isn\'t calm.)' }],
  sleepQ: { my: 'ဒီည မှတ်စုစာမျက်နှာလေး ဘယ်သူ့အိမ်မှာ အိပ်မလဲ။', en: "Whose house does tonight's notebook page sleep at?" },
  stampText: { my: 'စာမျက်နှာ ၈ — ဥပေက္ခာ\nမြေကြီးလို ငြိမ်ငြိမ်နေပြီး လူတိုင်းကို တစ်မျိုးတည်း ဆက်ဆံတာ၊ ကိုယ်မဟုတ်တဲ့ တခြားသူအတွက်လည်း မှန်ကြောင်း ကိုယ်တိုင် တွေ့ခဲ့ပြီ။', en: 'Page 8 — Equanimity\nStill as the ground, one way with everyone: she saw for herself that it holds for someone else too.' },
  page11: { my: 'စာမျက်နှာ ၁၁ — ခဲတံနဲ့ပဲ။ ကျောက်သင်ပုန်းတွေက နေခြည့်ဟာ။', en: "Page 11 — pencil. The slates are Nay Chi's." },
  tomorrow: { my: 'နောက်တစ်နေ့ မနက် ရောက်ပြီ။', en: 'Morning comes.' },
  mayaWrite: [{ my: '(ဒီနေ့အကြောင်း စာရေးခန်းမှာ ပြန်ရေးမှ ဖြစ်မယ်။)', en: '(I should write today down at my Writing Room.)' }], // (added, as Day 1)
};
