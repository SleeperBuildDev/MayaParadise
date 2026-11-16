// Day 14 hints: what to do next. Ordered by play order.
// Where (owner 2026-11-16: the corner map's mark, the notebook map's pin, the tap pointer): who = the person, live (else
// the room the day's roomCast puts them in, else `at`); go = where the step happens instead; hints-where.js has the specs.
// (the night page needs d14.ttNames + d14.unloaded + d14.reply; the invitations and the Back Cover desk are
// not needed for it, so they only show while they are under way)
// who: the person the step is about (a soft border only while they are on screen). target: a thing to
// recognise once in view (an Object3D or { x, y, z } in the current scene; null = nothing to outline).
import { SPOTS } from '../day14-world.js';

const f = (s, k) => !!s.flag(`d14.${k}`);
const station = (s, room, id, y = 0.9) => {
  if (s.inRoom !== room) return null;
  // (a story room keeps its taps in .stations; a Home Book room keeps them on its story layer)
  const t = [...(s.room?.stations || []), ...(s.room?.storyLayer?.stations || [])].find((q) => q?.id === id);
  return t ? { x: t.x, y, z: t.z } : null;
};
const board = (s) => (s.inRoom ? null : s.board?.root || s.board?.target || null);
const backDoor = (s) => (s.inRoom ? null : { x: SPOTS.backDoor.x, y: 1.2, z: SPOTS.backDoor.z });
// the invitations still to give: the nearest district's receiver (day14.js handover: who takes it there), and where
// they are when not about (SPOTS, or the front of their room)
const INVITE = [
  ['home', 'phothar', SPOTS.phothar], ['quarter', 'toetoe', SPOTS.toetoeOut], ['market', 'khwarnyo', SPOTS.teashop], ['wharf', 'kothiha', SPOTS.kothiha],
  ['junction', 'naychi', SPOTS.press], ['hearth', 'khinmay', SPOTS.bakery], ['garden', 'hpohtaw', SPOTS.hpohtaw], ['blank', 'pyaesone', SPOTS.lodge],
];
const nextInvite = (s) => {
  const m = s.game?.maya?.root?.position;
  let best = null, bd = Infinity;
  for (const [d, who, at] of INVITE) {
    if (f(s, `inv.${d}`)) continue;
    const dist = m ? Math.hypot(at.x - m.x, at.z - m.z) : 0;
    if (dist < bd) { bd = dist; best = { who, x: at.x, z: at.z }; }
  }
  return best;
};
export default [
  { id: 'd14.morning', who: 'wintwar', done: (s) => f(s, 'morning'), my: 'မဝင့်ဝါနဲ့ အရင် စကားပြောပါ', en: 'Talk to Ma Wint War first' },
  { id: 'd14.board', target: board, done: (s) => f(s, 'board') || f(s, 'ttMet'), my: 'ဘုတ်ပေါ်က စာရွက်တစ်ရွက်ကို ဖတ်ပါ', en: 'Read the one note on the board' },
  { id: 'd14.invites', go: 'door:templates', done: (s) => f(s, 'invites') || f(s, 'ttMet'), my: 'ဖိတ်စာတွေကို သွားယူပါ', en: 'Go and collect the invitations' },
  // the Quarter: Toe Toe
  { id: 'd14.toetoe', who: 'toetoe', done: (s) => f(s, 'ttMet'), my: 'စာရွက်ရေးခဲ့တဲ့ တိုးတိုးကို လိုက်ရှာပါ', en: 'Find Toe Toe, who wrote the note' },
  { id: 'd14.page', who: 'toetoe', done: (s) => f(s, 'page') || f(s, 'ttTalk'), my: 'တိုးတိုးနဲ့ သူ့စာစီစာကုံးအကြောင်း စကားပြောပါ', en: 'Talk with Toe Toe about his essay' },
  { id: 'd14.ttTalk', who: 'toetoe', done: (s) => f(s, 'ttTalk'), my: 'တိုးတိုးနဲ့ စကားဆက်ပြောပါ', en: 'Keep talking with Toe Toe' },
  { id: 'd14.stepOut', done: (s) => f(s, 'ttReady') || f(s, 'ttNames'), my: 'တိုးတိုး ရေးနေတုန်း ခဏ အပြင်ထွက်ပေးပါ', en: 'Step outside while Toe Toe writes' },
  { id: 'd14.list', who: 'toetoe', done: (s) => f(s, 'ttNames'), my: 'တိုးတိုးဆီ ပြန်သွားပြီး သူ့စာရင်း ကြည့်ပါ', en: "Go back and see Toe Toe's list" },
  // the Junction: the printing (Ko Wunna: the proof, the match, then the press)
  { id: 'd14.press', who: 'kowunna', done: (s) => f(s, 'rumour.shed') || f(s, 'matched') || f(s, 'printed'), my: 'တိုးတိုးစာကို ပုံနှိပ်ပေးမယ့်သူ ရှာပါ', en: "Find someone to print Toe Toe's essay" },
  { id: 'd14.match', who: 'kowunna', done: (s) => f(s, 'matched') || f(s, 'printed'), my: 'စကားတိုင်းကို ပြောခဲ့သူနဲ့ မှန်အောင် ပြန်တွဲပါ', en: 'Match every saying to who said it' },
  { id: 'd14.print', who: 'kowunna', done: (s) => f(s, 'printed'), my: 'ကိုဝဏ္ဏကို စာအုပ်ငယ်တွေ ပုံနှိပ်ခိုင်းပါ', en: 'Have Ko Wunna print the booklets' },
  // the invitations still in the bag (Market, Wharf, Junction, Hearth Row, Garden, Blank Page): while she has some
  { id: 'd14.invitesOut', go: nextInvite, when: (s) => s.has('invites') && !f(s, 'door'), done: (s) => !s.has('invites'), my: 'ကျန်တဲ့ ဖိတ်စာတွေကို လိုက်ဝေပါ', en: 'Hand out the rest of the invitations' },
  // the Back Cover (the booklets ride in the car: no page-turns until they are unloaded)
  { id: 'd14.door', target: backDoor, done: (s) => f(s, 'door'), my: 'ကိုယ့်သော့နဲ့ နောက်ကျောဖုံးကို ဖွင့်ပါ', en: 'Open the Back Cover with your own key' },
  { id: 'd14.unload', at: 'door:backcover', target: (s) => station(s, 'backcover', 'holes'), done: (s) => f(s, 'unloaded'), my: 'စာအုပ်ငယ်တွေကို အထဲမှာ ချထားခဲ့ပါ', en: 'Unload the booklets inside' },
  { id: 'd14.reply', at: 'door:backcover', target: (s) => station(s, 'backcover', 'slope'), done: (s) => f(s, 'reply'), my: 'နာမည်မပါတဲ့စာကို ကိုယ့်စကားနဲ့ကိုယ် ပြန်ရေးပါ', en: 'Answer the unsigned letter in your own words' },
  { id: 'd14.lastLine', at: 'door:backcover', target: (s) => station(s, 'backcover', 'slope'), done: (s) => f(s, 'blank'), my: 'ပြန်စာရဲ့ နောက်ဆုံးစာကြောင်းကို ဆုံးဖြတ်ပါ', en: "Decide the reply's last line" },
  { id: 'd14.night', go: 'door:about', done: (s) => f(s, 'done'), my: 'အိမ်ပြန်ပြီး ဒီညစာ စာမျက်နှာ ရေးပါ', en: "Go home and write tonight's page" },
];
