// Day 5 hints: what to do next (never where). Ordered by play order.
// (ch 10 and ch 2 can go in any order; the engine shows the first unfinished step. The night page needs
//  d5.ch10Done and d5.ch2Done; the bridge and Nay Chi are the main thread. Every flag is set in day5.js.)
const f = (s, k) => !!s.flag(`d5.${k}`);

export default [
  { id: 'd5.morning', who: 'wintwar', done: (s) => f(s, 'morning'), my: 'မဝင့်ဝါနဲ့ အရင် စကားပြောပါ', en: 'Talk to Ma Wint War first' },
  // ch 10 · Ko Lwin and Khwar Nyo
  { id: 'd5.kolwin', who: 'kolwin', done: (s) => f(s, 'klMet'), my: 'ကိုလွင် ဘာလို့ ထွင်းတာ ရပ်လဲ မေးကြည့်ပါ', en: 'Ask Ko Lwin why he stopped carving' },
  { id: 'd5.looks', who: 'khwarnyo', done: (s) => f(s, 'looked'), my: 'ကိုလွင်ပြောတာတွေ ကိုယ်တိုင်ကြည့်ပါ (၄ ခု)', en: 'See for yourself what Ko Lwin spoke of (4 things)' },
  { id: 'd5.klTalk', who: 'kolwin', done: (s) => f(s, 'klTalk'), my: 'ကိုလွင်နဲ့ စကားဆက်ပြောပါ', en: 'Talk with Ko Lwin again' },
  { id: 'd5.carve', who: 'kolwin', done: (s) => f(s, 'carved'), my: 'ကိုလွင်နဲ့အတူ အနားကွပ်ကို ထွင်းပါ', en: 'Carve the border with Ko Lwin' },
  { id: 'd5.note', who: 'kolwin', done: (s) => f(s, 'note'), my: 'ကိုလွင့်စာတိုလေး ရေးတာ ကူပေးပါ', en: 'Help Ko Lwin write his note' },
  { id: 'd5.carry', who: 'khwarnyo', done: (s) => f(s, 'carried'), my: 'အထုပ်ကို ခွာညိုဆီ ကိုယ်တိုင် လမ်းလျှောက်ပို့ပါ', en: 'Walk the bundle to Khwar Nyo yourself' },
  { id: 'd5.ch10', who: 'kolwin', done: (s) => f(s, 'ch10Done'), my: 'ကိုလွင်ဆီ ပြန်သွားပါ', en: 'Go back to Ko Lwin' },
  // ch 2 · Ko Thiha and his mother's raft
  { id: 'd5.maungnge', who: 'maungnge', done: (s) => f(s, 'mnMet') || f(s, 'thMet'), my: 'မောင်ငယ်ကို ရှာပြီး စကားပြောပါ', en: 'Find Maung Nge and talk to him' },
  { id: 'd5.thiha', who: 'kothiha', done: (s) => f(s, 'thMet'), my: 'မျောနေတဲ့ ကိုသီဟနဲ့ စကားပြောပါ', en: 'Talk to Ko Thiha, adrift on his raft' },
  { id: 'd5.sort', who: 'kothiha', done: (s) => f(s, 'sorted'), my: 'ကိုသီဟရဲ့ စာရင်းကို အတူ ခွဲကြည့်ပါ', en: "Sort Ko Thiha's list with him" },
  { id: 'd5.looks2', done: (s) => f(s, 'looked2'), my: 'ကိုသီဟရဲ့ ဘဝကို ကိုယ်တိုင်ကြည့်ပါ (၅ ခု)', en: "Look at Ko Thiha's life yourself (5 things)" },
  { id: 'd5.thTalk', who: 'kothiha', done: (s) => f(s, 'thTalk'), my: 'ကိုသီဟနဲ့ စကားဆက်ပြောပါ', en: 'Talk with Ko Thiha again' },
  { id: 'd5.pole', who: 'kothiha', done: (s) => f(s, 'poled'), my: 'ကိုသီဟနဲ့အတူ ဖောင်ထိုးပြီး အထုပ်ပို့ပါ', en: 'Pole the raft with Ko Thiha and deliver' },
  { id: 'd5.mum', who: 'dawsanda', done: (s) => f(s, 'ch2Done'), my: 'ကိုသီဟနဲ့ သူ့အမေဆီ လိုက်သွားပါ', en: 'Go with Ko Thiha to his mother' },
  // main thread · the Painted Map's bridge, Nay Chi
  { id: 'd5.bridge', done: (s) => f(s, 'bridge'), my: 'ခြယ်မြေပုံက တံတားကို ကိုယ်တိုင်စစ်ကြည့်ပါ', en: "Check the Painted Map's bridge yourself" },
  { id: 'd5.naychi', who: 'naychi', done: (s) => f(s, 'ncMet'), my: 'နေခြည်ကို ဘာလုပ်ရမလဲ ပြောပြပါ', en: 'Tell Nay Chi what to do' },
  { id: 'd5.night', done: (s) => f(s, 'done'), my: 'အိမ်ပြန်ပြီး ဒီညစာ စာမျက်နှာ ရေးပါ', en: "Go home and write tonight's page" },
];
