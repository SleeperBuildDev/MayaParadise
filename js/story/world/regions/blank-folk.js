// The Blank Page's passers-by: travellers who stop at the lodge on the last leaf and get on with their day
// outside it (District 7). Pure data, no imports (so cast.js may import it without pulling in any art).
//
//   BLANK_FOLK   cast entries in cast.js's own shape ({ id, name, district, role, look }). They are NOT in cast.js
//                yet: until cast.js adds them (SHARED NEED: `import { BLANK_FOLK } from './world/regions/blank-folk.js'`
//                and `CAST.push(...BLANK_FOLK)` before its byId map is built), story.spawn() finds no look for these
//                ids and the region simply spawns nobody (world/index.js skips a failed spawn).
//   FOLK_PEOPLE  region PEOPLE rows, merged into regions/blank.js PEOPLE: where each one works (beside a thing in
//                blank-life.js), a hello that hints at the chapter's lesson and never at where to go, and a job.
//
// Four of them, no more: every person on screen is ~3 draw calls, and with the lodge's four the busiest view on
// the leaf stays inside the phone budget (~60). The kindling block and the bean rows are left mid-job.
//
// Lesson (INDEX 14, ch 22): test a teaching for yourself instead of taking it on authority. Every hello is
// someone who was told a thing, tried it themselves and found out. None of them has walked north (Day 13:
// "nobody has ever walked north from here"), none of them names a place. Names are invented and screened
// against INDEX 3 (no Naing, Win, Zaw, Zeya, Oo, Tun, Khaing, Thazin, Myo, Htet, Hein; no "Ko Th-") and
// against the other districts' folk. Every Burmese line is a draft for Maya.

const P = (id, my, en, roleMy, roleEn, look, more = {}) => ({ id, name: { my, en }, district: 'blank', role: { my: roleMy, en: roleEn }, look, ...more });

export const BLANK_FOLK = [
  P('bkolay', 'ကိုလေး', 'Ko Lay', 'လက်ဖက်ရည် လှည်းသမား', 'the tea cart',
    { age: 'adult', build: 'mid', skin: 3, hair: 'short', top: 'shirt', topColor: 'cream', bottom: 'longyi', bottomColor: 'teal', check: true, extras: ['towel'], extraColor: 'rose' }),
  P('bhlayi', 'ဒေါ်လှရီ', 'Daw Hla Yi', 'ရေတွင်းက ရေခပ်သူ', 'draws water at the well',
    { age: 'elder', build: 'mid', skin: 2, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'white', bottom: 'htamein', bottomColor: 'maroon', extras: ['thanaka'] }),
  P('bnwe', 'မနွယ်', 'Ma Nwe', 'ဖိနပ် ပြင်သူ', 'mends travellers\' sandals',
    { age: 'adult', build: 'slim', skin: 1, hair: 'long', top: 'blouse', topColor: 'mustard', bottom: 'htamein', bottomColor: 'navy', extras: ['thanaka', 'flower'] }),
  P('bsawpaw', 'စောပေါ', 'Saw Paw', 'ခဲတံနဲ့ ကစားကွက် ဆွဲတဲ့ ကလေး', 'draws a hopscotch in pencil',
    { age: 'child', build: 'slim', skin: 2, hair: 'spiky', top: 'tee', topColor: 'sky', bottom: 'shorts', bottomColor: 'brown', extras: ['pencil'] }, { years: 8 }),
];

const job = (x, z, h, mood = 'work', r = 0.9, workFor = [8, 16]) => ({ area: { x, z, r }, spot: { x, z, h }, mood, workChance: 0.8, workFor });

/** heading 0 faces +Z (toward the follow camera). Spots stand beside the blank-life.js things placed in blank.js. */
export const FOLK_PEOPLE = [
  { id: 'bkolay', x: 132.0, z: 9.3, heading: 0.5,
    hello: { my: 'ကောင်းတယ်လို့ ကျွန်တော် ပြောတာကို မယုံနဲ့ဦး။ တစ်ငုံ သောက်ကြည့်ပြီးမှ ပြောပါ။', en: "Don't take my word that it's good. Have a sip, then you tell me." },
    job: job(132.0, 9.3, 0.5, 'work', 0.6) },
  { id: 'bhlayi', x: 127.9, z: 6.2, heading: 0.3,
    hello: { my: 'ဒီရေက မင်နံ့ ရမယ်လို့ လူတိုင်း ပြောကြတယ်။ ကိုယ်တိုင် ခပ်ပြီး မြည်းကြည့်တော့ ချိုတယ်။', en: 'Everyone said this water would taste of ink. I drew a bucket and tasted it myself. Sweet.' },
    job: job(127.9, 6.2, 0.3, 'work', 0.7) },
  { id: 'bnwe', x: 133.2, z: 1.0, heading: 0,
    hello: { my: 'ဒီဖိနပ် ပြင်လို့ မရတော့ဘူးတဲ့။ ကိုယ်တိုင် လှန်ကြည့်တော့ ကြိုးတစ်ချောင်း ပြုတ်ရုံပဲ။', en: "They told me these sandals were past mending. I turned them over myself: one strap off, that's all." },
    job: job(133.2, 1.0, 0, 'work', 0.4) },
  { id: 'bsawpaw', x: 129.6, z: 11.6, heading: -0.3,
    hello: { my: 'ဒီစာမျက်နှာပေါ် ဆွဲလို့ မရဘူးလို့ အကြီးတွေက ပြောတယ်။ ကျွန်တော် စမ်းကြည့်တယ်။ ရတယ်လေ!', en: "The big kids said you can't draw on this page. I tried it. You can!" },
    job: job(129.6, 11.6, -0.3, 'play', 1.0) },
];
