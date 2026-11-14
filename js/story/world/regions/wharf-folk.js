// Ledger Wharf townsfolk: the people who work the quay, the godown rows and the rope walk (District 3).
// Pure data, no imports (so cast.js may import it without pulling in any art).
//
//   WHARF_FOLK  cast entries in cast.js's own shape ({ id, name, district, role, look }). They are NOT in cast.js
//               yet: until cast.js adds them (SHARED NEED: `import { WHARF_FOLK } from './world/regions/wharf-folk.js'`
//               and `CAST.push(...WHARF_FOLK)` before its byId map is built), story.spawn() finds no look for these
//               ids and the region simply spawns nobody (world/index.js skips a failed spawn).
//   FOLK_PEOPLE region PEOPLE rows (regions/index.js format): where each one works, a hello that hints at the
//               chapter's lesson and never at where to go, and a job (story.setJob) so they get on with their work.
//
// Lessons (INDEX 14): ch 2 လူ့ဘဝ (where you grow up is unfair: blame neither it nor yourself; choose how you meet
// it) and ch 8 ဥပေက္ခာ (hatred brings no good; don't resent anyone doing well), the two Wharf chapters (Days 5-6).
// Names are invented; every Burmese line is a draft for Maya. People in story scenes (Daw Sanda, Ko Thiha,
// U Bo Lay, Maung Nge, the ferryman, the Fish Jetty woman, the porters inside) belong to the day scripts.

const P = (id, my, en, roleMy, roleEn, look, more = {}) => ({ id, name: { my, en }, district: 'wharf', role: { my: roleMy, en: roleEn }, look, ...more });

export const WHARF_FOLK = [
  P('wkun', 'ဦးဖိုးကွန်', 'U Pho Kun', 'ပိုက်ကွန် ဖာသူ', 'net mender',
    { age: 'elder', build: 'slim', skin: 3, hair: 'bald', hairColor: 'grey', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'brown', check: true, extras: ['glasses'] }),
  P('wthit', 'ကိုသစ်', 'Ko Thit', 'လှေပြင်သူ', 'boatwright',
    { age: 'adult', build: 'mid', skin: 4, hair: 'short', top: 'tee', topColor: 'olive', bottom: 'longyi', bottomColor: 'navy', check: true, extras: ['towel', 'apron'], extraColor: 'tan' }),
  P('wmyint', 'မမြင့်', 'Ma Myint', 'ဆိပ်ကမ်း လက်ဖက်ရည်ဆိုင်', 'quay tea stall',
    { age: 'adult', build: 'mid', skin: 2, hair: 'bun', top: 'blouse', topColor: 'coral', bottom: 'htamein', bottomColor: 'teal', extras: ['thanaka', 'apron'] }),
  P('whtun', 'ကိုထွန်း', 'Ko Htun', 'ကုန်ထမ်းသူ', 'porter',
    { age: 'adult', build: 'wide', skin: 4, hair: 'cap', top: 'vest', topColor: 'cream', bottom: 'longyi', bottomColor: 'charcoal', check: true, extras: ['towel'], extraColor: 'rose' }),
  P('waye', 'ဒေါ်အေး', 'Daw Aye', 'တံငါသည်ရဲ့ ဇနီး', "a fisherman's wife",
    { age: 'adult', build: 'slim', skin: 3, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'sky', bottom: 'htamein', bottomColor: 'plum', extras: ['thanaka'] }),
  P('wwawa', 'ဝါဝါ', 'Wa Wa', 'ဘဲထိန်း ကလေး', 'minds the ducks',
    { age: 'child', build: 'slim', skin: 3, hair: 'braid', top: 'tee', topColor: 'mustard', bottom: 'htamein', bottomColor: 'leaf', extras: ['thanaka'] }, { years: 9 }),
  P('wzaw', 'ကိုနိုင်', 'Ko Naing', 'ဆိုက်ကား နင်းသူ', 'trishaw rider',
    { age: 'adult', build: 'slim', skin: 2, hair: 'spiky', top: 'shirt', topColor: 'teal', bottom: 'longyi', bottomColor: 'maroon', check: true, extras: ['towel'], extraColor: 'cream' }),
  P('wnu', 'ဒေါ်နု', 'Daw Nu', 'ငါးခြောက် လှန်းသူ', 'dries fish',
    { age: 'elder', build: 'mid', skin: 3, hair: 'bun', hairColor: 'white', top: 'blouse', topColor: 'grey', bottom: 'htamein', bottomColor: 'brown', extras: ['towel', 'thanaka'], extraColor: 'cream' }),
  P('wthein', 'ဦးသိန်း', 'U Thein', 'ဂိုဒေါင် စာရင်းကိုင်', 'godown bookkeeper',
    { age: 'elder', build: 'wide', skin: 1, hair: 'side', hairColor: 'grey', top: 'shirt', topColor: 'white', bottom: 'longyi', bottomColor: 'teal', check: true, extras: ['glasses', 'pencil'] }),
  P('wmay', 'မမေ', 'Ma May', 'ရေတွင်းနား အဝတ်လျှော်သူ', 'washes at the Well Lane well',
    { age: 'adult', build: 'mid', skin: 3, hair: 'bun', top: 'blouse', topColor: 'rose', bottom: 'htamein', bottomColor: 'navy', extras: ['thanaka', 'towel'], extraColor: 'cream' }),
  P('wkyaw', 'ဦးကျော်', 'U Kyaw', 'ကြိုးကျစ်သူ', 'rope maker',
    { age: 'elder', build: 'slim', skin: 4, hair: 'short', hairColor: 'grey', top: 'vest', topColor: 'cream', bottom: 'longyi', bottomColor: 'olive', check: true, extras: ['towel'], extraColor: 'tan' }),
];

const job = (x, z, h, mood = 'work', r = 1.0, workFor = [8, 16]) => ({ area: { x, z, r }, spot: { x, z, h }, mood, workChance: 0.8, workFor });

/** Where they work (world metres; heading 0 faces +Z, the street camera). See regions/wharf.js for the places. */
export const FOLK_PEOPLE = [
  { id: 'wkun', x: 35.2, z: 485.3, heading: 0, job: job(35.4, 485.3, 0, 'work', 0.9),
    hello: { my: 'ရေဆွဲအား အကြီးဆုံးနေရာမှာ ပိုက်ကွန် ပြဲတာပဲ။ ရေကို မကျိန်ဘူး၊ ဖာတယ်။', en: "A net tears where the water pulls hardest. I don't curse the water. I mend." } },
  { id: 'wthit', x: 66.9, z: 477.6, heading: 0.9, job: job(67.0, 477.4, 0.9, 'work', 0.8),
    hello: { my: 'ဒီပျဉ်ချပ်က သစ်ပင်ညံ့က ထွက်တာ။ သေချာ တပ်ရင်တော့ ပေါ်တာပဲ။', en: 'This plank came off a poor tree. Fit it well and it still floats.' } },
  { id: 'wmyint', x: 66.9, z: 425.6, heading: 0.6, job: job(66.9, 425.6, 0.6, 'work', 0.8),
    hello: { my: 'ဆိပ်ကမ်းမှာ မွေးတယ်၊ ဆိပ်ကမ်းမှာ နေမယ်။ ဒါကြောင့် ဆိပ်ကမ်းမှာ အကောင်းဆုံး လက်ဖက်ရည် ဖျော်တယ်။', en: 'Born on the quay, staying on the quay. So I make the best tea on it.' } },
  { id: 'whtun', x: 30.4, z: 480.4, heading: -0.3, job: job(30.0, 480.3, -0.3, 'work', 1.3),
    hello: { my: 'ဒီနေ့ သူ့ဝန်တွေ ပေါ့တယ်။ မနက်ဖြန် ငါ့အလှည့် ဖြစ်မှာပေါ့။ ညည်းလို့ အိတ်က မပေါ့လာဘူး။', en: 'His loads were light today. Mine tomorrow, maybe. Grumbling never made a sack lighter.' } },
  { id: 'waye', x: 4.4, z: 453.7, heading: 0.2, job: job(4.6, 453.7, 0.2, 'work', 1.1),
    hello: { my: 'အိမ်နီးချင်းလှေ ဒီနေ့လည်း ငါးအပြည့်နဲ့ ပြန်လာတယ်။ ဝမ်းသာပါတယ်။ ကျွန်မတို့လှေလည်း ရောက်လာမှာပါ။', en: "My neighbour's boat came back full again today. Good for her. Ours will come in too." } },
  { id: 'wwawa', x: 67.6, z: 488.6, heading: 0.5, job: job(67.8, 489.0, 0.5, 'play', 1.4, [5, 10]),
    hello: { my: 'ဘဲတွေက ဘယ်သူ့ဆိပ်လဲ မမေးဘူး။ ရေရှိရင် ကူးတာပဲ။', en: "The ducks don't ask whose jetty it is. Where there's water, they swim." } },
  { id: 'wzaw', x: 6.2, z: 391.3, heading: -0.5, job: job(6.0, 391.2, -0.5, 'read', 0.8, [6, 14]),
    hello: { my: 'အသွား ကုန်တက်၊ အပြန် ကုန်ဆင်း။ လမ်းက တစ်လမ်းတည်းပဲ။ နင်းရုံပဲ။', en: 'Uphill going, downhill back. One road. I just pedal.' } },
  { id: 'wnu', x: 69.6, z: 451.4, heading: 0, job: job(69.6, 451.4, 0, 'work', 0.9),
    hello: { my: 'ဒီနေ့ နေက ကျွန်မဘက်၊ မိုးက သူ့ဘက်။ မနက်ဖြန် ပြောင်းမှာ။ မိုးကောင်းကင်ကို မုန်းလို့ ဘာရမလဲ။', en: "Sun on my side today, rain on hers. Tomorrow it swaps. What's the use of hating the sky?" } },
  { id: 'wthein', x: 25.4, z: 446.7, heading: -0.2, job: job(25.2, 446.6, -0.2, 'read', 0.9),
    hello: { my: 'မကြိုက်တဲ့သူ့စာရင်းတောင် ဖြောင့်ဖြောင့် ရေးရတယ်။ ချိန်ခွင်က နာမည် မသိဘူး။', en: "You keep the ledger straight, even for someone you don't like. The scale doesn't know names." } },
  { id: 'wmay', x: -24.6, z: 425.2, heading: 0.3, job: job(-24.6, 425.2, 0.3, 'work', 1.0),
    hello: { my: 'ဒီလမ်းတစ်လမ်းလုံး ရေတွင်း တစ်တွင်းတည်း။ တန်းစီရတာ ငါ့အလှည့်ပဲ။ စောင့်ရင်း အဝတ်တွေ ခေါက်လိုက်တယ်။', en: 'One well for the whole lane. Queuing is my lot. I fold the washing while I wait.' } },
  { id: 'wkyaw', x: 6.2, z: 480.5, heading: 0, job: job(6.2, 480.5, 0, 'work', 1.0),
    hello: { my: 'သူ့ကြိုးက ငါ့ကြိုးထက် ပိုရောင်းရတယ်။ ကောင်းတာပေါ့။ ငါ့ကြိုးလည်း မပြတ်ပါဘူး။', en: "His rope sells better than mine. Good for him. Mine doesn't snap either." } },
];
