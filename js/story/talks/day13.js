// Day 13's two talks (day13-spec 5.6 and 6.5). Format: see the top of js/story/talk.js.
// Burmese lines are drafts for Maya to proofread.
//
// Ei Mon (ch 21, in the proving room): she is hot (the wish to do it back), afraid of the shed laughing again,
// clinging to the hurt so it counts; stones 2 and 4 (0-based) are hers (Step back). The reading glass is
// banned in her talk (review ch 21: Maya never goes into her private things, not even to help).
// Ko Pyae Sone (ch 22, in the lodge): afraid the two younger ones will be lectured; doesn't know what quiet
// is for; the last stone, whether they test it, is his.
//
// Look-alike pencil cards (`pencil: true, rumour`) sit in the hand only while their rumour was heard and not
// yet checked (talk.js drops them once `proof:<rumour>` is in the bag or `rumour.<id>` is 'checked').

// ---- Ei Mon ---------------------------------------------------------------------------------------
export const D13_EM_CARDS = [
  // ch 20 (p94, Number One): catch yourself at the first sign, before you flare up (Day 12's Little Lid)
  {
    id: 'lid', companion: 'lid',
    name: { my: 'ပထမဆုံး ခုန်သံ', en: 'The first rattle' },
    line: { my: 'အဖုံး စခုန်တာနဲ့ သတိထား။ အိုးကို မီးပေါ်က ခဏ ချ။ ဘာလုပ်မလဲဆိုတာ အေးမှ ရွေး။', en: 'The moment the lid starts to rattle, notice. Take the pot off the fire a while. Choose what to do once it cools.' },
    answers: ['hot'],
    from: { my: 'အိုးဖုံးလေး', en: 'the Little Lid' },
    flag: 'companion:lid',
  },
  // ch 19 (p89): it came unasked; take it in, then choose the next hour (Day 12's wording)
  {
    id: 'guest', companion: 'cup',
    name: { my: 'မဖိတ်တဲ့ ဧည့်သည်', en: 'The uninvited guest' },
    line: { my: 'ဒီအပူက မဖိတ်ဘဲ ရောက်လာတဲ့ ဧည့်သည်ပဲ။ လက်ခံလိုက်။ နောက်တစ်နာရီ ဘာလုပ်မလဲကတော့ မင်း ရွေးတာ။', en: 'This heat is a guest nobody invited. Take it in. What you do in the next hour is yours to choose.' },
    answers: ['hot', 'afraid'],
    from: { my: 'လက်ခံခွက်', en: 'the Guest Cup' },
    flag: 'companion:cup',
  },
  {
    id: 'cover',
    name: { my: 'ဖုံးထားခွင့်', en: 'Allowed to stay covered' },
    line: { my: 'မပြီးသေးတဲ့ အထည်က ဖုံးထားခွင့် ရှိတယ်။ ပြချင်မှ ပြ။ ဘယ်သူမှ မစောင့်ခိုင်းဘူး။', en: 'An unfinished piece is allowed to stay covered. Show it when you want to. Nobody gets to rush you.' },
    answers: ['afraid'],
    from: { my: 'ဒေါ်ခင်မေ ပြောခဲ့တာ', en: 'from Daw Khin May' },
    flag: 'd13.kmMet', // earned from Daw Khin May's line in the bakery (5.1)
  },
  {
    id: 'notyet', companion: 'seedling',
    name: { my: 'မရသေးဘူး', en: 'Not yet' },
    line: { my: 'အတန်းကောက်တာက မရဘူး မဟုတ်ဘူး။ မရသေးတာ။ ရက်ကန်းစင်ပေါ် ဆက်ရှိနေတုန်းပဲ။', en: 'Crooked rows aren\'t "can\'t". They\'re "not yet". It\'s still on the loom.' },
    answers: ['afraid', 'given'],
    from: { my: 'မရသေးပျိုးပင်', en: 'the Not-Yet Seedling' },
  },
  {
    id: 'mine',
    name: { my: 'ကိုယ့်တုံ့ပြန်မှု ကိုယ့်တာဝန်', en: 'My reply is mine' },
    line: { my: 'သူတို့လုပ်တာ သူတို့တာဝန်။ ပြန်လုပ်မလား မလုပ်ဘူးလား ဆိုတာကတော့ မင်းတာဝန်။', en: 'What they did is theirs to answer for. Whether you do it back is yours.' },
    answers: ['cling', 'hot'],
    from: { my: 'အိမွန်ရဲ့ တတိယ ခြင်း', en: "from Ei Mon's third basket" },
    flag: 'd13.sorted', // earned from her third basket (5.5)
  },
  {
    id: 'excuse', lookalike: true,
    name: { my: 'သူတို့ ရည်ရွယ်ချက် မရှိပါဘူး', en: 'They meant no harm' },
    line: { my: 'သူတို့ ရည်ရွယ်ချက် မရှိပါဘူး။ ဒါဆို ကိစ္စမရှိပါဘူးလေ။', en: "They meant no harm. So it's fine, isn't it." },
    shows: ['hot'],
    really: { my: 'အကြောင်းရင်းကို ဆင်ခြေ လုပ်ပေးတာ', en: 'turning a cause into an excuse' },
    backfire: {
      they: { my: 'ကိစ္စမရှိဘူး? တစ်တန်းလုံး ရယ်တာ ကိစ္စမရှိဘူး?', en: 'Fine? The whole row laughing is fine?' },
      maya: { my: '(ဘာကြောင့်လဲ သိတာနဲ့ ကိစ္စမရှိတာနဲ့ မတူဘူး။ ကျွန်မ ရောလိုက်မိပြီ။)', en: "(Knowing why isn't the same as it being fine. I mixed them up.)" },
    },
  },
  {
    id: 'forget', lookalike: true,
    name: { my: 'မေ့လိုက်ပါ', en: 'Just forget it' },
    line: { my: 'မေ့လိုက်ပါ။ ဒါလေးကို ဒီလောက် မကြိုက်စရာ မလိုပါဘူး။', en: 'Just forget it. No need to mind it this much.' },
    shows: ['hot', 'cling'],
    really: { my: 'မကြိုက်တာကို မကြိုက်နဲ့လို့ ပြောတာ', en: 'telling her not to dislike what she dislikes' },
    backfire: {
      they: { my: 'ကျွန်မ မကြိုက်တာကို ကျွန်မ မကြိုက်ခွင့် မရှိဘူးလား။', en: 'Am I not even allowed to dislike it?' },
      maya: { my: '(မုန်းတာ ပျောက်ဖို့ပါ။ မကြိုက်တာ ပျောက်ဖို့ မဟုတ်ဘူး။)', en: '(The hatred is what should go. Not the dislike.)' },
    },
  },
  {
    // a heard rumour in the hand (from Day 6 on): only while Maya heard it in the bakery and has not checked it
    id: 'shuttle', lookalike: true, pencil: true, rumour: 'shuttle',
    onlyIf: 'd13.heard.shuttle && !d13.rumour.shuttle',
    name: { my: 'ဘာမှ မပစ်နဲ့တော့', en: "Don't throw things" },
    line: { my: 'နောက်ဆို ဘယ်သူ့ကိုမှ ဘာမှ မပစ်နဲ့တော့နော်။', en: "Don't throw things at anyone again, okay?" },
    shows: ['hot'],
    really: { my: 'ကြားရုံ ကြားထားတာကို အမှန်လို ပြောတာ', en: 'repeating a rumour as if it were seen' },
    backfire: {
      they: { my: 'ပစ်တယ်? ဘယ်သူ ပြောတာလဲ။ ကျွန်မ ဘာမှ မထိခဲ့ဘူး!', en: "Throw? Who said that? I didn't touch a thing!" },
      maya: { my: '(ကိုယ်တိုင် မစစ်ရသေးတာကို ပြောလိုက်မိပြီ။)', en: "(I said something I hadn't checked.)" },
    },
  },
];

export const TALK_D13_EIMON = {
  id: 'd13-eimon',
  person: 'eimon',
  with: [],
  steam: 2, calm: 4, turns: 8,
  theirs: [2, 4], // two of five stones are hers: Step back (a card there = she leans)
  items: { max: 1, ban: ['glass'] },
  hand: D13_EM_CARDS,
  stones: [
    { lines: [
      { my: 'ဒီည သူတို့ဖုံးကို လှပ်မယ်။ လမ်းပေါ် ထောင်ပြမယ်။ ရယ်ကြပါစေ။', en: "Tonight I'll lift their covers. Hold them up in the street. Let people laugh.", need: 'hot', seems: 'looksdown', face: 'hot', steam: 1,
        tell: { my: 'သူတို့ကို အထင်သေးတာ မဟုတ်ဘူး။ လက်နှစ်ဖက်က ဖုံးနှစ်ခုကို ဖိထားတယ်။ ပူနေပေမဲ့ တစ်ခုမှ မလှပ်ရသေးဘူး။', en: "Not contempt. Both hands hold the two covers down. She's burning, and she hasn't lifted either." } },
      { my: 'ကျွန်မ ခံစားရသလို သူတို့လည်း ခံစားရမှ မျှတမှာ။', en: "It's only fair if they feel what I felt.", need: 'hot', face: 'hot', heard: true },
    ] },
    { lines: [
      { my: 'အဲဒီရုံကို ပြန်မသွားတော့ဘူး။ တစ်ရုံလုံး မြင်ပြီးပြီ။ အတန်းကောက်တွေ။', en: "I'm not going back to that shed. Everyone's seen it. The crooked rows.", need: 'afraid', seems: 'given', face: 'sad', mood: 'down',
        tell: { my: 'ရက်ကန်း လက်လျှော့တာ မဟုတ်ဘူး။ ပေါင်ပေါ်မှာ လက်ချောင်းတွေက လွန်းပစ်နေသလို လှုပ်နေတုန်း။ ထပ်ရယ်ခံရမှာ ကြောက်နေတာ။', en: "She hasn't given up weaving: her fingers are still throwing an invisible shuttle in her lap. She's afraid of being laughed at again." } },
      { my: 'ပြီးမှ ပြမလို့ပါ။ အခု ဘယ်တော့မှ မပြီးတော့ဘူး ထင်တယ်။', en: "I was going to show it when it was done. Now I don't think it'll ever be done.", need: 'afraid', seems: 'given', face: 'sad' },
    ] },
    { lines: [ // hers: she answers it herself
      { my: 'ဘာကြောင့် လုပ်ကြလဲ သိသွားပြီ… ဒါဆို ကိစ္စမရှိဘူးလို့ ပြောရမှာလား။', en: 'Now I know why they did it… so do I have to say it was fine?', need: 'own', seems: 'unknown', face: 'think',
        tell: { my: 'အဖြေ မတောင်းဘူး။ ခြင်းထဲက ကတ်တွေကို ပြန်ကြည့်နေတယ်။ သူကိုယ်တိုင် ချိန်နေတာ။', en: "She isn't asking for an answer. She's looking back at her baskets. She's weighing it herself." } },
    ] },
    { lines: [
      { my: 'ဒါပေမဲ့… တစ်ခါလောက်တော့ သူတို့ကို နာစေချင်သေးတယ်။', en: "Still… I'd like them to hurt, just once.", need: 'cling', seems: 'hot', face: 'worried', steam: 1,
        tell: { my: 'မဆူတော့ဘူး။ နာကျင်မှုကို လွှတ်မပေးချင်တာ။ လွှတ်လိုက်ရင် ဘာမှ မဖြစ်ခဲ့သလို ဖြစ်မှာ ကြောက်လို့။', en: "She isn't boiling now. She's holding on to the hurt, afraid that letting go means it never mattered." } },
      { my: 'မေ့လိုက်ရင် သူတို့ နိုင်သွားသလို ဖြစ်မှာ။', en: "If I let it go, it's like they won.", need: 'cling', face: 'sad', heard: true },
    ] },
    { lines: [ // hers: the decision
      { my: 'ဒီ အထုပ်နှစ်ထုပ်… ကျွန်မ ဘာလုပ်ရမလဲ။', en: 'These two bundles… what do I do with them?', need: 'own', seems: 'unknown', face: 'think',
        tell: { my: 'မေးနေတာ အစ်မကို မဟုတ်ဘူး။ ဖုံးပေါ်က ကြိုးထုံးကို လက်နဲ့ စမ်းနေတယ်။ ဖြေပြီးသား ဖြစ်နေပြီ။', en: "She isn't asking you. Her fingers are on the knots, testing them. She already knows." } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါ ကျွန်မ ပြောနေတာ မဟုတ်ဘူး။', en: "…That isn't what I'm saying." },
    hot: { my: '(အိမွန် အထုပ်ကို ဆုပ်ထားတယ်။ ဘာမှ နားထဲ မဝင်ဘူး။)', en: '(Ei Mon grips the bundles. Nothing gets in.)' },
    lean: { my: 'အစ်မ ပြောတဲ့အတိုင်းပဲ လုပ်မယ်… (ကိုယ့်ဘာသာ မဆုံးဖြတ်ရတော့ဘူး။)', en: "I'll do what you say… (She didn't get to decide.)" },
  },
  stepBackLines: {
    2: { my: 'မဟုတ်ဘူး။ ဘာကြောင့်လဲ ဆိုတာ တစ်ခု။ မှားတယ် ဆိုတာ တစ်ခု။ နှစ်ခုလုံး သိလို့ရတယ်။', en: 'No. Why they did it is one thing. That it was wrong is another. I can know both.' },
  },
  decision: [
    { my: 'ပြန်ပို့မယ်။ ဖုံးမလှပ်ဘဲ။ ကျွန်မ မလုပ်စေချင်တာကို ကျွန်မ မလုပ်ဘူး။', en: "I'll take them back. Covers on. I won't do the thing I can't stand.", face: 'happy' },
    { my: 'မကြိုက်တာကတော့ မကြိုက်တုန်းပဲ။ မုန်းနေရတာကတော့ ပေါ့သွားပြီ။', en: "I still don't like it. But the hating has gone light.", face: 'smile' },
  ],
};

// ---- Ko Pyae Sone ------------------------------------------------------------------------------------
export const D13_PS_CARDS = [
  {
    id: 'label',
    name: { my: 'ခေါင်းစဉ် မှန်တယ်', en: "You're right about the label" },
    line: { my: 'ဒါ ဘာသာရေးကလာတာ မှန်တယ်။ ဖုံးမထားဘူး၊ ပြောပြီးသား။ စာကြောင်းတွေကိုတော့ ကိုယ်တိုင် စမ်းပြီးမှ ဆုံးဖြတ်ပါ။', en: "You're right, it comes from a religion. I've said so, not hidden it. Judge the lines after you've tested them yourselves." },
    answers: ['afraid'],
    from: { my: 'မာရာ့ကိုယ်ပိုင်', en: "Maya's own" },
  },
  {
    id: 'why', companion: 'parrot', // the Why-Parrot (ch 3)
    name: { my: 'ဘာကြောင့်လဲ', en: 'Ask why' },
    line: { my: 'တိတ်ဆိတ်ဖို့ ဘာကြောင့် ထားတာလဲ ဒေါ်ပွင့်ကို မေးကြည့်ပါလား။', en: 'Why not ask Daw Pwint what the quiet is for?' },
    answers: ['unknown'],
    from: { my: 'ဘာကြောင့်ကြက်တူရွေး', en: 'the Why-Parrot' },
  },
  {
    id: 'twoways', companion: 'beetle', // the Six-Nine Beetle (ch 13)
    name: { my: 'နှစ်မျိုး ဖတ်လို့ရ', en: 'Reads two ways' },
    line: { my: 'ဆိုင်းဘုတ် တစ်ခုတည်းကို ဟောပြောတာလို့လည်း ဖတ်လို့ရတယ်။ အိမ်စည်းကမ်းလို့လည်း ဖတ်လို့ရတယ်။ မဆုံးဖြတ်ခင် စမ်းကြည့်။', en: 'One board can read as preaching or as house rules. Test it before you decide which.' },
    answers: ['unknown', 'afraid'],
    from: { my: '၆-၉ ပိုး', en: 'the Six-Nine Beetle' },
  },
  {
    id: 'sacred', lookalike: true,
    name: { my: 'လေးစားပါ', en: 'Show respect' },
    line: { my: 'ဒါ မြင့်မြတ်တဲ့ ဆိုင်းဘုတ်။ လေးစားပါ။', en: "That's a sacred board. Show respect." },
    shows: ['looksdown'],
    really: { my: 'ကိုယ်တိုင် မစမ်းရဘဲ လက်ခံခိုင်းတာ', en: 'asking them to accept it without testing it' },
    backfire: {
      they: { my: 'အဲဒါပဲ။ ဟောပြန်ပြီ။', en: 'There it is. Preaching again.' },
      maya: { my: '(စမ်းခွင့် မပေးဘဲ လက်ခံခိုင်းနေမိတယ်။)', en: '(I asked them to accept it instead of letting them test it.)' },
    },
  },
  {
    id: 'scrubbed', lookalike: true, pencil: true, rumour: 'scrubbed',
    onlyIf: 'd13.heard.scrubbed && !d13.rumour.scrubbed',
    name: { my: 'ဘာလို့ ဖျက်တာလဲ', en: 'Why did you scrub it?' },
    line: { my: 'ဆိုင်းဘုတ်ကို ဘာလို့ ဖျက်ခဲ့တာလဲ။', en: 'Why did you scrub the board?' },
    shows: ['looksdown'],
    really: { my: 'ကြားရုံ ကြားထားတာကို အမှန်လို ပြောတာ', en: 'repeating a rumour as if it were seen' },
    backfire: {
      they: { my: 'ဖျက်တယ်? ကြည့်လိုက်စမ်း။ တစ်လုံးမှ မထိဘူး!', en: "Scrubbed? Go and look. We didn't touch a letter!" },
      maya: { my: '(ဆိုင်းဘုတ်ကို ကိုယ်တိုင် မကြည့်ရသေးဘဲ ပြောလိုက်မိပြီ။)', en: '(I said it without looking at the board myself.)' },
    },
  },
];

export const TALK_D13_PYAESONE = {
  id: 'd13-pyaesone',
  person: 'pyaesone',
  with: ['shwesin', 'moe', 'dawpwint'],
  steam: 1, calm: 4, turns: 6,
  stepBack: true, // the last stone is his
  items: { max: 1 },
  hand: D13_PS_CARDS,
  stones: [
    { lines: [
      { my: 'ငယ်ငယ်က ကျွန်တော့်ကို "ဒါလုပ်ရမယ်၊ ဟိုဟာ မလုပ်ရဘူး" နေ့တိုင်း ဟောခဲ့ကြတာ။ ဒီကလေးတွေကို ထပ်မခံစေချင်ဘူး။', en: '"Do this, don\'t do that": I got lectured every day as a kid. I don\'t want these two getting it too.', need: 'afraid', seems: 'looksdown', face: 'hot',
        tell: { my: 'ဆိုင်းဘုတ်ကို အထင်သေးတာ မဟုတ်ဘူး။ မိုးနဲ့ ရွှေစင်ကို ခဏခဏ လှည့်ကြည့်တယ်။ သူတို့ကို ကာကွယ်ချင်နေတာ။', en: "He doesn't look down on the board. He keeps glancing at Moe and Shwe Sin. He wants to shield them." } },
    ] },
    { lines: [
      { my: 'တိတ်တိတ်နေရင် ဘာထူးမှာလဲ။ ပျင်းစရာပဲ။', en: "What's quiet going to change? It's just boring.", need: 'unknown', seems: 'hot', face: 'think',
        tell: { my: 'ဒေါသ မဟုတ်ဘူး။ တကယ် မသိလို့ မေးနေတာ။ ရေဒီယို အသံကို နည်းနည်း လျှော့လိုက်တယ်။', en: "Not anger. He really doesn't know. He's turned the radio down a notch." } },
      { my: 'အဒေါ်က ဘာလို့ မှောင်ရင် တိတ်ခိုင်းတာလဲ။ ဘာမှ မပြောဘူး။', en: 'Why does she want quiet after dark? She never says.', need: 'unknown', face: 'think', heard: true },
    ] },
    { lines: [ // his
      { my: 'ကဲ… စမ်းမလား မစမ်းဘူးလား။', en: 'So… do we test it or not?', need: 'own', face: 'think',
        tell: { my: 'အစ်မကို မမေးဘူး။ မိုးနဲ့ ရွှေစင်ကို မေးနေတာ။', en: "He isn't asking you. He's asking Moe and Shwe Sin." } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါနဲ့ ဘာဆိုင်လဲ။', en: "…What's that got to do with it?" },
    hot: { my: '(ပြည့်စုံ ရေဒီယို အသံကို ချဲ့လိုက်တယ်။)', en: '(Pyae Sone turns the radio up.)' },
    lean: { my: 'အစ်မ ပြောရင်တော့ စမ်းမယ်လေ… (သူတို့ ကိုယ်တိုင် မရွေးရတော့ဘူး။)', en: "If you say so, we'll test it… (They didn't get to choose.)" },
  },
  decision: [
    { my: 'စမ်းမယ်။ ကိုယ်တိုင်။ ဘယ်သူမှ အဖြေ မပြောပေးနဲ့။', en: "We'll test it. Ourselves. Nobody tells us the answers.", face: 'smile' },
  ],
};
