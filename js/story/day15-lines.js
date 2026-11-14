// Day 15's words (the finale, launch evening): every line Maya and the town say today, kept apart from
// the script in day15.js so the script stays readable. Every Burmese line is a draft for Maya to proofread.
// New lines this file adds beyond the day spec are marked `// new` (for Maya to check too).
import { castById } from './cast.js';
import { myNum } from './api.js';

export const L = {
  // ---- morning, inside the Writing Room (4)
  ww0: [{ my: '(တံခါးခေါက်သံ) မာရာရေ… ဝင်ခဲ့မယ်နော်။', en: "(A knock.) Maya… I'm coming in." }],
  ww1: [{ my: 'မာရာရေ… ဒီနေ့ ပွဲနေ့လေ။ မှတ်စုစာမျက်နှာလေးလည်း ပြန်ရောက်လာပြီ။', en: "Maya… it's launch day. And your notebook page is back." }],
  slept14extra: {
    phothar: { my: '"လေရဟတ်အောက်မှာ မီးအိမ်လေး ချိတ်ကြည့်တယ်။ ညမှာလည်း လည်တယ်။" — ဖိုးသား', en: '"I hung a little lamp under a windmill. It turns at night too." — Pho Thar' },
    wintwar: { my: '"ကိုယ့်စာ တစ်စောင် ကိုယ်တိုင် ရေးပြီးပြီ။ ဘယ်သူ့ဆီမှ မပို့ဘူး။ ကိုယ့်အတွက်။" — မဝင့်ဝါ', en: '"I wrote a letter of my own at last. Not to anyone. For me." — Ma Wint War' },
    dawohn: { my: '"မိချိုက သူ့မီးခွက်လေး သူ့လက်နဲ့ သူ ဆွဲတယ်။ ကျွန်မ တစ်ခွန်းမှ မပြောရဘူး။" — ဒေါ်အုန်း', en: '"Mi Cho threw her own little lamp with her own hands. I didn\'t say a word." — Daw Ohn' },
  },
  ww2: [{ my: 'တိုးတိုးဆီကလည်း စာလေး ပါလာတယ်။', en: 'And a note from Toe Toe.' }],
  ttNote: { my: 'အစ်မ… စာစီစာကုံးအောက်မှာ နာမည်တွေ ထည့်ပြီးပြီ။\nဒေါ်နှင်းဝေ၊ မုန့်ဆိုင်က ချိန်ခွင်၊ အစ်မ… ပြီးတော့ ကျွန်တော်လည်း ပါတယ်။ "ဘာကြောင့်လဲ" မေးခဲ့တာ ကျွန်တော်ပဲလေ။\nကိုဝဏ္ဏက ၆ နဲ့ ၉ ကို နှစ်ခါစစ်ပြီးမှ ရိုက်ပေးတယ်။', en: "Sister… I put the names under my essay.\nDaw Hnin Wai, the snack-shop scale, you… and me as well. I was the one who asked why.\nKo Wunna checked every 6 and 9 twice before he printed it." },
  ttQ: { my: 'ဒီနေ့မေးခွန်း: မီးတွေ အများကြီး တစ်နေရာတည်းမှာ ဆုံရင် ဘာလို့ ပိုလင်းသလို ထင်ရတာလဲ။', en: "Today's question: why do lots of lights in one place seem brighter?" },
  star: [{ my: '(မနေ့က စာမျက်နှာ အောက်ခြေက ကြယ်ပွင့်လေး ခုန်ထွက်လာတယ်။ စာကြောင်းတိုင်းဘေးမှာ နာမည်လေး ကပ်ချင်နေတယ်။)', en: "(The little star from the foot of yesterday's page hops out. It wants to pin a name beside every line.)" }],
  starMaya: [{ my: 'ဘယ်သူ့စကားလဲ ပြောပြတတ်တဲ့ ကြယ်လေး… ဒီည နင့်အလုပ် အများကြီးပဲ။', en: "A little star that tells whose words they are… you'll be busy tonight." }],
  ww3: [
    { my: 'နေ စာအုပ်အစွန်းကို ထိတဲ့အချိန် တစ်မြို့လုံး ရေပန်းနားကို လာကြမယ်တဲ့။ ဖဲကြိုးလမ်းတွေ အကုန်ကနေ။', en: "When the sun touches the book's edge, the whole town's coming to the fountain. Down every ribbon road." },
    { my: 'ဘယ်သူမှ မခိုင်းဘဲ လူတိုင်း မီးတစ်ခုစီ ကိုယ့်ဘာသာ လုပ်လာကြမယ်တဲ့။', en: 'Nobody asked them to, but everyone is making a light of their own to bring.' },
    { my: 'ဒါနဲ့… ဖိတ်စာ မပါရင် ဝင်လို့မရဘူးလို့ ကြားတယ်။ ဟုတ်မဟုတ်တော့ မသိဘူး။', en: "Oh… I heard you can't get in without an invitation. I don't know if it's true." },
    { my: 'ပြီးတော့ ဘုတ်ပြားပေါ်မှာ စာရွက် တစ်ရွက်ပဲ ကျန်တော့တယ်။ မာရာ့ဆီ လိပ်မူထားတာ။', en: "And there's only one note left on the board. It's addressed to you." },
  ],
  // (section 5 intro: who says where each task is, by ear)
  wwHpo: [{ my: 'ဦးဖိုးထော်က မနက်စောစော ရောက်နေပြီ။ ပြတင်းဘေး ပန်းခင်းနားမှာ ငုံ့ကြည့်နေတယ်။', en: 'U Hpo Htaw came early. He\'s bent over the window bed.' }],
  wwCafe: [{ my: 'ကိုဖြိုးက မနက်စောစောကတည်းက ကော်ဖီဆိုင်ထဲမှာ မီးဖို မွှေးနေပြီ။', en: 'Ko Phyo has had his brazier going inside the Café since dawn.' }],
  wwLeave: [{ my: 'စာတိုက်မှာ ဖိတ်စာ ကျန်တာလေးတွေ ခွဲရဦးမယ်။', en: "I've the leftover invitations to sort at the Post Office." }],
  wwLater: [{ my: 'နေမဝင်သေးဘူးနော်။ မီးတွေက မှောင်ရီပျိုးမှ လာမှာ။ နေခြည်ကတော့ မာရာ့ကို ရှာနေတယ်။', en: "The sun's not down yet. The lights come at dusk. Nay Chi was looking for you, though." }],
  wwReady: [{ my: 'နေ စောင်းလာပြီ။ ရေပန်းနားမှာ စားပွဲတွေ ခင်းပြီးပြီ။', en: 'The sun is getting low. The tables are set by the fountain.' }],
  waitNc: { my: 'နေခြည်က မာရာ့ကို ရှာနေတယ်။', en: 'Nay Chi was looking for you.' },
  waitLight: { my: 'မာရာ့မီးကော။ ဘုတ်ပေါ်က စာရွက် ဖတ်ပြီးပြီလား။', en: 'And your light? Did you read the note on the board?' },

  // ---- the last note on the board (4.1)
  boardNote: {
    from: { my: 'မြို့ထဲက လူတွေ', en: 'the people of the town' },
    my: 'မာရာ၊ ဒီတစ်ခါ ကျွန်တော်တို့က မေးမယ်။\nဒီည မာရာ ကိုယ်တိုင်ကော ဘာမီး ယူလာမလဲ။',
    en: "Maya, this time we're asking.\nTonight, what light will YOU bring?",
  },
  boardMaya: [
    { my: '(…ကိုယ့်မီး။ လူတိုင်းကို လမ်းပြနေခဲ့တာ… ကိုယ့်အတွက်တော့ မစဉ်းစားရသေးဘူး။)', en: "(…My own light. I've been showing everyone the road… and never thought about mine.)" },
    { my: '(မီးအိမ် မရှိသေးဘူး။ Template ဆိုင်မှာ စက္ကူ ရှိတယ်။ ကိုယ်ချစ်တဲ့အရာနဲ့ ကိုယ်တိုင် လင်းအောင် လုပ်ရမယ်။)', en: "(I have no lantern yet. The Template Shop has paper. I'll have to light it myself, with what I love.)" },
  ],
  boardAgain: [{ my: '(ဒီည ကိုယ်တိုင် ဘာမီး ယူလာမလဲ… တဲ့။)', en: '(What light will I bring myself… it asks.)' }], // new
  boardEmpty: [{ my: '(ဘုတ်ပြား ဗလာ။ ပင်အပေါက်လေးတွေပဲ ကျန်တယ်။)', en: '(The board is empty. Only the pin holes are left.)' }], // new

  // ---- flowers (5.1)
  hp1: [
    { my: 'ဒီပန်းဥလေးတွေ ငါ့ခြံက ထွက်လာတာ။ ညငါးည အိပ်ပြီး ဒီမနက် ပွင့်ကြပြီ။', en: 'Those bulbs came from my garden. Five nights asleep, and they opened this morning.' },
    { my: 'စားပွဲပေါ်က ပန်းအိုးတွေ ဗလာပဲ။ ပွင့်ပြီးသားတွေ ခူးသွားလေ။', en: 'The vases on the tables are empty. Take the ones that have opened.' },
  ],
  bloomSeen: [{ my: 'ပွင့်နေတာ ကိုယ်တိုင် မြင်ရပြီ။', en: "I can see for myself they've opened." }],
  bud: [{ my: '(ဒီတစ်ပွင့်က မပွင့်သေးဘူး။ နောက်မှ ပွင့်ပါစေ။)', en: '(This one is not open yet. Let it open later.)' }],
  hpBud: [{ my: 'ငါ့ခြံတံခါးလည်း တစ်ချိန်က ပိတ်ထားခဲ့တာပဲ။ ကိုယ့်အချိန်ကျမှ ဖွင့်တာ။ အတင်းဖွင့်ရင် ကျိုးတယ်။', en: 'I kept my gate shut once, too. I opened it in my own time. Force it, and it breaks.' }],
  hpDone: [{ my: 'ပန်းအိုးထဲက ပန်းတွေ ဝိုင်းကြည့်ကြမှာ။ ငါ့ခြံ တံခါးလည်း ဖွင့်ထားခဲ့တယ်။', en: 'People will gather round those vases. I left my garden gate open, too.' }],
  noBulbs: [{ my: 'ပန်းဥတွေက မပွင့်သေးဘူး။ ကိစ္စမရှိဘူး။ ငါ့ခြံက ခူးလာတာ ရှိတယ်။', en: "The bulbs aren't open yet. Never mind. I brought some from my garden." }],
  beans: [{ my: '(တိုးတိုးရဲ့ ပဲပင်တွေ။ ဒါတွေ မခူးဘူး။)', en: "(Toe Toe's beans. Not these.)" }],
  stemPicked: [{ my: '(တစ်ပွင့်။)', en: '(One.)' }], // new
  stemsFull: [{ my: '(ငါးပွင့် ရပြီ။ ရေပန်းဘေးက စားပွဲဆီ ယူသွားမယ်။)', en: '(Five. I\'ll take them to the tables by the fountain.)' }], // new
  vaseEmpty: [{ my: '(ပန်းအိုးလေး ဗလာ။)', en: '(An empty little vase.)' }], // new
  vaseTag: { my: 'ပန်းဥ — ဦးဖိုးထော့် ခြံက', en: "Bulbs — from U Hpo Htaw's garden" },
  vaseMaya: [{ my: '(ပွင့်တာက ကျွန်မ ပန်းခင်းထဲမှာ။ ပန်းဥကတော့ သူ့ဆီက။)', en: '(They bloomed in my bed. The bulbs were his.)' }],

  // ---- Template Shop (5.2)
  wnCall: { my: 'အစ်မ! စာအုပ်ငယ်တွေ ဒီမှာ!', en: 'Sister! The booklets are in here!' },
  wn1: [
    { my: 'အစ်မ! မဝင့်ဝါ မနက်စောစော စာအုပ်ငယ်လေးတွေ ယူလာပေးတယ်။ တစ်ရွက်ချင်း ၆ နဲ့ ၉ ကို လှည့်ကြည့်ပြီးမှ ရိုက်တာ။', en: 'Sister! Ma Wint War brought the booklets at dawn. I turned every 6 and 9 round to check before printing.' },
    { my: 'ကြိုဆိုစားပွဲပေါ် တင်ပေးနိုင်မလား။ ကျွန်တော် ပွဲစဉ်ဘုတ် ရေးနေတုန်း။', en: "Could you put them on the welcome table? I'm still writing the programme slate." },
  ],
  wnPaper: [{ my: 'မီးအိမ်စက္ကူလား။ စင်ပေါ်က ယူသွားလေ။ စာအုပ်ငယ် မျက်နှာဖုံး ဖြတ်ပြီး ကျန်တာတွေ။', en: 'Lantern paper? Take a sheet off the shelf. Offcuts from the booklet covers.' }],
  paperTaken: [{ my: '(စက္ကူ တစ်ရွက်။ ကျန်တာက ကိုယ့်လက်နဲ့ပဲ။)', en: '(One sheet. The rest is up to my own hands.)' }],
  shelfPlain: [{ my: '(Template တွေ စီထားတဲ့ စင်။ အောက်ဆုံးထပ်မှာ မျက်နှာဖုံး အပိုင်းအစလေးတွေ။)', en: '(A shelf of templates. Cover offcuts on the bottom board.)' }], // new
  paperHave: [{ my: '(စက္ကူ ရပြီးပြီ။ တစ်ရွက်ဆို လုံလောက်တယ်။)', en: '(I have my sheet. One is enough.)' }], // new
  kyStitch: [{ my: 'ချုပ်ရိုးပြေတာ တစ်အုပ်ချင်း ပြန်ချုပ်နေတာ။ အမြန်ချုပ်ရင် ညကျ ပြန်ပြေမှာ။', en: "Re-stitching the loose ones, one at a time. Rush it and they'll come apart again tonight." }],
  wnSlate: [{ my: 'ပွဲစဉ်က တိုတိုလေးပဲ။ ဘုတ်မှာ ကိုယ်တိုင် ဖတ်ကြည့်လေ။', en: "The programme's short. Read the slate yourself." }],
  booklet: [{ my: '(နောက်ဆုံးစာမျက်နှာမှာ တိုးတိုးရဲ့ စာစီစာကုံး။ အောက်ခြေမှာ နာမည်တွေ စီထားတယ်။)', en: "(Toe Toe's essay on the last page. Names listed at the foot.)" }],
  slate: { my: 'ပွဲစဉ်\n၁။ ကြိုဆိုစကား — နေခြည်\n၂။ စာစီစာကုံး — တိုးတိုး\n၃။ နာမည်များ — မာရာ\n၄။ မီးများ — အားလုံး', en: 'Programme\n1. Welcome — Nay Chi\n2. Essay — Toe Toe\n3. Names — Maya\n4. Lights — everyone' },
  slateTitle: { my: 'ပွဲစဉ်ဘုတ်', en: 'The programme slate' },
  boxUp: [{ my: '(သေတ္တာကို လက်နှစ်ဖက်နဲ့ ပွေ့လိုက်တယ်။ ကြိုဆိုစားပွဲက ရေပန်းရဲ့ အနောက်ဘက်မှာ။)', en: "(She lifts the box in both arms. The welcome table is on the fountain's west side.)" }], // new
  boxDown: [{ my: '(စာအုပ်ငယ်တွေ ကြိုဆိုစားပွဲပေါ် ရောက်ပြီ။)', en: '(The booklets are on the welcome table.)' }], // new
  card: [{ my: '(ပြတင်းမှာ လက်ရေးကတ်လေး: "စာအုပ်ငယ်များ ဒီမှာ")', en: '(A hand-lettered card in the window: "Booklets here")' }], // new

  // ---- Café (5.3)
  py1: [{ my: 'ကျွန်တော့်အိုးနဲ့ ကျွန်တော် ဖျော်ထားပြီ။ အစ်မ အိုးလည်း ရှိသေးလား။ ဧည့်သည်စားပွဲပေါ် ချထားလိုက်လေ။ ဘယ်သူ သောက်သောက်ပေါ့။', en: "I've brewed my own pot. Still got yours, sister? Put it on the guests' table. Whoever drinks it, drinks it." }],
  py0: [{ my: 'လက်ဖက်ရည် ဖျော်ပြီးပြီ။ ညနေကျ လာသောက်။', en: "Tea's brewed. Come and drink tonight." }],
  teaSet: [{ my: '(ဘယ်သူ သောက်သောက်ပေါ့။ ပေးလိုက်ရတာနဲ့ စိတ်က အေးသွားပြီ။)', en: '(Whoever drinks it. Just giving it has cooled my mind.)' }],
  guestsTable: [{ my: '(ဧည့်သည်စားပွဲ။ ခွက်လေးတွေ စီထားတယ်။)', en: "(The guests' table. Cups set out.)" }], // new
  teaSeen: [{ my: '(မောင်ငယ်က ကျွန်မအိုးထဲက တစ်ခွက် ငှဲ့နေတယ်။ မြင်ရတာ ဝမ်းသာလိုက်တာ။)', en: "(Maung Nge is pouring a cup from my pot. It's good to see.)" }],
  pyInvite: [{ my: 'အေးလာပြီ။ ဆိုင်ထဲ လာထိုင်ကြ။ လက်ဖက်ရည် ရှိသေးတယ်။', en: "It's getting cool. Come and sit inside. There's still tea." }],

  // ---- Maya's own light (5.4)
  deskIdle: [{ my: '(စာရေးစားပွဲ။ မှတ်စုစာအုပ်က ဖွင့်လျက်။)', en: '(The writing desk. The notebook lies open.)' }], // new
  noPaper: [{ my: '(စက္ကူ မရှိသေးဘူး။ Template ဆိုင်မှာ ရှိတယ်။)', en: '(No paper yet. The Template Shop has some.)' }],
  lt1: [{ my: 'ကိုယ်ချစ်တာက… စာရေးတာ။ ငယ်ငယ်ကတည်းက ထပ်ခါထပ်ခါ ရေးခဲ့တာ။', en: 'What I love is… writing. Again and again, since I was small.' }],
  foldTitle: { my: 'မီးအိမ် ခေါက်မယ်', en: 'Fold a lantern' },
  foldHint: { my: 'ထောင့်တိုင်းကနေ အလယ်ကို ဖြည်းဖြည်း ခေါက်ပါ', en: 'Fold each corner to the centre, slowly' },
  wordTitle: { my: 'ကိုယ့်မီး', en: 'Her own light' },
  wordHint: { my: 'ရွှေမင် ကလောင်နဲ့ ရွှေအစက်က စပြီး ဖြည်းဖြည်း ရေးပါ', en: 'With the gold quill, start at the gold dot and write slowly' },
  ltAgain: [{ my: 'လက်က မြန်သွားတယ်။ နောက်တစ်ခါ။', en: 'Too quick. Once more.' }],
  ltDone: [
    { my: '(«စာ» တစ်လုံးတည်း။ မီးအိမ်က နွေးနွေးလေး လင်းလာတယ်။)', en: '(One word: «writing». The lantern glows, softly.)' },
    { my: 'ပါရမီကြောင့် မဟုတ်ဘူး။ ကိုယ်ချစ်တာကို မရပ်မနား လုပ်ခဲ့လို့ပဲ။', en: 'Not because of a gift. Because I kept at the thing I love.' },
  ],
  boardDown: [{ my: '(ဘုတ်ပေါ်က နောက်ဆုံးစာရွက်ကို ကိုယ်တိုင် ဖြုတ်လိုက်တယ်။ ဖြေပြီးပြီလေ။)', en: "(She takes the last note off the board herself. It's answered.)" }],
  deskDone: [{ my: '(မီးအိမ်က လက်ထဲမှာ။ ညနေ ရေပန်းနားကို ယူသွားမယ်။)', en: "(The lantern's in my hand. I'll take it to the fountain at dusk.)" }], // new

  // ---- Nay Chi (6)
  ncVoice: { my: '(တံခါးကြားက နေခြည့်အသံ တိုးတိုးလေး… "မင်္ဂလာ… အင်း၊ မဟုတ်သေးဘူး။")', en: '(Through the door, Nay Chi\'s voice, low… "Good eve… no. Not yet.")' }, // new
  nc1: [
    { my: 'အစ်မ… ကြိုဆိုစကား ကျွန်မ ပြောရမယ်တဲ့။ မြို့တစ်မြို့လုံးရှေ့မှာ။', en: 'Sister… they want me to give the welcome. In front of the whole town.' },
    { my: 'သုံးမျက်နှာ ရေးပြီး သုံးမျက်နှာလုံး ခြစ်ပစ်လိုက်ပြီ။', en: 'I wrote three pages and crossed out all three.' },
  ],
  ncLater: [{ my: 'ခဏ… ကိုယ့်ဘာသာ ထပ်စဉ်းစားကြည့်ဦးမယ်။ စာကြည့်တိုက်ထဲမှာပဲ ရှိမယ်။', en: "Wait… let me think again on my own. I'll be here in the Library." }],
  ncLeanMaya: [{ my: '(သူ့စကားကို ကျွန်မ ပြန်ယူလိုက်မိပြီ။ နောက်တစ်ခါ နောက်ဆုတ်ပေးမယ်။)', en: "(I took her words back off her. Next time I'll step back.)" }],
  ncPractice: [{ my: '(နေခြည် သူ့စာကြောင်းလေးကို တိုးတိုးလေး ရွတ်နေတယ်။)', en: '(Nay Chi is saying her line over under her breath.)' }], // new
  sheets: [{ my: '(ခြစ်ထားတဲ့ စာမျက်နှာ သုံးရွက်။ ကြားထဲမှာ ခြစ်မထားတဲ့ စာကြောင်း တစ်ကြောင်း။)', en: '(Three crossed-out pages. One line between them left standing.)' }], // new
  books: [{ my: '(စင်ပေါ်က စာအုပ်တွေ မှောက်ဖွင့်ထားတယ်။ သူများ စာကြောင်းလှလှလေးတွေ။)', en: "(Books from the shelf, open face down. Other people's fine lines.)" }], // new
  mugDown: [{ my: '(Writer ခွက်လေးကို ဘေးစားပွဲပေါ် ချထားလိုက်တယ်။ ခုံပုလေးပေါ် ထိုင်မယ်။)', en: '(She sets the Writer mug on the side table and sits on the footstool, lower than her.)' }], // new

  // ---- banner, rumours (7.R)
  bannerRead: [{ my: '(ဆိုင်းဘုတ်: "စာအုပ် မိတ်ဆက်ပွဲ · လာချင်သူ အားလုံး ကြိုဆိုပါတယ်"။ ဖိတ်စာ မလိုဘူး။)', en: '(The banner: "Book launch · everyone who wants to come is welcome". No invitation needed.)' }], // new
  proofs: {
    ticket: { my: 'ဒီညပွဲ ဝင်ဖို့ ဖိတ်စာ မလိုဘူး။ ဆိုင်းဘုတ်မှာ "လာချင်သူ အားလုံး ကြိုဆိုပါတယ်" တဲ့။', en: 'No invitation is needed tonight. The banner says "everyone who wants to come is welcome".' },
    speech: { my: 'ပွဲစဉ်မှာ မာရာ့ ဟောပြောချက် မပါဘူး။ နာမည်တွေ ဖတ်ရုံပဲ။', en: 'The programme has no speech from Maya. Only names, read out.' },
    bloom: { my: 'ပြတင်းဘေး ပန်းခင်းက ပွင့်နေပြီ။ တစ်ပွင့်ပဲ မပွင့်သေးဘူး။', en: 'The window bed is in bloom. One bud is not open yet.' },
  },
  sunwePre: [{ my: 'ဒီည မာရာက လူတိုင်းကို ဘဝလမ်းညွှန် ပြောမယ်တဲ့။ မှတ်စုစာအုပ် ယူလာတယ်။', en: 'They say tonight Maya will tell everyone how to live. I brought a notebook.' }],
  sunweSlate: [{ my: 'ပွဲစဉ်မှာ မပါဘူးတဲ့။ ဒါဆို မှတ်စုစာအုပ်ထဲ ကိုယ့်ဟာကိုယ် ရေးမယ်။', en: "It's not on the programme. Then I'll write my own in my notebook." }],
  ukyawBloom: [{ my: 'ပြတင်းဘေး ပန်းခင်းက ညက ပွင့်သွားတယ်လို့ ကြားတယ်။', en: 'I hear the window bed opened in the night.' }],
  generic: [{ my: 'ကိုယ့်မီးလေးနဲ့ လာခဲ့တယ်။', en: 'I came with my own little light.' }],

  // ---- the launch (8)
  dusk: [{ my: '(ဖဲကြိုးလမ်းတွေ အကုန်လုံးကနေ မီးလေးတွေ တစ်စီ တစ်စီ တက်လာကြတယ်။)', en: '(Little lights come up every ribbon road, one after another.)' }],
  ncWelcome: [
    { my: 'မင်္ဂလာ ညနေခင်းပါ။ ကျွန်မ နေခြည်ပါ။', en: "Good evening. I'm Nay Chi." },
    { my: 'တစ်နေ့က တစ်ယောက်ယောက် ပြောပေးမှာကို တစ်နေကုန် စောင့်ခဲ့တယ်။ အဲဒီနေ့ ကိုယ့်အခွင့်အရေး လွတ်သွားတယ်။', en: 'Once I waited all day for someone to tell me what to do. That day I missed my own chance.' },
    { my: 'အခု… ကိုယ့်ဘာသာ မေးတယ်၊ ကိုယ့်ဘာသာ သွားကြည့်တယ်။ မှားလည်း ကိုယ့်ခြေလှမ်းပဲ။', en: 'Now… I ask for myself, and go and look for myself. Even the wrong steps are mine.' },
    { my: 'ကြိုဆိုပါတယ်။', en: 'Welcome.' },
  ],
  ncStumble: { my: '(တစ်နေရာမှာ ထစ်သွားတယ်။ ခဏရပ်တယ်။ ဆက်ပြောတယ်။)', en: '(She stumbles once. Stops. Goes on.)' },
  ttRead: [
    { my: 'ကျွန်တော့် စာစီစာကုံးရဲ့ နောက်ဆုံးစာကြောင်းပါ။', en: 'The last line of my essay.' },
    { my: 'ဒီစာထဲက စကားတွေ ကျွန်တော့်ဟာချည်း မဟုတ်ဘူး။ ဒေါ်နှင်းဝေ၊ မုန့်ဆိုင်က ချိန်ခွင်၊ မာရာ… ပြီးတော့ "ဘာကြောင့်လဲ" မေးခဲ့တဲ့ ကျွန်တော်။', en: 'The words in here aren\'t only mine. Daw Hnin Wai, the snack-shop scale, Maya… and me, who asked "why?"' },
  ],
  readOpen: [{ my: 'ကျွန်မ ဒီည နာမည်တွေပဲ ဖတ်မယ်။ ကျွန်မ စာမျက်နှာတွေကို ကျွန်မနဲ့အတူ စမ်းကြည့်ပေးခဲ့တဲ့ နာမည်တွေ။', en: "Tonight I'll only read names. The names of the people who tried my pages with me." }],
  readClose: [
    { my: 'တချို့စာမျက်နှာက ပထမတစ်ခါမှာ မကိုက်ခဲ့ဘူး။ ကိုယ့်ဟာကိုယ် ပြင်ယူကြမှ ကိုက်လာတာ။', en: "Some pages didn't fit the first time. They fitted once you made them your own." },
    { my: 'ကျွန်မနဲ့အတူ စမ်းကြည့်ပေးခဲ့လို့ ကျေးဇူးပါ။', en: 'Thank you for trying them with me.' },
  ],
  refsMaya: [{ my: 'ဒါကတော့ ကျွန်မ စာအုပ်ရဲ့ ကိုးကား။', en: "And these are my book's own references." }],
  where: [{ my: 'ကိုယ့်မီးကို ဘယ်မှာ ချမလဲ။', en: 'Where will she set her light?' }],
  middle: [{ my: '(ဒီည အလယ်မှာ ကျွန်မ မလိုပါဘူး။)', en: "(Tonight the middle doesn't need me.)" }],
  placed: [{ my: '(လူတိုင်း ကိုယ့်မီးနဲ့ ကိုယ်။ ကျွန်မမီးက ဒီထဲက တစ်ခုပဲ။)', en: '(Everyone with their own light. Mine is one of them.)' }],
  ttPlaced: [{ my: 'အစ်မမီးကလည်း တခြားမီးတွေလိုပဲ လင်းတာပဲ။ …ဒါ ဘာကြောင့်လဲ။', en: 'Your light shines just like the others. …Why is that?' }],
  replyMaya: [{ my: 'နောက်ဆုံး စာကြောင်းကို ကျွန်မ မရေးဘူး။ ဒါ ဖတ်တဲ့သူရဲ့ စာကြောင်း။', en: "I won't write the last line. It belongs to whoever reads this." }],
  lastTitle: { my: 'နောက်ဆုံး စာကြောင်း', en: 'The last line' },
  lastPrompt: { my: 'ဒီစာကြောင်းက ကိုယ့်ဟာပါ။ ကြိုက်သလို ရေးပါ။ ဗလာထားလည်း ရပါတယ်။', en: 'This line is yours. Write it any way you like, or leave it blank.' },
  lastStarts: [
    { my: 'ကျွန်မ/ကျွန်တော် ကိုယ်တိုင်', en: 'I will, myself,' },
    { my: 'မနက်ဖြန်ကစပြီး', en: 'From tomorrow,' },
    { my: 'မှားခဲ့ရင်တောင်', en: 'Even if I go wrong,' },
    { my: 'ကိုယ်ချစ်တဲ့လမ်းပေါ်မှာ', en: 'On the road I love,' },
  ],
  lastEnds: [
    { my: 'သွားကြည့်မယ်။', en: 'go and see.' },
    { my: 'နောက်တစ်ခါ ထပ်လုပ်မယ်။', en: 'try once more.' },
    { my: 'ကိုယ့်မီးနဲ့ကိုယ် လျှောက်မယ်။', en: 'walk by my own light.' },
    { my: 'ဘယ်သူ့စကားလဲ မှတ်ထားမယ်။', en: 'remember whose words I carry.' },
  ],
  plane: [{ my: '(ပြန်စာလေး ပျံသွားပြီ။ ဘယ်သူ့ဆီလဲ ကျွန်မ မသိဘူး။)', en: "(The reply flies off. To whom, I don't know.)" }],
  writeDown: [{ my: 'ဒီနေ့အကြောင်း စာရေးခန်းမှာ နောက်ဆုံး ရေးရဦးမယ်။', en: 'I should write today down at my Writing Room, one last time.' }],
  replyTitle: { my: 'နာမည်မပါတဲ့ စာကို ပြန်စာ', en: 'Reply to the unsigned letter' },
  // Day 1's letter (re-read before the reply, 8.7)
  letter: { my: 'အစ်မ… ကျွန်တော်/ကျွန်မ လူကြီးကမ္ဘာထဲ ခြေစလှမ်းတော့မယ်။\nလမ်းမပျောက်အောင် မြေပုံလေး ရှိလား။', en: "Sister… I'm about to step into the grown-up world.\nIs there a map, so I don't get lost?" },

  // ---- night page (9)
  nightQ: { my: 'ဒီနေ့အကြောင်း မှန်မှန်ကန်ကန် ဘယ်လို ရေးမလဲ။', en: 'How will she write today, truthfully?' },
  nightChoices: [
    { my: 'ကျွန်မ စာအုပ်ကြောင့် တစ်မြို့လုံး ပြောင်းသွားတယ်။ ဒီည အားလုံး ကျွန်မအတွက် လာကြတာ။', en: 'My book changed the whole town. Tonight they all came for me.' },
    { my: 'ကျွန်မ စာမျက်နှာတွေက တချို့နဲ့ ချက်ချင်း ကိုက်တယ်၊ တချို့နဲ့ မကိုက်ခဲ့ဘူး။ ကိုယ့်ဟာကိုယ် ပြင်ယူကြမှ ကိုက်လာတယ်။ ဒီည လူတိုင်း ကိုယ့်မီး ကိုယ်ယူလာကြတယ်။ ကျွန်မမီးက အဲဒီထဲက တစ်ခု။', en: "Some of my pages fitted at once, some didn't, until people made them their own. Tonight everyone brought a light of their own. Mine was one of them." },
    { my: 'နောက်ဆုံးတော့ ဘယ်သူမှ ကျွန်မ စာမျက်နှာတွေ မလိုတော့ဘူး။', en: 'In the end, nobody needs my pages any more.' },
  ],
  nightWrong: [
    [{ my: '(မဟုတ်ဘူး… ဒါ ချော့ပြောတာ။ သူတို့ ကိုယ့်ခြေထောက်နဲ့ကိုယ် လာကြတာ။)', en: '(No… that flatters. They came on their own feet.)' }],
    [],
    [{ my: '(မဟုတ်ဘူး… ဒါ အားလျှော့ပြောတာ။ မှီစရာ မလိုတော့တာနဲ့ မလိုတော့တာ မတူဘူး။)', en: "(No… too gloomy. Not needing to lean isn't the same as not needing.)" }],
  ],
  budLine: { my: 'ပြတင်းဘေးက ပန်းဖူးလေး မပွင့်သေးဘူး။ မနက်ဖြန် ကြည့်မယ်။', en: "The bud by the window is not open yet. I'll look tomorrow." },
  sleepQ: { my: 'ဒီည မှတ်စုစာမျက်နှာလေး ဘယ်သူ့အိမ်မှာ အိပ်မလဲ။', en: "Whose house does tonight's notebook page sleep at?" },
  stampText: { my: 'နောက်ဆုံးစာမျက်နှာ — ပြန်စာ\nမြေပုံက လမ်းကိုပဲ ပြတယ်။ လျှောက်တာက ကိုယ့်ခြေထောက်။\nနောက်ဆုံးစာကြောင်းက ဖတ်တဲ့သူရဲ့ဟာ။', en: 'The last page — the reply\nA map only shows the road. The walking is your own.\nThe last line belongs to the reader.' },
  tomorrow: { my: 'မနက်ဖြန်လည်း မြို့လေးက ဖွင့်ထားဆဲ။ မှတ်စုစာမျက်နှာလေးက ညတိုင်း ခရီးဆက်မယ်။', en: 'Tomorrow the town is still open. The notebook page keeps travelling, night after night.' },
  credits: [
    { my: 'စာရွက်မြို့က လူတွေ', en: 'The people of Paper Town' },
    { my: 'စာအုပ် — အမှန်မြင်ခြင်း', en: 'The book — Reality Check' },
    { my: 'ဒီဇာတ်လမ်းထဲက လူတွေ အားလုံး စိတ်ကူးယဉ်ပါ။', en: 'Everyone in this story is invented.' },
  ],
  creditsClose: { my: 'မြို့လေးထဲ ပြန်သွားမယ်', en: 'Back to the town' }, // new
  endedDesk: [{ my: '(ပြန်စာ စာမျက်နှာလေး။ ပြန်ဖွင့်ကြည့်လို့ ရတယ်။)', en: '(The reply page. I can open it again.)' }], // new
};

// The ambient lines (7): one per tap, rotating; `pre` before dusk, `after` once the plane has flown.
export const AMB = {
  wintwar: { pre: [{ my: 'ဖိတ်စာက ကျေးဇူးတင်စာပါ။ လက်မှတ် မဟုတ်ဘူး။ ဆိုင်းဘုတ်ကို ဖတ်ကြည့်လေ။', en: 'The invitations are thank-yous, not tickets. Read the banner.' }],
    after: [{ my: 'ကျွန်မက စာတွေ သယ်ပေးရုံပဲ။ ဖတ်တာ၊ ပြန်ဖြေတာက ကိုယ့်ဘာသာ။', en: 'I only carry the letters. Reading and answering them is up to each one.' }] },
  ukyaw: { pre: [{ my: 'စာအုပ်ငယ်တွေ ချုပ်ရိုးပြေနေလို့ ပြန်ချုပ်ပေးနေတာ။ တစ်ချက်ချင်းပဲ။', en: "The booklets' spines came loose, so I'm stitching them. One stitch at a time." }, L.ukyawBloom[0]],
    after: [{ my: 'ဖိုးသားကို ချုပ်နည်းပဲ ပြခဲ့တာ။ ဒီမီးကတော့ သူ့ဘာသာ လုပ်တာကွဲ့။', en: 'I only showed Pho Thar how to stitch. That light he made himself.' }] },
  phothar: { pre: [{ my: 'နေခြည်က စာကြည့်တိုက်ထဲမှာ စာရွက်တစ်ရွက်နဲ့ တစ်ယောက်တည်း စကားပြောနေတယ်။', en: "Nay Chi's in the Library, talking to a piece of paper all by herself." },
    { my: 'ကျွန်တော့်မီးက လေရဟတ်။ ပထမဆုံး ခေါက်တုန်းက ခုနစ်ခါ ပြဲသွားတယ်။', en: 'My light is a windmill. The first one I folded tore seven times.' }],
    after: [{ my: 'အစ်မမီးက တခြားမီးတွေနဲ့ တူတူပဲ။ အဲဒါ ကောင်းတယ်။', en: "Your light's the same as everyone's. That's good." }] },
  toetoe: { pre: [{ my: 'ကျွန်တော့်မီးက ပဲပင်အိုးထဲက။ နေရောင်ရတဲ့နေရာမှာ ထားမယ်… ညကျတော့ ဘာကြောင့် လင်းနေလဲ မေးမယ်။', en: "My light's in a bean jar. I'll put it where the sun was… then at night I'll ask why it shines." }],
    after: [{ my: 'နာမည်တွေ ဖတ်တုန်းက ကြယ်လေးက ကျွန်တော့်မီးပေါ် ခုန်တက်လာတယ်!', en: 'When you read the names the little star hopped onto my light!' }] },
  hninwai: { pre: [{ my: 'တိုးတိုး စာစီစာကုံးမှာ ဇယားအကြောင်း တစ်လုံးမှ မပါဘူး။ ကျွန်မ ဝမ်းသာတယ်။', en: "Not one word about the marks chart in Toe Toe's essay. I'm glad." }], after: [] },
  dawohn: { pre: [{ my: 'မီးခွက်လေးတွေ မိချိုလုပ်တာ။ လေးလုံးပဲ။ တစ်လုံးမှ မကွဲဘူး။', en: 'Mi Cho made the little lamps. Only four. Not one cracked.' }],
    after: [{ my: 'ဘီးပေါ်က မြေဖြူစာ မရှိတော့ဘူး။ မိချိုက ဖျက်တာ။', en: 'The chalk on her wheel is gone. Mi Cho rubbed it out herself.' }] },
  micho: { pre: [{ my: 'ဒေါ်ဒေါ်က ဒီည အိုးတွေကို သူ့စင်ပေါ်က ယူလာတယ်။ ကျွန်မဟာနဲ့ ဘေးချင်းကပ်ထားတယ်။', en: 'Aunty brought pots from her own shelf tonight. Side by side with mine.' }], after: [] },
  kophyo: { pre: [{ my: 'ဘယ်သူ ဝင်လာလာ တစ်ခွက်စီ။ ထိုက်သလား မထိုက်ဘူးလား မမေးတော့ဘူး။', en: "Whoever comes in gets a cup. I don't ask who deserves it any more." }],
    after: [{ my: 'အစ်မအိုး ကုန်သွားပြီ။ ဘယ်သူတွေ သောက်သွားလဲ ကျွန်တော် မမှတ်ထားဘူး။', en: "Your pot's empty. I didn't keep count of who drank it." }] },
  thiri: { pre: [{ my: 'ကျွန်မ စွန်လေးကို ကိုယ့်တိုင်မှာ ချည်ထားတယ်။ ဒီည မီးလေး ဆွဲထားမယ်။', en: "My kite's tied to my own post. Tonight it'll carry a little light." }], after: [] },
  kolwin: { pre: [{ my: 'ပွဲနေ့ တံဆိပ်ရိုက်တုံးကို ခွာညိုက ထွင်းတာ။ ဘောင်လေးပဲ ကျွန်တော် ထွင်းတယ်။ ကောင်းပါစေ။', en: 'Khwar Nyo carved the launch-day postmark. I only carved the border. May it go well.' }], after: [] },
  khwarnyo: { pre: [{ my: 'ဘောင်က ဆရာ့လက်ရာ။ တံဆိပ်ရိုက်တိုင်း နှစ်ယောက်လုံးရဲ့ လက်ရာ ဘေးချင်းကပ် ပေါ်လာတယ်။', en: "The border's my teacher's work. Every stamp shows both our hands, side by side." }], after: [] },
  kowunna: { pre: [{ my: 'ပွဲစဉ်ဘုတ်ကို ကိုယ်တိုင် ဖတ်ကြည့်ပါ။ ကျွန်တော်ပြောတာ မယုံနဲ့ဦး။', en: "Read the programme slate yourself. Don't just take my word." }], after: [] },
  khinmay: { pre: [{ my: 'ပေါင်မုန့်တွေ မောင်အာကာ ဖုတ်တာ။ မီးဖိုနားမှာ ကျွန်မ ဘာမှ မအော်တော့ဘူး… သိပ်တော့ မအော်ဘူး။', en: "Maung Arkar baked the bread. I didn't shout once at the oven… well, hardly." }],
    after: [{ my: 'ဒီနေ့ တစ်ခါပဲ အော်မိတယ်။ သူ့ကို တောင်းပန်ပြီးပြီ။ မနက်ဖြန် ထပ်ကြိုးစားမယ်။', en: "I shouted once today. I said sorry to him. I'll try again tomorrow." }] },
  maungarkar: { pre: [{ my: 'အိမွန်ကို ကျွန်တော် အရင်လှမ်းမေးလိုက်တယ်။ "နေကောင်းလား" လို့။', en: 'I asked Ei Mon first today. "Are you all right?"' }], after: [] },
  eimon: { pre: [{ my: 'ကိုယ့်ရက်ကန်းစလေးနဲ့ မီးအိမ် လုပ်ထားတာ။ ကိုယ်ပြချင်တဲ့ အပိုင်းလေးပဲ။', en: 'I made my lantern from a strip of my own weaving. Only the piece I chose to show.' }],
    after: [{ my: 'တစ်ယောက်က ကျွန်မ မီးအိမ်ကို ဖွင့်ကြည့်ချင်တယ်တဲ့။ အရင် ခွင့်တောင်းလို့ ပြလိုက်တယ်။', en: 'Someone wanted to look inside my lantern. They asked first, so I showed them.' }] },
  hpohtaw: { pre: [{ my: 'ဒီည ခြံတံခါး ဖွင့်ထားခဲ့တယ်။ နွယ်ပင်ကတော့ သူ့တိုင်နဲ့သူ။', en: 'I left the gate open tonight. The creeper keeps to its own post.' }], after: [] },
  kothiha: { pre: [{ my: 'အမေ ဖာထားတဲ့ ဖောင်ပေါ်က မီးအိမ်။ ဦးဘိုလေးရဲ့ ဆိပ်ကမ်းမှာလည်း ရပ်ပြီး ခေါ်လာခဲ့တယ်။', en: "The lamp off my mother's patched raft. I stopped at U Bo Lay's jetty too, and brought him." }], after: [] },
  kyinyein: { pre: [{ my: 'ချိန်ခွင် မှန်မှန်နဲ့ ရောင်းတာ အမြတ် နည်းတယ်။ ဒါပေမဲ့ ညဘက် အိပ်လို့ ပျော်တယ်။', en: 'Selling on an honest scale makes less. But I sleep well at night.' }], after: [] },
  naychi: { pre: [], after: [{ my: 'ထစ်သွားတယ်။ တစ်ခါ။ ဆက်ပြောလိုက်တယ်။', en: 'I stumbled. Once. And kept going.' }] },
  sunwe: { pre: [], after: [{ my: 'မှတ်စုစာအုပ်ထဲ ကိုယ့်စာကြောင်း တစ်ကြောင်း ရေးပြီးပြီ။ ဘယ်သူမှ ပြောမပေးဘူး။', en: 'I wrote one line of my own in my notebook. Nobody told me what to write.' }] },
  maungnge: { pre: [], after: [{ my: 'ဒီလက်ဖက်ရည်အိုး ဘယ်သူ့ဟာလဲ မသိဘူး။ ကောင်းတယ်။', en: "Don't know whose pot this is. It's good." }] },
};

// Who tried each page with Maya (8.4): never "taught". Names come from cast.js at run time.
export const PAGES = [
  { n: 1, who: ['phothar', 'ukyaw'] }, { n: 2, who: ['kothiha'] }, { n: 3, who: ['toetoe', 'hninwai'] },
  { n: 4, who: ['yeyint'] }, { n: 5, who: ['dawohn', 'micho'] }, { n: 6, who: ['kophyo'] },
  { n: 7, who: ['thiri'] }, { n: 8, who: ['kothiha'] }, { n: 9, who: ['sunwe', 'maungnge'] },
  { n: 10, who: ['kolwin', 'khwarnyo'] }, { n: 11, who: ['naychi'] }, { n: 12, who: [], text: { my: 'လမ်းဆုံက လူတွေ', en: 'the people at the Junction' } },
  { n: 13, who: ['kowunna'] }, { n: 14, who: ['khinmay', 'maungarkar'] }, { n: 15, who: ['maungarkar', 'eimon'] },
  { n: 16, who: ['hpohtaw'] }, { n: 17, who: ['kophyo'] }, { n: 18, who: [], text: { my: 'စာတိုနံရံက အိမ်နီးချင်းတွေ', en: 'the neighbours at the Note Wall' } },
  { n: 19, who: ['hpohtaw'] }, { n: 20, who: ['dawohn'] }, { n: 21, who: ['eimon'] },
  { n: 22, who: ['pyaesone'], text: { my: 'ခရီးသွားတွေ', en: 'the travellers' } }, { n: 23, who: ['toetoe'] },
];
const nm = (id) => castById(id)?.name || { my: id, en: id };
/** «စာမျက်နှာ ၃ — တိုးတိုး၊ ဒေါ်နှင်းဝေ» / "Page 3 — Toe Toe, Daw Hnin Wai" */
export const pageLine = (p) => ({
  my: `စာမျက်နှာ ${myNum(p.n)} — ${[...p.who.map((id) => nm(id).my), p.text?.my].filter(Boolean).join('၊ ')}`,
  en: `Page ${p.n} — ${[...p.who.map((id) => nm(id).en), p.text?.en].filter(Boolean).join(', ')}`,
});
/** A page whose stamp is not inked yet is read in pencil: "not finished yet". */
export const pageNotYet = (p) => ({ my: `စာမျက်နှာ ${myNum(p.n)} — မပြီးသေးဘူး။ နောက်မှ။`, en: `Page ${p.n} — not finished yet. Later.` });

// Day 14's next-morning lines (day14-spec 9, `slept14`), used when js/story/day14.js does not export its own.
export const SLEPT14_FALLBACK = {
  toetoe: { my: '"ဒီနေ့မေးခွန်း: စာအုပ်တစ်အုပ်ထဲမှာ လူဘယ်နှစ်ယောက်ရဲ့ စကား ပါသလဲ။" — တိုးတိုး', en: '"Today\'s question: how many people\'s words are in one book?" — Toe Toe' },
  khwarnyo: { my: '"ဘောင် — ကိုလွင်။ ရေးလိုက်ပြီ။" — ခွာညို', en: '"Border — Ko Lwin. Written." — Khwar Nyo' },
  kothiha: { my: '"ဆိပ်ကမ်း လေးခုလုံးမှာ ရပ်တယ်။ ဦးဘိုလေးလည်း လက်ပြတယ်။ နည်းနည်းလေး။" — ကိုသီဟ', en: '"Stopped at all four jetties. U Bo Lay waved. A little." — Ko Thiha' },
  naychi: { my: '"ဘောင်ပိတ်ပြီးပြီ။ သော့ခတ်ပြီးပြီ။ လာခဲ့မယ်။" — နေခြည်', en: '"Frame locked. Shed locked. On my way." — Nay Chi' },
  hpohtaw: { my: '"လာမယ်။ ကိုယ့်ဘာသာ ဆုံးဖြတ်တာ။" — ဦးဖိုးထော်', en: '"I\'ll come. My own decision." — U Hpo Htaw' },
};

// The reply Maya wrote on Day 14 (day14-spec 8.4), used when the save does not carry its own lines.
export const REPLY_FALLBACK = [
  { my: 'လမ်းပျောက်မှာ စိုးရင် ကျွန်မကို မေးပါ။', en: "If you're afraid of getting lost, ask me.", struck: true },
  { my: 'ကျွန်မ စာမျက်နှာတွေ ကျွန်မအတွက် မှန်ခဲ့တယ်။ တခြားသူတွေနဲ့လည်း စမ်းကြည့်ခဲ့ပြီ။', en: 'My pages were true for me. I have tried them beside others too.' },
  { my: 'မြေပုံဆိုတာ လမ်းကို ပြရုံပဲ။', en: 'A map only shows the road.' },
  { my: 'လမ်းကို ကိုယ်တိုင် လျှောက်ပြီး ကိုယ်တိုင် စစ်ကြည့်ပါ။', en: 'Walk it yourself, and check it yourself.' },
  { my: 'ကျွန်မ စာထဲက စကားတွေ ဘယ်သူ့ဆီကလဲ နောက်ဆုံးစာမျက်နှာမှာ ရေးထားတယ်။', en: 'Where my words came from is written on my last page.' },
  { my: 'ကိုယ့်ကိုယ်ကို အားကိုးပါ။', en: 'Rely on yourself.' },
];
