// Day 8 hints: what to do next (never where). Ordered by play order.
// (ch 12 and ch 13 interleave: Ma Thida's talk needs the sort + the well; the close at the well needs the
// pinned line AND the blank sheet, which the lock-up (ch 13) prints. Night needs ch12Done + ch13Done.)
const f = (s, k) => !!s.flag(`d8.${k}`);
const seven = [
  ['kosan', 'ကိုစံ', 'Ko San', 'he'], ['sein', 'ဒေါ်စိန်', 'Daw Sein', 'she'], ['kan', 'ဦးကံ', 'U Kan', 'he'],
  ['dawhla', 'ဒေါ်လှ', 'Daw Hla', 'she'], ['komin', 'ကိုမင်း', 'Ko Min', 'he'], ['moemoe', 'မိုးမိုး', 'Moe Moe', 'she'],
  ['thida', 'မသီတာ', 'Ma Thida', 'she'],
];
export default [
  { id: 'd8.morning', who: 'wintwar', done: (s) => f(s, 'morning'), my: 'မဝင့်ဝါနဲ့ အရင် စကားပြောပါ', en: 'Talk to Ma Wint War first' },
  { id: 'd8.naychi', who: 'naychi', done: (s) => f(s, 'ncHanded') || f(s, 'slipsRead') || f(s, 'wunnaMet'), // (not needed for the night: moving on lets it go)
    my: 'မနက်ကတည်းက စောင့်နေတဲ့ နေခြည့်ကို ရှာပါ', en: "Find Nay Chi; she's waited since dawn" },
  // ch 12 · Don't Believe
  { id: 'd8.slips', done: (s) => f(s, 'slipsRead'), my: '"မာရာ ပြောတယ်" စာရွက်တွေကို ဖတ်ကြည့်ပါ', en: 'Read the "Maya says" slips' },
  ...seven.map(([id, my, en, he]) => ({
    id: `d8.met.${id}`, who: id, done: (s) => f(s, `met.${id}`),
    my: `${my} ဘာကြောင့် ယုံလဲ မေးကြည့်ပါ`, en: `Ask ${en} why ${he} believes it`,
  })),
  { id: 'd8.sort', done: (s) => f(s, 'sorted'), my: 'ဘာကြောင့် ယုံကြလဲ ထိုင်ပြီး ခွဲကြည့်ပါ', en: 'Sit down and sort why they believe it' },
  { id: 'd8.well', done: (s) => f(s, 'wellSeen'), my: 'ရွှေမင်တွင်းကို ကိုယ့်မျက်စိနဲ့ သွားကြည့်ချေ', en: 'See the gold-ink well with your own eyes' },
  { id: 'd8.thida', who: 'thida', done: (s) => f(s, 'thidaTalk'), my: 'မသီတာနဲ့ သေချာ စကားပြောပါ', en: 'Have a real talk with Ma Thida' },
  { id: 'd8.pin', done: (s) => f(s, 'pinned'), my: 'ကိုယ့်စကားကို ဘုတ်ပေါ် ကိုယ်တိုင် ကပ်ပါ', en: 'Pin your own words on the board' },
  // ch 13 · the press
  { id: 'd8.wunna', who: 'kowunna', done: (s) => f(s, 'wunnaMet'), my: 'ကိုဝဏ္ဏကို ရှာပြီး သူပြောတာ နားထောင်ပါ', en: 'Find Ko Wunna and hear him out' },
  { id: 'd8.looks', done: (s) => f(s, 'look.cases') && f(s, 'look.labels') && f(s, 'look.title'), my: 'ပုံနှိပ်တိုက်ထဲက ပစ္စည်းတွေ သေချာကြည့်ပါ', en: 'Look closely around the press' },
  { id: 'd8.turn', done: (s) => f(s, 'turned'), my: 'စာလုံးတုံးကို နှစ်ဖက်လှည့်ပြီး ကြည့်ပါ', en: 'Turn the type block and see both sides' },
  { id: 'd8.ask', who: 'kowunna', done: (s) => f(s, 'asked'), my: 'ကိုဝဏ္ဏ မေးနည်းမှန် ရှာတွေ့အောင် ကူပေးပါ', en: 'Help Ko Wunna find the right way to ask' },
  { id: 'd8.tint', who: 'utint', done: (s) => f(s, 'ch13Done'), my: 'ဦးတင့်နဲ့ စကားပြောပြီး ပြင်ဆင်ချက် ရိုက်ပေးပါ', en: 'Talk with U Tint and print the correction' },
  { id: 'd8.sheet', who: 'utint', when: (s) => f(s, 'pinned') && f(s, 'locked'), done: (s) => f(s, 'sheet'), my: 'ဘုတ်အတွက် စာရွက်လွတ်ကို ရိုက်ခိုင်းပါ', en: 'Get the blank sheet printed for the board' },
  // ch 12 · the close
  { id: 'd8.close', done: (s) => f(s, 'ch12Done'), my: 'ရွှေမင်တွင်းဆီ ပြန်သွားပါ', en: 'Go back to the gold-ink well' },
  { id: 'd8.night', done: (s) => f(s, 'done'), my: 'အိမ်ပြန်ပြီး ဒီညစာ စာမျက်နှာ ရေးပါ', en: "Go home and write tonight's page" },
];
