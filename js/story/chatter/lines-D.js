// Town chatter, part D: the funny pack (owner request 2026-11-15): Myanmar everyday-life jokes, no politics or religion.
// Read by ./index.js (createChatter), merged after lines-A/B/C into the same pools. Shape and tags: see the header of
// ./index.js (and lines-A.js). Pure data, no imports.
//   { [districtId]: { town: [line], areas: { id: { at: { x, z, r }, lines } }, rooms: { roomId: [line] },
//                     pairs: [{ id, who: [jobA, jobB], age?, lines }] } }
//   line = { id, my, en, job?, age?, weather? }   id 'fun:<district>:<n>' (pairs 'fun:<district>:p<n>'): the
//   chatter memory keys a line by its id, so a proofread that changes the Burmese keeps it "already heard".
//
// Owner: "add more funny dialogs... make it funny jokes, some related to Myanmar Burmese situations, no politics and
// religions". So these are jokes first, from everyday life: tea shops and their orders, mohinga and fritters, laphet
// keeping you up, rain and flipped umbrellas, mud and slippers, power cuts and the neighbour's generator, data and
// top-ups, aunties asking about marriage and salary, relatives turning up, thanaka, longyis and buses, trishaws
// and "one more person", tuition and marks, late-night football, karaoke, mosquitoes, durian, the cat and the fish,
// borrowing, "almost there", haggling, too much rice, forgetting why you came in.
// Kept out: government, army, elections, borders, money complaints aimed at anyone; pagodas, monasteries, monks,
// nats, prayer, merit, festivals; mocking any group, region, body or gender; crude jokes; real people, brands or
// lyrics; any hint at where Maya should go or what to do; Ko Hein Htet.
// All Burmese is a DRAFT (spoken, short) for Gemini / Maya to proofread: scratchpad gemini/big/fun01.txt.

export const LINES_D = {
  // =====================================================================================================
  // HOME BOOK
  // =====================================================================================================
  home: {
    town: [
      { id: 'fun:home:1', my: 'ဒေါ်လေးက ဘယ်တော့ အိမ်ထောင်ကျမှာလဲ တဲ့။ ငါ ခြောက်နှစ်ပဲ ရှိသေးတာကို။', en: "Aunty asked when I'm getting married. I'm six.", age: 'child' },
      { id: 'fun:home:2', my: 'အမေက ထမင်း အမြဲ ပိုချက်တယ်။ "ဧည့်သည် လာရင်" တဲ့။ ဘယ်တော့မှ မလာဘူး။', en: 'Mum always cooks too much rice. "In case guests come." They never do.' },
      { id: 'fun:home:3', my: 'ဒူးရင်းသီး တစ်လုံး ဝယ်လာတယ်။ လမ်းထဲက လူတိုင်း သိသွားပြီ။', en: 'I bought one durian. The whole lane knows.' },
      { id: 'fun:home:4', my: 'ဘေးအိမ်က ကြက်ဖက မနက် သုံးနာရီ တွန်တယ်။ သူ့နာရီ ပျက်နေတာ ထင်တယ်။', en: "Next door's rooster crows at three in the morning. His clock must be broken." },
      { id: 'fun:home:5', my: 'သနပ်ခါး လိမ်းပြီး ချွေးထွက်တော့ မျက်နှာက မြေပုံ ဖြစ်သွားရော။', en: 'Thanaka plus sweat. My face turned into a map.', age: 'child' },
      { id: 'fun:home:6', my: 'အမေ ဖုန်းပြောရင် အသံကျယ်လွန်းလို့ ဖုန်းမပါလည်း ကြားရလောက်တယ်။', en: 'Mum talks so loudly on the phone, she hardly needs the phone.' },
      { id: 'fun:home:7', my: 'လေတိုက်လို့ ထီး ပြောင်းပြန် လန်သွားတယ်။ အခု မိုးရေခံ ဇလုံ ရသွားပြီ။', en: 'The wind flipped my umbrella inside out. Now I own a rain bowl.' },
      { id: 'fun:home:8', my: 'ဘေးအိမ်က ကာရာအိုကေ ဆိုနေတယ်။ တီးလုံးက တစ်ပုဒ်၊ အသံက တခြားတစ်ပုဒ်။', en: "Next door's doing karaoke. The music is one song, his voice is another." },
      { id: 'fun:home:9', my: 'ဘောလုံးပွဲ ကြည့်ရင် အဘိုးက တီဗီထဲက ကစားသမားတွေကို နည်းပေးတယ်။ ဘယ်သူမှ နားမထောင်ဘူး။', en: 'During the match Grandpa coaches the players through the screen. They never listen.' },
      { id: 'fun:home:10', my: 'အမေက "ဆား နည်းနည်း" တဲ့။ ဘယ်လောက်လဲ မေးတော့ "နည်းနည်း" ပဲ ထပ်ပြောတယ်။', en: 'Mum says "a little salt". I ask how much. She says "a little" again.' },
      { id: 'fun:home:11', my: '"တစ်ခုပဲ စားမယ်" ဆိုပြီး ပဲကြော် လေးခု ကုန်သွားပြီ။', en: '"Just one," I said. That was four fritters ago.' },
      { id: 'fun:home:12', my: 'ညီလေး ဆွဲတဲ့ပုံ ကြောင်နဲ့တူတယ် ပြောလိုက်တာ။ ငါ့ကို ဆွဲထားတာတဲ့။', en: 'I told my little brother his drawing looked like a cat. He said it was me.', age: 'child' },
      { id: 'fun:home:13', my: 'စာအုပ်ကို ပြောင်းပြန် ချုပ်မိတယ်။ အခု ဇာတ်လမ်းက အဆုံးကနေ စတယ်။', en: 'I bound a book back to front. Now the story starts at the end.' },
      { id: 'fun:home:14', my: 'ငါ့လက်ရေးကို ငါပဲ ဖတ်တတ်တယ်။ တချို့နေ့ဆို ငါတောင် မဖတ်တတ်ဘူး။', en: 'Only I can read my handwriting. Some days, not even me.' },
      { id: 'fun:home:15', my: 'လေမရှိလို့ သူငယ်ချင်းက လေရဟတ်ကို ကိုယ်တိုင် မှုတ်တယ်။ အခု ခေါင်းမူးနေပြီ။', en: 'No wind, so my friend blew on his windmill himself. Now he is dizzy.', age: 'child' },
      { id: 'fun:home:16', my: 'အမေက "ထပ်ထည့်ဦး" တဲ့။ "ဝပြီ" ဆိုတဲ့ စကား အမေ့နားထဲ မရောက်ဘူး။', en: "Mum says 'have some more'. 'I'm full' never reaches her ears." },
      { id: 'fun:home:17', my: 'ကလေးတွေ အိပ်အောင် ပုံပြင် ပြောပြတာ။ ငါပဲ အမြဲ အရင် အိပ်ပျော်သွားတယ်။', en: 'I tell bedtime stories so the children will sleep. I always nod off first.', age: ['adult', 'elder'] },
      { id: 'fun:home:18', my: 'မိုးရေထဲ ဖိနပ်တစ်ဖက် မျောသွားတယ်။ ကျန်တစ်ဖက် သိမ်းထားတယ်။ ပြန်လာမှာပါလေ။', en: 'The rain carried off one slipper. I kept the other. It will come back.' },
      { id: 'fun:home:19', my: 'စာရေးမယ်ဆိုတိုင်း စားပွဲ အရင်ရှင်းတယ်။ ရှင်းပြီးတော့ ညနေ ရောက်နေပြီ။', en: 'Every time I sit down to write, I tidy the desk first. Then it is evening.' },
      { id: 'fun:home:20', my: 'ဗီဒီယိုကောလ်မှာ မြေးတွေ ရယ်နေကြတယ်။ ဖုန်းကို ပြောင်းပြန် ကိုင်ထားလို့တဲ့။', en: 'My grandchildren laughed all through the video call. I was holding the phone upside down.', age: 'elder' },
      { id: 'fun:home:21', my: 'ညီမလေးက "ဘာလို့လဲ" ကို တစ်နေ့ အခါတစ်ရာ မေးတယ်။ အမေက ငါလည်း အဲလိုပဲတဲ့။', en: 'My little sister asks "why?" a hundred times a day. Mum says I was the same.', age: 'child' },
    ],
    pairs: [
      { id: 'fun:home:p1', who: ['*', '*'], lines: [
        { my: 'သမီး၊ ဘယ်တော့ အိမ်ထောင်ကျမှာလဲ။', en: 'When are you getting married, dear?' },
        { my: 'ဒေါ်လေးရော ဘယ်တော့ အငြိမ်းစား ယူမှာလဲ။', en: 'When are you retiring, Aunty?' },
        { my: '…ဟင်းချို ထပ်ထည့်ပေးမယ်နော်။', en: '…Let me get you more soup.' },
      ] },
      { id: 'fun:home:p2', who: ['*', '*'], lines: [
        { my: 'ဘယ်ရောက်ပြီလဲ။', en: 'Where are you?' },
        { my: 'ရောက်တော့မယ်။ လမ်းထိပ်မှာ။', en: 'Almost there. At the corner.' },
        { my: 'ငါ နင့်အိမ်ရှေ့မှာ။ နင့်ဖိနပ် မြင်နေရတယ်။', en: "I'm outside your house. I can see your slippers." },
      ] },
      { id: 'fun:home:p3', who: ['*', '*'], lines: [
        { my: 'ငါ ငှားထားတဲ့ စာအုပ် ပြန်ပေးဦး။', en: 'Give back the book I lent you.' },
        { my: 'ဘယ်စာအုပ်လဲ။', en: 'Which book?' },
        { my: '"ငှားတာ ပြန်ပေးနည်း" စာအုပ်လေ။', en: 'The one called "How to Return Things".' },
        { my: 'အဲဒါ ဖတ်လို့ မပြီးသေးဘူး။', en: "Haven't finished it yet." },
      ] },
      { id: 'fun:home:p4', who: ['*', '*'], lines: [
        { my: 'မီးပျက်သွားပြီ။', en: "Power's gone." },
        { my: 'ဖုန်းမီး ဖွင့်လိုက်လေ။', en: 'Use your phone light.' },
        { my: 'ဖုန်းအားလည်း ကုန်နေပြီ။', en: 'Phone is dead too.' },
        { my: 'ဒါဆို ရေခဲသေတ္တာထဲက မုန့်တွေ မပူခင် အကုန် စားရမယ်။', en: 'Then we must eat everything in the fridge before it warms up.' },
      ] },
      { id: 'fun:home:p5', who: ['*', '*'], lines: [
        { my: 'ငါးကြော် တစ်ကောင် ဘယ်ရောက်သွားလဲ။', en: 'Where did one of the fried fish go?' },
        { my: 'ကြောင်ကို မေးကြည့်။', en: 'Ask the cat.' },
        { my: 'ကြောင်က မျက်နှာ သစ်နေပြီ။', en: "The cat's washing its face." },
        { my: 'အဲဒါ အဖြေပဲ။', en: "There's your answer." },
      ] },
      { id: 'fun:home:p6', who: ['*', '*'], lines: [
        { my: 'မနေ့ည ပွဲ ကြည့်ဖြစ်လား။', en: 'Watch the match last night?' },
        { my: 'ကြည့်တယ်။ ဂိုးဝင်တော့ ငါ အိပ်ပျော်နေတယ်။', en: 'Yes. I was asleep when the goal went in.' },
        { my: 'ဒါဆို ဘာကြည့်လိုက်တာတုန်း။', en: 'So what did you watch?' },
        { my: 'ကြော်ငြာတွေလေ။ အရမ်းကောင်းတယ်။', en: 'The adverts. Brilliant.' },
      ] },
      { id: 'fun:home:p7', who: ['*', '*'], lines: [
        { my: 'သနပ်ခါး လိမ်းပေးမယ်။ မလှုပ်နဲ့။', en: 'Let me do your thanaka. Hold still.' },
        { my: 'ယားတယ်။', en: 'It tickles!' },
        { my: 'ပြီးပြီ။ ပန်းပွင့်လေး။', en: 'Done. A little flower.' },
        { my: 'မှန်ထဲမှာ ကြောင်မုတ်ဆိတ်နဲ့ တူနေတယ်။', en: 'In the mirror it looks like cat whiskers.' },
      ] },
    ],
    rooms: {
      sortingroom: [
        { id: 'fun:home:22', my: 'ဒီစာအိတ်ပေါ်မှာ "အမေ့ဆီ" လို့ပဲ ရေးထားတယ်။ ဒီမြို့မှာ အမေတွေ အများကြီး။', en: 'This one just says "To Mum". This town is full of mums.' },
        { id: 'fun:home:23', my: 'စာအိတ်ပေါ်မှာ "အမြန်" လို့ အနီနဲ့ ရေးထားတယ်။ တံဆိပ်ခေါင်းတော့ မကပ်ဘူး။', en: 'Someone wrote "URGENT" on it in red. And forgot the stamp.' },
        { id: 'fun:home:24', my: 'တစ်နေ့ စာအိတ် တစ်ထောင် ခွဲတယ်။ ကိုယ့်နာမည်ပါတာ တစ်စောင်မှ မရှိဘူး။', en: 'I sort a thousand letters a day. Not one has my name on it.' },
        { id: 'fun:home:25', my: 'ခြေထောက်က လိပ်စာတိုင်း မှတ်မိတယ်။ ခေါင်းက မနက်စာ စားခဲ့လား မမှတ်မိဘူး။', en: "My feet know every address. My head can't remember if I had breakfast." },
        { id: 'fun:home:26', my: 'လမ်းထဲက ခွေးတွေ ငါ့ကို မြင်တိုင်း ဟောင်တယ်။ နှစ်ဆယ်နှစ် ရှိပြီ။ ချစ်လို့ ထင်ပါတယ်။', en: 'The lane dogs bark every time they see me. Twenty years now. I think it is love.' },
        { id: 'fun:home:27', my: 'မိုးတွင်းဆို စာတွေက ထီးအောက် အရင်ဝင်ရတယ်။ ငါက နောက်မှ။', en: 'In the monsoon the letters get the umbrella first. I come second.' },
      ],
    },
  },

  // =====================================================================================================
  // EXERCISE-BOOK QUARTER
  // =====================================================================================================
  exercise: {
    town: [
      { id: 'fun:exercise:1', my: 'လက်ဖက်ရည်ဆိုင် ခုံပုလေးက ပုလွန်းလို့ ဒူးက မေးစေ့နဲ့ ထိနေတယ်။', en: 'The tea-shop stools are so low my knees touch my chin.' },
      { id: 'fun:exercise:2', my: 'ဆရာက "မေးစရာ ရှိလား" ဆိုတော့ အားလုံး ငြိမ်နေတယ်။ ခေါင်းလောင်းထိုးမှ အကုန် မေးချင်လာတယ်။', en: 'Teacher asked "Any questions?" Silence. Then the bell rang and everyone had one.' },
      { id: 'fun:exercise:3', my: 'အမေက ငါ့ကို ဘေးအိမ်ကလေးနဲ့ နှိုင်းတယ်။ သူ့အမေကလည်း သူ့ကို ငါနဲ့ နှိုင်းတယ်တဲ့။', en: 'Mum compares me with the boy next door. His mum compares him with me.', age: 'child' },
      { id: 'fun:exercise:4', my: 'အိမ်စာ ဆိုတော့ အိမ်မှာပဲ ထားခဲ့တာပေါ့ ဆရာရဲ့။', en: "It's called home-work, Teacher. So I left it at home.", age: 'child' },
      { id: 'fun:exercise:5', my: 'မုန့်ဖိုး တစ်ရာနဲ့ ဘာဝယ်ရမလဲ ဆယ်မိနစ် စဉ်းစားတယ်။ ခေါင်းလောင်း ထိုးသွားပြီ။', en: 'Spent ten minutes deciding what to buy with my hundred kyats. Then the bell rang.', age: 'child' },
      { id: 'fun:exercise:6', my: 'ဆမူဆာ တစ်ခုပဲ ဝယ်တာ။ သူငယ်ချင်း ငါးယောက်က တစ်ကိုက်စီ ကိုက်သွားတယ်။', en: 'I bought one samosa. Five friends took a bite each.', age: 'child' },
      { id: 'fun:exercise:7', my: 'ထီးတစ်လက်အောက် လေးယောက်။ အကုန် ရေစိုတယ်။ အကုန် ပျော်တယ်။', en: 'Four of us under one umbrella. All soaked. All happy.', age: 'child' },
      { id: 'fun:exercise:8', my: 'ဖိနပ်ဖြူနဲ့ ကျောင်းလာတာ။ ပြန်တော့ ဖိနပ်ညို ဖြစ်သွားပြီ။', en: 'Came to school in white shoes. Went home in brown ones.', age: 'child' },
      { id: 'fun:exercise:9', my: 'ဆရာမက "အသံ မထွက်ရဘူး" တဲ့။ အားလုံးက "ဟုတ်ကဲ့ ဆရာမ" လို့ ပြိုင်တူ အော်ကြတယ်။', en: 'Teacher said "Not a sound." We all shouted "Yes, Teacher!"', age: 'child' },
      { id: 'fun:exercise:10', my: 'ဒီက ကလေးတိုင်းရဲ့ နာမည် မှတ်မိတယ်။ ကိုယ့်မျက်မှန် ဘယ်မှာထားလဲ မမှတ်မိဘူး။', en: "I know every child's name round here. Never where I left my glasses.", age: 'elder' },
      { id: 'fun:exercise:11', my: 'ချော်ဆင်းတာ ငါးစက္ကန့်၊ ပြန်တက်တာ ငါးမိနစ်။ ဒါပေမဲ့ တန်တယ်။', en: 'Five seconds down the slide. Five minutes back up. Worth it.', age: 'child' },
      { id: 'fun:exercise:12', my: 'ခြင်းလုံးကို ခြေထောက်နဲ့ဆို တော်တယ်။ ခေါင်းနဲ့ဆို ကြယ်တွေ မြင်တယ်။', en: "I'm good at chinlone with my feet. With my head, I see stars.", age: 'child' },
      { id: 'fun:exercise:13', my: 'အိုးလုပ်ရင် ရွှံ့က အိုးပေါ်ထက် ငါ့မျက်နှာပေါ် ပိုရောက်တယ်။', en: 'When I make pots, more clay ends up on my face than on the pot.', age: ['adult', 'elder'] },
      { id: 'fun:exercise:14', my: '"အိုး ဝယ်မလား" မေးတော့ "ဈေးလျှော့ရင်" တဲ့။ ဈေးတောင် မပြောရသေးဘူး။', en: "'Buy a pot?' I asked. 'If you lower the price,' she said. I hadn't said a price yet." },
      { id: 'fun:exercise:15', my: 'ဆရာ့မေးခွန်း ဖုန်းနဲ့ ရှာမလို့။ ဒေတာ ကုန်နေလို့ ကိုယ့်ခေါင်းနဲ့ပဲ စဉ်းစားရတော့တယ်။', en: "I was going to look up Teacher's question on my phone. No data. Had to use my own head.", age: 'teen' },
      { id: 'fun:exercise:16', my: 'ငါ စာကျက်တာ အသံကျယ်လွန်းလို့ ဘေးအိမ်ကပါ အလွတ်ရနေပြီ။', en: 'I recite my lessons so loudly the neighbours know them by heart too.', age: 'child' },
      { id: 'fun:exercise:17', my: 'မနက် မုန့်ဟင်းခါး ဝဝ စားလာတယ်။ ပထမ အချိန်မှာ အိပ်ချင်လိုက်တာ။', en: 'A big bowl of mohinga before school. The first lesson is so sleepy.' },
      { id: 'fun:exercise:18', my: 'စာမေးပွဲညမှာ လက်ဖက်သုပ် စားတယ်။ မျက်လုံးက ပွင့်နေတယ်၊ ခေါင်းက ပိတ်နေတယ်။', en: 'Tea-leaf salad on exam night. Eyes wide open. Brain firmly shut.', age: 'teen' },
      { id: 'fun:exercise:19', my: 'အင်္ကျီဖြူပေါ် ဟင်းတစ်စက် ကျရင် တစ်ကျောင်းလုံး သိတယ်။', en: 'One drop of curry on a white school shirt, and the whole school knows.' },
      { id: 'fun:exercise:20', my: 'ကြီးရင် လက်ဖက်ရည်ဆိုင် ဖွင့်မယ်။ ဒါမှ တစ်နေ့လုံး ထိုင်လို့ရမှာ။', en: "When I grow up I'll open a tea shop. Then I can sit in it all day.", age: 'child' },
      { id: 'fun:exercise:21', my: 'ငယ်ငယ်က ကျောင်းကို တစ်နာရီ လမ်းလျှောက်ရတာ။ ပြောတိုင်း တစ်မိနစ်စီ ပိုရှည်လာတယ်။', en: 'As a child I walked an hour to school. Every time I tell it, it gets a minute longer.', age: 'elder' },
      { id: 'fun:exercise:22', my: 'စာကျက်ရင်လည်း ခြင်ကိုက်တယ်။ မကျက်ရင်လည်း ကိုက်တာပဲ။ ဒါဆို ကျက်တာပဲ ကောင်းတယ်။', en: "Mosquitoes bite when I study. They bite when I don't. So I might as well study.", age: 'child' },
      { id: 'fun:exercise:23', my: 'ထမင်းဘူး ဖွင့်တာနဲ့ ကျီးကန်းတွေ စောင့်နေကြပြီ။', en: 'The moment the lunchboxes open, the crows are already waiting.' },
      { id: 'fun:exercise:24', my: 'ဆရာမက မစား မအိပ်ဘူး ထင်ခဲ့တာ။ ဈေးထဲမှာ တွေ့တော့ အံ့ဩသွားတယ်။', en: 'I thought Teacher never ate or slept. Then I saw her at the market.', age: 'child' },
      { id: 'fun:exercise:25', my: 'ဒီက လမ်းတွေက မျဉ်းကြောင်းအတိုင်း ဖြောင့်တယ်။ ငါ့လက်ရေးကတော့ မဖြောင့်ဘူး။', en: 'The streets here follow the ruled lines. My handwriting does not.' },
      { id: 'fun:exercise:26', my: 'ခဲဖျက် ဝယ်တိုင်း ပျောက်တယ်။ ခဲဖျက်တွေ ဘယ်ကို သွားကြလဲ မသိဘူး။', en: 'Every eraser I buy vanishes. Where do they all go?', age: 'child' },
      { id: 'fun:exercise:27', my: 'ကျောင်းဆင်းချိန် စောင့်နေတဲ့ အမေတွေက ကလေးတွေထက် ပိုဆူတယ်။', en: 'The mums waiting at home time are noisier than the children.' },
    ],
    pairs: [
      { id: 'fun:exercise:p1', who: ['*', '*'], lines: [
        { my: 'ဒီနေ့ ကစားမလား။', en: 'Play today?' },
        { my: 'ကျူရှင် ရှိတယ်။', en: 'Tuition.' },
        { my: 'မနက်ဖြန်ရော။', en: 'Tomorrow?' },
        { my: 'မနက်ဖြန် ကျူရှင် နှစ်ခု။', en: 'Tomorrow, two tuitions.' },
      ] },
      { id: 'fun:exercise:p2', who: ['*', '*'], lines: [
        { my: 'စာမေးပွဲ ဘယ်လိုနေလဲ။', en: 'How was the exam?' },
        { my: 'မေးခွန်း အကုန် ဖြေခဲ့တယ်။', en: 'I answered every question.' },
        { my: 'မှန်ရဲ့လား။', en: 'Correctly?' },
        { my: 'အဲဒါ မေးခွန်းထဲ မပါဘူး။', en: "That wasn't one of the questions." },
      ] },
      { id: 'fun:exercise:p3', who: ['*', '*'], lines: [
        { my: 'ဘာသောက်မလဲ။', en: 'What will you have?' },
        { my: 'ချိုဆိမ့်၊ ချိုနည်း၊ ဆိမ့်များ၊ ကျကျ။', en: 'Sweet-creamy, less sweet, extra milk, extra strong.' },
        { my: 'အဲဒါ လက်ဖက်ရည်လား၊ ကဗျာလားဟ။', en: 'Is that a tea or a poem?' },
      ] },
      { id: 'fun:exercise:p4', who: ['*', '*'], lines: [
        { my: 'ကောက်ညှင်းပေါင်း တစ်ထုပ် ဘယ်လောက်လဲ။', en: 'How much for a sticky-rice packet?' },
        { my: 'နှစ်ရာ။', en: 'Two hundred.' },
        { my: 'သုံးထုပ် ငါးရာ ရမလား။', en: 'Three for five hundred?' },
        { my: 'ရတယ်။ သုံးထုပ်မြောက်က သေးမယ်။', en: 'Fine. The third one will be smaller.' },
      ] },
      { id: 'fun:exercise:p5', who: ['*', '*'], lines: [
        { my: 'အမေ၊ ဆရာမမှာရော အမေ ရှိလား။', en: 'Mum, does Teacher have a mum?' },
        { my: 'ရှိတာပေါ့။', en: 'Of course.' },
        { my: 'သူ့အမေကလည်း "စာကျက်" လို့ ပြောလား။', en: 'Does her mum tell her to study too?' },
        { my: 'နေ့တိုင်းပဲတဲ့။', en: 'Every day, apparently.' },
      ] },
      { id: 'fun:exercise:p6', who: ['*', '*'], lines: [
        { my: 'ဒီအိုး ဘာအတွက်လဲ။', en: "What's this pot for?" },
        { my: 'ရေထည့်ဖို့။', en: 'Water.' },
        { my: 'အောက်မှာ အပေါက် ရှိတယ်။', en: "There's a hole in the bottom." },
        { my: 'ဒါဆို ပန်းအိုးပေါ့။', en: "Then it's a flowerpot." },
      ] },
      { id: 'fun:exercise:p7', who: ['*', '*'], lines: [
        { my: 'သားက ဘယ်နှစ်တန်း ရောက်ပြီလဲ။', en: 'Which grade is your boy in now?' },
        { my: 'ငါးတန်း။', en: 'Fifth.' },
        { my: 'အတန်းထဲ ဘယ်နှစ်ယောက်မြောက်လဲ။', en: 'And his place in class?' },
        { my: 'ထမင်းစားချိန်ဆို ပထမ။', en: 'At lunchtime? First.' },
      ] },
      { id: 'fun:exercise:p8', who: ['*', '*'], lines: [
        { my: 'မိုးတိတ်မှ ပြန်မယ်။', en: "I'll go when the rain stops." },
        { my: 'မိုးတိတ်ပြီလေ။', en: "It's stopped." },
        { my: 'ဒါဆို လက်ဖက်ရည် ကုန်မှ ပြန်မယ်။', en: "Then I'll go when my tea's finished." },
        { my: 'နင့်ခွက် ကုန်နေတာ တစ်နာရီ ရှိပြီ။', en: "Your cup's been empty for an hour." },
      ] },
    ],
    rooms: {
      quartertea: [
        { id: 'fun:exercise:28', my: 'ဒီဆိုင်မှာ သတင်းက လက်ဖက်ရည်ထက် မြန်မြန် ရောက်တယ်။', en: 'In this shop the gossip arrives faster than the tea.', job: ['drinker', 'drinker2'] },
        { id: 'fun:exercise:29', my: '"ခဏထိုင်မယ်" ဆိုတဲ့ ဖောက်သည်က မနက်ကနေ ညနေထိပဲ။', en: 'The customer who said "just a quick one" has been here since morning.', job: 'teamaster' },
        { id: 'fun:exercise:30', my: 'ဖောက်သည်တိုင်း ကိုယ်ပိုင် အမှာ ရှိတယ်။ တစ်ယောက်ကတော့ "ဦးလေး သဘော" တဲ့။', en: 'Every customer has their own order. One just says, "However you like, Uncle."', job: 'teamaster' },
        { id: 'fun:exercise:31', my: 'ဘောလုံးပွဲ အကြောင်း ဒီမှာ ငြင်းတာ ပွဲထက်တောင် ပိုကြာတယ်။', en: 'Arguing about the match in here takes longer than the match did.', job: ['drinker', 'drinker2'] },
      ],
    },
  },

  // =====================================================================================================
  // ENVELOPE ROAD
  // =====================================================================================================
  envelope: {
    town: [
      { id: 'fun:envelope:1', my: 'ကြက်ဥခြင်းနဲ့ ဒီလမ်း ဆင်းရင် ချိုင့်တိုင်းမှာ ကြက်ဥတွေကို တောင်းပန်ရတယ်။', en: 'Carrying eggs down this road, I apologise to them at every pothole.' },
      { id: 'fun:envelope:2', my: 'လမ်းမေးတော့ "ဟိုနားလေးပဲ" တဲ့။ လက်ညှိုးထိုးပြတာ တောင်ကြီးကို။', en: 'I asked the way. "Just over there," he said, pointing at a mountain.' },
      { id: 'fun:envelope:3', my: 'မိုးတွင်း ဒီလမ်းလျှောက်ရင် ဘွတ်ဖိနပ် အလကား ရတယ်။ ရွှံ့ဘွတ်ဖိနပ်လေ။', en: 'Walk this road in the monsoon and you get free boots. Mud boots.' },
      { id: 'fun:envelope:4', my: 'ဆိတ်က ငါ့စာအိတ်ကို စားသွားတယ်။ စာဖတ်ချင်လို့ ထင်ပါတယ်။', en: 'The goat ate my envelope. I think it wanted to read.', age: 'child' },
      { id: 'fun:envelope:5', my: 'ဆိတ်ကို နာမည်ခေါ်ရင် လှည့်မကြည့်ဘူး။ မုန့်ထုပ် ဖောက်သံ ကြားရင် ပြေးလာတယ်။', en: 'The goat ignores its name. Rustle a snack packet and it comes running.' },
      { id: 'fun:envelope:6', my: 'ကြက်မက ဥ တစ်လုံး ဥရင် တစ်ရွာလုံး ကြားအောင် အော်တယ်။ ငါ ညစာ တစ်ဝိုင်းလုံး ချက်တာ ဘာမှ မပြောဘူး။', en: 'The hen lays one egg and tells the whole village. I cook a whole dinner and say nothing.' },
      { id: 'fun:envelope:7', my: 'ဖုန်းဘေလ် ဖြည့်ဖို့ ဆိုင်ထိ လမ်းလျှောက်လာတယ်။ ရောက်မှ ဖုန်း မေ့ခဲ့မှန်း သိတယ်။', en: 'Walked all the way to top up my phone. Got there and found I had left the phone at home.' },
      { id: 'fun:envelope:8', my: 'ဒီလမ်းမှာ ဖုန်းလိုင်းမိဖို့ ကျောက်တုံးပေါ် ခြေတစ်ဖက်နဲ့ ရပ်ရတယ်။', en: 'For a phone signal on this road, you stand on the rock. On one foot.' },
      { id: 'fun:envelope:9', my: 'ကားစောင့်ရင်း စကားပြောနေလို့ ကား နှစ်စီး လွတ်သွားတယ်။', en: 'Waiting for the bus, I missed two. I was busy chatting.' },
      { id: 'fun:envelope:10', my: 'စက်ဘီး ဘီးပေါက်တာ သူ နားချင်လို့ ထင်တယ်။ ငါလည်း နားချင်နေတာ။', en: 'I think my bike got a flat because it wanted a rest. So did I.' },
      { id: 'fun:envelope:11', my: 'တာယာ လှိမ့်ပြိုင်တာ။ တာယာက ပထမ၊ ငါက ဒုတိယ၊ ညီလေးက ငိုရင်း တတိယ။', en: 'Tyre race: the tyre came first, I came second, my little brother came third, crying.', age: 'child' },
      { id: 'fun:envelope:12', my: 'ထီးမပါတဲ့နေ့ မိုးရွာတယ်။ ထီးပါတဲ့နေ့ နေပူတယ်။ မိုးက ငါ့ကို စောင့်ကြည့်နေတာ။', en: 'No umbrella, it rains. Bring one, sunshine. The sky is watching me.' },
      { id: 'fun:envelope:13', my: 'စာရေးပြီး စာအိတ် ပိတ်လိုက်တယ်။ ပိတ်ပြီးမှ အရေးကြီးတာ ရေးဖို့ မေ့ခဲ့မှန်း သိရတယ်။', en: 'Wrote the letter and sealed it. Then remembered the important part.' },
      { id: 'fun:envelope:14', my: 'အမေ့ဆီ "နေကောင်းတယ်" လို့ပဲ စာရေးတယ်။ အမေက "ဘာဖြစ်လို့လဲ" တဲ့။', en: 'I wrote to Mum, "I am fine." She wrote back, "What happened?"' },
      { id: 'fun:envelope:15', my: 'ဒေါ်လေးက လာမယ်လို့ ဖုန်းဆက်တယ်။ ဖုန်းချတာနဲ့ တံခါးခေါက်သံ ကြားတယ်။', en: 'Aunty phoned to say she was coming. I hung up and she knocked on the door.' },
      { id: 'fun:envelope:16', my: 'လှည်းပေါ်မှာ လူခြောက်ယောက်၊ ကြက်နှစ်ကောင်၊ ဆန်တစ်အိတ်။ နွားကတော့ မျက်နှာ မကောင်းဘူး။', en: 'Six people, two hens and a sack of rice on one cart. The ox does not look pleased.' },
      { id: 'fun:envelope:17', my: 'ကုန်စုံဆိုင်မှာ အကုန်ရှိတယ်တဲ့။ ငါ လိုချင်တာကျတော့ "မနက်ဖြန် ရောက်မယ်" တဲ့။', en: 'The sundries shop has everything. Except what I need. That comes "tomorrow".' },
      { id: 'fun:envelope:18', my: '"ဘာမှ မဝယ်ဘူး" ဆိုပြီး ဈေးသွားတာ။ ပြန်လာတော့ လက်နှစ်ဖက်လုံး ပြည့်နေပြီ။', en: 'I set off to market saying "not buying anything". I come back with both hands full.' },
      { id: 'fun:envelope:19', my: 'ငယ်ငယ်က ဒီလမ်း ပြေးတက်တာ။ အခု လမ်းက ပိုမတ်လာတယ်။ လမ်းကပဲ ပြောင်းတာ။', en: 'When I was young I ran up this road. It has got steeper since. The road changed, not me.', age: 'elder' },
      { id: 'fun:envelope:20', my: 'ဒီလမ်းက ခွေးက လူတိုင်းကို အမြီးခါပြတယ်။ ဆိုင်ကယ်ကိုတော့ မုန်းတယ်။', en: 'The dog on this road wags at everyone. Motorbikes, it cannot stand.' },
      { id: 'fun:envelope:21', my: 'ကွမ်းယာဆိုင်က ဦးလေးက လမ်းတိုင်း သိတယ်။ သူကိုယ်တိုင်တော့ ဘယ်မှ မသွားဖူးဘူး။', en: 'The betel-stall uncle knows every road. He has never been down one.' },
      { id: 'fun:envelope:22', my: 'ညနေ ဒီသစ်ပင်အောက် ထိုင်ရင် ခြင်တွေ စားသောက်ပွဲ လုပ်ကြတယ်။ ဟင်းက ငါပေါ့။', en: 'Sit under this tree at dusk and the mosquitoes throw a feast. I am the main dish.' },
      { id: 'fun:envelope:23', my: 'မုန့်ဟင်းခါးဆိုင်ရှေ့ ဖြတ်ရင် ခြေထောက်က အလိုလို ရပ်သွားတယ်။', en: 'Walk past a mohinga stall and your feet stop all by themselves.' },
      { id: 'fun:envelope:24', my: 'ဈေးဝယ်စာရင်း ရေးခဲ့တယ်။ စာရင်းက အိမ်မှာ၊ ငါက ဒီမှာ။', en: 'I wrote a shopping list. The list is at home. I am here.' },
      { id: 'fun:envelope:25', my: 'စာအိတ်လမ်း ဆိုတော့ တံဆိပ်ခေါင်း ကပ်ပြီးမှ လျှောက်ရမှာလား။', en: "It's the envelope road. Do I need a stamp to walk on it?", age: 'child' },
    ],
    pairs: [
      { id: 'fun:envelope:p1', who: ['*', '*'], lines: [
        { my: 'ဦးလေး၊ ဆိုက်ကား ရသေးလား။', en: 'Uncle, room in the trishaw?' },
        { my: 'ရတယ်။ ခြေထောက် တစ်ဖက်ပဲ တင်ထား။', en: 'Sure. Put one leg in.' },
        { my: 'ကျန်တဲ့ ခြေထောက်ရော။', en: 'And the other leg?' },
        { my: 'နောက်တစ်ခေါက်မှ လိုက်ခဲ့။', en: 'It can come on the next trip.' },
      ] },
      { id: 'fun:envelope:p2', who: ['*', '*'], lines: [
        { my: 'ဒီထီး ဘယ်လောက်လဲ။', en: 'How much for this umbrella?' },
        { my: 'ငါးထောင်။', en: 'Five thousand.' },
        { my: 'နှစ်ထောင်။', en: 'Two thousand.' },
        { my: 'ဒါဆို လက်ကိုင်ပဲ ယူသွား။', en: 'Then take the handle.' },
      ] },
      { id: 'fun:envelope:p3', who: ['*', '*'], lines: [
        { my: 'ကား ဘယ်တော့ ထွက်မလဲ။', en: 'When does the bus leave?' },
        { my: 'လူပြည့်ရင်။', en: 'When it is full.' },
        { my: 'ပြည့်နေပြီလေ။', en: "It's full." },
        { my: 'စပယ်ယာကတော့ မပြည့်သေးဘူးတဲ့လေ။', en: "The conductor says it isn't yet." },
      ] },
      { id: 'fun:envelope:p4', who: ['*', '*'], lines: [
        { my: 'ဆိတ်က ငါ့ကို ကြည့်နေတယ်။', en: 'The goat is staring at me.' },
        { my: 'နင့်အင်္ကျီက အစိမ်းရောင်ကြီးကိုး။', en: 'Your shirt is green.' },
        { my: 'ဒါ ဘာဖြစ်လဲ။', en: 'So?' },
        { my: 'သူ့အတွက် နင်က အသုပ်တစ်ပွဲပဲ။', en: "To her, you're a salad." },
      ] },
      { id: 'fun:envelope:p5', who: ['*', '*'], lines: [
        { my: 'ဒီစာ ဘယ်တော့ ရောက်မလဲ။', en: 'When will this letter arrive?' },
        { my: 'သုံးရက်လောက်။', en: 'About three days.' },
        { my: 'ငါ ကိုယ်တိုင် လျှောက်သွားရင် နှစ်ရက်ပဲ။', en: 'If I walked it there myself, two.' },
        { my: 'ဒါဆို နင့်ကိုပါ စာအိတ်ထဲ ထည့်ပို့လိုက်မယ်။', en: "Then I'll post you along with it." },
      ] },
      { id: 'fun:envelope:p6', who: ['*', '*'], lines: [
        { my: 'ဘာလို့ ဖုန်းချလိုက်တာလဲ။', en: 'Why did you hang up on me?' },
        { my: 'မချပါဘူး။ ဖုန်းဘေလ် ကုန်သွားတာ။', en: "I didn't. My credit ran out." },
        { my: 'ဒါဆို ငါ ပြန်ဆက်မယ်။', en: "Then I'll call you back." },
        { my: 'ကောင်းတယ်။ ပြောစရာ အများကြီး ကျန်သေးတယ်။', en: 'Good. I have loads left to say.' },
      ] },
      { id: 'fun:envelope:p7', who: ['*', '*'], lines: [
        { my: 'ငါ့စက်ဘီး ဘရိတ် မကောင်းဘူး။', en: 'My bike brakes are bad.' },
        { my: 'ဒါဆို ဘယ်လို ရပ်လဲ။', en: 'So how do you stop?' },
        { my: 'ချိုင့်ထဲ ကျမှ ရပ်တယ်။', en: 'I wait for a pothole.' },
      ] },
    ],
    areas: {
      sundryShop: {
        at: { x: 3, z: 240.5, r: 4 },
        lines: [
          { id: 'fun:envelope:26', my: 'ဆိုင်ရှင်က ငါ့အမေ နာမည်၊ အဘွား နာမည်၊ ကြောင် နာမည်ပါ သိတယ်။', en: "The shopkeeper knows my mum's name, my gran's name, even the cat's." },
          { id: 'fun:envelope:27', my: 'အကြွေ မရှိလို့ သကြားလုံး ပြန်အမ်းတယ်။ အိတ်ထဲမှာ သကြားလုံး နှစ်ဆယ် ရှိနေပြီ။', en: 'No small change, so I get sweets instead. I have twenty sweets in my bag now.' },
          { id: 'fun:envelope:28', my: 'ငှက်ပျောသီး တစ်ဖီး ဝယ်ရင် ဆိုင်ရှင်ရဲ့ ဘဝဇာတ်လမ်းပါ အလကား ရတယ်။', en: "Buy a hand of bananas here and you get the shopkeeper's life story free." },
          { id: 'fun:envelope:29', my: 'ဆန်လည်း ရှိ၊ ဆပ်ပြာလည်း ရှိ၊ ဆိုင်ကယ်ဘီးလည်း ရှိ။ ဘယ်လို ဆံ့လဲ မသိဘူး။', en: 'Rice, soap, motorbike tyres. How does it all fit in there?' },
          { id: 'fun:envelope:30', my: '"ခဏစောင့်" ဆိုပြီး ဆိုင်ရှင် နောက်ဖေး ဝင်သွားတာ။ ထမင်းစားပြီးမှ ပြန်ထွက်လာတယ်။', en: 'The shopkeeper said "one moment" and went out the back. She came out again with lunch finished.' },
          { id: 'fun:envelope:31', my: 'ကြွက်ထောင်ချောက် ဝယ်မလို့။ ဆိုင်က ကြောင်က မကျေမနပ် ကြည့်တယ်။ သူ့အလုပ် ပြုတ်မှာ စိုးလို့လေ။', en: 'Came to buy a mouse trap. The shop cat gave me a look. Its job is at stake.' },
        ],
      },
    },
  },

  // =====================================================================================================
  // MARKET
  // =====================================================================================================
  market: {
    town: [
      { id: 'fun:market:1', my: 'နာရီဝက် ဈေးဆစ်ပြီး ငါးဆယ် လျှော့ရတယ်။ အောင်ပွဲပဲ။', en: 'Haggled for half an hour and got fifty off. A victory.' },
      { id: 'fun:market:2', my: 'ဖောက်သည် ထွက်သွားရင် နောက်က လှမ်းခေါ်ရတယ်။ "ကဲပါ၊ ယူသွား ယူသွား"။', en: "When a buyer walks off, you call after them: 'Fine, take it, take it.'", job: 'vendor' },
      { id: 'fun:market:3', my: 'ဈေးထဲ ခဏလေး ဝင်မယ် ဆိုတာ သုံးနာရီ ရှိနေပြီ။', en: "I popped into the market 'for a minute'. That was three hours ago." },
      { id: 'fun:market:4', my: 'ဈေးသည်က ချိုချိုသာသာ လှမ်းခေါ်လို့ ခရမ်းချဉ်သီး နှစ်ပိဿာ ဝယ်မိသွားရော။', en: 'The seller called out so sweetly, I ended up with two viss of tomatoes.' },
      { id: 'fun:market:5', my: 'အမေ ဈေးဆစ်ရင် ငါ ဟိုဘက် လှည့်နေလိုက်တယ်။ မသိသလိုပေါ့လေ။', en: "When Mum haggles I look the other way. Like I don't know her.", age: 'child' },
      { id: 'fun:market:6', my: 'အမေက ဈေးဆစ်ခိုင်းလို့ "ဈေးတိုးပေးပါ" လို့ ပြောမိသွားတယ်။', en: "Mum told me to haggle. I said, 'Please make it more.'", age: 'child' },
      { id: 'fun:market:7', my: 'ချိန်ခွင်က အမှန်ပဲ ပြောတယ်။ ဒါကြောင့် ဘယ်သူမှ မချစ်ကြတာ။', en: "The scale only ever tells the truth. That's why nobody loves it.", job: 'vendor' },
      { id: 'fun:market:8', my: 'ဖောက်သည်က "ပြန်ချိန်ပါ" တဲ့။ ပြန်ချိန်တော့ ပိုတောင် လေးလာတယ်။', en: "A customer said, 'Weigh it again.' It came out heavier.", job: 'vendor' },
      { id: 'fun:market:9', my: 'ဆမူဆာ တစ်ခုပဲ စားမယ်လို့ ဆုံးဖြတ်ထားတာ။ ဆမူဆာတွေက မသိဘူးလေ။', en: "I'd decided on just one samosa. Nobody told the samosas." },
      { id: 'fun:market:10', my: 'ဦးလေးက ကွမ်း ငုံထားတော့ "ဟုတ်" နဲ့ "မဟုတ်" အသံ တူတူပဲ။', en: "Uncle has betel in his cheek. His 'yes' and his 'no' sound exactly the same." },
      { id: 'fun:market:11', my: '"နည်းနည်းပဲ ညှပ်ပါ" တဲ့။ ငါ့ "နည်းနည်း" နဲ့ သူ့ "နည်းနည်း" မတူဘူး။', en: "'Just a little off,' they say. My 'little' and theirs are never the same.", job: 'uncle' },
      { id: 'fun:market:12', my: '"မနက်ဖြန် ရမယ်" လို့ ကတိပေးတယ်။ ဘယ်မနက်ဖြန်လဲတော့ မပြောဘူး။', en: "I promise 'ready tomorrow'. I never say which tomorrow.", job: 'vendor' },
      { id: 'fun:market:13', my: 'လှည်းပြီးတာနဲ့ လေက သစ်ရွက်တွေ ပြန်ပို့ပေးတယ်။ စေတနာ ကောင်းလိုက်တာနော်။', en: 'The moment I finish sweeping, the wind brings the leaves back. So thoughtful.', job: 'aunty' },
      { id: 'fun:market:14', my: 'ကွင်းက ငါ့ထက် မြန်တယ်။ ငါက နောက်က လိုက်ရတာ။', en: "The hoop's faster than me. I'm the one doing the chasing.", job: 'kid' },
      { id: 'fun:market:15', my: 'တွေ့တဲ့ အဒေါ်တိုင်း "အိမ်ထောင် ဘယ်တော့ ပြုမှာလဲ" တဲ့။ ငါ ကြက်သွန် ဝယ်ရုံ လာတာပါ။', en: "Every aunty I meet asks when I'm getting married. I only came for onions.", age: ['teen', 'adult'] },
      { id: 'fun:market:16', my: 'အဒေါ်က "ဘယ်သွားမလို့လဲ"။ ပြီးတော့ "ဘာလုပ်ဖို့လဲ"။ ပြီးတော့ "ဘယ်တော့ ပြန်မလဲ"။', en: "Aunty asks where I'm going. Then what for. Then when I'll be back." },
      { id: 'fun:market:17', my: 'ဗီဒီယို အကောင်းဆုံးနေရာ ရောက်ခါနီး ဒေတာ ကုန်သွားရော။ ဇာတ်သိမ်း ကိုယ့်ဘာသာ စိတ်ကူးလိုက်တယ်။', en: 'My data ran out just before the best bit. I made up the ending myself.' },
      { id: 'fun:market:18', my: 'ငါ့စွန်ကို အဖေက ငါ့ထက် ပိုပျော်ပြီး လွှတ်နေတယ်။ ကြိုး ပြန်မပေးဘူး။', en: "Dad's enjoying my kite more than I am. He won't give the string back.", age: 'child' },
      { id: 'fun:market:19', my: 'ဈေးထဲက ခွေးက လူတိုင်းကို ချစ်တယ်။ စာပို့သမားကလွဲလို့။', en: 'The market dog loves everyone. Except the postman.' },
      { id: 'fun:market:20', my: 'ဘေးဆိုင် ငှားသွားတဲ့ ကတ်ကြေး ပြန်ရပြီ။ သုံးနှစ်ပဲ ကြာတယ်။', en: 'The scissors the next stall borrowed came back. Only took three years.', job: 'vendor' },
      { id: 'fun:market:21', my: 'ဘာဝယ်ဖို့ လာတာလဲ မေ့သွားပြီ။ အိမ်ရောက်တာနဲ့ ပြန်မှတ်မိမှာ သေချာတယ်။', en: "Forgot what I came to buy. I'll remember the second I get home." },
      { id: 'fun:market:22', my: 'ဆိုင်စောင့်ခိုင်းတယ်။ ဖောက်သည် လာတော့ "အမေ မရှိဘူး" လို့ ပြောလိုက်တယ်။', en: "I was told to mind the stall. A customer came, so I said, 'Mum's not here.'", age: 'child' },
      { id: 'fun:market:23', my: 'ဈေးထဲမှာ အရောင်းရဆုံး ဆိုင်က လက်ဖက်ရည်ဆိုင်ပဲ။ ဈေးဝယ်ရတာ ပင်ပန်းတယ်လေ။', en: 'The busiest stall in the market is the tea shop. Shopping is exhausting.' },
      { id: 'fun:market:24', my: 'ကြက်တွန်သံနဲ့ ငါ နိုးတယ်။ ငါ့အော်သံနဲ့ ဖောက်သည်တွေ နိုးတယ်။', en: 'The rooster wakes me. My shouting wakes the customers.', job: 'vendor' },
    ],
    pairs: [
      { id: 'fun:market:p1', who: ['*', 'vendor'], lines: [
        { my: 'နောက်ဆုံးဈေး ပြောပါ။', en: 'Your final price?' },
        { my: 'နှစ်ထောင်။', en: 'Two thousand.' },
        { my: 'တကယ့် နောက်ဆုံးလား။', en: 'The really final one?' },
        { my: 'နောက်ဆုံးဈေးက တစ်ခုပဲ ရှိတယ်။ နင် မေးနေတာ ငါးခါ ရှိပြီ။', en: "There's only one final price. You've asked for it five times." },
      ] },
      { id: 'fun:market:p2', who: ['*', '*'], lines: [
        { my: 'ချိုဆိမ့် တစ်ခွက်၊ ကျဆိမ့် တစ်ခွက်၊ ပေါ့ကျ တစ်ခွက်။', en: 'One sweet-creamy, one strong-creamy, one light-strong.' },
        { my: 'သုံးယောက်လား။', en: 'For three?' },
        { my: 'ငါ တစ်ယောက်တည်း။ မဆုံးဖြတ်နိုင်လို့။', en: "Just me. I couldn't decide." },
      ] },
      { id: 'fun:market:p3', who: ['*', '*'], lines: [
        { my: 'သူငယ်ချင်းက "ရောက်ခါနီးပြီ" တဲ့။', en: "My friend says she's 'nearly here'." },
        { my: 'ဘယ်တုန်းက ပြောတာလဲ။', en: 'When did she say that?' },
        { my: 'နာရီဝက် ရှိပြီ။ ဖုန်းထဲမှာ ရေချိုးသံ ကြားရတယ်။', en: 'Half an hour ago. I could hear a shower running on the phone.' },
      ] },
      { id: 'fun:market:p4', who: ['aunty', '*'], lines: [
        { my: 'ဒါနဲ့၊ အိမ်ထောင် ဘယ်တော့ ပြုမှာလဲ။', en: 'So. When are you getting married?' },
        { my: 'အဒေါ့် ထဘီလေး လှလိုက်တာနော်။', en: 'Aunty, what a lovely sarong!' },
        { my: 'စကား မလွှဲနဲ့။ …ဒါပေမဲ့ ဟုတ်တယ်၊ အသစ်လေ။', en: "Don't change the subject. …But yes, it's new." },
      ] },
      { id: 'fun:market:p5', who: ['*', '*'], lines: [
        { my: 'ထမင်း ဘယ်လောက် ချက်ရမလဲ။', en: 'How much rice should I cook?' },
        { my: 'ဧည့်သည် နှစ်ယောက်ပဲ လာမှာ။', en: 'Only two guests are coming.' },
        { my: 'ဒါဆို အိုးကြီး နှစ်လုံး။', en: 'Two big pots, then.' },
        { my: 'နင် နင့်အမေနဲ့ တစ်ပုံစံတည်းပဲ။', en: "You're exactly like your mother." },
      ] },
      { id: 'fun:market:p6', who: ['kid', 'vendor'], age: ['child', ['adult', 'elder']], lines: [
        { my: 'ဒီပန်းသီး ဘယ်လောက်လဲဟင်။', en: 'How much is this apple?' },
        { my: 'နှစ်ရာ။', en: 'Two hundred.' },
        { my: 'ငါးဆယ်ပဲ ပါတယ်။ လေးပုံတစ်ပုံ ရမလား။', en: "I've only got fifty. Can I have a quarter?" },
        { my: 'ရော့၊ တစ်လုံးလုံး ယူသွား။ သင်္ချာ တော်လို့ ဆုချတာ။', en: 'Here, take the whole thing. A prize for good maths.' },
      ] },
      { id: 'fun:market:p7', who: ['*', '*'], lines: [
        { my: 'ဒူးရင်းသီး ဆိုက်ကားပေါ် တင်လို့ ရမလား။', en: 'Can I take a durian on the trishaw?' },
        { my: 'ရတယ်။ ဒူးရင်းက ထိုင်ခုံပေါ်။', en: 'Sure. The durian gets the seat.' },
        { my: 'ငါကရော။', en: 'And me?' },
        { my: 'နောက်က လမ်းလျှောက် လိုက်ခဲ့ပေါ့။', en: 'You walk behind.' },
      ] },
      { id: 'fun:market:p8', who: ['*', '*'], lines: [
        { my: 'ငါ့ထီး နင့်ဆီမှာ ရှိလား။', en: 'Have you got my umbrella?' },
        { my: 'ဘယ်ထီးလဲ။', en: 'Which umbrella?' },
        { my: 'အခု နင် ဆောင်းထားတဲ့ ထီး။', en: 'The one over your head right now.' },
      ] },
      { id: 'fun:market:p9', who: ['*', '*'], lines: [
        { my: 'မုန့်ဟင်းခါးမှာ ပဲကြော် ထည့်မလား၊ ဘဲဥ ထည့်မလား။', en: 'Mohinga: fritters or boiled egg?' },
        { my: 'နှစ်မျိုးလုံး။', en: 'Both.' },
        { my: 'တစ်မျိုးပဲ ရွေးရမယ် ဆိုရင်ရော။', en: 'And if you could only pick one?' },
        { my: 'ဒါဆို နှစ်ပွဲ စားမယ်။', en: "Then I'll have two bowls." },
      ] },
    ],
    areas: {
      teaSquare: {
        at: { x: 18.5, z: 316.5, r: 8 },
        lines: [
          { id: 'fun:market:25', my: 'မနက်က ထိုင်တဲ့ ဦးလေး အခုထိ ရှိတုန်း။ ခွက်ထဲမှာ နည်းနည်း ကျန်သေးလို့တဲ့။', en: "The uncle who sat down this morning is still here. Says there's a little left in his cup." },
          { id: 'fun:market:26', my: 'ရေနွေးကြမ်း ဆယ်ခါ ဖြည့်ပြီးပြီ။ လက်ဖက်ရည်ကတော့ တစ်ခွက်တည်း။', en: 'Ten refills of plain tea. Still on the same one cup.' },
          { id: 'fun:market:27', my: 'ဒီဆိုင် လက်ဖက်ရည် ချိုလွန်းတယ်။ သေချာအောင် နောက်တစ်ခွက် သောက်ကြည့်ဦးမယ်။', en: "The tea here's too sweet. I'd better have another to be sure." },
          { id: 'fun:market:28', my: 'စားပွဲထိုးက ငါ့နာမည် မသိဘူး။ "ပေါ့ကျ" လို့ပဲ ခေါ်တယ်။', en: "The tea boy doesn't know my name. He just calls me 'Light-strong'." },
          { id: 'fun:market:29', my: 'စားပွဲထိုးလေး ခွက်ဆယ်ခွက် တစ်ခါတည်း သယ်တယ်။ ကြည့်ရင်း ငါ အသက်ရှူ မေ့သွားတယ်။', en: 'The tea boy carries ten cups at once. Watching him, I forget to breathe.' },
          { id: 'fun:market:30', my: 'ဆိုင်ရှင်က အမြင့်ကြီးက လောင်းတာ တစ်စက်မှ မဖိတ်ဘူး။ ငါ သောက်တော့ အင်္ကျီပေါ် ကျကုန်တယ်။', en: "The owner pours from way up high and never spills a drop. I drink it and it's down my shirt." },
        ],
      },
    },
  },

  // =====================================================================================================
  // WHARF
  // =====================================================================================================
  wharf: {
    town: [
      { id: 'fun:wharf:1', my: 'လူနှစ်ယောက် တင်တာ။ ခြင်း သုံးလုံး၊ ကြက် တစ်ကောင်၊ အဒေါ် တစ်ယောက်ပါ ထပ်ပါလာတယ်။', en: 'I took two passengers. Three baskets, a hen and an aunty came along too.', job: 'uncle' },
      { id: 'fun:wharf:2', my: 'ဆိုက်ကား နင်းတာ အားကစားပဲ။ ဆုတံဆိပ်တော့ မရဘူး။', en: 'Pedalling a trishaw is a sport. Just no medals.', job: 'uncle' },
      { id: 'fun:wharf:3', my: '"နီးနီးလေးပါ" ဆိုတဲ့ ခရီးသည်က အဝေးဆုံး သွားတတ်တယ်။', en: "The passenger who says 'it's just close' always goes furthest.", job: 'uncle' },
      { id: 'fun:wharf:4', my: 'ငါးမျှားရင် စိတ်ရှည်ရတယ်။ ငါးတွေကလည်း ငါ့လောက် စိတ်ရှည်တယ်။', en: 'Fishing takes patience. The fish have just as much.', job: 'fisher' },
      { id: 'fun:wharf:5', my: 'ငါးခြောက် လှန်းလိုက်တာနဲ့ ကြောင်တွေ တန်းစီလာတယ်။ အစောဆုံး ဖောက်သည်တွေ။', en: 'Spread fish out to dry and the cats line up. My earliest customers.', job: 'fisher' },
      { id: 'fun:wharf:6', my: 'ငါးခြောက်နံ့ ငါ မရတော့ဘူး။ ဘတ်စ်ကားပေါ်က လူတွေကတော့ ရတယ်။', en: "I can't smell the dried fish any more. People on the bus can.", job: 'fisher' },
      { id: 'fun:wharf:7', my: '"အဝတ် နည်းနည်းပဲ" တဲ့။ ထမ်းကြည့်တော့ ကျောက်တုံး ထည့်ထားသလား အောက်မေ့ရတယ်။', en: "'Just a few clothes,' they said. Lifting it, I'd swear it's rocks.", job: 'porter' },
      { id: 'fun:wharf:8', my: 'အိမ်ရောက်ရင် ငါ့ကျောက ငါ့ထက် အရင် အိပ်ပျော်တယ်။', en: 'When I get home, my back falls asleep before I do.', job: 'porter' },
      { id: 'fun:wharf:9', my: 'ရေတွင်းနားမှာ အဝတ်လျှော်ရင်း သတင်း အကုန်ရတယ်။ သတင်းစာ မလိုဘူး။', en: 'Washing at the well, you hear all the news. No paper needed.', job: 'aunty' },
      { id: 'fun:wharf:10', my: 'ရေတွင်းနားက ဆပ်ပြာ တစ်တုံး ပျောက်သွားတယ်။ ဘဲတွေကတော့ သန့်သန့်ပြန့်ပြန့်ပဲ။', en: 'A bar of soap went missing at the well. The ducks look awfully clean.', job: 'aunty' },
      { id: 'fun:wharf:11', my: 'ငါ ပြေးရင် ဘဲတွေ ပြေးတယ်။ ဘယ်သူ ဘယ်သူ့နောက် လိုက်နေမှန်း မသိတော့ဘူး။', en: "When I run, the ducks run. I can't tell who's following who.", job: 'kid' },
      { id: 'fun:wharf:12', my: 'ဘဲ တစ်ကောင် ပိုနေတယ်။ ပြန်ရေတော့ ငါ့ကိုယ်ငါပါ ထည့်ရေမိတာ။', en: "There was one duck too many. I'd counted myself.", job: 'kid' },
      { id: 'fun:wharf:13', my: 'စာရင်း တစ်ကျပ် လွဲနေလို့ ညလုံးပေါက် ရှာတာ။ ငါ့အင်္ကျီအိတ်ထဲမှာ ရောက်နေတယ်။', en: 'The books were one kyat out. Searched all night. It was in my shirt pocket.', job: 'uncle' },
      { id: 'fun:wharf:14', my: 'ဂိုဒေါင်ထဲက ကြွက်တွေက ငါ့ထက် ကုန်စာရင်း ပိုသိတယ်။', en: 'The rats in the godown know the stock better than I do.', job: 'porter' },
      { id: 'fun:wharf:15', my: 'ကြိုးကျစ်တာ မခက်ဘူး။ ကြိုးရှုပ်ကို ဖြေရတာ ခက်တာ။', en: "Making rope's easy. Untangling it is the real job.", job: 'fisher' },
      { id: 'fun:wharf:16', my: 'ပိုက်ကွန်ဆိုတာ အပေါက်တွေနဲ့ လုပ်ထားတာပဲ။ အပေါက်အသစ်တော့ မကြိုက်ဘူး။', en: "A net's made of holes. Just not new ones.", job: 'fisher' },
      { id: 'fun:wharf:17', my: 'လှေ ယိုတယ်လို့ လာပြောတာ။ ကြည့်တော့ ငါးပုံး ယိုနေတာ။', en: 'Someone said their boat was leaking. It was their fish bucket.', job: 'fisher' },
      { id: 'fun:wharf:18', my: '"ခဏနေ ပိုက်ဆံ ပေးမယ်" တဲ့။ အဲဒီ ခဏက သုံးလ ရှိနေပြီ။', en: "'I'll pay you in a minute,' he said. That minute is three months old." },
      { id: 'fun:wharf:19', my: 'အမျိုးသားက လှေပေါ်မှာ သီချင်းဆိုတယ်။ ငါးတွေ ပြေးကုန်တာ အဲဒါကြောင့်။', en: "My husband sings on the boat. That's why the fish run off.", job: 'aunty' },
      { id: 'fun:wharf:20', my: 'မြစ်ဘေးက ခြင်တွေ ကြီးလိုက်တာ။ တစ်ကောင်ဆို လှေပေါ်ကနေ ငါ့ကို လက်ပြသွားတယ်။', en: 'The river mosquitoes are huge. One waved at me from a boat.' },
      { id: 'fun:wharf:21', my: 'မြစ်လယ် ရောက်မှ ဖုန်းလိုင်း မိတယ်။ ငါးတွေ ဗီဒီယို ကြည့်နေလား မသိဘူး။', en: "Best phone signal's in the middle of the river. Maybe the fish are watching videos." },
      { id: 'fun:wharf:22', my: 'ကြီးရင် ကူးတို့ လှေသမား လုပ်မယ်။ နေ့တိုင်း အလကား စီးရမယ်။', en: "When I grow up I'll be a ferryman. Free rides every day.", age: 'child' },
      { id: 'fun:wharf:23', my: 'ငယ်ငယ်က ဒီမြစ်ကို ကူးခဲ့တာ။ အခု ဆိပ်ကမ်း လှေကား ဆင်းရင်တောင် မောနေပြီ။', en: 'When I was young I swam this river. Now the quay steps wind me.', age: 'elder' },
      { id: 'fun:wharf:24', my: 'ကူးတို့ ဆိုက်တာနဲ့ အမျိုးတွေ ဆင်းလာတယ်။ ကြိုမပြောဘဲ၊ ခြောက်ယောက်။', en: 'The ferry docked and off came the relatives. Unannounced. Six of them.' },
      { id: 'fun:wharf:25', my: 'ကြောင်က ငါးကို ကြည့်တယ်။ ငါက ကြောင်ကို ကြည့်တယ်။ ငါးကတော့ ဘယ်သူ့ကိုမှ မကြည့်ဘူး။', en: 'The cat watches the fish. I watch the cat. The fish watches nobody.' },
      { id: 'fun:wharf:26', my: 'နေထွက်တာ ကြည့်မယ်ဆိုပြီး နှိုးစက်ပေးထားတာ။ နေက နှိုးစက်ထက် စောထွက်သွားတယ်။', en: 'Set an alarm to watch the sunrise. The sun beat the alarm.' },
      { id: 'fun:wharf:27', my: 'ညနေ လက်ဖက်သုပ် စားမိတာ။ ညလုံးပေါက် ကြယ်တွေ ရေတွက်နေရတယ်။', en: "Had tea-leaf salad this evening. Now I'm up all night counting stars." },
      { id: 'fun:wharf:28', my: 'တစ်ယောက်က ဒူးရင်းသီး ကူးတို့ပေါ် တင်လာတယ်။ ကျန်တဲ့သူတွေ ရေကူးပြီး ကူးချင်သွားကြတယ်။', en: 'Someone brought a durian on the ferry. Everyone else wanted to swim across instead.' },
      { id: 'fun:wharf:29', my: 'ငါးရံ့က ပိုက်ထဲက ခုန်ထွက်သွားတယ်။ ငါ့ထက် အားကစား တော်တယ်။', en: 'A snakehead leapt right out of the net. Better athlete than me.', job: 'fisher' },
      { id: 'fun:wharf:30', my: 'အဖေက ဆိပ်ကမ်းမှာ အလေးဆုံး အိတ်ကို ထမ်းတယ်။ အိမ်မှာကျ အမှိုက်ပုံး မထမ်းဘူး။', en: "My dad carries the heaviest sacks on the quay. At home he won't carry the rubbish out.", age: 'child' },
    ],
    pairs: [
      { id: 'fun:wharf:p1', who: ['*', 'uncle'], lines: [
        { my: 'ဆိပ်ကမ်းထိ ဘယ်လောက်လဲ။', en: 'How much to the quay?' },
        { my: 'တစ်ထောင်။', en: 'A thousand.' },
        { my: 'ဆိပ်ကမ်းက ဟိုမှာ မြင်နေရတာပဲ။', en: "The quay's right there. I can see it." },
        { my: 'မြင်တာက အလကား။ ရောက်တာက တစ်ထောင်။', en: 'Seeing it is free. Getting there is a thousand.' },
      ] },
      { id: 'fun:wharf:p2', who: ['fisher', '*'], lines: [
        { my: 'ဒီနေ့ ငါး တစ်ကောင်မှ မရဘူး။', en: 'Not a single fish today.' },
        { my: 'အိမ်က ဈေးမှာ ဝယ်ထားပြီးပြီတဲ့။', en: 'Your other half already bought some at the market.' },
        { my: 'ဘယ်လို သိလဲ။', en: 'How did they know?' },
        { my: 'နင် လှေ ထွက်သွားကတည်းက ဝယ်တာ။', en: 'Bought it the moment you set off.' },
      ] },
      { id: 'fun:wharf:p3', who: ['*', '*'], lines: [
        { my: 'လှေ ပြည့်ပြီလား။', en: 'Is the boat full?' },
        { my: 'မပြည့်သေးဘူး။ တစ်ယောက်စာလောက် ဆံ့သေးတယ်။', en: 'Not yet. Room for one more.' },
        { my: 'ဆိပ်ပေါ်မှာ ဆယ်ယောက် စောင့်နေတယ်လေ။', en: 'There are ten people waiting on the jetty.' },
        { my: 'ဒါဆို တစ်ယောက်စီ ဆယ်ခါ ဆံ့မှာပေါ့။', en: "Then it's room for one more, ten times." },
      ] },
      { id: 'fun:wharf:p4', who: ['*', 'porter'], lines: [
        { my: 'ဒီအိတ် လေးလား။', en: 'Is that sack heavy?' },
        { my: 'လုံးဝ မလေးပါဘူး။', en: 'Not at all.' },
        { my: 'ဒါဆို မျက်နှာ ဘာလို့ နီနေတာလဲ။', en: "Then why's your face so red?" },
        { my: 'ညာလိုက်လို့ ရှက်တာ။', en: 'Embarrassed. I just lied.' },
      ] },
      { id: 'fun:wharf:p5', who: ['aunty', '*'], lines: [
        { my: 'အဝတ်လှန်းမလို့။ မိုးရွာမလား။', en: "I'm going to hang the washing. Will it rain?" },
        { my: 'နင် လှန်းရင်တော့ ရွာမှာပဲ။', en: 'If you hang it out, it will.' },
        { my: 'ဒါဆို လှန်းသလိုလို လုပ်ပြီး မိုးကို လှည့်စားလိုက်မယ်။', en: "Then I'll only pretend to, and trick the rain." },
      ] },
      { id: 'fun:wharf:p6', who: ['*', '*'], lines: [
        { my: 'ညက မီးပျက်တော့ ဘေးအိမ် မီးစက်သံနဲ့ အိပ်လို့မရဘူး။', en: "Power cut last night. Next door's generator kept me up." },
        { my: 'မီး ပြန်လာတော့ရော။', en: 'And when the power came back?' },
        { my: 'မီးစက်သံ တိတ်သွားလို့ လန့်နိုးတယ်။', en: 'The quiet woke me up with a fright.' },
      ] },
      { id: 'fun:wharf:p7', who: ['kid', '*'], age: ['child', ['adult', 'elder']], lines: [
        { my: 'ဘဲတွေကို ရေကူး ဘယ်သူ သင်ပေးတာလဲ။', en: 'Who taught the ducks to swim?' },
        { my: 'သူတို့ အမေပေါ့။', en: 'Their mum, of course.' },
        { my: 'ငါ့အမေကတော့ ရေထဲ မဆင်းရဘူးတဲ့။ ငါလည်း ဘဲပဲ ဖြစ်ချင်တော့တယ်။', en: "My mum won't let me in the water. I want to be a duck." },
      ] },
      { id: 'fun:wharf:p8', who: ['*', 'uncle'], lines: [
        { my: 'စာရင်း ကိုက်လား။', en: 'Do the books balance?' },
        { my: 'ကိုက်တယ်။ သုံးခါ ပြန်တွက်ပြီးပြီ။', en: 'They do. I added them up three times.' },
        { my: 'ဒါဆို ဘာလို့ မျက်နှာ မကောင်းတာလဲ။', en: 'Then why the long face?' },
        { my: 'သုံးခါလုံး အဖြေ မတူလို့။', en: 'Three different answers.' },
      ] },
    ],
    rooms: {
      weighhouse: [
        { id: 'fun:wharf:31', my: 'ချိန်ခွင်ပေါ် ဆော့တက်ကြည့်တာ။ စာရေးက ငါ့ကို ကုန်စာရင်းထဲ ထည့်မှတ်လိုက်တယ်။', en: 'Hopped on the scale for fun. The clerk logged me as cargo.', job: ['porterA', 'porterB', 'porterC'] },
        { id: 'fun:wharf:32', my: 'ဒီမှာ ဝန်ထမ်းတာ နှစ်ဆယ်နှစ်။ ဝန်တွေ မပေါ့လာဘူး။ ငါ သန်လာတာ။', en: 'Twenty years carrying here. The loads never got lighter. I got stronger.', job: ['porterA', 'porterB', 'porterC'] },
        { id: 'fun:wharf:33', my: 'ကုန်သည်က "ဂရုစိုက်၊ ကြွေထည်" တဲ့။ ဖွင့်ကြည့်တော့ ငါးခြောက်။', en: "The merchant said, 'Careful, it's china.' It was dried fish.", job: ['porterA', 'porterB', 'porterC'] },
        { id: 'fun:wharf:34', my: 'ငါ့ကြောင်လေးကို ချိန်ပေးပါ။ မနေ့ကထက် ငါး တစ်ကောင်စာ လေးလား သိချင်လို့။', en: "Please weigh my kitten. I want to know if she's one fish heavier than yesterday.", job: 'child' },
        { id: 'fun:wharf:35', my: 'ဈေးဆစ်ချင်တယ်။ ချိန်ခွင်နဲ့ကျ ဈေးဆစ်လို့ မရဘူး။', en: "I'd love to haggle. You can't haggle with a scale.", job: 'merchant' },
        { id: 'fun:wharf:36', my: 'ငါ့ခဲတံ ဘယ်သူ ယူသွားလဲ။ …ဪ၊ နားကြားမှာပါလား။', en: 'Who took my pencil? …Oh. Behind my ear.', job: 'clerk' },
      ],
    },
  },

  // =====================================================================================================
  // JUNCTION
  // =====================================================================================================
  junction: {
    town: [
      { id: 'fun:junction:1', my: 'မနေ့က သတင်းစာ ဖတ်ရတာ စိတ်အေးတယ်။ ဘာဆက်ဖြစ်မလဲ သိပြီးသားလေ။', en: "Yesterday's paper is so relaxing. I already know how it all turns out.", job: 'elder' },
      { id: 'fun:junction:2', my: 'မျက်မှန်ကို နာရီဝက်လောက် ရှာလိုက်ရတယ်။ လက်စသတ်တော့ ခေါင်းပေါ်တင်ထားတာကိုး။', en: 'Hunted for my glasses for half an hour. They were on my head.', age: 'elder' },
      { id: 'fun:junction:3', my: 'ဆီအိုး ဆူသံ ကြားတာနဲ့ ကလေးတွေ ရောက်လာတယ်။ ကျောင်းခေါင်းလောင်းထက် မြန်တယ်။', en: 'The sizzle of my oil brings the kids faster than the school bell.', job: 'vendor' },
      { id: 'fun:junction:4', my: 'ပဲကြော်ထုပ်တဲ့ သတင်းစာကို ဖတ်ရင်း စားတယ်။ ဆီစိမ့်နေတဲ့နေရာက အရေးအကြီးဆုံး သတင်းပဲ။', en: 'I read the paper my fritters came in. The oily bit is always the important story.' },
      { id: 'fun:junction:5', my: 'ဘရိတ် ကောင်းလွန်းတော့ စက်ဘီးက ရပ်တယ်၊ ငါက ဆက်သွားတယ်။', en: 'Brakes too good: the bike stopped, I kept going.', job: 'uncle' },
      { id: 'fun:junction:6', my: '"ဘရိတ် နည်းနည်း မကောင်းဘူး" တဲ့။ ကြည့်လိုက်တော့ ဘရိတ် လုံးဝ မပါဘူး။', en: "'The brakes are a bit off,' they said. There were no brakes at all.", job: 'uncle' },
      { id: 'fun:junction:7', my: 'စာမေးပွဲမှာ ခြောက်မှတ် ရတယ်။ အမေ့ကို ဇောက်ထိုး ပြလိုက်မယ်။', en: "Got six marks on the test. I'll show Mum upside down.", job: 'kid' },
      { id: 'fun:junction:8', my: 'ငါ့အသင်း နိုင်ရင် တစ်လမ်းလုံး လက်ဖက်ရည် တိုက်မယ် ပြောထားတာ။ ကံကောင်းလို့ ရှုံးသွားတယ်။', en: 'I promised the whole lane tea if my team won. Luckily, they lost.' },
      { id: 'fun:junction:9', my: 'ဒီနေ့ သတင်းစာမှာ အသံအကျယ်ဆုံး ကြက်ဖ အကြောင်း ပါတယ်။ ငါ့ကြက်ပဲ။ ဂုဏ်ယူတယ်။', en: "Today's paper has a piece on the loudest rooster. Mine. So proud." },
      { id: 'fun:junction:10', my: 'သတင်းစာ ကြော်ငြာမှာ "ကြောင် ပျောက်" တဲ့။ အဲဒီကြောင် ငါ့အိမ်မှာ ထမင်းစားနေတယ်။', en: "There's an ad in the paper: 'Lost cat'. That cat is eating dinner at my house." },
      { id: 'fun:junction:11', my: 'အမေ့ဆီ စာရေးထားတာ။ သွားပို့မယ့်နေ့ အမေ ကိုယ်တိုင် ရောက်လာလို့ လက်ထဲပဲ ထည့်ပေးလိုက်တယ်။', en: 'Wrote Mum a letter. The day I went to post it, she turned up, so I just handed it over.' },
      { id: 'fun:junction:12', my: 'စာပုံးထဲ ထည့်ပြီးမှ တံဆိပ်ခေါင်း မကပ်ရသေးမှန်း သတိရတယ်။', en: 'Only once it dropped in the box did I remember the stamp.' },
      { id: 'fun:junction:13', my: 'စက္ကူ ပေါ့တယ် ထင်လား။ စက္ကူ တစ်ထောင်ဆို ကျွဲ တစ်ကောင်ပဲ။', en: "Think paper's light? A thousand sheets is a buffalo.", job: 'uncle' },
      { id: 'fun:junction:14', my: 'စက်က တစ်မိနစ် စာရွက် တစ်ရာ ထုတ်တယ်။ ငါက တစ်မိနစ် မုန့် တစ်ခု။ အလုပ်များတာချင်း အတူတူပဲ။', en: "The press does a hundred sheets a minute. I do one snack a minute. We're both busy.", job: 'uncle' },
      { id: 'fun:junction:15', my: 'မင်နံ့ကို ငါ ကြိုက်တယ်။ ငါ့အင်္ကျီတွေကိုတော့ အမေ မကြိုက်ဘူး။', en: "I love the smell of ink. Mum doesn't love what it does to my shirts.", job: 'uncle' },
      { id: 'fun:junction:16', my: 'တံမြက်စည်း လှည်းတိုင်း ခွေးက လိုက်ကိုက်တယ်။ ကစားနေတယ် ထင်တာကိုး။', en: "Every sweep, the dog pounces on the broom. Thinks it's a game.", job: 'aunty' },
      { id: 'fun:junction:17', my: 'ဖျာ လှန်းတိုင်း ကြောင်က အရင်ဆုံး လာအိပ်တယ်။ ခြောက်မခြောက် စစ်ပေးတာတဲ့။', en: "Every mat I lay out, the cat naps on first. Checking it's dry, apparently.", job: 'aunty' },
      { id: 'fun:junction:18', my: 'မီးပျက်လို့ ဖုန်းအားသွင်းဖို့ လက်ဖက်ရည်ဆိုင် ပြေးတယ်။ လက်ဖက်ရည် သုံးခွက် ကုန်သွားတယ်။', en: 'Power cut, so I ran to the tea shop to charge my phone. Cost me three teas.' },
      { id: 'fun:junction:19', my: 'ဒေတာ နည်းနေရင် ပုံ မကြည့်ဘဲ စာပဲ ဖတ်တယ်။ ငါ ပညာရှိ ဖြစ်လာပြီ။', en: "When my data's low I skip the pictures and only read. I'm getting wise." },
      { id: 'fun:junction:20', my: 'ဖုန်းဘေလ် ထည့်လိုက်တာနဲ့ သူငယ်ချင်းတွေ အကုန် "ခဏလေး ဖုန်းဆက်ပါရစေ" ချည်းပဲ။', en: "The moment I top up, every friend wants 'just one quick call'." },
      { id: 'fun:junction:21', my: 'သနပ်ခါး လိမ်းပြီးမှ သတင်းစာ ကိုင်မိတယ်။ အခု ပါးပေါ်မှာ ခေါင်းစီးသတင်း ရောက်နေပြီ။', en: "Put on thanaka, then picked up the paper. Now there's a headline on my cheek." },
      { id: 'fun:junction:22', my: 'လုံချည် တစ်ဖက်ကိုင်ပြီး ဘတ်စ်ကားနောက် ပြေးလိုက်တာ။ ကားဆရာ ရယ်လွန်းလို့ ရပ်ပေးရှာတယ်။', en: 'Holding up my longyi, I chased the bus. The driver laughed so hard he stopped.' },
      { id: 'fun:junction:23', my: 'တံတားပေါ်မှာ လေတိုက်လို့ သတင်းစာ လွင့်သွားတယ်။ ဟိုဘက်ကမ်းက တစ်ယောက် ဖတ်နေပြီ။', en: "The wind took my paper off the bridge. Someone on the far bank's reading it now." },
      { id: 'fun:junction:24', my: 'အဒေါ်က ဘယ်ကျောင်းလဲ၊ ဘယ်နှတန်းလဲ၊ ဘယ်နှမှတ်လဲ မေးတယ်။ သတင်းထောက် ကျနေတာပဲ။', en: 'Aunty asked my school, my grade and my marks. Like a reporter.', age: 'child' },
      { id: 'fun:junction:25', my: 'အဘိုးက သတင်းစာကို အသံကျယ်ကျယ် ဖတ်တယ်။ လမ်းတစ်လမ်းလုံး သတင်း ကြားရတယ်။', en: 'Grandpa reads the paper out loud. The whole lane gets the news.' },
      { id: 'fun:junction:26', my: 'ထီး ငါးချောင်း ဝယ်ဖူးတယ်။ ငါးချောင်းလုံး "တစ်နေရာရာ" မှာ ရှိနေတယ်။', en: "I've bought five umbrellas. All five are 'somewhere'." },
      { id: 'fun:junction:27', my: 'ကြော်ငြာစာရွက် ဝေတဲ့ ကောင်လေးကို "မယူတော့ဘူး" ပြောလိုက်တာ နှစ်ရွက်တောင် ပေးသွားတယ်။', en: "Told the flyer boy 'no thanks'. He gave me two." },
      { id: 'fun:junction:28', my: 'စက်ဘီး ခေါင်းလောင်း ပျက်နေလို့ ကိုယ်တိုင် "ကလင် ကလင်" လို့ အော်ရတယ်။', en: "My bike bell's broken, so I shout 'ring ring' myself.", age: 'child' },
      { id: 'fun:junction:29', my: 'အိမ်စာ ခွေးစားသွားပြီ ပြောတော့ ဆရာမက "နင့်မှာ ခွေးမှ မရှိတာ" တဲ့။', en: "I said the dog ate my homework. Teacher said, 'You don't have a dog.'", age: 'child' },
      { id: 'fun:junction:30', my: 'မိုးထဲမှာ သတင်းစာကို ခေါင်းပေါ် တင်ပြေးတယ်။ ဒီနေ့ သတင်း ငါ့ခေါင်းထဲ စိမ့်ဝင်သွားပြီ။', en: "Ran through the rain with the paper on my head. Today's news soaked right in.", weather: 'rain' },
    ],
    pairs: [
      { id: 'fun:junction:p1', who: ['*', 'elder'], lines: [
        { my: 'ဒီနေ့ သတင်းစာ ဖတ်ပြီးပြီလား။', en: "Read today's paper yet?" },
        { my: 'မနက်ဖြန်မှ ဖတ်မယ်။', en: 'Tomorrow.' },
        { my: 'ဘာလို့လဲ။', en: 'Why?' },
        { my: 'သတင်းတွေ နည်းနည်း အေးသွားအောင်လို့။ ပူပူနွေးနွေး မကြိုက်ဘူး။', en: "Let the news cool down a bit. I don't like it piping hot." },
      ] },
      { id: 'fun:junction:p2', who: ['*', '*'], lines: [
        { my: 'မျက်လုံးတွေ နီနေတယ်။ ငိုထားတာလား။', en: 'Your eyes are red. Have you been crying?' },
        { my: 'ဘောလုံးပွဲ ကြည့်တာ။ မနက် လေးနာရီထိ။', en: 'Football. Till four in the morning.' },
        { my: 'နိုင်လား။', en: 'Did your team win?' },
        { my: '"ငိုထားတာလား" လို့ နောက်တစ်ခါ မေးကြည့်ပါဦး။', en: "Ask me again if I've been crying." },
      ] },
      { id: 'fun:junction:p3', who: ['aunty', '*'], lines: [
        { my: 'ဒါနဲ့ လစာ ဘယ်လောက် ရလဲ။', en: "So, what's your salary these days?" },
        { my: 'အဒေါ်၊ ဒီနေ့ ရာသီဥတု သာယာတယ်နော်။', en: 'Lovely weather today, Aunty.' },
        { my: 'အို… ဒီလောက်တောင် နည်းတာလား။', en: 'Oh… that little?' },
      ] },
      { id: 'fun:junction:p4', who: ['*', 'uncle'], lines: [
        { my: 'ဘရိတ် ပြင်ခ ဘယ်လောက်လဲ။', en: 'How much to fix the brakes?' },
        { my: 'ငါးရာ။', en: 'Five hundred.' },
        { my: 'မပြင်ရင်ရော။', en: "And if I don't?" },
        { my: 'အလကားပဲ။ နံရံက ရပ်ပေးလိမ့်မယ်။', en: 'Free. A wall will do the stopping.' },
      ] },
      { id: 'fun:junction:p5', who: ['kid', '*'], age: ['child', ['adult', 'elder']], lines: [
        { my: 'ငါ အတန်းထဲမှာ ဒုတိယ ရတယ်!', en: 'I came second in class!' },
        { my: 'တော်လိုက်တာ! အတန်းထဲ ဘယ်နှယောက်လဲ။', en: 'Brilliant! How many in your class?' },
        { my: 'နှစ်ယောက်။', en: 'Two.' },
      ] },
      { id: 'fun:junction:p6', who: ['*', '*'], lines: [
        { my: 'ဘောပင် ခဏ ငှားပါဦး။', en: 'Can I borrow a pen a sec?' },
        { my: 'ရော့။ ပြန်ပေးနော်။', en: 'Here. Give it back, mind.' },
        { my: 'ဟာ… ဒါ ငါ့ဘောပင်ပဲ။ မနှစ်က ပျောက်သွားတာ။', en: 'Hey… this is my pen. It went missing last year.' },
      ] },
      { id: 'fun:junction:p7', who: ['*', 'uncle'], lines: [
        { my: 'ခေါင်းစဉ်ကို စာလုံးကြီးကြီးနဲ့ ရိုက်မှာလား။', en: 'Is the headline going in big letters?' },
        { my: 'ကြီးကြီးပဲ။', en: 'Very big.' },
        { my: 'ဘာသတင်းလဲ။', en: "What's the news?" },
        { my: 'ဘာသတင်းမှ မရှိဘူး။ အဲဒါကြောင့် ကြီးကြီး ရိုက်ရမှာ။', en: "There isn't any. That's why it has to be big." },
      ] },
      { id: 'fun:junction:p8', who: ['*', 'vendor'], lines: [
        { my: 'ပဲကြော် တစ်ခုပဲ ပေးပါ။', en: 'Just one fritter, please.' },
        { my: 'နောက်တစ်ခု ထုပ်ပေးရမလား။', en: 'Shall I wrap one more?' },
        { my: 'မလိုပါဘူး။ …သုံးခု ထုပ်ပေးပါ။', en: 'No need. …Make it three.' },
      ] },
      { id: 'fun:junction:p9', who: ['*', '*'], lines: [
        { my: 'ငါ ဒီကို ဘာလာလုပ်တာလဲ။', en: 'What did I come over here for?' },
        { my: 'ငါ့ကို တစ်ခုခု မေးမလို့တဲ့။', en: 'You said you had something to ask me.' },
        { my: 'ဘာမေးမလို့လဲ။', en: 'Ask what?' },
        { my: 'အဲဒါ ငါ ပြန်မေးချင်နေတာ။', en: "That's what I'd like to ask." },
      ] },
    ],
    rooms: {
      junctiontea: [
        { id: 'fun:junction:31', my: 'ဒီဆိုင်က စားပွဲထိုးက ငါ မှာတာကို မှတ်မိတယ်။ မနေ့က မှာတာကိုပေါ့။', en: "The waiter here remembers my order. Yesterday's.", job: ['drinker1', 'drinker2'] },
        { id: 'fun:junction:32', my: '"ကျဆိမ့် တစ်ခွက်" လို့ အော်လိုက်တာ ဆိုင်ပြင်က ခွေးတောင် လှည့်ကြည့်တယ်။', en: "The tea boy yelled 'One strong-creamy!' and even the dog outside looked round.", job: ['drinker1', 'drinker2'] },
        { id: 'fun:junction:33', my: 'အီကြာကွေး မမှာဘဲ ရောက်လာတယ်။ မစားဘူးလို့ ဆုံးဖြတ်ထားတာ။ …နှစ်ချောင်း ကုန်သွားပြီ။', en: "A plate of fried dough sticks came unordered. I'd decided not to touch it. …I've touched two.", job: ['drinker1', 'drinker2'] },
        { id: 'fun:junction:34', my: 'ကြာလွန်းလို့ အိမ်က ဖုန်းဆက်တယ်။ "ရောက်ခါနီးပြီ" လို့ ဖြေလိုက်တယ်။', en: "Been here so long that home rang. I said, 'Nearly there.'", job: ['drinker1', 'drinker2'] },
        { id: 'fun:junction:35', my: 'လက်ဖက်ရည် တစ်ခွက်နဲ့ သတင်းစာ သုံးစောင် ဖတ်ပြီးပြီ။ ဒီဆိုင်က စာကြည့်တိုက် ကျနေတာပဲ။', en: 'One tea, three newspapers so far. This place is a library.', job: ['drinker1', 'drinker2'] },
      ],
    },
  },

  // =====================================================================================================
  // HEARTH ROW
  // =====================================================================================================
  hearth: {
    town: [
      { id: 'fun:hearth:1', my: 'လက်ဖက်ရည် တစ်ခွက်နဲ့ သုံးနာရီ ထိုင်တယ်။ ဆိုင်ရှင်က ငါ့ကို ခုံတစ်လုံးလို့ ထင်နေပြီ။', en: "One cup of tea, three hours. The owner thinks I'm one of the stools now.", job: 'uncle' },
      { id: 'fun:hearth:2', my: 'ထမင်း နှစ်ယောက်စာ ချက်တာ ခြောက်ယောက်စာ ထွက်လာတယ်။ အိမ်နီးချင်းတွေ ကံကောင်းတာပေါ့။', en: 'I cooked rice for two. Rice for six came out. Lucky neighbours.', job: 'aunty' },
      { id: 'fun:hearth:3', my: 'ဆွေမျိုးတွေ တွေ့တိုင်း "လစာ ဘယ်လောက်လဲ" တဲ့။ "မုန့်ဖိုးလောက်ပါပဲ" လို့ ဖြေလိုက်တယ်။', en: "Every relative asks my salary. I say, 'About snack money.'", job: 'worker' },
      { id: 'fun:hearth:4', my: 'မီးပျက်တယ်။ ဘေးအိမ် မီးစက်သံ ငါတို့ရတယ်၊ မီးကတော့ သူတို့ရတယ်။', en: "Power cut. We get next door's generator noise. They get the light.", job: 'elder' },
      { id: 'fun:hearth:5', my: 'ဇာတ်ကား ပြီးခါနီးမှ ဒေတာ ကုန်သွားတယ်။ လူဆိုးက ဘယ်သူလဲ မသိလိုက်ရဘူး။', en: "My data ran out right before the end of the film. I'll never know who the villain was.", job: 'teen' },
      { id: 'fun:hearth:6', my: 'မီးဖိုချောင်ထဲ ဘာလုပ်မလို့ ဝင်လာလဲ မေ့သွားပြီ။ ထမင်းတစ်လုတ်တော့ စားသွားဦးမယ်။', en: "Walked into the kitchen and forgot why. I'll have a mouthful of rice while I'm here.", age: 'elder' },
      { id: 'fun:hearth:7', my: 'ကြီးရင် မုန့်ဖုတ်သမား လုပ်မယ်။ အမြည်းစမ်းတဲ့ အလုပ်က အရင်စမယ်။', en: "When I grow up I'll be a baker. Starting with the tasting job.", age: 'child' },
      { id: 'fun:hearth:8', my: 'ခြင်ထောင်ထဲ ခြင်တစ်ကောင် ပါလာတယ်။ တစ်ညလုံး သူရော ငါရော မအိပ်ရဘူး။', en: 'One mosquito got inside the net. Neither of us slept all night.', job: 'worker' },
      { id: 'fun:hearth:9', my: 'ဘေးအိမ်မှာ ကာရာအိုကေ ဆိုနေတယ်။ ခွေးကပါ လိုက်အူနေတယ်။', en: "Next door's doing karaoke. The dog's howling along.", job: 'teen' },
      { id: 'fun:hearth:10', my: 'ဘောလုံးပွဲကြောင့် ညလုံးပေါက် နိုးနေတယ်။ အသင်းလည်း ရှုံး၊ အိပ်ရေးလည်း ပျက်။', en: 'Up all night for the match. My team lost, and so did my sleep.', job: 'uncle' },
      { id: 'fun:hearth:11', my: 'သမီးလေး သနပ်ခါး ကိုယ့်ဘာသာ လိမ်းတာ နားရွက်တွေပါ ပါသွားတယ်။', en: 'My little girl put her thanaka on by herself. Ears included.', job: 'aunty' },
      { id: 'fun:hearth:12', my: 'ငါ့ဒယ်အိုး ဘေးအိမ် ငှားသွားတာ နှစ်နှစ်ရှိပြီ။ အခု "ငါတို့ဒယ်အိုး" တောင် ဖြစ်နေပြီ။', en: "Next door borrowed my wok two years ago. Now they call it 'our wok'.", job: 'elder' },
      { id: 'fun:hearth:13', my: 'ညနေတန်းမှာ အဘိုးက ပထမ၊ ကျွန်တော်က ဒုတိယ။ အိမ်မှာ သွားမပြောနဲ့နော်။', en: "In evening class Grandpa came first and I came second. Don't tell anyone at home.", age: 'child' },
      { id: 'fun:hearth:14', my: 'ကျူရှင် သုံးခု တက်ရတယ်။ ကစားတဲ့ ကျူရှင် မရှိဘူးလား။', en: "I go to three tuition classes. Isn't there a tuition class for playing?", age: 'child' },
      { id: 'fun:hearth:15', my: 'အမေက "အမှတ် ဘယ်လောက်ရလဲ" မေးတယ်။ ကျွန်တော်က "ဗိုက်ဆာတယ်" လို့ ဖြေလိုက်တယ်။', en: "Mum asked what marks I got. I told her I'm hungry.", age: 'child' },
      { id: 'fun:hearth:16', my: 'ပေါင်မုန့်ထဲမှာ အပေါက်လေးတွေ ဘာလို့ ရှိလဲ။ ပေါင်မုန့်လည်း အသက်ရှူရမှာပေါ့။', en: 'Why does bread have little holes? Bread has to breathe too.', age: 'child' },
      { id: 'fun:hearth:17', my: 'အမေ ဈေးဆစ်ရင် ဈေးသည်က အမေ့ကို ပိုက်ဆံ ပြန်အမ်းရမလို ဖြစ်နေတယ်။', en: 'When Mum haggles, the seller nearly ends up paying her.', job: 'teen' },
      { id: 'fun:hearth:18', my: 'လုံချည် ပြန်ဝတ်ရင်း ဘတ်စ်ကားနောက် ပြေးလိုက်တာ ကားက နိုင်သွားတယ်။', en: 'Ran after the bus while re-tying my longyi. The bus won.', job: 'uncle' },
      { id: 'fun:hearth:19', my: 'ဒီလမ်းမှာ ပေါင်မုန့်နံ့က နှိုးစက်ပဲ။ ကျုပ် နာရီ မလိုဘူး။', en: "On this street the smell of bread is the alarm clock. I don't need a watch.", job: 'elder' },
      { id: 'fun:hearth:20', my: 'မုန့်ဖိုက "ငါးမိနစ်" ဆိုရင် တကယ် ငါးမိနစ်။ လူတွေကျတော့ မဟုတ်ဘူး။', en: "When the oven says five minutes, it means five minutes. People don't." },
      { id: 'fun:hearth:21', my: 'စားပွဲထိုးလေး "ပေါ့ဆိမ့် တစ်ခွက်" လို့ အော်လိုက်တာ ဘေးရပ်ကွက်ကပါ တစ်ခွက် မှာလိုက်ကြတယ်။', en: "The waiter shouted 'One light-and-creamy!' The next ward ordered one too.", job: 'uncle' },
      { id: 'fun:hearth:22', my: 'ရက်ကန်းခတ်ရင်း လက်ဖက်ရည် သောက်တာ မလွယ်ဘူး။ လုံချည်မှာ လက်ဖက်ရည်ရောင် အစင်း ပါသွားပြီ။', en: 'Weaving while drinking tea is hard. This longyi has a tea-coloured stripe now.', job: 'weaver' },
      { id: 'fun:hearth:23', my: 'အမိုးယိုလို့ ပုံးဆယ်လုံး ချထားတယ်။ မိုးရွာရင် ကျုပ်အိမ်က ဗုံတီးဝိုင်းပဲ။', en: 'The roof leaks, so there are ten buckets down. When it rains my house is a drum band.', job: 'aunty' },
      { id: 'fun:hearth:24', my: 'အမေက "ငါတို့ခေတ်တုန်းက" နဲ့ စရင် ကျွန်မ ထိုင်ချလိုက်တော့တယ်။ ကြာမှာ သိတယ်လေ။', en: "When Mum starts with 'in my day', I sit down. I know it'll take a while.", job: 'teen' },
    ],
    pairs: [
      { id: 'fun:hearth:p1', who: ['uncle', 'vendor'], lines: [
        { my: 'လက်ဖက်ရည် တစ်ခွက်။ ချိုချို၊ ဆိမ့်ဆိမ့်၊ ဖန်မပြင်းစေနဲ့၊ ပူပူလေး။', en: 'One tea. Sweet, creamy, not too strong, nice and hot.' },
        { my: 'မှာလို့ ပြီးတော့ အေးသွားပြီ။', en: "By the time you finished ordering, it's gone cold." },
      ] },
      { id: 'fun:hearth:p2', who: ['aunty', 'teen'], lines: [
        { my: 'သမီး၊ ဘယ်တော့ အိမ်ထောင်ပြုမလဲ။', en: 'Dear, when are you getting married?' },
        { my: 'မုန့်ဖိုမှာ အလုပ်များနေတယ် အန်တီ။', en: "I'm busy at the bakery, Auntie." },
        { my: 'ဒါဆို မုန့်ဖုတ်တတ်တဲ့ ကောင်လေး ရှာပေးမယ်။', en: "Then I'll find you a boy who bakes." },
        { my: '…မုန့်တော့ အလကား စားရမှာပေါ့။', en: '…Well, the bread would be free.' },
      ] },
      { id: 'fun:hearth:p3', who: ['kid', 'kid'], lines: [
        { my: 'နင့်အဖေ ဘာအလုပ် လုပ်လဲ။', en: 'What does your dad do?' },
        { my: 'မုန့်ဖုတ်တယ်။ နင့်အဖေရော။', en: 'He bakes. Yours?' },
        { my: 'မုန့်စားတယ်။', en: 'He eats it.' },
      ] },
      { id: 'fun:hearth:p4', who: ['elder', 'uncle'], lines: [
        { my: 'မီးလာပြီ!', en: "Power's back!" },
        { my: 'ဖုန်းအားသွင်း၊ ရေတင်၊ ထမင်းအိုးတည်။ မြန်မြန်!', en: 'Charge the phones, pump the water, put the rice on. Quick!' },
        { my: '…မီး ပြန်ပျက်သွားပြီ။', en: "…It's gone again." },
      ] },
      { id: 'fun:hearth:p5', who: ['teen', 'teen'], lines: [
        { my: 'ဖုန်းအား ဘယ်လောက် ကျန်လဲ။', en: 'How much battery have you got?' },
        { my: 'ငါးရာခိုင်နှုန်း။', en: 'Five percent.' },
        { my: 'ဒါဆို မြန်မြန်ပြော။ ငါ့ဟာ သုံးရာခိုင်နှုန်းပဲ ကျန်တော့တယ်။', en: "Then talk fast. Mine's on three." },
      ] },
      { id: 'fun:hearth:p6', who: ['aunty', 'uncle'], lines: [
        { my: 'ဧည့်သည် ခြောက်ယောက် ရောက်လာပြီ။ ဟင်းက သုံးယောက်စာပဲ။', en: "Six guests just turned up. The curry's for three." },
        { my: 'ရေ တစ်ခွက် ထပ်ထည့်လိုက်။', en: 'Add a cup of water.' },
        { my: 'နောက်ထပ် ဆယ်ယောက် လာရင်ရော။', en: 'And if ten more come?' },
        { my: 'ဒါဆို ဟင်းချို ဖြစ်သွားမှာပေါ့။', en: 'Then it becomes soup.' },
      ] },
      { id: 'fun:hearth:p7', who: ['kid', 'vendor'], lines: [
        { my: 'ဦးလေး၊ မုန့်ကျွမ်းတဲ့ အစွန်းလေးတွေ ရောင်းလား။', en: 'Uncle, do you sell the burnt edges?' },
        { my: 'ရောင်းစရာ မလိုပါဘူး။ ယူသွား။', en: 'No need to sell them. Take them.' },
        { my: 'ဒါဆို နောက်တစ်ခါ ပိုကျွမ်းအောင် ဖုတ်ပေးပါဦး။', en: 'Then next time, please burn them more.' },
      ] },
      { id: 'fun:hearth:p8', who: ['uncle', 'uncle'], lines: [
        { my: 'ငါ့အသင်း ဒီနှစ် ချန်ပီယံ ဖြစ်မှာ။', en: "My team's going to be champions this year." },
        { my: 'မနှစ်ကလည်း အဲဒီလိုပဲ ပြောတယ်။', en: 'You said that last year.' },
        { my: 'မနှစ်က ငါ ပွဲကြည့်ရင်း အိပ်ပျော်သွားလို့ ရှုံးသွားတာ။', en: 'Last year they lost because I fell asleep watching.' },
      ] },
    ],
    areas: {
      teaFront: { at: { x: 243.0, z: 199.4, r: 4.5 }, lines: [
        { id: 'fun:hearth:25', my: 'ဆိုင်ရှေ့ ဖြတ်တိုင်း "ထိုင်ပါဦး" တဲ့။ ငါ့ နေ့တစ်ဝက်က ဒီမှာတင် ကုန်တယ်။', en: "Every time I pass, it's 'sit down a minute'. Half my day goes here.", job: 'uncle' },
      ] },
    },
    rooms: {
      noodlehouse: [
        { id: 'fun:hearth:26', my: 'ငရုတ်သီး တစ်ဇွန်းပဲ ထည့်တာ။ မျက်ရည်က နှစ်ဇွန်း ထွက်လာတယ်။', en: 'I only added one spoon of chilli. Two spoons of tears came out.', job: 'diner' },
        { id: 'fun:hearth:27', my: 'ခေါက်ဆွဲ စားရင်း ဖုန်းကြည့်တာ ဖုန်းကပါ ဟင်းချို သောက်သွားပြီ။', en: 'Watching my phone while slurping noodles. The phone had some soup too.', job: 'diner' },
      ],
      bakery: [
        { id: 'fun:hearth:28', my: 'ဒီဆိုင်ထဲ ဝင်တိုင်း ငါ့ ဝိတ်ချမယ့် အစီအစဉ်က အပြင်မှာ ကျန်နေခဲ့တယ်။', en: 'Every time I come in here, my diet waits outside.', job: 'customer' },
      ],
      eveningclass: [
        { id: 'fun:hearth:29', my: 'စာလုံးပေါင်း မှားတာ ကျွန်တော် မဟုတ်ဘူး ဆရာ။ ခဲတံက မှားတာ။', en: "I didn't misspell it, Teacher. The pencil did.", job: 'pupil' },
      ],
      loomshed: [
        { id: 'fun:hearth:30', my: 'လုံချည် ဆယ်ထည် ရက်ပြီးပြီ။ ကိုယ်ဝတ်တာကတော့ အဟောင်း တစ်ထည်တည်း။', en: "I've woven ten longyis. I still wear the same old one.", job: 'weaver' },
      ],
    },
  },

  // =====================================================================================================
  // DIARY GARDEN
  // =====================================================================================================
  garden: {
    town: [
      { id: 'fun:garden:1', my: 'မိုးရာသီဆို ငါ့ပန်းခင်း ရေကန် ဖြစ်သွားတယ်။ ဖားတွေ အခန်းငှားနေကြပြီ။', en: 'In the rainy season my flower bed turns into a pond. The frogs are renting rooms.', job: 'gardener' },
      { id: 'fun:garden:2', my: 'ရွှံ့ထဲ လျှောက်ပြီးရင် ဖိနပ်က နှစ်ဆ လေးတယ်။ ခြံမြေ တစ်ဝက် အိမ်ပါလာတာကိုး။', en: 'After the mud my slippers weigh double. Half the plot comes home with me.', job: 'gardener' },
      { id: 'fun:garden:3', my: 'သရက်သီး ဘယ်သူ့ဟာလဲ ဘေးအိမ်နဲ့ ငြင်းနေတုန်း ငှက်က စားသွားပြီ။', en: 'While next door and I argued whose mango it was, a bird ate it.', job: 'aunty' },
      { id: 'fun:garden:4', my: 'မုန့်ဟင်းခါးထဲ ဘူးသီးကြော်လား၊ ပဲကြော်လား။ ကျုပ်အိမ်မှာ ငြင်းနေကြတာ နှစ်နှစ်ရှိပြီ။', en: 'Gourd fritter or bean fritter in mohinga? My house has argued about it for two years.', job: 'elder' },
      { id: 'fun:garden:5', my: 'လှည်း ပြည့်ပြီ ပြောတိုင်း နောက်တစ်ယောက် တက်လာတာပဲ။', en: 'Every time I say the cart is full, one more person climbs on.', job: 'carter' },
      { id: 'fun:garden:6', my: 'ဈေးဆစ်တာ ကြာလွန်းလို့ ခရမ်းချဉ်သီးတွေတောင် မှည့်လာပြီ။', en: 'We haggled so long the tomatoes ripened.', job: 'vendor' },
      { id: 'fun:garden:7', my: 'ကြက်ဥ တစ်လုံး မြေထဲ စိုက်ထားတယ်။ ကြက်ပင် ပေါက်လာမလားလို့။', en: 'I planted an egg. Will a chicken tree come up?', age: 'child' },
      { id: 'fun:garden:8', my: 'မြေတွင်း တူးတာ ဆော့တာ မဟုတ်ဘူး၊ အလုပ်လုပ်တာ။ အမေကတော့ မယုံဘူး။', en: "Digging holes isn't playing. It's work. Mum doesn't believe me.", age: 'child' },
      { id: 'fun:garden:9', my: 'ခြင်တွေက ငါ့ကို ဥယျာဉ်ထဲက အချိုဆုံး ပန်းလို့ ထင်နေတယ်။', en: "The mosquitoes think I'm the sweetest flower in the garden.", job: 'gardener' },
      { id: 'fun:garden:10', my: 'ဒေတာ ကုန်သွားတော့ ပန်းတွေနဲ့ပဲ စကားပြောရတယ်။ သူတို့က ပိုနားထောင်ပေးတယ်။', en: 'My data ran out, so I talk to the flowers. They listen better.', job: 'teen' },
      { id: 'fun:garden:11', my: 'မြေးမကို "ချစ်သူ ရှိပြီလား" မေးတော့ "ရှိတယ်၊ ဖုန်း" တဲ့။', en: "I asked my granddaughter if she has a sweetheart. 'Yes,' she said. 'My phone.'", job: 'elder' },
      { id: 'fun:garden:12', my: 'မီးပျက်တော့ ပိုးစုန်းကြူးတွေ မီးလာထွန်းပေးကြတယ်။', en: 'Power cut, so the fireflies came to light things up.', job: 'elder' },
      { id: 'fun:garden:13', my: 'ကြောင်က ပျိုးခင်းထဲမှာပဲ အိပ်တယ်။ သူ့အတွက် စိုက်ထားတယ် ထင်နေတာ။', en: 'The cat only sleeps in the seedbed. He thinks I planted it for him.', job: 'gardener' },
      { id: 'fun:garden:14', my: 'ကျွန်တော့်အိုးတွေကို ကြောင်က အရင် ဝင်ထိုင်ကြည့်တယ်။ ဆံ့ရင် ရောင်းလို့ရပြီ။', en: "The cat tests my pots first. If he fits, they're ready to sell.", job: 'potter' },
      { id: 'fun:garden:15', my: 'ငါ့ ငရုတ်ပင်က ငါ့ထက် စိတ်တိုတယ်။ ကိုင်မိရင် လက်ပူတယ်။', en: 'My chilli plant has a worse temper than me. Touch it and your hands burn.', job: 'gardener' },
      { id: 'fun:garden:16', my: 'မနက် သနပ်ခါး၊ နေ့လယ် ရွှံ့။ ဥယျာဉ်သမား အလှပြင်နည်းပဲ။', en: "Thanaka in the morning, mud by noon. A gardener's beauty routine.", job: 'aunty' },
      { id: 'fun:garden:17', my: 'ငါ့ထီးက နှစ်ယောက်ဆံ့တယ်။ သုံးယောက်ဆိုရင်တော့ အလယ်လူပဲ မစိုဘူး။', en: 'My umbrella fits two. With three, only the one in the middle stays dry.', job: 'worker' },
      { id: 'fun:garden:18', my: '"ငါးမိနစ်နဲ့ ရောက်မယ်" ဆိုရင် လှည်းဘီးတောင် တကျွီကျွီ ရယ်တယ်။', en: "When I say 'there in five minutes', even my cart wheels creak with laughter.", job: 'carter' },
      { id: 'fun:garden:19', my: 'ငှားသွားတဲ့ ပေါက်တူး ပြန်ရောက်လာတယ်။ အံ့ဩလွန်းလို့ ထိုင်ချလိုက်ရတယ်။', en: 'The hoe I lent out came back. I was so shocked I had to sit down.', job: 'gardener' },
      { id: 'fun:garden:20', my: 'ဥယျာဉ်ထဲ လက်ဖက်ရည်ဆိုင် ရှိရင် ကောင်းမယ်။ အလုပ်ကတော့ ဘယ်တော့မှ ပြီးမှာ မဟုတ်ဘူး။', en: 'A tea shop in the garden would be lovely. Nothing would ever get done.', job: 'gardener' },
      { id: 'fun:garden:21', my: 'အကြော်ကို "တစ်ခုတည်း" ဆိုပြီး ဝယ်တဲ့သူတိုင်း ပြန်လာကြတာချည်းပဲ။', en: "Everyone who buys a fritter says 'just one'. Everyone comes back.", job: 'vendor' },
      { id: 'fun:garden:22', my: 'ဒီနေ့ ဒိုင်ယာရီမှာ "ဖားတစ်ကောင် တွေ့တယ်" လို့ ရေးမယ်။ နေ့ကောင်းပဲ။', en: "In today's diary I'll write 'saw a frog'. A good day.", age: 'child' },
      { id: 'fun:garden:23', my: 'မိုးရွာရင် ကျောင်းပိတ်မလား မျှော်တာ။ မိုးက စနေနေ့ကျမှ ရွာတယ်။', en: 'I hope the rain will close school. It only ever rains on Saturdays.', age: 'child' },
      { id: 'fun:garden:24', my: 'ညလုံးပေါက် ဘောလုံးပွဲ ကြည့်တာ။ မနက်ကျ မြက်ပေါင်းအစား ပန်းပင် နှုတ်မိတယ်။', en: 'Watched football all night. This morning I pulled up a flower instead of a weed.', job: 'gardener' },
      { id: 'fun:garden:25', my: 'ကျုပ်လှည်းက အဆင်းဆို မြန်တယ်။ အတက်ဆို ခရီးသည်က တွန်းပေးရတယ်။', en: 'My cart is fast downhill. Uphill, the passenger pushes.', job: 'carter' },
      { id: 'fun:garden:26', my: 'ဘေးအိမ်က "ဒီနှစ် ပိန်လိုက်တာ" တဲ့။ ငါ့ကို မဟုတ်ဘူး၊ ကြက်ဟင်းခါးပင်ကို ပြောတာ။', en: "Next door said, 'So thin this year!' Not about me. About my bitter gourd vine.", job: 'aunty' },
      { id: 'fun:garden:27', my: 'အိုးဖို ဖွင့်ရတာ မွေးနေ့လက်ဆောင် ဖွင့်ရသလိုပဲ။ တစ်ခါတလေ ကွဲနေတဲ့ လက်ဆောင်။', en: 'Opening the kiln is like opening birthday presents. Sometimes cracked ones.', job: 'potter' },
    ],
    pairs: [
      { id: 'fun:garden:p1', who: ['gardener', 'aunty'], lines: [
        { my: 'ငါ့ ခရမ်းသီးတွေ ဘယ်သူ ခူးသွားလဲ။', en: 'Who picked my aubergines?' },
        { my: 'ငါ မဟုတ်ဘူး။ ညက ခရမ်းသီးဟင်း စားခဲ့တာတော့ ဟုတ်တယ်။', en: 'Not me. I did have aubergine curry last night, though.' },
        { my: 'ဘယ်ကရလဲ။', en: 'Where from?' },
        { my: 'ဈေးက… လို့ ထင်တာပဲ။', en: 'The market… I think.' },
      ] },
      { id: 'fun:garden:p2', who: ['kid', 'gardener'], lines: [
        { my: 'ဦးလေး၊ ဒီအပင်ကို တစ်နေ့ ဘယ်နှခါ ရေလောင်းရမလဲ။', en: 'Uncle, how many times a day do I water this plant?' },
        { my: 'တစ်ခါ။', en: 'Once.' },
        { my: 'ဒါဆို ဒီနေ့ ဆယ်ခါ လောင်းထားတော့ ဆယ်ရက်စာ ပြီးပြီပေါ့။', en: "Then I watered it ten times today, so that's ten days done." },
      ] },
      { id: 'fun:garden:p3', who: ['aunty', 'aunty'], lines: [
        { my: 'မနေ့က အမျိုး ဆယ်ယောက် ကြိုမပြောဘဲ ရောက်လာတယ်။', en: 'Ten relatives turned up yesterday without a word of warning.' },
        { my: 'ဘာကျွေးလိုက်လဲ။', en: 'What did you feed them?' },
        { my: 'ခြံထဲက အကုန်။ အခု ငါ့ခြံ ဗလာ။', en: "Everything in the plot. Now my plot's bare." },
        { my: 'ဒါဆို ဒီနေ့ ငါ့အိမ်မှာ လာစား။', en: 'Then come and eat at mine today.' },
      ] },
      { id: 'fun:garden:p4', who: ['*', 'vendor'], lines: [
        { my: 'ဒီဖရုံသီး နည်းနည်း လျှော့ပေးပါဦး။', en: 'Knock a bit off this pumpkin for me.' },
        { my: 'ဖရုံသီးက ဖဲ့လို့ မရဘူး။ တစ်လုံးလုံးပဲ။', en: "Can't knock bits off a pumpkin. It comes whole." },
        { my: '…ဒါဆို ဈေးကို လျှော့ပါ။', en: '…Then knock a bit off the price.' },
        { my: 'အဲဒါက ဖရုံသီးထက် မာတယ်။', en: "That's harder than the pumpkin." },
      ] },
      { id: 'fun:garden:p5', who: ['elder', 'kid'], lines: [
        { my: 'စာမေးပွဲ ဘယ်လိုလဲ မြေးလေး။', en: 'How was the exam, little one?' },
        { my: 'မေးခွန်းတွေ အကုန် နားလည်တယ် အဘွား။', en: 'I understood all the questions, Grandma.' },
        { my: 'အဖြေတွေရော။', en: 'And the answers?' },
        { my: 'အဲဒါက တခြားကိစ္စလေ။', en: "That's a separate matter." },
      ] },
      { id: 'fun:garden:p6', who: ['gardener', 'gardener'], lines: [
        { my: 'ဖားတွေ အော်နေပြီ။ မိုးရွာတော့မယ်။', en: "The frogs are calling. Rain's coming." },
        { my: 'မနေ့ကလည်း အော်တာပဲ။ မရွာပါဘူး။', en: 'They called yesterday too. No rain.' },
        { my: 'မနေ့က သီချင်း စမ်းဆိုတာလေ။', en: 'Yesterday was just rehearsal.' },
      ] },
      { id: 'fun:garden:p7', who: ['teen', 'elder'], lines: [
        { my: 'အဘိုး၊ ဒေတာ ကုန်သွားပြီ။', en: "Grandpa, my data's run out." },
        { my: 'ဒါဆို အဘိုးနဲ့ စကားပြော။ ပုံပြင် ဂစ်ဂါဘိုက် အများကြီး ရှိတယ်။', en: "Then talk to me. I've got gigabytes of stories." },
        { my: '…ဒေါင်းလုဒ် ဆွဲရတာ ကြာမယ့်ပုံပဲ။', en: '…That looks like a long download.' },
      ] },
      { id: 'fun:garden:p8', who: ['*', 'potter'], lines: [
        { my: 'ဒီအိုးမှာ အက်ကြောင်း ရှိတယ်။', en: "This pot's got a crack." },
        { my: 'အက်ကြောင်း မဟုတ်ဘူး။ လေဝင်ပေါက်။', en: "That's not a crack. It's ventilation." },
      ] },
    ],
    areas: {
      pond: { at: { x: 160.6, z: 70.6, r: 6 }, lines: [
        { id: 'fun:garden:28', my: 'ကျောက်ခဲ ပစ်ရင် ငါးတွေ အစာထင်ပြီး ပြေးလာတယ်။ ပြီးတော့ စိတ်ပျက်သွားကြတယ်။', en: "Throw a pebble in and the fish rush up thinking it's food. Then they're so disappointed.", age: 'child' },
      ] },
      allotments: { at: { x: 155.0, z: 92.0, r: 9 }, lines: [
        { id: 'fun:garden:29', my: 'ဘေးကွက် ဘာလို့ အပင်ကြီးလဲ ညဘက် ခိုးကြည့်တာ။ သူလည်း ငါ့ကွက် လာခိုးကြည့်နေတာ တွေ့တယ်။', en: 'Snuck over at night to see why the next plot grows bigger. Found him sneaking over to mine.', job: 'gardener' },
        { id: 'fun:garden:30', my: 'ကွက်တိုင်းမှာ စာခြောက်ရုပ် ရှိတယ်။ ငါ့ဟာက ငှက်တွေ နားတဲ့ ခုံ ဖြစ်နေပြီ။', en: 'Every plot has a scarecrow. Mine has become a bench for the birds.', job: 'gardener' },
      ] },
    },
    rooms: {
      kilntea: [
        { id: 'fun:garden:31', my: 'ဒီဆိုင်က ခွက်တွေ ဘေးကဖိုက ထွက်တာ။ တစ်ခွက်မှ မတူဘူး။ ငါ့ခွက်က စောင်းနေတယ်။', en: 'The cups here come from the kiln next door. No two alike. Mine leans.', job: 'carter' },
      ],
    },
  },

  // =====================================================================================================
  // THE BLANK PAGE
  // =====================================================================================================
  blank: {
    town: [
      { id: 'fun:blank:1', my: 'ဒီမှာ တိတ်လွန်းလို့ ဗိုက်ဆာသံတောင် ကြားရတယ်။ ရှက်စရာကြီး။', en: "It's so quiet here you can hear a stomach rumble. Embarrassing.", job: 'traveller' },
      { id: 'fun:blank:2', my: 'ဒီမှာ လမ်းပျောက်လည်း ကိစ္စမရှိဘူး။ ဘယ်ဘက်သွားသွား ဖြူဖြူပဲ။', en: "Getting lost here is no problem. Whichever way you go, it's white.", job: 'traveller' },
      { id: 'fun:blank:3', my: 'ဒီမှာ မီးမပျက်ဘူး။ မီးကိုက မရှိတာ။', en: "No power cuts here. There's no power to cut.", job: 'worker' },
      { id: 'fun:blank:4', my: 'လိုင်းမမိတော့ အမေ့ဖုန်း မဝင်ဘူး။ တစ်ပတ်စာ အဆူခံရတော့မယ်။', en: "No signal, so Mum's calls can't get through. That's a week of scolding coming.", job: 'traveller' },
      { id: 'fun:blank:5', my: 'သူငယ်ချင်းကို "ရောက်ပြီ" လို့ ပြောလိုက်တယ်။ ဘယ်ကိုလဲတော့ မသိဘူး။ ဒီမှာ နာမည်မရှိဘူး။', en: "Told my friend 'I'm here'. Where, I couldn't say. Nothing here has a name.", job: 'traveller' },
      { id: 'fun:blank:6', my: 'ဒီစာရွက်ပေါ် နင်းရင် ခြေရာက စာလုံး ဖြစ်မလား။ ငါ့နာမည် ရေးကြည့်ဦးမယ်။', en: "If I step on this page, will my footprints turn into letters? I'll try writing my name.", age: 'child' },
      { id: 'fun:blank:7', my: 'ဧည့်သည်တွေက "ထမင်း နည်းနည်းပဲ" တဲ့။ ပြီးတော့ သုံးပန်းကန် စားတယ်။', en: "Guests always say 'just a little rice'. Then they have three plates.", job: ['keeper', 'dawpwint'] },
      { id: 'fun:blank:8', my: 'ဒီလောက်ဝေးတာတောင် အဒေါ်က "ဘယ်တော့ အိမ်ထောင်ပြုမလဲ" လို့ စာပို့တယ်။', en: "Even out this far, my aunt sends a letter asking when I'm getting married.", job: 'traveller' },
      { id: 'fun:blank:9', my: 'အိမ်မှာဆို လက်ဖက်ရည်ဆိုင်က ငါ့နာမည် သိတယ်။ ဒီမှာ ငါ့နာမည် ငါပဲ သိတယ်။', en: 'Back home the tea shop knows my name. Out here, only I do.', job: 'traveller' },
      { id: 'fun:blank:10', my: 'အိတ်ထဲ ငါးပိ ပါလာတယ်။ ဗလာစာရွက် တစ်ရွက်လုံး သိသွားပြီ။', en: 'I brought fish paste in my bag. The whole blank page knows.', job: 'traveller' },
      { id: 'fun:blank:11', my: 'ဒီမှာ အရိပ်ခိုစရာ မရှိဘူး။ ငါ့ထီးက သစ်ပင်လုပ်ပေးရတယ်။', en: 'No shade out here. My umbrella has to play the tree.', job: 'worker' },
      { id: 'fun:blank:12', my: 'ဒီမှာ ကြာပြီ။ ဘာမှ မပြောင်းဘူး။ ငါ့ဆံပင်ပဲ ဖြူလာတယ်၊ စာရွက်နဲ့ လိုက်အောင်။', en: "I've been here ages. Nothing changes. Only my hair, going white to match the page.", job: 'elder' },
      { id: 'fun:blank:13', my: 'ဒီမှာ ခြင် မရှိဘူး။ ခြင်တွေတောင် ပျင်းလို့ ပြန်သွားကြပြီ။', en: 'No mosquitoes here. Even they got bored and left.', job: 'worker' },
      { id: 'fun:blank:14', my: 'ဘောလုံးပွဲ ရလဒ် သိချင်ရင် ခရီးသည် လာမှ မေးရတယ်။ နှစ်ပတ် နောက်ကျတယ်။', en: 'Want the football scores? Wait for a traveller and ask. Two weeks late.', job: 'worker' },
      { id: 'fun:blank:15', my: 'ဧည့်သည်တစ်ယောက် ရေချိုးရင်း သီချင်းဆိုတယ်။ တိတ်ဆိတ်လွန်းတော့ စာရွက်တစ်ရွက်လုံး ကြားရတယ်။', en: "A guest sings in the wash-house. It's so quiet the whole leaf hears.", job: ['keeper', 'dawpwint'] },
      { id: 'fun:blank:16', my: 'ဒီမှာ ဈေးဆစ်မယ့်သူ မရှိဘူး။ ပျင်းလို့ ကိုယ့်ဘာသာ ဈေးလျှော့နေတယ်။', en: "Nobody here to haggle with. I'm so bored I keep lowering my own price.", job: 'vendor' },
      { id: 'fun:blank:17', my: 'ဒီကိုလာတဲ့ ကားပေါ်မှာ စပယ်ယာက "နောက်တစ်ယောက် ဆံ့သေးတယ်" တဲ့။ အဲဒီ တစ်ယောက်က ငါပဲ။', en: "On the bus here the conductor said 'room for one more'. The one more was me.", job: 'traveller' },
      { id: 'fun:blank:18', my: 'ဒီမှာ မနေ့က ဘာဖြစ်လဲ မေးရင် "မရေးရသေးဘူး" တဲ့။', en: "Ask what happened here yesterday and they say, 'Not written yet.'", job: 'elder' },
      { id: 'fun:blank:19', my: 'ဆရာမက "စာရွက်လွတ် မထားနဲ့" တဲ့။ ဒီကို ဆရာမ ရောက်ရင် မူးလဲမှာ။', en: "Teacher says never leave a page blank. If she came here, she'd faint.", age: 'child' },
      { id: 'fun:blank:20', my: 'ဧည့်သည်တိုင်း "ကြာကြာ မနေပါဘူး" တဲ့။ တစ်ပတ်လောက် နေသွားကြတယ်။', en: "Every guest says 'I won't stay long'. They stay a week.", job: ['keeper', 'dawpwint'] },
      { id: 'fun:blank:21', my: 'မုန့်ဟင်းခါး လွမ်းတယ်။ ဒီစာရွက်ဖြူတွေ မြင်တော့ မုန့်ဖတ်လို့ ထင်မိတယ်။', en: 'I miss mohinga. All this white paper looks like rice noodles to me.', job: 'traveller' },
      { id: 'fun:blank:22', my: 'စာမေးပွဲ ဖြေပြီး ခရီးထွက်လာတာ။ အမှတ် မကောင်းရင် ဒီမှာပဲ ဆက်နေမယ်။', en: "Came travelling after my exams. If the marks are bad, I'm staying here.", job: 'traveller' },
      { id: 'fun:blank:23', my: 'စာရွက်ဖြူကို ဆေးသုတ်ဖို့ ငှားထားတာ။ ဘယ်ကစရမလဲ မသိလို့ ဒီနေ့လည်း လက်ဖက်ရည်ပဲ သောက်နေရတယ်။', en: "I was hired to paint the white page. Don't know where to start, so it's tea again today.", job: 'worker' },
      { id: 'fun:blank:24', my: 'ကျွန်မ ကြောင်က ဒီအိမ်ရဲ့ တကယ့်ပိုင်ရှင်။ ကျွန်မက အိမ်ဖော်ပဲ။', en: 'My cat is the real owner of this lodge. I am just the help.', job: ['keeper', 'dawpwint'] },
      { id: 'fun:blank:25', my: 'ဒီမှာ ခွေးတစ်ကောင်မှ မဟောင်ဘူး။ တချို့ညတွေ ကိုယ်တိုင် "ဝုတ်" လို့ နည်းနည်း ဟောင်ပေးရတယ်။', en: "Not one dog barks out here. Some nights I give a little 'woof' myself.", job: 'worker' },
      { id: 'fun:blank:26', my: 'ဒီမှာ ကျူရှင် မရှိဘူးတဲ့။ ကျွန်တော် ဒီမှာပဲ နေတော့မယ်။', en: "There's no tuition here, they say. I'm living here now.", age: 'child' },
      { id: 'fun:blank:27', my: 'အမေက ခရီးအတွက် ထမင်းထုပ် ထည့်ပေးတာ တစ်လစာလောက် ထည့်ပေးလိုက်တယ်။', en: "Mum packed me a lunch for the trip. About a month's worth.", job: 'traveller' },
      { id: 'fun:blank:28', my: 'ဘာလုပ်မလို့ ထလာတာလဲ မေ့သွားပြီ။ ဒီမှာ သတိပေးမယ့်အရာလည်း ဘာမှ မရှိဘူး။', en: "Forgot why I stood up. And out here there's nothing to remind me.", job: 'elder' },
    ],
    pairs: [
      { id: 'fun:blank:p1', who: ['traveller', ['keeper', 'dawpwint']], lines: [
        { my: 'ညစာ ဘာရှိလဲ။', en: "What's for dinner?" },
        { my: 'ထမင်း။', en: 'Rice.' },
        { my: 'ဟင်းရော။', en: 'And to go with it?' },
        { my: 'ထမင်း နောက်တစ်ပန်းကန်။', en: 'Another plate of rice.' },
      ] },
      { id: 'fun:blank:p2', who: ['traveller', 'traveller'], lines: [
        { my: 'ဘယ်လောက် ဝေးသေးလဲ။', en: 'How much farther?' },
        { my: 'နည်းနည်းပဲ။', en: 'Just a bit.' },
        { my: 'နာရီဝက်လောက်ကလည်း နည်းနည်းပဲလို့ ပြောတယ်။', en: "You said 'just a bit' half an hour ago." },
        { my: 'ဟုတ်တယ်။ ငါ့ "နည်းနည်း" က ရှည်တယ်။', en: "Yes. My 'bit' is a long one." },
      ] },
      { id: 'fun:blank:p3', who: ['kid', 'elder'], lines: [
        { my: 'အဘိုး၊ ဒီမှာ ဝိုင်ဖိုင် ရှိလား။', en: 'Grandpa, is there wi-fi here?' },
        { my: 'ရှိတယ်။ နာမည်က "ကြယ်တွေ" တဲ့။', en: "There is. It's called 'the stars'." },
        { my: 'စကားဝှက်ရော။', en: "What's the password?" },
        { my: '"အိပ်ရာဝင်တော့"။', en: "'Time for bed.'" },
      ] },
      { id: 'fun:blank:p4', who: ['traveller', 'vendor'], lines: [
        { my: 'ပေါ့ဆိမ့် တစ်ခွက်။', en: 'One light-and-creamy tea.' },
        { my: 'ဒီမှာ ရေနွေးကြမ်းပဲ ရှိတယ်။', en: "There's only plain green tea here." },
        { my: 'ဒါဆို ရေနွေးကြမ်း ပေါ့ဆိမ့်လေး ရမလား။', en: 'Then could I have the plain tea, light and creamy?' },
        { my: 'ပေါ့တော့ ပေါ့ပြီးသားပါ။', en: "Well, it's already light." },
      ] },
      { id: 'fun:blank:p5', who: ['worker', 'worker'], lines: [
        { my: 'အိမ်က ဘေးအိမ် မီးစက်သံကို လွမ်းတယ်။', en: "I miss the neighbour's generator back home." },
        { my: 'လွမ်းရင် ငါ အသံလုပ်ပေးမယ်။ ဒုတ်ဒုတ်ဒုတ်…', en: "If you miss it, I'll do it for you. Dug-dug-dug…" },
        { my: 'အဲဒါပဲ။ အခုမှ အိပ်ပျော်တော့မယ်။', en: "That's the one. Now I can finally sleep." },
      ] },
      { id: 'fun:blank:p6', who: ['elder', 'traveller'], lines: [
        { my: 'အိမ်ထောင် ရှိပြီလား။', en: 'Married yet?' },
        { my: 'မရှိသေးဘူး ဦး။', en: 'Not yet, Uncle.' },
        { my: 'လစာရော ဘယ်လောက်လဲ။', en: 'And how much is your salary?' },
        { my: 'ဦးလေး၊ ကျွန်တော်တို့ အခုမှ တွေ့တာလေ။', en: 'Uncle, we only just met.' },
      ] },
      { id: 'fun:blank:p7', who: ['kid', 'kid'], lines: [
        { my: 'ပုန်းတမ်း ကစားမလား။', en: 'Hide-and-seek?' },
        { my: 'ဘယ်မှာ ပုန်းမလဲ။', en: 'Where would we hide?' },
        { my: 'မျက်လုံးမှိတ်။ ငါ နင့်ကို မမြင်ရရင် နင်လည်း ငါ့ကို မမြင်ရဘူး။', en: "Shut your eyes. If I can't see you, you can't see me." },
        { my: 'ဒါဆို နှစ်ယောက်လုံး နိုင်တယ်။', en: 'Then we both win.' },
      ] },
      { id: 'fun:blank:p8', who: ['traveller', 'elder'], lines: [
        { my: 'ဒီမှာ လိုင်းမမိဘူး။ ဘာလုပ်ရမလဲ။', en: 'No signal here. What am I supposed to do?' },
        { my: 'ငါတို့ ငယ်ငယ်က လုပ်တာ လုပ်ပေါ့။', en: 'What we did when we were young.' },
        { my: 'ဘာလုပ်တာလဲ။', en: 'What was that?' },
        { my: 'ကောင်းကင်ကြည့်ပြီး ဘာမှ မလုပ်တာ။ အရမ်းကောင်းတယ်။', en: 'Looked at the sky and did nothing. It was wonderful.' },
      ] },
    ],
    areas: {
      restGround: { at: { x: 128.0, z: 8.4, r: 6.5 }, lines: [
        { id: 'fun:blank:29', my: 'နားမယ်ဆိုပြီး ထိုင်တာ။ ဘာက နားရမှန်း မသိဘူး။ ဘာမှ မလုပ်ရသေးဘူးလေ။', en: "Sat down for a rest. Not sure from what. I haven't done anything yet.", job: 'traveller' },
        { id: 'fun:blank:30', my: 'ငါးမိနစ်ပဲ နားမယ် ပြောတာ။ နေက ငါ့ကို ကျော်သွားပြီ။', en: 'I said five minutes\' rest. The sun has overtaken me.', job: 'traveller' },
      ] },
      lodgeYard: { at: { x: 131.2, z: -4.4, r: 5 }, lines: [
        { id: 'fun:blank:31', my: 'ဒီက ကြက်ဖက မနက်တိုင်း နောက်ကျမှ တွန်တယ်။ နာရီ မရှိလို့ ထင်တယ်။', en: 'The rooster here crows late every morning. No clocks out here, I suppose.', job: 'worker' },
      ] },
    },
    rooms: {
      lodge: [
        { id: 'fun:blank:32', my: 'ဒီမှာ ငြိမ်လွန်းလို့ ကိုယ့်ဟောက်သံကြောင့် ကိုယ်ပြန်နိုးတယ်။', en: "It's so quiet here I wake myself up with my own snoring.", job: 'guest' },
        { id: 'fun:blank:33', my: 'အိမ်ရှင်က "စားပြီးပြီလား" မေးတာ ဒီနေ့ ငါးခါရှိပြီ။ ငါးခါလုံး စားခဲ့တယ်။', en: "The host has asked 'have you eaten?' five times today. I ate all five times.", job: 'guest' },
        { id: 'fun:blank:34', my: 'ဖုန်းအားသွင်းဖို့ ပလတ်ပေါက် ရှာတာ။ အိမ်ရှင်က ဖယောင်းတိုင် ပေးတယ်။', en: 'I asked for a socket to charge my phone. The host gave me a candle.', job: 'guest' },
      ],
    },
  },
};

export default LINES_D;
