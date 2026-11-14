// Reality Check: everyday small talk between two townspeople.
// Not lessons, not hints: just life. Maya overhears these as she walks by.
// All Burmese is a DRAFT for Maya to proofread.
//
// Shape (after build): SMALLTALK[group] = [ { lines:[{who:0|1, my, en}, ...], time?, rain?, jobs? }, ... ]
// Groups: general (fits anywhere) + home, exercise, envelope, market, wharf,
//         junction, hearth, garden, blank.
// Tags:   time: 'morning'|'noon'|'evening'|'night'   rain: true (rainy-day only)
//         jobs: speaker roles that suit it (vendor, elder, kid, worker, fisher,
//               baker, teacher, potter, weaver)

// c([[my, en], [my, en], ...], {time, rain, jobs}) -> exchange; speakers alternate 0,1,0,1...
const c = (pairs, opts = {}) => ({
  lines: pairs.map(([my, en], i) => ({ who: i % 2, my, en })),
  ...opts,
});

export const SMALLTALK = {
  general: [
    c([
      ['ဒီနေ့ ပူလိုက်တာဟာ။', 'So hot today.'],
      ['ကြက်ဥ လမ်းပေါ်ချရင် ကျက်မယ်။', "Crack an egg on the road and it'd cook."],
      ['ကြက်ဥက ဈေးကြီးတယ်၊ မချနဲ့။', "Eggs are pricey. Don't you dare."],
    ], { time: 'noon' }),
    c([
      ['ထီး ယူလာလား။', 'Did you bring an umbrella?'],
      ['ယူလာတယ်။ အိမ်မှာ ကျန်ခဲ့တယ်။', 'I did. It stayed at home.'],
    ], { rain: true }),
    c([
      ['ဆီဈေး ထပ်တက်ပြန်ပြီ။', 'Cooking oil went up again.'],
      ['ငါ့လစာကတော့ မတက်ဘူးနော်။', "My pay didn't, though."],
      ['လစာက သစ္စာရှိတယ်၊ တစ်နေရာထဲမှာပဲ။', "Your pay is loyal. It never moves."],
    ]),
    c([
      ['ဖုန်းလိုင်း မမိဘူးဟ။', 'No signal again.'],
      ['ခုံပေါ်တက်ပြီး လက်မြှောက်ကြည့်။', 'Stand on the bench and hold it up.'],
      ['မိသွားပြီ! ...ပြန်ပြတ်သွားပြီ။', "Got it! ...and it's gone."],
    ]),
    c([
      ['ဝမ်းကွဲ မင်္ဂလာဆောင် လာမှာလား။', "Coming to my cousin's wedding?"],
      ['လာမယ်။ စားစရာ ဘာပါလဲ။', "Yes. What's on the menu?"],
      ['ဒံပေါက်။', 'Biryani.'],
      ['အစောကြီး ရောက်မယ်။', "I'll be there early."],
    ]),
    c([
      ['ငါ့ကြက်မ မတွေ့မိဘူးလား။', 'Have you seen my hen?'],
      ['အဖြူလား၊ အညိုလား။', 'White or brown?'],
      ['အညို။ စိတ်တိုတတ်တယ်။', 'Brown. Short temper.'],
      ['အော်… မနေ့က ငါ့ခြေထောက် ဆိတ်သွားတဲ့ကောင်။', 'Ah. The one that pecked my foot yesterday.'],
    ]),
    c([
      ['ဘေးအိမ်က ရေဒီယို ကျယ်လိုက်တာ။', "Next door's radio is so loud."],
      ['အဲ့သီချင်း ငါ အလွတ်ရနေပြီ။', 'I know that song by heart now.'],
      ['ငါလည်း။ မကြိုက်ဘဲနဲ့။', "Me too. And I don't even like it."],
    ]),
    c([
      ['ကြောင်က ငါးခြောက် ခိုးသွားပြန်ပြီ။', 'The cat stole the dried fish again.'],
      ['ဘယ်ကြောင်လဲ။', 'Which cat?'],
      ['ငါ့ကြောင်ပဲ။ ငါ ကျွေးထားတဲ့ကောင်။', 'My cat. The one I feed.'],
      ['ဆုချတယ် ထင်နေတာနေမှာ။', 'It probably thinks that was its reward.'],
    ]),
    c([
      ['မနေ့ညက ဘောလုံးပွဲ ကြည့်လား။', 'Watch the match last night?'],
      ['ကြည့်တယ်။ ဒုတိယပိုင်းမှာ မီးပျက်သွားတယ်။', 'Yes. Then the power cut out at half-time.'],
      ['ဘယ်သူနိုင်လဲ။', 'Who won?'],
      ['မသိဘူး။ မီးပျက်တာ နိုင်တယ်။', 'No idea. The blackout won.'],
    ], { time: 'morning' }),
    c([
      ['ဘတ်စ်ကား ဘယ်တော့ လာမလဲ။', "When's the bus coming?"],
      ['ငါ့အဘိုး ငယ်ငယ်ကတည်းက စောင့်နေတာ။', "I've been waiting since Grandpa was young."],
    ]),
    c([
      ['မွန်းလွဲဆို မျက်လုံးက လေးလာတယ်။', 'Afternoons make my eyes heavy.'],
      ['ခဏလေး မှေးလိုက်ပါလား။', 'Just close them for a bit.'],
      ['ခဏလေးဆိုပြီး ညနေရောက်သွားမှာ။', "'A bit' and I'll wake up at dusk."],
    ], { time: 'noon' }),
    c([
      ['ဇာတ်လမ်းတွဲ ဘယ်အပိုင်း ရောက်ပြီလဲ။', 'Which episode of the drama are you on?'],
      ['မင်းသမီး မှတ်ဉာဏ်ပျောက်သွားတဲ့အပိုင်း။', 'The one where she loses her memory.'],
      ['နောက်အပိုင်းမှာ ထပ်ပျောက်ဦးမှာ။', "She'll lose it again next week. Watch."],
    ], { time: 'evening' }),
    c([
      ['အိမ်စာ ပြီးပြီလား။', 'Done your homework?'],
      ['တစ်ဝက်ပြီးပြီ။ နာမည် ရေးပြီးပြီ။', 'Half done. I wrote my name.'],
    ], { jobs: ['kid'] }),
    c([
      ['စနေနေ့ ဘာလုပ်မလဲ။', 'What are you doing Saturday?'],
      ['အိပ်မယ်။', 'Sleeping.'],
      ['တနင်္ဂနွေရော။', 'And Sunday?'],
      ['ဆက်အိပ်မယ်။', 'More sleeping.'],
    ]),
    c([
      ['မုန့်ဟင်းခါး မနက်တိုင်း စားချင်တယ်။', 'I could eat mohinga every morning.'],
      ['နင် မနက်တိုင်း စားနေတာပဲလေ။', 'You already do. Every morning.'],
    ], { time: 'morning' }),
    c([
      ['လက်ဖက်သုပ် နည်းနည်း စပ်တယ်နော်။', "The tea-leaf salad's a bit spicy."],
      ['ငရုတ်သီး သုံးတောင့်ပဲ ထည့်တာ။', 'Only three chillies.'],
      ['သုံးတောင့်ဆို ငါ့အတွက် မီးပဲ။', 'Three is a bonfire for me.'],
    ]),
    c([
      ['ရှမ်းခေါက်ဆွဲ အခြောက်လား၊ အရည်လား။', 'Shan noodles: dry or soup?'],
      ['နှစ်ပွဲလုံး မှာမယ်။', "I'll order both."],
      ['ဒါကြောင့် နင် ပိုက်ဆံ မရှိတာ။', "That's why you're always broke."],
    ]),
    c([
      ['လမ်းပိတ်နေလို့ နောက်ကျတာ။', 'Sorry, traffic.'],
      ['နင့်အိမ်က အိမ်နှစ်လုံးပဲ ခြားတာလေ။', 'You live two houses away.'],
      ['အဲ့ကြားမှာ ကြက်တွေ လမ်းပိတ်နေတာ။', 'Chickens were blocking the way.'],
    ]),
    c([
      ['ခြင်တွေ များလိုက်တာ။', 'So many mosquitoes.'],
      ['သူတို့က နင့်ကို ချစ်လို့။', 'They love you.'],
      ['ငါကတော့ မချစ်ဘူး။', "It's not mutual."],
    ], { time: 'evening' }),
    c([
      ['ပလာတာ စားမလား။', 'Want some paratha?'],
      ['မစားတော့ဘူး၊ ဝိတ်ချနေတယ်။', "No, I'm on a diet."],
      ['ဒါဆို နင့်အပိုင်း ငါစားမယ်။', "Then I'll eat your share."],
      ['နေဦး… တစ်ချပ်ပဲ စားမယ်။', 'Wait... maybe just one.'],
    ], { time: 'morning' }),
    c([
      ['ဆံပင် ညှပ်ထားတာလား။', 'Did you get a haircut?'],
      ['ဟုတ်တယ်။ ကြည့်ကောင်းလား။', 'Yes. Does it look good?'],
      ['…ပြန်ရှည်လာမှာပါ။', "...It'll grow back."],
    ]),
    c([
      ['ဒီမနက် အေးတယ်နော်။', 'Chilly this morning.'],
      ['စောင်ထဲက မထွက်ချင်ဘူး။', "I didn't want to leave my blanket."],
      ['ထွက်လာနိုင်တာ သူရဲကောင်းပဲ။', 'Getting up was heroic.'],
    ], { time: 'morning' }),
    c([
      ['ဟိုဘက်အိမ်က မြေးလေး လမ်းလျှောက်တတ်ပြီတဲ့။', "The grandbaby across the lane is walking now."],
      ['ဟုတ်လား! မနေ့ကပဲ တွားနေတုန်း။', 'Really? Yesterday he was crawling!'],
      ['ကလေးတွေက မြန်တယ်။', 'Kids are fast.'],
    ]),
    c([
      ['ထမင်း ကျွမ်းသွားတယ်။', 'I burnt the rice.'],
      ['ကျွမ်းတဲ့အပိုင်းက အကောင်းဆုံးလေ။', 'The crispy bit is the best bit.'],
      ['အကုန်လုံး ကျွမ်းတာ။', "It's all crispy bit."],
    ]),
    c([
      ['ငါ့ဖိနပ် ဘယ်သူ စီးသွားလဲ။', 'Who walked off in my slippers?'],
      ['နင် စီးထားတာ ဘယ်သူ့ဟာလဲ။', "Whose are you wearing, then?"],
      ['…ဟုတ်သားပဲ။', '...Oh.'],
    ]),
    c([
      ['ညက ခွေးတွေ တစ်ညလုံး ဟောင်တယ်။', 'The dogs barked all night.'],
      ['လကို ဟောင်တာ။', 'At the moon.'],
      ['လက ဘာမှ မလုပ်ပါဘူး။', "The moon didn't do anything."],
    ], { time: 'morning' }),
    c([
      ['ရေခဲမုန့် စားချင်တယ်။', 'I want ice cream.'],
      ['ငါလည်း။ ပိုက်ဆံ ပါလား။', 'Me too. Got money?'],
      ['မပါဘူး။ နင်ရော။', 'No. You?'],
      ['ဒါဆို စားချင်ရုံပဲ အတူ စားချင်ကြမယ်။', "Then we'll just want it together."],
    ], { time: 'noon' }),
    c([
      ['မီးပျက်ပြန်ပြီ။', 'Power cut again.'],
      ['ဖယောင်းတိုင် ဘယ်မှာ ထားလဲ။', 'Where did we put the candles?'],
      ['အမှောင်ထဲမှာ။', 'Somewhere in the dark.'],
    ], { time: 'night' }),
    c([
      ['ကျောင်းနေဖက် ပြန်တွေ့တယ်။', 'Ran into an old school friend.'],
      ['ပြောင်းလဲသွားလား။', 'Has he changed?'],
      ['ဗိုက်က ပြောင်းသွားတယ်။ ရယ်သံက အတူတူပဲ။', "His belly has. His laugh hasn't."],
    ]),
    c([
      ['မနက်တိုင်း လမ်းလျှောက်မယ်လို့ ဆုံးဖြတ်ထားတယ်။', "I've decided to walk every morning."],
      ['ဘယ်နေ့ စမှာလဲ။', 'Starting when?'],
      ['မနက်ဖြန်က စမယ်။ အမြဲတမ်း မနက်ဖြန်ပဲ။', "Tomorrow. It's always tomorrow."],
    ]),
    c([
      ['တောက်တဲ့ အော်နေတယ်။ ရေတွက်။', "The gecko's calling. Count!"],
      ['တစ်… နှစ်… သုံး…', 'One... two... three...'],
      ['ရပ်သွားပြီ။ ဘာအဓိပ္ပာယ်လဲ။', 'It stopped. What does that mean?'],
      ['မောသွားတာ။', 'It got tired.'],
    ], { time: 'night' }),
    c([
      ['အမေ ချက်တဲ့ ချဉ်ပေါင်ဟင်း လွမ်းတယ်။', "I miss my mum's roselle-leaf curry."],
      ['ငါ့အမေလည်း ချက်တယ်၊ လာစား။', 'My mum makes it too. Come eat.'],
      ['နင့်အမေ့ဟာက ပိုချဉ်တယ်။', "Your mum's is sourer."],
      ['ချဉ်လေ ကောင်းလေပဲ။', 'Sourer is better!'],
    ]),
    c([
      ['ရွှံ့ထဲမှာ ဖိနပ် တစ်ဖက် ကျန်ခဲ့တယ်။', 'One slipper got stuck in the mud.'],
      ['ပြန်ယူခဲ့လား။', 'Did you get it back?'],
      ['ရွှံ့က ပြန်မပေးဘူး။', "The mud won't give it back."],
    ], { rain: true }),
    c([
      ['သွပ်မိုးပေါ် မိုးရွာသံ ကြားရင် အိပ်ချင်တယ်။', 'Rain on a tin roof makes me sleepy.'],
      ['နင်က ဘာကြားကြား အိပ်ချင်တာပဲ။', 'Everything makes you sleepy.'],
    ], { rain: true }),
    c([
      ['ငါ မက်ဆေ့ပို့တာ ဘာလို့ မပြန်တာလဲ။', "Why didn't you answer my message?"],
      ['ပြန်ထားပါတယ်။ စိတ်ထဲမှာ။', 'I did. In my head.'],
    ]),
    c([
      ['သရက်သီးရာသီ ရောက်ပြီ!', "Mango season's here!"],
      ['ငါ့လက်တွေ တစ်ရာသီလုံး စေးကပ်နေတော့မယ်။', 'My hands will be sticky all season.'],
    ]),
    c([
      ['ငါ့ခေါင်းမှာ ဆံပင်ဖြူ တစ်ပင် တွေ့တယ်။', 'Found a grey hair on my head.'],
      ['ဉာဏ်ပညာ ရောက်လာတာလေ။', 'Wisdom has arrived.'],
      ['ဆံပင်ပဲ ရောက်တယ်။ ဉာဏ်ပညာ နောက်ကျနေတယ်။', 'Only the hair came. Wisdom is running late.'],
    ]),
    c([
      ['ကြို့ထိုးနေတယ်။ …ဟစ်။', "I've got hiccups. ...hic."],
      ['ခေါင်းငုံ့ပြီး ရေသောက်ကြည့်။', 'Drink water with your head down.'],
      ['…ဟစ်။ နင့်နည်း မရဘူး။', "...hic. Your trick doesn't work."],
    ]),
    c([
      ['ဒီနေ့ လက်ဖက်ရည် ဘယ်နှခွက် ရှိပြီလဲ။', 'How many cups of tea today?'],
      ['သုံးခွက်။ နေ့လယ်စာ မစားရသေးဘူး။', "Three. And it's not lunch yet."],
    ], { time: 'morning' }),
    c([
      ['မနက်ဖြန် ငါ့မွေးနေ့။', "Tomorrow's my birthday."],
      ['အသက် ဘယ်လောက် ရှိပြီလဲ။', 'How old?'],
      ['အဲ့ဒါ မမေးနဲ့။ ကိတ်မုန့်ပဲ မေး။', "Don't ask that. Ask about the cake."],
    ]),
    c([
      ['မိုးလာပြီ! အဝတ်တွေ!', 'Rain! The washing!'],
      ['ငါ သိမ်းပြီးပြီ။', 'Already brought it in.'],
      ['နင်က အကောင်းဆုံး သူငယ်ချင်းပဲ။', "You're the best friend ever."],
    ], { rain: true }),
    c([
      ['ဒီနေ့ သနပ်ခါး လှလိုက်တာ။', 'Your thanaka looks lovely today.'],
      ['အမေ လိမ်းပေးတာ။ အရွက်ပုံလေးနဲ့။', 'Mum did it. With a little leaf.'],
    ], { time: 'morning' }),
  ],

  home: [
    c([
      ['အမေ ထမင်းစား ခေါ်နေပြီ။', "Mum's calling us to eat."],
      ['ငါးမိနစ်ပဲ။', 'Five minutes.'],
      ['အမေ့ ငါးမိနစ်လား၊ နင့် ငါးမိနစ်လား။', "Mum's five minutes, or yours?"],
    ], { time: 'evening', jobs: ['kid'] }),
    c([
      ['အဘိုး ကုလားထိုင်ပေါ်မှာ အိပ်ပျော်နေပြီ။', "Grandpa's asleep in his chair."],
      ['မျက်စိမှိတ်ပြီး နားထောင်နေတာတဲ့။', "He says he's listening with his eyes shut."],
      ['ဟောက်ပြီး နားထောင်တာလား။', 'Listening... while snoring?'],
    ], { time: 'noon' }),
    c([
      ['ဒီလမ်းထဲ အိမ်တိုင်းက လက်ဖက်ရည်နံ့ ထွက်နေတယ်။', 'Every house on this lane smells of tea.'],
      ['ညနေ လေးနာရီ ထိုးပြီကိုး။', "It's four o'clock, that's why."],
    ], { time: 'evening' }),
    c([
      ['ဒီအင်္ကျီ ဘယ်သူ့ဟာလဲ။', 'Whose shirt is this?'],
      ['အစ်ကို့ဟာ။ ခဏ ငှားဝတ်တာ။', "My brother's. I borrowed it."],
      ['သူ သိလား။', 'Does he know?'],
      ['အခု သိသွားပြီ။', 'He does now.'],
    ]),
    c([
      ['ထမင်းအိုး ခလုတ် နှိပ်ခဲ့လား။', 'Did you switch on the rice cooker?'],
      ['…နှိပ်ခဲ့တယ် ထင်တယ်။', '...I think so?'],
      ['"ထင်တယ်" ဆိုတာ ဗိုက်ဆာမယ့် အသံပဲ။', "'I think so' sounds like a hungry evening."],
    ], { time: 'evening' }),
    c([
      ['ညီမလေးက ငါ့ခဲတံ ယူသွားတယ်။', 'My little sister took my pencil.'],
      ['ဘောပင် ပေးလိုက်လေ။', 'Give her a pen, then.'],
      ['အဲ့ဒါလည်း ယူသွားပြီ။', 'She took that too.'],
    ], { jobs: ['kid'] }),
    c([
      ['ပန်ကာ ငါ့ဘက် လှည့်ပေး။', 'Point the fan at me.'],
      ['ငါ့ဘက်လည်း ပူတယ်။', "It's hot on my side too."],
      ['ဒါဆို ခေါင်းယမ်းခိုင်းထားမယ်။', "Then let it shake its head at both of us."],
    ], { time: 'noon' }),
    c([
      ['ဘေးအိမ်က ဟင်း ပို့ပေးတယ်။', 'Next door sent over some curry.'],
      ['ပန်းကန် ပြန်ပို့ရင် တစ်ခုခု ထည့်ပေးနော်။', 'Put something in the bowl when you send it back.'],
      ['ဒါ လမ်းထဲက ဥပဒေပဲ။', "That's the law of the lane."],
    ]),
    c([
      ['အိမ်မြှောင်လေး နံရံပေါ်မှာ ခြင်ဖမ်းနေတယ်။', 'The little house lizard is catching mosquitoes.'],
      ['သူက ငါတို့ ညစောင့်ပဲ။', "He's our night guard."],
    ], { time: 'night' }),
    c([
      ['ကလေးတွေ ပုံပြင် ပြောခိုင်းနေတယ်။', 'The kids want a story.'],
      ['ကျားနဲ့ ယုန် ပုံပြင် ပြောလိုက်။', 'Tell the tiger and rabbit one.'],
      ['ငါ ပြောတိုင်း ယုန်က ပိုလိမ္မာလာတယ်။', 'Every time I tell it, the rabbit gets smarter.'],
    ], { time: 'night' }),
  ],

  exercise: [
    c([
      ['ဆရာမ ဒီနေ့ စာမေးမှာလား။', 'Is Teacher testing us today?'],
      ['မေးမယ်ထင်တယ်။', 'Probably.'],
      ['ငါ ရုတ်တရက် ဖျားချင်လာပြီ။', 'I suddenly feel a fever coming on.'],
    ], { time: 'morning', jobs: ['kid'] }),
    c([
      ['ပေါ့ဆိမ့် တစ်ခွက်။', 'One light-and-creamy tea, please.'],
      ['နင်က အမြဲ ပေါ့ဆိမ့်ပဲ။', "You always have light-and-creamy."],
      ['ငါ့ဘဝလိုပဲ။ ပေါ့ပေါ့နဲ့ ဆိမ့်ဆိမ့်။', 'Like my life. Light and creamy.'],
    ]),
    c([
      ['ဒီအိုး ဘာလို့ စောင်းနေတာလဲ။', 'Why is this pot leaning?'],
      ['အနုပညာ။', "It's art."],
      ['လက်ချော်သွားတာ မဟုတ်လား။', "Didn't your hand just slip?"],
      ['အနုပညာ လို့ ပြောတယ်နော်။', 'I said art.'],
    ], { jobs: ['potter', 'worker'] }),
    c([
      ['ဆမူဆာ ပူပူလေး ထွက်လာပြီ။', 'Hot samosas just came out!'],
      ['လျှာ ပူသွားမယ်။', "You'll burn your tongue."],
      ['ငါ့လျှာ ငါ့သဘော။', 'My tongue, my business.'],
    ], { time: 'morning' }),
    c([
      ['ထမင်းဘူးထဲ ဘာပါလဲ။', "What's in your lunchbox?"],
      ['ကြက်ဥကြော်။ နင်ရော။', 'Fried egg. You?'],
      ['ကြက်ဥကြော်ပဲ။ လဲစားရအောင်။', "Fried egg too. Let's swap."],
      ['…ဘာထူးလို့လဲ။', "...What's the point?"],
      ['ခံစားချက်ပဲ။', "It's about the feeling."],
    ], { time: 'noon', jobs: ['kid'] }),
    c([
      ['ကလေးတွေ ဒီနေ့ ဆူလိုက်တာ။', 'The children were so noisy today.'],
      ['မိုးရွာခါနီးဆို အမြဲပဲ။', 'Always, right before it rains.'],
    ], { jobs: ['teacher'] }),
    c([
      ['ဒီဆိုင်က လက်ဖက်ရည် ပိုကောင်းလာတယ်။', "This shop's tea got better."],
      ['ခွက်ပဲ အသစ်လဲထားတာ။', 'They only changed the cups.'],
    ]),
    c([
      ['မီးဖိုဘေးမှာ နေရတာ ပူလိုက်တာ။', "It's roasting next to the kiln."],
      ['အိုးတွေလည်း ပူတာပဲ။ သူတို့ မညည်းဘူး။', "The pots are hot too. They don't complain."],
    ], { time: 'noon', jobs: ['potter', 'worker'] }),
    c([
      ['ခြင်းလုံး ကစားမလား။', 'Play chinlone?'],
      ['မနေ့က ပြတင်းပေါက် မှန် မမေ့သေးဘူး။', "I haven't forgotten yesterday's window."],
      ['ဒီနေ့ ပြတင်းပေါက်ဘက် မကန်ဘူး။ ကတိ။', 'No kicking at windows today. Promise.'],
    ], { jobs: ['kid'] }),
    c([
      ['ဒီခုံမှာ ငါ နှစ်သုံးဆယ် ထိုင်လာတာ။', "I've sat on this stool for thirty years."],
      ['ခုံကတော့ ညည်းနေပြီ ဦးလေး။', "The stool's started to creak about it, Uncle."],
    ], { jobs: ['elder'] }),
    c([
      ['စာမေးပွဲ အောင်လား။', 'Pass the exam?'],
      ['အောင်တယ်။ အမေက မယုံဘူး။', "Yes. Mum doesn't believe me."],
    ], { jobs: ['kid'] }),
  ],

  envelope: [
    c([
      ['ခြေထောက် ညောင်းလာပြီ။', 'My legs are aching.'],
      ['ဆိုင်ကယ် ဝယ်လေ။', 'Buy a motorbike.'],
      ['ဆိုင်ကယ် ဝယ်ဖို့ ဆက်လျှောက်ရဦးမယ်။', "I'd have to walk to go buy one."],
    ]),
    c([
      ['ကားဖြတ်သွားတိုင်း ဖုန်တွေ။', 'Dust every time a truck goes by.'],
      ['ပါးစပ် ပိတ်ထား။', 'Keep your mouth shut.'],
      ['ငါ ပါးစပ်ပိတ်ရင် ဘယ်သူ စကားပြောမလဲ။', "Then who'll do the talking?"],
    ]),
    c([
      ['နွားလှည်းက ငါ့ထက် မြန်တယ်။', "That ox cart is faster than me."],
      ['နွားက မနက်စာ စားလာတာကိုး။', 'The ox had breakfast.'],
    ], { time: 'morning' }),
    c([
      ['စာတစ်စောင် ရောက်လာမှာကို စောင့်နေတယ်။', "I'm waiting on a letter."],
      ['ဘယ်သူ့ဆီကလဲ။', 'From who?'],
      ['ငါ့ဆီ ငါ ပို့ထားတာ။ စာရချင်လို့။', 'Myself. I just like getting mail.'],
    ]),
    c([
      ['ဒီသစ်ပင်အောက် ခဏ နားရအောင်။', "Let's rest under this tree a bit."],
      ['ခဏ ဆိုတာ ဘယ်လောက်လဲ။', "How long is 'a bit'?"],
      ['နေမဝင်ခင်အထိ။', 'Till sunset.'],
    ], { time: 'noon' }),
    c([
      ['ဘတ်စ်ကား အမိုးပေါ်မှာ ဆိတ်တစ်ကောင် ပါသွားတယ်။', 'There was a goat riding on the bus roof.'],
      ['ငါ့ထက် နေရာကောင်း ရတယ်။', 'Better seat than I got.'],
    ]),
    c([
      ['ချိုင့်တွေ ရေပြည့်နေပြီ။', 'The potholes are full of water.'],
      ['ငါးမွေးလို့ ရပြီ။', 'We could raise fish in them.'],
    ], { rain: true }),
    c([
      ['အဘိုးက ဒီလမ်းကို ခြေကျင် လျှောက်ခဲ့တာတဲ့။', 'Grandpa says he walked this road on foot.'],
      ['မိုးထဲ၊ ဖိနပ်မပါ၊ အတက်လမ်းချည်းပဲ မဟုတ်လား။', 'In the rain, barefoot, uphill both ways?'],
      ['အဲ့ဒါပဲ။', "That's the one."],
    ]),
    c([
      ['မြို့ထဲမှာ ကြယ်တွေ ဒီလောက် မမြင်ရဘူး။', "You don't see this many stars in town."],
      ['မြို့ထဲမှာ မီးပျက်မှ မြင်ရတာ။', 'Only during power cuts.'],
    ], { time: 'night' }),
    c([
      ['ကြံရည် တစ်ခွက် သောက်ရင် ဆက်လျှောက်နိုင်မယ်။', 'One sugarcane juice and I can keep going.'],
      ['နှစ်ခွက်ဆိုရော။', 'And two?'],
      ['ပြေးတောင် ပြေးနိုင်မယ်။', 'I could run.'],
    ], { time: 'noon', jobs: ['vendor'] }),
  ],

  market: [
    c([
      ['ဒီငါး ဘယ်လောက်လဲ။', 'How much is this fish?'],
      ['သုံးထောင်။', 'Three thousand.'],
      ['နှစ်ထောင်ဆို ယူမယ်။', "Two and I'll take it."],
      ['ငါးလေး ငိုနေပြီ။', 'Now the fish is crying.'],
    ], { jobs: ['vendor'] }),
    c([
      ['ခရမ်းချဉ်သီး ဈေးတက်တယ်နော်။', 'Tomatoes went up, huh?'],
      ['ခရမ်းချဉ်သီးတွေလည်း ဘဝ ခက်တာပဲ။', 'Tomatoes have a hard life too.'],
    ], { jobs: ['vendor'] }),
    c([
      ['နင့်အသံ ဒီနေ့ ပိုကျယ်တယ်။', 'Your voice is extra loud today.'],
      ['ဘေးဆိုင်ထက် ကျယ်ရမယ်လေ။', 'Got to beat the stall next door.'],
    ], { jobs: ['vendor'] }),
    c([
      ['ပန်းသည် ကောင်မလေး မင်္ဂလာဆောင်တော့မယ်တဲ့။', "The flower-seller girl is getting married."],
      ['ဟုတ်လား! ပန်းတော့ အလကား ရမှာပဲ။', 'Really! At least the flowers are free.'],
    ]),
    c([
      ['အကြွေ မရှိဘူးလား။', 'No small change?'],
      ['မရှိဘူး။ သကြားလုံးနဲ့ ပြန်အမ်းမယ်။', "None. I'll give your change in sweets."],
      ['ပိုတောင် ကောင်းသေး။', 'Even better.'],
    ], { jobs: ['vendor'] }),
    c([
      ['မနက်စောစော ဈေးက လူပြည့်နေပြီ။', "Market's packed already."],
      ['ကြက်တွန်တာထက် စောတယ်။', 'Before the roosters, even.'],
    ], { time: 'morning' }),
    c([
      ['ဒီငရုတ်သီး စပ်လား။', 'Are these chillies hot?'],
      ['စမ်းကြည့်လေ။', 'Try one.'],
      ['…ရေ! ရေ!', '...Water! Water!'],
      ['စပ်တယ်။', 'Yes. They are.'],
    ], { jobs: ['vendor'] }),
    c([
      ['ခြင်းတောင်း လေးလိုက်တာ။', 'This basket is so heavy.'],
      ['သုံးမျိုးပဲ ဝယ်မယ်ဆို။', "You said you'd only buy three things."],
      ['ဈေးက ငါ့ကို လှည့်စားတာ။', 'The market tricked me.'],
    ]),
    c([
      ['မိုးရွာတော့ ဆိုင်တွေ အကုန် သိမ်းကုန်ပြီ။', "Everyone's packing up for the rain."],
      ['ထီးသည်ပဲ ပြုံးနေတယ်။', 'Only the umbrella seller is smiling.'],
    ], { rain: true }),
    c([
      ['ငါးပိနံ့က ဈေးအဝမှာတင် ကြိုဆိုတယ်။', 'The fish-paste smell greets you at the gate.'],
      ['အဲ့ဒါ ဈေးရဲ့ ရေမွှေးလေ။', "That's the market's perfume."],
    ]),
    c([
      ['ဖရဲသီး ချိုလား။', 'Is the watermelon sweet?'],
      ['ချိုတယ်။ မချိုရင် ပြန်ယူခဲ့၊ ငါ စားပေးမယ်။', "Sweet. If not, bring it back and I'll eat it."],
    ], { time: 'noon', jobs: ['vendor'] }),
  ],

  wharf: [
    c([
      ['ဒီနေ့ ငါး ရလား။', 'Catch anything today?'],
      ['တစ်ကောင်။', 'One.'],
      ['ကြီးလား။', 'Big?'],
      ['ပြောပြတဲ့အခါကျ ကြီးတယ်။', "When I tell it, yes."],
    ], { jobs: ['fisher'] }),
    c([
      ['မြစ်ရေ တက်လာပြီ။', "The river's rising."],
      ['လှေတွေ ပျော်နေကြတယ်။', 'The boats look happy.'],
    ], { rain: true, jobs: ['fisher'] }),
    c([
      ['စက်လှေ စက်က ချောင်းဆိုးနေတယ်။', "The boat engine's coughing."],
      ['အသက်ကြီးပြီလေ။ ငါ့လိုပဲ။', "It's old. Like me."],
    ], { jobs: ['fisher', 'elder'] }),
    c([
      ['မြစ်ပေါ် နေဝင်တာ ဘယ်တော့မှ မငြီးဘူး။', 'I never get tired of sunset on the river.'],
      ['ငါလည်း။ ငါးမရတဲ့ နေ့တွေတောင်။', 'Me neither. Even on no-fish days.'],
    ], { time: 'evening' }),
    c([
      ['ဒီကြောင်က ငါ့လှေ ဆိုက်ချိန် သိတယ်။', 'This cat knows when my boat comes in.'],
      ['နင့်ထက် အချိန်မှန်တယ်။', "It's more punctual than you."],
    ], { jobs: ['fisher'] }),
    c([
      ['ပိုက်ကွန် ဖာရပြန်ပြီ။', 'Mending the net again.'],
      ['ငါးတွေ ကိုက်ဖြတ်သွားတာလား။', 'Did the fish bite through?'],
      ['ငါးတွေ ဉာဏ်ကောင်းလာတယ်။', 'The fish are getting clever.'],
    ], { jobs: ['fisher'] }),
    c([
      ['မြူတွေကြားမှာ ဟိုဘက်ကမ်း မမြင်ရဘူး။', "Can't see the far bank in this fog."],
      ['ဟိုဘက်ကလည်း ငါတို့ကို မမြင်ရဘူး။', "They can't see us either."],
    ], { time: 'morning' }),
    c([
      ['ကလေးတွေ ရေကူးနေကြတယ်။', 'The kids are swimming.'],
      ['ငယ်ငယ်က ငါတို့လည်း အဲ့လိုပဲ။', 'We were just the same.'],
      ['အခုတော့ ရေအေးတာ ကြောက်တယ်။', "Now I'm scared of cold water."],
    ], { time: 'noon' }),
    c([
      ['ငါးကြင်းနဲ့ ငါးခူ ဘယ်ဟာ ပိုလတ်လဲ။', 'Which is fresher, the carp or the catfish?'],
      ['အကုန် ဒီမနက်ကပဲ။ ငါးကိုပဲ မေးကြည့်။', 'All from this morning. Ask them yourself.'],
    ], { time: 'morning', jobs: ['fisher', 'vendor'] }),
    c([
      ['ကူးတို့လှေ ဒီနေ့ နောက်ကျတယ်။', "The ferry's late today."],
      ['လှေသမား ထမင်းစားနေတယ်။', "The boatman's having lunch."],
      ['သုံးနာရီ ကြာအောင်လား။', 'For three hours?'],
      ['သေသေချာချာ စားတာ။', 'He eats properly.'],
    ], { time: 'noon' }),
  ],

  junction: [
    c([
      ['ဒီနေ့ သတင်းစာမှာ ဘာထူးလဲ။', "Anything new in today's paper?"],
      ['မိုးလေဝသ။ ပူမယ်တဲ့။', "Weather. It'll be hot."],
      ['အဲ့ဒါ သတင်းစာ မလိုဘူး။', "Didn't need a paper for that."],
    ], { time: 'morning' }),
    c([
      ['လက်တွေ မင်တွေ ပေကုန်ပြီ။', 'My hands are all inky.'],
      ['မျက်နှာလည်း ပေနေတယ်။', "So's your face."],
      ['ဘယ်တုန်းကလဲ။', 'Since when?'],
      ['မနက်ကတည်းက။', 'Since this morning.'],
    ], { jobs: ['worker'] }),
    c([
      ['ပုံနှိပ်စက်သံ ကြားမှ အိပ်ပျော်တယ်။', 'I can only nap to the clatter of the press.'],
      ['အိမ်မှာ ဘယ်လို အိပ်လဲ။', 'How do you sleep at home?'],
      ['ဘေးအိမ်က ဟောက်ပေးတယ်။', 'The neighbour snores for me.'],
    ], { jobs: ['worker'] }),
    c([
      ['ခေါင်းစဉ်မှာ စာလုံးပေါင်း မှားနေတယ်။', "The headline's misspelt."],
      ['ငါ မဟုတ်ဘူး။ စက်က လုပ်တာ။', 'Not me. The machine did it.'],
    ], { jobs: ['worker'] }),
    c([
      ['တံတားပေါ်မှာ လေတိုက်တာ ကောင်းတယ်။', 'Lovely breeze on the bridge.'],
      ['ဦးထုပ် ကိုင်ထားနော်။', 'Hold on to your hat.'],
      ['ဘယ်ဦးထုပ်လဲ… အား!', 'What hat... oh no!'],
    ]),
    c([
      ['စကားလုံးဆက် ပဟေဠိ ဖြေပြီးပြီလား။', 'Finished the crossword?'],
      ['တစ်လုံးပဲ လိုတော့တယ်။ သုံးရက်ရှိပြီ။', "One word left. It's been three days."],
    ], { jobs: ['elder'] }),
    c([
      ['သတင်းစာ ပို့တာ အမြန်ဆုံး ငါပဲ။', "I'm the fastest paper delivery in town."],
      ['မနေ့က ငါ့သတင်းစာ ရေကန်ထဲ ရောက်နေတယ်။', 'Mine landed in the pond yesterday.'],
      ['မြန်တယ် ပြောတာ၊ တိကျတယ် မပြောဘူး။', 'I said fast. Not accurate.'],
    ], { time: 'morning', jobs: ['kid'] }),
    c([
      ['သတင်းစာဟောင်းတွေ ဘာလုပ်မလဲ။', 'What do we do with the old papers?'],
      ['မုန့်ဆိုင်က ယူမယ်တဲ့။ ပဲကြော် ထုပ်ဖို့။', 'The snack stall wants them, to wrap fritters.'],
    ], { jobs: ['worker'] }),
    c([
      ['တံတားအောက်က ရေ ကြည့်ရတာ စိတ်အေးတယ်။', 'Watching the water under the bridge is calming.'],
      ['ငါကတော့ ဟိုဘက်က မုန့်ဆိုင် ကြည့်နေတာ။', "I'm watching the snack stall on the other side."],
    ], { time: 'evening' }),
    c([
      ['စာလုံး ပြောင်းပြန်တွေ ဖတ်တတ်လာပြီ။', 'I can read backwards letters now.'],
      ['အတည့်ရော။', 'And the right way round?'],
      ['အဲ့ဒါ ခက်လာပြီ။', "That's getting harder."],
    ], { jobs: ['worker'] }),
  ],

  hearth: [
    c([
      ['ပေါင်မုန့်နံ့ကြောင့် ဗိုက်ဆာလာတယ်။', 'The bread smell is making me hungry.'],
      ['နင် ခုနကပဲ စားထားတာ။', 'You just ate.'],
      ['နှာခေါင်းက မသိဘူးလေ။', "My nose doesn't know that."],
    ]),
    c([
      ['မနက် လေးနာရီ ထရတယ်။', 'I get up at four.'],
      ['ငါ အဲ့အချိန် အိပ်ရာဝင်တာ။', "That's when I go to bed."],
    ], { time: 'morning', jobs: ['baker'] }),
    c([
      ['ခေါက်ဆွဲပန်းကန် ကြီးလိုက်တာ။', 'Huge noodle bowl!'],
      ['ကုန်အောင် စားနိုင်ရင် အလကား။', "Finish it and it's free."],
      ['ငါ့ဗိုက်ကို ယုံတယ်။', 'I believe in my stomach.'],
    ], { time: 'noon' }),
    c([
      ['ဒီမီးအိမ်လေး လှလိုက်တာ။', 'This little lamp is lovely.'],
      ['ညကျ မီးထွန်းထားရင် ပိုလှတယ်။', "Prettier at night, when it's lit."],
    ]),
    c([
      ['ယက်ကန်းသံ တချက်ချက်။', 'Clack, clack, go the looms.'],
      ['နှလုံးခုန်သံလိုပဲ။', 'Like a heartbeat.'],
      ['ငါ့နှလုံးက ဒီလောက် မမြန်ပါဘူး။', "My heart isn't that fast."],
    ], { jobs: ['weaver'] }),
    c([
      ['ဒီလုံချည် အရောင် ဘယ်လိုလဲ။', 'How is the colour on this longyi?'],
      ['ငှက်ပျောရွက်လို စိမ်းတယ်။ ကြိုက်တယ်။', 'Green as a banana leaf. I love it.'],
    ], { jobs: ['weaver'] }),
    c([
      ['ဒီပေါင်မုန့် နည်းနည်း မည်းနေတယ်။', 'This loaf is a bit dark.'],
      ['မီးဖိုက ဒီနေ့ စိတ်ကောက်နေတယ်။', "The oven's sulking today."],
    ], { jobs: ['baker'] }),
    c([
      ['ခေါက်ဆွဲဆိုင်က ဟင်းချို နည်းအသစ် စမ်းနေတယ်တဲ့။', "The noodle house is trying a new broth."],
      ['အမြည်း စမ်းပေးမယ့်သူ ငါ လုပ်ပေးမယ်။', 'I volunteer as taster.'],
    ]),
    c([
      ['ညနေ အေးလာရင် မုန့်ဖိုဘေး ထိုင်တာ အကောင်းဆုံး။', 'On cold evenings, the oven is the best seat.'],
      ['မုန့်လည်း တစ်လုံးလောက် ရနိုင်တယ်လေ။', 'And maybe a bun.'],
    ], { time: 'evening' }),
    c([
      ['ဆီမီးခွက်ထက် မီးသီးက ပိုကောင်းလား။', 'Is a bulb better than an oil lamp?'],
      ['မီးမပျက်သရွေ့ ကောင်းတယ်။', 'Until the power cuts out.'],
    ], { time: 'night' }),
    c([
      ['ချည်ခင်တွေ ရှုပ်ကုန်ပြီ။', 'My thread is all tangled.'],
      ['ကြောင်လေး ဝင်ကစားသွားတာ။', 'The kitten got in.'],
    ], { jobs: ['weaver'] }),
  ],

  garden: [
    c([
      ['မြက်ပေါင်းတွေ ပြန်ပေါက်လာပြီ။', 'The weeds are back.'],
      ['သူတို့ ဘယ်တော့မှ လက်မလျှော့ဘူး။', 'They never give up.'],
      ['ငါတို့လည်း မလျှော့ဘူး။', 'Neither do we.'],
    ]),
    c([
      ['ရေကန်ထဲက ဖားက တစ်ညလုံး အော်တယ်။', 'The pond frog croaked all night.'],
      ['သီချင်းဆိုတာလေ။', "He's singing."],
      ['သံစဉ် မမှန်ဘူး။', 'Out of tune.'],
    ], { time: 'morning' }),
    c([
      ['ငါ့ ခရမ်းချဉ်ပင် အသီးသီးပြီ!', 'My tomato plant has fruit!'],
      ['ဘယ်နှလုံးလဲ။', 'How many?'],
      ['တစ်လုံး။ ဒါပေမဲ့ လှတယ်။', 'One. But it is beautiful.'],
    ]),
    c([
      ['မိုးရွာတော့ ရေလောင်းစရာ မလိုဘူး။', 'Rain means no watering today.'],
      ['ပန်းတွေ ကျေနပ်နေကြတယ်။', 'The flowers are delighted.'],
    ], { rain: true }),
    c([
      ['ခရုတွေ ဟင်းရွက်တွေ စားသွားတယ်။', 'Snails ate my greens.'],
      ['ခရုလည်း ဗိုက်ဆာတာပဲ။', 'Snails get hungry too.'],
      ['ကိုယ့်ဟာကိုယ် စိုက်စားပါစေ။', 'Let them grow their own.'],
    ]),
    c([
      ['စံပယ်ပန်းနံ့က ညနေကျ ပိုမွှေးတယ်။', 'The jasmine smells sweeter at dusk.'],
      ['နေ့ခင်းဆို သူ အိပ်နေတာ။', 'It sleeps in the daytime.'],
    ], { time: 'evening' }),
    c([
      ['ဒီဖရုံသီး ဘယ်လောက် ကြီးလာမလဲ။', 'How big will this pumpkin get?'],
      ['အိမ်လောက်။', 'House-sized.'],
      ['အထဲမှာ နေလို့ ရမလား။', 'Could we live in it?'],
    ]),
    c([
      ['ရေကန်ထဲ ငါးလေးတွေ ဘယ်နှကောင် ရှိလဲ။', 'How many little fish in the pond?'],
      ['ရေတွက်တိုင်း မတူဘူး။', 'A different number every time I count.'],
    ]),
    c([
      ['ဘေးကွက်က ပဲပင်တွေ ငါ့ထက် မြင့်တယ်။', "The next plot's beans are taller than mine."],
      ['သူ ညတိုင်း စကားပြောပေးလို့တဲ့။', 'He talks to them every night, apparently.'],
      ['ဒီညကစပြီး ငါလည်း ပြောမယ်။', 'Starting tonight, so will I.'],
    ]),
    c([
      ['လိပ်ပြာ နင့်ခေါင်းပေါ် နားနေတယ်။', "There's a butterfly on your head."],
      ['မလှုပ်နဲ့။ ငါ ပန်းဖြစ်နေတာ။', "Don't move. I'm a flower now."],
    ]),
  ],

  blank: [
    c([
      ['ဒီမှာ တိတ်ဆိတ်လိုက်တာ။', 'So quiet here.'],
      ['ကိုယ့်နှလုံးခုန်သံတောင် ကြားရတယ်။', 'I can hear my own heartbeat.'],
    ]),
    c([
      ['ဒီစာမျက်နှာ ဖြူဖွေးနေတာပဲ။', 'This page is so white.'],
      ['မြူဆိုင်းတဲ့ မနက်လိုပဲ။', 'Like a misty morning.'],
    ]),
    c([
      ['ဒီမှာ အရိပ်တောင် မရှိဘူး။', 'Not even a shadow here.'],
      ['အရိပ်တွေလည်း အနားယူချင်မှာပေါ့။', 'Shadows need a rest too.'],
    ]),
    c([
      ['ငါ ဘာပြောမလို့လဲ မေ့သွားပြီ။', 'I forgot what I was going to say.'],
      ['ရပါတယ်။ ဒီမှာ စကား သိပ်မလိုဘူး။', "That's fine. Words aren't really needed here."],
    ]),
    c([
      ['လေတိုက်တာ ခံစားရလား။', 'Can you feel the breeze?'],
      ['ရတယ်။ စာရွက်လှန်သလိုပဲ။', 'Yes. Like a page turning.'],
    ]),
    c([
      ['ငယ်ငယ်က အိပ်မက်ထဲ ဒီလိုနေရာ ရောက်ဖူးတယ်။', 'I dreamt of a place like this as a child.'],
      ['ပြီးတော့ ဘာဖြစ်လဲ။', 'And then?'],
      ['အမေ ထမင်းစားခေါ်လို့ နိုးသွားတယ်။', 'Mum called me for dinner and I woke up.'],
    ]),
    c([
      ['တစ်ခုခု ရေးချင်လာတယ်။', 'I feel like writing something.'],
      ['ဘာရေးမလဲ။', 'What?'],
      ['မသိဘူး။ နေရာတော့ အများကြီး ရှိတယ်။', "Don't know. But there's plenty of room."],
    ]),
    c([
      ['ဒီမှာ လက်ဖက်ရည်ဆိုင် ရှိရင် ကောင်းမယ်။', "Shame there's no tea shop here."],
      ['တိတ်ဆိတ်မှုကို ပေါ့ဆိမ့် လုပ်သောက်မလို့လား။', 'You want your silence light and creamy?'],
    ]),
    c([
      ['တိုးတိုးလေး ပြောပါ။', 'Speak softly.'],
      ['ဘာလို့လဲ။', 'Why?'],
      ['ဒီနေရာက အိပ်နေသလိုပဲ။', 'This place feels like it is sleeping.'],
    ], { time: 'night' }),
  ],
};

export default SMALLTALK;
