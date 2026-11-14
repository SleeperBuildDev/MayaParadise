// Day 15 helpers for the launch evening (day15.js): where everyone stands round the fountain, which light
// each one carries, the Footnote-Star that hops from light to light, the notebook margin of stamps over
// the names, the paper-white the plane flies into, and the credits. No markers: nothing here points
// anywhere; the gap in the arc and the lit, empty fountain step are simply there to be seen.
import * as THREE from '../game/three.js';
import { tr, lang } from '../game/ui.js';
import { FOUNTAIN } from '../game/world/world.js';
import { castById, CAST } from './cast.js';
import { myNum } from './api.js';

export const F = FOUNTAIN; // (0, 13.9)

// ---- the arc: the north half of the forecourt round the fountain, everyone facing south (to the camera)
const R1 = 2.75, R2 = 3.45;
const ang = (i, n, a0, a1) => ((a0 + ((a1 - a0) * i) / (n - 1)) * Math.PI) / 180;
const at = (r, a) => ({ x: +(F.x + Math.cos(a) * r).toFixed(2), z: +(F.z - Math.sin(a) * r).toFixed(2), h: +(-Math.cos(a) * 0.35).toFixed(3) });
// front row, east -> west; the GAP (between Toe Toe and Nay Chi) stays empty for Maya's light
export const FRONT = ['kothiha', 'thiri', 'kolwin', 'khwarnyo', 'kophyo', 'wintwar', 'ukyaw', 'dawohn', 'toetoe', null, 'naychi', 'phothar', 'hninwai'];
export const BACK = ['ubolay', 'pyaesone', 'kyinyein', 'kowunna', 'sunwe', 'maungnge', 'khinmay', 'maungarkar', 'eimon', 'hpohtaw', 'micho', 'yeyint'];
/** Dropped on the low quality tier (they are named on the page, so a page without them simply has no hop). */
export const LOW_DROP = ['pyaesone', 'kyinyein', 'yeyint'];
export const MARKS = {};
FRONT.forEach((id, i) => { MARKS[id || 'gap'] = at(R1, ang(i, FRONT.length, 20, 160)); });
// the back row leaves the same gap open behind it (a lane from the gap back to the dark), so from the camera
// the gap reads as a gap and not as a face in the second row
{
  const gapA = 20 + (140 * FRONT.indexOf(null)) / (FRONT.length - 1), half = 9;
  const segs = [[26, gapA - half], [gapA + half, 154]];
  const total = segs.reduce((n, [a, b]) => n + (b - a), 0);
  BACK.forEach((id, i) => {
    let u = (total * i) / (BACK.length - 1), deg = segs[1][1];
    for (const [a, b] of segs) { if (u <= b - a + 1e-6) { deg = a + u; break; } u -= b - a; }
    MARKS[id] = at(R2, (deg * Math.PI) / 180);
  });
}
/** The fountain's front step, the "middle": empty and well lit. */
export const MIDDLE = { x: F.x, z: F.z + 2.4 };
/** Where Maya stands in the crowd (beside Pho Thar) and where she reads the names (beside, not on, the step). */
export const CROWD = { x: -3.05, z: 13.35, h: Math.PI / 2 };
export const READ = { x: 1.15, z: 16.5, h: Math.PI };
/** The district people walk up the ribbon road from the east. */
export const WALKERS = ['kothiha', 'ubolay', 'kyinyein', 'pyaesone', 'yeyint', 'maungnge'];
export const RIBBON_IN = (i) => ({ x: 5.35 - (i % 2) * 0.6, z: 16.5 + i * 0.9, h: Math.PI });
/** The people who drift into the Café after the plane (8.10). */
export const CAFE_AFTER = ['kophyo', 'maungnge', 'eimon', 'sunwe', 'khinmay', 'maungarkar'];

// ---- the lights, each made from its owner's own road (8.1)
export const LIGHTS = {
  phothar: { kind: 'windmillLamp' }, toetoe: { kind: 'beanJar' }, dawohn: { kind: 'clayLamp', count: 2 }, micho: { kind: 'clayLamp', count: 2 },
  kothiha: { kind: 'raftLamp' }, thiri: { kind: 'kiteLamp' }, kophyo: { kind: 'teapotLamp' }, kolwin: { kind: 'blockLamp' }, khwarnyo: { kind: 'blockLamp' },
  kowunna: { kind: 'typeLamp' }, khinmay: { kind: 'emberTin' }, maungarkar: { kind: 'emberTin' }, eimon: { kind: 'weaveLamp' }, hpohtaw: { kind: 'vineLamp' },
  naychi: { kind: 'plain', word: 'ကိုယ့်စကား', color: '#F4E6C4' },
  // (the unwritten paper lanterns are the one-mesh paperLamp: 2 draw calls each instead of 4-5; Nay Chi's keeps
  // its written line, so it stays a full paperLantern)
  wintwar: { kind: 'paperLamp', color: '#F2C9C9' }, ukyaw: { kind: 'paperLamp', color: '#CFE3DF' }, hninwai: { kind: 'paperLamp', color: '#DCEBC8' },
  sunwe: { kind: 'paperLamp', color: '#D9E4F2' }, maungnge: { kind: 'paperLamp', color: '#F3DDB3' }, yeyint: { kind: 'paperLamp', color: '#E9D7F0' },
  kyinyein: { kind: 'paperLamp', color: '#EFE2C8' }, pyaesone: { kind: 'paperLamp', color: '#D6E8E4' }, ubolay: { kind: 'paperLamp', color: '#E8D9BE' },
};

// ---- the Footnote-Star: a small drawn star sprite that hops from light to light
export function starSprite() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const halo = g.createRadialGradient(64, 64, 6, 64, 64, 62);
  halo.addColorStop(0, 'rgba(255,230,150,.9)'); halo.addColorStop(1, 'rgba(255,230,150,0)');
  g.fillStyle = halo; g.fillRect(0, 0, 128, 128);
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 17 : 40, a = -Math.PI / 2 + (i * Math.PI) / 5;
    g[i ? 'lineTo' : 'moveTo'](64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
  }
  g.closePath();
  g.fillStyle = '#F7EEC8'; g.fill();
  g.lineWidth = 5; g.strokeStyle = '#C9A24A'; g.stroke();
  g.fillStyle = '#C9A24A'; g.beginPath(); g.arc(64, 62, 6, 0, Math.PI * 2); g.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  s.scale.set(0.34, 0.34, 1);
  s.renderOrder = 6;
  s.visible = false;
  let from = null, to = null, t = 1, dur = 0.45;
  return {
    sprite: s,
    /** Hop to a world point (an arc through the air). */
    hop(p) { from = s.visible ? s.position.clone() : p.clone().add(new THREE.Vector3(0, 1.4, 0)); to = p.clone(); t = 0; s.visible = true; },
    update(dt, time) {
      if (!s.visible) return;
      if (t < 1 && from && to) {
        t = Math.min(1, t + dt / dur);
        s.position.lerpVectors(from, to, t);
        s.position.y += Math.sin(Math.PI * t) * 0.55;
      } else if (to) s.position.set(to.x, to.y + Math.sin(time * 3) * 0.03, to.z);
      s.material.rotation = Math.sin(time * 2) * 0.2;
    },
    hide() { s.visible = false; from = to = null; },
    dispose() { s.removeFromParent(); tex.dispose(); s.material.dispose(); },
  };
}

// ---- overlays (HTML): the margin of 23 stamps, the paper-white, the credits
function injectStyle() {
  if (document.getElementById('rc-d15-style')) return;
  const s = document.createElement('style');
  s.id = 'rc-d15-style';
  s.textContent = `
  .d15-margin { position: absolute; left: 50%; top: calc(12px + env(safe-area-inset-top)); transform: translateX(-50%); z-index: 41; display: flex; flex-wrap: wrap;
    justify-content: center; gap: 4px; width: min(94vw, 420px); padding: 8px 10px; border-radius: 14px; background: rgba(251,247,236,.9); border: 2px solid #E2D5B8;
    box-shadow: 0 6px 16px rgba(42,33,24,.18); pointer-events: none; animation: d15in .4s ease; }
  .d15-margin i { width: 24px; height: 24px; border-radius: 50%; border: 1.5px dashed #CDBE9C; font: 600 10.5px/21px "Noto Sans Myanmar", system-ui; color: #B9A983;
    font-style: normal; text-align: center; transition: all .35s; }
  .d15-margin i.on { border: 2px solid #A47A2C; color: #6E1F2A; background: #F7E7B8; box-shadow: 0 0 10px rgba(201,162,74,.8); transform: rotate(-8deg) scale(1.08); }
  .d15-margin i.pencil { border: 1.5px solid #8A847C; color: #8A847C; }
  .d15-white { position: absolute; inset: 0; z-index: 43; background: #FBF7EC; opacity: 0; pointer-events: none; transition: opacity .9s ease; }
  .d15-white.on { opacity: 1; }
  .d15-credits { position: absolute; inset: 0; z-index: 49; background: #F6F0E2; overflow: auto; text-align: center; padding: 48px 18px 90px;
    font: 15px/1.9 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; animation: d15in .6s ease; }
  .d15-credits h3 { margin: 18px 0 6px; color: #6E1F2A; font-size: 17px; } .d15-credits .names { columns: 2; column-gap: 18px; max-width: 360px; margin: 0 auto; }
  .d15-credits .names span { display: block; break-inside: avoid; } .d15-credits .names small { color: #8C6A28; margin-left: 4px; }
  .d15-credits p.inv { margin-top: 26px; color: #8C6A28; }
  .d15-credits button { margin-top: 22px; font: 700 15px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; padding: 9px 22px; border-radius: 999px; border: 2px solid #A47A2C;
    background: #FFFDF8; color: #6E1F2A; }
  @keyframes d15in { from { opacity: 0; } }
  `;
  document.head.appendChild(s);
}
const root = () => document.getElementById('game') || document.body;

/** The notebook's margin, 23 stamps; fill(n) inks page n gold (pencil if it is not finished). */
export function marginStrip(save) {
  injectStyle();
  const el = document.createElement('div');
  el.className = 'd15-margin';
  for (let i = 1; i <= 23; i++) {
    const d = document.createElement('i');
    d.textContent = lang() === 'en' ? String(i) : myNum(i);
    el.appendChild(d);
  }
  root().appendChild(el);
  return {
    fill(n, ok = true) { const d = el.children[n - 1]; if (d) d.className = ok ? 'on' : 'pencil'; },
    all() { for (let i = 1; i <= 23; i++) this.fill(i, (save.stamps || []).includes(i)); },
    remove() { el.remove(); },
  };
}

export function paperWhite() {
  injectStyle();
  const el = document.createElement('div');
  el.className = 'd15-white';
  root().appendChild(el);
  return {
    on() { requestAnimationFrame(() => el.classList.add('on')); return new Promise((r) => setTimeout(r, 950)); },
    off() { el.classList.remove('on'); return new Promise((r) => setTimeout(() => { el.remove(); r(); }, 950)); },
    remove() { el.remove(); },
  };
}

/** Static credits (10.1): every cast name (Burmese first), the book, "everyone is invented". Tap to close. */
export function credits(lines, close) {
  injectStyle();
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'd15-credits';
    const en = lang() === 'en';
    const names = CAST.map((c) => `<span>${c.name.my}${en ? `<small>${c.name.en}</small>` : ''}</span>`).join('');
    el.innerHTML = `<h3></h3><div class="names">${names}</div><h3></h3><p class="inv"></p><button type="button"></button>`;
    const hs = el.querySelectorAll('h3');
    hs[0].textContent = tr(lines[0]);
    hs[1].textContent = tr(lines[1]);
    el.querySelector('.inv').textContent = tr(lines[2]);
    el.querySelector('button').textContent = tr(close);
    el.querySelector('button').addEventListener('click', (ev) => { ev.stopPropagation(); el.remove(); resolve(); });
    root().appendChild(el);
  });
}

export const nameOf = (id) => castById(id)?.name || { my: id, en: id };

// ---- the crowd as one mesh (phone budget: 25 people + 25 lights were ~95 draw calls at dusk)
// Every person keeps their own bones and every light its own objects (they still walk, talk, blink, turn, lean
// in the plane's wake and glow one by one); only the DRAWING is shared: one skinned mesh whose "skeleton" is
// all the people's bones plus each light part and face plane as a rigid "bone", so it moves exactly as the
// originals would. Bodies, faces and lights share one toon material (the lights' glow per light from a uniform
// array, the same formula as props6's glow material; the faces from one atlas made of everyone's face sheets,
// the bodies and lights reading a white patch of it), and the front row's ink outline is one more mesh. The
// originals go off the camera's layer (as merge-static.js does); their own visible flags are never touched, so
// whatever a day script hides stays hidden.
const OFF = 30, MAXL = 48;
const SLOT_W = 256, SLOT_H = 192, SLOT_COLS = 4, SLOT_ROWS = 8; // face sheets at half size in 1024 x 1536
const WHITE = SLOT_COLS * SLOT_ROWS - 1; // the last slot is plain white (what bodies and lights read: one texel, no mip blur)
const I4 = new THREE.Matrix4();
const shown = (o, top) => { for (let p = o; p; p = p.parent) { if (!p.visible) return false; if (p === top) return true; } return !top; };
export function crowdBatch(scene) {
  const group = new THREE.Group();
  group.name = 'd15-crowd';
  scene.add(group);
  const glows = new Float32Array(MAXL), tints = new Float32Array(MAXL * 3);
  const uni = { uGlows: { value: glows }, uTints: { value: tints } };
  let bodyMat = null, atlasCv = null, atlasTex = null;
  const slots = new Map(); // face sheet (material uuid) -> slot
  let meshes = [], off = [], watch = [], lit = [], faceSync = [], faceUv = null, sig = '';
  function atlas() {
    if (atlasCv) return;
    atlasCv = document.createElement('canvas');
    atlasCv.width = SLOT_W * SLOT_COLS; atlasCv.height = SLOT_H * SLOT_ROWS;
    const g = atlasCv.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect((WHITE % SLOT_COLS) * SLOT_W, Math.floor(WHITE / SLOT_COLS) * SLOT_H, SLOT_W, SLOT_H);
    atlasTex = new THREE.CanvasTexture(atlasCv);
    atlasTex.colorSpace = THREE.SRGBColorSpace; atlasTex.anisotropy = 4;
  }
  function glowMat(src) {
    atlas();
    // (the face sheets' own settings: a toon map with alphaTest 0.5, not see-through)
    const m = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: src.gradientMap, vertexColors: true, map: atlasTex, alphaTest: 0.5 });
    m.onBeforeCompile = (s) => {
      s.uniforms.uGlows = uni.uGlows; s.uniforms.uTints = uni.uTints;
      s.vertexShader = s.vertexShader.replace('void main() {', `attribute float aGlow;\nattribute float aLit;\nuniform float uGlows[${MAXL}];\nuniform vec3 uTints[${MAXL}];\nvarying float vGlowF;\nvarying float vGlowU;\nvarying vec3 vTintC;\nvoid main() {\n  int li = int(aLit + 0.5);\n  vGlowF = aGlow;\n  vGlowU = uGlows[li];\n  vTintC = uTints[li];`);
      s.fragmentShader = s.fragmentShader
        .replace('void main() {', 'varying float vGlowF;\nvarying float vGlowU;\nvarying vec3 vTintC;\nvoid main() {')
        .replace('#include <opaque_fragment>', `{
          vec3 lit = mix(vColor.rgb, vec3(1.0), 0.35) * vTintC * (0.75 + 1.25 * vGlowU);
          outgoingLight = mix(outgoingLight, lit, clamp(vGlowF * vGlowU * 1.6, 0.0, 1.0));
        }
        #include <opaque_fragment>`);
    };
    m.customProgramCacheKey = () => 'd15-crowd-glow';
    return m;
  }
  function slotOf(mat) {
    if (slots.has(mat.uuid)) return slots.get(mat.uuid);
    const img = mat.map?.image;
    if (!img || slots.size >= WHITE) return -1;
    atlas();
    const k = slots.size;
    atlasCv.getContext('2d').drawImage(img, (k % SLOT_COLS) * SLOT_W, Math.floor(k / SLOT_COLS) * SLOT_H, SLOT_W, SLOT_H);
    atlasTex.needsUpdate = true;
    slots.set(mat.uuid, k);
    return k;
  }
  const mapU = (k, u) => ((k % SLOT_COLS) + u) / SLOT_COLS;
  const mapV = (k, v) => 1 - (Math.floor(k / SLOT_COLS) + (1 - v)) / SLOT_ROWS;
  // parts: [{ geo, bone (rigid) | bones offset, bind, li, uvSlot }] -> one indexed geometry
  function mergeParts(parts, { color = true, uv = false } = {}) {
    let nv = 0, ni = 0;
    for (const p of parts) { nv += p.geo.attributes.position.count; ni += p.geo.index ? p.geo.index.count : p.geo.attributes.position.count; }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = color ? new Float32Array(nv * 3) : null, uvs = uv ? new Float32Array(nv * 2) : null;
    const si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4), gl = color ? new Float32Array(nv) : null, li = color ? new Float32Array(nv) : null;
    const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    const v = new THREE.Vector3(), nm = new THREE.Matrix3();
    let ov = 0, oi = 0;
    for (const p of parts) {
      const g = p.geo, P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color, G = g.attributes.aGlow, U = g.attributes.uv;
      const SI = g.attributes.skinIndex, SW = g.attributes.skinWeight;
      const bind = p.bind || I4;
      nm.getNormalMatrix(bind);
      for (let i = 0; i < P.count; i++) {
        const j = ov + i;
        v.fromBufferAttribute(P, i).applyMatrix4(bind); pos[j * 3] = v.x; pos[j * 3 + 1] = v.y; pos[j * 3 + 2] = v.z;
        if (N) { v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[j * 3] = v.x; nor[j * 3 + 1] = v.y; nor[j * 3 + 2] = v.z; }
        if (col) { if (C) { col[j * 3] = C.getX(i); col[j * 3 + 1] = C.getY(i); col[j * 3 + 2] = C.getZ(i); } else col[j * 3] = col[j * 3 + 1] = col[j * 3 + 2] = 1; }
        if (gl) { gl[j] = G ? G.getX(i) : 0; li[j] = p.li || 0; }
        if (uvs) { if (U && p.uvSlot != null) { uvs[j * 2] = mapU(p.uvSlot, U.getX(i)); uvs[j * 2 + 1] = mapV(p.uvSlot, U.getY(i)); } else { uvs[j * 2] = mapU(WHITE, 0.5); uvs[j * 2 + 1] = mapV(WHITE, 0.5); } }
        if (p.rigid != null) { si[j * 4] = p.rigid; sw[j * 4] = 1; }
        else for (let k = 0; k < 4; k++) { si[j * 4 + k] = SI.getComponent(i, k) + p.boneOff; sw[j * 4 + k] = SW.getComponent(i, k); }
      }
      if (g.index) for (let i = 0; i < g.index.count; i++) idx[oi + i] = g.index.getX(i) + ov;
      else for (let i = 0; i < P.count; i++) idx[oi + i] = i + ov;
      p.vStart = ov;
      ov += P.count; oi += g.index ? g.index.count : P.count;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    if (col) { geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('aGlow', new THREE.BufferAttribute(gl, 1)); geo.setAttribute('aLit', new THREE.BufferAttribute(li, 1)); }
    if (uvs) geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    return geo;
  }
  function skinned(geo, mat, bones, inverses, name) {
    const m = new THREE.SkinnedMesh(geo, mat);
    m.name = name;
    m.bindMode = 'detached';
    m.bind(new THREE.Skeleton(bones, inverses), new THREE.Matrix4());
    m.frustumCulled = false; // (the whole crowd is in every launch frame)
    m.raycast = () => {};
    group.add(m);
    meshes.push(m);
    return m;
  }
  function clear() {
    for (const [o, mask] of off) o.layers.mask = mask;
    for (const m of meshes) { m.removeFromParent(); m.geometry.dispose(); m.skeleton?.dispose(); }
    off = []; meshes = []; watch = []; lit = []; faceSync = []; faceUv = null; sig = '';
  }
  const hide = (o) => { off.push([o, o.layers.mask]); o.layers.set(OFF); };
  /** people: [{ p (people.js person), outline: draw its ink outline }], lights: [root Object3D] */
  function build(people, lights) {
    clear();
    const bones = [], inv = [], body = [], ink = [];
    let src = null, inkSrc = null;
    for (const { p } of people) {
      const P = p.parts;
      if (!P?.mesh || !P.skeleton || !p.root.parent || !p.root.visible || !P.mesh.visible) continue;
      const boneOff = bones.length;
      bones.push(...P.skeleton.bones); inv.push(...P.skeleton.boneInverses);
      src = src || P.mesh.material;
      body.push({ geo: P.mesh.geometry, boneOff, bind: P.mesh.bindMatrix });
      hide(P.mesh);
      watch.push([P.mesh, p.root, true]);
      if (P.outline) {
        const on = shown(P.outline, p.root);
        watch.push([P.outline, p.root, on]);
        if (on) { ink.push({ geo: P.outline.geometry, boneOff, bind: P.mesh.bindMatrix }); inkSrc = inkSrc || P.outline; hide(P.outline); }
      }
      if (P.face) {
        const k = slotOf(P.face.material);
        const on = shown(P.face, p.root);
        watch.push([P.face, p.root, on]);
        if (k >= 0 && on) {
          bones.push(P.face); inv.push(I4);
          const part = { geo: P.face.geometry, rigid: bones.length - 1, uvSlot: k };
          body.push(part);
          faceSync.push({ part, uv: P.face.geometry.attributes.uv, ver: P.face.geometry.attributes.uv.version, k });
          hide(P.face);
        }
      }
    }
    // the lights: every plain vertex-coloured toon part (glowing or not) of each light; anything with a
    // texture (a written word) or see-through stays as it is
    glows.fill(0);
    for (const root of lights) {
      if (!root?.parent) continue;
      root.traverse((o) => {
        if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || o.userData.isOutline || !o.geometry?.attributes.position) return;
        const m = o.material;
        if (Array.isArray(m) || !m?.isMeshToonMaterial || !m.vertexColors || m.map || m.transparent) return;
        const on = shown(o, root);
        watch.push([o, root, on]);
        if (!on || lit.length >= MAXL - 1) return;
        const li = lit.length + 1;
        lit.push([li, m.userData.u || null]);
        bones.push(o); inv.push(I4);
        src = src || m;
        body.push({ geo: o.geometry, rigid: bones.length - 1, li });
        hide(o);
      });
    }
    if (!bones.length || !src) { clear(); return; }
    bodyMat = bodyMat || glowMat(src);
    const m0 = skinned(mergeParts(body, { uv: true }), bodyMat, bones, inv, 'd15-crowd');
    faceUv = m0.geometry.attributes.uv;
    if (ink.length && inkSrc) {
      const m = skinned(mergeParts(ink, { color: false }), inkSrc.material, bones, inv, 'd15-crowd-ink');
      m.onBeforeRender = inkSrc.onBeforeRender; // (the outline's screen-size uniform)
      m.userData.isOutline = true;
    }
    sync();
  }
  // per frame: the lights' glow (each light flickers on its own) and the faces' expressions
  function sync() {
    for (const [li, u] of lit) {
      glows[li] = u ? u.uGlow.value : 0;
      const c = u?.uTint?.value;
      if (c) { tints[li * 3] = c.r; tints[li * 3 + 1] = c.g; tints[li * 3 + 2] = c.b; }
    }
    if (faceUv) {
      let dirty = false;
      for (const f of faceSync) {
        if (f.uv.version === f.ver) continue;
        f.ver = f.uv.version; dirty = true;
        for (let i = 0; i < f.uv.count; i++) faceUv.setXY(f.part.vStart + i, mapU(f.k, f.uv.getX(i)), mapV(f.k, f.uv.getY(i)));
      }
      if (dirty) faceUv.needsUpdate = true;
    }
  }
  return {
    group,
    /** Rebuild when who stands there (or what is shown) changed; else just sync. key: the caller's member list. */
    update(people, lights, key) {
      let stale = key !== sig;
      if (!stale) for (const [o, top, was] of watch) if (!top.parent || shown(o, top) !== was) { stale = true; break; }
      if (stale) { build(people, lights); sig = key; } else sync();
    },
    clear,
    get calls() { return meshes.length; },
    dispose() { clear(); group.removeFromParent(); bodyMat?.dispose(); atlasTex?.dispose(); },
  };
}
