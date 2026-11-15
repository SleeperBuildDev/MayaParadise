// Maya's short reactions in GAME mode. The website's barks (js/game/strings.js BARKS, said by js/game/barks.js)
// are about the website: "Take your time, I'll wait", "Any questions? Message me!", "You saw everything in this
// room", "Thanks for visiting". In the story game those lines do not fit, so story mode swaps the situations below
// for its own lines and drops the website-only situations. Situations not listed here (dizzy, speedy, hardBrake,
// bump, wall, lang, sound, honkSpam, landscape, birds, breakTime) are about driving or the screen and fit both.
// Still never points the way: no place to go, no button to press. All Burmese lines: proofread by Gemini.
//   applyStoryBarks(BARKS, LINES)   once, story mode only (doors.js); edits the shared tables in place

export const STORY_BARKS = {
  idle: [
    { my: 'ဒီမြို့က လူတွေ ဘာတွေပြောနေကြလဲ နားထောင်ကြည့်ရအောင်နော်။', en: "Let's listen to what people here are saying." },
    { my: 'ခဏရပ်ပြီး ဘေးပတ်လည် ကြည့်ရတာလည်း ကောင်းသားပဲ။', en: 'Stopping to look around is good too.' },
    { my: 'ဒီနားမှာ အကူအညီ လိုနေတဲ့သူ ရှိမလား မသိဘူးနော်။', en: 'I wonder if someone here needs a hand.' },
  ],
  bored: [
    { my: 'ခြေထောက်တွေ ညောင်းလာပြီ… လမ်းနည်းနည်း လျှောက်ရအောင်။', en: "My legs are getting stiff… let's walk." },
    { my: 'ဟဲလို… ရှိသေးရဲ့လားဟင်?', en: 'Hello… are you still there?' },
    { my: 'သီချင်းလေး ညည်းနေမယ်နော်… ♪ လာလာလာ ♪', en: "I'll hum a little song… ♪ la la la ♪" },
  ],
  sleepy: [
    { my: 'ဟား… အိပ်ချင်လာပြီ… ခဏ ထိုင်နားလိုက်ဦးမယ်။', en: "Yawn… I'll sit down for a bit." },
    { my: 'မျက်လုံးလေး ခဏ မှိတ်ထားမယ်နော်… ပြန်လာရင် နှိုးပါဦးရှင့်။', en: "I'll rest my eyes… wake me when you're back!" },
    { my: 'Zzz… စာအုပ်အသစ်အကြောင်း အိပ်မက်မက်နေတာ…', en: 'Zzz… dreaming about a new book…' },
  ],
  firstDrive: [
    { my: 'ကားလေးနဲ့ မြို့ပတ်ရတာ ပျော်စရာကြီး!', en: 'Driving round town is fun!' },
    { my: 'ဖြည်းဖြည်းမောင်းမှ လမ်းဘေးက လူတွေကို မြင်ရမှာနော်။', en: 'Drive slowly so we can see the people by the road.' },
  ],
  driveLong: [
    { my: 'လေလေး တဖြူးဖြူးနဲ့ နေလို့ကောင်းလိုက်တာ!', en: 'What a lovely breeze!' },
    { my: 'လမ်းလေးတွေ လှတယ်မလား? ရွှေမင်နဲ့ ဆွဲထားတာလေ။', en: 'Pretty roads, right? Drawn in gold ink!' },
    { my: 'ကားပေါ်က ဆင်းလျှောက်ကြည့်ရင်လည်း တွေ့စရာလေးတွေ ရှိဦးမှာနော်။', en: 'Walking finds things too, you know.' },
  ],
  driveVeryLong: [
    { my: 'မောင်းလာတာ အကြာကြီးရှိပြီ! ခဏ နားကြမလား?', en: "We've driven for ages! Shall we stop?" },
    { my: 'ခဏရပ်ပြီး လမ်းလျှောက်ရအောင်နော်။ ခြေထောက်တွေ ညောင်းနေပြီ။', en: "Let's stop and walk a bit. My legs are stiff." },
  ],
  uturns: [
    { my: 'ဟိုဘက်၊ ဒီဘက်… ခဏ ရပ်ပြီး စဉ်းစားကြည့်ရအောင်။', en: "This way, that way… let's stop and think." },
    { my: 'လမ်းပျောက်နေရင် လူတွေကို မေးကြည့်တာ အကောင်းဆုံးပဲနော်။', en: 'Lost? Asking people works best.' },
  ],
  tapSpam: [
    { my: 'အိုး… ယားတယ်! တော်ပြီနော်၊ ဟီးဟီး!', en: 'Oh… that tickles! Okay, enough, hehe!' },
    { my: 'ဟီးဟီး… ကျွန်မကိုပဲ တို့မနေနဲ့၊ လူတွေနဲ့လည်း စကားသွားပြောကြည့်ဦးလေ။', en: 'Hehe… instead of poking me, try talking to people!' },
  ],
  longSession: [
    { my: 'အတူတူ လျှောက်လည်ရတာ အရမ်းပျော်တာပဲ!', en: 'I love exploring together this long!' },
    { my: 'အချိန်တွေ ကုန်တာ မြန်လိုက်တာ!', en: 'Time flies!' },
  ],
  morning: [
    { my: 'မင်္ဂလာနံနက်ခင်းပါ! မနက်စာ စားပြီးပြီလား?', en: 'Good morning! Had breakfast yet?' },
    { my: 'မနက်စောစော မြို့လေးက အေးချမ်းလိုက်တာ။', en: 'The town is so calm this early.' },
  ],
  evening: [
    { my: 'ညနေခင်းလေး လှလိုက်တာ! ညစာ စားပြီးပြီလား?', en: 'What a lovely evening! Had dinner?' },
    { my: 'ပင်ပန်းရင် ခဏ နားပြီးမှ ဆက်ကြမယ်နော်။', en: "Tired? Let's rest a bit, then carry on." },
  ],
  lateNight: [
    { my: 'ညနက်နေပြီ… မျက်လုံးလေးတွေ နားပါဦး။', en: "It's late… please rest your eyes." },
    { my: 'ဒီနေ့အတွက် ဒီလောက်ဆို လုံလောက်ပြီ — အိပ်မက်လှလှ မက်ပါစေ။', en: "That's enough for today — sweet dreams!" },
  ],
};

// website-only situations: rooms with gold circles, price sheets, the six website places
export const STORY_DROP = ['idleRoom', 'passBy', 'placeAgain', 'leftEmpty', 'roomComplete', 'allPlaces', 'roomLong', 'sheetPrice', 'sheetLong'];

// tapping Maya (main.js tapMaya reads LINES.tapMaya)
export const STORY_TAP = [
  { my: 'ဟီးဟီး… ယားတယ်နော်!', en: 'Hehe… that tickles!' },
  { my: 'စာရေးရတာ အရမ်းပျော်တယ်!', en: 'I love writing!' },
  { my: 'ဒီနေ့ ဘာရေးရမလဲ စဉ်းစားနေတာ…', en: "I'm thinking about what to write today…" },
  { my: 'လူတိုင်းမှာ ကိုယ်ပိုင် ဇာတ်လမ်းလေး ရှိတယ်နော်။', en: 'Everyone has a story of their own.' },
  { my: 'ဒီမြို့လေးတွေက ကျွန်မစာအုပ်ထဲကပေါ့!', en: 'These towns come from my book!' },
];

export function applyStoryBarks(BARKS, LINES) {
  if (!BARKS || BARKS.__story) return;
  for (const k of STORY_DROP) delete BARKS[k];
  for (const [k, lines] of Object.entries(STORY_BARKS)) if (k in BARKS) BARKS[k] = lines.slice();
  if (LINES && Array.isArray(LINES.tapMaya)) LINES.tapMaya.splice(0, LINES.tapMaya.length, ...STORY_TAP);
  Object.defineProperty(BARKS, '__story', { value: true });
}
