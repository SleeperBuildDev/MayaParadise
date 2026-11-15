// Every new string of the mode switch (js/game/modeswitch.js) and of the first-time game intro (js/story/intro.js),
// in one place so they can be proofread together. DRAFT(my): Maya to check the wording (her voice: short, polite,
// warm). Each { my, en } is shown with tr() (Burmese first). The town names on the intro's cards are NOT here: they
// are the districts' own names (regions/*.js REGION.name), already in the game.

/** The pill at the top right of Maya's book world: Game | Website. */
export const SWITCH = {
  label: { my: 'ကစားပုံ ရွေးရန်', en: 'Choose a mode' },
  game: { my: 'ဂိမ်း', en: 'Game' },
  site: { my: 'ဝက်ဘ်ဆိုက်', en: 'Website' },
  // (read by screen readers on the two halves)
  gameLong: { my: 'ဂိမ်းအဖြစ် ကစားမယ်', en: 'Play the story game' },
  siteLong: { my: 'ဝက်ဘ်ဆိုက်အဖြစ် ကြည့်မယ်', en: 'Browse the website' },
  // (on the turning page while the other mode loads)
  toGame: { my: 'ဂိမ်းဖွင့်နေပါတယ်…', en: 'Opening the game…' },
  toSite: { my: 'ဝက်ဘ်ဆိုက်ကို ပြန်သွားနေပါတယ်…', en: 'Back to the website…' },
};

/** The intro's own buttons. */
export const INTRO_UI = {
  skip: { my: 'ကျော်မယ် ▸▸', en: 'Skip ▸▸' },
  title: { my: 'အမှန်မြင်ခြင်း', en: 'Reality Check' },
};

/** Maya's lines, shot by shot (the approved storyboard; js/story/intro.js films them). */
export const INTRO = {
  // 1 the Home Book: she hops out at her Writing Room and waves
  hello: {
    my: 'မင်္ဂလာပါရှင့်။ ဒါ ကျွန်မရဲ့ စာအုပ်ကမ္ဘာလေးပါ။ ဒီနေ့ကစပြီး "အမှန်မြင်ခြင်း" စာအုပ်ထဲက မြို့လေးတွေ ဖြစ်သွားပါပြီ။',
    en: 'Hello! This is my little book world. From today it becomes the towns inside the book "Reality Check".',
  },
  // 2 the camera lifts over the whole book
  journey: {
    my: 'ဒီမှာ လူတွေကို ကူညီရင်း ၁၅ ရက်ကြာ ခရီးထွက်မယ်နော်။ အခန်းတိုင်းမှာ ဘဝသင်ခန်းစာ တစ်ခုစီ ရှိတယ်။',
    en: "Here I'll travel for 15 days, helping people. Every chapter holds one lesson about life.",
  },
  // 3 the ribbon road south to the Exercise-Book Quarter
  road: {
    my: 'ပထမဆုံး ဗလာစာအုပ်ရပ်ကို သွားမယ်။ ကားမောင်းသွားလို့ရသလို ကြိုက်တဲ့နေရာမှာ ဆင်းလျှောက်လို့လည်း ရတယ်။',
    en: 'First stop, the Exercise-Book Quarter. I can drive there, and hop out to walk wherever I like.',
  },
  // 4-11 one line per town, over its own landmark (adapted from world/townintro.js TOWNS, in Maya's voice)
  towns: {
    exercise: { my: 'ဒါ ဗလာစာအုပ်ရပ်ပါ။ ဒီမှာ "မလုပ်နိုင်ဘူး" ကနေ "မလုပ်နိုင်သေးဘူး" ဖြစ်လာတတ်တယ်နော်။', en: 'The Exercise-Book Quarter. Here "I can\'t" learns to say "not yet".' },
    envelope: { my: 'စာအိတ်လို ခေါက်ထားတဲ့ လမ်းလေးပါ။ ကိုယ်သယ်လာသမျှက တစ်ယောက်ယောက်အတွက်ပါပဲ။', en: 'A road folded like an envelope. Whatever we carry is meant for someone.' },
    market: { my: 'တံဆိပ်ခေါင်းတွေနဲ့ ရေနွေးငွေ့ ဝေနေတဲ့ ဈေးလေး။ စိတ်အေးအေးထားပြီး ပေးကြမယ်၊ ကိုယ့်အိုးလည်း ပြည့်နေပါစေနော်။', en: 'A market of stamps and steam. Give with a cool heart, and keep your own pot full.' },
    junction: { my: 'ဒီမှာ သတင်းစာ ခေါင်းစဉ်တွေက အော်နေတယ်။ ဖတ်ရုံနဲ့ မယုံဘဲ ကိုယ်တိုင် သွားကြည့်ရမယ်နော်။', en: 'Here the headlines shout. Don\'t believe it just because it\'s printed; go and look yourself.' },
    wharf: { my: 'စာရင်းစာအုပ်နဲ့ လှေလေးတွေ။ ဘယ်မြစ်ဘေး မွေးမလဲ မရွေးနိုင်ပေမဲ့ ဘယ်လို လှော်မလဲဆိုတာတော့ ကိုယ်ရွေးလို့ရတယ်နော်။', en: 'Ledgers and little boats. Nobody picks their river; everyone picks how to pole it.' },
    hearth: { my: 'မီးဖိုနွေးနွေး၊ မုန့်နွေးနွေး။ ကိုယ့်ကြောင့် ဘယ်သူမှ စိတ်မကောင်းဖြစ်ပြီး အိမ်မပြန်ရပါစေနဲ့။', en: 'Warm ovens, warm bread. Let nobody walk home hurt because of you.' },
    garden: { my: 'မျိုးစေ့တွေနဲ့ ရေးထားတဲ့ ဒိုင်ယာရီ။ အရာတိုင်း သူ့အချိန်နဲ့သူ ပွင့်လာတတ်တယ်နော်။', en: 'A diary written in seeds. Everything opens in its own time.' },
    blank: { my: 'နောက်ဆုံး စာမျက်နှာလွတ်။ ကိုယ်တိုင် မစစ်ရသေးတာကို အမှန်လို့ မယူလိုက်ပါနဲ့။', en: 'The last, blank page. Nothing is true until you have tested it yourself.' },
  },
  // 11 over a Bookmark Desk (desks.js: write at one in person and its ribbon rises; lit desks are reached again
  // from the map by turning the page; hints.js: a small line says WHAT to do next, never where)
  desk: [
    { my: 'လမ်းညွှန်မြှား မရှိဘူးနော်။ လူတွေ ပြောတာ နားထောင်ပြီး ကိုယ်တိုင် လမ်းရှာရမယ်။', en: "There are no arrows. I listen to what people say and find the way myself." },
    { my: 'စာညှပ်ခုံမှာ ရေးခဲ့ရင် ဖဲကြိုးလေး ထောင်လာမယ်။ နောက်ပိုင်း မြေပုံကနေ စာမျက်နှာလှန်ပြီး အဲဒီကို ပြန်သွားလို့ရတယ်။', en: 'Write at a bookmark desk and its ribbon rises. Later I can turn the page back to it from the map.' },
  ],
  // 12 back to Maya
  ready: { my: 'အဆင်သင့်ဖြစ်ပြီလားရှင့်။ သွားကြရအောင်နော်။', en: "Ready? Let's go." },
};
