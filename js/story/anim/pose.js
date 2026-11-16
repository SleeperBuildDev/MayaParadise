// The pose helpers every clip uses, and the safety clamps applied last (js/story/anim).
//
// A person's pose is the record people.js fills each frame (people.js `P`):
//   hipsY, torsoX, torsoY, torsoZ, headX, headY, headZ, aLx, aLy, aLz, aRx, aRy, aRz, lLx, lRx
//   (+ read-only: walk 0..1, speed m/s, t seconds, talk seconds left, mood, emote 0/1)
// Sign rules (people.js update): torsoX > 0 bends forward; headX > 0 looks down, headY yaw, headZ tilt;
// arm x < 0 swings the arm forward / up (-1.45 straight ahead, -2.2 hand at the face, -2.6 overhead-front);
// armL.z > 0 / armR.z < 0 lift that arm out sideways. Clips speak in "out" for both arms (out > 0 = away
// from the body, < 0 = across it) through arm() below, so one recipe serves either side.
//
// Every channel a clip touches is written as a TARGET mix (c + (t - c) * w) or an ADDITIVE nudge (+= d * w),
// so a weight of 0 is exactly the pose people.js made: fading a clip in or out never snaps.

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const smooth = (s) => { s = s < 0 ? 0 : s > 1 ? 1 : s; return s * s * (3 - 2 * s); };
export const mix = (c, t, w) => c + (t - c) * w;
/** 0 -> 1 -> 0 over [a, b] with soft edges f wide (the same envelope people.js emotes use). */
export const win = (u, a, b, f) => smooth((u - a) / f) * smooth((b - u) / f);
/** A soft pulse: 0..1..0 once per period, eased. */
export const pulse = (t, period) => { const u = (t / period) % 1; return Math.sin(u * Math.PI) ** 2; };
export const TAU = Math.PI * 2;

/** Side +1 = the figure's own left arm (armL, +X), -1 = right arm (armR). x: forward/up swing, out: away from the body. */
export function arm(P, side, x, out, w) {
  if (side > 0) { P.aLx += (x - P.aLx) * w; P.aLz += (out - P.aLz) * w; }
  else { P.aRx += (x - P.aRx) * w; P.aRz += (-out - P.aRz) * w; }
}
/** Additive arm nudge (x, out) on one side. */
export function armAdd(P, side, dx, dout, w) {
  if (side > 0) { P.aLx += dx * w; P.aLz += dout * w; } else { P.aRx += dx * w; P.aRz -= dout * w; }
}
/** Both arms to the same (x, out). */
export function arms(P, x, out, w) {
  P.aLx += (x - P.aLx) * w; P.aLz += (out - P.aLz) * w;
  P.aRx += (x - P.aRx) * w; P.aRz += (-out - P.aRz) * w;
}
/** Twist of one arm about its own length (the hand turns palm up / down; no visual change on a box arm but used by props). */
export function armTwist(P, side, y, w) { if (side > 0) P.aLy += (y - P.aLy) * w; else P.aRy += (y - P.aRy) * w; }

/**
 * The glitch rules, applied after every anim layer and before people.js's lookAt and bone writes.
 *   seat: true while a caller-confirmed seat clip runs (sit / pedal); otherwise hips stay within 0.06 m of rest
 *   busy: anim is driving this person (the elder's stick rule only bends anim poses, never people.js's own emotes)
 */
export function safe(P, rig, seat, busy) {
  // hips: never low enough for feet.js to take them for seated (it uses hipY - 0.08), and never hop high
  if (!seat) P.hipsY = clamp(P.hipsY, rig.hipY - 0.06, rig.hipY + 0.07);
  P.torsoX = clamp(P.torsoX, -0.3, 0.9);
  P.torsoY = clamp(P.torsoY, -0.3, 0.3);
  P.torsoZ = clamp(P.torsoZ, -0.25, 0.25);
  P.headX = clamp(P.headX, -0.55, 0.6);
  P.headY = clamp(P.headY, -0.35, 0.35); // (lookAt adds its own yaw on top; this is only the clip's share)
  P.headZ = clamp(P.headZ, -0.3, 0.3);
  // arms never pass through the body: a hanging arm may tuck in only a little; forward arms may cross more
  P.aLz = Math.max(P.aLz, -inward(P.aLx));
  P.aRz = Math.min(P.aRz, inward(P.aRx));
  if (busy && rig.stick) {
    // the walking stick is on the right arm: keep it low and close to the side
    P.aRx = clamp(P.aRx, -0.5, 0.35);
    P.aRz = clamp(P.aRz, -0.35, 0.08);
  }
}
/** How far an arm may swing across the body at this forward angle (x). */
function inward(x) {
  if (x > -0.4) return 0.08; // hanging: brush the side at most
  if (x < -0.9) return x < -2.9 ? 0.3 : 0.65; // forward (straight overhead again keeps out of the head)
  return 0.08 + (0.57 * (-0.4 - x)) / 0.5;
}
