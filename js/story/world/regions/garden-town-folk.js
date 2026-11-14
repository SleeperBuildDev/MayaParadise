// Diary Garden townsfolk of the town fill (garden-town.js): the people of the back lanes, the shophouses and the
// workshops. Pure data, no imports (so cast.js may import it without pulling in any art).
//
//   TOWN_FOLK    cast entries in cast.js's own shape ({ id, name, district, role, look }). Like GARDEN_FOLK
//                (garden-folk.js) they are NOT in cast.js yet: SHARED NEED, cast.js adds
//                `import { TOWN_FOLK } from './world/regions/garden-town-folk.js'` and `CAST.push(...TOWN_FOLK)` beside
//                GARDEN_FOLK. Until then story.spawn() finds no look for these ids and the region spawns nobody for
//                them (world/index.js skips a failed spawn). The still figures at work in garden-town.js (gfFolk) are
//                there either way.
//   TOWN_PEOPLE  region PEOPLE rows (regions/index.js format), merged into regions/garden.js PEOPLE: where each one
//                works, a hello that carries the chapter's lesson and never points the way, and a job.
//
// Lessons (INDEX 14), the Garden's chapters: 16 nothing stays the same / wanting to be alone comes from what life
// dealt; 17 ease is looking the buyer in the face; 19 trouble comes to everyone, how I take it is mine; 20 catch the
// first rattle, a wrong that cheats the next buyer is not let pass. Names are invented; every Burmese line is a draft
// for Maya.

const P = (id, my, en, roleMy, roleEn, look, more = {}) => ({ id, name: { my, en }, district: 'garden', role: { my: roleMy, en: roleEn }, look, ...more });

export const TOWN_FOLK = [
  P('gohn', 'ဒေါ်ခင်ထွေး', 'Daw Khin Htwe', 'လမ်း လှည်းသူ', 'sweeps the back lane',
    { age: 'elder', build: 'mid', skin: 3, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'cream', bottom: 'htamein', bottomColor: 'brown', extras: ['thanaka'] }),
  P('gbakyi', 'ဦးဘကြည်', 'U Ba Kyi', 'လက်သမား', 'carpenter',
    { age: 'elder', build: 'wide', skin: 5, hair: 'short', hairColor: 'grey', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'brown', check: true, extras: ['pencil'] }),
  P('gkhaing', 'မခိုင်', 'Ma Khaing', 'ကုန်စုံဆိုင် ရှင်', 'keeps the general store',
    { age: 'adult', build: 'mid', skin: 2, hair: 'bun', top: 'blouse', topColor: 'mustard', bottom: 'htamein', bottomColor: 'teal', extras: ['thanaka'] }),
  P('gtuntun', 'ထွန်းထွန်း', 'Tun Tun', 'ခြင်းလုံး ကစားတဲ့ ကလေး', 'a boy with a cane ball',
    { age: 'child', build: 'slim', skin: 4, hair: 'spiky', top: 'tee', topColor: 'sky', bottom: 'shorts', bottomColor: 'olive' }, { years: 9 }),
  P('gaungmyint', 'ကိုအောင်မြင့်', 'Ko Aung Myint', 'ရေထမ်းသူ', 'carries water',
    { age: 'adult', build: 'slim', skin: 5, hair: 'short', top: 'shirt', topColor: 'olive', bottom: 'longyi', bottomColor: 'navy', check: true, extras: ['towel'], extraColor: 'white' }),
  P('gsein', 'ဒေါ်ကြည်ကြည်', 'Daw Kyi Kyi', 'လှေကားထစ်ပေါ် ထိုင်နေသူ', 'sits on her steps',
    { age: 'elder', build: 'slim', skin: 2, hair: 'bun', hairColor: 'white', top: 'eingyi', topColor: 'white', bottom: 'htamein', bottomColor: 'plum', extras: ['thanaka', 'glasses'] }),
  P('gthet', 'ကိုသက်', 'Ko Thet', 'စက်ဘီးပြင်သူ', 'mends bicycles',
    { age: 'adult', build: 'mid', skin: 4, hair: 'cap', top: 'tee', topColor: 'charcoal', bottom: 'longyi', bottomColor: 'olive', check: true, extras: ['towel'], extraColor: 'rose' }),
  P('gei', 'မအိ', 'Ma Ei', 'လက်ဖက်ရည်ဆိုင်က ကူသူ', 'helps at the tea stall',
    { age: 'teen', build: 'slim', skin: 3, hair: 'braid', top: 'blouse', topColor: 'rose', bottom: 'htamein', bottomColor: 'navy', extras: ['thanaka'] }, { years: 15 }),
];

const job = (x, z, h, mood = 'work', r = 1.0, workFor = [8, 16], extra = {}) => ({ area: { x, z, r }, spot: { x, z, h }, mood, workChance: 0.8, workFor, ...extra });
const HP = Math.PI / 2, PI = Math.PI;
const row = (id, x, z, h, my, en, mood = 'work', r = 1.0, extra) => ({ id, x, z, heading: h, hello: { my, en }, job: job(x, z, h, mood, r, mood === 'play' ? [5, 10] : [8, 16], extra) });

/** Where they work (world metres; heading 0 faces +Z). Checked clear of the town's things by the fill test. */
export const TOWN_PEOPLE = [
  row('gohn', 196.0, 57.6, PI,
    'ဒီနေ့ လှည်းထားတဲ့ အရွက်တွေ မနက်ဖြန် ပြန်ကြွေမှာပဲ။ ကိစ္စမရှိဘူး။ သစ်ပင်ကလည်း တစ်နေ့နဲ့ တစ်နေ့ မတူဘူးလေ။',
    "The leaves I sweep today will fall again tomorrow. That's all right. The tree isn't the same from one day to the next either.", 'work', 1.4),
  row('gbakyi', 155.3, 58.6, PI,
    'ပျဉ်ချပ် ကောက်နေရင် ငွေမယူခင် ဝယ်သူကို ပြောတယ်။ နောက်တစ်ခါ စားပွဲ လိုရင် ငါ့ဆီပဲ ပြန်လာတာ။',
    'If a plank has warped, I tell the buyer before he pays. Next time he needs a table, he comes back to me.', 'work', 0.6),
  row('gkhaing', 182.9, 98.45, 0,
    'ဆန်ကို ဝယ်သူ ရှေ့မှာပဲ ချိန်ပေးတယ်။ ဒါဆို နှစ်ယောက်လုံး ညကျ အေးအေးဆေးဆေး အိပ်ရတယ်။',
    'I weigh the rice in front of the buyer. Then neither of us lies awake tonight.', 'work', 0.5),
  row('gtuntun', 190.0, 33.6, 0,
    'ခြင်းလုံး မြောင်းထဲ ကျသွားပြီ။ ဘယ်သူ့ ခြင်းလုံးမဆို တစ်ခါတလေ ကျတာပဲ။ ငါ ပြန်ဆယ်မယ်။',
    "My cane ball fell in the drain. Everyone's does sometimes. I'll fish it out.", 'play', 1.6, { speed: 1.1 }),
  row('gaungmyint', 179.0, 70.0, PI,
    'မနေ့က ရေပုံးကြိုး နည်းနည်း ပွန်းနေတာ မြင်လိုက်တယ်။ ဒီမနက် လဲလိုက်ပြီ။ ပုံး ရေတွင်းထဲ ကျမှ လဲရင် နောက်ကျပြီ။',
    "Yesterday I saw the bucket rope starting to fray. I changed it this morning. Change it after the bucket's gone down the well and you're too late.", 'work', 2.0),
  row('gsein', 264.6, 70.0, -HP,
    'သားက မြို့ကို ပြောင်းသွားပြီ။ အိမ်က တိတ်သွားတယ်။ တိတ်တာ မဆိုးပါဘူး။ အိမ်ရဲ့ ရာသီ ပြောင်းသွားတာပဲ။',
    "My son has moved to the city. The house has gone quiet. Quiet isn't bad. It's just the house's new season.", 'read', 0.5),
  row('gthet', 205.6, 55.0, 0,
    'လေ တဖြည်းဖြည်း ယိုနေတဲ့ ဘီးကို အခုပဲ ဖာပေးတယ်။ တံတားပေါ် ရောက်မှ ပြားသွားတာကို မစောင့်ဘူး။',
    "A tyre with a slow leak, I patch it now. I don't wait for it to go flat halfway over the bridge.", 'work', 0.7),
  row('gei', 228.4, 56.4, PI,
    'နို့ ချဉ်သွားရင် ဘယ်သူမှ မသိလည်း သွန်ပစ်ရမယ်လို့ ဦးလေးက ပြောတယ်။ မသိတဲ့လူ သောက်ရမှာကိုး။',
    "Uncle says if the milk turns, pour it away, even if nobody would notice. Someone who doesn't know would drink it.", 'work', 0.6),
];
