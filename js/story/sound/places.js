// Where each sound belongs: ambience per district (day / night), the listening ZONES that switch the
// area song, room types, and the mission cues. Pure data (plus two tiny lookups).
//
// An ambience: { level (its balance under the music, set by measuring each place on a phone-speaker curve), beds: [bed], events: [[fxName, perMinute, volume, opts?]], every: [[fxName, periodSeconds, volume]] }
// A bed (a looping buffer from bank.js through one filter): { loop, v, f: [type, hz, q], lfo: [hz, depth] (level
// wobble 0..1), sweep: [hz, hz-depth] (filter wobble) }

const water = (v, hz = 820) => ({ loop: 'brown', v, f: ['bandpass', hz * 0.6, 0.45], lfo: [0.19, 0.6] }); // band-passed: a phone hears the river, headphones get no rumble
const foam = (v) => ({ loop: 'pink', v, f: ['bandpass', 1600, 0.5], lfo: [0.23, 0.8] });
const wind = (v, hz = 450) => ({ loop: 'pink', v, f: ['bandpass', hz, 0.9], lfo: [0.09, 0.55], sweep: [0.05, hz * 0.5] });
const air = (v, hz = 700) => ({ loop: 'pink', v, f: ['bandpass', hz, 0.6] });
const roomTone = (v) => ({ loop: 'brown', v, f: ['lowpass', 380, 0.7] });
const crickets = (v) => ({ loop: 'crickets', v, f: ['highpass', 2500, 0.7], lfo: [0.05, 0.4] });

export const AMBIENCE = {
  // ---------------- towns: day ----------------
  'home:day': { level: 2.9, vibe: 'gentle page rustle, a quiet house, birds outside', beds: [roomTone(0.012), air(0.016, 900)],
    events: [['page', 4, 1.3], ['warble', 1.5, 0.6], ['sparrow', 1, 0.5], ['leaves', 0.6, 0.7]] },
  'exercise:day': { level: 1.27, vibe: 'school bell far off, children, sparrows, bicycle bells', beds: [{ loop: 'kids', v: 0.05, f: ['lowpass', 2600, 0.6], lfo: [0.07, 0.45] }, air(0.01)],
    events: [['schoolBell', 0.4, 0.9], ['sparrow', 5, 0.8], ['bikeBell', 1.6, 0.8], ['steps', 1, 0.7], ['warble', 1, 0.6], ['dog', 0.3, 0.6]] },
  'envelope:day': { level: 2.85, vibe: 'wind over open paper, a cart far off, flapping flaps', beds: [wind(0.06), air(0.01, 1400)],
    events: [['gust', 2, 1], ['cart', 0.6, 0.9], ['rustle', 1.5, 0.7], ['flap', 1, 0.8], ['sparrow', 1, 0.5], ['warble', 0.6, 0.5]] },
  'market:day': { level: 1.27, vibe: 'crowd murmur, sellers calling, scale clinks, dogs', beds: [{ loop: 'babble', v: 0.09, f: ['lowpass', 1900, 0.6], lfo: [0.06, 0.3] }, air(0.012, 1000)],
    events: [['vendorCall', 4, 1], ['clink', 5, 1], ['dog', 0.5, 0.8], ['bikeBell', 1, 0.7], ['steps', 1, 0.6], ['sparrow', 1, 0.5], ['cart', 0.5, 0.8]] },
  'wharf:day': { level: 1.43, vibe: 'water lapping, rope creak, gulls, a boat horn far away', beds: [water(0.1), foam(0.006)],
    events: [['splash', 8, 1], ['creak', 5, 0.9], ['gull', 3, 1], ['horn', 0.5, 1], ['steps', 0.6, 0.7, { surface: 'wood' }], ['vendorCall', 0.5, 0.6]] },
  'junction:day': { level: 2.07, vibe: 'printing press clack, newspapers, footsteps on stone', beds: [{ loop: 'babble', v: 0.035, f: ['lowpass', 1500, 0.6] }, air(0.012)],
    events: [['press', 0.9, 1], ['rustle', 3, 0.9], ['steps', 2.5, 0.9], ['bikeBell', 0.6, 0.6], ['sparrow', 1, 0.5], ['vendorCall', 0.5, 0.6]] },
  'hearth:day': { level: 1.84, vibe: 'oven crackle, a kettle, cozy murmur', beds: [{ loop: 'fire', v: 0.035, f: ['lowpass', 2200, 0.6] }, { loop: 'murmur', v: 0.04, f: ['lowpass', 1500, 0.6], lfo: [0.05, 0.3] }],
    events: [['kettle', 0.5, 1], ['tray', 1.5, 0.9], ['clink', 2, 0.8], ['sparrow', 1.5, 0.6], ['warble', 0.6, 0.5], ['dog', 0.3, 0.5], ['steps', 1, 0.6]] },
  'garden:day': { level: 2.04, vibe: 'birdsong, insects, a trickle of water, leaves', beds: [{ loop: 'trickle', v: 0.045, f: ['highpass', 300, 0.7] }, { loop: 'cicada', v: 0.012, f: ['lowpass', 8000, 0.7], lfo: [0.05, 0.7] }, { loop: 'pink', v: 0.01, f: ['highpass', 2500, 0.6], lfo: [0.09, 0.7] }],
    events: [['warble', 5, 1], ['sparrow', 3, 0.8], ['leaves', 1.5, 1], ['frog', 0.3, 0.6]] },
  'blank:day': { level: 2.1, vibe: 'near silence, soft wind, pencil scratches', beds: [wind(0.04, 350)],
    events: [['pencil', 1.2, 0.9], ['gust', 0.6, 0.6], ['page', 0.2, 0.5]] },
  // ---------------- towns: night ----------------
  'home:night': { level: 2.0, vibe: 'crickets, a page now and then, a night bird', beds: [roomTone(0.012), crickets(0.035)],
    events: [['page', 1.5, 0.8], ['owlet', 0.6, 0.8], ['leaves', 0.3, 0.5]] },
  'exercise:night': { level: 1.3, vibe: 'crickets, a far dog, a frog, one late bicycle', beds: [crickets(0.045)], events: [['dog', 0.6, 0.6], ['owlet', 0.4, 0.7], ['frog', 0.8, 0.7], ['bikeBell', 0.3, 0.5]] },
  'envelope:night': { level: 2.0, vibe: 'low wind, crickets', beds: [wind(0.035), crickets(0.035)], events: [['gust', 1, 0.7], ['owlet', 0.5, 0.7]] },
  'market:night': { level: 1.58, vibe: 'a few night stalls, frying, low talk, crickets', beds: [{ loop: 'babble', v: 0.035, f: ['lowpass', 1200, 0.6] }, crickets(0.03)],
    events: [['vendorCall', 0.8, 0.6], ['sizzle', 1.2, 0.8], ['clink', 2, 0.7], ['dog', 0.8, 0.7]] },
  'wharf:night': { level: 1.66, vibe: 'dark water, frogs, creaking moorings', beds: [water(0.085, 450), crickets(0.03)],
    events: [['frog', 2, 0.9], ['creak', 2.5, 0.9], ['splash', 3, 0.8], ['horn', 0.2, 0.8]] },
  'junction:night': { level: 1.8, vibe: 'quiet stone, a late press, crickets', beds: [crickets(0.03)], events: [['steps', 1, 0.6], ['rustle', 0.6, 0.6], ['press', 0.2, 0.7], ['owlet', 0.3, 0.6]] },
  'hearth:night': { level: 2.34, vibe: 'embers, a kettle, soft voices, crickets', beds: [{ loop: 'fire', v: 0.035, f: ['lowpass', 1800, 0.6] }, { loop: 'murmur', v: 0.025, f: ['lowpass', 1200, 0.6] }, crickets(0.03)],
    events: [['kettle', 0.4, 0.9], ['clink', 0.8, 0.7], ['owlet', 0.3, 0.6]] },
  'garden:night': { level: 1.78, vibe: 'crickets, frogs, water, a night bird', beds: [{ loop: 'trickle', v: 0.035, f: ['highpass', 300, 0.7] }, crickets(0.05)],
    events: [['frog', 3, 1], ['owlet', 0.6, 0.8], ['leaves', 0.6, 0.6]] },
  'blank:night': { level: 1.8, vibe: 'almost nothing: wind, one cricket, a pencil', beds: [wind(0.02, 300), crickets(0.015)], events: [['pencil', 0.6, 0.7], ['owlet', 0.2, 0.6]] },
  // ---------------- areas (on top of the town, which drops to 60%) ----------------
  'area:teasquare': { level: 1.5, vibe: 'cups and saucers, tea-shop chatter', beds: [{ loop: 'murmur', v: 0.05, f: ['lowpass', 1600, 0.6] }], events: [['clink', 6, 1], ['kettle', 0.4, 0.8], ['vendorCall', 0.6, 0.6]] },
  'area:jetties': { level: 1.8, vibe: 'water right under the boards, ropes, gulls', beds: [water(0.12, 650)], events: [['splash', 6, 1], ['creak', 4, 1], ['steps', 1.5, 0.9, { surface: 'wood' }], ['gull', 1.5, 1]] },
  'area:schoolyard': { level: 0.8, vibe: 'children close by at play, the bell', beds: [{ loop: 'kids', v: 0.09, f: ['lowpass', 3200, 0.6], lfo: [0.11, 0.5] }], events: [['schoolBell', 0.5, 1], ['sparrow', 2, 0.7], ['bikeBell', 0.6, 0.6]] },
  'area:bakeryrow': { level: 3.2, vibe: 'ovens, trays, sugar in the air', beds: [{ loop: 'fire', v: 0.045, f: ['lowpass', 2000, 0.6] }], events: [['tray', 3, 1], ['kettle', 0.3, 0.8], ['clink', 1, 0.7]] },
  'area:kitefield': { level: 2.1, vibe: 'open wind, kite tails snapping', beds: [wind(0.065, 600)], events: [['flap', 5, 1], ['gust', 2.5, 1], ['sparrow', 1, 0.6]] },
  'area:bridge': { level: 2.0, vibe: 'deep water far below, rope creak, wind', beds: [water(0.06, 380), wind(0.04, 500)], events: [['creak', 5, 1], ['gust', 1.5, 0.8], ['steps', 1, 0.8, { surface: 'wood' }]] },
  'area:lodgeporch': { level: 2.2, vibe: 'a wind chime, a rocking chair, low fire inside', beds: [{ loop: 'fire', v: 0.015, f: ['lowpass', 1200, 0.6] }], events: [['chimes', 2, 1], ['creak', 1.5, 0.7]] },
  // ---------------- rooms (the town outside is heard through the walls: low and muffled) ----------------
  'room:teashop': { level: 1.15, vibe: 'close chatter, cups, the kettle', beds: [{ loop: 'murmur', v: 0.06, f: ['lowpass', 1800, 0.6], lfo: [0.06, 0.3] }], events: [['clink', 6, 1], ['kettle', 0.6, 0.8]] },
  'room:bakery': { level: 2.85, vibe: 'the oven roaring low, trays, warm', beds: [{ loop: 'fire', v: 0.045, f: ['lowpass', 1600, 0.6] }], events: [['tray', 2.5, 1], ['clink', 1, 0.7], ['kettle', 0.2, 0.7]] },
  'room:classroom': { level: 2.95, vibe: 'whispers, chalk, a clock, pages', beds: [{ loop: 'kids', v: 0.014, f: ['lowpass', 1500, 0.6] }], events: [['chalk', 2, 1], ['page', 2, 0.9]], every: [['clockTick', 1, 1]] },
  'room:workshop': { level: 5.6, vibe: 'tools, paper, a mallet now and then', beds: [roomTone(0.008)], events: [['stamp', 1.5, 0.8], ['rustle', 1.5, 0.8], ['creak', 0.8, 0.6]] },
  'room:press': { level: 2.5, vibe: 'the press inside: rollers and clacks, paper', beds: [roomTone(0.012)], events: [['press', 3, 1.1], ['rustle', 3, 1]] },
  'room:post': { level: 3.1, vibe: 'stamps, sorting, a clock', beds: [roomTone(0.009)], events: [['stamp', 3, 1], ['rustle', 3, 1], ['page', 1.5, 0.8]], every: [['clockTick', 1, 0.9]] },
  'room:home': { level: 4.6, vibe: 'a quiet room, pen and pages, a clock', beds: [roomTone(0.01)], events: [['page', 1.2, 0.9], ['pencil', 1.5, 0.9]], every: [['clockTick', 1, 0.7]] },
  'room:lodge': { level: 3.5, vibe: 'fire, an old floor, travellers murmuring', beds: [{ loop: 'fire', v: 0.05, f: ['lowpass', 1800, 0.6] }, { loop: 'murmur', v: 0.02, f: ['lowpass', 1200, 0.6] }], events: [['creak', 1, 0.8], ['clink', 1, 0.7]] },
  'room:noodle': { level: 1.15, vibe: 'steam, sizzling, bowls and voices', beds: [{ loop: 'murmur', v: 0.05, f: ['lowpass', 1600, 0.6] }], events: [['sizzle', 2.5, 1], ['clink', 5, 1], ['kettle', 0.3, 0.6]] },
  'room:loom': { level: 1.17, vibe: 'the loom: swish, knock, swish, knock', beds: [{ loop: 'loom', v: 0.12, f: ['lowpass', 5000, 0.6] }, { loop: 'murmur', v: 0.015, f: ['lowpass', 1200, 0.6] }], events: [['clink', 0.3, 0.6]] },
  'room:library': { level: 3.5, vibe: 'hush, pages, a slow clock', beds: [roomTone(0.012)], events: [['page', 2.5, 1], ['pencil', 0.3, 0.6]], every: [['clockTick', 2, 0.8]] },
  // ---------------- weather ----------------
  'rain:out': { level: 1.6, vibe: 'steady rain, drips', beds: [{ loop: 'pink', v: 0.07, f: ['highpass', 900, 0.6], lfo: [0.07, 0.25] }, { loop: 'brown', v: 0.03, f: ['lowpass', 300, 0.7] }], events: [['drip', 14, 1]] },
  'rain:in': { level: 1.5, vibe: 'rain on the roof', beds: [{ loop: 'pink', v: 0.05, f: ['lowpass', 1800, 0.6], lfo: [0.07, 0.25] }], events: [['drip', 6, 0.8]] },
};

/** Listening zones: walk in, the area song and ambience fade in. Circle (x, z, r) or rect [x0, z0, x1, z1]. */
export const ZONES = {
  teasquare: { district: 'market', x: 18.5, z: 317, r: 11, name: { my: 'လက်ဖက်ရည်ဆိုင် ရင်ပြင်', en: 'The tea square' } },
  kitefield: { district: 'market', x: -44, z: 310, r: 16, name: { my: 'စွန်လွှတ်ကွင်း', en: 'The kite field' } },
  jetties: { district: 'wharf', rect: [62, 425, 112, 482], name: { my: 'ဆိပ်ခံတံတားများ', en: 'The jetties' } },
  schoolyard: { district: 'exercise', x: -11.5, z: 94, r: 12, name: { my: 'ကျောင်းဝင်း', en: 'The school yard' } },
  bakeryrow: { district: 'hearth', x: 141, z: 198, r: 13, name: { my: 'မုန့်ဖိုတန်း', en: 'The bakery row' } },
  bridge: { district: 'junction', rect: [76, 284, 122, 302], name: { my: 'တံတား', en: 'The bridge' } },
  lodgeporch: { district: 'blank', x: 131, z: -4, r: 7, name: { my: 'တည်းခိုဆောင် ဝရန်တာ', en: 'The lodge porch' } },
};
/** The zone id at a world point (or null). */
export function zoneAt(x, z) {
  for (const [id, Z] of Object.entries(ZONES)) {
    if (Z.rect) { const [x0, z0, x1, z1] = Z.rect; if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return id; }
    else if ((x - Z.x) ** 2 + (z - Z.z) ** 2 <= Z.r * Z.r) return id;
  }
  return null;
}

/** Room id -> room type (rooms/*.js and doors.js HOME_ROOMS). Unknown rooms play 'home'. */
export const ROOM_TYPE = {
  teashop: 'teashop', quartertea: 'teashop', bordertea: 'teashop', junctiontea: 'teashop', hearthtea: 'teashop', kilntea: 'teashop',
  bakery: 'bakery', provingroom: 'bakery',
  classroom: 'classroom', schoolroom: 'classroom', eveningclass: 'classroom',
  press: 'workshop', boxshop: 'workshop', lampshop: 'workshop', carvershop: 'workshop', pottershed: 'workshop', caneshed: 'workshop', packroom: 'workshop', dryinghall: 'workshop', weighhouse: 'workshop',
  marketpost: 'post', postroom: 'post', sortingroom: 'post', sundries: 'post',
  about: 'home', templates: 'home', content: 'home', letterroom: 'home', sandahouse: 'home', gourdhouse: 'home', hpohtawshed: 'home',
  lodge: 'lodge', bridgehut: 'lodge',
  noodlehouse: 'noodle', riceshop: 'noodle', snackshop: 'noodle',
  loomshed: 'loom',
  library: 'library', paperstore: 'library', committeeroom: 'library',
  backcover: 'backcover',
};
/** A few rooms keep their type's song but have their own ambience. */
export const ROOM_AMB = { press: 'room:press', backcover: 'room:library' };
/** Room types whose song is a mission cue. */
export const ROOM_SONG = { backcover: 'cue:d14back' };

/** Mission cues the game can name in update({ cue }); modes map to a cue unless one is named. */
export const CUES = ['talk', 'focus', 'nightpage', 'finale', 'd12rain', 'd14back', 'd15letter'];
export const MODE_CUE = { talk: 'talk', act: 'focus' }; // 'scene' keeps the place's music (cutscenes)

export const DISTRICTS = ['home', 'exercise', 'envelope', 'market', 'wharf', 'junction', 'hearth', 'garden', 'blank'];
export const DISTRICT_NAME = {
  home: 'Home Book', exercise: 'Exercise-Book Quarter', envelope: 'Envelope road', market: 'Envelope Market', wharf: 'Ledger Wharf',
  junction: 'Newsprint Junction (the Fold)', hearth: 'Hearth Row', garden: 'Diary Garden', blank: 'The Blank Page',
};

/** District rects [x0, z0, x1, z1] (+z south), first match wins (the Blank Page before the Garden). */
export const DISTRICT_RECTS = {
  home: [-26, -18, 26, 18], blank: [46, -62, 146, 18], exercise: [-71, 40, 79, 160], envelope: [-26, 160, 34, 258],
  market: [-96, 258, 39, 378], wharf: [-71, 378, 79, 498], junction: [39, 258, 189, 378], hearth: [119, 138, 269, 258], garden: [119, 18, 269, 138],
};
/** Other names the game may use for a district. */
export const DISTRICT_ALIAS = { quarter: 'exercise', fold: 'junction', backcover: 'blank', homebook: 'home' };
export function districtAt(x, z) {
  for (const [id, [x0, z0, x1, z1]] of Object.entries(DISTRICT_RECTS)) if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return id;
  return null;
}
