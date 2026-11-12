// Time of day from the player's own clock: morning (5-10), noon (10-16), evening (16-19), night (19-5).
// Neighbouring periods blend smoothly over about an hour, so a visit that crosses a boundary eases
// from one look to the next. Everything here is data + small appliers; main.js decides when to call.
//
//   const day = createDaytime({ renderer, tier, params, sunScale }); // ?time=7.5 / ?period=night for testing
//   day.state                  -> the blended look for now (colours, sun, lamps 0..1, stars 0..1, grade ...)
//   day.applyWorld(world)      -> sun, fill, sky dome, fog, clouds, lamp glows, stars, moon, lamp pools,
//                                 and warm light from the house windows after dark
//   day.applyRoom(roomScene)   -> window key light + warm lamp fill for the hour (safe to call on
//                                 every entry; the room keeps its own art)
//   day.grade(el)              -> the CSS colour grade + vignette layer over the canvas (cinematic look)
//   day.update(dt) -> true when the look changed (re-checks the clock every 30 s), then re-apply
//   day.set(hour|null)         -> force an hour (testing), null = back to the real clock
//
// Rules kept: artwork and signs are unlit and not tone mapped, so they keep their true colours at
// every hour; nothing here adds real-time lights (lamp pools are cheap additive decals).
import * as THREE from './three.js';

// ---- the four looks ---------------------------------------------------------------------------
// sunDir points TOWARD the light (x: + right / east of the default camera, z: + toward the camera).
// The key always stays a little in front of the scene (z > 0) so the faces the camera sees are lit.
export const PERIODS = {
  morning: {
    sun: '#FFC9A0', sunIntensity: 2.5, sunDir: [6.5, 3.0, 3.6],
    hemiSky: '#F6DCCB', hemiGround: '#C9A57E', hemi: 0.55, env: 0.3,
    skyTop: '#A9C7E6', skyHor: '#FCD9C0', skyBand: '#F6B8A4', abyss: '#D8C3D6',
    fogNear: 1, cloud: '#FFF3EE', cloudGlow: '#FFE3D6', cloudGlowK: 0.24,
    exposure: 1.0, lamps: 0, stars: 0, moon: 0, headlights: 0, windows: 0.05,
    grade: '#FFB08A', gradeK: 0.05, vignette: 0.16,
    room: { key: '#FFD6B4', keyK: 2.5, fill: '#FBE7DA', fillK: 1, lamps: 0.15 },
  },
  noon: {
    sun: '#FFF1DC', sunIntensity: 2.9, sunDir: [-1.6, 10, 3.2],
    hemiSky: '#E4EEF6', hemiGround: '#C8B08A', hemi: 0.52, env: 0.28,
    skyTop: '#86BEEA', skyHor: '#DCEEF8', skyBand: '#E9EEEC', abyss: '#C9D3E6',
    fogNear: 1.15, cloud: '#FFFFFF', cloudGlow: '#FFFFFF', cloudGlowK: 0.2,
    exposure: 0.95, lamps: 0, stars: 0, moon: 0, headlights: 0, windows: 0,
    grade: '#FFFFFF', gradeK: 0, vignette: 0.12,
    room: { key: '#FFF1DE', keyK: 2.8, fill: '#FBF3E6', fillK: 1, lamps: 0 },
  },
  evening: {
    sun: '#FF9F5C', sunIntensity: 2.6, sunDir: [-7.2, 2.4, 2.6],
    hemiSky: '#F2B68E', hemiGround: '#A9764F', hemi: 0.55, env: 0.3,
    skyTop: '#7E86B8', skyHor: '#F7A36A', skyBand: '#EE7E5A', abyss: '#B98AA6',
    fogNear: 0.9, cloud: '#FFD7BE', cloudGlow: '#FF9E70', cloudGlowK: 0.3,
    exposure: 1.0, lamps: 0.7, stars: 0.05, moon: 0, headlights: 0.35, windows: 0.8,
    grade: '#FF7A3A', gradeK: 0.06, vignette: 0.22,
    room: { key: '#FFB27A', keyK: 1.9, fill: '#F8D7BA', fillK: 1.05, lamps: 0.7 },
  },
  night: {
    sun: '#A9BFFF', sunIntensity: 0.9, sunDir: [-3.4, 7.5, 4.2], // the moon
    hemiSky: '#5D6E9E', hemiGround: '#3A3550', hemi: 0.75, env: 0.18,
    skyTop: '#0E1834', skyHor: '#2A3A66', skyBand: '#3B3F6E', abyss: '#1E2340',
    fogNear: 0.75, cloud: '#8E9BC6', cloudGlow: '#B9C6F2', cloudGlowK: 0.16,
    exposure: 1.12, lamps: 1, stars: 1, moon: 1, headlights: 1, windows: 1,
    grade: '#1B2D66', gradeK: 0.08, vignette: 0.3,
    room: { key: '#9FB2E8', keyK: 0.9, fill: '#FFD6A6', fillK: 1.35, lamps: 1 },
  },
};

// Hour keys: each period holds its look, then blends to the next across the boundary.
const KEYS = [[0, 'night'], [4.4, 'night'], [5.6, 'morning'], [9.4, 'morning'], [10.6, 'noon'], [15.4, 'noon'],
  [16.4, 'evening'], [18.4, 'evening'], [19.6, 'night'], [24, 'night']];

/** Which named period an hour belongs to (the user's ranges: 5-10, 10-16, 16-19, 19-5). */
export function periodOf(h) {
  if (h >= 5 && h < 10) return 'morning';
  if (h >= 10 && h < 16) return 'noon';
  if (h >= 16 && h < 19) return 'evening';
  return 'night';
}

const C1 = new THREE.Color(), C2 = new THREE.Color();
function mixHex(a, b, f) { return '#' + C1.set(a).lerp(C2.set(b), f).getHexString(); }
function mixObj(A, B, f) {
  const o = {};
  for (const k in A) {
    const a = A[k], b = B[k];
    if (typeof a === 'number') o[k] = a + (b - a) * f;
    else if (Array.isArray(a)) o[k] = a.map((v, i) => v + (b[i] - v) * f);
    else if (typeof a === 'string') o[k] = mixHex(a, b, f);
    else if (a && typeof a === 'object') o[k] = mixObj(a, b, f);
  }
  return o;
}

/** The blended look for an hour (0-24). */
export function sampleDaytime(hour) {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < KEYS.length - 2 && h >= KEYS[i + 1][0]) i++;
  const [h0, a] = KEYS[i], [h1, b] = KEYS[i + 1];
  let f = h1 > h0 ? (h - h0) / (h1 - h0) : 0;
  f = f * f * (3 - 2 * f);
  const s = mixObj(PERIODS[a], PERIODS[b], f);
  s.hour = h;
  s.period = periodOf(h);
  s.from = a; s.to = b; s.blend = f;
  return s;
}

/** Hour from the clock, or from ?time=7.5 / ?period=night (testing and screenshots). */
export function clockHour(params, date = new Date()) {
  const t = params?.get?.('time');
  if (t != null && t !== '' && Number.isFinite(+t)) return +t;
  const p = params?.get?.('period');
  if (p && { morning: 1, noon: 1, evening: 1, night: 1 }[p]) return { morning: 7.5, noon: 13, evening: 17.5, night: 22 }[p];
  return date.getHours() + date.getMinutes() / 60;
}

// ---- small visual pieces ----------------------------------------------------------------------
function discTexture(inner, outer, soft = 0.5) {
  const s = 128, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, inner);
  grd.addColorStop(soft, outer);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Stars on the dome (fade with s.stars) and a soft moon disc on the moon side of the sky. */
function buildNightSky(radius = 170) {
  const group = new THREE.Group();
  group.name = 'nightSky';
  const N = 420, pos = new Float32Array(N * 3), size = new Float32Array(N);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < N; i++) {
    const u = rnd(), v = 0.06 + rnd() * 0.94; // only above the horizon
    const th = u * Math.PI * 2, y = v, r = Math.sqrt(1 - y * y);
    pos[i * 3] = Math.cos(th) * r * radius; pos[i * 3 + 1] = y * radius; pos[i * 3 + 2] = Math.sin(th) * r * radius;
    size[i] = rnd();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({ color: '#FFF4D8', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false });
  const stars = new THREE.Points(g, starMat);
  stars.frustumCulled = false;
  stars.renderOrder = -9;
  stars.raycast = () => {};
  const moonMat = new THREE.SpriteMaterial({ map: discTexture('rgba(255,250,232,1)', 'rgba(220,228,255,0.35)', 0.32), transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false });
  const moon = new THREE.Sprite(moonMat);
  moon.scale.setScalar(26);
  moon.renderOrder = -9;
  moon.raycast = () => {};
  group.add(stars, moon);
  group.userData = { stars, moon, radius };
  return group;
}

/** Warm pools of light on the page under each street lamp (additive, unlit, no shadows). */
function buildLampPools(glows) {
  const out = new THREE.Group();
  out.name = 'lampPools';
  if (!glows?.isInstancedMesh) return out;
  const tex = discTexture('rgba(255,214,140,0.85)', 'rgba(255,190,110,0.28)', 0.45);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: true });
  const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  const lamps = [];
  for (let i = 0; i < glows.count; i++) {
    glows.getMatrixAt(i, m);
    m.decompose(p, q, s);
    if (Math.abs(p.y - 2.56) < 0.05 && Math.abs(s.x - 0.27) < 0.02) lamps.push(p.clone());
  }
  if (!lamps.length) return out;
  const pool = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat, lamps.length);
  lamps.forEach((l, i) => pool.setMatrixAt(i, m.compose(p.set(l.x, l.y - 2.56 + 0.035, l.z), q.identity(), s.set(4.2, 1, 4.2))));
  pool.renderOrder = 2;
  pool.frustumCulled = false;
  pool.raycast = () => {};
  pool.userData.shadow = 'none';
  out.add(pool);
  out.userData.mat = mat;
  return out;
}

/**
 * Warm room light behind every house window (night and dusk). Finds the window glass in the
 * landmarks' merged voxel meshes (sky-blue glass colour on upright faces), then adds, as children of
 * each mesh (so they follow it): a lit-from-inside pane over the glass, a soft halo round each
 * window and a spill of light on the ground in front. Three draw calls per mesh, no real lights.
 * Returns { panes, halos, spills, groups, count } (opacity driven by state.windows) or null.
 */
const GLASS = new THREE.Color('#BFD9EC'); // PALETTE.skyTop: the window-glass colour in landmarks.js
function buildWindowLights(root) {
  const paneMat = new THREE.MeshBasicMaterial({ color: '#FFC46E', transparent: true, opacity: 0, depthWrite: false, toneMapped: false, fog: true, vertexColors: true });
  const haloTex = discTexture('rgba(255,200,120,0.9)', 'rgba(255,170,90,0.3)', 0.38);
  const haloMat = new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: true, side: THREE.DoubleSide });
  const spillMat = new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: true });
  const isActor = (o) => { for (let q = o; q; q = q.parent) if (/car|maya/i.test(q.name || '')) return true; return false; };
  const meshes = [];
  root.traverse((o) => { if (o.isMesh && !o.userData.isOutline && o.geometry?.attributes?.color && o.geometry?.attributes?.normal && !isActor(o)) meshes.push(o); });
  const groups = [];
  let count = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), cen = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  for (const mesh of meshes) {
    const g = mesh.geometry, P = g.attributes.position, N = g.attributes.normal, S = g.attributes.color, I = g.index;
    const tri = I ? I.count / 3 : P.count / 3;
    const vid = (t, k) => (I ? I.getX(t * 3 + k) : t * 3 + k);
    const isGlass = (v) => Math.abs(S.getX(v) - GLASS.r) < 0.035 && Math.abs(S.getY(v) - GLASS.g) < 0.035 && Math.abs(S.getZ(v) - GLASS.b) < 0.035;
    const pane = [], clusters = [];
    let minY = Infinity;
    for (let v = 0; v < P.count; v++) minY = Math.min(minY, P.getY(v));
    for (let t = 0; t < tri; t++) {
      const i0 = vid(t, 0), i1 = vid(t, 1), i2 = vid(t, 2);
      if (!isGlass(i0) || !isGlass(i1) || !isGlass(i2)) continue;
      n.fromBufferAttribute(N, i0);
      if (Math.abs(n.y) > 0.3) continue; // only upright faces: panes, not sills or tops
      a.fromBufferAttribute(P, i0); b.fromBufferAttribute(P, i1); c.fromBufferAttribute(P, i2);
      const area = e1.subVectors(b, a).cross(e2.subVectors(c, a)).length() / 2;
      if (area < 0.004) continue; // thin pane edges
      cen.copy(a).add(b).add(c).divideScalar(3);
      // cluster into windows: same facing, centres close together
      let cl = clusters.find((q) => q.n.dot(n) > 0.95 && q.c.distanceTo(cen) < 0.7 + q.r);
      if (!cl) {
        cl = { n: n.clone(), c: cen.clone(), sum: new THREE.Vector3(), area: 0, box: new THREE.Box3(), r: 0, k: 0.78 + ((clusters.length * 37) % 23) / 100 };
        clusters.push(cl);
      }
      cl.sum.addScaledVector(cen, area);
      cl.area += area;
      cl.box.expandByPoint(a); cl.box.expandByPoint(b); cl.box.expandByPoint(c);
      cl.c.copy(cl.sum).divideScalar(cl.area);
      cl.r = Math.min(1.2, cl.box.getSize(e1).length() / 2);
      for (const p of [a, b, c]) pane.push([p.x + n.x * 0.012, p.y + n.y * 0.012, p.z + n.z * 0.012, cl]);
    }
    if (!pane.length) continue;
    // panes: brighter toward the bottom (a lamp in the room), each window a slightly different warmth
    const pos = [], col = [];
    for (const [x, y, z, cl] of pane) {
      const h = cl.box.max.y - cl.box.min.y;
      const t = h > 0 ? (y - cl.box.min.y) / h : 0.5;
      const k = cl.k * (1.12 - 0.36 * t);
      pos.push(x, y, z);
      col.push(Math.min(1, k), Math.min(1, k * 0.9), Math.min(1, k * 0.74));
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    pg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const group = new THREE.Group();
    group.name = 'windowLights';
    group.userData.shadow = 'none';
    group.add(new THREE.Mesh(pg, paneMat));
    // halos (facing out of each window) and ground spills (in front of the lower windows)
    const hp = [], hu = [], sp = [], su = [];
    const up = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3(), q = new THREE.Vector3();
    const quad = (out, uv, o, ax, ay) => {
      for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) {
        q.copy(o).addScaledVector(ax, x).addScaledVector(ay, y);
        out.push(q.x, q.y, q.z);
        uv.push((x + 1) / 2, (y + 1) / 2);
      }
    };
    for (const cl of clusters) {
      if (cl.area < 0.03) continue;
      const sz = cl.box.getSize(new THREE.Vector3());
      const w = Math.max(sz.x, sz.z), h = sz.y;
      side.crossVectors(up, cl.n).normalize();
      const center = cl.box.getCenter(new THREE.Vector3()).addScaledVector(cl.n, 0.06);
      quad(hp, hu, center, side.clone().multiplyScalar(w * 0.9 + 0.5), up.clone().multiplyScalar(h * 0.9 + 0.5));
      const height = cl.box.min.y - minY;
      if (height < 4.5) {
        const reach = 1.2 + height * 0.25;
        const o = new THREE.Vector3(center.x, minY + 0.04, center.z).addScaledVector(cl.n, reach * 0.8);
        quad(sp, su, o, side.clone().multiplyScalar(w * 0.8 + 0.5), cl.n.clone().multiplyScalar(reach));
      }
      count++;
    }
    for (const [arr, uv, mat] of [[hp, hu, haloMat], [sp, su, spillMat]]) {
      if (!arr.length) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      group.add(new THREE.Mesh(geo, mat));
    }
    group.traverse((o) => {
      if (!o.isMesh) return;
      o.raycast = () => {};
      o.castShadow = o.receiveShadow = false;
      o.renderOrder = 3;
      o.frustumCulled = false;
    });
    group.visible = false;
    mesh.add(group);
    groups.push(group);
  }
  if (!groups.length) return null;
  return { panes: paneMat, halos: haloMat, spills: spillMat, groups, count };
}

/** Headlight beams for the car: two soft additive cones. Attach to the car body, facing its front. */
export function buildHeadlightBeams({ spread = 0.9, length = 5.5 } = {}) {
  const g = new THREE.Group();
  g.name = 'headlightBeams';
  const tex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 128;
    const c = cv.getContext('2d');
    const grd = c.createLinearGradient(0, 0, 0, 128);
    grd.addColorStop(0, 'rgba(255,240,200,0.75)');
    grd.addColorStop(1, 'rgba(255,240,200,0)');
    c.fillStyle = grd;
    c.beginPath(); c.moveTo(26, 0); c.lineTo(38, 0); c.lineTo(64, 128); c.lineTo(0, 128); c.closePath(); c.fill();
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
  const geo = new THREE.PlaneGeometry(spread * 2, length).rotateX(-Math.PI / 2).translate(0, 0, length / 2);
  for (const x of [-0.42, 0.42]) {
    const beam = new THREE.Mesh(geo, mat);
    beam.position.set(x, 0.05, 0);
    beam.raycast = () => {};
    beam.userData.shadow = 'none';
    g.add(beam);
  }
  g.userData.mat = mat;
  return g;
}

// ---- environment map for the hour (soft fill + reflections) ------------------------------------
function buildEnv(renderer, s) {
  const geo = new THREE.SphereGeometry(10, 48, 24);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const top = new THREE.Color(s.skyTop), hor = new THREE.Color(s.skyHor), low = new THREE.Color(s.hemiGround).multiplyScalar(0.6);
  const glow = new THREE.Color(s.sun), sun = new THREE.Vector3(...s.sunDir).normalize();
  const c = new THREE.Color(), t = new THREE.Color(), d = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize();
    if (d.y >= 0) c.copy(hor).lerp(top, THREE.MathUtils.smoothstep(d.y, 0, 0.55));
    else c.copy(hor).lerp(low, THREE.MathUtils.smoothstep(-d.y, 0, 0.25));
    const k = Math.max(0, d.dot(sun));
    c.add(t.copy(glow).multiplyScalar(0.8 * Math.pow(k, 6) + 12 * s.sunIntensity / 3 * Math.pow(k, 180)));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, toneMapped: false });
  const sc = new THREE.Scene();
  sc.add(new THREE.Mesh(geo, mat));
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(sc, 0.02, 0.1, 100, { size: 64 });
  pm.dispose(); geo.dispose(); mat.dispose();
  rt.texture.name = 'env-daytime';
  rt.texture.userData.shared = true;
  return rt;
}

// ---- the controller ---------------------------------------------------------------------------
export function createDaytime({ renderer, tier = 'mid', params = null, baseExposure = 1, sunScale = 1, hemiScale = 2.5, env: useEnv = false } = {}) {
  let forced = null;
  const hourNow = () => (forced != null ? forced : clockHour(params));
  let state = sampleDaytime(hourNow());
  let envRT = null, envKey = '';
  let clockT = 0;
  let windowLights; // built on the first applyWorld
  const _dir = new THREE.Vector3();

  function envFor(s) {
    if (!useEnv || tier === 'low' || !renderer) return null;
    // rebuild only when the look moved noticeably (about every 20 minutes of real time at most)
    const key = `${s.from}-${s.to}-${Math.round(s.blend * 4)}`;
    if (key !== envKey) {
      envRT?.dispose();
      envRT = buildEnv(renderer, s);
      envKey = key;
    }
    return envRT.texture;
  }

  function lightsOf(scene) {
    let L = scene.userData.standardLights;
    if (!L || !L.sun) {
      L = { hemi: null, sun: null };
      scene.traverse((o) => {
        if (!L.hemi && o.isHemisphereLight) L.hemi = o;
        if (!L.sun && o.isDirectionalLight && !o.userData.cinematic) L.sun = o;
      });
    }
    return L;
  }

  function paintSky(sky, s) {
    const g = sky?.geometry;
    if (!g?.attributes?.color) return;
    const pos = g.attributes.position, col = g.attributes.color;
    const R = g.boundingSphere?.radius || (g.computeBoundingSphere(), g.boundingSphere.radius);
    const top = new THREE.Color(s.skyTop), hor = new THREE.Color(s.skyHor), band = new THREE.Color(s.skyBand), low = new THREE.Color(s.abyss), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / R;
      if (y >= 0) c.copy(band).lerp(hor, THREE.MathUtils.smoothstep(y, 0, 0.08)).lerp(top, THREE.MathUtils.smoothstep(y, 0.06, 0.6));
      else c.copy(band).lerp(low, THREE.MathUtils.smoothstep(-y, 0, 0.18));
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
  }

  const api = {
    get state() { return state; },
    get hour() { return state.hour; },
    get period() { return state.period; },

    /** Sun/moon, fill, sky, fog, clouds, lamp glows, stars and lamp pools for the world scene. */
    applyWorld(world, { shadow = null } = {}) {
      const scene = world.scene || world;
      const s = state;
      const L = lightsOf(scene);
      const env = envFor(s);
      if (L.hemi) {
        L.hemi.color.set(s.hemiSky);
        L.hemi.groundColor.set(s.hemiGround);
        L.hemi.intensity = env ? s.hemi : s.hemi * hemiScale;
      }
      if (L.sun) {
        L.sun.color.set(s.sun);
        L.sun.intensity = s.sunIntensity * sunScale;
        _dir.set(s.sunDir[0], s.sunDir[1], s.sunDir[2]).normalize();
        L.sun.position.copy(L.sun.target.position).addScaledVector(_dir, 20);
        L.sun.userData.sunDir = _dir.toArray();
        shadow?.refresh?.();
      }
      if (env) { scene.environment = env; scene.environmentIntensity = s.env; }
      if (scene.background?.isColor) scene.background.set(s.abyss);
      if (scene.fog) scene.fog.color.set(s.abyss);
      scene.userData.fogNearK = s.fogNear;
      paintSky(scene.getObjectByName('sky'), s);

      const clouds = scene.getObjectByName('cloudsNear')?.material;
      if (clouds) {
        clouds.color.set(s.cloud);
        if (clouds.emissive) { clouds.emissive.set(s.cloudGlow); clouds.emissiveIntensity = s.cloudGlowK; }
      }
      // lamp cores: daytime cream, warmer and brighter once lit (they bloom on 'high')
      const glows = scene.getObjectByName('glows');
      if (glows?.material?.color) {
        glows.material.color.set(mixHex('#E9D9B0', '#FFE3A0', Math.min(1, s.lamps * 1.5)));
        if (s.lamps > 0.05) glows.material.color.multiplyScalar(1 + s.lamps * 0.6);
      }
      // night dressing, made once
      let night = scene.getObjectByName('nightSky');
      if (!night) { night = buildNightSky(); scene.add(night); }
      const { stars, moon, radius } = night.userData;
      stars.material.opacity = s.stars * 0.95;
      stars.visible = s.stars > 0.01;
      moon.material.opacity = s.moon;
      moon.visible = s.moon > 0.01;
      moon.position.set(s.sunDir[0], s.sunDir[1], s.sunDir[2]).normalize().multiplyScalar(radius * 0.9);
      let pools = scene.getObjectByName('lampPools');
      if (!pools) { pools = buildLampPools(glows); (world.root || scene).add(pools); }
      if (pools.userData.mat) { pools.userData.mat.opacity = s.lamps * 0.75; pools.visible = s.lamps > 0.02; }
      // warm light from the house windows after dark
      if (windowLights === undefined) windowLights = buildWindowLights(world.root || scene);
      if (windowLights) {
        const w = s.windows;
        windowLights.panes.opacity = Math.min(1, w * 0.95);
        windowLights.halos.opacity = w * 0.85;
        windowLights.spills.opacity = w * 0.75;
        for (const g of windowLights.groups) g.visible = w > 0.02;
      }
      if (renderer) renderer.toneMappingExposure = baseExposure * s.exposure;
      return s;
    },

    /** Indoors: the window key takes the hour's light; at night warm lamps carry the room. */
    applyRoom(scene) {
      const s = state.room;
      const L = lightsOf(scene);
      if (L.sun) { L.sun.color.set(s.key); L.sun.intensity = s.keyK * sunScale; }
      if (L.hemi) {
        // rooms are cached and re-entered: always start from the room's own fill
        const base = (scene.userData.dayFill ||= { color: L.hemi.color.clone(), intensity: L.hemi.intensity });
        L.hemi.color.copy(base.color).lerp(C1.set(s.fill), 0.6);
        L.hemi.intensity = base.intensity * s.fillK;
      }
      if (renderer) renderer.toneMappingExposure = baseExposure;
      return s;
    },

    /** Colour grade + vignette as one CSS layer over the canvas (cheap on every phone). */
    grade(el, { cinematic = 0, indoor = false } = {}) {
      if (!el) return;
      const s = state;
      const k = indoor ? s.gradeK * 0.5 : s.gradeK;
      const v = Math.min(0.6, (indoor ? 0.14 : s.vignette) + cinematic * 0.18);
      el.style.setProperty('--grade', s.grade);
      el.style.setProperty('--grade-k', k.toFixed(3));
      el.style.setProperty('--vig', v.toFixed(3));
      el.dataset.period = s.period;
    },

    /** Headlight beam strength for the hour (0..1). */
    get headlights() { return state.headlights; },
    get windows() { return state.windows; },
    get lamps() { return state.lamps; },

    /** Re-reads the clock every 30 s; returns true when the look changed (caller re-applies). */
    update(dt) {
      clockT += dt;
      if (clockT < 30) return false;
      clockT = 0;
      const h = hourNow();
      if (Math.abs(h - state.hour) < 1 / 120) return false;
      state = sampleDaytime(h);
      return true;
    },

    /** Force an hour (testing / screenshots); null returns to the real clock. Returns the new state. */
    set(hour) {
      forced = hour == null ? null : +hour;
      state = sampleDaytime(hourNow());
      clockT = 0;
      return state;
    },

    dispose() { envRT?.dispose(); envRT = null; },
  };
  return api;
}
