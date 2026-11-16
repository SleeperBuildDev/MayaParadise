// Day 9 hints: what to do next. Ordered by play order.
// Where (owner 2026-11-16: the corner map's mark, the notebook map's pin, the tap pointer): who = the person, live (else
// the room the day's roomCast puts them in, else `at`); go = where the step happens instead; hints-where.js has the specs.
// (after the cart, ch 14 in the bakery and ch 15 with Ei Mon can go in any order; night needs ch14Done +
// friendDone. Nay Chi is optional before then: if still unmet she waits at the Writing Room door.)
import { P } from '../day9-street.js'; // (the Row's spots: the cart tips by the scorch ring)
const f = (s, k) => !!s.flag(`d9.${k}`);
export default [
  { id: 'd9.morning', who: 'wintwar', done: (s) => f(s, 'morning'), my: 'မဝင့်ဝါနဲ့ အရင် စကားပြောပါ', en: 'Talk to Ma Wint War first' },
  { id: 'd9.row', go: { town: 'hearth', x: P.ring.x, z: P.ring.z }, done: (s) => f(s, 'tipped') || f(s, 'cart'), my: 'အသစ်ဖွင့်တဲ့ မီးဖိုတန်းကို သွားကြည့်ရအောင်', en: 'Go and see the newly opened Hearth Row' },
  { id: 'd9.loaves', who: 'maungarkar', done: (s) => f(s, 'cart'), my: 'ကျသွားတဲ့ မုန့်တွေကို လှည်းပေါ် ပြန်တင်ပါ', en: 'Put the fallen loaves back on the cart' },
  // ch 14 · Daw Khin May
  { id: 'd9.km', who: 'khinmay', done: (s) => f(s, 'kmWatch'), my: 'ဒေါ်ခင်မေနဲ့ စကားပြောပါ', en: 'Talk to Daw Khin May' },
  { id: 'd9.watch', who: 'khinmay', done: (s) => f(s, 'watched'), my: 'မုန့်တစ်ဗန်း ဖုတ်တာကို အစအဆုံး ကြည့်နေပါ', en: 'Watch one tray bake from start to end' },
  { id: 'd9.kmTalk', who: 'khinmay', done: (s) => f(s, 'kmTalk'), my: 'ဒေါ်ခင်မေနဲ့ ထိုင်ပြီး စကားပြောပါ', en: 'Sit and talk with Daw Khin May' },
  { id: 'd9.said', who: 'khinmay', done: (s) => f(s, 'said'), my: 'ဒေါ်ခင်မေရဲ့ စကားတွေကို ခွဲကြည့်ပါ', en: "Sort Daw Khin May's sentences" },
  { id: 'd9.held', who: 'khinmay', done: (s) => f(s, 'heldBack'), my: 'နောက်တစ်ဗန်းမှာ ဝင်မပြောဘဲ သူ့ဘာသာ သင်ပါစေ', en: 'On the next tray, step back; let her teach' },
  { id: 'd9.trays', go: 'door:bakery', done: (s) => f(s, 'ch14Done'), my: 'စင်ပေါ်က မုန့်ဗန်းနှစ်ဗန်းကို ယှဉ်ကြည့်ပါ', en: 'Compare the two trays on the rack' },
  // ch 15 · Ei Mon and Maung Arkar
  { id: 'd9.eimon', who: 'eimon', done: (s) => f(s, 'emMet'), my: 'အိမွန့်နဲ့ စကားပြောပါ', en: 'Talk to Ei Mon' },
  { id: 'd9.alone', looks: [
    { f: 'd9.look.tiffin', at: () => window.__day9?.S?.tiffin?.root?.position || { x: 135.32, z: 188.62 }, y: 0.35, r: 0.15 },
    { f: 'd9.look.west', at: P.yardWall, y: 0.6, r: 0.45 },
    { f: 'd9.look.hum', who: 'maungarkar', y: 1.2, r: 0.25 },
  ], who: 'maungarkar', done: (s) => f(s, 'alone'), my: 'တစ်ယောက်တည်းဖြစ်နေတဲ့ မောင်အာကာကို အသာကြည့်ပါ', en: 'Quietly watch Maung Arkar, alone' },
  { id: 'd9.tea', who: 'eimon', done: (s) => f(s, 'teaGiven'), my: 'အိမွန့်ဆီ ပြန်သွားပြီး စကားပြောပါ', en: 'Go back and talk with Ei Mon' },
  { id: 'd9.arkarTalk', who: 'eimon', done: (s) => f(s, 'arkarTalk'), my: 'အိမွန်နောက် လိုက်ပြီး သူတို့စကား နားထောင်ပါ', en: 'Follow Ei Mon and listen while they talk' },
  { id: 'd9.friend', who: 'maungarkar', done: (s) => f(s, 'friendDone'), my: 'နှစ်ယောက်လုံးကို ဘက်မလိုက်ဘဲ ကူပေးပါ', en: 'Help them both; take no side' },
  // Nay Chi (optional before the night: at the night door she comes first)
  { id: 'd9.naychi', at: 'door:eveningclass', who: 'naychi', done: (s) => f(s, 'ncMet'), my: 'နေခြည် စောင့်နေတယ်၊ သွားတွေ့လိုက်ပါ', en: "Nay Chi's waiting for you; go and see her" },
  { id: 'd9.night', go: 'door:about', done: (s) => f(s, 'done'), my: 'အိမ်ပြန်ပြီး ဒီညစာ စာမျက်နှာ ရေးပါ', en: "Go home and write tonight's page" },
];
