// Town chatter, part B: the Envelope Market, Ledger Wharf and Newsprint Junction (the Fold).
// Read by ./index.js (createChatter); shape and tags as documented there. Pure data, no imports.
// Every Burmese line is a DRAFT for Maya to proofread.
//
// Lessons carried here (days/INDEX.md 14):
//   market   ch 6  give with a clean, cool heart; where to give is the giver's choice; fill your own pot first
//            ch 7  goodwill does not burn, clinging does; one even wish for everyone
//            ch 10 catch the hot thought when an equal pulls ahead; be glad instead
//            ch 11 (Day 6 slates 1, 3, 5) only you steer yourself; you matter less to onlookers than you think
//   wharf    ch 2  nobody chose where they were born; blame no one; drift or pole, how you meet it is yours
//            ch 8  hatred brings no good; greet everyone alike; stay like the ground
//            ch 11 (Day 6 slates 2, 4) let words pass like wind past rock; own your mistake and put it right
//   junction ch 11 (Day 7, west bank) fear is allowed, turning back is not; the key is in your own hand
//            ch 12 don't believe just because it is said, old, printed, your own sum, or from someone revered
//            ch 13 one deed reads 6 to you and 9 to the other; ask well; knowledge needs goodwill
//
// RULES kept: no line tells the player where to go, whom to see or what to do next; reactions only to what has
// already happened (day / flag tags), never to what is still to come. No religious places or people.
//
// Tags used (index.js): from / to (day, inclusive), days, flag ('!x' = must be off), notFlag, weather: 'rain'
// (Day 12's rain, save.weather), job (person ids, room walk-on keys), age, by: 'maya' (her own thought).
// Town and area lines name the district's own townsfolk in `job`, so the story cast never voice a line about
// themselves; room lines name whoever is really in that room (cast ids or the room's walk-on keys).

// ---- who may speak (district townsfolk: world/regions/*-folk.js, *-townfolk.js, junction-people.js)
const MK = ['mbedar', 'mbatin', 'mnanda', 'mhsaing', 'mmar', 'mpekyi', 'mngwehla', 'mhlashein', 'mkyipyar', 'mpauksi', 'mohnmar', 'mthawda', 'mlaylay', 'uaungba', 'kyar']; // not pwapwa: some lines are about her
const MK_SELL = ['mbatin', 'mnanda', 'mkyipyar', 'mpauksi', 'mohnmar']; // keeps a stall or a shop
const WH = ['wkun', 'wthit', 'wmyint', 'whtun', 'waye', 'wwawa', 'wzaw', 'wnu', 'wthein', 'wmay', 'wkyaw'];
const WH_WATER = ['wkun', 'wthit', 'waye', 'wnu', 'wkyaw']; // nets, boats, fish, rope: the water folk
const JN = ['jdawyin', 'jdawsabai', 'juchan', 'jmanu', 'jkosoe', 'jywet', 'jkopaing'];
const HANDS = ['d7handA', 'd7handB']; // Day 7's two bridge hands (day7.js walk-ons)

const RAIN = { weather: 'rain' };
const mk = (my, en, t = {}) => ({ my, en, job: MK, ...t });
const wh = (my, en, t = {}) => ({ my, en, job: WH, ...t });
const jn = (my, en, t = {}) => ({ my, en, job: JN, ...t });
const by = (job, my, en, t = {}) => ({ my, en, job, ...t });
const maya = (my, en, t = {}) => ({ my, en, by: 'maya', ...t });
const pair = (who, lines, when) => ({ who, lines: lines.map(([my, en]) => ({ my, en })), ...(when ? { when } : {}) });

// =================================================================================================
// THE ENVELOPE MARKET (opens Day 4; Days 4-7 and 14 play here)
// =================================================================================================
const market = {
  town: [
    mk('ဘေးဆိုင် ရောင်းကောင်းရင် ဈေးတစ်ခုလုံး စည်တာပဲ။', "When the next stall sells well, the whole market's livelier.", { job: MK_SELL }),
    mk('ပေးချင်ရင် ပေး။ ပေးပြီးရင် ထပ်မပြောနဲ့။', "Give if you want to. Then don't keep talking about it.", { age: 'elder' }),
    mk('သူများ ဘယ်ကို လှူလှူ သူ့သဘောပဲ။', "Where someone gives is their own business."),
    mk('သူများ လှူတာ ဝေဖန်ရတာ လွယ်တယ်။ ကိုယ်တိုင် ပေးကြည့်မှ သိမယ်။', "Picking at other people's gifts is easy. Try giving yourself."),
    mk('ကိုယ့်ဝန် ကိုယ်ထမ်းနိုင်မှ သူများကို ကူနိုင်တာ။', "Carry your own load first; then you can help with theirs.", { job: 'porter' }),
    mk('ကျေးဇူးတင်စကား မကြားရလည်း ရပါတယ်။ ပေးပြီးပြီပဲ။', "No thank-you? That's fine. It's given."),
    mk('ဘယ်သူ ဘယ်လို ဆက်ဆံဆံ ကျွန်မက တစ်မျိုးတည်း ပြုံးပြတယ်။', "However people treat me, I smile at them all the same."),
    mk('အမေပြောတယ်၊ မနာလိုရင် ရင်ထဲ ပူတယ်တဲ့။ တကယ်ပဲ။', "Mum says envy makes your chest hot. It's true.", { age: 'child' }),
    mk('ကိုယ့်စွန်ကြိုး ကိုယ်ကိုင်မှ ပျော်တာ။', "It's only fun when you hold your own kite string.", { age: 'child' }),
    mk('တံဆိပ်ခေါင်းဆိုတာ ကိုယ့်လက်နဲ့ ထုမှ ကိုယ့်ဟာ ဖြစ်တာ။', "A stamp's only yours when your own hand presses it.", { job: MK_SELL }),
    mk('ဘယ်သူမှ ကျွန်တော့်ကို မကြည့်ပါဘူး။ ကိုယ့်အလုပ် ကိုယ်လုပ်။', "Nobody's watching me, honestly. I just get on with it."),
    mk('ကိုယ့်အိမ်ရှေ့ အရင်လှည်း။ ပြီးမှ လမ်းကို လှည်း။', "Sweep your own step first. Then the lane."),
    // Day 4: the Painted Map, the gifts, the kite tied to a flag
    mk('ဆေးရေးမြေပုံ လှတော့ လှတယ်။ ကိုယ်တိုင်တော့ မလျှောက်ဖူးဘူး။', "That painted map is pretty. I've never walked it myself.", { days: [4] }),
    mk('ကောင်မလေးရဲ့ စွန်က အလံ တက်မှ တက်တာတဲ့။ ဆန်းတယ်နော်။', "That girl's kite only goes up when a flag does, they say. Odd, isn't it?", { days: [4], notFlag: 'd4.ch7Done' }),
    // after Day 4
    mk('စွန်လေး အခု ကိုယ့်တိုင်နဲ့ကိုယ် ငြိမ်ငြိမ်လေး တက်နေတယ်။', "The kite flies steady now, from its own post.", { from: 5 }),
    mk('ခွေးလေးတွေ ရေခွက်နဲ့ ဖြစ်သွားပြီ။ ဘယ်သူ ချထားလဲ မသိဘူး။', "The dogs have water bowls now. Nobody knows who put them there.", { from: 5 }),
    mk('ကိုဖြိုး အရင်က သူများ လှူတာ ကဲ့ရဲ့တယ်။ အခု ကိုယ်တိုင် ငှဲ့နေပြီ။', "Ko Phyo used to scoff at other people's giving. Now he pours himself.", { from: 5 }),
    mk('ဖြတ်လမ်းက ဆေးနဲ့ ခြယ်ထားတာပဲ။ သေတ္တာတွေနဲ့ ဆုံးတယ်တဲ့။', "That shortcut was only paint. Ends in crates, they say.", { from: 5 }),
    // Day 5: the carvers' row
    mk('ဆရာလွင် တုံး မထွင်းတာ ရက်ပိုင်း ရှိပြီ။', "Teacher Lwin hasn't carved a block in days.", { days: [5], notFlag: 'd5.ch10Done' }),
    mk('ကိုလွင့် မီးခိုးတိုင်က မီးခိုး ပြန်ထွက်နေပြီ။ ဝမ်းသာစရာ။', "Smoke from Ko Lwin's chimney again. Lovely to see.", { flag: 'd5.ch10Done' }),
    mk('ခွာညို နိုင်တာ စမ်းတုံး လေးဆယ်ကြောင့်။ ကံကောင်းလို့ မဟုတ်ဘူး။', "Khwar Nyo won on forty trial blocks. That's not luck.", { from: 6 }),
    mk('ဆရာလွင် တပည့်အတွက် ဝမ်းသာနေပြီ။ အရင်က မော့တောင် မကြည့်ဘူး။', "Teacher Lwin's glad for his pupil now. A while back he wouldn't even look up.", { from: 6 }),
    // Day 6: the noon wind and Nay Chi's slates
    mk('နေ့လယ်ဆို လေကြီး တိုက်တတ်တယ်တဲ့။ ကျွန်မပစ္စည်း ချည်ထားပြီ။', "A big wind comes at noon, they say. I've tied my things down.", { days: [6], notFlag: 'd6.gust' }),
    mk('နေ့လယ်လေက ကျောက်သင်ပုန်းလေးတွေ ယူလာတယ်။ အမိုးပေါ် တဖြောင်းဖြောင်း။', "The noon wind brought little slates. Clattering down on the roofs.", { days: [6], flag: 'd6.gust' }),
    mk('ကောင်မလေး ကိုယ့်ခွက်ကိုယ်ကိုင်ပြီး လူကြားဖြတ်သွားတယ်။ မဖိတ်ဘူး။', "That girl carried her own cup through the crowd. Not a drop spilt.", { flag: 'd6.slate1' }),
    // Day 7 on: the bridge
    mk('တံတားဖွင့်မယ့်နေ့ဆိုတော့ ဈေးတစ်ခုလုံး လှုပ်လှုပ်ရွရွ။', "Bridge-opening day. The whole market's buzzing.", { days: [7] }),
    mk('တံတား ပွင့်ပြီ။ ဟိုဘက်ကမ်းက ကုန်တွေ ဒီကို ရောက်လာပြီ။', "The bridge is open. Goods from the far bank are coming in.", { from: 8 }),
    // Day 8 on: "Maya says"
    mk('မာရာ ပြောတယ်တဲ့၊ မင် သိမ်းထား။ နှစ်အိုး ဝယ်ထားလိုက်တယ်။', "Maya says keep ink back, apparently. I bought two jars, just in case.", { days: [8] }),
    mk('မင်တွင်း ပြည့်နေတာပဲတဲ့။ ကြားရုံနဲ့ ဝယ်မိတာ ရှက်စရာ။', "The ink well was full all along. Buying on hearsay, how silly of me.", { from: 9 }),
    mk('ကိုဖြိုး စက္ကူဟောင်းလှည်း ပြန်တွန်းနေပြီ။ လက်ဖက်ဖိုး ကိုယ်တိုင်ရှာတာ။', "Ko Phyo's pushing his cart of old paper again. Earns his own tea money.", { from: 10 }),
    // Day 12: rain
    mk('မိုးကြီးလိုက်တာ။ အမိုးအောက် နေရာ ဖယ်ပေးကြ။', "What rain! Make room under the awnings.", RAIN),
    mk('မိုးရွာတာ ဘယ်သူ့အပြစ်မှ မဟုတ်ဘူး။ ကုန်တွေ ဖုံးလိုက်ရုံပဲ။', "Rain's nobody's fault. Just cover the goods.", RAIN),
    // Days 14-15: the launch
    mk('ပွဲတံဆိပ် ဘောင်က ကိုလွင့်လက်ရာတဲ့။ ဖိတ်စာနောက်မှာ ရေးထားတယ်။', "Ko Lwin carved the launch postmark's border, they say. His name's on the back of the invitation.", { flag: 'd14.border' }),
    mk('ဒီည စာအုပ်ပွဲ။ ဆိုင်ကို စောစော ပိတ်မယ်။', "Book launch tonight. I'm shutting early.", { days: [15], job: MK_SELL }),
  ],

  areas: {
    // the little paved square in front of Daw Tin Tin's tea shop, the street pump straight across its door
    teaSquare: {
      at: { x: 18.5, z: 316.5, r: 8 },
      lines: [
        mk('ပထမခွက်က ဘယ်သူ့အတွက်လဲ မရွေးဘူး။ ဝင်လာတဲ့သူပဲ။', "The first cup isn't chosen for anyone. Whoever walks in.", { from: 5 }),
        mk('ပန့်ရေ ကိုယ့်လက်နဲ့ ကိုယ် ငင်ရတယ်။ ဒါမှ အရသာရှိတာ။', "You pump your own water here. Tastes better that way.", { age: 'elder' }),
        mk('ကျွန်တော့် ရေဘူး ကိုယ်တိုင် ဖြည့်တတ်ပြီ!', "I can fill my own bottle now!", { age: 'child' }),
        mk('ဖြည်းဖြည်း သောက်ပြီးမှ ပြော။ ပူနေရင် ဘာမှ မကောင်းဘူး။', "Sip first, then talk. Nothing good comes out hot."),
        mk('ကိုဖြိုး မနက်တိုင်း ရေ သုံးပုံး ကိုယ်တိုင် ငင်တယ်။', "Ko Phyo pumps his three pails himself every morning now.", { from: 5 }),
        mk('ကိုဖြိုး ကိုယ့်လက်ဖက်၊ ကိုယ့်အိုးနဲ့။ အရင်က သူများဆီ တောင်းသောက်တာ။', "Ko Phyo has his own leaves and his own pot now. He used to cadge cups.", { from: 5 }),
        mk('ခွာညို ကူးတာတဲ့။ ကျွန်မလည်း ကြားရုံပဲ။ မမြင်ဘူး။', "Khwar Nyo copied, they say. I only heard it. Didn't see.", { days: [5] }),
        mk('တံတားဖွင့်တဲ့နေ့ဆိုတော့ ဒေါ်တင်တင့် ကရား မနားရဘူး။', "Bridge-opening day. Daw Tin Tin's kettle gets no rest.", { days: [7] }),
        mk('မိုးရွာလည်း ကရားကြီး ဆူနေတုန်းပဲ။', "Rain or not, the big kettle's still boiling.", RAIN),
        maya('(ပထမခွက်ကို ဘယ်သူ သောက်သွားလဲ ဘယ်သူမှ မကြည့်ဘူး။)', "(Nobody watches who drinks the first cup.)", { from: 5 }),
      ],
    },
    // Stamp Lane: the stamp-awning stalls, the old-book stall, Ko Yaung's map stall by the crease
    stampStreet: {
      at: { x: -12, z: 272, r: 24 },
      lines: [
        mk('ဘေးဆိုင်နဲ့ ပြိုင်စရာ မလိုဘူး။ ဖောက်သည်က နှစ်ဆိုင်လုံး လာတာ။', "No need to race the next stall. Customers come to both.", { job: MK_SELL }),
        mk('ရောင်းမကောင်းတဲ့နေ့ ဘေးဆိုင်ကို လက်ဖက်ရည် တိုက်တယ်။ စိတ်အေးသွားတယ်။', "On slow days I buy the next stall a tea. Cools me right down.", { job: MK_SELL }),
        mk('စာအိတ် ဝယ်ရင် ကိုယ့်စာ ကိုယ်ရေး။ ကျွန်မ ရေးမပေးဘူး။', "Buy an envelope, write your own letter. I don't write them for you.", { job: MK_SELL }),
        mk('လူတိုင်း မာရာ့မြေပုံ ဝယ်ကြတယ်။ ကျွန်တော်ကတော့ ကိုယ့်ခြေနဲ့။', "Everyone's buying Maya's maps. Me, I go on my own feet.", { days: [4] }),
        mk('ဆေးရေးမြေပုံထဲက ဖြတ်လမ်း မရှိဘူးတဲ့။ လှတာနဲ့ မှန်တာ မတူဘူး။', "The painted map's shortcut isn't there, they say. Pretty isn't true.", { from: 5 }),
        mk('လေကြီးလာတော့ တံဆိပ်ခေါင်း ဖုံးလိုက်တယ်။ ချည်ထားတာ မလွင့်ဘူး။', "When the wind hit I covered my stamps. What's tied down stays.", { days: [6], flag: 'd6.gust' }),
        mk('"မာရာ ပြောတယ်" စာရွက်တွေ ဒီထိ ရောက်လာတယ်။ မစစ်ဘဲ မကပ်ဘူး။', "Those 'Maya says' slips reached us too. I won't pin one up without checking.", { days: [8, 9] }),
        mk('စာအိတ်တွေ စိုကုန်ပြီ။ ညည်းလို့ ခြောက်မှာ မဟုတ်ဘူး။', "Envelopes soaked. Moaning won't dry them.", RAIN),
        maya('(လှတဲ့ မြေပုံနဲ့ မှန်တဲ့ မြေပုံ မတူဘူး။)', "(A pretty map and a true map aren't the same.)", { from: 5 }),
      ],
    },
    // the stamp-carvers' row at Stamp Lane's east end (Ko Lwin's is the third shop)
    carversRow: {
      at: { x: 31.5, z: 270, r: 6.5 },
      lines: [
        mk('ဘေးခုံက မြန်တယ်။ ကျွန်တော်က ဖြောင့်တယ်။ နှစ်ယောက်လုံး ရောင်းရတယ်။', "The next bench is faster. I'm straighter. We both sell."),
        mk('ရင်ထဲ ပူလာရင် ဆောက်ကို ချထား။ ပူတုန်း ထွင်းရင် ကွဲတာပဲ။', "When your chest gets hot, put the gouge down. Carve hot and it splits."),
        mk('ဆရာ့ခုံ အေးနေတယ်။ မီးဖို မမွှေးတာ ကြာပြီ။', "Teacher's bench is cold. His brazier's not been lit for a while.", { days: [5], notFlag: 'd5.ch10Done' }),
        mk('"ကံကောင်းလို့" တဲ့။ ပြောတဲ့သူ ကိုယ်တိုင် မြင်ခဲ့လို့လား။', "'Lucky', they say. Did whoever says it actually see?", { days: [5] }),
        mk('ဆရာ့မီးဖို ပြန်မွှေးပြီ! တစ်တန်းလုံး နွေးသွားသလိုပဲ။', "Teacher's brazier is lit again! The whole row feels warmer.", { flag: 'd5.ch10Done' }),
        mk('တပည့်က ဆရာ့ကို ကျော်သွားတာ ဆရာ့ဂုဏ်ပဲ။', "A pupil passing her teacher is the teacher's pride.", { from: 5, age: 'elder' }),
        mk('ဆရာလွင် ဘယ်သူမှ မမှာဘဲ ဘောင်တွေ ထွင်းနေတယ်။ လက်ယားလို့တဲ့။', "Teacher Lwin's carving borders nobody ordered. Says his hands itch.", { from: 6 }),
        mk('ပွဲတံဆိပ်ပေါ်မှာ လက်ရာ နှစ်ခု။ ဒီဇိုင်းက တပည့်၊ ဘောင်က ဆရာ။', "Two hands on the launch postmark: the design the pupil's, the border the teacher's.", { flag: 'd14.border' }),
        mk('မိုးစိုရင် သစ်သား ပွတယ်။ ဒီနေ့ စောင့်မယ်။ စောင့်တာလည်း အလုပ်ပဲ။', "Wet wood swells. Today we wait. Waiting is work too.", RAIN),
        maya('(မီးခိုးလေး တက်နေတယ်။ ဝမ်းသာတာကလည်း နွေးတယ်။)', "(A thin smoke rising. Gladness is warm too.)", { flag: 'd5.ch10Done' }),
      ],
    },
    // Rice Lane's east end: Daw Yi's free-food shop under its padauk, her yard, the fritter cart
    riceYard: {
      at: { x: 32, z: 331, r: 7 },
      lines: [
        mk('စေတနာထမင်းဆိုင်က ဘယ်သူ့ကိုမှ ဘာမှ မမေးဘူး။ ဒါပဲ ကောင်းတာ။', "The free-food shop asks nobody anything. That's what's good about it.", { from: 5 }),
        mk('ဆန်အိတ်ပေါ်မှာ လှူတဲ့သူ နာမည် ဘယ်တော့မှ မရေးဘူး။', "Nobody's name ever goes on the rice sacks."),
        mk('ကိုယ့်အိုး ပြည့်မှ သူများအိုး ဖြည့်နိုင်တာ။ ဒေါ်ရီ အမြဲ ပြောတယ်။', "Fill your own pot, then you can fill another's. Daw Yi always says so.", { age: 'elder' }),
        mk('အမေက အိမ်က ထမင်းအိုး အရင်တည်ပြီးမှ ဒီမှာ လာကူတာ။', "Mum puts our own rice on first, then comes to help here.", { age: 'child' }),
        mk('ဆင်းရဲကြောင်း ပြရမယ်တဲ့။ ကျွန်မ စားဖူးတယ်။ ဘယ်သူမှ မမေးဘူး။', "They said you had to prove you were poor. I've eaten there. Nobody asked.", { from: 5 }),
        mk('ထမင်းအိုး ပြည့်နေတယ်။ ဘယ်သူ့ဆန်လဲ မသိဘူး။ မသိလည်း ရတယ်။', "The rice pot's full. Whose rice? Don't know. Doesn't matter.", { from: 5 }),
        mk('မိုးထဲက လူတွေ ဝင်လာလို့ ခုံ မလောက်ဘူး။ ထမင်းကတော့ လောက်တယ်။', "Folk keep coming in out of the rain. Not enough stools. Enough rice, though.", RAIN),
        maya('(ဘယ်သူ ပေးလဲ မသိရတဲ့ ထမင်းက ပိုမွှေးနေသလိုပဲ။)', "(Rice from nobody-knows-who smells even better.)"),
      ],
    },
    // the kite field west of the west lane: kite racks, the swing, the fritter cart
    kiteField: {
      at: { x: -44, z: 315, r: 12 },
      lines: [
        mk('ကြိုးကို တင်းတင်း မဆွဲနဲ့၊ ပြတ်သွားမယ်။', "Don't yank the string so tight, it'll snap."),
        mk('သူ့စွန် ပိုမြင့်လား။ လက်ခုပ်တီးလိုက်။ ကောင်းကင်က ကျယ်ပါတယ်။', "His kite's higher? Clap for it. The sky's big enough.", { age: 'elder' }),
        mk('စွန်ကြိုးကို သူများ အလံမှာ မချည်နဲ့။ ကိုယ့်လက်ထဲ ကိုင်ထား။', "Don't tie your string to someone else's flag. Keep it in your own hand."),
        mk('ကျွန်တော့် စွန် အမြင့်ဆုံး မဟုတ်ဘူး။ ဒါပေမဲ့ ပျော်တယ်။', "Mine's not the highest. Still fun.", { age: 'child' }),
        mk('ကြော်လေး ကလေးတိုင်းကို တစ်ခုစီ။ ဘယ်သူ့ကလေးလဲ မမေးဘူး။', "One fritter for every child. I don't ask whose."),
        mk('ကောင်တာက အစ်မကြီးလည်း ကိုယ့်တိုင်နဲ့ စွန်လွှတ်တတ်သွားပြီ။', "The big sister from the counter flies hers from her own post now.", { from: 5 }),
        mk('နေ့လယ်လေက စွန်တွေ ဆွဲသွားတော့မလို့။ ကြိုးလျှော့ပေးတော့ ငြိမ်သွားတယ်။', "The noon wind nearly took every kite. I let the string out and it settled.", { days: [6], flag: 'd6.gust' }),
        mk('ဒီနေ့ စွန် မလွှတ်ရဘူး။ မနက်ဖြန်လည်း ကောင်းကင် ရှိသေးတယ်။', "No kites today. The sky will still be there tomorrow.", RAIN),
        maya('(ကြိုးလျှော့ပေးမှ တက်တယ်။)', "(Let the string out, and it climbs.)", { from: 5 }),
      ],
    },
    // Counter Lane in front of the Market post office: the flag board, Pwa Pwa's thanaka stone, Ma Thiri's post
    postOffice: {
      at: { x: 19, z: 298, r: 7 },
      lines: [
        mk('ပြန်စာ ရောက်ရောက် မရောက်ရောက် ကောင်းစေချင်တာ မပြောင်းဘူး။', "Reply or no reply, my good wishes don't change."),
        mk('ပြန်စာ မစောင့်ဘဲ ရေးချင်လို့ ရေးတာ။ ဒါမှ စိတ်ပေါ့တယ်။', "I write because I want to, not for a reply. Lighter that way."),
        mk('အလံကို တစ်နေကုန် မော့မကြည့်နဲ့။ လည်ပင်း နာမယ်။', "Don't stare up at that flag all day. You'll crick your neck."),
        mk('အဖွားက သနပ်ခါးကို လူတိုင်း လိမ်းပေးတယ်။ သိတဲ့သူရော မသိတဲ့သူရော။', "Grandma dabs thanaka on everyone. Known or not."),
        mk('မွန်းတည့် ပိတ်တယ်ဆိုတာ မြေပုံကပဲ ပြောတာ။ ဦးလူအေး ညနေထိ ရှိတယ်။', "Shut at noon? Only the map said so. U Lu Aye's there till evening.", { from: 5 }),
        mk('အလံ ၁၄ ကို ဘယ်သူမှ မော့မကြည့်တော့ဘူး။ စွန်က ကိုယ့်ဘာသာ တက်နေတယ်။', "Nobody stares up at flag fourteen any more. The kite's up on its own.", { from: 5 }),
        mk('ကောင်မလေး ရှက်နေတာ။ ဘယ်သူမှ မကြည့်မှန်း နောက်မှ သိတယ်။', "That girl was shy. Then she saw nobody was even looking.", { flag: 'd6.slate5' }),
        maya('(အလံ ၁၄ က အောက်မှာပဲ။ စွန်ကတော့ အပေါ်မှာ။)', "(Flag fourteen's still down. The kite is up.)", { from: 5 }),
      ],
    },
  },

  rooms: {
    // Daw Tin Tin's tea shop (Daw Tin Tin, Ko Phyo)
    teashop: [
      by('tintin', 'ပထမခွက်ကို ဘယ်သူ ကြည့်ကြည့် တစ်မျိုးတည်း ငှဲ့တယ်။', "I pour the first cup the same, whoever's watching."),
      by('tintin', 'ပိုက်ဆံမပါလည်း ထိုင်ပါ။ ရေနွေးကြမ်းက အလကားပဲ။', 'No money? Sit anyway. Plain tea is free.'),
      by('tintin', 'ကိုဖြိုးရေ၊ အလကားခွက် သုံးခွက်၊ အပြစ်ပြောတာ သုံးခွန်း။', "Ko Phyo, three free cups and three complaints.", { days: [4], notFlag: 'd4.ch6Done' }),
      by('kophyo', 'ကိုယ့်လက်ဖက်၊ ကိုယ့်အိုးနဲ့ ငှဲ့ရတာ တစ်မျိုး ချိုတယ်။', "Pouring from my own leaves and pot tastes sweeter somehow.", { from: 5 }),
      by('kophyo', 'ဘယ်သူ သောက်သွားလဲ မကြည့်တော့ဘူး။ ငှဲ့ပြီးရင် ပြီးပြီ။', "I don't watch who drinks it now. Poured is done.", { from: 5 }),
      by('tintin', 'ကောင်မလေး ကိုယ့်ခွက် ကိုယ်ကိုင်သွားတယ်။ ကူမယ့်လက်တွေ ရှိရဲ့သားနဲ့။', "That girl carried her own cup, with helping hands all round her.", { days: [6], flag: 'd6.slate1' }),
      by('kophyo', 'စက္ကူဟောင်း ရောင်းပြီး လက်ဖက်ဖိုး ကိုယ်တိုင် ရှာတယ်။', "I sell old paper and earn my own tea money.", { from: 10 }),
      by('tintin', 'မိုးခိုလာတဲ့သူ အကုန် ဝင်ထိုင်။ ခုံမလောက်ရင် ကပ်ထိုင်ကြ။', "Everyone in out of the rain, sit down. Not enough stools? Squeeze up.", RAIN),
    ],
    // the Market post office's front room (U Lu Aye; Day 4 Ma Thiri and Grandmother Pwa Pwa on the bench)
    marketpost: [
      by('luaye', 'ပြန်စာ ရောက်ရောက် မရောက်ရောက် ရေးတဲ့သူရဲ့ စေတနာက မပျောက်ဘူး။', "Reply or not, the goodwill of whoever wrote doesn't vanish."),
      by('luaye', 'တန်းစီရင်း စိတ်မရှည်ရင် ကိုယ်ပဲ ပင်ပန်းတယ်။', "Fret in the queue and you're the only one worn out."),
      by('pwapwa', 'မြေးမလေး ပိန်လာပြီ။ အလံကို မော့ကြည့်ရင်းနဲ့။', "My granddaughter's getting thin, staring up at that flag.", { days: [4], notFlag: 'd4.ch7Done' }),
      by('pwapwa', 'မြေးမလေး ထမင်း ပြန်စားပြီ။ ကိုယ့်တိုင်နဲ့ ကိုယ် ရပ်တတ်သွားပြီ။', "She's eating again. Learned to stand by her own post.", { flag: 'd4.ch7Done' }),
      by('luaye', 'ဒီခုံမှာ တစ်နေကုန် စောင့်တဲ့ ကောင်မလေး၊ အခု မစောင့်တော့ဘူး။', "The girl who waited on that bench all day doesn't wait any more.", { from: 5 }),
      by('luaye', 'စာရေးစားပွဲမှာ ဆုမွန်ကောင်း လေးကြောင်း။ နာမည် မပါဘူး။', "Four good wishes left on the writing table. No names.", { from: 5 }),
      by('luaye', 'ဘယ်သူမှ ကိုယ့်ကို မကြည့်ပါဘူး သမီး။ ကိုယ့်စာ ကိုယ်ထည့်ရုံပဲ။', "Nobody's looking at you, dear. Just post your letter.", { flag: 'd6.slate5' }),
      by('luaye', 'စာတွေ မစိုအောင် အိတ်ထဲ ထည့်ထားတယ်။ ကိုယ်ကတော့ စိုတာပေါ့။', "Kept the letters dry in the sack. Me, I'm soaked.", RAIN),
    ],
    // the post office's back room (U Lu Aye's high desk; Day 5 Khwar Nyo at her packing table)
    postroom: [
      by('luaye', 'ပြန်ပို့ရတဲ့ တုံးတိုင်းကို ဂရုတစိုက် ထုပ်တယ်။ ရှုံးလည်း လက်ရာပဲ။', "I wrap every returned block with care. Lost or not, it's someone's work."),
      by('luaye', 'ဆုရတာ တစ်ယောက်တည်း။ ကြိုးစားခဲ့တာက အကုန်လုံး။', "Only one wins. Everyone tried."),
      by('luaye', 'လိပ်စာတိုင်း ကိုယ်တိုင် ပြန်ဖတ်တယ်။ မှားရင် ကိုယ့်အမှားပဲ။', "I read every address again myself. A mistake would be mine."),
      by('khwarnyo', 'စမ်းတုံး လေးဆယ်။ ကံကောင်းလို့ မဟုတ်ဘူး… ဆရာကတော့ အဲလို ထင်တယ်။', "Forty trial blocks. Not luck… but Teacher thinks so.", { days: [5], notFlag: 'd5.ch10Done' }),
      by('luaye', 'တုံး အချိန်မီ ရောက်လာတယ်။ ဘောင်က ဖြောင့်လိုက်တာ။', "The block came in on time. What a straight border.", { flag: 'd5.carried' }),
      by('khwarnyo', 'ဆရာ ဘောင်ခတ်ပေးတယ်။ နာမည် မထိုးဘူး။ ကျွန်မ မှတ်ထားမယ်။', "Teacher framed it. Didn't sign it. I'll remember.", { flag: 'd5.carried' }),
      by('luaye', 'ပွဲတံဆိပ်တုံးမှာ ဘောင်ထွင်းသူ နာမည်ပါ မှတ်ထားလိုက်တယ်။', "I've noted who carved the launch block's border too.", { flag: 'd14.border' }),
    ],
    // Daw Yi's free-food shop
    riceshop: [
      by('yi', 'ထိုင်ပါ၊ စားပါ။ ဘယ်ကလာလဲ မမေးဘူး။', "Sit, eat. I won't ask where you're from."),
      by('yi', 'ကိုယ့်အိုး အရင်တည်မှ သူများအတွက် ချက်နိုင်တာ။', "You put your own pot on first. Then you can cook for others."),
      by('yi', 'ပေးတဲ့သူ နာမည် ဘုတ်ပေါ် မရေးဘူး။ ရေးရင် ပေးတာ ပူလာတတ်တယ်။', "I don't write givers' names on a board. Written up, a gift starts to burn."),
      by('yi', 'ကျွန်မလည်း တစ်ခါက ဒီလို ထိုင်စားခဲ့ဖူးတယ်။ အခု ကျွန်မ ချက်တယ်။', "I sat and ate like this myself once. Now I cook."),
      by('yi', 'ဆန်တစ်အိတ် ရောက်လာတယ်။ ဘယ်သူ့လဲ မသိဘူး။ အိုးပြည့်ရင် ပြီးတာပဲ။', "A sack came in. Whose? Don't know. A full pot is all that matters.", { from: 5 }),
      by('yi', 'မိုးခိုလာတဲ့သူ များတယ်။ ခုံ မလောက်ဘူး၊ ထမင်းကတော့ လောက်တယ်။', "Lots of people in from the rain. Not enough stools; enough rice.", RAIN),
    ],
    // Ma Yu Yu's sundries shop
    sundries: [
      by('yuyu', 'ရေငတ်တာကတော့ လူရော ခွေးရော အတူတူပဲ။', "Thirst is thirst, dog or person."),
      by('yuyu', 'ဒီဆိုင်က ဈေးတစ်ဈေးတည်း။ သိတဲ့သူလည်း၊ မသိတဲ့သူလည်း။', "One price in this shop. Known faces or not."),
      by('yuyu', 'မီးခြစ် ဝယ်မလား။ ကိုယ့်မီးဖို ကိုယ်မွှေးမှ နွေးတာ။', "Matches? You light your own stove, you get warm."),
      by('yuyu', 'ခွေးအိုကြီး နေ့လယ်ဆို ရေခွက်နားမှာ အိပ်နေပြီ။', "The old dog naps by the bowls at noon now.", { from: 5 }),
      by('yuyu', 'မိုးရွာရင် ခွေးတွေကို ဆိုင်ရှေ့ ခိုခွင့်ပေးတယ်။ ဆိုင်က ကျဉ်းပေမဲ့။', "When it rains I let the dogs shelter at my door. Small shop or not.", RAIN),
    ],
    // Ko Lwin's carving shop
    carvershop: [
      by('kolwin', 'ကံကောင်းလို့ပါ… ကံကောင်းလို့။', "Luck, that's all… just luck.", { days: [5], notFlag: 'd5.ch10Done' }),
      by('kolwin', 'ပူလာရင် ဆောက် ချထား။ အေးမှ ပြန်ကိုင်။', "Hot? Put the gouge down. Pick it up cool.", { from: 6 }),
      by('kolwin', 'စင်ပေါ်က တုံးဟောင်းက ပြန်ပို့ခံရတဲ့ တုံး။ ဖျောက်စရာ မလိုဘူး။', "That old block on the shelf was sent back. No need to hide it.", { from: 6 }),
      by('kolwin', 'မနေ့ညက သူ့တုံးကို ကိုင်ကြည့်တယ်။ လက်ရာ တကယ်ကောင်းတယ်။', 'Last night I held her block. Truly fine work.', { from: 6 }),
      by('kolwin', 'ဘောင်ကလေးပဲ။ ပုံကတော့ သူ့ဟာ။', "Only the border. The picture's hers.", { flag: 'd14.border' }),
      by('kolwin', 'မိုးရွာတော့ တုံးတွေ အုပ်ထားတယ်။ ဆောက်တွေပဲ သွေးနေတယ်။', 'Rain, so the blocks stay covered. I sharpen the gouges instead.', RAIN),
    ],
  },

  pairs: [
    pair([MK_SELL, MK_SELL], [
      ['မင်းဆိုင် ဒီနေ့ ကုန်သွားပြီလား။', "Your stall sold out today?"],
      ['အင်း။ မင်းဆိုင်လည်း မနက်ဖြန် ကုန်မှာပါ။', "Yep. Yours'll sell out tomorrow."],
      ['ကုန်ကုန် မကုန်ကုန်၊ ကုန်တာ မြင်ရတာ ဝမ်းသာစရာ။', "Either way, it's nice to see stock go."],
    ]),
    pair([MK, MK], [
      ['ကိုယ့်ရေဘူး ကိုယ် အရင်ဖြည့်။', "Fill your own bottle first."],
      ['ဒါဆို ညီမလေးကို ပေးလို့ရပြီလား။', "Then can I give some to my little sister?"],
      ['ရတာပေါ့။ ပေးပြီးရင် ပြန်မတောင်းနဲ့နော်။', "Course. Just don't ask for it back."],
    ]),
    pair([MK, MK], [
      ['ဆေးရေးမြေပုံ ဝယ်လိုက်ပြီ။ မာရာ့လမ်းတဲ့။', "Bought a painted map. Maya's Way."],
      ['ဟုတ်လား။ ကိုယ်တိုင် လျှောက်ကြည့်ပြီးပြီလား။', "Oh? Walked it yourself yet?"],
      ['…မလျှောက်ရသေးဘူး။', "…Not yet."],
    ], { days: [4] }),
    pair(['porter', MK], [
      ['ကိုဖြိုး မနက်က လက်ဖက်ရည် ငှဲ့ပေးတယ်။', "Ko Phyo poured me tea this morning."],
      ['ဘာပြန်ပေးလိုက်လဲ။', "What did you give him back?"],
      ['ဘာမှ မတောင်းဘူး။ လှည့်တောင် မကြည့်ဘူး။', "He asked nothing. Didn't even look round."],
    ], { from: 5 }),
    pair([MK, MK], [
      ['ခွာညို ကူးတာတဲ့။ ကြားလား။', "Khwar Nyo copied, they say. Heard?"],
      ['ကြားတယ်။ မင်း ကိုယ်တိုင် မြင်လား။', "Heard. Did you see it yourself?"],
      ['ဟင့်အင်း… ညတိုင်း ထွင်းနေတာပဲ မြင်တယ်။', "No… I only saw her carving every night."],
      ['ဒါဆို အဲဒါပဲ ပြော။', "Then say that."],
    ], { days: [5] }),
    pair([MK, MK], [
      ['ဆရာလွင့် မီးခိုး ပြန်ထွက်ပြီ။', "Smoke from Teacher Lwin's again."],
      ['တပည့်က ကျော်သွားတော့ မျက်နှာ မကောင်းဘူးလေ။', "He was low, after his pupil passed him."],
      ['အခုတော့ သူ့တပည့်အတွက် ဝမ်းသာနေပြီတဲ့။', "Now he's glad for her, they say."],
    ], { flag: 'd5.ch10Done' }),
    pair(['kolwin', 'khwarnyo'], [
      ['ဘောင်က ဖြောင့်တယ်။', "Your border's straight."],
      ['ဆရာ့လက်ကနေ သင်ခဲ့တာလေ။', "I learned it from your hands."],
      ['အခု မင်းလက်ပဲ။ ဝမ်းသာတယ်။', "They're your hands now. I'm glad."],
    ], { from: 6 }),
    pair([MK_SELL, MK_SELL], [
      ['လေကြီး လာတော့မယ်။ အမိုး ချည်ပြီးပြီလား။', "Wind's coming. Tied your awning?"],
      ['ချည်ပြီးပြီ။ လေကိုတော့ ငါ မတားနိုင်ဘူးလေ။', "Done. Can't stop the wind, can I."],
      ['ကိုယ့်ကြိုး ကိုယ်ချည်ရုံပဲ။', "Just tie your own ropes."],
    ], { days: [6], notFlag: 'd6.gust' }),
    pair(['pwapwa', 'thiri'], [
      ['ဒီနေ့ အလံ မော့မကြည့်တော့ဘူးလား။', "Not looking up at the flag today?"],
      ['ဟင့်အင်း အဖွား။ စွန်က ကိုယ့်တိုင်နဲ့ တက်နေတယ်။', "No, Grandma. My kite's flying from my own post."],
      ['ဒါဆို ထမင်းလာစား။', "Then come and eat."],
    ], { from: 5 }),
    pair([MK_SELL, MK], [
      ['အမိုးအောက် လာခိုလေ။ နေရာ ရှိတယ်။', "Come under the awning. There's room."],
      ['မင်းကုန်တွေ စိုကုန်မယ်။', "Your goods'll get wet."],
      ['ကုန်က ပြန်ခြောက်တယ်။ မင်းက ဖျားမယ်။', "Goods dry out. You'd catch a chill."],
    ], RAIN),
    pair([MK, MK], [
      ['မင်အိုး ငါးအိုး ဝယ်ထားမိတယ်။ မာရာ ပြောတယ်ဆိုလို့။', "I bought five ink jars. 'Maya says', they said."],
      ['မာရာက နင့်ကို ပြောတာလား။', "Did Maya say it to you?"],
      ['…ဟင့်အင်း။ တစ်ယောက်ယောက်ကို တစ်ခါ ပြောတာ။', "…No. To somebody, once."],
    ], { from: 9 }),
    pair([MK, MK], [
      ['ပွဲတံဆိပ်ကို တပည့် တစ်ယောက်တည်း ထွင်းတာ ထင်ခဲ့တာ။', "I thought the launch postmark was all the pupil's work."],
      ['ဘောင်က ဆရာ့လက်ရာ။ နောက်ကျောမှာ နာမည်ပါတယ်။', "The border's the teacher's. His name's on the back."],
      ['ကြားတာနဲ့ ပြောမိတာပဲ။ ဆရာ တပည့် နှစ်ယောက်လုံး ဂုဏ်ယူစရာ။', 'I only said what I heard. Both of them should be proud.'],
    ], { days: [14, 15], flag: 'd14.border' }),
  ],

  arrive: {
    first: maya('(စာရွက်တစ်ရွက်လုံး ဈေးဖြစ်နေတာ။ ခေါက်ရိုးတွေက လမ်းတွေ။)', '(A whole letter turned into a market. Its folds are the lanes.)'),
    again: [
      maya('(ပန့်သံ၊ ကရားသံ၊ ဈေးသည်သံ။ ဒီမှာ ပေးတာတွေ နာမည်မပါဘူး။)', '(Pump, kettle, hawkers. The giving here comes without names.)', { from: 5 }),
      maya('(စွန်တွေ ကိုယ့်ကြိုးနဲ့ကိုယ်။ သူများအလံမှာ မချည်ထားဘူး။)', "(Every kite on its own string. None tied to anyone else's flag.)", { from: 5 }),
      maya('(ဆောက်သံ တချက်ချက်။ ပူရင် ချထား၊ အေးမှ ပြန်ကိုင်။)', '(Tap, tap of gouges. Hot, put it down; cool, pick it up.)', { from: 6 }),
    ],
  },
};

// =================================================================================================
// LEDGER WHARF (opens Day 5; Days 5, 6, 14 and 15 play here)
// =================================================================================================
const wharf = {
  town: [
    wh('ရေစီးက ဘယ်သူ့ကိုမှ မစောင့်ဘူး။ လှော်မလား၊ မျောမလား။', "The current waits for nobody. Pole, or drift.", { from: 6 }),
    wh('လေးတာ လေးတာပဲ။ ညည်းနေရင် ပိုလေးတယ်။', "Heavy is heavy. Grumbling makes it heavier.", { job: 'porter' }),
    wh('ကျွန်တော့် လှေ အဟောင်း။ ဒါပေမဲ့ ကျွန်တော့် လှေ။', "My boat's old. But it's mine.", { job: WH_WATER }),
    wh('ဘယ်မှာ မွေးလဲ ငါ မရွေးခဲ့ဘူး။ ဘယ်လို နေမလဲတော့ ငါ ရွေးတယ်။', "I didn't choose where I was born. How I live, I choose.", { age: 'elder' }),
    wh('နှုတ်ဆက်တာ ပိုက်ဆံ မကုန်ဘူး။ ငါက လူတိုင်းကို အလကား ဝေတယ်။', "A greeting costs nothing. I hand them out free."),
    wh('မုန်းနေရင် ကိုယ့်ညစာပဲ ခါးတယ်။', "Hate someone and it's your own supper that tastes bitter.", { age: 'elder' }),
    wh('မြေကြီးက ဘာချချ မငြင်းဘူး။ ငါလည်း အဲလို နေချင်တယ်။', "The ground takes whatever falls on it. I'd like to be like that."),
    wh('ကျွန်မ အဖေ လှေမရှိဘူး။ ဒါပေမဲ့ ရေကူးတတ်တယ်!', "My dad has no boat. But he can swim!", { age: 'child' }),
    wh('သူများ ဘာပြောပြော လေထဲ လွင့်ပါစေ။ ငါ့ဝန် ငါထမ်းတယ်။', "Whatever folk say, let it blow away. I carry my own load.", { job: 'porter' }),
    wh('ချော်လဲရင် ကိုယ့်အမှား ကိုယ်ဝန်ခံ၊ ပြီးရင် ပြန်ထ။', "Slip up? Own it, then get up."),
    wh('အမေတွေ ကုန်ကျစရိတ် ဘယ်တော့မှ မပြောဘူး။ ဖာရုံပဲ။', "Mothers never talk about the cost. They just patch.", { age: 'elder' }),
    wh('ကူးတို့သားရော ဖောင်သားရော လက်ဖက်ရည် တစ်ဈေးတည်း။', "Ferry folk or raft folk, tea's one price.", { job: 'wmyint' }),
    wh('ချိန်ခွင်က နာမည် မသိဘူး။ ဒေါ်စန္ဒာလည်း မသိဘူး။', "The scale doesn't know names. Neither does Daw Sanda."),
    // Day 5: the raft adrift, the new ferry, the painted bridge
    wh('ဖောင်ဟောင်းလေး ကြိုးနဲ့ မျောနေတယ်။ ဘယ်သူမှ မလှော်ဘူး။', "That old raft just drifts on its rope. Nobody poles it.", { days: [5], notFlag: 'd5.ch2Done' }),
    wh('ကူးတို့အသစ်က မြန်တယ်။ လူတိုင်း အဲဒါပဲ ပြောနေကြတယ်။', "The new ferry's fast. It's all anyone talks about.", { days: [5] }),
    wh('ဖောင်လေး သောင်ပြင်ဘက် ဝင်သွားတယ်။ ကူးတို့ မဝင်နိုင်တဲ့နေရာ။', "The raft got in to the sandbar. Where the ferry can't.", { flag: 'd5.poled' }),
    wh('ဆေးရေးမြေပုံထဲက တံတား ရေပေါ်မှာ မရှိပါဘူး။', "The painted map's bridge? It isn't on the water.", { flag: 'd5.bridge' }),
    wh('ဒေါ်စန္ဒာ့သား အခု မမျောတော့ဘူး။ လှော်နေပြီ။', "Daw Sanda's boy isn't drifting now. He poles.", { from: 6 }),
    wh('အထုပ်သေးသေးလေးတွေ ဆိပ်တိုင်း ရောက်ပြီ။ အရင်က မရောက်ဘူး။', "The little parcels reach every jetty now. They never used to.", { from: 6 }),
    wh('ကျွန်တော်လည်း ကြီးရင် လှော်တက် ကိုင်မယ်။ မမျောဘူး။', "When I'm big I'll hold a pole. No drifting.", { from: 6, age: 'child' }),
    // Day 6: the greeting skipped, then given
    wh('ကိုသီဟ လူတိုင်းကို နှုတ်ဆက်တယ်။ တစ်ယောက်ကလွဲလို့။', "Ko Thiha greets everyone. Everyone but one.", { days: [6], notFlag: 'd6.ch8Done' }),
    wh('နေ့လယ်လေက ကျောက်သင်ပုန်းလေးတွေ ဆိပ်ကမ်းပေါ် ပစ်ချသွားတယ်။', "The noon wind dropped little slates all over the quay.", { days: [6], flag: 'd6.gust' }),
    wh('ဒီနေ့ ကိုသီဟ ကြိမ်ဆိပ်ကို လှမ်းအော်တယ်။ အဘိုးကြီး ခေါင်းညိတ်တယ်တဲ့။', "Ko Thiha called out at Cane Jetty today. The old man nodded, they say.", { flag: 'd6.ch8Done' }),
    wh('ကိုသီဟရဲ့ "နေကောင်းလား" က ဆိပ်ခုနစ်ခုလုံး ကြားရတယ်။', "Ko Thiha's 'keeping well!' carries down all seven jetties.", { from: 7 }),
    wh('ဦးဘိုလေး ကြိမ်စည်းတိုင်း ပြည့်တယ်။ ကိုယ်တိုင် ရေကြည့်ပြီးပြီ။', "Every one of U Bo Lay's bundles is full. I counted myself.", { from: 7 }),
    // Day 8 on
    wh('တံတားပွင့်တော့ ဆိပ်ကမ်း ပိုစည်တယ်။ ဖောင်ရော ကူးတို့ရော အလုပ်ရှိတယ်။', "With the bridge open the quay's busier. Raft and ferry both have work.", { from: 8 }),
    wh('မီးဖိုတန်းက လူတွေ ချုပ်ထားတဲ့ ခေါက်ရိုးကနေ ကူးလာကြတယ်။', "Folk from Hearth Row are coming over the laced-up crease.", { flag: 'd9.crease' }),
    // Day 12: rain
    wh('မိုးရေနဲ့ မြစ်ရေ တက်လာပြီ။ ကြိုးတွေ ပြန်တင်းထား။', "The rain's raising the river. Tighten the lines.", RAIN),
    wh('မိုးက ဘယ်သူ့လှေကိုမှ ရွေးပြီး မစိုဘူး။', "The rain doesn't pick whose boat to soak.", RAIN),
    // Days 14-15
    wh('ဒီနေ့ ဖောင်ပေါ်က ဖိတ်စာ ကိုင်ထားတဲ့သူ ဆိပ်တိုင်းကို လက်ပြသွားတယ်။', "Today someone on the raft waved invitations at every jetty.", { flag: 'd14.ride' }),
    wh('ဦးဘိုလေးလည်း ဖိတ်စာ ရတယ်တဲ့။ မပြုံးဘူး။ အိတ်ထဲ ထည့်သွားတယ်။', "U Bo Lay got an invitation too. Didn't smile. Pocketed it.", { flag: 'd14.boLay' }),
    wh('ဒီည ပွဲ သွားမှာ။ အင်္ကျီကောင်းလေး ဖာထားတယ်။', "Going to the launch tonight. I've patched my good shirt.", { days: [15] }),
  ],

  areas: {
    // Rice, Fish and Wood Jetties, out over the cloud-stream
    jetties: {
      at: { x: 84, z: 450, r: 10 },
      lines: [
        wh('ငါး မရတဲ့နေ့လည်း ရှိတယ်။ မြစ်ကို အပြစ်တင်လို့ ငါး ရလာမလား။', "Some days, no fish. Will blaming the river bring any?", { job: WH_WATER }),
        wh('ဘေးလှေ ငါးပြည့်လာတယ်။ အားကျတယ်၊ မနာလိုဘူး။', "The next boat came in full. Inspired, not jealous.", { job: WH_WATER }),
        wh('ဒီပျဉ်ချပ်တွေ ဘယ်သူ လှူလဲ မသိဘူး။ နင်းရတာ ကျေးဇူးပဲ။', "Don't know who gave these planks. Grateful to walk on them."),
        wh('လှေ ကပ်ရင် ကြိုးလှမ်းပေး။ ဘယ်သူ့လှေလဲ မမေးနဲ့။', "When a boat comes in, throw it a line. Don't ask whose."),
        wh('အရင်က ရေတိမ်ဆိပ်တွေ ပစ်ထားခံရတယ်။ အခု ဖောင်လေး ဝင်လာတယ်။', "The shallow jetties used to get left out. Now the little raft calls.", { from: 6 }),
        wh('ဖောင်ပေါ်က ကောင်လေး ဆိပ်တိုင်း နှုတ်ဆက်သွားတယ်။', "The lad on the raft greets every jetty.", { from: 7 }),
        wh('ပျဉ်ချပ်တွေ ချော်တယ်။ လက်ချင်းဆွဲပြီး လျှောက်ကြ။', "The planks are slippery. Hold hands as you go.", RAIN),
        maya('(ဆိပ်ခုနစ်ခု၊ နှုတ်ဆက်သံ ခုနစ်ခါ။ တစ်ခါမှ မကျော်ဘူး။)', "(Seven jetties, seven greetings. None skipped.)", { flag: 'd6.ch8Done' }),
      ],
    },
    // outside the weigh-house at the quay's north end: Maung Nge's cart, the parcels, the hand scale, the tea stall
    weighHouse: {
      at: { x: 66.5, z: 417, r: 6.5 },
      lines: [
        wh('ချိန်ခွင်က လေးတာကို လေးတယ်လို့ပဲ ပြတယ်။ ဘယ်သူ့အိတ်လဲ မကြည့်ဘူး။', "The scale shows heavy as heavy. It doesn't look whose sack it is."),
        wh('ဒေါ်စန္ဒာ အလှည့်နှစ်ခု ဆင်းတယ်။ တစ်ခါမှ မညည်းဖူးဘူး။', "Daw Sanda works two shifts. Never once complained.", { job: 'porter' }),
        wh('ချိန်ခွင်ရုံထဲ စကားတွေ များတယ်။ လေထဲ လွင့်ပါစေ။', "Lots of talk on that bench inside. Let it blow away."),
        wh('ကျွန်မ အထုပ်သေးလေးကိုလည်း သေတ္တာကြီးတွေလို သေချာ ချိန်ပေးတယ်။', "They weigh my little parcel as carefully as the big crates.", { age: 'child' }),
        wh('ကောင်မလေး အထုပ်မှား ထည့်မိတယ်။ တောင်းပန်ပြီး ကိုယ်တိုင် ပြင်တယ်။', "A girl put a parcel in wrong. Said sorry and fixed it herself.", { flag: 'd6.slate4' }),
        wh('စကားတွေကြားမှာ ကောင်မလေး ပြုံးပြီး ထိုင်နေတယ်။ ကျောက်တုံးလို။', "She sat smiling through all that talk. Like a rock.", { flag: 'd6.slate2' }),
        wh('ဒေါ်စန္ဒာ ညတိုင်း လူတိုင်းကို ကောင်းစေချင်တယ်တဲ့။ ရယ်ခဲ့တဲ့သူကိုပါ။', "Every night Daw Sanda wishes everyone well, they say. Even the one who laughed at her.", { flag: 'd6.ch8Done' }),
        wh('မိုးရွာလည်း ဒေါ်စန္ဒာ အလုပ်ချိန်အတိုင်း ရောက်တယ်။', "Rain or not, Daw Sanda's here on the dot.", RAIN),
        maya('(ချိန်ခွင်က နာမည် မသိဘူး။ ကျွန်မရော လူတွေကို အဲလို ချိန်နိုင်လား။)', "(The scale doesn't know names. Could I weigh people like that?)"),
      ],
    },
    // Net Lane (x 16), from the lane's bend down past Godown Row to the Rope Walk
    netLane: {
      at: { x: 16, z: 442, r: 16 },
      lines: [
        wh('ပိုက်ကွန် ပေါက်ရင် ဖာ။ ရေကို ဆဲလို့ အပေါက် မပိတ်ဘူး။', "Net's torn? Mend it. Cursing the water won't close the hole.", { age: 'elder' }),
        wh('ဒီလမ်းက ကလေးတွေ စာအုပ်နည်းတယ်။ သင်ပေးရင်တော့ တတ်တာပဲ။', "Kids on this lane have few books. Teach them, though, and they learn."),
        wh('အစ်ကိုကြီးက ပိုက်ချည်နည်း သင်ပေးတယ်။ ကျွန်မက ညီလေးကို ပြန်သင်တယ်။', "Big brother taught me to knot nets. I teach my little brother.", { age: 'child' }),
        wh('အိမ်နီးချင်းနဲ့ စကားများတယ်။ မနက် နှုတ်ဆက်လိုက်တော့ ပေါ့သွားတယ်။', "Had words with the neighbour. Said good morning anyway. Felt lighter."),
        wh('ကြိုး ပြတ်ရင် ဆက်ထားတဲ့ အထုံးက ပိုခိုင်တယ်။', "Mend a broken rope and the knot's the strongest part.", { job: 'wkyaw' }),
        wh('ဒီလမ်းက ကလေးတွေ ဒေါ်စန္ဒာ့သားလို လှော်တက် ကိုင်ချင်ကြတယ်။', "The kids on this lane all want a pole like Daw Sanda's boy.", { from: 6 }),
        wh('မီးဖိုတန်းက မုန့်နံ့ ဒီထိ ရောက်တယ်။ ခေါက်ရိုး ချုပ်ပြီးကတည်းက။', "The bread smell from Hearth Row reaches this lane now. Ever since the crease was laced.", { flag: 'd9.crease' }),
        wh('အဝတ်တွေ စိုကုန်ပြီ။ ဘယ်အိမ်မှ မကျန်ဘူး။ ရယ်လိုက်ကြရအောင်။', "Everyone's washing is soaked. No house spared. Might as well laugh.", RAIN),
        maya('(ဒီလမ်းက ကလေးတွေ ကိုယ့်ညီငယ်တွေကို ကိုယ်သင်ကြတယ်။)', "(The children on this lane teach the little ones themselves.)"),
      ],
    },
    // the sandbar across the side channel: Cane Jetty, U Bo Lay's post and his cane shed (by raft only)
    caneShed: {
      at: { x: 86.5, z: 490.5, r: 7 },
      lines: [
        by(['cutterA', 'cutterB'], 'ကြိမ်ကို နေထဲ သုံးရက် လှန်းပြီးမှ စည်းတယ်။ အဘ နည်း။', "Three days in the sun before we bundle. The old man's way."),
        by(['cutterA', 'cutterB'], 'အဘ စကား ကြမ်းတယ်။ ကြိမ်ကတော့ ချောတယ်။', "The old man's tongue is rough. His cane is smooth."),
        by(['cutterA', 'cutterB'], 'ကြိမ်ကို ဘယ်သူ ဝယ်ဝယ် တစ်ဈေးတည်း။ အဘ မကြိုက်တဲ့သူလည်း အတူတူ။', "One price, whoever buys. Even folk he doesn't like."),
        by(['cutterA', 'cutterB'], 'ဖောင်က ကောင်လေး ဒီရောက်ရင် တိတ်သွားတယ်။ ဘာဖြစ်လဲ မသိဘူး။', "The raft lad goes quiet when he gets here. Don't know why.", { days: [6], notFlag: 'd6.ch8Done' }),
        by(['cutterA', 'cutterB'], 'ဒီနေ့ ကောင်လေး အဘကိုလည်း နှုတ်ဆက်တယ်။ အဘ ခေါင်းညိတ်တယ်။', "Today the lad greeted the old man too. He nodded.", { flag: 'd6.ch8Done' }),
        by(['cutterA', 'cutterB'], 'စည်းလျှော့တယ်လို့ ပြောခဲ့ကြတယ်။ စာရင်းဘုတ် ကြည့်ပြီး တိတ်သွားကြတယ်။', "They said he short-tied bundles. One look at the tally board and they went quiet.", { from: 7 }),
        by(['cutterA', 'cutterB'], 'အဘ မိုးထဲ တစ်ယောက်တည်း ကြိမ်ဖုံးနေတာ။ ငါတို့ ပြေးကူတယ်။', "The old man was covering cane alone in the rain. We ran to help.", RAIN),
        maya('(စကားကြမ်းတာ သူ့ဟာ။ နှုတ်ဆက်တာ ကျွန်မဟာ။)', "(His rough words are his. My greeting is mine.)", { from: 7 }),
      ],
    },
    // the Big Jetty, where the new ferry ties up (the ferry itself is the days' own)
    ferry: {
      at: { x: 88, z: 431, r: 8 },
      lines: [
        wh('သင်္ဘောအသစ် ဖြစ်ပေမဲ့ မနက်တိုင်း ရေခပ်ထုတ်ရတယ်။', "New boat or not, she gets bailed every morning."),
        wh('ကူးတို့ပေါ်မှာ ဘယ်သူမှ အရင် ဆင်းခွင့် မရှိဘူး။ အကုန် တန်းစီ။', "Nobody gets off this ferry first. Everybody queues."),
        wh('ကူးတို့က ဆိပ်တိုင်း ရပ်တယ်လို့ ကြားတာပဲ။ ကိုယ်တိုင်တော့ မစီးဖူးဘူး။', 'I heard the ferry stops at every jetty. Never ridden it myself.', { days: [5] }),
        wh('ဖောင်က ကူးတို့ မရောက်တဲ့ဆိပ် ဝင်တယ်။ ကိုယ့်အလုပ် ကိုယ်စီပဲ။', "The raft goes where the ferry can't. Each to its own work.", { from: 6 }),
        wh('ကူးတို့အသစ် ရောက်တော့ ဖောင်ဟောင်းတွေ ပြီးပြီ ထင်ကြတယ်။ မပြီးပါဘူး။', "When the new ferry came, folk thought the old rafts were finished. They weren't.", { from: 6, age: 'elder' }),
        wh('တံတားက ခရီးသည် ယူသွားမယ် ထင်တာ။ ကုန်တွေ ပိုရောက်လာတယ်။', "Thought the bridge would steal the passengers. More cargo came instead.", { from: 8 }),
        wh('ဒီနေ့ ကူးတို့ မထွက်ဘူး။ ရေစီး ကြမ်းတယ်။ စောင့်တာလည်း ရွေးချယ်မှုပဲ။', "No ferry today, the current's rough. Waiting is a choice too.", RAIN),
        maya('(ကူးတို့က မြန်တယ်။ ဖောင်က ရောက်တယ်။ နှစ်ခုလုံး လိုတယ်။)', "(The ferry's fast. The raft arrives. Both are needed.)", { from: 6 }),
      ],
    },
    // Little Jetty, where Daw Sanda's patched raft is tied below her stilt house
    raft: {
      at: { x: 78, z: 466, r: 6.5 },
      lines: [
        wh('ဖာထေးထားတဲ့ ဖောင်ပဲ။ ဖာတိုင်းမှာ အမေ့လက်ရာ ပါတယ်။', "It's a patched raft. Every patch has a mother's hand in it.", { age: 'elder' }),
        wh('ကူးတို့ကို အားကျနေရင် ဖောင်က မရွေ့ဘူး။', "Envy the ferry all you like; the raft won't move."),
        wh('ကောင်လေး ဖောင်ပေါ် ထိုင်ပြီး မြစ်ကို တစ်နေကုန် ကြည့်နေတာ။', "The boy sits on the raft watching the river all day.", { days: [5], notFlag: 'd5.ch2Done' }),
        wh('မျောရင် ဆိပ်တိုင်း ကျော်သွားတယ်။ လှော်ရင် ရောက်တယ်။', "Drift, and you pass every jetty. Pole, and you arrive.", { from: 6 }),
        wh('ကိုသီဟ လှော်တက် ကိုင်ပုံ အမေနဲ့ တူတယ်။', "The way Ko Thiha holds the pole, just like his mum.", { from: 6 }),
        wh('ဖောင်ပေါ်က အသံ ပိုကျယ်လာတယ်။ လူတိုင်းကို နှုတ်ဆက်လို့ နေမှာ။', "The voice from the raft's got bigger. Greeting everyone does that.", { flag: 'd6.ch8Done' }),
        wh('ဖာထားတဲ့နေရာ ရေမဝင်ဘူး။ အမေ့လက်ရာ ခိုင်တယ်။', "Not a drop through the patches. A mother's work holds.", RAIN),
        maya('(မျောနေတဲ့ ဖောင်။ ကြိုးတစ်ချောင်းတည်းနဲ့ ချည်ထားတယ်။)', "(A drifting raft, held by one rope.)", { days: [5], notFlag: 'd5.ch2Done' }),
      ],
    },
  },

  rooms: {
    // the weigh-house (Daw Sanda at the scale; the clerk, porters, a merchant and a child are walk-ons)
    weighhouse: [
      by(['porterA', 'porterB', 'porterC'], 'စကား အမျိုးမျိုး ကြားရတယ်။ နားထဲ ဝင်ပါစေ၊ ရင်ထဲ မထည့်နဲ့။', "You hear all sorts on this bench. Let it in your ears, not your chest."),
      by('merchant', 'ငါ့သေတ္တာကြီးနဲ့ ကလေးအထုပ်လေး ချိန်ခွင် တစ်ခုတည်း။ မှန်ပါတယ်။', "My big crate and a child's parcel, the same scale. That's right."),
      by('child', 'ဒေါ်စန္ဒာက ကျွန်မကိုလည်း လူကြီးလိုပဲ ပြုံးပြတယ်။', "Daw Sanda smiles at me like I'm grown up too."),
      by('clerk', 'စာရင်းထဲမှာ ကြိုက်တဲ့သူ မကြိုက်တဲ့သူ မရှိဘူး။ ဂဏန်းပဲ ရှိတယ်။', "In the ledger nobody's liked or disliked. There are only numbers."),
      by('dawsanda', 'ချိန်ခွင်က နာမည် မသိဘူး။ ကျွန်မလည်း မသိချင်ဘူး။', "The scale doesn't know names. I'd rather not either."),
      by(['porterA', 'porterB', 'porterC'], 'အငြိုးကြီးတယ်လို့ ငါ ပြောခဲ့တာ မှားတယ်။ မကြည့်ဘဲ ပြောမိတာ။', "I said he held a grudge. Wrong. I said it without looking.", { flag: 'd6.ch8Done' }),
      by('child', 'ဖောင်နဲ့ ဆိပ်တိုင်း အထုပ် ရောက်တယ်။ ကျွန်မ အဖွားဆီလည်း ရောက်တယ်။', "Parcels reach every jetty by raft now. Even my granny's.", { from: 6 }),
      by(['porterA', 'porterB', 'porterC'], 'မိုးရွာလို့ ဝန် မထမ်းရဘူး။ ညည်းမလား၊ ကြိုးတွေ ပြင်မလား။', "No loads in this rain. Moan, or mend ropes?", RAIN),
    ],
    // Daw Sanda's stilt house (Ko Thiha; Maya's own eyes)
    sandahouse: [
      maya('(ကြမ်းပြင် ဟောင်းပေမဲ့ သန့်တယ်။ နေ့တိုင်း သုတ်ထားတာ။)', "(Old floorboards, but spotless. Wiped every day.)"),
      maya('(ချုပ်ရိုးလေးတွေ သေးသေး ညီညီ။ ညည်းနေတဲ့သူ့ လက်ရာ မဟုတ်ဘူး။)', "(Small, even stitches. Not the work of someone complaining.)"),
      by('kothiha', 'အမေ ဘယ်တော့မှ "မင်းကြောင့်" လို့ မပြောဘူး။ တစ်ခါမှ။', "Mum's never once said 'because of you'. Not once.", { from: 6 }),
      maya('(စာရင်းအသစ်။ "ကိုယ် ရွေးရမယ့်ဟာ" ဘက်က ပိုရှည်လာတယ်။)', "(A new list. The 'mine to choose' side is getting longer.)", { from: 6 }),
      by('kothiha', 'စာရင်းထဲ နောက်ဆုံးလူကို ထည့်ပြီးတော့ ရင်ထဲ ပေါ့သွားတယ်။', "Once I'd put the last one on my list, my chest felt light.", { flag: 'd6.ch8Done' }),
      by('kothiha', 'အမိုး ယိုတယ်။ အိုး ခံထားလိုက်။ ညည်းနေလို့ အပေါက် မပိတ်ဘူး။', "The roof leaks. Put a pot under it. Moaning won't plug the hole.", RAIN),
    ],
    // U Bo Lay's cane shed (U Bo Lay at his tying bench; two cutters are walk-ons)
    caneshed: [
      by('cutterA', 'အဘ စကား ကြမ်းတယ်။ သင်တာကတော့ အကုန် ပေးတယ်။', "The old man's words are rough. But he teaches everything he knows."),
      by('cutterB', 'ငါတို့ ကြိမ် ဈေးထဲမှာ အကောင်းဆုံး။ ကံကြောင့် မဟုတ်ဘူး၊ လက်ကြောင့်။', "Ours is the best cane in the market. Not luck — hands."),
      by('cutterA', 'အဘက မနက်တိုင်း အရင်ဆုံး ရောက်တယ်။ တစ်ရက်မှ မပျက်ဘူး။', "The old man's first in every morning. Never misses a day."),
      by('cutterB', 'ဓားနဲ့ လက်ပေါက်သွားတယ်။ ကိုယ့်အမှား၊ ကိုယ်ပဲ ပတ်တီး စည်းတယ်။', "Nicked my hand on the knife. My own slip; I bandaged it myself."),
      by('cutterB', 'ဖောင်ကောင်လေးက ငါတို့ကိုတော့ နှုတ်ဆက်တယ်။ အဘကိုကျ တိတ်သွားတယ်။', "The raft lad greets us. Goes quiet at the old man.", { days: [6], notFlag: 'd6.ch8Done' }),
      by('cutterA', 'အဘ ဒီနေ့ "ဟွန်း" ပဲ ပြောတယ်။ ဒါပေမဲ့ ပြုံးချင်သလိုလို။', "The old man only said 'hmph' today. But he nearly smiled.", { flag: 'd6.ch8Done' }),
      by('ubolay', '…ဖိတ်စာ မစိုအောင် ကြိမ်ကြား ညှပ်ထားတာ။ ဘာမှ မဟုတ်ဘူး။', "…Tucked the invitation in the cane so it stays dry. It's nothing.", { flag: 'd14.boLay' }),
      by('cutterA', 'မိုးထဲမှာ အဘက ငါတို့ကို အရင် ပြန်ခိုင်းတယ်။ သူကတော့ နေခဲ့တယ်။', "In the rain the old man sent us home first. He stayed.", RAIN),
    ],
  },

  pairs: [
    pair(['porter', WH], [
      ['ဒီနေ့ မင်းဝန်တွေ ပေါ့တယ်နော်။', "Your loads were light today, eh."],
      ['မနက်ဖြန် မင်းအလှည့်ပေါ့။', "Your turn tomorrow."],
      ['ဟုတ်ပါတယ်။ ညစာ အတူစားမလား။', "Fair enough. Supper together?"],
    ]),
    pair([WH_WATER, WH], [
      ['ငါ့ကို ရယ်ခဲ့တဲ့လူ ဒီနေ့ ငါးအများကြီး ရတယ်။', "The man who laughed at me caught loads today."],
      ['စိတ်တိုလား။', "Annoyed?"],
      ['ဟင့်အင်း။ သူ့ငါး သူ့လုပ်အားကြောင့်။ ငါ့ပိုက် ငါဖာမယ်။', "No. His fish came from his work. I'll mend my net."],
    ]),
    pair([['wwawa'], WH], [
      ['ကူးတို့ကြီး မြန်လိုက်တာ။ ငါတို့ဖောင်တွေ နှေးတယ်။', "The ferry's so fast. Our rafts are slow."],
      ['နှေးလည်း ရောက်ရင် ပြီးတာပဲ။ မျောနေရင်တော့ ဘယ်တော့မှ မရောက်ဘူး။', "Slow's fine if you arrive. Drift, and you never do."],
    ], { days: [5] }),
    pair([WH, ['wwawa']], [
      ['ဘယ်မှာ မွေးလဲ မင်း မရွေးခဲ့ဘူး။', "You didn't choose where you were born."],
      ['ဒါဆို ဘာကို ရွေးလို့ရလဲ။', "Then what can I choose?"],
      ['မနက်ဖြန် ဘာလုပ်မလဲ။ အဲဒါ မင်းဟာ။', "What you do tomorrow. That's yours."],
    ]),
    pair(['porterA', 'porterB'], [
      ['ကိုသီဟ ဦးဘိုလေးကို အငြိုးကြီးတယ်တဲ့။', "Ko Thiha's got a big grudge on U Bo Lay, they say."],
      ['မင်း သူ့မျက်နှာ ကိုယ်တိုင် ကြည့်ဖူးလား။', "Have you looked at his face yourself?"],
      ['…မကြည့်ဖူးဘူး။', "…No."],
    ], { room: 'weighhouse', days: [6], notFlag: 'd6.ch8Done' }),
    pair(['porterA', 'porterB'], [
      ['ကိုသီဟ ဦးဘိုလေးကို နှုတ်ဆက်သွားတယ်။', "Ko Thiha greeted U Bo Lay."],
      ['အဘိုးကြီး ပြန်ပြုံးလား။', "Did the old man smile back?"],
      ['ခေါင်းညိတ်ရုံပဲ။', "Just a nod."],
      ['ဒါလည်း ရပါတယ်။ ပြန်ရဖို့ နှုတ်ဆက်တာမှ မဟုတ်တာ။', "That's fine. You don't greet to get something back."],
    ], { room: 'weighhouse', flag: 'd6.ch8Done' }),
    pair(['clerk', 'dawsanda'], [
      ['ဒီအိတ်က ကုန်သည်ကြီးဟာ။ အရင် ချိန်ပေးရမလား။', "This sack's the big merchant's. Weigh it first?"],
      ['တန်းစီထားတဲ့ အတိုင်းပဲ။ ကလေးအထုပ်က အရင်ရောက်တာ။', "Queue order. The child's parcel came first."],
    ], { room: 'weighhouse' }),
    pair([WH_WATER, WH_WATER], [
      ['ဖောင်ကလေး ငါတို့ ဖောက်သည်တွေ ယူသွားပြီ။', "The raft's taking our customers."],
      ['ရေတိမ်ဆိပ်က ဖောက်သည်တွေလေ။ ငါတို့ မရောက်နိုင်တဲ့နေရာ။', "Shallow-jetty customers. Places we can't reach."],
      ['အင်း… ဒါဆို သူ့အလုပ်ပဲ။', "Hm… his work, then."],
    ], { from: 6 }),
    pair([WH, WH], [
      ['တံတားသစ် ဖွင့်တော့ ဆိပ်ကမ်း အလုပ်ပြုတ်မလား စိုးတယ်။', "I feared the bridge would put the quay out of work."],
      ['ပြုတ်ရင်လည်း နည်းသစ် ရှာမှာပေါ့။ ကြောက်နေလို့ မရဘူး။', "If it did, we'd find a new way. Fear won't help."],
      ['ဒါပေမဲ့ အလုပ် ပိုများလာတယ်။', "But there's more work, not less."],
    ], { from: 8 }),
    pair([WH, WH], [
      ['မိုးက နင့်အိမ်လည်း ယိုလား။', "Your roof leaking too?"],
      ['အကုန်ယိုတယ်။ ဆိပ်ကမ်း တစ်ခုလုံး အတူတူပဲ။', "Everyone's is. The whole quay's the same."],
      ['ဒါဆို အိုးချင်း ငှားကြမယ်။', "Then let's lend each other pots."],
    ], RAIN),
    pair(['cutterA', 'cutterB'], [
      ['အဘကို ဖိတ်စာ ပေးတာ မြင်လား။', "See them give the old man an invitation?"],
      ['အဘ ဘာပြောလဲ။', "What did he say?"],
      ['"ဟွန်း" တဲ့။ ပြီးတော့ သေချာ သိမ်းထားတယ်။', "'Hmph.' Then he put it away carefully."],
    ], { room: 'caneshed', flag: 'd14.boLay' }),
  ],

  arrive: {
    first: maya('(စာရင်းစာရွက်ပေါ်က ဆိပ်ကမ်း။ မျဉ်းတွေကြားမှာ လူတွေ နေကြတယ်။)', '(A wharf on ledger paper. People living between the lines.)'),
    again: [
      maya('(ရေစီးက မမျှဘူး။ ဒါပေမဲ့ လှော်တက်က ကိုယ့်လက်ထဲ။)', "(The current isn't fair. But the pole is in your own hands.)"),
      maya('(ဖာထားတဲ့ ဖောင်။ ဖာရာတိုင်းက လက်မလျှော့ခဲ့တဲ့ နေ့တစ်နေ့။)', "(A patched raft. Every patch, a day someone didn't give up.)", { from: 6 }),
      maya('(စကားကြမ်းတဲ့ အဘိုးရဲ့ ကြိမ်က ချောတယ်။ နှစ်ခုလုံး အမှန်ပဲ။)', '(A rough-tongued old man, smooth cane. Both are true.)', { from: 7 }),
    ],
  },
};

// =================================================================================================
// NEWSPRINT JUNCTION, the Fold (west bridgehead opens Day 7; the east side from Day 8; the press again Day 14)
// =================================================================================================
const junction = {
  town: [
    jn('ကြားတာနဲ့ မြင်တာ မတူဘူး။', "Hearing isn't seeing."),
    jn('ရှေးစကားလည်း မှန်ချင်မှ မှန်တယ်။ စမ်းကြည့်ရတယ်။', "Old sayings are only sometimes right. You test them.", { age: 'elder' }),
    jn('ပုံနှိပ်ထားတိုင်း မှန်တာ မဟုတ်ဘူး။ ကျွန်တော် သယ်နေတာမို့ သိတာ။', "Not everything printed is true. I carry the stuff, I'd know.", { job: 'jkopaing' }),
    jn('ကျွန်မ ပေါင်းလဒ် ကိုယ်တိုင် တွက်တာ။ ဒါပေမဲ့ ပြန်စစ်ရဦးမယ်။', "Did my sum myself. Still need to check it.", { age: 'child' }),
    jn('ကိုယ့်ဘက်က ကြည့်တော့ ကောင်းတယ်။ သူ့ဘက်က ကြည့်ရင်ကော။', "From my side it looked kind. From theirs?"),
    jn('သိချင်ရင် မေး။ မေးတတ်တာလည်း ပညာပဲ။', "Want to know? Ask. Knowing how to ask is knowledge too.", { age: 'elder' }),
    jn('စေတနာ ကောင်းပေမဲ့ မသိရင် ရိုင်းသွားတတ်တယ်။', "Good intentions without know-how can come out rude."),
    jn('ပညာ ရှိပြီး စေတနာ မပါရင် ဘာမှ မထူးဘူး။', "Knowledge without goodwill does no good."),
    jn('ကိုယ့်ဒူးတောင် အပြည့် မယုံရဘူးတဲ့။ စစ်ပြီးမှ မှီ။', "Not even your own knee, they say. Check before you lean."),
    jn('သတင်း လာပြောရင် "ကိုယ်တိုင် မြင်လား" လို့ အရင်မေး။', "When someone brings news, first ask: did you see it?"),
    jn('ဆရာမ ပြောတိုင်း မှန်လားလို့ မေးတော့ "ကိုယ်တိုင် ရှာကြည့်" တဲ့။', "I asked if everything Teacher says is right. She said, 'Find out yourself.'", { age: 'child' }),
    jn('ဟိုအိမ်က စကား ဒီအိမ်ရောက်ရင် နှစ်ဆ ကြီးလာတယ်။', "Gossip doubles in size between one house and the next."),
    // Day 7, the west bank: the boom down, the slates, the rope footbridge
    jn('ကြောက်ရင်း ဖြတ်လည်း ဖြတ်တာပဲ။', "Crossing scared is still crossing.", { days: [7, 8] }),
    jn('ဘားတန်း မတင်ရသေးဘူး။ လူတွေ ဖြတ်ချင်နေကြပြီ။', "The boom's still down. Everyone's itching to cross.", { days: [7], notFlag: 'd7.bridge' }),
    jn('ဘားတန်း တက်သွားပြီ! တံတားမီးတွေ တစ်လုံးချင်း လင်းလာတာ။', "The boom's up! The bridge lamps lit one by one.", { flag: 'd7.bridge' }),
    jn('ကြိုးတံတား ပြတ်တယ်တဲ့။ နှစ်ယောက် လက်ဆွဲ ဖြတ်တာ ငါ မြင်တယ်။', "The rope bridge 'snapped', they said. I saw two cross it hand in hand.", { flag: 'd7.slate6' }),
    // Day 8: the handbill, the hoard, "Maya says", the misprint
    jn('ရွှေမင်တွင်း ခန်းတော့မယ်တဲ့။ ကြော်ငြာစာမှာ ပါတယ်။', "The gold-ink well's drying up. It's on the handbill.", { days: [8], notFlag: 'd8.ch12Done' }),
    jn('မင်အိုး နှစ်အိုး ဝယ်ထားလိုက်တယ်။ ဘာလို့လဲ မမေးနဲ့။ လူတိုင်း ဝယ်လို့။', "Bought two ink jars. Don't ask why. Everyone was.", { days: [8], notFlag: 'd8.ch12Done' }),
    jn('"မာရာ ပြောတယ်" စာရွက်တွေ ဘုတ်ပြည့်နေပြီ။ မာရာကော သိရဲ့လား။', "'Maya says' slips all over the board. Does Maya even know?", { days: [8] }),
    jn('နေ့စဉ်စာရွက်မှာ ကိုးနာရီတဲ့။ ပုံနှိပ်ထားတာ မမှားလောက်ပါဘူး။', "The day sheet says nine. It's printed, so it can't be wrong… can it?", { days: [8], notFlag: 'd8.ch13Done' }),
    jn('တွင်းထဲ ကိုယ်တိုင် ငုံ့ကြည့်တယ်။ ပြည့်နေတာပဲ။ ရှက်လိုက်တာ။', "I looked into the well myself. Full. How embarrassing.", { flag: 'd8.ch12Done' }),
    jn('အမှားပြင်စာ ထွက်ပြီ။ "ကိုယ်တိုင် ကြည့်ခဲ့တယ်: __" တဲ့။', "The correction's out. 'I went and looked: __', it says.", { flag: 'd8.ch13Done' }),
    jn('ဘုတ်ထိပ်မှာ မာရာ့စာကြောင်း။ ဒါကိုလည်း မျက်စိမှိတ် မကူးနဲ့။', "Maya's own line, top of the board. Don't copy that one blindly either.", { flag: 'd8.pinned' }),
    // Day 9 on
    jn('မင်အိုးတွေ တွင်းထဲ ပြန်လောင်းကြတယ်။ လမ်းပေါ်မှာ မင် ပြန်ရလာပြီ။', "Folk poured their jars back. There's ink on the street again.", { from: 9 }),
    jn('မနေ့က ပြည့်တာ ဒီနေ့ ပြည့်ချင်မှ ပြည့်မယ်။ ဒါကြောင့် ဒီနေ့လည်း ကြည့်တယ်။', "Full yesterday doesn't promise full today. So I looked again.", { from: 9 }),
    jn('ကျောင်းမင်အိုး ပြန်ပြည့်ပြီ!', "School ink pots are full again!", { from: 9, age: 'child' }),
    jn('ခြောက်လား ကိုးလား မသေချာရင် မေးတယ်။ ပုံနှိပ်တိုက်က သင်ခန်းစာ။', "Six or nine? Not sure, I ask. A lesson from the press.", { from: 9 }),
    jn('ပုံနှိပ်တိုက်က ကောင်မလေးအသစ်က အံဆွဲ မကိုင်ခင် အရင်မေးတယ်။', "The new girl at the press asks before she touches a drawer.", { from: 10 }),
    // Day 12: rain
    jn('မိုးရေနဲ့ ကြော်ငြာစာတွေ ပျော်ကုန်ပြီ။ အမှန်ကတော့ မပျော်ဘူး။', "The rain's melted the handbills. The truth didn't run.", RAIN),
    jn('မိုးရွာရင် တွင်း လျှံမယ်တဲ့။ ကိုယ်တိုင် ကြည့်ပြီးမှ ပြောမယ်။', "They say the well will overflow in the rain. I'll look before I say.", RAIN),
    // Days 14-15
    jn('ဒီနေ့ စက်သံ မနားဘူး။ စာအုပ်ပွဲအတွက်တဲ့။', "The press hasn't stopped all day. For the book launch, they say.", { days: [14] }),
    jn('ကိုးကားစာမျက်နှာ ရိုက်တယ်တဲ့။ ဘယ်သူ့စကားလဲ နာမည်နဲ့တကွ။', "They've printed a references page. Whose words, with names.", { flag: 'd14.printed' }),
    jn('ဒီည စာအုပ်ပွဲတဲ့။ ပုံနှိပ်တိုက်က လူတွေ အင်္ကျီသစ် ဝတ်ထားကြတယ်။', "Book launch tonight. The press folk have their new shirts on.", { days: [15] }),
  ],

  areas: {
    // the notice-board square: the gold-ink well on the fold crease, two benches facing across a painted 6
    square: {
      at: { x: 151, z: 307, r: 10 },
      lines: [
        jn('ဒီဘက်က ကြည့်ရင် ခြောက်။ ဟိုဘက် ခုံကနေ ကိုး။ ပုံက တစ်ပုံတည်း။', "From this bench it's a six. From that one, a nine. Same painting.", { age: 'child' }),
        jn('သတင်းစာ ဝယ်မလား။ ဖတ်ပြီးရင် ကိုယ်တိုင် ပြန်စဉ်းစား။', "Paper? Read it, then think it over yourself."),
        jn('တန်းရှည်တာနဲ့ တွင်းခန်းတာ မတူဘူး။', "A long queue isn't an empty well.", { flag: 'd8.wellSeen' }),
        jn('ခိုတွေ တွင်းနားမှာ ရှိနေတုန်း။ အဖေ့စကားကိုလည်း ကြည့်ပြီးမှ။', "The pigeons are still by the well. Even Father's saying, I check.", { from: 8, age: 'elder' }),
        jn('ငါ မင်ခပ်မယ်။ ကုန်မှာ ကြောက်လို့။ နင်ရော။', "I'm dipping ink. Scared it'll run out. You?", { days: [8], notFlag: 'd8.ch12Done' }),
        jn('အပေါ်ကနေ တတိယ အကွင်းအထိ ရှိတယ်။ ကိုယ်တိုင် ကြည့်ခဲ့တယ်။', "Up to the third ring from the top. I looked myself.", { flag: 'd8.wellSeen' }),
        jn('ကြော်ငြာစာ ရိုက်ခိုင်းတဲ့ အဒေါ်တောင် ကိုယ်တိုင် လာကြည့်တယ်တဲ့။', "Even the aunty who paid for the handbill came to look herself.", { flag: 'd8.ch12Done' }),
        jn('ဒီနေ့ တန်းမစီရတော့ဘူး။ လိုသလောက်ပဲ ခပ်ကြတယ်။', "No queue today. Folk dip only what they need.", { from: 9 }),
        jn('မိုးထဲမှာ တွင်းနား လူမရှိဘူး။ မင်ကတော့ ရှိနေတုန်းပဲ။', "Nobody at the well in the rain. The ink's still there.", RAIN),
        maya('(ဒီနေ့ ပြည့်တယ်။ မနက်ဖြန်လည်း ကြည့်ဦးမယ်။)', "(Full today. I'll look again tomorrow.)", { flag: 'd8.wellSeen' }),
      ],
    },
    // in front of the Gold Ink Press (its easel slate by the double doors)
    press: {
      at: { x: 172, z: 299.5, r: 5.5 },
      lines: [
        jn('စာလုံးတုံး ပြောင်းပြန်ဆို ခြောက်က ကိုး။ သေးတယ်၊ ဒုက္ခက ကြီးတယ်။', "Flip a type block and six turns nine. A small thing, a big mess.", { flag: 'd8.ch13Done' }),
        jn('နှစ်လေးဆယ် ပုံနှိပ်လာတဲ့ လက်တောင် မှားတတ်တာပဲ။', "Even a hand with forty years at the press can slip.", { age: 'elder' }),
        jn('ပုံနှိပ်စာက သေချာပုံ ပေါက်တယ်။ မှားရင်လည်း သေချာပုံနဲ့ မှားတာ။', "Print always looks certain. When it's wrong, it looks just as certain."),
        jn('ကောင်လေးက ရှင်းပေးချင်လို့ပါ။ ဆရာကြီးကတော့ စော်ကားတယ် ထင်တယ်။', "The lad meant to help. The old printer took it as a slight.", { days: [8], notFlag: 'd8.ch13Done' }),
        jn('ဆရာကြီးနဲ့ ကောင်လေး အတူ စာစီနေကြတယ်။ ကောင်လေး မေးတတ်လာပြီ။', "The old printer and the lad are setting type together. The lad's learned to ask.", { flag: 'd8.ch13Done' }),
        jn('ဆရာကြီးလည်း ဖြေတတ်လာတယ်တဲ့။ "ကြိုက်သလို လုပ်" မပြောတော့ဘူး။', "The old printer's learning to answer too. No more 'do what you like'.", { from: 9 }),
        jn('ကောင်မလေးအသစ်က ကိုယ့်သော့နဲ့ ကိုယ့်သေတ္တာ ဖွင့်တယ်။', "The new girl opens her own locker with her own key.", { from: 10 }),
        jn('ကောင်မလေးက ကိုယ့်ဘာသာ ဆုံးဖြတ်လိုက်တယ်တဲ့။ ဘယ်သူမှ မပြောပေးရဘူး။', "She made up her own mind, they say. Nobody had to tell her.", { flag: 'd14.ncChoice' }),
        jn('မိုးစိုရင် စက္ကူ ကောက်တယ်။ ဒီနေ့ ပုံမနှိပ်ဘဲ စာလုံး ပြန်စီတယ်။', "Damp paper cockles. No printing today; they're sorting type.", RAIN),
        maya('(ပုံနှိပ်စာက သေချာပုံ ပေါက်တယ်။ ပေါက်ရုံပဲ။)', "(Print looks certain. Only looks.)", { from: 8 }),
      ],
    },
    // Ink Lane along the bottom of the page: houses, a paper-cutter's, a bicycle-repair shop, the fritter kerb
    inkLane: {
      at: { x: 152, z: 339, r: 16 },
      lines: [
        jn('ချက်နည်းဟောင်းကို ယုံတယ်။ ဆားကတော့ နေ့တိုင်း မြည်းတယ်။', "I trust the old recipe. The salt, I taste every day.", { job: 'jmanu' }),
        jn('အစ်ကိုက ဘီး ပြင်ပေးမယ်တဲ့။ မသိဘဲ ပြင်တော့ ပိုပျက်သွားတယ်။', "My brother offered to fix my bike. Didn't know how. Now it's worse.", { age: 'child' }),
        jn('ကူချင်ရင် အရင် မေး။ "ကူရမလား" ဆိုတာ စကားတစ်ခွန်းပဲ။', "Want to help? Ask first. 'Shall I help?' is only a few words."),
        jn('ယောက်ျားက ကူမယ်ဆိုပြီး စာအုပ်တွေ စီတယ်။ အခု ဘာမှ ရှာမတွေ့ဘူး။', "My husband 'helped' by tidying my books. Now I can't find a thing.", { job: ['jdawsabai', 'jmanu'] }),
        jn('ဆိုင်တွေမှာ မင် ကုန်ပြီ။ အိမ်တိုင်းမှာတော့ အိုးတွေ ပြည့်နေတယ်။', "The stalls are out of ink. Every house has jars full.", { days: [8], notFlag: 'd8.ch12Done' }),
        jn('အိမ်က မင်အိုးတွေ ထုတ်ပြီး အိမ်နီးချင်းတွေကို ဝေလိုက်တယ်။', "Took my jars out and shared them round the neighbours.", { from: 9 }),
        jn('ဘယ်သူ ပြောပြော ကိုယ့်မျက်စိနဲ့ ကြည့်မှ။ ဒီလမ်းမှာ အကျင့် ဖြစ်နေပြီ။', "Whoever says it, look with your own eyes. It's a habit on this lane now.", { from: 10 }),
        jn('မိုးဝင်တော့ အိမ်နီးချင်းတွေ ကူကြတယ်။ ဘယ်လိုကူရမလဲ အရင်မေးတယ်။', "When the rain came in, the neighbours helped. They asked first how.", RAIN),
        maya('(ကူချင်တဲ့ စေတနာ၊ ကူတတ်တဲ့ ပညာ။ နှစ်ခုလုံး လိုတယ်။)', "(Wanting to help, knowing how. Both are needed.)"),
      ],
    },
    // the west bridgehead square at the end of the Market road: the board, the boom, the hut, the rope footbridge
    bridgeHead: {
      at: { x: 70, z: 300, r: 10 },
      lines: [
        by(HANDS, 'ကြောက်တာ ရပါတယ်။ ကြောက်ရင်း လျှောက်တာလည်း လျှောက်တာပဲ။', "Being scared is fine. Walking scared is still walking.", { days: [7] }),
        by(HANDS, 'ကြိုးတံတားဟောင်းကို မဖြုတ်ဘူး။ ကြောက်တတ်တဲ့သူ လေ့ကျင့်ဖို့။', "We're keeping the old rope bridge. For the scared ones to practise on.", { days: [7], flag: 'd7.bridge' }),
        by(HANDS, 'ကျောက်သင်ပုန်းတွေ ပိုင်ရှင် စီတဲ့အတိုင်း။ စာအုပ်အတိုင်း မဟုတ်ဘူး။', "The slates hang in their owner's order, not the book's.", { days: [7], flag: 'd7.bridge' }),
        by(HANDS, 'ကြောက်ရင်းနဲ့ ကလေးလက်ကို ဆွဲပြီး ပြန်လာတယ်။ သတ္တိ အစစ်ပဲ။', "Scared stiff, she still brought the little one back by the hand. Real courage.", { days: [7], flag: 'd7.slate6' }),
        jn('တံတားက လမ်းကိုပဲ ပေးတယ်။ ဖြတ်တာကတော့ ကိုယ့်ခြေ။', "A bridge only gives you the way. The crossing is your own feet.", { age: 'elder' }),
        jn('ဟိုဘက်ကမ်းကို ဒီကနေ ကြည့်ရုံပဲ။ ဘယ်လိုလဲ ဆိုတာ မသိသေးဘူး။', "From here you can only look at the far bank. Nobody can say yet what it's like.", { days: [7] }),
        jn('ပုံနှိပ်နေ့ဆို တံတား ပိတ်တယ်တဲ့။ ကျွန်မ နေ့တိုင်း ဖြတ်နေတာပဲ။', "Shut on printing days? I cross it every day.", { from: 9 }),
        jn('ဘုတ်က သော့ချိတ် နှစ်ခု ဗလာ။ ပိုင်ရှင်တွေ ကိုယ့်သော့ ကိုယ်ယူသွားကြပြီ။', "Both key hooks on the board are empty. The owners took their own keys.", { from: 9 }),
        jn('မိုးထဲမှာ တံတား ချော်တယ်။ ဖြည်းဖြည်း၊ ကိုယ့်ခြေ ကိုယ်ကြည့်။', "The bridge is slippery in the rain. Slowly; watch your own feet.", RAIN),
        maya('(ဟိုဘက်ကမ်း ကျွန်မ ထင်သလို ဖြစ်မှာ မဟုတ်ဘူး။)', "(The far bank won't be the way I imagine.)", { days: [7] }),
      ],
    },
    // in front of the Junction school (green double doors under a hand bell)
    school: {
      at: { x: 159.6, z: 299.5, r: 4.5 },
      lines: [
        jn('ဆရာမ ပြောတာကိုလည်း ပြန်မေးလို့ ရတယ်တဲ့။', "We're allowed to ask back, even Teacher.", { age: 'child' }),
        jn('ကျွန်မ ပေါင်းလဒ် မှားနေတာ။ ပြန်တွက်တော့ မှန်သွားတယ်။', "My sum was wrong. Did it again, now it's right.", { age: 'child' }),
        jn('ကလေးတွေကို အဖြေ မပေးဘူး။ ရှာနည်းပဲ ပေးတယ်။', "They don't give the children answers. Just how to find them.", { age: ['adult', 'elder'] }),
        jn('ကျောင်းမင်အိုး ဗလာ။ ဆိုင်တွေမှာ မရှိဘူးတဲ့။', "School ink pots empty. None in the shops, they say.", { days: [8], notFlag: 'd8.ch12Done' }),
        jn('မိုးမိုးက တွင်းကို ကိုယ်တိုင် သွားကြည့်တယ်။ ပြည့်နေတာတဲ့!', "Moe Moe went and looked at the well herself. Full, she says!", { flag: 'd8.ch12Done' }),
        jn('ကျောင်းမင်အိုးတွေ ပြည့်ပြီ! ဒီနေ့ လက်ရေး ကျင့်မယ်။', "Ink pots full! Handwriting practice today.", { from: 9, age: 'child' }),
        maya('(ဒီကလေးတွေ မေးခွန်း မေးတတ်တယ်။ အဖြေထက် ပိုအရေးကြီးတယ်။)', "(These children know how to ask. That matters more than answers.)"),
      ],
    },
    // by Ma Thida's narrow blue door and the red bridge-box at the bridge foot
    letterRoom: {
      at: { x: 124, z: 300, r: 5 },
      lines: [
        jn('စာရေးခိုင်းတော့ "ကိုယ်တိုင် မြင်လား" တဲ့။ မျက်နှာပူသွားတယ်။', "I asked her to write it down; she asked if I'd seen it myself. I went red."),
        jn('ကြားတာကို စာထဲ ထည့်ရင် ကြားတာလို့ပဲ ရေး။', "If you put hearsay in a letter, write it as hearsay."),
        jn('ရှစ်နာရီ ထည့်ခဲ့တာ။ နောက်ကျသွားပြီတဲ့။', "Posted at eight. Missed it, they say.", { days: [8], notFlag: 'd8.ch13Done' }),
        jn('ပုံးပေါ်က ခြောက်နာရီ ဆိုတာ မှန်တယ်။ စာရွက်က မှားတာ။', "The box says six, and six it is. The sheet was wrong.", { from: 9 }),
        jn('မာရာ ပြောတယ်ဆိုလည်း ကိုယ့်အတွက် ဟုတ်လား စဉ်းစားရတယ်။', "Even if Maya said it, you think whether it's right for you.", { from: 8 }),
        jn('မိုးထဲ စာလာရေးခိုင်းတဲ့သူ များတယ်။ ကြားတာ မဟုတ်ဘဲ မြင်တာတွေ။', "Lots of people come in from the rain to have letters written. What they saw, not what they heard.", RAIN),
        maya('(ကြားတာကို ကြားတာလို့ ရေးတဲ့ စာ။ ရိုးသားတယ်။)', "(A letter that writes hearsay as hearsay. That's honest.)", { from: 8 }),
      ],
    },
  },

  rooms: {
    // the bridge hands' hut (Days 7-8; the two hands, Nay Chi, Maya)
    bridgehut: [
      by(HANDS, 'ဖွင့်ပွဲ လက်ဖက်ရည်က ဘယ်သူ့အတွက်လဲ မမေးဘူး။ ငှဲ့ရုံပဲ။', "Opening tea's for whoever's here. We just pour."),
      by(HANDS, 'ကြောက်တဲ့သူကို လှောင်လို့ ဘာရမလဲ။ လက်ကမ်းပေးလိုက်။', "What's the use mocking the scared? Hold out a hand."),
      by(HANDS, 'ကိုယ့်ဘုတ် ကိုယ်စီ။ ငါတို့ စီမပေးဘူး။', "Your board, your order. We don't arrange it for you."),
      by(HANDS, 'ဘားတန်းကို ငါတို့ တင်ပေးတာ။ ဖြတ်တာကတော့ သူတို့ ခြေထောက်။', "We winched the boom up. The crossing's their own feet.", { flag: 'd7.bridge' }),
      by(HANDS, 'မနက်တိုင်း ပထမ ဖြတ်တဲ့သူ ကြည့်ရတာ ပျော်တယ်။ တူတူ မဖြတ်ကြဘူး။', "I love watching the first one across each morning. Nobody crosses the same way.", { from: 8 }),
      maya('(နံရံက တံတားပုံ။ ဆွဲတဲ့သူက ဖြတ်မယ့်သူ မဟုတ်ဘူး။)', "(The bridge plan on the wall. The one who drew it isn't the one who'll cross.)"),
      maya('(ဒီစားပွဲမှာ စကားတွေ ပြောခဲ့တယ်။ ဆုံးဖြတ်တာကတော့ သူ့ဘာသာ။)', "(We talked at this table. The deciding was hers.)", { from: 8 }),
    ],
    // Ma Thida's letter room (Ma Thida; Moe Moe in the doorway once the well is seen)
    letterroom: [
      by('thida', 'ကြားခဲ့တာ ရေးမယ်ဆိုရင် "ကြားတာ" လို့ပဲ ရေးမယ်နော်။', "If we write what you heard, I'll write it as heard."),
      by('thida', 'အမေ ပြောတိုင်း မှန်တယ် ထင်ခဲ့တာ။ အမေကိုယ်တိုင်က "သွားကြည့်" တဲ့။', "I thought everything Mum said was right. Mum herself said, 'Go and look.'"),
      by('thida', 'မင် အများကြီး ရှိတယ်။ မာရာ ပြောတဲ့အတိုင်း သိမ်းထားတာ။', "Plenty of ink here. Kept back, the way Maya said.", { days: [8], notFlag: 'd8.ch12Done' }),
      by('thida', 'မာရာ့စကားလည်း ကိုယ်တိုင် စစ်ရမှာပဲ။ မာရာကိုယ်တိုင် ပြောတာလေ။', "Even Maya's words need checking. Maya said so herself.", { flag: 'd8.ch12Done' }),
      by('thida', 'ဒီနေ့ စာတွေထဲ "ကိုယ်တိုင် သွားကြည့်ခဲ့တယ်" ဆိုတဲ့ စာကြောင်း ပါလာတယ်။', "Today's letters have a new line: 'I went and looked myself.'", { flag: 'd8.ch12Done' }),
      by('moemoe', 'တွင်းကို ကိုယ်တိုင် ကြည့်ခဲ့ပြီ! ပေါင်းလဒ်ကို ပြန်တွက်မယ်။', "I looked at the well myself! I'm redoing my sum.", { flag: 'd8.wellSeen' }),
      by('thida', 'ဘာပျက်လဲ မမြင်ရသေးရင် မရေးသေးဘူး။', "If I haven't seen what the rain spoiled, I won't write it yet.", RAIN),
    ],
    // Daw Sein's tea shop (Daw Sein, U Kan, Daw Hla; two drinkers are walk-ons)
    junctiontea: [
      by('drinker1', 'သတင်း တစ်ခွက်၊ အမှန် တစ်ဇွန်း။ မွှေလိုက်ရင် ခွဲမရတော့ဘူး။', "One cup of news, one spoon of truth. Stir it in and you can't tell them apart."),
      by('drinker2', 'ငယ်ငယ်က ကြားခဲ့တာ အကုန်မှန်ရင် ကမ္ဘာကြီး ပျက်နေလောက်ပြီ။', "If everything I heard as a boy were true, the world would have ended by now."),
      by('drinker2', 'မင်အိုး တစ်အိုး ထပ်ဝယ်ရမလား။ လူတိုင်း ဝယ်နေကြတယ်။', "Should I buy another jar? Everyone is.", { days: [8], notFlag: 'd8.ch12Done' }),
      by('sein', 'စုထားတာ ပြန်လွှတ်လိုက်တော့ ကိုယ်ပဲ ပေါ့သွားတာ။', "I let go of what I'd hoarded, and I'm the one who feels lighter.", { from: 9 }),
      by('kan', 'ရှေးစကား မှားတာ မဟုတ်ဘူး။ ဒီနေ့နဲ့ မကိုက်တာ။', "The old saying isn't wrong. It just doesn't fit today.", { from: 9 }),
      by('dawhla', 'ကောင်းတာတွေ မခံဘူးလို့ ပြောခဲ့တာ။ တွင်းကတော့ ခံနေတာပဲ။', "I said good things never last. The well's lasting.", { from: 9 }),
      by('drinker2', '"မာရာ ပြောတယ်" စာရွက်တွေ မတွေ့ရတော့ဘူး။ ကိုယ့်စကား ကိုယ်ပြောကြပြီ။', "No more 'Maya says' slips. Folk speak for themselves now.", { from: 10 }),
      by('drinker1', 'မိုးရွာရင် ဒီဆိုင် ပြည့်တယ်။ သတင်းလည်း ပြည့်တယ်။ စစ်ပြီးမှ ယူ။', "Rain fills this shop. With rumours, too. Check before you take one.", RAIN),
    ],
    // the Junction school (Moe Moe; two pupils and the teacher are walk-ons)
    schoolroom: [
      by('pupil1', 'ဆရာမ၊ ဒါ ဘာလို့ မှန်တာလဲ။', "Teacher, why is that right?"),
      by('teacher', 'အဖြေ မှတ်ရုံနဲ့ မပြီးဘူး။ ဘာကြောင့်လဲ သိရမယ်။', "Remembering the answer isn't enough. Know why."),
      by('teacher', 'တစ်ယောက်က ခြောက်၊ တစ်ယောက်က ကိုး။ နှစ်ယောက်လုံး နားထောင်ရတယ်။', "One reads six, one reads nine. I have to listen to both."),
      by('pupil1', 'မင်အိုး ဗလာ။ ဒီနေ့ မြေဖြူနဲ့ပဲ ရေးမယ်။', "Empty ink pot. Chalk today.", { days: [8], notFlag: 'd8.ch12Done' }),
      by('pupil2', 'မိုးမိုး တွက်တဲ့ အဆင့်တွေ မှန်တယ်။ စတာကမှ မှားတာ။', "Moe Moe's steps were right. She started from a wrong idea.", { flag: 'd8.ch12Done' }),
      by('pupil2', 'မင်အိုး ပြည့်ပြီ! ကိုယ်တိုင် တွင်းက ခပ်လာတာ။', "My ink pot's full! I dipped it at the well myself.", { from: 9 }),
      by('moemoe', 'ကိုယ့်ပေါင်းလဒ်ကိုလည်း စစ်ရတယ်။ အခု အမြဲ ပြန်စစ်တယ်။', "Even my own sums need checking. I always check now.", { from: 9 }),
      by('pupil1', 'အမိုး ဘယ်နားက ယိုလဲ ဆရာမ မသိဘူး။ ကျွန်တော်တို့ လိုက်ရှာပေးတယ်။', "Teacher didn't know where the roof leaked. We went looking.", RAIN),
    ],
    // the Gold Ink Press (U Tint, Ko Wunna; on Day 14 Nay Chi and the newcomer)
    press: [
      by('kowunna', 'ကျွန်တော့်ဘက်က သပ်ရပ်တာ၊ ဦးတင့်ဘက်က ပြောင်းပြန်။ အခု သိပြီ။', "Tidy from my side, upside down from his. I know that now.", { flag: 'd8.ch13Done' }),
      by('kowunna', 'အံဆွဲ မကိုင်ခင် မေးတယ်။ ဘာလို့လဲ ဆိုတာပါ မေးတယ်။', "I ask before I touch a drawer. And I ask why.", { from: 9 }),
      by('utint', 'ငါ ဖြေတာ ရှည်လာတယ်။ "ကြိုက်သလို လုပ်" မပြောတော့ဘူး။', "My answers are longer now. No more 'do what you like'.", { from: 9 }),
      by('utint', 'ရွှေတုံးကို ကျောက်ခဲထင်ပြီး ပစ်တတ်ကြတယ်။ မသိရင် အရင်မေး။', "Folk toss out a gold nugget thinking it's a pebble. If you don't know, ask first.", { from: 9 }),
      by('newcomer', 'ဒီနေ့မှ ရောက်တာ။ မေးလို့ရလားလို့ မေးတော့ ရတယ်တဲ့။', "First day here. I asked if I may ask. They said yes.", { days: [14] }),
      by('utint', 'စကားတိုင်းနောက်မှာ ပိုင်ရှင်နာမည်။ စကားက သူတို့ဟာ။', "An owner's name after every saying. The words are theirs.", { flag: 'd14.printed' }),
      by('kowunna', 'နေခြည် ကိုယ့်ဘာသာ ဆုံးဖြတ်လိုက်တယ်။ ကျွန်တော်တောင် အံ့သြတယ်။', "Nay Chi made up her own mind. Even I was surprised.", { flag: 'd14.ncChoice' }),
      by('kowunna', 'စက္ကူတွေ အပေါ်စင် တင်ထားတယ်။ ဘယ်ဟာအရင်လဲ ဦးတင့်ကို မေးပြီးမှ။', "Moved the paper up high, away from the wet. Asked U Tint which first.", RAIN),
    ],
  },

  pairs: [
    pair([JN, ['jywet']], [
      ['ရှေးလူကြီးတွေ ပြောခဲ့တာ…', "The old folk used to say…"],
      ['သူတို့ ကိုယ်တိုင် မြင်ခဲ့လား။', "Did they see it themselves?"],
      ['…အဲဒါတော့ မမေးဖူးဘူး။', "…I never asked."],
    ]),
    pair([['jywet'], JN], [
      ['အဲဒါ ခြောက်!', "That's a six!"],
      ['ဒီကနေ ကြည့်ရင် ကိုး။', "From here it's a nine."],
      ['နေရာ လဲထိုင်ကြည့်မလား။', "Swap benches?"],
      ['…ဟာ။ မင်းဘက်က ခြောက်ပဲ။', "…Oh. From your side it's a six."],
    ], { from: 8 }),
    pair([HANDS, HANDS], [
      ['ကြိုးတံတား ပြတ်ပြီတဲ့။', "They say the rope bridge snapped."],
      ['မင်း ကိုယ်တိုင် ကြည့်ပြီးပြီလား။', "Did you look yourself?"],
      ['မကြည့်ရသေးဘူး။', "Not yet."],
      ['ဒါဆို "တဲ့" ပဲ ကျန်တာပေါ့။', "Then all you've got is 'they say'."],
    ], { days: [7] }),
    pair(['drinker1', 'drinker2'], [
      ['တွင်း ခန်းတော့မယ်တဲ့။ ကြော်ငြာစာ ဖတ်ပြီးပြီလား။', "The well's drying up. Read the handbill?"],
      ['ဖတ်ပြီးပြီ။ တွင်းကိုရော ကြည့်ပြီးပြီလား။', "I read it. Looked at the well?"],
      ['ပုံနှိပ်ထားတာပဲ။ ကြည့်စရာ လိုသေးလား။', "It's printed. Do I need to?"],
    ], { room: 'junctiontea', days: [8], notFlag: 'd8.ch12Done' }),
    pair(['kan', 'dawhla'], [
      ['ခိုတွေ တွင်းနားမှာ ရှိနေတုန်းပဲ။', "The pigeons are still at the well."],
      ['မင်လည်း ရှိနေတုန်းပဲ။ ကောင်းတာတွေ ခံတတ်သားပဲ။', "So is the ink. Good things can last after all."],
      ['ဒါဆို ကြော်ငြာစာ အသစ် ရိုက်မလား။', "Print a new handbill, then?"],
      ['ဟင့်အင်း။ လူတွေကို ကိုယ်တိုင် လာကြည့်ခိုင်းမယ်။', "No. I'll tell people to come and look themselves."],
    ], { room: 'junctiontea', flag: 'd8.ch12Done' }),
    pair([JN, JN], [
      ['တွင်းထဲ ကိုယ်တိုင် ငုံ့ကြည့်ခဲ့တယ်။', "I looked into the well myself."],
      ['ဘယ်လိုလဲ။', "And?"],
      ['ပြည့်နေတယ်။ ဒီနေ့တော့။', "Full. Today, anyway."],
      ['မနက်ဖြန်လည်း ကြည့်ဦး။', "Look again tomorrow."],
    ], { flag: 'd8.ch12Done' }),
    pair([JN, JN], [
      ['မာရာ ပြောတယ်ဆိုရင် ယုံရမှာပေါ့။', "If Maya says it, you believe it."],
      ['မာရာက ဘယ်သူ့ကို ပြောတာလဲ။ ဘာအတွက်လဲ။', "Who did Maya say it to? What for?"],
      ['…အဲဒါ မသိဘူး။', "…Don't know."],
      ['ဒါဆို မာရာ့စကား ဖြစ်သေးတာ မဟုတ်ဘူး။', "Then it isn't really Maya's word yet."],
    ], { from: 8 }),
    pair(['utint', 'kowunna'], [
      ['ဘာလုပ်ချင်လဲ။ ပြောပါဦး။', "What do you want to do? Tell me."],
      ['အံဆွဲတွေ ပြန်စီချင်တယ်။ ဆရာ့ဘက်က မှန်အောင်။', "Re-sort the drawers. The right way up for you."],
      ['အခု မဟုတ်ဘူး။ ညနေ အတူ လုပ်မယ်။', "Not now. We'll do it together this evening."],
    ], { room: 'press', from: 9 }),
    pair([JN, JN], [
      ['ဦးတင့်နဲ့ ကောင်လေး ပြန်တည့်သွားပြီ။', "U Tint and the lad are getting on again."],
      ['ဘယ်သူ မှန်တာလဲ။', "Who was right?"],
      ['နှစ်ယောက်လုံး။ ကြည့်တဲ့ဘက် မတူတာ။', "Both. They were looking from different sides."],
    ], { flag: 'd8.ch13Done' }),
    pair(['pupil1', 'pupil2'], [
      ['ဆရာမ ပြောတာ အမြဲမှန်လား။', "Is Teacher always right?"],
      ['မေးကြည့်လေ။', "Ask her."],
      ['မေးပြီးပြီ။ "ကိုယ်တိုင် ရှာကြည့်" တဲ့။', "I did. She said, 'Find out yourself.'"],
    ], { room: 'schoolroom' }),
    pair([JN, JN], [
      ['တွင်း လျှံပြီတဲ့!', "The well's overflowing, they say!"],
      ['ဘယ်သူ ပြောတာလဲ။', "Who says?"],
      ['…ဟုတ်ပါပြီ။ ထီးယူပြီး ကိုယ်တိုင် ကြည့်မယ်။', "…Fine. I'll take an umbrella and look myself."],
    ], RAIN),
    pair([['jkopaing'], JN], [
      ['ကောင်မလေး ဘယ်သူ့ကို မေးပြီး ဆုံးဖြတ်တာလဲ။', "Who did the girl ask before she decided?"],
      ['ဘယ်သူ့ကိုမှ မစောင့်ဘူး။ ကိုယ့်ဘာသာ။', "She didn't wait on anyone. Her own call."],
      ['သူ့သော့က သူ့လက်ထဲ ရှိနေပြီပဲ။', "Her key's in her own hand now."],
    ], { flag: 'd14.ncChoice' }),
  ],

  arrive: {
    first: maya('(သတင်းစာ စာမျက်နှာပေါ် ရောက်ပြီ။ ရေးထားတိုင်း မှန်လား။)', '(A newspaper page now. Is everything written here true?)'),
    again: [
      maya('(ခြောက်လား ကိုးလား။ ဘယ်ခုံမှာ ထိုင်လဲ ဆိုတာနဲ့ ဆိုင်တယ်။)', '(Six or nine. It depends which bench you sit on.)', { from: 8 }),
      maya('(ပုံနှိပ်စာ သေချာပုံပေါက်တယ်။ သေချာတာနဲ့ မှန်တာ မတူဘူး။)', "(Print looks certain. Certain isn't the same as true.)", { from: 8 }),
      maya('(ဒီဘုတ်အောက်မှာ တစ်ယောက် တစ်နေကုန် စောင့်ဖူးတယ်။ ကျွန်မစကားကို။)', '(Someone once waited a whole day under this board. For my words.)', { from: 9 }),
    ],
  },
};

export const LINES_B = { market, wharf, junction };
export default LINES_B;
