// Envelope Market townsfolk: people who work the lanes, the kite field and the free-food corner (District 2).
// Pure data, no imports (so cast.js may import it without pulling in any art).
//
//   MARKET_FOLK  cast entries in cast.js's own shape ({ id, name, district, role, look }). They are NOT in cast.js
//                yet: until cast.js adds them (SHARED NEED: `import { MARKET_FOLK } from './world/regions/market-folk.js'`
//                and `CAST.push(...MARKET_FOLK)` before its byId map is built), story.spawn() finds no look for these
//                ids and the region simply spawns nobody (world/index.js skips a failed spawn). The lanes stay lived-in
//                anyway: the still `folk` figures in market.js are baked into the chunks.
//   FOLK_PEOPLE  region PEOPLE rows (regions/index.js format), merged into regions/market.js PEOPLE: where each one
//                works (beside a market.js thing), a hello that hints at one of the Market's chapters and never at
//                where to go, and a job (story.setJob) so they get on with it.
//
// Lessons (INDEX 14): ch 6 give with a clean, cool heart, and fill your own pot first; ch 7 goodwill does not burn,
// the love that burns clings; ch 10 when an equal pulls ahead, notice the hot thought and be glad; ch 11 the only one
// you can steer is yourself. Names are invented and screened against INDEX 3 and every cast/folk name in use (no
// Naing, Win, Zaw, Zeya, Oo, Tun, Khaing, Thazin, Myo, Htet, Hein). Every Burmese line is a draft for Maya.

const P = (id, my, en, roleMy, roleEn, look, more = {}) => ({ id, name: { my, en }, district: 'market', role: { my: roleMy, en: roleEn }, look, ...more });

export const MARKET_FOLK = [
  P('mbedar', 'ဒေါ်ဗေဒါ', 'Daw Bedar', 'သောက်ရေအိုး ဖြည့်သူ', 'keeps the drinking-water pots filled',
    { age: 'elder', build: 'mid', skin: 3, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'sky', bottom: 'htamein', bottomColor: 'brown', extras: ['thanaka', 'towel'], extraColor: 'cream' }),
  P('mbatin', 'ဦးဘတင်', 'U Ba Tin', 'စွန်ရောင်းသူ', 'sells kites at the field',
    { age: 'elder', build: 'slim', skin: 2, hair: 'bald', hairColor: 'grey', top: 'eingyi', topColor: 'white', bottom: 'longyi', bottomColor: 'teal', check: true, extras: ['glasses'] }),
  P('mnanda', 'မနန္ဒာ', 'Ma Nanda', 'စာအုပ်ဟောင်း ရောင်းသူ', 'old-book stall on Stamp Lane',
    { age: 'adult', build: 'slim', skin: 2, hair: 'long', top: 'blouse', topColor: 'mustard', bottom: 'htamein', bottomColor: 'plum', extras: ['thanaka'] }),
  P('mhsaing', 'ကိုဆိုင်း', 'Ko Hsaing', 'ကုန်ထမ်းသူ', 'porter on Rice Lane',
    { age: 'adult', build: 'wide', skin: 4, hair: 'short', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'navy', check: true, extras: ['towel'], extraColor: 'rose' }),
  P('mmar', 'ဒေါ်မာ', 'Daw Mar', 'စေတနာထမင်းဆိုင်ရှေ့ လှည်းသူ', 'sweeps in front of the free-food shop',
    { age: 'adult', build: 'mid', skin: 3, hair: 'bun', top: 'blouse', topColor: 'leaf', bottom: 'htamein', bottomColor: 'maroon', extras: ['apron'] }),
  P('mpekyi', 'ဦးဖေကြည်', 'U Pe Kyi', 'စက်ဘီးပြင်သူ', 'mends bicycles on the envelope road',
    { age: 'elder', build: 'slim', skin: 4, hair: 'short', hairColor: 'grey', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'brown', check: true, extras: ['towel'], extraColor: 'cream' }),
  P('mngwehla', 'ဒေါ်ငွေလှ', 'Daw Ngwe Hla', 'အိမ်ရှေ့ လှည်းသူ', 'sweeps her step south of the gardens',
    { age: 'adult', build: 'mid', skin: 3, hair: 'bun', top: 'blouse', topColor: 'rose', bottom: 'htamein', bottomColor: 'teal', extras: ['thanaka'] }),
  P('mhlashein', 'ဦးလှရှိန်', 'U Hla Shein', 'ပဲခင်း ရေလောင်းသူ', 'waters his beans in the left margin',
    { age: 'elder', build: 'mid', skin: 3, hair: 'bald', hairColor: 'grey', top: 'eingyi', topColor: 'cream', bottom: 'longyi', bottomColor: 'green', check: true, extras: ['glasses'] }),
  P('mkyipyar', 'မကြည်ပြာ', 'Ma Kyi Pyar', 'လက်ဖက်ရည် ဖျော်သူ', 'keeps the little tea shop on the letter’s bottom edge',
    { age: 'adult', build: 'slim', skin: 2, hair: 'long', top: 'blouse', topColor: 'mustard', bottom: 'htamein', bottomColor: 'maroon', extras: ['apron'] }),

];

const job = (x, z, h, mood = 'work', r = 0.9, workFor = [8, 16]) => ({ area: { x, z, r }, spot: { x, z, h }, mood, workChance: 0.8, workFor });

/** heading 0 faces +Z (toward the follow camera). Each spot stands beside the thing that person works with. */
export const FOLK_PEOPLE = [
  // by the drinking-water pots at the crease (market.js: waterPots -9.0, 263.0)   ch 6: fill your own pot first
  { id: 'mbedar', x: -7.5, z: 263.9, heading: 0,
    hello: { my: 'မနက်တိုင်း အိမ်က ရေအိုးကို အရင်ဖြည့်တယ်။ ကိုယ့်အိုး ခြောက်နေရင် ဘယ်သူ့ကိုမှ ငှဲ့မပေးနိုင်ဘူးလေ။', en: "Every morning I fill the pot at home first. If your own pot is dry, you can't pour for anyone." },
    job: job(-7.5, 263.9, 0, 'work', 0.8) },
  // at the kite racks on the field (market.js: kiteRack -46.0, 306.6)   ch 7: goodwill does not cling
  { id: 'mbatin', x: -44.3, z: 307.6, heading: 0,
    hello: { my: 'စွန်ကြိုးကို တင်းတင်း ဆုပ်ထားရင် ပြတ်တယ်။ လျှော့ပေးမှ စွန်က လွတ်လွတ်လပ်လပ် တက်တာ။', en: 'Grip a kite string too tight and it snaps. Let it out, and the kite climbs on its own.' },
    job: job(-44.3, 307.6, 0, 'work', 1.0) },
  // behind the old-book stall on Stamp Lane (market.js north stall -36.0 'books')   ch 10: be glad when an equal pulls ahead
  { id: 'mnanda', x: -35.6, z: 268.75, heading: 0,
    hello: { my: 'ဘေးဆိုင်က မွန်းတည့်ကတည်းက ကုန်သွားပြီ။ ရင်ထဲ ခဏ ပူသွားတယ်။ ပြီးတော့ ဝမ်းသာလိုက်တယ်၊ လမ်းကြီး စည်လာတာပဲ။', en: 'The stall next door sold out by noon. I felt a flash of heat. Then I let myself be glad: it brings the lane to life.' },
    job: job(-35.6, 268.75, 0, 'work', 0.5) },
  // by the crates on Rice Lane's south side (market.js: crates 18.6, 337.0)   ch 11: steer yourself
  { id: 'mhsaing', x: 17.1, z: 338.4, heading: 0,
    hello: { my: 'အိတ်တွေ ဘယ်လောက် လေးမလဲ ကိုယ် မရွေးရဘူး။ ဘယ်လို မမလဲ ဆိုတာပဲ ကိုယ် ရွေးရတာ။', en: "I don't get to choose how heavy the sacks are. Only how I lift them." },
    job: job(17.1, 338.4, 0, 'work', 1.2) },
  // in front of Daw Yi's free-food shop (market.js: riceShop 34.2, 328.15)   ch 6: give with a clean, cool heart
  { id: 'mmar', x: 28.4, z: 332.6, heading: 0,
    hello: { my: 'ပေးပြီးရင် မေ့လိုက်တယ်။ ပြန်ရေတွက်နေရင် ပေးတုန်းက အေးတဲ့စိတ် ပူလာတတ်လို့။', en: 'Once I give, I forget it. Count it up afterwards and the cool heart you gave with starts to burn.' },
    job: job(28.4, 332.6, 0, 'sweep', 1.4) },
  // beside his wheel stand on the envelope road (market-fill.js: bikeFix 17.2, 222.8)   ch 11: steer yourself
  { id: 'mpekyi', x: 15.6, z: 223.9, heading: 0.4,
    hello: { my: 'လမ်းပေါ်က ချိုင့်တွေကို ကိုယ် မရွေးရဘူး။ မထွက်ခင် ကိုယ့်ဘီး လေထိုးထားဖို့ပဲ ကိုယ် ရွေးရတာ။', en: "I don't get to pick the potholes on the road. I pick to pump up my own tyres before I set off." },
    job: job(15.6, 223.9, 0.4, 'work', 0.7) },
  // on the step of her house south of the market gardens (market-fill.js: mkCot -46.5, 353.0)   ch 7: let go
  { id: 'mngwehla', x: -44.2, z: 356.6, heading: 0,
    hello: { my: 'သားက မနက်စောစော ဆိပ်ကမ်းကို ထွက်သွားပြီ။ အရင်က လမ်းဆုံးအထိ လက်ဆွဲ လိုက်ပို့တယ်။ အခု အိမ်ရှေ့ကပဲ လက်ပြတယ်။ သူ့ခြေထောက်နဲ့ သူ လျှောက်တာ ပိုမြဲတယ်။', en: 'My son left for the Wharf at first light. I used to hold his hand all the way there. Now I wave from the step. He walks steadier on his own feet.' },
    job: job(-44.2, 356.6, 0, 'sweep', 1.0) },
  // at the bean rows by his stilt house in the left margin (market-fill.js: mkCot -63.5, 315.5)   ch 10: be glad
  { id: 'mhlashein', x: -60.4, z: 319.4, heading: -0.3,
    hello: { my: 'ဘေးအိမ်က ပဲပင်တွေ အရင် ပေါက်တယ်။ ခဏလေး ရင်ထဲ ချဉ်သွားတယ်။ ပြီးတော့ သွားမေးလိုက်တယ်၊ ဘယ်လို စိုက်လဲလို့။', en: "My neighbour's beans came up first. For a breath it soured me. Then I went over and asked him how he sowed them." },
    job: job(-60.4, 319.4, -0.3, 'work', 1.0) },
  // in front of her tea shop at the letter's bottom edge (market-fill.js: mkCot 14.2, 375.3)   ch 6: fill your own pot first
  { id: 'mkyipyar', x: 12.6, z: 378.6, heading: 0,
    hello: { my: 'မိုးရွာရွာ နေပူပူ ရာသီဥတုကို ကိုယ် မရွေးနိုင်ဘူး။ မနက် ခြောက်နာရီ ရေနွေးအိုး တည်ထားဖို့ပဲ ကိုယ် ရွေးတယ်။', en: "Rain or sun, I can't choose the weather. I choose to have the kettle on by six." },
    job: job(12.6, 378.6, 0, 'work', 0.8) },

];
