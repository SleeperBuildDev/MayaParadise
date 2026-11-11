// Every line Maya says and every label the game shows, Burmese first.
// These are drafts for Maya to proofread; edit freely, the game reads them from here.

export const LINES = {
  intro: [
    { my: 'မင်္ဂလာပါရှင့်! ကျွန်မ မာရာပါ။ ကျွန်မရဲ့ စာအုပ်ကမ္ဘာလေးထဲကို ကြိုဆိုပါတယ်။', en: "Hello! I'm Maya. Welcome to my little book world!" },
    { my: 'သွားချင်တဲ့ နေရာလေးကို နှိပ်လိုက်ရင် ကျွန်မ ကားမောင်းပြီး လိုက်ပို့ပေးမယ်နော်။', en: "Tap a place and I'll drive you there!" },
  ],
  introAgain: [{ my: 'ပြန်လာတာ ဝမ်းသာလိုက်တာရှင့်! ဒီနေ့ ဘယ်ကို သွားကြမလဲ?', en: 'So happy to see you again! Where shall we go today?' }],
  enter: {
    about: { my: 'ကျွန်မရဲ့ စာရေးခန်းလေးကို ကြိုဆိုပါတယ်ရှင့်!', en: 'Welcome to my writing room!' },
    templates: { my: 'Template လေးတွေ အတူတူ ရွေးကြည့်ကြရအောင်နော်!', en: "Let's pick a template together!" },
    scripts: { my: 'Script စတူဒီယိုကို ရောက်ပါပြီ! ဘယ်လို Script မျိုး လိုချင်လဲ?', en: 'Welcome to the Script Studio! What kind of script do you need?' },
    content: { my: 'သင့် Brand လေး တောက်ပလာအောင် ကူညီပေးမယ်နော်!', en: "I'll help your brand shine!" },
    library: { my: 'ဒီမှာ ကျွန်မရဲ့ စာအုပ်လေး ရှိပါတယ်ရှင့်!', en: 'My book lives here!' },
    contact: { my: 'စကားပြောချင်ရင် ဒီကနေ ဆက်သွယ်လို့ ရပါတယ်ရှင့်!', en: 'You can reach me from here!' },
  },
  arrive: {
    about: { my: 'ကျွန်မရဲ့ စာရေးခန်းလေးပါ', en: 'My writing room' },
    templates: { my: 'Template ဆိုင်လေး ရောက်ပြီ!', en: 'The Template Shop!' },
    scripts: { my: 'Script စတူဒီယိုပါ', en: 'The Script Studio' },
    content: { my: 'Content ဆိုင်လေးပါ', en: 'Content & Copywriting' },
    library: { my: 'ကျွန်မ စာအုပ်လေးရှိရာ!', en: 'Where my book lives!' },
    contact: { my: 'ကျွန်မကို ဒီကနေ ဆက်သွယ်ပါ', en: 'Reach me here' },
  },
  order: [{ my: 'ကျေးဇူးတင်ပါတယ်ရှင့်! Message လေး စောင့်နေမယ်နော်။', en: "Thank you! I'll be waiting for your message!" }],
  welcomeBack: [{ my: 'ပြန်လာတာ ဝမ်းသာတယ်ရှင့်! နောက်ထပ် ဘာကြည့်ချင်သေးလဲ?', en: 'Welcome back! What else would you like to see?' }],
  allVisited: [{ my: 'နေရာအားလုံး ရောက်ပြီးပြီ! အချိန်ပေးပြီး လည်ပတ်ပေးလို့ ကျေးဇူးအများကြီး တင်ပါတယ်ရှင့်။', en: "You've seen every place! Thank you so much for visiting." }],
  tapMaya: [
    { my: 'ဟီးဟီး… ယားတယ်နော်!', en: 'Hehe… that tickles!' },
    { my: 'ဘယ်ကို သွားကြမလဲ?', en: 'Where shall we go?' },
    { my: 'စာရေးရတာ အရမ်းပျော်တယ်!', en: 'I love writing!' },
  ],
};

export const TIPS = {
  tapPlace: { my: 'နေရာလေးကို နှိပ်ပါ — မာရာ မောင်းပို့ပေးပါမယ်', en: 'Tap a place — Maya drives you there' },
  drag: { my: 'ဖန်သားပြင်ကို ဖိဆွဲပြီး ကိုယ်တိုင်လည်း မောင်းလို့ရတယ်နော်', en: 'Drag on the screen to drive yourself' },
  enter: { my: '“အထဲ ဝင်မယ်” ကို နှိပ်ပါ', en: 'Tap “Go inside”' },
  walk: { my: 'ရွှေရောင် အဝိုင်းလေးတွေကို နှိပ်ပြီး ကြည့်ပါ', en: 'Tap the gold circles to look around' },
  exit: { my: 'အပြင်ထွက်ရန် အောက်ခြေ တံခါးဝဆီ လျှောက်ပါ', en: 'Walk to the doorway to go outside' },
};

export const UI = {
  loading: { my: 'ဖွင့်နေပါတယ်…', en: 'Loading…' },
  from: { my: 'မှ စတင်', en: 'from' },
  seeAll: { my: 'အားလုံး', en: 'All' },
};

// Short labels floating over each station in the rooms.
export const STATION_LABELS = {
  'about-hello': { my: 'မာရာ အကြောင်း', en: 'About Maya' },
  'about-stats': { my: 'ကိန်းဂဏန်းများ', en: 'My numbers' },
  'about-channel': { my: 'Telegram Channel', en: 'Telegram channel' },
  'about-how': { my: 'Order တင်နည်း', en: 'How to order' },
  'tpl-intro': { my: 'Template အကြောင်း', en: 'About the templates' },
  'tpl-short': { my: 'Short Videos · 50,000', en: 'Short Videos · 50,000' },
  'tpl-creator': { my: 'Creators · 50,000', en: 'Creators · 50,000' },
  'tpl-business': { my: 'Business · 80,000', en: 'Business · 80,000' },
  'scr-short': { my: 'Short Script · 50,000', en: 'Short Script · 50,000' },
  'scr-standard': { my: 'Standard · 30,000/မိနစ်', en: 'Standard · 30,000/min' },
  'scr-long': { my: 'Long Form · 20,000/မိနစ်', en: 'Long Form · 20,000/min' },
  'scr-bundles': { my: 'Package များ', en: 'Bundles' },
  'scr-consult': { my: 'Consultation ဘွတ်ကင်', en: 'Book a consultation' },
  'cc-trial': { my: 'Trial · 200,000', en: 'Trial · 200,000' },
  'cc-essentials': { my: 'Essentials · 1,000,000', en: 'Essentials · 1,000,000' },
  'cc-master': { my: 'Master · 1,600,000', en: 'Master · 1,600,000' },
  'cc-compare': { my: 'နှိုင်းယှဉ်ကြည့်ရန်', en: 'Compare' },
  'lib-book': { my: 'အမှန်မြင်ခြင်း စာအုပ်', en: 'Reality Check' },
  'lib-tiktok': { my: 'TikTok', en: 'TikTok' },
  'lib-shelf': { my: 'Playlist စင်', en: 'Playlists' },
  'ct-telegram': { my: 'Telegram', en: 'Telegram' },
  'ct-channel': { my: 'Channel', en: 'Channel' },
  'ct-messenger': { my: 'Messenger', en: 'Messenger' },
  'ct-viber': { my: 'Viber', en: 'Viber' },
  'ct-tiktok': { my: 'TikTok', en: 'TikTok' },
};

// Maya's reaction when arriving at each building: [emote, face]
export const ARRIVE_EMOTE = {
  about: ['wave', 'happy'],
  templates: ['point', 'star'],
  scripts: ['write', 'focus'],
  content: ['phone', 'wink'],
  library: ['hugBook', 'heart'],
  contact: ['kiss', 'kiss'],
};
