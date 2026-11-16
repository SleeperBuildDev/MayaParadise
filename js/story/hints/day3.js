// Day 3 hints: what to do next. Ordered by play order.
// Where (owner 2026-11-16: the corner map's mark, the notebook map's pin, the tap pointer): who = the person, live (else
// the room the day's roomCast puts them in, else `at`); go = where the step happens instead; hints-where.js has the specs.
// (ch 5, ch 9 and Nay Chi can go in any order; the engine shows the first unfinished step. The night page
// needs all three: d3.ch5Done, d3.ch9Done, d3.ncAnswered.)
// `who` = the person the step is about (story.people id); `target` = the thing, when the step is a thing.
// The engine outlines them only while they are on screen.
const F = (s, k) => !!s.flag(`d3.${k}`);
// (the kiln's mouth: day3.js P.kiln; the pots and shards to tap stand round it)

export default [
  { id: 'd3.morning', who: 'wintwar', done: (s) => F(s, 'morning'), my: 'မဝင့်ဝါ ခေါ်နေတယ်၊ သွားတွေ့လိုက်ပါ', en: 'Ma Wint War is calling: go and see her' },
  // ch 5 · the kiln opens
  { id: 'd3.kiln', who: 'dawohn', done: (s) => F(s, 'kilnOpen'), my: 'ဒေါ်အုန်း မီးဖိုဖွင့်တာ သွားကြည့်ရအောင်', en: "Go and see Daw Ohn's kiln opened" },
  { id: 'd3.ring', go: { x: 57.7, z: 113.2, kind: 'area' }, done: (s) => F(s, 'rang'), my: 'အိုးတွေနဲ့ အကွဲပုံကို ခေါက်ပြီး နားထောင်ပါ', en: 'Tap the pots and the shards, and listen' },
  { id: 'd3.shed', who: 'dawohn', done: (s) => F(s, 'ch5Done'), my: 'ဒေါ်အုန်း ခေါ်နေတယ်၊ သွားစကားပြောပါ', en: 'Daw Ohn asked you in: talk with her' },
  // ch 9 · Su Nwe and Maung Nge
  { id: 'd3.class', who: 'hninwai', done: (s) => F(s, 'hook9'), my: 'ဒေါ်နှင်းဝေရဲ့ အတန်းကို ဝင်ကြည့်ပါ', en: "Look in on Daw Hnin Wai's class" },
  { id: 'd3.looksIn', who: 'sunwe', done: (s) => F(s, 'looked9') || (F(s, 'look9.timetable') && F(s, 'look9.stub')), my: 'စုနွယ့်စားပွဲပေါ်က ပစ္စည်းတွေ သေချာကြည့်ပါ', en: "Look closely at what's on Su Nwe's desk" },
  { id: 'd3.looksOut', who: 'maungnge', done: (s) => F(s, 'looked9') || (F(s, 'look9.cart') && F(s, 'look9.rope')), my: 'မောင်ငယ့်လှည်းနဲ့ လက်ကို သေချာကြည့်ပါ', en: "Look closely at Maung Nge's cart and his hands" },
  { id: 'd3.snTalk', who: 'sunwe', done: (s) => F(s, 'snTalk'), my: 'စုနွယ်နဲ့ စကားပြောပါ', en: 'Talk with Su Nwe' },
  { id: 'd3.guide', who: 'sunwe', done: (s) => F(s, 'guided'), my: 'မောင်ငယ့်နှုန်းအတိုင်း သင်ပေးဖို့ စုနွယ့်ကို ကူပေးပါ', en: 'Help Su Nwe teach Maung Nge at his pace' },
  { id: 'd3.boat', who: 'sunwe', done: (s) => F(s, 'ch9Done'), my: 'စုနွယ်တို့နဲ့အတူ စက္ကူလှေ ခေါက်ပါ', en: 'Fold the paper boat with Su Nwe and Maung Nge' },
  { id: 'd3.deliver', who: 'maungnge', done: (s) => F(s, 'delivered'), my: 'မောင်ငယ် ပစ္စည်းပို့တာ လိုက်ကြည့်ပါ', en: 'Go along with Maung Nge on his delivery' },
  // main · Nay Chi
  { id: 'd3.naychi', who: 'naychi', done: (s) => F(s, 'ncMet') || F(s, 'ncAnswered'), my: 'နေခြည်ကို ရှာပြီး စကားပြောပါ', en: 'Find Nay Chi and talk to her' },
  { id: 'd3.answer', who: 'naychi', done: (s) => F(s, 'ncAnswered'), my: 'နေခြည့် မေးခွန်းကို ဖြေပေးပါ', en: "Answer Nay Chi's question" },
  // home · the "ask Maya" board (after Ma Wint War has mentioned the new notes)
  { id: 'd3.board', when: (s) => F(s, 'wwEvening'), target: (s) => s.board?.root, done: (s) => F(s, 'board'), my: 'ဘုတ်က စာအသစ်တွေ ဖတ်ပြီး တစ်စောင် ပြန်ဖြေပါ', en: 'Read the new notes on the board and answer one' },
  { id: 'd3.night', go: 'door:about', done: (s) => F(s, 'done'), my: 'အိမ်ပြန်ပြီး ဒီညစာ စာမျက်နှာ ရေးပါ', en: "Go home and write tonight's page" },
];
