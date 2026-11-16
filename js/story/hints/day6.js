// Day 6 hints: what to do next. Ordered by play order.
// Where (owner 2026-11-16: the corner map's mark, the notebook map's pin, the tap pointer): who = the person, live (else
// the room the day's roomCast puts them in, else `at`); go = where the step happens instead; hints-where.js has the specs.
// (The night page needs d6.ch8Done and d6.ncAsked. Nay Chi's slates (ch 11) are only possible while she
//  follows Maya: from the noon wind (d6.gust) until her evening ask (d6.ncEvening), which comes as soon as
//  ch 8 is done or three slates are back. So the slate steps sit before ch 8's last run and hide after the
//  evening. Every flag is set in day6.js.)
import { P } from '../day6-set.js';

const f = (s, k) => !!s.flag(`d6.${k}`);
const RAFT = { x: P.raft.x, z: P.raft.z }; // Ko Thiha's raft, moored at Little Jetty
// (the slates: day6.js STATIONS: the ropes in the weigh-house, the tea basket in the tea shop, the stamps at the Market post)
const following = (s) => f(s, 'gust') && !f(s, 'ncEvening');

export default [
  { id: 'd6.morning', who: 'wintwar', done: (s) => f(s, 'morning'), my: 'မဝင့်ဝါနဲ့ အရင် စကားပြောပါ', en: 'Talk to Ma Wint War first' },
  { id: 'd6.ask', who: 'naychi', done: (s) => f(s, 'ncAsked'), my: 'နေခြည် ဘာမေးချင်လဲ နားထောင်ကြည့်ပါ', en: 'Hear what Nay Chi wants to ask' },
  // ch 8 · Daw Sanda, Ko Thiha's run, the four wishes
  { id: 'd6.sanda', who: 'dawsanda', done: (s) => f(s, 'dsMet'), my: 'ဒေါ်စန္ဒာနဲ့ စကားပြောပါ', en: 'Talk to Daw Sanda' },
  { id: 'd6.ride', at: RAFT, who: 'kothiha', done: (s) => f(s, 'rideSeen'), my: 'ကိုသီဟကို လက်ပြခေါ်ပြီး ဖောင်လိုက်စီးပါ', en: 'Wave Ko Thiha in and ride along' },
  { id: 'd6.thTalk', at: RAFT, who: 'kothiha', done: (s) => f(s, 'thTalk'), my: 'ကိုသီဟနဲ့ ထိုင်ပြီး စကားပြောပါ', en: 'Sit and talk with Ko Thiha' },
  { id: 'd6.wishes', at: RAFT, who: 'kothiha', done: (s) => f(s, 'wishes'), my: 'ကိုသီဟရဲ့ ဆုတောင်း လေးခုကို နားထောင်ပါ', en: "Hear Ko Thiha's four wishes" },
  { id: 'd6.note2', who: 'maungnge', when: (s) => f(s, 'wishes'), done: (s) => f(s, 'note2'), my: 'ဆုတောင်းစာကို မောင်ငယ်ဆီ အရင်ပေးပါ', en: 'Give Maung Nge his wish note first' },
  { id: 'd6.note3', who: 'dawsanda', when: (s) => f(s, 'wishes'), done: (s) => f(s, 'note3'), my: 'နောက်တစ်စောင်ကို ဒေါ်စန္ဒာ့ကို ပေးပါ', en: 'Then give Daw Sanda hers' },
  // ch 11 · Nay Chi's slates, by her own hands (only while she follows)
  { id: 'd6.slate2', go: 'door:weighhouse', when: following, done: (s) => f(s, 'slate2'), my: '"လေထဲက စကားသံ" ကျောက်သင်ပုန်းကို ရှာပါ', en: 'Find the slate about words in the wind' },
  { id: 'd6.slate4.carry', who: 'naychi', when: (s) => following(s) && f(s, 's4carry'), done: (s) => f(s, 'slate4'), my: 'နေခြည် အထုပ်ပို့တာ လိုက်သွားပါ', en: 'Go with Nay Chi as she delivers the parcel' },
  { id: 'd6.slate4', who: 'maungnge', when: following, done: (s) => f(s, 'slate4'), my: 'မောင်ငယ့်လှည်းမှာ နေခြည့်ကို ကူပေးပါ', en: "Help Nay Chi at Maung Nge's cart" },
  { id: 'd6.slate1', who: 'kophyo', when: following, done: (s) => f(s, 'slate1'), my: 'နေခြည့်ကျောက်သင်ပုန်းအကြောင်း ကိုဖြိုးကို မေးပါ', en: "Ask Ko Phyo about Nay Chi's slate" },
  { id: 'd6.slate3', go: 'door:teashop', when: following, done: (s) => f(s, 'slate3'), my: '"နေ့စဉ်အလေ့အကျင့်" ကျောက်သင်ပုန်းကို ရှာပါ', en: 'Find the slate about a daily habit' },
  { id: 'd6.slate5', go: 'door:marketpost', when: following, done: (s) => f(s, 'slate5'), my: '"ဘယ်သူကြည့်နေလဲ" ကျောက်သင်ပုန်းကို ရှာပါ', en: "Find the slate about who's watching" },
  // ch 8 · the last run
  { id: 'd6.h', at: RAFT, who: 'kothiha', done: (s) => f(s, 'ch8Done'), my: 'ကိုသီဟနဲ့ နောက်ဆုံးအခေါက် ထွက်ပါ', en: 'Take the last run with Ko Thiha' },
  { id: 'd6.evening', who: 'naychi', when: following, done: (s) => f(s, 'ncEvening'), my: 'နေခြည် ပြောချင်တာ နားထောင်ပေးပါ', en: 'Hear what Nay Chi wants to say' },
  { id: 'd6.night', go: 'door:about', done: (s) => f(s, 'done'), my: 'အိမ်ပြန်ပြီး ဒီညစာ စာမျက်နှာ ရေးပါ', en: "Go home and write tonight's page" },
];
