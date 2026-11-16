// The Envelope Market's detail pass (the letter, z 258-378; the envelope road above it is not touched here): small
// street things laid LAST, after the town pass (market-town.js town()), through its own clear-check (`put`: clear of
// every footprint, the lanes, the doors, desks, spots and the day scripts' points, inside the quarters that already
// hold the Market's blocks). Everything is merged into the chunk meshes (outlined solids or flat ground decals):
// no new draw call, no material, no canvas, no board. Steam only through the streamer's smoke points (3), evening
// bulbs only through its shared lamp glows (3). Nothing points the way.
//
// Lessons carried (GAME-PLAN chapters): ch 6 give where the giver chose (the street dogs' water bowls, the free-food
// shop's share shelf); ch 7 love that lets go (one kite flies steady on a slack line tied to a stake, one held too
// tight is torn and caught on the wires); ch 10 be glad for others, a win is work (the carvers' tray of trial blocks
// and the trial prints on the ground).
//
//   detail({ ITEMS, add, town, PROP }) -> { placed, skipped }   (market.js, after TOWN = town(...))
//
// Kinds (prefix md): mdPole (mw-kit pole), mdTank, mdPuddle, mdLeaves, mdWear, mdScrap, mdCorner (a lane crossing's
// worn paving corners), mdBunting (airmail flags between two lamp posts), mdBowls, mdShare, mdTray, mdKite, mdBulb,
// mdSteam (a smoke point only), mdCatSacks.
import { rng, shade } from '../kit.js';
import { pole, tankStand, puddle, leaves, kerbWear, scrap, perch, bunting, crossing, sagLine, line, MC } from './mw-kit.js';

const PI = Math.PI;
const circ = (it, r, ox = 0, oz = 0) => { const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0); return { type: 'circle', x: it.x + ox * c + oz * s, z: it.z - ox * s + oz * c, r }; };
function obBox(it, w, d, ox = 0, oz = 0) {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return { type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd };
}
const none = () => [];

// ---------------------------------------------------------------------------------
// the Market's own small things (item-local, front +Z)
// ---------------------------------------------------------------------------------
/** Three tin bowls of water by the footpath's back edge, a small open sack of broken rice for the street dogs,
 * and a dog drinking from one (ch 6: the bowls are filled every morning by whoever passes). */
function mdBowls(g, f, it) {
  const r = rng(it.seed || 3);
  f.flatR(0.1, 0, 1.6, 0.8, 0.0047, '#DDD2B6', 0);
  for (const [x, z] of [[-0.5, 0.05], [-0.1, -0.12], [0.3, 0.08]]) {
    g.box(x, 0.05, z, 0.3, 0.1, 0.3, MC.tin);
    f.flatR(x, z, 0.22, 0.22, 0.104, MC.water, 0);
  }
  // the rice sack, rolled open, rice showing; a tin scoop
  g.box(0.75, 0.2, -0.1, 0.36, 0.4, 0.3, '#E8E0CC');
  g.box(0.75, 0.41, -0.1, 0.4, 0.04, 0.34, '#D6C9A8');
  f.flatR(0.75, -0.1, 0.28, 0.22, 0.43, '#F7F3E8', 0);
  f.box(0.98, 0.04, 0.12, 0.14, 0.06, 0.1, MC.tinD);
  // the dog, standing, head down at the middle bowl
  const c = ['#C9955A', '#E9DCC0', '#6B4A33'][Math.floor(r() * 3)], d = shade(c, 0.8);
  const dx = -0.1, dz = 0.42;
  g.box(dx, 0.36, dz + 0.28, 0.24, 0.22, 0.52, c);
  for (const [lx, lz] of [[-0.08, 0.08], [0.08, 0.08], [-0.08, 0.46], [0.08, 0.46]]) g.box(dx + lx, 0.13, dz + lz, 0.07, 0.26, 0.07, d);
  g.boxR(dx, 0.22, dz - 0.08, 0.16, 0.16, 0.22, c, 0.6, 0, 0);
  for (const sx of [-0.06, 0.06]) f.box(dx + sx, 0.33, dz, 0.04, 0.06, 0.04, d);
  g.boxR(dx, 0.5, dz + 0.6, 0.05, 0.05, 0.24, d, -0.7, 0, 0);
}

/** The free-food shop's share shelf: a plank rack by its wall with bags of rice and hands of bananas, a tin cup
 * (ch 6: take what you need; Daw Yi chose to give, nobody is asked why). */
function mdShare(g, f, it) {
  const r = rng(it.seed || 5);
  f.flatR(0, 0, 1.5, 0.7, 0.0047, '#DDD2B6', 0);
  for (const x of [-0.58, 0.58]) for (const z of [-0.16, 0.16]) g.box(x, 0.55, z, 0.06, 1.1, 0.06, MC.woodD);
  for (const y of [0.42, 0.86]) g.box(0, y, 0, 1.24, 0.05, 0.42, MC.woodL);
  for (let k = 0; k < 4; k++) g.box(-0.42 + k * 0.28, 0.56, (k % 2) * 0.06 - 0.03, 0.22, 0.24, 0.18, k % 2 ? '#E8E0CC' : '#F2ECDD');
  for (let k = 0; k < 3; k++) { const x = -0.36 + k * 0.36; g.box(x, 0.94, 0, 0.26, 0.1, 0.16, '#E8C33C'); f.box(x - 0.1, 0.96, 0.02, 0.05, 0.05, 0.05, '#6E8C3A'); }
  g.box(0.5, 0.12, 0.05, 0.2, 0.24, 0.2, r() < 0.5 ? '#B5643C' : '#8E4A2C'); // a clay water jar at its foot
  f.box(0.5, 0.26, 0.05, 0.16, 0.03, 0.16, MC.woodL);
}

/** The carvers' practice tray on a low stool: rows of small trial stamp blocks (brown, a cream face), a stamp-pad
 * tin, and two trial prints dropped on the ground (ch 10: forty trial blocks before the one that won). */
function mdTray(g, f, it) {
  const r = rng(it.seed || 7);
  g.box(0, 0.16, 0, 0.42, 0.04, 0.42, '#B5643C');
  for (const [x, z] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) g.box(x, 0.07, z, 0.04, 0.14, 0.04, '#8E4A2C');
  g.box(0, 0.2, 0, 0.5, 0.04, 0.36, MC.woodL);
  for (let k = 0; k < 8; k++) {
    const x = -0.17 + (k % 4) * 0.115, z = -0.08 + (k >> 2) * 0.15;
    f.box(x, 0.255, z, 0.09, 0.07, 0.09, shade('#8A5A36', 0.9 + r() * 0.2));
    f.box(x, 0.292, z, 0.07, 0.006, 0.07, MC.cream);
  }
  f.box(0.38, 0.03, 0.18, 0.16, 0.06, 0.12, MC.red);
  f.box(0.38, 0.065, 0.18, 0.13, 0.01, 0.09, MC.ink);
  const ox = f.tx, oz = f.tz, ry = f.ry;
  for (const [lx, lz, k] of [[-0.5, 0.42, 11], [0.6, 0.5, 12]]) { f.at(ox + lx * f.tc + lz * f.ts, oz - lx * f.ts + lz * f.tc, ry); scrap(g, f, { kind: 'stamp', seed: k + (it.seed || 0), lift: 0.0 }); }
  f.at(ox, oz, ry);
}

/** A kite flying steady on a long slack line tied to a bamboo stake, its reel at the foot (ch 7: let the line
 * out and it steadies; nobody needs to hold it tight). The line rises to the north-west, away from the camera. */
function mdKite(g, f, it) {
  const r = rng(it.seed || 3), h = it.h || 8.5, kx = -3.2, kz = -3.8, cols = [MC.red, '#E2B33C', MC.blue, MC.green, '#E8A0A8'];
  const c1 = cols[Math.floor(r() * 5)], c2 = cols[(Math.floor(r() * 4) + 1) % 5];
  f.flatR(0, 0, 0.5, 0.5, 0.0047, '#D8CCAE', 0.4);
  g.box(0, 0.45, 0, 0.06, 0.9, 0.06, '#C9B26A');
  g.box(0.22, 0.09, 0.12, 0.2, 0.18, 0.08, MC.woodD);
  f.box(0.22, 0.09, 0.17, 0.12, 0.12, 0.02, '#F3EFE4');
  // the line: slack, a long low belly before it climbs
  sagLine(f, [0, 0.86, 0], [kx, h, kz], 1.1, 10, 0.016, '#F3EFE4');
  g.boxR(kx, h, kz, 0.9, 0.9, 0.03, c1, 0.2, 0, PI / 4);
  g.boxR(kx, h, kz + 0.02, 0.55, 0.55, 0.03, c2, 0.2, 0, PI / 4);
  for (let k = 0; k < 5; k++) f.box(kx + 0.06 * k, h - 0.75 - k * 0.32, kz + 0.05, 0.13, 0.05, 0.02, k % 2 ? c2 : c1);
}

/** A bulb on its cord under a stall's stamp roof (evening: lit through the streamer's shared lamp glows). */
function mdBulb(g, f, it, ctx) {
  const y = it.y || 1.86;
  line(f, [0, y + 0.12, 0], [0, y + 0.26, 0], 0.015, MC.ink);
  f.box(0, y + 0.14, 0, 0.08, 0.06, 0.08, MC.ink);
  ctx.glows.push(it.x, y, it.z);
}

/** A smoke point only (steam off a cart's pot or pan): world point it.sx, it.sy, it.sz. */
function mdSteam(g, f, it, ctx) { ctx.smoke.push(it.sx, it.sy, it.sz); }

/** Crates and a sack stacked behind a stall, a cat asleep on the sack. */
function mdCatSacks(g, f, it) {
  const r = rng(it.seed || 9);
  f.flatR(0, 0, 1.6, 0.8, 0.0047, '#DDD2B6', 0);
  for (let k = 0; k < 2; k++) { g.box(-0.4 + k * 0.6, 0.22, 0, 0.56, 0.44, 0.5, k ? '#C9A57A' : MC.woodL, (r() - 0.5) * 0.2); g.box(-0.4 + k * 0.6, 0.22, 0.26, 0.4, 0.06, 0.01, MC.woodD, 0); }
  g.box(-0.1, 0.6, 0, 0.62, 0.3, 0.4, '#E8E0CC', 0.15);
  g.box(-0.1, 0.62, 0, 0.64, 0.04, 0.42, '#D6C9A8', 0.15);
  // the cat, curled asleep on the sack
  const cc = ['#E07A3A', '#A08262', MC.black][Math.floor(r() * 3)];
  g.box(-0.1, 0.82, 0.02, 0.3, 0.12, 0.22, cc);
  g.box(0.08, 0.83, 0.08, 0.13, 0.11, 0.13, cc);
  for (const sz of [0.04, 0.12]) f.box(0.1, 0.91, sz, 0.035, 0.04, 0.03, shade(cc, 0.75));
  f.boxR(-0.22, 0.79, 0.14, 0.24, 0.05, 0.05, shade(cc, 0.75), 0, -0.5, 0);
}

export const MD_PROP = {
  mdPole: { draw: pole, obstacles: (it) => [circ(it, 0.2)] },
  mdTank: { draw: tankStand, obstacles: (it) => [obBox(it, 1.3, 1.4, 0.05, 0.1)] },
  mdPuddle: { draw: (g, f, it) => puddle(g, f, it), obstacles: none },
  mdLeaves: { draw: leaves, obstacles: none },
  mdWear: { draw: kerbWear, obstacles: none },
  mdScrap: { draw: scrap, obstacles: none },
  mdCorner: { draw: crossing, obstacles: none },
  mdBunting: { draw: bunting, obstacles: none },
  mdBowls: { draw: mdBowls, obstacles: (it) => [obBox(it, 1.6, 0.6, 0.15, -0.05), obBox(it, 0.3, 0.6, -0.1, 0.62)] },
  mdShare: { draw: mdShare, obstacles: (it) => [obBox(it, 1.3, 0.5)] },
  mdTray: { draw: mdTray, obstacles: (it) => [obBox(it, 0.55, 0.5)] },
  mdKite: { draw: mdKite, obstacles: (it) => [circ(it, 0.18)] },
  mdBulb: { draw: mdBulb, obstacles: none },
  mdSteam: { draw: mdSteam, obstacles: none },
  mdCatSacks: { draw: mdCatSacks, obstacles: (it) => [obBox(it, 1.3, 0.6)] },
  mdPerch: { draw: perch, obstacles: none },
};

// ---------------------------------------------------------------------------------
// The pass
// ---------------------------------------------------------------------------------
// lane centre lines of the letter ([x0, z0, x1, z1]): decals keep 1.4 m off them (never on a lane or its kerb)
const LANES = [
  [-58, 272, 37, 272], [-58, 300, 39, 300], [-30, 334, 37, 334], [-30, 358, 30, 358],
  [7, 258, 7, 368], [7.6, 368, 7, 378], [-30, 272, -30, 358], [-58, 272, -58, 300], [29, 300, 29, 334],
];
function laneDist(x, z) {
  let best = Infinity;
  for (const [x0, z0, x1, z1] of LANES) {
    const dx = x1 - x0, dz = z1 - z0, L2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / L2));
    best = Math.min(best, Math.hypot(x - x0 - dx * t, z - z0 - dz * t));
  }
  return best;
}

/** detail({ ITEMS, add, town, PROP, keep }): lays the Market's details. town = market-town.js town()'s result (its
 * `put` and `defs`); PROP = market.js's PROP (the md kinds are registered there); keep = doors, desks, spots. */
export function detail({ ITEMS, add, town, PROP, keep = [] }) {
  Object.assign(PROP, MD_PROP);
  Object.assign(town.defs, MD_PROP); // (so the clear-check knows the new kinds' footprints)
  const placed = [], skipped = [];
  const keepOk = (x, z, d = 1.6) => keep.every((k) => Math.hypot(k.x - x, k.z - z) >= d);
  /** a solid thing through the town's clear-check; the first candidate that fits wins */
  const putFirst = (cands, gap = 0.2, laneGap = 2.2) => {
    for (const o of cands) { const got = town.put({ ...o }, gap, laneGap); if (got) { placed.push(got.k); return got; } }
    skipped.push(cands[0].k + '@' + cands[0].x + ',' + cands[0].z);
    return null;
  };
  /** a flat decal: only off the lanes and the keep places (anything may stand on it) */
  const flat = (o, laneGap = 1.5) => {
    if (laneDist(o.x, o.z) < laneGap || !keepOk(o.x, o.z)) { skipped.push(o.k + '@' + o.x + ',' + o.z); return null; }
    placed.push(o.k);
    return add(o);
  };
  /** the first `max` spots on a grid (xs by zs, row by row) that pass the clear-check, at least `sep` apart */
  const scan = (base, xs, zs, gap, laneGap, max = 1, sep = 0) => {
    const got = [];
    for (const z of zs) for (const x of xs) {
      if (got.length >= max) return got;
      if (got.some((p) => Math.hypot(p.x - x, p.z - z) < sep)) continue;
      const p = town.put({ ...base, x, z }, gap, laneGap);
      if (p) { got.push(p); placed.push(p.k); }
    }
    if (got.length < max) skipped.push(base.k + ' x' + (max - got.length));
    return got;
  };
  /** a pole line: each target tried a little to either side; neighbours up to 14 m apart are strung with wires */
  const poleLine = (targets, seed, extra = []) => {
    const P = targets.map(([x, z], i) => {
      for (const dz of [0, 0.8, -0.8, 1.6, -1.6]) for (const dx of [0, 0.4, -0.4, 0.8]) {
        const p = town.put({ k: 'mdPole', x: x + dx, z: z + dz, ry: 0, span: 0, seed: seed + i }, 0.15, 2.3);
        if (p) { placed.push('mdPole'); return p; }
      }
      skipped.push('mdPole@' + x + ',' + z);
      return null;
    });
    P.forEach((p, i) => {
      const q = P[i + 1];
      if (!p || !q) return;
      const dx = q.x - p.x, dz = q.z - p.z, L = Math.hypot(dx, dz);
      if (L > 14.2) return;
      Object.assign(p, { span: L, ry: Math.atan2(-dz, dx) }, extra[i] || {});
      if (!(i + 2 < P.length && P[i + 2])) q.ry = p.ry; // (the last pole turned like the line)
    });
    return P;
  };
  const range = (a, b, st) => { const o = []; for (let v = a; v <= b + 1e-6; v += st) o.push(+v.toFixed(2)); return o; };
  const find = (k, x, z, r = 0.6) => ITEMS.find((it) => it.k === k && Math.abs(it.x - x) < r && Math.abs(it.z - z) < r);
  const wpt = (it, lx, lz) => { const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0); return [it.x + lx * c + lz * s, it.z - lx * s + lz * c]; };

  // M1 airmail bunting from lamp post to lamp post along Stamp, Counter and Rice Lanes' north kerbs (the string ties
  // on just under each lamp's head, 2.4 m up, and sags no lower than 2 m: nobody walks into it)
  for (const [ax, bx, z] of [[-8.3, 3.2, 270.2], [-20.4, -7.0, 297.9], [-6.9, 4.0, 331.9]]) {
    const A = find('lamp', ax, z), B = find('lamp', bx, z);
    if (!A || !B) { skipped.push('mdBunting@' + ax); continue; }
    add({ k: 'mdBunting', x: A.x, z: A.z + 0.08, len: B.x - A.x, y0: 2.42, seed: Math.round(ax), cols: [MC.red, '#F6EEDB', MC.blue] });
    placed.push('mdBunting');
  }
  // M2 worn paving at the crossings, cancelled stamps blown into the corners
  [[7, 272, 1], [7, 334, 2], [-30, 334, 3], [-30, 358, 4], [-30, 300, 5], [29, 334, 6]].forEach(([x, z, s]) => {
    const a = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => { const cx = x + sx * 3.8, cz = z + sz * 2.9; return laneDist(cx, cz) >= 1.4 && keepOk(cx, cz, 2.2) ? 1 : 0; });
    add({ k: 'mdCorner', x, z, seed: s, drain: s % 4, a }); placed.push('mdCorner');
  });
  // M14 Counter Lane (the busiest views: decals only): worn slabs along the frontage, a chalked price tally by the sundries
  for (const [x, len] of [[-24.5, 3.6], [-3.4, 3.2], [13.6, 2.6]]) flat({ k: 'mdWear', x, z: 297.75, len, seed: Math.round(x * 3) }, 1.4);
  flat({ k: 'mdScrap', x: 30.4, z: 298.2, kind: 'tally', n: 3, seed: 5 }, 1.4);
  flat({ k: 'mdScrap', x: -10.6, z: 298.4, kind: 'blot', seed: 8 }, 1.4); // M10: ink by the printers' hall loading bay

  // M3 the street dogs' water bowls on Rice Lane's south footpath
  putFirst([[-8.6, 337.0], [-1.6, 337.0], [1.6, 337.2], [15.4, 337.1], [21.2, 337.0], [-16.6, 337.0], [-24.4, 337.0], [29.6, 337.0]].map(([x, z]) => ({ k: 'mdBowls', x, z, ry: 0, seed: 4 })), 0.2, 2.4);
  // M4 the share shelf beside Daw Yi's door (more than 2 m from it, against her front wall)
  scan({ k: 'mdShare', ry: 0, seed: 5 }, [31.4, 37.2, 31.0, 37.6, 31.8, 36.8, 30.8, 38.0], [331.7, 331.62], 0.05, 1.4);
  // M5 the kite field: one kite flying steady on a slack line tied to a stake at the field's edge (the torn one is
  // on the west lane's wires, M13)
  putFirst([[-53.4, 311.6], [-53.8, 305.8], [-35.0, 321.4], [-53.0, 327.6]].map(([x, z]) => ({ k: 'mdKite', x, z, seed: 3, h: 8.5 })), 0.3, 2.4);
  // (M7, back-lot water tanks: left out. Behind Counter Lane's frontage the roofs hide them from every lane, and nearer
  // Stamp Lane a 3.4 m stand filled the walking camera's foreground; the kind stays registered for later use)
  // M8 the carvers' practice tray at the row's step cheeks (clear of their door and of Day 10's places)
  putFirst([[37.3, 270.0], [26.4, 270.3], [26.0, 274.6], [37.0, 274.8]].map(([x, z]) => ({ k: 'mdTray', x, z, seed: 2 })), 0.15, 1.6);
  // M9 crates, a sack and a cat asleep on it behind Stamp Lane's north stalls
  putFirst([[-5.0, 267.3], [-1.6, 267.3], [-12.4, 267.3], [5.2, 267.2], [-16.0, 267.3]].map(([x, z]) => ({ k: 'mdCatSacks', x, z, ry: 0, seed: 9 })), 0.12, 2.5);
  // M10 Ink Lane: a rain puddle with a paper boat on the south side
  for (const [x, z, w, d, boat] of [[-2.2, 361.2, 1.8, 0.9, true], [16.6, 361.4, 1.4, 0.8, false], [-21.4, 361.0, 1.6, 0.8, false]]) flat({ k: 'mdPuddle', x, z, w, d, boat, seed: Math.round(x * 7) }, 1.9);
  // more puddles in the yards and the field's low corner (monsoon)
  for (const [x, z, w, d] of [[-44.0, 329.2, 2.0, 1.1], [-56.6, 306.6, 1.6, 0.9], [-36.6, 352.0, 1.4, 0.8], [17.6, 375.4, 1.6, 0.9], [-12.4, 339.6, 1.2, 0.7]]) flat({ k: 'mdPuddle', x, z, w, d, seed: Math.round(z * 3) }, 2.0);
  // M11 trishaws parked on the verges of Rice and Ink Lanes (along the lane, off it)
  scan({ k: 'trishaw', ry: PI, seed: 3 }, range(-27, 35, 0.8), [336.8, 337.1], 0.2, 2.0, 1);
  scan({ k: 'trishaw', ry: PI, seed: 4 }, range(-27, 28, 0.8), [360.8, 361.1], 0.2, 2.0, 1);
  // M12 bulbs under three Stamp Lane stalls (their lamp glows light in the evening)
  for (const x of [-6.5, -20.5, -43.0]) {
    const s = find('stampStall', x, 269.0, 1.2);
    if (!s) { skipped.push('mdBulb@' + x); continue; }
    add({ k: 'mdBulb', x: s.x, z: s.z + 0.85, y: 1.72 }); placed.push('mdBulb'); // (under the roof's front edge: seen from the street)
  }
  // steam off two carts' pots and pans (the streamer's smoke points: none on Days 2-3)
  for (const [x, z, lx, ly] of [[-8.4, 303.8, -0.3, 1.45], [24.2, 337.6, -0.2, 1.25], [-33.6, 309.2, -0.2, 1.25]]) {
    const c = find('foodCart', x, z);
    if (!c) { skipped.push('mdSteam@' + x); continue; }
    const [sx, sz] = wpt(c, lx, 0);
    add({ k: 'mdSteam', x: c.x, z: c.z, sx, sy: ly, sz }); placed.push('mdSteam');
  }
  // M13 a power line down the west lane's east verge (two runs, none within 6 m south of a lane), mynas on the wires,
  // and a torn kite caught on them (ch 7)
  poleLine([[-32.9, 306.6], [-32.9, 318.6], [-32.9, 330.6]], 610, [{ birds: 2, kite: true }, { birds: 1, tx: true }]);
  poleLine([[-27.0, 278.6], [-27.0, 289.6], [-27.0, 298.4]], 620, [{ birds: 2 }, {}]);
  // fallen leaves under the Market's own trees (padauk yellow, rain-tree brown), off the lanes
  let lv = 0;
  for (const t of ITEMS) {
    if ((t.k !== 'padauk' && t.k !== 'rain') || t.z < 262 || t.z > 377 || t.x < -80) continue;
    if (lv++ % 2) continue;
    flat({ k: 'mdLeaves', x: t.x + 0.4, z: t.z + 1.0, w: 2.6 * (t.s || 1), d: 1.8, n: 12, pal: t.k === 'rain' ? 'rain' : 'padauk', seed: Math.round(t.x * 13 + t.z) }, 1.6);
  }
  return { placed, skipped };
}
