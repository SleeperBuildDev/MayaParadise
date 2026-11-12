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
    { my: 'ဒီနေ့ ဘာရေးရမလဲလို့ စဉ်းစားနေတာ…', en: "I'm thinking about what to write today…" },
    { my: 'ကျွန်မရဲ့ “အမှန်မြင်ခြင်း” စာအုပ်လေး ဖတ်ဖူးပြီလား?', en: 'Have you read my book “Reality Check” yet?' },
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

// ---------------------------------------------------------------------------------
// Maya's reactions ("barks"): short remarks in a small bubble above her head that never stop
// the game. js/game/barks.js decides WHEN she says them (and which emote, face, sparkles and
// sound go with each); the words live here. Each key is one situation; she picks one of its
// lines at random (never the same one twice in a row). {place} becomes a place name from
// BARK_PLACES below. Keep lines short: about 45 Burmese letters fit a phone bubble.
// ---------------------------------------------------------------------------------
export const BARK_PLACES = {
  about: { my: 'ကျွန်မ စာရေးခန်းလေး', en: 'my Writing Room' },
  templates: { my: 'Template ဆိုင်လေး', en: 'the Template Shop' },
  scripts: { my: 'Script စတူဒီယို', en: 'the Script Studio' },
  content: { my: 'Content ဆိုင်လေး', en: 'the Content shop' },
  library: { my: 'စာကြည့်တိုက်', en: 'the Library' },
  contact: { my: 'စာတိုက်လေး', en: 'the Post Office' },
};

export const BARKS = {
  // standing still: ~20 s, ~45 s, ~90 s without touching anything
  idle: [
    { my: 'အင်း… ဘယ်နေရာလေး သွားကြမလဲဟင်?', en: 'Hmm… which place shall we go to?' },
    { my: '{place} ကို သွားကြည့်ရအောင်လား?', en: 'Shall we visit {place}?' },
    { my: 'ဖြည်းဖြည်း ရွေးပါ၊ ကျွန်မ စောင့်နေမယ်ရှင့်', en: "Take your time, I'll wait!" },
  ],
  idleRoom: [
    { my: 'ရွှေအဝိုင်းလေး နှိပ်လိုက်နော်၊ ကျွန်မ သွားပြမယ်', en: "Tap a gold circle and I'll show you!" },
    { my: 'ဒီအခန်းထဲမှာ ကြည့်စရာလေးတွေ အများကြီးပဲ', en: "There's so much to see in here!" },
    { my: 'ဘာကို အရင် ကြည့်ချင်လဲဟင်?', en: 'What would you like to see first?' },
  ],
  bored: [
    { my: 'အင်း… နည်းနည်း ပျင်းလာပြီရှင့်', en: "Mm… I'm getting a little bored." },
    { my: 'ဟဲလို… ရှိသေးလားဟင်?', en: 'Hello… are you still there?' },
    { my: 'သီချင်းလေး ညည်းနေမယ်… ♪ လာလာလာ ♪', en: "I'll hum a little song… ♪ la la la ♪" },
  ],
  sleepy: [
    { my: 'ဟား… သမ်းလာပြီ… {place} သွားကြမလားဟင်?', en: 'Yawn… getting sleepy… shall we go to {place}?' },
    { my: 'မျက်လုံးလေး ခဏ မှိတ်ထားမယ်… ပြန်လာရင် နှိုးပါဦးရှင့်', en: "I'll rest my eyes… wake me when you're back!" },
    { my: 'Zzz… စာအုပ်အသစ်အကြောင်း အိပ်မက်မက်နေတာ…', en: 'Zzz… dreaming about a new book…' },
  ],
  // driving
  firstDrive: [
    { my: 'ဝိုး! ကိုယ်တိုင် မောင်းတတ်တာပဲ! တော်လိုက်တာ', en: 'Wow, you can drive! Nice!' },
    { my: 'မောင်းကောင်းလိုက်တာ! ကျွန်မ ထိုင်စီးရုံပဲ', en: "Great driving! I'll just enjoy the ride." },
  ],
  driveLong: [
    { my: 'မောင်းရတာ ပျော်တယ်! {place} ဝင်ကြည့်မလား?', en: 'Driving is fun! Pop into {place}?' },
    { my: 'လေလေး တဖြူးဖြူးနဲ့ ကောင်းလိုက်တာ!', en: 'What a lovely breeze!' },
    { my: 'လမ်းလေးတွေ လှတယ်မဟုတ်လား? ရွှေမင်နဲ့ ဆွဲထားတာလေ', en: 'Pretty roads, right? Drawn in gold ink!' },
  ],
  driveVeryLong: [
    { my: 'အကြာကြီး မောင်းနေပြီနော်! ခဏ ရပ်ကြမလား?', en: "We've driven for ages! Shall we stop?" },
    { my: 'ဓာတ်ဆီ ကုန်တော့မယ် ဟီး… {place} မှာ ခဏရပ်ရအောင်', en: "Almost out of gas, hehe… let's stop at {place}." },
    { my: 'ကမ္ဘာတစ်ပတ် ပတ်ပြီးပြီ ထင်တယ်! {place} မှာ ရပ်ကြမလား?', en: 'I think we went round the world! Stop at {place}?' },
  ],
  dizzy: [
    { my: 'အမလေး… ခေါင်းမူးလာပြီ!', en: 'Whoa… my head is spinning!' },
    { my: 'လည်… လည်… ခေါင်းပေါ်မှာ ကြယ်လေးတွေ ပတ်နေပြီ', en: 'Round and round… stars circling my head!' },
    { my: 'ဖြည်းဖြည်းလေးနော်… ကျွန်မ မူးတယ်', en: "Slowly please… I'm dizzy!" },
  ],
  speedy: [
    { my: 'ဝိုး! မြန်လိုက်တာ! ဆံပင်တွေ ပွကုန်ပြီ', en: 'Wheee! So fast! My hair is a mess!' },
    { my: 'ဖြည်းဖြည်းလေး မောင်းပါ… ကျွန်မ ကြောက်တယ် ဟီး', en: "Easy now… I'm a little scared, hehe!" },
    { my: 'အရှိန်ပြင်းလိုက်တာ! သေချာ ကိုင်ထားပေါ့!', en: 'Full speed! Hold on tight!' },
  ],
  hardBrake: [
    { my: 'အိုး! ရုတ်တရက် ဘရိတ်အုပ်လိုက်တာ!', en: 'Oh! What a sudden stop!' },
    { my: 'အမလေး လန့်လိုက်တာ! ဘာဖြစ်တာလဲဟင်?', en: 'Eek, you scared me! What happened?' },
  ],
  bump: [
    { my: 'အိုး… လမ်းက ဒီမှာတင် ဆုံးသွားပြီ! ပြန်လှည့်ရအောင်', en: "Oops… the road ends here! Let's turn back." },
    { my: 'ဒုန်း! ဟီး… ဒီဘက်မှာ လမ်းမရှိတော့ဘူး', en: 'Bonk! Hehe… no road this way.' },
  ],
  uturns: [
    { my: 'လမ်းမှားနေလား? အောက်ကခလုတ် နှိပ်ရင် ပို့ပေးမယ်', en: "Lost? Tap a button below and I'll drive you!" },
    { my: 'ဟိုသွား ဒီသွား… ဘယ်ကို သွားချင်လဲ ပြောပါဦး', en: 'This way, that way… where shall we go?' },
  ],
  passBy: [
    { my: 'အာ… {place} ကျော်သွားပြီ! ပြန်လှည့်မလား?', en: 'Oh, we passed {place}! Turn back?' },
    { my: '{place} ထဲ မဝင်တော့ဘူးလား? ကြည့်စရာလေးတွေ ရှိတယ်', en: 'Not stopping at {place}? It has fun things!' },
  ],
  // places and rooms
  placeAgain: [
    { my: '{place} ကို ပြန်ရောက်ပြန်ပြီ! သဘောကျတယ်ပေါ့?', en: 'Back at {place} again! You like it here?' },
    { my: 'ဒီနေရာလေးကို ကြိုက်ပုံရတယ်နော် ဟီး', en: 'Looks like you love this place, hehe!' },
  ],
  leftEmpty: [
    { my: 'ဟင်… ဘာမှ မကြည့်ရသေးဘူးနော်၊ နောက်မှ ပြန်လာကြမယ်', en: "Hm… we didn't see anything yet. Let's come back later!" },
    { my: 'ရွှေအဝိုင်းလေးတွေ ကျန်ခဲ့တယ်၊ နောက်မှ ကြည့်မယ်', en: 'We left the gold circles behind — next time!' },
  ],
  roomComplete: [
    { my: 'ဒီအခန်းထဲက အားလုံး ကြည့်ပြီးပြီ! တော်လိုက်တာ', en: 'You saw everything in this room! Amazing!' },
    { my: 'အားလုံး စုံသွားပြီ! စိတ်ရှည်ရှည် ကြည့်ပေးလို့ ကျေးဇူးနော်', en: 'All complete! Thanks for looking so patiently!' },
  ],
  allPlaces: [
    { my: 'ဒီနေ့လည်း ခြောက်နေရာလုံး ရောက်ပြီ! ဝမ်းသာလိုက်တာ', en: 'All six places again today! So happy!' },
    { my: 'နေရာတိုင်း ထပ်ပတ်ပြီးပြီ! အကောင်းဆုံး ဧည့်သည်လေးပဲ', en: "Every place again! You're my best guest!" },
  ],
  roomLong: [
    { my: 'ဒီအခန်းလေးကို တကယ် ကြိုက်တာပဲ!', en: 'You really like this room!' },
    { my: 'တခြားအခန်းတွေလည်း သွားကြမလား? {place} ကော?', en: 'Shall we see other rooms too? {place}?' },
  ],
  wall: [
    { my: 'ဟီး… နံရံကို ဖြတ်လျှောက်လို့ မရဘူးလေ', en: "Hehe… I can't walk through walls!" },
    { my: 'အ… ဒီဘက်က ပိတ်နေတယ်လေ', en: 'Oof… this way is blocked.' },
  ],
  // the price / order sheet (shown small, while the sheet is open)
  sheetPrice: [
    { my: 'မေးစရာရှိရင် Message ပို့ပါနော်', en: 'Any questions? Message me!' },
    { my: 'အေးဆေး ဖတ်ကြည့်ပါ၊ မရှင်းတာရှိရင် မေးလို့ရတယ်ရှင့်', en: 'Take your time — ask me anything that’s unclear!' },
  ],
  sheetLong: [
    { my: 'အသေးစိတ် ဖတ်ပေးတာ ကျေးဇူးပါရှင့်', en: 'Thanks for reading so carefully!' },
    { my: 'စဉ်းစားနေတာလား? Telegram ကနေ မေးလို့ရတယ်နော်', en: 'Thinking it over? Ask me on Telegram!' },
  ],
  // buttons and taps
  lang: [
    { my: 'မြန်မာလို ပြန်ပြောကြမယ်နော်!', en: "English it is! Let's chat in English." },
    { my: 'ဟုတ်ကဲ့၊ မြန်မာလို ပြောမယ်ရှင့်', en: "Sure, I'll speak English now!" },
  ],
  soundOff: [
    { my: 'ရပါတယ်ရှင့်၊ တိတ်တိတ်လေး လည်ကြမယ်', en: "Okay, we'll explore quietly!" },
    { my: 'ရှူး… တိတ်တိတ်လေးပေါ့', en: 'Shh… nice and quiet.' },
  ],
  soundOn: [
    { my: 'ဟေး! အသံတွေ ပြန်ကြားရပြီ!', en: 'Yay! The sounds are back!' },
    { my: 'အသံလေးတွေနဲ့ဆို ပိုပျော်ဖို့ကောင်းတယ်', en: "Everything's more fun with sound!" },
  ],
  tapSpam: [
    { my: 'ဟီးဟီး… ဘာလိုချင်လို့လဲဟင်? နေရာလေး ရွေးလိုက်လေ', en: 'Hehe… need something? Pick a spot!' },
    { my: 'အို… ယားလိုက်တာ! တော်ပါတော့ ဟီး', en: 'Oh… that tickles! Okay, enough, hehe!' },
    { my: 'ပျင်းနေပြီလား? ဟီး… တစ်နေရာရာ သွားကြရအောင်', en: "Bored? Hehe… let's go somewhere!" },
  ],
  honkSpam: [
    { my: 'ပီပီ! ဟွန်း အရမ်းတီးရင် ငှက်လေးတွေ လန့်ကုန်မယ်', en: 'Beep beep! Too much honking scares the birds!' },
    { my: 'ဟွန်းသံ ကြိုက်တာလား? ဟီး… ပီပီ!', en: 'You like the horn? Hehe… beep beep!' },
  ],
  // time and visits (at most once per visit)
  lateNight: [
    { my: 'ညနက်နေပြီ… မျက်စိလေး အနားပေးပါဦးရှင့်', en: "It's late… please rest your eyes." },
    { my: 'ညဉ့်နက်ထိ လာလည်တာ ကျေးဇူးပါ၊ အိပ်မက်လှလှ မက်ပါစေ', en: 'Thanks for visiting so late — sweet dreams!' },
  ],
  morning: [
    { my: 'မင်္ဂလာနံနက်ခင်းပါ! မနက်စာ စားပြီးပြီလား?', en: 'Good morning! Had breakfast yet?' },
    { my: 'မနက်စောစော လာလည်တာ ဝမ်းသာတယ်!', en: 'So happy you came by this early!' },
  ],
  lunch: [
    { my: 'နေ့လယ်စာ စားပြီးပြီလား? ထမင်းနပ်မှန်အောင် စားနော်', en: "Had lunch yet? Don't skip your meals!" },
    { my: 'ထမင်းစားချိန် ရောက်ပြီ! စားပြီးမှ ဆက်လည်နော်', en: 'Lunchtime! Eat first, then explore.' },
  ],
  evening: [
    { my: 'ညနေခင်းလေး သာယာလိုက်တာ! ညစာ စားပြီးပြီလား?', en: 'What a lovely evening! Had dinner?' },
    { my: 'ဒီနေ့ ပင်ပန်းခဲ့လား? ဒီမှာ ခဏ အပန်းဖြေပါဦး', en: 'Long day? Relax here for a bit!' },
  ],
  returning: [
    { my: 'မတွေ့တာ ကြာပြီနော်! သတိရနေတာရှင့်', en: 'Long time no see! I was thinking of you!' },
    { my: 'နေကောင်းရဲ့လားဟင်? ပြန်လာလည်ပေးလို့ ကျေးဇူးပါ', en: 'How have you been? Thanks for coming back!' },
  ],
  longSession: [
    { my: 'ဒီလောက်ကြာကြာ နေပေးတာ ဝမ်းသာလိုက်တာရှင့်', en: "So happy you've stayed this long!" },
    { my: '၁၀ မိနစ် ရှိပြီ! အတူရှိပေးလို့ ကျေးဇူးနော်', en: 'Ten minutes already! Thanks for staying!' },
  ],
  breakTime: [
    { my: 'ရေလေး သောက်ပြီး ခဏ နားပါဦးနော်', en: 'Drink some water and take a little break!' },
    { my: 'မျက်စိ ညောင်းနေပြီလား? အဝေးကို ခဏ ငေးကြည့်လိုက်ပါဦး', en: 'Tired eyes? Look at something far away for a moment!' },
  ],
  tabBack: [
    { my: 'ပြန်လာပြီလား! စောင့်နေတာ ဟီး', en: "You're back! I was waiting!" },
    { my: 'ဟေး ပြန်ရောက်ပြီ! ဆက်လည်ကြမယ်', en: "Yay, you're back! Let's keep going." },
  ],
  landscape: [
    { my: 'ဖန်သားပြင် ကျယ်ကျယ်နဲ့ဆို ပိုလှတယ်ရှင့်!', en: 'The wide view looks so pretty!' },
  ],
};
