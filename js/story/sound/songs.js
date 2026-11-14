// Songs for the soundscape: towns, areas, rooms and mission cues. All original: every tune is a seeded
// random walk on a scale (the same tune each time), over chord loops written here, played by the
// instruments in bank.js. Myanmar colour comes from the instruments and the way time is kept
// (saung-like harp, pat-waing-like tuned drum, bamboo pattala, si and wa: small cymbals on the beat,
// a bamboo clapper between), never from a real song.
//
// A song: { level (balanced so every place sounds about as loud on a PHONE speaker: towns and areas ~-34 dB,
//   rooms ~-37, quiet places ~-40; measured with a 350 Hz high-pass), name, vibe, bpm, steps (per bar), spb (steps per beat), swing, seed, scale, chords, parts,
//           night?: { lead } }
// A part: { t: 'lead'|'counter'|'pad'|'drone'|'arp'|'bass'|'chord'|'drum'|'hit', i: instrument, v: level,
//           w: reverb send, g: 'tense'|'calm' (talk cue only), ...per-type fields (see playStep) }
import { rng, mtof } from './bank.js';
import { sample } from './fx.js';

const MODES = {
  majp: [0, 2, 4, 7, 9], minp: [0, 3, 5, 7, 10], dor: [0, 2, 3, 5, 7, 9, 10], lyd: [0, 2, 4, 6, 7, 9, 11],
  maj: [0, 2, 4, 5, 7, 9, 11], mix: [0, 2, 4, 5, 7, 9, 10], aeo: [0, 2, 3, 5, 7, 8, 10], whole: [0, 2, 4, 6, 8, 10],
};
/** Scale notes from `root` over `oct` octaves (plus the top root). */
const S = (root, mode, oct = 2) => {
  const out = [];
  for (let o = 0; o < oct; o++) for (const i of MODES[mode]) out.push(root + 12 * o + i);
  out.push(root + 12 * oct);
  return out;
};
const Q = { M: [0, 4, 7], m: [0, 3, 7], M7: [0, 4, 7, 11], m7: [0, 3, 7, 10], s2: [0, 2, 7], s4: [0, 5, 7], a9: [0, 4, 7, 14], six: [0, 4, 7, 9], m9: [0, 3, 7, 14], q: [0, 5, 10], d7: [0, 4, 7, 10] };
const C = (root, q) => Q[q].map((i) => root + i);

// rhythm pools (steps in a 16-step bar / 12-step bar)
const RH = {
  gentle: [[0, 6, 8, 12], [0, 4, 10], [2, 8, 12], [0, 8], [0, 6, 10, 12]],
  busy: [[0, 2, 4, 8, 10, 12], [0, 3, 6, 8, 12, 14], [0, 4, 6, 8, 12], [2, 4, 8, 10, 14], [0, 2, 6, 8, 10]],
  skip: [[0, 2, 4, 6, 8, 12], [0, 4, 8, 10, 12, 14], [0, 2, 4, 8], [0, 6, 8, 10, 12]],
  sparse: [[0, 8], [0], [4, 12], [0, 10], []],
  long: [[0, 8], [0, 12], [0, 4, 8], [0]],
  waltz: [[0, 4, 8], [0, 8], [0, 2, 4, 8], [4, 8, 10], [0, 6]],
  sway: [[0, 3, 6, 9], [0, 6], [0, 2, 6, 9], [3, 6, 9], [0, 4, 6]],
};

export const SONGS = {
  // ================= TOWNS =================
  'town:home': { level: 1.74, name: 'Opening page', vibe: 'tender, safe, a first page', bpm: 76, steps: 16, seed: 101,
    scale: S(65, 'majp'), chords: [C(53, 'a9'), C(50, 'm7'), C(46, 'M7'), C(48, 's4')],
    parts: [
      { t: 'lead', i: 'harp', v: 0.2, rh: RH.gentle, w: 0.3 },
      { t: 'pad', i: 'pad', v: 0.05, w: 0.4 },
      { t: 'bass', i: 'bass', v: 0.12, steps: [0, 10], deg: [0, 2] },
      { t: 'arp', i: 'musicbox', v: 0.03, every: 4, pat: [0, 2, 1, 3], oct: 24, w: 0.4 },
    ], night: { lead: 'musicbox' } },
  'town:exercise': { level: 0.84, name: 'Chalk and skipping ropes', vibe: 'bright, bouncy, school-day', bpm: 108, steps: 16, seed: 202,
    scale: S(67, 'majp'), chords: [C(55, 'M'), C(48, 'M'), C(52, 'm'), C(50, 's4')],
    parts: [
      { t: 'lead', i: 'marimba', v: 0.2, rh: RH.skip, w: 0.15 },
      { t: 'arp', i: 'pattala', v: 0.05, every: 2, pat: [0, 1, 2, 1], oct: 12, w: 0.1 },
      { t: 'bass', i: 'bass', v: 0.15, steps: [0, 6, 8], deg: [0, 0, 2] },
      { t: 'hit', i: 'wood', v: 0.08, steps: [4, 12] },
      { t: 'hit', i: 'shaker', v: 0.05, steps: [2, 6, 10, 14] },
      { t: 'hit', i: 'kick', m: 36, v: 0.16, steps: [0, 8] },
    ], night: { lead: 'harp' } },
  'town:envelope': { level: 0.92, name: 'Open envelope', vibe: 'airy, wandering, the road ahead', bpm: 88, steps: 16, seed: 303,
    scale: S(69, 'dor'), chords: [C(57, 'm7'), C(55, 'six'), C(50, 'six'), C(55, 's2')], // (D6, not Fmaj7: F would rub on the tune's F#)
    parts: [
      { t: 'lead', i: 'flute', v: 0.12, rh: RH.long, w: 0.4, legato: true },
      { t: 'drone', i: 'pad', v: 0.05, iv: [0, 7], every: 2, w: 0.5 },
      { t: 'arp', i: 'guitar', v: 0.07, every: 4, pat: [0, 2, 1, 3], oct: 12, w: 0.3 },
      { t: 'bass', i: 'bass', v: 0.098, steps: [0], deg: [0] },
      { t: 'hit', i: 'tick', v: 0.03, steps: [8] },
    ] },
  'town:market': { level: 1.19, name: 'Bazaar of letters', vibe: 'busy, warm, sunlit, haggling', bpm: 112, steps: 16, seed: 404,
    scale: S(62, 'majp'), chords: [C(50, 'M'), C(55, 'M'), C(47, 'm7'), C(57, 's4')],
    parts: [
      { t: 'lead', i: 'harp', v: 0.22, rh: RH.busy, w: 0.2 },
      { t: 'drum', i: 'pat', v: 0.13, steps: [0, 3, 6, 8, 10, 13], pitches: [50, 52, 54, 57, 59, 62] },
      { t: 'hit', i: 'si', m: 96, v: 0.035, steps: [0, 8] },
      { t: 'hit', i: 'wood', v: 0.08, steps: [4, 12] },
      { t: 'bass', i: 'bass', v: 0.128, steps: [0, 8], deg: [0, 2] },
      { t: 'counter', i: 'pattala', v: 0.07, rh: RH.sparse, oct: 12, w: 0.15 },
      { t: 'pad', i: 'pad', v: 0.025, w: 0.3 },
    ], night: { lead: 'ep', leadVol: 0.25 } },
  'town:wharf': { level: 0.52, name: 'Low tide', vibe: 'swaying, wistful, river light', bpm: 64, steps: 12, spb: 3, seed: 505,
    scale: S(69, 'aeo'), chords: [C(57, 'm'), C(53, 'M7'), C(48, 'a9'), C(55, 's4')],
    parts: [
      { t: 'lead', i: 'ep', v: 0.16, rh: RH.sway, w: 0.3 },
      { t: 'arp', i: 'guitar', v: 0.06, every: 1, pat: [0, 1, 2, 1, 2, 3], oct: 12, w: 0.25, vel: [1, 0.5, 0.6, 0.8, 0.5, 0.6] },
      { t: 'bass', i: 'bass', v: 0.128, steps: [0, 6], deg: [0, 2] },
      { t: 'pad', i: 'pad', v: 0.035, w: 0.5 },
    ] },
  'town:junction': { level: 1.17, name: 'Press of the Fold', vibe: 'clever, ticking, curious', bpm: 120, steps: 16, seed: 606,
    scale: S(64, 'dor'), chords: [C(52, 'm7'), C(45, 'M'), C(50, 'M'), C(47, 's4')], // E dorian: Em7 A D Bsus4 (no C natural under the C#)
    parts: [
      { t: 'arp', i: 'pattala', v: 0.05, every: 1, pat: [0, 2, 1, 2], oct: 12, w: 0.1, vel: [1, 0.5, 0.7, 0.5] },
      { t: 'lead', i: 'bell', v: 0.09, rh: RH.gentle, w: 0.3 },
      { t: 'bass', i: 'bass', v: 0.135, steps: [0, 3, 8, 11], deg: [0, 0, 2, 0] },
      { t: 'hit', i: 'tick', v: 0.05, steps: [2, 6, 10, 14] },
      { t: 'hit', i: 'kick', m: 36, v: 0.08, steps: [0, 8] },
    ] },
  'town:hearth': { level: 0.48, name: 'Warm loaf', vibe: 'cozy, homely, a waltz by the oven', bpm: 96, steps: 12, spb: 4, seed: 707,
    scale: S(70, 'maj'), chords: [C(46, 'M'), C(43, 'm7'), C(51, 'M'), C(53, 'M')],
    parts: [
      { t: 'lead', i: 'ep', v: 0.15, rh: RH.waltz, w: 0.25 },
      { t: 'bass', i: 'bass', v: 0.128, steps: [0], deg: [0] },
      { t: 'chord', i: 'guitar', v: 0.035, steps: [4, 8], oct: 12, w: 0.2 },
      { t: 'counter', i: 'musicbox', v: 0.03, rh: RH.sparse, oct: 12, w: 0.4 },
    ] },
  'town:garden': { level: 0.9, name: 'Green hours', vibe: 'dreamy, green, slow-growing', bpm: 80, steps: 16, seed: 808,
    scale: S(72, 'lyd'), chords: [C(48, 'M7'), C(50, 'M'), C(45, 'm7'), C(55, 'six')],
    parts: [
      { t: 'lead', i: 'flute', v: 0.11, rh: RH.gentle, w: 0.4, legato: true },
      { t: 'arp', i: 'harp', v: 0.08, every: 2, pat: [0, 1, 2, 3, 2, 1, 0, 2], oct: 12, w: 0.35 },
      { t: 'pad', i: 'pad', v: 0.04, w: 0.5 },
      { t: 'bass', i: 'bass', v: 0.098, steps: [0], deg: [0] },
    ] },
  'town:blank': { level: 2.35, name: 'White silence', vibe: 'open, quiet, a page not yet written', bpm: 52, steps: 16, seed: 909,
    scale: S(64, 'majp'), chords: [C(52, 's2'), C(52, 's2'), C(45, 's2'), C(50, 's2')],
    parts: [
      { t: 'lead', i: 'bell', v: 0.07, rh: RH.sparse, w: 0.6, rest: 0.4 },
      { t: 'drone', i: 'pad', v: 0.05, iv: [0, 7], every: 2, w: 0.6 },
      { t: 'counter', i: 'harp', v: 0.06, rh: RH.sparse, oct: -12, w: 0.5, rest: 0.5 },
    ] },
  // ================= AREAS =================
  'area:teasquare': { level: 2.37, name: 'Tea at four', vibe: 'easy, chatty, sweet tea', bpm: 92, steps: 16, swing: 0.2, seed: 1101,
    scale: S(65, 'majp'), chords: [C(53, 'M7'), C(50, 'm7'), C(55, 'm7'), C(48, 'd7')],
    parts: [
      { t: 'lead', i: 'harp', v: 0.17, rh: RH.gentle, w: 0.2 },
      { t: 'chord', i: 'ep', v: 0.035, steps: [0, 10], oct: 12, w: 0.2 },
      { t: 'bass', i: 'bass', v: 0.12, steps: [0, 8], deg: [0, 2] },
      { t: 'hit', i: 'wood', v: 0.05, steps: [12] },
      { t: 'hit', i: 'siShort', m: 96, v: 0.03, steps: [4] },
    ] },
  'area:jetties': { level: 1.4, name: 'Boards over clouds', vibe: 'drifting, open, far-off', bpm: 58, steps: 12, spb: 3, seed: 1202,
    scale: S(64, 'minp'), chords: [C(52, 'm7'), C(48, 'M7'), C(50, 's2'), C(47, 's4')],
    parts: [
      { t: 'arp', i: 'guitar', v: 0.07, every: 3, pat: [0, 2, 1, 3], oct: 12, w: 0.4 },
      { t: 'lead', i: 'flute', v: 0.09, rh: RH.sparse, w: 0.5, legato: true },
      { t: 'pad', i: 'pad', v: 0.04, w: 0.6 },
    ] },
  'area:schoolyard': { level: 0.87, name: 'Skipping rhyme', vibe: 'playful, quick, sunny', bpm: 126, steps: 16, seed: 1303,
    scale: S(72, 'majp'), chords: [C(48, 'M'), C(53, 'M'), C(48, 'M'), C(55, 'M')],
    parts: [
      { t: 'lead', i: 'marimba', v: 0.18, rh: RH.skip, w: 0.1 },
      { t: 'hit', i: 'wood', v: 0.1, steps: [4, 12] },
      { t: 'hit', i: 'kick', m: 36, v: 0.16, steps: [0, 8] },
      { t: 'hit', i: 'shaker', v: 0.04, steps: [2, 6, 10, 14] },
      { t: 'bass', i: 'bass', v: 0.128, steps: [0, 8], deg: [0, 2] },
    ] },
  'area:bakeryrow': { level: 0.84, name: 'Sugar on the sill', vibe: 'sweet, warm, music-box', bpm: 100, steps: 12, spb: 4, seed: 1404,
    scale: S(75, 'majp'), chords: [C(51, 'M'), C(48, 'm'), C(56, 'M'), C(58, 'M')],
    parts: [
      { t: 'lead', i: 'musicbox', v: 0.1, rh: RH.waltz, w: 0.35 },
      { t: 'bass', i: 'bass', v: 0.105, steps: [0], deg: [0] },
      { t: 'chord', i: 'ep', v: 0.03, steps: [4, 8], oct: 12, w: 0.2 },
    ] },
  'area:kitefield': { level: 0.86, name: 'High string', vibe: 'free, lifting, wind in the tail', bpm: 84, steps: 16, seed: 1505,
    scale: S(67, 'mix'), chords: [C(55, 's2'), C(53, 's2'), C(48, 's2'), C(55, 's4')],
    parts: [
      { t: 'lead', i: 'flute', v: 0.12, rh: RH.long, w: 0.45, legato: true },
      { t: 'drone', i: 'pad', v: 0.05, iv: [0, 7, 12], every: 2, w: 0.5 },
      { t: 'arp', i: 'harp', v: 0.07, every: 2, pat: [0, 1, 2, 3], oct: 12, w: 0.35 },
    ] },
  'area:bridge': { level: 1.8, name: 'Halfway across', vibe: 'suspended, careful, wonder', bpm: 66, steps: 16, seed: 1606,
    scale: S(62, 'lyd'), chords: [C(50, 's2'), C(52, 's4'), C(50, 's2'), C(45, 's2')],
    parts: [
      { t: 'arp', i: 'harp', v: 0.08, every: 2, pat: [0, 1, 2, 1], oct: 12, w: 0.45 },
      { t: 'lead', i: 'bell', v: 0.06, rh: RH.sparse, w: 0.6 },
      { t: 'pad', i: 'pad', v: 0.045, w: 0.6 },
    ] },
  'area:lodgeporch': { level: 1.11, name: 'Porch light', vibe: 'slow, warm, end of a long walk', bpm: 70, steps: 12, spb: 4, seed: 1707,
    scale: S(62, 'majp'), chords: [C(50, 'M'), C(47, 'm'), C(43, 'M'), C(45, 's4')],
    parts: [
      { t: 'arp', i: 'guitar', v: 0.09, every: 2, pat: [0, 1, 2, 1, 2, 3], oct: 0, w: 0.3 },
      { t: 'lead', i: 'flute', v: 0.08, rh: RH.sparse, w: 0.4, legato: true },
      { t: 'bass', i: 'bass', v: 0.098, steps: [0], deg: [0] },
    ] },
  // ================= ROOMS (softer, closer, less reverb) =================
  'room:teashop': { level: 2.45, name: 'Steam and sugar', vibe: 'close, chatty, sweet', bpm: 84, steps: 16, swing: 0.22, seed: 2101,
    scale: S(67, 'majp'), chords: [C(55, 'M7'), C(52, 'm7'), C(48, 'M7'), C(50, 'd7')],
    parts: [
      { t: 'chord', i: 'ep', v: 0.035, steps: [0, 10], oct: 0, w: 0.12 },
      { t: 'lead', i: 'harp', v: 0.12, rh: RH.gentle, w: 0.12, rest: 0.2 },
      { t: 'bass', i: 'bass', v: 0.098, steps: [0, 8], deg: [0, 2] },
    ] },
  'room:bakery': { level: 0.69, name: 'Proving dough', vibe: 'sweet, patient, warm', bpm: 90, steps: 12, spb: 4, seed: 2202,
    scale: S(72, 'majp'), chords: [C(48, 'M'), C(45, 'm'), C(53, 'M'), C(55, 'M')],
    parts: [
      { t: 'lead', i: 'musicbox', v: 0.08, rh: RH.waltz, w: 0.15 },
      { t: 'arp', i: 'pattala', v: 0.04, every: 4, pat: [0, 1, 2], oct: 12, w: 0.1 },
      { t: 'bass', i: 'bass', v: 0.09, steps: [0], deg: [0] },
    ] },
  'room:classroom': { level: 1.64, name: 'Slate and chalk', vibe: 'curious, careful, thinking', bpm: 96, steps: 16, seed: 2303,
    scale: S(69, 'minp'), chords: [C(57, 'm7'), C(53, 'M7'), C(48, 'M'), C(55, 'M')], // A minor pentatonic: no C#/F# against Am7 and Fmaj7
    parts: [
      { t: 'arp', i: 'guitar', v: 0.05, every: 2, pat: [0, 2, 1, 2], oct: 12, w: 0.1, vel: [1, 0.6, 0.8, 0.6] },
      { t: 'lead', i: 'marimba', v: 0.1, rh: RH.gentle, w: 0.1, rest: 0.3 },
      { t: 'bass', i: 'bass', v: 0.09, steps: [0], deg: [0] },
    ] },
  'room:workshop': { level: 2.34, name: 'Workbench', vibe: 'steady, handmade, focused', bpm: 100, steps: 16, seed: 2404,
    scale: S(62, 'dor'), chords: [C(50, 'm7'), C(48, 'M'), C(43, 'M'), C(48, 's4')], // D dorian: G major, not Bb (the tune has B natural)
    parts: [
      { t: 'arp', i: 'pattala', v: 0.05, every: 2, pat: [0, 1, 2, 1], oct: 12, w: 0.08 },
      { t: 'hit', i: 'tick', v: 0.035, steps: [4, 12] },
      { t: 'bass', i: 'bass', v: 0.105, steps: [0, 6, 8], deg: [0, 0, 2] },
      { t: 'lead', i: 'harp', v: 0.08, rh: RH.sparse, w: 0.12 },
    ] },
  'room:post': { level: 1.7, name: 'Sorting hour', vibe: 'orderly, light, busy hands', bpm: 104, steps: 16, seed: 2505,
    scale: S(65, 'majp'), chords: [C(53, 'M'), C(50, 'm'), C(46, 'M'), C(48, 'M')],
    parts: [
      { t: 'arp', i: 'guitar', v: 0.05, every: 2, pat: [0, 1, 2, 1], oct: 12, w: 0.08, short: 0.12 },
      { t: 'hit', i: 'tick', v: 0.03, steps: [0, 4, 8, 12] },
      { t: 'lead', i: 'pattala', v: 0.09, rh: RH.skip, w: 0.1, rest: 0.25 },
      { t: 'bass', i: 'bass', v: 0.09, steps: [0, 8], deg: [0, 2] },
    ] },
  'room:home': { level: 2.67, name: 'Writing desk', vibe: 'tender, private, a lamp on', bpm: 70, steps: 16, seed: 2606,
    scale: S(64, 'majp'), chords: [C(52, 'a9'), C(49, 'm7'), C(45, 'M7'), C(47, 's4')],
    parts: [
      { t: 'lead', i: 'harp', v: 0.12, rh: RH.gentle, w: 0.15 },
      { t: 'pad', i: 'pad', v: 0.035, w: 0.2 },
      { t: 'bass', i: 'bass', v: 0.075, steps: [0], deg: [0] },
    ], night: { lead: 'musicbox' } },
  'room:lodge': { level: 1.37, name: 'Fireside', vibe: 'warm, slow, travellers resting', bpm: 72, steps: 12, spb: 4, seed: 2707,
    scale: S(62, 'majp'), chords: [C(50, 'M'), C(43, 'M'), C(47, 'm'), C(45, 's4')],
    parts: [
      { t: 'arp', i: 'guitar', v: 0.08, every: 2, pat: [0, 1, 2, 1, 2, 3], w: 0.15 },
      { t: 'lead', i: 'flute', v: 0.07, rh: RH.sparse, w: 0.2, legato: true },
      { t: 'bass', i: 'bass', v: 0.09, steps: [0], deg: [0] },
    ] },
  'room:noodle': { level: 1.48, name: 'Steam bowl', vibe: 'homey, bustling, steaming', bpm: 96, steps: 16, seed: 2808,
    scale: S(67, 'majp'), chords: [C(55, 'M'), C(52, 'm'), C(48, 'M'), C(50, 'M')],
    parts: [
      { t: 'lead', i: 'pattala', v: 0.1, rh: RH.busy, w: 0.1, rest: 0.25 },
      { t: 'chord', i: 'ep', v: 0.03, steps: [4, 12], oct: 0, w: 0.1 },
      { t: 'bass', i: 'bass', v: 0.098, steps: [0, 8], deg: [0, 2] },
      { t: 'hit', i: 'wood', v: 0.04, steps: [6, 14] },
    ] },
  'room:loom': { level: 1.77, name: 'Shuttle song', vibe: 'lilting, patient, threads crossing', bpm: 128.6, steps: 12, spb: 4, seed: 2909,
    scale: S(62, 'majp'), chords: [C(50, 'M'), C(50, 'M'), C(47, 'm'), C(45, 's4')],
    parts: [
      { t: 'lead', i: 'harp', v: 0.12, rh: RH.waltz, w: 0.15 },
      { t: 'drum', i: 'pat', v: 0.06, steps: [0, 8], pitches: [50, 57, 54] },
      { t: 'bass', i: 'bass', v: 0.075, steps: [0], deg: [0], every: 2 },
    ] },
  'room:library': { level: 3.57, name: 'Quiet shelves', vibe: 'hushed, deep, unhurried', bpm: 60, steps: 16, seed: 3010,
    scale: S(69, 'majp'), chords: [C(57, 's2'), C(50, 'M7'), C(55, 's2'), C(52, 'm7')],
    parts: [
      { t: 'lead', i: 'bell', v: 0.05, rh: RH.sparse, w: 0.3, rest: 0.35 },
      { t: 'pad', i: 'pad', v: 0.035, w: 0.3 },
      { t: 'counter', i: 'harp', v: 0.05, rh: RH.sparse, oct: -12, w: 0.2, rest: 0.4 },
    ] },
  // ================= MISSION CUES =================
  'cue:talk': { level: 2.48, name: 'Thinking it through', vibe: 'thoughtful, a little tense, eases when calm', bpm: 72, steps: 16, seed: 4101,
    scale: S(65, 'majp'), chords: [C(53, 'M7'), C(50, 'm7'), C(46, 'M7'), C(48, 's4')],
    parts: [
      { t: 'lead', i: 'harp', v: 0.1, rh: RH.sparse, w: 0.3, g: 'calm' },
      { t: 'pad', i: 'pad', v: 0.04, w: 0.3, g: 'calm' },
      { t: 'bass', i: 'bass', v: 0.09, steps: [0, 3, 6, 8, 11, 14], deg: [0, 0, 0, 0, 0, 0], g: 'tense' },
      { t: 'drone', i: 'pad', v: 0.035, iv: [1, 6], every: 2, oct: 12, w: 0.3, g: 'tense' },
      { t: 'hit', i: 'tick', v: 0.03, steps: [2, 10], g: 'tense' },
      { t: 'arp', i: 'pattala', v: 0.045, every: 2, pat: [0, 0, 0, 0, 0, 0, 0, 1], oct: 12, w: 0.2, vel: [1, 0.45, 0.7, 0.45], g: 'tense' },
      { t: 'bass', i: 'bass', v: 0.09, steps: [0], deg: [0], g: 'calm' },
    ] },
  'cue:focus': { level: 1.41, name: 'Steady hands', vibe: 'focused, light pulse, no hurry', bpm: 100, steps: 16, seed: 4202,
    scale: S(69, 'minp'), chords: [C(57, 'm7'), C(53, 'M7'), C(55, 'six'), C(52, 'm7')],
    parts: [
      { t: 'arp', i: 'marimba', v: 0.07, every: 2, pat: [0, 2, 1, 3], oct: 12, w: 0.15 },
      { t: 'hit', i: 'kick', m: 36, v: 0.08, steps: [0, 8] },
      { t: 'hit', i: 'shaker', v: 0.035, steps: [2, 6, 10, 14] },
      { t: 'bass', i: 'bass', v: 0.105, steps: [0, 8], deg: [0, 2] },
      { t: 'lead', i: 'bell', v: 0.05, rh: RH.sparse, w: 0.3, rest: 0.4 },
    ] },
  'cue:nightpage': { level: 1.0, name: 'Night page', vibe: 'hushed, lamplit, writing late', bpm: 58, steps: 12, spb: 4, seed: 4303,
    scale: S(72, 'majp'), chords: [C(52, 'm7'), C(48, 'M7'), C(53, 'M7'), C(55, 's4')], // C pentatonic over Em7 Cmaj7 Fmaj7 Gsus4
    parts: [
      { t: 'lead', i: 'musicbox', v: 0.08, rh: RH.waltz, w: 0.45 },
      { t: 'pad', i: 'pad', v: 0.035, w: 0.5 },
      { t: 'arp', i: 'harp', v: 0.05, every: 4, pat: [0, 1, 2], oct: 0, w: 0.4 },
    ] },
  'cue:finale': { level: 1.17, name: 'The road is yours', vibe: 'bright, full, grateful, onward', bpm: 104, steps: 16, seed: 4404,
    scale: S(62, 'majp'), chords: [C(50, 'M'), C(55, 'M'), C(47, 'm'), C(57, 'M')],
    parts: [
      { t: 'lead', i: 'harp', v: 0.2, rh: RH.skip, w: 0.25 },
      { t: 'counter', i: 'flute', v: 0.08, rh: RH.long, oct: 0, w: 0.4, legato: true },
      { t: 'drum', i: 'pat', v: 0.12, steps: [0, 3, 6, 8, 11, 14], pitches: [50, 52, 54, 57, 59, 62] },
      { t: 'hit', i: 'si', m: 96, v: 0.035, steps: [0, 8] },
      { t: 'hit', i: 'wood', v: 0.07, steps: [4, 12] },
      { t: 'arp', i: 'pattala', v: 0.04, every: 2, pat: [0, 1, 2, 1], oct: 24, w: 0.15 },
      { t: 'bass', i: 'bass', v: 0.135, steps: [0, 8, 10], deg: [0, 2, 0] },
      { t: 'pad', i: 'pad', v: 0.035, w: 0.4 },
    ] },
  'cue:d12rain': { level: 0.51, name: 'Rain on the beds', vibe: 'grey, patient, a little hope', bpm: 66, steps: 16, seed: 4505,
    scale: S(69, 'aeo'), chords: [C(57, 'm7'), C(53, 'M7'), C(48, 'a9'), C(55, 's4')],
    parts: [
      { t: 'lead', i: 'ep', v: 0.13, rh: RH.gentle, w: 0.35 },
      { t: 'pad', i: 'pad', v: 0.04, w: 0.4 },
      { t: 'bass', i: 'bass', v: 0.09, steps: [0, 10], deg: [0, 2] },
    ] },
  'cue:d14back': { level: 1.52, name: 'Inside the back cover', vibe: 'mysterious, hushed, old paper', bpm: 54, steps: 16, seed: 4606,
    scale: S(64, 'whole'), chords: [C(52, 's2'), C(52, 's2'), C(54, 's2'), C(50, 's2')],
    parts: [
      { t: 'lead', i: 'bell', v: 0.06, rh: RH.sparse, w: 0.7, rest: 0.3 },
      { t: 'drone', i: 'pad', v: 0.06, iv: [0, 7, 14], every: 2, w: 0.6 },
      { t: 'hit', i: 'tick', v: 0.025, steps: [0, 8] },
      { t: 'counter', i: 'harp', v: 0.05, rh: RH.sparse, oct: -12, w: 0.6, rest: 0.4 },
    ] },
  'cue:d15letter': { level: 1.68, name: 'The last letter', vibe: 'tender, bittersweet, thank you', bpm: 76, steps: 12, spb: 4, seed: 4707,
    scale: S(69, 'majp'), chords: [C(54, 'm'), C(50, 'M'), C(45, 'M'), C(52, 'M')],
    parts: [
      { t: 'lead', i: 'harp', v: 0.15, rh: RH.waltz, w: 0.35 },
      { t: 'counter', i: 'flute', v: 0.07, rh: RH.long, oct: -12, w: 0.45, legato: true },
      { t: 'bass', i: 'bass', v: 0.09, steps: [0], deg: [0] },
      { t: 'pad', i: 'pad', v: 0.03, w: 0.4 },
    ] },
};

/** 16 bars of melody for one part: an 8-bar tune, then its first half and a varied second half. */
function melody(S, P, seed) {
  const r = rng(seed), bars = [], sc = S.scale, rh = P.rh;
  let idx = Math.floor(sc.length / 3);
  for (let b = 0; b < 8; b++) {
    const pat = rh[Math.floor(r() * rh.length)], ch = S.chords[b % S.chords.length], notes = [];
    for (let k = 0; k < pat.length; k++) {
      idx = Math.max(0, Math.min(sc.length - 1, idx + Math.round((r() - 0.5) * 3.4)));
      let n = sc[idx];
      const phraseEnd = (b % 4 === 3) && k === pat.length - 1;
      if (phraseEnd || k === 0) { // land on a chord tone at bar starts and phrase ends
        let best = idx;
        for (let d = 0; d < sc.length; d++) for (const j of [idx - d, idx + d]) if (best === idx && j >= 0 && j < sc.length && ch.some((c) => (c - sc[j]) % 12 === 0)) best = j;
        idx = best; n = sc[idx];
      }
      if (P.rest && r() < P.rest && !phraseEnd) continue;
      const nextStep = k + 1 < pat.length ? pat[k + 1] : S.steps;
      notes.push([pat[k], n, nextStep - pat[k]]);
    }
    bars.push(notes);
  }
  const r2 = rng(seed + 7), up = (x) => sc[Math.min(sc.length - 1, sc.indexOf(x) + 1)];
  return [...bars, ...bars.slice(0, 4), ...bars.slice(4).map((ns) => ns.map(([p, x, l]) => [p, r2() < 0.35 ? up(x) : x, l]))];
}

const HIT_M = { wood: 72, tick: 84, shaker: 84, si: 96, siShort: 96, kick: 36 };

/** Time-of-day colour: period 'morning'|'noon'|'evening'|'night'. */
const PERIOD = {
  morning: { tempo: 0.95, hits: 0.7, wet: 0, vol: 0.95 },
  noon: { tempo: 1, hits: 1, wet: 0, vol: 1 },
  evening: { tempo: 0.92, hits: 0.65, wet: 0.06, vol: 0.95 },
  night: { tempo: 0.84, hits: 0.3, wet: 0.12, vol: 0.85 },
};

/**
 * A playing song. E = { ctx, bank, verb }; out = node to play into.
 * Returns { gain, tense, calm, schedule(until), stop(fade), notes } (notes: count scheduled, for stats).
 */
export function startSong(E, key, out, { period = 'noon', fade = 2.5, at = null } = {}) {
  const S = SONGS[key];
  if (!S) return null;
  const { ctx } = E, V = PERIOD[period] || PERIOD.noon;
  const night = period === 'night' && S.night ? S.night : {};
  const t0 = at ?? ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(V.vol * (S.level || 1), t0 + Math.max(0.05, fade));
  gain.connect(out);
  const groups = { main: gain, tense: ctx.createGain(), calm: ctx.createGain() };
  groups.tense.gain.value = 0; groups.tense.connect(gain); groups.calm.connect(gain);
  const parts = S.parts.map((P, i) => {
    const pg = ctx.createGain();
    const isHit = P.t === 'hit' || P.t === 'drum';
    const swapped = P.t === 'lead' && night.lead && night.lead !== P.i;
    // (bass x0.6: it carried most of the energy, which a phone speaker cannot play, and boomed on headphones)
    pg.gain.value = P.v * (isHit ? V.hits : 1) * (swapped ? night.leadVol ?? 0.55 : 1) * (P.t === 'bass' ? 0.6 : 1);
    pg.connect(groups[P.g] || gain);
    if (P.w || V.wet) {
      const s = ctx.createGain(); s.gain.value = Math.min(1, (P.w || 0) + V.wet); pg.connect(s); s.connect(E.verb);
    }
    const inst = P.t === 'lead' && night.lead ? night.lead : P.i;
    return { P, pg, inst, i, alt: null, mel: P.t === 'lead' || P.t === 'counter' ? melody(S, P, S.seed + i * 99) : null, r: rng(S.seed + i * 13) };
  });
  const spb = S.spb || 4;
  const st = {
    key, S, gain, groups, notes: 0, step: 0,
    six: 60 / (S.bpm * V.tempo) / spb, next: t0 + 0.08, stopAt: Infinity,
    schedule(until) {
      while (st.next < until && st.next < st.stopAt) {
        const bar = Math.floor(st.step / S.steps), s = st.step % S.steps;
        const t = st.next + (s % 2 && spb === 4 ? (S.swing || 0) * st.six : 0);
        for (const p of parts) playStep(p, bar, s, t);
        st.step++;
        st.next += st.six;
      }
    },
    stop(f = 2.5) {
      const t = ctx.currentTime;
      // (pin the current value at t first: a linear ramp starts from the previous event, which may be the
      // fade-in that ended minutes ago, so the old song would jump halfway down at once)
      const g = gain.gain, v = g.value;
      g.cancelScheduledValues(t); g.setValueAtTime(v, t);
      g.linearRampToValueAtTime(0, t + Math.max(0.05, f));
      st.endAt = t + f + 2.5;
      st.stopAt = t + f; // keep playing while it fades (stopping the notes at once left a hole in every cross-fade)
    },
    dispose() { try { gain.disconnect(); } catch { /* ignore */ } },
  };
  function note(p, midi, t, vel = 1, dur = 0) {
    sample(E, p.pg, p.inst, midi, t, vel, dur ? { dur, rel: 0.3 } : {});
    st.notes++;
  }
  function playStep(p, bar, s, t) {
    const { P } = p, ch = S.chords[bar % S.chords.length], barLen = S.steps * st.six;
    switch (P.t) {
      case 'lead': case 'counter': {
        // a long stay should not hear one 16-bar loop: cycle 1 plays a second tune on the same chords,
        // cycle 3 lets the lead rest for 8 bars (the bed carries on), then the tune comes home
        const cyc = Math.floor(bar / 16) % 4;
        if (cyc === 3 && bar % 16 < 8 && P.t === 'lead') break;
        const mel = cyc === 1 ? (p.alt ||= melody(S, P, S.seed + p.i * 99 + 5003)) : p.mel;
        for (const [ps, n, len] of mel[bar % 16]) if (ps === s) note(p, n + (P.oct || 0), t, 1, P.legato ? len * st.six * 0.95 : 0);
        break;
      }
      case 'pad':
        if (s === 0 && bar % (P.every || 1) === 0) for (const n of ch) note(p, n + (P.oct || 0), t, 1 / ch.length * 1.6, barLen * (P.every || 1));
        break;
      case 'drone':
        if (s === 0 && bar % (P.every || 2) === 0) for (const iv of P.iv) note(p, ch[0] + iv + (P.oct || 0), t, 0.8, barLen * (P.every || 2));
        break;
      case 'arp':
        if (s % (P.every || 2) === 0) {
          const k = (bar * S.steps + s) / (P.every || 2), i = P.pat[k % P.pat.length];
          const n = ch[i % ch.length] + (i >= ch.length ? 12 : 0) + (P.oct || 0);
          note(p, n, t, P.vel ? P.vel[k % P.vel.length] : 1, P.short || 0);
        }
        break;
      case 'bass': {
        if (P.every && bar % P.every) break;
        const k = P.steps.indexOf(s);
        if (k >= 0) { let n = ch[P.deg[k] % ch.length]; while (n >= 50) n -= 12; while (n < 38) n += 12; note(p, n + (P.oct || 0), t, k ? 0.8 : 1); }
        break;
      }
      case 'chord':
        if (P.steps.includes(s)) for (const n of ch) note(p, n + (P.oct || 0), t, 1 / ch.length * 1.5);
        break;
      case 'drum': {
        const k = P.steps.indexOf(s);
        if (k >= 0) {
          const motif = Math.floor(bar / 2) % 4, rr = rng(S.seed * 7 + motif * 31 + k);
          note(p, P.pitches[Math.floor(rr() * P.pitches.length)], t, k === 0 ? 1 : 0.65 + rr() * 0.3);
        }
        break;
      }
      case 'hit':
        if (P.steps.includes(s) && (!P.prob || p.r() < P.prob)) note(p, P.m || HIT_M[P.i] || 72, t, s === 0 ? 1 : 0.8);
        break;
      default:
    }
  }
  return st;
}

/** One-shot stings: short phrases that sit over everything (lesson landed, a stamp, arriving in a town). */
export const STINGS = {
  lesson: { name: 'Lesson lands', vibe: 'warm click of understanding' },
  stamp: { name: 'Stamp', vibe: 'small, proud, done' },
  page: { name: 'Page turns', vibe: 'a new day' },
  arrive: { name: 'Arrival', vibe: 'the town opens its doors (uses the town song\'s instrument and scale)' },
};
export function playSting(E, out, name, t, arg) {
  const n = (inst, m, dt, v, dur) => sample(E, out, inst, m, t + dt, v, dur ? { dur, rel: 0.6 } : {});
  if (name === 'lesson') {
    [62, 64, 66, 69, 71, 74, 76].forEach((m, k) => n('harp', m, k * 0.07, 0.22));
    for (const m of [74, 78, 81]) n('bell', m, 0.55, 0.06);
    n('si', 96, 0.55, 0.05);
    for (const m of [50, 57, 62, 66]) n('pad', m, 0.5, 0.05, 2.2);
    return 3.5;
  }
  if (name === 'stamp') {
    n('kick', 38, 0, 0.3); n('wood', 60, 0, 0.12);
    [72, 76, 79].forEach((m, k) => n('marimba', m, 0.18 + k * 0.09, 0.15));
    n('bell', 84, 0.45, 0.05);
    return 1.6;
  }
  if (name === 'page') {
    [67, 72, 74, 79].forEach((m, k) => n('musicbox', m, k * 0.16, 0.1));
    for (const m of [55, 62, 67]) n('pad', m, 0.1, 0.04, 2);
    return 3;
  }
  if (name === 'arrive') {
    const S = SONGS['town:' + arg] || SONGS['town:home'];
    const lead = S.parts.find((p) => p.t === 'lead')?.i || 'harp', sc = S.scale;
    const pick = [0, 2, 4, 5, 7].map((k) => sc[Math.min(sc.length - 1, k)]);
    pick.forEach((m, k) => n(lead === 'flute' ? 'harp' : lead, m, k * 0.12, 0.16));
    n(lead, sc[Math.min(sc.length - 1, 9)], 0.7, 0.14, lead === 'flute' ? 1.4 : 0);
    for (const m of S.chords[0]) n('pad', m, 0.3, 0.035, 2.4);
    n('si', 96, 0.7, 0.03);
    return 3.5;
  }
  return 0;
}
