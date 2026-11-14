// Ambient chatter, part C: Hearth Row (district `hearth`, opens Day 9), the Diary Garden (`garden`, opens Day 10)
// and the Blank Page with the Back Cover (`blank`, opens Day 13; the Back Cover opens Day 14).
// Owner's request: "add dialogs for specific areas and towns". Pure data, no imports. Every Burmese line is a
// DRAFT for Maya to proofread (spoken, colloquial). The review copy is previews/dialogue-C.md.
//
// HARD RULES these lines keep (INDEX 14 lesson map; every day spec's "they hint, never point"):
//   - every line carries or hints at the lesson of its place's chapter(s), never as a lecture:
//       hearth: ch 14 (nobody unhappy because of you; "rough mouth, good heart" is a cover; heat burns its owner
//               first), ch 15 (a good friend helps with the trouble no eye sees, listens, like finds like;
//               squabbles: each mends their own tone), ch 18 (pass hot words by; not chosen is not bad; time is
//               fast; tell a mistake quietly; when goodwill is laughed at, change your own thought; keep your
//               standard; one likeable thing doesn't make all of it right), ch 21 (know your touchy spot; ask first;
//               look for the cause; it is your own job)
//       garden: ch 16 (alone isn't wrong; connect, don't entwine; nothing stays; hearing is not listening; a
//               steady mind), ch 17 (plenty is not ease; sleep calm, look the buyer in the face), ch 19 (trouble
//               comes uninvited and to everyone; how I take it is mine; never "only me"), ch 20 (catch the first
//               rattle; patience is proved under test; compassion for those who don't know yet, gladness for those
//               ahead; a wrong that cheats the next buyer goes as facts through the proper door)
//       blank:  ch 22 (test it yourself; what you want from others, keep yourself; no extremes; quiet shows what
//               is), ch 23 (name your sources), finale (a map only shows the road; each walks it)
//   - NO guidance: no line tells the player where to go, whom to see or what to do for a quest. Opinions, gossip,
//     feelings, daily life and reactions to what has already happened only.
//   - no pagoda / monastery / monk / Buddha; nothing private about Maya or the owner.
//   - short bubbles (Burmese about 40 characters where possible); overheard pairs are 2-4 bubbles.
//
// SHAPE (as the job asks):
//   LINES_C[districtId] = {
//     town:  [ line ]                         single bubbles from passers-by and townspeople
//     areas: { areaId: { at: {x, z, r}, lines: [ line ] } }   world metres, centre + radius (from the region files)
//     rooms: { roomId: [ line ] }             background people inside (room ids from js/story/rooms/*.js)
//     pairs: [ { who: [jobA, jobB], lines: [ {my, en}, ... ], when? } ]   bubbles alternate A, B, A, B
//     arrive: { first: line, again: [ line + { area? } ] }      Maya's own thought (in brackets, as the days write it)
//   }
//   line = { my, en, ...tags }
//
// TAGS (all optional; a line with none can play any day its district is open):
//   days: [n, ...]   only on these days                 from: n   on day n and later      to: n   up to day n
//   flag: 'id' | ['id', ...]   only once every flag is set (save flags, e.g. 'd9.ch14Done', world gate 'creaseMended')
//   unless: 'id' | ['id', ...] only while none of them is set
//   job:  who says it: vendor, baker, kid, teen, elder, aunty, uncle, worker, weaver, gardener, carter, potter,
//         buyer, diner, pupil, customer, traveller, keeper, guest (lodge), visitor (rooms) or 'maya' (thoughts).
//         Missing = anyone. 'traveller' is a passer-by, never one of Day 13's three (they have their own lines).
//   pairs use `when: { days?, from?, to?, flag?, unless? }` with the same meanings.
// Day-aware lines only react to what has already happened (the flag that proves it, or a later day); none of them
// gives away a later beat. Day 12 is the rain day everywhere (days: [12]).

const L = (my, en, t = {}) => ({ my, en, ...t });

// ===================================================================================================================
// HEARTH ROW  (regions/hearth.js: the Row runs west -> east on z 200; north fronts z 197.4, south fronts z 202.9)
// ===================================================================================================================
const HEARTH = {
  town: [
    // the Row's everyday voice (chapters 14, 15, 18, 21)
    L('ပူတဲ့ဒယ်အိုးကို လက်ဗလာနဲ့ မကိုင်နဲ့။ စကားလည်း ဒီလိုပဲ။', "Don't grab a hot pan bare-handed. Same with words.", { job: 'vendor' }),
    L('စိတ်ကောင်းရှိရင် စကားလည်း ကောင်းကောင်း ပြောလို့ရတာပဲ။', "If the heart's good, the words can be good too.", { job: 'elder' }),
    L('ကျုပ်ကြောင့် တစ်ယောက်ယောက် ညအိပ်မပျော်ရင် မကောင်းဘူး။', "If someone can't sleep because of me, that's no good.", { job: 'aunty' }),
    L('အမေက မအော်ဘဲ ပြောရင် ပိုနားထောင်ချင်တယ်။', "When Mum tells me without shouting, I want to listen more.", { job: 'kid' }),
    L('ပြုံးနေတိုင်း အဆင်ပြေတာ မဟုတ်ဘူးနော်။', "Smiling doesn't always mean fine, you know.", { job: 'teen' }),
    L('သူငယ်ချင်းကောင်း လိုချင်ရင် ကိုယ်က အရင် ဖြစ်ရမှာ။', 'Want a good friend? Be one first.', { job: 'elder' }),
    L('ကျုပ်သူငယ်ချင်းတွေ အကုန် စကားများတဲ့ လူတွေ။ ကျုပ်လိုပေါ့။', "My friends are all the chatty sort. Like me, I suppose.", { job: 'aunty' }),
    L('ဆယ်နှစ်ဆိုတာ ကြားရတာပဲ ကြာတာ။ စလိုက်ရင် မြန်မြန်ကုန်တယ်။', 'Ten years only sounds long. Start, and they fly.', { job: 'worker' }),
    L('ကျုပ် မကြိုက်တဲ့ဟင်း ဘေးဆိုင်မှာ ရောင်းကောင်းတယ်။', "The dish I don't like sells well next door.", { job: 'vendor' }),
    L('လူကြိုက်များတဲ့သူ ပြောတိုင်း မှန်တာ မဟုတ်ဘူး။ ချိန်ကြည့်ရတယ်။', "Not everything a well-liked person says is right. You weigh it.", { job: 'elder' }),
    L('မကြိုက်တဲ့ စာရွက်မြင်ရင် ကျော်လျှောက်လိုက်တယ်။ ပူစရာ မလိုဘူး။', "If I see a note I don't like, I walk past. No need to heat up.", { job: 'teen' }),
    L('ကျုပ်အမှားကို တိုးတိုးလေး လာပြောတဲ့သူကို ကျေးဇူးတင်တယ်။', "I'm grateful to whoever tells me my mistake quietly.", { job: 'aunty' }),
    L('ကျုပ်စေတနာကို နားမလည်ရင် ရှင်းရှင်းလေး ထပ်ပြောတယ်။', "If they don't get my goodwill, I explain again, plainly.", { job: 'worker' }),
    L('ဘယ်သူနဲ့မဆို တွဲမှာ မဟုတ်ဘူး။ ကိုယ့်စံ ကိုယ်ရှိတယ်။', "I won't go about with just anyone. I've got my own standard.", { job: 'teen' }),
    L('လူတိုင်းမှာ ဆတ်ဆတ်ထိမခံတဲ့ နေရာလေး ရှိတယ်။', 'Everyone has one touchy spot.', { job: 'elder', from: 13 }),
    L('ကိုယ် ဘာကို စိတ်တိုလွယ်လဲ သိထားရင် တစ်ဝက် ပြီးပြီ။', 'Know what you flare up at, and you are halfway there.', { job: 'worker', from: 13 }),
    L('မုန်းတဲ့အရာ ဘာကြောင့်ဖြစ်လဲ ရှာကြည့်ရင် အမုန်း လျော့တယ်။', 'Look into why the thing you hate happens, and the hate eases.', { job: 'aunty', from: 13 }),
    // reactions (only once the thing has happened)
    L('ပေါင်မုန့်တွေ လှိမ့်ကုန်တော့ လမ်းတစ်လမ်းလုံး ထွက်ကူတယ်။', 'When the loaves rolled, the whole street came out to help.', { job: 'worker', flag: 'd9.cart' }),
    L('အာကာ့လှည်း အခု မမှောက်တော့ဘူး။ အလေးတွေ အောက်မှာ။', "Arkar's cart doesn't tip any more. Heavy stuff at the bottom.", { job: 'kid', from: 10 }),
    L('ဒီနေ့ မုန့်ဖိုက အော်သံ မကြားရဘူး။ မုန့်ကတော့ ကောင်းတုန်းပဲ။', "No shouting from the bakery today. The bread's as good as ever.", { job: 'aunty', flag: 'd9.ch14Done', days: [9] }),
    L('ဒေါ်ခင်မေ အော်တာ ရပ်သွားတော့ ကောင်လေး ပိုပြုံးလာတယ်။', 'Since Daw Khin May stopped shouting, the lad smiles more.', { job: 'elder', from: 10, flag: 'd9.ch14Done' }),
    L('အိမွန်နဲ့ အာကာ အတူ ထမင်းစားနေကြတာ မြင်တယ်။', 'Saw Ei Mon and Arkar eating together.', { job: 'teen', from: 10, flag: 'd9.friendDone' }),
    L('ညနေတန်းမှာ ကလေးရော လူကြီးရော ထိုင်ကြတာ။', 'Kids and grown-ups both sit in the evening class.', { job: 'worker', from: 10 }),
    L('နံရံမှာ တစ်ညတည်းနဲ့ စာခုနစ်စောင်။ လမ်းတစ်လမ်းလုံး ပူနေတယ်။', "Seven notes on the wall overnight. The whole street's hot.", { job: 'vendor', days: [11], unless: 'd11.ch18Done' }),
    L('နံရံကို ဖတ်ရင် ပူတယ်။ မဖတ်ရင် အေးတယ်။ ရိုးရိုးလေးပဲ။', "Read the wall, you heat up. Don't, you stay cool. Simple.", { job: 'elder', days: [11], unless: 'd11.ch18Done' }),
    L('ဆိုင်းဘုတ် ပြင်ပြီးပြီ။ တိုးတိုးပြောတဲ့ တစ်ခွန်းနဲ့။', 'The sign is fixed. One quiet word did it.', { job: 'worker', flag: 'd11.p4' }),
    L('ပန်းလေး အပင် မြေထဲ စိုက်လိုက်ပြီ! "တစ်နေ့ကျရင်" မဟုတ်တော့ဘူး။', "Pan planted his tree! Not 'someday' any more.", { job: 'kid', flag: 'd11.p3' }),
    L('ချယ်ရီ တစ်ယောက်တည်း ဆိုတာ ကြားလိုက်လား။ လှတယ်။', 'Did you hear Cherry sing on her own? Lovely.', { job: 'teen', flag: 'd11.p6' }),
    L('ဦးစံရှားဘူး တစ်လုံး ကျောင်းသားကြီး တစ်ယောက် ယူသွားတယ်။', "One of the big pupils took one of U San Shar's boxes.", { job: 'kid', flag: 'd11.p5' }),
    L('နံရံထိပ်က စာရွက်ထောင့်တွေ မနေ့က ကော့နေတာ။ မိုးလာမှာ မှန်တယ်။', 'The paper corners on the wall curled yesterday. The rain was coming, right enough.', { job: 'worker', days: [12] }),
    L('မိုးက ဘယ်သူ့အမိုးကိုမှ ရွေးမရွာဘူး။ ကျုပ်လည်း ရေခံထားတယ်။', "The rain doesn't pick whose roof. I'm catching it like everyone.", { job: 'aunty', days: [12] }),
    L('ရုံဘက်က မနေ့ညက ရယ်သံ ကြားတယ်။ ရယ်စရာ မဟုတ်ဘူး ထင်တယ်။', "Heard laughing from the shed last night. Didn't sound like anything to laugh at.", { job: 'elder', days: [13], unless: 'd13.ch21Done' }),
    L('အခု လမ်းထဲက ကလေးတွေတောင် "ကိုင်လို့ရလား" မေးကြတယ်။', "Even the kids on the street ask 'may I touch?' now.", { job: 'elder', flag: 'd13.ch21Done' }),
    L('မိုးမလင်းခင်ကတည်းက မုန့်ဖို မီးခိုး တက်နေတယ်။ စိတ်ပါလက်ပါပဲ။', "The bakery's smoke has been up since before dawn. Baking with her whole heart.", { job: 'vendor', days: [14] }),
    L('ဒီည ပွဲရှိတယ်တဲ့။ အစ်မတွေပါ ခေါ်သွားမယ်။ အတူမှ ပျော်တာ။', "There's a do tonight, they say. I'm bringing my sisters. It's only fun together.", { job: 'aunty', days: [15] }),
  ],

  areas: {
    // the Note Wall (WALL 152.6, 196.6, 7.2 m long)
    noteWall: { at: { x: 152.6, z: 197.2, r: 5 }, lines: [
      L('နံရံမှာ ကပ်ထားတိုင်း အမှန် မဟုတ်ဘူး။', 'Not everything pinned up is true.'),
      L('စာရွက်ပေါ်က စကားက မျက်နှာမပါတော့ ပိုကြမ်းတယ်။', 'Words on paper are harsher with no face behind them.'),
      L('ဒီနံရံမှာ အရင်က ပွဲသတင်းနဲ့ ပျောက်တဲ့ကြောင်ပဲ ကပ်တာ။', 'This wall used to hold fair notices and lost cats.', { days: [9, 10] }),
      L('ကိုယ်တိုင် မမြင်ဘဲ ပင်တစ်ချောင်း ထပ်ထိုးတာ လွယ်တယ်နော်။', 'Easy to add a pin without having seen it yourself, eh.', { days: [11], unless: 'd11.ch18Done' }),
      L('ကျုပ်လည်း တစ်စောင် ကပ်ချင်တယ်… မကပ်ခင် သူ့ကို အရင် ပြောမယ်။', 'I wanted to pin one too… I will say it to her face first.', { days: [11], unless: 'd11.ch18Done' }),
      L('နံရံ ငြိမ်သွားပြီ။ သုံးစောင်ပဲ ကျန်တယ်၊ အရောင်လည်း ဖျော့ပြီ။', "The wall's calm. Three notes left, and faded.", { flag: 'd11.ch18Done' }),
      L('မိုးရေနဲ့ နံရံက မှင်တွေ ပျော်ကုန်ပြီ။ အပူလည်း ပါသွားတယ်။', "The rain's washed the ink off the wall. The heat went with it.", { days: [12] }),
      L('အခု နံရံမှာ "ကျေးဇူးတင်ပါတယ်" စာရွက်တွေ ကပ်လာကြတယ်။', "Now people pin up 'thank you' notes on the wall.", { from: 13, flag: 'd11.ch18Done' }),
    ] },
    // the bakery front and the scorch ring (BAKERY door 141, 197.55; ring 142.8, 199.6)
    bakeryFront: { at: { x: 141.6, z: 199.0, r: 4 }, lines: [
      L('ပေါင်မုန့်နံ့ ရရင် ကျုပ် ခြေလှမ်း နှေးသွားတယ်။ စိတ်လည်း နွေးတယ်။', 'Smell that bread and my feet slow down. My heart warms too.'),
      L('အထဲက အော်သံ? လမ်းက နားယဉ်နေပြီ။ ယဉ်တာနဲ့ ကောင်းတာ မတူဘူး။', "Shouting inside? The street's used to it. Used to isn't the same as good.", { days: [9], unless: 'd9.ch14Done' }),
      L('မုန့်ကောင်းရင် အော်လို့ရသလား။ ကောင်လေးကတော့ ဘာမှမပြောဘူး။', 'Good bread makes shouting all right? The lad never says.', { days: [9], unless: 'd9.ch14Done' }),
      L('ဘီးတစ်ဘီး ကျတာနဲ့ လူငါးယောက် ကူကောက်တယ်။ ဒီလမ်းကို ချစ်တယ်။', 'One wheel drops and five people help pick up. I love this street.', { flag: 'd9.cart' }),
      L('ဒီနေ့ အပူက မီးဖိုကပဲ ထွက်တယ်။ လူဆီက မထွက်တော့ဘူး။', 'Today the heat comes from the oven. Not from people.', { flag: 'd9.ch14Done' }),
      L('အာကာက အလေးဆုံးဗန်းကို အောက်ဆုံး ထားတတ်ပြီ။', "Arkar's learnt to put the heaviest tray at the bottom.", { from: 10 }),
      L('ဗန်းပေါ်မှာ "အမေ့ မုန့်လုံး" တဲ့။ ဘယ်ကရလဲ ရေးထားတာ လှတယ်။', "'Mother's round loaf', says the tray. Nice that she wrote where the recipe came from.", { days: [14], flag: 'd14.inv.hearth' }),
      L('မုန့်ဖို စောစော ပိတ်တယ်။ ပွဲအတွက် မုန့်တွေ ကိုယ်တိုင် သယ်သွားတာ။', 'The bakery shut early. She carried the bread for the do herself.', { days: [15] }),
    ] },
    // behind the bakery: the yard and the back step (yard 139, 188.2; sack seat 134.2, 188.2)
    backYard: { at: { x: 138.6, z: 188.4, r: 4 }, lines: [
      L('ဒီနောက်ဖေးက တိတ်တယ်။ ဘယ်သူမှ မမြင်တဲ့နေရာ။', "It's quiet back here. A place nobody sees."),
      L('ရင်ထဲက အလေးကို မျက်စိနဲ့ မမြင်ရဘူး။ နားနဲ့မှ ကြားရတာ။', "You can't see what weighs on a chest. You hear it."),
      L('ဒီဂုံနီအိတ်ပေါ်မှာ အခု နှစ်ယောက် ထိုင်တယ်။', 'Two sit on this sack now.', { flag: 'd9.friendDone' }),
      L('အလုပ်ပြီးရင် သူတို့ ဒီမှာ စကားပြောကြတယ်။ ကျုပ် နားမထောင်ဘူး။', "After work they talk out here. I don't listen in.", { from: 10 }),
      L('အချို့ ဒေါသက မီးဖိုလိုပဲ။ အပြင်က ငြိမ်ပေမဲ့ အထဲက ပူတယ်။', "Some anger's like an oven. Calm outside, hot inside.", { days: [13], unless: 'd13.ch21Done' }),
      L('အဖုံးအုပ်ထားတာကို မလှပ်ခင် မေးတာ… ဒါလေးတင်ပဲ။', "Asking before you lift a cover… that's all it takes.", { flag: 'd13.ch21Done' }),
    ] },
    // the noodle house front, red lantern (soup) and blue (dry) (NOODLE door 140, 202.75; kerb pot 142.8, 201.7)
    noodleKerb: { at: { x: 140.8, z: 203.4, r: 4 }, lines: [
      L('ဟင်းချိုကြိုက်သူ ဘယ်ဘက်၊ ခြောက်ကြိုက်သူ ညာဘက်။ နှစ်ဘက်လုံး ပြည့်တယ်။', 'Soup folk on the left, dry folk on the right. Both full.'),
      L('ငါမကြိုက်တဲ့ဘက်လည်း တန်းစီနေတာပဲ။ မကောင်းလို့ မဟုတ်ဘူး။', "There's a queue on the side I don't like too. Not because it's bad."),
      L('ပူပူနွေးနွေး တစ်ပွဲ စားပြီးရင် လူတွေ စကား ပိုနူးလာတယ်။', "One hot bowl and people's words get softer."),
      L('လှည်းမှောက်တုန်း မရယ်ဘဲ ကြည့်နေတဲ့သူ တစ်ယောက် ရှိတယ်။', 'When the cart tipped, one person watched without laughing.', { days: [9], flag: 'd9.cart' }),
      L('အိမွန်က အာကာ့အတွက် ဟင်းချို တစ်ပွဲ အမြဲ ချန်ထားတယ်။', 'Ei Mon always keeps a bowl of soup for Arkar.', { from: 10, flag: 'd9.friendDone' }),
      L('ဘယ်ဟာ မှန်လဲတဲ့။ ခေါက်ဆွဲမှာ အမှန် အမှား ရှိလို့လား။', 'Which is right? Since when do noodles have a right and a wrong?', { days: [11], unless: 'd11.p2' }),
      L('နှစ်ဆိုင်လုံး ကောင်းတယ်။ ကိုယ့်ဗိုက်က တစ်ခုပဲ ရွေးနိုင်တာ။', 'Both counters are good. Your belly can only pick one.', { flag: 'd11.p2' }),
      L('မိုးရွာတော့ ဟင်းချိုဘက် တန်းရှည်တယ်။ နေပူရင် ပြန်ပြောင်းမှာပဲ။', 'Rain makes the soup queue longer. Sun will swap it back.', { days: [12] }),
    ] },
    // the lamp-mender's bench (131, 203.5)
    lampBench: { at: { x: 131.0, z: 203.5, r: 3 }, lines: [
      L('ကိုယ့်အပြစ် ကိုယ်ပြင်ရင် ပိုလင်းတယ်။', 'Mend your own fault and it shines brighter.'),
      L('ဖန်အုပ် ကွဲရင် ဘယ်သူ ခွဲလဲ မမေးဘူး။ ဖာတာပဲ လုပ်တယ်။', "A cracked glass? I don't ask who broke it. I mend it."),
      L('မီးကို အရမ်း မြှင့်ထားရင် ဖန်အုပ် မည်းတယ်။ နည်းနည်း လျှော့။', 'Turn the flame too high and the glass goes black. Ease it down.'),
      L('ဘီးတံ ကြည့်ပေးလိုက်ပြီ။ ဘီးက ကောင်းတယ်။ ဝန်က လွဲနေတာ။', 'I checked the axle. The wheel was fine. It was the load.', { flag: 'd9.cart' }),
      L('ညနေမီးထွန်းချိန်ဆို ဒီလမ်း အကောင်းဆုံး။ ဒေါသတွေ အေးသွားတယ်။', "Lamp-lighting is this street's best hour. Tempers cool.", { from: 11 }),
      L('မိုးထဲ မီးအိမ် ငြိမ်းရင် ပြန်ထွန်းရုံပဲ။ မိုးကို ဆူမနေဘူး။', 'A lamp blows out in the rain, you light it again. No scolding the rain.', { days: [12] }),
    ] },
    // the workshop lane: Daw Nyein's tin-lamp shop (145.4, 216.4), U San Shar's box workshop (150.6, 229)
    workshopLane: { at: { x: 148.0, z: 222.0, r: 7 }, lines: [
      L('သံပြားကို ပူတုန်း ထုရင် ပုံပျက်တယ်။ အေးမှ ထု။', 'Hammer tin while it is hot and it warps. Wait till it cools.'),
      L('ဘူးခေါက်တာ ကြည့်ရတာ ပျင်းစရာ။ လုပ်ကြည့်မှ ခက်မှန်း သိတယ်။', "Folding boxes looks dull. Try it and you'll see it's hard."),
      L('ဒီလမ်းမှာ မမှားဖူးတဲ့သူ မရှိဘူး။ ပြင်တတ်တဲ့သူပဲ ရှိတယ်။', 'Nobody on this lane never makes mistakes. Only people who fix them.'),
      L('ဆိုင်းဘုတ်မှာ စာလုံးတစ်လုံး မှားတယ်။ ပင်ကတော့ အစိတ်လောက် ရှိပြီ။', "One letter's wrong on the sign. And about thirty pins about it.", { days: [11], unless: 'd11.p4' }),
      L('ဆိုင်းဘုတ် ပြင်ပြီးပြီ။ ဒေါ်ငြိမ်း ပြုံးနေတယ်။', "The sign's fixed. Daw Nyein's smiling.", { flag: 'd11.p4' }),
      L('အဘိုးကြီးဘူးတွေ ခေတ်မမီဘူးတဲ့။ ထမင်းပူအောင် ထားတာ ခေတ်မကုန်ဘူး။', "They say the old man's boxes are old-fashioned. Keeping rice hot never goes out of fashion.", { days: [11], unless: 'd11.p5' }),
      L('ဦးစံရှား စိတ်မဆိုးတော့ဘူး။ ခေါက်ပြပြီး ထပ်ရှင်းပြတယ်။', "U San Shar's not cross any more. He folded one and explained again.", { flag: 'd11.p5' }),
    ] },
    // the evening class steps and desk hearthClass (door 153.3, 202.3; desk 156.4, 201.5)
    classSteps: { at: { x: 154.4, z: 203.6, r: 3.5 }, lines: [
      L('သင်တာကို အော်ပြီး သင်စရာ မလိုဘူး။ ဒီမှာ ဘယ်သူမှ မအော်ဘူး။', 'No need to shout to teach. Nobody shouts in here.'),
      L('မသိတာ မေးရတာ ရှက်စရာ မဟုတ်ဘူး။ ဒီတန်းက အဲဒီအတွက်ပဲ။', "Asking what you don't know is nothing to be ashamed of. That's what this class is for."),
      L('ညနေတန်းမှာ အသက် ဘယ်လောက်ဖြစ်ဖြစ် ထိုင်လို့ရတယ်။', 'Any age can sit in the evening class.', { from: 10 }),
      L('ပေါင်မုန့် ဘာလို့ ဖောင်းလဲ သင်တဲ့ည လူပြည့်တယ်။ ဘယ်သူမှ မအော်ဘဲနဲ့။', 'The night they taught why bread rises, it was packed. Not one raised voice.', { from: 11 }),
      L('ပြတင်းခုံပေါ်က အပင်လေး မရှိတော့ဘူး။ အပြင်မှာ စိုက်လိုက်ပြီတဲ့။', "The little tree's gone from the windowsill. Planted outside, they say.", { flag: 'd11.p3' }),
      L('ဘူးကို ယူသွားတဲ့ကောင်က ရယ်ခဲ့တဲ့သူထဲက တစ်ယောက်ပဲ။', 'The boy who took a box was one of the ones who laughed.', { flag: 'd11.p5' }),
    ] },
    // the loom shed front and its dye vats (door 159.9, 197.55; vats 168.7, 194.6)
    loomFront: { at: { x: 162.0, z: 198.6, r: 4.5 }, lines: [
      L('ချည်တစ်ပင် ဆွဲလိုက်ရင် တစ်ထည်လုံး ပျက်တယ်။ မကိုင်ခင် မေး။', 'Pull one thread and the whole cloth is spoilt. Ask before you touch.', { from: 13 }),
      L('ရက်ကန်း သင်စ အတန်းတွေ ကောက်တာပဲ။ ကျုပ်ဟာလည်း ကောက်ခဲ့တာ။', 'Beginners weave crooked rows. Mine were crooked too.', { from: 13 }),
      L('အဖုံးအုပ်ထားတာ မပြီးသေးလို့။ ပြီးမှ ပြမှာပေါ့။', "It's covered because it isn't finished. They'll show it when it is.", { from: 13 }),
      L('လက်မှာ ဆိုးဆေးပေရင် ရက်ချီ မပျောက်ဘူး။ စကားလည်း ဒီလိုပဲ။', 'Dye on your hands stays for days. Words too.', { from: 13 }),
      L('ရုံထဲက ရယ်သံ မနေ့ညက ကြားတယ်။ တစ်ယောက်ကတော့ မရယ်ဘူး ထင်တယ်။', "Laughing in the shed last night. I don't think one of them was laughing.", { days: [13], unless: 'd13.ch21Done' }),
      L('ချိတ်တွေမှာ "အရင်မေးပါ" ကတ်ပြားလေးတွေ။ လှတယ်။', "Little 'ask first' tags on the hooks. Nice.", { flag: 'd13.ch21Done' }),
      L('ရုံထဲမှာ အခု မလှပ်ခင် မေးကြတယ်။ ဘယ်သူမှ မရှက်ရတော့ဘူး။', 'In the shed they ask before lifting now. Nobody gets shamed.', { from: 14 }),
    ] },
    // the common yard on the south kerb, the hopscotch (161, 206.4)
    commonYard: { at: { x: 164.0, z: 206.6, r: 5 }, lines: [
      L('ကျွံသွားရင် အစက ပြန်စ။ ဘယ်သူမှ မအော်ဘူး။', 'Step over the line and start again. Nobody yells.', { job: 'kid' }),
      L('သူငယ်ချင်း လဲရင် မရယ်နဲ့။ ဆွဲထူ။', "Friend falls over? Don't laugh. Pull them up.", { job: 'kid' }),
      L('ဒီနေ့ နင် ပထမ၊ မနက်ဖြန် ငါ။ ဒါပဲ။', "You're first today, me tomorrow. That's all.", { job: 'kid' }),
      L('လှည်းကြီး မှောက်တုန်း ငါ ပေါင်မုန့် နှစ်လုံး ကောက်ပေးတယ်!', 'When the big cart tipped I picked up two loaves!', { job: 'kid', flag: 'd9.cart' }),
      L('ပန်းလေးရဲ့ အပင်ကို ရေလောင်းဖို့ ငါ့အလှည့်!', "My turn to water Pan's tree!", { job: 'kid', flag: 'd11.p3' }),
      L('အကွက်တွေ မိုးရေထဲ ပျောက်ကုန်ပြီ။ မိုးတိတ်ရင် ပြန်ဆွဲမယ်။', "The squares washed away. We'll draw them again when it stops.", { job: 'kid', days: [12] }),
    ] },
    // the street's common oven (198, 194.6)
    commonOven: { at: { x: 198.0, z: 196.0, r: 4 }, lines: [
      L('ဒီမီးဖိုက လမ်းတစ်လမ်းလုံးရဲ့ဟာ။ ဒါကြောင့် အလှည့်ကျ ဖုတ်တယ်။', "This oven is the whole street's. So we take turns."),
      L('ကိုယ့်မုန့် တူးရင် ကိုယ့်မီးကို ကြည့်။ မီးဖိုကို အပြစ်မတင်နဲ့။', "Burn your bread? Watch your own fire. Don't blame the oven."),
      L('ဘေးအိမ်မုန့် ကောင်းရင် ဝမ်းသာတယ်။ ကျုပ်ဟာလည်း ကောင်းလာမှာ။', "When next door's bread comes out well, I'm glad. Mine will too, one day."),
      L('မီးဖိုတန်းက မီးဖိုတွေ နေ့ရော ညပါ တောက်တယ်။', "The Row's ovens burn day and night.", { from: 10 }),
      L('မိုးရွာလည်း မီးဖို မငြိမ်းဘူး။ အမိုးအောက်မှာ အတူ စောင့်ကြတယ်။', "The rain doesn't put the oven out. We wait under the roof together.", { days: [12] }),
      L('ဒီနေ့ မီးဖိုက ဘယ်သူ့အလှည့်မှ မဟုတ်ဘူး။ အကုန် ပွဲအတွက်တဲ့။', "Today the oven's nobody's turn. It's all for the do, they say.", { flag: 'd14.inv.hearth', days: [14] }),
    ] },
    // the Hearth Row tea shop front (TEA door 243, 197.55)
    teaFront: { at: { x: 243.0, z: 199.4, r: 4.5 }, lines: [
      L('လက်ဖက်ရည်ဆိုင်က စကားက ပူတယ်။ လက်ဖက်ရည်ထက်တောင် ပူတယ်။', 'Talk at the tea shop is hot. Hotter than the tea.'),
      L('ဒီဆိုင်မှာ နားထောင်တဲ့သူ ရှိရင် ပြောတဲ့သူ အေးသွားတယ်။', 'When someone in this shop listens, the talker cools down.'),
      L('ကိုယ့်လက်ဖက်ရည် ကိုယ်ပဲ မွှေ။ သူများခွက်ထဲ ဇွန်းမထည့်နဲ့။', "Stir your own tea. Keep your spoon out of other cups."),
      L('နှစ်ယောက်ဆိုရမယ့် သီချင်း၊ တစ်ယောက်ပဲ ပေါ်ပေါ်လာတယ်။', 'A song for two, and only one of them ever turns up.', { days: [11], unless: 'd11.p6' }),
      L('ဖဲကြိုးကို ဘယ်သူမှ မရလိုက်ဘူးတဲ့။ ကောင်းပါတယ်။', 'Nobody got the ribbon in the end, they say. Good.', { flag: 'd11.p4' }),
      L('ချယ်ရီ တစ်ယောက်တည်း ဆိုတဲ့ည ကျုပ် မျက်ရည်ဝဲတယ်။', 'The night Cherry sang alone, I teared up.', { from: 12, flag: 'd11.p6' }),
      L('မိုးရွာတော့ ဆိုင်ပြည့်တယ်။ မသိတဲ့သူချင်း စားပွဲ မျှထိုင်ရတယ်။', 'Rain fills the shop. Strangers share tables.', { days: [12] }),
    ] },
    // Uncle Chit's kite bench and the sunny bare patch (kite 251.6, 195; patch 253.6, 192.6)
    kiteBench: { at: { x: 252.2, z: 194.4, r: 3.5 }, lines: [
      L('စွန်ကျိုးရင် ဖာ။ ဒါမှ နောက်တစ်ခါ ပြန်လွှတ်လို့ရမယ်။', 'Kite broke? Mend it. Then it flies again.', { from: 11 }),
      L('ဦးချစ်ကို ချစ်တယ်။ ချစ်တာနဲ့ ယုံတာ တခြားစီလေ။', 'I love Uncle Chit. Loving and believing are different things.', { from: 11 }),
      L('ဦးချစ်ပြောတာ မှန်တာများတယ်။ အကုန်တော့ မဟုတ်ဘူး။', "Uncle Chit's mostly right. Not always.", { flag: 'd11.p7' }),
      L('ကွင်းလေးထဲက ပန်းလေးအပင်၊ နေ့တိုင်း နည်းနည်းချင်း ကြီးလာတယ်။', "Pan's tree in the bare patch, a little bigger every day.", { from: 12, flag: 'd11.p3' }),
      L('ဦးချစ်ပြောတဲ့ မိုး တကယ် ရွာပြီ။ ဒီတစ်ခါတော့ မှန်တယ်။', 'The rain Uncle Chit talked about came. Right this time.', { days: [12] }),
      L('စွန်တွေ မိုးမိလို့ အကုန် ပြန်ကော်ကပ်ရတယ်။ စိတ်မညစ်ပါဘူး။', "The rain got the kites; every one needs gluing again. I'm not upset.", { from: 13 }),
    ] },
    // the crease lane north to the torn crease (hRowC 172, 200 -> hTear 172, 140.6; gate 'creaseMended')
    creaseLane: { at: { x: 172.0, z: 146.0, r: 7 }, lines: [
      L('ခေါက်ရိုးက စက္ကူရဲ့ အားအနည်းဆုံးနေရာ။ လူမှာလည်း ရှိတာပဲ။', 'A fold is where paper is weakest. People have one too.'),
      L('အပြဲက အစတုန်းက သေးသေးလေး။ ဘယ်သူမှ ဂရုမစိုက်တော့ ကျယ်လာတာ။', "That tear started tiny. Nobody minded it, and it grew.", { unless: 'creaseMended' }),
      L('ဘယ်သူ ချုပ်ပေးသွားလဲ မသိဘူး။ ကျေးဇူးပဲ။', "Don't know who laced it up. Thank you, whoever.", { flag: 'creaseMended' }),
      L('ကြိုးနဲ့ ချုပ်ထားတာ ကြည့်။ ကောက်ပေမဲ့ ခိုင်တယ်။', 'Look at that twine. Crooked, but strong.', { flag: 'creaseMended' }),
      L('ဥယျာဉ်ဘက်က လူတွေ ဒီကနေ ဖြတ်လာကြတယ်။ နီးသွားသလိုပဲ။', 'Garden folk come through here now. Feels closer.', { from: 10, flag: 'creaseMended' }),
      L('မိုးရေ အပြဲထဲ စီးဝင်နေတယ်။ ကြိုးကတော့ ခံနေတုန်းပဲ။', "Rain's running into the tear. The twine's holding.", { days: [12], flag: 'creaseMended' }),
    ] },
    // the road north from the Row's east end to the great clasp (hRowE 258, 200 -> hClasp 258, 138)
    claspRoad: { at: { x: 258.0, z: 168.0, r: 12 }, lines: [
      L('ကျုပ်ကတော့ ပိတ်ထားတဲ့တံခါးကို အတင်း မခေါက်ဘူး။', 'Me, I never pound on a shut door.'),
      L('ဒိုင်ယာရီချိတ်ကြီး ပိတ်နေတုန်းပဲ။ ပွင့်ချင်တဲ့အချိန် ပွင့်မှာပေါ့။', "The great clasp's still shut. It'll open when it opens.", { days: [9] }),
      L('ချိတ်ကြီး ပွင့်သွားပြီ။ ဟိုဘက်က ပန်းနံ့ ဒီထိ ရောက်တယ်။', 'The clasp is open. You can smell the flowers from here.', { from: 10 }),
      L('ဥယျာဉ်ဘက်က ရေတွေ ဒီထိ စီးလာတယ်။ အပေါ်က လူတွေ ပင်ပန်းမှာ။', 'Water is running down from the Garden. Hard day for the folk up there.', { days: [12] }),
      L('ဥယျာဉ်က လူတွေ ပန်းစည်းကိုင်ပြီး ဖြတ်သွားတယ်။ ဒီနှစ်ပန်း ဒီနှစ်ပဲ။', "Garden folk going by with flowers. This year's flowers are only this year's.", { days: [15] }),
    ] },
  },

  rooms: {
    bakery: [
      L('ဒီဆိုင်က မုန့်ကောင်းတယ်။ အော်သံ မပါရင် ပိုကောင်းမယ်။', 'The bread here is good. It would be better without the shouting.', { job: 'customer', days: [9], unless: 'd9.ch14Done' }),
      L('ငယ်ငယ်က ဆရာ အော်လို့ တတ်ခဲ့တာ ဟုတ်တယ်။ ကြောက်ခဲ့တာလည်း ဟုတ်တယ်။', 'I did learn when my teacher shouted. I was scared, too.', { job: 'customer' }),
      L('ဒီနေ့ အထဲမှာ တိတ်တယ်။ မုန့်ကတော့ အရင်အတိုင်း ကောင်းတယ်။', "Quiet in here today. Bread's as good as ever.", { job: 'customer', flag: 'd9.ch14Done' }),
      L('ကောင်လေး ဒီနေ့ ပြုံးပြီး ရောင်းတယ်။ ပြုံးချင်လို့ ပြုံးတာ။', "The lad smiles as he sells today. Because he wants to.", { job: 'customer', from: 10 }),
      L('မုန့်တူးတယ်တဲ့ နံရံမှာ။ ကိုယ်တိုင် စားကြည့်မှ သိမယ်။', "The wall says the bread's burnt. I'll know when I taste it.", { job: 'customer', days: [11], unless: 'd11.p1' }),
      L('ပူတဲ့စာကို မီးဖိုထဲ ထည့်လိုက်တယ်တဲ့။ မှန်တဲ့နေရာ ရောက်သွားတာ။', 'She put the hot note in the oven, they say. The right place for it.', { job: 'customer', flag: 'd11.p1' }),
      L('ရက်ကန်းတဲအကြောင်း တစ်ခုခု ကြားတယ်။ ကိုယ့်ဆီမှာပဲ ထားလိုက်တယ်။', "Heard something about the loom shed. I'm keeping it to myself.", { unless: 'd13.ch21Done', job: 'customer', days: [13] }),
      L('ဗန်းပေါ်မှာ ဘယ်သူ့နည်းလဲ ရေးထားတာ မြင်လား။ ရိုးသားတယ်။', "See how she wrote whose recipe it is on the tray? Honest.", { job: 'customer', days: [14], flag: 'd14.inv.hearth' }),
    ],
    provingroom: [ // nobody but Ei Mon and Maya back here: these come through the oven wall from the bakery
      L('မုန့်ညက်ကို ဖုံးထားမှ ဖောင်းတယ်။ ခဏခဏ မလှပ်နဲ့။', 'Dough rises under its cloth. Stop lifting it.', { job: ['baker', 'khinmay', 'maungarkar'] }),
      L('ပူတာနဲ့ တူးတာ မတူဘူး။ အချိန်မှန်မှ ထုတ်ရတယ်။', "Warm isn't burnt. Take it out at the right time.", { job: ['baker', 'khinmay', 'maungarkar'] }),
      L('နောက်ခန်းက နွေးတယ်၊ တိတ်တယ်။ ရင်ဖွင့်ချင်ရင် ကောင်းတဲ့နေရာ။', "The back room's warm and quiet. A good place to open your heart.", { job: 'customer' }),
      L('ဟေး၊ အဲဒီဗန်း မကိုင်နဲ့ဦး… အော်၊ မေးတာလား။ ရပါတယ်။', "Hey, don't touch that tray— oh, you're asking. Go on.", { job: ['baker', 'khinmay', 'maungarkar'], flag: 'd13.ch21Done' }),
      L('နောက်ခန်းထဲမှာ မုန့်စိမ်းတွေ နားနေတယ်။ မနှောင့်ယှက်ကြနဲ့နော်။', 'The dough is resting back there. Leave it in peace.', { job: ['baker', 'khinmay', 'maungarkar'], from: 14 }),
    ],
    noodlehouse: [
      L('ဟင်းချိုက အိမ်ကို သတိရစေတယ်။', 'The soup makes me miss home.', { job: 'diner' }),
      L('ခြောက်ကြိုက်တယ်။ ဟင်းချိုလည်း မဆိုးပါဘူး။ ငါနဲ့ မတည့်ရုံပဲ။', "I like it dry. Soup isn't bad. Just not for me.", { job: 'diner' }),
      L('တစ်ယောက်တည်း စားနေတဲ့သူ မြင်ရင် ခုံတစ်လုံး ရွှေ့ပေးလိုက်တယ်။', 'See someone eating alone, I pull a stool over.', { job: 'diner' }),
      L('ပူပူ စားလိုက်၊ စကားကို အေးအေး ပြော။', 'Eat it hot, speak cool.', { job: 'diner' }),
      L('အာကာနဲ့ အိမွန် တစ်ခါတလေ ငြင်းကြတယ်။ ပြီးရင် ပြန်ပြုံးကြတယ်။', 'Arkar and Ei Mon squabble sometimes. Then they smile again.', { job: 'diner', from: 10, flag: 'd9.friendDone' }),
      L('ဘယ်ဘက်မှာ စားခဲ့လဲ။ ကျုပ်က တစ်ဖက်မှာ အမြဲ။ ရပါတယ်။', 'Which side did you eat on? I always sit on the other. That is fine.', { job: 'diner', days: [11], flag: 'd11.p2' }),
      L('မိုးရွာရင် ဒီဆိုင် အနွေးဆုံးပဲ။ ဘယ်ဘက် ထိုင်ထိုင်။', "When it rains this is the warmest place. Whichever side you sit.", { job: 'diner', days: [12] }),
      L('အိမွန် ဒီနေ့ တိတ်တယ်။ ပြောချင်မှ နားထောင်မယ်။', "Ei Mon's quiet today. I'll listen if she wants to talk.", { job: 'diner', days: [13], unless: 'd13.ch21Done' }),
    ],
    eveningclass: [
      L('အသက်ငါးဆယ်ကျမှ စာစသင်တာ။ နောက်ကျတယ်လို့ မထင်ဘူး။', "I started learning at fifty. I don't call that late.", { job: 'pupil' }),
      L('ဆရာ မအော်ဘူး။ ဒါကြောင့် မေးရဲတယ်။', "The teacher doesn't shout. So I dare to ask.", { job: 'pupil' }),
      L('ဘေးကလူ ရေးတာ မှားရင် တိုးတိုးလေး ပြပေးတယ်။', 'If the person beside me writes it wrong, I show them quietly.', { job: 'pupil' }),
      L('မေးခွန်းမေးတဲ့သူကို ရယ်ရင် နောက်တစ်ခါ ဘယ်သူမှ မမေးတော့ဘူး။', "Laugh at someone's question and next time nobody asks.", { job: 'pupil' }),
      L('ပေါင်မုန့် ဘာလို့ ဖောင်းလဲ သိသွားတော့ စားရတာ ပိုအရသာရှိတယ်။', 'Now I know why bread rises, it tastes better.', { job: 'pupil', from: 11 }),
      L('ပြတင်းခုံ လွတ်သွားတော့ အလင်း ပိုရတယ်။', 'With the sill empty, more light comes in.', { job: 'pupil', flag: 'd11.p3' }),
      L('ကိုယ် ဘာကို စိတ်တိုလွယ်လဲ ရေးကြည့်ခိုင်းတယ်။ ခက်တယ်။', 'We were asked to write down what we flare up at. Hard.', { job: 'pupil', flag: 'd13.ch21Done' }),
    ],
    boxshop: [
      L('ဒီဘူးနဲ့ ထမင်း ညနေထိ ပူတယ်။ စမ်းဖူးလို့ ယုံတာ။', 'Rice stays hot in these till evening. I believe it because I tried.', { job: 'customer' }),
      L('ပထမဆုံး ခေါက်ခဲ့တဲ့ဘူး ကောက်နေတာ စင်ပေါ်မှာ။ သူလည်း စခဲ့ရတာပဲ။', 'His first box sits crooked on the shelf. He had to start somewhere too.', { job: 'customer' }),
      L('အရင်က ကျုပ်လည်း ဒီဘူးတွေကို ရယ်ခဲ့တာ။ အခု နေ့တိုင်း သုံးတယ်။', 'I used to laugh at these boxes too. Now I use one every day.', { job: 'customer' }),
      L('ကလေးတွေ ရယ်တာ ဂရုမစိုက်နဲ့ ဦး။ သူတို့ မစမ်းဖူးသေးလို့။', "Don't mind the kids laughing, Uncle. They haven't tried one yet.", { job: 'customer', days: [11], unless: 'd11.p5' }),
      L('ဦးစံရှား ပြုံးနေတာ ကြည့်။ အရင်လို စိတ်မတိုတော့ဘူး။', 'Look at U San Shar smiling. Not cross like before.', { job: 'customer', from: 12, flag: 'd11.p5' }),
    ],
    lampshop: [
      L('မီးအိမ်တိုင်းမှာ ချို့ယွင်းချက်လေး ရှိတယ်။ ဒါပေမဲ့ လင်းတာပဲ။', 'Every lamp has a little flaw somewhere. It still shines.', { job: 'customer' }),
      L('ဆိုင်းဘုတ်က စာလုံး မှားတာ ကျုပ် မြင်တယ်။ နံရံမှာတော့ မကပ်ဘူး။', "I saw the letter was wrong on the sign. I didn't pin it on the wall.", { job: 'customer', days: [11], unless: 'd11.p4' }),
      L('စာလုံး ပြင်လိုက်တော့ ဆိုင်းဘုတ် ပိုလှလာတယ်။', 'With the letter fixed, the sign looks even nicer.', { job: 'customer', flag: 'd11.p4' }),
      L('ဒေါ်ငြိမ်းကို အမှားပြောရင် "ကျေးဇူး" တဲ့။ အဲလိုလူ ရှားတယ်။', "Tell Daw Nyein a mistake and she says thanks. That's rare.", { job: 'customer', from: 12, flag: 'd11.p4' }),
      L('မိုးထဲ မီးအိမ် ဝယ်သူ များတယ်။ မှောင်တာက လူတိုင်းအတွက်ပဲ။', 'Lots of people buying lamps in the rain. The dark comes to everyone.', { job: 'customer', days: [12] }),
    ],
    hearthtea: [
      L('လက်ဖက်ရည်ဆိုင် သတင်း သုံးခု ကြားရင် တစ်ခုပဲ မှန်တယ်။', 'Hear three bits of tea-shop news, and one is true.', { job: 'uncle' }),
      L('သူငယ်ချင်းက ကိုယ့်စကား ဆုံးအောင် နားထောင်တယ်။ အဲဒါပဲ လိုတာ။', "A friend listens till you've finished. That's all you need.", { job: 'aunty' }),
      L('တစ်ခါ လူကြားထဲ ကျုပ်အမှား အော်ပြောခံရတယ်။ ဒီနေ့ထိ မမေ့ဘူး။', 'Someone once shouted my mistake in front of everyone. I still remember.', { job: 'uncle' }),
      L('နှစ်ယောက်ဆိုရမယ့် သီချင်း၊ တစ်ယောက်ပဲ လာလာ လေ့ကျင့်တယ်။', 'A duet, and only one of them ever comes to practise.', { job: 'aunty', days: [11], unless: 'd11.p6' }),
      L('သူ တစ်ယောက်တည်း ဆိုတာ ပိုကောင်းတယ်။ ကိုယ့်စံနဲ့ကိုယ်။', 'Better that she sang alone. On her own standard.', { job: 'aunty', flag: 'd11.p6' }),
      L('မီးထွန်းချိန် ဖဲကြိုးပွဲ မဖြစ်လိုက်ဘူး။ ကျုပ်တော့ ဝမ်းသာတယ်။', 'No ribbon at lamp-lighting after all. I am glad.', { job: 'uncle', flag: 'd11.p4' }),
      L('ညီညီ ညတိုင်း လာလေ့ကျင့်တယ်။ ဘယ်သူ့ကိုမှ ကြွားမနေဘူး။', "Nyi Nyi comes to practise every night now. Doesn't boast to anyone.", { job: 'uncle', from: 12, flag: 'd11.p6' }),
      L('ရုံထဲက ကိစ္စ ကြားပြီလား… မပြောတော့ဘူး။ သူတို့ကိစ္စ။', "Heard about the shed? …No, forget it. Their business.", { job: 'aunty', days: [13], unless: 'd13.ch21Done' }),
    ],
    loomshed: [
      L('ရက်တာ မှားရင် ဖြည်ပြီး ပြန်ရက်။ ရှက်စရာ မဟုတ်ဘူး။', 'Wove it wrong? Unpick it, weave again. No shame in that.', { job: 'weaver' }),
      L('သူများအထည်ကို ဖုံးထားရင် ဖုံးထားတဲ့ အကြောင်း ရှိတယ်။', "If someone's cloth is covered, there's a reason.", { job: 'weaver' }),
      L('ကျုပ်ချည်ကို ဆွဲရင် ကျုပ် ဒေါသထွက်တတ်တယ်။ ကိုယ့်အကြောင်း ကိုယ်သိတယ်။', 'Pull my thread and I flare up. I know that about myself.', { job: 'weaver' }),
      L('ကောက်တဲ့အတန်းကို ရယ်ချင်ရင် ကိုယ့် ပထမဆုံးအတန်းကို သတိရလိုက်။', 'Feel like laughing at a crooked row? Remember your own first one.', { job: 'weaver' }),
      L('မနေ့ညက ရယ်တဲ့ထဲ ကျုပ်လည်း ပါတယ်။ ဒီနေ့ ရှက်တယ်။', 'I was one of the ones laughing last night. Today I am ashamed.', { job: 'weaver', days: [13], unless: 'd13.ch21Done' }),
      L('"အရင်မေးပါ" ကတ်လေး ချိတ်ထားတယ်။ ကျုပ်လည်း ချိတ်မယ်။', "There's a little 'ask first' tag hung up. I'll hang one too.", { job: 'weaver', flag: 'd13.ch21Done' }),
      L('အိမွန့်အထည် အဖုံး မလှပ်သေးဘူး။ သူ ပြချင်မှ ကြည့်မယ်။', "Ei Mon's cloth is still covered. I'll look when she wants to show it.", { job: 'weaver', from: 14 }),
    ],
  },

  pairs: [
    { who: ['aunty', 'uncle'], when: { days: [9], unless: 'd9.ch14Done' }, lines: [
      L('ဟိုမုန့်ဖုတ်သည် စကားကြမ်းတယ်နော်။', "That baker's got a rough tongue."),
      L('စိတ်ကောင်းပါတယ်ဗျာ။', 'Good heart, though.'),
      L('စိတ်ကောင်းတာ ကောင်လေးမျက်နှာမှာတော့ မမြင်ရဘူး။', "You can't see the good heart on the lad's face."),
    ] },
    { who: ['vendor', 'elder'], when: { flag: 'd9.ch14Done' }, lines: [
      L('ဒီနေ့ မုန့်ဖိုက တိတ်တယ်နော်။', 'Quiet at the bakery today.'),
      L('သူ့ဘာသာ သတိထားမိသွားတာ ထင်တယ်။', 'She noticed it herself, I reckon.'),
      L('ကိုယ့်ဘာသာ မြင်မှ တကယ် ပြင်တာ။', 'You only really change when you see it yourself.'),
    ] },
    { who: ['teen', 'teen'], when: { from: 10, flag: 'd9.friendDone' }, lines: [
      L('အိမွန် ဘာလို့ အာကာ့ကို ကူတာလဲ။', 'Why does Ei Mon help Arkar?'),
      L('အရင်က သူ့အတွက် မုန့်တစ်လုံး ချန်ပေးဖူးလို့တဲ့။', 'He kept her a loaf once, she says.'),
      L('ကောင်းတာ ပြန်လာတာပဲ။', 'Good comes back round.'),
    ] },
    { who: ['worker', 'worker'], when: { from: 10 }, lines: [
      L('မင်း ငါ့ကို အမြဲ ပြင်နေတာ စိတ်ညစ်တယ်။', 'You correcting me all the time gets on my nerves.'),
      L('…ငါ့လေသံ ကြမ်းသွားတယ်။ တောင်းပန်တယ်။', '…My tone was rough. Sorry.'),
      L('ငါလည်း ဆတ်ဆတ်ထိမခံ ဖြစ်သွားတယ်။', 'I got touchy too.'),
    ] },
    { who: ['aunty', 'aunty'], when: { days: [11], unless: 'd11.ch18Done' }, lines: [
      L('နံရံမှာ ဘာတွေ ကပ်ထားလဲ ဖတ်ပြီးပြီလား။', "Read what's on the wall?"),
      L('မဖတ်ဘူး။ ဖတ်ရင် ပူမယ်။', "No. I'd only heat up."),
      L('အင်း… ငါလည်း မဖတ်တော့ဘူး။', "Hm… I'll leave it too."),
    ] },
    { who: ['uncle', 'vendor'], when: { days: [11], unless: 'd11.p4' }, lines: [
      L('ဆိုင်းဘုတ်အကြောင်း ပင်ထိုးတဲ့သူ အစိတ်ရှိပြီ။', 'Thirty people have pinned about that sign.'),
      L('ဒေါ်ငြိမ်း ကိုယ်တိုင် သိရဲ့လား မသိဘူး။', 'Wonder if Daw Nyein herself even knows.'),
      L('…အဲဒါ ငါ မစဉ်းစားမိဘူး။', '…Never thought of that.'),
    ] },
    { who: ['kid', 'kid'], when: { flag: 'd11.p3' }, lines: [
      L('ပန်းလေးအပင် ဘယ်တော့ အသီးသီးမလဲ။', "When will Pan's tree have fruit?"),
      L('ဆယ်နှစ်လောက်တဲ့။', 'About ten years, he says.'),
      L('ကြာလိုက်တာ!', 'That takes forever!'),
      L('အဲဒါကြောင့် အခု စိုက်တာပေါ့။', "That's why he planted it now."),
    ] },
    { who: ['teen', 'elder'], when: { flag: 'd11.p6' }, lines: [
      L('ချယ်ရီ ဘာလို့ တစ်ယောက်တည်း ဆိုတာလဲ။', 'Why did Cherry sing alone?'),
      L('ဘယ်သူနဲ့မဆို ဆိုမှာ မဟုတ်လို့ပေါ့။', "Because she won't sing with just anyone."),
      L('…ရဲလိုက်တာ။', '…That takes nerve.'),
    ] },
    { who: ['aunty', 'vendor'], when: { days: [12] }, lines: [
      L('ဦးချစ်ပြောတဲ့ မိုး ရွာပြီ။', "Uncle Chit's rain came."),
      L('ဒီတစ်ခါ မှန်တယ်။ မုန့်မာတယ်ဆိုတာတော့ မှားခဲ့တယ်။', 'Right this time. He was wrong about the loaves going hard.'),
      L('တစ်ခါမှန်တိုင်း အကုန်မှန်တာ မဟုတ်ဘူးလေ။', "Right once doesn't mean right every time."),
    ] },
    { who: ['worker', 'aunty'], when: { days: [13], unless: 'd13.ch21Done' }, lines: [
      L('ရက်ကန်းရုံက ကိစ္စ ကြားပြီလား။', 'Heard about the loom shed?'),
      L('ကြားတယ်။ ငါ့ကိစ္စ မဟုတ်လို့ ဆက်မပြောတော့ဘူး။', "I heard. It isn't mine, so I won't pass it on."),
      L('…ဟုတ်သားပဲ။', '…Fair enough.'),
    ] },
    { who: ['weaver', 'weaver'], when: { flag: 'd13.ch21Done' }, lines: [
      L('မင်းအထည် ကြည့်လို့ရလား။', 'May I look at your cloth?'),
      L('မရသေးဘူး။ မနက်ဖြန်ကျ ကြည့်။', 'Not yet. Tomorrow.'),
      L('ရတယ်။ စောင့်မယ်။', "All right. I'll wait."),
    ] },
    { who: ['vendor', 'elder'], when: { days: [14], flag: 'd14.inv.hearth' }, lines: [
      L('မနက်ဖြန်ပွဲမှာ ဒေါ်ခင်မေ့ မုန့် ပါမှာတဲ့။', "Daw Khin May's bread will be at tomorrow's do, they say."),
      L('နည်းက သူ့အမေ့ဟာတဲ့။ အဲဒါ ပြောထားတာ ကောင်းတယ်။', "The recipe's her mother's. Good of her to say so."),
    ] },
  ],

  arrive: {
    first: L('(ပေါင်မုန့်နံ့၊ မီးခိုးနံ့။ ဒီလမ်းက နွေးတယ်။)', '(Bread and smoke. This street is warm.)', { job: 'maya' }),
    again: [
      L('(ဒီနေ့ မုန့်ဖိုထဲက အော်သံ မကြားရဘူး။ မုန့်နံ့ပဲ ရတယ်။)', '(No shouting from the bakery today. Just the smell of bread.)', { job: 'maya', area: 'bakeryFront', from: 10, flag: 'd9.ch14Done' }),
      L('(စာရွက်တွေ များလာပြီ။ မဖတ်ရသေးခင်ကတည်းက ပူမှန်း သိတယ်။)', "(More notes now. I can feel the heat before I've read a word.)", { job: 'maya', area: 'noteWall', days: [11], unless: 'd11.ch18Done' }),
      L('(ခလုတ်… ခလုတ်… ရုံထဲက အသံ ပြန်ကြားရပြီ။)', "(Clack… clack… the shed's sound again.)", { job: 'maya', area: 'loomFront', from: 14 }),
      L('(မိုးထဲမှာတောင် မီးခိုး နှစ်ကြောင်း တက်နေတုန်း။)', '(Even in the rain, two lines of smoke.)', { job: 'maya', area: 'bakeryFront', days: [12] }),
    ],
  },
};

// ===================================================================================================================
// DIARY GARDEN  (regions/garden.js: the lane along z 100; the kiln square x 187-224, fronts z 90; the clasp road x 258)
// ===================================================================================================================
const GARDEN = {
  town: [
    L('အပင်ကို ကိုယ့်ဘက် အတင်းဆွဲရင် ကျိုးတယ်။ သူ့ဘာသာ ကြီးပါစေ။', 'Pull a plant your way and it snaps. Let it grow its own way.', { job: 'gardener' }),
    L('တစ်ယောက်တည်း နေတာနဲ့ အထီးကျန်တာ မတူဘူးလေ။', "Living alone and being lonely aren't the same.", { job: 'elder' }),
    L('ကြားတာနဲ့ နားထောင်တာ မတူဘူး။ ကျုပ်ယောက်ျားက ကြားရုံပဲ။', "Hearing and listening aren't the same. My husband only hears.", { job: 'aunty' }),
    L('ဒီနှစ် ပွင့်တဲ့ပန်း နောက်နှစ် မရှိဘူး။ အခု ကြည့်ထား။', "This year's flowers won't be here next year. Look at them now.", { job: 'gardener' }),
    L('နွယ်ပင်ကို တိုင်နဲ့ချည်။ တခြားအပင် ရစ်ရင် နှစ်ပင်လုံး သေတယ်။', 'Tie a creeper to a pole. Let it wind round another plant and both die.', { job: 'gardener' }),
    L('တံခါးပိတ်ထားလည်း ပန်းနံ့က ထွက်လာတာပဲ။', 'Shut the gate, and the scent still gets out.', { job: 'elder' }),
    L('ပိုက်ဆံ များတာနဲ့ စိတ်အေးတာ တခြားစီ။', 'Lots of money and peace of mind are two different things.', { job: 'vendor' }),
    L('လှည်းသေးသေးနဲ့ အိပ်ရေးဝတာကို ကြိုက်တယ်။', "I'll take a small cart and a full night's sleep.", { job: 'carter' }),
    L('ငါ့ပန်း ပိုးကိုက်တယ်။ ဘေးအိမ်ပန်းလည်း ကိုက်တာပဲ။', "Bugs got my flower. Next door's too. It's not just mine.", { job: 'kid' }),
    L('ဒုက္ခက ဖိတ်စာ မပို့ဘူး။ သူ့ဘာသာ ရောက်လာတာ။', "Trouble doesn't send an invitation. It just turns up.", { job: 'elder' }),
    L('ကိုယ့်လက်ထဲ ရှိတာကိုပဲ ကိုင်တယ်။ ကျန်တာ လွှတ်ထားလိုက်တယ်။', 'I hold what is in my hands. The rest I let go.', { job: 'gardener' }),
    L('ပထမ စိတ်တိုလာတာကို ဖမ်းမိရင် ကျန်တာ လွယ်တယ်။', 'Catch the first flash of temper and the rest is easy.', { job: 'vendor' }),
    L('အိုးကွဲတိုင်း စိတ်ပျက်ရင် အိုးသမား မဖြစ်ဘူး။', 'Lose heart at every cracked pot and you will never be a potter.', { job: 'potter' }),
    L('မသိသေးတဲ့ ကလေးကို စိတ်ဆိုးရင် ကိုယ်ပဲ ပူတယ်။', "Get angry at a child who doesn't know yet, and you're the one who burns.", { job: 'aunty' }),
    // reactions
    L('အဘိုးကြီး တံခါးကို သော့ခတ်ထားတုန်းပဲ။ သူ့တံခါးပဲလေ။', "The old man's gate is still locked. It's his gate.", { job: 'aunty', days: [10], unless: 'd10.ch16Done' }),
    L('တံခါး လက်တစ်ဝါးလောက် ဟလာပြီ။ ဘယ်သူမှ မတွန်းခဲ့ဘူးတဲ့။', 'The gate is open a hand-width. Nobody pushed it, they say.', { job: 'elder', flag: 'd10.ch16Done' }),
    L('မနေ့က ဦးဖိုးထော် ပန်းဥ ဝေတယ်။ နှစ်တိုင်းလိုပဲ။', "Yesterday U Hpo Htaw gave out his bulbs. Same as every year.", { job: 'aunty', days: [11], flag: 'd10.bulbs' }),
    L('ဦးဖိုးထော် အခု လမ်းကို မကြည့်တော့ဘူး။ ပန်းခင်းကိုပဲ ကြည့်တယ်။', "U Hpo Htaw doesn't watch the lane now. Just his beds.", { job: 'gardener', from: 11, flag: 'd10.ch16Done' }),
    L('ဒီနေ့ ဥယျာဉ် ငြိမ်တယ်။ ငြိမ်တာကို ပျင်းတယ်လို့ မထင်နဲ့။', "The Garden's quiet today. Don't mistake quiet for dull.", { job: 'elder', days: [11] }),
    L('ကိုဖြိုး စက္ကူထုပ်တွေ ခြောက်မှ ချိန်တယ်။ ဝယ်သူက သူ့ဆီ အရင်သွားတယ်။', 'Ko Phyo weighs his bales dry. The buyer goes to him first now.', { job: 'carter', from: 11, flag: 'd10.ch17Done' }),
    L('စက္ကူဆိုင်ပေါ်က မီး ညတိုင်း လင်းနေတုန်း။ အိပ်မပျော်ဘူး ထင်တယ်။', "The light above the paper store still burns every night. Can't sleep, I suppose.", { job: 'vendor', from: 11, to: 12, unless: 'd12.ch20Done' }),
    L('တစ်လမ်းလုံး ရေထဲမှာ။ ဘယ်သူမှ "ငါ့ဟာပဲ" မပြောနိုင်ဘူး။', "The whole lane's under water. Nobody can say 'only mine'.", { job: 'aunty', days: [12] }),
    L('ရေခပ်ရင်း ရယ်နေကြတယ်။ ငိုလည်း ရေက မကျဘူးလေ။', "We're laughing as we bail. Crying won't bring the water down.", { job: 'worker', days: [12] }),
    L('မိုးရေထဲ ခုန်ရတာ ပျော်တယ်! အမေကတော့ မပျော်ဘူး။', "Jumping in the rain's fun! Mum doesn't think so.", { job: 'kid', days: [12] }),
    L('မိုးလွန်တော့ ပျိုးခင်းအသစ် ပြန်ချတယ်။ အရင်ကထက် မြင့်မြင့်။', "After the rain I've laid new seedbeds. Higher than before.", { job: 'gardener', from: 13 }),
    L('ဦးဖိုးထော် အဝေးဆုံးခင်းကို ကိုယ်တိုင် ပြန်စလိုက်တယ်။', "U Hpo Htaw has started his far bed again, on his own.", { job: 'elder', from: 13, flag: 'd12.ch19Done' }),
    L('ဆန်ချိန်ခွင်မှာ ချိန်သီးအသစ် ချိတ်ထားပြီ။ ကျုပ် ကိုယ်တိုင် စစ်ကြည့်တယ်။', 'There are new weights at the rice scale. I checked them myself.', { job: 'vendor', from: 13, flag: 'd12.ch20Done' }),
    L('စက္ကူဆိုင်ပေါ်က မီး အခု စောစော ငြိမ်းတယ်။ ကောင်းပါတယ်။', 'The light above the paper store goes out early now. Good.', { job: 'vendor', from: 13, flag: 'd12.ch20Done' }),
    L('ဒေါ်အုန်းကို "ဒေါသအိုး" မခေါ်တော့ဘူး။ သူက သင်ပေးတယ်။', "We don't call Daw Ohn 'anger pot' any more. She showed us why.", { job: 'kid', from: 13, flag: 'd12.ch20Done' }),
    L('ချိန်ခွင်မှားရင် ရန်မဖြစ်ဘူး။ အထောက်အထားနဲ့ တိုင်တယ်။', "A crooked scale? I don't pick a fight. I report it, with proof.", { job: 'carter', from: 13 }),
    L('ခရီးသည်လေးတွေ ဒီမနက် ဖြတ်သွားတယ်။ အသံကျယ်ပေမဲ့ ယဉ်ကျေးတယ်။', 'Some young travellers went by this morning. Loud, but polite.', { job: 'elder', days: [13] }),
    L('ဦးဖိုးထော် တံခါး ဖွင့်ထားတယ်။ အိမ်နီးချင်းတွေ ဝင်ထိုင်နေကြတယ်။', "U Hpo Htaw's gate is open. Neighbours are sitting inside.", { job: 'gardener', days: [14] }),
    L('ဦးကြည်ငြိမ်း ခြောက်တဲ့ထုပ်တွေပေါ် ကိုယ့်နာမည် ရေးနေတယ်။', "U Kyi Nyein's chalking his own name on the dry bales.", { job: 'carter', days: [14] }),
    L('ညနေပွဲအတွက် ပန်းခူးထားတယ်။ ဒီနှစ်ပန်းက ဒီနှစ်ပဲ လှတာ။', "I've cut flowers for this evening's do. This year's flowers are only this year's.", { job: 'aunty', days: [15] }),
  ],

  areas: {
    // the creeper arch over the clasp road (258, 131), the clasp just south (258, 134.4)
    claspArch: { at: { x: 258.0, z: 132.0, r: 5 }, lines: [
      L('ဒီချိတ်ကြီးက ဒိုင်ယာရီကို ပိတ်ထားတာ။ ကိုယ့်စာအုပ် ကိုယ်ပိတ်ခွင့် ရှိတယ်။', "This clasp keeps the diary shut. You've a right to close your own book."),
      L('အနွယ်ပင်က အမိုးပေါ် တက်တယ်၊ ဒါပေမဲ့ အမိုးကို ဆွဲမချဘူး။', "The creeper climbs the arch but doesn't pull it down."),
      L('ပိတ်တာလည်း မမြဲဘူး၊ ပွင့်တာလည်း မမြဲဘူး။', "Shut doesn't last. Open doesn't either."),
      L('မနေ့ညက ချိတ် သူ့ဘာသာ ပွင့်သွားတယ်တဲ့။ ဘယ်သူမှ အတင်း မဖွင့်ဘူး။', 'The clasp opened by itself last night, they say. Nobody forced it.', { days: [10] }),
      L('ချိတ်အောက်မှာ မိုးခိုနေကြတယ်။ မသိတဲ့သူချင်း ပခုံးချင်းကပ်။', 'Sheltering under the clasp. Strangers shoulder to shoulder.', { days: [12] }),
      L('မနေ့က မိုးထဲမှာ တစ်လမ်းလုံး ကူကြတယ်။ ဒီလမ်းကို ချစ်တယ်။', 'Yesterday in the rain the whole lane helped out. I love this lane.', { from: 13 }),
    ] },
    // the Garden side of the torn crease (gTear 172, 135.4)
    creaseGarden: { at: { x: 172.0, z: 130.0, r: 6 }, lines: [
      L('ကိုယ့်ခြံမှာ အားနည်းတဲ့ထောင့် ကိုယ်သိရင် ကြိုကာထားလို့ရတယ်။', "Know your plot's weak corner and you can fence it in good time."),
      L('အပြဲကနေ မီးဖိုတန်းက မုန့်နံ့ ရတယ်။ နီးနီးလေးနဲ့ ဝေးတယ်။', "Through the tear you can smell Hearth Row's bread. So near, so far.", { unless: 'creaseMended' }),
      L('ချုပ်ရိုးက မလှဘူး။ ဒါပေမဲ့ စေတနာနဲ့ ချုပ်ထားတာ။', "The stitching isn't pretty. But it was done with goodwill.", { flag: 'creaseMended' }),
      L('မီးဖိုတန်းက လူတွေ ဒီကနေ ဖြတ်လာရင် ပေါင်မုန့် ယူလာတတ်တယ်။', 'Folk from Hearth Row coming through here often bring bread.', { from: 11, flag: 'creaseMended' }),
      L('အပြဲထဲ ရေတွေ စီးနေတယ်။ စောစော ချုပ်ထားတာ ကံကောင်းတယ်။', "Water's running through the fold. Lucky it was stitched early.", { days: [12], flag: 'creaseMended' }),
      L('အပြဲက မိုးထဲ ပိုကျယ်လာတယ်။ စောစော ချုပ်ခဲ့ရင် ကောင်းမှာ။', "The tear's getting wider in the rain. If only it had been stitched early.", { days: [12], unless: 'creaseMended' }),
    ] },
    // the lane's crossing at the crease lane (gCross 172, 100): cottages, hens, skipping
    laneCross: { at: { x: 175.0, z: 104.0, r: 7 }, lines: [
      L('ကြက်မ ဥဝပ်ရင် အနားမကပ်နဲ့တဲ့။ ကျွန်မ စာကျက်ရင်လည်း အဲလိုပဲ။', "When a hen's sitting, keep away, they say. Same with me when I'm studying.", { job: 'kid' }),
      L('မနက်တိုင်း ဒီလမ်းဆုံမှာ နှုတ်ဆက်ကြတယ်။ ဘယ်သူ့အိမ်ထဲမှ မဝင်ဘူး။', "Every morning we greet each other at this crossing. Nobody barges into anyone's house."),
      L('ကြက်တွေ ဘေးခြံ ရောက်သွားရင် သူ မပြောခင် ကိုယ်တိုင် ပြန်ဖမ်းတယ်။', 'If my hens get into next door, I fetch them back before she has to say a word.', { age: ['adult', 'elder'] }),
      L('အဆိုးတစ်ခု ကြုံတိုင်း "ငါ့ကျမှ" လို့ မပြောဖြစ်တော့ဘူး။', "When something bad happens I don't say 'why me' any more."),
      L('ကြက်ခြံ ရေဝင်တယ်။ ဘေးအိမ်က သူ့မီးဖိုချောင်ထဲ ခဏထားခိုင်းတယ်။', 'My hen coop flooded. Next door let me keep them in her kitchen a while.', { days: [12] }),
      L('မိုးတုန်းက ကူခဲ့တဲ့ အိမ်နီးချင်းကို ကြက်ဥ လေးလုံး ပို့ပေးတယ်။', 'Took four eggs to the neighbour who helped me in the rain.', { from: 13 }),
    ] },
    // the lane's east end, plots 1 and 2 with their closed wickets (247.7, 253.3)
    laneEast: { at: { x: 250.0, z: 100.0, r: 6 }, lines: [
      L('ဒီလမ်းမှာ ခြံတိုင်း ကိုယ့်တံခါး ကိုယ်ရှိတယ်။ ဖွင့်ချိန် ပိတ်ချိန် ကိုယ်ပိုင်။', 'Every plot on this lane has its own gate. When to open is each one\'s own.'),
      L('လမ်းထဲက အတင်းစကားကို ဝင်ခွင့်မပေးဘူး။ လွင့်သွားပါစေ။', "When the lane gossips, I don't let it in. Let it blow by."),
      L('ငှားတာ ပြန်မပေးရင် တံခါးပိတ်ချင်စရာပဲ။ နားလည်ပါတယ်။', 'Borrow and never give back, and anyone would shut their gate. I understand.'),
      L('ဘေးခြံက အဘိုး မနက်တိုင်း ခေါင်းညိတ်ပြတယ်။ ဒါပဲ။ ကောင်းတယ်။', "The old man nods to me every morning. That's all. It's nice.", { from: 11, flag: 'd10.ch16Done' }),
      L('ခြံစည်းရိုးတွေ လဲကုန်တယ်။ ဘယ်သူ့ခြံ ဘယ်သူ့ခြံလဲ မခွဲနိုင်တော့ဘူး။', "The fences are all down. Can't tell whose plot is whose any more.", { days: [12] }),
      L('ငှားသွားတဲ့ ပေါက်ပြားတွေ ပြန်ရောက်လာပြီတဲ့။', 'The borrowed hoes are coming back, they say.', { from: 14 }),
    ] },
    // U Hpo Htaw's gate (posts at 241.2, 97.9) and the lane bench (241.2, 102.05)
    hpGate: { at: { x: 241.2, z: 99.6, r: 3.5 }, lines: [
      L('ကျုပ်ကတော့ တံခါး မခေါက်ဘူး။ မင်္ဂလာပါ လို့ပဲ နှုတ်ဆက်တယ်။', "I don't knock. I just say good morning."),
      L('သော့ခလောက်ကြီး တွဲလောင်းနဲ့။ သူ့တံခါး သူ့သဘော။', 'A big padlock hanging there. His gate, his say.', { days: [10], unless: 'd10.ch16Done' }),
      L('ခုံကို ပန်းခင်းဘက် လှည့်ထားပြီ။ လမ်းကို မစောင့်တော့ဘူး။', "He's turned his bench to the beds. Not waiting on the lane now.", { flag: 'd10.ch16Done' }),
      L('အဘိုးကြီး "ငါ့ခြံပဲ" တဲ့။ ကျုပ်ခြံကိုလည်း ကြည့်စေချင်တယ်။', "Grandpa says 'only mine'. I wish he'd look at my plot too.", { days: [12], unless: 'd12.ch19Done' , age: ['adult', 'elder'] }),
      L('ပေါက်ပြားလေးကိုင်ပြီး အဝေးဆုံးခင်းဆီ တစ်ယောက်တည်း သွားတယ်။', "He went out to the far bed alone, hoe in hand.", { days: [12], flag: 'd12.ch19Done' }),
      L('ခရီးသည်တွေကို ရေတစ်ခွက် တိုက်လိုက်တယ်တဲ့။ အရင်ဆို မဖြစ်နိုင်ဘူး။', 'He gave the travellers a cup of water, they say. Unthinkable before.', { days: [13], flag: 'd12.ch19Done' }),
      L('တံခါး ဖွင့်ထားတယ်။ ဝင်ချင်ဝင်၊ မဝင်ချင်နေ။ သူ မပူတော့ဘူး။', "The gate stays open. Come in or don't. He doesn't fret now.", { from: 13 }),
      L('ငှားသွားတဲ့ ပေါက်ပြား တံခါးမှာ ပြန်ထောင်ထားတယ်။', 'Someone has leaned a borrowed hoe back against his gate.', { from: 14 }),
    ] },
    // the gourd aunty's trellis beside his plot (236.3, 96.8)
    gourdTrellis: { at: { x: 236.0, z: 97.4, r: 3 }, lines: [
      L('ဘူးနွယ်ကို ကိုယ့်စင်ပေါ်ပဲ တက်စေတယ်။ ဘေးခြံ မကူးစေဘူး။', "I keep my gourd vine on my own trellis. Not over next door's.", { age: ['adult', 'elder'] }),
      L('ကျုပ်က ပြောတဲ့သူ မဟုတ်ဘူး၊ နားထောင်တဲ့သူ။ ဒီလမ်းမှာ ရှားတယ်။', "I'm not a talker, I'm a listener. Rare on this lane."),
      L('အပင်ကို နေ့တိုင်း မကြည့်ရင် ရွက်ဝါတာ မမြင်ဘူး။', "Don't look at a plant every day and you'll miss the first yellow leaf."),
      L('ကြားက ခြံစည်းရိုးကို ဖယ်စရာ မလိုဘူး။ ကျော်ပြီး စကားပြောလို့ရတယ်။', 'No need to take the fence down. We talk over it fine.', { flag: 'd10.ch16Done' }),
      L('ဘူးစင် ပြန်ထောင်မယ်။ မိုးက နှစ်တိုင်း လာမှာပဲ။', "I'll put the trellis back up. The rain comes every year anyway.", { days: [12] }),
      L('ဘူးသီး တစ်လုံး ပိုနေတယ်။ ဘေးခြံအဘိုးကို ပေးမယ်။', "One gourd too many. I'll give it to Grandpa next door.", { from: 13 }),
    ] },
    // the kiln square (paving x 187-227, z 90-99)
    kilnSquare: { at: { x: 205.0, z: 95.0, r: 9 }, lines: [
      L('ဒီမှာ ချိန်ခွင်တိုင်း လူမြင်ကွင်းမှာ။ ဝှက်စရာမရှိရင် ကောင်းတယ်။', "Every scale on this square is in plain sight. Nice when there's nothing to hide."),
      L('ပိုက်ဆံရှိတာက ချမ်းသာတာ။ အိပ်ပျော်တာက တခြားဟာ။', "Having money is being rich. Sleeping well's something else."),
      L('ဒီမနက် စက္ကူထုပ်တွေ စိုစိုရွှဲရွှဲ။ နှင်းကျတာ ဒီလောက်တောင်လား။', 'The bales were dripping this morning. Was there really that much dew?', { days: [10], unless: 'd10.ch17Done' }),
      L('ကိုဖြိုး ရေပုံးကို ပြန်ပေးသွားတယ်။ သုံးတောင် မသုံးဘူး။', 'Ko Phyo gave the watering can back. Never even used it.', { flag: 'd10.ch17Done' }),
      L('မိုးရွာတော့ ဈေးသည်တွေ မညည်းဘူး။ အထဲ ရွှေ့ရောင်းတယ်။', "The rain came; the traders didn't moan. They moved inside.", { days: [12] }),
      L('ချိန်ခွင်ကို ကိုယ်တိုင် စစ်ပြီးမှ ဝယ်တယ်။ ဘယ်သူ့ကိုမှ မစွပ်စွဲဘူး။', 'I check the scale myself before I buy. No accusing anyone.', { from: 13 , age: ['adult', 'elder'] }),
      L('ချိန်ခွင်ဘေးမှာ ချိန်သီးမှန် ချိတ်ထားတယ်။ ဘယ်သူမဆို စစ်လို့ရတယ်။', 'A true weight hangs by the scale now. Anyone can check.', { from: 13, flag: 'd12.ch20Done' }),
    ] },
    // the big kiln's mouth and woodpile (woodpile 208, 91.6; desk kiln 214, 94.4)
    kilnYard: { at: { x: 209.5, z: 91.8, r: 4 }, lines: [
      L('ထင်းစိုကို ထည့်ရင် မီးခိုးပဲ ထွက်တယ်။ ခြောက်တာပဲ ထည့်။', 'Put wet wood in and you only get smoke. Dry wood only.', { job: 'potter' }),
      L('အိုးကွဲတဲ့နေ့ ရှိတယ်။ မနက်ဖြန် ပြန်ဖုတ်ရုံပဲ။', 'Some days pots crack. Fire again tomorrow.', { job: 'potter' }),
      L('မီးကို အရမ်း မြန်မြန် မြှင့်ရင် အိုးကွဲတယ်။ ဖြည်းဖြည်း တက်ရမယ်။', 'Raise the fire too fast and pots crack. Slowly does it.', { job: 'potter' }),
      L('အိုးဖုတ်ပြီး ချက်ချင်း မထုတ်နဲ့။ အေးမှ ထုတ်။ စိတ်ရှည်မှ မကွဲဘူး။', "Don't pull a pot straight out. Let it cool. Be patient or it cracks.", { job: 'potter' }),
      L('မီးဖိုကြီး မငြိမ်းဖူးဘူး။ မီးခိုး ပါးပါးလေး အမြဲ တက်နေတာ။', 'The big kiln has never gone out. A thin line of smoke, always.', { job: 'potter', days: [11] }),
      L('မနေ့က မိုးထဲမှာတောင် မီးကို စောင့်ခဲ့ရတယ်။ စိတ်ရှည်ရတယ်။', 'Even in yesterday\'s rain we kept the fire going. Takes patience.', { job: 'potter', from: 13 }),
    ] },
    // the corner tea shop front (kilntea door 226, 96.6; its tables on the square)
    teaFront: { at: { x: 227.0, z: 97.8, r: 3.5 }, lines: [
      L('ဆိုင်ဦးလေးက ဘယ်သူ့အကြောင်းမှ မပြောဘူး။ ဒါကြောင့် ယုံရတယ်။', "The tea uncle never talks about anyone. That's why people trust him."),
      L('ညနေ လက်ဖက်ရည်တစ်ခွက်နဲ့ စိတ်ပူတာ ပြောပြရင် ပေါ့သွားတယ်။', 'Tell your worries over an evening cup and they lighten.'),
      L('အရောင်းကောင်းတဲ့ ဘေးဆိုင်ကို မနာလိုရင် ကိုယ့်လက်ဖက်ရည်ပဲ ခါးတယ်။', 'Envy the busy shop next door and only your own tea turns bitter.'),
      L('ညက ကိုဖြိုး ဒီပြတင်းဘေးမှာ ချိန်ခွင်လေး ကိုင်ပြီး ထိုင်နေတယ်။', 'Last night Ko Phyo sat by this window holding a little scale.', { days: [11], flag: 'd10.ch17Done' }),
      L('မိုးခိုလာတဲ့သူတွေ ဆိုင်ပြည့်တယ်။ ပိုက်ဆံမပါလည်း ထိုင်လို့ရတယ်တဲ့။', 'The shop is full of people sheltering. Sit even with no money, he says.', { days: [12] }),
    ] },
    // the drying hall's double doors (221.6, 90.4)
    hallFront: { at: { x: 221.6, z: 91.8, r: 3.5 }, lines: [
      L('အိုးစိမ်း အရိပ်မှာ ဖြည်းဖြည်း ခြောက်ရတယ်။ နေပူထဲဆို အက်တယ်။', 'Green pots dry slowly in the shade. Put them in the sun and they crack.'),
      L('သူ့ဆေးရောင် လှတာ အိုးလေးဆယ် ကွဲပြီးမှ ရတာတဲ့။ ဝမ်းသာစရာပဲ။', 'That lovely glaze took her forty cracked pots, she says. Good for her.'),
      L('ကျပ်ကျပ်ညပ်ညပ် ဖြစ်ရင် လူတွေ စိတ်တိုလွယ်တယ်။ အသက်ပြင်းပြင်း ရှူ။', 'Crowds make people snappy. Breathe deep.', { days: [12] }),
      L('ဒေါ်အုန်းရဲ့ ထမင်းအိုးဖုံး ခုန်နေတုန်းပဲ။ သူကတော့ ပြုံးနေတယ်။', "Daw Ohn's rice-pot lid still rattles. She just smiles now.", { from: 13, flag: 'd12.ch20Done' }),
      L('ကလေးတွေ အိုးဖုံး ခေါက်မကစားတော့ဘူး။ ရေနွေးငွေ့အကြောင်း မေးကြတယ်။', "The kids don't rattle the lids now. They ask about steam.", { from: 13, flag: 'd12.ch20Done' }),
    ] },
    // the Market Committee lean-to and its public notice board (door 217.1, 90.1; board 219, 90.6)
    committeeBoard: { at: { x: 218.4, z: 91.2, r: 2.5 }, lines: [
      L('ဒေါသနဲ့ ရေးတဲ့ တိုင်စာ ဖတ်ရင် ဘာဖြစ်ခဲ့လဲ မသိရဘူး။', "Read a complaint written in anger and you can't tell what happened."),
      L('ဒီဘုတ်ပေါ်က စာကို ကော်မတီက စစ်ပြီးမှ ကပ်တယ်။', 'The committee checks before anything goes up on this board.'),
      L('နောက်ဝယ်မယ့်သူ မခံရအောင် ပြောတာ ရန်စတာ မဟုတ်ဘူး။', "Speaking up so the next buyer isn't cheated isn't picking a fight."),
      L('ဒီနေ့ တိုင်စာ တစ်စောင် ဝင်လာတယ်။ အမှန်ချည်းပဲ၊ အော်သံ မပါဘူး။', 'A complaint came in today. All facts, no shouting.', { days: [12], flag: 'd12.ch20Done' }),
      L('ဘုတ်မှာ "ဈေးချိန်ခွင်တွေ စစ်ပြီး" တဲ့။ ဘယ်သူ့နာမည်မှ မပါဘူး။', "The board says 'market scales checked'. No names.", { from: 13, flag: 'd12.ch20Done' }),
    ] },
    // the street's allotments, seed house and shade nursery behind the picket fence (x 141-170, north of the lane)
    allotments: { at: { x: 155.0, z: 92.0, r: 9 }, lines: [
      L('ဒီမြေကွက်တွေက လမ်းတစ်လမ်းလုံးရဲ့ဟာ။ တစ်ယောက် တစ်ကွက်။', "These plots are the whole street's. One each."),
      L('ဘေးကွက်က ခရမ်းချဉ်သီး ကျုပ်ထက် ကြီးတယ်။ ဘယ်လိုလုပ်လဲ မေးကြည့်မယ်။', "Next plot's tomatoes are bigger than mine. I'll ask how."),
      L('ပေါင်းပင် တစ်ပင်တွေ့ရင် ချက်ချင်း နုတ်။ နောက်မှဆို အမြစ်တွယ်ပြီ။', 'See one weed, pull it now. Later and it has rooted.'),
      L('ကိုယ့်ကွက် ရေလောင်းရင်း ဘေးကွက်ကိုလည်း တစ်ပုံး လောင်းပေးတယ်။', "Watering mine, I tip a bucket on next door's too."),
      L('ပျိုးခင်းတွေ ရေထဲမှာ။ နောက်တစ်ခါ မြေမြင့်မြင့် ချမယ်။', "The seedbeds are under water. Next time I'll raise them.", { days: [12] }),
      L('ဝမ်းနည်းတာ ခဏပဲ။ ပြီးရင် ပြန်စိုက်တယ်။', 'Sad for a bit. Then I sow again.', { from: 13 }),
      L('မိုးကျပြီး ပြန်စိုက်တဲ့ ပဲပင် အညွန့်ထွက်ပြီ။', 'The beans I resowed after the rain are sprouting.', { from: 14 }),
    ] },
    // the lily pond (160.6, 69.8)
    pond: { at: { x: 160.6, z: 70.6, r: 6 }, lines: [
      L('ကန်ရေ ငြိမ်မှ အောက်ခြေ မြင်ရတယ်။ စိတ်လည်း ဒီလိုပဲ။', 'The pond has to be still before you see the bottom. Minds too.'),
      L('ဒီမှာ တစ်ယောက်တည်း ထိုင်တာ ကြိုက်တယ်။ ဘယ်သူ့ကိုမှ မုန်းလို့ မဟုတ်ဘူး။', "I like sitting here alone. Not because I hate anyone."),
      L('ဘဲက ရေထဲ နေပေမဲ့ အမွေးက မစိုဘူး။', 'The duck lives in the water, but its feathers stay dry.'),
      L('ကျောက်ခဲ ပစ်ရင် လှိုင်းက ကမ်းထိ ရောက်တယ်။ စကားလည်း ဒီလိုပဲ။', 'Throw a stone and the ripples reach the bank. Words too.'),
      L('ကန်လျှံလို့ ငါးတွေ လမ်းပေါ်ရောက်တယ်။ ကလေးတွေ ပြန်ထည့်ပေးနေကြတယ်။', 'The pond flooded and fish ended up on the path. The kids are putting them back.', { days: [12] }),
      L('မိုးလွန်တော့ ကန်ရေ နောက်နေတယ်။ ငြိမ်ငြိမ်လေး ထားရင် ပြန်ကြည်မှာ။', "Since the rain the pond's muddy. Leave it still and it'll clear.", { from: 13 }),
    ] },
    // the north road up to the last hedge (gNorth 140, 100 -> gHedge 140, 18)
    northRoad: { at: { x: 140.5, z: 42.0, r: 24 }, lines: [
      L('တိတ်တဲ့လမ်းမှာ ကိုယ့်ခြေသံ ကိုယ်ကြားရတယ်။', 'On a quiet road you hear your own footsteps.'),
      L('လမ်းဘေး ရေအိုး ဖြည့်ထားတယ်။ ဘယ်သူ သောက်သောက် ကိစ္စမရှိဘူး။', "I keep the roadside water pot full. Whoever drinks, it doesn't matter.", { age: ['adult', 'elder'] }),
      L('ရာသီ ပြောင်းရင် လမ်းဘေးပန်းလည်း ပြောင်းတယ်။ မနှမြောနဲ့။', "When the season turns, the roadside flowers turn too. Don't mourn them."),
      L('ခြံစည်းရိုးကို နည်းနည်း နိမ့်ညှပ်ထားတယ်။ အပြင်ကလူ မြင်ရအောင်။', 'I trim my hedge a little low, so people outside can see in.'),
      L('အဆုံးဆိုတာ ဘယ်တော့မှ တကယ့်အဆုံး မဟုတ်ဘူး။', 'An end is never really the end.'),
      L('လမ်းက ရွှံ့ဗွက်။ နောက်လူ လျှောက်လွယ်အောင် ကျောက်ခဲ ခင်းတယ်။', "The road's all mud. I'm laying stones so the next person has it easier.", { days: [12] }),
      L('ခရီးသည်တွေ ရေဒီယိုနဲ့ သီချင်းဆိုသွားတယ်။ ပျော်ပါစေ။', 'The travellers went by singing along to their radio. Let them have fun.', { days: [13] }),
    ] },
  },

  rooms: {
    kilntea: [
      L('ချိတ်မှာ အရင်ချိန်ထားရင် ဝယ်သူရှေ့မှာ စိတ်အေးတယ်။', "Weigh at the hook first and you're easy in front of the buyer.", { job: 'carter' }),
      L('ပိုက်ဆံ နည်းနည်း ပိုရဖို့ ညလုံးပေါက် အိပ်မပျော်ရင် မတန်ဘူး။', "A few extra coins aren't worth a sleepless night.", { job: 'carter' }),
      L('ဘယ်သူ ဘယ်လောက်ရလဲ မမေးနဲ့။ ကိုယ့်လှည်း ကိုယ်တွန်း။', "Don't ask who made how much. Push your own cart.", { job: 'carter' }),
      L('ရေဖျန်းရင် ပိုလေးတာပေါ့။ ကျုပ် မလုပ်ဘူး။ မျက်နှာ မပြရဲမှာ။', "Sprinkle it and it weighs more, sure. I won't. Couldn't show my face.", { job: 'carter', days: [10], unless: 'd10.ch17Done' }),
      L('ကိုဖြိုး အခြောက်ချိန်တယ်တဲ့။ ကျုပ်လည်း နောက်ကလိုက်မယ်။', "Ko Phyo weighs dry, they say. I'll do the same.", { job: 'carter', from: 11, flag: 'd10.ch17Done' }),
      L('မိုးခိုရင်း လက်ဖက်ရည်သောက်ရတာ မဆိုးဘူး။ မိုးကို ပျော်လိုက်။', "Tea while sheltering isn't bad. Can't beat the rain? Enjoy it.", { job: 'carter', days: [12] }),
      L('ချိန်သီးအသစ် ချိတ်ကတည်းက ဆန်ဝယ်သူ ပိုလာတယ်တဲ့။', 'Since the new weights went up, more people buy rice there, they say.', { job: 'carter', from: 13, flag: 'd12.ch20Done' }),
    ],
    paperstore: [
      L('စိုတဲ့စက္ကူက လေးတယ်၊ ဒါပေမဲ့ ပုပ်တယ်။', "Wet paper's heavy, but it rots.", { job: 'carter' }),
      L('ဒီဂိုဒေါင် ခေါင်မိုးထိ ပြည့်တယ်။ ပိုင်ရှင် မျက်နှာကတော့ မပြည့်ဘူး။', "This store's full to the roof. The owner's face isn't.", { job: 'carter' }),
      L('အလေးချိန် လိမ်ရင် ပထမဆုံး လိမ်ခံရတာ ကိုယ့်အိပ်ရာပဲ။', 'Cheat the weight and the first thing cheated is your own sleep.', { job: 'carter' }),
      L('ချိန်တာ မြန်တယ်။ ဂဏန်းကို ကိုယ်တိုင် ကြည့်ရမှ စိတ်ချရတယ်။', 'The weighing is quick. I only feel easy watching the number myself.', { job: 'carter', days: [10] }),
      L('ဒီနေ့ အထုပ်တွေ စိုနေတယ်။ ခြောက်မှ ပြန်လာမယ်။', "Bales are damp today. I'll come back when they're dry.", { job: 'carter', days: [12] }),
      L('ပိုင်ရှင်က အထုပ်ပေါ် ကိုယ့်နာမည် ရေးနေတယ်။ ရဲတာ ကောင်းတယ်။', "The owner's chalking his own name on the bales. Takes nerve. Good.", { job: 'carter', from: 14 }),
    ],
    packroom: [
      L('အိုး ငါးလုံး ထည့်တဲ့နေ့၊ ခြောက်လုံး ထည့်တဲ့နေ့… စမ်းမှ သိတာ။', 'Five pots one day, six the next… only trying tells you.', { job: 'potter' }),
      L('ကွဲတဲ့အိုးတွေ စင်ပေါ် တင်ထားတယ်။ သင်ခန်းစာပဲ။', 'Cracked pots go on the shelf. They are lessons.', { job: 'potter' }),
      L('အိုးပူကို လက်ဗလာနဲ့ ကိုင်ရင် ကိုယ့်လက်ပဲ လောင်တယ်။', "Grab a hot pot bare-handed and it's your own hand that burns.", { job: 'potter' }),
      L('ဘေးကအိုးသမား ကျုပ်ထက် မြန်တယ်။ ကြည့်ပြီး သင်တယ်။', 'The potter beside me is faster. I watch and learn.', { job: 'potter' }),
      L('စိုထိုင်းလို့ ကောက်ရိုး ထပ်ထည့်တယ်။ ကွဲမှ ပြင်ရင် နောက်ကျတယ်။', 'Extra straw in the damp. Fix it after it cracks and you are too late.', { job: 'potter', days: [12] }),
    ],
    gourdhouse: [
      L('အဒေါ့် ဘူးကြော်က အကောင်းဆုံး။ ဘယ်သူ့ကိုမှ မခွဲခြားဘဲ ကျွေးတယ်။', "Aunty's gourd fritters are the best. She feeds anyone.", { job: 'visitor' }),
      L('သူက အတင်း မပြောဘူး။ ဒါကြောင့် လူတိုင်း ဒီလာထိုင်တာ။', "She doesn't gossip. That's why everyone sits here.", { job: 'visitor' }),
      L('အိမ်နီးချင်းကို ရစ်ပတ်စရာ မလိုဘူး။ နှုတ်ဆက်ရင် ရပြီ။', "No need to wind round your neighbours. A hello's enough.", { job: 'visitor' }),
      L('ဒီနှစ်လည်း ပန်းဥ ရပြန်ပြီ။ ပုလင်းလွတ်ကို ပြန်ဖြည့်မယ်။', "Got bulbs again this year. I'll fill the empty jar.", { job: 'visitor', from: 11, flag: 'd10.bulbs' }),
      L('မိုးထဲ ဒီမီးဖိုချောင်က နွေးတယ်။ ရေစိုသူတိုင်း လာထိုင်ကြ။', 'This kitchen is warm in the rain. Anyone wet, come and sit.', { job: 'visitor', days: [12] }),
      L('အဘိုးကြီး ဒီမနက် ကြော်တာ လာဝယ်တယ်။ ပထမဆုံးအကြိမ်။', 'Grandpa came and bought fritters this morning. First time ever.', { job: 'visitor', from: 13, flag: 'd12.ch19Done' }),
    ],
    hpohtawshed: [ // only once his gate is open to callers (Day 13 on); Day 12 he is alone in here
      L('ဒိုင်ယာရီ လေးဆယ်အုပ်။ တစ်နေ့နဲ့ တစ်နေ့ မတူဘူး။', 'Forty diaries. No two days alike.', { job: 'visitor', from: 13 }),
      L('မိုးရွာတဲ့နေ့ ဘယ်လိုရေးလဲ။ "မိုးရွာတယ်" တဲ့။ ဒါပဲ။', "What did he write for the rain day? 'It rained.' That's all.", { job: 'visitor', from: 13, flag: 'd12.ch19Done' }),
      L('ခေါင်မိုးယိုတာ ဖာပေးမယ် ဦး။ ဝါးတစ်ချောင်း ယူလာတယ်။', "I'll patch the leak for you, Uncle. Brought a bamboo pole.", { job: 'visitor', from: 13 }),
      L('ဦး၊ ပေါက်ပြား ပြန်ပို့တာ။ နောက်ကျသွားလို့ တောင်းပန်ပါတယ်။', "Uncle, your hoe back. Sorry it's so late.", { job: 'visitor', from: 14 }),
      L('အမြဲ လာနေစရာ မလိုဘူးနော် ဦး။ လိုရင် ခေါ်။', "I won't hover, Uncle. Call if you need me.", { job: 'visitor', from: 14 }),
    ],
    dryinghall: [
      L('အိုးလှဆိုင် လူစည်တာ မနာလိုစရာ မဟုတ်ဘူး။ သူ ကြိုးစားထားတာ။', "No envying the busy glaze stall. She worked for it.", { job: 'buyer' }),
      L('ကျုပ်ငယ်ငယ်ကလည်း အိုးဖုံးကို ခေါက်ကစားခဲ့တာပဲ။', 'When I was little I rattled pot lids too.', { job: 'potter' }),
      L('အိုးစိမ်းကို နင်းမိရင် ကိုယ့်ခြေထောက် ကြည့်။ ဘေးလူကို မကြည့်နဲ့။', 'Step on a green pot? Look at your own feet, not the person beside you.', { job: 'potter' }),
      L('အထဲမှာ ကျပ်တယ်၊ ဒါပေမဲ့ ခြောက်တယ်။ ညည်းစရာ မရှိဘူး။', 'Cramped in here, but dry. Nothing to grumble about.', { job: 'buyer', days: [12] }),
      L('ဒီရက်ပိုင်း ဝယ်တဲ့ဆန် နည်းနေသလိုပဲ။ မသေချာသေးလို့ မပြောသေးဘူး။', "The rice I buy seems short lately. Not sure yet, so I'm not saying.", { job: 'buyer', days: [12], unless: 'd12.ch20Done' }),
      L('ဒေါ်အုန်း မအော်ဘူး။ ကိုယ်တိုင်ချိန်ပြီး တိုင်လိုက်တယ်တဲ့။', "Daw Ohn didn't shout. She weighed it herself and reported it, they say.", { job: 'buyer', flag: 'd12.ch20Done' }),
      L('ဒီဘက်ဆိုင်နဲ့ ဟိုဘက်ဆိုင် အခု ခေါင်းညိတ် နှုတ်ဆက်ကြတယ်။', 'The two stalls across from each other nod hello now.', { job: 'potter', from: 13, flag: 'd12.ch20Done' }),
    ],
    committeeroom: [
      L('တိုင်စရာ ရှိလို့ လာတာ။ စိတ်အေးအောင် အရင် ထိုင်နေတယ်။', "I came to complain. I'm sitting a while to cool down first.", { job: 'buyer' }),
      L('ဒေါသနဲ့ ပြောရင် နားမထောင်ကြဘူး။ အမှန်နဲ့ ပြောရင် နားထောင်တယ်။', 'Say it angry and nobody listens. Say it straight and they do.', { job: 'buyer' }),
      L('ကော်မတီက ကိုယ်တိုင် ပြန်စစ်တယ်။ ပြောတိုင်း မယုံဘူး။', "The committee checks for itself. It doesn't believe just anything.", { job: 'vendor' }),
      L('မိုးထဲ ထီးမပါဘဲ ဒီထိလာတာ။ နောက်လူ မခံရအောင်ပဲ။', 'Came all this way in the rain, no umbrella. So the next person is not cheated.', { job: 'buyer', days: [12] }),
      L('ဒီနေ့ တိုင်စာ တစ်စောင်က ရှင်းရှင်းလေး။ ဂဏန်းတွေနဲ့ပဲ။', 'One complaint today was so clear. Just the numbers.', { job: 'vendor', days: [12], flag: 'd12.ch20Done' }),
      L('ပြီးသွားတဲ့ကိစ္စကို နာမည်နဲ့ မကပ်ဘူး။ ပြင်ပြီးရင် ပြီးပြီ။', "A settled matter doesn't go up with a name on it. Put right is put right.", { job: 'vendor', from: 13, flag: 'd12.ch20Done' }),
    ],
  },

  pairs: [
    { who: ['aunty', 'gardener'], when: { days: [10], unless: 'd10.ch16Done' }, lines: [
      L('အဘိုးကြီး တံခါးပိတ်ထားတာ လူမုန်းလို့တဲ့။', "They say grandpa shut his gate because he hates people."),
      L('ငါ ကိုယ်တိုင် မေးမကြည့်ဖူးဘူး။ မင်းရော။', "I've never asked him myself. Have you?"),
      L('…မမေးဖူးဘူး။', '…No.'),
    ] },
    { who: ['gardener', 'gardener'], when: { flag: 'd10.ch16Done' }, lines: [
      L('တံခါး ဟလာပြီ။ ဝင်သွားကြမလား။', "Gate's open. Shall we go in?"),
      L('ဖိတ်မှ ဝင်မယ်။ လက်တစ်ဝါးဆိုတာ လက်တစ်ဝါးပဲ။', 'When he invites us. A hand-width is a hand-width.'),
      L('ဟုတ်သားပဲ။', 'True.'),
    ] },
    { who: ['carter', 'carter'], when: { days: [10], unless: 'd10.ch17Done' }, lines: [
      L('ရေနည်းနည်း ဖျန်းရင် နှစ်ပိဿာ ပိုရတယ်တဲ့။', 'A little water adds two viss, they say.'),
      L('ပြီးတော့ ညတိုင်း ဝယ်သူ သိသွားမလား တွေးနေမှာလား။', 'And then lie awake every night wondering if the buyer knows?'),
      L('…အဲဒါ မတွေးမိဘူး။', "…Didn't think of that."),
    ] },
    { who: ['carter', 'vendor'], when: { from: 11, flag: 'd10.ch17Done' }, lines: [
      L('ကိုဖြိုး ဘာလို့ ခြောက်မှ ချိန်တာလဲ။ ရှုံးမှာပေါ့။', 'Why does Ko Phyo weigh dry? He loses out.'),
      L('ပိုက်ဆံ နည်းနည်း ရှုံးတယ်။ အိပ်ရေးကတော့ နိုင်တယ်။', 'Loses a few coins. Wins his sleep.'),
    ] },
    { who: ['aunty', 'aunty'], when: { days: [12] }, lines: [
      L('ငါ့ခြံပဲ ပျက်တာ ထင်နေတာ။', 'I thought it was only my plot.'),
      L('ငါ့ဟာလည်း ပျက်တယ်။ လာ၊ အတူ ပြင်ရအောင်။', "Mine too. Come on, let's fix them together."),
      L('အတူဆိုရင် မြန်မြန် ပြီးမှာ။', "Together it'll be quicker."),
    ] },
    { who: ['kid', 'kid'], when: { days: [12], unless: 'd12.ch20Done' }, lines: [
      L('ဟိုအဒေါ်ကြီးရဲ့ အိုးဖုံး ဘာလို့ ခုန်တာလဲ။', "Why does that aunty's pot lid jump?"),
      L('စိတ်ဆိုးလို့ ထင်တယ်။', "Because she's angry, I bet."),
      L('အိုးက စိတ်ဆိုးတတ်လား။', 'Can a pot get angry?'),
    ] },
    { who: ['kid', 'kid'], when: { flag: 'd12.ch20Done' }, lines: [
      L('ရေနွေးငွေ့က အိုးဖုံးကို တွန်းတာတဲ့။', 'The steam pushes the lid, she said.'),
      L('ဒါဆို ငါတို့ ခေါ်တာ မှားတာပေါ့။', 'Then we called her the wrong thing.'),
      L('မနက်ဖြန် တောင်းပန်မယ်။', "I'll say sorry tomorrow."),
    ] },
    { who: ['buyer', 'vendor'], when: { flag: 'd12.ch20Done' }, lines: [
      L('ချိန်သီးတွေ ပါးတယ်ဆိုတာ မှန်တယ်တဲ့။', 'It was true about the light weights, they say.'),
      L('အော်မနေဘဲ ကော်မတီကို အမှန်တွေ ပြလိုက်တာ။', 'No shouting. She just showed the committee the facts.'),
      L('နောက်ဝယ်မယ့်သူအတွက် ကောင်းတယ်။', 'Good for whoever buys next.'),
    ] },
    { who: ['elder', 'gardener'], when: { from: 13, flag: 'd12.ch19Done' }, lines: [
      L('ဦးဖိုးထော် "ငါ့ကျမှ" မပြောတော့ဘူး။', "U Hpo Htaw doesn't say 'why me' any more."),
      L('အဝေးခင်းကို တစ်ယောက်တည်း စတယ်။ ကူမလားဆိုတော့ "သဘော" တဲ့။', "He started the far bed alone. I offered to help: 'up to you', he said."),
    ] },
    { who: ['gardener', 'aunty'], lines: [
      L('အပင်တွေ အကုန် ရေလောင်းပြီးပြီလား။', 'Watered everything?'),
      L('ငါ့ဟာ ငါလောင်းပြီ။ ဘေးခြံကို တစ်ပုံး ပိုလောင်းပေးလိုက်တယ်။', "Mine, yes. Tipped an extra bucket on next door's."),
      L('သူ သိရဲ့လား။', 'Does he know?'),
      L('သိစရာ မလိုပါဘူး။', 'No need for him to.'),
    ] },
    { who: ['traveller', 'gardener'], when: { days: [13] }, lines: [
      L('ဒီလမ်းအဆုံးမှာ ဘာရှိလဲ ဦး။', "What's at the end of this road, Uncle?"),
      L('မရောက်ဖူးဘူး။ ကြားတာတော့ အမျိုးမျိုးပဲ။', "Never been. Heard all sorts, though."),
      L('ဒါဆို ကြားတာကို မယုံသေးဘူး။', "Then I won't believe any of it yet."),
    ] },
    { who: ['carter', 'elder'], when: { days: [14], flag: 'd14.inv.garden' }, lines: [
      L('စက္ကူဆိုင်ပိုင်ရှင်ကိုလည်း ဖိတ်တယ်တဲ့။', 'They invited the paper-store owner too, they say.'),
      L('ဘာဖြစ်လဲ။ ပြင်ပြီးသားလူကို ဘာလို့ ချန်ထားမလဲ။', "Why not? Why leave out someone who's put it right?"),
    ] },
  ],

  arrive: {
    first: L('(ဒိုင်ယာရီထဲ လမ်းလျှောက်နေသလိုပဲ။ ပန်းခင်းတိုင်းမှာ ရက်စွဲ ရှိတယ်။)', '(Like walking inside a diary. Every bed has a date.)', { job: 'maya' }),
    again: [
      L('(တံခါးက လက်တစ်ဝါးစာ ဟနေတယ်။ အဲဒီလောက်ပဲ။ လုံလောက်တယ်။)', "(The gate's open a hand-width. That's all. It's enough.)", { job: 'maya', area: 'hpGate', from: 11, flag: 'd10.ch16Done' }),
      L('(မိုးက ဒီဥယျာဉ်ကို ရွေးမရွာဘူး။ အကုန်လုံး စိုနေတယ်။)', "(The rain didn't choose this garden. Everything's soaked.)", { job: 'maya', area: 'claspArch', days: [12] }),
      L('(ရင်ပြင်မှာ ချိန်ခွင်တွေ ငြိမ်နေတယ်။ ရေဖျန်းသံ မကြားရဘူး။)', '(The scales on the square are still. No sound of sprinkling.)', { job: 'maya', area: 'kilnSquare', from: 11, flag: 'd10.ch17Done' }),
    ],
  },
};

// ===================================================================================================================
// THE BLANK PAGE and THE BACK COVER  (regions/blank.js: the hedge gap 140, 17.4; the lodge 131, -9.15;
// the back cover's door 126, -60.2; the road home blankHome, gated 'backCover')
// ===================================================================================================================
const BLANK = {
  town: [
    L('ကြားတာနဲ့ပဲ မယုံဘူး။ ကိုယ်တိုင် လျှောက်ကြည့်မှ။', "I don't believe it just because I heard it. I walk it myself.", { job: 'traveller' }),
    L('မြေပုံက လမ်းပြတာပဲ။ လျှောက်ရတာက ကိုယ့်ခြေထောက်။', 'A map only shows the road. Your own feet walk it.', { job: 'traveller' }),
    L('စောင့်ရတာ မုန်းလို့ ကျွန်မ ဘယ်တော့မှ နောက်မကျဘူး။ ရိုးရိုးလေးပဲ။', "I hate being kept waiting, so I'm never late. Simple.", { job: 'elder' }),
    L('တိတ်တာ ပြစ်ဒဏ် မဟုတ်ဘူး။ နားထောင်ဖို့ နေရာ ချန်ထားတာ။', "Quiet isn't a punishment. It's room left to listen.", { job: ['keeper', 'dawpwint'] }),
    L('ကောင်းတဲ့စကား ကြားရင် ဘယ်သူ ပြောလဲ မှတ်ထားတယ်။', 'When I hear a good saying, I remember who said it.', { job: 'traveller' }),
    L('ဒီမှာ ဘာမှ မရှိဘူးတဲ့။ ကျွန်တော် ကြက်ဥ သုံးလုံး တွေ့တယ်!', "They said there's nothing here. I found three eggs!", { job: 'kid' }),
    L('အစွန်းရောက်ရင် မမြင်ရဘူး။ အလယ်မှာ ရပ်မှ နှစ်ဘက်လုံး မြင်တယ်။', 'Stand at one edge and you see nothing. In the middle you see both sides.', { job: 'traveller' }),
    L('ဗလာစာရွက်က ကြောက်စရာ မဟုတ်ဘူး။ ရေးစရာနေရာ ကျန်သေးတာ။', "A blank page isn't frightening. It just means there's room left to write.", { job: 'elder' }),
    L('မေးတိုင်း အမေက "ကိုယ်တိုင် စမ်းကြည့်" တဲ့။', "Every time I asked, Mum said 'try it yourself'.", { job: 'traveller' }),
    L('ဒီအိမ်မှာ ဘယ်သူမှ သော့မခတ်ဘူး။ မပေးတာ မယူကြလို့။', "Nobody locks anything in this house. Nobody takes what isn't given.", { job: ['keeper', 'dawpwint'] }),
    L('ဆရာပြောလို့ဆိုပြီး မလုပ်ဘူး။ စမ်းပြီးမှ လုပ်တယ်။', "I don't do it just because my teacher said so. I try it first.", { job: 'traveller' }),
    L('မှောင်ရင် ရေဒီယို ပိတ်တာ ဒီက ဓလေ့ပဲ။ ကြယ်တွေ မြင်ရအောင်။', "Radio off after dark is just the custom here. So you can see the stars.", { job: 'elder' }),
    L('ကိုယ်ယုံတာကို တခြားသူ မယုံလည်း ရန်ဖြစ်စရာ မလိုဘူး။', "If others don't believe what I believe, no need to fight.", { job: 'traveller' }),
    L('ဘယ်ဘာသာက ဧည့်သည်ဖြစ်ဖြစ် ထမင်းက တစ်အိုးတည်း။', 'Guests of any faith, it is one pot of rice.', { job: ['keeper', 'dawpwint'] }),
    L('စာရွက်တစ်ခုလုံး ပုံဆွဲလို့ရတယ်! ဒါပေမဲ့ အမေ့ကို အရင် မေးမယ်။', "The whole page is free to draw on! But I'll ask Mum first.", { job: 'kid' }),
    L('နေက တစ်နေကုန် နိမ့်နေတယ်။ အရိပ်ရှည်တော့ ကိုယ့်အရိပ် ကိုယ်မြင်တယ်။', 'The sun stays low all day. Shadows grow long; you see your own.', { job: 'worker' }),
    // reactions
    L('ရေဒီယိုသံ ကျယ်တော့ ငှက်သံ မကြားရဘူး။', "With the radio that loud you can't hear the birds.", { job: 'worker', days: [13], unless: 'd13.ch22Done' }),
    L('ဟောပြောတယ်လို့ မပြောခင် ကိုယ်တိုင် အရင် ဖတ်ကြည့်ရမယ်။', 'Before I call it preaching, I should read it myself.', { job: 'traveller', days: [13], unless: 'd13.ch22Done' }),
    L('ဥယျာဉ်ဘက်က ဆိုင်းဘုတ်ဖျက်တယ်လို့ ကြားတယ်။ မမြင်ရဘဲ မယုံသေးဘူး။', "Heard from the garden side that someone scrubbed a board. Not believing it till I see it.", { job: 'elder', days: [13], unless: 'd13.ch22Done' }),
    L('ညကျ ရုတ်တရက် တိတ်သွားတယ်။ ကြယ်တွေ ပေါ်လာတယ်။', 'It suddenly went quiet tonight. Then the stars came out.', { job: 'worker', flag: 'd13.ch22Done' }),
    L('လူငယ်တွေ ကိုယ်တိုင်စမ်းပြီး လက်မှတ်ထိုးကြတယ်တဲ့။ ဘယ်သူမှ မခိုင်းဘူး။', 'The young ones tried it themselves and signed, they say. Nobody made them.', { job: 'elder', flag: 'd13.ch22Done' }),
    L('မြောက်ဘက် ဘယ်သူမှ မလျှောက်ဖူးဘူးတဲ့။ အခု ခြေရာတွေ ရှိနေပြီ။', 'Nobody ever walked north, they said. Now there are footprints.', { job: 'traveller', flag: 'd13.road' }),
    L('လမ်းသစ်မှာ ကျွန်တော့် ခြေရာလည်း ပါတယ်။ ကိုယ်တိုင် လျှောက်ခဲ့တာ။', 'My footprints are in the new road too. I walked it myself.', { job: 'traveller', from: 14, flag: 'd13.road' }),
    L('နောက်ကျောဖုံး တံခါး ပွင့်သွားပြီတဲ့။ သော့ပေါက် ရှိတာပဲ။', 'The back-cover door opened, they say. So there was a keyhole after all.', { job: 'traveller', flag: 'd14.door' }),
    L('ကိုးကားစာရင်း ပါတဲ့ စာအုပ်ကို ယုံရတယ်။ ဘယ်ကရလဲ ပြောထားလို့။', 'I trust a book with a list of where it got things. It says where they came from.', { job: 'elder', from: 14 }),
    L('ခရီးသည်ကိုတောင် နာမည်နဲ့ ဖိတ်တယ်။ နာမည်ပါတာ ဝမ်းသာတယ်။', "Even travellers are invited by name. I'm glad my name's in it.", { job: 'traveller', days: [14], flag: 'd14.inv.blank' }),
    L('ဒီည အိမ်ပြန်လမ်းကနေ ပွဲသွားကြမယ်။ ကိုယ့်ခြေနဲ့ကိုယ်။', "Tonight we'll walk the road home to the do. On our own feet.", { job: 'elder', days: [15] }),
  ],

  areas: {
    // the gap in the last hedge, the little sign and the pencil stub (gap 140, 17.4; sign 137.6, 15.4; stub 136.6, 13.2)
    hedgeGap: { at: { x: 138.6, z: 15.2, r: 3.5 }, lines: [
      L('ဒီက စပြီး ဘာမှ မရေးရသေးဘူး။ ခြေရာနဲ့ ရေးရမှာ။', 'Nothing is written from here on. Footsteps do the writing.'),
      L('ဆိုင်းဘုတ်လေးက နာမည်ပဲ ပြောတယ်။ ဘာလုပ်ရမလဲ မပြောဘူး။', "The little sign only says the name. It doesn't say what to do."),
      L('ခဲတံတိုလေး ကျနေတယ်။ တစ်ယောက်ယောက် ဒီက စရေးခဲ့တာ။', 'A pencil stub lying there. Someone started writing here.'),
      L('ဗလာဆိုတာ ဘာမှမရှိတာ မဟုတ်ဘူး။ မမြင်ရသေးတာ။', "Blank doesn't mean nothing's there. Just not seen yet."),
      L('လမ်းပြမြှား မရှိဘူး။ ကိုယ့်မျက်စိပဲ ရှိတယ်။', 'No arrows here. Just your own eyes.'),
      L('ဗလာရွက်ပေါ်မှာ အမိုးတစ်ခု ရှိကြောင်း အခု လူတိုင်း သိပြီ။', 'Everyone knows now there is a roof on the blank leaf.', { from: 14, flag: 'd13.ch22Done' }),
    ] },
    // the pencil path, the desk `blank` and the plank bench, the water jars (desk 143, 10.6; bench 141.9, 4.2; jars 135.6, 2)
    pencilPath: { at: { x: 140.4, z: 5.6, r: 5 }, lines: [
      L('ခဲတံလိုင်းက ဖျက်လို့ရတယ်။ မှားရင် ပြန်ဆွဲရုံပဲ။', 'Pencil lines can be rubbed out. Wrong? Draw it again.'),
      L('ခုံလေးမှာ ထိုင်ပြီး ဘာမှမလုပ်ဘဲ ကြည့်နေတာ ကြိုက်တယ်။', 'I like sitting on this bench doing nothing but looking.'),
      L('လမ်းဘေး ရေအိုး ဘယ်သူ ဖြည့်ထားလဲ မသိဘူး။ ကျေးဇူးပဲ။', "Don't know who fills the jars by the path. Thank you, whoever you are."),
      L('ကိုယ့်ခြေရာနဲ့ ရှေ့ကလူ ခြေရာ ရောနေတယ်။ ဘယ်သူ့ဟာလဲ မှတ်ထားချင်တယ်။', "My prints mix with the ones ahead. I'd like to remember whose are whose."),
      L('အိမ်ဘက်က ဆူညံသံ ဒီထိ လာတယ်။ ဒီမှာ ထိုင်ရတာ ပိုအေးတယ်။', 'The din from the house carries out here. Calmer sitting here.', { days: [13], unless: 'd13.ch22Done' }),
      L('ဒီလမ်းက အရင်က ဒီမှာ ဆုံးတာ။ အခု ဆက်သွားပြီ။', 'This path used to end here. Now it goes on.', { flag: 'd13.road' }),
    ] },
    // the travellers' rest ground: tea cart 133, 8.2 · well 127, 5 · hopscotch 129.6, 13.6 · bench 116, 7
    restGround: { at: { x: 128.0, z: 8.4, r: 6.5 }, lines: [
      L('ခဲတံနဲ့ ကွက်ဆွဲထားတာ။ ဘယ်သူ့အကွက်မှ မဟုတ်ဘူး၊ အကုန်လုံးရဲ့ဟာ။', "Pencil hopscotch. Nobody's squares; everybody's.", { job: 'kid' }),
      L('ရေနွေးကြမ်း အလကား။ ခွက်ကိုတော့ ပြန်ထားပေးနော်။', 'Plain tea is free. Just put the cup back.', { job: 'vendor' }),
      L('ရေတွင်းရေ ချိုတယ်တဲ့။ ကျွန်မ သောက်ကြည့်ပြီးပြီ၊ ချိုတယ်။', "They said the well water's sweet. I tasted it: it is.", { job: 'elder' }),
      L('ခရီးသည်တွေ ဘယ်ကလာလာ ဒီရေတွင်းက အတူတူ သောက်တာပဲ။', 'Wherever travellers come from, they drink from the same well.', { job: 'elder' }),
      L('အိမ်ထဲက လူငယ်တွေ ဆူတယ်။ ဆိုးလို့ မဟုတ်ဘူး၊ သိချင်လို့။', "The young ones inside are noisy. Not bad: curious.", { job: 'vendor', days: [13], unless: 'd13.ch22Done' }),
      L('ဒီမနက် လူငယ်တွေ ရေတွင်းမှာ ကျွန်မကို ရေခပ်ပေးတယ်။', 'This morning the young ones drew water for me at the well.', { job: 'elder', from: 14, flag: 'd13.ch22Done' }),
    ] },
    // the lodge yard, verandah and steps (yard 131.4, -3.9; steps 131, -6.15)
    lodgeYard: { at: { x: 131.2, z: -4.4, r: 5 }, lines: [
      L('ဖိနပ်ချွတ်ပြီး ဝင်တာ ဒီအိမ်ရဲ့ ဓလေ့ပဲ။ အပြစ်ပေးတာ မဟုတ်ဘူး။', "Sandals off at the door is this house's custom. Not a punishment."),
      L('အိမ်စည်းကမ်း မကြိုက်ရင် ပြောလို့ရတယ်။ ဖြုတ်ပစ်တာကတော့ တခြားကိစ္စ။', "You can say you don't like the house rules. Tearing them down's another thing."),
      L('မီးခိုး တက်နေရင် ဧည့်သည် လက်ခံတယ်ဆိုတဲ့ သဘောပဲ။', 'Smoke rising means guests are welcome.'),
      L('ဓလေ့ကို အစွန်းရောက်တယ်တဲ့။ စမ်းမကြည့်ရသေးဘဲနဲ့။', 'They call the custom extreme. Without trying it yet.', { days: [13], unless: 'd13.ch22Done' }),
      L('ခေါင်းစဉ်က အဖုံးကို သူတို့ ကိုယ်တိုင် လှပ်လိုက်တယ်တဲ့။', 'They lifted the cloth off the title themselves, they say.', { flag: 'd13.ch22Done' }),
      L('လက်မှတ်စာရွက်မှာ အကွက်လွတ် တစ်ကွက်။ ရိုးသားလို့ ချန်ထားတာ။', 'One gap left on the signing strip. Left out of honesty.', { from: 14, flag: 'd13.ch22Done' }),
      L('ဒီည ပွဲသွားမယ်။ ပြန်လာတဲ့သူအတွက် မီးအိမ် ချိတ်ထားခဲ့မယ်။', "Off to the do tonight. We'll leave the lantern on its hook for whoever comes back.", { days: [15] }),
    ] },
    // the lodge's west plot: washing line, woodpile, kitchen plot, hens (laundry 121.8, -6.3; hens 125, -3.3)
    westPlot: { at: { x: 122.4, z: -6.2, r: 5 }, lines: [
      L('အဝတ်ကို ကိုယ့်ကြိုးပေါ်ပဲ လှန်းတယ်။ သူများကြိုး မမေးဘဲ မသုံးဘူး။', "I hang washing on my own line. Never someone else's without asking."),
      L('ကြက်မကြီးက ကျွန်တော့်ကို မကြိုက်ဘူး။ သူ့ဥ ယူခဲ့လို့ ထင်တယ်။', "The big hen doesn't like me. Maybe because I took her eggs.", { job: 'kid' }),
      L('ထင်း နေ့တိုင်း နည်းနည်းခွဲ။ တစ်ခါတည်း ခွဲရင် ခါးနာတယ်။', 'Split a little wood every day. All at once and your back hurts.'),
      L('ပဲပင်က နေပြင်းပြင်းလည်း မကြိုက်ဘူး၊ ရေများများလည်း မကြိုက်ဘူး။', "Beans like neither harsh sun nor too much water. The middle's best."),
      L('ဒီရွက်ပေါ်မှာ အမိုး တစ်ခုပဲ ရှိတော့ အချင်းချင်း ငဲ့ညှာရတယ်။', 'Only one roof on this leaf, so we look out for each other.'),
      L('ဒီမနက် ကြိုး ငှားမလားလို့ လာမေးတယ်။ မေးတာ ကြိုက်တယ်။', 'Someone asked to borrow my line this morning. I like being asked.', { from: 14, flag: 'd13.ch22Done' }),
    ] },
    // north of the lodge on the white, the walkers' line (= blankHome once inked)
    walkNorth: { at: { x: 136.0, z: -26.0, r: 12 }, lines: [
      L('လမ်းမရှိတဲ့နေရာမှာ ကိုယ့်ခြေထောက်ကို ယုံရတယ်။', "Where there's no road, you trust your own feet."),
      L('မြောက်ဘက်မှာ ဘာမှမရှိဘူးတဲ့။ ဘယ်သူမှ မသွားဖူးတော့ ဘယ်သူ သိမလဲ။', "Nothing up north, they say. Nobody's been, so who would know?", { days: [13], unless: 'd13.road' }),
      L('လူတွေ အတူလျှောက်တော့ ခြေရာက လမ်း ဖြစ်သွားတယ်။', 'People walked it together and the footprints became a road.', { flag: 'd13.road' }),
      L('အဝေးက အမှောင်လိုင်းကို ကြောက်ခဲ့တာ။ နီးလာတော့ စာအုပ်ဖုံးပဲ။', 'I was afraid of the dark line far off. Up close it is just a cover.', { flag: 'd13.road' }),
      L('ရွှေရောင်လမ်း။ ဘယ်သူမှ မဆွဲဘူး၊ လျှောက်လို့ ဖြစ်တာ။', 'A gold road. Nobody drew it; walking made it.', { from: 14, flag: 'd13.road' }),
      L('လမ်းတစ်လမ်းကို လူများများ လျှောက်လေ ခိုင်လေပဲ။', 'The more people walk a road, the firmer it gets.', { days: [15] }),
    ] },
    // in front of the back cover's door (bBoard 126, -56.8; door 126, -59.7)
    backCover: { at: { x: 126.0, z: -56.4, r: 5 }, lines: [
      L('စာအုပ်တိုင်းရဲ့ နောက်ဆုံးမှာ ဘယ်ကရလဲ ရေးထားသင့်တယ်။', 'Every book should say at the end where it got things.'),
      L('နောက်ကျောဖုံးက အဆုံးလိုပဲ။ စာရေးသူအတွက်တော့ နောက်တစ်အုပ်ရဲ့ အစ။', 'A back cover looks like the end. For a writer it is the start of the next book.'),
      L('စာအုပ်ကြီးရဲ့ နောက်ကျောဖုံး။ အထဲမှာ ဘာရှိလဲ ကိုယ်တိုင် မမြင်ရသေးဘူး။', "The big book's back cover. What's inside, I haven't seen for myself.", { flag: 'd13.road', unless: 'd14.door' }),
      L('ကိုးကားစာရင်းလိုပဲ။ ခြေရာတိုင်းမှာ နာမည်တစ်ခုစီ ရှိတယ်။', 'Like a list of sources: every footprint has a name.', { flag: 'd13.road' }),
      L('တံခါး ပွင့်သွားပြီ။ ပိုင်ရှင့်သော့နဲ့ပဲ ပွင့်တာတဲ့။', "The door's open. Only its owner's key opens it, they say.", { flag: 'd14.door' }),
      L('လမ်းဆုံးမှာ စာအုပ်ကြီး ဆုံးတယ်။ ကိုယ့်လမ်းကတော့ ဆက်ရဦးမယ်။', 'The book ends where the road ends. Your own road goes on.', { from: 14 }),
    ] },
  },

  rooms: {
    lodge: [
      L('အိပ်တဲ့နေရာမှာ ကိုယ်မခံချင်တာကို ကိုယ်လည်း မလုပ်ရင် ပြီးတာပဲ။', "Where people sleep, just don't do what you wouldn't want done to you. That's it.", { job: 'guest' }),
      L('ဒီက ရေနွေးကြမ်းက ဘာမှ ပြန်မတောင်းဘူး။', 'The plain tea here asks nothing back.', { job: 'guest' }),
      L('မကြိုက်တဲ့ ဓလေ့ကိုလည်း တစ်ညတော့ စမ်းနေကြည့်တယ်။', "A custom I didn't like, I tried for one night anyway.", { job: 'guest' }),
      L('သူများအိမ်ဓလေ့ကို လေးစားတယ်။ ကိုယ့်အိမ်ကိုလည်း ဒီလို လိုချင်လို့။', "I respect other houses' customs. I'd want the same for mine.", { job: 'guest' }),
      L('ရေဒီယို ဖွင့်ထားတော့ ကိုယ့်အတွေး ကိုယ် မကြားရဘူး။', "With the radio on I can't hear my own thoughts.", { job: 'guest', days: [13], unless: 'd13.ch22Done' }),
      L('မှောင်ရင် တိတ်ရမယ်တဲ့။ ဒါဆို တစ်ခါလောက် စမ်းကြည့်ရင်ရော…', "Quiet after dark, she says. What if we just tried it once…", { job: 'guest', days: [13], unless: 'd13.ch22Done' }),
      L('တိတ်သွားတော့ ရေအိုးက ရေစက်သံ ကြားရတယ်။ အရင်က မကြားမိဘူး။', 'Now it is quiet you can hear the water pot drip. Never noticed it before.', { job: 'guest', flag: 'd13.ch22Done' }),
      L('လက်မှတ် မထိုးရသေးတဲ့ အကွက်လေးကို ကြိုက်တယ်။ ရိုးသားတယ်။', 'I like that one unsigned gap. It is honest.', { job: 'guest', from: 14, flag: 'd13.ch22Done' }),
    ],
    backcover: [ // Maya is alone in here: her own thoughts
      L('(စာအုပ်တိုင်းမှာ ဒီလိုနေရာလေး ရှိသင့်တယ်။ ဘယ်ကရလဲ ပြောတဲ့နေရာ။)', '(Every book should have a little place like this. Where it says where things came from.)', { job: 'maya' }),
      L('(ရေးတာတိုင်း တစ်ယောက်ယောက်ဆီက သင်ခဲ့တာ။ နာမည်တွေ မမေ့ချင်ဘူး။)', "(Everything I wrote, I learnt from someone. I don't want to forget their names.)", { job: 'maya' }),
      L('(နောက်ဆုံးစာမျက်နှာက ကျေးဇူးတင်စရာ နာမည်တွေနဲ့ ပြည့်နေတယ်။)', '(The last page is full of names to thank.)', { job: 'maya' }),
      L('(လမ်းကို ကျွန်မ ပြခဲ့ရုံပဲ။ လျှောက်တာ သူတို့ပဲ။)', '(I only showed the road. They did the walking.)', { job: 'maya' }),
      L('(နောက်ဆုံးစာကြောင်းကို ကျွန်မ မရေးဘူး။ ဖတ်တဲ့သူ ရေးပါစေ။)', "(I won't write the last line. Let the reader write it.)", { job: 'maya', flag: 'd14.reply' }),
    ],
  },

  pairs: [
    { who: ['traveller', 'vendor'], when: { days: [13], unless: 'd13.ch22Done' }, lines: [
      L('အိပ်တဲ့နေရာမှာ စည်းကမ်းချိတ်တာ ဟောပြောသလိုပဲ။', "Rules hung where you sleep: feels like preaching."),
      L('ဖတ်ပြီးပြီလား။', 'Have you read them?'),
      L('…ခေါင်းစဉ်ပဲ ဖတ်ရသေးတယ်။', '…Only the title.'),
    ] },
    { who: ['traveller', ['keeper', 'dawpwint']], lines: [
      L('ဒီမှာ ညမှောင်ရင် ဘာလို့ တိတ်ရတာလဲ။', 'Why go quiet here after dark?'),
      L('စမ်းကြည့်ပါ။ ပြီးမှ ပြော။', 'Try it. Then tell me.'),
    ] },
    { who: ['kid', 'elder'], lines: [
      L('အဘွား၊ ဒီစာရွက်က ဘာလို့ ဗလာလဲ။', 'Grandma, why is this page empty?'),
      L('မရေးရသေးလို့ပေါ့။', "Because nobody's written it yet."),
      L('ကျွန်တော် ရေးလို့ရလား။', 'Can I?'),
      L('ကိုယ့်ခြေထောက်နဲ့ ရေး။', 'Write it with your feet.'),
    ] },
    { who: ['traveller', 'traveller'], when: { flag: 'd13.ch22Done' }, lines: [
      L('ခေါင်းစဉ် ဖွင့်လိုက်တော့ ဘာသာရေးကလာတာ ဟုတ်တယ်။', "With the title showing, yes, it's from a religion."),
      L('ဒါပေမဲ့ ကိုယ်လိုချင်တာတွေပဲ။ မပြောင်းသွားဘူး။', "But it's still what we'd want. That doesn't change."),
    ] },
    { who: ['traveller', 'traveller'], when: { flag: 'd13.road' }, lines: [
      L('နောက်ဆုံးရွက်ကနေ ပြန်လမ်း မရှိဘူးတဲ့။', 'No road back from the last leaf, they said.'),
      L('အခုတော့ ရှိပြီ။ ငါတို့ လျှောက်ခဲ့တာလေ။', 'There is now. We walked it.'),
    ] },
    { who: ['traveller', 'vendor'], lines: [
      L('ရေနွေးကြမ်း ဘယ်လောက်လဲ။', 'How much for the tea?'),
      L('ဘာမှ မပေးနဲ့။ နောက်ကလူကို တစ်ခွက် ငဲ့ပေးလိုက်။', 'Nothing. Pour one for the next person.'),
    ] },
    { who: ['vendor', 'elder'], when: { days: [13] }, lines: [
      L('ဥယျာဉ်ဘက်က လူတွေ လူငယ်လေးတွေ ဆိုင်းဘုတ်ဖျက်တယ်လို့ ပြောနေတာ။', 'The garden folk are saying the young ones scrubbed the board.'),
      L('ကြားတာနဲ့ ပြောကြတာပဲ။ ကိုယ်တိုင် မမြင်ဘဲနဲ့။', "Going by what they heard. Without seeing it themselves."),
    ] },
    { who: ['elder', 'traveller'], when: { from: 14, flag: 'd13.road' }, lines: [
      L('ဒီလမ်းကို ဘယ်သူ ဖောက်တာလဲ။', 'Who built this road?'),
      L('ဘယ်သူမှ မဖောက်ဘူး။ အကုန် အတူ လျှောက်ခဲ့တာ။', 'Nobody built it. We all walked it together.'),
    ] },
    { who: ['traveller', 'traveller'], lines: [
      L('ဒီစကား မင်း စဉ်းစားတာလား။', 'Did you come up with that?'),
      L('မဟုတ်ဘူး၊ အမေ ပြောတာ။ အမေ့နာမည်နဲ့ ပြောရမှာ။', 'No, my mum said it. I should say it with her name on it.'),
    ] },
    { who: [['keeper', 'dawpwint'], 'traveller'], when: { from: 14, flag: 'd13.ch22Done' }, lines: [
      L('မနေ့ညက တိတ်တာ ဘယ်လိုလဲ။', 'How was the quiet last night?'),
      L('အိမ်မြှောင်သံ ကြားရတယ်။ ကိုယ့်အသက်ရှူသံလည်း ကြားရတယ်။', 'I heard the gecko. And my own breathing.'),
    ] },
  ],

  arrive: {
    first: L('(စာရွက်က ဖြူဖြူ။ ခဲတံလိုင်း နှစ်ကြောင်းပဲ ဆက်သွားတယ်။)', '(The paper is white. Just two pencil lines going on.)', { job: 'maya' }),
    again: [
      L('(အမိုးတစ်ခု၊ မီးခိုးတစ်ကြောင်း။ အသံကတော့ တိတ်သွားပြီ။)', '(One roof, one line of smoke. And quiet now.)', { job: 'maya', area: 'lodgeYard', flag: 'd13.ch22Done' }),
      L('(မနေ့က ခြေရာတွေ ရွှေရောင်လမ်း ဖြစ်နေပြီ။)', "(Yesterday's footprints have become a gold road.)", { job: 'maya', area: 'walkNorth', from: 14, flag: 'd13.road' }),
      L('(နောက်ကျောဖုံး။ စာအုပ်တစ်အုပ်လုံး ဒီမှာ ဆုံးတယ်။)', '(The back cover. The whole book ends here.)', { job: 'maya', area: 'backCover', from: 14 }),
    ],
  },
};

export const LINES_C = { hearth: HEARTH, garden: GARDEN, blank: BLANK };
