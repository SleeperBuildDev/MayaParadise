// Day 2 hints: what to do next (never where). Ordered by play order.
// (ch 3 and ch 5 can go in any order; the engine shows the first unfinished step. The night page needs
// both chapters: d2.ch3Done and d2.trial.)
// `who` = the person the step is about (story.people id); `target` = the thing, when the step is a thing.
// The engine outlines them only while they are on screen.
const F = (s, k) => !!s.flag(`d2.${k}`);

export default [
  { id: 'd2.morning', who: 'wintwar', done: (s) => F(s, 'morning'), my: 'မဝင့်ဝါနဲ့ အရင် စကားပြောပါ', en: 'Talk to Ma Wint War first' },
  // ch 3 · Toe Toe (meeting him before the class is fine: the walk counts too)
  { id: 'd2.class', who: 'hninwai', done: (s) => F(s, 'class') || F(s, 'walk'), my: 'ဒေါ်နှင်းဝေရဲ့ အတန်းကို သွားကြည့်ပါ', en: "Go and see Daw Hnin Wai's class" },
  { id: 'd2.toetoe', who: 'toetoe', done: (s) => F(s, 'walk'), my: 'တိုးတိုးကို ရှာပြီး ပဲပင်အကြောင်း မေးကြည့်ပါ', en: 'Find Toe Toe and ask about his beans' },
  { id: 'd2.follow', who: 'toetoe', done: (s) => F(s, 'ttDoorSaid') || F(s, 'stopShop'), my: 'တိုးတိုးနောက် လိုက်သွားပါ', en: 'Follow Toe Toe' },
  { id: 'd2.shop', who: 'toetoe', done: (s) => F(s, 'stopShop'), my: 'တိုးတိုးနဲ့အတူ ချိန်ခွင်မှာ ပဲစေ့ချိန်ကြည့်ပါ', en: 'Weigh beans on the scale with Toe Toe' },
  { id: 'd2.lamp', who: 'toetoe', done: (s) => F(s, 'stopLamp'), my: 'တိုးတိုးနဲ့အတူ ဘောလုံးနဲ့ မီးတိုင်ကို ကြည့်ပါ', en: 'Look at the ball and the lamp with Toe Toe' },
  { id: 'd2.seesaw', who: 'toetoe', done: (s) => F(s, 'stopSeesaw'), my: 'တိုးတိုးဘေးမှာ ရပ်ပြီး သူကြည့်တာ လိုက်ကြည့်ပါ', en: 'Stand by Toe Toe and look where he looks' },
  { id: 'd2.planter', who: 'toetoe', done: (s) => F(s, 'stopPlanter'), my: 'တိုးတိုးရဲ့ ပဲပုံးနဲ့ ပန်းခင်းကို ကြည့်ပါဦး', en: "Look at Toe Toe's bean box and the flower bed" },
  { id: 'd2.match', who: 'toetoe', done: (s) => F(s, 'matched'), my: 'တိုးတိုးကို ပြန်ရှာပြီး စာအုပ်တွေနဲ့ တွဲကြည့်ပါ', en: 'Find Toe Toe and match his books to the walk' },
  { id: 'd2.ttTalk', who: 'toetoe', done: (s) => F(s, 'ttTalk'), my: 'တိုးတိုးနဲ့ စကားဆက်ပြောပါ', en: 'Keep talking with Toe Toe' },
  { id: 'd2.own', who: 'toetoe', done: (s) => F(s, 'ownWords'), my: 'တိုးတိုး သူ့စကားနဲ့သူ ရေးနိုင်အောင် ကူပေးပါ', en: 'Help Toe Toe write it in his own words' },
  { id: 'd2.close', who: 'hninwai', done: (s) => F(s, 'ch3Done'), my: 'ဒေါ်နှင်းဝေ ဘာပြောမလဲ နားထောင်ကြည့်ပါ', en: 'Hear what Daw Hnin Wai says' },
  // ch 5 · Mi Cho and Daw Ohn
  { id: 'd2.micho', who: 'micho', done: (s) => F(s, 'mcMet'), my: 'မိချိုကို ရှာပြီး စကားပြောပါ', en: 'Find Mi Cho and talk to her' },
  { id: 'd2.dawohn', who: 'dawohn', done: (s) => F(s, 'ohnWatch'), my: 'ဒေါ်အုန်းနဲ့ စကားပြောပါ', en: 'Talk to Daw Ohn' },
  { id: 'd2.looks', done: (s) => F(s, 'looked'), my: 'ဒေါ်အုန်းရဲ့ အလုပ်ထဲက ခြောက်ခုကို သေချာကြည့်ပါ', en: "Look closely at six things in Daw Ohn's work" },
  { id: 'd2.ohnTalk', who: 'dawohn', done: (s) => F(s, 'ohnTalk'), my: 'ဒေါ်အုန်းနဲ့ ပြန်စကားပြောပါ', en: 'Talk to Daw Ohn again' },
  { id: 'd2.load', who: 'micho', done: (s) => F(s, 'load'), my: 'ဘယ်နှလုံး လုပ်မလဲ မိချို ကိုယ်တိုင် ရွေးပါစေလေ', en: 'Let Mi Cho choose how many to make' },
  { id: 'd2.shape', who: 'micho', done: (s) => F(s, 'shaped'), my: 'မိချိုနဲ့အတူ အိုးလုပ်ကြည့်ပါ', en: 'Make the pots with Mi Cho' },
  { id: 'd2.carry', target: () => window.__day2?.P?.shadeShelf?.root, done: (s) => F(s, 'trial'), my: 'အိုးတွေကို အရိပ်ထဲက စင်ပေါ် တင်ပါ', en: 'Set the pots on the shaded shelf' },
  // home · the "ask Maya" board (after Ma Wint War has mentioned the notes)
  { id: 'd2.board', when: (s) => F(s, 'wwEve'), target: (s) => s.board?.root, done: (s) => F(s, 'board'), my: 'ဘုတ်ပေါ်က စာတွေ ဖတ်ပြီး တစ်စောင် ပြန်ဖြေပါ', en: 'Read the notes on the board and answer one' },
  { id: 'd2.night', done: (s) => F(s, 'done'), my: 'အိမ်ပြန်ပြီး ဒီညစာ စာမျက်နှာ ရေးပါ', en: "Go home and write tonight's page" },
];
