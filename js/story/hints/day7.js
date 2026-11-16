// Day 7 hints: what to do next. Ordered by play order.
// Where (owner 2026-11-16: the corner map's mark, the notebook map's pin, the tap pointer): who = the person, live (else
// the room the day's roomCast puts them in, else `at`); go = where the step happens instead; hints-where.js has the specs.
// (two threads after slate 8: ch 4 in the classroom -> benches -> the play, and ch 11 with Nay Chi -> the Fold.
// The engine shows the first unfinished step; the order follows day7.js BEATS. Night needs ch4Done + ch11Done.)
const f = (s, k) => !!s.flag(`d7.${k}`);
const SQUARE = { x: -13, z: 143.4, kind: 'area' }; // the stage square (day7.js Q.square): the benches go there; the bowl and the play happen there
export default [
  { id: 'd7.morning', who: 'wintwar', done: (s) => f(s, 'progSeen'), my: 'မဝင့်ဝါနဲ့ အရင် စကားပြောပါ', en: 'Talk to Ma Wint War first' },
  // ch 4 · the classroom
  { id: 'd7.rehearsal', go: 'door:classroom', done: (s) => f(s, 'arrived'), my: 'ပြဇာတ် တိုက်နေတာ သွားကြည့်ရအောင်', en: 'Go and watch the play rehearsal' },
  { id: 'd7.meaning', who: 'yeyint', done: (s) => f(s, 'meaning'), my: 'ရဲယဉ့်စာကြောင်းရဲ့ အဓိပ္ပာယ်ကို ကူစဉ်းစားပေးပါ', en: "Help Ye Yint work out his line's meaning" },
  { id: 'd7.heading', go: 'door:classroom', done: (s) => f(s, 'heading'), my: 'ပြဇာတ် ဘယ်ကို ဦးတည်နေလဲ အဝေးက ကြည့်ပါ', en: 'Step back and see where the play is heading' },
  { id: 'd7.paint', who: 'yeyint', done: (s) => f(s, 'painted'), my: 'ရဲယဉ့် နောက်ခံကား ဆေးသုတ်တာ ကူပေးပါ', en: 'Help Ye Yint paint the backdrop' },
  { id: 'd7.sort', who: 'hninwai', done: (s) => f(s, 'sorted'), my: 'ဒေါ်နှင်းဝေနဲ့အတူ ပစ္စည်းတွေ ခွဲပါ', en: 'Sort the props with Daw Hnin Wai' },
  { id: 'd7.match', who: 'hninwai', done: (s) => f(s, 'owners'), my: 'ဇာတ်ဝင်ခန်းတိုင်း ဘယ်သူ့ဇာတ်လမ်းလဲ တွဲပါ', en: 'Match each scene to whose story it is' },
  { id: 'd7.yyTalk', who: 'yeyint', done: (s) => f(s, 'yyTalk'), my: 'ရဲယဉ့်နဲ့ သေချာ စကားပြောကြည့်ပါ', en: 'Have a real talk with Ye Yint' },
  // ch 11 · Nay Chi's slates
  { id: 'd7.knot', who: 'maungnge', done: (s) => f(s, 'knot'), my: 'မောင်ငယ့်လိုက်ကာ ဘာဖြစ်နေလဲ သွားကြည့်ပါ', en: "See what's wrong with Maung Nge's curtain" },
  { id: 'd7.shop', who: 'naychi', done: (s) => f(s, 'shelved'), my: 'နေခြည်နောက် မုန့်ဆိုင်ထဲ လိုက်ဝင်ပါ', en: 'Follow Nay Chi into the snack shop' },
  { id: 'd7.gave', done: (s) => f(s, 'gave'), my: 'စင်ကို ရပ်မကြည့်ဘဲ ဆိုင်ထဲက ထွက်လာပါ', en: "Leave the shop; don't stand watching the shelf" },
  { id: 'd7.oldWay', who: 'naychi', done: (s) => f(s, 'oldWay'), my: 'နေခြည်နဲ့ ထပ်ပြီး စကားပြောပါ', en: 'Talk with Nay Chi again' },
  { id: 'd7.changed', who: 'naychi', done: (s) => f(s, 'changed'), my: 'နေခြည်နောက် လိုက်ပြီး ပြောင်းလဲတာတွေ ကြည့်ပါ', en: "Follow Nay Chi and see what's changed" },
  // ch 4 · benches, the bowl, the play
  { id: 'd7.benches', go: (s) => (s.carrying ? SQUARE : null), who: 'yeyint', done: (s) => f(s, 'benches'), my: 'ရဲယဉ့်နဲ့အတူ ခုံတန်း သယ်ပါ', en: 'Carry a bench with Ye Yint' },
  { id: 'd7.bowl', go: SQUARE, done: (s) => f(s, 'bowl'), my: 'ရေပြည့်ဇလုံကို မဖိတ်အောင် သယ်ပါ', en: 'Carry the full bowl without spilling' },
  { id: 'd7.play', go: SQUARE, done: (s) => f(s, 'ch4Done'), my: 'ထိုင်ခုံရွေးပြီး ပြဇာတ်ကို ကြည့်ပါ', en: 'Pick a seat and watch the play' },
  // ch 11 · the Fold
  { id: 'd7.slate6', who: 'naychi', done: (s) => f(s, 'slate6'), my: 'စောင့်နေတဲ့ နေခြည့်ကို သွားရှာပါ', en: "Find Nay Chi; she's waiting for you" },
  { id: 'd7.order', who: 'naychi', done: (s) => f(s, 'order'), my: 'ကျောက်သင်ပုန်းတွေကို နေခြည် ကိုယ်တိုင် စီပါစေလေ', en: 'Let Nay Chi put the slates in her own order' },
  { id: 'd7.hang', who: 'naychi', done: (s) => f(s, 'teaTime'), my: 'နေခြည်နဲ့အတူ ကျောက်သင်ပုန်းတွေ ဘုတ်ပေါ်ချိတ်ပါ', en: 'Hang the slates on the board with Nay Chi' },
  { id: 'd7.tea', who: 'naychi', done: (s) => f(s, 'ch11Done'), my: 'နေခြည်နဲ့ လက်ဖက်ရည် အတူသောက်ပါ', en: 'Have tea with Nay Chi' },
  { id: 'd7.night', go: 'door:about', done: (s) => f(s, 'done'), my: 'အိမ်ပြန်ပြီး ဒီညစာ စာမျက်နှာ ရေးပါ', en: "Go home and write tonight's page" },
];
