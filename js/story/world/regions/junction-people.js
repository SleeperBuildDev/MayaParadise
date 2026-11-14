// Newsprint Junction townsfolk: people who live in the homes of the fill pass (junction-fill.js) and get on with their
// day in their yards and at the kerbs (District 4). Pure data, no imports (so cast.js may import it without pulling in
// any art).
//
//   JUNCTION_FOLK  cast entries in cast.js's own shape ({ id, name, district, role, look }). They are NOT in cast.js
//                  yet: until cast.js adds them (SHARED NEED: `import { JUNCTION_FOLK } from './world/regions/junction-people.js'`
//                  and `CAST.push(...JUNCTION_FOLK)` before its byId map is built), story.spawn() finds no look for these
//                  ids and the region simply spawns nobody (world/index.js skips a failed spawn).
//   FOLK_PEOPLE    region PEOPLE rows (regions/index.js format), merged into regions/junction.js PEOPLE: where each one
//                  works (beside the yard things of junction-fill.js), a hello that hints at one of the Junction's
//                  chapters and never at where to go, and a job (story.setJob) so they get on with it.
//
// Lessons (INDEX 14): ch 11 the only one you can steer is yourself (the west bank, Day 7's side); ch 12 don't believe
// just because it is said, old, printed or your own sum: look yourself; ch 13 one deed reads 6 to you and 9 to the
// other, and knowledge does good only when goodwill carries it. Names are invented and screened against the INDEX 3
// list (no Naing, Win, Zaw, Zeya, Oo, Tun, Khaing, Thazin, Myo, Htet, Hein, no "Ko Th-"), and against every name
// already in the cast. Every Burmese line is a draft for Maya. The Junction's story people (Ma Thida, Daw Sein, U Kan,
// Ko Min, Moe Moe, Daw Hla, Ko San, Ko Wunna, U Tint) belong to the day scripts and regions/junction.js.

const P = (id, my, en, roleMy, roleEn, look, more = {}) => ({ id, name: { my, en }, district: 'junction', role: { my: roleMy, en: roleEn }, look, ...more });

export const JUNCTION_FOLK = [
  P('jdawyin', 'ဒေါ်ယဉ်', 'Daw Yin', 'လမ်းကြားက တံမြက်လှည်းသူ', 'sweeps the bridge hands\' lane',
    { age: 'elder', build: 'mid', skin: 3, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'white', bottom: 'htamein', bottomColor: 'teal', extras: ['thanaka', 'towel'], extraColor: 'cream' }),
  P('jdawsabai', 'ဒေါ်စံပယ်', 'Daw Sabai', 'ဖျာလှန်းသူ', 'dries mats in the back lots',
    { age: 'adult', build: 'wide', skin: 4, hair: 'bun', top: 'blouse', topColor: 'mustard', bottom: 'htamein', bottomColor: 'maroon', extras: ['thanaka', 'apron'] }),
  P('juchan', 'ဦးချမ်း', 'U Chan', 'မနေ့က သတင်းစာ ဖတ်တဲ့ အဘိုး', 'reads yesterday\'s paper',
    { age: 'elder', build: 'slim', skin: 3, hair: 'bald', hairColor: 'grey', top: 'eingyi', topColor: 'cream', bottom: 'longyi', bottomColor: 'navy', check: true, extras: ['glasses'] }),
  P('jmanu', 'မနု', 'Ma Nu', 'မုန့်ကြော်သည်', 'fries fritters at the kerb',
    { age: 'adult', build: 'mid', skin: 2, hair: 'long', top: 'blouse', topColor: 'rose', bottom: 'htamein', bottomColor: 'leaf', extras: ['thanaka', 'apron'] }),
  P('jkosoe', 'ကိုစိုး', 'Ko Soe', 'စက်ဘီး ဘရိတ် ပြင်သူ', 'mends bicycle brakes',
    { age: 'adult', build: 'slim', skin: 4, hair: 'short', top: 'tee', topColor: 'grey', bottom: 'longyi', bottomColor: 'brown', check: true, extras: ['towel'], extraColor: 'grey' }),
  P('jywet', 'ရွက်ရွက်', 'Ywet Ywet', 'ခြောက်ကို ကြည့်နေတဲ့ ကလေး', 'looks at the painted six',
    { age: 'child', build: 'slim', skin: 2, hair: 'braid', top: 'tee', topColor: 'sky', bottom: 'htamein', bottomColor: 'plum', extras: ['thanaka'] }, { years: 8 }),
  P('jkopaing', 'ကိုပိုင်', 'Ko Paing', 'ပုံနှိပ်တိုက်က စက္ကူထမ်းသူ', 'carries paper for the press',
    { age: 'adult', build: 'wide', skin: 4, hair: 'cap', top: 'vest', topColor: 'olive', bottom: 'longyi', bottomColor: 'charcoal', check: true, extras: ['towel'], extraColor: 'rose' }),
];

const HP = Math.PI / 2;
const job = (x, z, h, mood = 'work', r = 0.9, workFor = [8, 16]) => ({ area: { x, z, r }, spot: { x, z, h }, mood, workChance: 0.8, workFor });

/** heading 0 faces +Z (toward the follow camera). Spots stand in the yards and at the kerbs of junction-fill.js, clear
 *  of the doors, the desks and the day scripts' places (regions/junction.js KEEP). */
export const FOLK_PEOPLE = [
  { id: 'jdawyin', x: 61.0, z: 321.6, heading: HP,
    hello: { my: 'အမှိုက်ရှိတယ်လို့ လူတွေ ပြောကြတယ်။ ကျွန်မက ကိုယ်တိုင် ကြည့်ပြီးမှ လှည်းတယ်။', en: 'Folk tell me there\'s rubbish here. I look for myself first, then I sweep.' },
    job: job(61.0, 321.6, HP, 'work', 1.0) },
  { id: 'jdawsabai', x: 46.8, z: 276.4, heading: 0,
    hello: { my: 'မိုးကို မရွာအောင် ကျွန်မ မလုပ်နိုင်ဘူး။ ဖျာတွေ သိမ်းတာကတော့ ကိုယ့်လက်ထဲမှာ။', en: 'I can\'t stop the rain. Bringing the mats in is in my own hands.' },
    job: job(46.8, 276.4, 0, 'work', 0.9) },
  { id: 'juchan', x: 141.6, z: 343.4, heading: 0,
    hello: { my: 'မနေ့က သတင်းစာက မိုးရွာမယ်တဲ့။ ကောင်းကင်ကိုတော့ ကိုယ်တိုင် မော့ကြည့်ရသေးတယ်။', en: 'Yesterday\'s paper said rain. I still look up at the sky myself.' },
    job: job(141.6, 343.4, 0, 'read', 0.4) },
  { id: 'jmanu', x: 148.6, z: 345.3, heading: Math.PI,
    hello: { my: 'အဖွားရဲ့ နည်းပါ။ ဟောင်းပေမဲ့ မနက်တိုင်း ကိုယ်တိုင် မြည်းကြည့်တယ်။', en: 'It\'s my grandmother\'s recipe. Old, yes, but I taste it myself every morning.' },
    job: job(148.6, 345.3, Math.PI, 'work', 0.5) },
  { id: 'jkosoe', x: 181.0, z: 327.6, heading: HP,
    hello: { my: 'ဘရိတ် ကောင်းတယ်လို့ ပိုင်ရှင်က ပြောတယ်။ ကျွန်တော်ကတော့ ကိုယ်တိုင် ဆွဲကြည့်မှ ယုံတယ်။', en: 'The owner says the brake is fine. I believe it once I\'ve squeezed it myself.' },
    job: job(181.0, 327.6, HP, 'work', 0.7) },
  { id: 'jywet', x: 153.6, z: 317.8, heading: -0.4,
    hello: { my: 'ကျွန်မဘက်က ကြည့်ရင် ၆၊ မောင်လေးဘက်က ကြည့်ရင် ၉ တဲ့။ နှစ်ယောက်လုံး မျက်လုံး မမှားဘူး။', en: 'From my side it\'s a six; my little brother says nine. Neither of our eyes is wrong.' },
    job: job(153.6, 317.8, -0.4, 'play', 1.2) },
  { id: 'jkopaing', x: 176.2, z: 279.4, heading: 0,
    hello: { my: 'စာလုံးတွေကို ကျွန်တော် သယ်ပေးရုံပါ။ ဘယ်လို ဖတ်မလဲဆိုတာ စေတနာက ဆုံးဖြတ်တာ။', en: 'I only carry the letters. How they\'re read, goodwill decides that.' },
    job: job(176.2, 279.4, 0, 'work', 0.8) },
];
