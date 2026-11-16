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
    name: { my: 'အဖုံး စလှုပ်တဲ့ အချိန်', en: 'The first rattle' },
    line: { my: 'အိုးအဖုံး စလှုပ်လာတာနဲ့ သတိထားလိုက်ပါ။ အိုးကို မီးဖိုပေါ်က ခဏ ချထားလိုက်။ အေးသွားမှ ဘာလုပ်မလဲ ရွေးချယ်ပါ။', en: 'The moment the lid starts to rattle, notice. Take the pot off the fire a while. Choose what to do once it cools.' },
    answers: ['hot'],
    from: { my: 'အိုးအဖုံးသေးသေးလေး', en: 'the Little Lid' },
    flag: 'companion:lid',
  },
  // ch 19 (p89): it came unasked; take it in, then choose the next hour (Day 12's wording)
  {
    id: 'guest', companion: 'cup',
    name: { my: 'မဖိတ်ခေါ်ဘဲ ရောက်လာတဲ့ ဧည့်သည်', en: 'The uninvited guest' },
    line: { my: 'ဒီဒေါသအပူက ဘယ်သူမှ မဖိတ်ခေါ်ဘဲ ရောက်လာတဲ့ ဧည့်သည်ပဲ။ လက်ခံထားလိုက်ပါ။ နောက်လာမယ့် တစ်နာရီအတွင်း ဘာလုပ်မလဲ ဆိုတာတော့ မင်းကိုယ်တိုင် ရွေးချယ်ရမှာ။', en: 'This heat is a guest nobody invited. Take it in. What you do in the next hour is yours to choose.' },
    answers: ['hot', 'afraid'],
    from: { my: 'ဧည့်ခံခွက်လေး', en: 'the Guest Cup' },
    flag: 'companion:cup',
  },
  {
    id: 'cover',
    name: { my: 'ဖုံးအုပ်ထားခွင့် ရှိပါတယ်', en: 'Allowed to stay covered' },
    line: { my: 'မပြီးသေးတဲ့ လက်ရာကို ဖုံးအုပ်ထားခွင့် ရှိပါတယ်။ ကိုယ်ပြချင်တဲ့ အချိန်ကျမှ ထုတ်ပြပါ။ ဘယ်သူမှ မင်းကို အလျင်စလို လုပ်ခိုင်းခွင့် မရှိဘူး။', en: 'An unfinished piece is allowed to stay covered. Show it when you want to. Nobody gets to rush you.' },
    answers: ['afraid'],
    from: { my: 'ဒေါ်ခင်မေဆီက', en: 'from Daw Khin May' },
    flag: 'd13.kmMet', // earned from Daw Khin May's line in the bakery (5.1)
  },
  {
    id: 'notyet', companion: 'seedling',
    name: { my: 'မဖြစ်သေးတာပါ', en: 'Not yet' },
    line: { my: 'စောင်းနေတဲ့ အတန်းတွေက "မလုပ်နိုင်ဘူး" မဟုတ်ပါဘူး။ "မပြီးသေးတာ" ပါ။ ရက်ကန်းစင်ပေါ်မှာ ရှိနေတုန်းပဲလေ။', en: 'Crooked rows aren\'t "can\'t". They\'re "not yet". It\'s still on the loom.' },
    answers: ['afraid', 'given'],
    from: { my: 'မဖြစ်သေးတဲ့ ပျိုးပင်လေး', en: 'the Not-Yet Seedling' },
  },
  {
    id: 'mine',
    name: { my: 'ငါ့တုံ့ပြန်မှုက ငါ့အပိုင်းပဲ', en: 'My reply is mine' },
    line: { my: 'သူတို့ လုပ်ခဲ့တာက သူတို့ တာဝန်ယူရမှာ။ ပြန်လုပ်မလား မလုပ်ဘူးလား ဆိုတာက မင်းအပိုင်းပဲ။', en: 'What they did is theirs to answer for. Whether you do it back is yours.' },
    answers: ['cling', 'hot'],
    from: { my: 'အိမွန်ရဲ့ တတိယ ခြင်းတောင်းဆီက', en: "from Ei Mon's third basket" },
    flag: 'd13.sorted', // earned from her third basket (5.5)
  },
  {
    id: 'excuse', lookalike: true,
    name: { my: 'သူတို့ ရည်ရွယ်ချက် မရှိပါဘူး', en: 'They meant no harm' },
    line: { my: 'သူတို့ ရည်ရွယ်ချက် ရှိလို့ လုပ်တာ မဟုတ်ပါဘူး။ အဲဒီတော့ အဆင်ပြေပါတယ် မဟုတ်လား။', en: "They meant no harm. So it's fine, isn't it." },
    shows: ['hot'],
    really: { my: 'အကြောင်းရင်းကို ဆင်ခြေအဖြစ် ပြောင်းပစ်မိတာ', en: 'turning a cause into an excuse' },
    backfire: {
      they: { my: 'အဆင်ပြေတယ် ဟုတ်လား။ တစ်တန်းလုံး ဝိုင်းရယ်နေတာက အဆင်ပြေတယ် ဟုတ်လား။', en: 'Fine? The whole row laughing is fine?' },
      maya: { my: '(ဘာလို့လဲ ဆိုတာ သိရုံနဲ့ အဆင်ပြေသွားတာ မဟုတ်ဘူး။ ငါ ရောထွေးမိသွားပြီ။)', en: "(Knowing why isn't the same as it being fine. I mixed them up.)" },
    },
  },
  {
    id: 'forget', lookalike: true,
    name: { my: 'မေ့လိုက်ပါတော့', en: 'Just forget it' },
    line: { my: 'မေ့လိုက်ပါတော့။ ဒီလောက်ထိ စိတ်ထဲ ထားနေစရာ မလိုပါဘူး။', en: 'Just forget it. No need to mind it this much.' },
    shows: ['hot', 'cling'],
    really: { my: 'မကြိုက်တာကို မကြိုက်ဘူးလို့ မခံစားရအောင် ပြောမိတာ', en: 'telling her not to dislike what she dislikes' },
    backfire: {
      they: { my: 'ငါ့မှာ မကြိုက်ဘူးလို့တောင် ခံစားခွင့် မရှိတော့ဘူးလား။', en: 'Am I not even allowed to dislike it?' },
      maya: { my: '(မုန်းတီးစိတ်ကိုသာ ဖယ်ရှားရမှာ။ မကြိုက်တဲ့ ခံစားချက်ကို မဟုတ်ဘူး။)', en: '(The hatred is what should go. Not the dislike.)' },
    },
  },
  {
    // a heard rumour in the hand (from Day 6 on): only while Maya heard it in the bakery and has not checked it
    id: 'shuttle', lookalike: true, pencil: true, rumour: 'shuttle',
    onlyIf: 'd13.heard.shuttle && !d13.rumour.shuttle',
    name: { my: 'ပစ္စည်းတွေ မပစ်ပါနဲ့', en: "Don't throw things" },
    line: { my: 'နောက်တစ်ခါ ဘယ်သူ့ကိုမှ ပစ္စည်းတွေနဲ့ မပစ်ပါနဲ့တော့နော်။', en: "Don't throw things at anyone again, okay?" },
    shows: ['hot'],
    really: { my: 'ကိုယ်တိုင် မြင်ခဲ့ရသလိုမျိုး ကောလာဟလကို ပြန်ပြောမိတာ', en: 'repeating a rumour as if it were seen' },
    backfire: {
      they: { my: 'ပစ်တယ် ဟုတ်လား။ ဘယ်သူ ပြောတာလဲ။ ငါ ဘာမှ မထိခဲ့ဘူး။', en: "Throw? Who said that? I didn't touch a thing!" },
      maya: { my: '(ငါ မစစ်ဆေးရသေးတဲ့ စကားကို ပြောမိသွားပြီ။)', en: "(I said something I hadn't checked.)" },
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
      { my: 'ဒီည သူတို့ အဖုံးတွေကို ငါ လှန်ပစ်မယ်။ လမ်းပေါ်မှာ မြှောက်ပြမယ်။ လူတွေ ဝိုင်းရယ်ကြပါစေ။', en: "Tonight I'll lift their covers. Hold them up in the street. Let people laugh.", need: 'hot', seems: 'looksdown', face: 'hot', steam: 1,
        tell: { my: 'အထင်သေးနေတာ မဟုတ်ဘူး။ လက်နှစ်ဖက်စလုံးက အဖုံးနှစ်ခုကို ဖိထားတယ်။ ရင်ထဲမှာ ပူလောင်နေပေမဲ့ တစ်ခုမှ မလှန်ရသေးဘူး။', en: "Not contempt. Both hands hold the two covers down. She's burning, and she hasn't lifted either." } },
      { my: 'ငါ ခံစားခဲ့ရသလို သူတို့လည်း ခံစားရမှ တရားမျှတမှာပေါ့။', en: "It's only fair if they feel what I felt.", need: 'hot', face: 'hot', heard: true },
    ] },
    { lines: [
      { my: 'အဲဒီရက်ကန်းရုံကို ငါ ပြန်မသွားတော့ဘူး။ အားလုံး မြင်ကုန်ကြပြီ။ စောင်းနေတဲ့ အတန်းတွေကိုလေ။', en: "I'm not going back to that shed. Everyone's seen it. The crooked rows.", need: 'afraid', seems: 'given', face: 'sad', mood: 'down',
        tell: { my: 'ရက်ကန်းရက်တာကို လက်လျှော့လိုက်တာ မဟုတ်ဘူး၊ ပေါင်ပေါ်မှာ မမြင်ရတဲ့ လွန်းကို လက်ချောင်းတွေက ပစ်နေတုန်းပဲ။ ထပ်အလှောင်ခံရမှာကို ကြောက်နေတာ။', en: "She hasn't given up weaving: her fingers are still throwing an invisible shuttle in her lap. She's afraid of being laughed at again." } },
      { my: 'ပြီးသွားမှ ပြမလို့ပါ။ အခုတော့ ဘယ်တော့မှ ပြီးတော့မယ် မထင်ပါဘူး။', en: "I was going to show it when it was done. Now I don't think it'll ever be done.", need: 'afraid', seems: 'given', face: 'sad' },
    ] },
    { lines: [ // hers: she answers it herself
      { my: 'အခု သူတို့ ဘာလို့ လုပ်လဲ ငါ သိသွားပြီ… ဒါဆို အဆင်ပြေပါတယ်လို့ ငါ ပြောရတော့မှာလား။', en: 'Now I know why they did it… so do I have to say it was fine?', need: 'own', seems: 'unknown', face: 'think',
        tell: { my: 'သူ အဖြေ တောင်းနေတာ မဟုတ်ဘူး။ သူ့ခြင်းတောင်းတွေကို ပြန်ကြည့်နေတာ။ သူ့ဘာသာ ချိန်ဆနေတာ။', en: "She isn't asking for an answer. She's looking back at her baskets. She's weighing it herself." } },
    ] },
    { lines: [
      { my: 'ဒါပေမဲ့… သူတို့ကိုလည်း တစ်ခါလောက်တော့ နာကျင်စေချင်သေးတယ်။', en: "Still… I'd like them to hurt, just once.", need: 'cling', seems: 'hot', face: 'worried', steam: 1,
        tell: { my: 'အခုတော့ သူ မပူလောင်တော့ပါဘူး။ လွှတ်ချလိုက်ရင် အစကတည်းက အရေးမပါခဲ့သလို ဖြစ်သွားမှာ ကြောက်လို့ နာကျင်မှုကို ဆုပ်ကိုင်ထားတာ။', en: "She isn't boiling now. She's holding on to the hurt, afraid that letting go means it never mattered." } },
      { my: 'ငါ လွှတ်ချလိုက်ရင် သူတို့ နိုင်သွားသလို ဖြစ်သွားမှာပေါ့။', en: "If I let it go, it's like they won.", need: 'cling', face: 'sad', heard: true },
    ] },
    { lines: [ // hers: the decision
      { my: 'ဒီအထုပ် နှစ်ထုပ်ကို… ငါ ဘာလုပ်ရမလဲ။', en: 'These two bundles… what do I do with them?', need: 'own', seems: 'unknown', face: 'think',
        tell: { my: 'နင့်ကို မေးနေတာ မဟုတ်ဘူး။ လက်ချောင်းတွေက အထုံးတွေပေါ်မှာ စမ်းကြည့်နေတာ။ သူ သိပြီးသားပါ။', en: "She isn't asking you. Her fingers are on the knots, testing them. She already knows." } },
    ] },
  ],
  react: {
    miss: { my: '…ငါ ပြောချင်တာ အဲဒါ မဟုတ်ဘူး။', en: "…That isn't what I'm saying." },
    hot: { my: '(အိမွန် အထုပ်တွေကို ကျစ်ကျစ်ပါအောင် ဆုပ်ထားတယ်။ ဘာမှ ရင်ထဲ မဝင်တော့ဘူး။)', en: '(Ei Mon grips the bundles. Nothing gets in.)' },
    lean: { my: 'နင် ပြောတဲ့အတိုင်းပဲ လုပ်ပါ့မယ်… (သူ ဆုံးဖြတ်ခွင့် မရလိုက်ဘူး။)', en: "I'll do what you say… (She didn't get to decide.)" },
  },
  stepBackLines: {
    2: { my: 'ဟင့်အင်း။ သူတို့ ဘာလို့ လုပ်လဲ ဆိုတာက တစ်ပိုင်း။ အဲဒါ မှားတယ် ဆိုတာက တစ်ပိုင်း။ နှစ်ခုစလုံးကို ငါ သိလို့ ရတာပဲ။', en: 'No. Why they did it is one thing. That it was wrong is another. I can know both.' },
  },
  decision: [
    { my: 'ငါ ပြန်သိမ်းလိုက်တော့မယ်။ အဖုံး ပြန်အုပ်ထားမယ်။ ငါ ကြည့်မရတဲ့ အလုပ်မျိုးကို ငါ ကိုယ်တိုင် မလုပ်တော့ဘူး။', en: "I'll take them back. Covers on. I won't do the thing I can't stand.", face: 'happy' },
    { my: 'ငါ မကြိုက်သေးတာတော့ အမှန်ပဲ။ ဒါပေမဲ့ မုန်းတီးစိတ်ကတော့ ပေါ့ပါးသွားပြီ။', en: "I still don't like it. But the hating has gone light.", face: 'smile' },
  ],
};

// ---- Ko Pyae Sone ------------------------------------------------------------------------------------
export const D13_PS_CARDS = [
  {
    id: 'label',
    name: { my: 'နာမည်တပ်တာနဲ့ ပတ်သက်ရင် မင်း ပြောတာ မှန်တယ်', en: "You're right about the label" },
    line: { my: 'မင်း ပြောတာ မှန်တယ်၊ ဒါက အယူဝါဒတစ်ခုက လာတာပါ။ ငါ ဖုံးကွယ်မထားပါဘူး၊ ပြောပြထားတာပဲ။ ကိုယ်တိုင် စမ်းသပ်ကြည့်ပြီးမှ ဒီစာကြောင်းတွေကို အကဲဖြတ်ကြပါ။', en: "You're right, it comes from a religion. I've said so, not hidden it. Judge the lines after you've tested them yourselves." },
    answers: ['afraid'],
    from: { my: 'မာရာ့ကိုယ်ပိုင်', en: "Maya's own" },
  },
  {
    id: 'why', companion: 'parrot', // the Why-Parrot (ch 3)
    name: { my: 'ဘာလို့လဲလို့ မေးကြည့်', en: 'Ask why' },
    line: { my: 'တိတ်ဆိတ်မှုက ဘာအတွက်လဲ ဆိုတာ ဒေါ်ပွင့်ကို မေးကြည့်ပါလား။', en: 'Why not ask Daw Pwint what the quiet is for?' },
    answers: ['unknown'],
    from: { my: 'ဘာလို့လဲ ကြက်တူရွေးလေး', en: 'the Why-Parrot' },
  },
  {
    id: 'twoways', companion: 'beetle', // the Six-Nine Beetle (ch 13)
    name: { my: 'နှစ်မျိုး ဖတ်လို့ရတယ်', en: 'Reads two ways' },
    line: { my: 'ဆိုင်းဘုတ် တစ်ခုတည်းကို တရားဟောသလိုလည်း ဖတ်လို့ရသလို စည်းကမ်းချက်လိုလည်း ဖတ်လို့ရတယ်။ ဘယ်ဟာလဲ မဆုံးဖြတ်ခင် အရင် စမ်းကြည့်ပါ။', en: 'One board can read as preaching or as house rules. Test it before you decide which.' },
    answers: ['unknown', 'afraid'],
    from: { my: 'ခြောက်ကိုး ပိုးကောင်လေး', en: 'the Six-Nine Beetle' },
  },
  {
    id: 'sacred', lookalike: true,
    name: { my: 'ရိုသေလေးစားမှု ပြပါ', en: 'Show respect' },
    line: { my: 'အဲဒါ မြင့်မြတ်တဲ့ ဆိုင်းဘုတ်ပဲ။ ရိုသေလေးစားမှု ပြပါ။', en: "That's a sacred board. Show respect." },
    shows: ['looksdown'],
    really: { my: 'မစမ်းသပ်ကြည့်ဘဲ လက်ခံခိုင်းမိတာ', en: 'asking them to accept it without testing it' },
    backfire: {
      they: { my: 'တွေ့လား။ တရားဟောပြန်ပြီ။', en: 'There it is. Preaching again.' },
      maya: { my: '(သူတို့ကို စမ်းသပ်ခွင့် ပေးမယ့်အစား ဒီအတိုင်း လက်ခံခိုင်းမိပြီ။)', en: '(I asked them to accept it instead of letting them test it.)' },
    },
  },
  {
    id: 'scrubbed', lookalike: true, pencil: true, rumour: 'scrubbed',
    onlyIf: 'd13.heard.scrubbed && !d13.rumour.scrubbed',
    name: { my: 'ဘာလို့ ပွတ်ဖျက်ပစ်လိုက်တာလဲ', en: 'Why did you scrub it?' },
    line: { my: 'ဆိုင်းဘုတ်ကို ဘာလို့ ပွတ်ဖျက်ပစ်လိုက်တာလဲ။', en: 'Why did you scrub the board?' },
    shows: ['looksdown'],
    really: { my: 'ကိုယ်တိုင် မြင်ခဲ့ရသလိုမျိုး ကောလာဟလကို ပြန်ပြောမိတာ', en: 'repeating a rumour as if it were seen' },
    backfire: {
      they: { my: 'ပွတ်ဖျက်တယ် ဟုတ်လား။ သွားကြည့်စမ်း။ ငါတို့ စာလုံးတစ်လုံးတောင် မထိခဲ့ဘူး။', en: "Scrubbed? Go and look. We didn't touch a letter!" },
      maya: { my: '(ဆိုင်းဘုတ်ကို ကိုယ်တိုင် မကြည့်ဘဲ ငါ ပြောမိသွားပြီ။)', en: '(I said it without looking at the board myself.)' },
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
      { my: '"ဒါလုပ်၊ ဒါမလုပ်နဲ့" ဆိုပြီး ကလေးဘဝတုန်းက နေ့တိုင်း ဆုံးမခံခဲ့ရတာ။ ဒီနှစ်ယောက်ကိုလည်း အဲဒီလို မခံစားစေချင်ဘူး။', en: '"Do this, don\'t do that": I got lectured every day as a kid. I don\'t want these two getting it too.', need: 'afraid', seems: 'looksdown', face: 'hot',
        tell: { my: 'ဆိုင်းဘုတ်ကို အထင်သေးနေတာ မဟုတ်ဘူး။ မိုးနဲ့ ရွှေစင်ကိုပဲ လှမ်းလှမ်းကြည့်နေတယ်။ သူတို့ကို ကာကွယ်ပေးချင်နေတာ။', en: "He doesn't look down on the board. He keeps glancing at Moe and Shwe Sin. He wants to shield them." } },
    ] },
    { lines: [
      { my: 'တိတ်ဆိတ်နေလို့ ဘာတွေ ပြောင်းလဲသွားမှာလဲ။ ပျင်းစရာကြီးပဲ။', en: "What's quiet going to change? It's just boring.", need: 'unknown', seems: 'hot', face: 'think',
        tell: { my: 'ဒေါသထွက်နေတာ မဟုတ်ဘူး။ သူ တကယ် မသိတာပါ။ ရေဒီယို အသံကို တစ်ထစ် လျှော့ချလိုက်တယ်။', en: "Not anger. He really doesn't know. He's turned the radio down a notch." } },
      { my: 'မှောင်သွားရင် ဘာလို့ တိတ်တိတ်ဆိတ်ဆိတ် နေစေချင်တာလဲ။ သူ တစ်ခါမှ မပြောဘူး။', en: 'Why does she want quiet after dark? She never says.', need: 'unknown', face: 'think', heard: true },
    ] },
    { lines: [ // his
      { my: 'ဒါဆို… ငါတို့ စမ်းကြည့်ကြမလား၊ မစမ်းကြည့်ဘူးလား။', en: 'So… do we test it or not?', need: 'own', face: 'think',
        tell: { my: 'နင့်ကို မေးနေတာ မဟုတ်ဘူး။ မိုးနဲ့ ရွှေစင်ကို မေးနေတာ။', en: "He isn't asking you. He's asking Moe and Shwe Sin." } },
    ] },
  ],
  react: {
    miss: { my: '…အဲဒါ ဒါနဲ့ ဘာဆိုင်လို့လဲ။', en: "…What's that got to do with it?" },
    hot: { my: '(ကိုပြည့်စုံ ရေဒီယို အသံကို ပြန်ချဲ့လိုက်တယ်။)', en: '(Pyae Sone turns the radio up.)' },
    lean: { my: 'အစ်မ ပြောတယ်ဆိုရင် စမ်းကြည့်ကြတာပေါ့… (သူတို့ ရွေးချယ်ခွင့် မရလိုက်ဘူး။)', en: "If you say so, we'll test it… (They didn't get to choose.)" },
  },
  decision: [
    { my: 'ငါတို့ စမ်းကြည့်မယ်။ ငါတို့ဘာသာပဲ။ ဘယ်သူမှ အဖြေ လာမပြောပြနဲ့။', en: "We'll test it. Ourselves. Nobody tells us the answers.", face: 'smile' },
  ],
};
