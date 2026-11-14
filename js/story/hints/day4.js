// Day 4 hints: what to do next (never where). Ordered by play order.
// (The gifts, Ko Phyo and Ma Thiri can go in any order; the engine shows the first unfinished step.
//  The night page needs only d4.ch6Done and d4.ch7Done; every flag below is set in day4.js.)
const f = (s, k) => !!s.flag(`d4.${k}`);

export default [
  { id: 'd4.morning', who: 'wintwar', done: (s) => f(s, 'morning'), my: 'မဝင့်ဝါနဲ့ အရင် စကားပြောပါ', en: 'Talk to Ma Wint War first' },
  { id: 'd4.market', done: (s) => f(s, 'arrived'), my: 'မဝင့်ဝါပြောတဲ့ စာအိတ်ဈေးကို လိုက်ရှာပါ', en: 'Go and find the Envelope Market' },
  // main thread: the Painted Map, Nay Chi, the false shortcut
  { id: 'd4.map', who: 'yaung', done: (s) => f(s, 'map'), my: 'ကိုရောင်ကို ရှာပြီး စကားပြောပါ', en: 'Find Ko Yaung and talk to him' },
  { id: 'd4.naychi', who: 'naychi', done: (s) => f(s, 'ncTold'), my: 'နေခြည် ဘာဖြစ်နေလဲ မေးကြည့်ပါ', en: "Ask Nay Chi what's wrong" },
  { id: 'd4.shortcut', done: (s) => f(s, 'rumour.shortcut') || ['got.books', 'got.bowls', 'got.rice', 'kpTalk', 'thMet'].some((k) => f(s, k)), // (optional: moving on to the gifts, Ko Phyo or Ma Thiri lets it go)
    my: 'မြေပုံထဲက ဖြတ်လမ်းကို ကိုယ်တိုင်စစ်ကြည့်ပါ', en: "Check the map's shortcut yourself" },
  // ch 6 · the three gifts, each where its giver chose
  { id: 'd4.books', who: 'luaye', done: (s) => f(s, 'got.books'), my: 'ဦးလူအေးရဲ့ စာအုပ်သေတ္တာကို ယူပါ', en: "Pick up U Lu Aye's crate of books" },
  { id: 'd4.books.give', who: 'hninwai', when: (s) => f(s, 'got.books'), done: (s) => f(s, 'give.books'), my: 'စာအုပ်တွေကို ဦးလူအေး ရွေးတဲ့နေရာ ပို့ပေးပါ', en: 'Take the books where U Lu Aye chose' },
  { id: 'd4.bowls', who: 'yuyu', done: (s) => f(s, 'got.bowls'), my: 'မယုယုရဲ့ ရေခွက်တွေကို ယူပေးပါ', en: "Take Ma Yu Yu's water bowls for her" },
  { id: 'd4.bowls.give', when: (s) => f(s, 'got.bowls'), done: (s) => f(s, 'give.bowls'), my: 'ရေခွက်တွေကို မယုယု ရွေးတဲ့နေရာ ချပေးပါ', en: 'Set the bowls down where Ma Yu Yu chose' },
  { id: 'd4.rice', who: 'kyar', done: (s) => f(s, 'got.rice'), my: 'ဒေါ်ကြာရဲ့ ဆန်အိတ်ကို ယူပါ', en: "Take Daw Kyar's sack of rice" },
  { id: 'd4.rice.give', who: 'yi', when: (s) => f(s, 'got.rice'), done: (s) => f(s, 'give.rice'), my: 'ဆန်အိတ်ကို ဒေါ်ကြာ ရွေးတဲ့နေရာ ပို့ပေးပါ', en: 'Take the rice where Daw Kyar chose' },
  // ch 6 · Ko Phyo (he talks only once all three gifts are where their givers chose)
  { id: 'd4.kophyo', who: 'kophyo', done: (s) => f(s, 'kpTalk'), my: 'ကိုဖြိုးနဲ့ ထိုင်ပြီး စကားပြောပါ', en: 'Sit down and talk with Ko Phyo' },
  { id: 'd4.pails', who: 'kophyo', done: (s) => +(s.flag('d4.pails') || 0) >= 3, my: 'ကိုဖြိုး ရေခပ်တာ စည်းချက်လိုက်ပေးပါ', en: 'Keep the beat while Ko Phyo pumps water' },
  { id: 'd4.brew', who: 'kophyo', done: (s) => f(s, 'brew'), my: 'ကိုဖြိုးနဲ့အတူ လက်ဖက်ရည် ကျိုပါ', en: 'Brew the tea with Ko Phyo' },
  { id: 'd4.pour', who: 'kophyo', done: (s) => f(s, 'poured') || f(s, 'ch6Done'), my: 'ပထမဆုံးခွက်ကို ငြိမ်ငြိမ်လေး ငှဲ့ပါ', en: 'Pour the first cup, nice and steady' },
  // ch 7 · Ma Thiri
  { id: 'd4.kite', who: 'thiri', done: (s) => f(s, 'kite1'), my: 'မသီရိရဲ့ စွန်ကို ကူလွှတ်ပေးပါ', en: "Help Ma Thiri fly her kite" },
  { id: 'd4.looks', done: (s) => f(s, 'thLooked'), my: 'စွန်ကြိုးတစ်လျှောက် ကိုယ်တိုင်ကြည့်ပါ (၄ ခု)', en: 'Look along the kite line yourself (4 things)' },
  { id: 'd4.thTalk', who: 'thiri', done: (s) => f(s, 'thTalk'), my: 'စောင့်နေတဲ့ မသီရိနဲ့ စကားပြောပါ', en: 'Talk with Ma Thiri while she waits' },
  { id: 'd4.post', who: 'thiri', done: (s) => f(s, 'three'), my: 'မသီရိ ကိုယ့်တိုင်ကိုယ် စိုက်တာ ကူပေးပါ', en: 'Help Ma Thiri drive in her own post' },
  { id: 'd4.kite2', who: 'thiri', done: (s) => f(s, 'kite2'), my: 'သူ့တိုင်ပေါ်က စွန်ကို ငြိမ်အောင် ထိန်းပေးပါ', en: 'Hold the kite steady on her own post' },
  { id: 'd4.wish', who: 'thiri', done: (s) => f(s, 'wished'), my: 'မသီရိနဲ့အတူ ဆုတောင်းစာ ရေးပါ', en: 'Write the wishes with Ma Thiri' },
  { id: 'd4.plane.luaye', who: 'luaye', when: (s) => f(s, 'wished'), done: (s) => f(s, 'plane.luaye'), my: 'ဦးလူအေးကို စက္ကူလေယာဉ် ပေးပါ', en: 'Give U Lu Aye his paper plane' },
  { id: 'd4.plane.pyone', who: 'pyone', when: (s) => f(s, 'wished'), done: (s) => f(s, 'plane.pyone'), my: 'ဒေါ်ပြုံးကို စက္ကူလေယာဉ် ပေးပါ', en: 'Give Daw Pyone her paper plane' },
  { id: 'd4.ch7', who: 'thiri', done: (s) => f(s, 'ch7Done'), my: 'မသီရိဆီ ပြန်သွားပါ', en: 'Go back to Ma Thiri' },
  { id: 'd4.night', done: (s) => f(s, 'done'), my: 'အိမ်ပြန်ပြီး ဒီညစာ စာမျက်နှာ ရေးပါ', en: "Go home and write tonight's page" },
];
