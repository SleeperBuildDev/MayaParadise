// DATA: which job loop a townsperson plays at work (js/story/anim). Pure: node can import it.
//
//   jobClip(entry, mood) -> clip name | null
//     entry: a story.people entry ({ cast: { role: { en } }, job: { mood, anim? } }) or null; mood: people.js mood
// Order: an explicit `job.anim` on the region row, the role's words, the chatter kind words, then the mood.
// A seated job ('sit'/'pedal') needs a real seat, so it never comes from here: a trishaw rider at rest only rests.

// [role words (English, lower case), clip when working, clip when the mood is 'read' (optional)]
const ROLE = [
  [/sweep/, 'sweep'],
  [/fritter|fries|frying|grill|skewer|barbecue/, 'fanGrill'],
  [/noodle|soup|cook|curry|rice pot|pot cart/, 'stirPot'],
  [/tea (stall|shop|cart|corner)|tea master|pours tea|helps at the tea|quay tea/, 'pourTea'],
  [/old man at the tea|regular|sits on her steps|sits/, 'sipTea'],
  [/reads|diary|bookkeeper|book stall|newspaper|news seller|old-book/, 'readPaper'],
  [/washing day|hangs out the washing|laundry/, 'hangLaundry'],
  [/washes|scrub/, 'washScrub'],
  [/net mender|mends? (the )?net|nets/, 'mendNet'],
  [/fisher|fishing|angler|rod/, 'fishRod'],
  [/water(s)? (the|his|her)? ?(seedlings|beans|plants|garden)|waters/, 'waterPlants'],
  [/draws water|carries water|water pots|drinking-water/, 'carryHead'],
  [/porter|carries paper|carries|sack|delivery/, 'carryShoulder'],
  [/carpenter|boatwright|hammer|mends bicycles?|bicycle brakes|fence|rope maker|mends/, 'hammer'],
  [/weaves?|weaver|loom|bamboo walls|mats/, 'weave'],
  [/baker|bakes|knead|dough|potter|clay|kiln/, 'knead'],
  [/hens|ducks|chickens|feeds/, 'scatterFeed'],
  [/kite/, 'flyKite'],
  [/skips? rope/, 'skipRope'],
  [/marbles|hopscotch|hoop|plays/, 'playKids'],
  [/chillies|dries|sorts seed|seed on a mat|dries fish/, 'washScrub'],
  [/sells|stall|seller|vendor|shop|store|greens cart|vegetables|trader|cart aunty|keeper/, 'sellHand'],
  [/barber|tailor|beekeeper|nursery|lily pond/, 'mendNet'],
  [/cane ball|chinlone/, 'chinlone'],
];
// a people.js mood with no role to go by
const MOOD = { read: 'readPaper', sweep: 'sweep', play: 'playKids', work: 'mendNet', kick: 'chinlone' };
// moods that are attitudes, not jobs (anim plays them as fading loops: clips-work.js MOOD_CLIPS)
export const ATTITUDES = new Set(['hot', 'down', 'shy']);

const cache = new WeakMap();
export function jobClip(entry, mood) {
  if (!mood || ATTITUDES.has(mood)) return null;
  if (mood === 'kick') return 'chinlone';
  if (entry && typeof entry === 'object') {
    let by = cache.get(entry);
    if (by === undefined) {
      by = null;
      const explicit = entry.job?.anim || entry.anim;
      if (typeof explicit === 'string') by = explicit;
      else {
        const role = String(entry.cast?.role?.en || entry.role?.en || '').toLowerCase();
        for (const [re, clip] of ROLE) if (re.test(role)) { by = clip; break; }
      }
      cache.set(entry, by);
    }
    if (by) {
      // a reader's mood says read whatever the role; a sweeper told to 'work' still sweeps
      if (mood === 'read' && by !== 'readPaper' && by !== 'sipTea') return 'readPaper';
      if (mood === 'play' && by !== 'playKids' && by !== 'skipRope' && by !== 'flyKite') return MOOD.play;
      return by;
    }
  }
  return MOOD[mood] || null;
}
