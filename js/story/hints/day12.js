// Day 12 hints: what to do next. Ordered by play order.
// Where (owner 2026-11-16: the corner map's mark, the notebook map's pin, the tap pointer): who = the person, live (else
// the room the day's roomCast puts them in, else `at`); go = where the step happens instead; hints-where.js has the specs.
// (ch 19 and ch 20 can go in any order; the engine shows the first unfinished step. The trunk, the bean bed and
// the board are optional: the night page replants the pods itself.)
const f = (s, k) => !!s.flag(`d12.${k}`);
// (d12.garden: day12.js's arrival box by the clasp, x 240..269, z 104..137; d12.gate waits for whoever comes: no mark)

export default [
  { id: 'd12.morning', who: 'wintwar', done: (s) => f(s, 'morning'), my: 'မဝင့်ဝါနဲ့ အရင် စကားပြောပါ', en: 'Talk to Ma Wint War first' },
  { id: 'd12.garden', go: { town: 'garden', x: 256, z: 128 }, done: (s) => f(s, 'arrived') || f(s, 'htMet'), my: 'မိုးထဲမှာ ဥယျာဉ်ကို သွားကြည့်ရအောင်', en: 'Go and see the Garden in the rain' },
  // ch 19 · U Hpo Htaw
  { id: 'd12.htMet', who: 'hpohtaw', done: (s) => f(s, 'htMet'), my: 'ဦးဖိုးထော်ကို ရှာပြီး စကားပြောပါ', en: 'Find U Hpo Htaw and talk to him' },
  { id: 'd12.looked', go: { who: 'hpohtaw', kind: 'area' }, done: (s) => f(s, 'looked') || f(s, 'sorted'), my: 'မိုးကြောင့် သူ့ခြံ ဘာဖြစ်သွားလဲ သေချာကြည့်ပါ', en: 'Look closely at what the rain did to his plot' },
  { id: 'd12.sorted', who: 'hpohtaw', done: (s) => f(s, 'sorted'), my: '"ငါ့ဟာ" နဲ့ "သူများဟာ" ဦးဖိုးထော်နဲ့ ခွဲကြည့်ပါ', en: 'Sort "mine" from "not mine" with U Hpo Htaw' },
  { id: 'd12.htTalk', who: 'hpohtaw', done: (s) => f(s, 'htTalk'), my: 'ဦးဖိုးထော်နဲ့ စကားဆက်ပြောပါ', en: 'Keep talking with U Hpo Htaw' },
  { id: 'd12.diary', who: 'hpohtaw', done: (s) => f(s, 'diaryLine') || f(s, 'htOut'), my: 'သူ့ဒိုင်ယာရီစာကြောင်းကို သူ့စကားနဲ့သူ ရေးပါစေ', en: 'Help him write his diary line in his own words' },
  { id: 'd12.replant', who: 'hpohtaw', done: (s) => f(s, 'replant') || f(s, 'ch19Done'), my: 'ဦးဖိုးထော်နဲ့အတူ ပန်းခင်းကို ပြန်စိုက်ပါ', en: 'Replant the bed with U Hpo Htaw' },
  { id: 'd12.gate', done: (s) => f(s, 'ch19Done'), my: 'ဘယ်သူတွေ ရောက်လာလဲ စောင့်ကြည့်ပါ', en: 'Stay and see who comes' },
  // ch 20 · Daw Ohn
  { id: 'd12.ohnMet', who: 'dawohn', done: (s) => f(s, 'ohnMet'), my: 'အိုးထိန်းဆရာမ ဒေါ်အုန်းကို ရှာပါ', en: 'Find Daw Ohn, the potter' },
  { id: 'd12.lid', who: 'dawohn', done: (s) => f(s, 'lid'), my: 'အိုးအဖုံး မခုန်အောင် ထိန်းပေးပါ', en: 'Keep the pot lid from rattling' },
  { id: 'd12.mlooked', go: { door: 'dryinghall', kind: 'area' }, done: (s) => f(s, 'mlooked') || f(s, 'ohnTalk'), my: 'ဒေါ်အုန်း ပတ်လည်က အဖြစ်အပျက်တွေ သေချာကြည့်ပါ', en: 'Look closely at what goes on around Daw Ohn' },
  { id: 'd12.ohnTalk', who: 'dawohn', done: (s) => f(s, 'ohnTalk'), my: 'ဒေါ်အုန်းနဲ့ စကားဆက်ပြောပါ', en: 'Keep talking with Daw Ohn' },
  { id: 'd12.lent', who: 'dawohn', done: (s) => f(s, 'lent') || f(s, 'weighed'), my: 'အမှန်ချိန်အလေးကို ဒေါ်အုန်းကို ခဏငှားပေးပါ', en: 'Lend Daw Ohn your true weight' },
  { id: 'd12.weighed', who: 'dawohn', done: (s) => f(s, 'weighed'), my: 'ဒေါ်အုန်း ကိုယ်တိုင်ချိန်တာ နောက်ကနေ ကြည့်ပါ', en: 'Stand back while Daw Ohn weighs it herself' },
  { id: 'd12.report', who: 'dawohn', done: (s) => f(s, 'report') || f(s, 'handed'), my: 'ဒေါ်အုန်းနဲ့အတူ အမှန်တွေကိုပဲ ရေးပါ', en: 'Help Daw Ohn write down only the facts' },
  { id: 'd12.handed', who: 'dawohn', done: (s) => f(s, 'handed'), my: 'ဒေါ်အုန်း ကိုယ်တိုင် တင်ပါစေလေ', en: 'Let Daw Ohn hand it in herself' },
  { id: 'd12.ch20', who: 'dawohn', done: (s) => f(s, 'ch20Done'), my: 'ဒေါ်အုန်းဆီ ပြန်သွားပြီး စကားပြောပါ', en: 'Go back to Daw Ohn and talk once more' },
  // home
  { id: 'd12.night', go: 'door:about', done: (s) => f(s, 'done'), my: 'အိမ်ပြန်ပြီး ဒီညစာ စာမျက်နှာ ရေးပါ', en: "Go home and write tonight's page" },
];
