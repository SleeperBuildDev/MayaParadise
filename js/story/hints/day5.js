// Day 5 hints: what to do next. Ordered by play order.
// Where (owner 2026-11-16: the corner map's mark, the notebook map's pin, the tap pointer): who = the person, live (else
// the room the day's roomCast puts them in, else `at`); go = where the step happens instead; hints-where.js has the specs.
// (ch 10 and ch 2 can go in any order; the engine shows the first unfinished step. The night page needs
//  d5.ch10Done and d5.ch2Done; the bridge and Nay Chi are the main thread. Every flag is set in day5.js.)
const f = (s, k) => !!s.flag(`d5.${k}`);
// (looks: the postroom's and the carver's stations (rooms/market.js); the raft, the ferry and the sandbar are day5.js's
// own (window.__day5.A); the weigh-house slate and the sandal house's basket are stations with a 3D `at` (rooms/wharf.js))
// (the bridge beat starts at Jetty End: the wharfEnd desk; Ko Thiha's five looks are round his raft)

export default [
  { id: 'd5.morning', who: 'wintwar', done: (s) => f(s, 'morning'), my: 'မဝင့်ဝါနဲ့ အရင် စကားပြောပါ', en: 'Talk to Ma Wint War first' },
  // ch 10 · Ko Lwin and Khwar Nyo
  { id: 'd5.kolwin', who: 'kolwin', done: (s) => f(s, 'klMet'), my: 'ကိုလွင် ဘာလို့ ထွင်းတာ ရပ်လဲ မေးကြည့်ပါ', en: 'Ask Ko Lwin why he stopped carving' },
  { id: 'd5.looks', looks: [
    { f: 'd5.look.trials', room: 'postroom', st: 'trials', y: 0.85, r: 0.4 },
    { f: 'd5.look.offer', room: 'postroom', st: 'offer', y: 1.6, r: 0.2 },
    { f: 'd5.look.notice', room: 'postroom', st: 'notice', y: 1.8, r: 0.45 },
    { f: 'd5.look.bench', room: 'carvershop', st: 'bench', y: 0.8, r: 0.45 },
  ], who: 'khwarnyo', done: (s) => f(s, 'looked'), my: 'ကိုလွင်ပြောတာတွေ ကိုယ်တိုင်ကြည့်ပါ (၄ ခု)', en: 'See for yourself what Ko Lwin spoke of (4 things)' },
  { id: 'd5.klTalk', who: 'kolwin', done: (s) => f(s, 'klTalk'), my: 'ကိုလွင်နဲ့ စကားဆက်ပြောပါ', en: 'Talk with Ko Lwin again' },
  { id: 'd5.carve', who: 'kolwin', done: (s) => f(s, 'carved'), my: 'ကိုလွင်နဲ့အတူ အနားကွပ်ကို ထွင်းပါ', en: 'Carve the border with Ko Lwin' },
  { id: 'd5.note', who: 'kolwin', done: (s) => f(s, 'note'), my: 'ကိုလွင့်စာတိုလေး ရေးတာ ကူပေးပါ', en: 'Help Ko Lwin write his note' },
  { id: 'd5.carry', who: 'khwarnyo', done: (s) => f(s, 'carried'), my: 'အထုပ်ကို ခွာညိုဆီ ကိုယ်တိုင် လမ်းလျှောက်ပို့ပါ', en: 'Walk the bundle to Khwar Nyo yourself' },
  { id: 'd5.ch10', who: 'kolwin', done: (s) => f(s, 'ch10Done'), my: 'ကိုလွင်ဆီ ပြန်သွားပါ', en: 'Go back to Ko Lwin' },
  // ch 2 · Ko Thiha and his mother's raft
  { id: 'd5.maungnge', who: 'maungnge', done: (s) => f(s, 'mnMet') || f(s, 'thMet'), my: 'မောင်ငယ်ကို ရှာပြီး စကားပြောပါ', en: 'Find Maung Nge and talk to him' },
  { id: 'd5.thiha', who: 'kothiha', done: (s) => f(s, 'thMet'), my: 'မျောနေတဲ့ ကိုသီဟနဲ့ စကားပြောပါ', en: 'Talk to Ko Thiha, adrift on his raft' },
  { id: 'd5.sort', who: 'kothiha', done: (s) => f(s, 'sorted'), my: 'ကိုသီဟရဲ့ စာရင်းကို အတူ ခွဲကြည့်ပါ', en: "Sort Ko Thiha's list with him" },
  { id: 'd5.looks2', looks: [
    { f: 'd5.look2.patches', at: () => window.__day5?.A?.raftAt || { x: 85.4, z: 468.9 }, y: -0.1, r: 0.9 },
    { f: 'd5.look2.bail', at: () => window.__day5?.A?.ferryAt || { x: 91.8, z: 428.25 }, y: 0.3, r: 1.2 },
    { f: 'd5.look2.shallow', at: () => window.__day5?.A?.sandbar || { x: 86, z: 491 }, y: -0.6, r: 2 },
    { f: 'd5.look2.shifts', room: 'weighhouse', st: 'tally', r: 0.55 },
    { f: 'd5.look2.grip', when: (s) => f(s, 'sorted'), room: 'sandahouse', st: 'basket', r: 0.22 },
  ], go: { who: 'kothiha', kind: 'area' }, done: (s) => f(s, 'looked2'), my: 'ကိုသီဟရဲ့ ဘဝကို ကိုယ်တိုင်ကြည့်ပါ (၅ ခု)', en: "Look at Ko Thiha's life yourself (5 things)" },
  { id: 'd5.thTalk', who: 'kothiha', done: (s) => f(s, 'thTalk'), my: 'ကိုသီဟနဲ့ စကားဆက်ပြောပါ', en: 'Talk with Ko Thiha again' },
  { id: 'd5.pole', who: 'kothiha', done: (s) => f(s, 'poled'), my: 'ကိုသီဟနဲ့အတူ ဖောင်ထိုးပြီး အထုပ်ပို့ပါ', en: 'Pole the raft with Ko Thiha and deliver' },
  { id: 'd5.mum', who: 'dawsanda', done: (s) => f(s, 'ch2Done'), my: 'ကိုသီဟနဲ့ သူ့အမေဆီ လိုက်သွားပါ', en: 'Go with Ko Thiha to his mother' },
  // main thread · the Painted Map's bridge, Nay Chi
  { id: 'd5.bridge', go: { desk: 'wharfEnd', kind: 'area' }, done: (s) => f(s, 'bridge'), my: 'ခြယ်မြေပုံက တံတားကို ကိုယ်တိုင်စစ်ကြည့်ပါ', en: "Check the Painted Map's bridge yourself" },
  { id: 'd5.naychi', who: 'naychi', done: (s) => f(s, 'ncMet'), my: 'နေခြည်ကို ဘာလုပ်ရမလဲ ပြောပြပါ', en: 'Tell Nay Chi what to do' },
  { id: 'd5.night', go: 'door:about', done: (s) => f(s, 'done'), my: 'အိမ်ပြန်ပြီး ဒီညစာ စာမျက်နှာ ရေးပါ', en: "Go home and write tonight's page" },
];
