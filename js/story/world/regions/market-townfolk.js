// Envelope Market townsfolk added by the town pass (market-town.js): cast entries and their hellos.
// Pure data, no imports (so cast.js may import it without pulling in any art), like market-folk.js.
//   TOWN_FOLK   cast entries in cast.js's own shape. NOT in cast.js yet (SHARED NEED: `import { TOWN_FOLK } from
//               './world/regions/market-townfolk.js'` and `CAST.push(...TOWN_FOLK)` before its byId map is built);
//               until then story.spawn() finds no look for these ids and the region simply spawns nobody.
//   TOWN_HELLO  their hellos (market-town.js puts each one beside the thing they work with).
// Names are invented and screened against INDEX 3 and every cast/folk name in use. Every Burmese line is a draft for Maya.

// Lessons (INDEX 14): ch 6 fill your own pot first and give with a cool heart; ch 7 goodwill does not cling;
// ch 10 be glad when an equal pulls ahead; ch 11 the only one you can steer is yourself. Never a word about where to go.
const P = (id, my, en, roleMy, roleEn, look) => ({ id, name: { my, en }, district: 'market', role: { my: roleMy, en: roleEn }, look });
export const TOWN_FOLK = [
  P('mpauksi', 'ကိုပေါက်စီ', 'Ko Pauk Si', 'ဆံပင်ညှပ်သူ', 'the barber, by his shophouse',
    { age: 'adult', build: 'slim', skin: 3, hair: 'short', top: 'shirt', topColor: 'white', bottom: 'longyi', bottomColor: 'navy', check: true }),
  P('mohnmar', 'မအုန်းမာ', 'Ma Ohnmar', 'အပ်ချုပ်သူ', 'the tailor, by her shophouse',
    { age: 'adult', build: 'mid', skin: 2, hair: 'bun', top: 'blouse', topColor: 'rose', bottom: 'htamein', bottomColor: 'teal', extras: ['thanaka'] }),
  P('mthawda', 'ဒေါ်သော်တာ', 'Daw Thawda', 'အိမ်ရှေ့ လှည်းသူ', 'sweeps her front step',
    { age: 'elder', build: 'mid', skin: 3, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'cream', bottom: 'htamein', bottomColor: 'maroon', extras: ['towel'], extraColor: 'sky' }),
  P('mlaylay', 'မောင်လေးလေး', 'Maung Lay Lay', 'ကွင်းလှိမ့်တဲ့ ကလေး', 'a boy with a hoop',
    { age: 'child', build: 'slim', skin: 3, hair: 'short', top: 'tee', topColor: 'mustard', bottom: 'shorts', bottomColor: 'navy' }),
  P('uaungba', 'ဦးအောင်ဘ', 'U Aung Ba', 'ဝါးထရံ ယက်သူ', 'weaves bamboo walls in the margin hamlet',
    { age: 'elder', build: 'wide', skin: 4, hair: 'short', hairColor: 'grey', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'brown', check: true, extras: ['towel'], extraColor: 'cream' }),
];
export const TOWN_HELLO = {
  mpauksi: { my: 'လမ်းထိပ်မှာ ဆံပင်ညှပ်ဆိုင် အသစ် ဖွင့်တော့ ရင်ထဲ ပူသွားတယ်။ ပြီးတော့ သူ သင်တုန်းဓား ကိုင်ပုံ ကြည့်ပြီး တစ်ခု သင်ယူလိုက်တယ်။', en: 'A new barber opened at the top of the lane and I felt the heat. Then I watched how he holds the razor, and learnt something.' },
  mohnmar: { my: 'ဖောက်သည် စိတ်ရှည်အောင် ကိုယ် လုပ်ပေးလို့ မရဘူး။ ကိုယ့်ချုပ်ရိုး ဖြောင့်အောင်ပဲ ကိုယ် လုပ်နိုင်တာ။', en: "I can't make a customer patient. I can only make my own seams straight." },
  mthawda: { my: 'ကိုယ့်အိမ်ရှေ့ကို အရင် လှည်းတယ်။ ပြီးမှ လမ်းကို ဆက်လှည်းတယ်။ ဘယ်သူမှ ကျေးဇူးတင်စရာ မလိုပါဘူး။', en: 'I sweep my own step first, then on along the lane. Nobody needs to thank me for it.' },
  mlaylay: { my: 'ကျွန်တော့် ကွင်းကို ကိုကို့ ငှားလိုက်တယ်။ သူ ဘယ်လို လှိမ့်လဲ နောက်က လိုက်မကြည့်တော့ဘူး။', en: "I lent my hoop to Ko Ko. I didn't follow him round to see how he rolls it." },
  uaungba: { my: 'ဘေးအိမ်ရဲ့ ဝါးထရံက ငါ့ဟာထက် ဖြောင့်တယ်။ ကောင်းတာပေါ့၊ ဖြောင့်အောင် ယက်လို့ရတယ် ဆိုတာ သိသွားပြီ။', en: "My neighbour's bamboo wall came out straighter than mine. Good. Now I know it can be done." },
};

