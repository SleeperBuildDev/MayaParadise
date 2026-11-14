// The townspeople of Paper Town (all invented). One list for every day (days/INDEX.md section 3):
// same person = same id, same name, same Burmese. Names and Burmese wording are drafts for Maya.
//
//   CAST                     [{ id, name: { my, en }, district, role: { my, en }, age?, look, offstage? }]
//   castById(id)             the entry (old ids from before the continuity pass still resolve: ALIASES)
//   castIn(district)         everyone who lives in a district
//   DISTRICTS                district id -> { my, en }
//
// look: a people.js SPEC (age, build, skin 0..4, hair, hairColor, top, topColor, bottom, bottomColor,
// check, sleeves, extras, extraColor). Everyday Myanmar clothes: longyi / htamein, eingyi, blouses, school
// whites and greens; thanaka, flowers, gaungbaung kept for the occasions people would really wear them.

export const DISTRICTS = {
  home: { my: 'အိမ်စာအုပ်', en: 'Home Book' },
  exercise: { my: 'ဗလာစာအုပ်ရပ်', en: 'Exercise-Book Quarter' },
  market: { my: 'စာအိတ်ဈေး', en: 'Envelope Market' },
  wharf: { my: 'စာရင်းဆိပ်ကမ်း', en: 'Ledger Wharf' },
  junction: { my: 'သတင်းစာ လမ်းဆုံ', en: 'Newsprint Junction' },
  hearth: { my: 'မီးဖိုတန်း', en: 'Hearth Row' },
  garden: { my: 'ဒိုင်ယာရီ ဥယျာဉ်', en: 'Diary Garden' },
  blank: { my: 'ဗလာစာမျက်နှာ', en: 'the Blank Page' },
};

const P = (id, my, en, district, role, look, more = {}) => ({ id, name: { my, en }, district, role, look, ...more });
const R = (my, en) => ({ my, en });

export const CAST = [
  // ---- Home Book
  P('phothar', 'ဖိုးသား', 'Pho Thar', 'home', R('ဆိုင်းဘုတ်ဆရာရဲ့ သားလေး၊ လေရဟတ်လုပ်သူ', "the sign-letterer's boy, windmill maker"),
    { age: 'child', skin: 2, hair: 'spiky', top: 'tee', topColor: 'mustard', bottom: 'shorts', bottomColor: 'navy' }, { years: 11 }),
  P('ukyaw', 'ဦးကျော်ညွန့်', 'U Kyaw Nyunt', 'home', R('စာအုပ်ကျောရိုး ချုပ်သူ', 'binding stitcher'),
    { age: 'elder', build: 'mid', skin: 7, hair: 'side', hairColor: 'grey', top: 'shirt', topColor: 'cream', bottom: 'longyi', bottomColor: 'teal', extras: ['apron', 'glasses'] }),
  P('wintwar', 'မဝင့်ဝါ', 'Ma Wint War', 'home', R('စာပို့သူ', 'the postwoman'),
    { age: 'adult', build: 'slim', skin: 1, hair: 'bun', top: 'blouse', topColor: 'maroon', bottom: 'htamein', bottomColor: 'mustard', extras: ['thanaka', 'satchel', 'flower'], extraColor: 'tan' }),
  P('naychi', 'နေခြည်', 'Nay Chi', 'home', R('စာခွဲခန်းက ကူညီသူ၊ နောက်တော့ ရွှေမင်ပုံနှိပ်တိုက်', 'helps in the sorting room; later the Gold Ink Press'),
    { age: 'teen', build: 'slim', skin: 1, hair: 'long', top: 'blouse', topColor: 'sky', bottom: 'htamein', bottomColor: 'plum', extras: ['thanaka'] }, { years: 17 }),

  // ---- Exercise-Book Quarter
  P('toetoe', 'တိုးတိုး', 'Toe Toe', 'exercise', R('ခြောက်တန်း ကျောင်းသား', 'grade-6 pupil'),
    { age: 'child', skin: 2, hair: 'short', top: 'school', bottom: 'schoolLongyi', extras: ['satchel'], extraColor: 'brown' }, { years: 12 }),
  P('hninwai', 'ဒေါ်နှင်းဝေ', 'Daw Hnin Wai', 'exercise', R('ခြောက်တန်း ဆရာမ', 'grade-6 teacher'),
    { age: 'adult', skin: 0, hair: 'bun', top: 'blouse', topColor: 'white', bottom: 'htamein', bottomColor: 'schoolGreen', extras: ['glasses'] }),
  P('yeyint', 'ရဲယဉ့်', 'Ye Yint', 'exercise', R('ပြဇာတ်က ကျောင်းသား', 'the boy in the school play'),
    { age: 'teen', skin: 8, hair: 'side', top: 'school', bottom: 'schoolLongyi' }, { years: 16 }),
  P('dawohn', 'ဒေါ်အုန်း', 'Daw Ohn', 'exercise', R('အိုးထိန်းဆရာမ', 'the potter'),
    { age: 'elder', build: 'wide', skin: 3, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'coral', bottom: 'htamein', bottomColor: 'brown', extras: ['apron', 'thanaka'] }),
  P('micho', 'မိချို', 'Mi Cho', 'exercise', R('ဒေါ်အုန်းရဲ့ အိုးလုပ် တပည့်', "Daw Ohn's apprentice"),
    { age: 'teen', skin: 5, hair: 'braid', top: 'tee', topColor: 'leaf', bottom: 'htamein', bottomColor: 'navy', extras: ['thanaka'], extraColor: 'rose' }),
  P('sunwe', 'စုနွယ်', 'Su Nwe', 'exercise', R('အတန်းထိပ်က ကျောင်းသူ', 'top of the class'),
    { age: 'teen', build: 'slim', skin: 6, hair: 'bob', top: 'school', bottom: 'schoolSkirt', extras: ['glasses'] }, { years: 15 }),
  P('maungnge', 'မောင်ငယ်', 'Maung Nge', 'exercise', R('ပါဆယ်လှည်း တွန်းသူ', 'pushes the parcel cart'),
    { age: 'child', build: 'slim', skin: 4, hair: 'cap', top: 'tee', topColor: 'grey', bottom: 'shorts', bottomColor: 'brown', extraColor: 'coral' }, { years: 13 }),
  // the Quarter's neighbours at their daily work (ambient: a hello only, never in a day's story)
  P('dawmyint', 'ဒေါ်မြင့်', 'Daw Myint', 'exercise', R('အဝတ်လျှော်ပြီး လှန်းနေတဲ့ အဒေါ်', 'the aunty hanging out the washing'),
    { age: 'adult', build: 'wide', skin: 6, hair: 'bun', top: 'blouse', topColor: 'sky', bottom: 'htamein', bottomColor: 'plum', pattern: 'acheik', patternColor: 'mustard', extras: ['thanaka', 'towel'], face: 'round', eyes: 'almond' }, { ambient: true }),
  P('ukhin', 'ဦးခင်', 'U Khin', 'exercise', R('စက်ဘီး ပြင်ဆရာ', 'the bicycle mender'),
    { age: 'elder', build: 'slim', skin: 7, hair: 'receding', hairColor: 'salt', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'brown', pattern: 'check', extras: ['glasses', 'moustache'], glassesStyle: 'half', face: 'long', height: 1.05 }, { ambient: true }),
  P('kozaw', 'ကိုဇော်', 'Ko Zaw', 'exercise', R('လမ်းထောင့် လက်ဖက်ရည်ဆိုင်', 'the street-corner tea stall'),
    { age: 'adult', build: 'mid', skin: 3, hair: 'parted', top: 'shirt', topColor: 'sky', bottom: 'longyi', bottomColor: 'navy', pattern: 'stripe', patternColor: 'cream', extras: ['towel'], extraColor: 'tan', face: 'square', eyes: 'small' }, { ambient: true }),
  P('dawthein', 'ဒေါ်သိန်း', 'Daw Thein', 'exercise', R('လမ်းလှည်းတဲ့ အဘွား', 'the grandmother who sweeps the lane'),
    { age: 'elder', build: 'slim', skin: 2, hair: 'bun', hairColor: 'white', top: 'eingyi', topColor: 'cream', bottom: 'htamein', bottomColor: 'brown', pattern: 'border', patternColor: 'charcoal', extras: ['thanaka'], face: 'heart', height: 0.94 }, { ambient: true }),
  P('aungaung', 'အောင်အောင်', 'Aung Aung', 'exercise', R('ခြင်းလုံး ခတ်တဲ့ ကလေး', 'chinlone boy'),
    { age: 'child', skin: 4, hair: 'crew', top: 'tee', topColor: 'coral', bottom: 'shorts', bottomColor: 'navy', extras: ['chinlone'], face: 'round', eyes: 'round' }, { years: 10, ambient: true }),
  P('thetpaing', 'သက်ပိုင်', 'Thet Paing', 'exercise', R('ခြင်းလုံး ခတ်တဲ့ ကလေး', 'chinlone boy'),
    { age: 'child', build: 'slim', skin: 8, hair: 'spiky', top: 'tee', topColor: 'leaf', bottom: 'shorts', bottomColor: 'charcoal', extras: ['chinlone', 'freckles'], face: 'long', height: 1.08 }, { years: 12, ambient: true }),
  P('mayzin', 'မေဇင်', 'May Zin', 'exercise', R('ခြင်းလုံး ခတ်တဲ့ ကလေးမ', 'chinlone girl'),
    { age: 'child', skin: 5, hair: 'pony', top: 'tee', topColor: 'rose', bottom: 'shorts', bottomColor: 'teal', extras: ['chinlone', 'thanaka'], extraColor: 'mustard', face: 'heart', eyes: 'lash' }, { years: 11, ambient: true }),

  // ---- Envelope Market
  P('kophyo', 'ကိုဖြိုး', 'Ko Phyo', 'market', R('ကုန်ထမ်းသူ၊ လက်ဖက်ရည်ဆိုင် ထိုင်ခုံရှင်', 'porter, regular at the tea shop'),
    { age: 'adult', build: 'wide', skin: 3, hair: 'short', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'maroon', check: true, extras: ['towel'], extraColor: 'tan' }),
  P('thiri', 'မသီရိ', 'Ma Thiri', 'market', R('စွန်လွှတ်တဲ့ ကောင်မလေး', 'the kite-flying girl'),
    { age: 'teen', skin: 1, hair: 'bob', top: 'blouse', topColor: 'rose', bottom: 'htamein', bottomColor: 'teal', extras: ['flower'] }, { years: 17 }),
  P('kolwin', 'ကိုလွင်', 'Ko Lwin', 'market', R('တံဆိပ်တုံး ထွင်းသူ', 'stamp carver'),
    { age: 'adult', build: 'slim', skin: 7, hair: 'spiky', top: 'shirt', topColor: 'olive', bottom: 'longyi', bottomColor: 'charcoal', extras: ['glasses'] }),
  P('khwarnyo', 'ခွာညို', 'Khwar Nyo', 'market', R('တံဆိပ်တုံး ထွင်းတဲ့ တပည့်', 'carving apprentice'),
    { age: 'teen', skin: 2, hair: 'bun', top: 'blouse', topColor: 'padauk', bottom: 'htamein', bottomColor: 'maroon', extras: ['thanaka', 'apron'] }),
  P('luaye', 'ဦးလူအေး', 'U Lu Aye', 'market', R('စာတိုက်ကောင်တာ စာရေး', 'letter-counter clerk'),
    { age: 'elder', build: 'slim', skin: 3, hair: 'bald', hairColor: 'grey', top: 'eingyi', topColor: 'white', bottom: 'longyi', bottomColor: 'navy', check: true, extras: ['glasses', 'pencil', 'moustache'], glassesStyle: 'half', face: 'long' }),
  P('yuyu', 'မယုယု', 'Ma Yu Yu', 'market', R('ကုန်စုံဆိုင်ရှင်', 'sundries shopkeeper'),
    { age: 'adult', build: 'slim', skin: 5, hair: 'long', top: 'blouse', topColor: 'leaf', bottom: 'htamein', bottomColor: 'rose', extras: ['thanaka'] }),
  P('kyar', 'ဒေါ်ကြာ', 'Daw Kyar', 'market', R('ဆန်လှည်း အဒေါ်', 'rice-cart aunty'),
    { age: 'elder', build: 'wide', skin: 4, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'mustard', bottom: 'htamein', bottomColor: 'olive', extras: ['towel'], extraColor: 'cream' }),
  P('tintin', 'ဒေါ်တင်တင်', 'Daw Tin Tin', 'market', R('လက်ဖက်ရည်ဆိုင်ရှင်', 'tea-shop owner'),
    { age: 'adult', build: 'wide', skin: 2, hair: 'bun', top: 'blouse', topColor: 'cream', bottom: 'htamein', bottomColor: 'maroon', extras: ['apron', 'flower'], extraColor: 'tan' }),
  P('yi', 'ဒေါ်ရီ', 'Daw Yi', 'market', R('စေတနာ ထမင်းဆိုင်က ချက်သူ', 'free-food cook'),
    { age: 'elder', build: 'mid', skin: 3, hair: 'bun', hairColor: 'white', top: 'blouse', topColor: 'white', bottom: 'htamein', bottomColor: 'brown', extras: ['apron'], extraColor: 'leaf' }),
  P('pyone', 'ဒေါ်ပြုံး', 'Daw Pyone', 'market', R('စာအိတ်ဆိုင်ရှင်', 'envelope-stall keeper'),
    { age: 'adult', build: 'mid', skin: 1, hair: 'bun', top: 'blouse', topColor: 'plum', bottom: 'htamein', bottomColor: 'mustard', extras: ['thanaka'] }),
  P('yaung', 'ကိုရောင်', 'Ko Yaung', 'market', R('မြေပုံ ဆေးခြယ်သူ', 'map colourer'),
    { age: 'adult', build: 'mid', skin: 8, hair: 'side', top: 'shirt', topColor: 'coral', bottom: 'longyi', bottomColor: 'teal', check: true, extras: ['pencil'] }),
  P('pwapwa', 'ဖွားဖွား', 'Grandmother Pwa Pwa', 'market', R('သနပ်ခါး သွေးသူ', 'grinds thanaka'),
    { age: 'elder', build: 'slim', skin: 3, hair: 'bun', hairColor: 'white', top: 'eingyi', topColor: 'cream', bottom: 'htamein', bottomColor: 'plum', extras: ['thanaka', 'flower', 'cane'], face: 'heart', height: 0.93 }),
  P('phoophoo', 'ဖူးဖူး', 'Phoo Phoo', 'market', R('မသီရိရဲ့ သူငယ်ချင်း (စာထဲမှာပဲ)', "Ma Thiri's friend (letters only)"),
    { age: 'teen', skin: 1, hair: 'braid', top: 'blouse', topColor: 'sky', bottom: 'htamein', bottomColor: 'navy' }, { offstage: true }),

  // ---- Ledger Wharf
  P('kothiha', 'ကိုသီဟ', 'Ko Thiha', 'wharf', R('ဖောင်လှော်သူ', 'raftsman'),
    { age: 'teen', build: 'mid', skin: 7, hair: 'short', top: 'tee', topColor: 'teal', bottom: 'longyi', bottomColor: 'navy', extras: ['towel'] }, { years: 17 }),
  P('dawsanda', 'ဒေါ်စန္ဒာ', 'Daw Sanda', 'wharf', R('ချိန်ခွင်ရုံက အလုပ်သမား၊ ကိုသီဟရဲ့ အမေ', "weigh-house worker, Ko Thiha's mother"),
    { age: 'adult', build: 'slim', skin: 4, hair: 'bun', top: 'blouse', topColor: 'grey', bottom: 'htamein', bottomColor: 'brown', extras: ['towel', 'thanaka'], extraColor: 'cream' }),
  P('ubolay', 'ဦးဘိုလေး', 'U Bo Lay', 'wharf', R('ကျူရိတ်တဲ့ အဘိုး၊ ကျူဆိပ်ခံ', 'the old reed cutter, Cane Jetty'),
    { age: 'elder', build: 'slim', skin: 2, hair: 'bald', hairColor: 'white', top: 'eingyi', topColor: 'white', bottom: 'longyi', bottomColor: 'brown', extras: ['gaungbaung', 'glasses'], extraColor: 'rose' }),

  // ---- Newsprint Junction
  P('kowunna', 'ကိုဝဏ္ဏ', 'Ko Wunna', 'junction', R('ရွှေမင်ပုံနှိပ်တိုက်က စာစီသူ', 'typesetter, Gold Ink Press'),
    { age: 'teen', skin: 6, hair: 'spiky', top: 'shirt', topColor: 'sky', bottom: 'trousers', bottomColor: 'charcoal', extras: ['apron'] }),
  P('utint', 'ဦးတင့်', 'U Tint', 'junction', R('ရွှေမင်ပုံနှိပ်တိုက် ပိုင်ရှင်', 'Gold Ink Press master'),
    { age: 'elder', build: 'wide', skin: 2, hair: 'side', hairColor: 'grey', top: 'shirt', topColor: 'white', bottom: 'longyi', bottomColor: 'charcoal', check: true, extras: ['apron', 'glasses'], extraColor: 'charcoal' }),
  P('thida', 'မသီတာ', 'Ma Thida', 'junction', R('စာရေးပေးသူ', 'letter writer'),
    { age: 'adult', build: 'slim', skin: 0, hair: 'long', top: 'blouse', topColor: 'navy', bottom: 'htamein', bottomColor: 'sky', extras: ['pencil', 'flower'] }),
  P('sein', 'ဒေါ်စိန်', 'Daw Sein', 'junction', R('လက်ဖက်ရည်ဆိုင်ရှင်', 'tea-shop owner'),
    { age: 'elder', build: 'wide', skin: 3, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'teal', bottom: 'htamein', bottomColor: 'maroon', extras: ['apron'] }),
  P('kan', 'ဦးကံ', 'U Kan', 'junction', R('လက်ဖက်ရည်ဆိုင် ဧည့်သည်ဟောင်း', 'tea-shop regular'),
    { age: 'elder', build: 'mid', skin: 4, hair: 'short', hairColor: 'white', top: 'eingyi', topColor: 'cream', bottom: 'longyi', bottomColor: 'olive', check: true, extras: ['cane', 'moustache'], face: 'square' }),
  P('komin', 'ကိုမင်း', 'Ko Min', 'junction', R('သတင်းကပ်သူ', 'news paster'),
    { age: 'adult', build: 'mid', skin: 8, hair: 'cap', top: 'tee', topColor: 'mustard', bottom: 'trousers', bottomColor: 'navy', extras: ['satchel'], extraColor: 'brown' }),
  P('moemoe', 'မိုးမိုး', 'Moe Moe', 'junction', R('လမ်းဆုံကျောင်းက ကလေး', 'pupil at the Junction school'),
    { age: 'child', skin: 1, hair: 'braid', top: 'school', bottom: 'schoolSkirt', extras: ['satchel'], extraColor: 'sky' }),
  P('dawhla', 'ဒေါ်လှ', 'Daw Hla', 'junction', R('လက်ဖက်ရည်ဆိုင် ဧည့်သည်', 'tea-shop customer'),
    { age: 'adult', build: 'mid', skin: 3, hair: 'bun', top: 'blouse', topColor: 'coral', bottom: 'htamein', bottomColor: 'charcoal', extras: ['thanaka'] }),
  P('kosan', 'ကိုစံ', 'Ko San', 'junction', R('တံတားစောင့်', 'bridge hand'),
    { age: 'adult', build: 'wide', skin: 7, hair: 'short', top: 'vest', topColor: 'grey', bottom: 'longyi', bottomColor: 'brown', extras: ['towel'], extraColor: 'mustard' }),

  // ---- Hearth Row
  P('khinmay', 'ဒေါ်ခင်မေ', 'Daw Khin May', 'hearth', R('မုန့်ဖုတ်ဆိုင်ရှင်', 'the baker'),
    { age: 'adult', build: 'wide', skin: 2, hair: 'bun', top: 'blouse', topColor: 'cream', bottom: 'htamein', bottomColor: 'coral', extras: ['apron'] }),
  P('maungarkar', 'မောင်အာကာ', 'Maung Arkar', 'hearth', R('မုန့်ဖုတ်ဆိုင် အကူ', "the baker's helper"),
    { age: 'teen', build: 'slim', skin: 3, hair: 'short', top: 'tee', topColor: 'cream', bottom: 'trousers', bottomColor: 'brown', extras: ['apron'] }, { years: 18 }),
  P('eimon', 'အိမွန်', 'Ei Mon', 'hearth', R('ခေါက်ဆွဲဆိုင်က ကူညီသူ၊ ရက်ကန်းသမ', 'noodle-house helper, weaver'),
    { age: 'teen', skin: 5, hair: 'braid', top: 'blouse', topColor: 'plum', bottom: 'htamein', bottomColor: 'sky', extras: ['satchel'], extraColor: 'mustard' }, { years: 17 }),
  P('nyein', 'ဒေါ်ငြိမ်း', 'Daw Nyein', 'hearth', R('သံပြား မီးအိမ်ဆိုင်ရှင်', 'tin-lamp maker'),
    { age: 'adult', build: 'slim', skin: 2, hair: 'bun', top: 'blouse', topColor: 'teal', bottom: 'htamein', bottomColor: 'grey', extras: ['apron', 'glasses'], extraColor: 'charcoal' }),
  P('kodoe', 'ကိုဒိုး', 'Ko Doe', 'hearth', R('သံပြား မီးအိမ် အိမ်နီးချင်း', 'the tin-lamp neighbour'),
    { age: 'adult', build: 'wide', skin: 7, hair: 'spiky', top: 'shirt', topColor: 'charcoal', bottom: 'longyi', bottomColor: 'olive', check: true }),
  P('upu', 'ဦးပု', 'U Pu', 'hearth', R('ခေါက်ဆွဲခြောက် ကောင်တာ', 'the dry-noodle counter'),
    { age: 'elder', build: 'wide', skin: 2, hair: 'bald', hairColor: 'grey', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'navy', check: true, extras: ['towel'], extraColor: 'cream' }),
  P('sawyu', 'ဒေါ်စောယု', 'Daw Saw Yu', 'hearth', R('ခေါက်ဆွဲ ဟင်းရည် အန်တီ', 'the noodle-soup aunty'),
    { age: 'adult', build: 'mid', skin: 1, hair: 'bun', top: 'blouse', topColor: 'rose', bottom: 'htamein', bottomColor: 'plum', extras: ['apron', 'thanaka'], extraColor: 'cream' }),
  P('maungpan', 'မောင်ပန်း', 'Maung Pan', 'hearth', R('ညနေကျောင်းက ကလေး («ပန်းလေး»)', 'evening-class boy («Pan Lay»)'),
    { age: 'child', build: 'slim', skin: 3, hair: 'short', top: 'tee', topColor: 'sky', bottom: 'shorts', bottomColor: 'charcoal' }),
  P('uchit', 'ဦးချစ်', 'U Chit', 'hearth', R('စွန်ခုံတန်းက ဦးလေး', 'Uncle Chit of the kite bench'),
    { age: 'elder', build: 'slim', skin: 4, hair: 'side', hairColor: 'white', top: 'shirt', topColor: 'leaf', bottom: 'longyi', bottomColor: 'maroon', check: true, extras: ['glasses'] }),
  P('sanshar', 'ဦးစံရှား', 'U San Shar', 'hearth', R('ထမင်းချိုင့် ဘူးလုပ်သူ', 'box maker'),
    { age: 'elder', build: 'mid', skin: 6, hair: 'short', hairColor: 'grey', top: 'shirt', topColor: 'tan', bottom: 'longyi', bottomColor: 'teal', extras: ['apron', 'pencil'], extraColor: 'brown' }),
  P('cherry', 'မချယ်ရီ', 'Ma Cherry', 'hearth', R('လက်ဖက်ရည်ဆိုင်က သီချင်းဆိုသူ', 'sings at the tea shop'),
    { age: 'adult', build: 'slim', skin: 0, hair: 'long', top: 'blouse', topColor: 'padauk', bottom: 'htamein', bottomColor: 'maroon', extras: ['flower'], extraColor: 'rose' }),
  P('nyinyi', 'ကိုညီညီ', 'Ko Nyi Nyi', 'hearth', R('ဂီတာတီးသူ', 'plays the guitar at the tea shop'),
    { age: 'adult', build: 'slim', skin: 2, hair: 'side', top: 'shirt', topColor: 'navy', bottom: 'trousers', bottomColor: 'charcoal' }),
  P('sithu', 'စည်သူ', 'Sithu', 'hearth', R('ရက်ကန်းရုံက လူငယ်', 'young weaver'),
    { age: 'teen', build: 'mid', skin: 3, hair: 'spiky', top: 'tee', topColor: 'coral', bottom: 'longyi', bottomColor: 'navy', check: true }),
  P('yadanar', 'ရတနာ', 'Yadanar', 'hearth', R('ရက်ကန်းရုံက လူငယ်', 'young weaver'),
    { age: 'teen', build: 'slim', skin: 1, hair: 'bob', top: 'blouse', topColor: 'mustard', bottom: 'htamein', bottomColor: 'teal', extras: ['thanaka'] }),

  // ---- Diary Garden
  P('hpohtaw', 'ဦးဖိုးထော်', 'U Hpo Htaw', 'garden', R('ဥယျာဉ်ရှင် အဘိုး', 'the old gardener'),
    { age: 'elder', skin: 4, hair: 'short', hairColor: 'grey', top: 'shirt', topColor: 'leaf', bottom: 'longyi', bottomColor: 'olive', extras: ['towel'] }),
  P('kyinyein', 'ဦးကြည်ငြိမ်း', 'U Kyi Nyein', 'garden', R('စက္ကူဂိုဒေါင် ကုန်သည်', 'paper-store trader'),
    { age: 'adult', build: 'wide', skin: 1, hair: 'side', top: 'eingyi', topColor: 'cream', bottom: 'longyi', bottomColor: 'plum', extras: ['glasses'] }),
  P('kaung', 'ကိုကောင်း', 'Ko Kaung', 'garden', R('မီးဖိုကြီးက အိုးထိန်း', 'potter at the big kiln'),
    { age: 'adult', build: 'mid', skin: 8, hair: 'short', top: 'vest', topColor: 'tan', bottom: 'longyi', bottomColor: 'brown', extras: ['apron', 'towel'], extraColor: 'grey' }),
  P('palae', 'မပုလဲ', 'Ma Pa Lae', 'garden', R('အိုးဈေးက ဆိုင်ရှင်', 'pot-stall keeper'),
    { age: 'adult', build: 'mid', skin: 2, hair: 'long', top: 'blouse', topColor: 'sky', bottom: 'htamein', bottomColor: 'coral', extras: ['thanaka', 'flower'] }),
  P('myamya', 'ဒေါ်မြမြ', 'Daw Mya Mya', 'garden', R('ဈေးကော်မတီ', 'market committee'),
    { age: 'elder', build: 'mid', skin: 1, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'white', bottom: 'htamein', bottomColor: 'navy', extras: ['glasses', 'satchel'], extraColor: 'maroon' }),
  P('teauncle', 'လက်ဖက်ရည်ဆိုင် ဦးလေး', 'the tea uncle', 'garden', R('မီးဖိုရင်ပြင်က လက်ဖက်ရည်ဆိုင်', 'corner tea shop at the kiln square'),
    { age: 'elder', build: 'wide', skin: 3, hair: 'bald', hairColor: 'grey', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'charcoal', check: true, extras: ['towel'], extraColor: 'tan' }),

  // ---- the Blank Page
  P('pyaesone', 'ကိုပြည့်စုံ', 'Ko Pyae Sone', 'blank', R('ခရီးသည်', 'traveller'),
    { age: 'adult', skin: 2, hair: 'cap', top: 'tee', topColor: 'navy', bottom: 'trousers', bottomColor: 'tan', extras: ['satchel'], extraColor: 'olive' }),
  P('dawpwint', 'ဒေါ်ပွင့်', 'Daw Pwint', 'blank', R('ခရီးသည် တည်းခိုဆောင် စောင့်', 'lodge keeper'),
    { age: 'elder', build: 'mid', skin: 3, hair: 'bun', hairColor: 'white', top: 'eingyi', topColor: 'cream', bottom: 'htamein', bottomColor: 'brown', extras: ['thanaka'] }),
  P('shwesin', 'မရွှေစင်', 'Ma Shwe Sin', 'blank', R('ခရီးသည်', 'traveller'),
    { age: 'adult', build: 'slim', skin: 5, hair: 'braid', top: 'blouse', topColor: 'leaf', bottom: 'htamein', bottomColor: 'mustard', extras: ['satchel'], extraColor: 'tan' }),
  P('moe', 'မိုး', 'Moe', 'blank', R('ခရီးသည် ကလေး', 'travelling child'),
    { age: 'child', skin: 2, hair: 'bob', top: 'tee', topColor: 'rose', bottom: 'shorts', bottomColor: 'teal' }),
];

/** Ids used before the continuity pass (looks kept, names changed). */
export const ALIASES = {
  hninsi: 'thiri', kothaw: 'kolwin', kohlaing: 'kothiha', ubathaw: 'ubolay', maungye: 'maungarkar',
  uzeya: 'kyinyein', kophone: 'pyaesone', noodleaunty: 'sawyu', dawsan: 'dawpwint',
};

const byId = new Map(CAST.map((c) => [c.id, c]));
export const castById = (id) => byId.get(id) || byId.get(ALIASES[id]) || undefined;
export const castIn = (district) => CAST.filter((c) => c.district === district);
