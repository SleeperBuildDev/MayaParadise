// Night shadows from the nearest light. After dark every character (Maya, the car, the townsfolk) casts its shadow
// AWAY from the lit lamp, lantern, stall bulb or house window it stands near; between two lights the shadow turns from
// one to the other as it walks; far from every light it is the moon's shadow again. Each caster has its own direction
// (it depends only on where THAT caster stands), so nothing else on screen moves when the player walks.
//
// How: there is still only the one shadow map (the moon's). In its depth pass a tracked caster is drawn sheared sideways
// in proportion to height (Object3D.onBeforeShadow rewrites the mesh's modelViewMatrix for that one draw), by exactly
// the amount that makes the moon's projection of the sheared body land where the lamp's shadow would. The real,
// animated silhouette, no extra shadow map, no extra draw call, no shader change; the main pass is untouched.
//
//   trackCaster(root, { height })   (module level: the townsfolk are made before / without the game object at hand)
//                               a caster whose feet are at root's world position; every shadow-casting mesh under it
//                               is hooked (re-checked now and then: clothes, things in the hand). Returns the record.
//   untrackCaster(root)
//   const ns = createNightShadow({ day, shadow });        // shadow: setupSceneShadows() controller (its .light)
//   ns.addSource(fn)            fn(push) is called on every rescan; push(x, y, z, reach = 7, power = 1, nx = 0, nz = 0)
//                               (nx, nz: a window's outward facing; 0, 0 = shines all round). Returns a remover.
//   ns.track / ns.untrack       the same as trackCaster / untrackCaster
//   ns.update(dt, t)            once a frame, after everyone has moved and before the render
//   ns.rescan()                 light sources changed (a chunk streamed in, lanterns lit): collect again now
//   ns.stats()                  { lights, casters, lit, k } for tests
import * as THREE from './three.js';

const CELL = 8; // metres: the grid the lights are binned in (a caster looks at its 3 x 3 cells)
const FULL = 2.4; // metres from a light inside which its shadow fully replaces the moon's
const MAX_SHEAR = 1.35; // shadow length per metre of height at most (a low lamp would throw a 5 m shadow)
const MIN_DROP = 0.9; // the light is treated as at least this far above the caster's chest
const RESCAN = 2.5; // seconds between cheap re-collections of the light list
const REHOOK = 1.2; // seconds between re-checks of a caster's meshes

const _m = new THREE.Matrix4();

// ---- the still things (benches, crates, stalls, posts, tree trunks): the same rule, worked out per vertex in the
// shadow pass's vertex shader from a small texture of the lights (a grid of 8 m cells, up to SLOTS lights each), so a
// still thing's shadow depends only on where IT stands and never moves. Things taller than the light keep the moon's.
const GX0 = -128, GZ0 = -96, GCX = 56, GCZ = 80, SLOTS = 8; // covers x -128..320, z -96..544 (every town)
const gridData = new Float32Array(GCX * SLOTS * GCZ * 4);
const gridTex = new THREE.DataTexture(gridData, GCX * SLOTS, GCZ, THREE.RGBAFormat, THREE.FloatType);
gridTex.magFilter = gridTex.minFilter = THREE.NearestFilter;
gridTex.generateMipmaps = false;
gridTex.needsUpdate = true;
/** Shared by every patched depth material: nsGrid = (x0, z0, 1 / cell, strength 0..1), nsMoon = the moon's offset per metre. */
export const NIGHT_UNIFORMS = {
  nsTex: { value: gridTex },
  nsGrid: { value: new THREE.Vector4(GX0, GZ0, 1 / CELL, 0) },
  nsMoon: { value: new THREE.Vector2() },
};
const WARP_HEAD = `
uniform highp sampler2D nsTex;
uniform vec4 nsGrid;
uniform vec2 nsMoon;
vec3 nsWarp( vec3 wp ) {
  float k = nsGrid.w;
  if ( k <= 0.0 || wp.y <= 0.03 ) return wp;
  vec2 g = ( wp.xz - nsGrid.xy ) * nsGrid.z;
  if ( g.x < 0.0 || g.y < 0.0 || g.x >= ${GCX}.0 || g.y >= ${GCZ}.0 ) return wp;
  ivec2 c = ivec2( g );
  vec2 acc = vec2( 0.0 );
  float sw = 0.0, top = 0.0;
  for ( int i = 0; i < ${SLOTS}; i++ ) {
    vec4 L = texelFetch( nsTex, ivec2( c.x * ${SLOTS} + i, c.y ), 0 ); // x, z, y, reach
    if ( L.w <= 0.0 ) break;
    vec2 dv = wp.xz - L.xy;
    float d = length( dv );
    if ( d >= L.w ) continue;
    float f = d <= ${FULL.toFixed(2)} ? 1.0 : 1.0 - ( d - ${FULL.toFixed(2)} ) / ( L.w - ${FULL.toFixed(2)} );
    f = f * f * ( 3.0 - 2.0 * f );
    // what stands higher than the light is not lit by it (but the lamp's own post and head are: no shadow of itself)
    float own = 1.0 - smoothstep( 0.3, 0.8, d );
    f *= max( own, 1.0 - smoothstep( L.z * 0.82, L.z * 1.18, wp.y ) );
    if ( f <= 0.001 ) continue;
    float s = min( d / max( ${MIN_DROP.toFixed(2)}, L.z - 0.5 ), ${MAX_SHEAR.toFixed(2)} );
    float gg = f * f;
    acc += dv * ( d > 0.001 ? s / d : 0.0 ) * gg;
    sw += gg;
    top = max( top, f );
  }
  if ( sw <= 0.0 ) return wp;
  wp.xz += ( acc / sw + nsMoon ) * ( min( 1.0, top ) * k * wp.y );
  return wp;
}
`;
const WARP_BODY = `
  {
    vec4 nsW = vec4( transformed, 1.0 );
    #ifdef USE_BATCHING
      nsW = batchingMatrix * nsW;
    #endif
    #ifdef USE_INSTANCING
      nsW = instanceMatrix * nsW;
    #endif
    nsW = modelMatrix * nsW;
    nsW.xyz = nsWarp( nsW.xyz );
    mvPosition = viewMatrix * nsW;
    gl_Position = projectionMatrix * mvPosition;
  }
`;
/**
 * Makes a shadow depth material draw still things under the night rule (see above). Safe to call twice; keeps the
 * material's own onBeforeCompile (the see-through cut of the story towns). By day it changes nothing (strength 0).
 * A mesh drawn with a patched material ignores the per-caster hook (it works from the true matrices).
 */
export function nightWarp(mat) {
  if (!mat || mat.userData.nightWarp) return mat;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey;
  const own = Object.prototype.hasOwnProperty.call(mat, 'customProgramCacheKey');
  mat.onBeforeCompile = function (shader, renderer) {
    prev?.call(this, shader, renderer);
    shader.uniforms.nsTex = NIGHT_UNIFORMS.nsTex;
    shader.uniforms.nsGrid = NIGHT_UNIFORMS.nsGrid;
    shader.uniforms.nsMoon = NIGHT_UNIFORMS.nsMoon;
    shader.vertexShader = shader.vertexShader.replace('void main() {', WARP_HEAD + 'void main() {').replace('#include <project_vertex>', '#include <project_vertex>' + WARP_BODY);
  };
  mat.customProgramCacheKey = function () { return (own ? prevKey.call(this) : 'std') + '|night-warp-1'; };
  mat.userData.nightWarp = true;
  mat.needsUpdate = true;
  return mat;
}
let plainTwin = null;
/**
 * Every still, plain shadow caster under root whose depth material is three's own gets the patched one (the Home
 * Book's merged meshes; instanced and batched casters have theirs from shadows.js depthTwin). Not the ones three
 * would give a depth material of their own (cut-outs, clipping, displacement), and not a tracked character's.
 */
export function nightWarpStatics(root) {
  const visit = (o) => {
    if (CASTERS.has(o)) return;
    if (o.isMesh && o.castShadow && !o.isSkinnedMesh && !o.isBatchedMesh && !o.isInstancedMesh && o.customDepthMaterial === undefined && !OWNER.has(o)) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const special = mats.some((m) => !m || (m.clipShadows && m.clippingPlanes?.length) || (m.displacementMap && m.displacementScale !== 0)
        || (m.alphaMap && m.alphaTest > 0) || (m.map && m.alphaTest > 0) || m.alphaToCoverage);
      if (!special) o.customDepthMaterial = plainTwin ||= nightWarp(new THREE.MeshDepthMaterial());
    }
    for (const c of o.children) visit(c);
  };
  if (root) visit(root);
}

/** The shadow-pass hook (this = the mesh). Shears the mesh in world space: x += ax * (y - y0), z += az * (y - y0). */
function shearForShadow(renderer, object, camera, shadowCamera) {
  const r = OWNER.get(object);
  if (!r || !r.on || shadowCamera !== r.cam) return;
  const m = object.matrixWorld.elements, e = _m.elements, ax = r.ax, az = r.az;
  for (let c = 0; c < 16; c += 4) {
    e[c] = m[c] + ax * m[c + 1];
    e[c + 1] = m[c + 1];
    e[c + 2] = m[c + 2] + az * m[c + 1];
    e[c + 3] = m[c + 3];
  }
  e[12] -= ax * r.y0;
  e[14] -= az * r.y0;
  object.modelViewMatrix.multiplyMatrices(shadowCamera.matrixWorldInverse, _m);
}

const CASTERS = new Map(); // root -> record (one list for the page: people.js adds the townsfolk, main.js Maya and the car)
const OWNER = new WeakMap(); // hooked mesh -> its caster's record (not in userData: a record holds objects, a clone would choke)
let rigidInst = null; // the plain depth material of a caster's instanced parts (the car's wheels)
/** The townsfolk cast real shadows (false on the 'low' tier: main.js). Read by js/story/people.js when a person is made. */
export const NPC_SHADOWS = { on: true };

export function trackCaster(root, { height = 1.2, blob = null, blobLive = false } = {}) {
  if (!root) return null;
  let rec = CASTERS.get(root);
  if (!rec) { rec = { root, height, ax: 0, az: 0, y0: 0, on: false, cam: null, hookAt: -1e9, w: 0, blob: null, blobLive: false, b0: null, long: false, par: undefined, host: null, outY: NaN, liveY: 0 }; CASTERS.set(root, rec); }
  rec.height = height;
  if (blob) { rec.blob = blob; rec.blobLive = blobLive; }
  return rec;
}
/** Shadow blobs follow the lamp too (the soft dark under the sharp shadow): off = the round blob under the feet only. */
export const BLOB_STRETCH = { on: true, k: 0.8 };
/**
 * The caster's round contact blob (a flat quad under the feet, child of the root) is drawn out along its lamp shadow,
 * so that shadow has a soft dark core, as a real one under a street lamp. Far from the lamps it is the round blob again.
 * blobLive: the owner re-sets the blob's scale every frame (Maya), so only the stretch is added on top.
 */
function stretchBlob(rec, mx, mz) {
  const b = rec.blob;
  if (!rec.b0) rec.b0 = { sx: b.scale.x, sy: b.scale.y, px: b.position.x, pz: b.position.z, rz: b.rotation.z };
  const b0 = rec.b0;
  // the lamp's part of the shadow, per metre of height (the shear minus what only cancels the moon)
  const vx = rec.ax - mx * rec.w, vz = rec.az - mz * rec.w;
  const len = rec.on && BLOB_STRETCH.on ? Math.hypot(vx, vz) * rec.height * BLOB_STRETCH.k * rec.w : 0;
  if (len < 0.06) {
    if (rec.long) {
      rec.long = false; b.position.x = b0.px; b.position.z = b0.pz; b.rotation.z = b0.rz;
      if (!rec.blobLive) b.scale.y = b0.sy; else if (b.scale.y === rec.outY) b.scale.y = rec.liveY;
      rec.outY = NaN;
    }
    return;
  }
  const e = rec.root.matrixWorld.elements, yaw = Math.atan2(e[8], e[10]), c = Math.cos(yaw), s = Math.sin(yaw);
  const dx = vx * c - vz * s, dz = vx * s + vz * c, n = Math.hypot(dx, dz) || 1; // the direction in the root's own frame
  rec.long = true;
  b.rotation.z = Math.atan2(-dx, -dz);
  // (a live blob: what its owner wrote this frame is the base; if the owner did not run this frame, the value is
  // still the one written here last frame, and the remembered base is used: the stretch never piles up)
  let base = b0.sy;
  if (rec.blobLive) { if (b.scale.y !== rec.outY) rec.liveY = b.scale.y; base = rec.liveY; }
  b.scale.y = rec.outY = base + len;
  b.position.x = b0.px + (dx / n) * len * 0.5;
  b.position.z = b0.pz + (dz / n) * len * 0.5;
}
export function untrackCaster(root) {
  const rec = CASTERS.get(root);
  if (!rec) return;
  rec.on = false;
  CASTERS.delete(root);
}

/** A light source list from the lamp-core InstancedMeshes ('glows': the Home Book's lamps and lanterns; 'ow-glows':
 *  every lamp, lantern and stall bulb of the story towns). One instance = one light. Hidden ones (scale 0) are skipped. */
export function glowSource(scene, names = ['glows', 'ow-glows']) {
  const found = {};
  return (push) => {
    for (const n of names) {
      let o = found[n];
      if (!o || !o.parent) o = found[n] = scene.getObjectByName(n) || null;
      if (!o?.isInstancedMesh) continue;
      const e = o.instanceMatrix.array;
      for (let i = 0; i < o.count; i++) {
        const k = i * 16, y = e[k + 13];
        // (a lamp hidden by the see-through cut of a building still counts: its light must not come and go as the
        // player walks behind a wall. A landmark's lantern that has not grown yet sits at y = 0: skipped below.)
        if (y > 6 || y < 0.3) continue; // (the tower's beacon is no street light)
        // a street lamp reaches further than a bulb under a stall roof or a lantern by a door
        push(e[k + 12], y, e[k + 14], y >= 2.15 ? 7.5 : y >= 1.4 ? 5.5 : 4);
      }
    }
  };
}

export function createNightShadow({ day, shadow }) {
  const light = shadow?.light || null;
  const cam = light?.shadow?.camera || null;
  const sources = new Set();
  const casters = CASTERS;
  // lights: x, y, z, reach, power, nx, nz (7 floats each), binned in a grid
  let L = new Float32Array(7 * 64), nL = 0;
  const grid = new Map(), cellX = new Map(), cellZ = new Map();
  let stills = true; // the still things follow the rule too (off on the 'low' tier)
  let scanAt = -1e9, k = 0, lit = 0, dirty = true;
  const key = (cx, cz) => (cx + 2048) * 4096 + (cz + 2048); // (one number per cell, no two cells alike)
  let sig = 0, lastSig = NaN, lastN = -1;

  function push(x, y, z, reach = 7, power = 1, nx = 0, nz = 0) {
    if (!(reach > 0) || !(power > 0) || !Number.isFinite(x + y + z)) return;
    if ((nL + 1) * 7 > L.length) { const n = new Float32Array(L.length * 2); n.set(L); L = n; }
    const o = nL * 7;
    L[o] = x; L[o + 1] = y; L[o + 2] = z; L[o + 3] = reach; L[o + 4] = power; L[o + 5] = nx; L[o + 6] = nz;
    sig += x * 31.7 + z * 17.3 + y * 7.1 + reach * 3.3 + power + nx * 0.7 + nz * 0.3 + nL * 0.011;
    nL++;
  }
  function scan() {
    nL = 0; sig = 0;
    for (const fn of sources) { try { fn(push); } catch (e) { console.warn('[nightshadow] source failed', e); } }
    dirty = false;
    if (nL === lastN && sig === lastSig) return; // the same lights as last time: the grid and its texture stand
    lastN = nL; lastSig = sig;
    grid.clear(); cellX.clear(); cellZ.clear();
    for (let i = 0; i < nL; i++) {
      const o = i * 7, r = L[o + 3];
      const x0 = Math.floor((L[o] - r) / CELL), x1 = Math.floor((L[o] + r) / CELL);
      const z0 = Math.floor((L[o + 2] - r) / CELL), z1 = Math.floor((L[o + 2] + r) / CELL);
      for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
        const kk = key(cx, cz);
        let a = grid.get(kk);
        if (!a) { grid.set(kk, a = []); cellX.set(kk, cx); cellZ.set(kk, cz); }
        a.push(i);
      }
    }
    // the same lights for the still things' vertex shader: per cell, the nearest SLOTS to its centre
    gridData.fill(0);
    for (const [kk, a] of grid) {
      const cx = cellX.get(kk), cz = cellZ.get(kk), gx = cx - GX0 / CELL, gz = cz - GZ0 / CELL;
      if (gx < 0 || gz < 0 || gx >= GCX || gz >= GCZ) continue;
      const mx = (cx + 0.5) * CELL, mz = (cz + 0.5) * CELL;
      if (a.length > SLOTS) a.sort((p, q) => Math.hypot(L[p * 7] - mx, L[p * 7 + 2] - mz) - Math.hypot(L[q * 7] - mx, L[q * 7 + 2] - mz));
      let n = 0;
      for (let j = 0; j < a.length && n < SLOTS; j++) {
        const o = a[j] * 7;
        if (L[o + 5] || L[o + 6]) continue; // (a window shines one way only: the people's rule handles it, not this one)
        const t = ((gz * GCX + gx) * SLOTS + n++) * 4;
        gridData[t] = L[o]; gridData[t + 1] = L[o + 2]; gridData[t + 2] = L[o + 1]; gridData[t + 3] = L[o + 3] * Math.min(1, L[o + 4]);
      }
    }
    gridTex.needsUpdate = true;
    dirty = false;
  }

  /** Hooks the caster's own shadow-casting meshes (not those of another caster riding on it: Maya on the car's seat). */
  function claim(rec, o) {
    if (o !== rec.root && casters.has(o)) return;
    if (o.isMesh && !o.isBatchedMesh && o.castShadow && o.userData.nightShadow !== false && OWNER.get(o) !== rec) {
      OWNER.set(o, rec);
      o.onBeforeShadow = shearForShadow;
      // a rigid part with a still thing's depth material (the car's instanced wheels) follows its body's rule instead
      if (o.customDepthMaterial?.userData?.nightWarp) o.customDepthMaterial = o.isInstancedMesh ? (rigidInst ||= new THREE.MeshDepthMaterial()) : undefined;
    }
    const ch = o.children;
    for (let i = 0; i < ch.length; i++) claim(rec, ch[i]);
  }
  function hook(rec) { claim(rec, rec.root); }
  /** The caster this one rides on, if any (Maya in the car): it takes that one's shadow rule whole. */
  function hostOf(root) {
    for (let p = root.parent; p; p = p.parent) { const h = casters.get(p); if (h) return h; }
    return null;
  }

  /** The shear for one caster standing at (x, y0, z): fills rec.ax / rec.az, returns the lamp share 0..1. */
  function solve(rec, x, y0, z, mx, mz) {
    const a = grid.get(key(Math.floor(x / CELL), Math.floor(z / CELL)));
    let sx = 0, sz = 0, sw = 0, top = 0;
    if (a) {
      const chest = y0 + rec.height * 0.55;
      for (let j = 0; j < a.length; j++) {
        const o = a[j] * 7, dx = x - L[o], dz = z - L[o + 2], d = Math.hypot(dx, dz), reach = L[o + 3];
        if (d >= reach) continue;
        let f = d <= FULL ? 1 : 1 - (d - FULL) / (reach - FULL);
        f = f * f * (3 - 2 * f) * L[o + 4];
        const nx = L[o + 5], nz = L[o + 6];
        if (nx || nz) { // a window: only in front of it
          const front = d > 0.001 ? (dx * nx + dz * nz) / d : 0;
          f *= Math.max(0, Math.min(1, front * 2.2));
        }
        if (f <= 0.001) continue;
        const drop = Math.max(MIN_DROP, L[o + 1] - chest);
        let s = d / drop; // shadow length per metre of height
        if (s > MAX_SHEAR) s = MAX_SHEAR;
        const g = f * f, u = d > 0.001 ? s / d : 0; // (f squared: the nearer light wins between two)
        sx += dx * u * g; sz += dz * u * g; sw += g;
        if (f > top) top = f;
      }
    }
    if (sw <= 0) { rec.ax = rec.az = 0; return 0; }
    // the blend of the lights' directions, at the strength of the strongest one; the rest stays the moon's
    const w = Math.min(1, top) * k;
    rec.ax = (sx / sw + mx) * w;
    rec.az = (sz / sw + mz) * w;
    return w;
  }

  const api = {
    addSource(fn) { sources.add(fn); dirty = true; return () => { sources.delete(fn); dirty = true; }; },
    track: trackCaster,
    untrack: untrackCaster,
    rescan() { dirty = true; },
    /** Indoors (or any time the world is not what is drawn): the still things' rule is off. */
    sleep() { NIGHT_UNIFORMS.nsGrid.value.w = 0; if (lit) { for (const rec of casters.values()) { rec.on = false; if (rec.long) stretchBlob(rec, 0, 0); } lit = 0; } },
    set stills(v) { stills = !!v; },
    get stills() { return stills; },
    update(dt, t) {
      if (!cam || !day) return;
      const s = day.state;
      // only once the lamps are really on (dusk keeps the low sun's long shadows)
      const kk = Math.max(0, Math.min(1, ((s.lamps ?? 0) - 0.72) / 0.28));
      k = kk * kk * (3 - 2 * kk);
      if (k <= 0.001) {
        if (lit) { for (const rec of casters.values()) { rec.on = false; if (rec.long) stretchBlob(rec, 0, 0); } lit = 0; }
        NIGHT_UNIFORMS.nsGrid.value.w = 0;
        return;
      }
      if (dirty || t - scanAt > RESCAN) { scan(); scanAt = t; }
      // the moon's own offset per metre of height (cancelled, so the sheared body lands on the lamp's side)
      const sd = s.sunDir, sy = Math.max(0.2, sd[1]);
      const mx = sd[0] / sy, mz = sd[2] / sy;
      NIGHT_UNIFORMS.nsGrid.value.w = stills ? k : 0;
      NIGHT_UNIFORMS.nsMoon.value.set(mx, mz);
      lit = 0;
      for (const rec of casters.values()) {
        const root = rec.root;
        rec.cam = cam;
        if (!root.parent || root.visible === false) { rec.on = false; if (rec.long) stretchBlob(rec, 0, 0); continue; }
        if (t - rec.hookAt > REHOOK) { hook(rec); rec.hookAt = t + (casters.size > 8 ? Math.random() * 0.4 : 0); }
        if (root.parent !== rec.par) { rec.par = root.parent; rec.host = hostOf(root); }
        const h = rec.host;
        if (h) { // riding: one shadow rule for the two (the host's of this frame or the last, the same to the eye)
          rec.ax = h.ax; rec.az = h.az; rec.y0 = h.y0; rec.w = h.w;
        } else {
          const e = root.matrixWorld.elements;
          rec.y0 = e[13];
          rec.w = solve(rec, e[12], e[13], e[14], mx, mz);
        }
        rec.on = rec.w > 0.004;
        if (rec.on) lit++;
        if (rec.blob && (rec.on || rec.long)) stretchBlob(rec, mx, mz);
      }
    },
    stats() { return { lights: nL, casters: casters.size, lit, k: +k.toFixed(3) }; },
    /** Tests: the shear a caster at (x, y, z) of this height would get now. */
    probe(x, y, z, height = 1.2) {
      const rec = { height, ax: 0, az: 0 };
      const s = day.state, sy = Math.max(0.2, s.sunDir[1]);
      if (dirty) scan();
      const w = solve(rec, x, y, z, s.sunDir[0] / sy, s.sunDir[2] / sy);
      return { ax: rec.ax, az: rec.az, w };
    },
    get lights() { return L.subarray(0, nL * 7); },
  };
  return api;
}
