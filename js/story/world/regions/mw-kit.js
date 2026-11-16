// Street details shared by the Envelope Market and Ledger Wharf detail passes (market-detail.js, wharf-detail.js):
// small pure draw functions, item-local (origin = the item's x, z; front = +Z; feet at y = 0), drawn into the open
// world's merged chunk meshes like every district prop (g = outlined solids, f = the chunk's flat ground: decals and
// tiny unoutlined bits). No materials, no canvases, no update: they cost no draw calls of their own.
// (A stand-in for the planned shared street kit, art/street-kit.js, which was not there yet when this was written;
// the kinds are the plan's: pole, tankStand, puddle, leaves, kerbWear, scrap, perch, bunting.)
// Original art. Nothing here points the way.
import { shade, rng } from '../kit.js';

export const MC = {
  concrete: '#BDB6A6', concreteD: '#8F887A', wood: '#B98A5A', woodD: '#7E5A38', woodL: '#CDA577', cream: '#F3E9D2',
  ink: '#2A2118', navy: '#2B3A63', red: '#C8323C', blue: '#2F5DB3', green: '#4F8A4F', gold: '#D9A93B', white: '#FFFDF8',
  tin: '#9AA19C', tinD: '#6F7672', iron: '#4A3B30', wire: '#3A332C', myna: '#5A4535', mynaH: '#2A2420', beak: '#E8B832',
  water: '#A9B9C0', waterL: '#C9D3D4', glint: '#E8EEEE', rim: '#D3CCBC', chalk: '#F6F3EA', crack: '#B9AE95', seam: '#CFC4A9',
  weed: '#6E9E54', weedD: '#4F7E40', leafY: '#D9A93B', leafB: '#A8743A', leafG: '#7E9A4E', pink: '#D9558A',
  crow: '#26232A', crowL: '#3C3842', egret: '#F7F5EE', egretD: '#D9D6CC', leg: '#3A3632', orange: '#E07A3A', black: '#2C2826',
};

/** Item-local point -> world [x, z] (for ctx.glows / ctx.smoke, which are in world space). */
export const world = (g, lx, lz) => [g.tx + lx * g.tc + lz * g.ts, g.tz - lx * g.ts + lz * g.tc];

/** A thin straight run (no outline) in f from local point a to b (each [x, y, z]): wires, strings, kite lines. */
export function line(f, a, b, t, col) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
  f.boxR((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, t, L, t, col, Math.atan2(Math.hypot(dx, dz), dy), Math.atan2(dx, dz), 0);
}
/** A sagging line of n straight pieces from a to b (each [x, y, z]), its middle `sag` lower; calls at(p) on the way. */
export function sagLine(f, a, b, sag, n, t, col) {
  let p0 = a;
  for (let k = 1; k <= n; k++) {
    const u = k / n, p1 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * sag, a[2] + (b[2] - a[2]) * u];
    line(f, p0, p1, t, col);
    p0 = p1;
  }
}
const sagY = (y, u, sag) => y - Math.sin(u * Math.PI) * sag;

/** A myna (or a sparrow) sitting on a wire at local (x, y, z), facing +-Z. Three tiny unoutlined boxes. */
function wireBird(f, x, y, z, r) {
  const s = r() < 0.5 ? 1 : -1;
  f.box(x, y + 0.07, z, 0.1, 0.1, 0.16, MC.myna);
  f.box(x, y + 0.15, z + 0.07 * s, 0.08, 0.08, 0.08, MC.mynaH);
  f.box(x, y + 0.14, z + 0.13 * s, 0.03, 0.03, 0.05, MC.beak);
}

/**
 * pole { span, ry, seed, tx, birds, kite }: a concrete power pole (two tones, darker foot), a timber crossarm across
 * the line, three cream insulators, a tin transformer can when `tx`; three wires sag along local +X to the next pole
 * `span` metres on (0: no wires, the line's last pole). `birds`: mynas on the middle wire. `kite`: a torn paper kite
 * caught on the wires (ch 7: the one that was held too tight). ~300-470 triangles.
 */
export function pole(g, f, it) {
  const r = rng(it.seed || 7), H = 5.6, S = it.span || 0;
  f.flatR(0, 0, 0.5, 0.5, 0.0047, '#D8CCAE', 0.3);
  g.box(0, 0.35, 0, 0.24, 0.7, 0.24, MC.concreteD);
  g.box(0, (H + 0.7) / 2, 0, 0.16, H - 0.7, 0.16, MC.concrete);
  g.box(0, H - 0.3, 0, 0.1, 0.1, 1.15, MC.woodD);
  for (const z of [-0.45, 0, 0.45]) g.box(0, H - 0.18, z, 0.07, 0.14, 0.07, MC.cream);
  if (it.tx) { g.box(0.2, H - 1.4, 0, 0.32, 0.55, 0.32, MC.tin); g.box(0.2, H - 1.1, 0, 0.36, 0.06, 0.36, MC.tinD); }
  if (!S) return;
  const y = H - 0.1, sag = Math.min(0.55, S * 0.035);
  for (const z of [-0.45, 0, 0.45]) sagLine(f, [0, y, z], [S, y, z], sag, 3, 0.025, MC.wire);
  for (let k = 0; k < (it.birds || 0); k++) { const u = 0.3 + k * 0.17 + r() * 0.06; wireBird(f, S * u, sagY(y, u, sag), 0, r); }
  if (it.kite) {
    // a diamond kite snagged on the near wire, one corner torn, its tail hanging down
    const u = 0.62, kx = S * u, ky = sagY(y, u, sag), kz = 0.45;
    f.boxR(kx, ky - 0.22, kz + 0.04, 0.5, 0.5, 0.02, MC.red, 0, 0, Math.PI / 4 + 0.25);
    f.boxR(kx + 0.06, ky - 0.18, kz + 0.06, 0.24, 0.24, 0.02, MC.gold, 0, 0, Math.PI / 4 + 0.25);
    for (let k = 0; k < 4; k++) f.box(kx - 0.1 + (k % 2) * 0.05, ky - 0.62 - k * 0.2, kz + 0.05, 0.1, 0.05, 0.02, k % 2 ? MC.gold : MC.red);
  }
}

/** tankStand { seed }: a water tank on a 2.2 m angle-iron stand, a pipe down to a tap, a bucket. Back lots only. */
export function tankStand(g, f, it) {
  const r = rng(it.seed || 3), col = ['#2C2C30', '#3E5F7A', '#8C918C'][Math.floor(r() * 3)], H = 2.2;
  f.flatR(0.1, 0.2, 1.7, 1.5, 0.0047, '#DDD1B4', 0);
  for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) g.box(x, H / 2, z, 0.08, H, 0.08, MC.iron);
  g.boxR(0, H * 0.5, 0.5, 1.3, 0.04, 0.04, MC.iron, 0, 0, 0.95);
  g.boxR(0, H * 0.5, -0.5, 1.3, 0.04, 0.04, MC.iron, 0, 0, -0.95);
  g.box(0, H + 0.03, 0, 1.15, 0.06, 1.15, MC.woodD);
  g.box(0, H + 0.55, 0, 0.95, 1.0, 0.6, col);
  g.box(0, H + 0.55, 0, 0.6, 1.0, 0.95, col);
  g.box(0, H + 1.08, 0, 0.5, 0.08, 0.5, shade(col, 1.25));
  g.box(0.42, H / 2 + 0.1, 0.36, 0.06, H, 0.06, MC.tin);
  g.box(0.42, 0.5, 0.48, 0.1, 0.06, 0.18, MC.tinD);
  g.box(0.42, 0.13, 0.62, 0.28, 0.26, 0.28, ['#3E8C8A', '#C8323C', '#E2B33C'][Math.floor(r() * 3)]);
}

/** puddle { w, d, seed }: a rain puddle: overlapping blue-grey patches, a pale rim, a sky glint. Walk-through. */
export function puddle(g, f, it) {
  const r = rng(it.seed || 5), W = it.w || 1.4, D = it.d || 0.9;
  f.flatR(0, 0, W * 1.08, D * 1.1, 0.0102, MC.rim, (r() - 0.5) * 0.3);
  f.flatR((r() - 0.5) * 0.1, 0, W, D, 0.0108, MC.water, (r() - 0.5) * 0.3);
  f.flatR(W * 0.28, D * 0.15, W * 0.55, D * 0.7, 0.011, MC.water, 0.5 + r());
  f.flatR(-W * 0.12, -D * 0.1, W * 0.35, 0.05, 0.0116, MC.glint, -0.2);
  f.flatR(W * 0.1, D * 0.18, W * 0.2, 0.04, 0.0116, MC.waterL, -0.2);
  if (it.boat) { // a folded paper boat left at its edge (four small unoutlined pieces)
    const bx = -W * 0.3, bz = D * 0.1;
    f.box(bx, 0.03, bz, 0.26, 0.04, 0.11, MC.cream);
    f.boxR(bx, 0.08, bz, 0.2, 0.08, 0.02, MC.white, 0, 0, 0);
    f.boxR(bx - 0.12, 0.06, bz, 0.06, 0.04, 0.1, MC.cream, 0, 0, 0.6);
    f.boxR(bx + 0.12, 0.06, bz, 0.06, 0.04, 0.1, MC.cream, 0, 0, -0.6);
  }
}

/** leaves { w, d, seed, pal }: fallen leaves (padauk yellow, rain-tree brown-green, bougainvillea pink). */
export function leaves(g, f, it) {
  const r = rng(it.seed || 9), W = it.w || 2.4, D = it.d || 1.8, pal = it.pal === 'pink' ? [MC.pink, '#E88AAE', MC.leafG] : it.pal === 'rain' ? [MC.leafB, MC.leafG, '#B99A5A'] : [MC.leafY, '#E8C04A', MC.leafB];
  const n = it.n || 12;
  for (let k = 0; k < n; k++) f.flatR((r() - 0.5) * W, (r() - 0.5) * D, 0.12 + r() * 0.06, 0.07, 0.0135 + (k % 3) * 0.0004, pal[k % pal.length], r() * 3.1);
}

/** kerbWear { len, seed }: slab seams along a footpath, a hairline crack, a chipped corner, a weed in a seam. */
export function kerbWear(g, f, it) {
  const r = rng(it.seed || 4), L = it.len || 4;
  for (let x = -L / 2 + 0.45; x < L / 2; x += 0.9) f.flatR(x, 0, 0.025, 0.9, 0.0104, MC.seam, 0);
  const cx = (r() - 0.5) * L * 0.6;
  for (let k = 0; k < 3; k++) f.flatR(cx + k * 0.16, (k % 2 ? 0.08 : -0.06), 0.2, 0.018, 0.0107, MC.crack, k % 2 ? 0.5 : -0.4);
  f.flatR(L / 2 - 0.2, 0.36, 0.22, 0.14, 0.0107, MC.crack, 0.2);
  const wx = -L / 2 + 0.45 + 0.9 * Math.floor(r() * Math.max(1, L / 0.9 - 1));
  f.box(wx, 0.04, 0.1, 0.08, 0.08, 0.05, MC.weed);
  f.box(wx + 0.05, 0.03, 0.14, 0.06, 0.06, 0.04, MC.weedD);
}

/** scrap { kind, seed }: book-world litter, flat: 'stamp' (a cancelled postage stamp), 'blot' (an ink blot),
 * 'tally' (chalk tally strokes), 'ledger' (a ledger page corner), 'ruled' (a torn exercise-book corner). */
export function scrap(g, f, it) {
  const r = rng(it.seed || 2), kind = it.kind || 'stamp', y = 0.0142 + (it.lift || 0);
  if (kind === 'stamp') {
    const a = (r() - 0.5) * 1.2, c = [MC.red, MC.blue, MC.green, MC.gold][Math.floor(r() * 4)];
    f.flatR(0, 0, 0.24, 0.28, y, MC.cream, a);
    f.flatR(0, 0, 0.17, 0.21, y + 0.0004, c, a);
    for (let k = -1; k <= 1; k++) f.flatR(Math.cos(a) * 0.05 * k + 0.06, -Math.sin(a) * 0.05 * k, 0.3, 0.014, y + 0.0008, MC.ink, a + 0.25);
  } else if (kind === 'blot') {
    for (let k = 0; k < 5; k++) f.flatR((r() - 0.5) * 0.3, (r() - 0.5) * 0.24, 0.16 + r() * 0.14, 0.14 + r() * 0.12, y + k * 0.0001, MC.navy, r() * 3);
    for (let k = 0; k < 3; k++) f.flatR(0.3 + r() * 0.2, (r() - 0.5) * 0.4, 0.05, 0.05, y, MC.navy, r());
  } else if (kind === 'tally') {
    const x0 = (r() - 0.5) * 0.2;
    for (let n = 0; n < (it.n || 2); n++) {
      const bx = x0 + n * 0.32;
      for (let k = 0; k < 4; k++) f.flatR(bx + k * 0.05, 0, 0.022, 0.22, y, MC.chalk, 0);
      f.flatR(bx + 0.075, 0, 0.3, 0.022, y + 0.0004, MC.chalk, -0.6);
    }
  } else if (kind === 'ledger') {
    const a = (r() - 0.5) * 0.6;
    f.flatR(0, 0, 0.42, 0.56, y, '#F7F1DE', a);
    for (let k = -2; k <= 2; k++) f.flatR(-Math.sin(a) * k * 0.09, -Math.cos(a) * k * 0.09, 0.38, 0.01, y + 0.0004, MC.blue, a);
    f.flatR(Math.cos(a) * 0.08, -Math.sin(a) * 0.08, 0.012, 0.52, y + 0.0006, MC.red, a);
  } else { // 'ruled'
    const a = r() * 3;
    f.flatR(0, 0, 0.3, 0.24, y, MC.cream, a);
    for (let k = -1; k <= 1; k++) f.flatR(-Math.sin(a) * k * 0.06, -Math.cos(a) * k * 0.06, 0.28, 0.01, y + 0.0004, '#7FA6D6', a);
  }
}

/**
 * perch { kind, seed }: an animal sitting still: 'cat' (tabby | ginger | black, tail curled), 'dog' (asleep), 'crow',
 * 'egret' (a white river bird on long legs), 'pigeons' (a pair). `y`: what it sits on (a crate top, a post top).
 */
export function perch(g, f, it) {
  const r = rng(it.seed || 3), y = it.y || 0, kind = it.kind || 'cat';
  if (kind === 'cat') {
    const c = it.col || ['#A08262', MC.orange, MC.black][Math.floor(r() * 3)], d = shade(c, 0.78);
    g.box(0, y + 0.12, 0, 0.2, 0.24, 0.26, c);
    g.box(0, y + 0.3, 0.08, 0.16, 0.14, 0.14, c);
    for (const x of [-0.05, 0.05]) g.box(x, y + 0.4, 0.08, 0.04, 0.05, 0.03, d);
    g.box(0.1, y + 0.03, 0.06, 0.06, 0.05, 0.2, d); // the tail round its feet
  } else if (kind === 'dog') {
    const c = ['#C9955A', '#E9DCC0', '#6B4A33'][Math.floor(r() * 3)], d = shade(c, 0.8);
    f.flatR(0, 0, 0.8, 0.45, 0.006, '#D9CDB0', 0);
    g.box(0, y + 0.14, 0, 0.56, 0.26, 0.3, c);
    g.box(0.33, y + 0.11, 0.07, 0.2, 0.2, 0.22, c);
    g.box(0.44, y + 0.08, 0.12, 0.09, 0.09, 0.1, d);
    g.box(0.28, y + 0.23, -0.04, 0.07, 0.07, 0.05, d);
    g.boxR(-0.34, y + 0.07, 0.12, 0.26, 0.06, 0.06, d, 0, 0.6, 0);
  } else if (kind === 'crow') {
    g.box(0, y + 0.1, 0, 0.12, 0.13, 0.22, MC.crow);
    g.box(0, y + 0.2, 0.09, 0.09, 0.09, 0.09, MC.crowL);
    f.box(0, y + 0.19, 0.16, 0.03, 0.03, 0.06, MC.ink);
    f.boxR(0, y + 0.08, -0.13, 0.08, 0.02, 0.1, MC.crow, -0.4, 0, 0);
  } else if (kind === 'egret') {
    f.box(-0.03, y + 0.18, 0, 0.02, 0.36, 0.02, MC.leg); f.box(0.03, y + 0.18, 0, 0.02, 0.36, 0.02, MC.leg);
    g.box(0, y + 0.44, 0, 0.14, 0.16, 0.3, MC.egret);
    g.boxR(0, y + 0.6, 0.12, 0.05, 0.24, 0.05, MC.egret, 0.35, 0, 0);
    g.box(0, y + 0.74, 0.18, 0.07, 0.07, 0.1, MC.egret);
    f.box(0, y + 0.73, 0.27, 0.025, 0.025, 0.1, MC.beak);
    f.boxR(0, y + 0.42, -0.17, 0.1, 0.03, 0.1, MC.egretD, -0.3, 0, 0);
  } else { // 'pigeons'
    for (const [x, z, s] of [[-0.14, 0, 1], [0.16, 0.05, -1]]) {
      g.box(x, y + 0.08, z, 0.12, 0.12, 0.2, '#9AA0A8');
      g.box(x, y + 0.17, z + 0.08 * s, 0.08, 0.08, 0.08, '#6E7480');
      f.box(x, y + 0.16, z + 0.13 * s, 0.03, 0.03, 0.04, '#E8C9A0');
    }
  }
}

/** bunting { len, seed, cols, y0, y1 }: a string of small paper flags along local +X, from (0, y0) to (len, y1),
 * sagging in the middle (tied to existing posts by the caller's placement; no posts of its own). */
export function bunting(g, f, it) {
  const r = rng(it.seed || 1), L = it.len || 6, y0 = it.y0 || 2.42, y1 = it.y1 ?? y0, sag = Math.min(0.42, L * 0.04);
  const cols = it.cols || [MC.red, MC.cream, MC.blue];
  sagLine(f, [0, y0, 0], [L, y1, 0], sag, 4, 0.018, '#E8DCC0');
  const n = Math.max(3, Math.floor(L / 0.55));
  for (let k = 1; k < n; k++) {
    const u = k / n, x = L * u, y = y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * sag, c = cols[(k + Math.floor(r() * 0.5)) % cols.length];
    f.box(x, y - 0.07, 0, 0.18, 0.1, 0.012, c);
    f.box(x, y - 0.15, 0, 0.09, 0.07, 0.012, c);
  }
}

/** A lane crossing's four paving corners, worn: slab seams, a crack, a chipped corner, a weed; a drain grate on
 * one; a cancelled stamp or two lying like leaves (decals only: walkable, laid outside the kerb lines). */
export function crossing(g, f, it) {
  const r = rng(it.seed || 2), o = it.o || 2.9, a = it.a || [1, 1, 1, 1];
  const ox = f.tx, oz = f.tz;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], k) => {
    if (!a[k]) return;
    f.at(ox + sx * (o + 0.9), oz + sz * o, 0);
    kerbWear(g, f, { len: 1.8, seed: (it.seed || 1) * 7 + k });
    if (k === (it.drain ?? 1)) { f.flatR(-sx * 0.6, 0, 0.36, 0.9, 0.0112, '#9F9683', 0); for (let b = 0; b < 4; b++) f.flatR(-sx * 0.6, -0.33 + b * 0.22, 0.3, 0.04, 0.0116, '#6F685E', 0); }
    if (r() < 0.7) { f.at(ox + sx * (o + 0.5 + r()), oz + sz * (o + 0.4), 0); scrap(g, f, { kind: 'stamp', seed: (it.seed || 1) * 13 + k, lift: 0.006 }); }
  });
  f.at(ox, oz, 0);
}

/** A ring of four flat boxes (a tyre, a bowl's rim): centre (x, y, z), outer size s, thickness t, height h, in g. */
export function ring(g, x, y, z, s, t, h, col, ry = 0) {
  const c = Math.cos(ry), sn = Math.sin(ry), o = (s - t) / 2;
  g.box(x + o * c, y, z - o * sn, t, h, s, col, ry);
  g.box(x - o * c, y, z + o * sn, t, h, s, col, ry);
  g.box(x + o * sn, y, z + o * c, s - 2 * t, h, t, col, ry);
  g.box(x - o * sn, y, z - o * c, s - 2 * t, h, t, col, ry);
}
