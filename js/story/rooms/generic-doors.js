// Which of the world's filler buildings get a door into a generic room (rooms/generic.js), and which kind of
// room each one is. Pure data + maths: no three.js, no DOM (runs in node for counting).
//
//   doorsForItems(items, { regionAt?, skipDoors? }) -> [{ room: 'g:<district>:<itemIndex>', x, z, facing, region, r, kind, trade?, seed, art, w, d }]
//       items      the merged ITEMS (js/story/world/region.js); itemIndex is the index in that array
//       regionAt   (x, z) -> { id } | null  (region.js's; a built-in rect table is used without it)
//       skipDoors  [{ x, z }] doors already in the world (story rooms): a building with one of those at its
//                  front (or anywhere in its footprint) is a story building and is left alone
//   pickKind(artKind, district, seedOrItem?) -> { kind, trade? }  (kind names: KIND_NAMES)
//
// A door stands on the building's front face (item-local +Z, turned by it.ry), at the drawn door's offset when the
// item says (it.door / it.doorX, metres), else the middle of the front; facing = it.ry (the way the door looks
// out). r is generous (the drawn door is a few tens of centimetres either side of where it is guessed).
// Skipped: tiny sheds and huts (under 8 m² or narrower than 2.6 m), stalls and shades without walls, anything
// that is not a home, shop or workshop. The Blank Page's pencil floor plans of a house (sketch kind 'house') are
// doors too: walking over the drawn doorway steps into the unfinished room.
export const KIND_NAMES = ['home', 'shop', 'workshop', 'tea', 'baker', 'fisher', 'gardener', 'student', 'elder', 'blank'];
export const TRADES = { exercise: 'potter', envelope: 'carver', market: 'carver', wharf: 'netmender', junction: 'printer', hearth: 'weaver', garden: 'carpenter', blank: 'carver', home: 'carver' };

// The land's rects (regions/index.js): used when no regionAt is given.
const RECTS = [
  ['exercise', -71, 40, 79, 160], ['envelope', -26, 160, 34, 258], ['market', -96, 258, 39, 378], ['wharf', -71, 378, 79, 498],
  ['junction', 39, 258, 189, 378], ['hearth', 119, 138, 269, 258], ['garden', 119, 18, 269, 138], ['blank', 46, -62, 146, 18],
];
function rectRegion(x, z) {
  for (const [id, x0, z0, x1, z1] of RECTS) if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return id;
  let best = null, bd = Infinity; // the jetties and the cloud-stream's banks: the nearest district
  for (const [id, x0, z0, x1, z1] of RECTS) { const d = Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1)); if (d < bd) { bd = d; best = id; } }
  return best;
}

/** FNV-1a. */
export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const unit = (seed, salt) => (hashStr(`${seed}|${salt}`) % 100000) / 100000;

// building kinds that can be entered: role + defaults (size when the item has none, extra metres out front for steps)
const HOUSES = {
  house: { role: 'home', out: (it) => (it.style === 'stilt' ? 0.9 : 0.25) },
  mkHut: { role: 'home', out: (it) => (it.style === 'stilt' ? 1.0 : 0.3) }, mkLow: { role: 'home' }, mkHouse: { role: 'home' }, mkCot: { role: 'home' },
  mkRow: { role: (it) => (it.shop ? 'shop' : 'home') },
  wStilt: { role: 'stilt', out: () => 1.1, rMax: 1.55 }, wShop: { role: 'shop' }, wGodown: { role: 'work', rMax: 1.55, out: () => 1.6 }, // (wharf fronts: lamps, barrels and rails stand close by, so the walk-in reach is a little wider; a godown's threshold is its loading platform's front lip: the platform is a keep-out, so a door behind it could only be tapped, never walked into)
  jHome: { role: 'home', out: (it) => (it.style === 'stilt' ? 1.0 : 0.25) }, jShack: { role: 'home' }, jHouse: { role: (it) => (it.shop ? 'shop' : 'home') },
  hHouse: { role: 'home' }, workShed: { role: 'work' },
  gfHome: { role: (it) => (/shop/.test(it.style || '') ? 'shop' : 'home'), out: (it) => (it.style === 'stilt' ? 1.0 : 0.25) },
  gdCottage: { role: 'home' }, gfWorkshop: { role: 'work', w: 5, d: 4 }, gdSeedHouse: { role: 'garden' }, gdFieldHut: { role: 'garden', w: 3.4, d: 3 },
  sketch: { role: 'blank', only: (it) => it.kind === 'house' },
};
export const HOUSE_KINDS = Object.keys(HOUSES);

const W8 = (list, u) => { // weighted pick: [[name, weight], ...]
  const tot = list.reduce((a, [, w]) => a + w, 0);
  let t = u * tot;
  for (const [n, w] of list) { if ((t -= w) < 0) return n; }
  return list[list.length - 1][0];
};
const HOME_MIX = {
  exercise: [['home', 40], ['student', 25], ['elder', 15], ['workshop', 10], ['shop', 10]],
  envelope: [['home', 40], ['elder', 15], ['student', 15], ['workshop', 15], ['tea', 15]],
  market: [['home', 40], ['elder', 15], ['student', 15], ['workshop', 15], ['tea', 15]],
  wharf: [['fisher', 40], ['home', 30], ['elder', 15], ['workshop', 15]],
  junction: [['home', 35], ['student', 20], ['workshop', 20], ['elder', 15], ['shop', 10]],
  hearth: [['home', 35], ['baker', 20], ['workshop', 15], ['elder', 15], ['tea', 15]],
  garden: [['gardener', 35], ['home', 30], ['elder', 20], ['student', 15]],
  blank: [['blank', 1]],
};

/** -> { kind, trade? } for a building of ART kind artKind in district. seedOrItem: a number, or the item (for its role flags). */
export function pickKind(artKind, district, seedOrItem = 0) {
  const it = typeof seedOrItem === 'object' && seedOrItem ? seedOrItem : {};
  const seed = typeof seedOrItem === 'number' ? seedOrItem : hashStr(`${district}:${Math.round((it.x || 0) * 10)}:${Math.round((it.z || 0) * 10)}`);
  const u = unit(seed, 'kind');
  const H = HOUSES[artKind];
  const role = !H ? 'home' : typeof H.role === 'function' ? H.role(it) : H.role;
  const trade = TRADES[district] || 'carver';
  let kind;
  if (district === 'blank' || role === 'blank') kind = 'blank';
  else if (role === 'work') kind = artKind === 'workShed' ? (u < 0.45 ? 'baker' : 'workshop') : 'workshop';
  else if (role === 'garden') kind = 'gardener';
  else if (role === 'shop') kind = W8([['shop', 55], ['tea', 30], ['workshop', 15]], u);
  else if (role === 'stilt') kind = W8([['fisher', 55], ['home', 30], ['elder', 15]], u);
  else kind = W8(HOME_MIX[district] || HOME_MIX.market, u);
  return kind === 'workshop' ? { kind, trade } : { kind };
}

/** The doors into generic rooms for a list of world items (see the top of this file). */
export function doorsForItems(items, { regionAt = null, skipDoors = [] } = {}) {
  const out = [];
  (items || []).forEach((it, index) => {
    const H = it && HOUSES[it.k];
    if (!H || (H.only && !H.only(it))) return;
    const district = (regionAt ? regionAt(it.x, it.z)?.id : null) || rectRegion(it.x, it.z) || 'market';
    const sk = it.k === 'sketch';
    const w = sk ? 5 * (it.s || 1) : it.w || H.w || 4.4;
    const d = sk ? 3.2 * (it.s || 1) : it.d || H.d || 4.4;
    if (!sk && (w * d < 8 || Math.min(w, d) < 2.6)) return; // a shed, not a room
    const ry = it.ry || 0, c = Math.cos(ry), s = Math.sin(ry);
    // story buildings: an existing door at its front or inside its footprint
    for (const e of skipDoors) {
      const dx = e.x - it.x, dz = e.z - it.z;
      const lx = dx * c - dz * s, lz = dx * s + dz * c; // world -> item-local
      if (Math.abs(lx) < w / 2 + 1.2 && lz > (sk ? -d - 1 : -d / 2 - 1.2) && lz < (sk ? 2 : d / 2 + 2.2)) return;
    }
    const doorX = Number.isFinite(it.doorX) ? it.doorX : Number.isFinite(it.door) ? it.door : 0;
    const out0 = sk ? 0 : d / 2 + (typeof H.out === 'function' ? H.out(it) : 0.25);
    const x = it.x + doorX * c + out0 * s, z = it.z - doorX * s + out0 * c;
    const seed = hashStr(`${district}:${Math.round(it.x * 10)}:${Math.round(it.z * 10)}`);
    const k = pickKind(it.k, district, it); // (the same position seed, and the item's own flags: a shop, a stilt house)
    out.push({
      room: `g:${district}:${index}`, x: +x.toFixed(2), z: +z.toFixed(2), facing: ry, region: district,
      r: +Math.min(H.rMax || 1.25, Math.max(0.8, w * 0.22 + (H.rMax ? 0.3 : 0))).toFixed(2), kind: k.kind, ...(k.trade ? { trade: k.trade } : {}), seed, art: it.k,
      w: +w.toFixed(2), d: +d.toFixed(2),
    });
  });
  return out;
}
