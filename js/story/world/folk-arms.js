// Arms for the still townsfolk merged into the open world's chunk meshes (regions/market-life.js, junction-folk.js,
// wharf-yards.js, garden-town.js). An arm turns about its shoulder and ends in a hand, so whatever a pose holds is
// drawn in the hand that holds it:
//   const A = folkArms(g, f, { ax, ty, th, lean, s, top, skin })
//   A.arm(sx, rx, rz)        an arm turned like a people.js arm bone (rx < 0 swings it forward / up); -> hand [x, y, z]
//   A.reach(sx, [x, y, z])   an arm pointed at a spot (the hand stops at the arm's length);           -> hand [x, y, z]
//   stick(g, a, b, w, colour)  a pole from point a to point b (a broom handle, a rod)
//   broom(g, hand, ...)      a street broom held in that hand, its head on the ground ahead; -> the handle's top end
// Item-local space: front = +Z, feet at y = 0; sx = +1 is the figure's own left arm (+X), -1 its right (as people.js).
// (These arms used to turn about their own middles, so a raised or reaching arm hung off the body with its hand
// nowhere near the broom, paper or sack it held.)
export function folkArms(g, f, { ax, ty, th, lean = 0, tz = lean * 0.3, z0 = 0.04, s = 1, top, skin, len = 0.38, w = 0.11 }) {
  const up = th / 2 - 0.05;
  const sy = ty + up * Math.cos(lean) + 0.01, sz = z0 + tz + up * Math.sin(lean);
  const L = len * s, hw = 0.1 * s, H = L + 0.035 * s;
  // d: the arm's direction from the hand up to the shoulder (unit); boxR turns local +Y to (-sin rz, cos rz cos rx, cos rz sin rx)
  const draw = (sx, dx, dy, dz) => {
    const rz = Math.asin(Math.max(-1, Math.min(1, -dx))), rx = Math.atan2(dz, dy), x0 = sx * ax;
    g.boxR(x0 - dx * L / 2, sy - dy * L / 2, sz - dz * L / 2, w * s, L, w * s, top, rx, 0, rz);
    const hand = [x0 - dx * H, sy - dy * H, sz - dz * H];
    f.boxR(hand[0], hand[1], hand[2], hw, hw, hw, skin, rx, 0, rz);
    return hand;
  };
  return {
    shoulder: (sx) => [sx * ax, sy, sz],
    arm: (sx, rx = 0, rz = 0) => draw(sx, -Math.sin(rz), Math.cos(rz) * Math.cos(rx), Math.cos(rz) * Math.sin(rx)),
    reach(sx, [x, y, z]) {
      const dx = sx * ax - x, dy = sy - y, dz = sz - z, l = Math.hypot(dx, dy, dz) || 1;
      return draw(sx, dx / l, dy / l, dz / l);
    },
  };
}

/** A pole of width w from point a to point b (item-local). */
export function stick(g, a, b, w, color) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz) || 1;
  const rz = Math.asin(Math.max(-1, Math.min(1, -dx / l))), rx = Math.atan2(dz / l, dy / l);
  g.boxR((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, w, l, w, color, rx, 0, rz);
}

/** A street broom held in `hand`: the handle runs down and forward through the hand to its head on the ground.
 *  Returns the handle's top end (where a second hand can reach). */
export function broom(g, hand, { handle, head, headW = 0.36, dir = [0.05, -0.8, 0.55], above = 0.14 }) {
  const l = Math.hypot(dir[0], dir[1], dir[2]), u = [dir[0] / l, dir[1] / l, dir[2] / l];
  const t = Math.max(0.2, (hand[1] - 0.12) / -u[1]);
  const topEnd = [hand[0] - u[0] * above, hand[1] - u[1] * above, hand[2] - u[2] * above];
  const foot = [hand[0] + u[0] * t, 0.12, hand[2] + u[2] * t];
  stick(g, topEnd, foot, 0.04, handle);
  g.boxR(foot[0], 0.08, foot[2] + 0.03, headW, 0.16, 0.08, head, 0.4, 0, 0);
  return topEnd;
}
