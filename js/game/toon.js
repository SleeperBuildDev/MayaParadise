// Shared cartoon look for every module: palette, cel-shaded materials, outlines,
// lights, blob shadows and canvas text. Use these helpers instead of creating
// materials directly, so the whole game reads as one art style.
import * as THREE from './three.js';
import { mergeVertices } from './three.js';

// Brand palette (sRGB hex). Cream + antique gold + maroon, from Maya's site and stickers.
export const PALETTE = {
  cream: '#EDE6D3',
  paper: '#F6F0E2',
  parchment: '#E2D5B8',
  gold: '#C9A24A',
  goldDeep: '#A47A2C',
  bronze: '#8C6A28',
  maroon: '#6E1F2A',
  maroonDeep: '#4A141C',
  ink: '#2A2118',
  outline: '#3B2A1A',
  white: '#FFFDF8',
  cloud: '#FFF8EE',
  skyTop: '#BFD9EC',
  skyHorizon: '#FCE6C4',
  shadow: '#5A4320',
  wood: '#B58A5A',
  woodDark: '#7A5434',
  leaf: '#6F9E5B',
  leafDark: '#4F7F43',
  rose: '#E8A0A8',
  lily: '#FBF7EE',
  // Maya
  skin: '#F3CBAA',
  blush: '#F2A08F',
  hair: '#1F1B1B',
  hairShine: '#4A3426',
  glasses: '#9A6440',
  blouse: '#25211F',
  blazer: '#D9C3A0',
  trousers: '#E8DCC6',
  shoes: '#B98A64',
  // Template boxes (her product box art)
  boxBlue: '#2F5DB3',
  boxRed: '#C8323C',
  boxBlack: '#1E1E22',
  telegram: '#2AABEE',
  viber: '#7360F2',
  messenger: '#0A7CFF',
  tiktok: '#111111',
};

const color = (c) => (c instanceof THREE.Color ? c : new THREE.Color(c));

// ---------- cel shading ----------
let gradient = null;
/** The shared 3-step toon ramp (non-color data, keep default color space). */
export function gradientMap() {
  if (gradient) return gradient;
  const steps = new Uint8Array([105, 185, 255]);
  gradient = new THREE.DataTexture(steps, 3, 1, THREE.RedFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

const toonCache = new Map();
/**
 * Cached MeshToonMaterial. opts: { vertexColors, side, transparent, opacity,
 * emissive, emissiveIntensity, map } — materials with a map are not cached.
 */
export function toon(c = PALETTE.cream, opts = {}) {
  const key = opts.map ? null : `${c}|${JSON.stringify(opts)}`;
  if (key && toonCache.has(key)) return toonCache.get(key);
  const m = new THREE.MeshToonMaterial({
    color: color(c),
    gradientMap: gradientMap(),
    vertexColors: !!opts.vertexColors,
    side: opts.side ?? THREE.FrontSide,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
    map: opts.map ?? null,
  });
  if (opts.emissive) {
    m.emissive = color(opts.emissive);
    m.emissiveIntensity = opts.emissiveIntensity ?? 1;
  }
  if (key) toonCache.set(key, m);
  return m;
}

const basicCache = new Map();
/** Cached unlit material (glows, signs, sky bits). Not tone mapped so brand colours stay exact. */
export function basic(c = PALETTE.white, opts = {}) {
  const key = opts.map ? null : `${c}|${JSON.stringify(opts)}`;
  if (key && basicCache.has(key)) return basicCache.get(key);
  const m = new THREE.MeshBasicMaterial({
    color: color(c),
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true,
    blending: opts.blending ?? THREE.NormalBlending,
    map: opts.map ?? null,
    alphaTest: opts.alphaTest ?? 0,
    toneMapped: false,
    fog: opts.fog ?? true,
  });
  if (key) basicCache.set(key, m);
  return m;
}

// ---------- outlines (inverted hull, constant width in screen pixels) ----------
const outlineResolution = { value: new THREE.Vector2(1024, 1024) };
/** Call on resize with the drawing-buffer size in pixels (width * pixelRatio). */
export function setOutlineResolution(width, height) {
  outlineResolution.value.set(width, height);
}

const outlineMats = new Map();
/** Shared outline material: back faces pushed out along the normal by `px` screen pixels. */
export function outlineMaterial(px = 1.6, c = PALETTE.outline) {
  const key = `${px}|${c}`;
  if (outlineMats.has(key)) return outlineMats.get(key);
  const m = new THREE.MeshBasicMaterial({ color: color(c), side: THREE.BackSide, toneMapped: false });
  const uPx = { value: px };
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uOutlinePx = uPx;
    shader.uniforms.uResolution = outlineResolution;
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'uniform float uOutlinePx;\nuniform vec2 uResolution;\nvoid main() {')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        {
          vec3 vN = normalize( normalMatrix * normal );
          vec2 dir = ( projectionMatrix * vec4( vN, 0.0 ) ).xy;
          float len = length( dir );
          if ( len > 1e-5 ) gl_Position.xy += ( dir / len ) * uOutlinePx * gl_Position.w * 2.0 / uResolution;
        }`,
      );
  };
  m.customProgramCacheKey = () => 'toon-outline';
  outlineMats.set(key, m);
  return m;
}

const outlineGeoCache = new WeakMap();
/** Position-only clone with merged vertices and smooth normals, so hard corners don't crack. */
export function outlineGeometry(geometry) {
  if (outlineGeoCache.has(geometry)) return outlineGeoCache.get(geometry);
  const g = geometry.clone();
  for (const name of Object.keys(g.attributes)) if (name !== 'position') g.deleteAttribute(name);
  g.clearGroups();
  const merged = mergeVertices(g, 1e-4);
  merged.computeVertexNormals();
  outlineGeoCache.set(geometry, merged);
  return merged;
}

/**
 * Adds a dark outline to a Mesh or InstancedMesh (as a child for Mesh, sibling for InstancedMesh).
 * opts: { px = 1.6, color = PALETTE.outline }. Returns the outline object.
 */
export function addOutline(mesh, opts = {}) {
  const mat = outlineMaterial(opts.px ?? 1.6, opts.color ?? PALETTE.outline);
  let o;
  if (mesh.isInstancedMesh) {
    o = new THREE.InstancedMesh(outlineGeometry(mesh.geometry), mat, mesh.count);
    o.instanceMatrix = mesh.instanceMatrix;
    o.position.copy(mesh.position);
    o.quaternion.copy(mesh.quaternion);
    o.scale.copy(mesh.scale);
    mesh.parent?.add(o);
  } else {
    o = new THREE.Mesh(outlineGeometry(mesh.geometry), mat);
    mesh.add(o);
  }
  o.userData.isOutline = true;
  o.raycast = () => {};
  o.frustumCulled = mesh.frustumCulled;
  return o;
}

// ---------- lights ----------
/**
 * Standard golden-hour lighting used by the world and every interior.
 * Returns { hemi, sun } so scenes can tint them slightly.
 */
// Calibrated so a fully lit top face shows roughly its true albedo:
// (sunIntensity + hemiIntensity) / PI ≈ 1.07 under three.js physically based lights.
export function addStandardLights(scene, { sun = '#FFF0DA', sky = '#FFF7EA', ground = '#CDBF9F', sunIntensity = 1.9, hemiIntensity = 1.45 } = {}) {
  const hemi = new THREE.HemisphereLight(color(sky), color(ground), hemiIntensity);
  const sunLight = new THREE.DirectionalLight(color(sun), sunIntensity);
  // Overhead-left sun: block tops brightest, fronts (+Z, facing camera) mid, right sides darkest.
  sunLight.position.set(-4, 10, 3);
  scene.add(hemi, sunLight, sunLight.target);
  return { hemi, sun: sunLight };
}

// ---------- blob shadows ----------
let blobTex = null;
function blobTexture() {
  if (blobTex) return blobTex;
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)');
  grd.addColorStop(0.55, 'rgba(0,0,0,0.25)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  blobTex = new THREE.CanvasTexture(cv);
  return blobTex;
}
let blobMat = null;
/** Soft round contact shadow lying flat on the ground (y = 0.01). */
export function blobShadow(radiusX = 0.6, radiusZ = radiusX, opacity = 0.55) {
  if (!blobMat) {
    blobMat = new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, toneMapped: false, color: color(PALETTE.shadow) });
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), blobMat);
  m.rotation.x = -Math.PI / 2;
  m.scale.set(radiusX * 2, radiusZ * 2, 1);
  m.position.y = 0.01;
  m.renderOrder = -1;
  m.userData.opacity = opacity;
  m.raycast = () => {};
  return m;
}

// ---------- canvas text (Burmese-safe: the browser shapes the script) ----------
export const FONT_MY = '"Noto Sans Myanmar", "Myanmar Text", "Padauk", sans-serif';
export const FONT_SERIF = '"Cormorant Garamond", Georgia, serif';
export const FONT_SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Resolves once the web fonts used on canvases are ready (call before drawing text). */
export function fontsReady() {
  if (!document.fonts) return Promise.resolve();
  return Promise.all([
    document.fonts.load(`700 32px "Noto Sans Myanmar"`, 'မာရာ'),
    document.fonts.load(`400 32px "Noto Sans Myanmar"`, 'မာရာ'),
    document.fonts.load(`600 32px "Cormorant Garamond"`, 'Maya'),
  ]).catch(() => {});
}

/**
 * Draws a sign onto a canvas and returns a CanvasTexture.
 * lines: [{ text, size = 48, weight = 700, font = FONT_MY, color }]
 * opts: { width = 512, height = 256, bg = PALETTE.cream, border = PALETTE.goldDeep, radius = 28, color = PALETTE.ink }
 * Burmese needs line-height >= 1.6 so stacked vowel marks are not clipped.
 */
export function signTexture(lines, opts = {}) {
  const { width = 512, height = 256, bg = PALETTE.cream, border = PALETTE.goldDeep, radius = 28, color: ink = PALETTE.ink, borderWidth = 10 } = opts;
  const cv = document.createElement('canvas');
  cv.width = width;
  cv.height = height;
  const g = cv.getContext('2d');
  if (bg) {
    g.fillStyle = bg;
    roundRect(g, borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth, radius);
    g.fill();
  }
  if (border) {
    g.strokeStyle = border;
    g.lineWidth = borderWidth;
    roundRect(g, borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth, radius);
    g.stroke();
  }
  const total = lines.reduce((h, l) => h + (l.size ?? 48) * 1.7, 0);
  let y = (height - total) / 2;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const l of lines) {
    const size = l.size ?? 48;
    g.font = `${l.weight ?? 700} ${size}px ${l.font ?? FONT_MY}`;
    g.fillStyle = l.color ?? ink;
    y += (size * 1.7) / 2;
    g.fillText(l.text, width / 2, y, width - 40);
    y += (size * 1.7) / 2;
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** A flat plane showing a canvas texture (for signs, posters, screens). Unlit, faces +Z. */
export function signMesh(texture, width, height) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, height), basic(PALETTE.white, { map: texture, transparent: true, alphaTest: 0.02 }));
  return m;
}

// ---------- small geometry helpers ----------
/** Rounded box via a slightly bevelled extrusion; cheap and reads well with toon shading. */
export function roundedBox(w, h, d, r = 0.06, segments = 2) {
  const shape = new THREE.Shape();
  const x = -w / 2 + r;
  const y = -h / 2 + r;
  const iw = w - 2 * r;
  const ih = h - 2 * r;
  shape.moveTo(x, y - r + r);
  shape.absarc(x, y, r, Math.PI, 1.5 * Math.PI, false);
  shape.absarc(x + iw, y, r, 1.5 * Math.PI, 2 * Math.PI, false);
  shape.absarc(x + iw, y + ih, r, 0, 0.5 * Math.PI, false);
  shape.absarc(x, y + ih, r, 0.5 * Math.PI, Math.PI, false);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.98, bevelSegments: segments, curveSegments: 4 });
  geo.translate(0, 0, -(d - 2 * r) / 2);
  geo.computeVertexNormals();
  return geo;
}

/** Convenience: toon mesh + optional outline. opts: { outline: true|px, castBlob } */
export function toonMesh(geometry, c, opts = {}) {
  const mesh = new THREE.Mesh(geometry, toon(c, opts.material ?? {}));
  if (opts.outline) addOutline(mesh, { px: typeof opts.outline === 'number' ? opts.outline : 1.6 });
  return mesh;
}
