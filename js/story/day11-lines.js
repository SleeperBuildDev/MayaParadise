// Day 11 (Hearth Row, chapter 18) — every line the page says, from day11-spec.md (sections 4-9).
// Burmese lines are drafts for Maya to proofread. Lines marked NEW are not in the spec: small bridges the
// code needed (each keeps the chapter's lesson; Maya to approve).

const myd = (n) => String(n).replace(/\d/g, (d) => '၀၁၂၃၄၅၆၇၈၉'[d]);

export const L = {
  // ---- 4. morning at home
  ww1: [{ my: 'မာရာရေ… မှတ်စုစာအုပ်လေး ပြန်ရောက်လာပြီ။ ဒီတစ်ခါလည်း စာတစ်ကြောင်း ပါလာတယ်။', en: "Maya… your notebook's back. With a line again." }],
  slept: {
    hpohtaw: { my: '"တံခါးက ကျွန်တော် ဖွင့်ချင်မှ ဖွင့်မယ်။ လမ်းကိုတော့ မစောင့်ကြည့်တော့ဘူး။" — ဦးဖိုးထော်', en: '"The gate opens when I choose. I\'ve stopped watching the lane." — U Hpo Htaw' },
    kophyo: { my: '"အလေးချိန်က နည်းတော့ နည်းတယ်။ ညက အိပ်လို့ ကောင်းတယ်။" — ကိုဖြိုး', en: '"It weighs less. I slept well." — Ko Phyo' },
  },
  // NEW: a host Day 10's slept table has no line for here (Day 10 owns `slept10`)
  sleptOther: { my: '"ကိုယ်တိုင် စစ်ပြီးမှ ရွှေမင်နဲ့ ရေး။" — မှတ်စုစာအုပ်ထဲက', en: '"Write in gold only what you checked yourself." — in the notebook' },
  ww2: [{ my: 'ကိုဖြိုးဆီကလည်း စာလေး ပါလာတယ်။', en: 'And a letter from Ko Phyo.' }],
  kpNote: { my: 'အစ်မ… ဒီမနက် စက္ကူထုပ်ပေါ်မှာ ကျွန်တော့်နာမည် ကိုယ်တိုင် ရေးထိုးလိုက်တယ်။\nဝယ်သူ ချိန်ကြည့်တော့ ပေါ့တယ်။ ခြောက်နေလို့ပေါ့။ သူ့မျက်လုံးကို တည့်တည့် ကြည့်နိုင်ခဲ့တယ်။\nအမြတ်က နည်းတယ်။ ဒါပေမဲ့ ညက တစ်ခါမှ မနိုးဘူး။', en: "Sister… this morning I signed my own name on the bale.\nThe buyer weighed it: light, because it's dry. I could look him straight in the eye.\nLess profit. But I didn't wake once last night." },
  join: [{ my: '(မှတ်စုထဲက "ချမ်းသာ" ကတ်နဲ့ "သုခ" ကတ် တစ်ဆက်တည်း ဖြစ်သွားတယ်… ချမ်းသာသုခ။)', en: '(In the notebook the "plenty" card and the "ease" card join into one word… ချမ်းသာသုခ.)' }],
  lift: [{ my: '(မနေ့က စာမျက်နှာပေါ်က ခုံတန်းလေး၊ နွယ်ညွန့်လေးနဲ့ အိပ်ပျော်ကြောင်လေး ထွက်လာကြတယ်။ နွယ်ညွန့်က မာရာ့လက်ကို ခဏထိပြီး လွှတ်လိုက်တယ်။)', en: "(The Two-Seat Bench, the little Tendril and the Sound-Asleep Cat lift off yesterday's page. The Tendril touches Maya's sleeve, then lets go.)" }],
  liftMaya: [{ my: 'ထိပြီးရင် လွှတ်… မနက်ဖြန် ကိုယ့်ကိုယ်ကို ကြည့်ရဲအောင်။ လာ၊ လိုက်ခဲ့ကြ။', en: 'Touch, then let go… so I can look at myself tomorrow. Come on, all of you.' }],
  tt: { my: '"ဒီနေ့မေးခွန်း: မိုးမရွာခင် ကျွန်တော့် လေ့ကျင့်ခန်းစာအုပ် ထောင့်တွေက ဘာလို့ ကော့တက်လာတာလဲ။" — တိုးတိုး', en: '"Today\'s question: why do the corners of my exercise book curl up before it rains?" — Toe Toe' },
  bloom: [
    { my: 'တိုးတိုးရဲ့ ပဲပင်တွေ ပွင့်ပြီ။ နေရောင်ရတဲ့နေရာမှာ စိုက်ခဲ့လို့ပဲ။', en: "Toe Toe's beans are in flower. Because they went where the sun reaches." },
    { my: '(စိုက်တုန်းက မနေ့တစ်နေ့ကလိုပဲ။ ကိုးရက်တောင် ရှိသွားပြီ။ မြန်လိုက်တာ။)', en: '(Planting them feels like yesterday. Nine days already. So fast.)' },
  ],
  bulbs: [{ my: '(ဦးဖိုးထော်ရဲ့ ပန်းဥတွေက အညွန့်ဖျားလေး ထွက်လာပြီ။ မနေ့ညကပဲ စိုက်ခဲ့တာ။ "တစ်နေ့ကျရင်" လို့ ထားခဲ့ရင် ဒါလေးတောင် ရှိမှာ မဟုတ်ဘူး။)', en: "(U Hpo Htaw's bulbs are showing their tips. Planted only last night. Left for \"someday\", there'd be not even this.)" }],
  ww3: [{ my: 'ဒါက နေခြည့်စာ။ မီးဖိုတန်းက ပေါင်မုန့်ကားနဲ့ ပါလာတာ။', en: 'This one is from Nay Chi. It came up with the bread van from Hearth Row.' }],
  ncNote: { my: 'အစ်မ… ညတစ်ညတည်းမှာ စာကပ်နံရံပေါ် ရန်ဖြစ်စာ ခုနစ်စောင် ကပ်သွားကြတယ်။\nနံရံကို စောင့်ရှောက်ရတာ ကျွန်မ။ ဘာလုပ်ရမလဲ။ လာပြောပြပေးပါ။', en: "Sister… in one night seven quarrel notes got pinned on the Note Wall.\nI'm the one who looks after the wall. What do I do? Come and tell me." },
  ncMaya: [{ my: '(လာမယ်။ ဘာလုပ်ရမလဲ ပြောဖို့ မဟုတ်ဘူး။ ကြည့်ဖို့။)', en: "(I'll come. Not to tell her what to do. To look.)" }],
  ww4: [
    { my: 'စာကပ်နံရံက ဒေါ်ခင်မေ့ ပေါင်မုန့်ဖိုရဲ့ ဘေးနားမှာ။ မုန့်နံ့ နောက်ကို လိုက်သွားရုံပဲ။', en: "The Note Wall is right beside Daw Khin May's bakery. Just follow the smell of bread." },
    { my: 'ဒါနဲ့… မနက်ဖြန် မိုးရွာမယ်တဲ့။ ကြားတာပဲနော်။ ကိုယ်တိုင်တော့ ဘာလက္ခဏာမှ မမြင်ရသေးဘူး။', en: "Oh… they say it'll rain tomorrow. Only heard it. I haven't seen a sign myself." },
  ],
  wwLater: [{ my: 'ဖဲကြိုးနဲ့ ကွေ့သွားလည်း ရတယ်၊ ခေါက်ကြောင်းတံတားကနေ မောင်းသွားလည်း ရတယ်။ ကိုယ်နဲ့ ကိုက်တာ ရွေး။ မရွေးတဲ့လမ်းက ဆိုးလို့ မဟုတ်ဘူး။', en: "Take the ribbon, or drive over the Fold bridge. Pick what suits you. The road you don't pick isn't bad for it." }],
  wwEvening: [{ my: 'နေခြည် ဒီကို ခဏ ရောက်သွားတယ်။ ဘုတ်ပေါ်က သူ့စာကို သူကိုယ်တိုင် ဖြုတ်သွားတယ်။', en: 'Nay Chi dropped by. She took her own note off the board herself.' }],
  arrive: [{ my: 'စာတွေ မဖတ်ရသေးဘူး။ နံရံတစ်ခုလုံး ပူနေတာ မြင်နေရပြီ။', en: "I haven't read a word yet, and the whole wall looks hot." }],
  vanBoy: { my: 'နံရံဆီလား အစ်မ။ မုန့်ဖိုဘေးမှာ! ကျွန်တော်ကတော့ မဖတ်တော့ဘူး။ ဖတ်ရင် ပူလာလို့။', en: "The wall, sister? Next to the bakery! I've stopped reading it. It only heats me up." },
  vanBoyName: { my: 'ပေါင်မုန့်ကား ကောင်လေး', en: 'Bread-van boy' },

  // ---- 5.0 Nay Chi at the Wall
  nc1: [{ my: 'အစ်မ ရောက်လာပြီ! ကြည့်… ခုနစ်စောင်။ တစ်စောင်ချင်း ဘာလုပ်ရမလဲ ပြောပါ။ ကျွန်မ ချရေးထားမယ်။', en: "You came! Look… seven. Tell me what to do about each one. I'll write it down." }],
  ncMaya1: [{ my: 'ဖြစ်တဲ့နေရာ တစ်ခုချင်းကို သွားကြည့်မယ်။ စာရွက်ပေါ်ထက် လူတွေဆီမှာ ပိုမြင်ရမှာ။', en: "I'll go and look at each one where it's happening. You see more at the people than on paper." }],
  nc2: [
    { my: '…အဖြေ မပေးဘူးလား။ ရပါတယ်၊ ကျွန်မ နံရံမှာပဲ နေမယ်။', en: "…No answers, then? Fine, I'll stay at the wall." },
    { my: 'ဒါနဲ့… ကိုဒိုးက မီးထွန်းချိန်ကျရင် "ပြောရဲဆုံး ဖဲကြိုး" သူ ရမှာတဲ့။ အဲဒါ ပေးရမှာက ကျွန်မ။', en: 'And… Ko Doe says at lamp-lighting the "boldest tongue" ribbon is his. I\'m the one who has to hand it over.' },
  ],
  ncWait: [{ my: 'ဖဲကြိုးကိစ္စ… မီးထွန်းချိန် မရောက်ခင် တစ်နေရာရာမှာ ငြိမ်ငြိမ်လေး ထိုင်စဉ်းစားဦးမယ်။', en: "The ribbon… before lamp-lighting I'll sit somewhere quiet and think." }],
  wall: {
    1: { my: 'ဒေါ်ခင်မေ့ ပေါင်မုန့် တူးနေပြန်ပြီ', en: "Daw Khin May's bread burnt again" },
    2: { my: 'ဒေါ်စောယုဆိုင်ထဲက ခေါက်ဆွဲ နှစ်မျိုး: ဘယ်ဟာ မှန်လဲ', en: "Two kinds of noodles in Daw Saw Yu's house: which is right?" },
    3: { my: 'ပန်းလေးရဲ့ "တစ်နေ့ကျရင်" အပင် — ညနေတန်းထဲက ပြတင်းပေါက်ခုံပေါ်မှာ မနှစ်ကတည်းက', en: 'Pan\'s "someday" tree: on the windowsill inside the evening class since last year' },
    4: { my: 'အလုပ်ရုံလမ်းက ဆိုင်းဘုတ်အသစ်', en: 'The new sign on the workshop lane' },
    5: { my: 'ညနေတန်း လှေကားထစ်က စက္ကူဘူးတွေ ဘယ်သူမှ မယူဘူး', en: 'Nobody takes the paper boxes on the evening-class steps' },
    6: { my: 'လက်ဖက်ရည်ဆိုင် သီချင်း: နှစ်ယောက်ဆိုမလား၊ တစ်ယောက်တည်းလား', en: 'The tea-shop song: a duet, or not?' },
    7: { my: 'ဦးချစ် ပြောတာတွေ ♥', en: 'Things Uncle Chit says ♥' },
  },
  wallTitle: (n) => ({ my: `စာကပ်နံရံ · စာ ${myd(n)}`, en: `Note Wall · note ${n}` }),
  wallMaya: [{ my: '(အပေါ်ကခေါင်းစဉ်ပဲ ဖတ်လို့ရတယ်။ အောက်ကဟာတွေက အပူချည်းပဲ။)', en: "(Only the headings can be read. Under them it's all heat.)" }],

  // ---- 5.1 piece 1, the bakery
  kmCall: [{ my: 'မာရာ! ခဏ ဝင်ခဲ့ပါဦး။ ကျွန်မလက်က မုန့်ညက်ထဲမှာ။', en: 'Maya! Come in a moment. My hands are in the dough.' }],
  km1: [
    { my: 'နာမည်တောင် မထိုးဘဲ ကပ်သွားတယ်။ ကျွန်မ ပေါင်မုန့်အကြောင်း။', en: 'Pinned it without even signing. About MY bread.' },
    { my: 'ပြန်စာ ရေးပြီးပြီ။ မီးဖိုလောက် ပူတယ်။ ပင်ကလေး ကိုင်ပေးပါဦး မာရာ။ ကျွန်မလက်က ဂျုံတွေနဲ့။', en: "I've written a reply. Hot as my oven. Hold the pin for me, Maya, my hands are all flour." },
  ],
  holdTitle: { my: 'ပြန်စာကို ကိုင်ကြည့်', en: 'Hold the reply' },
  holdHint: { my: 'ဖိထား… ပြီးရင် ချလိုက်', en: 'Press and hold… then put it down' },
  holdDropped: { my: '(ချလိုက်တော့မှ လက်က အေးသွားတယ်။)', en: '(Only when I put it down does my hand cool.)' },
  holdTooLong: { my: '(အား… လက်က သူ့ဘာသာ ဖြေလိုက်တယ်။)', en: '(Ow… my hand let go by itself.)' },
  p1Maya: [{ my: '(မကပ်ရသေးဘူး။ ကိုင်ရုံနဲ့ ကျွန်မ အရင် ပူနေပြီ။)', en: "(I haven't even pinned it, and I'm the one burning first.)" }],
  km2: [
    { my: '…ကိုင်ရုံလေးနဲ့ မျက်နှာ နီသွားတာ။ ကျွန်မလက်လည်း မနက်ကတည်းက ပူနေတာ။', en: "…Your face went red just holding it. My hand's been hot since dawn too." },
    { my: 'မီးဖိုထဲ ထည့်လိုက်မယ်။ အပူကို မီးဖိုပဲ ယူပါစေ။ ကျွန်မမှာ ဖုတ်စရာ ရှိသေးတယ်။', en: "Into the oven with it. Let the oven have the heat. I've bread to bake." },
    { my: 'နောက်ဘက်ခြမ်းက တစ်လုံးလောက် မည်းသွားတာတော့ ဟုတ်မယ်။ နောက်ဆို ကြည့်မယ်။', en: "One loaf at the back of the oven might have gone dark, mind. I'll watch that." },
  ],
  p1Pass: [{ my: '(စာက နံရံပေါ်မှာ ကျန်နေတုန်း။ ကျော်သွားလို့ ရတယ်။)', en: '(The note is still on the wall. I can walk past it.)' }],
  loafPress: [{ my: 'နေ့လယ်တောင် ရောက်ပြီ။ နူးနေတုန်းပဲ။', en: 'Past noon. Still soft.' }],
  loafAgain: [{ my: '(နူးနေတုန်းပဲ။ ကိုယ်တိုင် ဖိကြည့်ပြီးပြီ။)', en: '(Still soft. I pressed it myself.)' }], // NEW

  // ---- 5.2 piece 2, the noodle house
  my1: [{ my: 'ဟင်းချို ခေါက်ဆွဲက အိမ်က အရသာလိုပဲ။ ဦးပုဆိုင်ကဟာက… ညံ့တယ်ဗျာ။', en: "The soup noodles taste like home. U Pu's stuff is… bad, honestly." }],
  pu1: [{ my: '(ဦးပု ခေါက်ဆွဲ ဆက်သုပ်နေတယ်။ မျက်နှာက ငြိုသွားတယ်။)', en: '(U Pu keeps tossing noodles. His face has dropped.)' }],
  sy1: [{ my: 'ကျွန်မဆိုင်ကို ချီးမွမ်းတာ ဝမ်းသာပါတယ်။ ဒါပေမဲ့ ဦးပုဆိုင်ကိုလည်း လူတန်းစီနေတာ မြင်လား။', en: "I'm glad he likes mine. But you see the queue at U Pu's too?" }],
  stoolHint: [{ my: '(ဘယ်ဘက်မှာ ထိုင်စားမလဲ။ အနီခုံ ဟင်းချို၊ အပြာခုံ ခြောက်ခြောက်။)', en: '(Where shall I sit and eat? Red stools: soup. Blue stools: dry.)' }], // NEW
  bite: { soup: [{ my: '(ဟင်းချို တစ်ဇွန်း… ပူပူနွေးနွေး။)', en: '(A spoon of soup… warm through.)' }], dry: [{ my: '(ခြောက်ခြောက် တစ်ဇွန်း… မြေပဲနံ့ မွှေးတယ်။)', en: '(A bite of dry noodles… the peanut smells good.)' }] }, // NEW
  otherSoup: [{ my: 'ဒါဆို ကျွန်မဆိုင်က မကောင်းဘူးပေါ့၊ မာရာ။', en: "So mine's no good then, Maya?" }],
  otherDry: [{ my: 'ဒါဆို ကျုပ်ဆိုင်က မကောင်းဘူးပေါ့၊ မာရာ။', en: "So mine's no good then, Maya?" }],
  p2Choices: [
    { my: '"ဒီဆိုင်လောက် မကောင်းဘူး။"', en: '"Not as good as this one."' },
    { my: '"နှစ်ဆိုင်လုံး အတူတူပါပဲ။"', en: '"They\'re both exactly the same."' },
    { my: '"ဒီနေ့ ကျွန်မ ဒီဘက်က စားချင်လို့ပါ။ ကောင်တာရှေ့က လူတန်းကြည့်ရင် သိသာပါတယ်၊ လူအများကြီးနဲ့ ကိုက်တယ်။"', en: '"I just felt like this side today. Look at your queue: it suits plenty of people."' },
  ],
  p2Bad: [{ my: '(ကိုယ်မရွေးမိတာနဲ့ မကောင်းဘူး ဖြစ်မသွားဘူး။)', en: "(Not choosing it doesn't make it bad.)" }],
  p2SamePu: [{ my: 'အတူတူ? ကျုပ်ဟာမှာ မြေပဲနဲ့ သံပုရာ ပါတယ်ဗျ!', en: 'The same? Mine has peanut and lime!' }],
  p2SameSy: [{ my: 'အတူတူ? ကျွန်မ ဟင်းချိုက တစ်ညလုံး တည်ထားတာ!', en: 'The same? My broth simmers all night!' }],
  p2OkOwner: [{ my: 'ဟုတ်တယ်… ကိုယ့်အရသာနဲ့ ကိုယ်ပေါ့။', en: 'True… each to their own taste.' }],
  p2OkArkar: [{ my: '…ကျွန်တော့်အတွက် မဟုတ်ဘူးလို့ ပြောရမှာ။ မကောင်းဘူးလို့ မဟုတ်ဘူး။ ဆောရီး ဦးပု။', en: "…I should've said it's not for me. Not that it's bad. Sorry, U Pu." }],
  pinA: [{ my: 'ဆိုင်းဘုတ်စာမှာ ငါလည်း ပင်ထိုးခဲ့တယ်။', en: 'I put a pin on the sign note too.' }],
  pinB: [{ my: 'ဘယ်ဆိုင်းဘုတ်လဲ။ မြင်ဖူးလို့လား။', en: 'Which sign? Have you even seen it?' }],
  pinA2: [{ my: '…မမြင်ဖူးဘူး။ လူတိုင်း ထိုးနေလို့ ထိုးလိုက်တာ။', en: '…No. Everyone was pinning, so I did.' }],
  pinMaya: [{ my: '(မမြင်ဘဲ ဝင်ပုတ်တာ… ပြီးတော့ သူတို့အတွက် ဒါ ပုံမှန်ပဲ။)', en: "(Piling in without even seeing it… and to them it's just normal.)" }],
  pinAfter: [{ my: 'ဆိုင်းဘုတ်ကို ကိုယ်တိုင် သွားကြည့်ခဲ့တယ်။ စာလုံး တစ်လုံးတည်း။ ပင်ထိုးခဲ့တာ ရှက်စရာပဲ။', en: "I went and looked at the sign myself. One letter. I'm embarrassed I pinned it." }],
  pinNameA: { my: 'ဦးထုပ်နဲ့ ကောင်လေး', en: 'Boy in a cap' }, // walk-on, no name
  pinNameB: { my: 'ကျစ်ဆံမြီးနဲ့ ကောင်မလေး', en: 'Girl with a braid' },

  // ---- 5.3 piece 3, the evening class
  ml1: [
    { my: 'ဒါ မန်ကျည်းပင်။ ကြီးလာရင် စိုက်မှာ။ ခြံကြီးကြီး ရှိတဲ့ တစ်နေ့ကျရင်။', en: "It's a tamarind. I'll plant it when I'm big. Someday, when there's a proper garden." },
    { my: 'အချိန် အများကြီး ရှိသေးတာပဲ။ ဟိုမှာ ကြည့်… နံရံက ပြက္ခဒိန် တစ်ခုလုံး။', en: "There's loads of time. Look over there… a whole calendar on the wall." },
  ],
  leaf: (n) => ({ my: `နောက် ${myd(n)} နှစ်`, en: `${n} year${n > 1 ? 's' : ''} on` }),
  calendarBefore: [{ my: '(တန်ဆောင်မုန်းလ ပြက္ခဒိန်။ ပန်းလေးရဲ့ အပင်က ပြတင်းခုံပေါ်မှာ။)', en: "(The month's calendar. Pan's little tree is up on the sill.)" }], // NEW
  sweep: { my: '(စာရွက်တွေ ဒီနေ့ဆီ ပြန်လွင့်လာတယ်… ရှပ်ကနဲ။)', en: '(The leaves sweep back to today with a rustle.)' }, // NEW (stage direction made visible)
  ml2: [{ my: 'ဆယ်နှစ်… အဲဒီလောက် မြန်တာလား။ အပင်က ဘူးထဲမှာပဲ ရှိနေသေးတယ်။', en: "Ten years… that fast? And the tree's still in its tin." }],
  p3Choices: [
    { my: '"နံရံရဲ့ အရှေ့ဘက်မှာ စိုက်လိုက်။"', en: '"Plant it at the east end of the wall."' },
    { my: '"တစ်နေ့ကျမှ စိုက်လည်း ရပါတယ်။"', en: '"Someday is fine."' },
    { my: '"ဒီနေ့ နေရောင် ဘယ်နားမှာ ရနိုင်မလဲ။"', en: '"Where could it get sun today?"' },
  ],
  p3Told: [{ my: 'အစ်မ ပြောတဲ့နေရာလား… ကျွန်တော် မသိဘူး။ (ဘူးကို ပြန်ချထားတယ်။)', en: 'Where you say? …I dunno. (He puts the tin back down.)' }],
  p3Later: [{ my: '(ပြက္ခဒိန် စာရွက်တွေ လေထဲ ခဏ လွင့်သွားတယ်။ ဘာမှ မပြောင်းဘူး။)', en: '(The calendar leaves flutter a moment. Nothing changes.)' }],
  p3Ok0: [{ my: 'ဒီနေ့… (မော့ကြည့်တယ်။) ဦးချစ်ရဲ့ ခုံတန်းဘေးက မြေကွက်လေး။ အဲဒီမှာ နေတစ်နေကုန် ရတယ်။', en: "Today… (he looks up.) The bit of ground by Uncle Chit's bench. It gets sun all day." }],
  p3Ok1: [{ my: 'ဘူးကြီးထဲမှာ ကြာကြာ နေခဲ့ရတာ။ ဆောရီးနော် အပင်လေး။', en: "You've been in that tin too long. Sorry, little tree." }],
  spoon: [{ my: 'ကော်ဇွန်း ယူသွား ကလေး။ လက်နဲ့ တူးရင် လက်သည်း ကွဲမယ်။', en: 'Take my paste spoon, lad. Dig with your hands and you\'ll split a nail.' }], // NEW (spec: Uncle Chit lends the spoon if scene 7 is done)

  // ---- 5.4 piece 4
  kt1: [
    { my: 'ဆိုင်းဘုတ်ကို ကျွန်တော် ပထမဆုံး တွေ့တာ။ စာလုံးပေါင်း မှားနေတယ်ဗျာ။ ကျွန်တော်က ရှိတာ ပြောတာ။', en: "I spotted the sign first. Spelt wrong. I just say what's there." },
    { my: 'ပင် အများဆုံး ကျွန်တော့်စာ။ မီးထွန်းရင် ဖဲကြိုး ကျွန်တော် ရမယ်။ အပြစ်ပြောတာ ဂုဏ်ယူတယ်။', en: "Most pins: my note. At lamp-lighting the ribbon's mine. I'm proud to call things out." },
    { my: 'လူတိုင်း ကပ်နေကြတာပဲ။ နံရံဆိုတာ ဒါအတွက်ပဲလေ။', en: "Everyone pins. That's what the wall's for." },
  ],
  nyein1: [{ my: 'ဆိုင်းဘုတ်အသစ် လှလား သမီး။ ကိုယ်တိုင် ရေးတာ။ ညတိုင်း ဒီမီးအိမ်လေးတွေနဲ့ လမ်းလင်းတယ်။', en: 'Pretty, my new sign? Painted it myself. These little lamps light the lane every night.' }],
  nyeinMaya: [{ my: '(ဆိုင်းဘုတ်မှာ «မီးအိန်» တဲ့။ စာလုံး တစ်လုံး မှားနေတယ်။ … နေခြည် စောင့်ရှောက်တဲ့ နံရံက ကိစ္စ။ သူ ဘာလုပ်မလဲ စောင့်ကြည့်မယ်။)', en: "(The sign says «မီးအိန်». One letter wrong. … It's on the wall Nay Chi keeps. I'll wait and see what she does.)" }],
  lamp: [{ my: '(မီးထွန်းချိန် ရောက်ပြီ။ လမ်းတစ်လျှောက် မီးအိမ်လေးတွေ လင်းလာတယ်။)', en: '(Lamp-lighting. The little lamps come on down the lane.)' }], // NEW (the scripted look, said once)
  ktLamp: [{ my: 'ဖဲကြိုးချိန် ရောက်ပြီ! နေခြည်က ဖဲကြိုးကိုင်ပြီး လက်ဖက်ရည်ဆိုင်ထဲ ဝင်ထိုင်နေတယ်ဗျာ။', en: "Ribbon time! Nay Chi's gone and sat in the tea shop with it." }],
  ktWindow: [{ my: 'နေခြည်! ဖဲကြိုး!', en: 'Nay Chi! The ribbon!' }],
  ncLamp: [
    { my: 'အစ်မ… အချိန်ရောက်ပြီ။ ကိုဒိုးစာမှာ ပင် အများဆုံးပဲ။ ဖဲကြိုး ပေးရမလား။', en: "Sister… it's time. Ko Doe's note has the most pins. Do I give him the ribbon?" },
    { my: 'ဘာလုပ်ရမလဲ ပြောပါ။ အစ်မ ပြောတဲ့အတိုင်း လုပ်မယ်။', en: "Tell me what to do. I'll do exactly what you say." },
  ],
  ncRibbon: [{ my: 'ဒီအပတ် ဖဲကြိုး မရှိဘူး။', en: 'No ribbon this week.' }],
  ktHuff: [{ my: 'ဘာလို့လဲ! ကျွန်တော် အမှန်ပဲ ပြောတာ!', en: "Why? I only said what's true!" }],
  ncToKt: [{ my: 'မှန်တယ်။ အဲဒါကြောင့် သူ့ကို သွားပြောမှာ။ နံရံကို မဟုတ်ဘူး။', en: "It is true. That's why I'm telling HER. Not the wall." }],
  ncSelf: { my: 'အစ်မ… ဒီတစ်ခု ကျွန်မ ကိုယ်တိုင် လုပ်ပါရစေ။', en: 'Sister… let me do this one myself.' },
  notMine: [{ my: '(ဘာပြောလဲ မကြားရဘူး။ ကျွန်မ ကြားရမယ့်ဟာလည်း မဟုတ်ဘူး။)', en: "(I can't hear what she said. It isn't mine to hear.)" }],
  ncBack: [
    { my: 'ဆိုင်းဘုတ် ပြင်ပြီးပြီ။ ဒီစာက မမှန်တော့ဘူး။', en: "The sign's fixed. This note isn't true any more." },
    { my: '…ဒီနေ့ အစ်မကို တစ်ခုမှ မမေးလိုက်ရဘူးနော်။', en: "…I didn't ask you a single thing, did I." },
  ],
  mayaNc: [{ my: 'မမေးဘူး။ (ပြုံးတယ်။)', en: "No, you didn't. (She smiles.)" }],
  nyeinAfter: [{ my: 'ကောင်မလေးက တိုးတိုးလေး လာပြောတယ်။ ပင်သုံးဆယ်ထက် အဲဒီ တစ်ခွန်းက ပိုကောင်းတယ်။', en: 'A girl came and told me quietly. One quiet word beats thirty pins.' }],
  nyeinAfter2: [{ my: 'လူဆိုတာ မှားတတ်တာပဲ။ ပြင်လိုက်ရင် ပြီးတာပဲ။', en: "People make mistakes. Fix it and it's done." }],
  ktAfter: [{ my: '…ပြင်ပြီးသွားပြီပဲ။ ကျွန်တော့်စာ ပြန်ကပ်စရာ မရှိတော့ဘူး။', en: "…It's fixed, then. Nothing to pin back up." }],
  ktAfter2: [{ my: 'တိုးတိုးပြောတာ… ကျွန်တော် မစဉ်းစားဖူးဘူး။', en: 'Telling someone quietly… never thought of it.' }],
  slates: [{ my: '(နေခြည့် စာမျက်နှာပေါ်က ကျောက်သင်ပုန်း ၂ နဲ့ ၈ ရွှေမင် ဖြစ်သွားတယ်။ သူ့ဘာသာ လုပ်ခဲ့တာ။)', en: "(On Nay Chi's page, slates 2 and 8 ink gold. She did them unasked.)" }], // NEW (the slates are drawn on her notebook page)

  // ---- 5.5 piece 5
  ss1: [
    { my: 'ထမင်း မအေးအောင် ခေါက်နည်းကို သုံးညတောင် စမ်းခဲ့တာ။ ကလေးတွေအတွက်။', en: 'Three nights I worked on a fold that keeps rice warm. For those kids.' },
    { my: '"အဘိုးဘူး" တဲ့။ ရယ်ပြီး နံရံမှာ ကပ်သွားကြတယ်။ ဘယ်သူ့အတွက်မှ နောက်ထပ် မလုပ်တော့ဘူး။', en: '"Grandpa boxes", they said. Laughed and pinned it on the wall. I\'m not making anything for anyone again.' },
  ],
  ssAsk: [{ my: '(ဦးစံရှား ဘူးတွေကို ပြန်စီရင်း အတွေး သုံးခု ပြောနေတယ်။ အရှိအတိုင်းဖြစ်တဲ့ တစ်ခုက ဘယ်ဟာလဲ။)', en: '(U San Shar says three things as he stacks. Which one is as it is?)' }], // NEW (prompt for the W)
  ssThoughts: [
    { my: 'ဒီခေတ်ကလေးတွေ ကျေးဇူးမသိတတ်ဘူး။ အကုန်လုံးပဲ။', en: "Kids these days don't know thanks. Every one of them." },
    { my: 'ကျုပ်က အဘိုးကြီး အရူး။ ကျုပ်လုပ်တာ ဘာမှ တန်ဖိုး မရှိဘူး။', en: "I'm a silly old man. Nothing I make is worth anything." },
    { my: 'သူတို့က ကျုပ် မဟုတ်ဘူး။ ထမင်းအေးအေး ညနေတိုင်း စားဖူးတာ မဟုတ်ဘူးလေ။', en: "They aren't me. They've never eaten cold rice every evening." },
  ],
  ssWrong: [{ my: "(ဒါလည်း သူ့အတွေးပဲ။ ဒါပေမဲ့ အရှိအတိုင်း မဟုတ်ဘူး။)", en: "(That's his thought too. But it isn't how things are.)" }],
  ssTrue: [
    { my: 'သူတို့က ကျုပ် မဟုတ်ဘူး… ဟုတ်တယ်။ ဒါဆိုလည်း ဘာလို့ လိုလဲ ပြောမပြရသေးဘူးပဲ။', en: "They aren't me… right. And I never told them what it's for." },
    { my: 'နောက်တစ်ခါ ရှင်းပြမယ်။ ဖြည်းဖြည်းလေး။', en: "I'll explain once more. Slowly." },
  ],
  traceTitle: { my: 'ဦးစံရှားနဲ့ ဘူးခေါက်မယ်', en: 'Fold a box with U San Shar' },
  traceHint: { my: 'ထောင့်ကနေ အလယ်ကို ဖြည်းဖြည်း', en: 'Corner to centre, slowly' },
  ssSlow: [{ my: 'ဖြည်းဖြည်း… ကျုပ်လည်း ပထမဆုံးတုန်းက မြန်လွန်းခဲ့တာ။', en: 'Slowly… I went too fast my first time, too.' }],
  ssExplain: [{ my: 'ဒီလို ခေါက်ရင် ထမင်း ပူတာ နှစ်နာရီ ခံတယ်။ ပြန်ဖြန့်ရင် လွယ်အိတ်ထဲ ပြားပြားလေး ဝင်တယ်။', en: 'Fold it like this and the rice stays hot two hours. Open it out and it goes flat in your satchel.' }],
  teenA: [{ my: '…ပူတာ နှစ်နာရီ? တစ်ဘူး ယူမယ် ဦးလေး။', en: '…Hot for two hours? I\'ll take one, uncle.' }],
  teenB: [{ my: 'ကျွန်တော်ကတော့ ရွက်နဲ့ပဲ ထုပ်မယ်။', en: "I'll stick with leaf wraps." }],
  ssEnd: [{ my: 'တစ်ယောက် ယူတယ်။ တစ်ယောက် မယူဘူး။ ရပါတယ်။ ကျုပ်လည်း စိတ်မဆိုးတော့ဘူး။', en: "One took it. One didn't. That's fine. And I'm not angry any more." }],
  teensBefore: [{ my: 'အဘိုးဘူးတွေ ဟိုမှာ ပုံထားတယ်။ ဦးစံရှားက အလုပ်ရုံလမ်းထဲမှာ ခေါက်နေတုန်းပဲ။ ဟားဟား။', en: "The grandpa boxes are piled over there. Old San Shar's still folding them down the workshop lane. Ha." }],
  teensAfter: [{ my: 'ထမင်းက ပူနေတုန်းပဲ။ တကယ်ပဲ။', en: 'The rice is still hot. Really.' }],
  teenNameA: { my: 'လှေကားထစ်က ကောင်လေး', en: 'Boy on the steps' },
  teenNameB: { my: 'လှေကားထစ်က ကောင်လေး', en: 'Boy on the steps' },
  ssFollow: [{ my: 'လာ သမီး၊ လှေကားထစ်ဆီ။', en: 'Come, dear. To the steps.' }], // NEW (he leads; the place is said, not pointed)

  // ---- 5.6 piece 6
  ch1: [
    { my: 'မီးထွန်းချိန်မှာ နှစ်ယောက်ဆို သီချင်း ဆိုမှာ။ ကျွန်မ တစ်ခုပဲ သတ်မှတ်ထားတယ်: ညတိုင်း လေ့ကျင့်ရမယ်။', en: "At lamp-lighting there's meant to be a duet. I set one thing: practise every evening." },
    { my: 'လူတိုင်းက ဇီဇာများတယ်တဲ့။ ရှိတဲ့လူနဲ့ပဲ ဆိုလိုက်ပါတဲ့။', en: "Everyone says I'm too fussy. Just sing with whoever's there." },
  ],
  nn1: [{ my: 'လေ့ကျင့်စရာ မလိုပါဘူး။ စင်ပေါ်ရောက်မှ ရလာမှာ။', en: "Don't need practice. It'll come to me on the night." }],
  look: {
    sheet: { pencil: { my: '(ကြားထားတာ: «ဇီဇာများတယ်»)', en: '(Heard: «too fussy»)' }, gold: { my: '«ချယ်ရီ ခုနစ်ညလုံး အမှန်ခြစ်။ ညီညီ တစ်ညမှ မရှိဘူး။»', en: '«Cherry: seven ticks. Nyi Nyi: none.»' } },
    book: { pencil: { my: '(ကြားထားတာ: «နှစ်ယောက်ဆိုမှ သီချင်း»)', en: '(Heard: «a song needs two»)' }, gold: { my: '«သူမရဲ့ အပိုင်းမှာ ခဲတံ မှတ်ချက် အပြည့်။ သူ့အပိုင်းက ဗလာ။»', en: '«Her part full of pencil marks; his is blank.»' } },
  },
  lookAgain: [{ my: '(သေချာ ကြည့်ဦးမယ်…)', en: '(Let me look properly…)' }], // NEW
  ch2: [{ my: 'အစ်မ… သူနဲ့ပဲ ဆိုလိုက်ရမလား။ လူတိုင်းက တစ်ယောက်တည်းထက် ကောင်းတယ်တဲ့။', en: 'Sister… should I just sing with him? Everyone says it beats singing alone.' }],
  p6Choices: [
    { my: '"ဆိုလိုက်ပါ။ တစ်ယောက်တည်းထက် ကောင်းပါတယ်။"', en: '"Sing with him. Better than alone."' },
    { my: '"ကျွန်မ တခြားလူ ရှာပေးမယ်။"', en: '"I\'ll find you someone else."' },
    { hold: true, my: 'နောက်ဆုတ်ပေး', en: 'Step back' },
  ],
  p6Lower: [{ my: '…လူတိုင်း ပြောတာနဲ့ အတူတူပဲ။ (စာအုပ်ကို ပိတ်လိုက်တယ်။)', en: '…Same as everyone says. (She shuts the book.)' }],
  p6Find: [{ my: 'အစ်မ ရှာပေးမှာလား… ဒါဆို အစ်မရဲ့ သီချင်း ဖြစ်သွားမှာပေါ့။', en: "You'll find someone? …Then it'd be your song." }],
  p6Own: [
    { my: 'ကျွန်မ သတ်မှတ်ထားတာ တစ်ခုတည်းပါ။ မလျှော့ဘူး။', en: "I only set one thing. I'm not lowering it." },
    { my: 'ညီညီ… ဒီညတော့ မဆိုကြနဲ့ဦး။ စိတ်မဆိုးပါနဲ့။', en: "Nyi Nyi… not tonight. Don't be cross." },
  ],
  nn2: [{ my: '…မှန်ပါတယ်။ ကျွန်တော် တစ်ညမှ မလာခဲ့တာ။', en: "…Fair. I didn't come once." }],
  ch3: [{ my: 'အောက်သံ ဆိုတတ်တဲ့သူ ရှိလား…', en: 'Does anyone know the low part…?' }],
  ch3Pause: [{ my: '(ဘယ်သူမှ ထမလာဘူး။ စားပွဲက လူတွေ ခေါင်းလေး ညိတ်ပြီး ပြုံးပြကြတယ်။)', en: '(Nobody steps up. At the tables people shake their heads kindly.)' }], // NEW (the pause, said)
  ch4: [
    { my: 'တစ်ယောက်တည်းဆိုတော့ သီချင်းက သေးသွားတယ်။ ဒါပေမဲ့ ကျွန်မ သီချင်းပဲ။', en: "Alone, it's a smaller song. But it's mine." },
    { my: 'အောက်သံနေရာကို ချန်ထားမယ်။ လေ့ကျင့်မယ့်သူ ရောက်လာရင် နှစ်ယောက် ဆိုမယ်။', en: "I'll keep the low part open. When someone who practises comes, we'll sing it as two." },
  ],
  song: [{ my: '(မချယ်ရီ တစ်ယောက်တည်း ဆိုတယ်။ သီချင်း သေးသေးလေး။ စားပွဲ တချို့က နားထောင်ဖို့ ရပ်ကြတယ်။)', en: '(Ma Cherry sings alone, the small version. A few at the tables stop to listen.)' }], // NEW (stage)
  khinmayHum: [{ my: '(ဒေါ်ခင်မေ ကောင်တာနားမှာ လိုက်ညည်းတယ်။)', en: '(Daw Khin May hums along by the counter.)' }], // NEW (stage)
  uncleBefore: [{ my: 'ချယ်ရီ လေ့ကျင့်တာ ခုနစ်ညလုံး ကျုပ်ဆိုင်ထဲမှာ ကြားခဲ့ရတယ်။ ညီညီကိုတော့ တစ်ခါမှ မမြင်ဘူး။', en: "Seven evenings I've heard Cherry practise in my shop. Never once saw Nyi Nyi." }],
  uncleAfter: [{ my: 'ဆိုချင်တဲ့ည ဒီမှာ ဆို။ တစ်ယောက်တည်းလည်း ရတယ်။', en: 'Sing here any evening you like. Alone is fine.' }],
  uncleName: { my: 'လက်ဖက်ရည်ဆိုင် ဦးလေး', en: 'Tea-shop uncle' },

  // ---- 5.7 piece 7
  uc1: [{ my: 'ဒီကစ်ကို ကြည့်… ကြိုးထုံး နှစ်ထပ်ချည်ထားလို့ လေပြင်းပြင်းမှာလည်း မပြုတ်ဘူး။', en: 'Look at this kite… double knot at the bridle, so it holds in a hard gust.' }],
  ml3: [
    { my: 'ဦးချစ် ပြောတာ အကုန်မှန်တယ်! နံရံမှာ ကျွန်တော် ကပ်ထားတာ။', en: 'Everything Uncle Chit says is right! I pinned it on the wall.' },
    { my: 'ဦးချစ်က ကျွန်တော့် ကစ်ကို အလကား ပြင်ပေးတယ်။ ဒါကြောင့် ဦးချစ် ပြောသမျှ မှန်တယ်။', en: 'He fixed my kite for free. So everything he says is right.' },
  ],
  ucList: [{ my: 'ပန်းလေးက ကျုပ်ပြောတာတွေကို စာရင်းလုပ်ပြီး နံရံမှာ ကပ်ထားတယ်ဆိုလား… "အကုန်မှန်တယ်" တဲ့။ ကဲ၊ တစ်ခုချင်း ကြည့်ပါဦး။', en: 'Pan made a list of my sayings and pinned it on the wall, I hear… "all true", he says. Go on, look at them one by one.' }], // NEW (when Maung Pan is still in the class)
  sortTitle: { my: 'ဦးချစ် ပြောတာတွေ', en: 'Things Uncle Chit says' },
  sortHint: { my: 'ကိုယ်တိုင် မြင်ရတာ / အရင် စစ်ကြည့်ရမှာ', en: 'Seen it myself / check first' },
  sortBaskets: [
    { id: 'seen', my: 'ကိုယ်တိုင် မြင်ရပြီ', en: 'Seen it myself' },
    { id: 'check', my: 'အရင် စစ်ကြည့်ဦး', en: 'Check first' },
  ],
  sortCards: [
    { id: 'knot', basket: 'seen', my: 'ကြိုးထုံး နှစ်ထပ်ဆို လေထဲမှာ ကစ် မပြုတ်ဘူး။', en: 'A double knot keeps a kite up in a gust.' },
    { id: 'curl', basket: 'seen', my: 'နံရံက စာရွက်ထောင့်တွေ ကော့တက်နေပြီ။', en: "The notes' corners on the wall are curling up." },
    { id: 'loaf', basket: 'check', my: 'ဒေါ်ခင်မေ့ ပေါင်မုန့်အသစ်က နေ့လယ်ဆို မာသွားတယ်။', en: "Daw Khin May's new loaf goes hard by noon." },
    { id: 'class', basket: 'check', my: 'ညနေတန်းက အချိန်ကုန်ရုံပဲ။', en: 'The evening class is a waste of time.' },
    { id: 'alone', basket: 'check', my: 'တစ်ယောက်တည်း သီချင်းဆိုတာ စိတ်မကောင်းစရာ။', en: 'Singing alone is sad.' },
  ],
  wrongSeen: { who: 'uchit', my: 'ဒါ ကျုပ် ကိုယ်တိုင် မစမ်းဖူးဘူး သမီး။ ကျုပ်ပြောလို့ဆိုပြီး "မြင်ပြီ" ထဲ မထည့်နဲ့။', en: "I never tried that myself, dear. Don't file it under 'seen' because I said it." },
  wrongCheck: { who: 'maungpan', my: 'ဒါကတော့ မျက်စိရှေ့မှာတင် မြင်နေရတာပဲ အစ်မ။', en: 'But you can see that one right in front of you, sister.' },
  wrongCheckChit: { who: 'uchit', my: 'ဒါကတော့ မျက်စိရှေ့မှာတင် မြင်နေရတာပဲ သမီး။', en: 'But you can see that one right in front of you, dear.' }, // NEW (Uncle Chit says it when Pan is not here yet)
  ml4: [{ my: 'ဦးချစ်က သဘောကောင်းတယ်။ ပြီးတော့ မှားလည်း မှားတတ်တယ်။ နှစ်ခုလုံး ဟုတ်တယ်။', en: 'Uncle Chit is kind. And he can be wrong. Both are true.' }],
  uc2: [
    { my: 'ကျုပ် မှားတာ ခဏခဏပဲ။ ကျုပ်ပါးစပ်ကို မယုံနဲ့၊ ကျုပ်ကစ်ကို စစ်ကြည့်။', en: "I'm wrong all the time. Don't trust my mouth, check my kites." },
    { my: 'ထောင့်တွေ ကော့နေတာတော့ ကျုပ် မနက်ကတည်းက မြင်တယ်။ မိုးလာတော့မယ် ထင်တယ်။ မနက်ဖြန်ကျမှ သိမှာပေါ့။', en: "The curling corners I saw myself this morning. Rain's coming, I'd say. We'll know tomorrow." },
  ],
  cardAsk: { my: 'မေးခွန်းကတ်နဲ့ "မနက်ဖြန် မိုးရွာမယ်" ကို စစ်ကြည့်မလား။', en: 'Test "rain tomorrow" with the question card?' }, // NEW (the optional use)
  cardChoices: [{ my: 'ကတ်နဲ့ စစ်မယ်', en: 'Use the card' }, { my: 'နောက်မှ', en: 'Not now' }],
  cardRain: [{ my: 'ကြားတာ မဟုတ်ဘူး၊ လက္ခဏာကို ကိုယ်တိုင် မြင်ခဲ့တာ။ မနက်ဖြန်ကိုတော့ ဘယ်သူမှ မမြင်ရသေးဘူး။', en: 'Not hearsay: he saw the sign himself. Nobody can see tomorrow yet.' }],

  // ---- 5.8 close
  closeNc: [{ my: 'နံရံက ဘယ်တော့မှ အလွတ် ဖြစ်မှာ မဟုတ်ဘူး။ ပူနေတာ နည်းသွားရင် တော်ပြီ။', en: 'The wall will never be empty. Less hot is enough.' }],
  closeMaya: [{ my: '(စာတို ခုနစ်စောင်။ ကျွန်မ ရေးခဲ့တာ ဟုတ်တယ်… ဒါပေမဲ့ တစ်စောင်ချင်းကို တခြားသူတွေ ကိုယ်တိုင် လုပ်ပြခဲ့တာ။)', en: '(Seven short notes. I wrote them… but each one, somebody else did first.)' }],
  goHome: [{ my: 'အိမ်ပြန်ပြီး စာရေးခန်းမှာ ဒီနေ့အကြောင်း ရေးရမယ်။', en: "I'll go home and write today down at the Writing Room." }], // NEW (Day 1's mayaWrite, today's words)

  // ---- the seven short pieces (item `notes`, one page each)
  notes: {
    burn: { my: 'မီးကို ကိုင်ပြီး ပစ်ရင် ကိုယ်အရင် လောင်တယ်။ ချလိုက်လို့ ရတယ်၊ ကျော်သွားလို့ ရတယ်။', en: 'Pick up fire to throw it and you burn first. You can put it down, and walk past.' },
    notbad: { my: 'ကိုယ် မရွေးတိုင်း မကောင်းတာ မဟုတ်ဘူး။ တခြားသူအတွက် ကိုက်နေနိုင်တယ်။', en: "What I don't choose isn't bad for that. It may suit someone else." },
    today: { my: 'ဆယ်နှစ်ဆိုတာ ကြားရတာပဲ ကြာတာ။ တကယ်က မြန်တယ်။ စချင်ရင် ဒီနေ့ စ။', en: 'Ten years only sound long. They go fast. If you mean to start, start today.' },
    quiet: { my: 'အမှားကို တစ်ယောက်တည်းကို တိုးတိုး ပြောတယ်၊ ကောင်းစေချင်လို့။ လူစုပြီး အပြစ်ပြောတာက ဂုဏ်ယူစရာ မဟုတ်ဘူး။', en: 'A mistake is told quietly, to the one person, wishing them well. Piling on is nothing to be proud of.' },
    notme: { my: 'စေတနာကို ရယ်ခံရရင် ကိုယ့်အတွေးကို အရင် ပြောင်း: သူတို့က ကိုယ် မဟုတ်ဘူး။ ပြီးမှ ရှင်းအောင် နောက်တစ်ခါ ပြော။', en: "When your goodwill is laughed at, change your own thought first: they aren't you. Then explain once more, clearly." },
    standard: { my: 'ကိုယ်သတ်မှတ်ထားတာကို မလျှော့နဲ့။ ဘယ်သူမှ မလာရင်တောင် တွေ့ရာလူထက် ကိုယ့်စည်းနဲ့ကိုယ် တစ်ယောက်တည်းက ပိုကောင်းတယ်။', en: "Don't lower what you set. Even if nobody comes, alone on your own terms beats whoever turns up." },
    weigh: { my: 'ကြိုက်စရာ တစ်ခု ရှိတာနဲ့ လုပ်သမျှ မှန်တာ မဟုတ်ဘူး။ တစ်ခုချင်း ချိန်ပြီး အရှိကို အရှိအတိုင်း ကြည့်။', en: "One thing to like about someone doesn't make all they do right. Weigh each thing; see it as it is." },
  },
  noteTitle: (n) => ({ my: `ကျွန်မရေးတဲ့ စာတို ${myd(n)}`, en: `Short piece ${n}` }),

  // ---- 6. ambient (one line per tap, rotating)
  amb: {
    khinmayBefore: [
      [{ my: 'နံရံကို မကြည့်ချင်ဘူး။ ကြည့်လိုက်ရင် ပူလာတယ်။', en: "I don't want to look at the wall. Every time I do, I heat up." }],
      [{ my: 'ပေါင်မုန့်အသစ် နူးတယ်နော်။ နေ့လယ်မှာ မာတယ် ဆိုတာ ဘယ်သူ ပြောလဲ မသိဘူး။ လာဖိကြည့်။', en: "The new loaf's soft, you know. Who says it goes hard by noon? Come and press it." }],
    ],
    khinmayAfter: [
      [{ my: 'မီးဖိုက အပူကို ယူသွားပြီ။ နောက်ဘက်ခြမ်းကိုတော့ သတိထားနေတယ်။', en: "The oven took the heat. I'm watching the back of it, though." }],
      [{ my: 'ပေါင်မုန့်အသစ် နူးတယ်နော်။ နေ့လယ်မှာ မာတယ် ဆိုတာ ဘယ်သူ ပြောလဲ မသိဘူး။ လာဖိကြည့်။', en: "The new loaf's soft, you know. Who says it goes hard by noon? Come and press it." }],
    ],
    arkarBefore: [[{ my: 'ဟင်းချိုက အိမ်လို အရသာ။ ခြောက်ခြောက်ကဟာ ဘယ်သူ စားလဲ မသိဘူး။', en: 'Soup tastes like home. Who eats it dry, I wonder.' }]],
    arkarAfter: [[{ my: 'ဦးပုဆိုင်မှာလည်း လူတန်းကြီး။ ကျွန်တော့်အတွက် မဟုတ်ရုံပဲ။', en: "Long queue at U Pu's too. It's just not for me." }]],
    eimonBefore: [
      [{ my: 'နံရံမှာ ကိုယ့်အကြောင်း ကပ်ခံရရင်… ကျွန်မဆို ဖြုတ်ပြီး ဆုတ်ပစ်မှာ။', en: "If they pinned me on the wall… I'd rip it down and tear it up." }],
      [{ my: 'ပန်းလေးရဲ့ အပင်က ဘူးထဲမှာ အမြစ်တွေ ထွက်နေပြီ။ ညနေတန်းထဲက ပြတင်းပေါက်ခုံပေါ်မှာ။', en: "Pan's tree has roots coming out of its tin. On the windowsill inside the evening class." }],
    ],
    eimonAfter: [
      [{ my: 'နံရံမှာ ကိုယ့်အကြောင်း ကပ်ခံရရင်… ကျွန်မဆို ဖြုတ်ပြီး ဆုတ်ပစ်မှာ။', en: "If they pinned me on the wall… I'd rip it down and tear it up." }],
      [{ my: 'အပင်လေး မြေထဲ ရောက်သွားပြီ။ ကျွန်မလည်း စမယ်ဆိုတာ ဒီနေ့ စလိုက်မယ်။', en: "The little tree's in the ground. Whatever I've been meaning to start, I'll start today." }],
    ],
    upuAfter: [[{ my: 'ဟင်းချို ကြိုက်တဲ့သူ ကြိုက်ပါစေ။ ကျုပ်ဆိုင်မှာလည်း ထိုင်ခုံ မလွတ်ဘူး။', en: 'Let the soup folk love soup. My stools are full too.' }]],
    upuBefore: [[{ my: '(ဦးပု ခေါင်းမဖော်ဘဲ ခေါက်ဆွဲ ဆက်သုပ်နေတယ်။)', en: "(U Pu keeps his head down, tossing noodles.)" }]], // NEW (he says nothing before p2)
    panRain: [[{ my: 'ဦးချစ်က မနက်ဖြန် မိုးရွာမယ်တဲ့! ဦးချစ် ပြောတာ အကုန်မှန်တယ်။', en: "Uncle Chit says it'll rain tomorrow! He's always right." }]],
    uchitAfter: [[{ my: 'ကစ်ကျိုးရင် ယူလာခဲ့။ ကျုပ်ပြောတာတွေကိုတော့ ကိုယ့်ဘာသာ စစ်။', en: 'Bring me broken kites. Check what I say for yourself.' }]],
    cherryAfter: [[{ my: 'မနက်ဖြန်လည်း လေ့ကျင့်မယ်။ တစ်ယောက်တည်းပဲ ဖြစ်ဖြစ်။', en: "I'll practise tomorrow too. Even on my own." }]],
    nyinyiAfter: [[{ my: 'ဒီညကစပြီး လေ့ကျင့်ကြည့်မယ်။ ချယ်ရီ့အတွက် မဟုတ်ဘူး၊ ကိုယ့်အတွက်။', en: "I'll start practising tonight. Not for Cherry. For me." }]],
    cherryLook: [[{ my: 'စာရွက်နဲ့ စာအုပ်ကို ကြည့်ချင်ရင် ကြည့်လို့ရတယ်နော်။', en: 'You can look at the sheet and the book if you like.' }]], // NEW (the L step, said by her, not pointed)
  },

  // ---- 7.3 the "ask Maya" board
  ncSlip: { my: 'ကျွန်မစာ ကျွန်မ ဖြုတ်သွားတယ်။ လမ်းက ကိုယ့်ဘာသာ ရွေးမယ်။ — နေခြည်', en: "I took my own note down. I'll choose the road myself. — Nay Chi" },
  boardTitle: { my: '"မာရာ့ကို မေးပါ" ဘုတ်', en: 'The "ask Maya" board' },
  boardMaya: [{ my: '(ကျွန်မ ဖြုတ်ပေးတာ မဟုတ်ဘူး။ သူကိုယ်တိုင်။)', en: "(I didn't take it down for her. She did.)" }],
  boardBefore: [{ my: '(မေးခွန်းစာတွေ အများကြီး။ နေခြည့် စာလေးလည်း ဒီမှာပဲ ရှိနေတုန်း။)', en: "(So many questions. Nay Chi's little note is still up here too.)" }], // NEW
  // 7.4 the reply letter's pencil line (stored; the reply page draws it)
  reply: { my: 'လမ်းကို ကျွန်မ ပြနိုင်တယ်။ လှမ်းရမှာကတော့ ကိုယ်တိုင်ပါ။', en: 'I can show you the road. The steps are yours.' },

  // ---- 8.2 desk hearthClass (only if Day 9 left it dark)
  deskQ: { my: 'ဒီနေရာကနေ ကိုယ်တိုင် မြင်ရတာကို ရေးမယ်။', en: 'Write what you can see from here yourself.' },
  desk: [
    { my: 'နံရံပေါ်က စာရွက်တွေရဲ့ ထောင့်တွေ ကော့တက်နေတယ်။', en: 'The corners of the notes on the wall are curling up.' },
    { my: 'နံရံမှာ ကပ်ထားသမျှ အမှန်တွေချည်းပဲ။', en: 'Everything pinned on the wall is true.' },
    { my: 'ဒီနံရံကို ဘယ်သူမှ မဖတ်ကြတော့ဘူး။', en: 'Nobody reads this wall any more.' },
  ],
  deskWrong: [{ my: '(ဒါ ကြားခဲ့တာ။ မျက်လုံးနဲ့ ပြန်ကြည့်ပါဦး။)', en: "(That's what I heard. Look again.)" }],
  deskDone: [{ my: 'ဖဲကြိုးလေး တက်သွားပြီ။ နံရံဆီ စာမျက်နှာ လှန်ပြီး ပြန်လာလို့ ရပြီ။', en: 'The ribbon is up. I can turn the page straight back to the wall now.' }],

  // ---- proof slips
  proofLoaf: { my: 'ပေါင်မုန့်အသစ်က နေ့လယ်ရောက်လည်း နူးနေတုန်းပဲ။ ကိုယ်တိုင် ဖိကြည့်ခဲ့တယ်။', en: 'The new loaf is still soft at noon. Pressed it myself.' },
  proofWall: { my: 'နံရံပေါ် ကပ်ထားတိုင်း မမှန်ဘူး။ ဆိုင်းဘုတ်က ပြင်ပြီးသွားပြီ၊ စာက ကျန်နေခဲ့တယ်။', en: 'Being pinned on the wall does not make it true. The sign was fixed; the note stayed.' },

  // ---- 9. night page
  nightQ: { my: 'ဒီနေ့အကြောင်း မှန်မှန်ကန်ကန် ဘယ်လို ရေးမလဲ။', en: 'How will she write today, truthfully?' },
  nightChoices: [
    { my: 'ကျွန်မ စာတိုတွေကြောင့် မီးဖိုတန်းတစ်ခုလုံး ရန်မဖြစ်တော့ဘူး။ နေခြည်ကလည်း ကျွန်မ လုပ်မယ့်အတိုင်း အတိအကျ လုပ်သွားတယ်။', en: "Thanks to my notes the whole Row stopped quarrelling. And Nay Chi did exactly what I'd have done." },
    { my: 'ရန်စကား ခုနစ်ခု။ တစ်ယောက်ချင်း ကိုယ့်အပူ ကိုယ် ချလိုက်ကြတယ်။ နေခြည်က မမေးတော့ဘဲ ဖဲကြိုးကို ကိုယ်တိုင် သိမ်းပြီး ဒေါ်ငြိမ်းကို တိုးတိုးလေး သွားပြောတယ်။ ကျွန်မက နောက်ဆုတ်ပေးရုံပဲ။', en: 'Seven quarrels. Each person put down their own heat. Nay Chi stopped asking, put the ribbon away herself and told Daw Nyein quietly. I only stepped back.' },
    { my: 'မနက်ဖြန်ဆို နံရံ ပြန်ပြည့်မှာပဲ။ ကျွန်မ ဘာရေးရေး ဘယ်သူမှ မပြောင်းဘူး။', en: 'The wall will be full again tomorrow. Nothing I write changes anyone.' },
  ],
  nightWrong: [
    [{ my: '(မဟုတ်ဘူး… ဒါ ချော့ပြောတာ။ စာတိုတွေက သူတို့ လုပ်ပြီးမှ ရေးခဲ့တာ။ နေခြည်ကလည်း သူ့ဟာသူ ဆုံးဖြတ်တာ။)', en: "(No… that flatters. I wrote the notes after they'd done it. And Nay Chi decided for herself.)" }],
    [],
    [{ my: '(မဟုတ်ဘူး… ဒါ အားလျှော့ပြောတာ။ နံရံ ပူတာ နည်းသွားတယ်။ ဆိုင်းဘုတ်လည်း ပြင်ပြီးပြီ။)', en: '(No… too gloomy. The wall is less hot. The sign is fixed.)' }],
  ],
  sleepQ: { my: 'ဒီည မှတ်စုစာမျက်နှာလေး ဘယ်သူ့အိမ်မှာ အိပ်မလဲ။', en: "Whose house does tonight's notebook page sleep at?" },
  stampText: { my: 'စာမျက်နှာ ၁၈ — ကျွန်မရေးတဲ့ စာတို\nစာတို တစ်ခုချင်းကို တခြားသူတစ်ယောက်က ကိုယ်တိုင် အရင် လုပ်ပြခဲ့တယ်။', en: 'Page 18 — Short Pieces I Wrote\nEach short piece, someone else did first.' },
  windowOpen: [{ my: 'ပဲပွင့်နံ့လေး ဝင်လာအောင် ပြတင်းပေါက် ဖွင့်ထားမယ်။', en: "I'll leave the window open for the scent of the bean flowers." }],
  tomorrow: { my: 'နောက်တစ်နေ့ မနက် ရောက်ပြီ။', en: 'Morning comes.' },
  // Day 12 morning lines from tonight's house (Day 12's script reads them: exported as SLEPT11 too)
  slept11: {
    naychi: { my: '"ဒီနေ့ တစ်ခုမှ မမေးခဲ့ဘူး။ မနက်ဖြန်လည်း စမ်းကြည့်မယ်။" — နေခြည်', en: '"I asked nothing today. I\'ll try it again tomorrow." — Nay Chi' },
    khinmay: { my: '"မီးဖိုက အပူကို ယူတယ်။ ကျွန်မလက်က ပေါင်မုန့်ကိုပဲ ယူတယ်။" — ဒေါ်ခင်မေ', en: '"The oven takes the heat. My hands take the bread." — Daw Khin May' },
    maungarkar: { my: '"ကျွန်တော့်အတွက် မဟုတ်တာနဲ့ မကောင်းတာ မတူဘူး။" — မောင်အာကာ', en: '"Not for me isn\'t the same as bad." — Maung Arkar' },
    maungpan: { my: '"အပင်လေး တစ်ညအိပ်ပြီးပြီ။ မြေထဲမှာ ပထမဆုံး။" — ပန်းလေး', en: '"The little tree has slept one night in the ground. Its first." — Pan' },
    uchit: { my: '"ကျုပ်ပါးစပ်ကို မယုံနဲ့။ ကောင်းကင်ကို ကြည့်။" — ဦးချစ်', en: '"Don\'t trust my mouth. Look at the sky." — Uncle Chit' },
    cherry: { my: '"သီချင်း သေးသေးလေးလည်း သီချင်းပါပဲ။" — ချယ်ရီ', en: '"A small song is still a song." — Cherry' },
    sanshar: { my: '"တစ်ယောက် ယူသွားတယ်။ ကျုပ်အတွက် လုံလောက်တယ်။" — ဦးစံရှား', en: '"One of them took a box. Enough for me." — U San Shar' },
    nyein: { my: '"တိုးတိုးလေး ပြောတဲ့ တစ်ခွန်းက လမ်းတစ်လမ်းလုံးကို လင်းစေတယ်။" — ဒေါ်ငြိမ်း', en: '"One quiet word lit the whole lane." — Daw Nyein' },
  },
};

export const SLEPT11 = L.slept11;
