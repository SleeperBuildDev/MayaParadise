// Day 1 hints: what to do next (never where). Ordered by play order.
// (Day 1 is one straight thread: the letter, U Kyaw Nyunt, Pho Thar, the practice, the fair, the windmill.)
// `who` = the person the step is about (story.people id): the engine outlines them only while on screen.
const F = (s, k) => !!s.flag(`d1.${k}`);

export default [
  { id: 'd1.letter', who: 'wintwar', done: (s) => F(s, 'letter'), my: 'မဝင့်ဝါနဲ့ စကားပြောပါ', en: 'Talk to Ma Wint War' },
  // (finding Pho Thar first is fine: the step counts as done once he has agreed)
  { id: 'd1.ukyaw', who: 'ukyaw', done: (s) => F(s, 'metUk') || F(s, 'agreed'), my: 'ဦးကျော်ညွန့်ကို ရှာပြီး စကားပြောပါ', en: 'Find U Kyaw Nyunt and talk to him' },
  { id: 'd1.phothar', who: 'phothar', done: (s) => F(s, 'agreed'), my: 'ပျောက်နေတဲ့ ဖိုးသားကို လိုက်ရှာပါ', en: 'Find Pho Thar, who has wandered off' },
  { id: 'd1.practise', who: 'phothar', done: (s) => F(s, 'practised'), my: 'ဖိုးသားနဲ့ ချုပ်ရိုး အတူ လေ့ကျင့်ပါ', en: 'Practise stitching with Pho Thar' },
  { id: 'd1.fair', who: 'phothar', done: (s) => F(s, 'chose'), my: 'ပွဲတော်အတွက် ဖိုးသား ကိုယ်တိုင် ရွေးပါစေလေ', en: 'Let Pho Thar choose for himself for the fair' },
  { id: 'd1.windmill', who: 'phothar', done: (s) => F(s, 'spun'), my: 'ဖိုးသားရဲ့ လေရဟတ် လည်အောင် ကူပေးပါ', en: "Help Pho Thar's windmill turn" },
  { id: 'd1.night', done: (s) => F(s, 'done'), my: 'အိမ်ပြန်ပြီး ဒီညစာ စာမျက်နှာ ရေးပါ', en: "Go home and write tonight's page" },
];
