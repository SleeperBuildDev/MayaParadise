// Day 11 hints: what to do next. Ordered by play order.
// Where (owner 2026-11-16: the corner map's mark, the notebook map's pin, the tap pointer): who = the person, live (else
// the room the day's roomCast puts them in, else `at`); go = where the step happens instead; hints-where.js has the specs.
// (Pieces 1, 2, 3, 5, 6, 7 go in any order; any four light the lamps, and from then on Nay Chi's thread (piece 4)
// comes first. All seven close the Wall; then the night page.)
const f = (s, k) => !!s.flag(`d11.${k}`);

export default [
  { id: 'd11.morning', who: 'wintwar', done: (s) => f(s, 'morning'), my: 'မဝင့်ဝါနဲ့ အရင် စကားပြောပါ', en: 'Talk to Ma Wint War first' },
  { id: 'd11.naychi', who: 'naychi', done: (s) => f(s, 'ncMet'), my: 'နေခြည့်စာအတိုင်း သူ့ကို လိုက်ရှာပါ', en: 'Find Nay Chi, as her note asked' },
  // lamp-lighting (any four pieces): Nay Chi's talk, then piece 4 outdoors
  { id: 'd11.ncTalk', who: 'naychi', when: (s) => f(s, 'lamp'), done: (s) => f(s, 'ncTalk') || f(s, 'p4'), my: 'မီးထွန်းပြီ၊ နေခြည့်ကို ရှာပြီး စကားပြောပါ', en: 'The lamps are lit: find Nay Chi and talk' },
  { id: 'd11.p4', who: 'naychi', when: (s) => f(s, 'ncTalk'), done: (s) => f(s, 'p4'), my: 'နေခြည် ကိုယ်တိုင်လုပ်ပါစေ၊ အဝေးက ကြည့်နေပါ', en: 'Let Nay Chi do it herself; watch from afar' },
  // piece 1 · Daw Khin May
  { id: 'd11.wall', target: () => window.__day11?.row?.wall, done: (s) => f(s, 'wall.1') || f(s, 'p1.call') || f(s, 'p1'), my: 'နံရံပေါ်က စာတိုတွေကို ဖတ်ကြည့်ပါ', en: 'Read the short notes on the Note Wall' },
  { id: 'd11.p1in', who: 'khinmay', done: (s) => f(s, 'p1.in') || f(s, 'p1'), my: 'ဒေါ်ခင်မေကို ကူပေးပါ', en: 'Give Daw Khin May a hand' },
  { id: 'd11.p1', target: () => window.__day11?.row?.wallSlot(0), done: (s) => f(s, 'p1'), my: 'ပထမစာတိုကို ကျော်ပြီး ဒီအတိုင်း ထားလိုက်ပါ', en: 'Walk past the first note and let it be' },
  // piece 2 · the noodle house
  { id: 'd11.p2', go: 'door:noodlehouse', done: (s) => f(s, 'p2'), my: 'ခေါက်ဆွဲဆိုင် တစ်ဆိုင်ရွေးပြီး ဝင်စားပါ', en: 'Pick one noodle counter and eat' },
  // piece 3 · Maung Pan
  { id: 'd11.p3met', who: 'maungpan', done: (s) => f(s, 'p3.met') || f(s, 'p3.out') || f(s, 'p3'), my: 'မောင်ပန်းနဲ့ စကားပြောပါ', en: 'Talk to Maung Pan' },
  { id: 'd11.p3out', go: 'door:eveningclass', done: (s) => f(s, 'p3.out') || f(s, 'p3'), my: 'ပြက္ခဒိန်ရွက်တွေကို လှန်ကြည့်ပါ', en: "Flip through the calendar's leaves" },
  { id: 'd11.p3', who: 'maungpan', done: (s) => f(s, 'p3'), my: 'မောင်ပန်း အပင်စိုက်တာ ကြည့်နေပါ', en: 'Watch Maung Pan plant his tree' },
  // piece 5 · U San Shar
  { id: 'd11.p5out', who: 'sanshar', done: (s) => f(s, 'p5.out') || f(s, 'p5'), my: 'ဦးစံရှားနဲ့ စကားပြောပါ', en: 'Talk to U San Shar' },
  { id: 'd11.p5', who: 'sanshar', done: (s) => f(s, 'p5'), my: 'ဦးစံရှားနောက် လိုက်ပြီး ဘူးခေါက်ပါ', en: 'Follow U San Shar and fold a box' },
  // piece 6 · Ma Cherry
  { id: 'd11.p6met', who: 'cherry', done: (s) => f(s, 'p6.met') || f(s, 'p6'), my: 'မချယ်ရီနဲ့ စကားပြောပါ', en: 'Talk to Ma Cherry' },
  { id: 'd11.p6look', looks: [
    { f: 'd11.p6.look.sheet', room: 'hearthtea', st: 'practiceSheet', y: 1.55, r: 0.35 },
    { f: 'd11.p6.look.book', room: 'hearthtea', st: 'songbook', y: 1.45, r: 0.25 },
  ], go: 'door:hearthtea', done: (s) => (f(s, 'p6.look.sheet') && f(s, 'p6.look.book')) || f(s, 'p6'), my: 'သူ့လေ့ကျင့်စာရွက်နဲ့ သီချင်းစာအုပ်ကို ကြည့်ပါဦး', en: 'Look at her practice sheet and songbook' },
  { id: 'd11.p6', who: 'cherry', done: (s) => f(s, 'p6'), my: 'မချယ်ရီ ကိုယ်တိုင် ဆုံးဖြတ်ပါစေလေ', en: 'Let Ma Cherry decide for herself' },
  // piece 7 · U Chit
  { id: 'd11.p7', who: 'uchit', done: (s) => f(s, 'p7'), my: 'ဦးချစ်ရဲ့ စကားတွေကို ချိန်ဆကြည့်ပါ', en: "Weigh up U Chit's sayings" },
  // home
  { id: 'd11.night', go: 'door:about', done: (s) => f(s, 'done'), my: 'အိမ်ပြန်ပြီး ဒီညစာ စာမျက်နှာ ရေးပါ', en: "Go home and write tonight's page" },
];
