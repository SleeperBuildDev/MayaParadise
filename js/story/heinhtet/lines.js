// DRAFT(my)
// Ko Hein Htet (ကိုဟိန်းထက်): the young man in the red suit who is always running, in every town.
// All of his words, for js/story/extras-heinhtet.js. Pure data, no imports.
//
// SHAPE (the shared contract):
//   solo:  [ { my, en, anim?, when? } ]                         barks while he runs past (any town)
//   towns: { townId: { solo: [...], meets: [ { id, folk: { age?, woman?, job? }, hhAnim, folkFace?,
//            lines: [ { who: 'hh'|'folk', my, en, anim? } ], when? } ] } }
//   maya:  { walkup: [ { id, lines: [ { who: 'hh'|'maya', my, en, anim?, face? } ], when? } ],
//            carBlock: [ same ], bye: [ { my, en, anim? } ],
//            carDash: [ { id, hh: { my, en, anim? }, maya: { my, en, face? }, when? } ] }   speech bubbles only:
//            he dashes across in front of her car, she stops a few seconds, he shouts over his shoulder, she answers
//   mentions: { townId: { lines: [ { my, en, job?, age?, when? } ],
//            pairs: [ { id, who: ['*', '*'], lines: [ { who: 0|1, my, en } ], when? } ] } }
//            ordinary townsfolk talking ABOUT him (town-chatter format, js/story/chatter/index.js). The loader
//            spreads a line's `when` into the chatter's flat from/to/days/flag/weather, and turns a pair line's
//            `who` into the chatter's `by`. `job` is a chatter kind of person (kid, teen, aunty, vendor, fisher...).
//   sing:  [ { my, en, song?, when? } ]                          songs he sings / gets wrong (owner, 2026-11-14)
//   when:  { days, from, to, flag, notFlag, weather: 'rain'|'dry', time: 'day'|'evening'|'night' } (all optional)
//
// RULES KEPT: he never tells Maya where to go, where anything or anyone is, or what a puzzle wants; no markers,
// no hints. Nothing religious. Jokes first, lessons light. The crush is hidden: cheesy lines are his cover and he
// flees before she can answer properly; no body comments, nothing crude, no touching.
// MAYA IS ALWAYS KIND (owner, 2026-11-14): warm, amused, caring ("Be careful!", "Slow down, you'll fall!"),
// encouraging, or friendly teasing at most. Never dry, never sarcastic, never cold.
// SONGS: no real lyrics anywhere, not one line. Only titles / artists, his own made-up words, or his own jingles.
// Every song choice is marked // CHECK(song) so the owner and Maya can swap in what is trending now.
// ALL BURMESE IS A DRAFT FOR MAYA TO PROOFREAD.
//
// Flags used (all set by the day scripts through story.flag('dN.key'), see js/story/dayN.js `const F`):
//   d1.done (day1.js) · d3.ch9Done (day3.js) · d5.ch10Done (day5.js) · d6.ch8Done (day6.js) · d7.bridge (day7.js,
//   the bridge lamps lit) · d8.ch12Done, d8.ch13Done (day8.js) · d9.ch14Done (day9.js) · d12.ch20Done (day12.js)
//   · d13.ch22Done (day13.js) · d15.flown (day15.js)

const A = (my, en, anim, when) => ({ my, en, ...(anim ? { anim } : {}), ...(when ? { when } : {}) });
const S = (my, en, song, when) => ({ my, en, ...(song ? { song } : {}), ...(when ? { when } : {}) });
const ln = ([who, my, en, x]) => ({ who, my, en, ...(x ? (who === 'maya' ? { face: x } : { anim: x }) : {}) });
const meet = (id, folk, hhAnim, folkFace, lines, when) => ({ id, folk, hhAnim, folkFace, lines: lines.map(ln), ...(when ? { when } : {}) });
const talk = (id, lines, when) => ({ id, lines: lines.map(ln), ...(when ? { when } : {}) });

const RAIN = { weather: 'rain' };

// =================================================================================================================
// SOLO: general barks while he runs past (any town, any day)
// =================================================================================================================
// DRAFT(my)
const solo = [
  A('နောက်ကျပြီ! နောက်ကျပြီ! ဘာကိုလဲ မသိဘူး၊ နောက်ကျပြီ!', "Late! I'm late! For what, no idea, but late!", 'checkWatch'),
  A('စောစောရောက်ဖို့ နောက်ကျနေပြီ!', "I'm late for being early!", 'checkWatch'),
  A('ခဏ… အသက်ရှူပါရစေ… ပြီးပြီ။ သွားပြီ!', 'Hang on… let me breathe… done. Gone!', 'catchBreath'),
  A('ဖယ်ပါ ဖယ်ပါ! …တောင်းပန်ပါတယ်! ဖယ်ပါ!', 'Coming through! …Sorry! Coming through!', 'dodge'),
  A('ဒီနာရီက ငါ့ထက် မြန်တယ်။ ငါက နာရီထက် မြန်အောင် ပြေးရတယ်။', 'This watch runs fast. So I run faster than the watch.', 'checkWatch'),
  A('မြန်မာချိန်နဲ့ဆို စောတယ်။ ငါ့ချိန်နဲ့ဆို နောက်ကျပြီ!', "By Myanmar time I'm early. By my time I'm late!"),
  A('ဖုန်းဘေလ် ကုန်ပြီ။ ဖုန်းဆက်မယ့်အစား ပြေးပြောမယ်!', "Out of phone credit. I'll run over and say it in person!"),
  A('ဖုန်းအား ကုန်ပြီ။ ခြေထောက်အားကတော့ အပြည့်!', 'Phone battery: dead. Leg battery: full!', 'stretch'),
  A('ပြေးရင်း စဉ်းစားတယ်။ စဉ်းစားရင်း မေ့သွားတယ်။', 'I think while I run. Then I forget while I think.'),
  A('ထမင်းစားပြီးပြီလား! …ကိုယ့်ကိုယ်ကို မေးတာ။ မစားရသေးဘူး!', 'Eaten yet? …Asking myself. Not yet!'),
  A('ဖိနပ်ကြိုး ပြေနေတယ်။ နောက်မှ ချည်မယ်… အား!', "Lace is loose. I'll tie it later… whoa!", 'trip'),
  A('ဒီလမ်းကို ဒီနေ့ ခုနစ်ခါ ဖြတ်ပြီးပြီ။ ဘာလို့လဲ မမေးနဲ့။', "Seventh time down this street today. Don't ask why."),
  A('အမြန်လုပ်ရင် နှစ်ခါလုပ်ရတယ်တဲ့။ ငါ သုံးခါမြောက်ပြီ!', "Rush a job, do it twice, they say. I'm on my third!", 'facepalm'),
  A('ငါ့စာရွက်တွေ! ပြန်လာခဲ့! လေရယ်… စောင့်ပါဦး!', 'My papers! Come back! Wind, wait for me!', 'dropPapers'),
  A('အချိန်က မစောင့်ဘူးတဲ့။ ဒါကြောင့် ငါလည်း မစောင့်ဘူး!', "Time waits for no one. So I don't wait either!"),
  A('ခဏရပ်ကြည့်ရင် ပိုမြင်တယ်တဲ့။ "ခဏ" ဆိုတာ ဘယ်လောက်လဲ။', 'Stop a moment and you see more, they say. How long is a moment?'),
  A('အလုပ်များတာနဲ့ အလုပ်ဖြစ်တာ မတူဘူးတဲ့။ ငါက များတဲ့ဘက်။', "Being busy isn't the same as getting things done, they say. I'm the busy kind.", 'shrug'),
  A('အိတ်ကပ် တစ်၊ နှစ်၊ သုံး… သော့! …အော်၊ လက်ထဲမှာ။', 'Pocket one, two, three… keys! …Oh. In my hand.', 'pocketSearch'),
  A('မီးပျက်လို့ နိုးစက် မမြည်ဘူး။ အဲဒီကတည်းက ပြေးနေတာ!', "Power cut, so no alarm. I've been sprinting ever since!"),
  A('လက်ဖက်ရည် ပေါ့ဆိမ့် တစ်ခွက်… ပြေးရင်း သောက်လို့ရလား!', 'One light, creamy tea… can I drink it on the run?'),
  A('ငါ အမြန်ဆုံး မဟုတ်ဘူး။ အများဆုံး ပြေးတာပဲ။', 'Not the fastest. Just the most running.'),
  A('အကွေ့မှာ မြန်မြန် မကွေ့နဲ့။ …ကိုယ့်ကိုယ်ကို ပြောတာ။', "Don't take corners fast. …Note to self.", 'skid'),
  A('ဟိုင်း! ဘိုင်! တစ်ခါတည်း ပြောလိုက်တာ။ အချိန်ချွေတာ!', 'Hi! Bye! Both at once. Saves time!', 'wave'),
  A('ညီမလေးက "ကိုကို ထိုင်တာ မမြင်ဖူးဘူး" တဲ့။', "My little sister says she's never seen me sit down."),
  A('ဒီနေ့ အစီအစဉ်: ပြေး၊ ရပ်၊ မေ့၊ ပြန်ပြေး။', 'Today\'s plan: run, stop, forget, run back.'),
  A('ခြေထောက်က ရောက်နေပြီ။ ခေါင်းက နောက်က လိုက်လာတယ်။', "My feet are already there. My head's catching up."),
  A('ကိုယ့်အရိပ်ကို ပြေးမမီဘူးတဲ့။ ငါ စမ်းနေတုန်း!', "You can't outrun your own shadow, they say. Still trying!"),
  A('ဒီဇာတ်လမ်းထဲ ငါ ဘယ်ဇာတ်ကောင်လဲ။ ပြေးနေတဲ့သူ ထင်တယ်။', 'Which character am I in this story? The one running, I think.'),
  A('အနီရောင် ဝတ်ထားလို့ မြန်တာ။ သိပ္ပံနည်းကျတယ်!', "The red suit makes me faster. That's science!", 'straightenJacket'),
  A('စပယ်ယာက "ရတယ် ရတယ်၊ လာ!" တဲ့။ မစီးဘူး။ ကားထက် အရင်ရောက်တယ်!', "The bus conductor yells 'Room inside, come on!' Didn't get on. Beat the bus anyway!", 'thumbsUp'),
  A('ဖြည်းဖြည်းလုပ်ရင် ပိုမြန်တယ်တဲ့။ ဘယ်သူပြောတာလဲ… မြန်မြန်ပြော!', 'Slow is faster, they say. Who said that? Tell me, quick!'),
  A('လမ်းကူးရင် ဘယ်ညာ ကြည့်။ ညာ၊ ဘယ်၊ ညာ… ရပြီ!', 'Crossing? Look both ways. Right, left, right… go!'),
  A('ဒီနေ့ ဘာနေ့လဲ။ ပြေးရတဲ့နေ့။ မနေ့ကလည်း အဲဒီနေ့ပဲ။', 'What day is it? Running day. Yesterday too.'),
  A('အင်္ကျီ အနီ၊ မျက်နှာ အနီ၊ နာရီကတော့… နောက်ကျ!', 'Red suit, red face, and my watch says… late!', 'checkWatch'),
  A('သတိ! ငါ့မှာ ဘရိတ် မပါဘူး!', 'Look out! No brakes!', 'skid'),
  A('နေပူထဲ ပြေးရတာ ပူတယ်။ အရိပ်ထဲ ရပ်ရင် အချိန်ကုန်တယ်!', 'Running in the sun is hot. Standing in the shade wastes time!', 'fanSelf'),
  A('ဆိုင်တွေက ငါ ဖြတ်ပြေးတာ ကြည့်ပြီး နာရီ ညှိတယ်တဲ့။ အကုန် မြန်ကုန်ပြီ!', "The shops set their clocks by me running past. Now they're all fast!", 'checkWatch'),
  A('အသက်ရှူ၊ ရှေ့ကြည့်၊ ပြေး။ ဒါ ငါ့ လေ့ကျင့်ခန်း အကုန်ပဲ။', "Breathe, look ahead, run. That's my whole workout.", 'stretch'),
  A('ကြော်ငြာ: ပြေးတတ်သူ လိုသည်။ လျှောက်မယ်… ပြေးပြီး!', "Wanted: someone who can run. I'll apply… at a run!"),
  A('ခဏ… ငါ ဒီကို ဘာလာလုပ်တာလဲ။', 'Wait… what did I come here for?', 'spin'),
  A('ကိုဟိန်းထက် ဖြတ်သွားပါပြီ! လက်ခုပ်တီးလို့ရပါတယ်။', 'Ko Hein Htet, passing through! Applause welcome.', 'salute'),
  A('နားချိန် နား၊ ပြေးချိန် ပြေး။ ငါက ပြေးဘက်ချည်း ရွေးမိတယ်။', 'Rest when you rest, run when you run. I keep picking run.'),
  A('ခြင်တွေတောင် ငါ့ကို မမီဘူး!', "Even the mosquitoes can't catch me!", 'jumpCheer'),
  A('အမေက "ဖြည်းဖြည်း" တဲ့။ ငါ မြန်မြန် "ဟုတ်ကဲ့" လို့ ပြန်ပြောတယ်။', "Mum says 'slowly'. I say 'yes, Mum', very quickly."),
  A('ကားပိတ်နေလည်း ငါ မပိတ်ဘူး။ ခြေထောက်က ကားမဟုတ်ဘူး!', "Traffic's jammed, I'm not. Legs aren't cars!"),
  A('ဒီနေ့ နောက်ကျတာ မနေ့ကထက် နည်းတယ်။ တိုးတက်လာပြီ!', 'Less late than yesterday. Progress!', 'thumbsUp'),
  A('ငါ ပြေးနေတာ လူမြင်ချင်လို့ မဟုတ်ဘူး… နည်းနည်းပဲ။', "I don't run so people see me… only a bit."),
  A('ကြောင်တစ်ကောင်က ငါ့ကို ကြည့်ပြီး ခေါင်းခါတယ်။ ကြောင်တောင်!', 'A cat looked at me and shook its head. Even the cat!', 'facepalm'),
];

// =================================================================================================================
// TOWNS: barks that fit one town, and meets with its townsfolk (generic folk by age / job, never story cast)
// =================================================================================================================
// DRAFT(my)
const towns = {
  // ---- HOME BOOK: the plaza, the fountain, the "ask Maya" board, the binders' lawn, windmills, the Writing Room
  // (chapter 1: practice, not a gift; choose your own road and light)
  home: {
    solo: [
      A('ရေပန်းဘေး ဖြတ်ပြေးတိုင်း စိုတယ်။ နေ့တိုင်း စိုတယ်။ မမှတ်ဘူး။', 'Every time I run past the fountain I get splashed. Every day. I never learn.'),
      A('လေရဟတ်တွေ ငါ့ထက် မြန်မြန် လည်နေတယ်။ မနာလိုဘူးနော်။', "Those windmills spin faster than me. Not jealous. Not at all."),
      A('ချုပ်ရိုးဆရာက "တစ်ချက်ချင်း" တဲ့။ ငါက အကုန် တစ်ခါတည်း။', "The binder says 'one stitch at a time'. I want all the stitches at once."),
      A('စာပို့အစ်မ ဘယ်တော့မှ မပြေးဘူး။ ငါ့ထက် အရင်ရောက်တယ်။ ဘယ်လိုလဲ!', 'The postwoman never runs. Still gets there before me. How?!', 'spin'),
      A('ဘုတ်ပေါ်က မေးခွန်းတွေ ဖတ်ချင်တယ်။ ခေါင်းစဉ်ပဲ ဖတ်ချိန်ရတယ်။', 'I want to read the questions on the board. Only have time for the titles.'),
      A('အိမ်စာအုပ်က အစ။ အစကနေ ပြေးထွက်ရတာ ငါ့အကြိုက်။', 'The Home Book is where it starts. I like starting at a run.'),
      A('လေပြင်းတဲ့ဘက်မှာ မပြေးနဲ့။ ငါ့စာရွက်တွေ ကောင်းကင်ရောက်ကုန်ပြီ။', "Don't run on the windy side. My papers are in the sky now.", 'dropPapers'),
      A('ပထမဆုံး ပြေးတုန်းက လဲတယ်။ အခု ခဏခဏပဲ လဲတော့တယ်။', 'The first time I ran, I fell. Now I only fall sometimes. Progress!', 'trip'),
      A('♪ ဟမ်း ဟမ်း ♪ ရေပန်းဘေးမှာ ဆိုရင် ရေစက်တွေ လက်ခုပ်တီးတယ်!', '♪ Hm-hm ♪ Sing by the fountain and the drops clap along!'),
      A('စာရေးခန်း တံခါးရှေ့ ဖြတ်ရင် ခြေသံ တိုးတိုးလေး။ စာရေးနေရင် အားနာလို့။', "Past the Writing Room door I tiptoe. In case someone's writing."),
      A('ညနေ ချုပ်ရိုးပြိုင်ပွဲ ရှိတယ်တဲ့။ ငါ ကြည့်မယ်… ပြေးရင်းနဲ့။', "There's a stitching contest this evening. I'll watch… on the way past.", null, { days: [1] }),
      A('ဒီည မီးတစ်ခုစီ ယူလာရမယ်တဲ့။ ငါ့မီးက… နာရီမီးလေးပဲ!', 'Everyone brings a light tonight. Mine is… my little watch light!', 'checkWatch', { days: [15] }),
      A('မီးတွေကြားမှာ ငါ့နာရီမီးလည်း ပါတယ်။ အသေးဆုံး၊ အမြန်ဆုံး!', 'My watch light is up there with the rest. Smallest one. Fastest one!', 'jumpCheer', { flag: 'd15.flown' }),
    ],
    meets: [
      meet('home-fountain', { age: 'elder', job: 'binder' }, 'dodge', 'surprised', [
        ['hh', 'ဦးလေး! ဖယ်ပါ! …မလိုတော့ဘူး၊ ကျွန်တော် ရှောင်လိုက်ပြီ!', "Uncle! Move! …Never mind, I dodged!", 'dodge'],
        ['folk', 'မင်း ရှောင်တာ ရေပန်းထဲ ရောက်သွားတာလေ။', 'You dodged straight into the fountain.'],
        ['hh', 'အေးတယ်။ ကောင်းတယ်။ တမင် လုပ်တာ!', 'Refreshing. Lovely. Totally on purpose!'],
      ]),
      meet('home-windmill', { age: 'child', job: 'windmill maker' }, 'highFive', 'happy', [
        ['folk', 'အစ်ကို! ငါ့ လေရဟတ် ကြည့်! ဆယ်ခါမြောက်မှ လည်တာ!', 'Big brother! Look at my windmill! It spun on the tenth try!'],
        ['hh', 'ဆယ်ခါ! ငါ့ထက် တော်တယ်။ ငါ ဆယ်ခါ လဲပြီးမှ ပြေးတတ်တာ!', 'Ten tries! Better than me. I fell ten times before I could run!'],
        ['folk', 'အခုကော မလဲတော့ဘူးလား။', "And now you don't fall?"],
        ['hh', 'အခု… တစ်ခါတလေပဲ။ လက်ချင်းရိုက်!', 'Now… only now and then. High five!', 'highFive'],
      ]),
      meet('home-postwoman', { age: 'adult', woman: true, job: 'postwoman' }, 'pointAtWatch', 'smile', [
        ['hh', 'အစ်မ! ကျွန်တော့်စာ ပါလား! အရေးကြီးတယ်! မြန်မြန်!', 'Sister! Any post for me? Urgent! Quick!', 'pointAtWatch'],
        ['folk', 'ပါတယ်။ မင်း ကိုယ့်ကိုယ်ကို ရေးထားတာ။ "ဖြည်းဖြည်း" တဲ့။', "There is. You wrote it to yourself. It says 'slow down'."],
        ['hh', 'အာ… ဖတ်ချိန် မရှိဘူး။ နောက်မှ!', 'Ah… no time to read it. Later!'],
      ]),
      meet('home-thread', { age: 'elder', woman: true, job: 'binder' }, 'facepalm', 'smile', [
        ['folk', 'ငါ့တူ၊ အပ်ချည် ထိုးပေးပါဦး။ မျက်စိ မှုန်လို့။', 'Nephew, thread my needle for me? My eyes are tired.'],
        ['hh', 'တစ်စက္ကန့်! …လွဲ။ …လွဲပြန်ပြီ။ ဒီအပ်က ရွေ့နေတာ!', 'One second! …Missed. …Missed again. This needle keeps moving!', 'facepalm'],
        ['folk', 'အပ်က မရွေ့ဘူး။ မင်းလက်က ပြေးနေတာ။', "The needle's still. It's your hand that's running."],
        ['hh', '(အသက်ရှူ) …ဝင်ပြီ! အပ်က ငါ့ကို အသက်ရှူစေချင်တာကိုး!', "(breathes) …In! The needle just wanted me to breathe!", 'jumpCheer'],
      ]),
      meet('home-sign', { age: 'elder', job: 'sign letterer' }, 'trip', 'worried', [
        ['hh', 'ဦးလေး ဆိုင်းဘုတ် ဆေးစိုနေလား… အို! …စိုနေတယ်။', 'Uncle, is the sign paint still wet… oh! …It is.', 'trip'],
        ['folk', 'အခု မင်းအင်္ကျီပေါ်မှာ "ဆိုင်" ဆိုတဲ့ စာလုံး ပါသွားပြီ။', "Now there's a 'SHOP' on your jacket."],
        ['hh', 'ကောင်းတယ်။ ကျွန်တော်လည်း ဆိုင်လိုပဲ၊ နေ့တိုင်း ဖွင့်တယ်!', "Good. I'm like a shop: open every day!"],
        ['folk', 'ပြန်ရေးရမယ်။ ဒီတစ်ခါ ပိုလှမယ်။', "I'll paint it again. Better, this time."],
      ]),
      meet('home-lights', { age: 'adult', woman: true, job: 'neighbour' }, 'pocketSearch', 'smile', [
        ['folk', 'ဒီည မီး ယူလာပြီလား။', 'Brought your light for tonight?'],
        ['hh', 'ယူလာတယ်… ဒီအိတ်ကပ်… ဟိုအိတ်ကပ်…', 'I did… this pocket… that pocket…', 'pocketSearch'],
        ['hh', 'ဟော! နာရီမီး! ကိုယ့်မီးက ကိုယ့်ဟာပဲလေ!', 'Here! My watch light! Your light is your own, right?'],
        ['folk', 'သေးပေမဲ့ မင်းနဲ့ လိုက်တယ်။', 'Small, but it suits you.'],
      ], { days: [15] }),
    ],
  },

  // ---- EXERCISE-BOOK QUARTER: school, homework, chinlone, the potter, the washing, the tea stall, the stage
  // (chapter 3: school is for understanding; 5: "not yet"; 9: help at their pace)
  exercise: {
    solo: [
      A('ကျောင်းခေါင်းလောင်း မြည်ပြီ! …ငါ ကျောင်းပြီးတာ ကြာပြီပဲ။ အကျင့်ပါနေတာ။', 'School bell! …I left school years ago. Old habit.', 'skid'),
      A('ငယ်ငယ်က အိမ်စာ ပြေးရင်း လုပ်တယ်။ အမှတ်တွေလည်း ပြေးကုန်တယ်။', 'As a kid I did homework on the run. My marks ran off too.'),
      A('အလွတ်ကျက်တာ မြန်တယ်။ နားလည်တာ ကြာတယ်။ ကြာတာက ကျန်တယ်။', 'Memorising is quick. Understanding is slow. The slow one stays.'),
      A('ခြင်းလုံး ငါလည်း ခတ်တတ်တယ်… ဟိုး! ခြင်းလုံး ဘယ်ရောက်သွားလဲ။', "I can play chinlone too… whoa! Where'd the ball go?", 'spin'),
      A('ရွှံ့ကို အလောတကြီး လုပ်လို့ မရဘူးတဲ့။ ရွှံ့က စောင့်ခိုင်းတယ်။', "You can't rush clay, they say. The clay makes you wait."),
      A('စက်ဘီးပြင်ဆရာက ငါ့ခြေထောက်ကို ဆီထည့်ပေးရမယ်တဲ့။', 'The bike mender says my legs need oiling.'),
      A('အဝတ်လှန်းကြိုးအောက် ဖြတ်ပြေးတယ်။ အခု ခေါင်းပေါ်မှာ ပုဆိုးတစ်ထည်။', 'Ran under the washing line. Now there\'s a longyi on my head.'),
      A('"မတတ်သေးဘူး" နဲ့ "မတတ်ဘူး" မတူဘူး။ ပြေးရင်း သိသွားတာ။', "'Can't yet' and 'can't' aren't the same. Worked that out mid-run."),
      A('ပြဇာတ်ထဲ ပါချင်တယ်။ ဇာတ်ကောင်က "ပြေးဖြတ်သွားသူ" တဲ့။ ကွက်တိ!', "I'd like a part in the play. 'Man running past'. Perfect casting!", 'salute'),
      A('♪ က ခ ဂ ဃ င ♪ ငါ့ ဗျည်းသီချင်း! ပြေးရင်း ကျက်ခဲ့တာ!', '♪ Ka, kha, ga, gha, nga ♪ My alphabet song! Learnt it on the run!'),
      A('မုန့်ဆိုင်က ငါ့ကို မြင်တာနဲ့ ထုပ်ထားပြီးသား။ ပြေးဝယ်သူ နံပါတ်တစ်။', 'The snack shop sees me coming and wraps it in advance. Number-one sprint customer.'),
      A('ကျောင်းသားလေးတွေ ငါ့ကို "နီနီ" တဲ့။ အင်္ကျီကြောင့်လား၊ မျက်နှာကြောင့်လား။', "The kids call me 'Red-Red'. The suit, or my face?", 'shrug'),
    ],
    meets: [
      meet('ex-chinlone', { age: 'child', job: 'chinlone player' }, 'juggle', 'happy', [
        ['folk', 'အစ်ကို ခြင်းလုံး ခတ်မလား!', 'Big brother, want to play chinlone?'],
        ['hh', 'သုံးချက်ပဲနော်! တစ်၊ နှစ်… ဟိုး၊ ဘယ်ရောက်သွားလဲ!', "Three kicks only! One, two… whoa, where'd it go?", 'juggle'],
        ['folk', 'အစ်ကို့ ခေါင်းပေါ်မှာ။', 'On your head.'],
        ['hh', 'တမင်လုပ်တာ! ခေါင်းနဲ့ ခတ်နည်း အသစ်!', 'On purpose! A brand-new header!'],
      ]),
      meet('ex-sums', { age: 'child', woman: true, job: 'pupil' }, 'facepalm', 'think', [
        ['folk', 'အစ်ကို၊ ခြောက်ခုနစ်လီ ဘယ်လောက်လဲ။', "Big brother, what's six times seven?"],
        ['hh', 'လွယ်တယ်! လေးဆယ့်… လေးဆယ့်… ဂဏန်းတွေ နောက်မှာ ကျန်ခဲ့ပြီ။', 'Easy! Forty… forty-… I ran off and left the numbers behind.', 'facepalm'],
        ['folk', 'လေးဆယ့်နှစ်။ ကျက်တာ မဟုတ်ဘူး။ ခြောက်ကို ခုနစ်ခါ ပေါင်းကြည့်တာ။', "Forty-two. I didn't memorise it. I added six, seven times."],
        ['hh', 'ညီမလေး အစ်ကို့ဆရာ ဖြစ်သွားပြီ!', "You're my teacher now!", 'bow'],
      ]),
      meet('ex-potter', { age: 'elder', woman: true, job: 'potter' }, 'stretch', 'smile', [
        ['hh', 'အဒေါ်! အိုးတစ်လုံး အမြန် လုပ်ပေးနိုင်မလား!', 'Aunty! Could you make me a pot, quick?'],
        ['folk', 'ရွှံ့က "အမြန်" ဆိုတာ မသိဘူး ငါ့တူ။ ခြောက်ဖို့ သုံးရက်။', "Clay doesn't know 'quick', nephew. Three days to dry."],
        ['hh', 'သုံးရက်! အဲဒီအတောအတွင်း မြို့ကို သုံးဆယ်ပတ် ပြေးနိုင်တယ်!', 'Three days! I could run round town thirty times!', 'stretch'],
        ['folk', 'ပြေးလေ။ ပြန်လာရင် အိုး အသင့်ပဲ။', "Off you go, then. It'll be ready when you're back."],
      ]),
      meet('ex-washing', { age: 'adult', woman: true, job: 'washing aunty' }, 'spin', 'surprised', [
        ['folk', 'ဟဲ့! ငါ့ပုဆိုး မင်းခေါင်းပေါ် ပါသွားပြီ!', "Hey! My longyi's on your head!"],
        ['hh', 'ဘယ်မှာလဲ! ဘယ်မှာလဲ! …မမြင်ရဘူး!', "Where? Where? …I can't see!", 'spin'],
        ['folk', 'မျက်နှာကို ဖုံးထားလို့ပေါ့။', "Because it's over your face."],
        ['hh', 'အော်! ပြန်ပေးပါတယ်။ ကျေးဇူး… အဲ၊ တောင်းပန်ပါတယ်!', 'Oh! Here you go. Thank y… I mean, sorry!', 'bow'],
      ]),
      meet('ex-bike', { age: 'elder', job: 'bicycle mender' }, 'tieShoe', 'think', [
        ['folk', 'ဖိနပ်မှာ ဘီးလည်း မပါဘဲ ဘယ်လို ဒီလောက် မြန်တာလဲ။', 'No wheels on those shoes, and still that fast?'],
        ['hh', 'လျှို့ဝှက်ချက်က ဖိနပ်ကြိုး! …ပြေနေပြန်ပြီ။', 'The secret is the laces! …Undone again.', 'tieShoe'],
        ['folk', 'ရပ်ပြီး ချည်လိုက်ရင် ပိုမြန်မယ်။ လဲစရာ မလိုတော့ဘူးလေ။', "Stop and tie them and you'll be faster. No falling."],
        ['hh', 'ဦးလေး ဉာဏ်ကြီးလိုက်တာ!', 'Uncle, you genius!', 'thumbsUp'],
      ]),
      meet('ex-tea', { age: 'adult', job: 'tea stall' }, 'fanSelf', 'smile', [
        ['hh', 'ပေါ့ဆိမ့် တစ်ခွက်! အမြန်! ပူပူ! …မဟုတ်ဘူး၊ အေးအေး! ပူနေလို့!', 'One light-and-creamy! Quick! Hot! …No, iced! I\'m boiling!', 'fanSelf'],
        ['folk', 'ပူမလား အေးမလား အရင်ရွေး။ ငါ စောင့်နေမယ်။', "Pick hot or iced first. I'll wait."],
        ['hh', 'စောင့်တာ ကျွန်တော် အကြိုက်ဆုံး မဟုတ်ဘူး… နွေးနွေးပဲ!', "Waiting's not my favourite… lukewarm, then!"],
      ]),
    ],
  },

  // ---- THE ENVELOPE ROAD: goats, hens, tyre races, the wheel stand, the sundries shop, potholes, paper planes
  // (chapters 5, 6, 7, 11: nothing is fixed; give with a cool heart; let go; steer yourself)
  envelope: {
    solo: [
      A('ဆိတ်ကလေး ငါ့နောက် လိုက်တယ်။ ငါ ဆိတ်ကို ရှောင်ပြေးတယ်။ ဘယ်သူနိုင်လဲ မသိဘူး။', 'The goat chased me. I ran from the goat. Unclear who won.', 'dodge'),
      A('ဘီးလုံးပြိုင်တဲ့ ကလေးတွေ ငါ့ကို ကျော်သွားတယ်။ ဘီးက ငါ့ထက် မြန်တာ ဝန်ခံတယ်။', 'The tyre kids overtook me. I admit it: tyres beat me.'),
      A('ချိုင့်ထဲ ခြေထောက် ကျတယ်။ လမ်းကို အပြစ်မတင်ဘူး။ ငါ့ခြေလှမ်းပဲ။', 'Foot in a pothole. Not blaming the road. My step.', 'trip'),
      A('ကုန်စုံဆိုင်မှာ အကုန်ရတယ်တဲ့။ အချိန် ရလား မေးတော့ ရယ်တယ်။', 'The sundries shop has everything, they say. Asked if they sell time. They laughed.'),
      A('လမ်းဆုံးပြီ ထင်ခဲ့တာ။ ဈေးကြီး ပေါ်လာတော့ ငါ အရင်ဆုံး ပြေးဝင်တယ်။', 'I thought the road ended. When the market appeared, I was first one in at a run.', null, { from: 5 }),
      A('စက္ကူလေယာဉ်နဲ့ ပြိုင်ပြေးတယ်။ လေယာဉ်က မကျဘူး။ ငါ ကျတယ်။', "Raced a paper plane. The plane didn't fall. I did.", 'trip'),
      A('ကြက်တွေ ငါ့ကို မြင်ရင် လမ်းဖယ်ပေးတယ်။ လေးစားလို့ ထင်တယ်။', 'The hens clear the road when they see me. Out of respect, I think.'),
      A('ဘီးပြင်ဆိုင်က ငါ့ဖိနပ်ကို ဘီးတပ်ပေးမလားတဲ့။ စဉ်းစားနေတယ်။', 'The wheel stand offered to put wheels on my shoes. Thinking about it.'),
      A('ဝန်လေးရင် ခဏနားတဲ့။ ငါ့ဝန်က စာရွက် သုံးရွက်။ ဒါပေမဲ့ နားချင်တယ်။', 'Heavy load, take a rest, they say. Mine is three sheets of paper. Still want a rest.', 'catchBreath'),
      A('♪ ဒုတ် ဒုတ် ဒုတ် ♪ ချိုင့်ခုန်သီချင်း။ ချိုင့်တစ်ခုကို "ဒုတ်" တစ်ခါ။', "♪ Doot doot doot ♪ My pothole-hopping song. One 'doot' per pothole."),
      A('ကြက်ဥ ဝယ်ပြီး ပြေးလာတယ်။ အိမ်ရောက်တော့ ကြက်ဥကြော် ဖြစ်နေပြီ။', 'Bought eggs and ran home. By the time I got there, scrambled.', 'facepalm'),
      A('မိုးရွာလည်း ပြေးရမယ်။ ရေကူးတာနဲ့ ပြေးတာ ပေါင်းလိုက်တာ။', 'Raining, still running. Swimming and running, combined.', null, RAIN),
    ],
    meets: [
      meet('env-goat', { age: 'child', woman: true, job: 'goat keeper' }, 'spin', 'happy', [
        ['folk', 'ဆိတ်ကလေး! အစ်ကို့ စာရွက် စားနေပြီ!', "Little goat! She's eating your papers!"],
        ['hh', 'အာ! အဲဒါ ငါ့ စာရင်း! လုပ်စရာတွေ စာရင်း!', "Ah! That's my list! My to-do list!"],
        ['folk', 'ဆိတ်က အကုန် လုပ်ပြီးသွားပြီ ထင်တယ်။', 'Guess the goat has done them all.'],
        ['hh', 'ဒါဆို ငါ အားပြီ! …ဘာလုပ်ရမလဲ မသိတော့ဘူး!', "Then I'm free! …Now I don't know what to do!", 'spin'],
      ]),
      meet('env-tyres', { age: 'child', job: 'tyre racer' }, 'jumpCheer', 'happy', [
        ['folk', 'အစ်ကို ဘီးလုံးပြိုင်မလား! စ!', 'Race the tyres, big brother? Go!'],
        ['hh', 'ငါ နိုင်မယ်… နိုင်မယ်… ဘီးက ဘာလို့ ကျော်သွားတာလဲ!', "I'll win… I'll win… why is the tyre passing me?!"],
        ['folk', 'ဆင်ခြေလျှောမှာ ဘီးက အမြဲနိုင်တယ်။', 'Downhill, the tyre always wins.'],
        ['hh', 'နောက်တစ်ခါ အတက်မှာ ပြိုင်မယ်! ဘီးကို ကြည့်ချင်သေးတယ်!', "Next time, uphill! Then we'll see about that tyre!", 'jumpCheer'],
      ]),
      meet('env-wheels', { age: 'elder', job: 'wheel mender' }, 'shrug', 'think', [
        ['hh', 'ဦးလေး၊ ကျွန်တော့် ဖိနပ်ကို ဘီးတပ်ပေးလို့ ရမလား။', 'Uncle, could you fit wheels to my shoes?'],
        ['folk', 'ရတယ်။ ဘရိတ်ကော။', 'Sure. And brakes?'],
        ['hh', 'ဘရိတ်… ကျွန်တော့်မှာ ဘရိတ် တစ်ခါမှ မရှိဖူးဘူး။', "Brakes… I've never had brakes.", 'shrug'],
        ['folk', 'ဒါဆို ဘီး မတပ်နဲ့ဦး။ ဘရိတ်က အရင်။', 'Then no wheels yet. Brakes come first.'],
      ]),
      meet('env-sundries', { age: 'adult', woman: true, job: 'shopkeeper' }, 'pocketSearch', 'smile', [
        ['hh', 'အစ်မ၊ အကုန်ရတယ်ဆို။ အချိန် နည်းနည်း ရောင်းပါ။', 'Sister, you sell everything, right? Sell me a little time.', 'pocketSearch'],
        ['folk', 'ကုန်သွားပြီ။ နောက်ဆုံးအထုပ် မင်းလိုလူ ဝယ်သွားတယ်။', 'Sold out. The last packet went to someone just like you.'],
        ['hh', 'ကျွန်တော့်လိုလူ! ဘယ်သူလဲ… အော်၊ မနေ့က ကျွန်တော်ပဲ။', 'Someone like me! Who… oh. Me, yesterday.'],
      ]),
      meet('env-eggs', { age: 'elder', woman: true, job: 'egg seller' }, 'juggle', 'worried', [
        ['folk', 'ကြက်ဥတောင်း မထိနဲ့နော်… မထိနဲ့…', "Don't bump the egg basket… don't…"],
        ['hh', 'စိတ်ချပါ အဒေါ်! ကျွန်တော် သတိကြီးတယ်… အို! ဖမ်းမိတယ်! သုံးလုံးလုံး!', "Relax, aunty! I'm ever so care… oops! Caught them! All three!", 'juggle'],
        ['folk', 'အဲဒါ ချက်စားဖို့။ ပြကွက်အတွက် မဟုတ်ဘူး။', 'Those are for cooking. Not for a show.'],
        ['hh', 'တောင်းပန်ပါတယ်! ပြေးရင်း သတိထားလို့ မရဘူးဆိုတာ ခုမှ သိတယ်။', "Sorry! Just learnt you can't be careful at a run.", 'bow'],
      ]),
      meet('env-song', { age: 'adult', job: 'carter' }, 'jumpCheer', 'happy', [
        // CHECK(song): Sai Sai Kham Leng named only, no words
        ['hh', '♪ ဟမ်း ဟမ်း ဟမ်း ♪ စိုင်းစိုင်း သီချင်းလေ! သိလား!', "♪ Hm hm hm ♪ A Sai Sai song! Know it?"],
        ['folk', 'သိတယ်။ မင်းနောက်က ဆိတ်လေးပါ လိုက်အော်နေပြီ။', 'I do. And the goat behind you is joining in.'],
        ['hh', 'ဆိတ်လေးကလည်း စိုင်းစိုင်း ပရိသတ်ပဲ! အဆိုတော် နှစ်ယောက်!', "The goat's a Sai Sai fan too! It's a duet!", 'jumpCheer'],
      ]),
    ],
  },

  // ---- ENVELOPE MARKET: haggling, stamps, rice, the tea shop, the pump, kites, fritters, the post office
  // (chapters 6, 7, 10: give and forget it; let the string out; be glad when the next stall does well)
  market: {
    solo: [
      A('ဈေးဆစ်ရင် အချိန်ကုန်တယ်။ ဒါကြောင့် နှစ်ဆ ပေးမယ်… မဟုတ်ဘူး၊ မပေးဘူး!', 'Haggling wastes time. So I pay double… no, wait, I don\'t!', 'facepalm'),
      A('ဆန်ဈေး တက်ပြန်ပြီတဲ့။ ငါ ပြေးတာထက် မြန်မြန် တက်နေတာ။', 'Rice went up again. Climbing faster than I run.'),
      A('တံဆိပ်ခေါင်း တစ်လုံး ဝယ်တယ်။ ကပ်စရာ စာ မပါလာဘူး။', 'Bought a stamp. Forgot to bring the letter.', 'pocketSearch'),
      A('စွန်တွေ ကြည့်ရင်း ပြေးတော့… ဒုတ်! ကြည့်ချင်ရင် ရပ်ရမှာ။', 'Watched the kites while running… thunk! Should stop to look.', 'trip'),
      A('ဘေးဆိုင် ရောင်းကောင်းရင် ငါလည်း ပျော်တယ်။ ငါ ဘာမှ မရောင်းပေမဲ့။', 'When the next stall sells well, I\'m happy too. Even though I sell nothing.', 'thumbsUp'),
      A('ပေးပြီးရင် မေ့လိုက်တဲ့။ ငါ ပေးပြီး ဘာပေးမိလဲ မေ့သွားတယ်။', 'Give, then forget it, they say. I gave, and forgot what I gave.'),
      A('ပန့်ရေ ငင်ရင်း ပြေးလို့ မရဘူး။ စမ်းပြီးပြီ။ စိုသွားတယ်။', "You can't pump water while running. Tried it. Soaked."),
      A('ကြော်လှည်းက ကြော် ပြေးယူပြီး ပိုက်ဆံ ပြန်ပြေးပေးရတယ်။', 'Grabbed a fritter on the run, had to run back to pay.'),
      A('လက်ဖက်ရည်ဆိုင်က ဦးလေးက "ထိုင်ပါဦး" တဲ့။ ထိုင်ခုံ မြင်ရင် ကြောက်တယ်။', "The tea-shop uncle says 'sit a while'. Chairs frighten me."),
      A('♪ ငါးရာ၊ တစ်ထောင်၊ လျှော့ပေး ♪ ဈေးဆစ်သီချင်း။ ဘယ်သူမှ မလျှော့ဘူး။', "♪ Five hundred, a thousand, knock it down ♪ My haggling song. Nobody ever does."),
      A('ကြိုးလျှော့မှ စွန်တက်တယ်တဲ့။ ငါ့ ဖိနပ်ကြိုး လျှော့ထားတာ… မတက်ဘူး၊ လဲတယ်။', 'Let the string out and the kite climbs, they say. I let my laces out. I didn\'t climb. I fell.', 'tieShoe'),
      A('ထွင်းခုံတန်းက မီးခိုးလေး ပြန်တက်နေတယ်။ ကြည့်ရတာ နွေးတယ်။', 'Smoke rising off the carvers\' row again. Warm, just to look at.', null, { flag: 'd5.ch10Done' }),
    ],
    meets: [
      meet('mk-haggle', { age: 'adult', woman: true, job: 'vendor' }, 'handshake', 'smile', [
        ['hh', 'ဒါ ဘယ်လောက်လဲ! အမြန်! မဆစ်တော့ဘူး!', "How much? Quick! I won't haggle!"],
        ['folk', 'တစ်ထောင်။', 'A thousand.'],
        ['hh', 'နှစ်ထောင် ပေးမယ်! …ခဏ၊ ဒါ ပြောင်းပြန် ဆစ်နေတာ။', "I'll give you two! …Wait. That's haggling backwards.", 'facepalm'],
        ['folk', 'ငါကတော့ ကြိုက်တယ်။ နောက်လည်း လာခဲ့။', 'Suits me. Come again.'],
      ]),
      meet('mk-stamp', { age: 'adult', job: 'stamp carver' }, 'thumbsUp', 'think', [
        ['hh', 'အစ်ကို၊ "အမြန်" ဆိုတဲ့ တံဆိပ်တုံး ထွင်းပေးပါ။ နဖူးမှာ နှိပ်မလို့။', "Brother, carve me a stamp that says 'URGENT'. For my forehead."],
        ['folk', 'ထွင်းဖို့ တစ်ပတ် ကြာမယ်။', "It'll take a week to carve."],
        ['hh', '"အမြန်" ကို တစ်ပတ်!', "A week, for 'URGENT'!"],
        ['folk', 'မြန်မြန် ထွင်းရင် စာလုံး ပြောင်းပြန် ထွက်တတ်လို့။', 'Carve it fast and the letters come out backwards.'],
      ]),
      meet('mk-rice', { age: 'elder', woman: true, job: 'rice cook' }, 'bow', 'smile', [
        ['folk', 'ထမင်းစားပြီးပြီလား ငါ့တူ။', 'Eaten yet, nephew?'],
        ['hh', 'မစားရသေးဘူး အဒေါ်! ဒါပေမဲ့ အချိန်မရှိဘူး!', 'Not yet, aunty! But there\'s no time!'],
        ['folk', 'ထမင်းတစ်လုတ်က ဘယ်လောက် ကြာလို့လဲ။ ထိုင်။', 'How long is one mouthful? Sit.'],
        ['hh', '…တစ်လုတ်ပဲနော်။ …နှစ်လုတ်။ …ထပ်ထည့်ပေးပါဦး။', '…Just one bite. …Two. …Could I have a bit more?', 'bow'],
      ]),
      meet('mk-kite', { age: 'teen', woman: true, job: 'kite flyer' }, 'trip', 'surprised', [
        ['hh', 'စွန်ကြိုး! ကြိုးကို ဘယ်သူ… အား!', 'Kite string! Who left a… aagh!', 'trip'],
        ['folk', 'အစ်ကို ကြိုးထဲ ရစ်မိနေပြီ။ ငြိမ်ငြိမ်နေ။', "You're tangled. Hold still."],
        ['hh', 'ငြိမ်ငြိမ်နေရတာ ငါ့အတွက် အခက်ဆုံး ဘာသာ။', 'Holding still is my hardest subject.'],
        ['folk', 'လျှော့ပေးရင် ပြေတယ်။ ဆွဲရင် ပိုရစ်တယ်။', 'Let it go slack and it comes loose. Pull and it tightens.'],
      ]),
      meet('mk-kettle', { age: 'adult', job: 'porter' }, 'shrug', 'happy', [
        // CHECK(song): Lay Phyu named only, no words
        ['hh', '♪ ဟမ်း ဟမ်း ♪ ဒါ လေးဖြူ သီချင်းလေ!', "♪ Hm hm ♪ That's a Lay Phyu song!"],
        ['folk', 'ဆိုင်က ရေနွေးအိုးပါ လိုက်ဆူနေပြီ။ ဘယ်ဟာ မင်းလဲ ခွဲမရဘူး။', "The shop kettle's joined in. I can't tell which one is you."],
        ['hh', 'ရေနွေးအိုးက ငါ့ထက် အသံမြင့်တယ်။ ရော့ခ် ဆိုတာ ဒါပဲ!', "The kettle hits higher notes than me. Now THAT's rock!", 'shrug'],
      ]),
      meet('mk-fritter', { age: 'adult', woman: true, job: 'fritter seller' }, 'pocketSearch', 'think', [
        ['hh', 'ကြော် တစ်ခု! ပိုက်ဆံက… ဒီမှာ… ဟိုမှာ…', "One fritter! Money's… here… there…", 'pocketSearch'],
        ['folk', 'ကြော်က အေးသွားပြီ။', "The fritter's gone cold."],
        ['hh', 'ရတယ်! ကျွန်တော် ပူနေလို့ ပြန်နွေးသွားမှာ!', "No problem! I'm so hot I'll warm it back up!"],
      ]),
    ],
  },

  // ---- LEDGER WHARF: nets, boats, fish, the scale, rope, the ferry, dried fish
  // (chapters 2 and 8: blame neither river nor yourself; don't start a grudge, don't return one)
  wharf: {
    solo: [
      A('ကူးတို့ ထွက်တော့မယ်! …ငါ စီးစရာ မလိုဘူး။ ဒါပေမဲ့ ပြေးချင်တယ်။', "The ferry's leaving! …I don't need it. I just feel I should run."),
      A('ပျဉ်ချပ်တွေ ချော်တယ်လို့ ကြားဖူးတယ်။ အခု ကိုယ်တိုင် စစ်ပြီးပြီ။', "I'd heard the planks are slippery. Now I've checked for myself.", 'trip'),
      A('ငါးနံ့က အင်္ကျီထဲ လိုက်လာတယ်။ ငါ ငါးနီ ဖြစ်သွားပြီ။', 'The fish smell followed me into my suit. I\'m a red fish now.'),
      A('ချိန်ခွင်ပေါ် တက်ကြည့်တယ်။ "ငြိမ်နေမှ ချိန်လို့ရမယ်" တဲ့။ ဘယ်တော့မှ မသိရတော့ဘူး။', "Got on the scale. 'Hold still or I can't weigh you.' So I'll never know."),
      A('ပိုက်ကွန် ပေါက်ရင် ဖာတယ်။ ငါ့အိတ်ကပ်လည်း ပေါက်နေတာ… အဲဒါကြောင့်ကိုး!', "Torn nets get mended. My pocket's torn too… so THAT'S where everything went!", 'pocketSearch'),
      A('မြစ်ကို အပြစ်တင်လို့ ငါး မရဘူး။ ဖိနပ်ကို အပြစ်တင်လို့ မမြန်လာဘူး။', "Blaming the river won't bring fish. Blaming my shoes won't make me faster."),
      A('ကြိုးထုံးတွေ ကြည့်ပြီး ငါ့ဖိနပ်ကြိုးကို ရှက်တယ်။', 'One look at those rope knots and I\'m ashamed of my laces.', 'tieShoe'),
      A('လှေသမားတွေက ငါ့ကို "ကုန်းပေါ်က လှေ" တဲ့။ ချီးကျူးတာလား။', "The boatmen call me 'the land boat'. Is that a compliment?", 'shrug'),
      A('ဖောင်ပေါ်က ကောင်လေး ဆိပ်တိုင်း နှုတ်ဆက်တယ်။ ငါကတော့ ပြေးရင်း နှုတ်ဆက်တယ်။', 'The raft lad greets every jetty. I greet everyone too… in passing.', 'wave', { flag: 'd6.ch8Done' }),
      A('♪ လှော်… လှော်… နောက်ကျပြီ… လှော် ♪ ငါ့ လှေလှော်သီချင်း။ လှေ မပါဘူး။', '♪ Row… row… I\'m late… row ♪ My rowing song. No boat involved.'),
      A('ငါးခြောက်တွေ နေပူထဲ လှန်းထားတယ်။ ငါလည်း နေပူထဲ ပြေးနေတာ။ ခြောက်တော့မယ်။', "Fish drying in the sun. Me running in the sun. Nearly dried myself.", 'fanSelf'),
      A('မိုးရွာတော့ ဆိပ်ကမ်းက ပိုချော်တယ်။ ငါ ပိုမြန်တယ်… ဘေးတိုက်။', 'Rain makes the quay slippier. I go faster… sideways.', 'skid', RAIN),
    ],
    meets: [
      meet('wh-net', { age: 'adult', job: 'net mender' }, 'trip', 'worried', [
        ['hh', 'ပိုက်ကွန်! မမြင်လိုက်… ', "A net! Didn't see—", 'trip'],
        ['folk', 'ကောင်းပြီ။ ဒီနေ့ ငါ ဖမ်းမိတဲ့ ငါးအကြီးဆုံး မင်းပဲ။', "Well. Biggest fish I've caught all day: you."],
        ['hh', 'ငါးနီ တစ်ကောင်! ဈေးကောင်းရမယ်!', "A red fish! That'll fetch a good price!"],
        ['folk', 'ဘယ်သူမှ မဝယ်ဘူး။ ငြိမ်မနေလို့။', "Nobody'd buy you. Won't keep still."],
      ]),
      meet('wh-scale', { age: 'adult', woman: true, job: 'weigher' }, 'catchBreath', 'smile', [
        ['hh', 'အစ်မ၊ ကျွန်တော့် အထုပ် ချိန်ပေးပါ! အမြန်!', 'Sister, weigh my parcel! Quick!'],
        ['folk', 'ချိန်ခွင်က ငြိမ်မှ ချိန်တယ်။ မင်းလက် တုန်နေတယ်။', 'The scale only weighs what\'s still. Your hand\'s shaking.'],
        ['hh', 'ပြေးလာလို့… ခဏ… ပြီးပြီ။', 'Ran here… hang on… done.', 'catchBreath'],
        ['folk', 'အခု ချိန်ပြီ။ ဗလာပဲ။ အထုပ်ထဲ ဘာမှ မပါဘူး။', "There. Empty. Nothing in the parcel."],
        ['hh', 'ဗလာကို ပြေးပို့နေတာ! ပေါ့လိုက်တာ!', "I've been rushing to deliver nothing! So light!"],
      ]),
      meet('wh-ferry', { age: 'elder', job: 'boatman' }, 'skid', 'happy', [
        ['hh', 'ရပ်! ရပ်! ကူးတို့! …အော်၊ ကမ်းမှာ ချည်ထားတာကိုး။', 'Stop! Stop! Ferry! …Oh. It\'s tied up.', 'skid'],
        ['folk', 'ကူးတို့က မင်းကို စောင့်နေတာ မဟုတ်ဘူး။ ငါတို့ ထမင်းစားနေတာ။', "The ferry wasn't waiting for you. We're having lunch."],
        ['hh', 'ကျွန်တော်လည်း စားလို့ရလား… ပြေးရင်းနဲ့။', 'Can I join… on the run?'],
        ['folk', 'လှေပေါ်မှာ ပြေးရင် မြစ်ထဲ ရောက်မယ်။', 'Run on a boat and you end up in the river.'],
      ]),
      meet('wh-knot', { age: 'teen', job: 'rope boy' }, 'tieShoe', 'think', [
        ['folk', 'အစ်ကို့ ဖိနပ်ကြိုး ထုံးနည်း ဘာလဲ။ မမြင်ဖူးဘူး။', "What knot's that on your shoe? Never seen it."],
        ['hh', '"ကြာကြာ မခံ" ထုံး။ ကိုယ်တိုင် တီထွင်ထားတာ။', "The 'won't-last' knot. My own invention.", 'tieShoe'],
        ['folk', 'လှေထုံး သင်ပေးမယ်။ ကြိုးပွန်းလည်း ဒီထုံးက မပြေဘူး။', "I'll teach you a boat knot. Even frayed, it holds."],
        ['hh', 'သင်ပေး! မြန်မြန်နော်!', 'Teach me! Fast!'],
        ['folk', 'မြန်မြန်ဆို မရဘူး။ ငါ့လက်ကို ကြည့်။', "Fast won't work. Watch my hands."],
      ]),
      meet('wh-dryfish', { age: 'elder', woman: true, job: 'fish seller' }, 'fanSelf', 'smile', [
        ['folk', 'ငါးခြောက် ဝယ်မလား။ နေပူထဲ သုံးရက် လှန်းထားတာ။', 'Dried fish? Three days in the sun.'],
        ['hh', 'သုံးရက်! ကျွန်တော် နေပူထဲ သုံးနာရီ ပြေးပြီးပြီ။ ကျွန်တော်လည်း ခြောက်တော့မယ်။', "Three days! I've run three hours in the sun. I'm nearly dried too.", 'fanSelf'],
        ['folk', 'ရေသောက်ဦး။ ငါးခြောက်က မသောက်ရဘူး။ မင်းက ရတယ်။', "Drink some water. Dried fish can't. You can."],
      ]),
      meet('wh-grudge', { age: 'adult', job: 'boatman' }, 'handshake', 'hot', [
        ['folk', 'ဟိုလူ ငါ့ကို စကားကြမ်းပြောသွားတယ်။ ငါ ပြန်ပြောမယ်။', "That man was rude to me. I'm going to be rude right back."],
        ['hh', 'လိုက်ပြန်ပြောရင် မောတာပဲ ရမယ်။ ကျွန်တော် စမ်းဖူးတယ်။', "Chase him to answer back and all you get is tired. I've tried."],
        ['folk', '…ဟုတ်လည်း ဟုတ်တယ်။', '…Fair enough.'],
        ['hh', 'လက်ဆွဲနှုတ်ဆက်ကြမယ်! အဲဒါ ပိုမြန်တယ်!', "Shake on it instead! It's quicker!", 'handshake'],
      ]),
    ],
  },

  // ---- NEWSPRINT JUNCTION (the Fold): news, handbills, letters, crossings, the press, the bridge
  // (chapters 12 and 13: don't believe it just because it's said or printed; six or nine, ask well)
  junction: {
    solo: [
      A('သတင်းစာ ခေါင်းကြီးပဲ ဖတ်ချိန်ရတယ်။ ကျန်တာ ခန့်မှန်းတယ်။ မကောင်းဘူးနော်။', 'I only have time for headlines. I guess the rest. Not great, is it?', 'shrug'),
      A('ကြော်ငြာ ဖတ်ပြီး ယုံလိုက်တယ်။ သွားကြည့်တော့ မဟုတ်ဘူး။ ရှက်တယ်။', 'Read a handbill, believed it. Went to look: wrong. Embarrassing.', 'facepalm'),
      A('ပုံနှိပ်စက်က ဂျုံး ဂျုံး။ ငါ့ခြေသံ ဒုတ် ဒုတ်။ သီချင်း ဖြစ်နေပြီ။', 'The press goes clunk-clunk. My feet go thud-thud. It\'s a song now.'),
      A('ဒီဘက်က ခြောက်၊ ဟိုဘက်က ကိုး။ ငါ့နာရီလည်း အဲလိုပဲ။ နောက်ကျတာ မဆန်းဘူး!', "Six from this side, nine from that. Same with my watch. No wonder I'm late!", 'checkWatch'),
      A('လမ်းဆုံတိုင်း ဘယ်ညာ ကြည့်တယ်။ ပြေးရင်း ကြည့်တော့ မူးလာတယ်။', 'I look both ways at every crossing. At a run. Now I\'m dizzy.', 'spin'),
      A('စာတစ်စောင် ပို့ဖို့ ပြေးလာတာ။ လိပ်စာက ကိုယ့်အိမ်ပဲ။', 'Ran all this way to post a letter. It\'s addressed to my own house.', 'facepalm'),
      A('ကြားတာနဲ့ မြင်တာ မတူဘူး။ ပြေးနေတော့ နှစ်ခုလုံး တစ်ဝက်စီပဲ ရတယ်။', "Hearing and seeing aren't the same. On the run I get half of each."),
      A('ငါ သတင်းစာထဲ ပါရင် ခေါင်းစဉ်က "လူတစ်ယောက် ပြေးသွားသည်" ပဲ။', "If I were in the paper, the headline would be 'Man Runs Past'."),
      A('♪ ဒင်ဒေါင် ♪ သတင်းထူး! ကိုဟိန်းထက် အချိန်မီ ရောက်သည်! …မဟုတ်သေးဘူး။', '♪ Ding-dong ♪ Breaking news! Ko Hein Htet arrives on time! …Not yet.'),
      A('တံတားမီးတွေ လင်းပြီ။ ပထမဆုံး ဖြတ်ပြေးချင်တာ… ဒုတိယ ဖြစ်သွားတယ်။', 'The bridge lamps are lit. I wanted to be first across… came second.', 'shrug', { flag: 'd7.bridge' }),
      A('"ဘယ်သူ ပြောတာလဲ" မေးတော့ "လူတိုင်း" တဲ့။ လူတိုင်းကို ငါ မတွေ့ဖူးဘူး။', "Asked 'who said so?' 'Everyone.' I've never met Everyone.", null, { flag: 'd8.ch12Done' }),
      A('ကြော်ငြာစာရွက်တွေ မိုးထဲ ပျော်ကုန်ပြီ။ ငါ့စာရင်းလည်း ပျော်ပြီ။ ပေါ့သွားတယ်။', 'The rain melted the handbills. And my to-do list. I feel lighter.', null, RAIN),
    ],
    meets: [
      meet('jn-handbill', { age: 'adult', woman: true, job: 'reader' }, 'dropPapers', 'surprised', [
        ['hh', 'သတင်းထူး! သတင်းထူး! …ခဏ၊ ဘာသတင်းလဲ မဖတ်ရသေးဘူး။', "Big news! Big news! …Hang on, I haven't read it.", 'dropPapers'],
        ['folk', 'မဖတ်ဘဲ ဘာလို့ အော်တာလဲ။', 'Then why are you shouting it?'],
        ['hh', 'လူတိုင်း အော်နေလို့။ …အဲဒါ အကြောင်းပြချက် မကောင်းဘူးနော်။', "Everyone else was. …Not a great reason, is it?"],
        ['folk', 'မကောင်းဘူး။ ဖတ်ပြီး ကိုယ်တိုင် စစ်ဦး။', 'No. Read it, then check for yourself.'],
      ]),
      meet('jn-sixnine', { age: 'child', job: 'pupil' }, 'spin', 'think', [
        ['folk', 'အစ်ကို၊ ဒါ ခြောက်လား ကိုးလား။', 'Big brother, is this a six or a nine?'],
        ['hh', 'ခြောက်! …ခဏ၊ ပတ်ကြည့်မယ်… ကိုး! …ထပ်ပတ်… ခြောက်!', 'Six! …Wait, round the other side… nine! …Round again… six!', 'spin'],
        ['folk', 'ရပ်တော့။ အစ်ကို မူးနေပြီ။', "Stop. You're dizzy."],
        ['hh', 'ဒါကြောင့် ရေးတဲ့သူကို မေးရတာ။ ငါ့ခေါင်းကို မမေးနဲ့။', "That's why you ask whoever wrote it. Not my spinning head."],
      ], { flag: 'd8.ch13Done' }),
      meet('jn-letter', { age: 'elder', job: 'letter writer' }, 'bow', 'smile', [
        ['hh', 'ဦးလေး၊ စာတစ်စောင် ရေးပေးပါ။ "ကျွန်တော် နောက်ကျမယ်" လို့။', "Uncle, write me a letter: 'I'll be late.'"],
        ['folk', 'ဘယ်သူ့ဆီလဲ။', 'To whom?'],
        ['hh', 'လူတိုင်းဆီ။ ကြိုပို့ထားမယ်။ အချိန်ချွေတာ!', 'Everyone. In advance. Saves time!', 'bow'],
        ['folk', 'ဒါဆို တစ်စောင်တည်း ရေးမယ်: "ကြိုတင် တောင်းပန်ပါတယ်"။', "Then one letter will do: 'Sorry in advance.'"],
      ]),
      meet('jn-crossing', { age: 'elder', woman: true, job: 'grandmother' }, 'salute', 'smile', [
        ['hh', 'အဘွား၊ လမ်းကူးမလို့လား။ ကျွန်တော် တွဲပေးမယ်! အမြန်!', "Grandma, crossing? I'll help you! Quick!", 'salute'],
        ['folk', 'အမြန် မလိုဘူး။ ငါ့ခြေလှမ်းနဲ့ ငါ့အချိန်နဲ့။', 'No quick. My steps, my pace.'],
        ['hh', 'ဟုတ်ကဲ့… ဖြည်းဖြည်း… ဖြည်းဖြည်း…', "Yes, ma'am… slowly… slowly…"],
        ['hh', 'ရောက်ပြီ! ဖြည်းဖြည်းသွားတာ ပျော်စရာပဲ! …ငါ ဘာဖြစ်သွားတာလဲ။', "We're across! Slow is fun! …What's happening to me?"],
      ]),
      meet('jn-press', { age: 'adult', job: 'printer' }, 'facepalm', 'happy', [
        ['hh', 'အစ်ကို၊ ကျွန်တော့်ပုံနဲ့ "ဒီလ အမြန်ဆုံးလူ" လို့ ရိုက်နှိပ်ပေးပါ။', "Brother, print my picture: 'Fastest Man of the Month'."],
        ['folk', 'ပုံနှိပ်ထားတိုင်း မှန်တာ မဟုတ်ဘူးလေ။', "Being printed doesn't make it true."],
        ['hh', 'ဒါဆို "ဒီလ အလောတကြီးအဖြစ်ဆုံးလူ"။ အဲဒါ မှန်တယ်!', "Then 'Most Rushed Man of the Month'. That one's true!", 'facepalm'],
      ]),
      meet('jn-despacito', { age: 'teen', woman: true, job: 'student' }, 'shrug', 'talk', [
        // CHECK(song): "Despacito" (Luis Fonsi), title only
        ['hh', '♪ "Despacito" ♪ အဓိပ္ပာယ်က "ဖြည်းဖြည်း" တဲ့!', "♪ 'Despacito' ♪ It means 'slowly', you know!"],
        ['folk', 'အစ်ကို အဲဒီသီချင်းကို ပြေးရင်း ဆိုနေတာလေ။', "You're singing it at a run."],
        ['hh', 'သီချင်းက ဖြည်းဖြည်း၊ ငါက မြန်မြန်။ ပျမ်းမျှဆို ကွက်တိ!', "The song's slow, I'm fast. On average, perfect!", 'shrug'],
      ]),
    ],
  },

  // ---- HEARTH ROW: bread, the oven, weaving, noodles, the evening class, the kite bench, the Note Wall
  // (chapters 14, 15, 18, 21: nobody unhappy because of you; hot words burn their owner first; own it quietly)
  hearth: {
    solo: [
      A('မုန့်ဖုတ်နံ့ကြောင့် ရပ်မိတယ်။ မုန့်နံ့က ငါ့ ဘရိတ်ပဲ။', 'The smell of bread stopped me. Bread is my only brake.', 'skid'),
      A('ပေါင်မုန့်ပူပူ ပြေးရင်း စားတယ်။ လျှာ ပူသွားပြီ။ စကားလည်း ပူမှာ စိုးတယ်။', 'Ate hot bread on the run. Burnt tongue. Hope my words don\'t come out hot.', 'fanSelf'),
      A('ယက်ကန်းက တစ်ချက်ချင်း။ ငါက တစ်ချက်တည်းနဲ့ တစ်ထည်လုံး ယက်ချင်တာ။', 'The loom goes one thread at a time. I want the whole cloth in one go.'),
      A('ခေါက်ဆွဲဆိုင်မှာ ထိုင်စားရမယ်တဲ့။ ဒါကြောင့် မစားရသေးတာ။', "At the noodle house you have to sit to eat. That's why I haven't eaten."),
      A('"စကားကြမ်း စိတ်ကောင်း" က ဆင်ခြေတဲ့။ "စကားမြန် စိတ်ကောင်း" ကော။', "'Rough tongue, good heart' is an excuse, they say. What about 'fast tongue, good heart'?", 'shrug'),
      A('မီးဖိုထဲလို ပူနေတယ်။ အင်္ကျီနီကြောင့်လား၊ ပြေးလို့လား။', 'Hot as the oven. The red suit, or the running?', 'fanSelf'),
      A('ညနေတန်းမှာ သင်ချင်တယ်။ ဘာသာရပ်: "နောက်ကျနည်း အဆင့်မြင့်"။', "I'd love to teach at the evening class. Subject: 'Running Late, Advanced'."),
      A('အမှားကို တိတ်တိတ်လေး ဝန်ခံတဲ့။ ငါ မှားသွားတယ်… တိတ်တိတ်လေး… ကြားလား!', 'Own a mistake quietly, they say. I made a mistake… quietly… did you HEAR?!'),
      A('♪ ပေါင်မုန့်ပူပူ ပြေးလာခဲ့ ♪ ငါ့ ကြော်ငြာသီချင်း။ မုန့်တိုက်က ပိုက်ဆံ မပေးဘူး။', "♪ Hot bread, come running ♪ My own advert jingle. The bakery isn't paying me."),
      A('စာကပ်တဲ့ နံရံမှာ ငါ့စာလည်း ကပ်ချင်တယ်: "ကိုဟိန်းထက် ဒီကို ဖြတ်သွားသည်"။', "I want to pin a note on the wall too: 'Ko Hein Htet passed by here.'", null, { from: 12 }),
      A('ငါ ပြေးလို့ ဘယ်သူမှ မစိတ်ဆိုးဘူးလား။ …ဆိုးရင် ပြောပါ။ ဖြည်းဖြည်း ပြေးမယ်။', "Does my running bother anyone? …If it does, say so. I'll run slower.", null, { flag: 'd9.ch14Done' }),
      A('မိုးရွာနေလည်း မုန့်ဖုတ်ဖို မငြိမ်းဘူး။ ငါလည်း မငြိမ်းဘူး!', "Rain or not, the oven stays lit. So do I!", 'jumpCheer', RAIN),
    ],
    meets: [
      meet('hr-bread', { age: 'adult', woman: true, job: 'baker' }, 'skid', 'smile', [
        ['hh', '(မုန့်နံ့!) …ရပ်ချင်လို့ ရပ်တာ မဟုတ်ဘူး။ နှာခေါင်းက ရပ်ခိုင်းတာ။', "(Bread!) …I didn't decide to stop. My nose did.", 'skid'],
        ['folk', 'ပူပူလေး တစ်လုံး ယူသွား။ ပြေးရင်း မစားနဲ့နော်။', "Take a warm one. Don't eat it running."],
        ['hh', 'မစားပါဘူး… (ကိုက်) …ပူတယ်! ပူတယ်!', "I won't… (bite) …Hot! Hot!", 'fanSelf'],
        ['folk', 'ပြောသားပဲ။', 'Told you.'],
      ]),
      meet('hr-loom', { age: 'elder', woman: true, job: 'weaver' }, 'stretch', 'think', [
        ['hh', 'အဘွား၊ ဒီအထည် ဘယ်တော့ ပြီးမလဲ။ ကျွန်တော် စောင့်နိုင်တယ်… ငါးမိနစ်။', "Grandma, when will this cloth be done? I can wait… five minutes."],
        ['folk', 'နောက်လ။', 'Next month.'],
        ['hh', 'နောက်လ! ချည်တစ်ပင်ချင်းလား!', 'Next month! One thread at a time?!', 'stretch'],
        ['folk', 'တစ်ပင်ချင်းမို့ ခိုင်တာ။ မင်း ပြေးတာလည်း တစ်လှမ်းချင်းပဲ မဟုတ်လား။', "One at a time, that's why it's strong. Your running is one step at a time too, isn't it?"],
      ]),
      meet('hr-noodles', { age: 'adult', woman: true, job: 'noodle seller' }, 'checkWatch', 'smile', [
        ['hh', 'ခေါက်ဆွဲ တစ်ပွဲ ထုပ်ပေးပါ! ထိုင်စားချိန် မရှိဘူး!', 'One noodles, to go! No time to sit!', 'checkWatch'],
        ['folk', 'ထုပ်ရင် ပွကုန်မယ်။ ထိုင်စားရင် ငါးမိနစ်ပဲ။', "Wrapped, they'll go soggy. Sitting, five minutes."],
        ['hh', '…ငါးမိနစ်။ ရတယ်။ နာရီ မကြည့်ဘဲ စားမယ်။', "…Five minutes. Fine. I'll eat without looking at my watch."],
        ['hh', '(စား) …အော်၊ အရသာကောင်းလိုက်တာ။ နာရီ မေ့သွားပြီ။', '(eats) …Oh, that\'s good. Forgot all about the watch.'],
      ]),
      meet('hr-class', { age: 'child', job: 'evening-class kid' }, 'salute', 'happy', [
        ['folk', 'ဆရာ! ဆရာ! …အော်၊ ဆရာ မဟုတ်ဘူး။ အနီရောင် အစ်ကို။', 'Teacher! Teacher! …Oh. Not Teacher. The red brother.'],
        ['hh', 'ဒီနေ့ သင်ခန်းစာ: ပြေးရင်း ဘာမှ မမှတ်မိဘူး! ပြီးပြီ။ ကျောင်းဆင်း!', "Today's lesson: you remember nothing on the run! The end. Class dismissed!", 'salute'],
        ['folk', 'အဲဒါ သင်ခန်းစာ ဟုတ်လို့လား။', 'Is that even a lesson?'],
        ['hh', 'ဟုတ်တယ်။ ငါ့ဘဝက သင်ခန်းစာ အပြည့်ပဲ!', 'It is. My life is nothing but lessons!'],
      ]),
      meet('hr-burnt', { age: 'adult', job: 'baker' }, 'fanSelf', 'hot', [
        ['folk', 'မုန့်တွေ တူးကုန်ပြီ! ဘယ်သူ့အပြစ်လဲ!', "The bread's burnt! Whose fault is this?!"],
        ['hh', 'ကျွန်… မဟုတ်ဘူး… ကျွန်တော် ခုမှ ရောက်တာ။', "M— no— I just got here."],
        ['hh', 'ဒါပေမဲ့ ယပ်ခတ်ပေးမယ်။ မီးဖိုရော ဒေါသရော အေးအောင်။', "But I'll fan you. Cool the oven and the temper.", 'fanSelf'],
        ['folk', '…ကျေးဇူးပဲ။ ငါလည်း ခဏ အသက်ရှူလိုက်ဦးမယ်။', "…Thanks. I'll take a breath too."],
      ]),
      meet('hr-bench', { age: 'elder', job: 'old man on the bench' }, 'peek', 'smile', [
        ['folk', 'ထိုင်ပါဦး ငါ့သား။ ခုံမှာ နေရာ ရှိတယ်။', "Sit a while, son. There's room on the bench."],
        ['hh', 'ခုံ… ကျွန်တော် ခုံနဲ့ မရင်းနှီးဘူး။ …ဘယ်လို ထိုင်ရတာလဲ။', "A bench… we've never really met. …How does one sit?", 'peek'],
        ['folk', 'ဒီလို။ ပြီးရင် ဘာမှ မလုပ်နဲ့။', 'Like this. Then do nothing.'],
        ['hh', '(ထိုင်) …တစ်… နှစ်… ပြီးပြီ! အကောင်းဆုံး နှစ်စက္ကန့်!', '(sits) …One… two… done! Best two seconds of my life!'],
      ]),
    ],
  },

  // ---- DIARY GARDEN: plants, bees, pots, seeds, the pond, the gourd trellis, the kiln
  // (chapters 16, 17, 19, 20: nothing stays; trouble comes to everyone; patience is proved when tested)
  garden: {
    solo: [
      A('ပျားတွေ ငါ့နောက် လိုက်တယ်။ အနီရောင် ပန်းကြီး ထင်လို့ နေမှာ။', "The bees are after me. They think I'm a big red flower.", 'dodge'),
      A('ပန်းအိုးတွေကြား မပြေးရဘူးတဲ့။ ငါ လမ်းလျှောက်တယ်… အမြန် လျှောက်တယ်။', "No running among the pots, they say. So I'm walking. Very fast."),
      A('အစေ့ စိုက်ပြီး တစ်ညလုံး စောင့်ကြည့်တယ်။ မပေါက်ဘူး။ အပင်တွေ နောက်ကျတယ်!', 'Planted a seed and watched all night. Nothing. Plants are so late!', 'checkWatch'),
      A('ကန်ထဲက ဖားက ငါ့ထက် ဝေးဝေး ခုန်တယ်။ မနာလိုဘူး… နည်းနည်းပဲ။', "The frog in the pond jumps further than me. Not jealous… only a little."),
      A('ဘူးစင်အောက် ဖြတ်ပြေးတယ်။ ဘူးသီးနဲ့ ခေါင်း ဆုံတယ်။ ဘူးသီး နိုင်တယ်။', 'Ran under the gourd trellis. Head met gourd. Gourd won.', 'trip'),
      A('အိုးဖုတ်ဖို အေးမှ ဖွင့်ရတယ်တဲ့။ ငါ စောင့်တာ မတတ်ဘူး။ သင်နေတုန်း။', "The kiln has to cool before it's opened. I can't wait. Still learning."),
      A('တစ်ယောက်တည်း နေချင်တဲ့သူကို လက်ပြပြီး ဖြတ်သွားတယ်။ အတင်း မဝင်ဘူး။', 'Someone wants to be alone? I wave and keep going. I don\'t barge in.', 'wave'),
      A('ဥယျာဉ်ထဲမှာ ငါ့နာရီသံ ကျယ်တယ်။ တိတ်လွန်းလို့။', 'My watch ticks so loud in the garden. It\'s that quiet.', 'checkWatch'),
      A('♪ ရေလောင်း၊ ကြီးကြီးလာ ♪ ပန်းပင်တွေကို ဆိုပြတာ။ မြန်မြန်ကြီးအောင်။', "♪ Water, grow up big ♪ I sing to the plants. So they'll hurry."),
      A('ခရမ်းချဉ်သီး တစ်လုံး ပြေးခူးတယ်။ ပြေးလို့ ချဉ်သွားသလားလို့။', "Picked a tomato on the run. Now I wonder if running made it sour.", 'shrug'),
      A('ပြဿနာက ဖိတ်စာ မပို့ဘဲ ရောက်လာတယ်တဲ့။ ငါ့လိုပဲ။', 'Trouble turns up uninvited, they say. Just like me.', null, { days: [12] }),
      A('မိုးရွာတော့ ပန်းပင်တွေ ပျော်နေတယ်။ ငါ့ဖိနပ်ထဲမှာတော့ ရေကန် ဖြစ်နေပြီ။', 'The plants love the rain. My shoes have turned into ponds.', null, RAIN),
    ],
    meets: [
      meet('gd-bees', { age: 'elder', job: 'beekeeper' }, 'dodge', 'surprised', [
        ['hh', 'ပျား! ပျား! ကျွန်တော် ပန်းပွင့် မဟုတ်ဘူး!', "Bees! Bees! I'm not a flower!", 'dodge'],
        ['folk', 'မပြေးနဲ့။ ပြေးရင် ပိုလိုက်တယ်။ ငြိမ်ငြိမ်နေ။', "Don't run. Run and they follow. Stand still."],
        ['hh', 'ငြိမ်ငြိမ်… ငြိမ်ငြိမ်…', 'Still… still…'],
        ['hh', '…ထွက်သွားပြီ! ငြိမ်နေတာ အလုပ်ဖြစ်တယ်! ဘယ်သူ ထင်မလဲ!', "…They've gone! Standing still works! Who'd have thought!", 'jumpCheer'],
      ]),
      meet('gd-pots', { age: 'adult', woman: true, job: 'gardener' }, 'shrug', 'smile', [
        ['hh', 'ရေလောင်းပေးမယ်! ကျွန်တော် အမြန်ဆုံး ရေလောင်းသမား!', "I'll do the watering! Fastest waterer in town!"],
        ['folk', 'ပြေးမသွားနဲ့နော်… ရေတွေ ဖိတ်ကုန်မယ်…', "Don't run with it… it'll all slop out…"],
        ['hh', 'ရောက်ပြီ! …ရေပုံး ဗလာ။ ရေတွေ ဘယ်ရောက်ကုန်လဲ။', "There! …The can's empty. Where did the water go?", 'shrug'],
        ['folk', 'လမ်းပေါ်မှာ။ လမ်းကတော့ ကျေးဇူးတင်နေမှာ။', 'On the path. The path says thank you.'],
      ]),
      meet('gd-seed', { age: 'child', woman: true, job: 'little gardener' }, 'peek', 'think', [
        ['folk', 'အစ်ကို၊ ငါ့အစေ့ ဘာလို့ မပေါက်သေးတာလဲ။ မနေ့က စိုက်တာ။', "Big brother, why hasn't my seed come up? I planted it yesterday."],
        ['hh', 'ငါလည်း အတူတူပဲ! တစ်ညလုံး စောင့်ကြည့်တာ!', 'Same with mine! I watched all night!', 'peek'],
        ['hh', 'ဒါပေမဲ့ အပင်တွေ နောက်မကျဘူးတဲ့။ ကိုယ့်အချိန်နဲ့ ကိုယ် ပေါက်တာတဲ့။', "But plants are never late, they say. They come up in their own time."],
        ['folk', 'အစ်ကိုကော ကိုယ့်အချိန်နဲ့ ကိုယ်လား။', 'And you? Your own time?'],
        ['hh', 'ငါက… အချိန်ထက် နည်းနည်း ရှေ့ရောက်နေတာ။', "Me? I'm… a little ahead of my time."],
      ]),
      meet('gd-kiln', { age: 'adult', job: 'kiln worker' }, 'pointAtWatch', 'smile', [
        ['hh', 'အစ်ကို၊ မီးဖို ဖွင့်ပါတော့! ကြည့်ချင်လို့!', 'Brother, open the kiln! I want to see!'],
        ['folk', 'မအေးသေးဘူး။ အခု ဖွင့်ရင် အိုးတွေ အက်ကုန်မယ်။', "It's not cool yet. Open it now and the pots crack."],
        ['hh', 'ဒါဆို ဘယ်အချိန်လဲ!', 'Then when?!', 'pointAtWatch'],
        ['folk', 'မင်း နာရီကို ကြည့်နေသရွေ့ မအေးဘူး။', 'As long as you stare at that watch, never.'],
      ]),
      meet('gd-frog', { age: 'teen', job: 'pond kid' }, 'jumpCheer', 'happy', [
        ['folk', 'ဖားခုန်ပြိုင်ပွဲ! အစ်ကို ဝင်မလား!', 'Frog-jump contest! You in?'],
        ['hh', 'ဝင်မယ်! ဒီတစ်ခါ ငါ နိုင်မယ်…', "I'm in! This time I'll win…", 'jumpCheer'],
        ['folk', 'ဖားက သုံးပေ။ အစ်ကိုက နှစ်ပေ။', 'Frog: three feet. You: two.'],
        ['hh', 'ဖားကို ဂုဏ်ယူပါတယ်။ သူများ နိုင်ရင် ဝမ်းသာရမယ်တဲ့!', "Well done, frog. Be glad when someone else wins, they say!", 'thumbsUp'],
      ]),
      meet('gd-flattened', { age: 'adult', woman: true, job: 'gardener' }, 'shrug', 'sad', [
        ['folk', 'မိုးကြောင့် ပျိုးပင်တွေ လဲကုန်ပြီ။', 'The rain knocked the seedlings flat.'],
        ['hh', 'ကျွန်တော်လည်း လဲတယ်။ ခဏခဏ။ ပြီးရင် ပြန်ထတယ်။', 'I fall over too. All the time. Then I get up.', 'shrug'],
        ['folk', 'ပြန်စိုက်မယ်။ မင်းလို ပြန်ထလာမှာပါ။', "We'll replant. They'll get up again, like you."],
        ['hh', 'ကျွန်တော့်လို လျှောက်ပြေးတော့ မပြေးစေနဲ့နော်!', "Just don't let them run about like me!"],
      ], RAIN),
    ],
  },

  // ---- THE BLANK PAGE: unfinished, empty, quiet; pencil, erasers, footprints, the lodge
  // (chapters 22, 23, finale: test it yourself; quiet shows what is; name your sources)
  blank: {
    solo: [
      A('ဒီမှာ ဘာမှ မရှိဘူး။ ငါ့ခြေရာပဲ ရှိတယ်။ စာရေးနေသလိုပဲ။', 'Nothing here. Only my footprints. Like I\'m writing.'),
      A('စာမျက်နှာ ဗလာ။ ငါ့စာရင်းလည်း ဗလာ။ ဘာလုပ်မလို့လဲ မေ့သွားပြီ။', 'Blank page. Blank to-do list. Forgot what I was doing.', 'spin'),
      A('တိတ်လိုက်တာ။ ကိုယ့်နှလုံးခုန်သံ ကြားရတယ်။ နာရီသံလား မသိဘူး။', 'So quiet. I can hear my heartbeat. Or is that my watch?', 'checkWatch'),
      A('ခဲတံနဲ့ ရေးတာ ဖျက်လို့ရတယ်။ ငါ့ နောက်ကျတာတွေလည်း ဖျက်လို့ရရင် ကောင်းမယ်။', 'Pencil rubs out. Wish my lateness did.'),
      A('ဒီမှာ ဘယ်သူမှ နောက်မကျဘူး။ နာရီ မရှိလို့။ …ငါ့ဟာက လွဲရင်။', "Nobody's late here: no clocks. …Except mine."),
      A('ဘယ်သူ့စကားလဲ နာမည်တပ်ရမယ်တဲ့။ ဒါ အမေ့စကား: "ဖြည်းဖြည်း"။', "Name your sources, they say. This one's Mum's: 'slowly'."),
      A('ဒီမှာ ပြေးရင် ပဲ့တင်ထပ်တယ်: "ဟိန်းထက်… ထက်… ထက်…"', "Run here and it echoes: 'Hein Htet… Htet… Htet…'"),
      A('ကိုယ်တိုင် စမ်းမှ သိမယ်တဲ့။ ဒါကြောင့် ဒီနေရာကို ငါးခါ ပြေးပတ်ပြီးပြီ။', "Test it yourself, they say. So I've run round this spot five times."),
      A('ဘာမှ မရှိတဲ့နေရာမှာ ဘာမှ မလုပ်ဘဲ ရပ်နေရတာ ခက်တယ်။ ငါ့အတွက်ပေါ့။', 'Standing still, doing nothing, somewhere with nothing. Hardest thing. For me.', 'catchBreath'),
      A('♪ လာ လာ လာ ♪ စာမျက်နှာ ဗလာရဲ့ ပထမဆုံးသီချင်း။ မူပိုင် ငါ့ဟာ!', '♪ La la la ♪ The first song ever sung on the Blank Page. Copyright: me!'),
      A('စာရွက်ဖြူပေါ် အနီရောင်လူ တစ်ယောက်။ အဝေးကနေ အမှတ်အသားလေးလို ဖြစ်နေမှာ။', 'A red man on white paper. From far off I must look like a little blot.'),
      A('ဒီလမ်းကို လူတိုင်း ကိုယ့်ဘာသာ လျှောက်ရတယ်တဲ့။ ငါကတော့ ပြေးတယ်။', 'Everyone walks this road for themselves, they say. I run mine.', null, { flag: 'd13.ch22Done' }),
    ],
    meets: [
      meet('bl-nothing', { age: 'adult', job: 'wanderer' }, 'spin', 'think', [
        ['hh', 'ဒီမှာ ဘာရှိလဲ! ဘာရှိလဲ!', "What's here? What's here?", 'spin'],
        ['folk', 'ဘာမှ မရှိဘူး။ အဲဒါ လှတာ။', "Nothing. That's the beauty of it."],
        ['hh', 'ဘာမှ မရှိတာကို ကြည့်ဖို့ ဒီထိ ပြေးလာတာ။ တန်တယ်!', 'Ran all this way to look at nothing. Worth it!'],
      ]),
      meet('bl-lodge', { age: 'elder', woman: true, job: 'lodge keeper' }, 'bow', 'smile', [
        ['folk', 'ဒီည တည်းမလား။', 'Staying the night?'],
        ['hh', 'မတည်းဘူး။ အိပ်ရင်တောင် ပြေးနေတဲ့ အိပ်မက် မက်တယ်။', 'No. Even asleep, I dream I\'m running.', 'bow'],
        ['folk', 'ဒါဆို ရေတစ်ခွက်ပဲ ယူသွား။ အိပ်မက်ထဲ ရေဆာမှာ စိုးလို့။', 'Then take a cup of water. In case you get thirsty in the dream.'],
      ]),
      meet('bl-drawing', { age: 'child', job: 'kid with a pencil' }, 'thumbsUp', 'happy', [
        ['folk', 'ငါ ဒီမှာ အိမ် ဆွဲနေတာ။ အစ်ကို့ကိုလည်း ဆွဲထည့်ပေးမယ်။', "I'm drawing a house here. I'll draw you in."],
        ['hh', 'ပြေးနေတဲ့ပုံ ဆွဲ။ ငြိမ်နေတဲ့ပုံဆို ငါနဲ့ မတူဘူး။', "Draw me running. A still one wouldn't look like me."],
        ['folk', 'ပြီးပြီ။ မျဉ်းတစ်ကြောင်းပဲ။ အနီရောင်။', 'Done. One line. Red.'],
        ['hh', 'တူလိုက်တာ!', 'Spot on!', 'thumbsUp'],
      ]),
      meet('bl-eraser', { age: 'adult', woman: true, job: 'scribe' }, 'facepalm', 'smile', [
        ['hh', 'အစ်မ၊ ခဲဖျက် ငှားပါ။ ဒီနေ့မနက်ကို ဖျက်ချင်လို့။', "Sister, lend me an eraser. I'd like to rub out this morning."],
        ['folk', 'ဘာဖြစ်ခဲ့လို့လဲ။', 'What happened?'],
        ['hh', 'နိုးတာ နောက်ကျ၊ ဖိနပ် ပြောင်းပြန်၊ ဆိတ်က စာရင်း စားသွား။', 'Overslept, shoes on backwards, a goat ate my list.', 'facepalm'],
        ['folk', 'မဖျက်နဲ့။ အဲဒါ ဇာတ်လမ်းကောင်း တစ်ပုဒ်ပဲ။', "Don't rub it out. That's a good story."],
      ]),
      meet('bl-silence', { age: 'elder', job: 'old walker' }, 'catchBreath', 'smile', [
        ['folk', 'ရပ်ကြည့်။ နားထောင်ကြည့်။', 'Stop. Listen.'],
        ['hh', '(ရပ်) …ဘာမှ မကြားဘူး။', '(stops) …I hear nothing.', 'catchBreath'],
        ['folk', 'ဟုတ်တယ်။ ပြေးနေတုန်း ဒါကို တစ်ခါမှ မကြားဖူးဘူး မဟုတ်လား။', "Exactly. You've never heard that while running, have you?"],
        ['hh', '…တိတ်ဆိတ်တာမှာလည်း အသံရှိတာပဲ။', '…So silence has a sound.'],
      ]),
      meet('bl-source', { age: 'teen', woman: true, job: 'student' }, 'pointAtWatch', 'think', [
        ['folk', '"အချိန်က မစောင့်ဘူး" ဆိုတာ အစ်ကို့ စကားလား။', "'Time waits for no one': is that yours?"],
        ['hh', 'မဟုတ်ဘူး! နာရီက ပြောတာ။ နာရီကို ကိုးကားပါ။', 'No! My watch said it. Credit the watch.', 'pointAtWatch'],
        ['folk', 'နာရီကကော ဘယ်သူ့ဆီက ကြားလဲ။', 'And where did the watch hear it?'],
        ['hh', '…အဲဒါ နာရီကိုပဲ မေးကြည့်ရမယ်။', "…You'd have to ask the watch."],
      ], { from: 14 }),
    ],
  },
};

// =================================================================================================================
// MAYA: he runs up to her, jumps in front of her car, and flees. The crush stays hidden: cheesy lines are a joke he
// panics out of; he never confesses, never touches her, never comments on her body. Maya is ALWAYS kind:
// warm, amused, caring or encouraging; friendly teasing at most, never dry or sarcastic (owner, 2026-11-14).
// He never tells her where to go, where anything is, or what a puzzle wants.
// =================================================================================================================
// DRAFT(my)
const walkup = [
  talk('wu-hello', [
    ['hh', 'မင်္ဂလာပါ! ကျွန်တော် ကိုဟိန်းထက်ပါ! အလုပ်များလို့ ပြေးနေတာ!', "Hello! I'm Ko Hein Htet! Busy, hence the running!", 'skid'],
    ['maya', 'မင်္ဂလာပါ ကိုဟိန်းထက်! ဖြည်းဖြည်းနော်။ ဘာအလုပ်တွေ များနေတာလဲ။', 'Hello, Ko Hein Htet! Easy now. What keeps you so busy?', 'happy'],
    ['hh', 'အဲဒါ… မေးခွန်းကောင်းပဲ။ ပြန်လာမှ ပြောမယ်!', "That's… a very good question. I'll tell you when I'm back!", 'straightenJacket'],
  ], { to: 2 }),
  // the owner's own line (keep it word for word)
  talk('wu-medicine', [
    ['hh', 'ဟေ့ကောင်မလေး မင်းလှလိုက်တာ ဘာဆေးတွေကိုဆောင်ထားတုန်း', "Hey you, how are you this lovely? What medicine are you carrying?!", 'straightenJacket'],
    ['hh', '…ဆိုလိုတာက ဆေးဆိုင် ဖွင့်သေးလား! ခေါင်းကိုက်လို့! သွားပြီ!', "…I mean, is the pharmacy still open?! Headache! Gotta run!", 'checkWatch'],
    ['maya', 'ဆေးတော့ မဆောင်ထားဘူး။ ရေတော့ ပါတယ်။ သောက်မလား။', "No medicine on me. I've got water, though. Want some?", 'smile'],
    ['hh', 'ရ… ရပါတယ်! ကျွန်တော် နေကောင်းပါတယ်! လုံးဝ!', "N-no thanks! I'm fine! Perfectly fine!", 'dropPapers'],
  ]),
  talk('wu-wifi', [
    ['hh', 'မမာရာ ဝိုင်ဖိုင်လား။ ဒီနားရောက်တာနဲ့ လိုင်းကောင်းသွားလို့။', 'Ma Maya, are you wi-fi? The signal got great the moment I came near.', 'straightenJacket'],
    ['maya', '(ရယ်) ဒေတာ အသစ် ဖြည့်လိုက်လို့ နေမှာပါ ကိုဟိန်းထက်ရဲ့။', '(laughs) Maybe you just topped up your data, Ko Hein Htet!', 'happy'],
    ['hh', 'ဟုတ်တယ်! ဒေတာ! ဒါပဲ! ဒေတာကြောင့်! ဘိုင်!', "Yes! Data! That's it! It's the data! Bye!", 'wave'],
  ]),
  talk('wu-powercut', [
    ['hh', 'မီးပျက်နေတာတောင် ဒီနားက လင်းနေတယ်နော်…', "Funny, the power's out but it's so bright round here…"],
    ['maya', '(ရယ်) နေ့လယ်ကြီးလေ။ နေပူထဲ ရေများများ သောက်နော်။', "(laughs) It's midday! Drink plenty of water in this sun.", 'happy'],
    ['hh', 'နေ့လယ်! ဟုတ်ပါ့! နေကြောင့်! နေ တော်လိုက်တာ! သွားပြီ!', 'Midday! Right! The sun! Good old sun! Off I go!', 'facepalm'],
  ], { time: 'day' }),
  talk('wu-tea', [
    ['hh', 'မမာရာကို ကြည့်ရတာ လက်ဖက်ရည် ချိုဆိမ့်လိုပဲ…', 'Looking at you is like a sweet, creamy tea…', 'straightenJacket'],
    ['hh', '…ဆိုလိုတာက လက်ဖက်ရည် ငတ်နေလို့! လက်ဖက်ရည်! အမြန်!', "…I mean, I'm dying for tea! Tea! Urgently!"],
    ['maya', 'ကျွန်မလည်း လက်ဖက်ရည် ကြိုက်တယ်။ ချိုချို သောက်ရင် သွားကို ဂရုစိုက်နော်။', 'I love tea too! If you take it sweet, look after your teeth.', 'happy'],
    ['hh', 'သွား… သွားပိုး! ဟုတ်! ကျွန်တော် သွားပြီ!', "Teeth— tooth— right! I'm going!", 'dropPapers'],
  ]),
  talk('wu-watch', [
    ['hh', 'မမာရာ၊ အခု ဘယ်နှနာရီ ရှိပြီလဲ။', "Ma Maya, what's the time?"],
    ['maya', '(ရယ်) ကိုဟိန်းထက် လက်မှာ နာရီ ပါတယ်လေ။', "(laughs) You've got a watch on, Ko Hein Htet!", 'happy'],
    ['hh', '…ဟုတ်သားပဲ။ စမ်းကြည့်တာ။ သတိထားမိလားလို့။', '…So I am. Just testing. To see if you\'d notice.'],
    ['maya', 'သတိထားမိပါတယ်။ ပြောင်းပြန်လေး ဖြစ်နေတာလည်း သတိထားမိတယ်နော်။', "I noticed! And it's on upside down, just so you know.", 'smile'],
    ['hh', 'အိုး… ပြောင်းပြန်! ဒါကြောင့် နောက်ကျနေတာကိုး!', "Oh… upside down! So THAT's why I'm always late!", 'checkWatch'],
  ]),
  talk('wu-papers', [
    ['hh', 'မမာရာ! မင်္ဂလာ… ', 'Ma Maya! Hel—', 'dropPapers'],
    ['hh', 'စာရွက်တွေ! မကောက်ပါနဲ့! ကျွန်တော် ကောက်မယ်!', "My papers! Don't pick them up! I'll get them!"],
    ['maya', 'ဒီတစ်ရွက်မှာ "မမာရာကို မင်္ဂလာပါ ပြောရန်" တဲ့။ မင်္ဂလာပါ!', "This one says 'Say hello to Ma Maya'. Well, hello to you too!", 'happy'],
    ['hh', 'အဲဒါ… စာရင်းထဲ လူတိုင်း ပါတယ်! လူတိုင်း! ပြောပြီးပြီ! အမှန်ခြစ်!', "That's… everyone's on that list! Everyone! Said it! Tick!", 'straightenJacket'],
  ]),
  talk('wu-early', [
    ['hh', 'မမာရာ ပြေးတာ တစ်ခါမှ မမြင်ဖူးဘူး။ ဘယ်လို အချိန်မီတာလဲ။', 'I never see you run, Ma Maya. How are you ever on time?'],
    ['maya', 'နည်းနည်း စောစော ထွက်တယ်လေ။ ကိုဟိန်းထက်လည်း လုပ်နိုင်ပါတယ်။', "I leave a little early. You could too, I'm sure of it!", 'smile'],
    ['hh', 'စောစော ထွက်… ဉာဏ်ကြီးလိုက်တာ! ချက်ချင်း စမ်းမယ်! မနက်ဖြန်ကစ!', 'Leave early… genius! I\'ll try it right away! From tomorrow!', 'jumpCheer'],
  ]),
  talk('wu-westlife', [
    // CHECK(song): Westlife named only, no words
    ['hh', '♪ ဟမ်း ဟမ်း ♪ …အော်၊ မမာရာ! သီချင်းဆိုနေတာ မဟုတ်ပါဘူး။', "♪ Hm hm ♪ …Oh, Ma Maya! I wasn't singing.", 'straightenJacket'],
    ['maya', 'Westlife သီချင်းလား။ အသံလေး ကောင်းသားပဲ။', 'Was that Westlife? You sound nice!', 'happy'],
    ['hh', 'Westlife! ဟုတ်… ဆိုလိုတာက အချစ်သီချင်း မဟုတ်ဘူး! ဆန်ဈေး သီချင်း!', 'Westlife! Yes… I mean, not a love song! A rice-price song!', 'dropPapers'],
    ['maya', '(ရယ်) ဆန်ဈေးကလည်း ရင်ကွဲစရာပဲနော်။ ဆက်ဆိုပါ။', '(laughs) Rice prices are heartbreaking too! Keep singing.', 'happy'],
  ]),
  talk('wu-mum', [
    ['hh', 'မမာရာ၊ ကျွန်တော့် အမေက ပြောခိုင်းလိုက်တယ်…', 'Ma Maya, my mum asked me to tell you…', 'straightenJacket'],
    ['hh', '"ဆံပင်စိုနဲ့ မအိပ်နဲ့" တဲ့။ …လူတိုင်းကို ပြောခိုင်းတာ! လူတိုင်း!', "'Never sleep with wet hair.' …She said to tell everyone! Everyone!"],
    ['maya', '(ပြုံး) အမေ့ကို ကျေးဇူးတင်တယ်လို့ ပြောပေးနော်။ ကိုယ်တိုင်လည်း ဂရုစိုက်!', '(smiles) Tell her thank you! And you look after yourself too!', 'smile'],
    ['hh', 'ပြောမယ်! ပြေးပြောမယ်!', 'I will! At a run!', 'salute'],
  ]),
  talk('wu-busy', [
    ['hh', 'မမာရာ ဒီရက်ပိုင်း အလုပ်များနေတယ်နော်။ ကျွန်တော်နီးနီး။', "You've been busy lately, Ma Maya. Nearly as busy as me."],
    ['maya', 'များပါတယ်။ ဒါပေမဲ့ ဖြည်းဖြည်း လျှောက်ရင်လည်း အလုပ်ပြီးတာပဲ။', 'I have! But things still get done at a walk, you know.', 'smile'],
    ['hh', 'လမ်းလျှောက်ရင်း အလုပ်များတာ… ဖြစ်နိုင်လို့လား။', 'Busy, at a walk… is that even possible?', 'spin'],
    ['maya', 'ဖြစ်ပါတယ်။ တစ်ရက်လောက် စမ်းကြည့်ပါလား။ တတ်မှာပါ။', "It is! Try it for a day. I bet you'd be good at it.", 'happy'],
  ], { from: 5 }),
  talk('wu-rain', [
    ['hh', 'မမာရာ! ထီး ပါလား! …ကျွန်တော်လည်း မပါဘူး။ မေးကြည့်တာ။', "Ma Maya! Got an umbrella? …I haven't either. Just asking."],
    ['maya', 'စိုရွှဲနေပြီ ကိုဟိန်းထက်။ ခဏ ခိုလိုက်ပါဦး။', "You're drenched, Ko Hein Htet. Shelter for a minute.", 'worried'],
    ['hh', 'ခို… မခိုနိုင်ဘူး! ကျွန်တော် ရေစိုမှ ပိုမြန်တယ်! ငါးလိုပဲ!', "Shel— can't! I'm faster wet! Like a fish!", 'straightenJacket'],
  ], RAIN),
  talk('wu-flowers', [
    ['hh', 'ဒီနားက ပန်းတွေ အကုန် မမာရာဘက် လှည့်နေကြတယ်…', 'All the flowers round here are turning to face you…', 'straightenJacket'],
    ['hh', '…နေဘက်ကို လှည့်တာ! နေ! ပန်းတွေက နေကို ကြည့်တာ! သိပ္ပံ!', '…To face the sun! The sun! Flowers face the sun! Science!'],
    ['maya', '(ရယ်) နေက ကျွန်မ နောက်မှာ မရှိပါဘူး။ ဒါပေမဲ့ ကျေးဇူးပါနော်။', "(laughs) The sun's not behind me! But that was sweet, thank you.", 'happy'],
    ['hh', '…ပန်းတွေ မှားနေတာ! ကျွန်တော် သွားပြောလိုက်မယ်!', "…Then the flowers are wrong! I'll go and tell them!", 'facepalm'],
  ], { from: 10 }),
  talk('wu-practice', [
    ['hh', 'မမာရာ၊ ကျွန်တော် နေ့တိုင်း ပြေးတယ်။ ဒါကြောင့် ပြေးတာ တော်လာတာ။', "Ma Maya, I run every day. That's why I'm good at it.", 'stretch'],
    ['maya', 'နေ့တိုင်း လေ့ကျင့်ရင် တော်လာတာပဲ။ ကျွန်မလည်း ဒီလို ယုံတယ်။', 'Practise every day and you get good. I believe that too.', 'smile'],
    ['hh', 'ဒါဆို အချိန်မီ ရောက်တာလည်း နေ့တိုင်း လေ့ကျင့်ရမှာပေါ့…', 'Then I should practise being on time every day too…'],
    ['hh', '…မနက်ဖြန်ကစပေါ့!', '…Starting tomorrow!', 'thumbsUp'],
  ], { days: [1, 2, 3] }),
  talk('wu-rumour', [
    ['hh', 'မမာရာ၊ ကြားတယ်! မမာရာ အကြောင်း သတင်းတွေ!', 'Ma Maya, I heard things! About you!'],
    ['maya', 'ဟုတ်လား။ ကိုယ်တိုင် မြင်ခဲ့လားဟင်။', 'Oh? Did you see them yourself?', 'smile'],
    ['hh', '…မမြင်ဘူး။ ကြားရုံပဲ။', '…No. Only heard.', 'shrug'],
    ['hh', 'ဒါဆို မပြောတော့ဘူး! ကောင်းတဲ့သတင်းပဲ ဖြစ်မှာ! ဘိုင်!', "Then I'll say nothing! It's probably good news anyway! Bye!", 'wave'],
  ], { flag: 'd8.ch12Done' }),
  talk('wu-teachme', [
    ['hh', 'မမာရာ ကလေးတွေကို စာသင်ပေးတယ်ဆို။ ကျွန်တော့်ကိုလည်း သင်ပေးပါ။', "Ma Maya, they say you help kids learn. Teach me too."],
    ['maya', 'သင်ပေးမယ်လေ! ဘာသင်ချင်လဲ။', 'Happily! What would you like to learn?', 'happy'],
    ['hh', 'ရပ်နည်း။', 'How to stop.'],
    ['maya', 'ပထမ သင်ခန်းစာ: ရပ်ပြီး အသက် ဝဝ ရှူ။ လုပ်နိုင်ပါတယ်။', 'Lesson one: stop, and take a deep breath. You can do it.', 'smile'],
    ['hh', '(ရပ်) …ခက်လိုက်တာ! ဒုတိယ သင်ခန်းစာ နောက်မှ!', '(stops) …So hard! Lesson two another day!', 'catchBreath'],
  ], { flag: 'd3.ch9Done' }),
  talk('wu-tonight', [
    ['hh', 'မမာရာ၊ ဒီညပွဲ… ကျွန်တော် လာမယ်! အချိန်မီ! ကတိ!', "Ma Maya, tonight… I'll be there! On time! Promise!", 'salute'],
    ['maya', 'လာမယ်ဆို ဝမ်းသာလိုက်တာ! နောက်ကျလည်း ရပါတယ်၊ ပြေးမလာနဲ့နော်။', "I'm so glad you're coming! Even if you're late, don't run.", 'happy'],
    ['hh', 'မပြေးဘူး! …သိပ်မပြေးဘူး! အချိန်မီ ရောက်မယ်!', "I won't run! …Not much! I'll be on time!", 'straightenJacket'],
  ], { days: [15] }),
];

// Car-blocks: he leaps into the road in front of her car ("STOP! …sorry. Hello."), each opener a little different.
// DRAFT(my)
const carBlock = [
  talk('cb-hello', [
    ['hh', 'ရပ်! …တောင်းပန်ပါတယ်။ မင်္ဂလာပါ။', 'STOP! …Sorry. Hello.', 'skid'],
    ['maya', 'ကိုဟိန်းထက်! ဂရုစိုက်ပါ! ထိခိုက်သွားဦးမယ်!', "Ko Hein Htet! Be careful! You'll get hurt!", 'worried'],
    ['hh', 'ဟုတ်ကဲ့။ မင်္ဂလာပါ ပြောချင်ရုံပါ။ ပြောပြီးပြီ။', 'Yes. I only wanted to say hello. Said it.', 'bow'],
    ['maya', 'မင်္ဂလာပါ! နောက်တစ်ခါ လမ်းဘေးကနေ လက်ပြရင် မြင်ပါတယ်။', "Hello to you too! Next time just wave from the side, I'll see you.", 'smile'],
    ['hh', 'လက်ပြမယ်!', "I'll wave!", 'wave'],
  ]),
  talk('cb-brakes', [
    ['hh', 'ရပ်ပါ! …ဆောရီးပါ။ ဟိုင်း။', 'Stop, please! …Sorry. Hi.', 'skid'],
    ['hh', 'မမာရာ့ကား ဘရိတ်ကောင်းလား စစ်ကြည့်တာ။ ကောင်းတယ်!', 'Just checking your brakes. They work!', 'thumbsUp'],
    ['maya', 'ဘရိတ် ကောင်းပါတယ်။ ကိုဟိန်းထက်ကြောင့် စိုးရိမ်လိုက်ရတာ!', 'The brakes are fine. You gave me such a fright, though!', 'worried'],
    ['hh', 'စိုးရိမ်… ကျွန်တော့်အတွက်! …ဟုတ်ကဲ့! ဂရုစိုက်ပါ့မယ်! သွားပြီ!', "Worried… about me! …Right! I'll be careful! I'm off!", 'straightenJacket'],
  ]),
  talk('cb-warden', [
    ['hh', 'ရပ်! ရပ်! …တောင်းပန်ပါတယ်။ နေကောင်းလား။', 'STOP! STOP! …Sorry. How are you?', 'salute'],
    ['hh', 'ဒီနေ့ ယာဉ်ထိန်း လုပ်ကြည့်နေတာ။ မမာရာက ပထမဆုံး ကား။', "I'm trying out traffic duty today. You're my first car."],
    ['maya', '(ရယ်) ဒီလမ်းမှာ ကျွန်မ တစ်စီးတည်းရယ်နော်။ ဂရုစိုက်ပြီး လုပ်ပါ။', "(laughs) Mine's the only car on this road! Do be careful out here.", 'happy'],
    ['hh', 'ဒါကြောင့် ကားမပိတ်တာ! ကျွန်တော် အလုပ်ကောင်းတယ်!', "And that's why there's no traffic jam! I'm good at this!", 'jumpCheer'],
  ]),
  talk('cb-lift', [
    ['hh', 'ခဏ! ခဏ! …တောင်းပန်ပါတယ်။ မင်္ဂလာပါ မမာရာ။', 'Wait! Wait! …Sorry. Hello, Ma Maya.', 'skid'],
    ['maya', 'ကားစီးချင်လို့လား။ တင်ပေးမယ်လေ။', 'Want a lift? Hop in.', 'smile'],
    ['hh', 'မ… မစီးဘူး! ကျွန်တော် ကားထက် မြန်တယ်! …ကြည့်ထား!', "N-no! I'm faster than a car! …Watch!", 'stretch'],
    ['maya', '(ရယ်) ဖြည်းဖြည်း! လဲသွားဦးမယ်!', "(laughs) Slow down, you'll fall!", 'happy'],
  ]),
  talk('cb-forgot', [
    ['hh', 'ရပ်ပါဦး! …ဆောရီး။ ဟယ်လို။', 'Hold on! …Sorry. Hello.', 'skid'],
    ['hh', 'ပြောစရာ ရှိလို့… ဘာပြောမလို့လဲ…', 'I had something to tell you… what was it…', 'spin'],
    ['maya', 'အေးအေးဆေးဆေး စဉ်းစား။ ကျွန်မ စောင့်နေမယ်။', "Take your time. I'll wait.", 'smile'],
    ['hh', 'မေ့သွားပြီ! သတိရရင် ပြန်ခုန်ထွက်လာမယ်!', "Forgot! When I remember, I'll jump out again!", 'facepalm'],
    ['maya', 'မခုန်ပါနဲ့နော်! လမ်းဘေးကနေ ခေါ်ရင် ရပ်ပေးမယ်။', "Please don't jump! Call from the side and I'll stop for you.", 'worried'],
  ]),
  talk('cb-kitten', [
    ['hh', 'ရပ်! …တောင်းပန်ပါတယ်။ မင်္ဂလာ…', 'STOP! …Sorry. Hel—', 'skid'],
    ['hh', 'ကြောင်လေး လမ်းကူးနေလို့။ သူ့ကိုယ်စား တားပေးတာ။', "A kitten's crossing. I'm stopping traffic on its behalf.", 'salute'],
    ['maya', 'ကြောင်လေးကို ကူညီတာ သဘောကောင်းတယ်။ ကိုယ်တိုင်လည်း ဘေးကို ကူးနော်။', 'That was kind, helping the kitten. Now you hop to the side too!', 'happy'],
    ['hh', 'အော်… ဒါဆို ကျွန်တော်လည်း ကူးမယ်။ ကျေးဇူးပါ ယာဉ်မောင်း!', 'Oh… then I\'ll cross too. Thank you, driver!', 'bow'],
  ]),
  talk('cb-credit', [
    ['hh', 'ရပ်ပါ! …ဆောရီး ဆောရီး။ မင်္ဂလာပါ။', 'Stop! …Sorry, sorry. Hello.', 'skid'],
    ['hh', 'မမာရာ ဖုန်းဘေလ်လား။ တွေ့တိုင်း ကျွန်တော့် စကားတွေ ကုန်သွားလို့…', 'Are you phone credit, Ma Maya? Every time I see you, I run out of words…', 'straightenJacket'],
    ['hh', '…ဆိုလိုတာက ဘေလ်ဖြည့်ရမယ်! အမြန်!', '…I mean, I need a top-up! Urgently!'],
    ['maya', '(ရယ်) ဖြည့်ပြီးရင် လမ်းဘေးမှာ ရပ်ပြီး ဆက်နော်။ ဘေးကင်းအောင်။', '(laughs) Top up, then call from the roadside, okay? Stay safe.', 'happy'],
  ]),
  talk('cb-view', [
    ['hh', 'ရပ်! …တောင်းပန်ပါတယ်။ ကားပေါ်က မြင်ကွင်း လှလား။', 'STOP! …Sorry. Nice view from up there?', 'skid'],
    ['maya', 'လှပါတယ်! ကိုဟိန်းထက် လမ်းဘေးမှာ ဘေးကင်းကင်း ရှိရင် ပိုစိတ်အေးရမယ်။', "It's lovely! I'd feel better with you safe at the roadside, though.", 'smile'],
    ['hh', 'လမ်းဘေး… ဘေးကင်းကင်း… နှစ်ခုလုံး မလုပ်ဖူးဘူး။ စမ်းကြည့်မယ်!', "Roadside… safe and sound… never tried either. I'll give it a go!", 'thumbsUp'],
  ], { from: 7 }),
  talk('cb-splash', [
    ['hh', 'ရပ်! …ဆောရီးပါ။ ရေမစင်အောင် ဖြည်းဖြည်း မောင်းပါနော်။', 'STOP! …Sorry. Drive slowly so you don\'t splash anyone.', 'skid'],
    ['maya', 'ကိုဟိန်းထက် ရွှဲနေပြီ။ အအေးမိဦးမယ်၊ ခိုပါဦး!', "You're soaked through, Ko Hein Htet! You'll catch cold, get under cover!", 'worried'],
    ['hh', 'ကျွန်တော့်အတွက် မဟုတ်ဘူး! အဘွားတွေအတွက်! ကျွန်တော်က ရေထဲ ပိုမြန်တယ်!', 'Not for me! For the grannies! I\'m faster in water anyway!', 'salute'],
  ], RAIN),
  talk('cb-nicecar', [
    ['hh', 'ခဏလေး! …ဆောရီးပါ။ မင်္ဂလာပါ မမာရာ။', 'One sec! …Sorry. Good day, Ma Maya.', 'skid'],
    ['hh', 'ကားပေါ်မှာ ဒီလောက် လှတဲ့သူ… ဆိုလိုတာက… ဒီလောက် လှတဲ့ကား! ကား လှတယ်!', 'Someone this lovely in a car… I mean… a car this lovely! Lovely car!', 'straightenJacket'],
    ['maya', '(ရယ်) ကျေးဇူးပါ! ကားလေး ရှက်သွားပြီ။', "(laughs) Thank you! Now the car's blushing.", 'happy'],
    ['hh', 'ကားကို နှုတ်ဆက်ပေးပါ! သွားပြီ!', 'Say bye to the car for me! Gone!', 'wave'],
  ]),
];

// Car-dashes (owner, 2026-11-14): he dashes across the road in front of her car, she stops for a few seconds, he
// shouts one short thing over his shoulder (an apology, an excuse, a joke, now and then a flustered cheesy line) and
// Maya answers with one warm line. Speech bubbles only, never the dialogue box.
// DRAFT(my)
const dash = (id, [hmy, hen, anim], [mmy, men, face], when) => ({
  id, hh: { my: hmy, en: hen, ...(anim ? { anim } : {}) }, maya: { my: mmy, en: men, ...(face ? { face } : {}) }, ...(when ? { when } : {}),
});
const carDash = [
  dash('cd-sorry', ['ဆောရီး! ဆောရီး! အရေးကြီးလို့!', "Sorry! Sorry! It's urgent!", 'dodge'],
    ['ဂရုစိုက်နော် ကိုဟိန်းထက်!', 'Careful, Ko Hein Htet!', 'surprised']),
  dash('cd-shortcut', ['ဖြတ်လမ်း! ကားလမ်းက အတိုဆုံး ဖြတ်လမ်း!', 'Shortcut! The road is the shortest shortcut!', 'skid'],
    ['ဖြည်းဖြည်းပြေး၊ ချော်လဲဦးမယ်!', "Run slowly, you'll slip!", 'worried']),
  dash('cd-late', ['ဒီတစ်ခါ တကယ် နောက်ကျနေပြီ!', 'Properly late this time!', 'checkWatch'],
    ['နောက်ကျတာ ကိစ္စမရှိပါဘူး၊ ဘေးကင်းဖို့က ပိုအရေးကြီးတယ်!', 'Late is fine! Safe matters more!', 'worried']),
  dash('cd-thanks', ['ရပ်ပေးလို့ ကျေးဇူး! ယာဉ်မောင်း အကောင်းဆုံး!', 'Thanks for stopping! Best driver ever!', 'thumbsUp'],
    ['(ရယ်) ဘေးကင်းကင်း ပြေးနော်!', '(laughs) Run safely!', 'happy']),
  dash('cd-hens', ['ကြက်တွေ ဘာလို့ လမ်းကူးလဲ သိပြီ! အလုပ်များလို့!', 'Now I know why hens cross roads! Busy!', 'jumpCheer'],
    ['(ရယ်) ကြက်တွေထက် ပိုဂရုစိုက်နော်!', '(laughs) Be more careful than the hens!', 'happy']),
  dash('cd-lovely', ['မမာရာ မီးနီလား။ မြင်တိုင်း ရပ်… မရပ်ဘူး! ပြေးပြီ!', "Ma Maya, are you a red light? I always sto— no I don't! Running!", 'straightenJacket'],
    ['(ရယ်) မီးနီ အစစ်မှာတော့ ရပ်ပါနော်!', '(laughs) Do stop at the real ones, though!', 'happy']),
  dash('cd-lace', ['ဖိနပ်ကြိုး ပြေနေတယ်! ပြေးရင်း ချည်မယ်!', "Lace undone! I'll tie it on the run!", 'tieShoe'],
    ['ရပ်ပြီး ချည်ပါ! လဲသွားမှာ စိုးလို့!', "Stop and tie it! I'd hate for you to trip!", 'worried']),
  dash('cd-papers', ['စာရွက်တွေ လိုက်ဖမ်းနေတာ! ဆောရီး!', 'Chasing my papers! Sorry!', 'dropPapers'],
    ['အေးဆေး! ကျွန်မ စောင့်ပေးမယ်!', "No rush! I'll wait!", 'smile']),
  dash('cd-greet', ['မင်္ဂလာပါ မမာရာ! …နှုတ်ဆက်ပြီးပြီ! သွားပြီ!', 'Hello, Ma Maya! …Greeted! Gone!', 'wave'],
    ['မင်္ဂလာပါ! ဂရုစိုက်ပြီး ပြေးနော်!', 'Hello! Run carefully!', 'happy']),
  dash('cd-accident', ['ဒီလမ်း ကျွန်တော့်ဟာ မဟုတ်ဘူး! ခဏ ငှားသုံးတာ!', "This road isn't mine! Just borrowing it!", 'shrug'],
    ['(ရယ်) ဘေးကင်းကင်းနဲ့ ပြန်အပ်နော်!', '(laughs) Give it back in one piece!', 'happy']),
  dash('cd-watch', ['နာရီက ပြေးခိုင်းလို့! နာရီကို အပြစ်တင်ပါ!', 'My watch made me run! Blame the watch!', 'pointAtWatch'],
    ['(ရယ်) နာရီကိုလည်း ဖြည်းဖြည်း သွားခိုင်းလိုက်!', '(laughs) Tell your watch to slow down too!', 'happy']),
  dash('cd-tea', ['လက်ဖက်ရည် အေးသွားမှာ စိုးလို့!', "Can't let my tea go cold!", 'skid'],
    ['လက်ဖက်ရည်က စောင့်ပါတယ်! သတိထား!', 'The tea will wait! Watch out!', 'worried']),
  dash('cd-brakes', ['မမာရာ မြင်လို့ ခြေထောက်… ဆိုလိုတာက ဘရိတ်ပျက်နေတာ!', 'Saw you and my legs— I mean, my brakes broke!', 'straightenJacket'],
    ['(ရယ်) ဘရိတ် ပြင်ပြီးမှ ပြေးနော်!', '(laughs) Fix those brakes before you run!', 'happy']),
  dash('cd-goat', ['ဆိတ်က လိုက်နေတယ်! ဆောရီး!', "The goat's after me! Sorry!", 'dodge'],
    ['ဘာမှ မဖြစ်ဘူး မဟုတ်လား။ ဂရုစိုက်!', 'Are you all right? Take care!', 'worried']),
  dash('cd-rain', ['မိုးမရွာခင် ရောက်အောင်! …ရွာနေပြီပဲ!', 'Got to beat the rain! …Oh. Already raining!', 'facepalm'],
    ['လမ်းချော်တယ်နော်! ဖြည်းဖြည်း!', "The road's slippery! Go slowly!", 'worried'], RAIN),
  dash('cd-dark', ['မှောင်နေပြီ! ဒါပေမဲ့ ကျွန်တော့် အင်္ကျီ နီတယ်! မြင်ရတယ်!', "It's dark! But my suit's red! You can see me!", 'thumbsUp'],
    ['(ရယ်) မှောင်ထဲမှာ အနီရောင် သိပ်မမြင်ရဘူးနော်! ဂရုစိုက်!', "(laughs) Red's hard to see in the dark! Careful!", 'worried'], { time: 'night' }),
  dash('cd-wave', ['လက်ပဲ ပြမယ်လို့ ကတိပေးခဲ့တယ်… မေ့သွားပြီ!', "I promised I'd just wave… forgot!", 'facepalm'],
    ['ရပါတယ်! ဒီတစ်ခါ လက်ပြလိုက်!', "That's all right! Wave this time!", 'happy']),
  dash('cd-ball', ['ဘောလုံး လိုက်ကောက်နေတာ! ဆောရီး!', 'After my juggling ball! Sorry!', 'juggle'],
    ['ရပြီလား။ ကောင်းတယ်! ဘေးကို ကပ်ပြေးနော်!', 'Got it? Good! Keep to the side!', 'smile']),
  dash('cd-spin', ['ဘယ်ဘက်လား ညာဘက်လား… နှစ်ဘက်လုံး!', 'Left way or right way… both!', 'spin'],
    ['(ရယ်) မူးသွားဦးမယ်! ခဏ နားပါဦး!', "(laughs) You'll get dizzy! Rest a moment!", 'happy']),
  dash('cd-record', ['ဒီနေ့ ဘယ်သူ့ကိုမှ မတိုက်မိသေးဘူး! စံချိန်!', "Haven't bumped into anyone today! A record!", 'jumpCheer'],
    ['တော်လိုက်တာ! ဆက်ထိန်းထားနော်!', 'Well done! Keep it up!', 'happy']),
  dash('cd-mum', ['အမေ ခေါ်နေလို့! …မခေါ်ဘူး ထင်တယ်! ပြေးမယ်!', "Mum's calling! …I think not, actually! Running anyway!", 'shrug'],
    ['အမေ့ကို နှုတ်ဆက်ပေးပါ! ဂရုစိုက်နော်!', 'Say hello to your mum! Take care!', 'happy']),
  dash('cd-pharmacy', ['ဆေးဆိုင် ပိတ်တော့မယ်! …ဆေး မလိုပါဘူး! ဒါပေမဲ့ ပြေးမယ်!', "Pharmacy's closing! …I don't need medicine! Still running!", 'checkWatch'],
    ['ခေါင်းကိုက်နေသေးလား။ ရေများများ သောက်နော်!', 'Still got that headache? Drink lots of water!', 'worried']),
  dash('cd-postwoman', ['စာပို့ အစ်မနဲ့ ပြိုင်နေတာ! ဒီတစ်ခါ နိုင်မယ်!', "Racing the postwoman! I'll win this time!", 'stretch'],
    ['နိုင်ပါစေ! ဒါပေမဲ့ ဂရုစိုက်ပြေး!', 'Good luck! But run with care!', 'happy']),
  dash('cd-bow', ['ဆောရီး! ဦးညွှတ်ပြီး ပြေးမယ်!', "Sorry! A bow, and I'm off!", 'bow'],
    ['(ပြုံး) ယဉ်ကျေးလိုက်တာ! ဂရုစိုက်နော်!', '(smiles) So polite! Take care now!', 'happy']),
  dash('cd-light', ['ဒီည အတွက် နာရီမီးလေး ရှာနေတာ!', 'Hunting for my watch light for tonight!', 'pocketSearch'],
    ['တွေ့မှာပါ! အေးအေးဆေးဆေး ရှာနော်!', "You'll find it! No need to hurry!", 'smile'], { days: [15] }),
];

// His exit line before sprinting off.
// DRAFT(my)
const bye = [
  A('သွားပြီနော်! နောက်ကျနေပြီ!', "Gotta go! I'm late!", 'checkWatch'),
  A('ဘိုင်! ကျွန်တော် မရှိတုန်း ဘာမှ မဖြစ်စေနဲ့နော်!', "Bye! Don't let anything happen while I'm gone!", 'wave'),
  A('ပြန်တွေ့မယ်! ဘယ်မှာလဲ မသိဘူး! အမြဲ အဲလိုပဲ!', 'See you! Where? No idea! Always the way!'),
  A('က… ကျွန်တော် ပြေးရမယ်! အလုပ်! အရေးကြီးတဲ့ အလုပ်!', 'I-I must run! Work! Terribly important work!', 'straightenJacket'),
  A('နှုတ်ဆက်ချိန်တောင် မရှိဘူး… ဒါပေမဲ့ နှုတ်ဆက်မယ်! ဘိုင်!', 'No time even for goodbye… but here\'s one anyway! Bye!', 'wave'),
  A('အချိန်ကုန်ပြီ! နာရီက ကျွန်တော့်ကို ဆူနေပြီ!', 'Time\'s up! My watch is scolding me!', 'pointAtWatch'),
  A('နောက်တစ်ခါ ဖြည်းဖြည်း ပြောမယ်! ကတိ! …ဖြစ်နိုင်ရင်ပေါ့!', "Next time I'll talk slowly! Promise! …If at all possible!", 'salute'),
  A('သွားပြီ! ဒီတစ်ခါတော့ မလဲ…', "Off I go! This time I won't fa—", 'trip'),
  A('မမာရာ၊ ကောင်းကောင်း… အင်း… ရာသီဥတု ကောင်းပါစေ! ဘိုင်!', 'Ma Maya, have a lovely… um… weather! Bye!', 'straightenJacket'),
  A('သုံး၊ နှစ်၊ တစ်… ပြေး!', 'Three, two, one… go!', 'stretch'),
  A('ထမင်းစားဖို့ မမေ့နဲ့နော်! ကျွန်တော်ကတော့ မေ့မှာ!', "Don't forget to eat! I definitely will!", 'thumbsUp'),
  A('ဘိုင်ဘိုင်! တာ့တာ! ဆီးယူ! …သုံးခါ တစ်ပြိုင်နက်။ အချိန်ချွေတာ!', 'Bye-bye! Ta-ta! See ya! …Three at once. Saves time!', 'wave'),
  A('ကျွန်တော် မပြေးချင်ပါဘူး… ဒါပေမဲ့ ခြေထောက်က ပြေးချင်နေပြီ!', "I don't want to run… but my legs have already left!", 'skid'),
];

// =================================================================================================================
// SING (owner, 2026-11-14): famous songs NAMED (title / artist) but never quoted; the words he sings are his own
// made-up nonsense about errands, lateness and rice prices; plus his own jingles. No real lyrics, not one line.
// Every song choice is marked CHECK(song): swap in whatever is trending now.
// =================================================================================================================
// DRAFT(my)
const sing = [
  S('♪ "Despacito"… နောက်ကျစီတို… ♪ ဒါ ငါ့ဗားရှင်း!', "♪ 'Despacito'… late-o-cito… ♪ My version!", 'Despacito / Luis Fonsi'), // CHECK(song)
  S('♪ ဆန်ဈေးရဲ့ ပုံသဏ္ဌာန်… ♪ အက်ဒ် ရှီးရန်း စိတ်မဆိုးလောက်ပါဘူး။', "♪ The shape of the rice price… ♪ Ed Sheeran won't mind, surely.", 'Shape of You / Ed Sheeran'), // CHECK(song)
  S('♪ "Gangnam Style"… ပြေးနမ်းစတိုင်! ♪ မြင်းစီးက ပြေးရင် မောတယ်။', "♪ 'Gangnam Style'… running style! ♪ The horse dance at a run: exhausting.", 'Gangnam Style / PSY'), // CHECK(song)
  S('♪ "Dynamite"… ခြေထောက် ဒိုင်းနမိုက်! ♪ မပေါက်ကွဲပါဘူးနော်။', "♪ 'Dynamite'… legs of dynamite! ♪ Not exploding, promise.", 'Dynamite / BTS'), // CHECK(song)
  S('♪ "APT." ♪ တိုက်ခန်းလား။ ငါ့တိုက်ခန်းသော့ ပျောက်နေတယ်!', "♪ 'APT.' ♪ An apartment? I've lost my apartment key!", 'APT. / ROSÉ & Bruno Mars'), // CHECK(song)
  S('♪ တိုက်တားနစ် သီချင်း… ♪ လှေဦးမှာ လက်ဆန့်ချင်တယ်။ လှေမရှိလို့ ပြေးမယ်!', "♪ The Titanic song… ♪ I'd stand on the bow with my arms out. No boat, so I run!", 'My Heart Will Go On / Celine Dion'), // CHECK(song)
  S('♪ "Let It Go"… ♪ စာရွက်တွေ၊ မင်းတို့ကို ပြောတာ မဟုတ်ဘူး! ပြန်လာခဲ့!', "♪ 'Let It Go'… ♪ Not you, papers! Come back!", 'Let It Go / Frozen'), // CHECK(song)
  S('♪ "Baby Shark"… ဟမ်း ဟမ်း ♪ နားထဲ စွဲသွားပြီ! ကယ်ကြပါ!', "♪ 'Baby Shark'… hm hm ♪ Stuck in my head! Help!", 'Baby Shark / Pinkfong'), // CHECK(song)
  S('♪ ဟေး… ဟေး… ♪ လေးဖြူလို အော်ဆိုမယ်! …အသံ ကွဲသွားပြီ။', '♪ Hey… hey… ♪ Rock out like Lay Phyu! …Voice cracked.', 'a Lay Phyu rock song / Lay Phyu & Iron Cross'), // CHECK(song)
  S('♪ ဟမ်း ဟမ်း ♪ စိုင်းစိုင်းလို ကရင်း ဆိုမယ်။ ကချိန် ရှိရင်ပေါ့။', '♪ Hm hm ♪ Sing and dance like Sai Sai. If I had time to dance.', 'a Sai Sai Kham Leng hit / Sai Sai Kham Leng'), // CHECK(song)
  S('♪ "ဘတ်စ်ကား လွတ်ပြီ…" ♪ နီနီခင်ဇော် သီချင်း။ မူရင်းက ဒီလို မဟုတ်ဘူး။', "♪ 'I've missed the bus…' ♪ A Ni Ni Khin Zaw song. Pretty sure those aren't the real words.", 'a Ni Ni Khin Zaw love song / Ni Ni Khin Zaw'), // CHECK(song)
  S('♪ အာဇာနည်လို အသံနိမ့်နိမ့်… ♪ မရဘူး။ ပြေးနေလို့ အသံ မြင့်နေတယ်။', '♪ Deep and smooth like R Zarni… ♪ No good. Running keeps my voice squeaky.', 'an R Zarni ballad / R Zarni'), // CHECK(song)
  S('♪ ဘော့ဘီဆော့ဆာလို ♪ ဆန်၊ ဆီ၊ ဆား၊ ငါ နောက်ကျ… ဒါ ငါ့ ရက်ပ်!', "♪ Rapping like Bobby Soxer… ♪ Rice, oil, salt, I'm late: that's my rap!", 'a Bobby Soxer track / Bobby Soxer'), // CHECK(song)
  S('♪ ထူးအိမ်သင် သီချင်းဟောင်း ♪ အဖေ့အကြိုက်။ စာသား မေ့လို့ "လ လ" ပဲ!', "♪ An old Htoo Ein Thin classic… ♪ Dad's favourite. Can't remember the words, so: 'la la'!", 'a Htoo Ein Thin classic / Htoo Ein Thin'), // CHECK(song)
  S('♪ "Someone Like You" ♪ ငါ့လို ပြေးတဲ့သူ နောက်တစ်ယောက် မရှိဘူး!', "♪ 'Someone Like You' ♪ Nobody else runs like me, though!", 'Someone Like You / Adele'), // CHECK(song)
  S('♪ "Uptown Funk" ♪ ငါ့ဟာက "မြို့ထဲ ပြေး" ဗားရှင်း!', "♪ 'Uptown Funk' ♪ Mine's the 'Downtown Run' version!", 'Uptown Funk / Mark Ronson ft. Bruno Mars'), // CHECK(song)
  S('♪ ဝက်စ်လိုက်ဖ်လို ထိုင်ခုံပေါ်က ထရပ်… ♪ ငါ့မှာ ထိုင်ခုံ မရှိဘူး။ ထရပ်ပြီးသား!', '♪ Westlife-style, rising off the stool… ♪ I have no stool. Already up and running!', 'My Love / Westlife'), // CHECK(song)
  S('♪ မွေးနေ့… ♪ ဘယ်သူ့မွေးနေ့လဲ မသိဘူး။ တစ်ယောက်ယောက်တော့ မွေးနေ့ ဖြစ်မှာပဲ!', "♪ Happy birth— ♪ Whose birthday? No idea. Bound to be somebody's!", 'Happy Birthday (traditional)'), // CHECK(song)
  S('♪ ဟမ်း ဟမ်း ♪ ရေအိုင်ထဲ ခုန်ကမယ်… (ချော်) …ကပြီးပြီ။', "♪ Hm hm ♪ Puddle dance time… (slips) …Dance over.", "Singin' in the Rain / Gene Kelly", RAIN), // CHECK(song)
  // his own jingles (original, no song to check)
  S('♪ ပြေး ပြေး ဟိန်းထက်၊ ပြေး ပြေး ဟိန်းထက်၊ ဘယ်ကိုလဲ မသိ ♪', '♪ Run, run, Hein Htet, run, run, Hein Htet, where to? Nobody knows ♪'),
  S('♪ ပေါ့ဆိမ့် တစ်ခွက်၊ ကော်ဖီ ချိုချို၊ နာရီက တစ်တောက် တစ်တောက် ♪', '♪ Light-sweet tea, coffee nice and sweet, my watch goes tick, tick, tick ♪'),
  S('♪ မြန်မြန်လေး၊ မြန်မြန်လေး၊ မီးမပျက်ခင် အိမ်ပြန် ♪ ငါ့ မီးပျက်သီချင်း။', '♪ Hurry, hurry, home before the power goes ♪ My power-cut song.'),
  S('♪ ဒီနေ့ ဆန်ဈေး၊ မနက်ဖြန် ဆန်ဈေး၊ ငါ့ခြေထောက်ကတော့ အလကား ♪', "♪ Rice price today, rice price tomorrow, my legs at least are free ♪"),
];

// =================================================================================================================
// MENTIONS (owner, 2026-11-14): ordinary townsfolk talking ABOUT Ko Hein Htet, even when he is not on screen. Gossip
// and warm running jokes, each a callback to his own barks and meets in that town. Never mean, never a direction or
// a hint. Town-chatter format (js/story/chatter/index.js): see SHAPE at the top for how `when` and `who` map.
// =================================================================================================================
// DRAFT(my)
const mt = (my, en, x) => ({ my, en, ...(x || {}) });
const pr = (id, rows, when) => ({ id, who: ['*', '*'], lines: rows.map(([who, my, en]) => ({ who, my, en })), ...(when ? { when } : {}) });
const mentions = {
  home: {
    lines: [
      mt('ကိုဟိန်းထက် ရေပန်းထဲ ရှောင်ဝင်သွားပြန်ပြီ။ တမင်လုပ်တာတဲ့။', 'Ko Hein Htet dodged into the fountain again. On purpose, he says.'),
      mt('စာပို့ အစ်မက မပြေးဘဲနဲ့ ကိုဟိန်းထက်ကို ဒီနေ့လည်း နိုင်သွားတယ်။', 'The postwoman beat Ko Hein Htet again today. Without running.'),
      mt('ကိုဟိန်းထက် အင်္ကျီမှာ "ဆိုင်" တဲ့။ ဆေးစို ကပ်သွားတာ။', "Ko Hein Htet's got 'SHOP' on his jacket. Wet paint."),
      mt('စာရေးခန်းနား ရောက်ရင် ကိုဟိန်းထက် ခြေဖျားထောက် လျှောက်တယ်။ ချစ်စရာ။', 'Ko Hein Htet tiptoes past the Writing Room. Sweet of him.'),
      mt('လေရဟတ်တွေ ကိုဟိန်းထက်ထက် မြန်တယ်။ သူ မနာလိုဘူးတဲ့။ (ရယ်)', "The windmills beat Ko Hein Htet. He's not jealous, he says. (laughs)", { job: 'kid' }),
      mt('ကိုဟိန်းထက် ဒီည နာရီမီးလေး ယူလာမယ်တဲ့။ အသေးဆုံး၊ အမြန်ဆုံး။', "Ko Hein Htet's bringing his little watch light tonight. Smallest and fastest.", { when: { days: [15] } }),
    ],
    pairs: [
      pr('mn-hm-early', [
        [0, 'ကိုဟိန်းထက် တစ်သက်လုံး ဘာကို နောက်ကျနေတာလဲ။', 'What has Ko Hein Htet been late for, all his life?'],
        [1, 'စောစော ရောက်ဖို့ကို နောက်ကျနေတာတဲ့။', 'For being early, he says.'],
        [0, 'အဲဒါ ဖြစ်နိုင်လို့လား။', 'Is that even possible?'],
        [1, 'သူ့အတွက်တော့ ဖြစ်တယ်။ (ရယ်)', 'For him, yes. (laughs)'],
      ]),
    ],
  },
  exercise: {
    lines: [
      mt('ကိုဟိန်းထက် ခြင်းလုံးကို ခေါင်းနဲ့ ခံပြီး တမင်လုပ်တာ ဆိုပြန်ပြီ။', 'Ko Hein Htet headed the chinlone and called it on purpose. Again.', { job: 'kid' }),
      mt('ကလေးတွေက ကိုဟိန်းထက်ကို "အနီအနီ" လို့ ခေါ်တယ်။ သူ ကြိုက်တယ်။', "The kids call Ko Hein Htet 'Red-Red'. He loves it."),
      mt('ကိုဟိန်းထက် ခေါင်းပေါ် လုံချည် ပါသွားပြန်ပြီ။ အဝတ်တန်း အောက်က ပြေးလို့။', 'Ko Hein Htet ran under the washing line. Longyi on his head again.', { job: 'aunty' }),
      mt('ကိုဟိန်းထက်ကို ခြောက်ခုနစ်လီ မေးရင် "လေးဆယ့်…" ထိပဲ ရောက်တယ်။', "Ask Ko Hein Htet six times seven and he only gets to 'forty…'", { job: 'pupil' }),
      mt('ဖိနပ်ကြိုး ချည်ရင် ပိုမြန်တာ ကိုဟိန်းထက် သိသွားပြီ။ မနက်ဖြန် မေ့မှာ။', "Ko Hein Htet's learnt he's faster with his laces tied. He'll forget by tomorrow.", { job: 'uncle' }),
      mt('မုန့်ဆိုင်က ကိုဟိန်းထက် လာတာ မြင်တာနဲ့ ကြိုထုပ်ထားတယ်။', 'The snack shop wraps Ko Hein Htet\'s order the moment they see him coming.'),
      mt('ကိုဟိန်းထက် ပြဇာတ်မှာ "ဖြတ်ပြေးသွားတဲ့လူ" အခန်း ရချင်တယ်တဲ့။', "Ko Hein Htet wants a part in the play: 'Man running past'.", { job: 'teen' }),
    ],
    pairs: [
      pr('mn-ex-pot', [
        [0, 'ကိုဟိန်းထက် အိုး တစ်လုံး အမြန် မှာသွားတယ်။', 'Ko Hein Htet ordered a pot. A quick one.'],
        [1, 'ရွှံ့က "အမြန်" ဆိုတာ မသိဘူးလေ။', "Clay doesn't know 'quick'."],
        [0, 'သူ မြို့ပတ် သုံးဆယ်ခါ ပြေးပြီးရင် ရပြီပေါ့။', "It'll be ready after his thirty laps of town."],
        [1, '(ရယ်) သူ့အတွက် ကောင်းတဲ့ အစီအစဉ်ပဲ။', '(laughs) A good plan, for him.'],
      ]),
    ],
  },
  envelope: {
    lines: [
      mt('ဆိတ်လေးက ကိုဟိန်းထက်ရဲ့ လုပ်စရာစာရင်းကို စားလိုက်တယ်။ အကုန် ပြီးသွားပြီတဲ့။', "The goat ate Ko Hein Htet's to-do list. So it's all done, apparently."),
      mt('ငါ့ဘီးက ကိုဟိန်းထက်ကို ကျော်သွားတယ်! တောင်ဆင်းဆို ဘီး အမြဲနိုင်တယ်။', 'My tyre overtook Ko Hein Htet! Downhill, the tyre always wins.', { job: 'kid' }),
      mt('ကိုဟိန်းထက် ဖိနပ်မှာ ဘီးတပ်ချင်တယ်တဲ့။ ဘရိတ် အရင်တပ်ရမယ်။', 'Ko Hein Htet wants wheels on his shoes. Brakes first, I told him.', { job: 'uncle' }),
      mt('ကိုဟိန်းထက် ကြက်ဥ သုံးလုံး လွှဲပြတယ်။ ချက်ဖို့ ဝယ်တာနော်။', 'Ko Hein Htet juggled my three eggs. They were for cooking!', { job: 'aunty' }),
      mt('ကြက်တွေက ကိုဟိန်းထက်ကို လေးစားလို့ လမ်းဖယ်ပေးတာတဲ့။ ကြက်တွေကို မေးကြည့်ချင်တယ်။', 'He thinks the hens clear the road out of respect. I\'d like to ask the hens.'),
    ],
    pairs: [],
  },
  market: {
    lines: [
      mt('ဆန်ဈေး တက်တာ ကိုဟိန်းထက် ပြေးတာထက် မြန်တယ်တဲ့။ မှန်တယ်။', "Ko Hein Htet says rice prices climb faster than he runs. He's right.", { job: 'aunty' }),
      mt('ကိုဟိန်းထက် တံဆိပ်ခေါင်း ဝယ်ပြီး စာ ယူမလာဘူး။ ဒီအပတ် နှစ်ခါရှိပြီ။', 'Ko Hein Htet bought a stamp and forgot the letter. Twice this week.'),
      mt('ကိုဟိန်းထက် နဖူးမှာ ထုဖို့ "အမြန်" တံဆိပ်တုံး ထွင်းခိုင်းတယ်။', "Ko Hein Htet wants an 'URGENT' stamp carved. For his forehead."),
      mt('ကိုဟိန်းထက် အကြော် ယူပြေးပြီး ပိုက်ဆံပေးဖို့ ပြန်ပြေးလာတယ်။ ရိုးသားလိုက်တာ။', 'Ko Hein Htet ran off with a fritter, then ran back to pay. So honest.', { job: 'vendor' }),
      mt('ကိုဟိန်းထက် လေးဖြူ သီချင်း ဟမ်းတော့ ဆိုင်က ရေနွေးအိုးပါ လိုက်ဆူတယ်။', 'Ko Hein Htet hummed Lay Phyu and the shop kettle joined in.', { job: 'porter' }), // CHECK(song): artist named only
      mt('ကိုဟိန်းထက် စွန်ကြိုးထဲ ငြိသွားပြန်ပြီ။ ငြိမ်နေရတာ သူ့ အခက်ဆုံး ဘာသာတဲ့။', 'Ko Hein Htet got tangled in a kite string again. Holding still is his hardest subject.', { job: 'teen' }),
      mt('လက်ဖက်ရည်ဆိုင် ဦးလေးက ကိုဟိန်းထက် ထိုင်ခုံ ကြောက်တယ်တဲ့။', "The tea-shop uncle says Ko Hein Htet's scared of chairs."),
      mt('ကိုဟိန်းထက် "တစ်လုတ်ပဲ" ဆိုပြီး သုံးပွဲ စားသွားတယ်။', "Ko Hein Htet said 'just one bite'. He had three helpings.", { job: 'aunty' }),
      mt('ကိုဟိန်းထက် မမာရာ အကြောင်း မေးပြီး နားရွက်လေး နီသွားတယ်။', 'Ko Hein Htet asked after Ma Maya and his ears went pink.'),
    ],
    pairs: [
      pr('mn-mk-haggle', [
        [0, 'ကိုဟိန်းထက် ဈေးဆစ်တာ ပြောင်းပြန်တဲ့။', 'Ko Hein Htet haggles backwards, I hear.'],
        [1, 'ဟုတ်တယ်။ ဆစ်လေ ဈေးတက်လေပဲ။', 'He does. The more he haggles, the more he pays.'],
        [0, 'ဒါဆို ငါ့ဆိုင်ကို လွှတ်လိုက်။', 'Then send him to my stall.'],
        [1, 'မင်း ယူရက်မှာ မဟုတ်ပါဘူး။', "You'd never have the heart to take it."],
      ]),
      pr('mn-mk-jacket', [
        [0, 'ကိုဟိန်းထက် ဒီနေ့ အင်္ကျီကို သုံးခါ ဆွဲဆန့်တယ်။', 'Ko Hein Htet straightened his jacket three times today.'],
        [1, 'ဘာဖြစ်လို့လဲ။', 'Whatever for?'],
        [0, 'စာရေးဆရာမ ဖြတ်သွားလို့။', 'The writer walked past.'],
        [1, 'အော်… ဘာမှ မပြောနဲ့နော်။ (ပြုံး)', "Ah… don't say a word. (smiles)"],
      ]),
    ],
  },
  wharf: {
    lines: [
      mt('ကိုဟိန်းထက် ပိုက်ကွန်ထဲ ဝင်သွားတယ်။ ဒီနေ့ အကြီးဆုံး ငါးပဲ။', 'Ko Hein Htet ran into the net. Biggest catch of the day.', { job: 'fisher' }),
      mt('လှေသမားတွေက ကိုဟိန်းထက်ကို "ကုန်းလှေ" လို့ ခေါ်ကြတယ်။', "The boatmen call Ko Hein Htet 'the land boat'."),
      mt('ကိုဟိန်းထက် ကူးတို့ မီအောင် ပြေးတယ်။ စီးဖို့တောင် မဟုတ်ဘူး။', "Ko Hein Htet ran to catch the ferry. He wasn't even taking it."),
      mt('ကိုဟိန်းထက် အထုပ်ကို ချိန်ခိုင်းတယ်။ ဘာမှ မပါဘူး။ "ပေါ့လိုက်တာ" တဲ့။', "Ko Hein Htet had his parcel weighed. Empty. 'So light!' he said."),
      mt('ကိုဟိန်းထက် ဖိနပ်ကြိုးကို လှေကြိုးထုံး ချည်ပေးလိုက်တယ်။ ဒီတစ်ခါ မပြေဘူး။', "I tied Ko Hein Htet's laces in a boat knot. They're holding this time.", { job: 'kid' }),
      mt('ကိုဟိန်းထက် နေပူထဲ ပြေးလို့ ငါးခြောက်နဲ့ တူလာပြီ။ ရေ တိုက်လိုက်တယ်။', "Ko Hein Htet's run so long in the sun he's nearly dried fish. I gave him water.", { job: 'fisher' }),
      mt('ဖောင်က ကောင်လေးနဲ့ ကိုဟိန်းထက် ဘယ်သူ နှုတ်ဆက်တာ များလဲ ပြိုင်နေကြတယ်။', 'The raft lad and Ko Hein Htet are racing to greet the most people.', { when: { flag: 'd6.ch8Done' } }),
      mt('မိုးထဲမှာ ကိုဟိန်းထက် ဆိပ်ကမ်းပေါ် ဘေးတိုက် ပြေးနေတယ်။', 'In the rain Ko Hein Htet runs the quay sideways.', { when: { weather: 'rain' } }),
    ],
    pairs: [
      pr('mn-wh-somewhere', [
        [0, 'ကိုဟိန်းထက် လှေ စီးချင်တယ်တဲ့။ ဘယ်ကိုလဲ မေးတော့…', 'Ko Hein Htet wanted a boat ride. I asked where to…'],
        [1, '"တစ်နေရာရာ" တဲ့ မဟုတ်လား။', '"Somewhere", right?'],
        [0, 'မင်းကိုလည်း ပြောဖူးလား။', 'Told you that too?'],
        [1, 'လူတိုင်းကို ပြောတာ။ (ရယ်)', 'He tells everyone. (laughs)'],
      ]),
      pr('mn-wh-redfish', [
        [0, 'ကိုဟိန်းထက် သူ့ကိုယ်သူ ငါးနီ တဲ့။', 'Ko Hein Htet calls himself a red fish now.'],
        [1, 'ငါးနီဆို ဈေးကောင်းတယ်လေ။', 'Red fish fetch a good price.'],
        [0, 'ငြိမ်ငြိမ် မနေတော့ ဘယ်သူမှ ဝယ်လို့ မရဘူး။', "Nobody can buy him. He won't keep still."],
        [1, '(ရယ်) ဒါဆို ငါတို့ ဆိပ်ကမ်းမှာပဲ ထားမယ်။', "(laughs) Then he's ours. We'll keep him."],
      ]),
    ],
  },
  junction: {
    lines: [
      mt('ကိုဟိန်းထက် မဖတ်ရသေးဘဲ "သတင်းကြီး" လို့ အော်သွားတယ်။', "Ko Hein Htet shouted 'Big news!' before he'd read it."),
      mt('ကိုဟိန်းထက် စာ ပို့ဖို့ အဝေးကြီး ပြေးလာတယ်။ လိပ်စာက သူ့အိမ်။', 'Ko Hein Htet ran all this way to post a letter. To his own house.'),
      mt('ကိုဟိန်းထက် "ဒီလ အမြန်ဆုံးလူ" ရိုက်နှိပ်ခိုင်းတယ်။ "အလောဆုံးလူ" ပဲ ရသွားတယ်။', "Ko Hein Htet wanted 'Fastest Man of the Month' printed. He got 'Most Rushed'.", { job: 'worker' }),
      mt('အဘွားကို လမ်းကူး ကူညီရင်း ကိုဟိန်းထက် ဖြည်းဖြည်း လျှောက်တတ်သွားတယ်။', 'Helping Grandma across, Ko Hein Htet learnt to walk slowly.', { age: 'elder' }),
      mt('ကိုဟိန်းထက် "Despacito" ကို ပြေးရင်း ဆိုတယ်။ ပျမ်းမျှဆို မှန်တယ်တဲ့။', "Ko Hein Htet sings 'Despacito' at a run. 'On average, perfect,' he says.", { job: 'teen' }), // CHECK(song): title only
      mt('သတင်းစာထဲ ကိုဟိန်းထက် ပါရင် "လူတစ်ယောက် ဖြတ်ပြေးသွား" တဲ့။', "If Ko Hein Htet made the paper, the headline would be 'Man Runs Past'."),
      mt('ကိုဟိန်းထက် ခြောက်လား ကိုးလား သိအောင် ပတ်ပြေးပြီး မူးသွားတယ်။', 'Ko Hein Htet ran round to tell a six from a nine, and got dizzy.', { job: 'pupil', when: { flag: 'd8.ch13Done' } }),
      mt('ကိုဟိန်းထက် "ဘယ်သူပြောလဲ" လို့ မေးတတ်လာပြီ။ ကောင်းတယ်။', "Ko Hein Htet has started asking 'who said so?' Good for him.", { when: { flag: 'd8.ch12Done' } }),
      mt('တံတားမီး ထွန်းတော့ ကိုဟိန်းထက် ပထမ ဖြတ်ချင်တာ ဒုတိယ ဖြစ်သွားတယ်။', 'When the bridge lamps lit, Ko Hein Htet meant to cross first. He came second.', { when: { flag: 'd7.bridge' } }),
    ],
    pairs: [
      pr('mn-jn-news', [
        [0, 'ကိုဟိန်းထက် ဒီနေ့ သတင်း အတိုချုံး မေးတယ်။', "Ko Hein Htet asked me for today's news, short version."],
        [1, 'ဘာပြောလိုက်လဲ။', 'What did you tell him?'],
        [0, 'သူ့အကြောင်း သတင်းပဲ ပြောလိုက်တယ်။', 'The news about him.'],
        [1, 'ယုံရောလား။', 'Did he believe it?'],
        [0, 'ကိုယ်တိုင် စစ်မယ်တဲ့။ တိုးတက်လာပြီ။', "He said he'd check for himself. He's improving."],
      ], { flag: 'd8.ch12Done' }),
      pr('mn-jn-sorry', [
        [0, 'ကိုဟိန်းထက် "ကြိုတင် တောင်းပန်ပါတယ်" စာ လူတိုင်းကို ပို့ချင်တယ်တဲ့။', "Ko Hein Htet wants to send everyone a 'Sorry in advance' letter."],
        [1, 'ဘာလို့တုန်း။', 'Why ever?'],
        [0, 'နောက်ကျမှာ သေချာလို့တဲ့။ အချိန် ချွေတာတာ။', "He's sure to be late, he says. Saves time."],
        [1, '(ရယ်) ငါ့ဆီ တစ်စောင် ပို့ခိုင်းလိုက်။ သိမ်းထားမယ်။', "(laughs) Tell him to send me one. I'll keep it."],
      ]),
    ],
  },
  hearth: {
    lines: [
      mt('မုန့်နံ့ ရရင် ကိုဟိန်းထက် ရပ်သွားတယ်။ သူ့ ဘရိတ်က မုန့်ပဲတဲ့။', "Ko Hein Htet stops when he smells bread. Bread's his only brake.", { job: 'baker' }),
      mt('ကိုဟိန်းထက် ပေါင်မုန့်ပူ ကိုက်ပြီး "ပူတယ်! ပူတယ်!" တဲ့။ ပြောသားပဲ။', "Ko Hein Htet bit the hot bread. 'Hot! Hot!' I did tell him.", { job: 'baker' }),
      mt('ကိုဟိန်းထက် ခေါက်ဆွဲ ငါးမိနစ် ထိုင်စားသွားတယ်။ နာရီတောင် မေ့သွားတယ်။', 'Ko Hein Htet sat five whole minutes over noodles. Forgot his watch, even.', { job: 'vendor' }),
      mt('ကိုဟိန်းထက် ခုံတန်းပေါ် နှစ်စက္ကန့် ထိုင်သွားတယ်။ ဘဝရဲ့ အကောင်းဆုံးတဲ့။', 'Ko Hein Htet sat on the bench for two seconds. Best of his life, he says.', { age: 'elder' }),
      mt('ညကျောင်းမှာ ကိုဟိန်းထက်ကို ဆရာ ထင်သွားတယ်။ အင်္ကျီနီကြောင့်။', 'At evening class I took Ko Hein Htet for Teacher. It\'s the red suit.', { job: 'kid' }),
      mt('ကိုဟိန်းထက် "နောက်ကျနည်း အဆင့်မြင့်" ဘာသာ သင်ချင်တယ်တဲ့။', "Ko Hein Htet wants to teach 'Running Late, Advanced'.", { job: 'teen' }),
      mt('မုန့်တူးတုန်း ကိုဟိန်းထက် ယပ်ခတ်ပေးတယ်။ မီးဖိုရော စိတ်ရော အေးသွားတယ်။', 'When the bread burnt, Ko Hein Htet fanned us. Cooled the oven and the temper.', { job: 'baker' }),
      mt('အထည်က နောက်လမှ ပြီးမယ် ကြားတော့ ကိုဟိန်းထက် မူးလဲမလို ဖြစ်သွားတယ်။', "Ko Hein Htet nearly fainted when he heard the cloth won't be done till next month.", { job: 'weaver' }),
      mt('ကိုဟိန်းထက် စာကပ်နံရံမှာ သူ ဖြတ်သွားကြောင်း ကပ်ချင်တယ်တဲ့။', 'Ko Hein Htet wants a note on the wall saying he passed by.', { when: { from: 12 } }),
    ],
    pairs: [
      pr('mn-hr-jacket', [
        [0, 'ကိုဟိန်းထက် မီးဖိုနား ဖြတ်တိုင်း ချွေးရွှဲတယ်။', "Every time Ko Hein Htet runs past the oven, he's drenched."],
        [1, 'အင်္ကျီနီကြီး ချွတ်လိုက်ပါလား။', "Why doesn't he take off that red jacket?"],
        [0, 'မချွတ်ဘူးတဲ့။ အဲဒါ သူ့ လက်မှတ်တဲ့။', "He won't. Says it's his signature."],
        [1, '(ရယ်) ဟုတ်တော့ ဟုတ်တယ်။ အနီမြင်ရင် သူမှန်း သိတာပဲ။', "(laughs) Fair. See red, you know it's him."],
      ]),
      pr('mn-hr-holes', [
        [0, 'ကိုဟိန်းထက် ယက်ကန်း ရက်ကြည့်ချင်တယ်တဲ့။', 'Ko Hein Htet wants to try the loom.'],
        [1, 'အပေါက်တွေ ထွက်မှာပေါ့။', "It'll be all holes."],
        [0, 'ခေတ်မီတယ်တဲ့။', 'He says holes are in fashion.'],
        [1, '(ရယ်) တစ်ထည် ရက်ပေးလိုက်ရမလား။', '(laughs) Shall we weave him one?'],
      ]),
    ],
  },
  garden: {
    lines: [
      mt('ပျားတွေက ကိုဟိန်းထက်ကို ပန်းနီကြီး ထင်ပြီး လိုက်ကြတယ်။', "The bees chase Ko Hein Htet. They think he's a big red flower.", { job: 'gardener' }),
      mt('ကိုဟိန်းထက် ရေပုံးနဲ့ ပြေးတယ်။ လမ်းက ရေရတယ်။ ပန်းပင်က မရဘူး။', 'Ko Hein Htet ran with the watering can. The path got watered. The plants didn\'t.', { job: 'gardener' }),
      mt('ကိုဟိန်းထက် ဖားနဲ့ ခုန်ပြိုင်ပြီး ရှုံးတယ်။ ဖားကို ဂုဏ်ပြုသွားတယ်။', 'Ko Hein Htet lost a jumping race to a frog. He congratulated the frog.', { job: 'kid' }),
      mt('ကိုဟိန်းထက် ဘူးသီးနဲ့ ခေါင်းချင်း ဆောင့်မိတယ်။ ဘူးသီး နိုင်တယ်။', 'Ko Hein Htet bumped heads with a gourd. The gourd won.'),
      mt('ကိုဟိန်းထက် အစေ့ကို တစ်ညလုံး စောင့်ကြည့်တယ်။ အပင်တွေ နောက်ကျတယ်တဲ့။', 'Ko Hein Htet watched a seed all night. Plants are so late, he says.'),
      mt('ကိုဟိန်းထက် မီးဖို ဖွင့်ခိုင်းတယ်။ နာရီ ကြည့်နေသရွေ့ မရဘူးလို့ ပြောလိုက်တယ်။', "Ko Hein Htet wanted the kiln opened. Not while you stare at that watch, I said.", { job: 'potter' }),
    ],
    pairs: [
      pr('mn-gd-still', [
        [0, 'ကိုဟိန်းထက် ငြိမ်ငြိမ်လေး ရပ်နေတာ မြင်လိုက်တယ်။', 'I saw Ko Hein Htet standing perfectly still.'],
        [1, 'မဖြစ်နိုင်တာ။', 'Impossible.'],
        [0, 'ပျားတွေ ထွက်သွားအောင် စောင့်နေတာတဲ့။', 'He was waiting for the bees to leave.'],
        [1, 'ဒါဆို ပျားတွေကို ကျေးဇူးတင်ရမယ်။', 'Then we owe those bees a thank-you.'],
      ]),
    ],
  },
  blank: {
    lines: [
      mt('ဒီမှာ ခြေရာ တစ်ကြောင်းပဲ ရှိတယ်။ ကိုဟိန်းထက် စာရေးသွားသလိုပဲ။', 'Just one line of footprints out here. Like Ko Hein Htet wrote it.'),
      mt('ကိုဟိန်းထက်ကို မျဉ်းနီ တစ်ကြောင်းနဲ့ ပြေးနေပုံ ဆွဲလိုက်တယ်။ တူတယ်တဲ့။', 'I drew Ko Hein Htet: one red line, running. Spot on, he said.', { job: 'kid' }),
      mt('ကိုဟိန်းထက် ဒီမနက်ကို ဖျက်ချင်တယ်တဲ့။ ဇာတ်လမ်းကောင်းမို့ မဖျက်ခိုင်းဘူး။', "Ko Hein Htet wanted to rub out his morning. I said keep it, it's a good story."),
      mt('ကိုဟိန်းထက် အိပ်မက်ထဲမှာတောင် ပြေးတယ်တဲ့။ ရေ တစ်ခွက် ပေးလိုက်တယ်။', 'Ko Hein Htet runs even in his dreams. I gave him a cup of water, just in case.', { job: 'keeper' }),
    ],
    pairs: [],
  },
};

export default { solo, towns, maya: { walkup, carBlock, carDash, bye }, sing, mentions };
