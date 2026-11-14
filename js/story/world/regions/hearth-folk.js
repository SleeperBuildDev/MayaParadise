// Hearth Row townsfolk: people who live along the south side of the Row and get on with their day in their front
// yards (District 5). Pure data, no imports (so cast.js may import it without pulling in any art).
//
//   HEARTH_FOLK  cast entries in cast.js's own shape ({ id, name, district, role, look }). They are NOT in cast.js
//                yet: until cast.js adds them (SHARED NEED: `import { HEARTH_FOLK } from './world/regions/hearth-folk.js'`
//                and `CAST.push(...HEARTH_FOLK)` before its byId map is built), story.spawn() finds no look for these
//                ids and the region simply spawns nobody (world/index.js skips a failed spawn).
//   FOLK_PEOPLE  region PEOPLE rows (regions/index.js format), merged into regions/hearth.js PEOPLE: where each one
//                works (beside the yard things in hearth-life.js), a hello that hints at one of the Row's chapters and
//                never at where to go, and a job (story.setJob) so they get on with it.
//
// Lessons (INDEX 14): ch 14 let nobody be unhappy because of you; ch 15 a good friend sees the trouble no eye sees
// and hears you out, like finds like; ch 18 picking up fire to throw burns you first, a cool clear mind; ch 21
// everyone has a touchy spot: know yours, and others can ask first. Names are invented and screened against the
// INDEX 3 list (no Naing, Win, Zaw, Khaing, Htet, Thazin, Myo, Tun, Hein, no "Ko Th-"); every Burmese line is a
// draft for Maya. Story people of the Row (Daw Khin May, Maung Arkar, Ei Mon, ...) belong to the day scripts.

const P = (id, my, en, roleMy, roleEn, look, more = {}) => ({ id, name: { my, en }, district: 'hearth', role: { my: roleMy, en: roleEn }, look, ...more });

export const HEARTH_FOLK = [
  P('hphyu', 'ဒေါ်ဖြူ', 'Daw Phyu', 'ငရုတ်သီး လှန်းသူ', 'dries chillies',
    { age: 'elder', build: 'mid', skin: 3, hair: 'bun', hairColor: 'white', top: 'blouse', topColor: 'white', bottom: 'htamein', bottomColor: 'maroon', extras: ['thanaka', 'towel'], extraColor: 'cream' }),
  P('hkyal', 'ကိုကြယ်', 'Ko Kyal', 'စက်ဘီး ပြင်သူ', 'mends bicycles',
    { age: 'adult', build: 'slim', skin: 4, hair: 'short', top: 'tee', topColor: 'navy', bottom: 'longyi', bottomColor: 'brown', check: true, extras: ['towel'], extraColor: 'grey' }),
  P('hngwe', 'မငွေ', 'Ma Ngwe', 'အဝတ်လျှော်သူ', 'washing day',
    { age: 'adult', build: 'mid', skin: 2, hair: 'long', top: 'blouse', topColor: 'sky', bottom: 'htamein', bottomColor: 'leaf', extras: ['thanaka'] }),
  P('hupe', 'ဦးဖေ', 'U Pe', 'လက်ဖက်ရည်ဝိုင်းက အဘိုး', 'the old man at the tea corner',
    { age: 'elder', build: 'slim', skin: 3, hair: 'bald', hairColor: 'grey', top: 'eingyi', topColor: 'cream', bottom: 'longyi', bottomColor: 'teal', check: true, extras: ['glasses'] }),
  P('hyoon', 'ယွန်းယွန်း', 'Yoon Yoon', 'ဂေါ်လီ ကစားတဲ့ ကလေး', 'plays marbles',
    { age: 'child', build: 'slim', skin: 2, hair: 'braid', top: 'tee', topColor: 'coral', bottom: 'htamein', bottomColor: 'navy', extras: ['thanaka'] }, { years: 9 }),
  P('hwai', 'ကိုဝေ', 'Ko Wai', 'ဟင်းသီးဟင်းရွက် လှည်းသမား', 'greens cart',
    { age: 'adult', build: 'wide', skin: 4, hair: 'cap', top: 'vest', topColor: 'olive', bottom: 'longyi', bottomColor: 'charcoal', check: true, extras: ['towel'], extraColor: 'rose' }),
  P('hlone', 'မလုံး', 'Ma Lone', 'အိမ်ရှေ့ တံမြက်လှည်းသူ', 'sweeps the step',
    { age: 'teen', build: 'slim', skin: 1, hair: 'bob', top: 'blouse', topColor: 'mustard', bottom: 'htamein', bottomColor: 'plum', extras: ['thanaka'] }),
  P('hkyu', 'ဒေါ်ကြူ', 'Daw Kyu', 'ရေအိုးစင် ဖြည့်သူ', 'keeps the water pots filled',
    { age: 'elder', build: 'wide', skin: 3, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'grey', bottom: 'htamein', bottomColor: 'brown', extras: ['thanaka', 'apron'] }),
];

const HP = Math.PI / 2;
const job = (x, z, h, mood = 'work', r = 0.9, workFor = [8, 16]) => ({ area: { x, z, r }, spot: { x, z, h }, mood, workChance: 0.8, workFor });

/** heading 0 faces +Z (toward the follow camera), PI faces the Row. Spots stand beside the hearth-life.js things. */
export const FOLK_PEOPLE = [
  { id: 'hphyu', x: 171.3, z: 205.9, heading: 0,
    hello: { my: 'ငရုတ်သီးကို ဆုပ်ပြီး တစ်ယောက်ယောက်ကို ပစ်ရင် အရင်ဆုံး ပူတာ ကိုယ့်လက်ပဲ။', en: 'Grab a fistful of chillies to throw at someone, and the first hand that burns is yours.' },
    job: job(171.3, 205.9, 0, 'work', 0.8) },
  { id: 'hkyal', x: 188.4, z: 206.2, heading: 0,
    hello: { my: 'လေနည်းနည်းချင်း ယိုတဲ့ဘီးက အပြင်က မမြင်ရဘူး။ သူငယ်ချင်းကောင်းက မပြောခင် သတိထားမိတယ်။', en: "A slow leak doesn't show from outside. A good friend notices you're riding flat before you say a word." },
    job: job(188.4, 206.2, 0, 'work', 0.7) },
  { id: 'hngwe', x: 196.9, z: 206.1, heading: 0,
    hello: { my: 'ကြိုးကို ဒီဘက် ရွှေ့ချိတ်ထားတယ်။ ငါ့အဝတ်က ရေစက်တွေ ဘေးအိမ်က ထမင်းပေါ် မကျစေချင်လို့။', en: "I moved my line over this way. I don't want my drips landing on next door's rice." },
    job: job(196.9, 206.1, 0, 'work', 0.8) },
  { id: 'hupe', x: 221.2, z: 207.2, heading: HP,
    hello: { my: 'လက်ဖက်ရည်ဝိုင်းကို ကြည့်။ အတူထိုင်တဲ့သူတွေ စကားပြောပုံ တူလာတယ်။ ဝိုင်းကို ရွေးထိုင်ပေါ့။', en: 'Look round a tea table: people who sit together start to talk alike. Choose your table.' },
    job: job(221.2, 207.2, HP, 'read', 0.3) },
  { id: 'hyoon', x: 218.5, z: 206.3, heading: 0,
    hello: { my: 'ကျွန်မ ဂေါ်လီကို မကိုင်ခင် မေးပါနော်။ အဲဒါ ကျွန်မ အမုန်းဆုံးပဲ။ မေးရင်တော့ ပေးကိုင်မယ်။', en: "Ask before you touch my marbles. That's the thing I hate most. If you ask, you can hold one." },
    job: job(218.5, 206.3, 0, 'play', 1.2) },
  { id: 'hwai', x: 242.3, z: 206.3, heading: -HP,
    hello: { my: 'ဈေးသည်ချင်း ရန်ဖြစ်ရင် ညှိုးသွားတဲ့ ဟင်းရွက်ပဲ ကျန်တယ်။ ခေါင်းအေးမှ ရောင်းရတာ။', en: 'Vendors who quarrel are left with wilted greens. A cool head is what sells.' },
    job: job(242.3, 206.3, -HP, 'work', 0.8) },
  { id: 'hlone', x: 250.2, z: 206.0, heading: 0,
    hello: { my: 'ကိုယ့်အိမ်ရှေ့ပဲ လှည်းရင် အမှိုက်က ဘေးအိမ်ရှေ့ ရောက်သွားတာပဲ။ ဒါကြောင့် နည်းနည်း ကျော်လှည်းတယ်။', en: "Sweep only your own step and the dust ends up on your neighbour's. So I sweep a little past it." },
    job: job(250.2, 206.0, 0, 'work', 1.6) },
  { id: 'hkyu', x: 192.0, z: 205.8, heading: 0,
    hello: { my: 'ရေတစ်ခွက် သောက်ပြီး ခဏနားပါဦး။ ရင်ထဲမှာ တစ်ခုခု ရှိရင် ပြော၊ နားထောင်ပေးမယ်။', en: "Have a cup of water and rest a moment. If something's on your mind, say it. I'm listening." },
    job: job(192.0, 205.8, 0, 'work', 0.6) },
];
