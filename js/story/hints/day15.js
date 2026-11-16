// Day 15 hints: what to do next. Ordered by play order.
// Where (owner 2026-11-16: the corner map's mark, the notebook map's pin, the tap pointer): who = the person, live (else
// the room the day's roomCast puts them in, else `at`); go = where the step happens instead; hints-where.js has the specs.
// (the launch at dusk waits for d15.light + d15.ncTalk, no booklet box in her arms and no stems in her hand;
// the flowers, booklets and tea are optional, so they only show while one is half done and holds the launch)
// who: the person the step is about (a soft border only while they are on screen). target: a thing to
// recognise once in view (an Object3D or { x, y, z } in the current scene; null = nothing to outline).
import { FOUNTAIN } from '../../game/world/world.js'; // (the launch opens at the fountain forecourt)

const f = (s, k) => !!s.flag(`d15.${k}`);
// (the welcome table and the vases: day15.js TABLE_A / TABLE_B on the forecourt)
const stems = (s) => Number(s.flag('d15.stems')) || 0;
const station = (s, room, id, y = 0.9) => {
  if (s.inRoom !== room) return null;
  // (a story room keeps its taps in .stations; a Home Book room keeps them on its story layer)
  const t = [...(s.room?.stations || []), ...(s.room?.storyLayer?.stations || [])].find((q) => q?.id === id);
  return t ? { x: t.x, y, z: t.z } : null;
};
const board = (s) => (s.inRoom ? null : s.board?.root || s.board?.target || null);
export default [
  { id: 'd15.morning', who: 'wintwar', done: (s) => f(s, 'morning'), my: 'မဝင့်ဝါ ယူလာတဲ့ စာတွေကို ဖတ်ကြည့်ပါ', en: 'Read the post Ma Wint War brings' },
  { id: 'd15.board', target: board, done: (s) => f(s, 'board'), my: 'ဘုတ်ပေါ်က နောက်ဆုံးစာရွက်ကို ဖတ်ပါ', en: 'Read the last note on the board' },
  { id: 'd15.paper', who: 'kowunna', target: (s) => station(s, 'templates', 'd15paper', 1.0), done: (s) => f(s, 'paper') || f(s, 'light'), my: 'ကိုဝဏ္ဏဆီက စက္ကူ တစ်ရွက် တောင်းပါ', en: 'Ask Ko Wunna for a sheet of paper' },
  { id: 'd15.light', at: 'door:about', target: (s) => station(s, 'about', 'd15desk', 0.9), done: (s) => f(s, 'light'), my: 'ကိုယ့်စားပွဲမှာ ကိုယ်ပိုင် မီးအိမ်လေး လုပ်ပါ', en: 'Make your own light at your desk' },
  { id: 'd15.naychi', who: 'naychi', done: (s) => f(s, 'ncTalk'), my: 'နေခြည်နဲ့ သူ့ကြိုဆိုစကားအကြောင်း စကားပြောပါ', en: 'Talk with Nay Chi about her welcome' },
  // things in her hands hold the launch back
  { id: 'd15.box', go: { x: -3.75, z: 14.2 }, when: (s) => f(s, 'carrying') && !f(s, 'booklets'), done: (s) => f(s, 'booklets'), my: 'စာအုပ်ငယ်သေတ္တာကို ကြိုဆိုစားပွဲပေါ် ချပါ', en: 'Set the booklet box on the welcome table' },
  { id: 'd15.stems', go: { x: -3.75, z: 15.95 }, when: (s) => stems(s) > 0 && !f(s, 'dusk'), done: (s) => stems(s) <= 0, my: 'လက်ထဲက ပန်းတွေကို ပန်းအိုးထဲ ထိုးထည့်ပါ', en: 'Put the stems in your hand into the vases' },
  // the launch evening (a scene from the moment it starts) and the last page
  { id: 'd15.launch', go: { x: FOUNTAIN.x, z: FOUNTAIN.z, kind: 'area' }, done: (s) => f(s, 'flown'), my: 'အဆင်သင့်ဖြစ်ရင် ညနေပွဲကို သွားကြရအောင်', en: 'When you are ready, go to the launch evening' },
  { id: 'd15.night', at: 'door:about', target: (s) => station(s, 'about', 'd15desk', 0.9), done: (s) => f(s, 'done') || !!s.save?.ended, my: 'အိမ်ပြန်ပြီး နောက်ဆုံး စာမျက်နှာ ရေးပါ', en: 'Go home and write the last page' },
];
