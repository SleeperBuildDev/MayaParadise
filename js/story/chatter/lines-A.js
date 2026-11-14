// Town chatter, part A: the Home Book, the Exercise-Book Quarter and the envelope road down to the Market.
// Read by ./index.js (createChatter). Shape and tags: see the header of ./index.js. In short:
//   { [districtId]: { town: [line], areas: { id: { at: { x, z, r }, lines } }, rooms: { roomId: [line] },
//                     pairs: [{ who: [jobA, jobB], lines, when? }], arrive: { first, again } } }
//   line = { my, en, job?, age?, by?, from?, to?, days?, flag?, notFlag? }
//     from / to  first / last day (inclusive) · days  only on these days (12 = the rain day)
//     flag       a save flag that must be on ('!x' = must be off) · age 'child' | 'teen' | 'adult' | 'elder'
//     job        a person id or a room walk-on key; no job = the district's ambient folk say it
//     ch         (review only, the engine ignores it) the chapter whose lesson the line carries; 'finale' =
//                "a map only shows the road: each walks it and checks it"
//   pairs: `age` on a pair is advisory (the engine does not read it yet): the two speakers' ages.
//
// Rules kept (owner, Day-plan INDEX 14): every line carries or hints at its place's lesson; no line tells
// Maya where to go, whom to see or what to do; reactions only to what has already happened (day / flag
// tags); no pagoda, monastery, monk or Buddha; nothing private about Maya or the owner.
// All Burmese is a DRAFT for Maya to proofread (colloquial, short).
//
// Chapters by place: home = ch 1 (practice, not a gift; the good black sheep; one's own road and light),
// finale, ch 23 (Days 14-15). Quarter = ch 3 (school is for understanding; curiosity; knowledge behind
// every trade), ch 5 (don't give up on people; "not yet"; your way may not suit another), ch 9 (help the
// one who knows less, at their pace; nobody is complete), ch 4 from Day 7 (meaning, aim, not the lead,
// the past is gone, time waits), ch 11 slates (Day 7), ch 23 (Day 14). Envelope road = ch 5 (the road
// "ended": nothing is fixed), ch 6 (give with a cool heart; fill your own pot first), ch 7 (goodwill that
// lets go), ch 11 (steer yourself), finale (see for yourself).
//
// Places (world metres): home  fountain (0, 13.9), the "ask Maya" board (14.2, -0.55), the binders' lawn
// (-15.5, 9.6), the windy east edge (22.6, 8.2), the ribbon road's head (5.4, 18.9), the Writing Room
// door (0, 7.0). Quarter  gate desk (7.9, 47.2), school door (-11.5, 88.6) + notice board (-12.5, 92.6),
// playground (swing -19, 96.5; see-saw -11.5, 95.4; slide -4, 97; bean planters -23.5, 93.8), snack shop
// door (15, 59.3), Quarter tea shop door (~23.5, 59.3), potter's shed door (46, 114.5) + drying racks
// (~52, 122), stage (-13, 137.8; clock -19.4, 141.2), Ko Zaw's tea stall (13.6, 122.6), border sign
// (0.6, 158.2) + border tea shop (~-4.5, 153.5). Envelope road (route1: 4,160 -> 8.5,200 -> 11,215 ->
// 9,232 -> 7,250 -> 7,258)  the goat (-4.6, 183.4), the tyre kids (-1, 199), U Pe Kyi's wheel stand
// (15.6, 223.9), the «ကုန်စုံ» shop (~3, 240.5), the crease / page end (7, 254).

export const LINES_A = {
  // =====================================================================================================
  // HOME BOOK
  // =====================================================================================================
  home: {
    town: [
      { my: 'ဒီနေ့ နည်းနည်း၊ မနက်ဖြန် နည်းနည်း။ လျှို့ဝှက်ချက်က အဲဒါပဲ။', en: 'A little today, a little tomorrow. That is the whole secret.', age: 'elder', ch: 1 },
      { my: 'ပါရမီဆိုတာ စောစော စခဲ့တဲ့သူကို ပြောတာ နေမှာ။', en: '"Gift" probably just means somebody who started early.', ch: 1 },
      { my: 'ကျွန်မ ပထမဆုံးရေးတဲ့ ဆိုင်းဘုတ်က စာလုံးတွေ ကောက်ကောက်ကွေ့ကွေ့ပဲ။', en: 'The first sign I ever lettered wobbled all over.', ch: 1 },
      { my: 'ငါ ပြေးတာ နှေးတယ်။ ဒါပေမဲ့ နေ့တိုင်း ပြေးတယ်။', en: "I'm a slow runner. But I run every day.", age: 'child', ch: 1 },
      { my: 'အဖေက လက်သမား။ သားက သီချင်းဆိုချင်တယ်တဲ့။ ကောင်းသားပဲ။', en: 'The father is a carpenter; the son wants to sing. Good for him.', ch: 1 },
      { my: 'လူတိုင်း လမ်းတစ်လမ်းတည်း သွားရင် လမ်းကျဉ်းသွားမှာပေါ့။', en: 'If everyone took the same road, it would get crowded.', ch: 1 },
      { my: 'အသက်ကြီးမှ စာရေးသင်တာ။ နောက်ကျတယ် မထင်ပါဘူး။', en: "I learned to write when I was old. It didn't feel late.", age: 'elder', ch: 1 },
      { my: 'လက်ရည်ဆိုတာ မွေးကတည်းက ပါမလာဘူး။ လုပ်ရင်း ရလာတာ။', en: 'Skill is not born in the hand. It comes from doing.', ch: 1 },
      { my: 'သိုးမည်းဆိုတာ ဆိုးတာ မဟုတ်ဘူး။ ကွဲပြားတာပဲ။', en: "A black sheep isn't bad. Just different.", ch: 1 },
      { my: 'ကိုယ့်မီးက သေးသေးလေး ဖြစ်ပါစေ၊ ကိုယ့်မီးပဲ။', en: 'Your own light may be small, but it is yours.', age: 'elder', ch: 1 },
      { my: 'မဝင့်ဝါ တစ်ခါမှ နောက်မကျဘူး။ နေ့တိုင်း တူတူပဲ။', en: 'Ma Wint War is never late. Every day, the same.', ch: 1 },
      { my: 'ဦးကျော်ညွန့် ချုပ်တာ မြန်တယ်။ နှစ်လေးဆယ် ချုပ်ခဲ့တာကိုး။', en: 'U Kyaw Nyunt stitches fast. Forty years of stitching, after all.', ch: 1 },
      { my: 'စာလုံးပေါင်း မှားရင် ပြန်ရေး။ အမေက အဲဒီလိုပဲ ပြောတယ်။', en: 'Spelt it wrong? Write it again. That is what Mum says.', age: 'child', ch: 1 },
      { my: 'ဆေးတစ်ထပ်နဲ့ မလှဘူး။ သုံးထပ်လောက် သုတ်ရတယ်။', en: 'One coat of paint never looks right. It takes three.', ch: 1 },
      { my: 'ငယ်ငယ်က လက်ရေးဆိုးလို့ အရယ်ခံရတယ်။ အခု ဆိုင်းဘုတ်ရေးတယ်။', en: 'As a child I was laughed at for my handwriting. Now I paint signs.', age: ['adult', 'elder'], ch: 1 },
      { my: 'အစ်မ… ပြိုင်ပွဲ မနိုင်လည်း ငါ ဆက်ဆွဲမှာ။', en: "Sister… even if I don't win, I'll keep drawing.", age: 'child', ch: 1 },
      { my: 'သူများရွေးပေးတဲ့လမ်းလည်း ရောက်တာပဲ။ ကိုယ်ချစ်တဲ့လမ်းက ပိုပေါ့တယ်။', en: 'The road others pick gets you there too. The one you love just feels lighter.', ch: 1 },
      { my: 'ဈေးရောင်းတာလည်း နေ့တိုင်း သင်ရတာပဲ။', en: 'Even selling, you learn something every day.', ch: 1 },
      { my: 'ညနေ ချုပ်ရိုးပြိုင်ပွဲ ရှိတယ်တဲ့။ ငါကတော့ ကြည့်ရုံပဲ။', en: "There's a stitching contest this evening, they say. I'm only watching.", days: [1], ch: 1 },
      { my: 'ဖဲကြိုးလမ်းကနေ ကျောင်းသားလေးတွေ တက်လာကြတယ်!', en: 'School children came up the ribbon road!', age: 'child', days: [2], ch: 3 },
      { my: 'ချုပ်ရိုးဆရာ ဖြစ်မယ်ထင်တာ။ ဖိုးသားက လေရဟတ်ကို ရွေးတယ်။', en: "We thought he'd be a binder. Pho Thar chose windmills.", age: 'elder', from: 2, ch: 1 },
      { my: 'လေရဟတ်သင်ပေးတဲ့ အစ်ကိုက "နောက်တစ်ခါ" ပဲ ပြောတယ်။', en: 'The boy who teaches windmills only ever says "once more".', age: 'child', from: 2, ch: 1 },
      { my: 'စာအုပ်ထဲက လမ်းတွေ ရှည်လာတယ်။ လျှောက်တာကတော့ ကိုယ့်ခြေထောက်ပဲ။', en: 'The roads out of the book keep getting longer. The walking is still your own feet.', from: 4, ch: 'finale' },
      { my: 'ဘုတ်ပေါ်က မေးခွန်းတွေ များလာပြီ။ အဖြေတော့ ကိုယ်တိုင် ရှာရမှာပဲ။', en: 'More questions on the board. The answers you still find yourself.', from: 3, ch: 'finale' },
      { my: 'စာရေးခန်းနားက ပဲစေ့တွေ ပေါက်လာပြီ။ ဘယ်သူ စိုက်တာလဲ မသိဘူး။', en: "The beans by the Writing Room are coming up. Don't know who planted them.", from: 4, to: 10, ch: 3 },
      { my: 'စာရေးခန်းနားက ပဲပင်တွေ ပွင့်နေပြီ။ ခရမ်းရောင်လေးတွေ။', en: 'The beans by the Writing Room are in flower. Little purple ones.', days: [11], ch: 3 },
      { my: 'မိုးက ဘယ်သူ့အိမ်ကိုမှ ရွေးပြီး မရွာဘူး။', en: "The rain doesn't pick whose house.", days: [12], ch: 19 },
      { my: 'မိုးကြောင့် လဲသွားရင် ပြန်စိုက်ရုံပဲ။ အစေ့ ကျန်သေးတာပဲ။', en: 'If the rain knocks it flat, you plant again. There are always seeds left.', days: [12], age: 'elder', ch: 1 },
      { my: 'ဖိတ်စာထဲမှာ ကိုယ့်စကားကို ကိုယ့်နာမည်နဲ့ ထည့်ပေးမယ်တဲ့။', en: 'They will put my words in, with my own name, they say.', days: [14, 15], ch: 23 },
      { my: 'ညနေ မီးတစ်ခုစီ ယူလာခဲ့ကြတဲ့။ ကျွန်မက ဖယောင်းတိုင်လေးပဲ။', en: 'Everyone is to bring a light this evening. Mine is just a little candle.', days: [15], ch: 1 },
      { my: 'ကိုယ့်မီးက သူများမီးနဲ့ မတူလည်း ရတယ်တဲ့။', en: "They say your light needn't look like anyone else's.", days: [15], ch: 1 },
      { my: 'မီးတွေ အများကြီးထဲမှာ တစ်ခုမှ တူတာ မရှိဘူး။ လှလိုက်တာ။', en: 'So many lights, and not one the same. Beautiful.', flag: 'd15.flown', ch: 1 },
    ],

    areas: {
      fountain: {
        at: { x: 0, z: 13.9, r: 4.5 },
        lines: [
          { my: 'ရေပန်းက တစ်စက်ချင်းပဲ။ ကျောက်ကိုတောင် ပွန်းစေတယ်။', en: 'The fountain is only drops. Still, they wear down stone.', age: 'elder', ch: 1 },
          { my: 'ရေပန်းကို ပုံဆွဲနေတာ။ ဆယ်ခါမြောက်ပြီ။ ပိုတူလာပြီ။', en: "I'm drawing the fountain. Tenth try. It's looking more like it.", age: 'child', ch: 1 },
          { my: 'ဒီမှာထိုင်ပြီး လူတွေကြည့်ရတာ ကြိုက်တယ်။ တစ်ယောက်မှ မတူဘူး။', en: 'I like sitting here watching people pass. Not one is alike.', ch: 1 },
          { my: 'ရေပန်းက နေ့တိုင်း တူတူပဲ ထင်ရတယ်။ ရေကတော့ တစ်ခါမှ မတူဘူး။', en: 'The fountain looks the same every day. The water never is.', age: 'elder', ch: 'finale' },
          { my: 'ဖဲကြိုးလမ်းက ပြန်လာသူတိုင်း နည်းနည်းစီ ပြောင်းလာကြတယ်။', en: 'Everyone who comes back up the ribbon road is a little changed.', from: 3, ch: 'finale' },
          { my: 'မိုးရွာလည်း ရေပန်းက သူ့အလုပ် သူ ဆက်လုပ်နေတယ်။', en: 'Rain or not, the fountain keeps doing its job.', days: [12], ch: 1 },
          { my: 'ဒီညနေ ဒီမှာ စားပွဲတွေ ခင်းမယ်တဲ့။', en: "They're setting tables out here this evening.", days: [15], ch: 1 },
          { my: 'ကျွန်မ မီးအိမ်ကို ကိုယ်တိုင် လုပ်ထားတာ။ ကောက်နေပေမဲ့ ကိုယ့်ဟာပဲ။', en: "I made my lantern myself. It's crooked, but it's mine.", days: [15], ch: 1 },
        ],
      },
      askBoard: {
        at: { x: 14.2, z: 0.2, r: 3.2 },
        lines: [
          { my: 'ဘုတ်ပေါ်မှာ မေးခွန်းကပ်ရတာ ရှက်စရာ မဟုတ်ပါဘူး။', en: 'Pinning a question up there is nothing to be shy about.', from: 2, ch: 3 },
          { my: 'မေးခွန်း ကပ်ခဲ့တယ်။ အဖြေ စောင့်ရင်း ကိုယ်တိုင်လည်း စဉ်းစားနေတယ်။', en: 'I pinned a question. While I wait, I am thinking it over myself.', from: 2, ch: 'finale' },
          { my: 'ငါ့မေးခွန်းက ကြယ်တွေ ဘာလို့ မှိတ်တုတ်မှိတ်တုတ် လုပ်လဲ။', en: 'My question is why the stars twinkle.', age: 'child', from: 2, ch: 3 },
          { my: 'တချို့မေးခွန်းက ဖြေလို့ မရဘူး။ လုပ်ကြည့်မှ သိမှာ။', en: "Some questions can't be answered. You find out by trying.", from: 3, ch: 'finale' },
          { my: 'အရင်က အဖြေပဲ လိုချင်တယ်။ အခု မေးခွန်းကောင်း မေးတတ်ချင်တယ်။', en: 'I used to want only answers. Now I want to ask good questions.', from: 5, ch: 3 },
          { my: 'မင်တွေ စီးကုန်ပြီ။ မေးချင်သေးရင် ပြန်ရေးရုံပဲ။', en: 'The ink has all run. If you still want to ask, you write it again.', days: [12], ch: 1 },
          { my: 'ဒီနေ့ ဘုတ်ပေါ်မှာ စာရွက် တစ်ရွက်တည်း။', en: 'Only one note on the board today.', days: [14], ch: 23 },
          { my: 'ဒီတစ်ခါတော့ ဘုတ်က မာရာ့ကို ပြန်မေးနေတယ်။', en: 'This time the board is asking Maya.', days: [15], ch: 1 },
        ],
      },
      bindersLawn: {
        at: { x: -15.5, z: 9.6, r: 4.5 },
        lines: [
          { my: 'ချုပ်ရိုး ကောက်သွားရင် ဖြုတ်ပြီး ပြန်ချုပ်။ ဒါပဲ။', en: 'A stitch goes crooked: unpick it, stitch again. That is all.', ch: 1 },
          { my: 'အပ်ကို မြန်မြန်ထိုးတာ မခက်ဘူး။ ဖြောင့်ဖြောင့်ထိုးတာ ခက်တယ်။', en: 'Pushing a needle fast is easy. Straight is hard.', ch: 1 },
          { my: 'ငါ့ဆရာက ပါရမီအကြောင်း မပြောဘူး။ "နောက်တစ်ခါ" ပဲ ပြောတယ်။', en: 'My teacher never talked about gifts. Only "once more".', age: 'elder', ch: 1 },
          { my: 'စာအုပ် ကြာကြာခံဖို့ ကျောရိုး ခိုင်ရမယ်။ လူလည်း အတူတူပဲ။', en: 'A book lasts if its spine is strong. People too.', age: 'elder', ch: 1 },
          { my: 'ငါလည်း ချုပ်ကြည့်ချင်တယ်။ ပထမဆုံး ကောက်မှာ သိပါတယ်။', en: 'I want to try stitching too. I know my first one will be crooked.', age: 'child', ch: 1 },
          { my: 'မနေ့က ဆုရတဲ့ ကလေးက ဆုထက် လေရဟတ်ကို ပိုချစ်တယ်တဲ့။', en: 'The boy who won the prize yesterday loves windmills more than prizes.', days: [2], ch: 1 },
          { my: 'ဖိုးသား မရှိတော့ ပျင်းတယ်။ ဒါပေမဲ့ သူ့လမ်း သူ တွေ့သွားပြီလေ။', en: "It's dull without Pho Thar. But he has found his road.", from: 3, ch: 1 },
          { my: 'စာစောင်တိုင်း နောက်ဆုံးစာမျက်နှာမှာ ဘယ်သူ့စကားလဲ ရေးထားတယ်။', en: 'Every booklet says on its last page whose words they are.', days: [15], ch: 23 },
        ],
      },
      windyEdge: {
        at: { x: 22.6, z: 8.2, r: 4 },
        lines: [
          { my: 'ဖိုးသားက ပြင်မပေးဘူး။ ကိုယ့်ဘာသာ ပြန်ခေါက်ခိုင်းတယ်။', en: "Pho Thar won't fix it for me. He makes me fold it again myself.", age: 'child', from: 2, ch: 9 },
          { my: 'ငါ့ဟာ ငါးခါမြောက်မှ လည်တာ။', en: 'Mine only turned on the fifth try.', age: 'child', from: 2, ch: 1 },
          { my: 'လေက လူတိုင်းကို တူတူ တိုက်တယ်။ လည်မလည်က ခေါက်တဲ့လက်ပဲ။', en: 'The wind blows the same on everyone. Whether it turns is the folding hand.', from: 2, ch: 1 },
          { my: 'လူတွေက ချုပ်ရိုးစားပွဲ ရွေးမယ်ထင်တာ။ သူက ကိုယ့်စားပွဲ ကိုယ်ရွေးတယ်။', en: 'Everyone thought he would pick the stitching table. He picked his own.', age: 'elder', from: 2, ch: 1 },
          { my: 'သမီးက ညတိုင်း လေရဟတ်ခေါက်တယ်။ အိမ်မှာ စက္ကူ မကျန်တော့ဘူး။', en: 'My daughter folds windmills every night. There is no paper left in the house.', age: 'adult', from: 3, ch: 1 },
          { my: 'မိုးထဲမှာ လေရဟတ်တွေ ပျော့ကုန်ပြီ။ နေသာရင် အသစ်ခေါက်မယ်။', en: 'The windmills went soggy in the rain. When it clears, we fold new ones.', age: 'child', days: [12], ch: 1 },
          { my: 'ဒီည ငါ လေရဟတ်လေး ယူသွားမယ်။ အဲဒါ ငါ့မီးပဲ။', en: "I'm bringing a windmill tonight. That's my light.", age: 'child', days: [15], ch: 1 },
        ],
      },
      ribbonHead: {
        at: { x: 5.4, z: 17.2, r: 3 },
        lines: [
          { my: 'ဖဲကြိုးကြီး လိပ်လျက်ပဲ။ အချိန်တန်မှ ဖြန့်မှာပေါ့။', en: "The big ribbon's still rolled. It will open when it's ready.", days: [1], ch: 5 },
          { my: 'ဖဲကြိုးလမ်းပေါ် ပထမခြေလှမ်းက အကြောက်ဆုံးပဲ။', en: 'The first step onto the ribbon is the scariest.', from: 2, ch: 11 },
          { my: 'အောက်ကို မကြည့်နဲ့။ ရှေ့ကိုပဲ ကြည့်။', en: "Don't look down. Look ahead.", age: 'child', from: 2, ch: 11 },
          { my: 'ကလေးတွေ နေ့တိုင်း ဖြတ်ရင်း မကြောက်တော့ဘူးတဲ့။', en: "The children cross every day. They say they're not scared any more.", from: 3, ch: 1 },
          { my: 'လမ်းက ပြရုံပဲ ပြတယ်။ လျှောက်တာကတော့ ကိုယ်ပဲ။', en: 'A road only shows the way. The walking is yours.', age: 'elder', from: 3, ch: 'finale' },
          { my: 'ချော်တယ်။ ဖြည်းဖြည်းသွားရင် ရောက်တာပဲ။', en: "It's slippery. Go slowly and you still get there.", days: [12], ch: 1 },
        ],
      },
      writingRoom: {
        at: { x: 0, z: 7.6, r: 2.6 },
        lines: [
          { my: 'ဒီအိမ်ထဲမှာ ညတိုင်း မီးလင်းနေတယ်။ စာရေးနေတာ ထင်တယ်။', en: 'There is a light in there every night. Writing, I suppose.', ch: 1 },
          { my: 'စာရေးဖို့ ပါရမီလိုလား မေးကြည့်တယ်။ နေ့တိုင်းရေးဖို့ပဲ လိုတယ်တဲ့။', en: 'I asked if you need a gift to write. "You need to write every day," she said.', ch: 1 },
          { my: 'ဒီထဲမှာ စာအုပ်တွေ အများကြီး ရှိမှာ။ အကုန်ဖတ်ပြီးမှ ရေးတာ နေမှာ။', en: 'Bet there are loads of books in there. She must have read them all before writing.', age: 'child', ch: 23 },
          { my: 'ပြတင်းအောက်က ပဲပင်လေးတွေ တစ်နေ့တစ်လက်မ ရှည်လာတယ်။', en: 'The bean shoots under the window grow an inch a day.', from: 5, to: 10, ch: 3 },
          { my: 'ပြတင်းအောက်က ပဲပင်တွေ ပွင့်ကုန်ပြီ။ နေရောင် ရလို့ပေါ့။', en: 'The beans under the window have flowered. All that sun.', days: [11], ch: 3 },
          { my: 'မိုးနဲ့ လဲသွားတဲ့နေရာမှာ အညွန့်အသစ်တွေ ပြန်ထွက်လာပြီ။', en: 'New shoots where the rain knocked the beans flat.', from: 14, ch: 1 },
          { my: 'ပြတင်းအောက်က ပန်းတွေ ပွင့်ပြီ။ ကိုယ့်အချိန်နဲ့ ကိုယ်ပေါ့။', en: 'The flowers under the window have opened. Each in its own time.', days: [15], ch: 'finale' },
        ],
      },
    },

    rooms: {
      // the Post Office sorting room: clerks and the postwoman's helpers at the racks (Days 3, 6, 8-15)
      sortingroom: [
        { my: 'ပထမနေ့က စာတစ်အိတ် ခွဲတာ တစ်နာရီ။ အခု ဆယ်မိနစ်။', en: 'My first day, one sack took an hour. Now ten minutes.', ch: 1 },
        { my: 'လိပ်စာ မရှင်းရင် ခန့်မှန်းပြီး မပို့ဘူး။ မေးပြီးမှ ပို့တယ်။', en: "If an address isn't clear, I don't guess. I ask, then send.", ch: 'finale' },
        { my: 'စာတစ်စောင်ချင်းက တစ်ယောက်ယောက်ရဲ့ စိတ်။ မပစ်ချရဘူး။', en: "Every letter is somebody's heart. Never toss one.", ch: 11 },
        { my: 'ကိုယ့်စာကိုယ် ရေးဖို့ မေ့နေတာ။ ဒီနေ့တော့ တစ်ကြောင်း ရေးမယ်။', en: 'I keep forgetting to write my own. Today, one line.', from: 3, ch: 1 },
        { my: 'ဒီဘက်ခြမ်းကို ခွဲခဲ့တဲ့သူ သပ်ရပ်တယ်။ သူ့နည်းနဲ့ သူ။', en: 'Whoever sorted this half was tidy. In her own way.', from: 3, ch: 5 },
        { my: 'စာအိတ်တွေ မစိုအောင် ပိတ်စနဲ့ ထုပ်ထားတယ်။', en: "Wrapped the letters in oilcloth so they won't get wet.", days: [12], ch: 11 },
        { my: 'ဖိတ်စာတွေမှာ နာမည်တိုင်း မှန်အောင် နှစ်ခါ စစ်တယ်။', en: 'Checked every name on the invitations twice.', days: [14, 15], ch: 23 },
      ],
      // the Template Shop (Days 14, 15): the shopkeeper and customers
      templates: [
        { my: 'ပုံစံက အစပဲ ပေးတယ်။ စာကတော့ ကိုယ့်စာ ဖြစ်ရမယ်။', en: 'A template only gives the start. The words must be your own.', ch: 'finale' },
        { my: 'လူတိုင်း ပုံစံတူတူ ယူသွားကြတယ်။ ပြန်လာတော့ တစ်ယောက်မှ မတူဘူး။', en: 'Everyone takes the same template. They come back all different.', ch: 1 },
        { my: 'ကျွန်မလည်း အစက ပုံစံကို ကူးရုံပဲ။ ကြာတော့ ကိုယ့်ဟာ ဖြစ်လာတယ်။', en: 'At first I only copied the template too. In time it became my own.', ch: 1 },
        { my: 'အချိန်သက်သာဖို့ ဝယ်တာ။ စဉ်းစားတာကတော့ ကိုယ်ပဲ။', en: 'I buy it to save time. The thinking I still do myself.', ch: 'finale' },
        { my: 'ဖိတ်စာ ရှစ်စောင်။ တစ်စောင်ချင်းမှာ တစ်ယောက်ရဲ့ ကိုယ်ပိုင်စကား။', en: "Eight invitations. Each with one person's own words.", days: [14], ch: 23 },
        { my: 'စက္ကူ တစ်မျိုးတည်းကနေ မီးအိမ် တစ်ရာ မတူအောင် ထွက်လာတယ်။', en: 'From the same paper, a hundred lanterns, none alike.', days: [15], ch: 1 },
      ],
      // the Café (Content & Copywriting): writers at their tables
      content: [
        { my: 'နေ့တိုင်း တစ်ပိုဒ်ရေးတယ်။ တစ်လနေမှ ကောင်းတာ တစ်ပိုဒ် ထွက်တယ်။', en: "A paragraph a day. After a month, one good one comes out.", ch: 1 },
        { my: 'ဖျက်ပြီး ပြန်ရေးတာ ရှက်စရာ မဟုတ်ဘူး။ အလုပ်ပဲ။', en: "Crossing out and rewriting is no shame. It's the job.", ch: 1 },
        { my: 'လက်ဖက်ရည် တစ်ခွက်နဲ့ ခေါင်းစဉ် ဆယ်ခု။ သုံးလို့ရတာ တစ်ခုပဲ။', en: 'One cup of tea, ten headlines. One was usable.', ch: 1 },
        { my: 'ကိုယ့်အသံနဲ့ ရေးတာ အကြာဆုံး။ သူများအသံ တုတာက မြန်တယ်။', en: "Writing in your own voice takes longest. Copying someone else's is quick.", ch: 1 },
        { my: 'ကြော်ငြာစာ ရေးတာလည်း ပညာပဲ။ လူကို နားလည်မှ ရေးတတ်တာ။', en: 'Ad copy is a craft too. You have to understand people first.', ch: 3 },
        { my: 'ဒီလက်ဖက်ရည်အိုးလေး ဘယ်သူ့ဟာလဲ မသိဘူး။ လာသမျှလူကို ငှဲ့ပေးနေတယ်။', en: "Don't know whose teapot this is. It's pouring for whoever comes.", flag: 'd15.tea', ch: 6 },
      ],
      // the Library: readers and the librarian
      library: [
        { my: 'ဒီစာကြောင်း ဘယ်ကရလဲ မေးရင် စာအုပ်နာမည် ပြောနိုင်ရမယ်။', en: 'If someone asks where a line came from, you should be able to name the book.', ch: 23 },
        { my: 'ဖတ်တာနဲ့ ယုံတာ မတူဘူး။ ဖတ်ပြီး ကိုယ်တိုင် စမ်းကြည့်။', en: "Reading and believing aren't the same. Read, then try it yourself.", ch: 'finale' },
        { my: 'စာအုပ်တိုင်းရဲ့ နောက်မှာ တခြားစာအုပ်တွေ ရှိတယ်။', en: 'Behind every book there are other books.', age: 'elder', ch: 23 },
        { my: 'ဒီစာအုပ် နှစ်ခါဖတ်ပြီးပြီ။ ဒုတိယအခေါက် ပိုနားလည်တယ်။', en: 'Read this one twice. Understood more the second time.', age: 'child', ch: 3 },
        { my: 'ကျေးဇူးတင်ချင်ရင် ရေးတဲ့သူ နာမည် မှတ်ထားလိုက်။', en: 'If you want to thank someone, remember who wrote it.', ch: 23 },
        { my: 'ဒီည ဖတ်မယ့် နာမည်စာရင်းက ရှည်တယ်တဲ့။', en: "The list of names to be read tonight is long, they say.", days: [15], ch: 23 },
      ],
    },

    pairs: [
      { who: ['*', '*'], age: ['child', 'adult'], lines: [
        { my: 'အမေ၊ သားက ပန်းချီ ညံ့တယ်။', en: "Mum, I'm bad at drawing." },
        { my: 'ဘယ်နှခါ ဆွဲပြီးပြီလဲ။', en: 'How many times have you drawn?' },
        { my: '…နှစ်ခါ။', en: '…Twice.' },
        { my: 'ဒါဆို ညံ့တာ မဟုတ်သေးဘူး။ စတာပဲ ရှိသေးတယ်။', en: "Then you're not bad. You've only just started." },
      ], ch: 1 },
      { who: ['*', '*'], lines: [
        { my: 'နင့်သမီး ဆရာဝန် မလုပ်ဘူးတဲ့လား။', en: "Your girl isn't going to be a doctor?" },
        { my: 'ဟင့်အင်း။ မုန့်ဖုတ်မယ်တဲ့။', en: 'No. She wants to bake.' },
        { my: 'ကောင်းသားပဲ။ ပျော်ပျော်လုပ်ရင် တော်လာမှာ။', en: "Good. If she loves it, she'll get good." },
      ], ch: 1 },
      { who: ['*', '*'], age: ['child', 'child'], when: { from: 2 }, lines: [
        { my: 'နင့်လေရဟတ် ဘာလို့ လည်တာလဲ။', en: 'Why does yours turn?' },
        { my: 'ခြောက်ခု ခေါက်ခဲ့လို့။', en: 'Because I folded six.' },
        { my: 'ငါက တစ်ခုတည်းပဲ…', en: 'I only folded one…' },
        { my: 'ဒါဆို နောက်ထပ် ငါးခု။', en: 'Then five more.' },
      ], ch: 1 },
      { who: ['*', '*'], age: ['elder', 'adult'], when: { from: 2 }, lines: [
        { my: 'ဖိုးသား ချုပ်တာ ဖြောင့်လာတာ ပါရမီကြောင့်လား။', en: "Did Pho Thar's stitches straighten from some gift?" },
        { my: 'ဘယ်ကလာ။ ထပ်ခါထပ်ခါ ချုပ်လို့ပေါ့။', en: 'Gift? He stitched again and again.' },
        { my: 'ပြီးတော့ ချုပ်ရိုးကိုတောင် မရွေးဘူးနော်။', en: "And then he didn't even pick stitching." },
        { my: 'ကိုယ့်လမ်း ကိုယ်ရွေးတာ ကောင်းပါတယ်။', en: 'Choosing your own road is a good thing.' },
      ], ch: 1 },
      { who: ['*', '*'], when: { from: 3 }, lines: [
        { my: 'ဒီနေ့ စာ ဘယ်နှစောင်လဲ။', en: 'How many letters today?' },
        { my: 'မနေ့ကထက် တစ်စောင်ပိုတယ်။ မေးချင်တာတွေ များလာကြတယ်။', en: 'One more than yesterday. People have more to ask.' },
        { my: 'မေးတတ်တာ ကောင်းတဲ့ လက္ခဏာပဲ။', en: 'Asking is a good sign.' },
      ], ch: 3 },
      { who: ['*', '*'], age: ['child', 'elder'], when: { from: 2 }, lines: [
        { my: 'အဘ၊ ဖဲကြိုးလမ်းပေါ်မှာ ကြောက်လား။', en: 'Grandpa, are you scared on the ribbon road?' },
        { my: 'ကြောက်တာပေါ့။ ဒါပေမဲ့ နောက်ပြန် မလှည့်ဘူး။', en: "Of course. But I don't turn back." },
        { my: 'ဘာလို့လဲ။', en: 'Why?' },
        { my: 'ဟိုဘက်မှာ မင်းအဖွားရဲ့ မုန့်တွေ ရှိလို့။', en: "Your grandma's snacks are on the other side." },
      ], ch: 11 },
      { who: ['*', '*'], age: ['elder', 'elder'], lines: [
        { my: 'ငယ်ငယ်က ငါက အိမ်မှာ ဂီတကြိုက်တဲ့ တစ်ယောက်တည်း။', en: 'As a boy I was the only one in the house who loved music.' },
        { my: 'သိုးမည်းပေါ့။', en: 'The black sheep, then.' },
        { my: 'အေး။ အခု မြေးတွေ အကုန် တီးတတ်ကုန်ပြီ။', en: 'Yes. Now every one of my grandchildren plays.' },
      ], ch: 1 },
      { who: ['*', '*'], when: { days: [12] }, lines: [
        { my: 'ပြတင်းပေါက် လေနဲ့ ပွင့်သွားလို့ စာရွက်တွေ စိုကုန်ပြီ။', en: 'The wind blew my window open. My papers are soaked.' },
        { my: 'ဒါဆို ဘာလုပ်မလဲ။', en: 'What will you do?' },
        { my: 'အခြောက်လှန်းမယ်။ မရရင် ပြန်ရေးမယ်။ ဒါပဲ။', en: "Dry them. If that fails, write them again. That's all." },
      ], ch: 19 },
      { who: ['*', '*'], age: ['adult', 'child'], when: { days: [15] }, lines: [
        { my: 'ဒီစာကြောင်း ကိုယ်တိုင်ရေးတာလား။', en: 'Did you write this line yourself?' },
        { my: 'ဆရာမ ပြောတာ ကြားလို့ ရေးတာ။', en: 'I wrote what I heard Teacher say.' },
        { my: 'ဒါဆို ဆရာမ နာမည်ပါ ထည့်ရေးလိုက်လေ။', en: "Then put Teacher's name in too." },
      ], ch: 23 },
      { who: ['*', '*'], age: ['child', 'child'], when: { days: [15] }, lines: [
        { my: 'နင် ဘာမီး ယူလာမလဲ။', en: 'What light are you bringing?' },
        { my: 'ငါ့ကဗျာစာအုပ်။ ငါ့မီးက အဲဒါပဲ။', en: "My poem book. That's my light." },
        { my: 'ငါကတော့ ငါ့ဘောလုံး။', en: "I'm bringing my ball." },
        { my: 'ဘောလုံးကလည်း နင့်မီးဆိုရင် ရတာပဲ။', en: "If the ball is your light, that's fine." },
      ], ch: 1 },
    ],

    arrive: {
      // (the engine plays `first` once per save, and `again` lines at random on later arrivals; `area` is a
      // note for the town-intro module: the place the line suits best, if it ever picks by place)
      first: { my: '(အိမ်။ စာမျက်နှာ နှစ်ဆယ့်သုံးမျက်နှာ။ ကိုယ်တိုင် ပြန်စစ်ရမယ်။)', en: "(Home. Twenty-three pages. I'll check them for myself.)", by: 'maya', ch: 'finale' },
      again: [
        { my: '(အိမ်က သေးသွားသလိုပဲ။ ကျွန်မ မြင်ဖူးတာ များလာလို့ နေမှာ။)', en: "(Home looks smaller. Maybe I've just seen more.)", by: 'maya', from: 2, ch: 1 },
        { my: '(ရေပန်းသံ။ ဘယ်လောက်ဝေးဝေး သွားလာ၊ ဒီအသံက အိမ်ပဲ။)', en: '(The fountain. However far I go, that sound is home.)', by: 'maya', area: 'fountain', from: 2, ch: 1 },
        { my: '(လေရဟတ်တွေ လည်နေတုန်းပဲ။ တစ်ခုချင်းက "နောက်တစ်ခါ" တစ်ခုစီ။)', en: '(The windmills are still turning. Each one is a "once more".)', by: 'maya', area: 'windyEdge', from: 2, ch: 1 },
        { my: '(ဘုတ်ပေါ်မှာ မေးခွန်းတွေ တိုးနေမှာ။ ကျွန်မ ဖြေဖို့ထက် အတူတူ ရှာဖို့။)', en: '(More questions on the board by now. Less for me to answer than to look into together.)', by: 'maya', area: 'askBoard', from: 3, ch: 'finale' },
      ],
    },
  },

  // =====================================================================================================
  // EXERCISE-BOOK QUARTER
  // =====================================================================================================
  exercise: {
    town: [
      { my: '"ဘာလို့လဲ" မေးရင် ဆရာမ ပြုံးတယ်။', en: 'When you ask "why?", Teacher smiles.', age: 'child', ch: 3 },
      { my: 'အလွတ်ရတာနဲ့ နားလည်တာ မတူဘူးတဲ့။', en: "Knowing it by heart isn't understanding it, they say.", age: 'teen', ch: 3 },
      { my: 'အမ်းငွေ တွက်တာလည်း သင်္ချာပဲ ကလေးရေ။', en: 'Counting change is maths too, child.', age: ['adult', 'elder'], ch: 3 },
      { my: 'စက်ဘီးပြင်တာ ဘယ်လိုလည်လဲ မသိရင် မရဘူး။', en: "You can't mend a bike without knowing how it works.", ch: 3 },
      { my: 'ငါ ကျောင်းမနေခဲ့ရဘူး။ ဒါပေမဲ့ နေ့တိုင်း တစ်ခုခု သင်တယ်။', en: 'I never went to school. But I learn something every day.', age: 'elder', ch: 3 },
      { my: 'နှံကောင်က ဘာလို့ အစိမ်းရောင်လဲ။ ဆရာမကို မေးမယ်။', en: "Why is a grasshopper green? I'm going to ask Teacher.", age: 'child', ch: 3 },
      { my: 'အမှတ်ထက် သူ စူးစမ်းတာကို ပိုကြည့်ပါတယ်။', en: 'I watch how curious he is, more than his marks.', age: 'adult', ch: 3 },
      { my: 'ဒီနေ့ စကားလုံးအသစ် တစ်လုံး ရတယ်။ နေ့တိုင်း တစ်လုံး။', en: 'Learned one new word today. One a day.', age: 'child', ch: 3 },
      { my: 'ပထမဆုံးအိုးက ဘယ်သူ့ဟာမှ မဖြောင့်ဘူး။', en: "Nobody's first pot is straight.", age: 'elder', ch: 5 },
      { my: 'ငါ့ကို သင်ခဲ့တဲ့နည်းက သမီးနဲ့ မတည့်ဘူး။ နည်းသစ် ရှာနေတယ်။', en: "The way I was taught doesn't suit my daughter. I'm finding a new way.", age: 'adult', ch: 5 },
      { my: 'ငါ့ညီလေး ဖတ်တာ နှေးတယ်။ ငါ စောင့်ပေးတယ်။', en: 'My little brother reads slowly. I wait for him.', age: 'child', ch: 9 },
      { my: 'ငါ တော်တယ် ထင်ခဲ့တာ။ ဘောလုံးကန်ကြည့်တော့ သိသွားပြီ။', en: 'I thought I was clever. Then I tried football.', age: 'teen', ch: 9 },
      { my: 'ငါ မျက်မှန်လိုတယ်။ သူက တုတ်ကောက်လိုတယ်။ လူတိုင်း တစ်ခုခု လိုတာပဲ။', en: 'I need glasses, he needs a stick. Everyone needs something.', age: 'elder', ch: 9 },
      { my: 'စာမဖတ်တတ်လည်း ဈေးရောင်းရင် ဝယ်သူကိုတော့ ဖတ်တတ်ရတယ်။', en: 'You may not read books, but to sell you must read people.', ch: 3 },
      { my: 'အဖြေမှားတာ ရှက်စရာ မဟုတ်ဘူး။ မမေးတာက ပိုဆိုးတယ်။', en: "A wrong answer is nothing to be ashamed of. Not asking is worse.", age: 'child', ch: 3 },
      { my: 'အုတ်တစ်ချပ်ချင်း မှန်မှန်စီတတ်ဖို့ သုံးနှစ် သင်ခဲ့ရတယ်။', en: 'It took me three years to lay bricks properly, one by one.', age: ['adult', 'elder'], ch: 3 },
      { my: 'ရွှံ့ထဲ ကစားတာ ဆော့တာ မဟုတ်ဘူး။ သိပ္ပံ။', en: "Playing in mud isn't messing about. It's science.", age: 'child', ch: 3 },
      { my: 'နေရာတိုင်းက ကျောင်းပဲ။ မျက်လုံးဖွင့်ထားရင်။', en: 'Everywhere is a school, if you keep your eyes open.', age: 'elder', ch: 3 },
      { my: 'ဒီနေ့ ဆရာမ "ဘာလို့လဲ" မေးတာ ဘယ်သူမှ မဖြေနိုင်ဘူး။', en: 'Teacher asked "why?" today and nobody could answer.', age: 'child', days: [2], flag: 'd2.class', ch: 3 },
      { my: 'အမှတ်စာရွက်မှာ အလယ်လောက်ပဲ။ ပန်းဘာလို့ နေဘက်လှည့်လဲတော့ ငါသိတယ်။', en: 'Middle of the marks sheet. But I know why flowers turn to the sun.', age: 'child', from: 3, ch: 3 },
      { my: 'ပဲပုံးလေးကို နေပူထဲ ရွှေ့ထားတာ ဘယ်သူလဲ။ အညွန့်တွေ ထွက်လာပြီ။', en: 'Who moved that bean box into the sun? Shoots are coming up.', from: 5, flag: 'd2.ch3Done', ch: 3 },
      { my: 'ဘီးပေါ်မှာ "မရသေးဘူး" တဲ့။ အဲဒီစကားလုံး ကြိုက်တယ်။', en: 'On the wheel it says "not yet". I like that word.', from: 4, flag: 'd3.chalk', ch: 5 },
      { my: 'အိုးဖိုမီးခိုး ပြန်တက်လာပြီ။ ရပ်ကွက်ကြီး အသက်ဝင်သလိုပဲ။', en: 'Kiln smoke again. The Quarter feels alive.', age: 'elder', from: 4, flag: 'd3.ch5Done', ch: 5 },
      { my: 'အိုးကို ခေါက်ကြည့်တာ ကလင်ဆိုပြီး မြည်တယ်! ဘာလို့လဲ မသိဘူး။', en: 'I tapped a pot and it rang! No idea why.', age: 'child', from: 4, ch: 3 },
      { my: 'ပါဆယ်ကောင်လေး သူ့နာမည် ကိုယ်တိုင် ဖတ်နိုင်ပြီတဲ့။', en: 'The parcel boy can read his own name now, they say.', from: 4, flag: 'd3.ch9Done', ch: 9 },
      { my: 'ပါဆယ်ကောင်လေးကို "အဆင့်မတူဘူး" ပြောခဲ့မိတယ်။ မှားတယ်။', en: 'I once said the parcel boy "isn\'t our level". I was wrong.', age: 'teen', from: 4, flag: 'd3.ch9Done', ch: 9 },
      { my: 'ကျောင်းစင်ပေါ် စာအုပ်တွေ ပြည့်သွားပြီတဲ့။ ပေးတဲ့သူ နာမည် မပါဘူး။', en: "The school shelf is full now. Whoever gave them didn't say.", from: 5, flag: 'd4.give.books', ch: 6 },
      { my: 'ဒီည ပြဇာတ်! ငါ ခုံသယ်ပေးမယ်။', en: "The play's tonight! I'll carry benches.", age: 'child', days: [7], ch: 4 },
      { my: 'မနှစ်က ပြဇာတ် ပြီးသွားပြီ။ ဒီနှစ်ဟာ ဒီနှစ်ပဲ။', en: "Last year's play is over. This year is this year.", age: 'elder', days: [7], ch: 4 },
      { my: 'ပြဇာတ်ညက ရဲယဉ့် ကိုယ့်စကားနဲ့ကိုယ် ပြောသွားတယ်။', en: 'On the play night Ye Yint said it in his own words.', from: 8, flag: 'd7.played', ch: 4 },
      { my: 'ပြဇာတ်ထဲမှာ ငါက ခုံချပေးတဲ့သူ။ အရေးကြီးတယ်နော်။', en: 'In the play I was the one setting out benches. It mattered, you know.', age: 'child', from: 8, flag: 'd7.played', ch: 4 },
      { my: 'ကျောင်းပြီးရင် ဘာလုပ်မလဲ မေးတော့ "ရှာနေဆဲ" တဲ့။ ကောင်းတာပဲ။', en: 'Ask them what comes after school and they say "still looking". Good.', age: 'elder', from: 8, ch: 4 },
      { my: 'မိုးကြောင့် ကလေးတွေ အိမ်ထဲမှာ ပုံပြင်ပြောနေကြတယ်။ အဲဒါလည်း စာပဲ။', en: "Rain's kept the kids in, telling stories. That's learning too.", days: [12], ch: 3 },
      { my: 'စာအုပ်ထောင့်တွေ ကော့လာရင် မိုးရွာမယ်တဲ့။ တကယ် မှန်တယ်!', en: 'They said book corners curl before rain. It\'s true!', age: 'child', days: [12], ch: 3 },
      { my: 'မနက်ဖြန်ည စာအုပ်မိတ်ဆက်ပွဲတဲ့။ ငါ့နာမည် ပါရင် ကောင်းမှာ။', en: 'Book launch tomorrow night, they say. I hope my name is in it.', age: 'child', days: [14], ch: 23 },
      { my: 'တိုးတိုး ဖိတ်စာ ကိုယ်တိုင် လာပေးတယ်။ နာမည်တွေ အကုန် မှန်တယ်။', en: 'Toe Toe brought the invitation himself. Every name spelt right.', days: [14, 15], flag: 'd14.ttNames', ch: 23 },
      { my: 'ဒီည စာစောင်ထဲက ကလေးတွေ နာမည် ဖတ်မယ်တဲ့။', en: "Tonight they'll read out the children's names from the booklet.", age: 'elder', days: [15], ch: 23 },
    ],

    areas: {
      gate: {
        at: { x: 6.5, z: 46.5, r: 5 },
        lines: [
          { my: 'ဒီစာအုပ်ကြီး ဘယ်တော့မှ မပိတ်ဘူး။ သင်တာ မပြီးဘူးလေ။', en: 'That big book never closes. Learning never ends.', age: 'elder', ch: 3 },
          { my: 'ဝင်ဖို့ လက်မှတ် မလိုပါဘူး။ ဘယ်သူ ပြောတာလဲ။', en: "You don't need a pass to come in. Who told you that?", age: 'child', from: 3, ch: 3 },
          { my: 'မျဉ်းကြောင်းအတိုင်း လျှောက်ရင် ဖြောင့်တယ်။ ကွေ့ချင်ရင်လည်း ကွေ့လို့ရတယ်။', en: 'Walk along the lines and you go straight. Want to turn? You can.', age: 'elder', ch: 5 },
          { my: 'ကလေးကို ဒီအထိပဲ လိုက်ပို့တယ်။ ကျန်တာ သူ့ဘာသာ လျှောက်တယ်။', en: 'I walk her only this far. The rest she walks herself.', age: 'adult', ch: 5 },
          { my: 'ဖဲကြိုးလမ်းအတိုင်း အိမ်စာအုပ်ဆီ တက်ကြည့်ခဲ့တယ်။ ရေပန်းကြီး ရှိတယ်!', en: 'I went up the ribbon road to the Home Book. There is a fountain!', age: 'child', from: 3, ch: 3 },
          { my: 'မိုးရွာလည်း ကျောင်းလာတယ်။ ထီးမပါလို့ ဗလာစာအုပ်နဲ့ အုပ်ခဲ့တာ။', en: 'Came to school in the rain anyway. No umbrella, so I used my exercise book.', age: 'child', days: [12], ch: 3 },
          { my: 'ကျောင်းပြီးတဲ့ အစ်မတွေ ဒီကနေ ထွက်သွားကြတယ်။ ပြန်လှည့်မကြည့်ဘူး။', en: "The big girls who finish school leave this way. They don't look back.", from: 8, ch: 4 },
        ],
      },
      schoolYard: {
        at: { x: -11.5, z: 90.6, r: 6 },
        lines: [
          { my: 'ဇယားမှာ ငါတို့ကျောင်းက အလယ်မှာ။ မေးခွန်းမေးတာကျတော့ ထိပ်ဆုံး။', en: "On the chart our school is in the middle. For asking questions, we're top.", age: 'teen', ch: 3 },
          { my: 'ပထမရတာ ကောင်းပါတယ်။ ဘာလို့မှန်လဲ သိတာ ပိုကောင်းတယ်။', en: "Coming first is fine. Knowing why it's right is better.", age: 'adult', ch: 3 },
          { my: 'ကဗျာကို အလွတ်ရတယ်။ အဓိပ္ပာယ် မေးရင်တော့… ခဏနော်။', en: 'I know the poem by heart. Ask me what it means… hold on.', age: 'child', ch: 3 },
          { my: 'ကျောင်းက စာကျက်ဖို့ မဟုတ်ဘူး။ ကမ္ဘာကြီး ဘယ်လိုလည်လဲ သိဖို့။', en: "School isn't for cramming. It's for seeing how the world turns.", age: 'elder', ch: 3 },
          { my: 'ဇယားဘေးက ကလေးရဲ့ ကိုယ်ပိုင်စာကြောင်း။ ဇယားထက် ဖတ်ကောင်းတယ်။', en: "The child's own line by the chart. Nicer to read than the chart.", from: 3, flag: 'd2.ch3Done', ch: 3 },
          { my: 'အမှတ်စာရွက်ဝေတဲ့နေ့က ဗိုက်နာတယ်။ အခု ပြန်တွေးရင် ရယ်ရတယ်။', en: 'On marks-sheet day my tummy hurt. Now it makes me laugh.', age: 'child', from: 4, ch: 4 },
          { my: 'စုနွယ် မောင်ငယ်ကို စာသင်ပေးနေတယ်။ လက်ညှိုးလေးနဲ့ ဖြည်းဖြည်း။', en: "Su Nwe's teaching Maung Nge to read. Slowly, finger on the line.", age: 'child', from: 4, flag: 'd3.ch9Done', ch: 9 },
          { my: 'စာစီစာကုံးမှာ "ဘယ်ကရခဲ့လဲ" ရေးခိုင်းတယ်။ ခက်တယ်ဗျာ။', en: 'Teacher wants "where I got it" in our essays. Hard!', age: 'child', days: [14, 15], ch: 23 },
        ],
      },
      playground: {
        at: { x: -12, z: 96, r: 6.5 },
        lines: [
          { my: 'ဒန်းအမြင့်ဆုံး စီးချင်ရင် ခြေထောက် အချိန်ကိုက်ရတယ်။ စမ်းကြည့်ပြီးပြီ။', en: 'To swing highest you time your legs. I tested it.', age: 'child', ch: 3 },
          { my: 'သူက ငါ့ထက် လေးတော့ အလယ်နား တိုးထိုင်ရတယ်။ ဒါမှ ညီတယ်။', en: "He's heavier than me, so he sits nearer the middle. Then it balances.", age: 'child', ch: 3 },
          { my: 'လျှောရင် အောက်ကိုပဲ ဘာလို့ ကျတာလဲ။ အပေါ်ကို ဘာလို့ မလျှောတာလဲ။', en: 'Why does a slide only take you down? Why never up?', age: 'child', ch: 3 },
          { my: 'ဒန်းပေါ်က ကျဖူးတယ်။ ပြီးတော့ ပြန်စီးတယ်။', en: 'I fell off the swing once. Then I got back on.', age: 'child', ch: 11 },
          { my: 'ဒန်းကို အစမှာပဲ တွန်းပေးရတယ်။ ပြီးရင် သူ့ခြေနဲ့ သူ လွှဲတတ်သွားတယ်။', en: 'You push a child on a swing only at first. Then they pump with their own legs.', age: 'adult', ch: 9 },
          { my: 'ပဲပုံးလေး နေပူထဲ ရောက်သွားပြီ။ ပန်းခင်းဘေးမှာ။', en: 'The bean box is out in the sun now, by the flowers.', age: 'child', from: 3, flag: 'd2.ch3Done', ch: 3 },
          { my: 'စုနွယ် စက္ကူလှေ ခေါက်နေတယ်။ မောင်ငယ်က သင်ပေးတာတဲ့!', en: 'Su Nwe is folding paper boats. Maung Nge taught her!', age: 'child', from: 4, flag: 'd3.ch9Done', ch: 9 },
          { my: 'ပဲနွယ်တွေ ခြံစည်းရိုးပေါ် တက်လာပြီ။', en: 'The bean vines are climbing the fence.', age: 'child', from: 9, flag: 'd2.ch3Done', ch: 3 },
          { my: 'မိုးတွင်းမှာ ပဲပင်တွေ ရေလောင်းဖို့ မလိုဘူး။ ငါတို့ နားရတယ်။', en: 'In the rain the beans need no watering. We get a rest.', age: 'child', days: [12], ch: 3 },
        ],
      },
      snackShop: {
        at: { x: 15, z: 61.2, r: 4 },
        lines: [
          { my: 'ကိုယ့်ဟာကိုယ် ချိန်၊ ကိုယ့်ဟာကိုယ် အမ်း။ နေ့တိုင်း သင်္ချာစာမေးပွဲပဲ။', en: 'Weigh your own, make your own change. A maths test every day.', from: 3, ch: 3 },
          { my: 'ပဲတစ်ခွက် နှစ်ရာ။ ငါ့မှာ ငါးရာ။ အမ်းငွေ သုံးရာ။ မှန်တယ်!', en: "Beans, two hundred a cup. I've got five hundred. Change, three hundred. Right!", age: 'child', ch: 3 },
          { my: 'ဆိုင်ရှင်မရှိလည်း တစ်ပြားမှ မလိုဘူးတဲ့။', en: 'No keeper, and still not a coin missing, they say.', from: 3, age: 'elder', ch: 11 },
          { my: 'ချိန်ခွင် ငြိမ်အောင် စောင့်ရတယ်။ လောရင် မှားတယ်။', en: 'You wait for the scale to settle. Rush and you get it wrong.', age: 'child', ch: 4 },
          { my: 'အမ်းငွေ ကိုယ်တိုင်ယူရတော့ ကလေးတွေ တွက်တတ်လာကြတယ်။', en: 'Taking their own change, the children learned to count.', from: 3, age: 'adult', ch: 3 },
          { my: 'စင်ပေါ်က စာအုပ်ဟောင်း တစ်အုပ်ယူခဲ့တယ်။ ဘယ်သူ ထားခဲ့လဲ မသိဘူး။', en: "I took an old exercise book from the shelf. Don't know who left them.", age: 'child', from: 8, flag: 'd7.gave', ch: 11 },
          { my: 'နာမည်မပါတဲ့ လက်ဆောင်ကို ပိုသတိရတယ်။', en: 'You remember a gift with no name on it the longest.', age: 'adult', from: 8, flag: 'd7.gave', ch: 11 },
        ],
      },
      teaShop: {
        at: { x: 23.5, z: 60.6, r: 4 },
        lines: [
          { my: 'ဒီဆိုင်က လက်ဖက်ရည် ဘာလို့ကောင်းလဲ မေးကြည့်တယ်။ နို့အရင်ထည့်လို့တဲ့။', en: 'I asked why the tea is so good here. The milk goes in first, he said.', ch: 3 },
          { my: 'ကြားတာ အကုန်ယုံရင် ဒီဆိုင်မှာ ကမ္ဘာကြီး နှစ်ခါ ပျက်ပြီးပြီ။', en: 'If you believed all you hear here, the world has ended twice.', age: 'elder', ch: 'finale' },
          { my: 'ငါ့မြေး တက္ကသိုလ် မတက်ရဘူး။ ရေဒီယို ပြင်တတ်တယ်။ ပညာပဲ။', en: "My grandson never went to university. He mends radios. That's knowledge.", age: 'elder', ch: 3 },
          { my: 'ငါ အသက်ခြောက်ဆယ်။ မနေ့က ဖုန်းနဲ့ ဓာတ်ပုံပို့နည်း သင်ခဲ့တယ်။', en: "I'm sixty. Yesterday I learned to send a photo from my phone.", age: 'elder', ch: 3 },
          { my: 'ထောင့်က ကောင်မလေး အခု ကျက်ရုံ မဟုတ်ဘူး။ မေးလည်း မေးတယ်။', en: "The girl in the corner doesn't just cram now. She asks, too.", from: 4, flag: 'd3.ch9Done', ch: 3 },
          { my: 'ကြားဖူးတာတွေ ကိုယ်တိုင် သွားကြည့်တော့ တစ်ဝက်လောက် မှားနေတယ်။', en: 'When I went to look for myself, half of what I had heard was wrong.', from: 4, ch: 'finale' },
          { my: 'ဒီည ပြဇာတ်ရှိတယ်။ ဘယ်သူ ဇာတ်လိုက်လဲ ငါ မမေးတော့ဘူး။', en: "Play tonight. I've stopped asking who the lead is.", days: [7], ch: 4 },
          { my: 'မိုးရွာရင် ဒီဆိုင်မှာ စကားတွေ ပြည့်တယ်။ မြင်ဖူးတာက နည်းနည်းပဲ။', en: 'On rainy days this shop is full of talk. Very little of it seen.', days: [12], ch: 'finale' },
        ],
      },
      potterYard: {
        at: { x: 50.5, z: 119, r: 7.5 },
        lines: [
          { my: 'နာနာပုတ်မှ အိုးကောင်းတယ်တဲ့။ ငါကတော့ ဖွဖွပဲ ပုတ်တယ်။', en: '"Beat it hard for a good pot," they say. I pat mine gently.', age: 'elder', ch: 5 },
          { my: 'ဆရာ့နည်းက ဆရာ့လက်နဲ့ ကိုက်တယ်။ တပည့်လက်နဲ့ မကိုက်ချင်ဘူး။', en: "The master's way fits the master's hands. Not always the pupil's.", age: 'elder', ch: 5 },
          { my: 'ပထမ အိုးတစ်ဒါဇင် အကုန်ကွဲခဲ့တယ်။ ဆယ့်သုံးလုံးမြောက်မှ ရတယ်။', en: 'My first dozen pots all cracked. The thirteenth held.', ch: 5 },
          { my: 'နေပူထဲ မြန်မြန်ခြောက်ရင် ကွဲတယ်။ အရိပ်ထဲ ဖြည်းဖြည်းဆို ခိုင်တယ်။', en: 'Dry fast in the sun and it cracks. Slow in the shade and it holds.', from: 3, ch: 5 },
          { my: 'ဒီအိုးတွေ ကလေးလက်နဲ့ လုပ်တာတဲ့။ မယုံနိုင်ဘူး။', en: "They say a child's hands made these pots. I can't believe it.", age: 'adult', from: 3, ch: 5 },
          { my: 'ဘီးပေါ်က "မရဘူး" ဘေးမှာ "သေး" ကို ထည့်ရေးထားပြီ။', en: 'Somebody has added "yet" to the "can\'t" on the wheel.', from: 3, flag: 'd3.chalk', ch: 5 },
          { my: 'ကလေးမလေးရဲ့ အိုးလေးလုံး မကွဲဘူးတဲ့။', en: "The girl's four pots came out whole, they say.", from: 4, flag: 'd3.ch5Done', ch: 5 },
          { my: 'မိုးထဲမှာ ရွှံ့က မခြောက်ဘူး။ စောင့်ရမှာပဲ။', en: "Clay won't dry in this rain. We wait.", days: [12], ch: 5 },
          { my: 'မိချို ကလေးတွေကို ရွှံ့နယ်နည်း ပြပေးတယ်။ သူ့နည်းနဲ့ သူ။', en: 'Mi Cho shows the little ones how to knead. In her own way.', age: 'child', from: 8, flag: 'd3.ch5Done', ch: 9 },
        ],
      },
      stage: {
        at: { x: -13, z: 141, r: 7 },
        lines: [
          { my: 'အစ်ကိုကြီး ညတိုင်း မိန့်ခွန်းတစ်ခုတည်း ပြောတယ်။ ငါတောင် ရပြီ။', en: 'The big boy says the same speech every night. Even I know it now.', age: 'child', from: 3, to: 6, ch: 4 },
          { my: 'နှုတ်ဆက်ပွဲ ပြဇာတ် ရက်အနည်းငယ်ပဲ လိုတော့တယ်။ နာရီက မစောင့်ဘူး။', en: "Only a few days to the farewell play. The clock won't wait.", from: 2, to: 6, ch: 4 },
          { my: 'ဇာတ်လိုက် တစ်ယောက်တည်း ရှိလို့ ပွဲကောင်းတာ မဟုတ်ဘူး။', en: "A show isn't good because it has one lead.", age: 'elder', ch: 4 },
          { my: 'မနှစ်က ဆုက မနှစ်ကပဲ။ ဒီနှစ်က ဒီနှစ်ပဲ။', en: "Last year's prize was last year's. This year is this year.", age: 'elder', from: 3, ch: 4 },
          { my: 'ခုံတွေ အကုန်သယ်ပြီးပြီ! အားလုံး အတူတူ။', en: 'All the benches carried! Everyone together.', age: 'child', days: [7], flag: 'd7.benches', ch: 4 },
          { my: 'ပြဇာတ်ညက လိုက်ကာ တစ်ချက်ဆွဲတာနဲ့ ပွင့်သွားတယ်။', en: 'On the play night the curtain opened with a single tug.', from: 8, flag: 'd7.played', ch: 11 },
          { my: 'ရေဇလုံကို တစ်စက်မှ မဖိတ်ဘဲ သယ်သွားတယ်။ သတိထားရင် ရတာပဲ။', en: 'He carried the bowl across without spilling a drop. Paying attention does it.', from: 8, flag: 'd7.played', ch: 4 },
          { my: 'နောက်နှစ် ဇာတ်လိုက်… မဟုတ်ဘူး။ ကိုယ့်အခန်း ကောင်းအောင် ကမယ်။', en: "Next year, the lead… no. I'll just play my own scene well.", age: 'teen', from: 8, ch: 4 },
          { my: 'စင်နာရီက ဒီနေ့လည်း လည်နေတာပဲ။ ကြည့်ကြည့် မကြည့်ကြည့်။', en: "The stage clock's going again today, watched or not.", from: 8, ch: 4 },
        ],
      },
      teaStall: {
        at: { x: 13.6, z: 122.6, r: 3.5 },
        lines: [
          { my: 'ကိုဇော်က ရေနွေးဆူတာကို အသံနဲ့တင် သိတယ်။', en: 'Ko Zaw can tell the water is ready just by its sound.', ch: 3 },
          { my: 'ခွက်တစ်ခွက် ကောင်းဖို့ ရေ၊ မီး၊ အချိန် အကုန် သိရတယ်။', en: 'A good cup means knowing the water, the fire and the timing.', job: 'kozaw', ch: 3 },
          { my: 'လက်ဖက်ရည် ဖျော်ကြည့်တယ်။ ခါးလွန်းတယ်။ မနက်ဖြန် ထပ်စမ်းမယ်။', en: "I tried making tea. Too strong. I'll try again tomorrow.", age: 'child', ch: 1 },
          { my: 'သောက်ရုံ သောက်ခဲ့တာ နှစ်နှစ်ဆယ်။ ဒီနေ့မှ ဘယ်လိုဖျော်လဲ မေးကြည့်တယ်။', en: 'Twenty years just drinking it. Today I finally asked how it is made.', age: 'elder', ch: 3 },
          { my: 'ရပ်ကွက်စကားတွေ ဒီခုံမှာ စတယ်။ မှန်မမှန်ကတော့ တခြားကိစ္စ။', en: "The Quarter's talk starts at this bench. Whether it's true is another matter.", from: 3, ch: 'finale' },
        ],
      },
      borderSign: {
        at: { x: 0.6, z: 156.5, r: 5 },
        lines: [
          { my: 'ဆိုင်းဘုတ်ကျော်ရင် ရပ်ကွက် မဟုတ်တော့ဘူး။ သင်တာကတော့ ဆက်သွားတာပဲ။', en: "Past the sign it isn't the Quarter any more. The learning goes on, though.", age: 'elder', ch: 3 },
          { my: 'နယ်နိမိတ်ဆိုတာ မြေပေါ်မှာ ရေးထားတာ။ ခေါင်းထဲမှာ မရှိဘူး။', en: "A border is written on the ground. Not in your head.", ch: 3 },
          { my: 'သမီး ကျောင်းပြီးရင် ဒီဆိုင်းဘုတ်ကို ကျော်သွားမှာ။ ကိုယ့်ခြေနဲ့ကိုယ်ပေါ့။', en: 'When my girl finishes school she will walk past this sign. On her own feet.', age: 'adult', ch: 4 },
          { my: 'ဒီနားမှာ ဘယ်လမ်းလဲ မေးကြတယ်။ ဆိုင်းဘုတ်က ဘယ်တော့မှ မဖြေဘူး။', en: "People ask \"which way?\" by this sign. The sign never answers.", from: 3, ch: 'finale' },
          { my: 'လမ်းက ဒီနားမှာ ဆုံးတယ် ထင်ခဲ့တာ။ အခု ဆက်သွားနေပြီ။', en: 'I thought the road ended near here. Now it goes on.', from: 4, ch: 5 },
          { my: 'အလုပ်ခေါ်စာ နှစ်စောင်။ ဘယ်ဟာ ရွေးမလဲက ရွေးမယ့်သူရဲ့ ကိစ္စ။', en: 'Two job notices. Which to choose is the chooser\'s business.', from: 4, ch: 5 },
          { my: 'မိုးကြောင့် ဆိုင်းဘုတ်စာလုံး ဝါးသွားပြီ။ လမ်းကတော့ ရှိနေတာပဲ။', en: "The rain's smudged the sign. The road's still there.", days: [12], ch: 'finale' },
        ],
      },
    },

    rooms: {
      // Daw Hnin Wai's classroom: the pupils at their desks (walk-on keys from rooms/quarter.js WALKONS)
      classroom: [
        { my: 'ဆရာမ… "ဘာလို့လဲ" က စာမေးပွဲထဲ ပါလား။', en: 'Teacher… is "why" in the exam?', job: ['pupil', 'pupilGirl', 'pupil2', 'pupil3', 'pupilGirl2', 'pupilGirl3'], ch: 3 },
        { my: 'ပဲစိုက်ကဗျာ ရွတ်တတ်တယ်။ ပဲကတော့ မစိုက်ဖူးဘူး။', en: "I can recite the bean-planting rhyme. I've never planted a bean.", job: ['pupil', 'pupilGirl', 'pupil2', 'pupil3', 'pupilGirl2', 'pupilGirl3'], ch: 3 },
        { my: '"သည်" နဲ့ "၏" ရောသွားတယ်။ ဆရာမ ပြုံးပြီး ပြင်ခိုင်းတယ်။', en: 'Mixed up သည် and ၏. Teacher just smiled and had me fix it.', job: ['pupil', 'pupilGirl', 'pupil2', 'pupil3', 'pupilGirl2', 'pupilGirl3'], ch: 3 },
        { my: 'စာတော်ရင် ကူပေးဖို့။ ပြောင်ဖို့ မဟုတ်ဘူးတဲ့။', en: "If you're good at lessons, it's for helping. Not teasing.", job: ['pupil', 'pupilGirl', 'pupil2', 'pupil3', 'pupilGirl2', 'pupilGirl3'], from: 3, flag: 'd3.ch9Done', ch: 9 },
        { my: 'စင်ပေါ်က စာအုပ်အသစ်တွေ ဘယ်သူ ပို့တာလဲ။ နာမည် မပါဘူး။', en: 'Who sent the new books on the shelf? There is no name.', job: ['pupil', 'pupilGirl', 'pupil2', 'pupil3', 'pupilGirl2', 'pupilGirl3'], from: 4, flag: 'd4.give.books', ch: 6 },
        { my: 'ပြဇာတ်ထဲမှာ ငါက သစ်ပင်။ စကားမပါဘူး။ ဒါပေမဲ့ လိုတယ်။', en: "In the play I'm a tree. No lines. But they need a tree.", job: ['chorus1', 'chorus2', 'pupil', 'pupilGirl'], days: [7], ch: 4 },
        { my: 'စာစီစာကုံးမှာ အမေ့နာမည် ထည့်တယ်။ ဟင်းချက် သူသင်ပေးတာကိုး။', en: "I put Mum's name in my essay. She taught me to cook, after all.", days: [14], ch: 23 },
      ],
      // the honesty snack shop: a Quarter child (Day 7's walk-on) at the bins
      snackshop: [
        { my: 'ချိန်ခွင်က ငါ့ကို မလိမ်ဘူး။ ငါလည်း သူ့ကို မလိမ်ဘူး။', en: "The scale doesn't cheat me. I don't cheat it.", job: 'child', ch: 11 },
        { my: 'အမ်းငွေယူရင် နှစ်ခါ ရေတွက်တယ်။ ပိုမယူမိအောင်။', en: 'When I take change I count twice, so I never take too much.', job: 'child', ch: 3 },
        { my: 'ဆိုင်ရှင် မရှိလေ ပိုသတိထားလေ။ ဘယ်သူမှ မကြည့်လည်း မှန်မှန်ပဲ။', en: "No keeper, so I'm extra careful. Nobody watching, still done right.", job: 'child', ch: 11 },
        { my: 'မုန့်ဖိုး တစ်ရာ လိုနေတယ်။ မနက်ဖြန် ထည့်မယ်လို့ စာရေးထားခဲ့မယ်။', en: "A hundred short. I'll leave a note: paying tomorrow.", job: 'child', ch: 11 },
        { my: 'ဒီစင်ပေါ်က စာအုပ်တစ်အုပ် ယူမယ်။ ပြီးရင် တစ်အုပ် ပြန်ထားခဲ့မယ်။', en: "I'll take a book from this shelf. When I'm done, I'll leave one back.", job: 'child', from: 7, flag: 'd7.gave', ch: 11 },
      ],
      // Daw Ohn's shed: the potter and her pupil at work (only after their own chapter has closed)
      pottershed: [
        { my: 'ဆယ့်နှစ်လုံးက ကျွန်မနည်း။ လေးလုံးက သူ့နည်း။ နှစ်မျိုးလုံး အိုးပဲ။', en: "Twelve my way, four hers. Both are pots.", job: 'dawohn', flag: 'd3.ch5Done', ch: 5 },
        { my: 'တပည့်ကို သင်ရင်း ကိုယ်လည်း သင်ရတယ်။', en: 'Teaching her, I learn too.', job: 'dawohn', flag: 'd3.ch5Done', ch: 5 },
        { my: 'ဆရာ့ဘီးဟောင်းကို နေ့တိုင်း သုတ်တယ်။ ကျေးဇူးက မဟောင်းဘူး။', en: "I wipe the master's old wheel every day. Gratitude doesn't get old.", job: 'dawohn', flag: 'd3.ch5Done', ch: 23 },
        { my: 'ဒီနေ့ လေးလုံး။ မနက်ဖြန်လည်း လေးလုံး။ ကိုယ့်အမြန်နှုန်းနဲ့ကိုယ်။', en: 'Four today. Four tomorrow. At my own pace.', job: 'micho', flag: 'd3.ch5Done', ch: 5 },
        { my: 'ဘီးပေါ်က "သေး" လေးကို နေ့တိုင်း ကြည့်တယ်။', en: 'I look at that little "yet" on my wheel every day.', job: 'micho', flag: 'd3.chalk', ch: 5 },
        { my: 'ကလေးတွေ ရွှံ့လာနယ်ရင် ပထမဆုံးအိုးကို ပြတယ်။ ကောက်နေတာ။', en: 'When the kids come to knead, I show them my first pot. Lopsided.', job: 'micho', from: 8, flag: 'd3.ch5Done', ch: 9 },
      ],
      // the Quarter tea shop on street 62: the tea master and two drinkers
      quartertea: [
        { my: 'အချိုလား၊ အခါးလား၊ ပေါ့ပေါ့လား။ လူတိုင်း ကိုယ့်ခွက်နဲ့ကိုယ်ပဲ။', en: 'Sweet, strong or light? Everyone has their own cup.', job: 'teamaster', ch: 5 },
        { my: 'ခွက်ဆေးတာတောင် နည်းရှိတယ်။ ငါ့ဆရာ သင်ပေးခဲ့တာ။', en: 'Even washing cups has a method. My teacher taught me.', job: 'teamaster', ch: 23 },
        { my: 'အဖေက ကောင်းကင်ကြည့်ပြီး မိုးရွာမရွာ သိတယ်။ စာအုပ်မလိုဘူး။', en: 'My father could read rain in the sky. No book needed.', job: ['drinker', 'drinker2'], ch: 3 },
        { my: 'သတင်းစာဖတ်ရုံနဲ့ မသိဘူး။ ကိုယ်တိုင် မေးကြည့်ရတယ်။', en: "Reading the paper isn't knowing. You have to ask around yourself.", job: ['drinker', 'drinker2'], ch: 'finale' },
        { my: 'ငါတို့တုန်းက ကျက်ရုံပဲ။ အခုကလေးတွေ မေးတယ်။ ငါ့ကိုတောင် မေးတယ်။', en: 'In our day we just learned by heart. These kids ask. They even ask me.', job: ['drinker', 'drinker2'], from: 3, ch: 3 },
        { my: 'ဒီည ပြဇာတ်ကို နောက်ဆုံးတန်းက ကြည့်မယ်။ အကုန်မြင်ရတယ်။', en: "I'll watch the play tonight from the back row. You see everything from there.", job: 'drinker2', days: [7], ch: 4 },
        { my: 'စာစောင်ထဲမှာ ငါ့နာမည် ပါမယ်တဲ့။ ငါ ဘာပြောခဲ့လို့လဲ မသိဘူး။', en: "They say my name will be in the booklet. No idea what I said!", job: ['drinker', 'drinker2'], days: [14, 15], ch: 23 },
      ],
      // the tin-roofed tea shop by the border sign: its keeper (and a passing drinker)
      bordertea: [
        { my: 'ပြတင်းကနေ လမ်းရွေးတဲ့သူတွေ ကြည့်ရတယ်။ ငါ့ကို မမေးဘူး။ ကောင်းတယ်။', en: "From the window I watch people choose their road. Nobody asks me. Good.", job: 'keeper', ch: 'finale' },
        { my: 'ဘယ်လမ်းလဲ မေးရင် လက်ဖက်ရည် ထပ်ငှဲ့ပေးတယ်။ စဉ်းစားချိန်ရအောင်။', en: 'When they ask me which road, I just pour more tea. Gives them time to think.', job: 'keeper', from: 4, ch: 5 },
        { my: 'ခရီးမထွက်ခင် ကိုယ့်ဗိုက် အရင်ဖြည့်။ ပြီးမှ သူများကို ကူနိုင်မယ်။', en: 'Fill your own belly before the road. Then you can help others.', job: 'keeper', from: 4, ch: 6 },
        { my: 'နောက်မှာ ကျောင်း၊ ရှေ့မှာ လမ်း။ ငါက အလယ်က ခုံလေးပေါ်မှာ။', en: 'School behind, road ahead. Me, on the stool in between.', ch: 4 },
        { my: 'ငါ့လမ်းကို အဖေ ရွေးပေးတာ။ သူ့အတွက် မှန်တယ်၊ ငါ့အတွက် မမှန်ဘူး။', en: 'My father chose my road. Right for him. Not for me.', age: 'elder', from: 4, ch: 5 },
        { my: 'မနက်ဖြန်ည ကျွန်မလည်း လာမယ်။ လက်ဖက်ရည် တစ်အိုး ယူခဲ့မယ်။', en: "I'll come tomorrow night too. I'll bring a pot of tea.", job: 'keeper', days: [14], ch: 6 },
      ],
    },

    pairs: [
      { who: ['*', '*'], age: ['teen', 'teen'], lines: [
        { my: 'ကဗျာ ရပြီလား။', en: 'Got the poem by heart?' },
        { my: 'ရပြီ။ အဓိပ္ပာယ်ကတော့ မရသေးဘူး။', en: 'Yes. The meaning, not yet.' },
        { my: 'ငါလည်း။ အတူတူ စဉ်းစားကြမလား။', en: 'Me neither. Think it through together?' },
      ], ch: 3 },
      { who: ['*', '*'], age: ['child', 'elder'], lines: [
        { my: 'အဖွား၊ ကျောင်းက ဘာအတွက်လဲ။', en: "Grandma, what's school for?" },
        { my: 'အလုပ်ကောင်းရဖို့လို့ ငါတို့တုန်းက ပြောကြတာ။', en: 'For a good job, we used to say.' },
        { my: 'အခုရော။', en: 'And now?' },
        { my: 'ကမ္ဘာကြီးကို နားလည်ဖို့ ထင်တယ်။', en: 'To understand the world, I think.' },
      ], ch: 3 },
      { who: ['*', '*'], age: ['adult', 'child'], lines: [
        { my: 'ဒီအိုး ကွဲသွားပြီ။ ပစ်လိုက်မလား။', en: 'This one cracked. Throw it out?' },
        { my: 'မပစ်နဲ့! ဘာလို့ကွဲလဲ ကြည့်ရအောင်။', en: "Don't! Let's see why it cracked." },
        { my: '…ဟုတ်သားပဲ။ အမှားကလည်း ဆရာပဲ။', en: '…Right. A mistake teaches too.' },
      ], ch: 5 },
      { who: ['*', '*'], age: ['adult', 'adult'], lines: [
        { my: 'သားကို ငါ့လိုပဲ ညတိုင်း စာကျက်ခိုင်းတယ်။ မရဘူး။', en: "I make my son cram every night, like I did. It's not working." },
        { my: 'ကလေးတိုင်း နင့်လို မဟုတ်ဘူးလေ။', en: 'Not every child is like you.' },
        { my: '…ဟုတ်တယ်။ သူ့နည်း ရှာကြည့်မယ်။', en: "…True. I'll find his way." },
      ], ch: 5 },
      { who: [['aungaung', 'thetpaing', 'mayzin'], ['aungaung', 'thetpaing', 'mayzin']], age: ['child', 'child'], lines: [
        { my: 'ဒီစာလုံး ဖတ်တတ်လား။', en: 'Can you read this word?' },
        { my: 'မဖတ်တတ်သေးဘူး။', en: 'Not yet.' },
        { my: 'ငါ့လက်ညှိုးနောက် လိုက်။ ဖြည်းဖြည်းပဲ။', en: 'Follow my finger. Slowly.' },
        { my: '…ပဲ… ပုံး! ပဲပုံး!', en: '…Bean… box! Bean box!' },
      ], ch: 9 },
      { who: [['aungaung', 'thetpaing', 'mayzin'], ['aungaung', 'thetpaing', 'mayzin']], age: ['child', 'child'], when: { days: [7] }, lines: [
        { my: 'ဒီည ဘယ်သူ ဇာတ်လိုက်လဲ။', en: "Who's the lead tonight?" },
        { my: 'ဘယ်သူမှ မဟုတ်ဘူးတဲ့။', en: 'Nobody, they say.' },
        { my: 'ဒါဆို ငါတို့ အကုန်ပေါ့!', en: "Then it's all of us!" },
      ], ch: 4 },
      { who: ['*', '*'], age: ['elder', 'elder'], lines: [
        { my: 'နင့်မြေး ဒီနှစ် အမှတ် ဘယ်လောက်ရလဲ။', en: 'What marks did your grandson get this year?' },
        { my: 'မသိဘူး။ မမေးဘူး။', en: "Don't know. I didn't ask." },
        { my: 'ဟင်?', en: 'Eh?' },
        { my: 'ပုရွက်ဆိတ် လမ်းရှာပုံ ရှင်းပြတယ်။ အဲဒါပဲ မေးတယ်။', en: 'He explained how ants find their way. That is what I ask about.' },
      ], ch: 3 },
      { who: ['*', '*'], age: ['adult', 'child'], lines: [
        { my: 'အမ်းငွေ ဘယ်လောက်လဲ ကိုယ်တိုင် တွက်ကြည့်။', en: 'Work out your change yourself.' },
        { my: 'ခြောက်ရာ… မဟုတ်ဘူး၊ ငါးရာ!', en: 'Six hundred… no, five hundred!' },
        { my: 'မှန်တယ်။ ဈေးဆိုင်ကလည်း စာသင်ခန်းပဲ။', en: 'Right. A shop is a classroom too.' },
      ], ch: 3 },
      { who: ['*', '*'], when: { from: 4, flag: 'd3.ch5Done' }, lines: [
        { my: 'မိချို အိုးတွေ မကွဲဘူးတဲ့။', en: "Mi Cho's pots didn't crack, they say." },
        { my: 'ငါက မရတော့ဘူး ထင်ခဲ့တာ။', en: "I'd thought she'd never manage it." },
        { my: 'ထင်ခဲ့တာပဲ ရှိတာ။ "မရသေး" ပဲ ရှိခဲ့တာ။', en: 'You only thought so. It was just "not yet".' },
      ], ch: 5 },
      { who: ['*', '*'], age: ['teen', 'teen'], when: { from: 4, flag: 'd3.ch9Done' }, lines: [
        { my: 'မောင်ငယ်က ငါ့ထက် လမ်းတွေ ပိုသိတယ်။', en: 'Maung Nge knows the streets better than I do.' },
        { my: 'ငါကတော့ စာပိုသိတယ်။', en: 'I know letters better.' },
        { my: 'ဒါဆို လဲကြမလား။', en: 'Swap, then?' },
      ], ch: 9 },
      { who: ['*', '*'], age: ['child', 'adult'], when: { days: [12] }, lines: [
        { my: 'အမေ၊ မိုးရွာနေတယ်။ ကျောင်းမသွားရဘူးလား။', en: "Mum, it's raining. No school?" },
        { my: 'မိုးရွာရင် ပညာက အရည်ပျော်သွားလား။', en: 'Does knowledge melt in the rain?' },
        { my: '…ထီး ယူမယ်။', en: "…I'll get the umbrella." },
      ], ch: 3 },
      { who: ['*', '*'], age: ['child', 'child'], when: { days: [14, 15] }, lines: [
        { my: 'နင့်စာစီစာကုံးထဲ ဘယ်သူ့နာမည်တွေ ထည့်လဲ။', en: 'Whose names did you put in your essay?' },
        { my: 'ဆရာမ၊ အဖွား၊ ပြီးတော့ ဘောလုံးသင်ပေးတဲ့ အစ်ကို။', en: 'Teacher, Grandma, and the boy who taught me football.' },
        { my: 'ဘောလုံးလည်း ပညာပဲလေ။', en: 'Football is knowledge too.' },
      ], ch: 23 },
      { who: ['drinker', 'drinker2'], when: { room: 'quartertea' }, lines: [
        { my: 'ဒီလက်ဖက်ရည် ဘယ်လိုဖျော်လဲ နင်သိလား။', en: 'Do you know how this tea is made?' },
        { my: 'သောက်တာ နှစ်သုံးဆယ်ရှိပြီ။ မသိဘူး။', en: "Thirty years drinking it. No idea." },
        { my: 'ဒါဆို ဒီနေ့ မေးကြည့်ရအောင်။', en: "Then let's ask today." },
      ], ch: 3 },
    ],

    arrive: {
      // (Day 2's script plays its own arrival line first; this one is for when no day script speaks)
      first: { my: '(ဆော့သံ၊ စာရွတ်သံ၊ ဘီးလည်သံ။ ရပ်ကွက်တစ်ခုလုံး စာသင်ခန်းပဲ။)', en: '(Playing, reciting, a wheel turning. The whole Quarter is a classroom.)', by: 'maya', ch: 3 },
      again: [
        { my: '(ဒန်းတွေ လွှဲနေတုန်း။ ကလေးတွေ "ဘာလို့လဲ" မေးနေတုန်း။)', en: '(The swings still going. The children still asking "why?")', by: 'maya', area: 'playground', from: 3, ch: 3 },
        { my: '(အိုးဖိုက မီးခိုး။ "မရသေးဘူး" ဆိုတာ ဒီလိုပဲ ကုန်သွားတာ။)', en: '(Smoke from the kiln. That is how a "not yet" runs out.)', by: 'maya', area: 'potterYard', flag: 'd3.ch5Done', ch: 5 },
        { my: '(ပြဇာတ်ညက ကုန်သွားပြီ။ ဒါပေမဲ့ အသံတွေ ကြားနေရသေးတယ်။)', en: '(The play night is over. I can still hear it, though.)', by: 'maya', area: 'stage', from: 8, flag: 'd7.played', ch: 4 },
      ],
    },
  },

  // =====================================================================================================
  // THE ENVELOPE ROAD (Quarter border sign -> the Market's crease)
  // =====================================================================================================
  envelope: {
    town: [
      { my: 'စာပို့တာ ကိုယ့်အလုပ်။ ဘယ်လိုဖတ်မလဲက သူ့အလုပ်။', en: 'Sending it is my job. How it is read is theirs.', ch: 7 },
      { my: 'ဒီလမ်း နေ့တိုင်းလျှောက်တယ်။ တစ်နေ့မှ မတူဘူး။', en: 'I walk this road every day. No two days the same.', age: 'elder', ch: 4 },
      { my: 'ဘီးလုံးပြိုင်ရင် ငါ အမြဲရှုံးတယ်။ ဒါပေမဲ့ အမြဲ ပြိုင်တယ်။', en: 'I always lose the tyre race. I always race, though.', age: 'child', ch: 1 },
      { my: 'ဝန်လေးရင် ခဏနား။ လမ်းက ပြေးမသွားပါဘူး။', en: "Heavy load? Rest a while. The road won't run off.", ch: 6 },
      { my: 'လက်ဆောင်ရရင် ပြန်ပေးဖို့ မတွက်နဲ့။ ပေးချင်တဲ့အခါ ပေး။', en: "Got a gift? Don't tally the return. Give when you want to.", age: 'elder', ch: 6 },
      { my: 'ကြက်ကို ကျွေးနိုင်သလောက် ကျွေးတယ်။ ကိုယ့်ထမင်းအိုး မပြောင်အောင်။', en: 'I feed the hens what I can spare. Never so much that my own pot runs empty.', age: ['adult', 'elder'], ch: 6 },
      { my: 'သမီးက စာပြန်မရေးဘူး။ ငါကတော့ ဆက်ရေးတယ်။ မျှော်မနေဘူး။', en: "My daughter doesn't write back. I keep writing anyway. I'm not waiting.", age: 'elder', ch: 7 },
      { my: 'စာအိတ်ပိတ်ပြီး ပို့လိုက်ရင် လွှတ်လိုက်တာပဲ။', en: "Once you seal it and send it, you've let it go.", age: 'elder', ch: 7 },
      { my: 'လမ်းပေါ်က ချိုင့်တွေ ငါ မရွေးရဘူး။ ငါ့ခြေလှမ်းကိုပဲ ရွေးတယ်။', en: "I don't pick the potholes. I pick my steps.", ch: 11 },
      { my: 'ဆိတ်ကလေး ကြိုးနဲ့ချည်ထားလည်း သူ့ဘာသာ ပျော်နေတာပဲ။', en: "The goat's on a rope, and still she's content.", age: 'child', ch: 11 },
      { my: 'စက္ကူလေယာဉ် ပျံသွားရင် ဘယ်ကျမလဲ မသိဘူး။ အဲဒါ ပျော်စရာ။', en: "Once a paper plane's off, you don't know where it lands. That's the fun.", age: 'child', ch: 7 },
      { my: 'အိမ်နီးချင်းကို ကူတာ မှတ်တမ်းမတင်ဘူး။ မေ့ပစ်တယ်။', en: "I don't keep count of helping the neighbours. I forget it.", ch: 6 },
      { my: 'ကုန်စုံဆိုင်မှာ အကုန်ရတယ်။ စိတ်အေးတာကတော့ ကိုယ့်ဘာသာ ရှာရတယ်။', en: 'The sundries shop has everything. Peace of mind you find yourself.', ch: 11 },
      { my: 'ငါ ခြေနှေးတယ်။ ဒါပေမဲ့ လမ်းပေါ်မှာ ငါ့နေရာ ရှိတယ်။', en: "I'm slow on my feet. But there's room on the road for me.", age: 'elder', ch: 1 },
      { my: 'ပြေးရင် ငါးမိနစ်၊ လျှောက်ရင် ဆယ်မိနစ်။ စမ်းကြည့်ပြီးပြီ။', en: 'Running, five minutes. Walking, ten. I tested it.', age: 'child', ch: 3 },
      { my: 'လမ်းထိပ်မှာ တိမ်တွေပဲ။ ဟိုဘက်မှာ ဘာရှိလဲ ဘယ်သူမှ မသိဘူး။', en: "At the end there's only cloud. Nobody knows what's past it.", age: 'elder', to: 3, ch: 'finale' },
      { my: 'လမ်းက ဒီမှာ ဆုံးတယ်ဆိုရင်… ဘာလို့ ဒီလမ်းကို ဖောက်ထားတာလဲ။', en: 'If the road ends here… why did anyone build it?', age: 'child', to: 3, ch: 5 },
      { my: 'လမ်းဆုံးတယ် ထင်ခဲ့တာ။ မနက်လင်းတော့ ဈေးကြီး ပေါ်လာတယ်။', en: 'I thought the road ended. Then one morning there was a market.', from: 4, ch: 5 },
      { my: '"မဆုံးသေး" တာကို "ဆုံးပြီ" ထင်တာ ငါတို့ အကျင့်ပဲ။', en: 'We are always taking "not yet" for "the end".', age: 'elder', from: 4, ch: 5 },
      { my: 'ပထမဆုံးတုန်းက လမ်းမှားတယ်။ အခု မျက်စိမှိတ်ပြီး သွားနိုင်ပြီ။', en: 'First time down I got lost. Now I could do it eyes shut.', from: 5, ch: 1 },
      { my: 'ပေးလိုက်ပြီဆို ဘယ်သူစားလဲ လိုက်မကြည့်ဘူး။', en: "Once it's given, I don't go after who eats it.", from: 4, ch: 6 },
      { my: 'စာအုပ်တင်ကား ကျောင်းဘက် တက်သွားတယ်။ ပေးသူနာမည် မပါဘူးတဲ့။', en: "A car went up toward the school with books. No giver's name on them, they say.", from: 5, flag: 'd4.give.books', ch: 6 },
      { my: 'တံတားသစ် ဖွင့်ပြီတဲ့။ ကြောက်ပေမဲ့ ဖြတ်ကြည့်မယ်။', en: "They say a new bridge has opened. I'm scared, but I'll cross it.", age: 'child', from: 8, flag: 'd7.bridge', ch: 11 },
      { my: 'မိုးကို တားလို့မရဘူး။ ထီးတော့ ဆောင်းလို့ရတယ်။', en: "You can't stop the rain. You can open an umbrella.", days: [12], ch: 19 },
      { my: 'ဖိတ်စာထဲမှာ ငါ့စကား ငါ့နာမည်နဲ့ ပါတယ်တဲ့။ ရှက်လိုက်တာ။', en: 'My words are in the invitation, with my name. How embarrassing!', days: [14, 15], flag: 'd14.printed', ch: 23 },
      { my: 'ဒီည ငါ့မီးက ငါ့ကြက်ဥတောင်း။ ငါ လုပ်တတ်တာ အဲဒါပဲ။', en: "Tonight my light is my egg basket. It's what I do.", days: [15], ch: 1 },
    ],

    areas: {
      roadTop: {
        at: { x: 4, z: 167, r: 6 },
        lines: [
          { my: 'စာရွတ်သံထက် ရယ်သံ ပိုများလာတယ်။ ကောင်းတယ်။', en: 'More laughing than reciting from the school these days. Good.', age: 'elder', from: 3, ch: 3 },
          { my: 'ဒီမှာ ခဏရပ်ပြီး နောက်လှည့်ကြည့်ကြတယ်။ ပြီးရင် ဆက်သွားတာပဲ။', en: 'They stop here, look back, then go on.', age: 'elder', ch: 4 },
          { my: 'လမ်းဆုံးအထိ မလိုက်ပို့တော့ဘူး။ ယုံလို့။', en: "I don't walk him all the way now. I trust him.", age: 'adult', ch: 7 },
          { my: 'လမ်းအဆုံးမှာ တိမ်ပဲတဲ့။ တိမ်ကို အနီးကပ် မမြင်ဖူးသေးဘူး။', en: "Only cloud at the end, they say. I've never seen a cloud up close.", age: 'child', to: 3, ch: 'finale' },
          { my: 'အရင်က ဒီလမ်းကို ဘယ်သူမှ မလာဘူး။ အခု ခြေရာတွေ ပြည့်နေပြီ။', en: 'Nobody used to come down this road. Now it is full of footprints.', from: 4, ch: 5 },
          { my: 'မိုးရေက လမ်းပေါ်မှာ မြစ်လေးတွေ ဖြစ်နေတယ်။ ကလေးတွေကတော့ ပျော်နေကြတယ်။', en: "The rain's made little rivers on the road. The kids love it.", days: [12], ch: 19 },
        ],
      },
      goatField: {
        at: { x: -4.6, z: 183.4, r: 4 },
        lines: [
          { my: 'ဆိတ်ကို ကြိုးရှည်ရှည်နဲ့ ချည်ထားတယ်။ တိုရင် စိတ်ညစ်တတ်တယ်။', en: 'I tie the goat on a long rope. Too short and she frets.', age: ['adult', 'elder'], ch: 7 },
          { my: 'ဆိတ်က ဘာလို့ အမြဲဝါးနေတာလဲ။ ဗိုက်လေးခန်း ရှိလို့တဲ့! တကယ်လား။', en: 'Why is the goat always chewing? Four stomachs, they say! Really?', age: 'child', ch: 3 },
          { my: 'ကြက်ကလေးတွေ ကြီးလာရင် ကိုယ့်အစာ ကိုယ်ရှာတယ်။ နောက်က လိုက်မနေဘူး။', en: "Once the chicks grow, they find their own food. I don't trail after them.", age: 'elder', ch: 7 },
          { my: 'ကြက်ဥ ပိုရင် အိမ်နီးချင်းကို ပေးတယ်။ မပိုရင် မပေးဘူး။ ရှင်းတယ်။', en: 'Spare eggs go to the neighbours. None spare, none given. Simple.', ch: 6 },
          { my: 'ဆိတ်က မိုးကို မကြိုက်ဘူး။ ငါကတော့ ကြိုက်တယ်။ လူတိုင်း မတူဘူးလေ။', en: 'The goat hates rain. I love it. Not everyone is the same.', age: 'child', days: [12], ch: 5 },
          { my: 'ဈေးဖွင့်ကတည်းက ကြက်ဥ လာမေးကြတယ်။ ရှိသလောက်ပဲ ရောင်းတယ်။', en: 'Since the market opened, people come asking for eggs. I sell only what I have.', from: 4, age: ['adult', 'elder'], ch: 6 },
        ],
      },
      tyreKids: {
        at: { x: -1, z: 199, r: 4 },
        lines: [
          { my: 'ဘီးလုံးက ငါ့ထက်မြန်တယ်။ ဘယ်ကွေ့ရမလဲတော့ ငါပဲ သိတယ်။', en: 'The tyre is faster than me. But only I know where to turn.', age: 'child', ch: 11 },
          { my: 'လဲရင် ထ။ ဘီးလုံး ပြန်ကောက်။ ဒါပဲ။', en: 'Fall down, get up, pick up the tyre. That is it.', age: 'child', ch: 1 },
          { my: 'နင်နိုင်တာ ဝမ်းသာတယ်။ …နည်းနည်းတော့ မနာလိုဘူး။', en: "I'm glad you won. …A little jealous, too.", age: 'child', ch: 10 },
          { my: 'တုတ်နဲ့ ဘီးလုံးတွန်းနည်း ငယ်ငယ်က အဖေ သင်ပေးတာ။', en: 'Dad taught me to roll a tyre with a stick when I was little.', age: 'child', ch: 23 },
          { my: 'ညီလေးက ဘီးလုံး မထိန်းနိုင်သေးဘူး။ ငါ ဖြည်းဖြည်း ပြေးပေးတယ်။', en: "My little brother can't steer the tyre yet. I run slowly for him.", age: 'child', ch: 9 },
          { my: 'ကလေးတွေ ပြိုင်တာ ကြည့်ရတာ ကောင်းတယ်။ ရှုံးတဲ့သူက အကျယ်ဆုံး ရယ်တယ်။', en: 'I love watching the kids race. The loser laughs loudest.', age: 'adult', ch: 1 },
          { my: 'မိုးရွာတော့ ဘီးလုံးက ရွှံ့ထဲ ချော်သွားတယ်။ ပိုပျော်တယ်!', en: 'In the rain the tyre slides through the mud. Even more fun!', age: 'child', days: [12], ch: 19 },
        ],
      },
      bikeFix: {
        at: { x: 16.2, z: 223, r: 4 },
        lines: [
          { my: 'ဘီးပေါက်တာ ဘယ်သူ့အပြစ်မှ မဟုတ်ဘူး။ ဖာရုံပဲ။', en: "A flat tyre isn't anyone's fault. You just patch it.", ch: 2 },
          { my: 'ဖာပေးရုံ မဟုတ်ဘူး။ ဖာနည်းပါ ပြပေးတယ်။', en: "He doesn't just patch it. He shows you how.", ch: 9 },
          { my: 'လေပြည့်နေရင် ချိုင့်ကို သိပ်မခံစားရဘူး။', en: "Keep the tyres full and you hardly feel the potholes.", ch: 11 },
          { my: 'ချိန်းကြိုး ဘာလို့ ချော်လဲ မေးတော့ အကုန်ရှင်းပြတယ်။', en: 'I asked why the chain slips. He explained the whole thing.', age: 'child', ch: 3 },
          { my: 'အသစ်ဝယ်မလို့ပဲ။ ဦးလေးက "မပျက်သေးပါဘူး" တဲ့။', en: 'I was going to buy a new one. He said, "It\'s not broken yet."', ch: 5 },
          { my: 'မိုးထဲစီးရင် ဘရိတ်ကို စောစောဆွဲ။ ဦးလေး သင်ပေးတာ။', en: 'Riding in the rain, brake early. He taught me that.', days: [12], ch: 23 },
        ],
      },
      sundryShop: {
        at: { x: 3, z: 240.5, r: 4 },
        lines: [
          { my: 'ခရီးသွားတွေ ဒီမှာ ရေဝယ်တယ်။ ကိုယ့်ဘူး ကိုယ်ဖြည့်မှ ဆက်လျှောက်နိုင်တာ။', en: 'Travellers buy water here. Fill your own bottle, then you can go on.', ch: 6 },
          { my: 'အကြွေးကို ပေးနိုင်သလောက်ပဲ ပေးတယ်။ စိတ်မပူရအောင်။', en: 'I give credit only as far as I can spare. So I never fret about it.', age: ['adult', 'elder'], ch: 6 },
          { my: 'ဈေးထဲမှာ ပိုပေါတယ်တဲ့။ ငါကတော့ ဒီမှာပဲ။ ဆိုင်ရှင် ပြုံးလို့။', en: "They say it's cheaper at the market. I buy here. She smiles.", age: 'elder', ch: 7 },
          { my: 'လမ်းဆုံးမှာ ဆိုင်ဖွင့်တာ ရူးလားတဲ့။ စောင့်ကြည့်၊ လူလာမှာ။', en: 'Mad to open a shop where the road ends, they said. Wait. People will come.', to: 3, ch: 5 },
          { my: 'ပြောသားပဲ။ လမ်းက ဒီမှာ မဆုံးဘူးလို့။', en: "Told you. The road didn't end here.", from: 4, ch: 5 },
          { my: 'ဈေးမဝင်ခင် ဒီမှာ ခဏထိုင်တယ်။ စိတ်ငြိမ်မှ ဈေးဆစ်တတ်တာ။', en: 'I sit here a while before the market. You bargain better when you are calm.', from: 4, ch: 11 },
          { my: 'ထီးကုန်ပြီ။ ဝါးဦးထုပ်ပဲ ကျန်တယ်။ ရှိတာနဲ့ ကာရတာပဲ။', en: 'Umbrellas sold out. Only bamboo hats left. You make do with what there is.', days: [12], ch: 19 },
        ],
      },
      crease: {
        at: { x: 7, z: 254, r: 5 },
        lines: [
          { my: 'ဒီအစွန်းကနေ တိမ်တွေကြည့်ရတာ ကြိုက်တယ်။ ဘာမှ မရေးရသေးတာ လှတယ်။', en: 'I like looking at the clouds from this edge. Nothing written yet. It is lovely.', age: 'elder', to: 3, ch: 5 },
          { my: 'အစွန်းကနေ စက္ကူလေယာဉ် လွှတ်လိုက်တယ်။ ဘယ်ရောက်သွားလဲ မသိဘူး။', en: 'I launched a paper plane off the edge. No idea where it went.', age: 'child', to: 3, ch: 7 },
          { my: 'ခေါက်ရိုးက ပိုင်းခြားတာ မဟုတ်ဘူး။ ဆက်ပေးတာ။', en: "A crease doesn't divide. It joins.", from: 4, ch: 'finale' },
          { my: 'လှည်းဘီး ဒီခေါက်ရိုးမှာ ငြိတတ်တယ်။ ဖြည်းဖြည်းတွန်းရင် ကျော်တယ်။', en: "Cart wheels catch on this crease. Push slowly and you're over.", from: 4, ch: 1 },
          { my: 'တိမ်ပဲ ရှိခဲ့တဲ့နေရာမှာ ဈေးကြီး ပေါ်လာတယ်။ ဘာမှ အမြဲ မဟုတ်ဘူး။', en: 'A whole market where there was only cloud. Nothing stays fixed.', from: 4, ch: 5 },
          { my: 'ဈေးထဲ မဝင်ခင် ပိုက်ဆံအိတ်ထက် စိတ်ကို အရင်စစ်။', en: 'Before the market, check your heart before your purse.', age: 'elder', from: 4, ch: 6 },
          { my: 'ခေါက်ရိုးမှာ မိုးရေ ဝပ်နေတယ်။ ခုန်ကျော်ရုံပဲ။', en: "Rain's pooled in the crease. Just hop it.", days: [12], ch: 19 },
        ],
      },
    },

    rooms: {},

    pairs: [
      { who: ['*', '*'], age: ['child', 'elder'], when: { to: 3 }, lines: [
        { my: 'အဘ၊ လမ်းအဆုံးမှာ ဘာရှိလဲ။', en: "Grandpa, what's at the end of the road?" },
        { my: 'တိမ်တွေ။', en: 'Clouds.' },
        { my: 'တိမ်ရဲ့ ဟိုဘက်မှာရော။', en: 'And past the clouds?' },
        { my: 'မသိဘူး။ မရေးရသေးတာ ဖြစ်မှာပေါ့။', en: "Don't know. Something not written yet, I suppose." },
      ], ch: 5 },
      { who: ['*', '*'], when: { from: 4 }, lines: [
        { my: 'ဈေးကို ဆန်တစ်အိတ် ပို့ခဲ့တယ်ဆို။', en: 'I hear you sent a sack of rice down to the market.' },
        { my: 'ပို့ခဲ့တယ်။ ဘယ်သူစားလဲ မမေးဘူး။', en: "I did. I don't ask who eats it." },
        { my: 'စိတ်အေးတာပဲ။', en: 'That keeps the heart cool.' },
      ], ch: 6 },
      { who: ['*', '*'], age: ['adult', 'child'], lines: [
        { my: 'ဒီစာ ဘယ်သူ့ဆီလဲ။', en: "Who's this letter for?" },
        { my: 'သူငယ်ချင်းဆီ။ ပြန်မရေးလည်း ရတယ်။', en: "My friend. It's fine if she doesn't write back." },
        { my: 'ဘာလို့လဲ။', en: 'Why?' },
        { my: 'ငါ ရေးချင်လို့ ရေးတာလေ။', en: 'I write because I want to.' },
      ], ch: 7 },
      { who: ['*', '*'], lines: [
        { my: 'ဒီဝန် လေးလိုက်တာ။', en: 'This load is so heavy.' },
        { my: 'ခဏချ။ ရေသောက်။ ပြီးမှ ဆက်။', en: 'Set it down. Drink. Then go on.' },
        { my: 'နားလို့ရမှန်း အရင်က မသိဘူး။', en: "I never knew I was allowed to rest." },
      ], ch: 6 },
      { who: ['*', '*'], age: ['child', 'child'], lines: [
        { my: 'ဘီးလုံး ပြိုင်ရအောင်။', en: 'Race the tyres?' },
        { my: 'နင် အမြဲနိုင်တယ်။', en: 'You always win.' },
        { my: 'ဒါဆို မနေ့က နင့်ကိုယ်နင် ပြိုင်လေ။', en: "Then race yesterday's you." },
      ], ch: 1 },
      { who: ['*', '*'], when: { from: 4 }, lines: [
        { my: 'လမ်းဆုံးတယ်လို့ အားလုံး ပြောခဲ့ကြတာ။', en: 'Everyone said the road ended.' },
        { my: 'ကိုယ်တိုင် သွားကြည့်ခဲ့လား။', en: 'Did you go and look yourself?' },
        { my: 'မကြည့်ခဲ့ဘူး။ ဒါကြောင့် အခုမှ အံ့သြနေတာ။', en: "No. That's why I'm so surprised now." },
      ], ch: 'finale' },
      { who: ['*', 'mpekyi'], lines: [
        { my: 'ဒီဘီး ဘယ်တော့ ထပ်ပေါက်မလဲ။', en: 'When will this tyre go flat again?' },
        { my: 'မသိဘူး။ လမ်းကို ငါ မပိုင်ဘူး။', en: "Who knows. I don't own the road." },
        { my: 'ဒါဆို ဘာလုပ်ရမလဲ။', en: 'So what do I do?' },
        { my: 'ဖာနည်း သင်ထားလိုက်။', en: 'Learn to patch.' },
      ], ch: 11 },
      { who: ['*', '*'], when: { days: [12] }, lines: [
        { my: 'မိုးကြောင့် ကြက်ခြံ ယိုသွားပြီ။', en: "The rain's got into the henhouse." },
        { my: 'စိတ်ညစ်စရာပဲ။', en: 'What a bother.' },
        { my: 'မိုးက ငါ့ကို ရွေးရွာတာ မဟုတ်ဘူး။ ဖာရုံပဲ။', en: "The rain didn't pick me. I'll just patch it." },
      ], ch: 19 },
      { who: ['*', '*'], age: ['child', 'adult'], when: { from: 9, flag: 'd7.bridge' }, lines: [
        { my: 'တံတားသစ်ပေါ်မှာ ကြောက်တယ်။', en: "I'm scared on the new bridge." },
        { my: 'ကြောက်တာ ရတယ်။ နောက်ပြန် မလှည့်ရင် ပြီးတာပဲ။', en: "Being scared is fine. As long as you don't turn back." },
      ], ch: 11 },
    ],

    arrive: {
      first: { my: '(စာအိတ်ပေါ်က လမ်း။ ဘယ်သူ့ဆီ ပို့နေတဲ့ စာလဲ မသိဘူး။ ကျွန်မလား။)', en: "(A road on an envelope. Whose letter is it? Mine?)", by: 'maya', ch: 7 },
      again: [
        { my: '(လမ်းက စာမျက်နှာအစွန်းမှာ ရပ်တယ်။ ဆက်မရေးရဘူး မဟုတ်ဘူး။)', en: "(The road stops at the page's edge. That doesn't mean nothing more gets written.)", by: 'maya', area: 'crease', to: 3, ch: 5 },
        { my: '(ဒီလမ်းအဆုံးမှာ တိမ်ပဲ ထင်ခဲ့တာ။ အခု ဈေးတစ်ခုလုံး။)', en: "(I once thought this road ended in cloud. Now there's a whole market.)", by: 'maya', area: 'crease', from: 4, ch: 5 },
        { my: '(စာအိတ်လမ်း ပြန်ရောက်ပြီ။ ပို့ချင်တာ ပို့၊ ပြီးရင် လွှတ်လိုက်။)', en: '(The envelope road again. Send what you mean to send, then let it go.)', by: 'maya', from: 3, ch: 7 },
      ],
    },
  },
};

export default LINES_A;
