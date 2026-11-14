// Townspeople for the story game: one parametric blocky person kit.
//
// Every person is ONE skinned, vertex-coloured box mesh (8 bones) + its skinned outline, a face
// plane that shows a cell of a shared expression atlas, and a blob shadow: 4 draw calls, ~1.2k
// triangles. Same art rules as Maya (boxes, cel shading, dark outline, her palette); people are a
// little simpler than she is so she stays the star.
//
//   const p = createPerson(spec)        spec: see SPEC below (all optional)
//   p.root                             Group, feet at y = 0, faces +Z when rotation.y = 0
//   p.update(dt, { speed })            speed in m/s drives the walk cycle
//   p.setFace(name, hold?)             'smile' | 'talk' | 'happy' | 'sad' | 'hot' | 'surprised' | 'think' | 'worried' | 'shy'
//   p.talk(seconds)                    mouth flaps
//   p.emote(name) -> Promise           'wave' | 'nod' | 'bow' | 'cheer' | 'shrug' | 'think' | 'slump' | 'fists' | 'point'
//   p.setMood(name|null)               a held body attitude: 'hot' (tense, fists) | 'down' (slumped) | null
//   p.lookAt(vec3|null)                head turns toward a world point (clamped)
//   p.headTop(target) -> Vector3       world point just above the head (bubbles, labels)
//   p.portrait(face) -> canvas         128 px head-and-shoulders picture for the talk screen
//   p.dispose()
import * as THREE from '../game/three.js';
import { mergeGeometries, mergeVertices } from '../game/three.js';
import { PALETTE, toon, blobShadow } from '../game/toon.js';
import { VoxelBuilder } from '../game/voxel.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (s) => { s = clamp(s, 0, 1); return s * s * (3 - 2 * s); };
const damp = (c, t, r, dt) => c + (t - c) * (1 - Math.exp(-r * dt));
const win = (u, a, b, f) => smooth((u - a) / f) * smooth((b - u) / f);

// --------------------------------------------------------------------------------------------
// Colours people are dressed in (Burmese everyday clothes, kept in Maya's warm palette)
// --------------------------------------------------------------------------------------------
// 0..4 are the original five (cast.js uses them); 5..8 widen the range (fair, olive, deep, warm brown)
export const SKINS = ['#F3CBAA', '#E8B48E', '#D9A077', '#C68A63', '#B47A55', '#F6D5B8', '#CFA27A', '#9E6847', '#BC8660'];
export const HAIRS = { black: '#1F1B1B', brown: '#3E2A20', grey: '#B9B3A8', white: '#E9E4DA', dark: '#2B201B', salt: '#7C7671', auburn: '#5A3326' };
export const CLOTH = {
  white: '#F4EFE4', cream: '#E9DFC9', school: '#F7F4EC', schoolGreen: '#2F6B4F',
  maroon: '#7A2533', rose: '#D97C8A', mustard: '#D9A93B', padauk: '#EDB82E', sky: '#7FB0CF',
  navy: '#2E3D63', teal: '#2F7C7A', olive: '#7A7A3A', brown: '#7A5434', tan: '#C9A576',
  plum: '#6B3E64', coral: '#E0795A', grey: '#8E8A84', charcoal: '#3A3634', leaf: '#5E8F4E',
};

/*
SPEC = {
  age: 'child' | 'teen' | 'adult' | 'elder',   body proportions
  build: 'slim' | 'mid' | 'wide',
  skin: 0..4 (index into SKINS) or a hex,
  hair: 'short' | 'side' | 'bob' | 'long' | 'bun' | 'braid' | 'bald' | 'cap' | 'spiky',
  hairColor: 'black' | 'brown' | 'grey' | 'white' or a hex,
  top: 'shirt' | 'tee' | 'eingyi' | 'blouse' | 'school' | 'apron' | 'vest',
  topColor, sleeves: 'short' | 'long',
  bottom: 'longyi' | 'htamein' | 'trousers' | 'shorts' | 'schoolLongyi' | 'schoolSkirt',
  bottomColor, check: true (a checked longyi),
  extras: ['glasses', 'thanaka', 'gaungbaung', 'flower', 'satchel', 'apron', 'towel', 'beard', 'pencil',
           'moustache', 'cane', 'chinlone', 'freckles', 'mole', 'blush'],
  extraColor, seed

  Variety (all optional; when left out each one is picked from the person's seed, so two people with
  the same clothes still get different faces. `seed` defaults to a hash of the spec):
  face: 'oval' | 'round' | 'long' | 'square' | 'heart'    head shape
  eyes: 'tall' | 'round' | 'almond' | 'lash' | 'small'    eye drawing (the face atlas has one sheet per style)
  eyeSet: 'mid' | 'close' | 'wide',  mouth: 'mid' | 'wide',  nose: 'small' | 'mid' | 'broad',  ears: 'mid' | 'big'
  height: 0.9..1.1 (a multiplier on legs, body and arms),
  pattern: 'plain' | 'check' | 'stripe' | 'acheik' | 'border' | 'floral'   (longyi / htamein cloth)
  patternColor, glassesStyle: 'square' | 'round' | 'half', glassesColor
  hair also: 'curly' | 'pony' | 'crew' | 'parted' | 'wavy' | 'receding';  hairColor also 'dark' | 'salt' | 'auburn'
  mood 'kick' (people.setMood / a job's mood): keeps a chinlone ball up with the feet (extras 'chinlone')
}
*/

// --------------------------------------------------------------------------------------------
// Bones: [name, parent]; rest positions come from the body measurements
// --------------------------------------------------------------------------------------------
const BONES = ['hips', 'torso', 'head', 'armL', 'armR', 'legL', 'legR', 'hat', 'ball'];
const BI = Object.fromEntries(BONES.map((b, i) => [b, i]));

function measures(age, build) {
  // metres: leg length, torso height, head cube, shoulder half-width, body depth
  const m = {
    child: { leg: 0.17, torso: 0.24, head: 0.38, sw: 0.125, d: 0.15, arm: 0.21 },
    teen: { leg: 0.25, torso: 0.31, head: 0.41, sw: 0.145, d: 0.17, arm: 0.27 },
    adult: { leg: 0.29, torso: 0.35, head: 0.42, sw: 0.16, d: 0.19, arm: 0.3 },
    elder: { leg: 0.27, torso: 0.34, head: 0.41, sw: 0.155, d: 0.19, arm: 0.29 },
  }[age] || null;
  const M = { ...(m || { leg: 0.29, torso: 0.35, head: 0.42, sw: 0.16, d: 0.19, arm: 0.3 }) };
  const k = build === 'slim' ? 0.88 : build === 'wide' ? 1.2 : 1;
  M.sw *= k;
  M.d *= build === 'wide' ? 1.18 : build === 'slim' ? 0.92 : 1;
  M.belly = build === 'wide' ? 0.03 : 0;
  return M;
}

// --------------------------------------------------------------------------------------------
// Expression atlas (transparent; skin comes from the head box behind it)
// --------------------------------------------------------------------------------------------
export const FACES = ['smile', 'talk', 'happy', 'sad', 'hot', 'surprised', 'think', 'worried', 'blink', 'shy'];
const CELL = 128;
const ATLAS_COLS = 4;
const ATLAS_ROWS = Math.ceil(FACES.length / ATLAS_COLS);
// one sheet per face style (eye drawing, eye spacing, mouth width, a mark): shared by everyone who has it
const ATLASES = new Map();

/** style: { eyes, eyeSet, mouth, mark, ink } (see SPEC) */
function drawFace(g, name, style = {}) {
  const ink = style.ink || '#2A2118';
  const es = style.eyes || 'tall';
  const spread = style.eyeSet === 'close' ? 4 : style.eyeSet === 'wide' ? -4 : 0; // move both eyes in (or out)
  const mw = style.mouth === 'wide' ? 1.22 : 1;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const eye = (x0, open = 1, look = 0) => {
    const x = x0 < 64 ? x0 + spread : x0 - spread;
    if (open <= 0.15) {
      g.strokeStyle = ink; g.lineWidth = es === 'small' ? 6 : 7;
      g.beginPath(); g.moveTo(x - 11, 58); g.quadraticCurveTo(x, 64, x + 11, 58); g.stroke();
      return;
    }
    g.fillStyle = ink;
    let w = 16, h = 26 * open, r = 7, gl = 3.2;
    if (es === 'round') { w = 19; h = 19 * open; r = 9.5; }
    else if (es === 'almond') { w = 21; h = 15 * open; r = 7; gl = 2.8; }
    else if (es === 'small') { w = 12; h = 17 * open; r = 6; gl = 2.4; }
    g.beginPath(); g.roundRect(x - w / 2 + look, 60 - h / 2, w, h, Math.min(r, h / 2)); g.fill();
    if (es === 'almond') { g.strokeStyle = ink; g.lineWidth = 3.5; g.beginPath(); g.moveTo(x - 13 + look, 60 - h / 2 + 1); g.quadraticCurveTo(x + look, 60 - h / 2 - 5, x + 13 + look, 60 - h / 2 + 1); g.stroke(); }
    if (es === 'lash') {
      g.strokeStyle = ink; g.lineWidth = 3;
      const out = x < 64 ? -1 : 1;
      g.beginPath(); g.moveTo(x + out * 6, 60 - h / 2 + 3); g.lineTo(x + out * 12, 60 - h / 2 - 3); g.stroke();
      g.beginPath(); g.moveTo(x + out * 2, 60 - h / 2 + 1); g.lineTo(x + out * 6, 60 - h / 2 - 5); g.stroke();
    }
    g.fillStyle = '#FFFFFF';
    g.beginPath(); g.arc(x - w / 8 - 0.5 + look, 60 - h / 2 + Math.min(7, h * 0.3), gl, 0, Math.PI * 2); g.fill();
  };
  const brow = (x0, tilt, y = 34) => {
    const x = x0 < 64 ? x0 + spread : x0 - spread;
    g.strokeStyle = ink; g.lineWidth = 5;
    g.beginPath(); g.moveTo(x - 11, y + tilt); g.lineTo(x + 11, y - tilt); g.stroke();
  };
  const mouth = (kind) => {
    g.save();
    g.translate(64, 0); g.scale(mw, 1); g.translate(-64, 0);
    g.strokeStyle = '#6E1F2A'; g.fillStyle = '#6E1F2A'; g.lineWidth = 5.5 / mw;
    g.beginPath();
    if (kind === 'smile') { g.moveTo(52, 92); g.quadraticCurveTo(64, 101, 76, 92); g.stroke(); }
    else if (kind === 'open') { g.ellipse(64, 95, 9, 8, 0, 0, Math.PI * 2); g.fill(); }
    else if (kind === 'grin') { g.moveTo(48, 89); g.quadraticCurveTo(64, 112, 80, 89); g.closePath(); g.fill(); }
    else if (kind === 'frown') { g.moveTo(53, 99); g.quadraticCurveTo(64, 90, 75, 99); g.stroke(); }
    else if (kind === 'flat') { g.moveTo(54, 96); g.lineTo(74, 95); g.stroke(); }
    else if (kind === 'o') { g.ellipse(64, 96, 6, 8, 0, 0, Math.PI * 2); g.fill(); }
    else if (kind === 'wavy') { g.moveTo(52, 96); g.quadraticCurveTo(58, 91, 64, 96); g.quadraticCurveTo(70, 101, 76, 96); g.stroke(); }
    else if (kind === 'side') { g.moveTo(58, 96); g.quadraticCurveTo(68, 99, 76, 92); g.stroke(); }
    g.restore();
  };
  const blush = () => { g.fillStyle = 'rgba(242,140,130,0.45)'; g.beginPath(); g.ellipse(30, 82, 10, 6, 0, 0, 7); g.ellipse(98, 82, 10, 6, 0, 0, 7); g.fill(); };
  // the person's own marks first (under the eyes and mouth)
  const mark = style.mark || '';
  if (mark === 'blush' && name !== 'happy' && name !== 'shy') { g.fillStyle = 'rgba(242,140,130,0.32)'; g.beginPath(); g.ellipse(30, 82, 9, 5, 0, 0, 7); g.ellipse(98, 82, 9, 5, 0, 0, 7); g.fill(); }
  if (mark === 'freckles') { g.fillStyle = 'rgba(120,70,40,0.55)'; for (const [x, y] of [[24, 78], [32, 82], [27, 87], [96, 82], [104, 78], [101, 87]]) { g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); } }
  if (mark === 'mole') { g.fillStyle = 'rgba(70,40,25,0.8)'; g.beginPath(); g.arc(88, 90, 2.8, 0, 7); g.fill(); }
  if (mark === 'lines') {
    // an elder's crow's feet and laugh lines
    g.strokeStyle = 'rgba(90,55,35,0.5)'; g.lineWidth = 2.6;
    for (const s of [-1, 1]) {
      const ex = 64 + s * (22 - spread);
      g.beginPath(); g.moveTo(ex + s * 12, 52); g.lineTo(ex + s * 19, 49); g.moveTo(ex + s * 12, 58); g.lineTo(ex + s * 20, 58); g.stroke();
      g.beginPath(); g.moveTo(64 + s * 20, 84); g.quadraticCurveTo(64 + s * 22, 92, 64 + s * 18, 99); g.stroke();
    }
  }
  switch (name) {
    case 'smile': eye(42); eye(86); mouth('smile'); break;
    case 'talk': eye(42); eye(86); mouth('open'); break;
    case 'happy': eye(42, 0); eye(86, 0); brow(42, -2, 36); brow(86, 2, 36); mouth('grin'); blush(); break;
    case 'sad': eye(42, 0.75); eye(86, 0.75); brow(42, 5); brow(86, -5); mouth('frown'); break;
    case 'hot': eye(42, 0.8); eye(86, 0.8); brow(42, -6, 38); brow(86, 6, 38); mouth('flat'); break;
    case 'surprised': eye(42, 1.15); eye(86, 1.15); brow(42, 0, 28); brow(86, 0, 28); mouth('o'); break;
    case 'think': eye(42, 0.9, 4); eye(86, 0.9, 4); brow(42, 3, 32); brow(86, -1, 34); mouth('side'); break;
    case 'worried': eye(42, 0.9); eye(86, 0.9); brow(42, 5, 34); brow(86, -5, 34); mouth('wavy'); break;
    case 'blink': eye(42, 0); eye(86, 0); mouth('smile'); break;
    case 'shy': eye(42, 0.7, -3); eye(86, 0.7, -3); mouth('smile'); blush(); break;
    default: eye(42); eye(86); mouth('smile');
  }
}

const styleKey = (s) => `${s.eyes || 'tall'}|${s.eyeSet || 'mid'}|${s.mouth || 'mid'}|${s.mark || ''}|${s.ink || ''}`;
function acquireAtlas(style = {}) {
  const key = styleKey(style);
  let A = ATLASES.get(key);
  if (A) { A.refs++; return A; }
  const cv = document.createElement('canvas');
  cv.width = CELL * ATLAS_COLS;
  cv.height = CELL * ATLAS_ROWS;
  const g = cv.getContext('2d');
  FACES.forEach((name, i) => {
    g.save();
    g.translate((i % ATLAS_COLS) * CELL, Math.floor(i / ATLAS_COLS) * CELL);
    drawFace(g, name, style);
    g.restore();
  });
  const texture = new THREE.CanvasTexture(cv);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = toon('#ffffff', { map: texture, transparent: false });
  material.alphaTest = 0.5;
  material.transparent = false;
  A = { key, canvas: cv, texture, material, rows: ATLAS_ROWS, refs: 1 };
  ATLASES.set(key, A);
  return A;
}
function releaseAtlas(A) {
  if (A && --A.refs <= 0) { A.texture.dispose(); A.material.dispose(); ATLASES.delete(A.key); }
}
function setFaceUV(geo, name) {
  const i = Math.max(0, FACES.indexOf(name));
  const c = i % ATLAS_COLS, r = Math.floor(i / ATLAS_COLS);
  const u0 = c / ATLAS_COLS, u1 = (c + 1) / ATLAS_COLS;
  const v1 = 1 - r / ATLAS_ROWS, v0 = 1 - (r + 1) / ATLAS_ROWS;
  const uv = geo.attributes.uv;
  uv.setXY(0, u0, v0); uv.setXY(1, u1, v0); uv.setXY(2, u1, v1); uv.setXY(3, u0, v1);
  uv.needsUpdate = true;
}
// --------------------------------------------------------------------------------------------
// Skinned outline material (same look as Maya's)
// --------------------------------------------------------------------------------------------
const OUTLINE = { mat: null, uniforms: null, refs: 0 };
function outlineMat() {
  OUTLINE.refs++;
  if (OUTLINE.mat) return OUTLINE.mat;
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.outline), side: THREE.BackSide, toneMapped: false });
  const uniforms = { uOutlinePx: { value: 1.8 }, uResolution: { value: new THREE.Vector2(1024, 1024) } };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uOutlinePx = uniforms.uOutlinePx;
    shader.uniforms.uResolution = uniforms.uResolution;
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'uniform float uOutlinePx;\nuniform vec2 uResolution;\nvoid main() {')
      .replace('#include <project_vertex>', `#include <project_vertex>
        {
          vec3 vN = normalize( normalMatrix * objectNormal );
          vec2 dir = ( projectionMatrix * vec4( vN, 0.0 ) ).xy;
          float len = length( dir );
          if ( len > 1e-5 ) gl_Position.xy += ( dir / len ) * uOutlinePx * gl_Position.w * 2.0 / uResolution;
        }`);
  };
  mat.customProgramCacheKey = () => 'people-skinned-outline';
  OUTLINE.mat = mat;
  OUTLINE.uniforms = uniforms;
  return mat;
}

// --------------------------------------------------------------------------------------------
// Body parts (absolute rest-pose coordinates, feet at y = 0, face toward +Z)
// --------------------------------------------------------------------------------------------
function hex(v, fallback) {
  if (!v) return fallback;
  if (v.startsWith?.('#')) return v;
  return CLOTH[v] || HAIRS[v] || fallback;
}
function shade(h, k) {
  const c = new THREE.Color(h);
  c.multiplyScalar(k);
  return '#' + c.getHexString();
}
/** A warm/cool nudge of a colour (skin tints: no two people quite the same). */
function tint(h, dr, dg, db) {
  const c = new THREE.Color(h);
  c.r = clamp(c.r * (1 + dr), 0, 1); c.g = clamp(c.g * (1 + dg), 0, 1); c.b = clamp(c.b * (1 + db), 0, 1);
  return '#' + c.getHexString();
}

// ---- the seed: from the spec (the same spec twice in one session gets a second face, not a twin)
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
const SEEN = new Map();
function specSeed(spec) {
  if (Number.isFinite(spec.seed)) return spec.seed >>> 0;
  const base = hashStr(JSON.stringify([spec.name, spec.age, spec.build, spec.skin, spec.hair, spec.hairColor, spec.top, spec.topColor, spec.bottom, spec.bottomColor, spec.check, spec.extras, spec.extraColor]));
  const n = SEEN.get(base) || 0;
  SEEN.set(base, n + 1);
  return (base + n * 7919) >>> 0;
}
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, list) => list[Math.floor(r() * list.length) % list.length];
const PATTERN_INK = ['#2E3D63', '#7A2533', '#3A3634', '#2F7C7A', '#D9A93B', '#F4EFE4', '#6B3E64'];
const HEADS = {
  oval: [1, 1], round: [1.07, 0.95], long: [0.9, 1.1], square: [1.04, 1.0], heart: [1.04, 1.0],
};

/** Everything that varies from person to person, filled in from the seed where the spec is silent. */
function variety(spec) {
  const r = mulberry(specSeed(spec));
  const age = spec.age || 'adult';
  const bottom = spec.bottom || (spec.top === 'school' ? 'schoolLongyi' : 'trousers');
  const man = bottom === 'longyi' || bottom === 'trousers' || bottom === 'schoolLongyi' || (bottom === 'shorts' && spec.top !== 'blouse');
  const V = {};
  V.face = spec.face || pick(r, age === 'child' ? ['round', 'round', 'oval', 'heart'] : age === 'elder' ? ['long', 'square', 'oval', 'round'] : ['oval', 'round', 'long', 'square', 'heart']);
  V.eyes = spec.eyes || pick(r, man ? ['tall', 'round', 'almond', 'small', 'tall'] : ['tall', 'round', 'almond', 'lash', 'lash']);
  V.eyeSet = spec.eyeSet || pick(r, ['mid', 'mid', 'close', 'wide']);
  V.mouth = spec.mouth || (r() < 0.3 ? 'wide' : 'mid');
  V.nose = spec.nose || pick(r, ['small', 'mid', 'mid', 'broad']);
  V.ears = spec.ears || (r() < (age === 'child' ? 0.4 : 0.22) ? 'big' : 'mid');
  const ex = new Set(spec.extras || []);
  V.mark = ex.has('freckles') ? 'freckles' : ex.has('mole') ? 'mole' : ex.has('blush') ? 'blush'
    : age === 'elder' ? (r() < 0.75 ? 'lines' : '') : age === 'child' ? (r() < 0.5 ? 'blush' : r() < 0.3 ? 'freckles' : '') : (r() < 0.12 ? 'mole' : r() < 0.12 ? 'freckles' : '');
  // a little taller or shorter than the rest of their age
  V.height = Number.isFinite(spec.height) ? spec.height : 1 + (r() - 0.5) * (age === 'child' ? 0.16 : 0.1);
  // a skin tint of their own (unless the spec gave an exact colour)
  const k = (r() - 0.5) * 0.12; // lighter or deeper than their tone's middle
  V.skinTint = [k + (r() - 0.5) * 0.02, k * 0.8, k * 0.5 - (r() - 0.5) * 0.03];
  V.pattern = spec.pattern || (spec.check ? 'check'
    : bottom === 'longyi' ? pick(r, ['check', 'check', 'stripe', 'plain'])
      : bottom === 'htamein' ? pick(r, ['acheik', 'border', 'floral', 'plain', 'stripe']) : 'plain');
  V.patternColor = hex(spec.patternColor, pick(r, PATTERN_INK));
  V.glassesStyle = spec.glassesStyle || pick(r, age === 'elder' ? ['half', 'round', 'square'] : ['square', 'round', 'round']);
  V.glassesColor = hex(spec.glassesColor, pick(r, ['#5A3B22', '#2A2118', '#B08A3E', '#7A2533']));
  V.moustache = ex.has('moustache') || (man && (age === 'adult' || age === 'elder') && !ex.has('beard') && r() < 0.28);
  V.r = r;
  V.man = man;
  return V;
}

function buildParts(spec) {
  const V = variety(spec);
  const M0 = measures(spec.age || 'adult', spec.build || 'mid');
  // height: legs, body and arms grow together (the head stays: big heads are the style)
  const M = { ...M0, leg: M0.leg * V.height, torso: M0.torso * (1 + (V.height - 1) * 0.7), arm: M0.arm * (1 + (V.height - 1) * 0.8) };
  const parts = []; // { bone, x, y, z, w, h, d, color, outline }
  const add = (bone, x, y, z, w, h, d, color, outline = true) => parts.push({ bone, x, y, z, w, h, d, color, outline });
  const skin0 = typeof spec.skin === 'number' ? SKINS[spec.skin] || SKINS[1] : hex(spec.skin, SKINS[1]);
  const skin = typeof spec.skin === 'string' && spec.skin.startsWith('#') ? skin0 : tint(skin0, ...V.skinTint);
  const hairC = hex(spec.hairColor, spec.age === 'elder' ? pick(V.r, [HAIRS.grey, HAIRS.white, HAIRS.salt]) : (V.r() < 0.25 ? HAIRS.dark : HAIRS.black));
  const top = spec.top || 'shirt';
  const topC = top === 'school' ? CLOTH.school : hex(spec.topColor, CLOTH.white);
  const bottom = spec.bottom || (top === 'school' ? 'schoolLongyi' : 'trousers');
  const botC = bottom.startsWith('school') ? CLOTH.schoolGreen : hex(spec.bottomColor, CLOTH.navy);
  const extras = new Set(spec.extras || []);
  if (V.moustache) extras.add('moustache');
  const exC = hex(spec.extraColor, CLOTH.padauk);
  const L = M.leg, T = M.torso, H = M.head, SW = M.sw, D = M.d;
  const hipY = L, shoulderY = L + T, headY = shoulderY + 0.03;
  const wrapped = bottom === 'longyi' || bottom === 'htamein' || bottom === 'schoolLongyi' || bottom === 'schoolSkirt';

  // legs (each on its own bone) and shoes
  const legW = SW * 0.62, legX = SW * 0.48;
  const shoe = spec.shoe || pick(V.r, ['#6B4A33', '#6B4A33', '#3A3634', '#7A2533', '#8C6A48']);
  for (const [bone, sx] of [['legL', 1], ['legR', -1]]) {
    const x = sx * legX;
    const legC = bottom === 'shorts' || wrapped ? skin : botC;
    add(bone, x, L * 0.55, 0, legW, L * 0.9, D * 0.66, legC);
    if (bottom === 'shorts') add(bone, x, L * 0.8, 0, legW + 0.012, L * 0.42, D * 0.7, botC);
    add(bone, x, 0.035, 0.022, legW + 0.01, 0.07, D * 0.8, shoe); // slippers / shoes
  }
  // hips and the wrap (longyi / htamein) or trouser top
  if (wrapped) {
    const hem = bottom === 'htamein' || bottom === 'schoolSkirt' ? 0.05 : 0.07;
    const ww = SW * 2 * (bottom === 'htamein' ? 0.96 : 1.0);
    const tubeH = hipY + 0.02 - hem, tubeY = (hipY + 0.02 + hem) / 2 + 0.01, TD = D * 1.05;
    // longyi: one tube from waist to just above the feet, a touch wider at the hem
    add('hips', 0, tubeY, 0, ww, tubeH, TD, botC);
    add('hips', 0, hem + 0.02, 0, ww + 0.02, 0.05, D * 1.1, shade(botC, 0.9));
    // the cloth's pattern: thin bands round the tube (seen from every side), drawn without outlines
    const pc = V.pattern === 'check' ? shade(botC, 0.7) : V.patternColor;
    const ring = (y, h, c) => add('hips', 0, y, 0, ww + 0.008, h, TD + 0.008, c, false);
    const vline = (x, c, y0 = hem + 0.05, y1 = hipY - 0.02) => {
      add('hips', x, (y0 + y1) / 2, TD / 2 + 0.004, 0.016, y1 - y0, 0.006, c, false);
      add('hips', x, (y0 + y1) / 2, -TD / 2 - 0.004, 0.016, y1 - y0, 0.006, c, false);
    };
    const sline = (z, c, y0 = hem + 0.05, y1 = hipY - 0.02) => {
      add('hips', ww / 2 + 0.004, (y0 + y1) / 2, z, 0.006, y1 - y0, 0.016, c, false);
      add('hips', -ww / 2 - 0.004, (y0 + y1) / 2, z, 0.006, y1 - y0, 0.016, c, false);
    };
    switch (V.pattern) {
      case 'check':
        for (const f of [0.28, 0.5, 0.72]) ring(hipY * f, 0.018, pc);
        for (const x of [-ww * 0.28, ww * 0.06, ww * 0.36]) vline(x, pc);
        sline(0, pc);
        ring(hipY * 0.39, 0.008, shade(botC, 1.18));
        break;
      case 'stripe':
        for (const x of [-ww * 0.34, -ww * 0.1, ww * 0.14, ww * 0.38]) vline(x, pc);
        sline(-TD * 0.2, pc); sline(TD * 0.2, pc);
        break;
      case 'acheik': {
        // the wavy acheik band low on the htamein: a band and a zigzag of small blocks above and below it
        const y = hipY * 0.3;
        ring(y, 0.03, pc);
        for (let k = -3; k <= 3; k++) {
          const dy = (k & 1 ? 1 : -1) * 0.032;
          add('hips', k * ww * 0.13, y + dy, TD / 2 + 0.004, ww * 0.1, 0.022, 0.006, pc, false);
          add('hips', k * ww * 0.13, y - dy, -TD / 2 - 0.004, ww * 0.1, 0.022, 0.006, pc, false);
        }
        ring(y + 0.075, 0.01, shade(pc, 1.25));
        break;
      }
      case 'border':
        ring(hem + 0.075, 0.07, pc);
        ring(hem + 0.125, 0.012, shade(botC, 1.2));
        break;
      case 'floral':
        for (let k = 0; k < 6; k++) {
          const x = (-0.4 + (k % 3) * 0.4) * ww * 0.9, y = hipY * (0.3 + Math.floor(k / 3) * 0.3) + (k % 2) * 0.03;
          add('hips', x, y, TD / 2 + 0.004, 0.03, 0.03, 0.006, pc, false);
          add('hips', -x, y + 0.02, -TD / 2 - 0.004, 0.03, 0.03, 0.006, pc, false);
        }
        break;
      default: break;
    }
    if (bottom === 'longyi' || bottom === 'schoolLongyi') add('hips', 0.0, hipY - 0.01, D * 0.55, 0.07, 0.06, 0.03, shade(botC, 0.82)); // the knot
    else add('hips', 0, hipY - 0.01, D * 0.53, ww, 0.025, 0.01, exC, false); // a waist band
  } else {
    add('hips', 0, hipY, 0, SW * 2, 0.08, D, botC);
  }

  // torso
  const tw = SW * 2;
  add('torso', 0, hipY + T / 2, 0, tw, T, D, topC);
  if (M.belly) add('torso', 0, hipY + T * 0.32, D * 0.5, tw * 0.8, T * 0.42, 0.04, topC);
  if (top === 'shirt' || top === 'school') {
    add('torso', -0.035, shoulderY - 0.012, D * 0.5, 0.05, 0.04, 0.02, shade(topC, 0.9)); // collar
    add('torso', 0.035, shoulderY - 0.012, D * 0.5, 0.05, 0.04, 0.02, shade(topC, 0.9));
    add('torso', 0, hipY + T * 0.5, D * 0.505, 0.012, T * 0.8, 0.008, shade(topC, 0.86), false); // placket
    if (top === 'shirt' && V.r() < 0.35) add('torso', SW * 0.5, hipY + T * 0.7, D * 0.505, 0.06, 0.05, 0.008, shade(topC, 0.88), false); // a pocket
  }
  if (top === 'eingyi') {
    add('torso', 0, hipY + T * 0.5, D * 0.505, 0.02, T * 0.9, 0.01, shade(topC, 0.88), false);
    for (let i = 0; i < 3; i++) add('torso', 0, hipY + T * (0.3 + i * 0.22), D * 0.52, 0.045, 0.014, 0.012, '#C9A24A', false); // knot buttons
  }
  if (top === 'blouse') {
    add('torso', 0, shoulderY - 0.02, D * 0.5, tw * 0.5, 0.03, 0.012, shade(topC, 0.88), false);
    add('torso', 0, hipY + 0.02, 0, tw + 0.02, 0.05, D + 0.02, shade(topC, 0.92));
  }
  if (top === 'tee' && V.r() < 0.4) add('torso', 0, hipY + T * 0.55, 0, tw + 0.008, 0.04, D + 0.008, V.patternColor, false); // a stripe across the tee
  if (top === 'vest') add('torso', 0, hipY + T * 0.55, 0, tw + 0.016, T * 0.8, D + 0.016, exC);
  if (top === 'apron' || extras.has('apron')) {
    add('torso', 0, hipY + T * 0.45, D * 0.52, tw * 0.78, T * 0.75, 0.016, CLOTH.white);
    add('hips', 0, hipY - L * 0.35, D * 0.6, tw * 0.82, L * 0.7, 0.016, CLOTH.white);
  }
  if (extras.has('towel')) add('torso', SW * 0.55, shoulderY - 0.01, 0, 0.09, 0.03, D * 1.1, CLOTH.white);
  if (extras.has('satchel')) {
    add('torso', -SW * 1.05, hipY + 0.05, 0.02, 0.05, 0.14, 0.15, exC);
    add('torso', 0, hipY + T * 0.55, D * 0.52, tw * 0.95, 0.02, 0.008, shade(exC, 0.8), false);
  }
  add('torso', 0, shoulderY + 0.015, 0, 0.1, 0.04, 0.09, skin, false); // neck

  // arms (pivot at the shoulder) with hands
  const armW = Math.max(0.07, SW * 0.5), A = M.arm;
  const longSleeve = spec.sleeves ? spec.sleeves === 'long' : (top === 'eingyi');
  for (const [bone, sx] of [['armL', 1], ['armR', -1]]) {
    const x = sx * (SW + armW / 2 + 0.004);
    const sleeve = longSleeve ? A * 0.86 : A * 0.42;
    const sleeveC = top === 'vest' ? skin : topC;
    add(bone, x, shoulderY - sleeve / 2 - 0.005, 0, armW + 0.012, sleeve, armW + 0.016, sleeveC);
    if (!longSleeve) add(bone, x, shoulderY - sleeve - (A - sleeve) / 2, 0, armW * 0.84, A - sleeve, armW * 0.84, skin);
    add(bone, x, shoulderY - A - 0.03, 0, armW * 0.9, 0.065, armW * 0.95, skin); // hand
  }
  if (extras.has('cane')) {
    // an elder's walking stick in the right hand, down to the ground
    const x = -(SW + armW / 2 + 0.004), y0 = shoulderY - A - 0.03;
    add('armR', x, y0 / 2, 0.06, 0.035, y0 + 0.02, 0.035, '#6B4A33');
    add('armR', x - 0.03, y0 + 0.02, 0.06, 0.09, 0.03, 0.035, '#6B4A33');
  }

  // head: its shape (round, long, square jaw, heart) and hair
  const [fwK, fhK] = HEADS[V.face] || HEADS.oval;
  const HW = H * fwK, HH = H * fhK, HD = H * 0.94 * (V.face === 'round' ? 1.03 : 1);
  const hc = headY + HH / 2;
  const fz = HD / 2;
  if (V.face === 'heart') {
    add('head', 0, hc + HH * 0.09, 0, HW, HH * 0.82, HD, skin);
    add('head', 0, hc - HH * 0.4, -0.01, HW * 0.76, HH * 0.2, HD * 0.92, skin); // the narrow chin
  } else {
    add('head', 0, hc, 0, HW, HH, HD, skin);
    if (V.face === 'square') add('head', 0, hc - HH * 0.36, -0.01, HW + 0.024, HH * 0.28, HD * 0.96, skin); // the jaw
    if (V.face === 'round') add('head', 0, hc - HH * 0.2, -0.01, HW + 0.03, HH * 0.4, HD * 0.9, skin); // full cheeks
  }
  const nose = V.nose === 'small' ? [0.024, 0.03, 0.016] : V.nose === 'broad' ? [0.046, 0.04, 0.024] : [0.03, 0.035, 0.02];
  add('head', 0, hc - 0.03, fz - 0.006, nose[0], nose[1], nose[2], shade(skin, 0.93), false); // nose
  const ear = V.ears === 'big' ? [0.03, 0.09, 0.065] : [0.02, 0.07, 0.05];
  add('head', HW / 2 + ear[0] * 0.4, hc - 0.02, 0, ear[0], ear[1], ear[2], shade(skin, 0.95)); // ears
  add('head', -HW / 2 - ear[0] * 0.4, hc - 0.02, 0, ear[0], ear[1], ear[2], shade(skin, 0.95));
  if (extras.has('thanaka')) {
    add('head', HW * 0.27, hc - HH * 0.13, fz + 0.002, HW * 0.2, HH * 0.17, 0.004, '#F1DFA6', false);
    add('head', -HW * 0.27, hc - HH * 0.13, fz + 0.002, HW * 0.2, HH * 0.17, 0.004, '#F1DFA6', false);
  }
  if (extras.has('beard')) add('head', 0, hc - HH * 0.42, fz - 0.03, HW * 0.5, HH * 0.18, 0.08, hairC);
  if (extras.has('moustache')) add('head', 0, hc - HH * 0.165, fz + 0.012, HW * (V.r() < 0.5 ? 0.3 : 0.4), 0.026, 0.012, hairC === HAIRS.white ? '#D9D3C8' : hairC, false);
  const top_ = hc + HH / 2;
  const hair = spec.hair || 'short';
  const back = (y0, depth = 0.05) => add('head', 0, (y0 + top_ + 0.02) / 2, -HD * 0.5 - depth / 2 + 0.03, HW + 0.03, top_ + 0.02 - y0, depth, hairC);
  const sides = (y0, k = 0.86) => {
    add('head', HW / 2 + 0.012, (y0 + top_) / 2, -0.02, 0.03, top_ - y0, HD * k, hairC);
    add('head', -HW / 2 - 0.012, (y0 + top_) / 2, -0.02, 0.03, top_ - y0, HD * k, hairC);
  };
  const cap = (h = 0.06) => add('head', 0, top_ + h / 2 - 0.01, -0.005, HW + 0.03, h, HD * 1.04, hairC);
  const fringe = (x, w, h, y = top_ - 0.035) => add('head', x, y, fz + 0.005, w, h, 0.03, hairC);
  switch (hair) {
    case 'short': cap(); back(hc - 0.02); fringe(HW * 0.12, HW * 0.7, 0.05); break;
    case 'crew': add('head', 0, top_ + 0.008, -0.005, HW + 0.012, 0.03, HD * 1.0, hairC); back(hc + 0.02, 0.03); fringe(0, HW * 0.9, 0.025, top_ - 0.02); break;
    case 'side': cap(0.07); back(hc - 0.02); fringe(HW * 0.18, HW * 0.66, 0.07, top_ - 0.04); fringe(-HW * 0.36, HW * 0.2, 0.03, top_ - 0.02); break;
    case 'parted': cap(0.07); back(hc - 0.03); fringe(HW * 0.26, HW * 0.44, 0.06, top_ - 0.04); fringe(-HW * 0.26, HW * 0.44, 0.06, top_ - 0.04); sides(hc + HH * 0.05, 0.6); break;
    case 'spiky': cap(0.05); back(hc); for (let i = 0; i < 4; i++) add('head', -HW * 0.36 + i * HW * 0.24, top_ + 0.05, 0, 0.07, 0.08, HD * 0.85, hairC); fringe(0, HW * 0.9, 0.04, top_ - 0.03); break;
    case 'curly':
      cap(0.07); back(hc - 0.05, 0.07); sides(hc - 0.02, 0.9);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) add('head', -HW * 0.4 + i * HW * 0.2, top_ + 0.06 + (i + j) % 2 * 0.02, -HD * 0.25 + j * HD * 0.4, 0.1, 0.08, 0.1, (i + j) % 2 ? hairC : shade(hairC, 1.25));
      fringe(0, HW + 0.03, 0.06, top_ - 0.035);
      break;
    case 'bob': cap(); back(hc - HH * 0.38, 0.06); sides(hc - HH * 0.3); fringe(0, HW + 0.03, 0.08, top_ - 0.045); break;
    case 'long': cap(); back(hc - HH * 0.95, 0.07); sides(hc - HH * 0.5); fringe(-HW * 0.1, HW * 0.85, 0.07, top_ - 0.04); break;
    case 'wavy':
      cap(); back(hc - HH * 0.85, 0.07); sides(hc - HH * 0.45);
      for (const sx of [1, -1]) for (let i = 0; i < 3; i++) add('head', sx * (HW / 2 + 0.03 + (i % 2) * 0.015), hc - HH * (0.15 + i * 0.22), -0.04, 0.035, 0.09, HD * 0.6, hairC);
      fringe(HW * 0.15, HW * 0.75, 0.07, top_ - 0.04);
      break;
    case 'pony':
      cap(); back(hc - 0.02); sides(hc + HH * 0.05, 0.7); fringe(0, HW + 0.03, 0.06, top_ - 0.04);
      add('head', 0, top_ - 0.04, -HD * 0.5 - 0.04, 0.08, 0.06, 0.06, exC); // the tie
      for (let i = 0; i < 3; i++) add('head', 0, top_ - 0.1 - i * 0.075, -HD * 0.5 - 0.06 - i * 0.012, 0.09 - i * 0.01, 0.08, 0.08, hairC);
      break;
    case 'braid': cap(); back(hc - HH * 0.2); sides(hc - HH * 0.15); fringe(0, HW + 0.03, 0.07, top_ - 0.045);
      for (let i = 0; i < 4; i++) add('head', HW * 0.4, hc - HH * 0.55 - i * 0.07, -HD * 0.16, 0.07, 0.07, 0.07, hairC);
      add('head', HW * 0.4, hc - HH * 0.55 - 4 * 0.07, -HD * 0.16, 0.08, 0.035, 0.08, exC); break;
    case 'bun': cap(0.05); back(hc - 0.05); sides(hc); add('head', 0, top_ + 0.07, -HD * 0.23, 0.17, 0.13, 0.15, hairC); fringe(0, HW + 0.02, 0.05, top_ - 0.03); break;
    case 'receding': back(hc - 0.04); sides(hc - 0.04); add('head', 0, top_ + 0.005, -HD * 0.22, HW + 0.02, 0.03, HD * 0.56, hairC); break;
    case 'bald': back(hc - 0.04); sides(hc - 0.04); add('head', 0, top_ - 0.005, -HD * 0.32, HW * 0.9, 0.02, HD * 0.32, shade(hairC, 0.92)); break;
    case 'cap': back(hc - 0.02); add('head', 0, top_ + 0.03, -0.01, HW + 0.04, 0.08, HD * 1.06, exC); add('head', 0, top_ - 0.005, fz + 0.07, HW * 0.8, 0.025, 0.16, shade(exC, 0.85)); break;
    default: cap(); back(hc);
  }
  if (extras.has('gaungbaung')) {
    add('hat', 0, top_ + 0.02, 0, HW + 0.06, 0.09, HD * 1.08, exC);
    add('hat', HW * 0.5 + 0.03, top_ + 0.03, 0.02, 0.07, 0.1, 0.09, shade(exC, 0.85)); // side knot
  }
  if (extras.has('flower')) add('head', -HW * 0.46, top_ - 0.05, -0.05, 0.08, 0.08, 0.08, CLOTH.padauk);
  if (extras.has('pencil')) add('head', HW * 0.5 + 0.02, hc + 0.02, 0.05, 0.02, 0.02, 0.16, CLOTH.mustard);
  // a rattan chinlone ball (on its own bone: it rides at the hip, and flies when they play)
  const chinlone = extras.has('chinlone');
  const ballRest = [SW + armW + 0.06, hipY + 0.02, 0.05];
  if (chinlone) {
    const [bx, by, bz] = ballRest;
    add('ball', bx, by, bz, 0.15, 0.15, 0.15, '#C9A24A');
    add('ball', bx, by, bz, 0.165, 0.04, 0.165, '#9C7A32', false);
    add('ball', bx, by, bz, 0.04, 0.165, 0.165, '#9C7A32', false);
  }
  const glasses = extras.has('glasses');
  const style = { eyes: V.eyes, eyeSet: V.eyeSet, mouth: V.mouth, mark: V.mark };

  return { parts, M, skin, hairC, topC, botC, exC, glasses, headY, H, HW, HH, hc, fz, shoulderY, hipY, SW, armW, A, top, hair, V, style, chinlone, legX, ballRest };
}
const UNIT = new THREE.BoxGeometry(1, 1, 1);
function buildGeometry(parts, outlineOnly) {
  const byBone = new Map();
  for (const p of parts) {
    if (outlineOnly && !p.outline) continue;
    let vb = byBone.get(p.bone);
    if (!vb) byBone.set(p.bone, (vb = new VoxelBuilder()));
    vb.box(p.x, p.y, p.z, p.w, p.h, p.d, p.color);
  }
  const geos = [];
  for (const [bone, vb] of byBone) {
    const g = vb.geometry();
    const n = g.attributes.position.count;
    const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { si[i * 4] = BI[bone]; sw[i * 4] = 1; }
    if (outlineOnly) { g.deleteAttribute('color'); g.deleteAttribute('normal'); }
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    geos.push(g);
  }
  let merged = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  if (outlineOnly) {
    const m = mergeVertices(merged, 1e-4);
    merged.dispose();
    merged = m;
    merged.computeVertexNormals();
  }
  merged.computeBoundingSphere();
  return merged;
}

// --------------------------------------------------------------------------------------------
// The person
// --------------------------------------------------------------------------------------------
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();

export function createPerson(spec = {}) {
  const B = buildParts(spec);
  const root = new THREE.Group();
  root.name = spec.name || 'person';
  const body = new THREE.Group();
  root.add(body);

  // bones
  const bones = {};
  const rest = {
    hips: [0, B.hipY, 0], torso: [0, 0, 0], head: [0, B.shoulderY + 0.03 - B.hipY, 0],
    armL: [B.SW + B.armW / 2, B.shoulderY - B.hipY - 0.01, 0], armR: [-(B.SW + B.armW / 2), B.shoulderY - B.hipY - 0.01, 0],
    legL: [B.SW * 0.48, 0, 0], legR: [-B.SW * 0.48, 0, 0], hat: [0, 0, 0], ball: [B.ballRest[0], B.ballRest[1] - B.hipY, B.ballRest[2]],
  };
  const parent = { hips: null, torso: 'hips', head: 'torso', armL: 'torso', armR: 'torso', legL: 'hips', legR: 'hips', hat: 'head', ball: 'hips' };
  const list = [];
  for (const name of BONES) {
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(...rest[name]);
    bones[name] = b;
    list.push(b);
    if (parent[name]) bones[parent[name]].add(b);
  }
  // glasses ride on the head bone inside the body mesh (no draw call of their own)
  if (B.glasses) {
    const gy = B.hc + B.HH * (B.V.glassesStyle === 'half' ? -0.02 : 0.04), gz = B.fz + 0.02, gc = B.V.glassesColor, st = B.V.glassesStyle;
    const add = (x, y, z, w, h, d) => B.parts.push({ bone: 'head', x, y, z, w, h, d, color: gc, outline: false });
    for (const sx of [1, -1]) {
      const cx = sx * B.HW * 0.21 * (B.V.eyeSet === 'wide' ? 1.05 : B.V.eyeSet === 'close' ? 0.95 : 1);
      if (st === 'half') {
        add(cx, gy - 0.035, gz, 0.13, 0.016, 0.012);
        add(cx + 0.058, gy - 0.012, gz, 0.016, 0.05, 0.012); add(cx - 0.058, gy - 0.012, gz, 0.016, 0.05, 0.012);
        add(cx, gy + 0.012, gz, 0.13, 0.008, 0.01);
      } else if (st === 'round') {
        add(cx, gy + 0.05, gz, 0.08, 0.016, 0.012); add(cx, gy - 0.05, gz, 0.08, 0.016, 0.012);
        add(cx + 0.058, gy, gz, 0.016, 0.06, 0.012); add(cx - 0.058, gy, gz, 0.016, 0.06, 0.012);
        for (const ax of [1, -1]) for (const ay of [1, -1]) add(cx + ax * 0.044, gy + ay * 0.038, gz, 0.022, 0.022, 0.012);
      } else {
        add(cx, gy + 0.05, gz, 0.13, 0.016, 0.012); add(cx, gy - 0.05, gz, 0.13, 0.016, 0.012);
        add(cx + 0.058, gy, gz, 0.016, 0.1, 0.012); add(cx - 0.058, gy, gz, 0.016, 0.1, 0.012);
      }
    }
    add(0, gy + 0.02, gz, 0.06, 0.014, 0.012);
  }
  const material = toon('#ffffff', { vertexColors: true, skinned: true });
  const bodyGeo = buildGeometry(B.parts, false);
  const outGeo = buildGeometry(B.parts, true);
  const mesh = new THREE.SkinnedMesh(bodyGeo, material);
  mesh.add(bones.hips);
  body.add(mesh);
  mesh.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(list);
  mesh.bind(skeleton);
  const oMat = outlineMat();
  const outline = new THREE.SkinnedMesh(outGeo, oMat);
  outline.userData.isOutline = true;
  outline.raycast = () => {};
  body.add(outline);
  outline.bind(skeleton, mesh.bindMatrix);
  outline.onBeforeRender = (renderer) => renderer.getDrawingBufferSize(OUTLINE.uniforms.uResolution.value);
  const sphere = new THREE.Sphere(new THREE.Vector3(0, 0.6, 0), 1.2);
  mesh.boundingSphere = sphere;
  outline.boundingSphere = sphere.clone();

  // face plane on the head bone (head-bone local coordinates)
  const atlas = acquireAtlas(B.style);
  const faceGeo = new THREE.BufferGeometry();
  const fw = B.HW * 0.44, fy0 = -0.03 + 0.0, hy = B.hc - (B.shoulderY + 0.03); // head centre above the neck pivot
  const y0 = hy - B.HH * 0.42, y1 = hy + B.HH * 0.32, z = B.fz + 0.006;
  faceGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-fw, y0, z, fw, y0, z, fw, y1, z, -fw, y1, z]), 3));
  faceGeo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]), 3));
  faceGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(8), 2));
  faceGeo.setIndex([0, 1, 2, 0, 2, 3]);
  void fy0;
  const face = new THREE.Mesh(faceGeo, atlas.material);
  bones.head.add(face);
  setFaceUV(faceGeo, 'smile');
  const shadow = blobShadow(0.32 * (B.SW / 0.16), 0.26 * (B.SW / 0.16), 0.45);
  shadow.position.y = 0.012;
  root.add(shadow);

  // ---------------- animation state
  const st = {
    phase: Math.random() * 6, speed: 0, t: Math.random() * 10, blinkT: 1 + Math.random() * 3, blinking: 0,
    face: 'smile', faceHold: 0, talkT: 0, mood: null, emote: null, emoteT: 0, emoteDur: 0, emoteDone: null,
    look: null, headYaw: 0, headPitch: 0, stoop: spec.age === 'elder' ? 0.14 + (B.V.height < 0.98 ? 0.04 : 0) : 0,
  };
  let shownFace = '';
  function showFace(name) { if (name !== shownFace) { shownFace = name; setFaceUV(faceGeo, name); } }

  const EMOTE_DUR = { wave: 1.6, nod: 0.9, bow: 1.4, cheer: 1.3, shrug: 1.1, think: 2.0, slump: 1.6, fists: 1.0, point: 1.4 };

  function update(dt, opts = {}) {
    st.t += dt;
    const speed = opts.speed ?? 0;
    st.speed = damp(st.speed, speed, 10, dt);
    const walk = clamp(st.speed / 1.4, 0, 1);
    st.phase += dt * (3.2 + st.speed * 4.2);
    const s = Math.sin(st.phase), c = Math.cos(st.phase);

    // base pose
    let hipsY = B.hipY + Math.abs(c) * 0.025 * walk + Math.sin(st.t * 2.1) * 0.004 * (1 - walk);
    let torsoX = st.stoop + walk * 0.06, torsoZ = s * 0.03 * walk;
    let headX = -st.stoop * 0.6 + Math.sin(st.t * 0.9) * 0.02, headY = 0, headZ = 0;
    let aLx = -s * 0.7 * walk, aRx = s * 0.7 * walk, aLz = 0.06, aRz = -0.06;
    let lLx = s * 0.75 * walk, lRx = -s * 0.75 * walk;
    // held moods
    if (st.mood === 'hot') { aLz = 0.22; aRz = -0.22; aLx = -0.15; aRx = -0.15; torsoX += 0.05; headX += 0.08 + Math.sin(st.t * 24) * 0.012; }
    if (st.mood === 'down') { torsoX += 0.16; headX += 0.28; aLz = 0.02; aRz = -0.02; hipsY -= 0.01; }
    // jobs (held while working): hands busy in front, sweeping, reading a letter, playing with a windmill
    if (st.mood === 'work') { const w = Math.sin(st.t * 6.5); aLx = -1.0 + w * 0.18; aRx = -1.0 - w * 0.18; aLz = -0.15; aRz = 0.15; torsoX += 0.12; headX += 0.22; }
    if (st.mood === 'sweep') { const w = Math.sin(st.t * 3.2); aLx = -0.7; aRx = -0.9; aLz = -0.35 + w * 0.35; aRz = 0.05 + w * 0.35; torsoX += 0.15; torsoZ += w * 0.06; headX += 0.15; }
    if (st.mood === 'read') { aLx = -1.25; aRx = -1.25; aLz = -0.32; aRz = 0.32; headX += 0.3 + Math.sin(st.t * 0.7) * 0.04; }
    if (st.mood === 'play') { aRx = -2.4 + Math.sin(st.t * 2) * 0.15; aRz = -0.1; headX -= 0.12; headZ += Math.sin(st.t * 1.3) * 0.08; hipsY += Math.abs(Math.sin(st.t * 3)) * 0.012; }
    if (st.mood === 'shy') { headX += 0.12; aLx = -0.35; aRx = -0.35; aLz = -0.25; aRz = 0.25; }
    // chinlone: keep the rattan ball up with the inside of the foot, arms out for balance, eyes on the ball
    let ballUp = -1;
    if (st.mood === 'kick') {
      const u = (st.t / 0.95) % 1, kickFoot = Math.floor(st.t / 0.95) % 3 === 2 ? 1 : -1; // mostly the right foot
      const k = u < 0.12 ? Math.sin((u / 0.12) * Math.PI) : 0;
      if (kickFoot < 0) { lRx = -0.95 * k; } else { lLx = -0.95 * k; }
      aLz = 0.55; aRz = -0.55; aLx = -0.2; aRx = -0.2;
      ballUp = 4 * u * (1 - u);
      headX += 0.25 - ballUp * 0.45;
      hipsY += k * 0.02;
      st.kickFoot = kickFoot;
    }
    // talking gestures
    if (st.talkT > 0) {
      st.talkT -= dt;
      aRx += -0.35 - Math.sin(st.t * 5.3) * 0.25;
      aRz += -0.1;
      headZ += Math.sin(st.t * 3.1) * 0.05;
    }
    // emotes
    if (st.emote) {
      st.emoteT += dt;
      const u = st.emoteT / st.emoteDur;
      const w = win(st.emoteT, 0, st.emoteDur, 0.22);
      switch (st.emote) {
        case 'wave': aRz = -0.06 - w * 2.5 + Math.sin(st.emoteT * 14) * 0.25 * w; aRx = -w * 0.2; headZ += w * 0.08; break;
        case 'nod': headX += Math.sin(u * Math.PI * 4) * 0.22 * w; break;
        case 'bow': torsoX += w * 0.55; headX += w * 0.2; aLx = aRx = w * 0.15; break;
        case 'cheer': aLz = 0.06 + w * 2.6; aRz = -0.06 - w * 2.6; hipsY += Math.abs(Math.sin(u * Math.PI * 3)) * 0.06 * w; break;
        case 'shrug': aLz += w * 0.5; aRz -= w * 0.5; aLx = aRx = -w * 0.6; headZ += w * 0.12; hipsY += w * 0.015; break;
        case 'think': aRx = -w * 2.2; aRz = -0.06 + w * 0.55; headX -= w * 0.08; headZ += w * 0.1; break;
        case 'slump': torsoX += w * 0.25; headX += w * 0.35; hipsY -= w * 0.02; break;
        case 'fists': aLx = aRx = -w * 1.0; aLz += w * 0.25; aRz -= w * 0.25; hipsY += Math.abs(Math.sin(u * Math.PI * 4)) * 0.02 * w; break;
        case 'point': aRx = -w * 1.45; aRz = -0.06 - w * 0.2; break;
        default: break;
      }
      if (st.emoteT >= st.emoteDur) { const done = st.emoteDone; st.emote = null; st.emoteDone = null; done?.(); }
    }
    // look at a world point (head yaw/pitch, clamped)
    let ly = 0, lp = 0;
    if (st.look) {
      root.updateMatrixWorld();
      _v.copy(st.look);
      root.worldToLocal(_v);
      _v.y -= B.hc;
      ly = clamp(Math.atan2(_v.x, Math.max(0.05, _v.z)), -0.9, 0.9);
      lp = clamp(-Math.atan2(_v.y, Math.hypot(_v.x, _v.z)), -0.4, 0.4);
    }
    st.headYaw = damp(st.headYaw, ly, 6, dt);
    st.headPitch = damp(st.headPitch, lp, 6, dt);

    bones.hips.position.y = hipsY;
    bones.torso.rotation.set(torsoX, 0, torsoZ);
    bones.head.rotation.set(headX + st.headPitch, headY + st.headYaw, headZ);
    bones.armL.rotation.set(aLx, 0, aLz);
    bones.armR.rotation.set(aRx, 0, aRz);
    bones.legL.rotation.set(lLx, 0, 0);
    bones.legR.rotation.set(lRx, 0, 0);
    if (B.chinlone) {
      // the ball: at the hip when carried; in the air over the kicking foot when playing
      if (ballUp >= 0) bones.ball.position.set(st.kickFoot * B.legX * 1.2, B.M.leg * 0.45 + ballUp * 0.85 - hipsY + 0.05, 0.28);
      else bones.ball.position.set(B.ballRest[0], B.ballRest[1] - B.hipY, B.ballRest[2]);
      bones.ball.rotation.set(st.t * 3, st.t * 2, 0);
    }

    // face: hold > talk > mood > blink
    if (st.faceHold > 0) st.faceHold -= dt;
    st.blinkT -= dt;
    if (st.blinkT <= 0) { st.blinking = 0.12; st.blinkT = 2 + Math.random() * 3.5; }
    if (st.blinking > 0) st.blinking -= dt;
    let f = st.face;
    if (st.talkT > 0 && (f === 'smile' || f === 'talk' || f === 'happy')) f = Math.sin(st.t * 22) > 0 ? 'talk' : 'smile';
    else if (st.blinking > 0 && (f === 'smile' || f === 'talk')) f = 'blink';
    showFace(f);
  }

  const api = {
    root,
    spec,
    bones,
    update,
    setFace(name, hold = 0) { st.face = FACES.includes(name) ? name : 'smile'; st.faceHold = hold; },
    talk(seconds = 1.5) { st.talkT = seconds; },
    setMood(m) { st.mood = m || null; },
    emote(name) {
      if (!EMOTE_DUR[name]) return Promise.resolve();
      st.emoteDone?.();
      st.emote = name; st.emoteT = 0; st.emoteDur = EMOTE_DUR[name];
      return new Promise((r) => { st.emoteDone = r; });
    },
    lookAt(p) { if (p) { st.look = st.look || new THREE.Vector3(); st.look.copy(p); } else st.look = null; },
    headTop(target = new THREE.Vector3()) {
      root.updateMatrixWorld();
      return target.set(0, B.hc + B.HH / 2 + 0.12, 0).applyMatrix4(root.matrixWorld);
    },
    height: B.hc + B.HH / 2,
    radius: Math.max(0.24, B.SW * 1.5),
    portrait(faceName = 'smile') { return drawPortrait(B, spec, faceName); },
    /** The person's own meshes, read-only, for a crowd that draws many people as one mesh (day15-launch.js
     *  crowdBatch): it takes them off the camera's layer and skins a merged copy with the same bones. */
    parts: { mesh, outline, face, shadow, skeleton },
    dispose() {
      bodyGeo.dispose(); outGeo.dispose(); faceGeo.dispose(); skeleton.dispose();
      shadow.geometry?.dispose?.();
      releaseAtlas(atlas);
      if (--OUTLINE.refs <= 0) { OUTLINE.mat.dispose(); OUTLINE.mat = null; }
    },
  };
  void _q;
  return api;
}

// --------------------------------------------------------------------------------------------
// 2D portrait for the talk screen: head and shoulders from the front
// --------------------------------------------------------------------------------------------
function drawPortrait(B, spec, faceName) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const k = 128 / (B.H * 1.7);
  const cx = 64, hs = B.HW * k, hv = B.HH * k, headTop = 22 + (B.H * k - hv) / 2;
  const ol = PALETTE.outline;
  g.lineJoin = 'round';
  const box = (x, y, w, h, fill) => { g.fillStyle = fill; g.fillRect(x, y, w, h); g.strokeStyle = ol; g.lineWidth = 3; g.strokeRect(x, y, w, h); };
  const ex = spec.extras || [];
  // shoulders
  box(cx - B.SW * k * 1.35, headTop + hv + 4, B.SW * 2.7 * k, 60, B.top === 'vest' ? B.exC : B.topC);
  // head (its shape: a jaw, full cheeks or a narrow chin)
  const face = B.V.face;
  if (face === 'heart') { box(cx - hs * 0.38, headTop + hv * 0.8, hs * 0.76, hv * 0.22, B.skin); box(cx - hs / 2, headTop, hs, hv * 0.84, B.skin); }
  else {
    if (face === 'square') box(cx - hs / 2 - 2, headTop + hv * 0.62, hs + 4, hv * 0.36, B.skin);
    if (face === 'round') box(cx - hs / 2 - 3, headTop + hv * 0.45, hs + 6, hv * 0.44, B.skin);
    box(cx - hs / 2, headTop, hs, hv, B.skin);
    if (face === 'square' || face === 'round') { g.fillStyle = B.skin; g.fillRect(cx - hs / 2 + 1.5, headTop + hv * 0.4, hs - 3, hv * 0.56); }
  }
  // hair (simplified by style)
  g.fillStyle = B.hairC;
  const h = B.hair;
  if (h === 'cap') { box(cx - hs / 2 - 3, headTop - 12, hs + 6, 16, B.exC); }
  else if (h === 'receding') { g.fillRect(cx - hs / 2 - 3, headTop + 4, 6, hv * 0.55); g.fillRect(cx + hs / 2 - 3, headTop + 4, 6, hv * 0.55); g.fillRect(cx - hs * 0.3, headTop - 3, hs * 0.6, 5); }
  else if (h !== 'bald') {
    g.fillRect(cx - hs / 2 - 3, headTop - (h === 'crew' ? 3 : 8), hs + 6, h === 'crew' ? 8 : 18);
    if (['bob', 'long', 'braid', 'wavy'].includes(h)) { const L = hv * (h === 'long' || h === 'wavy' ? 1.05 : 0.7); g.fillRect(cx - hs / 2 - 6, headTop, 8, L); g.fillRect(cx + hs / 2 - 2, headTop, 8, L); }
    if (h === 'bun') g.fillRect(cx - 12, headTop - 22, 24, 16);
    if (h === 'pony') { g.fillRect(cx + hs / 2 - 2, headTop + 4, 9, hv * 0.8); }
    if (h === 'spiky') for (let i = 0; i < 4; i++) g.fillRect(cx - hs / 2 + 4 + i * hs / 4, headTop - 18, 9, 12);
    if (h === 'curly') for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(cx - hs / 2 + 2 + i * hs / 4, headTop - 6, 8, 0, 7); g.fill(); }
    if (h === 'parted') { g.fillStyle = B.skin; g.fillRect(cx - 1.5, headTop - 4, 3, 12); }
  } else { g.fillRect(cx - hs / 2 - 3, headTop + 6, 6, hv * 0.5); g.fillRect(cx + hs / 2 - 3, headTop + 6, 6, hv * 0.5); }
  if (ex.includes('gaungbaung')) box(cx - hs / 2 - 4, headTop - 12, hs + 8, 16, B.exC);
  if (ex.includes('thanaka')) { g.fillStyle = '#F1DFA6'; g.fillRect(cx - hs * 0.37, headTop + hv * 0.56, hs * 0.2, hv * 0.16); g.fillRect(cx + hs * 0.17, headTop + hv * 0.56, hs * 0.2, hv * 0.16); }
  // the face: drawn in the person's own style (no atlas needed)
  const fw = hs * 0.88;
  g.save();
  g.translate(cx - fw / 2, headTop + hv * 0.06);
  g.scale(fw / CELL, (fw * 0.86 * (hv / hs)) / CELL);
  drawFace(g, FACES.includes(faceName) ? faceName : 'smile', B.style);
  g.restore();
  if (B.V.moustache || ex.includes('moustache')) { g.fillStyle = B.hairC; g.fillRect(cx - hs * 0.16, headTop + hv * 0.7, hs * 0.32, 4); }
  if (ex.includes('beard')) { g.fillStyle = B.hairC; g.fillRect(cx - hs * 0.25, headTop + hv * 0.86, hs * 0.5, hv * 0.16); }
  if (B.glasses) {
    g.strokeStyle = B.V.glassesColor; g.lineWidth = 3;
    const y = headTop + hv * (B.V.glassesStyle === 'half' ? 0.47 : 0.4), gh = hv * (B.V.glassesStyle === 'half' ? 0.13 : 0.2);
    for (const x0 of [cx - hs * 0.36, cx + hs * 0.08]) {
      if (B.V.glassesStyle === 'round') { g.beginPath(); g.roundRect(x0, y, hs * 0.28, gh, 6); g.stroke(); } else g.strokeRect(x0, y, hs * 0.28, gh);
    }
  }
  return cv;
}
