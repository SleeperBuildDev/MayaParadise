// Newsprint Junction: the ground at Maya's feet. The street camera looks down on the strip just south of
// every street, so that strip gets the cheapest life there is: worn earth, grass and moss soaking into the
// newsprint (flat decals in the chunk's ground mesh: no outline, no shadow, two triangles a piece), and low
// planted verges with a stone kerb (a few merged boxes). Registered through regions/junction.js (PROP; format
// at the top of regions/index.js). Item-local: origin = the item's (x, z), front = +Z, metres.
// Original art in the Junction's palette; nothing here marks where to go (no paths, no arrows, no glow).
//
// PROP:
//   jPatch { w, d, kind: 'grass' | 'soil' | 'worn' | 'moss', seed, ry }   a soft irregular patch (ground only)
//   jVerge { len, seed, ry }   a low planted strip: kerb stones, soil, grass, low shrubs and a few flowers
import { rng } from '../kit.js';
import { J } from '../art/junction.js';

const PATCH = {
  grass: ['#CAD4A6', '#B9C993', '#AFC287', '#C2CF9C'],
  moss: ['#B9C7A0', '#AEBF95', '#C6D0AE'],
  soil: ['#DCCBAD', '#D2BC98', '#CBB18B', '#D6C4A4'],
  worn: ['#DDD5C3', '#D5CBB6', '#D9D0BC'],
};
const BLADE = ['#8FAE66', '#7FA05A', '#9DBA72'];

/** A soft patch, pixel-blob style like the voxel art: an ellipse of 0.3 m rows (one flat per row, ragged ends),
 * a smaller darker heart on top; a few blades on grass, pebbles on soil. About 20-30 triangles. */
function jPatch(g, f, it) {
  const r = rng(it.seed || 5), kind = it.kind || 'grass', cols = PATCH[kind] || PATCH.grass;
  const W = it.w || 2.4, D = it.d || 1.4, C = 0.3;
  const blob = (sw, sd, y, col) => {
    const rows = Math.max(2, Math.round(sd / C));
    for (let k = 0; k < rows; k++) {
      const v = ((k + 0.5) / rows) * 2 - 1, hw = (sw / 2) * Math.sqrt(Math.max(0, 1 - v * v));
      const l = -hw + Math.round((r() - 0.5) * 2) * C * 0.5, rr = hw + Math.round((r() - 0.5) * 2) * C * 0.5;
      if (rr - l < C * 0.8) continue;
      const z0 = -sd / 2 + k * (sd / rows);
      f.flat(Math.round(l / C) * C, z0, Math.round(rr / C) * C, z0 + sd / rows, y, col);
    }
  };
  blob(W, D, 0.0045, cols[0]);
  blob(W * 0.6, D * 0.6, 0.0052, cols[1 + Math.floor(r() * (cols.length - 1))]);
  if (kind === 'grass' || kind === 'moss') {
    const b = 2 + Math.floor(r() * 3);
    for (let k = 0; k < b; k++) f.flatR((r() - 0.5) * W * 0.6, (r() - 0.5) * D * 0.5, 0.06, 0.2 + r() * 0.1, 0.009, BLADE[k % BLADE.length], (r() - 0.5) * 1.2);
  }
  if (kind === 'soil') for (let k = 0; k < 2; k++) f.flatR((r() - 0.5) * W * 0.5, (r() - 0.5) * D * 0.4, 0.09, 0.07, 0.009, J.stoneD, r());
}

/** A low planted verge (len along local x, 0.8 deep): kerb stones on the street side (+Z faces the camera),
 * soil and grass, low shrubs, a few flowers. Stays under knee height: the street camera looks over it. */
function jVerge(g, f, it) {
  const r = rng(it.seed || 9), L = it.len || 6;
  f.flat(-L / 2, -0.4, L / 2, 0.4, 0.005, '#CDB48F');
  f.flatR(0, -0.05, L * 0.92, 0.5, 0.006, '#B9C88E', 0);
  // kerb: stones of uneven length, a hair apart
  let x = -L / 2;
  while (x < L / 2 - 0.1) {
    const l = Math.min(L / 2 - x, 0.7 + r() * 0.6);
    g.box(x + l / 2, 0.06, 0.36, l - 0.04, 0.12, 0.12, r() < 0.5 ? J.stone : J.stoneD);
    x += l;
  }
  // shrubs: two-box clumps, greens of the Home Book
  const n = Math.max(2, Math.round(L / 1.6));
  for (let k = 0; k < n; k++) {
    const sx = -L / 2 + (k + 0.5) * (L / n) + (r() - 0.5) * 0.3, h = 0.22 + r() * 0.18, w = 0.42 + r() * 0.2;
    const c = r() < 0.5 ? J.leaf : J.leafL;
    g.box(sx, h / 2, -0.08, w, h, 0.42, c);
    g.box(sx + (r() - 0.5) * 0.14, h + 0.06, -0.08, w * 0.6, 0.12, 0.3, r() < 0.5 ? J.leafL : '#A6C97F');
    if (r() < 0.55) g.box(sx + w / 2 + 0.12, 0.16, 0.12, 0.1, 0.1, 0.1, [J.rose, J.mustard, J.redL, '#F4EFE4'][Math.floor(r() * 4)]);
  }
}

export const PROP = {
  jPatch: { draw: jPatch, obstacles: () => [] },
  jVerge: { draw: jVerge, obstacles: (it) => { const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0), L = (it.len || 6) / 2 + 0.05; return [{ type: 'box', minX: it.x - Math.abs(L * c) - Math.abs(0.4 * s), maxX: it.x + Math.abs(L * c) + Math.abs(0.4 * s), minZ: it.z - Math.abs(L * s) - Math.abs(0.4 * c), maxZ: it.z + Math.abs(L * s) + Math.abs(0.4 * c) }]; } },
};
