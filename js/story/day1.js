// Day 1 (Home Book) — chapter 1, ကျွန်မသည် သိုးမည်း (I Am a Black Sheep).
//
// Lesson (p15–19): mastery comes from patient learning and perseverance (ဇွဲ၊ လုံ့လ), not from an inborn
// gift (ပါရမီ); and whoever finds what they truly love and works at it the same way shines with a light
// of their own, even if that makes them the black sheep of the flock.
//
// Invented situation: Pho Thar (11) helps old U Kyaw Nyunt, a neighbour who stitches the Home Book's
// binding. Everyone expects U Kyaw Nyunt's helper to stitch well; his stitches wander: "no gift".
//   1. Practise: three traced rounds; his hand steadies a little with each attempt (the player's care counts).
//   2. He wins the stitching prize.
//   3. Tomorrow's fair: one table for stitching, one for windmills, one entry each. Cornered, he chooses
//      for himself (the black sheep's own act). Maya must not choose for him. This is the game's first
//      real talk (talk.js, data in talks/day1.js): her hand is the two plain cards the practice earned
//      plus one look-alike ("Enter stitching": choosing for him). "Not yet" keeps his stones; the fair
//      waits until Maya has done something else.
//   4. His first windmill will not turn: the same patient rounds, until it spins.
// No markers anywhere: the player learns where people are from what they say.
//
// Burmese lines are drafts for Maya to proofread.
import * as THREE from '../game/three.js';
import { trace } from './acts/trace.js';
import { stitchFrame, windmill, fairTable } from './props.js';
import { nightPage } from './post.js';
import { TALK_D1_FAIR } from './talks/day1.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);

// places on the Home Book (metres)
// The open lawn in front of the Library, where the binders work outdoors. Placed in the clear strip between
// the big broadleaf (-17.2, 13.8) and the padauk (-10.6, 15.9): the follow camera (≈16 m south, 10 m up)
// and the two-shots then see U Kyaw Nyunt, Pho Thar and Maya with no crown in front of them.
const FRAME = { x: -12.6, z: 7.8 };
const WINDY = { x: 22.6, z: 8.2 }; // the east edge of the page, where the wind comes over the edge
// the fair's two tables, on the lawn in front of the frame (stitching west, windmills east), with a wide
// walkway between them and the frame (Maya never gets boxed in between frame, tables and the two of them)
const TABLES = [{ x: FRAME.x - 1.7, z: FRAME.z + 3.5 }, { x: FRAME.x + 2.2, z: FRAME.z + 3.5 }];
// how far the stitched line may wander (px, trace.js `stray`): his hand steadies with every attempt, and a
// careless line fails; after a few tries in a round only the dots count (nobody is stuck for ever)
const STRAY_STITCH = [8, 7, 6.5], STRAY_FOLD = [5, 4.6], MERCY_AFTER = 4;

const L = {
  // opening
  ww1: [{ my: 'မာရာရေ… စာတစ်စောင် ရောက်လာတယ်။ ပို့သူ နာမည် မပါဘူး။', en: "Maya… a letter came for you. There's no sender's name." }],
  // (no ကျွန်တော်/ကျွန်မ: the sender stays unknown, and Burmese can drop the "I" here)
  letter: { my: 'အစ်မ… လူကြီးတွေရဲ့ ကမ္ဘာထဲ ခြေစ လှမ်းတော့မယ်။\nလမ်းမပျောက်အောင် မြေပုံလေး ရှိလား။', en: "Sister… I'm about to step into the grown-up world.\nIs there a map, so I don't get lost?" },
  maya1: [
    { my: 'မြေပုံ… ကျွန်မမှာ စာမျက်နှာ နှစ်ဆယ့်သုံးမျက်နှာ ရှိတယ်။ ကျွန်မအတွက်တော့ အလုပ်ဖြစ်ခဲ့တယ်။', en: 'A map… I have twenty-three pages. They worked for me.' },
    { my: 'ဒါပေမဲ့ ကျွန်မ မဟုတ်တဲ့ တခြားသူအတွက်ရော ဖြစ်ပါ့မလား။', en: "But will they work for someone who isn't me?" },
    { my: 'မပေးခင် ကိုယ်တိုင် အရင် စစ်ကြည့်မယ်။ ဒီနေ့ စာမျက်နှာ တစ်ကနေ စမယ်။', en: "Before I hand them over, I'll check them myself. Today I'll start with page one." },
  ],
  ww2: [
    { my: 'ဒါဆို ဒီမှတ်စုစာအုပ်နဲ့ ကလောင်လေး ယူသွား။ ကိုယ်တိုင်မြင်တာကိုပဲ ရွှေမင်နဲ့ ရေးနော်။', en: 'Then take this notebook and quill. Only write in gold what you have seen yourself.' },
    { my: 'ဒါနဲ့… ဦးကျော်ညွန့်တို့ ဒီနေ့ စာအုပ်ကျောရိုး ပြန်ချုပ်နေကြတယ်။ သူ့ကူညီပေးတဲ့ ဖိုးသားလေးကတော့ တစ်နေကုန် ပျောက်နေတယ်တဲ့။', en: "Oh, and U Kyaw Nyunt is re-stitching the book's spine today. Little Pho Thar, who helps him, has been gone all day." },
  ],
  wwLater: [{ my: 'ဦးကျော်ညွန့်ကတော့ စာကြည့်တိုက်ရှေ့က မြက်ခင်းမှာ စာအုပ်ကျောရိုး ချုပ်နေတယ်။', en: "U Kyaw Nyunt? On the lawn in front of the Library, stitching the book's spine." }],
  // U Kyaw Nyunt
  uk1: [
    { my: 'ချုပ်ရိုး တစ်ချောင်းချင်း ဖြောင့်မှ စာအုပ်က ကြာကြာခံတယ်ကွဲ့။', en: 'A book only lasts if every stitch runs straight.' },
    { my: 'ဖိုးသားလား။ "ကျွန်တော့်မှာ ပါရမီ မပါဘူး" ဆိုပြီး ထွက်သွားတယ်။', en: 'Pho Thar? He said "I have no gift" and walked off.' },
    { my: 'လေတိုက်တဲ့ဘက် သွားရှာကြည့်ပါလား။ သူ့ လေရဟတ်လေးတွေ မပါဘဲ ဘယ်မှ မသွားဘူး။', en: 'Try where the wind blows. He never goes anywhere without his little windmills.' },
  ],
  ukWait: [{ my: 'ဖိုးသားကို တွေ့ရင် ပြန်ခေါ်ခဲ့ပါနော်။', en: 'If you find Pho Thar, bring him back, would you?' }],
  // Pho Thar
  pt1: [
    { my: 'ဦးကျော်ညွန့်ရဲ့ အကူဆိုတော့ လူတိုင်းက ကျွန်တော် ချုပ်တတ်မှာပဲလို့ ထင်ကြတယ်။', en: "Because I help U Kyaw Nyunt, everyone thinks I must be good at stitching." },
    { my: 'ကျွန်တော့် ချုပ်ရိုးတွေက ကောက်ကောက်ကွေ့ကွေ့ပဲ။ ပါရမီ မပါဘူး။', en: 'My stitches wander all over. I have no gift.' },
  ],
  ptChoices: [
    { my: '"ဒါဆို တခြားဟာ လုပ်လိုက်ပါလား။"', en: '"Then why not do something else?"' },
    { my: '"မင်းဆရာ့လို တော်လာမှာပါ။ စိတ်မပူနဲ့။"', en: '"You\'ll be as good as your teacher. Don\'t worry."' },
    { my: '"ပါရမီ မပါလည်း ရပါတယ်။ နောက်တစ်ခါ အတူတူ ချုပ်ကြည့်ရအောင်။"', en: '"No gift is fine. Let\'s stitch once more, together."' },
  ],
  ptGiveUp: [{ my: '…ဟုတ်တယ်နော်။ အမြဲ ဒီလိုပဲ။', en: '…Yeah. It always ends like this.' }],
  ptGiveUpMaya: [{ my: '(အဲဒီစကားက သူ့ကို လက်လျှော့ခိုင်းလိုက်သလို ဖြစ်သွားပြီ။)', en: '(That just told him to give up.)' }],
  ptPressure: [{ my: 'အဲဒီစကား ကြားရတာ ပိုဆိုးတယ်။ အားလုံးက အဲဒီလိုပဲ ပြောကြတာ။', en: "Hearing that makes it worse. That's what everyone says." }],
  ptPressureMaya: [{ my: '(လူတွေ မျှော်လင့်ထားတာကို ကျွန်မပါ ထပ်ပြောမိပြီ။)', en: "(I just repeated what everyone expects of him.)" }],
  ptYes: [{ my: '…တစ်ခါပဲနော်။ ဦးကျော်ညွန့်ဆီ ပြန်သွားမယ်။', en: "…Just once, okay? I'll go back to U Kyaw Nyunt." }],
  ptGoing: [{ my: 'ဦးကျော်ညွန့်ဆီမှာ စောင့်နေမယ်။', en: "I'll wait with U Kyaw Nyunt." }],
  ukComing: [{ my: 'ဖိုးသား ပြန်လာနေပြီလား။ ခဏ စောင့်ကြည့်ရအောင်။', en: "Is Pho Thar on his way back? Let's wait a moment." }],
  // practice
  ukTeach: [
    { my: 'ဒီ အစက်လေးတွေအတိုင်း လိုက်ချုပ်။ မြန်ဖို့ မလိုဘူး။ ဖြောင့်ဖို့ပဲ လိုတယ်။', en: "Follow the dots. You don't need to be fast, only straight." },
  ],
  traceTitle: { my: 'ဖိုးသားနဲ့ အတူ ချုပ်မယ်', en: 'Stitch with Pho Thar' },
  traceHint: { my: 'ရွှေအစက်က စပြီး အစက်လေးတွေအတိုင်း ဖြည်းဖြည်း ဆွဲပါ', en: 'Start at the gold dot and trace the dots slowly' },
  again: [
    [{ my: 'ကောက်သွားပြန်ပြီ…', en: 'Crooked again…' }],
    [{ my: 'နည်းနည်းတော့ ပိုကောင်းလာတယ်…', en: 'A little better…' }],
  ],
  ukAgain: { my: 'နောက်တစ်ခါ။ ပါရမီက အဓိက မဟုတ်ဘူး။', en: "Once more. The gift isn't the main thing." },
  roundOk: [
    [{ my: 'ဟယ်… ဒီတစ်ကြောင်း နည်းနည်းဖြောင့်တယ်။', en: 'Hey… this one is a bit straighter.' }],
    [{ my: 'လက်က အရင်လောက် မတုန်တော့ဘူး။', en: "My hand isn't shaking like before." }],
    [{ my: 'ဖြောင့်တယ်! ကျွန်တော် ချုပ်တာ ဖြောင့်တယ်!', en: "Straight! I stitched it straight!" }],
  ],
  ukWin: [
    { my: 'ညနေ ချုပ်ရိုးပြိုင်ပွဲ… ပထမဆုကတော့ ဖိုးသား။', en: "This evening's stitching contest… first prize goes to Pho Thar." },
    { my: 'ပါရမီ ပါလို့ မဟုတ်ဘူး။ ထပ်ခါထပ်ခါ ချုပ်လို့ပဲ။', en: "Not because of a gift. Because he stitched again and again." },
  ],
  // a breath after the practice: the fair comes up only when Maya talks to them again
  ukRest: [{ my: 'ကဲ… ခဏ အမောဖြေကြဦး။ မနက်ဖြန် ပွဲတော်အကြောင်း ပြောစရာ ရှိသေးတယ်။', en: "Now… catch your breath a moment. There's still tomorrow's fair to talk about." }],
  // the fair: the black sheep's own choice
  ukFair: [
    { my: 'မနက်ဖြန် ပွဲတော်မှာ စားပွဲနှစ်လုံး ရှိမယ်။ ချုပ်ရိုးစားပွဲနဲ့ လေရဟတ်စားပွဲ။', en: "Tomorrow's fair has two tables: one for stitching, one for windmills." },
    { my: 'တစ်ယောက် တစ်ခုပဲ ဝင်ပြိုင်လို့ရတယ်။', en: 'Each person may enter only one.' },
  ],
  ukFairAgain: [{ my: 'ကဲ… ဖိုးသား၊ စဉ်းစားပြီးပြီလား။', en: 'So… Pho Thar, have you thought it over?' }],
  ukFairLater: [{ my: 'ကောင်လေးကို ခဏ စဉ်းစားခွင့်ပေးလိုက်ပါဦး။', en: 'Give the boy a little while to think.' }],
  ptFairLater: [{ my: 'ခဏ စဉ်းစားပါရစေဦး…', en: 'Let me think a little longer…' }],
  // (his own decision at the fair is in talks/day1.js: it ends the talk)
  ukSheep: [{ my: 'ချုပ်ရိုးဆရာ အိမ်ထဲက လေရဟတ်သမားလေးပေါ့။ သိုးမည်းလေးတစ်ကောင်ပဲ။ ကောင်းတဲ့ သိုးမည်းပါ။', en: "A windmill maker from a binder's house. A little black sheep. The good kind." }],
  ptStuck: [{ my: 'ဒါပေမဲ့… ပွဲအတွက် လေရဟတ်အသစ်က မလည်ဘူး။', en: "But… my new windmill for the fair won't turn." }],
  foldTitle: { my: 'လေရဟတ် ခေါက်မယ်', en: 'Fold the windmill' },
  foldHint: { my: 'ထောင့်တိုင်းကနေ အလယ်ကို ဖြည်းဖြည်း ခေါက်ပါ', en: 'Fold each corner to the centre, slowly' },
  ptSpins: [
    { my: 'လည်ပြီ! ချုပ်ရိုးလိုပဲ… ထပ်ခါထပ်ခါ လုပ်မှ ရတာပဲ။', en: "It turns! Just like the stitches… it takes again and again." },
    { my: 'ဒါ မာရာ့အတွက်။ ကျေးဇူးပါ။', en: "This one's for you, Maya. Thank you." },
  ],
  mayaWrite: [{ my: 'ဒီနေ့အကြောင်း စာရေးခန်းမှာ ပြန်ရေးမှ ဖြစ်မယ်။', en: "I should write today down at my Writing Room." }],
  ptAfter: [{ my: 'မနက်ဖြန် ပွဲတော်မှာ လေရဟတ်တွေ အများကြီး လည်နေမှာ။', en: "Tomorrow there'll be windmills turning all over the fair." }],
  ukAfter: [{ my: 'ကောင်လေး ကိုယ့်လမ်း ကိုယ်တွေ့ပြီ။', en: "The boy has found his own road." }],
  wwAfter: [{ my: 'ဖိုးသားကို တွေ့ပြီလား။ ပြုံးပြုံးလေး ပြန်လာတာ မြင်တယ်။', en: 'Found Pho Thar? I saw him come back smiling.' }],
  // night page
  nightQ: { my: 'ဒီနေ့အကြောင်း မှန်မှန်ကန်ကန် ဘယ်လို ရေးမလဲ။', en: 'How will she write today, truthfully?' },
  nightChoices: [
    { my: 'ဖိုးသားက ပါရမီ ပါလာလို့ ချက်ချင်း တော်သွားတယ်။', en: 'Pho Thar suddenly found a gift and became good.' },
    { my: 'ဖိုးသားက ထပ်ခါထပ်ခါ လေ့ကျင့်လို့ ဖြောင့်လာတယ်။ ပြီးတော့ သူ အချစ်ဆုံးလမ်းကို ကိုယ်တိုင် ရွေးတယ်။', en: 'Pho Thar practised again and again until his stitches ran straight. Then he chose the road he loves himself.' },
    { my: 'ဖိုးသားက ဘယ်တော့မှ တော်လာမှာ မဟုတ်ဘူး။', en: 'Pho Thar will never be any good.' },
  ],
  nightWrong: [
    [{ my: '(မဟုတ်ဘူး… ဒါ ချော့ပြောတာ။ ကိုယ်တိုင် မြင်ခဲ့တာက ဒီလို မဟုတ်ဘူး။)', en: "(No… that flatters. It isn't what I saw.)" }],
    [],
    [{ my: '(မဟုတ်ဘူး… ဒါ အားလျှော့ပြောတာ။ ကိုယ်တိုင် မြင်ခဲ့တာက ဒီလို မဟုတ်ဘူး။)', en: "(No… that's too gloomy. It isn't what I saw.)" }],
  ],
  sleepQ: { my: 'ဒီည မှတ်စုစာမျက်နှာလေး ဘယ်သူ့အိမ်မှာ အိပ်မလဲ။', en: 'Whose house does tonight\'s notebook page sleep at?' },
  stampText: { my: 'စာမျက်နှာ ၁ — ကျွန်မသည် သိုးမည်း\nတခြားသူ တစ်ယောက်အတွက်လည်း မှန်ကြောင်း ကိုယ်တိုင် တွေ့ခဲ့ပြီ။', en: 'Page 1 — I Am a Black Sheep\nShe saw for herself that it holds for someone else too.' },
  tomorrow: { my: 'နောက်တစ်နေ့ မနက် ရောက်ပြီ။ စာမျက်နှာ ၂ ဆက်သွားမယ်။', en: 'Morning comes. On to page 2.' },
};

export async function create(story) {
  const { game, dialog: D } = story;
  const F = (k, v) => story.flag(`d1.${k}`, v);
  const door = (id) => game.world.places.find((p) => p.id === id).door;
  const v3 = new THREE.Vector3();
  const myObs = []; // keep-out boxes this page adds (dispose() takes them away again)
  // (the open world's walker collides through a spatial hash: shapes go in with space.add, not a bare push)
  const addOb = (o) => { myObs.push(o); if (story.openWorld?.space) story.openWorld.space.add([o]); else story.foot.obstacles.push(o); };

  // ---- props
  const scene = game.world.scene;
  const frame = stitchFrame();
  frame.position.set(FRAME.x, 0, FRAME.z);
  scene.add(frame);
  addOb({ type: 'box', minX: FRAME.x - 1.15, maxX: FRAME.x + 1.7, minZ: FRAME.z - 0.4, maxZ: FRAME.z + 0.62 });
  const mills = [];
  const millCols = ['#6E1F2A', '#2F7C7A', '#D9A93B', '#7FB0CF', '#D97C8A'];
  for (let i = 0; i < 5; i++) {
    const w = windmill(millCols[i], 0.6 + (i % 3) * 0.12);
    w.root.position.set(WINDY.x - 1.2 + i * 0.55, 0, WINDY.z - 0.9 + Math.sin(i * 2.1) * 0.35);
    scene.add(w.root);
    mills.push(w);
  }
  let fairBuilt = false;
  const fairObjs = [];
  function buildFair() {
    if (fairBuilt) return;
    fairBuilt = true;
    const t1 = fairTable('#2F7C7A'); t1.position.set(TABLES[0].x, 0, TABLES[0].z);
    const t2 = fairTable('#D9A93B'); t2.position.set(TABLES[1].x, 0, TABLES[1].z);
    scene.add(t1, t2);
    fairObjs.push(t1, t2);
    for (const t of TABLES) addOb({ type: 'box', minX: t.x - 0.62, maxX: t.x + 0.62, minZ: t.z - 0.4, maxZ: t.z + 0.4 });
    const fm = windmill('#6E1F2A', 0.5); fm.root.position.set(TABLES[1].x + 0.3, 0.68, TABLES[1].z); scene.add(fm.root); mills.push(fm);
  }
  let newMill = null;

  // ---- people
  const ab = door('about');
  story.spawn('wintwar', { x: ab.x + 2.6, z: ab.z + 1.2, heading: -Math.PI / 2 });
  story.spawn('ukyaw', { x: FRAME.x - 0.6, z: FRAME.z + 0.9, heading: 0 });
  const ptBack = { x: FRAME.x + 1.0, z: FRAME.z + 1.1 }; // where he walks back to after he agrees
  const ptHome = F('agreed') ? { ...ptBack, heading: 0 } : { x: WINDY.x, z: WINDY.z, heading: -0.4 };
  story.spawn('phothar', ptHome);
  if (F('chose')) buildFair();

  // ---- daily life: everyone keeps to their own patch and does their job
  const ukSpot = { x: FRAME.x - 1.45, z: FRAME.z + 0.15, h: Math.PI / 2 }; // at the frame's end, side-on: the frame never hides him
  // (his patch stays east of the big broadleaf's line, x > -15.4: walking up to him there, nothing hides him)
  story.setJob('ukyaw', { area: { x: FRAME.x + 0.2, z: FRAME.z + 1.9, r: 1.8 }, spot: ukSpot, mood: 'work', workChance: 0.8, workFor: [8, 16] });
  story.setJob('wintwar', { area: { x: ab.x + 3.5, z: ab.z + 2.2, r: 3.2 }, spot: { x: ab.x + 2.6, z: ab.z + 1.2, h: -0.4 }, mood: 'read', workChance: 0.5, workFor: [5, 9] });
  function ptJob() {
    const pt = story.people.get('phothar');
    if (F('spun')) { pt.baseMood = null; story.setJob('phothar', { area: { x: TABLES[1].x, z: TABLES[1].z - 1.1, r: 0.9 }, spot: { x: TABLES[1].x + 0.2, z: TABLES[1].z - 0.75, h: 0 }, mood: 'play', workChance: 0.6 }); }
    else if (F('agreed')) { pt.baseMood = null; story.setJob('phothar', { area: { x: FRAME.x + 1.2, z: FRAME.z + 1.7, r: 1.4 }, spot: { x: FRAME.x + 0.75, z: FRAME.z + 0.95, h: Math.PI }, mood: 'work', workChance: 0.5, workFor: [4, 8] }); }
    else { pt.baseMood = 'down'; pt.p.setMood('down'); story.setJob('phothar', { area: { x: WINDY.x, z: WINDY.z + 0.4, r: 2.2 }, spot: { x: WINDY.x - 0.3, z: WINDY.z - 0.2, h: Math.PI }, mood: 'play', workChance: 0.6, speed: 0.7, lookAt: { x: WINDY.x, z: WINDY.z - 0.9 } }); }
  }
  ptJob();

  // ---- what people say, by how far the day has gone
  const talk = {
    wintwar: async () => {
      if (!F('letter')) return opening();
      await D.say('wintwar', F('spun') ? L.wwAfter : L.wwLater);
    },
    ukyaw: async () => {
      if (F('spun')) return D.say('ukyaw', L.ukAfter);
      if (F('agreed') && !F('chose') && story.talk.waiting(TALK_D1_FAIR.id)) return D.say('ukyaw', L.ukFairLater);
      if (F('agreed')) return practice();
      F('metUk', true);
      await D.say('ukyaw', F('metUk2') ? L.ukWait : L.uk1, { face: 'smile' });
      F('metUk2', true);
    },
    phothar: async () => {
      if (F('spun')) return D.say('phothar', L.ptAfter, { face: 'happy' });
      if (F('practised') && !F('chose') && story.talk.waiting(TALK_D1_FAIR.id)) return D.say('phothar', L.ptFairLater, { face: 'think' });
      // back at the frame: talking to him (or to U Kyaw Nyunt) starts the practice, then later the fair
      if (F('agreed')) return story.people.get('phothar').walking ? D.say('phothar', L.ptGoing) : practice();
      return ptTalk();
    },
  };

  async function opening() {
    game.ui.cinema(true);
    const ww = story.people.get('wintwar');
    await D.say('wintwar', L.ww1, { face: 'smile' });
    await showLetter(L.letter);
    story.give('letter');
    await D.say('maya', L.maya1, { face: 'think' });
    await D.say('wintwar', L.ww2, { face: 'happy' });
    story.give('notebook');
    story.give('quill');
    ww.p.emote('wave');
    F('letter', true);
    game.ui.cinema(false);
    // one line about the controls, never about where to go
    game.ui.tip(game.ui.els && (document.documentElement.getAttribute('data-lang') === 'en'
      ? 'Drag to walk · tap someone to talk · the round button switches car and walking'
      : 'ဆွဲပြီး လမ်းလျှောက်ပါ · လူကို နှိပ်ရင် စကားပြောမယ် · အဝိုင်းခလုတ်က ကားနဲ့ လမ်းလျှောက် ပြောင်းတယ်'), 6500);
  }

  async function ptTalk() {
    const pt = story.people.get('phothar');
    await D.say('phothar', L.pt1, { face: 'sad', mood: 'down' });
    for (;;) {
      const i = await D.choose(L.ptChoices);
      if (i === 0) { await D.say('phothar', L.ptGiveUp, { face: 'sad', emote: 'slump' }); await D.say('maya', L.ptGiveUpMaya, { face: 'think' }); continue; }
      if (i === 1) { await D.say('phothar', L.ptPressure, { face: 'hot', emote: 'fists' }); await D.say('maya', L.ptPressureMaya, { face: 'think' }); pt.p.setMood('down'); continue; }
      break;
    }
    pt.p.setMood(null);
    await D.say('phothar', L.ptYes, { face: 'worried' });
    F('agreed', true);
    story.talking = false;
    // he walks back to the spine by himself; the player follows (or not) as they like
    pt.job = null;
    story.walkPerson('phothar', ptBack.x, ptBack.z, 1.6).then(() => { pt.home = { x: ptBack.x, z: ptBack.z, h: 0 }; pt.ob.x = pt.home.x; pt.ob.z = pt.home.z; ptJob(); });
  }

  async function practice() {
    const pt = story.people.get('phothar');
    if (pt.walking) return D.say('ukyaw', L.ukComing);
    game.ui.cinema(true);
    if (!F('practised')) {
      await D.say('ukyaw', L.ukTeach, { face: 'smile' });
      let wobble = 22;
      for (let round = 1; round <= 3; round++) {
        for (let attempt = 0; ; attempt++) {
          const stray = attempt < MERCY_AFTER ? STRAY_STITCH[round - 1] : 0;
          const r = await trace({ title: L.traceTitle, hint: L.traceHint, path: 'stitch', wobble, tolerance: [26, 20, 16][round - 1], round, rounds: 3, stray });
          wobble = Math.max(4, wobble * 0.72); // every attempt is practice: the hand steadies
          if (r.ok) { await D.say('phothar', L.roundOk[round - 1], { face: round === 3 ? 'happy' : 'surprised', auto: true }); break; }
          await D.say('phothar', L.again[Math.min(attempt, 1)], { face: 'worried', auto: true });
          await D.say('ukyaw', [L.ukAgain], { auto: true });
        }
      }
      F('practised', true);
      call(game.audio, 'play', 'cheer');
      game.fx.burst('confetti', pt.p.headTop(v3), { count: 18, spread: 0.6, up: 0.8 });
      pt.p.emote('cheer');
      await D.say('ukyaw', L.ukWin, { face: 'happy' });
      // a breath: the fair is the next talk, when Maya turns to them again
      await D.say('ukyaw', L.ukRest, { face: 'smile' });
      game.ui.cinema(false);
      return;
    }
    // the fair: two tables, one entry. The first real talk: he has to reach his own signpost.
    if (!F('chose')) {
      buildFair();
      await D.say('ukyaw', F('fairAsked') ? L.ukFairAgain : L.ukFair);
      F('fairAsked', true);
      const r = await story.talk.run(TALK_D1_FAIR);
      if (!r.won) { game.ui.cinema(false); return; } // not yet: what he worked out stays; the fair waits
      F('chose', true);
    }
    await D.say('ukyaw', L.ukSheep, { face: 'happy' });
    // his windmill will not turn: the same patience, on the road he chose
    await D.say('phothar', L.ptStuck, { face: 'worried' });
    let wobble = 14;
    for (let round = 1; round <= 2; round++) {
      for (let attempt = 0; ; attempt++) {
        const stray = attempt < MERCY_AFTER ? STRAY_FOLD[round - 1] : 0;
        const r = await trace({ title: L.foldTitle, hint: L.foldHint, path: 'fold', wobble, tolerance: [24, 18][round - 1], round, rounds: 2, stray });
        wobble = Math.max(4, wobble * 0.72);
        if (r.ok) break;
        await D.say('ukyaw', [L.ukAgain], { auto: true });
      }
    }
    newMill = windmill('#6E1F2A', 0.55);
    newMill.root.position.set(pt.p.root.position.x + 0.25, 0, pt.p.root.position.z + 0.2);
    scene.add(newMill.root);
    mills.push(newMill);
    call(game.audio, 'play', 'chime');
    pt.p.emote('cheer');
    await D.say('phothar', L.ptSpins, { face: 'happy' });
    story.give('windmill');
    F('spun', true);
    ptJob();
    await D.say('maya', L.mayaWrite, { face: 'smile' });
    game.ui.cinema(false);
  }

  function showLetter(text) {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.className = 'story-letter';
      const lang = document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'my';
      el.innerHTML = '<div class="paper"><p></p><small>— ?</small></div>';
      el.querySelector('p').innerText = text[lang];
      call(game.audio, 'play', 'page');
      el.addEventListener('click', () => { el.remove(); resolve(); });
      document.getElementById('game').appendChild(el);
    });
  }

  // ---- the night page (at the Writing Room, after the windmill turns)
  let nightBusy = false;
  async function night() {
    if (nightBusy) return;
    nightBusy = true;
    // the night page (post.js): the true sentence, where the notebook sleeps, the stamp, then page 2
    await nightPage(story, {
      day: 1,
      truth: { q: L.nightQ, choices: L.nightChoices, right: 1, wrong: L.nightWrong },
      sleep: { q: L.sleepQ, who: ['phothar', 'ukyaw', 'wintwar'] },
      stamps: [1],
      stampText: L.stampText,
      tomorrow: L.tomorrow,
    });
    F('done', true);
  }

  return {
    talk,
    /** The page turns in place: this page's props, keep-out boxes and people go away. */
    dispose() {
      for (const o of [frame, ...mills.map((m) => m.root), ...fairObjs]) o.parent?.remove(o);
      if (story.openWorld?.space) story.openWorld.space.remove(myObs);
      else for (const o of myObs) { const k = story.foot.obstacles.indexOf(o); if (k >= 0) story.foot.obstacles.splice(k, 1); }
      for (const id of ['wintwar', 'ukyaw', 'phothar']) story.remove(id);
      mills.length = 0;
    },
    async start() {
      if (!F('letter')) {
        // the day opens with Maya stepping out at her Writing Room; the postwoman comes over
        if (!story.foot.active) await story.foot.toFoot();
        story.refreshHud?.();
        const mp = game.maya.root.position;
        const ww = story.people.get('wintwar');
        ww.paused = true;
        await story.walkPerson('wintwar', mp.x + 1.15, mp.z + 0.05, 1.5);
        setTimeout(() => { ww.paused = false; }, 4000);
        await story.talkTo(story.people.get('wintwar'));
      }
    },
    update(dt) {
      for (const m of mills) m.spin(dt, 3.5);
      // (the practice and the fair start only when Maya talks to U Kyaw Nyunt or Pho Thar at the frame:
      // walking past never fires them, and there is a breath between the two)
      // night page: back at the Writing Room door after the windmill turned
      if (F('spun') && !F('done') && !story.talking && !game.busy) {
        const p = story.foot.active ? story.foot.pos : null;
        const d = ab;
        const near = p ? Math.hypot(p.x - d.x, p.y - d.z) < 1.8 : Math.hypot(game.car.root.position.x - d.x, game.car.root.position.z - (d.z + 3)) < 2.2;
        if (near) night();
      }
    },
  };
}
