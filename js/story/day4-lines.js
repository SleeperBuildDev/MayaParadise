// Day 4's lines (day4-spec sections 4-9). Every Burmese line is a draft for Maya to proofread.
// Lines marked "(new)" are small connective lines the script needed that the spec does not word.
const l = (my, en) => ({ my, en });

/** Day 3's notebook lines (day3-spec 9, `slept3`): read this morning from the house the notebook slept in. */
export const SLEPT3 = {
  dawohn: l('"ကလင်လို့ မြည်ရင် ပြီးတာပဲ။ ဘယ်လက်က လုပ်လုပ်။" — ဒေါ်အုန်း', '"If it rings, it\'s done. Whoever\'s hands made it." — Daw Ohn'),
  micho: l('"ဒီနေ့ သုံးလုံး။ ကိုယ်တိုင် ရွေးတာ။ ဒေါ်ဒေါ်က ဘာမှ မပြောဘူး။ ပြုံးနေတယ်။" — မိချို', '"Three today. My own choice. Aunty said nothing. She was smiling." — Mi Cho'),
  sunwe: l('"ဒီည ၁၁ နာရီမှာ အိပ်မယ်။ ကျန်တဲ့ နှစ်နာရီကို လှေခေါက်ဖို့ ချန်ထားမယ်။" — စုနွယ်', '"Tonight I\'ll sleep at eleven. I\'m saving the other two hours for folding boats." — Su Nwe'),
  maungnge: l('"ဒေါ်အုန်း" (ကိုယ်တိုင် ရေးထားတယ်၊ စာလုံး ယိမ်းယိမ်းလေးနဲ့) — မောင်ငယ်', '"Daw Ohn" (written by himself, in wobbly letters) — Maung Nge'),
  naychi: l('"မာရာ ပြောထားတော့ ဘာမှ ဆက်စဉ်းစားစရာ မလိုတော့ဘူး။" — နေခြည်', '"Maya told me, so there\'s nothing left to think about." — Nay Chi'),
  hninwai: l('"ကျွန်မ စာသင်ခန်းထဲမှာ ဇယားထက် ကြီးတဲ့ အတန်းတစ်ခု မြင်လိုက်ရတယ်။" — ဒေါ်နှင်းဝေ', '"In my classroom I watched a lesson bigger than the chart." — Daw Hnin Wai'),
  toetoe: l('"မေးခွန်း — ကြက်တူရွေးက ဘာလို့ စကားပြောနိုင်တာလဲ။" — တိုးတိုး', '"Question: how can a parrot talk?" — Toe Toe'),
  yeyint: l('"ကိုယ်တိုင် မကြည့်ဘဲ သတင်း ပြန်ပြောမိတာ ဒီနေ့ပဲ သိတယ်။" — ရဲယဉ့်', '"Only today I noticed I pass news on without looking." — Ye Yint'),
};
export const SLEPT3_OTHER = l('(ဇွန်ပန်းလေး တစ်ပွင့် ညှပ်ထားတယ်။)', '(A pressed jasmine flower.)');

/** Tonight's notebook lines (spec 9 `slept4`), for Day 5's morning. Exported so Day 5 can import them. */
export const SLEPT4 = {
  kophyo: l('"မနက်ဦးခွက်ကို ဒီနေ့လည်း ငှဲ့တယ်။ ဘယ်သူ သောက်လဲ မကြည့်ဘူး။ နည်းနည်း ခါးသွားတယ်။ နောက်တစ်ခါ။" — ကိုဖြိုး', '"Poured the first cup again today. Didn\'t look who drank it. A bit bitter. Next time." — Ko Phyo'),
  thiri: l('"လေယာဉ်တစ်စင်း ခေါက်ပြီး ကိုယ့်အတွက် သိမ်းထားတယ်။ ပထမဆုံးအကြိမ်ပဲ။" — မသီရိ', '"Folded a plane and kept it for myself. First time ever." — Ma Thiri'),
  luaye: l('"လေယာဉ်စာကို ကောင်တာ နံရံမှာ ကပ်ထားတယ်။ ပြန်စာ မလိုတဲ့ စာ။" — ဦးလူအေး', '"Pinned the plane on the counter wall. A letter that needs no answer." — U Lu Aye'),
  tintin: l('"ရွက်တစ်ဆုပ်၊ အသက်သုံးချက်။ ကျွန်မ အမေ့နည်းပဲ။" — ဒေါ်တင်တင်', '"One pinch, three breaths. My mother\'s way." — Daw Tin Tin'),
  yi: l('"ထမင်းအိုး ပြည့်တယ်။ ဒါပဲ ရေးစရာ ရှိတယ်။" — ဒေါ်ရီ', '"The rice pot is full. That\'s all there is to write." — Daw Yi'),
  naychi: l('"မြေပုံပါတော့ ကိုယ်တိုင် ကြည့်စရာ မလိုဘူး ထင်တာ။ …နာရီဝက် ရပ်နေခဲ့တယ်။" — နေခြည်', '"With a map, I thought I wouldn\'t need to look myself. …I stood there half an hour." — Nay Chi'),
  other: l('(လက်ဖက်ရွက် ခြောက်လေး တစ်ရွက် ညှပ်ထားတယ်။)', '(A dry tea leaf, pressed.)'),
};

/** Proof slips (spec 2): the text on each slip. */
export const PROOFS = {
  shortcut: l('တံဆိပ်တဲတွေကြားက ဖြတ်လမ်း မရှိဘူး။ သေတ္တာတွေနဲ့ ဆုံးတယ်။', 'No shortcut through the stamp awnings. It ends in crates.'),
  freefood: l('ဒေါ်ရီ့ဆိုင်မှာ ဘယ်သူ့ကိုမှ ဘာမှ မမေးဘူး။ ထိုင်ရင် ကျွေးတယ်။', "Daw Yi asks nobody anything. Sit, and you're fed."),
  counter: l('စာတိုက်ကောင်တာ မွန်းတည့် မပိတ်ဘူး။ ဦးလူအေး ညနေထိ ရှိတယ်။', 'The letter counter does not shut at noon. U Lu Aye is there till evening.'),
  firstcup: l('ဒေါ်တင်တင်က မနက်ဦး ပထမခွက်ကို ဖြတ်သွားတဲ့သူ တိုက်တယ်။ မှန်တယ်။', 'Daw Tin Tin pours the first cup of the morning for whoever passes. True.'),
  kite: l('ကောင်တာနားမှာ တစ်နေကုန် စွန်လွှတ်နေတဲ့သူ ရှိတယ်။ မှန်တယ်။', 'Someone flies a kite at the counter all day. True.'),
};

export const L = {
  // ---- 4 · morning at home
  ww1: [l('မာရာရေ… မှတ်စုစာအုပ်လေး ပြန်ရောက်ပြီ။ ညက အိပ်ခဲ့တဲ့အိမ်က စာတစ်ကြောင်း ရေးပေးလိုက်တယ်။', 'Maya… your notebook is back. The house it slept at wrote you a line.')],
  ww2: [l('မောင်ငယ်ဆီကလည်း တစ်ခု ပါလာတယ်။ စုနွယ်က အိတ်ထဲ ထည့်ပေးလိုက်တာတဲ့။', 'And something from Maung Nge. Su Nwe slipped it into my bag.')],
  mnNote: l('အစ်မ… မောင်ငယ် နောက်ဆုံးတံဆိပ်ကို တစ်ယောက်တည်း ဖတ်သွားတယ်။\nအောက်က နာမည်ကို သူကိုယ်တိုင် ရေးတာ။ ကျွန်မ ခဲတံ ကိုင်မပေးဘူး။ — စုနွယ်\n\nမောင်ငယ်', "Sister… Maung Nge read the last label on his own.\nHe wrote the name underneath himself. I didn't hold the pencil. — Su Nwe\n\nMaung Nge"),
  ttQ: l('"ဒီနေ့မေးခွန်း: စာအိတ်တွေကို ဘာလို့ လေးထောင့် လုပ်ကြတာလဲ။" — တိုးတိုး', '"Today\'s question: why are envelopes made square-cornered?" — Toe Toe'),
  seedling: l('(မနေ့က စာမျက်နှာပေါ်က ပျိုးပင်လေး ထွက်လာတယ်။ အိုးကွဲလေး တစ်လုံးထဲမှာ ပေါက်နေတယ်။ "မရသေးဘူး" လို့ပဲ တိုးတိုးလေး ပြောတယ်။)', '(The seedling steps off yesterday\'s page, growing in a little cracked pot. All it whispers is "not yet".)'),
  ch9comp: l('(နောက်တစ်ကောင်က မာရာ့ လက်ပေါ်မှာ ခဏနားပြီး ပခုံးပေါ် တက်ထိုင်တယ်။)', "(The other rests on Maya's hand a moment, then settles on her shoulder.)"),
  compMaya: [l('မရသေးဘူး… ပြီးတော့ လမ်းပြပေးတာ။ နှစ်ယောက်လုံး လိုက်ခဲ့ကြမလား။', 'Not yet… and showing the way. Coming, both of you?')],
  ww3: [
    l('ဒီမနက် စာအိတ်ဈေးက စာလှည်း ရပ်ကွက်ကို ဖြတ်ပြီး တက်လာတယ်။ ဈေးစာတိုက်က ဦးလူအေးဆီက စာလေး ပါတယ်။', "The post cart came up from the Envelope Market this morning, through the Quarter. There's a note from U Lu Aye at the Market post office."),
    l('"စာအုပ်တစ်သေတ္တာ သယ်ပေးနိုင်မလား" တဲ့။', '"Could you carry a crate of books for me?" he says.'),
    l('ဈေးက ရပ်ကွက်ရဲ့ လမ်းမကြီးအတိုင်း တောင်ဘက် ဆုံးအောင် ဆင်း။ နယ်နိမိတ်ဆိုင်းဘုတ်ကျော်ရင် စာအိတ်စက္ကူလမ်း စတာပဲ။', "Take the Quarter's avenue south to the very end. Past the border sign, the envelope-paper road begins."),
    l('ဒါနဲ့… ဈေးထဲမှာ "မာရာ့လမ်း" ဆိုတဲ့ မြေပုံတွေ ဝေနေကြတယ်တဲ့။ မာရာ ဆွဲထားတာလား။', 'Oh… they say someone at the market is handing out maps called "Maya\'s Way". Did you draw them?'),
  ],
  wwFirstcup: [l('စာလှည်းသမားက ပြောတယ်… ဈေးထဲက လက်ဖက်ရည်ဆိုင်မှာ မနက်ဦးခွက် အလကားတဲ့။', "The cart driver says the market tea shop gives the morning's first cup free.")],
  mayaMap: [l('ကျွန်မလား။ မြေပုံ တစ်ချပ်မှ မဆွဲဖူးပါဘူး။', "Me? I've never drawn a single map.")],
  wwLater: [l('ဈေးလား။ ရပ်ကွက် လမ်းမကြီးအတိုင်း တောင်ဘက်ဆုံးထိ။ ဆိုင်းဘုတ်ကျော်ရင် စာအိတ်လမ်းပဲ။', "The market? Down the Quarter's avenue to the end. Past the sign, it's the envelope road.")],
  wwEvening: [l('စာတိုက်နံရံက မှတ်စုတွေ ဆယ့်လေးစောင် ဖြစ်သွားပြီ မာရာ။ တချို့က ဈေးထဲကတောင် လာချိတ်တာ။', 'Fourteen notes on the Post Office wall now, Maya. Some came all the way from the market.')],
  wwBoardAfter: [l('စာတိုက်နံရံက မှတ်စုတွေ တစ်ရက်ထက် တစ်ရက် များလာတယ်နော်။', 'The notes on the Post Office wall grow every day, don\'t they.')], // (new)

  // arrival
  arrive: [l('စာအိတ်ကြီး တစ်ခုလုံး ဖြန့်ထားသလိုပဲ။ ခေါက်ရာတွေက လမ်းတွေ ဖြစ်နေတယ်။', 'Like a whole envelope unfolded. Its creases have become lanes.')],
  kyCall: l('မာရာ့လမ်း! မာရာ့လမ်း! လမ်းမပျောက်ချင်ရင် မာရာ့နောက် လိုက်!', "Maya's Way! Maya's Way! Don't want to get lost? Follow Maya!"),

  // ---- 5.1 the three givers
  la1: [
    l('မာရာလား။ လာပါ။ ဒီသေတ္တာထဲက စာအုပ်တွေကို ဗလာစာအုပ်ရပ် ကျောင်းစင်ပေါ် ရောက်စေချင်တယ်။', 'Maya? Come in. I want the books in this crate on the school shelf in the Exercise-Book Quarter.'),
    l('ကျွန်တော် ငယ်ငယ်က အဲဒီကျောင်းမှာ စာဖတ်တတ်ခဲ့တာ။ အဲဒီကျောင်းမှာပဲနော်။ တခြားနေရာ မဟုတ်ဘူး။', "That's where I learned to read, as a boy. That school, mind. Nowhere else."),
    l('လေးတယ်။ ကားနောက်ဖုံးထဲ ထည့်ပေးမယ်။', "It's heavy. I'll put it in the back of your car."),
  ],
  laCrate: [l('(ဦးလူအေးက သေတ္တာကို ကိုယ်တိုင် ချီထုတ်သွားပြီး ကားထဲ ထည့်ပေးလိုက်တယ်။)', '(U Lu Aye carries the crate out himself and sets it in the car.)')], // (new)
  yuCall: l('အစ်မ…', 'Sister…'),
  yu1: [
    l('အစ်မ… ဒီရေခွက် သုံးလုံးကို တံဆိပ်တဲတွေနောက်က ကုက္ကိုပင်အရိပ်မှာ ချထားပေးပါလား။', 'Sister… would you set these three water bowls in the rain-tree shade behind the stamp awnings?'),
    l('ခွေးလေးတွေ အဲဒီမှာ အိပ်ကြတယ်။ နေ့လယ်ဆို ရေငတ်ကြတယ်။ ဒီနေ့ ဆိုင်မှာ တစ်ယောက်တည်းမို့ ကိုယ်တိုင် မသွားနိုင်ဘူး။', "The dogs sleep there. By noon they're thirsty. I'm alone in the shop today, so I can't go myself."),
    l('ကျွန်မ ဆိုင်က ခွက်တွေပါ။ ခွေးလေးတွေကို ပေးချင်လို့ ပေးတာ။', "They're from my own shelf. I want the dogs to have them, that's all."),
  ],
  yuTake: [l('ကောင်တာပေါ်က ခွက်တွေ ယူသွားလိုက်နော်။', 'Take the bowls off the counter, would you.')], // (new)
  dk1: [
    l('ကိုယ့်လယ်က ဆန်တစ်အိတ်။ ဘယ်ကို ပေးမလဲ ကိုယ် ရွေးပြီးပြီ။ လက်ဖက်ရည်ဆိုင်လမ်း အဆုံး ဒေါ်ရီရဲ့ စေတနာထမင်းဆိုင်ကို ပို့ပေးပါ။', "A sack from my own field. I've chosen where it goes: Daw Yi's free-food shop at the end of the tea-shop street."),
    l('ဘယ်သူ ပေးတယ်လို့ ပြောစရာ မလိုဘူး။ ထမင်းအိုး ပြည့်နေရင် ပြီးတာပဲ။', "No need to say who gave it. As long as the rice pot's full."),
  ],

  // ---- 5.2 Ko Phyo's sneers
  kpBooks: [l('စာအုပ်? ကျောင်းမှာ စာအုပ် ရှိပြီးသားပဲ။ ညနေတန်းကို ပေးရင် ပိုအသုံးဝင်မှာ။ ပထမလမ်းမှာလေ။', 'Books? The school has books. The evening class would make more use of them. On the first street, there.')],
  kpBowls: [l('ခွေးအတွက် ရေခွက်! လူတွေ စာတိုက်ထဲမှာ အိုက်အိုက်နဲ့ တန်းစီနေတာ။ အဲဒီမှာ ထားပေးရင် ပိုကောင်းမှာ။', "Water bowls for dogs! People are queueing in the heat inside the post office. Put them there; that'd be better.")],
  kpRice: [l('အဲဒီဆိုင်က ဘယ်သူ့ကိုမဆို ကျွေးတာ။ အလုပ်လုပ်နိုင်တဲ့လူတွေကိုပါ။ ဒီဆိုင်နောက်ဖေး မီးဖိုချောင် ပေးရင် တစ်ခုခု ဖြစ်လာမှာ။', 'That shop feeds anyone. People who could work, too. Give it to the kitchen back here; something would come of it.')],
  kpIdle: [l('ဒီလမ်းမှာ လူတိုင်း တစ်ခုခု ပေးနေကြတယ်။ ဘယ်နေရာ ပေးရမလဲတော့ ဘယ်သူမှ မသိကြဘူး။', 'Everyone on this street is giving something away. Nobody knows where it ought to go.')], // (new, the same complaint)
  kpOpen: [l('အကုန် ပို့ပြီးပြီပေါ့။ ဟုတ်ပြီ။ ကျွန်တော့်မှာတော့ ဘယ်သူ့ကိုမှ ပေးစရာ ဘာမှ မရှိဘူး။', "All delivered, then. Fine. Me, I've nothing to give anyone.")],
  kpNotYet: [l('သွားတော့… ဝန်တစ်ထုပ် ရှိသေးတယ်။', "Go on… I've a load to carry.")],

  // ---- 5.3 deliveries and forks
  carryOut: [l('(ကားထဲက သေတ္တာကို ကိုယ်တိုင် ချီပြီး ပို့မယ်။)', "(I'll lift the crate out of the car and carry it in myself.)")], // (new)
  hwBooks: [l('ဦးလူအေးလား။ ဒီကျောင်းမှာ စာသင်ခဲ့တဲ့ ကလေးတစ်ယောက်ပေါ့။ စင်ပေါ် တင်ထားမယ်။ ကျေးဇူးပြောပေးပါ။', "U Lu Aye? One of this school's own children, then. On the shelf they go. Thank him for us.")],
  ttBooks: [l('စာအိတ်တွေ ဘာလို့ လေးထောင့်လဲဆိုတာ ဒီထဲမှာ ပါမလား။ …ကိုယ်တိုင် ရှာကြည့်မယ်!', "Will one of these say why envelopes are square? …I'll look myself!")],
  bowlsMaya: [l('ခွေးအိုကြီး ထပြီး ရေသောက်နေတယ်… ကြည့်ရတာ ရင်ထဲ အေးသွားတယ်။', 'The old dog gets up and drinks… watching it, something in me goes cool.')],
  yiRice: [
    l('ဘယ်သူပို့လဲ မမေးတော့ဘူး။ ထမင်းအိုး ပြည့်ရင် ပြီးရော။', "I won't ask who sent it. A full rice pot is enough."),
    l('ဒီမှာ ဘယ်သူ့ကိုမှ ဘာမှ မမေးဘူး။ ထိုင်ရင် ကျွေးတာပဲ။', "Nobody here gets asked anything. Sit down, and you're fed."),
  ],
  delivered: [l('သုံးခုလုံး ပေးတဲ့သူ ရွေးတဲ့နေရာ ရောက်သွားပြီ။ ကျွန်မ သယ်ရုံပဲ သယ်ခဲ့တာ။', 'All three are where their givers chose. I only carried them.')],
  forkBooks: [l('ဒီသေတ္တာပေါ်မှာ "ကျောင်းစင်အတွက်" လို့ ရေးထားတယ်။ ပေးတဲ့သူ ရွေးထားတဲ့နေရာ ပို့ပေးပါ။', 'This crate says "for the school shelf". Take it where the giver chose.')],
  forkBowls: [l('ဒါ ယုယုရဲ့ ခွက်တွေ မဟုတ်လား။ သူက ခွေးလေးတွေအတွက်လို့ ပြောထားတာ။', "Aren't these Yu Yu's bowls? She said they're for the dogs.")],
  forkRice: [l('ဒေါ်ကြာ့ ဆန်အိတ်လား။ ဒါ ဒေါ်ရီ့ဆိုင်အတွက်လေ။ ကျွန်မ မယူဘူး။', "Daw Kyar's rice? That's for Daw Yi's shop. I won't take it.")],
  forkMaya: [l('(သူများ ပေးတာကို ကိုယ်က ပိုသိသလို ပြင်ချင်လိုက်တာ… ရင်ထဲ ပူသွားတယ်။)', "(Wanting to improve someone else's gift, as if I knew better… it went hot in my chest.)")],
  evTeacher: l('ညနေတန်း ဆရာ', 'Evening-class teacher'), // a name label for the walk-on

  // ---- 5.4 Daw Tin Tin
  dtt1: [
    l('ကိုဖြိုးလား။ ဝန်တစ်ထုပ်နဲ့ တစ်ထုပ်ကြားမှာ ဒီမှာ ထိုင်ပြီး လူတိုင်း ဘာပေးလဲ ဝေဖန်နေတာ။ ဆိုးတဲ့လူ မဟုတ်ပါဘူး။', "Ko Phyo? Between loads he sits here and passes judgment on what everyone gives. He's not a bad man."),
    l('ကျွန်မက မနက်ဦး ပထမခွက်ကို ဖြတ်သွားတဲ့သူ တိုက်တယ်။ ဘယ်သူလဲ မကြည့်ဘူး။', "Me, I pour the morning's first cup for whoever passes. I don't look who."),
    l('သူများအိုး မဖြည့်ခင် ကိုယ့်အိုးထဲ ရွက်ရှိရမယ်၊ ဖျော်နည်း သိရမယ်၊ စေတနာ ရှိရမယ်။ ကျွန်မ အမေ ပြောခဲ့တာ။', "Before you fill another's pot, your own needs leaves, know-how and goodwill. My mother said so."),
  ],
  dttAfter: [l('ကိုဖြိုး ကိုယ့်ကရားနဲ့ကိုယ် ဖျော်တာ မြင်ဖူးမယ်လို့ မထင်ခဲ့ဘူး။', "I never thought I'd see Ko Phyo brew in his own pot.")],
  menuSeen: [l('(ကိုယ့်မျက်စိနဲ့ ဖတ်လိုက်ရပြီ: "မနက်ဦးခွက် · ဖြတ်သွားသူအတွက်"။)', '(Read it with my own eyes: "The morning\'s first cup · for whoever passes".)')], // (new)

  // ---- 5.6 pails
  dttDeal: [l('ရွက်ကို လက်ဆောင် မပေးဘူးနော်။ ရေသုံးပုံး ခပ်ပေးရင် ရွက်တစ်ထုပ်နဲ့ ကရားအိုလေး ပေးမယ်။', "I don't hand out leaves. Fetch me three pails of water and you get a twist of leaves and the little old pot.")],
  kpBeat: [l('အစ်မ… အချက် ရေတွက်ပေး။ ကျွန်တော် လောရင် ဖိတ်တယ်။', 'Sister… count the strokes for me. When I rush, it splashes.')],
  kpNo: [l('ဟင့်အင်း… လက်ကိုင်ကို ကျွန်တော် ဆွဲမယ်။ ပုံးကိုလည်း ကျွန်တော် သယ်မယ်။ ဒါ ကျွန်တော့်အလုပ်။', "No… I'll work the handle. And I'll carry the pail. This is my work.")],
  kpGot: [l('ကိုယ့်လက်နဲ့ ရတာ… တော်တော် ကြာပြီ။', 'Got it with my own hands… first time in a long while.')],
  kpGoPump: [l('ရေပုံးကို အပြင်က ပိုက်ရေစက်မှာ ခပ်မယ်။ အစ်မ လာခဲ့နော်။', "I'll fill the pails at the pump outside. Come along, sister.")], // (new)
  splash: l('ဖိတ်သွားပြီ… ဒီပုံး ပြန်စမယ်။', 'Splashed… this pail starts again.'), // (new)
  pailFull: l('တစ်ပုံး ပြည့်ပြီ။', 'One pail full.'), // (new)
  beats: [l('တစ်', 'One'), l('နှစ်', 'Two'), l('သုံး', 'Three'), l('လေး', 'Four')], // Maya counts aloud (new)
  dttGives: [l('ရော့၊ ရွက်တစ်ထုပ်နဲ့ ကရားအိုလေး။ ကိုယ့်လက်နဲ့ ရတာနော်။', 'Here: a twist of leaves and the little old pot. Earned with your own hands.')], // (new)

  // ---- 5.7 brew (match)
  brewWhy: [
    l('ဒေါ်တင်တင့် ရေနွေးကြမ်းက ဘာလို့ မခါးတာလဲ။', "Why isn't your tea bitter, Daw Tin Tin?"),
  ],
  brewDtt: [l('လုပ်တာတိုင်းမှာ အကြောင်းရှိတယ်။ တစ်ခုချင်း ကြည့်။', 'Every step has its reason. Look at them one by one.')], // (new)
  matchTitle: l('ဒေါ်တင်တင် ဖျော်နည်း', "Daw Tin Tin's way to brew"),
  matchHint: l('သူ လုပ်တာနဲ့ ဘာကြောင့်လဲကို တွဲပါ', 'Pair what she does with why'),
  matchPairs: [
    { left: { my: 'ကရားကို ရေနွေးနဲ့ အရင်ဆေး', en: 'Rinse the pot with hot water first', icon: '🫖' }, right: l('လက်ဖက်ရည် မအေးသွားအောင်', "So the tea doesn't go cold") },
    { left: { my: 'ရွက် တစ်ဆုပ်ပဲ', en: 'Just one pinch of leaves', icon: '🍃' }, right: l('များရင် ခါးတယ်', 'Too much turns bitter') },
    { left: { my: 'ဆူပြီးမှ ခဏ ငြိမ်ပါစေ', en: 'Let the boil settle a moment', icon: '♨️' }, right: l('ဆူဆူပွက်ပွက်ဆို ရွက် လောင်တယ်', 'A rolling boil scorches the leaves') },
    { left: { my: 'အသက် သုံးချက်စာ စောင့်', en: 'Wait three breaths', icon: '⏳' }, right: l('အရောင် ထွက်လာအောင်', 'So the colour comes out') },
  ],
  kpBrew: [l('ခါးတာ ရွက်ကြောင့် မဟုတ်ဘူး။ ဖျော်နည်းကြောင့်ပဲ။', "It isn't the leaves that make it bitter. It's how you brew.")],

  // ---- 5.8 the first cup
  porterIn: [l('(ထမ်းသမား တစ်ယောက် စာအိတ်ထုပ်ကြီးနဲ့ နေပူထဲကနေ ဝင်လာပြီး တံခါးဝ စားပွဲမှာ ထိုင်တယ်။)', '(A porter with an envelope bale comes in out of the heat and sits at the table by the door.)')], // (stage direction)
  pourTitle: l('ကိုဖြိုးရဲ့ ပထမဆုံးခွက်', "Ko Phyo's first cup"),
  pourHint: l('ကရားကို ငြိမ်ငြိမ် ကိုင်ပါ။ ဘယ်သူ ကြည့်နေလဲ မော့မကြည့်နဲ့', "Hold the pot steady. Don't look up at who's watching"),
  pourAgain: l('မော့ကြည့်မိလို့ ဖိတ်သွားပြီ။ ပြန်ငှဲ့မယ်။', 'Looked up and spilled. Pour again.'),
  porterDrinks: [l('(ထမ်းသမားက သောက်ပြီး ပါးစပ်သုတ်၊ ဘယ်သူ့ကိုမှ မဟုတ်ဘဲ ခေါင်းညိတ်ပြီး ထုပ်ကြီး ပြန်ထမ်းသွားတယ်။)', '(The porter drinks, wipes his mouth, nods to nobody in particular and shoulders his bale.)')],
  kpPoured: [
    l('ကျေးဇူးတောင် မတင်သွားဘူး။', "Didn't even say thanks."),
    l('…ဒါပေမဲ့ ရင်ထဲ အေးနေတယ်။ ထူးဆန်းတယ်။', "…But it's cool in here. Strange."),
  ],
  mayaPoured: [l('(ကြည့်တဲ့သူ မရှိလည်း ငှဲ့တဲ့ခွက်။ ဒါ သူ့ကိုယ်ပိုင်ပဲ။)', '(A cup poured with no one watching. That one is all his.)')],
  kpTeapot: [
    l('ဒီအိုးလေး ယူသွား။ လမ်းမှာ သောက်။', 'Take this little pot. Drink it on the road.'),
    l('ဘာမှ ပြန်မပေးနဲ့။ ပြန်ပေးရင် ဒီအိုးက လဲလှယ်တာ ဖြစ်သွားမယ်။', "Don't give me anything back. If you do, it turns into a trade."),
  ],
  kpBusy: [l('ကရားလေး ဆေးနေတုန်း။ ခဏနေ ပြန်လာခဲ့။', "Still rinsing the little pot. Come back in a while.")], // (new: waits until Maya did something else)
  kpAfter: [l('မနက်ဖြန် မနက်ဦးခွက်လည်း ကျွန်တော် ငှဲ့မယ်။ ဒေါ်တင်တင် ခွင့်ပြုတယ်။', "Tomorrow I pour the morning's first cup too. Daw Tin Tin said I could.")],

  // ---- 6.1 ch 7 hooks
  pw1: [
    l('သနပ်ခါး လိမ်းသွား သမီး။ ဖြတ်သွားသူတိုင်း လိမ်းပေးတာ။ သိသိ မသိသိ။', 'Put on some thanaka, dear. I give it to everyone who passes, known or not.'),
    l('စိတ်ပူနေတဲ့လူ တွေ့ရင် နည်းနည်း လိမ်းပေး။ အေးသွားတယ်။', 'If you meet someone fretting, dab a little on them. It cools.'),
    l('မြေးမလေး ကောင်တာနားမှာ တစ်နေကုန် စွန်လွှတ်နေတယ်။ မနက်စာတောင် မစားဘူး။', "My granddaughter's been flying her kite by the counter all day. Didn't even eat breakfast."),
  ],
  pwAgain: [l('သနပ်ခါး လိမ်းသွား သမီး။ ဘယ်သူ့ကိုမဆို လိမ်းပေးတာပဲ။', 'Put on some thanaka, dear. I give it to anyone at all.')], // (new)
  pwAfter: [l('ရယ်သံလေး ပြန်ကြားရပြီ။', 'I can hear her laugh again.')],
  la2: [l('မသီရိလား။ ဖူးဖူးဆီ နေ့တိုင်း စာရေးတယ်။ ပြန်စာ ရောက်ရင် အပြင်က သူ့နံပါတ်အလံကို ကျွန်တော် ဒီကနေ ဆွဲတင်ပေးတယ်။ သုံးရက် ရှိပြီ။', 'Ma Thiri? She writes to Phoo Phoo every day. When a reply comes, I pull her number\'s flag up outside, from here. Three days now.')],
  laHours: [l('မွန်းတည့် ပိတ်တယ်? ကျွန်တော် အနှစ်လေးဆယ် ဒီမှာ ညနေထိ ထိုင်နေတာ။', "Shut at noon? Forty years I've sat here till evening.")],
  laWish: [l('ပြန်စာ စောင့်တဲ့စာက လေးတယ်။ ဆုတောင်းရုံ စာက ပေါ့တယ်။ ဒီကောင်တာမှာ အနှစ်လေးဆယ် ကြည့်လာတာ။', "A letter that waits for an answer is heavy. A letter that only wishes well is light. Forty years I've watched at this counter.")],
  laAfter: [l('ဒီနေ့ အလံကို ဘယ်သူမှ မော့မကြည့်ဘူး။ ကောင်းတယ်။', 'Nobody stared up at a flag today. Good.')],
  th1: [
    l('အလံ တက်လာမလား ကြည့်နေတာ။', "I'm watching for the flag."),
    l('ဖူးဖူးက ကျွန်မရဲ့ အခင်ဆုံး သူငယ်ချင်း။ ဒီလ အလုပ်သစ်နဲ့ မြို့ကြီးဘက် ပြောင်းသွားတယ်။', "Phoo Phoo's my best friend. She moved to the big-town side this month, for a new job."),
    l('အစ်မ… စွန်ကို ခဏ ကူကိုင်ပေးပါလား။ လက်တွေ ညောင်းနေပြီ။', 'Sister… would you hold the kite a moment? My arms ache.'),
  ],
  kiteSeen: [l('(တကယ်ပဲ၊ ကောင်တာရှေ့မှာ စွန်တစ်စင်း တက်နေတယ်။ ကိုယ့်မျက်စိနဲ့ မြင်ရပြီ။)', '(It\'s true: a kite is up in front of the counter. Seen with my own eyes.)')], // (new)

  // ---- 6.2 kite 1
  kite1Title: l('မသီရိရဲ့ စွန်', "Ma Thiri's kite"),
  kite1Hint: l('ဖိထားရင် ကြိုးတင်းမယ်။ လွှတ်ရင် ကြိုးလျော့မယ်', 'Hold to pull the line in, let go to pay it out'),
  kite1Maya: [l('ဆွဲလေ ပိုထိုးကျလေပဲ…', 'The harder I pull, the harder it dives…')],
  kite1Th: [l('အလံ မတက်ရင် ဘာလုပ်လုပ် ကျမှာပဲ။ အမြဲ ဒီလိုပဲ။', "If the flag's down it falls, whatever you do. It's always like this.")],
  thInside: [l('ကြည့်ချင်ရင် ကြည့်လေ။ ကျွန်မ အထဲမှာ စောင့်နေမယ်။', "Look if you like. I'll wait inside.")],
  thWaiting: [l('အကွက် ၁၄ ကို ကြည့်နေတာ… ခဏလေးနော်။', "I'm watching hole ၁၄… just a moment.")], // (new: before the four looks)
  thNotYet: [l('ခဏ… အလံ ကြည့်နေဦးမယ်။', "Just a bit… I'll keep watching the flag.")],

  // ---- 6.3 along the line (pencil, then gold)
  looks: {
    string: { pencil: l('လေကောင်းရင် တက်တာ', 'it rises when the wind is good'),
      gold: l('ကြိုးကို ဖူးဖူးရဲ့ အလံကြိုးဘီးမှာ ချည်ထားတာ။ အလံကျရင် စွန်ပါ ကျတယ်။', "Tied to the flag's pulley. Flag down, kite down.") },
    flag: { pencil: l('ဒီနေ့ တက်လာမှာ', "it'll go up today"),
      gold: l('အလံကြိုးက နံရံကိုဖောက်ပြီး ဦးလူအေး လက်ထဲ ရောက်တယ်။ စာရောက်မှ သူ ဆွဲတယ်။ မသီရိ ဘာလုပ်လုပ် မပြောင်းဘူး။', "The cord comes through the wall into U Lu Aye's hand. He pulls it only when a letter comes. Nothing Thiri does changes it.") },
    planes: { pencil: l('ဖူးဖူးအတွက် ခေါက်ထားတာ', 'folded for Phoo Phoo'),
      gold: l('ကိုယ်တိုင် ခေါက်ထားတာ။ ထောင့်တိုင်း တည့်တယ်။ ဒီလမ်းမှာ အသပ်ဆုံး။', 'Her own folding: every corner true, the neatest on the lane.') },
    post: { pencil: l('တိုင်ဟောင်း၊ အလကား', 'an old post, useless'),
      gold: l('သူ့ဆိုင်ဘေးက ဝါးတိုင်။ အရင်က စွန်ကို ဒီမှာ ချည်ခဲ့တဲ့ ကြိုးရာတွေ ရှိသေးတယ်။', 'Her own post: string marks from when the kite was tied here.') },
  },
  lookHeard: l('ကြားထားတာ', 'heard'), // (new) the pencil tag
  lookSeen: l('ကိုယ်တိုင် မြင်တာ', 'seen'), // (new) the gold tag
  looked: [l('စွန်ကို တခြားသူ့အလံနဲ့ ချည်ထားတယ်။ သူ့လက်ထဲမှာတော့ သူ့ဟာတွေ ရှိသားပဲ။', "The kite is tied to someone else's flag. And her hands are full of her own things.")],

  // ---- 6.5 own words
  owTitle: l('ဝါးတိုင်ကို ပြန်စိုက်မယ်', 'Drive the post back in'),
  owHint: l('ကိုယ့်အကြောင်း ကိုယ်တိုင် သိတဲ့ အမှန် သုံးခု ရွေးပါ', 'Choose three true things she knows about herself'),
  owPrompt: l('မသီရိ ကိုယ်တိုင် သိတဲ့ မသီရိ', 'Thiri, as Thiri knows herself'),
  owFrags: [
    { my: 'လေယာဉ်ခေါက်ရင် ထောင့်တိုင်း တည့်တယ်။', en: 'When I fold planes, every corner is true.', good: true },
    { my: 'မနက်တိုင်း ဖွားဖွားကို ဈေးထိ တွဲခေါ်လာတယ်။', en: 'Every morning I walk Grandma to the market.', good: true },
    { my: 'ကိုယ့်ရယ်သံကို ကိုယ်ကြိုက်တယ်။', en: 'I like my own laugh.', good: true },
    { my: 'ဖူးဖူးက ကျွန်မကို ရယ်စရာကောင်းတယ်တဲ့။', en: "Phoo Phoo says I'm funny.", good: false },
    { my: 'စာပြန်လာမှ ကျွန်မ အဆင်ပြေတာ။', en: "I'm only fine when a letter comes.", good: false },
    { my: 'လူတိုင်းက ကျွန်မ လေယာဉ်ကို ကြိုက်တယ်။', en: 'Everyone likes my planes.', good: false },
  ],
  three: [l('ဒါတွေက ဖူးဖူး စာရေးရေး မရေးရေး မှန်နေတာပဲ။', "These are true whether Phoo Phoo writes or not.")],

  // ---- 6.6 kite 2
  kite2Title: l('ကိုယ့်တိုင်နဲ့ စွန်', 'The kite on her own post'),
  kite2Hint: l('ဖွဖွလေး ကိုင်ပါ။ ဆုပ်မထားနဲ့', "Hold it lightly. Don't grip"),
  kite2Again: l('တင်းသွားပြန်ပြီ။ ဖွဖွလေးနော်။', 'Gripped again. Lightly.'),
  kite2Th: [l('အလံ မတက်သေးဘူး… စွန်ကတော့ တက်နေတယ်။', "The flag's still down… and the kite's up.")],
  thWrite: [l('လေယာဉ် သုံးစင်း ယူပြီး အထဲက စာရေးစားပွဲမှာ ရေးမယ်။ လာခဲ့နော်။', "I'll take three planes and write at the table inside. Come with me.")], // (new)

  // ---- 6.7 the four wishes
  wishes: [
    l('ဘေးရန် ကင်းပါစေ။', 'May you be safe from harm.'),
    l('စိတ်ဆိုးစရာ ကင်းပါစေ။', 'May you be free of anger.'),
    l('ဆင်းရဲခြင်း ကင်းပါစေ။', 'May you be free of suffering.'),
    l('ကိုယ့်ကိုယ်ကို ချမ်းချမ်းသာသာ ရွက်ဆောင်နိုင်ပါစေ။', 'May you carry yourself well and at ease.'),
  ],
  thWho: [
    l('တစ်စင်း ဖူးဖူးဆီ။ တစ်စင်း ဦးလူအေးဆီ။ အမြဲ အလံ လှည့်ပေးတဲ့သူ။', 'One to Phoo Phoo. One to U Lu Aye, who always turns the flag.'),
    l('ပြီးတော့… ဒေါ်ပြုံး။ မနေ့က ကျွန်မကို ဆိုင်ရှေ့က မောင်းထုတ်တဲ့သူ။ တူတူပဲ ပို့မယ်။ စာကြောင်း လေးကြောင်းစလုံး။', 'And… Daw Pyone. She shooed me off her stall yesterday. Same as the others. All four lines.'),
  ],
  thCarry: [l('ဖူးဖူးရဲ့ဟာ ကျွန်မ ကိုယ်တိုင် လွှတ်မယ်။ ကျန်တဲ့ နှစ်စင်း အစ်မ ပို့ပေးပါလား။', "I'll send Phoo Phoo's myself. Would you take the other two?")], // (new)
  planeOff: [l('(လေယာဉ်လေးက ခေါင်မိုးတွေကို ကျော်ပြီး မြောက်ဘက်ကို ပျံသွားတယ်။ မမြင်ရတော့ဘူး။)', '(The little plane flies north over the roofs and out of sight.)')], // (stage direction)
  laPlane: [l('ကျွန်တော့်ကိုလား။ …အနှစ်လေးဆယ်မှာ ပထမဆုံးပဲ။', 'For me? …First one in forty years.')],
  pyPlane: [l('ဒါ ဘာလဲ။ ငါ့ကို ဘာလို့ ပို့တာလဲ။ …ထားခဲ့။', "What's this? Why send it to me? …Leave it there.")],
  thWaitPlanes: [l('ကျန်တဲ့ လေယာဉ် နှစ်စင်း ပို့ပြီးပြီလား အစ်မ။', 'Have the other two planes gone, sister?')], // (new)

  // ---- 6.8 close
  thEnd: [
    l('ထမင်းစားဖို့ ပြန်မယ်။ ဖွားဖွားကလည်း ဗိုက်ဆာနေပြီ။', "I'm going home to eat. Grandma's hungry too."),
    l('ဒီတစ်စင်း အစ်မအတွက်။ ဘယ်သူ့ကိုမဆို ဆုတောင်းစာ ပို့လို့ရတယ်။ ပြန်စာ မမျှော်နဲ့နော်။', "This one's for you, sister. Send a good wish to anyone. Don't wait for a reply."),
  ],
  mayaEnd7: [l('(တင်းတင်း ဆုပ်ထားတာက ကောင်းစေချင်တာနဲ့ တူတယ်။ တကယ်တော့ မတူဘူး။)', "(Holding on tight looks like wishing someone well. It isn't.)")],

  // ---- 7 other Market people
  ky: [
    l('မာရာ့လမ်း! လမ်းမပျောက်ချင်ရင် မာရာ့နောက် လိုက်!', "Maya's Way! Don't want to get lost? Follow Maya!"),
    l('တံတားအသစ်လား။ ဆိပ်ကမ်းဘက်မှာ ရှိတယ်လို့ ကြားတယ်။ ကျွန်တော် မရောက်ဖူးဘူး။', "The new bridge? I heard there's one by the wharf. Never been."),
    l('ကောင်တာက မွန်းတည့်ရင် ပိတ်တယ်။ မြေပုံမှာ ရေးထားတယ်လေ။', "The counter shuts at noon. It's written on the map."),
  ],
  kyAfter: [l('ဖြတ်လမ်း ပိတ်နေတယ်? …ဆေးနဲ့ ပြန်ဖျက်ရမလား။ မဖျက်ချင်ဘူး၊ လှလို့။', "The shortcut's blocked? …Should I paint it out? I don't want to. It's pretty.")],
  py: [
    l('ဆိုင်ရှေ့ ပိတ်မရပ်နဲ့! စာအိတ် မရွေးရင် ဘေးဖယ်။', "Don't block my stall! Not choosing envelopes? Move aside."),
    l('စေတနာထမင်းဆိုင်မှာ ဆင်းရဲကြောင်း ထောက်ခံစာ ပြရတယ်တဲ့။ ငါ့ကို မမေးနဲ့။', "At the free-food shop you have to show a paper saying you're poor, they say. Don't ask me."),
    l('ကောင်တာနားက ကောင်မလေး တစ်နေကုန် စွန်လွှတ်နေတယ်။ အလုပ်မရှိဘူးလား။', 'That girl by the counter flies a kite all day. No work to do?'),
  ],
  pyAfter: [l('(လေယာဉ်လေးက ခါးပိုက်ထဲမှာ ရှိနေတုန်း။ ဘာမှ မပြောဘူး။)', '(The little plane is still in her apron. She says nothing.)')],
  yuBefore: [l('ခွေးအတွက် ပေးတာ အလဟဿတဲ့။ ကျွန်မအတွက်ကတော့ သူတို့ ရေငတ်နေတာပဲ သိတယ်။', "Some say giving to dogs is a waste. All I know is they're thirsty.")],
  yuAfter: [l('ခွေးအိုကြီး သောက်သွားလား။ ကျေးဇူးပဲ အစ်မ။', 'Did the old one drink? Thank you, sister.')],
  dkAfter: [l('ပြည့်သွားပြီလား။ ဒါပဲ သိချင်တာ။', "Is the pot full? That's all I wanted to know.")],
  yiAmb: [l('ထိုင်ပါ သမီး။ ဒီမှာ ဘယ်သူ့ကိုမှ ဘာမှ မမေးဘူး။', 'Sit down, dear. Nobody here gets asked anything.')],
  kn: [l('သုံးဆယ့်ရှစ်… သုံးဆယ့်ကိုး… စမ်းတုံး လေးဆယ်ပြည့်ရင် ပြိုင်ပွဲ တင်မယ်။', "Thirty-eight… thirty-nine… at forty trial blocks I'll enter the contest.")],
  kl: [l('ငါ့တပည့်ဟောင်းလား။ သူ့ဘာသာ ထုပါစေ။', 'My old pupil? Let her carve on her own.')],
  hwAmb: [l('ဒီနေ့ စာဖတ်ချိန်ပါ။ ထိုင်ပြီး နားထောင်သွားပါ။', "It's reading time today. Sit and listen if you like.")], // (new)
  ttAmb: [l('စာအိတ် ဘာလို့ လေးထောင့်လဲ… ကိုယ်တိုင် ရှာနေတုန်း!', "Why are envelopes square… I'm still finding out myself!")], // (new)

  // ---- 8.1 the Painted Map
  ky1: [
    l('ဟေ့… မာရာ မဟုတ်လား! ကြည့်၊ "မာရာ့လမ်း" မြေပုံ။ မာရာ သွားတဲ့နေရာတိုင်း အရောင်နဲ့ ခြယ်ထားတာ။', 'Hey… aren\'t you Maya? Look: "Maya\'s Way" maps. Every place Maya goes, coloured in.'),
    l('လူတွေ အရမ်းကြိုက်ကြတယ်။ ကိုယ်တိုင် ရှာစရာ မလိုဘူးလေ။ မာရာ့နောက် လိုက်ရုံပဲ။', 'People love them. No need to find your own way. Just follow Maya.'),
    l('ဒီတစ်ချပ် မာရာ့အတွက်။ ဖြတ်လမ်းတွေလည်း ထည့်ခြယ်ထားတယ်။ တံဆိပ်တဲတွေကြားကနေ လက်ဖက်ရည်ဆိုင်ကို တည့်တည့်၊ ပြီးတော့ ဆိပ်ကမ်းဘက်မှာ တံတားအသစ်။', "This one's for you. I put the shortcuts in too: straight through the stamp awnings to the tea shop, and a new bridge out by the wharf."),
  ],
  mayaAsk: [l('ဒီဖြတ်လမ်းတွေ ကိုယ်တိုင် လျှောက်ကြည့်ဖူးလား။', 'Have you walked these shortcuts yourself?')],
  ky2: [l('ကျွန်တော်လား။ မလျှောက်ဖူးဘူး။ လူတွေ ပြောတာကို ခြယ်တာ။ ဒါပေမဲ့ လှတယ် မဟုတ်လား။', "Me? No. I colour in what people say. Pretty, though, isn't it?")],
  mayaMap2: [l('(ကျွန်မ နာမည်နဲ့ မြေပုံ။ ကျွန်မ မလျှောက်ဖူးတဲ့ လမ်းတွေ။)', "(A map with my name on it. Roads I've never walked.)")],

  // ---- 8.2 Nay Chi at the painted shortcut
  ncCall: l('အစ်မ!', 'Sister!'),
  nc1: [
    l('အစ်မ! မြေပုံမှာ ဒီကနေ တည့်တည့်လို့ ပါတယ်… မာရာ့လမ်းဆိုတော့ မှန်မှာပဲလို့။', "Sister! The map says straight through here… it's Maya's Way, so it must be right."),
    l('ဒါပေမဲ့ သေတ္တာတွေနဲ့ ပိတ်နေတယ်။ နာရီဝက်လောက် ဒီမှာ ရပ်စောင့်နေတာ။ ဘယ်လိုသွားရမလဲ… ပြောပေးပါ။', "But it's blocked with crates. I've stood here half an hour. Which way do I go… tell me."),
  ],
  crates: [l('ဖြတ်လမ်း မရှိဘူး။ လမ်းကြားက စာအိတ်သေတ္တာတွေနဲ့ ဆုံးတယ်။', "There's no shortcut. The gap ends in envelope crates.")],
  ncChoices: [
    l('"လက်ဖက်ရည်ဆိုင်လမ်းကနေ ပတ်သွား။"', '"Go round by the tea-shop street."'),
    l('"ကောင်တာရှေ့ကနေ ဖြတ်သွား။"', '"Cut across in front of the counter."'),
    l('"အစ်မနောက်က လိုက်ခဲ့။"', '"Follow me."'),
  ],
  nc2: [l('ဟုတ်ပြီ! အစ်မ ပြောတဲ့အတိုင်းပဲ။ နောက်တစ်ခါလည်း မေးမယ်နော်။', "Okay! Just like you said. I'll ask you next time too.")],
  ncMaya: [l('(မေးတာ ဝမ်းသာစရာပဲ… ဒါပေမဲ့ နာရီဝက်လုံး ဒီမှာ ရပ်စောင့်နေခဲ့တာ။)', "(It's nice to be asked… but she stood here a whole half hour.)")],
  ncAfter: [l('အစ်မ ပြောတဲ့အတိုင်း ပတ်လာတယ်။ အခု… ဒီမှာ စောင့်နေမယ်။ နောက် ဘာလုပ်ရမလဲ အစ်မ ပြောမှ။', "I came round like you said. Now… I'll wait here. Until you tell me what next.")],

  // ---- 8.3 desks
  deskMgateQ: l('ဒီနေရာကနေ ကိုယ်တိုင် မြင်ရတာကို ရေးမယ်။', 'Write what I can see from here myself.'),
  deskMgate: [
    l('တံဆိပ်တဲ အမိုးတွေရဲ့ အနားမှာ တံဆိပ်ခေါင်းလို အပေါက်လေးတွေ ဖောက်ထားတယ်။', 'The stamp awnings have little perforations round their edges, like real stamps.'),
    l('တံဆိပ်တဲတွေကြားကနေ လက်ဖက်ရည်ဆိုင်ကို ဖြတ်လမ်း ရှိတယ်။', 'There is a shortcut through the stamp awnings to the tea shop.'),
    l('ဈေးက မွန်းတည့်မှ ဖွင့်တယ်။', 'The market only opens at noon.'),
  ],
  deskCounter: [
    l('လက်ဖက်ရည်ဆိုင် တံခါးဘေးမှာ ခုံပုလေး နှစ်လုံး ချထားတယ်။ မီးခိုးခေါင်းတိုင်က ငွေ့တက်နေတယ်။', "Two low stools stand by the tea shop's door, and steam rises from its chimney."),
    l('စာတိုက်ကောင်တာက မွန်းတည့်ရင် ပိတ်တယ်။', 'The letter counter shuts at noon.'),
    l('စေတနာထမင်းဆိုင်မှာ ဆင်းရဲကြောင်း ပြရတယ်။', 'At the free-food shop you must prove you are poor.'),
  ],
  deskWrong: [l('(ဒါ ကြားခဲ့တာ၊ ဒါမှမဟုတ် ခြယ်ထားတာ။ မျက်လုံးနဲ့ ပြန်ကြည့်ပါဦး။)', "(That's what I heard, or what was painted. Look again.)")],
  deskDone: [l('ဖဲကြိုး တက်သွားပြီ။ ဒီကနေ အိမ်ကို စာမျက်နှာ လှန်လို့ ရပြီ။', 'The ribbon is up. From here I can turn the page home.')],
  cargoNo: l('(ဦးလူအေးရဲ့ စာအုပ်တွေ ကားပေါ်မှာ ပါနေတယ်။ စာမျက်နှာ မလှန်ဘဲ မောင်းပို့မယ်။)', "(U Lu Aye's books are in the car. No page-turning: I'll drive them.)"),

  // ---- 8.4 the "ask Maya" board
  board4: [
    { from: l('န', 'N.'), my: 'အစ်မ ပြောတဲ့လမ်းအတိုင်း သွားပြီ။ နောက် ဘာလုပ်ရမလဲ။', en: 'I went the way you said. What do I do next?',
      replies: [l('ဆက်လျှောက်ပါ။', 'Keep walking.'), l('ခဏ နားပါ။', 'Rest a while.'), l('မနက်ဖြန် လာမေးပါ။', 'Come and ask me tomorrow.')] },
    { from: l('ဈေးထဲက ဆိုင်ရှင်တစ်ယောက်', 'a stall-keeper at the market'), my: 'မာရာ့လမ်း မြေပုံ ရပြီ။ ဖြတ်လမ်းအတိုင်း သွားရင် ရပြီ မဟုတ်လား။', en: "I've got a Maya's Way map. If I follow the shortcuts I'm fine, right?",
      replies: [l('ရပါတယ်။', 'Yes, fine.'), l('ဆိပ်ကမ်းဘက် တံတားကို သုံးပါ။', 'Use the bridge by the wharf.'), l('တံဆိပ်တဲလမ်းကြားကိုတော့ ရှောင်ပါ။', 'Just avoid the gap in Stamp Lane.')] },
    { from: l('အမည်မသိ', 'no name'), my: 'သူငယ်ချင်းက စာပြန်မရေးဘူး။ ထပ်ရေးရမလား။', en: "My friend doesn't write back. Should I write again?",
      replies: [l('ထပ်ရေးပါ။', 'Write again.'), l('ဆုတောင်းစာပဲ ပို့ပါ။', 'Just send a good wish.'), l('စောင့်ပါ။', 'Wait.')] },
  ],
  boardMaya4: [l('(ဆယ့်လေးစောင်… မနေ့ကထက် များလာပြီ။ အားလုံး ပြန်ဖြေပေးချင်တယ်။)', '(Fourteen… more than yesterday. I want to answer every one.)')],
  boardPick: l('ဘယ်မှတ်စုကို ဖြေမလဲ။', 'Which note will I answer?'), // (new)
  boardDone: [l('(ဒီနေ့အတွက် တစ်စောင် ဖြေပြီးပြီ။)', "(I've answered one for today.)")], // (new)

  // ---- 8.5 + 9 night
  replyLine: l('ကျွန်မ မြေပုံအတိုင်း လျှောက်ပါ။ အဲဒါဆို မမှားဘူး။', "Walk by my map. Then you can't go wrong."),
  replyTitle: l('ပြန်စာ (ခဲတံ)', 'The reply (pencil)'),
  nightQ: l('ဒီနေ့အကြောင်း မှန်မှန်ကန်ကန် ဘယ်လို ရေးမလဲ။', 'How will she write today, truthfully?'),
  nightChoices: [
    l('ကိုဖြိုးက ကျွန်မ စကားကြောင့် တစ်ခါတည်း လူကောင်း ဖြစ်သွားတယ်။ မသီရိလည်း ဖူးဖူးကို မေ့သွားပြီ။', 'Thanks to my words Ko Phyo became a good man at once. And Thiri has forgotten Phoo Phoo.'),
    l('လက်ဆောင်သုံးခုကို ပေးသူ ရွေးတဲ့နေရာ ပို့ခဲ့တယ်။ ကိုဖြိုးက ကိုယ့်ရွက် ကိုယ်ရှာ၊ ဖျော်နည်း သင်ပြီး ပထမခွက်ကို ဘယ်သူ ကြည့်လဲ မကြည့်ဘဲ ငှဲ့တယ်။ မသီရိက စွန်ကို ကိုယ့်တိုင်မှာ ချည်ပြီး လူတိုင်းကို ဆုတောင်းစာ တူတူ ပို့တယ်။', 'I carried three gifts where their givers chose. Ko Phyo earned his own leaves, learned the brew, and poured the first cup without looking who watched. Thiri tied her kite to her own post and sent everyone the same good wish.'),
    l('သူများလက်ဆောင် ဝေဖန်တဲ့လူ ဘယ်တော့မှ မပြောင်းဘူး။ စာပြန်မရရင် သူငယ်ချင်း ဆုံးရှုံးတာပဲ။', "A man who sneers at others' gifts never changes. No reply means a lost friend."),
  ],
  nightWrong: [
    [l('(မဟုတ်ဘူး… ဒါ ချော့ပြောတာ။ ကိုဖြိုးက သူ့ခြေထောက်နဲ့ သူ လျှောက်တာ။ မသီရိကလည်း မမေ့ဘူး၊ မမှီတော့တာ။)', "(No… that flatters. Ko Phyo walked on his own feet. And Thiri hasn't forgotten; she's stopped leaning.)")],
    [],
    [l('(မဟုတ်ဘူး… ဒါ အားလျှော့ပြောတာ။ ကိုဖြိုး ပြောင်းနေပြီ။ မသီရိကလည်း သူငယ်ချင်းကို မဖြတ်ဘူး။)', "(No… too gloomy. Ko Phyo is changing. And Thiri hasn't cut her friend off.)")],
  ],
  sleepQ: l('ဒီည မှတ်စုစာမျက်နှာလေး ဘယ်သူ့အိမ်မှာ အိပ်မလဲ။', "Whose house does tonight's notebook page sleep at?"),
  stampText6: l('စာမျက်နှာ ၆ — အလှူဒါန\nသူတစ်ပါးအိုး မဖြည့်ခင် ကိုယ့်ပစ္စည်း၊ အသိ၊ စေတနာ အရင်ဖြည့်ပါ။ ပေးရင် စေတနာ သန့်သန့်နဲ့ ပေးပါ။ တခြားသူ တစ်ယောက်အတွက်လည်း မှန်ကြောင်း ကိုယ်တိုင် တွေ့ခဲ့ပြီ။', "Page 6 — Giving\nBefore filling another's pot, fill up your own means, know-how and goodwill; then give with a clean heart. She saw for herself that it holds for someone else too."),
  stampText7: l('စာမျက်နှာ ၇ — မေတ္တာနှင့် အချစ်\nဘယ်သူ့ကိုမှ မမှီဘဲ လူတိုင်းကို တစ်သမတ်တည်း ဆုတောင်းပါ။ တခြားသူ တစ်ယောက်အတွက်လည်း မှန်ကြောင်း ကိုယ်တိုင် တွေ့ခဲ့ပြီ။', 'Page 7 — Goodwill and Love\nLean on no one; wish everyone well alike. She saw for herself that it holds for someone else too.'),
  tomorrow: l('နောက်တစ်နေ့ မနက် ရောက်ပြီ။', 'Morning comes.'),
  mayaHome: [l('ဒီနေ့အကြောင်း စာရေးခန်းမှာ ပြန်ရေးမှ ဖြစ်မယ်။', 'I should write today down at my Writing Room.')], // (Day 1's line, reused)
  controlsTip: l('ဆွဲပြီး လမ်းလျှောက်ပါ · လူကို နှိပ်ရင် စကားပြောမယ်', 'Drag to walk · tap someone to talk'),
};
