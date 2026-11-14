// Day 10 hints: what to do next (never where). Ordered by play order.
// (ch 16 and ch 17's first two steps can go in any order; ch 17's dusk waits for ch 16. Ko Kaung (packroom) is
// optional, so he has no line: an optional step would hold back the board and the night page.)
const f = (s, k) => !!s.flag(`d10.${k}`);
const SQ = ['store', 'locks', 'lamp', 'steps']; // day10-lines.js SQUARE_LOOKS ids (d10.sq.<id>)

export default [
  { id: 'd10.morning', who: 'wintwar', done: (s) => f(s, 'morning'), my: 'မဝင့်ဝါနဲ့ အရင် စကားပြောပါ', en: 'Talk to Ma Wint War first' },
  { id: 'd10.garden', done: (s) => f(s, 'arrived') || f(s, 'hpMet'), my: 'ပွင့်သွားတဲ့ ဒိုင်ယာရီဥယျာဉ်ကို သွားကြည့်ရအောင်', en: 'Go and see the Diary Garden that opened' },
  // ch 16 · U Hpo Htaw at his gate
  { id: 'd10.hp', who: 'hpohtaw', done: (s) => f(s, 'hpSit'), my: 'ဥယျာဉ်မှူး ဦးဖိုးထော်နဲ့ စကားပြောပါ', en: 'Talk to U Hpo Htaw, the old gardener' },
  { id: 'd10.looked', target: () => window.__day10?.set?.gate, done: (s) => f(s, 'looked') || f(s, 'sorted'), my: 'သံတိုင်ကြားက သူ့ခြံထဲကို သေချာကြည့်ပါ', en: 'Look closely into his garden through the bars' },
  { id: 'd10.sorted', who: 'hpohtaw', done: (s) => f(s, 'sorted'), my: 'ဦးဖိုးထော်နဲ့အတူ သူ့အဆက်အနွယ်တွေ ခွဲကြည့်ပါ', en: 'Sort out his ties with U Hpo Htaw' },
  { id: 'd10.tendrils', who: 'hpohtaw', done: (s) => f(s, 'tendrils'), my: 'နွယ်ညွန့်ကို တိုင်ဆီ လမ်းပြပေးပါ', en: 'Lead the tendril to its post' },
  { id: 'd10.lanes', who: 'hpohtaw', done: (s) => f(s, 'lanes'), my: 'လမ်းပေါ်က စကားတွေကို သူနဲ့အတူ ခွဲကြည့်ပါ', en: "Sort the lane's talk with him" },
  { id: 'd10.ch16', who: 'hpohtaw', done: (s) => f(s, 'ch16Done'), my: 'ဦးဖိုးထော်နဲ့ စကားဆက်ပြောပါ', en: 'Keep talking with U Hpo Htaw' },
  // ch 17 · U Kyi Nyein's offer, Ko Phyo
  { id: 'd10.offer', who: 'kyinyein', done: (s) => f(s, 'offer'), my: 'စက္ကူကုန်သည် ဦးကြည်ငြိမ်းဆီ သွားလည်ပါ', en: 'Pay U Kyi Nyein, the paper trader, a visit' },
  { id: 'd10.kpMet', who: 'kophyo', done: (s) => f(s, 'kpMet'), my: 'ကိုဖြိုးကို ရှာပြီး စကားပြောပါ', en: 'Find Ko Phyo and talk to him' },
  { id: 'd10.dusk', who: 'kophyo', done: (s) => f(s, 'dusk'), my: 'မီးထွန်းချိန် ကိုဖြိုးလှည်းဘေး သွားထိုင်ပါ', en: "Sit by Ko Phyo's cart at lamp-light" },
  { id: 'd10.square', target: () => window.__day10?.set?.store, done: (s) => SQ.every((k) => f(s, `sq.${k}`)) || f(s, 'matched') || f(s, 'kpEndDone'), my: 'ဦးကြည်ငြိမ်းရဲ့ ဂိုဒေါင်ကို သေချာကြည့်ပါ', en: "Watch U Kyi Nyein's store closely" },
  { id: 'd10.matched', who: 'kophyo', done: (s) => f(s, 'matched'), my: 'မြင်ခဲ့တာတွေကို ကိုဖြိုးနဲ့အတူ တွဲကြည့်ပါ', en: 'Match up what you saw, with Ko Phyo' },
  { id: 'd10.weighed', who: 'kophyo', done: (s) => f(s, 'weighed'), my: 'စက္ကူထုပ်ကို ခြောက်ခြောက်သွေ့သွေ့ အမှန်ချိန်ပါ', en: 'Weigh the bale dry, and true' },
  { id: 'd10.kpTalk', who: 'kophyo', done: (s) => f(s, 'kpEndDone'), my: 'ကိုဖြိုးနဲ့ စကားဆက်ပြောပါ', en: 'Keep talking with Ko Phyo' },
  { id: 'd10.ch17', who: 'kophyo', done: (s) => f(s, 'ch17Done'), my: 'ကိုဖြိုး ဘာဆက်လုပ်လဲ ကြည့်နေပါ', en: 'Watch what Ko Phyo does next' },
  // home · the board's gap, the night page
  { id: 'd10.board', target: (s) => s.board?.root, done: (s) => f(s, 'board'), my: '"မာရာ့ကို မေးပါ" ဘုတ်ကို ပြန်သွားကြည့်ပါ', en: 'Go back and look at the "ask Maya" board' },
  { id: 'd10.night', done: (s) => f(s, 'done'), my: 'အိမ်ပြန်ပြီး ဒီညစာ စာမျက်နှာ ရေးပါ', en: "Go home and write tonight's page" },
];
