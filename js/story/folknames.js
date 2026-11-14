// Names for the townsfolk nobody wrote by hand: the ambient folk extras-chatter.js spawns and the residents of the
// everyday houses (rooms/generic.js).
//
// Owner's rules:
//  - every one of them has a name of their own, never "Aunty" / "Uncle";
//  - no name is used in more than one town;
//  - no name (or given name) that the story cast or the region townsfolk already have (one Ko Zaw in the book).
//
// How: one long, fixed list of given names per sex (two syllables first, then three, the way Burmese names are made),
// dealt out like cards to the 9 districts: list[j * 9 + districtIndex] is the district's j-th name. So each name belongs
// to exactly one town, and within a town every position is a different name.
//   - house residents: position = houseRank * 3 + resident  (houseRank = the house's place among its town's houses),
//     so every resident in a town has a different name, and the same house keeps the same people every visit;
//   - ambient folk: positions after the houses' block, a fixed set of FOLK_PER_TOWN walk-around people per town. Each
//     slot is one person: the same slot always has the same name AND the same look (extras-chatter seeds the look from
//     the slot), so a name met twice in a town is the same person again.
//
//   folkName({ district, age, woman, house, slot })  -> { my, en }  house: a generic room id 'g:<district>:<item>',
//                                                     slot: the resident's index; no house: slot = an ambient folk slot
//   folkSlot(district, busy)                          a free ambient slot for that town (least recently used)
//   releaseFolkSlot(district, slot)                   that person left the scene
//   registerHouses(doors)                             the generic doors (extras-houses.js) so houses are ranked per town
//   reserveNames(list)                                more names to keep clear of
//
// DRAFT(my): the Burmese spellings are for Maya to proofread.

export const TOWNS = ['home', 'exercise', 'envelope', 'market', 'wharf', 'junction', 'hearth', 'garden', 'blank'];
export const FOLK_PER_TOWN = 40;
// houses per town today (generic-doors.js report); registerHouses() replaces these with the real counts
const HOUSES = { home: 0, exercise: 37, envelope: 49, market: 109, wharf: 41, junction: 120, hearth: 26, garden: 144, blank: 2 };
const PER_HOUSE = 4; // residents per everyday house, at most (rooms/generic.js has up to 3)

const W = [['Khin', 'ခင်'], ['Mya', 'မြ'], ['Aye', 'အေး'], ['Thin', 'သင်း'], ['San', 'စန်း'], ['Nu', 'နု'], ['Su', 'စု'],
  ['Hnin', 'နှင်း'], ['May', 'မေ'], ['Ei', 'အိ'], ['Cho', 'ချို'], ['Thet', 'သက်'], ['Phyu', 'ဖြူ'], ['Wah', 'ဝါ'],
  ['Htwe', 'ထွေး'], ['Nwe', 'နွယ်'], ['Lay', 'လေး'], ['Win', 'ဝင်း'], ['Myint', 'မြင့်'], ['Hlaing', 'လှိုင်'], ['Moe', 'မိုး'],
  ['Zin', 'ဇင်'], ['Thu', 'သူ'], ['Yi', 'ရီ'], ['Wai', 'ဝေ'], ['Shwe', 'ရွှေ'], ['Myat', 'မြတ်'], ['Thiri', 'သီရိ'], ['Hnaung', 'နှောင်း'], ['Yadana', 'ရတနာ']];
const M = [['Kyaw', 'ကျော်'], ['Zaw', 'ဇော်'], ['Aung', 'အောင်'], ['Myo', 'မျိုး'], ['Min', 'မင်း'], ['Htet', 'ထက်'],
  ['Tun', 'ထွန်း'], ['Win', 'ဝင်း'], ['Nay', 'နေ'], ['Kaung', 'ကောင်း'], ['Hein', 'ဟိန်း'], ['Soe', 'စိုး'], ['Thant', 'သန့်'], ['Pyae', 'ပြည့်'],
  ['Naing', 'နိုင်'], ['Lin', 'လင်း'], ['Myat', 'မြတ်'], ['Paing', 'ပိုင်'], ['Wai', 'ဝေ'], ['Oo', 'ဦး'], ['Thu', 'သူ'], ['Zin', 'ဇင်'],
  ['Htoo', 'ထူး'], ['Khant', 'ခန့်'], ['Thiha', 'သီဟ'], ['Sithu', 'စည်သူ'], ['Ye', 'ရဲ'], ['Phyo', 'ဖြိုး'], ['Lwin', 'လွင်'], ['Thura', 'သူရ']];

const HON = { U: ['U', 'ဦး'], Daw: ['Daw', 'ဒေါ်'], Ko: ['Ko', 'ကို'], Ma: ['Ma', 'မ'], Maung: ['Maung', 'မောင်'] };
const PREFIXES = /^(U|Daw|Ko|Ma|Maung|Mi|Grandmother|the)\s+/i;

// a small seeded shuffle so the list is the same on every phone, every load
function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function hashName(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function shuffled(arr, seed) { const r = mulberry(seed), a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const LONG = new Set(['Thiri', 'Yadana', 'Thiha', 'Sithu', 'Thura']); // two syllables already
function buildList(S, seed) {
  const two = [], three = [];
  for (const a of S) for (const b of S) if (a[0] !== b[0]) {
    two.push({ en: `${a[0]} ${b[0]}`, my: a[1] + b[1] });
    if (LONG.has(a[0]) || LONG.has(b[0])) continue; // (never four syllables)
    for (const c of S) if (c[0] !== a[0] && c[0] !== b[0] && !LONG.has(c[0])) three.push({ en: `${a[0]} ${b[0]} ${c[0]}`, my: a[1] + b[1] + c[1] });
  }
  return [...shuffled(two, seed), ...shuffled(three, seed + 1)];
}
let LIST = null; // built on first use: { woman: [...], man: [...] }
const lists = () => {
  if (LIST) return LIST;
  const woman = buildList(W, 11);
  const hers = new Set(woman.map((g) => g.en)); // (some syllables are shared: a name goes to one sex only)
  return (LIST = { woman, man: buildList(M, 23).filter((g) => !hers.has(g.en)) });
};

const takenGiven = new Set(); // given names (no honorific), lower case, that are someone's already
const seqCache = new Map(); // `${town}|${sex}` -> that town's names in order, reserved ones skipped

/** keep clear of these names: [{ en, my }] or [{ name: { en, my } }] */
export function reserveNames(list) {
  let added = false;
  for (const x of list || []) {
    const n = x?.name || x;
    if (!n?.en) continue;
    const g = n.en.replace(PREFIXES, '').trim().toLowerCase();
    if (!takenGiven.has(g)) { takenGiven.add(g); added = true; }
  }
  if (added) seqCache.clear();
}
const FOLK_FILES = ['hearth-folk.js', 'garden-folk.js', 'garden-town-folk.js', 'market-townfolk.js', 'wharf-folk.js', 'junction-people.js', 'blank-folk.js'];
const collect = (m) => {
  for (const v of Object.values(m || {})) {
    const arr = Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : [];
    reserveNames(arr.filter((p) => p && p.name && p.name.en));
  }
};
// the special runner, Ko Hein Htet (extras-heinhtet.js): nobody else may be called Hein / Hein Htet
reserveNames([{ en: 'Ko Hein Htet', my: 'ကိုဟိန်းထက်' }, { en: 'Ko Hein', my: 'ကိုဟိန်း' }]);
const NO_HEIN = (g) => /Hein/.test(g.en);
export const namesReady = Promise.all([
  import('./cast.js').then(collect).catch(() => null),
  ...FOLK_FILES.map((f) => import(`./world/regions/${f}`).then(collect).catch(() => null)),
]);

const townIndex = (d) => { const i = TOWNS.indexOf(d); return i < 0 ? TOWNS.indexOf('market') : i; };
/** the town's k-th given name for that sex */
function townName(town, sex, k) {
  const key = `${town}|${sex}`;
  let seq = seqCache.get(key);
  if (!seq) { seq = { list: [], j: 0 }; seqCache.set(key, seq); }
  const L = lists()[sex], ti = townIndex(town), n = TOWNS.length;
  while (seq.list.length <= k) {
    const g = L[seq.j * n + ti];
    seq.j++;
    if (!g) { seq.list.push(L[(k * 31 + ti) % L.length]); continue; } // (never: 24k names per sex)
    if (!takenGiven.has(g.en.toLowerCase()) && !NO_HEIN(g)) seq.list.push(g);
  }
  return seq.list[k];
}

const houseRank = new Map(); // 'g:<district>:<item>' -> place among that town's houses
const houseCount = { ...HOUSES };
/** the generic doors (once, at load): ranks every house within its town */
export function registerHouses(doors) {
  const by = {};
  for (const d of doors || []) (by[d.region] ||= []).push(d);
  for (const [town, list] of Object.entries(by)) {
    const item = (d) => +String(d.room).split(':').pop() || 0;
    list.sort((a, b) => item(a) - item(b)).forEach((d, i) => houseRank.set(d.room, i));
    houseCount[town] = list.length;
  }
}
function rankOf(house) {
  if (houseRank.has(house)) return houseRank.get(house);
  return (+String(house).split(':').pop() || 0) % 4096 + 4096; // (dev page: nothing registered) past every real rank
}

function honorific(age, woman, r) {
  if (age === 'child') return null;
  if (age === 'teen') return woman ? HON.Ma : HON.Maung;
  if (age === 'elder') return woman ? HON.Daw : HON.U;
  return woman ? (r < 0.5 ? HON.Ma : HON.Daw) : r < 0.75 ? HON.Ko : HON.U;
}

/** a name of their own: { my, en } */
export function folkName({ district = 'market', age = 'adult', woman = false, house = null, slot = 0 } = {}) {
  const town = TOWNS.includes(district) ? district : 'market';
  const k = house != null ? rankOf(house) * PER_HOUSE + Math.min(slot, PER_HOUSE - 1)
    : (houseCount[town] || 0) * PER_HOUSE + (slot % FOLK_PER_TOWN);
  const g = townName(town, woman ? 'woman' : 'man', k);
  const hon = honorific(age, woman, (hashName(`${town}:${k}`) % 1000) / 1000);
  return hon ? { en: `${hon[0]} ${g.en}`, my: hon[1] + g.my } : { en: g.en, my: g.my };
}

// ambient slots: a town's FOLK_PER_TOWN people; the least recently used free one comes out next
const slotUse = new Map(); // town -> Map(slot -> last used stamp)
const slotBusy = new Map(); // town -> Set(slot)
let stamp = 0;
export function folkSlot(district) {
  const town = TOWNS.includes(district) ? district : 'market';
  const used = slotUse.get(town) || slotUse.set(town, new Map()).get(town);
  const busy = slotBusy.get(town) || slotBusy.set(town, new Set()).get(town);
  let best = -1, bt = Infinity;
  const start = Math.floor(Math.random() * FOLK_PER_TOWN);
  for (let i = 0; i < FOLK_PER_TOWN; i++) {
    const s = (start + i) % FOLK_PER_TOWN;
    if (busy.has(s)) continue;
    const t = used.get(s) ?? -1;
    if (t < bt) { bt = t; best = s; if (t < 0) break; }
  }
  if (best < 0) best = start;
  busy.add(best);
  used.set(best, ++stamp);
  return best;
}
export function releaseFolkSlot(district, slot) {
  slotBusy.get(TOWNS.includes(district) ? district : 'market')?.delete(slot);
}

/** for tests: every name each town would give (houses' block + its folk), and any name found in two towns */
export function folkNameAudit() {
  const owner = new Map(), clashes = [];
  for (const town of TOWNS) {
    const n = (houseCount[town] || 0) * PER_HOUSE + FOLK_PER_TOWN;
    for (const sex of ['woman', 'man']) for (let k = 0; k < n; k++) {
      const g = townName(town, sex, k).en;
      const o = owner.get(g);
      if (o && o !== town) clashes.push([g, o, town]);
      else owner.set(g, town);
      if (takenGiven.has(g.toLowerCase())) clashes.push([g, 'cast', town]);
    }
  }
  return { names: owner.size, clashes: clashes.length, sample: clashes.slice(0, 5), reserved: takenGiven.size };
}
