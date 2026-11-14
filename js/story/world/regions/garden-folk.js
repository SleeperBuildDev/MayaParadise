// Diary Garden townsfolk: the people who keep the plots, the kiln square and the lanes (District 6).
// Pure data, no imports (so cast.js may import it without pulling in any art).
//
//   GARDEN_FOLK   cast entries in cast.js's own shape ({ id, name, district, role, look }). They are NOT in cast.js
//                 yet: until cast.js adds them (SHARED NEED: `import { GARDEN_FOLK } from './world/regions/garden-folk.js'`
//                 and `CAST.push(...GARDEN_FOLK)` before its byId map is built), story.spawn() finds no look for these
//                 ids and the region simply spawns nobody for them (world/index.js skips a failed spawn).
//   FOLK_PEOPLE   region PEOPLE rows (regions/index.js format): where each one works, a hello that hints at the
//                 chapter's lesson and never at where to go, and a job (story.setJob) so they get on with their work.
//                 The garden's own story people (the tea uncle, Ko Kaung, Ma Pa Lae, Daw Mya Mya) are out at their work
//                 too, except on the days a day script places them itself (`off`: then their id reads `<id>@away`,
//                 which cast.js does not know, so the region leaves them to the day).
//
// Lessons (INDEX 14), the Garden's four chapters: 16 wanting to be alone comes from what life dealt, nothing stays the
// same, a gate opens in its owner's time; 17 wealth won by wrong weighs on you, ease is looking the buyer in the face;
// 19 trouble comes uninvited and to everyone, how I take it is mine; 20 catch the first rattle, patience is proved
// under test, a wrong that cheats the next buyer goes as checked facts through the proper door.
// Names are invented; every Burmese line is a draft for Maya.

const P = (id, my, en, roleMy, roleEn, look, more = {}) => ({ id, name: { my, en }, district: 'garden', role: { my: roleMy, en: roleEn }, look, ...more });

export const GARDEN_FOLK = [
  P('gnwe', 'ဒေါ်နွယ်နွယ်', 'Daw Nwe Nwe', 'ပျိုးပင် ရေလောင်းသူ', 'waters the seedlings',
    { age: 'adult', build: 'mid', skin: 3, hair: 'bun', top: 'blouse', topColor: 'leaf', bottom: 'htamein', bottomColor: 'plum', extras: ['thanaka', 'towel'], extraColor: 'cream' }),
  P('gsoe', 'ကိုသန့်ဇင်', 'Ko Thant Zin', 'ပျားမွေးသူ', 'beekeeper',
    { age: 'adult', build: 'slim', skin: 4, hair: 'cap', top: 'shirt', topColor: 'mustard', bottom: 'longyi', bottomColor: 'brown', check: true, extras: ['towel'], extraColor: 'white' }),
  P('gmyo', 'မမျိုး', 'Ma Myo', 'အဝတ်လှန်းသူ', 'hangs out the washing',
    { age: 'adult', build: 'slim', skin: 2, hair: 'long', top: 'blouse', topColor: 'rose', bottom: 'htamein', bottomColor: 'teal', extras: ['thanaka', 'flower'] }),
  P('gtun', 'ဦးထွန်းအောင်', 'U Tun Aung', 'ပျိုးခင်း စောင့်', 'keeps the shade nursery',
    { age: 'elder', build: 'mid', skin: 5, hair: 'short', hairColor: 'grey', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'olive', check: true, extras: ['glasses', 'apron'], extraColor: 'tan' }),
  P('gkhin', 'ဒေါ်ခင်လေး', 'Daw Khin Lay', 'ငရုတ်သီး ရောင်းသူ', 'sells chillies',
    { age: 'elder', build: 'wide', skin: 3, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'sky', bottom: 'htamein', bottomColor: 'maroon', extras: ['thanaka'] }),
  P('gpaing', 'ပိုင်', 'Paing', 'ကြက်ကျွေးတဲ့ ကလေး', 'feeds the hens',
    { age: 'child', build: 'slim', skin: 4, hair: 'spiky', top: 'tee', topColor: 'coral', bottom: 'shorts', bottomColor: 'navy' }, { years: 10 }),
  P('gzin', 'ကိုဇင်', 'Ko Zin', 'လှည်းတွန်းသူ', 'pushes the pot cart',
    { age: 'adult', build: 'wide', skin: 6, hair: 'short', top: 'tee', topColor: 'olive', bottom: 'longyi', bottomColor: 'charcoal', check: true, extras: ['towel'], extraColor: 'rose' }),
  P('gthida', 'မစုလှိုင်', 'Ma Su Hlaing', 'ကြာကန် ရှင်းသူ', 'clears the lily pond',
    { age: 'teen', build: 'slim', skin: 1, hair: 'braid', top: 'blouse', topColor: 'white', bottom: 'htamein', bottomColor: 'leaf', extras: ['thanaka'] }, { years: 16 }),
  P('gmaung', 'ဦးမောင်မောင်', 'U Maung Maung', 'ဒိုင်ယာရီ ရေးသူ အဘိုး', 'an old man who keeps a diary',
    { age: 'elder', build: 'slim', skin: 2, hair: 'side', hairColor: 'white', top: 'eingyi', topColor: 'cream', bottom: 'longyi', bottomColor: 'navy', extras: ['glasses', 'pencil'] }),
  P('gyin', 'ယဉ်ယဉ်', 'Yin Yin', 'ကြိုးခုန်တဲ့ ကလေး', 'skips rope',
    { age: 'child', build: 'slim', skin: 2, hair: 'bob', top: 'tee', topColor: 'mustard', bottom: 'htamein', bottomColor: 'rose', extras: ['thanaka'] }, { years: 8 }),
  P('ghla', 'ဒေါ်သန်းသန်း', 'Daw Than Than', 'ဟင်းသီးဟင်းရွက် ရောင်းသူ', 'sells vegetables at the kerb',
    { age: 'adult', build: 'wide', skin: 4, hair: 'bun', top: 'blouse', topColor: 'teal', bottom: 'htamein', bottomColor: 'mustard', extras: ['thanaka', 'towel'], extraColor: 'white' }),
  P('gaye', 'ဦးအေး', 'U Aye', 'ရေအိုး ဖြည့်သူ', 'keeps the drinking-water pots filled',
    { age: 'elder', build: 'slim', skin: 5, hair: 'short', hairColor: 'grey', top: 'shirt', topColor: 'white', bottom: 'longyi', bottomColor: 'teal', check: true, extras: ['towel'], extraColor: 'rose' }),
  P('gwin', 'ကိုဝင်း', 'Ko Win', 'ခြံစည်းရိုး ပြင်သူ', 'mends the bean-field fence',
    { age: 'adult', build: 'mid', skin: 5, hair: 'cap', top: 'vest', topColor: 'sky', bottom: 'longyi', bottomColor: 'olive', check: true, extras: ['towel'], extraColor: 'cream' }),
  P('gsu', 'စုစု', 'Su Su', 'အစေ့ ရွေးသူ', 'sorts seed on a mat',
    { age: 'teen', build: 'slim', skin: 3, hair: 'long', top: 'blouse', topColor: 'mustard', bottom: 'htamein', bottomColor: 'navy', extras: ['thanaka'] }, { years: 14 }),
  P('gnyunt', 'ကိုညွန့်', 'Ko Nyunt', 'ပစ္စည်း ပို့သူ', 'a delivery man waiting at a gate',
    { age: 'adult', build: 'slim', skin: 2, hair: 'short', top: 'shirt', topColor: 'coral', bottom: 'longyi', bottomColor: 'navy', check: true, extras: ['satchel'], extraColor: 'brown' }),
];

const job = (x, z, h, mood = 'work', r = 1.0, workFor = [8, 16], extra = {}) => ({ area: { x, z, r }, spot: { x, z, h }, mood, workChance: 0.8, workFor, ...extra });

function today() {
  try { const d = globalThis.__story?.save?.day; if (d) return d; } catch { /* not yet */ }
  try { return JSON.parse(globalThis.localStorage?.getItem('rc-story-v1') || 'null')?.day || 0; } catch { return 0; }
}
/** A story person out at their work, except on the days a day script places them (`off`). */
function folk(id, off, x, z, heading, hello, jb) {
  return { get id() { return off.includes(today()) ? `${id}@away` : id; }, x, z, heading, hello, job: jb };
}
const HP = Math.PI / 2;

/** Where they work (world metres; heading 0 faces +Z, the street camera). See regions/garden.js for the places. */
export const FOLK_PEOPLE = [
  // ---- the kiln square
  folk('teauncle', [10, 12], 224.2, 97.2, 0.4,
    { my: 'လက်ဖက်ရည်ကို အချိုလျှော့ပြီး ဈေးနှုန်းအတိုင်း ရောင်းလို့ ရတယ်။ ဒါပေမဲ့ နောက်နေ့ ဖောက်သည် မျက်နှာကို ဘယ်လို ကြည့်မလဲ။', en: 'I could make the tea thinner and keep the price. But how would I look my regulars in the face tomorrow?' },
    job(224.2, 97.2, 0.4, 'work', 0.9)),
  folk('kaung', [10, 12], 207.0, 92.6, 0.3,
    { my: 'မီးဖိုထဲက အိုးကို စောစော ထုတ်ရင် အက်တယ်။ စောင့်ရတာ ပင်ပန်းတယ်၊ ဒါပေမဲ့ အိုးက ကျေးဇူးတင်တယ်။', en: 'Take a pot out of the kiln too early and it cracks. Waiting is hard work, but the pot thanks you for it.' },
    job(207.0, 92.6, 0.3, 'work', 0.9)),
  folk('palae', [10, 12, 15], 191.6, 95.2, 0,
    { my: 'အိုး တစ်လုံး အက်နေရင် ဝယ်သူကို ပြောရတယ်။ နှုတ်ပိတ်နေရင် နောက်တစ်ယောက်ရဲ့ လက်ထဲ ရောက်သွားမှာ။', en: "If a pot is cracked, I tell the buyer. Keep quiet and it ends up in the next person's hands." },
    job(191.6, 95.2, 0, 'work', 0.8)),
  folk('myamya', [12], 219.2, 91.0, 0.2,
    { my: 'တိုင်ချင်ရင် စိတ်ဆိုးတာကို အိမ်မှာ ထားခဲ့။ ကိုယ်တိုင် ချိန်ကြည့်ထားတဲ့ ကိန်းဂဏန်းကိုပဲ ယူလာ။', en: 'If you have a complaint, leave the anger at home. Bring the weights you checked yourself.' },
    job(219.2, 91.0, 0.2, 'read', 0.8)),
  { id: 'gkhin', x: 186.2, z: 103.3, heading: Math.PI, job: job(186.2, 103.3, Math.PI, 'work', 0.6),
    hello: { my: 'ချိန်ခွင်ကို လက်ညှိုးနဲ့ မဖိဘူး။ မနက်ဖြန်လည်း ဒီလူပဲ ပြန်လာဝယ်မှာကိုး။', en: 'I never rest a finger on the scale. The same people come back tomorrow.' } },
  { id: 'gzin', x: 195.4, z: 102.5, heading: HP, job: job(195.4, 102.5, HP, 'work', 1.2),
    hello: { my: 'ဘီးက ပထမဆုံး တကျွီကျွီ မြည်တာနဲ့ ဆီထည့်တယ်။ လမ်းတဝက်မှာ ကျိုးမှ ပြင်ရင် နောက်ကျပြီ။', en: 'The first time a wheel squeaks, I oil it. Mend it when it breaks halfway down the lane and you are too late.' } },
  // ---- the plots and the lane
  { id: 'gtun', x: 158.6, z: 92.0, heading: 0, job: job(158.6, 92.0, 0, 'work', 1.2),
    hello: { my: 'ပျိုးပင်ကို နေပူထဲ တစ်ပတ်လောက် ထားကြည့်။ အရိပ်ထဲမှာ ကောင်းနေတာနဲ့ ခံနိုင်တာ မတူဘူး။', en: 'Put a seedling out in the sun for a week. Doing well in the shade is not the same as holding up.' } },
  { id: 'gnwe', x: 203.4, z: 124.6, heading: HP, job: job(203.4, 124.6, HP, 'work', 1.0),
    hello: { my: 'မိုးက ခြံတိုင်းကို ရွာတာပဲ။ ကျွန်မခြံကို ရွေးရွာတာ မဟုတ်ဘူး။ ရေမြောင်း တူးထားရင် ပြီးတာပဲ။', en: "Rain falls on every plot. It didn't pick mine. I just dig the channel." } },
  { id: 'gmyo', x: 233.6, z: 108.6, heading: Math.PI, job: job(233.6, 108.6, Math.PI, 'work', 1.2),
    hello: { my: 'ညက လေတိုက်လို့ အဝတ်တွေ ရွှံ့ထဲ ကျကုန်တယ်။ ပြန်လျှော်ရုံပေါ့။ လေကို ဆူလို့ မရဘူး။', en: "Last night the wind blew the washing into the mud. So I wash it again. You can't scold the wind." } },
  { id: 'gsoe', x: 263.6, z: 110.8, heading: -HP, job: job(263.6, 110.8, -HP, 'work', 0.9),
    hello: { my: 'ပျားအုံကို အတင်း မဖွင့်ရဘူး။ သူတို့ အဆင်သင့် ဖြစ်တော့ သူ့ဟာသူ ထွက်လာတာ။', en: "You don't force a hive open. When they are ready, they come out on their own." } },
  { id: 'gpaing', x: 178.6, z: 116.4, heading: -HP, job: job(178.6, 116.4, -HP, 'play', 1.4, [5, 10], { speed: 1.1 }),
    hello: { my: 'ဒီကြက်မက ဥ ဝပ်နေတာ။ တစ်ကောင်တည်း နေချင်နေတာ။ ဒါကြောင့် ဝေးဝေးကနေ ကျွေးတယ်။', en: "This hen is sitting on her eggs. She wants to be left alone. So I feed her from over here." } },
  { id: 'gyin', x: 168.2, z: 112.0, heading: HP, job: job(168.2, 112.0, HP, 'play', 1.0, [5, 10], { speed: 1.2 }),
    hello: { my: 'ငါးဆယ်ခါ ပြည့်မှ စကားပြောမယ်… ကြိုးငြိသွားပြီ။ ကိစ္စမရှိဘူး၊ အစက ပြန်စမယ်။', en: "I'll talk when I get to fifty… Tripped. Never mind, start again from one." } },
  { id: 'gthida', x: 160.6, z: 74.6, heading: 0, job: job(160.6, 74.6, 0, 'work', 1.4),
    hello: { my: 'ကန်ထဲကို အရွက်ကြွေတာ ကန်ရဲ့ အပြစ် မဟုတ်ဘူး။ ကောက်ထုတ်ပေးရုံပဲ။', en: "Leaves falling in the pond aren't the pond's fault. You just lift them out." } },
  { id: 'gmaung', x: 157.2, z: 75.3, heading: Math.PI, job: job(157.2, 75.3, Math.PI, 'read', 0.6, [10, 20]),
    hello: { my: 'ဒီ ဒိုင်ယာရီထဲက နေ့တွေ တစ်နေ့နဲ့ တစ်နေ့ မတူဘူး။ ခြံလည်း ဒီလိုပဲ။ ဒါကြောင့် ရေးထားတာ။', en: 'Not one day in this diary is like another. Nor is the garden. That is why I write it down.' } },
  // ---- street life (garden-life.js): the kerb table, the water stand, the bean field, a yard, a gate
  { id: 'ghla', x: 216.6, z: 102.8, heading: 0, job: job(216.6, 102.8, 0, 'work', 0.5),
    hello: { my: 'အလေးချိန် မှန်မှန် ပေးရင် ညကျ အိပ်လို့ ပျော်တယ်။ ပိုရတဲ့ ပိုက်ဆံ နည်းနည်းထက် အဲဒါ ပိုတန်တယ်။', en: 'Give the true weight and you sleep well at night. That is worth more than a few extra coins.' } },
  { id: 'gaye', x: 138.1, z: 59.4, heading: -HP, job: job(138.1, 59.4, -HP, 'work', 0.8),
    hello: { my: 'ဒီလမ်းကို ဖြတ်တဲ့လူ ပြောင်းတယ်၊ ရာသီ ပြောင်းတယ်။ ဘာမှ အမြဲ မတည်ဘူး။ ငါကတော့ အိုးထဲ ရေ ဖြည့်ထားရုံပဲ။', en: 'The people on this road change, the seasons change. Nothing stays the same. I just keep the pots full.' } },
  { id: 'gwin', x: 144.3, z: 45.4, heading: HP, job: job(144.3, 45.4, HP, 'work', 0.9),
    hello: { my: 'မုန်တိုင်းက ဘယ်သူ့ ခြံစည်းရိုးကိုမှ ရွေးမတိုက်ဘူး။ ဒီမှာ ရပ်ပြီး စိတ်ဆိုးနေရင် ညနေထိ ပြင်လို့ မပြီးဘူး။', en: "The storm didn't pick whose fence to knock down. If I stand here angry, it won't be mended by evening." } },
  { id: 'gsu', x: 167.4, z: 125.4, heading: HP, job: job(167.4, 125.4, HP, 'work', 0.6),
    hello: { my: 'အစေ့ထဲမှာ ကျောက်စရစ် တစ်လုံး တွေ့ရင် အခုပဲ ဖယ်ရတယ်။ အိတ်ထဲ ရောက်မှ ရှာရင် ပိုခက်တယ်။', en: "Find one pebble in the seed and take it out now. Hunting for it once it's in the sack is harder." } },
  { id: 'gnyunt', x: 256.0, z: 128.6, heading: -HP, job: job(256.0, 128.6, -HP, 'read', 0.5),
    hello: { my: 'အိမ်ရှင် အိပ်နေသေးတယ်။ တံခါး ဆက်မခေါက်တော့ဘူး။ သူ့အချိန်ကျရင် ဖွင့်မှာပဲ။', en: "She's still asleep. I won't keep knocking. She'll open when she's ready." } },
];
