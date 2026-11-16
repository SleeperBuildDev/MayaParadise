// Day 13 hints: what to do next. Ordered by play order.
// Where (owner 2026-11-16: the corner map's mark, the notebook map's pin, the tap pointer): who = the person, live (else
// the room the day's roomCast puts them in, else `at`); go = where the step happens instead; hints-where.js has the specs.
// mark: false = the page's surprise (who lives on the Blank Page; who knocks at the lodge): the border only, as before.
// (ch 21 and ch 22 can go in any order; the engine shows the first unfinished step.)
// who: the person the step is about (a soft border only while they are on screen). target: a thing to
// recognise once in view (an Object3D or { x, y, z } in the current scene; null = nothing to outline).
import { P } from '../day13-world.js'; // (the hedge gap onto the Blank Page)

const f = (s, k) => !!s.flag(`d13.${k}`);
const deskLit = (s) => f(s, 'desk') || !!s.flag('desk:blank');
const blankDesk = (s) => {
  if (s.inRoom) return null;
  const d = s.openWorld?.desks?.byId?.('blank');
  return d ? { x: d.x, y: 1.0, z: d.z } : null;
};
const station = (s, room, id, y = 1.0) => {
  if (s.inRoom !== room) return null;
  // (a story room keeps its taps in .stations; a Home Book room keeps them on its story layer)
  const t = [...(s.room?.stations || []), ...(s.room?.storyLayer?.stations || [])].find((q) => q?.id === id);
  return t ? { x: t.x, y, z: t.z } : null;
};
export default [
  { id: 'd13.morning', who: 'wintwar', done: (s) => f(s, 'morning'), my: 'မဝင့်ဝါနဲ့ အရင် စကားပြောပါ', en: 'Talk to Ma Wint War first' },
  // ch 21 · Ei Mon
  { id: 'd13.eimon', who: 'eimon', done: (s) => f(s, 'emMet'), my: 'အိမွန့်ကို ရှာပြီး စကားပြောကြည့်ပါ', en: 'Find Ei Mon and talk to her' },
  { id: 'd13.recall', who: 'eimon', done: (s) => f(s, 'recall'), my: 'အိမွန် ဘာကြောင့် စိတ်တိုလဲ အတူ စဉ်းစားကြည့်ပါ', en: 'Work out with Ei Mon what sets her off' },
  { id: 'd13.shed', who: 'sithu', done: (s) => f(s, 'shed'), my: 'စည်သူနဲ့ ရတနာကို ကိုယ်တိုင် သွားမေးကြည့်ပါ', en: 'Hear Sithu and Yadanar out yourself' },
  { id: 'd13.carried', who: 'eimon', done: (s) => f(s, 'carried'), my: 'သူတို့ပြောတဲ့အတိုင်း အိမွန့်ကို ပြန်ပြောပြပါ', en: 'Tell Ei Mon their words, unchanged' },
  { id: 'd13.sorted', who: 'eimon', done: (s) => f(s, 'sorted'), my: 'အိမွန့် မေးခွန်းသုံးခုကို အစဉ်လိုက် စီပါ', en: "Put Ei Mon's three questions in order" },
  { id: 'd13.emTalk', who: 'eimon', done: (s) => f(s, 'emTalk') || f(s, 'c2'), my: 'အိမွန်နဲ့ စကားဆက်ပြောပါ', en: 'Keep talking with Ei Mon' },
  { id: 'd13.green', who: 'yadanar', done: (s) => f(s, 'ch21Done'), my: 'အစိမ်းကြိုးထုပ်ကို ရတနာ့ရက်ကန်းပေါ် တင်ပါ', en: "Lay the green-tied bundle on Yadanar's loom" },
  // ch 22 · the Blank Page and the lodge
  { id: 'd13.blank', go: { town: 'blank', x: P.hedge.x, z: P.hedge.z - 1.5 }, who: 'hpohtaw', done: (s) => f(s, 'arrivedBlank'), my: 'ဦးဖိုးထော်ပြောတဲ့ စာမျက်နှာလွတ်ကို သွားကြည့်ပါ', en: 'Go and see the Blank Page U Hpo Htaw speaks of' },
  // (the desk can wait: once Daw Pwint is met, it comes back just before the night page)
  { id: 'd13.desk', when: (s) => !f(s, 'dpMet'), target: blankDesk, done: deskLit, my: 'စာမျက်နှာလွတ်က စားပွဲမှာ မြင်တာကို ရေးပါ', en: "Write what you see at the Blank Page's desk" },
  { id: 'd13.dawpwint', mark: false, who: 'dawpwint', done: (s) => f(s, 'dpMet'), my: 'စာမျက်နှာလွတ်ပေါ်မှာ နေတဲ့သူကို လိုက်ရှာပါ', en: 'Find whoever lives on the Blank Page' },
  { id: 'd13.board', at: 'door:lodge', target: (s) => station(s, 'lodge', 'board', 1.4), done: (s) => f(s, 'boardSeen'), my: 'ဒေါ်ပွင့်ရဲ့ ဘုတ်ကို ဖတ်ကြည့်ပါ', en: "Read Daw Pwint's board" },
  { id: 'd13.plain', who: 'pyaesone', done: (s) => f(s, 'plain'), my: 'ကိုပြည့်စုံ ဘာကို မကြိုက်လဲ မေးကြည့်ပါ', en: 'Ask Ko Pyae Sone what bothers him' },
  { id: 'd13.psTalk', who: 'pyaesone', done: (s) => f(s, 'psTalk'), my: 'ကိုပြည့်စုံနဲ့ စကားဆက်ပြောပါ', en: 'Keep talking with Ko Pyae Sone' },
  { id: 'd13.scenes', who: 'dawpwint', done: (s) => f(s, 'scenesDone'), my: 'ဘုတ်ပေါ်က စာကြောင်းတွေကို ကိုယ်တိုင် စမ်းကြည့်ပါ', en: "Test the board's lines for yourself" },
  { id: 'd13.spot', done: (s) => s.flag('d13.spotQuiet') != null || f(s, 'lifted'), my: 'အိမ်ထဲက အရာသေးသေးလေး သုံးခုကို ရှာပါ', en: 'Spot the three small things in the house' },
  { id: 'd13.lift', done: (s) => f(s, 'lifted') || f(s, 'ch22Done'), my: 'အဖုံးကို သူတို့ဘာသာ ဖွင့်တဲ့အထိ စောင့်နေပါ', en: 'Wait for them to lift the cover themselves' },
  // main beat · Nay Chi, the walk, the road home
  { id: 'd13.naychi', mark: false, who: 'naychi', done: (s) => f(s, 'decided'), my: 'တံခါးခေါက်တဲ့သူကို ထွက်တွေ့ပါ', en: "Go out and see who's knocking" },
  { id: 'd13.road', who: 'naychi', done: (s) => f(s, 'road'), my: 'နေခြည်တို့နဲ့အတူ လမ်းလျှောက်ပါ', en: 'Walk along with Nay Chi and the others' },
  { id: 'd13.deskLate', target: blankDesk, done: deskLit, my: 'စာမျက်နှာလွတ်က စားပွဲမှာ စာတစ်ကြောင်း ရေးပါ', en: "Write one line at the Blank Page's desk" },
  { id: 'd13.night', go: 'door:about', done: (s) => f(s, 'done'), my: 'အိမ်ပြန်ပြီး ဒီညစာ စာမျက်နှာ ရေးပါ', en: "Go home and write tonight's page" },
];
