// DRAFT(my)
// Random town gatherings (js/story/extras-events.js): every word said in them. Pure data, no imports.
// ALL BURMESE IS A DRAFT FOR PROOFREADING (Gemini, then Maya). Keep it short and natural.
//
// SHAPE
//   LINES[eventId][key] = { my, en }          a speech bubble (chatter bubbles) or a dialogue-box line
//     key 'tap'  = what a participant says when Maya taps them (the dialogue box)
//     key 'maya' = Maya's reply (her own bubble) after that
//   MENTIONS[eventId] = [{ my, en }]          later town chatter about it, said by ordinary townsfolk, once
//                                             the flag ev.<eventId>.seen is on (chatter.addLines, town lines)
// RULES: no religion, no politics, no prices or amounts of money, never a direction or a place as a goal,
// no real song lyrics. Each event carries a small lesson (comment beside it).

const L = (my, en) => ({ my, en });

export const LINES = {
  // E1 chinlone circle: skill comes from repeating; "not yet" (Ch 1, Ch 5)
  chinlone: {
    a: L('ခြင်းလုံး မကျစေနဲ့နော်။', "Don't let the ball drop!"),
    b: L('ငါ့ဆီ ပေး! ငါ့ဆီ!', 'To me! To me!'),
    c: L('အာ… ကျသွားပြီ။', 'Ah... it dropped.'),
    elder: L('ကျတော့ ဘာဖြစ်လဲကွ။ ပြန်ကောက်၊ ပြန်ခတ်။', 'So it dropped. Pick it up, kick again.'),
    d: L('အရင်က သုံးချက်ပဲ ရတယ်။ အခု ဆယ်ချက်။', 'I used to manage three. Now ten.'),
    end: L('ဆယ့်နှစ်ချက်!', 'Twelve!'),
    tap: L('လာလေ၊ တစ်ချက်လောက် ခတ်ကြည့်ပါဦး။', 'Come, give it a kick.'),
    maya: L('ကျရင်လည်း ပြန်ခတ်မယ်။', "If it drops, I'll kick again."),
  },
  // E2 mango basket spill: help without being asked; honesty (Ch 15, Ch 9)
  mango: {
    oh: L('အမလေး! သရက်သီးတွေ ကုန်ပါပြီ!', 'Oh no! My mangoes!'),
    help: L('စိတ်မပူနဲ့ အဒေါ်။ ကျွန်တော်တို့ ကောက်ပေးမယ်။', "Don't worry, aunty. We'll pick them up."),
    kid: L('ဒီမှာ တစ်လုံး! ဟိုမှာ တစ်လုံး!', 'One here! One there!'),
    bruised: L('နာသွားတာလေးတွေ ဘေးဖယ်ထားလိုက်။', 'Put the bruised ones aside.'),
    pocket: L('အဒေါ်… တစ်လုံး ကျွန်တော့်အိတ်ထဲ ရောက်နေလို့။ ရော့ပါ။', 'Aunty... one ended up in my pocket. Here.'),
    honest: L('လိမ္မာလိုက်တဲ့ကလေး။ ဒါ မင်းအတွက် ယူလိုက်။', "What an honest boy. This one's yours."),
    thanks: L('အားလုံးကို ကျေးဇူးတင်ပါတယ်ကွယ်။', 'Thank you, all of you.'),
    tap: L('ကျေးဇူးပါပဲ သမီးရယ်။', 'Thank you, dear.'),
    maya: L('ကူညီရတာ ပျော်တယ်။', 'Happy to help.'),
  },
  // E3 kitten on the crates: patience; to help, first understand (Ch 20, Ch 13)
  kitten: {
    see: L('ကြောင်ပေါက်လေး! ပြန်မဆင်းနိုင်တော့ဘူး!', "The kitten! It can't get down!"),
    climb: L('ငါ တက်ယူမယ်။', "I'll climb up and get it."),
    wait: L('နေဦး။ အော်ရင် ပိုလန့်သွားမယ်။ ဖြည်းဖြည်းချင်း။', 'Wait. Shouting scares it more. Gently.'),
    saucer: L('နို့ပန်းကန်လေး ချထားပေးလိုက်။ သူ့ဘာသာ ဆင်းလာလိမ့်မယ်။', 'Put down a saucer of milk. It will come down by itself.'),
    down: L('ဆင်းလာပြီ! ဆင်းလာပြီ!', "It's coming down!"),
    grab: L('အတင်းဆွဲရင် အကုတ်ခံရမှာ။', "If I'd grabbed it, I'd have been scratched."),
    lesson: L('ကူညီချင်ရင် အရင် နားလည်ပေးရတယ်။', 'To help, first understand.'),
    tap: L('တိုးတိုးလေးနေနော်။', 'Quietly now.'),
    maya: L('စောင့်ကြည့်မယ်။', "I'll wait and watch."),
  },
  // E4 kite contest: be truly glad for someone else's win (Ch 10)
  kite: {
    go: L('လေတိုက်ပြီ! လွှတ်တော့!', 'Good wind! Let go!'),
    high: L('ငါ့စွန်က အမြင့်ဆုံး!', "Mine's the highest!"),
    fell: L('ဟာ… ကျသွားပြီ။', 'Oh... it came down.'),
    glad: L('မင်းနိုင်တာ ဝမ်းသာတယ်ကွာ။ တကယ် ဝမ်းသာတာ။', "I'm glad you won. Really glad."),
    fix: L('မင်းစွန်လည်း လှပါတယ်။ မနက်ဖြန် အတူတူ ပြင်ကြတာပေါ့။', "Your kite's lovely too. Let's fix it together tomorrow."),
    elder: L('ကံကောင်းလို့ မဟုတ်ဘူးကွ။ ကြိုးကို စိတ်ရှည်ရှည် ထိန်းနိုင်လို့။', 'Not luck. He held the string patiently.'),
    tap: L('စွန်ကြိုး ကိုင်ကြည့်ဦးမလား။', 'Want to hold the string?'),
    maya: L('ဆွဲအားလေး ခံစားမိတယ်!', 'I can feel it pull!'),
  },
  // E5 football on the tea-shop TV: win or lose, still one cup of tea (Ch 8)
  football: {
    shoot: L('ကန်! ကန်!', 'Shoot! Shoot!'),
    goal: L('ဂိုး!!', 'Goal!!'),
    lost: L('တို့ဘက်က ရှုံးသွားပြီ။', 'Our side lost.'),
    elder: L('နိုင်လည်း လက်ဖက်ရည် တစ်ခွက်၊ ရှုံးလည်း တစ်ခွက်ပါပဲကွာ။', "Win or lose, it's still one cup of tea."),
    clap: L('ဟိုဘက်က တော်တော် ကောင်းတာ။ လက်ခုပ်တီးပေးရမယ်။', 'The other side played well. They deserve a clap.'),
    next: L('နောက်တစ်ပွဲ ကြည့်ကြတာပေါ့။', "There's always the next match."),
    tap: L('ထိုင်ကြည့်ပါဦး။ ရေနွေးကြမ်း အလကား သောက်လို့ရတယ်။', 'Sit and watch. The plain tea is free.'),
    maya: L('ဘယ်သူနိုင်နိုင် ပွဲကောင်းရင် ပြီးတာပါပဲ။', 'Whoever wins, a good match is enough.'),
  },
  // E6 new baby shown to the neighbours: don't compare, every child grows in their own time (Ch 5)
  baby: {
    lovely: L('ဟယ်… ကလေးလေး ချစ်စရာလေး။', 'Oh... what a lovely little one.'),
    looks: L('ဘယ်သူနဲ့ တူလဲ။ အမေတူလေးပဲ။', 'Who does she look like? Her mother.'),
    tiny: L('ဘာလို့ ဒီလောက်တောင် သေးသေးလေးလဲ။', 'Why is she so tiny?'),
    grow: L('အားလုံး ဒီလိုပဲ စတာပေါ့။ တစ်နေ့နည်းနည်းစီ ကြီးလာမှာ။', 'Everyone starts this small. A little bigger every day.'),
    mine: L('ငါ့ကလေးကတော့ ဒီအရွယ်မှာ…', 'Mine, at this age...'),
    compare: L('မနှိုင်းပါနဲ့။ ကလေးတိုင်း ကိုယ့်အချိန်နဲ့ကိုယ် ကြီးလာတာပါ။', "Don't compare. Every child grows in their own time."),
    thanks: L('လာကြည့်ပေးကြတာ ကျေးဇူးပါရှင်။', 'Thank you all for coming to see her.'),
    tap: L('တိုးတိုးလေးနော်၊ အိပ်နေတယ်။', "Softly, she's asleep."),
    maya: L('ကြိုဆိုပါတယ် ကလေးလေး။', 'Welcome, little one.'),
  },
  // E7 bicycle puncture fixed on the kerb: ask "why?" and learn to do it yourself (Ch 3, Ch 9)
  puncture: {
    flat: L('ဘီးပေါက်သွားပြီ။ ကျောင်းနောက်ကျတော့မှာပဲ။', "Flat tyre. I'll be late for school."),
    show: L('လာ၊ ပြမယ်။ နောက်တစ်ခါ ကိုယ့်ဘာသာ ဖာတတ်အောင်။', "Come, I'll show you. So next time you can patch it yourself."),
    how: L('ပေါက်တဲ့နေရာ ဘယ်လို ရှာလဲ။', 'How do you find the hole?'),
    dip: L('ရေထဲ နှစ်ကြည့်။ ပူဖောင်းထွက်တဲ့နေရာပဲ။', 'Dip it in water. Where the bubbles come out.'),
    why: L('ကော်သုတ်ပြီး ဘာလို့ စောင့်ရတာလဲ။', 'Why do we wait for the glue?'),
    good: L('မေးတာ ကောင်းတယ်။ မခြောက်ခင် ကပ်ရင် ပြန်ကွာတတ်တယ်။', 'Good question. Stick it wet and it peels off.'),
    proud: L('ကိုယ်တိုင် ဖာတတ်သွားပြီ!', 'I can patch it myself now!'),
    tap: L('ကြည့်ထားနော်။ တစ်နေ့ အသုံးဝင်လိမ့်မယ်။', "Watch. It'll come in handy one day."),
    maya: L('ဘာလို့လဲ မေးကြည့်မှ ပိုမှတ်မိတာ။', 'Asking why makes it stick.'),
  },
  // E8 snack cart opens, with a queue: wait your turn, elders first by choice (Ch 20, Ch 8)
  snack: {
    callEve: L('ပူပူနွေးနွေး! မုန့်လင်မယား ပူပူနွေးနွေးလေး!', 'Hot and fresh! Couple cakes, nice and hot!'),
    callMorn: L('အကြော်စုံ ပူပူလေး!', 'Fritters, piping hot!'),
    first: L('သား အရင်!', 'Me first!'),
    line: L('တန်းစီပါကွယ်။ အားလုံး ရမှာပါ။', 'Line up, dear. Everyone will get some.'),
    back: L('ဟုတ်ကဲ့… နောက်ဆုံးကပဲ စောင့်ပါ့မယ်။', "Okay... I'll wait at the back."),
    elder: L('ဘကြီးကို အရင်ပေးလိုက်ပါ။ ကြာကြာ မရပ်နိုင်ရှာဘူး။', "Serve grandpa first. He can't stand long."),
    extra: L('စိတ်ရှည်ရှည် စောင့်တဲ့သူကို တစ်စုံ ပိုထည့်ပေးမယ်။', 'An extra one for the one who waited.'),
    gone: L('ကုန်ပါပြီရှင်! မနက်ဖြန်မှ လာခဲ့ကြနော်။', 'All gone! Come again tomorrow.'),
    tap: L('သမီးလည်း မြည်းကြည့်ဦး။ ပူတယ်နော်။', "Have a taste, dear. It's hot."),
    maya: L('စောင့်ရကျိုး နပ်တယ်!', 'Worth the wait!'),
  },
  // E9 lantern story circle (night): say whose words you carry; help passes on (Ch 23)
  lantern: {
    once: L('ဟိုးရှေးရှေးတုန်းက ပိုးစုန်းကြူးလေး တစ်ကောင် ရှိသတဲ့ကွယ်။', 'Long, long ago there was a little firefly.'),
    ant: L('သူ့အလင်းလေး သေးပေမဲ့ လမ်းပျောက်နေတဲ့ ပုရွက်ဆိတ်လေးကို အိမ်ပြန်ပို့ပေးသတဲ့။', 'Its light was small, but it took a lost ant home.'),
    then: L('ပြီးတော့ ဘာဆက်ဖြစ်လဲ အဘိုး။', 'And then what?'),
    next: L('နောက်နေ့ကျ ပုရွက်ဆိတ်လေးကလည်း တခြားတစ်ကောင်ကို ပြန်ကူညီတယ်တဲ့။', 'The next day, the ant helped someone else.'),
    where: L('အဘိုး ဒီပုံပြင် ဘယ်ကရတာလဲ။', 'Grandpa, where did you get this story?'),
    from: L('ငါ့အဘွားဆီက ရတာပေါ့။ အခု မင်းတို့ကို လက်ဆင့်ကမ်းပေးလိုက်ပြီ။', "From my grandmother. Now I've given it to you."),
    tap: L('ထိုင်ပြီး နားထောင်ပါဦးကွယ်။', 'Stay and listen a while.'),
    maya: L('ဘယ်သူ့ဆီက ရလဲ ပြောပြတာ အရမ်းကြိုက်တယ်။', 'I love that you said whose story it was.'),
  },
  // E10 haggling at a stall: an honest scale brings customers back (Ch 17, Ch 20). No prices in any line.
  haggle: {
    ask: L('ဒီခရမ်းချဉ်သီး ဘယ်ဈေးလဲ။', 'How are you selling these tomatoes?'),
    askFish: L('ဒီငါး ဘယ်ဈေးလဲ။', 'How are you selling this fish?'),
    fresh: L('မနက်ကမှ ခူးထားတာ။ လတ်လတ်ဆတ်ဆတ်လေး။', 'Picked this morning. Fresh as can be.'),
    freshFish: L('မနက်စောစောကမှ ဖမ်းထားတာ။ လတ်လတ်ဆတ်ဆတ်ပဲ။', 'Caught early this morning. Fresh as can be.'),
    less: L('နည်းနည်း လျှော့ပေးပါဦး အစ်မရယ်။', 'Bring it down a little.'),
    scale: L('အလေးချိန် ကိုယ်တိုင် ကြည့်။ လုံးဝ မလိမ်ဘူး။', "Look at the scale yourself. It doesn't lie."),
    years: L('သူ့အလေး မှန်ပါတယ်။ ဆယ်နှစ်ရှိပြီ ဒီမှာ ဝယ်လာတာ။', "Her scale is honest. I've bought here ten years."),
    take: L('ကဲ… ဈေးမှန်ရင် ယူမယ်လေ။', "Well... a fair price, I'll take it."),
    back: L('ရိုးရိုးသားသား ရောင်းရင် ဖောက်သည်က ပြန်လာစမြဲပဲ။', 'Sell honestly and customers come back.'),
    tap: L('ကြည့်ပါဦး၊ ဈေးမှန်ပါတယ်နော်။', 'Have a look, fair prices.'),
    maya: L('ရိုးသားမှုက အကောင်းဆုံး ကြော်ငြာပဲ။', 'Honesty is the best advert.'),
  },
  // E11 kids' race: stopping to help beats winning (Ch 15, Ch 9)
  race: {
    go: L('အသင့်… ပြင်… ပြေး!', 'Ready... set... go!'),
    ow: L('အားလား!', 'Ow!'),
    help: L('ရရဲ့လား။ ထ၊ အတူတူ ပြေးကြမယ်။', "Are you okay? Up you get, we'll run together."),
    best: L('ပထမ မရပေမဲ့ ဒီနေ့ အတော်ဆုံး ပြေးသူပဲ။', "Not first, but today's best runner."),
    won: L('မင်းတို့ နှစ်ယောက်လည်း နိုင်တာပါပဲ!', 'You two won too!'),
    tap: L('လာ၊ နောက်တစ်ပွဲ ဒိုင်လုပ်ပေးဦး။', 'Come, judge the next race.'),
    maya: L('မလဲအောင် ပြေးကြနော်!', 'Run carefully, everyone!'),
  },
  // E12 newspaper read aloud (from Day 8): check before believing (Ch 12, Ch 13)
  paper: {
    fish: L('ဒီမှာ ဖတ်ကြည့်… မြစ်ထဲမှာ အိမ်လောက်ကြီးတဲ့ ငါးကြီး တွေ့တယ်တဲ့!', 'It says here... a fish as big as a house was seen in the river!'),
    moon: L('ဒီမှာ ဖတ်ကြည့်… မနက်ဖြန် လက လေးထောင့်ပုံ ဖြစ်မယ်တဲ့!', 'It says here... tomorrow the moon will be square!'),
    cat: L('ဒီမှာ ဖတ်ကြည့်… ဂဏန်းတွက်တတ်တဲ့ ကြောင် ရှိတယ်တဲ့!', "It says here... there's a cat that can count!"),
    really: L('ဟယ်! ဟုတ်လို့လား!', 'No! Really?'),
    sister: L('ငါ့ညီမကို သွားပြောရဦးမယ်။', 'I must tell my sister.'),
    who: L('နေဦး။ ဘယ်သူရေးတာလဲ။ ဘယ်သူ ကိုယ်တိုင် မြင်ခဲ့လို့လဲ။', 'Wait. Who wrote it? Who saw it with their own eyes?'),
    said: L('အင်း… "ကြားရသည်" လို့ပဲ ရေးထားတာ။', 'Hmm... it only says "it is said that".'),
    fishNo: L('ငါ ဆိပ်ကမ်းမှာ နေ့တိုင်း ရှိတာ။ အဲဒီလောက်ကြီးတဲ့ငါး တစ်ခါမှ မမြင်ဖူးဘူး။', "I'm at the wharf every day. Never seen a fish that big."),
    moonNo: L('ညကျ အတူတူ စောင့်ကြည့်ကြမယ်လေ။', "Let's all look tonight."),
    catNo: L('ဘယ်သူ့ကြောင်လဲ။ သွားမေးကြည့်ရအောင်လေ။', "Whose cat? Let's go and ask."),
    check: L('မယုံခင် သေချာစစ်ဦး။ ပြီးမှ ပြန်ပြောကြ။', 'Check before you believe. Then pass it on.'),
    tap: L('သမီးရော ဘယ်လိုထင်လဲကွယ်။', 'What do you think, dear?'),
    maya: L('ကိုယ်တိုင် စစ်ကြည့်ပြီးမှပဲ ယုံတော့မယ်။', "I'll check it myself before I believe it."),
  },
  // E13 puppet show for children (from Day 9): a real sorry has no "but" (Ch 14). Original puppets only.
  puppet: {
    proud: L('ငါ့အတောင်တွေက အလှဆုံးကွ! ဖားလေး၊ မင်းကတော့ ဘာမှ မလှဘူး။', "My feathers are the finest! Little frog, you're nothing special."),
    hurt: L('အဲဒီစကား ရင်ထဲ နာတယ်။', 'That hurt.'),
    sorry: L('…ငါ မှားသွားတယ်။ တောင်းပန်ပါတယ်ကွာ။', "...I was wrong. I'm sorry."),
    nobut: L('သူ "ဒါပေမဲ့" ထည့်မပြောဘူး!', 'He didn\'t say "but"!'),
    real: L('ဟုတ်တယ်။ တကယ် တောင်းပန်ရင် "ဒါပေမဲ့" မပါရဘူး။', 'Right. A real sorry has no "but".'),
    again: L('ထပ်ပြ! ထပ်ပြ!', 'Again! Again!'),
    tap: L('ကလေးတွေနဲ့ အတူ ဝင်ကြည့်ပါဦး။', 'Watch with the children.'),
    maya: L('တောင်းပန်ဖို့ဆိုတာ သတ္တိ ရှိမှ ရတာ။', 'Saying sorry takes courage.'),
  },
};

// Later town chatter about a gathering Maya saw (flag ev.<id>.seen), said by ordinary townsfolk.
export const MENTIONS = {
  kitten: [L('ဟိုနေ့က ကြောင်ပေါက်လေး သူ့ဘာသာ ဆင်းလာတယ်နော်။', 'That kitten came down by itself the other day.')],
  paper: [L('သတင်းစာထဲက ငါးကြီးလေ… ဘယ်သူမှ မမြင်ဖူးဘူးတဲ့။', "That giant fish in the paper... nobody's seen it.")],
  kite: [L('စွန်ရှုံးတဲ့ကလေးက ပြုံးပြုံးလေးပဲနော်။', 'The kid who lost the kite contest was still smiling.')],
  mango: [L('သရက်သီးသည် အဒေါ်ကြီးက ရိုးသားတဲ့ကလေးအကြောင်း ပြောမဆုံးဘူး။', 'The mango aunty still talks about that honest boy.')],
  race: [L('ပြေးပွဲမှာ နောက်ပြန်လှည့်ကူတဲ့ကလေးကို မှတ်မိသေးလား။', 'Remember the kid who turned back to help in the race?')],
  puncture: [L('ဟိုကလေး ဘီးဖာတာ ကိုယ်တိုင် တတ်သွားပြီတဲ့။', "That kid learned to patch a tyre himself, they say.")],
};
